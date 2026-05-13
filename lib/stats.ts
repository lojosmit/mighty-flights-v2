// Server-side stats writer — called from recordResult, not a public server action.

import { eq, sql } from "drizzle-orm";
import { db } from "./db/index";
import { players, pairStats, matchupHistory } from "./db/schema";
import {
  computePlayerDeltas,
  normalizeMatchup,
  canonicalWinner,
} from "./stats-utils";
import type { FixtureResult } from "./db/schema";

export async function applyFixtureStats(
  teamAIds: string[],
  teamBIds: string[],
  result: FixtureResult
): Promise<void> {
  if (result === "in_progress") return;

  const deltas = computePlayerDeltas(teamAIds, teamBIds, result);

  // ── 1. Player stats ───────────────────────────────────────────────────────

  for (const d of deltas) {
    await db
      .update(players)
      .set({
        wins:     sql`${players.wins}     + ${d.wins}`,
        losses:   sql`${players.losses}   + ${d.losses}`,
        doves:    sql`${players.doves}    + ${d.doves}`,
        doveWins: sql`${players.doveWins} + ${d.doveWins}`,
        forfeits: sql`${players.forfeits} + ${d.forfeits}`,
      })
      .where(eq(players.id, d.playerId));
  }

  // ── 2. Pair stats (2v2 only — both teams are pairs) ──────────────────────

  if (teamAIds.length === 2) {
    const aWon = result === "teamA_win" || result === "special_win_A";
    const bWon = result === "teamB_win" || result === "special_win_B";
    await upsertPairStat(teamAIds, aWon);
    await upsertPairStat(teamBIds, bWon);
  }

  // ── 3. Matchup history ────────────────────────────────────────────────────

  const norm = normalizeMatchup(teamAIds, teamBIds);
  const winner = canonicalWinner(teamAIds, teamBIds, result, norm) ?? "X";

  await db
    .insert(matchupHistory)
    .values({
      matchupKey: norm.key,
      teamAPlayerIds: norm.teamA,
      teamBPlayerIds: norm.teamB,
      gamesPlayed: 1,
      winnerHistory: [winner],
    })
    .onConflictDoUpdate({
      target: matchupHistory.matchupKey,
      set: {
        gamesPlayed:   sql`${matchupHistory.gamesPlayed} + 1`,
        winnerHistory: sql`${matchupHistory.winnerHistory} || ${JSON.stringify([winner])}::jsonb`,
      },
    });
}

async function upsertPairStat(ids: string[], won: boolean) {
  const [a, b] = [...ids].sort();
  const winDelta = won ? 1 : 0;
  await db
    .insert(pairStats)
    .values({ playerIdA: a, playerIdB: b, gamesPlayed: 1, wins: winDelta })
    .onConflictDoUpdate({
      target: [pairStats.playerIdA, pairStats.playerIdB],
      set: {
        gamesPlayed: sql`${pairStats.gamesPlayed} + 1`,
        wins:        sql`${pairStats.wins} + ${winDelta}`,
      },
    });
}
