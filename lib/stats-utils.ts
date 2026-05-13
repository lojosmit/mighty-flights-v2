// Pure stats helpers — no DB, no side effects. Per DESIGN.md Section 8.

import type { FixtureResult } from "./db/schema";

export type PlayerStatDelta = {
  playerId: string;
  wins: number;
  losses: number;
  doves: number;
  doveWins: number;
  forfeits: number;
};

const zero = () => ({ wins: 0, losses: 0, doves: 0, doveWins: 0, forfeits: 0 });

// Per DESIGN.md §7 scoring table.
export function computePlayerDeltas(
  teamA: string[],
  teamB: string[],
  result: FixtureResult
): PlayerStatDelta[] {
  switch (result) {
    case "teamA_win":
      return [
        ...teamA.map((id) => ({ playerId: id, ...zero(), wins: 1 })),
        ...teamB.map((id) => ({ playerId: id, ...zero(), losses: 1 })),
      ];
    case "teamB_win":
      return [
        ...teamA.map((id) => ({ playerId: id, ...zero(), losses: 1 })),
        ...teamB.map((id) => ({ playerId: id, ...zero(), wins: 1 })),
      ];
    case "special_win_A":
      return [
        ...teamA.map((id) => ({ playerId: id, ...zero(), wins: 1, doveWins: 1 })),
        ...teamB.map((id) => ({ playerId: id, ...zero(), losses: 1, doves: 1 })),
      ];
    case "special_win_B":
      return [
        ...teamA.map((id) => ({ playerId: id, ...zero(), losses: 1, doves: 1 })),
        ...teamB.map((id) => ({ playerId: id, ...zero(), wins: 1, doveWins: 1 })),
      ];
    case "double_forfeit":
      return [...teamA, ...teamB].map((id) => ({
        playerId: id,
        ...zero(),
        losses: 1,
        forfeits: 1,
      }));
    default:
      return [];
  }
}

// Canonical pair key: sort IDs alphabetically, join with ':'.
export function pairKey(ids: string[]): string {
  return [...ids].sort().join(":");
}

export type MatchupNorm = {
  teamA: string[];
  teamB: string[];
  key: string;
};

// Normalize a matchup so the lexicographically smaller team is always stored as teamA.
// Ensures the same pair of teams always maps to the same canonical record.
export function normalizeMatchup(teamA: string[], teamB: string[]): MatchupNorm {
  const sA = [...teamA].sort();
  const sB = [...teamB].sort();
  const kA = sA.join(":");
  const kB = sB.join(":");
  if (kA <= kB) return { teamA: sA, teamB: sB, key: `${kA}|${kB}` };
  return { teamA: sB, teamB: sA, key: `${kB}|${kA}` };
}

// Which canonical team won? "A" | "B" | "X" (forfeit). Null for in_progress.
export type WinEntry = "A" | "B" | "X";

export function canonicalWinner(
  originalTeamA: string[],
  originalTeamB: string[],
  result: FixtureResult,
  norm: MatchupNorm
): WinEntry | null {
  if (result === "in_progress") return null;
  if (result === "double_forfeit") return "X";

  const originalAWon = result === "teamA_win" || result === "special_win_A";
  const originalAKey = [...originalTeamA].sort().join(":");
  const normAKey = norm.teamA.join(":");
  const originalAIsNormA = originalAKey === normAKey;

  const normAWon = originalAWon ? originalAIsNormA : !originalAIsNormA;
  return normAWon ? "A" : "B";
}
