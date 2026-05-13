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

// Tie-breaker chain applied after the primary sort key (DESIGN.md §10, phase 13.4).
// Descending order within each tier: wins → winRatio → doveWins → gamesPlayed.
const TIEBREAKERS: SortKey[] = ["wins", "winRatio", "doveWins", "gamesPlayed"];

export function sortLeaderboard(
  entries: LeaderboardEntry[],
  key: SortKey,
  dir: "asc" | "desc" = "desc"
): LeaderboardEntry[] {
  const factor = dir === "desc" ? -1 : 1;
  return [...entries].sort((a, b) => {
    const primary = factor * (a[key] - b[key]);
    if (primary !== 0) return primary;
    // Tie-break always descending, skipping the primary key
    for (const tb of TIEBREAKERS) {
      if (tb === key) continue;
      const diff = b[tb] - a[tb];
      if (diff !== 0) return diff;
    }
    return 0;
  });
}
