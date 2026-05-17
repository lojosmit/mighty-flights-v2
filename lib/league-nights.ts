"use server";

import { and, desc, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/index";
import {
  clubs, fixtures, leagueNights, matchupHistory, pairStats, players,
  registrationRequests, rounds, rsvps, type LeagueNight,
} from "./db/schema";
import { auth } from "@/auth";
import { computePlayerDeltas, normalizeMatchup, canonicalWinner } from "./stats-utils";
import { computeMultiplier } from "./handicap-utils";

async function requireManager() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { role } = session.user;
  if (role !== "super_admin" && role !== "club_manager") throw new Error("Forbidden");
}

async function requireGameRole() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { role } = session.user;
  if (!["super_admin", "club_manager", "host"].includes(role)) throw new Error("Forbidden");
}

export type LeagueNightWithClub = LeagueNight & { clubName: string | null };

export async function createLeagueNight({
  attendingPlayerIds,
  boardCount,
  clubId,
  date,
  enableRsvp,
  rsvpDeadline,
  hostUserId,
}: {
  attendingPlayerIds: string[];
  boardCount: number;
  clubId?: string | null;
  date?: Date;
  enableRsvp?: boolean;
  rsvpDeadline?: Date;
  hostUserId?: string | null;
}): Promise<LeagueNight> {
  await requireGameRole();
  const rsvpToken = (enableRsvp || rsvpDeadline) ? crypto.randomUUID() : undefined;

  const [night] = await db
    .insert(leagueNights)
    .values({
      attendingPlayerIds,
      boardCount,
      status: "setup",
      clubId: clubId ?? undefined,
      date: date ?? new Date(),
      rsvpDeadline: rsvpDeadline ?? undefined,
      rsvpToken: rsvpToken ?? undefined,
      hostUserId: hostUserId ?? undefined,
    })
    .returning();
  revalidatePath("/league-night");
  return night;
}

export async function updateLeagueNight(
  id: string,
  data: {
    date?: Date;
    boardCount?: number;
    hostUserId?: string | null;
  }
): Promise<void> {
  await requireManager();
  await db
    .update(leagueNights)
    .set({
      ...(data.date !== undefined ? { date: data.date } : {}),
      ...(data.boardCount !== undefined ? { boardCount: data.boardCount } : {}),
      ...(data.hostUserId !== undefined ? { hostUserId: data.hostUserId } : {}),
    })
    .where(eq(leagueNights.id, id));
  revalidatePath(`/league-night/${id}`);
}

export async function getLeagueNight(id: string): Promise<LeagueNight | null> {
  const [night] = await db
    .select()
    .from(leagueNights)
    .where(eq(leagueNights.id, id));
  return night ?? null;
}

export async function getActiveLeagueNight(): Promise<LeagueNight | null> {
  const [night] = await db
    .select()
    .from(leagueNights)
    .where(eq(leagueNights.status, "in_progress"));
  return night ?? null;
}

export async function getAllLeagueNights(clubId?: string | null): Promise<LeagueNightWithClub[]> {
  const cols = getTableColumns(leagueNights);
  const q = db
    .select({ ...cols, clubName: clubs.name })
    .from(leagueNights)
    .leftJoin(clubs, eq(leagueNights.clubId, clubs.id))
    .orderBy(desc(leagueNights.createdAt));

  if (clubId) {
    return q.where(eq(leagueNights.clubId, clubId));
  }
  return q;
}

export async function deleteLeagueNight(nightId: string): Promise<void> {
  const session = await auth();
  if (session?.user.role !== "super_admin") throw new Error("Forbidden");

  const nightRounds = await db
    .select()
    .from(rounds)
    .where(eq(rounds.leagueNightId, nightId));

  for (const round of nightRounds) {
    const roundFixtures = await db
      .select()
      .from(fixtures)
      .where(eq(fixtures.roundId, round.id));

    for (const fixture of roundFixtures) {
      if (fixture.result === "in_progress") continue;

      const teamAIds = fixture.teamA.playerIds;
      const teamBIds = fixture.teamB.playerIds;
      const deltas = computePlayerDeltas(teamAIds, teamBIds, fixture.result);
      const allIds = [...teamAIds, ...teamBIds];

      const playerRows = await db
        .select({ id: players.id, seasonRank: players.seasonRank })
        .from(players)
        .where(inArray(players.id, allIds));
      const rankMap = Object.fromEntries(playerRows.map((p) => [p.id, p.seasonRank]));

      for (const d of deltas) {
        const rank = rankMap[d.playerId] ?? 1;
        const multiplier = computeMultiplier(rank);
        const pointsDelta = d.wins > 0 ? multiplier + d.doveWins : 0;
        await db
          .update(players)
          .set({
            wins:        sql`${players.wins}        - ${d.wins}`,
            losses:      sql`${players.losses}      - ${d.losses}`,
            doves:       sql`${players.doves}       - ${d.doves}`,
            doveWins:    sql`${players.doveWins}    - ${d.doveWins}`,
            forfeits:    sql`${players.forfeits}    - ${d.forfeits}`,
            totalPoints: sql`${players.totalPoints} - ${pointsDelta}`,
          })
          .where(eq(players.id, d.playerId));
      }

      // Pair stats (2v2 only)
      if (teamAIds.length === 2) {
        const aWon = fixture.result === "teamA_win" || fixture.result === "special_win_A";
        const bWon = fixture.result === "teamB_win" || fixture.result === "special_win_B";
        await reversePairStat(teamAIds, aWon);
        await reversePairStat(teamBIds, bWon);
      }

      // Matchup history
      const norm = normalizeMatchup(teamAIds, teamBIds);
      const winner = canonicalWinner(teamAIds, teamBIds, fixture.result, norm) ?? "X";
      await reverseMatchupHistory(norm.key, winner);
    }

    await db.delete(fixtures).where(eq(fixtures.roundId, round.id));
  }

  if (nightRounds.length > 0) {
    await db.delete(rounds).where(eq(rounds.leagueNightId, nightId));
  }
  await db.delete(rsvps).where(eq(rsvps.leagueNightId, nightId));
  // Unlink registration requests rather than deleting them
  await db
    .update(registrationRequests)
    .set({ leagueNightId: null })
    .where(eq(registrationRequests.leagueNightId, nightId));
  await db.delete(leagueNights).where(eq(leagueNights.id, nightId));

  revalidatePath("/league-night");
  revalidatePath("/admin");
}

async function reversePairStat(ids: string[], won: boolean): Promise<void> {
  const [a, b] = [...ids].sort();
  const [current] = await db
    .select({ gamesPlayed: pairStats.gamesPlayed })
    .from(pairStats)
    .where(and(eq(pairStats.playerIdA, a), eq(pairStats.playerIdB, b)));
  if (!current) return;

  if (current.gamesPlayed <= 1) {
    await db
      .delete(pairStats)
      .where(and(eq(pairStats.playerIdA, a), eq(pairStats.playerIdB, b)));
  } else {
    const winDelta = won ? 1 : 0;
    await db
      .update(pairStats)
      .set({
        gamesPlayed: sql`${pairStats.gamesPlayed} - 1`,
        wins:        sql`${pairStats.wins}        - ${winDelta}`,
      })
      .where(and(eq(pairStats.playerIdA, a), eq(pairStats.playerIdB, b)));
  }
}

async function reverseMatchupHistory(key: string, winner: string): Promise<void> {
  const [current] = await db
    .select({ gamesPlayed: matchupHistory.gamesPlayed })
    .from(matchupHistory)
    .where(eq(matchupHistory.matchupKey, key));
  if (!current) return;

  if (current.gamesPlayed <= 1) {
    await db.delete(matchupHistory).where(eq(matchupHistory.matchupKey, key));
  } else {
    await db.execute(sql`
      UPDATE matchup_history
      SET
        games_played = games_played - 1,
        winner_history = (
          SELECT COALESCE(jsonb_agg(v ORDER BY ord), '[]'::jsonb)
          FROM (
            SELECT value AS v, ordinality AS ord
            FROM jsonb_array_elements_text(winner_history) WITH ORDINALITY
            WHERE ordinality != (
              SELECT MAX(ordinality)
              FROM jsonb_array_elements_text(winner_history) WITH ORDINALITY
              WHERE value = ${winner}
            )
          ) sub
        )
      WHERE matchup_key = ${key}
    `);
  }
}
