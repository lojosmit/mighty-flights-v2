import { describe, it, expect } from "vitest";
import { computeWinProbability, type TeamInput } from "@/lib/prediction-utils";

// ── computeWinProbability — DESIGN.md §9 ─────────────────────────────────────

describe("computeWinProbability — DESIGN.md §9", () => {
  it("equal 1v1 players, no pair history → 50/50", () => {
    const teamA: TeamInput = { players: [{ wins: 5, gamesPlayed: 10 }], pairStats: null };
    const teamB: TeamInput = { players: [{ wins: 5, gamesPlayed: 10 }], pairStats: null };
    const result = computeWinProbability(teamA, teamB)!;
    expect(result).not.toBeNull();
    expect(result.probA).toBeCloseTo(0.5);
    expect(result.probB).toBeCloseTo(0.5);
  });

  it("probA + probB === 1 invariant", () => {
    const teamA: TeamInput = { players: [{ wins: 7, gamesPlayed: 10 }], pairStats: null };
    const teamB: TeamInput = { players: [{ wins: 3, gamesPlayed: 10 }], pairStats: null };
    const result = computeWinProbability(teamA, teamB)!;
    expect(result.probA + result.probB).toBeCloseTo(1.0);
  });

  it("higher win-rate player has higher probability", () => {
    const teamA: TeamInput = { players: [{ wins: 7, gamesPlayed: 10 }], pairStats: null };
    const teamB: TeamInput = { players: [{ wins: 3, gamesPlayed: 10 }], pairStats: null };
    const result = computeWinProbability(teamA, teamB)!;
    expect(result.probA).toBeGreaterThan(0.5);
    expect(result.probB).toBeLessThan(0.5);
  });

  it("pair synergy bonus boosts team with high pair win rate", () => {
    // Equal individual rates, but teamA has 80% pair win rate
    const teamA: TeamInput = {
      players: [{ wins: 5, gamesPlayed: 10 }, { wins: 5, gamesPlayed: 10 }],
      pairStats: { wins: 8, gamesPlayed: 10 },
    };
    const teamB: TeamInput = {
      players: [{ wins: 5, gamesPlayed: 10 }, { wins: 5, gamesPlayed: 10 }],
      pairStats: null,
    };
    const result = computeWinProbability(teamA, teamB)!;
    expect(result.probA).toBeGreaterThan(0.5);
  });

  it("pair synergy bonus capped at 1.1 (100% pair win rate)", () => {
    // bonus = min(1.1, 1 + (1.0 - 0.5) * 0.2) = 1.1
    // strengthA = 0.5 * 1.1 = 0.55, strengthB = 0.5 * 0.9 = 0.45
    const teamA: TeamInput = {
      players: [{ wins: 5, gamesPlayed: 10 }],
      pairStats: { wins: 10, gamesPlayed: 10 },
    };
    const teamB: TeamInput = {
      players: [{ wins: 5, gamesPlayed: 10 }],
      pairStats: { wins: 0, gamesPlayed: 10 },
    };
    const result = computeWinProbability(teamA, teamB)!;
    expect(result.probA).toBeCloseTo(0.55 / (0.55 + 0.45));
  });

  it("pair synergy bonus floored at 0.9 (0% pair win rate)", () => {
    // bonus = max(0.9, 1 + (0.0 - 0.5) * 0.2) = 0.9
    // strengthA = 0.5 * 0.9 = 0.45, strengthB = 0.5 * 1.0 = 0.5
    const teamA: TeamInput = {
      players: [{ wins: 5, gamesPlayed: 10 }],
      pairStats: { wins: 0, gamesPlayed: 10 },
    };
    const teamB: TeamInput = {
      players: [{ wins: 5, gamesPlayed: 10 }],
      pairStats: null,
    };
    const result = computeWinProbability(teamA, teamB)!;
    expect(result.probA).toBeCloseTo(0.45 / (0.45 + 0.5));
  });

  it("no pair history uses neutral synergy (1.0) — same as no pair data", () => {
    const withNull: TeamInput = { players: [{ wins: 5, gamesPlayed: 10 }], pairStats: null };
    const withNeutral: TeamInput = {
      players: [{ wins: 5, gamesPlayed: 10 }],
      pairStats: { wins: 5, gamesPlayed: 10 }, // 50% → bonus = 1.0
    };
    const base: TeamInput = { players: [{ wins: 5, gamesPlayed: 10 }], pairStats: null };
    const r1 = computeWinProbability(withNull, base)!;
    const r2 = computeWinProbability(withNeutral, base)!;
    expect(r1.probA).toBeCloseTo(r2.probA);
  });

  it("2v2 pair averages win rates of both players", () => {
    // p1: 80%, p2: 20% → avg 50%, same as opponent 50%
    const teamA: TeamInput = {
      players: [{ wins: 8, gamesPlayed: 10 }, { wins: 2, gamesPlayed: 10 }],
      pairStats: null,
    };
    const teamB: TeamInput = {
      players: [{ wins: 5, gamesPlayed: 10 }, { wins: 5, gamesPlayed: 10 }],
      pairStats: null,
    };
    const result = computeWinProbability(teamA, teamB)!;
    expect(result.probA).toBeCloseTo(0.5);
  });

  it("returns null if any player has gamesPlayed === 0 (no history)", () => {
    const teamA: TeamInput = { players: [{ wins: 0, gamesPlayed: 0 }], pairStats: null };
    const teamB: TeamInput = { players: [{ wins: 5, gamesPlayed: 10 }], pairStats: null };
    expect(computeWinProbability(teamA, teamB)).toBeNull();
  });

  it("returns null if one player in a 2v2 has gamesPlayed === 0", () => {
    const teamA: TeamInput = {
      players: [{ wins: 5, gamesPlayed: 10 }, { wins: 0, gamesPlayed: 0 }],
      pairStats: null,
    };
    const teamB: TeamInput = {
      players: [{ wins: 5, gamesPlayed: 10 }, { wins: 5, gamesPlayed: 10 }],
      pairStats: null,
    };
    expect(computeWinProbability(teamA, teamB)).toBeNull();
  });

  it("returns null if all players have gamesPlayed === 0", () => {
    const teamA: TeamInput = { players: [{ wins: 0, gamesPlayed: 0 }], pairStats: null };
    const teamB: TeamInput = { players: [{ wins: 0, gamesPlayed: 0 }], pairStats: null };
    expect(computeWinProbability(teamA, teamB)).toBeNull();
  });

  it("when both teams have zero wins but have played (all losses), returns 50/50", () => {
    const teamA: TeamInput = { players: [{ wins: 0, gamesPlayed: 10 }], pairStats: null };
    const teamB: TeamInput = { players: [{ wins: 0, gamesPlayed: 10 }], pairStats: null };
    const result = computeWinProbability(teamA, teamB)!;
    expect(result).not.toBeNull();
    expect(result.probA).toBeCloseTo(0.5);
    expect(result.probB).toBeCloseTo(0.5);
  });
});
