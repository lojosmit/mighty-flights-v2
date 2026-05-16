// Leaderboard and player profile data — read-only, per DESIGN.md §10.

import { eq, or, sql } from "drizzle-orm";
// eq is used for both club_id and player id filtering
import { db } from "./db/index";
import { players, pairStats, matchupHistory, type Player } from "./db/schema";
import type { LeaderboardEntry } from "./leaderboard-utils";

export type { LeaderboardEntry, SortKey } from "./leaderboard-utils";
export { sortLeaderboard } from "./leaderboard-utils";

function toEntry(p: Player): LeaderboardEntry {
  const gamesPlayed = p.wins + p.losses;
  return {
    id: p.id,
    name: p.name,
    seasonRank: p.seasonRank,
    wins: p.wins,
    losses: p.losses,
    doves: p.doves,
    doveWins: p.doveWins,
    forfeits: p.forfeits,
    gamesPlayed,
    winRatio: gamesPlayed > 0 ? p.wins / gamesPlayed : 0,
    totalPoints: parseFloat(p.totalPoints ?? "0"),
  };
}

export async function getLeaderboard(clubId?: string | null): Promise<LeaderboardEntry[]> {
  const all = clubId
    ? await db.select().from(players).where(eq(players.clubId, clubId))
    : await db.select().from(players);
  return all.map(toEntry);
}

// ── Player profile ────────────────────────────────────────────────────────────

export type PartnerRow = {
  partnerId: string;
  partnerName: string;
  gamesPlayed: number;
  wins: number;
  winRatio: number;
};

export type HeadToHeadRow = {
  matchupKey: string;
  opponentIds: string[];
  opponentNames: string[];
  gamesPlayed: number;
  playerWins: number;
  winRatio: number;
};

export type PlayerProfile = {
  player: LeaderboardEntry & { clubId: string | null };
  partners: PartnerRow[];
  headToHeads: HeadToHeadRow[];
};

export async function getPlayerProfile(playerId: string): Promise<PlayerProfile | null> {
  const [[playerRow], allPlayerNames] = await Promise.all([
    db.select().from(players).where(eq(players.id, playerId)),
    db.select({ id: players.id, name: players.name }).from(players),
  ]);
  if (!playerRow) return null;

  const nameMap: Record<string, string> = Object.fromEntries(
    allPlayerNames.map((p) => [p.id, p.name])
  );

  const [pairRows, matchupRows] = await Promise.all([
    db
      .select()
      .from(pairStats)
      .where(or(eq(pairStats.playerIdA, playerId), eq(pairStats.playerIdB, playerId))),
    db
      .select()
      .from(matchupHistory)
      .where(
        or(
          sql`${matchupHistory.teamAPlayerIds} @> ${JSON.stringify([playerId])}::jsonb`,
          sql`${matchupHistory.teamBPlayerIds} @> ${JSON.stringify([playerId])}::jsonb`
        )
      ),
  ]);

  const partners: PartnerRow[] = pairRows
    .map((row) => {
      const partnerId = row.playerIdA === playerId ? row.playerIdB : row.playerIdA;
      return {
        partnerId,
        partnerName: nameMap[partnerId] ?? "Unknown",
        gamesPlayed: row.gamesPlayed,
        wins: row.wins,
        winRatio: row.gamesPlayed > 0 ? row.wins / row.gamesPlayed : 0,
      };
    })
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  const headToHeads: HeadToHeadRow[] = matchupRows
    .map((row) => {
      const playerIsTeamA = row.teamAPlayerIds.includes(playerId);
      const opponentIds = playerIsTeamA ? row.teamBPlayerIds : row.teamAPlayerIds;
      const playerWins = row.winnerHistory.filter((w) =>
        playerIsTeamA ? w === "A" : w === "B"
      ).length;
      return {
        matchupKey: row.matchupKey,
        opponentIds,
        opponentNames: opponentIds.map((id) => nameMap[id] ?? "Unknown"),
        gamesPlayed: row.gamesPlayed,
        playerWins,
        winRatio: row.gamesPlayed > 0 ? playerWins / row.gamesPlayed : 0,
      };
    })
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  return {
    player: { ...toEntry(playerRow), clubId: playerRow.clubId ?? null },
    partners,
    headToHeads,
  };
}
