// Pure win-probability calculator — no DB imports, safe to test and reuse.

export type PlayerStatsInput = { wins: number; gamesPlayed: number };
export type PairStatsInput = { wins: number; gamesPlayed: number } | null;

export type TeamInput = {
  players: PlayerStatsInput[];
  pairStats: PairStatsInput;
};

export type WinProbability = { probA: number; probB: number };

// DESIGN.md §9 formula:
//   pairStrength = avg(playerWinRate) * pairSynergyBonus
//   pairSynergyBonus = clamp(1 + (pairWinRatio - 0.5) * 0.2, 0.9, 1.1)
//   winProb_A = strengthA / (strengthA + strengthB)
//
// Returns null if any player has gamesPlayed === 0 (no history to work from).
export function computeWinProbability(
  teamA: TeamInput,
  teamB: TeamInput
): WinProbability | null {
  const allPlayers = [...teamA.players, ...teamB.players];
  if (allPlayers.some((p) => p.gamesPlayed === 0)) return null;

  function strength(team: TeamInput): number {
    const avgWinRate =
      team.players.reduce((sum, p) => sum + p.wins / p.gamesPlayed, 0) /
      team.players.length;
    const pairWinRatio =
      team.pairStats && team.pairStats.gamesPlayed > 0
        ? team.pairStats.wins / team.pairStats.gamesPlayed
        : 0.5;
    const bonus = Math.min(1.1, Math.max(0.9, 1 + (pairWinRatio - 0.5) * 0.2));
    return avgWinRate * bonus;
  }

  const sA = strength(teamA);
  const sB = strength(teamB);
  const total = sA + sB;

  if (total === 0) return { probA: 0.5, probB: 0.5 };

  return { probA: sA / total, probB: sB / total };
}
