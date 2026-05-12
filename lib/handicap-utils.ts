// Pure function — no DB, safe to import anywhere including the rotation engine.
export function computeMultiplier(rank: number): number {
  return parseFloat((1.0 + Math.floor((rank - 1) / 2) * 0.1).toFixed(2));
}
