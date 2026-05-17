"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/index";
import {
  rounds, fixtures, leagueNights, players,
  type Round, type Fixture, type OverrideLog, type FixtureResult,
} from "./db/schema";
import { allocateFixtures, swapPlayers, type AllocationResult } from "./fixture-utils";
import { nextRound, type RoundState } from "./rotation-engine";
import { getPlayers } from "./players";
import { getMultiplier } from "./handicap";
import { applyFixtureStats } from "./stats";
import { auth } from "@/auth";

const GAME_ROLES = new Set(["super_admin", "club_manager", "host"]);

async function requireGameRole(leagueNightId?: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  if (GAME_ROLES.has(session.user.role)) return;
  // Temporary host: player assigned as host for this specific night
  if (leagueNightId && session.user.role === "player") {
    const [night] = await db
      .select({ hostUserId: leagueNights.hostUserId })
      .from(leagueNights)
      .where(eq(leagueNights.id, leagueNightId));
    if (night?.hostUserId === session.user.id) return;
  }
  throw new Error("Forbidden");
}

export type RoundWithFixtures = Round & { fixtures: Fixture[] };

// ── reads ─────────────────────────────────────────────────────────────────────

export async function getRoundWithFixtures(
  roundId: string
): Promise<RoundWithFixtures | null> {
  const [round] = await db.select().from(rounds).where(eq(rounds.id, roundId));
  if (!round) return null;
  const fx = await db.select().from(fixtures).where(eq(fixtures.roundId, roundId));
  return { ...round, fixtures: fx };
}

export async function getLatestRoundNumber(leagueNightId: string): Promise<number | null> {
  const [row] = await db
    .select({ roundNumber: rounds.roundNumber })
    .from(rounds)
    .where(eq(rounds.leagueNightId, leagueNightId))
    .orderBy(desc(rounds.roundNumber))
    .limit(1);
  return row?.roundNumber ?? null;
}

export async function getLatestRound(
  leagueNightId: string
): Promise<RoundWithFixtures | null> {
  const nightRounds = await db
    .select()
    .from(rounds)
    .where(eq(rounds.leagueNightId, leagueNightId))
    .orderBy(rounds.roundNumber);

  if (nightRounds.length === 0) return null;
  const latest = nightRounds[nightRounds.length - 1];
  return getRoundWithFixtures(latest.id);
}

export async function getRoundsForNight(
  leagueNightId: string
): Promise<RoundWithFixtures[]> {
  const nightRounds = await db
    .select()
    .from(rounds)
    .where(eq(rounds.leagueNightId, leagueNightId))
    .orderBy(rounds.roundNumber);

  const result: RoundWithFixtures[] = [];
  for (const r of nightRounds) {
    const fx = await db.select().from(fixtures).where(eq(fixtures.roundId, r.id));
    result.push({ ...r, fixtures: fx });
  }
  return result;
}

// ── shared ────────────────────────────────────────────────────────────────────

async function buildFixtureValues(
  roundId: string,
  allocation: { boards: AllocationResult["boards"] },
  playerRankMap: Map<string, number>
) {
  const values = [];
  for (const board of allocation.boards) {
    const handicapA = await getMultiplier(
      Math.min(...board.teamA.playerIds.map((id) => playerRankMap.get(id) ?? 1))
    );
    const handicapB = await getMultiplier(
      Math.min(...board.teamB.playerIds.map((id) => playerRankMap.get(id) ?? 1))
    );
    values.push({
      roundId,
      boardLabel: board.boardLabel,
      type: board.type,
      teamA: { playerIds: board.teamA.playerIds, score: 0, handicapApplied: handicapA },
      teamB: { playerIds: board.teamB.playerIds, score: 0, handicapApplied: handicapB },
      result: "in_progress" as const,
    });
  }
  return values;
}

// ── mutations ─────────────────────────────────────────────────────────────────

export async function createRound1(
  leagueNightId: string
): Promise<RoundWithFixtures> {
  await requireGameRole(leagueNightId);
  const [night] = await db
    .select()
    .from(leagueNights)
    .where(eq(leagueNights.id, leagueNightId));

  const allPlayers = await getPlayers();
  const attending = allPlayers.filter((p) =>
    night.attendingPlayerIds.includes(p.id)
  );
  const playerRankMap = new Map(attending.map((p) => [p.id, p.seasonRank]));

  const allocation = allocateFixtures(
    attending.map((p) => p.id),
    night.boardCount
  );

  const [round] = await db
    .insert(rounds)
    .values({ leagueNightId, roundNumber: 1, bench: allocation.bench })
    .returning();

  const fixtureValues = await buildFixtureValues(round.id, allocation, playerRankMap);
  const fx = await db.insert(fixtures).values(fixtureValues).returning();

  await db
    .update(leagueNights)
    .set({ status: "in_progress" })
    .where(eq(leagueNights.id, leagueNightId));

  revalidatePath(`/league-night/${leagueNightId}`);
  return { ...round, fixtures: fx };
}

export async function recordResult(
  fixtureId: string,
  result: FixtureResult,
  leagueNightId: string,
  forfeitReason?: string
): Promise<void> {
  await requireGameRole(leagueNightId);
  // Fetch first so we can (a) guard against double-recording and (b) get team data.
  const [current] = await db
    .select()
    .from(fixtures)
    .where(eq(fixtures.id, fixtureId));
  if (!current || current.result !== "in_progress") return;

  await db
    .update(fixtures)
    .set({ result, ...(forfeitReason ? { forfeitReason } : {}) })
    .where(eq(fixtures.id, fixtureId));

  revalidatePath(`/league-night/${leagueNightId}`);

  try {
    await applyFixtureStats(current.teamA.playerIds, current.teamB.playerIds, result);
  } catch (err) {
    console.error("[recordResult] stats update failed — result saved, stats skipped:", err);
  }
}

export async function generateNextRound(
  leagueNightId: string
): Promise<RoundWithFixtures> {
  await requireGameRole(leagueNightId);
  const [night, allRoundsRaw, allPlayers] = await Promise.all([
    db.select().from(leagueNights).where(eq(leagueNights.id, leagueNightId)).then((r) => r[0]),
    db.select().from(rounds).where(eq(rounds.leagueNightId, leagueNightId)).orderBy(rounds.roundNumber),
    getPlayers(),
  ]);

  const attending = allPlayers.filter((p) =>
    night.attendingPlayerIds.includes(p.id)
  );
  const playerRankMap = new Map(attending.map((p) => [p.id, p.seasonRank]));

  const prevRecord = allRoundsRaw[allRoundsRaw.length - 1];
  const prevFixtures = await db
    .select()
    .from(fixtures)
    .where(eq(fixtures.roundId, prevRecord.id));

  const prevState: RoundState = {
    boards: prevFixtures.map((f) => ({
      boardLabel: f.boardLabel,
      type: f.type,
      teamA: { playerIds: f.teamA.playerIds },
      teamB: { playerIds: f.teamB.playerIds },
      result: f.result,
    })),
    bench: prevRecord.bench,
    streaks: prevRecord.streaks,
  };

  const benchCounts: Record<string, number> = {};
  for (const r of allRoundsRaw) {
    for (const id of r.bench) {
      benchCounts[id] = (benchCounts[id] ?? 0) + 1;
    }
  }

  const allocation = nextRound(
    prevState,
    attending.map((p) => p.id),
    night.boardCount,
    Math.random,
    benchCounts,
    allRoundsRaw.length
  );

  const [newRound] = await db
    .insert(rounds)
    .values({
      leagueNightId,
      roundNumber: prevRecord.roundNumber + 1,
      bench: allocation.bench,
      streaks: allocation.streaks,
    })
    .returning();

  const fixtureValues = await buildFixtureValues(newRound.id, allocation, playerRankMap);
  const fx = await db.insert(fixtures).values(fixtureValues).returning();

  revalidatePath(`/league-night/${leagueNightId}`);
  return { ...newRound, fixtures: fx };
}

async function recomputeSeasonRanks(clubId: string): Promise<void> {
  const clubPlayers = await db
    .select()
    .from(players)
    .where(eq(players.clubId, clubId));

  if (clubPlayers.length === 0) return;

  const sorted = [...clubPlayers].sort((a, b) => {
    const aGP = a.wins + a.losses;
    const bGP = b.wins + b.losses;
    if (b.wins !== a.wins) return b.wins - a.wins;
    const aTP = parseFloat(a.totalPoints);
    const bTP = parseFloat(b.totalPoints);
    if (bTP !== aTP) return bTP - aTP;
    const aWR = aGP > 0 ? a.wins / aGP : 0;
    const bWR = bGP > 0 ? b.wins / bGP : 0;
    if (bWR !== aWR) return bWR - aWR;
    if (b.doveWins !== a.doveWins) return b.doveWins - a.doveWins;
    return bGP - aGP;
  });

  await Promise.all(
    sorted.map((p, i) =>
      db.update(players).set({ seasonRank: i + 1 }).where(eq(players.id, p.id))
    )
  );
}

export async function endLeagueNight(leagueNightId: string): Promise<void> {
  await requireGameRole(leagueNightId);

  const [night] = await db
    .select({ clubId: leagueNights.clubId })
    .from(leagueNights)
    .where(eq(leagueNights.id, leagueNightId));

  await db
    .update(leagueNights)
    .set({ status: "completed" })
    .where(eq(leagueNights.id, leagueNightId));

  if (night?.clubId) await recomputeSeasonRanks(night.clubId);

  revalidatePath(`/league-night/${leagueNightId}`);
}

export async function applyOverride(
  roundId: string,
  leagueNightId: string,
  playerA: string,
  playerB: string
): Promise<void> {
  await requireGameRole(leagueNightId);
  const round = await getRoundWithFixtures(roundId);
  if (!round) return;

  const current: AllocationResult = {
    bench: round.bench,
    boards: round.fixtures.map((f) => ({
      boardLabel: f.boardLabel,
      type: f.type,
      teamA: { playerIds: f.teamA.playerIds },
      teamB: { playerIds: f.teamB.playerIds },
    })),
  };

  const updated = swapPlayers(current, playerA, playerB);

  const log: OverrideLog = {
    swappedA: playerA,
    swappedB: playerB,
    timestamp: new Date().toISOString(),
  };

  await db
    .update(rounds)
    .set({
      bench: updated.bench,
      overrides: [...round.overrides, log],
    })
    .where(eq(rounds.id, roundId));

  for (const updatedBoard of updated.boards) {
    const dbFixture = round.fixtures.find(
      (f) => f.boardLabel === updatedBoard.boardLabel
    );
    if (!dbFixture) continue;
    await db
      .update(fixtures)
      .set({
        teamA: { ...dbFixture.teamA, playerIds: updatedBoard.teamA.playerIds },
        teamB: { ...dbFixture.teamB, playerIds: updatedBoard.teamB.playerIds },
      })
      .where(eq(fixtures.id, dbFixture.id));
  }

  revalidatePath(`/league-night/${leagueNightId}`);
}
