// Per DESIGN.md Section 4 — all pure, no DB.

export function maxBoards(playerCount: number): number {
  if (playerCount < 6) return 0;
  const rem = playerCount % 4;
  if (rem === 0 || rem === 1) return Math.floor(playerCount / 4);
  return Math.floor((playerCount - rem + 4) / 4);
}

export function validBoardCounts(playerCount: number): number[] {
  const max = maxBoards(playerCount);
  if (max === 0) return [];
  return Array.from({ length: max }, (_, i) => i + 1);
}

export function canRunLeagueNight(playerCount: number): boolean {
  return playerCount >= 6;
}
