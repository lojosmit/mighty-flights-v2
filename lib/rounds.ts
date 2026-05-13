"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/index";
import {
  rounds, fixtures, leagueNights,
  type Round, type Fixture, type OverrideLog, type FixtureResult,
} from "./db/schema";
import { allocateFixtures, swapPlayers, type AllocationResult } from "./fixture-utils";
import { nextRound, type RoundState } from "./rotation-engine";
import { getPlayers } from "./players";
import { getMultiplier } from "./handicap";
import { applyFixtureStats } from "./stats";

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

  await applyFixtureStats(current.teamA.playerIds, current.teamB.playerIds, result);

  revalidatePath(`/league-night/${leagueNightId}`);
}

export async function generateNextRound(
  leagueNightId: string
): Promise<RoundWithFixtures> {
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

export async function endLeagueNight(leagueNightId: string): Promise<void> {
  await db
    .update(leagueNights)
    .set({ status: "completed" })
    .where(eq(leagueNights.id, leagueNightId));
  revalidatePath(`/league-night/${leagueNightId}`);
}

export async function applyOverride(
  roundId: string,
  leagueNightId: string,
  playerA: string,
  playerB: string
): Promise<void> {
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
