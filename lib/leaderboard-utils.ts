// Pure, client-safe leaderboard helpers — no DB imports.

export type LeaderboardEntry = {
  id: string;
  name: string;
  seasonRank: number;
  wins: number;
  losses: number;
  doves: number;
  doveWins: number;
  forfeits: number;
  gamesPlayed: number;
  winRatio: number;
};

export type SortKey = "wins" | "winRatio" | "doveWins" | "doves" | "gamesPlayed";

export function sortLeaderboard(
  entries: LeaderboardEntry[],
  key: SortKey,
  dir: "asc" | "desc" = "desc"
): LeaderboardEntry[] {
  const factor = dir === "desc" ? -1 : 1;
  return [...entries].sort((a, b) => factor * (a[key] - b[key]));
}
