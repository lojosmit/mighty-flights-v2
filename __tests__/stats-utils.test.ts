import { describe, it, expect } from "vitest";
import {
  computePlayerDeltas,
  pairKey,
  normalizeMatchup,
  canonicalWinner,
  type PlayerStatDelta,
} from "@/lib/stats-utils";
import type { FixtureResult } from "@/lib/db/schema";

// ── computePlayerDeltas ───────────────────────────────────────────────────────

describe("computePlayerDeltas — DESIGN.md §7 scoring table", () => {
  const A = ["p1", "p2"];
  const B = ["p3", "p4"];

  it("teamA_win: A gets wins, B gets losses", () => {
    const deltas = computePlayerDeltas(A, B, "teamA_win");
    const byId = Object.fromEntries(deltas.map((d) => [d.playerId, d]));
    expect(byId["p1"]).toMatchObject({ wins: 1, losses: 0, doves: 0, doveWins: 0, forfeits: 0 });
    expect(byId["p3"]).toMatchObject({ wins: 0, losses: 1, doves: 0, doveWins: 0, forfeits: 0 });
  });

  it("teamB_win: B gets wins, A gets losses", () => {
    const deltas = computePlayerDeltas(A, B, "teamB_win");
    const byId = Object.fromEntries(deltas.map((d) => [d.playerId, d]));
    expect(byId["p1"]).toMatchObject({ wins: 0, losses: 1 });
    expect(byId["p3"]).toMatchObject({ wins: 1, losses: 0 });
  });

  it("special_win_A: A gets win + doveWin, B gets loss + dove", () => {
    const deltas = computePlayerDeltas(A, B, "special_win_A");
    const byId = Object.fromEntries(deltas.map((d) => [d.playerId, d]));
    expect(byId["p1"]).toMatchObject({ wins: 1, losses: 0, doveWins: 1, doves: 0 });
    expect(byId["p3"]).toMatchObject({ wins: 0, losses: 1, doveWins: 0, doves: 1 });
  });

  it("special_win_B: B gets win + doveWin, A gets loss + dove", () => {
    const deltas = computePlayerDeltas(A, B, "special_win_B");
    const byId = Object.fromEntries(deltas.map((d) => [d.playerId, d]));
    expect(byId["p1"]).toMatchObject({ wins: 0, losses: 1, doves: 1, doveWins: 0 });
    expect(byId["p3"]).toMatchObject({ wins: 1, losses: 0, doves: 0, doveWins: 1 });
  });

  it("double_forfeit: all players get loss + forfeit", () => {
    const deltas = computePlayerDeltas(A, B, "double_forfeit");
    expect(deltas).toHaveLength(4);
    for (const d of deltas) {
      expect(d).toMatchObject({ wins: 0, losses: 1, forfeits: 1, doves: 0, doveWins: 0 });
    }
  });

  it("in_progress: returns empty array", () => {
    expect(computePlayerDeltas(A, B, "in_progress")).toHaveLength(0);
  });

  it("1v1 solo match — correct deltas for single-player teams", () => {
    const deltas = computePlayerDeltas(["p1"], ["p2"], "teamA_win");
    expect(deltas).toHaveLength(2);
    const byId = Object.fromEntries(deltas.map((d) => [d.playerId, d]));
    expect(byId["p1"].wins).toBe(1);
    expect(byId["p2"].losses).toBe(1);
  });
});

// ── pairKey ───────────────────────────────────────────────────────────────────

describe("pairKey", () => {
  it("produces same key regardless of input order", () => {
    expect(pairKey(["p2", "p1"])).toBe(pairKey(["p1", "p2"]));
  });

  it("sorts alphabetically", () => {
    expect(pairKey(["p9", "p1"])).toBe("p1:p9");
  });
});

// ── normalizeMatchup ──────────────────────────────────────────────────────────

describe("normalizeMatchup", () => {
  it("puts the lexicographically smaller team first", () => {
    const norm = normalizeMatchup(["p3", "p4"], ["p1", "p2"]);
    expect(norm.teamA).toEqual(["p1", "p2"]);
    expect(norm.teamB).toEqual(["p3", "p4"]);
    expect(norm.key).toBe("p1:p2|p3:p4");
  });

  it("is stable when teams are already in order", () => {
    const norm = normalizeMatchup(["p1", "p2"], ["p3", "p4"]);
    expect(norm.teamA).toEqual(["p1", "p2"]);
    expect(norm.key).toBe("p1:p2|p3:p4");
  });

  it("produces the same key regardless of which argument team is passed first", () => {
    const n1 = normalizeMatchup(["p1", "p2"], ["p3", "p4"]);
    const n2 = normalizeMatchup(["p3", "p4"], ["p1", "p2"]);
    expect(n1.key).toBe(n2.key);
  });

  it("sorts player IDs within each team before comparing", () => {
    // p2+p1 vs p4+p3 should produce same key as p1+p2 vs p3+p4
    const norm = normalizeMatchup(["p2", "p1"], ["p4", "p3"]);
    expect(norm.key).toBe("p1:p2|p3:p4");
  });
});

// ── canonicalWinner ───────────────────────────────────────────────────────────

describe("canonicalWinner", () => {
  const A = ["p1", "p2"];
  const B = ["p3", "p4"];

  it("teamA_win when original teamA matches canonical teamA → 'A'", () => {
    const norm = normalizeMatchup(A, B); // p1p2 is canonical teamA
    expect(canonicalWinner(A, B, "teamA_win", norm)).toBe("A");
  });

  it("teamA_win when original teamA is canonical teamB → 'B'", () => {
    // Pass original teams swapped
    const norm = normalizeMatchup(A, B); // canonical: teamA=p1p2, teamB=p3p4
    // Now original teamA = p3p4 wins, but canonical teamA is p1p2 → canonical "B" won
    expect(canonicalWinner(B, A, "teamA_win", norm)).toBe("B");
  });

  it("teamB_win → correctly maps to canonical winner", () => {
    const norm = normalizeMatchup(A, B);
    expect(canonicalWinner(A, B, "teamB_win", norm)).toBe("B");
  });

  it("special_win_A treated same as teamA_win", () => {
    const norm = normalizeMatchup(A, B);
    expect(canonicalWinner(A, B, "special_win_A", norm)).toBe("A");
  });

  it("double_forfeit → 'X'", () => {
    const norm = normalizeMatchup(A, B);
    expect(canonicalWinner(A, B, "double_forfeit", norm)).toBe("X");
  });

  it("in_progress → null", () => {
    const norm = normalizeMatchup(A, B);
    expect(canonicalWinner(A, B, "in_progress", norm)).toBeNull();
  });
});

// ── SEQUENCE.md §9.4: 10 fixtures, stats math correct ────────────────────────

describe("SEQUENCE.md §9.4 — 10 fixtures accumulated correctly", () => {
  // p1+p2 (teamA) vs p3+p4 (teamB) for every fixture
  const teamA = ["p1", "p2"];
  const teamB = ["p3", "p4"];

  const fixtures: FixtureResult[] = [
    "teamA_win",     // 1
    "teamA_win",     // 2
    "teamA_win",     // 3
    "teamB_win",     // 4
    "teamB_win",     // 5
    "special_win_A", // 6
    "special_win_A", // 7
    "special_win_B", // 8
    "double_forfeit",// 9
    "double_forfeit",// 10
  ];

  function accumulateDeltas(results: FixtureResult[]) {
    const totals: Record<string, PlayerStatDelta> = {};
    for (const res of results) {
      for (const d of computePlayerDeltas(teamA, teamB, res)) {
        if (!totals[d.playerId]) {
          totals[d.playerId] = { playerId: d.playerId, wins: 0, losses: 0, doves: 0, doveWins: 0, forfeits: 0 };
        }
        totals[d.playerId].wins     += d.wins;
        totals[d.playerId].losses   += d.losses;
        totals[d.playerId].doves    += d.doves;
        totals[d.playerId].doveWins += d.doveWins;
        totals[d.playerId].forfeits += d.forfeits;
      }
    }
    return totals;
  }

  it("p1 (teamA): correct totals after 10 fixtures", () => {
    const totals = accumulateDeltas(fixtures);
    // wins: 3×teamA_win + 2×special_win_A = 5
    // losses: 2×teamB_win + 1×special_win_B + 2×double_forfeit = 5
    // doveWins: 2×special_win_A = 2
    // doves: 1×special_win_B = 1
    // forfeits: 2×double_forfeit = 2
    expect(totals["p1"]).toMatchObject({ wins: 5, losses: 5, doveWins: 2, doves: 1, forfeits: 2 });
  });

  it("p3 (teamB): correct totals after 10 fixtures", () => {
    const totals = accumulateDeltas(fixtures);
    // wins: 2×teamB_win + 1×special_win_B = 3
    // losses: 3×teamA_win + 2×special_win_A + 2×double_forfeit = 7
    // doves: 2×special_win_A = 2
    // doveWins: 1×special_win_B = 1
    // forfeits: 2×double_forfeit = 2
    expect(totals["p3"]).toMatchObject({ wins: 3, losses: 7, doveWins: 1, doves: 2, forfeits: 2 });
  });

  it("p1 and p2 have identical stat totals (always on same team)", () => {
    const totals = accumulateDeltas(fixtures);
    const { wins, losses, doves, doveWins, forfeits } = totals["p2"];
    expect(totals["p1"]).toMatchObject({ wins, losses, doves, doveWins, forfeits });
  });

  it("double_forfeit generates losses for all players but zero wins (so total wins < total losses)", () => {
    const totals = accumulateDeltas(fixtures);
    const totalWins   = Object.values(totals).reduce((s, d) => s + d.wins, 0);
    const totalLosses = Object.values(totals).reduce((s, d) => s + d.losses, 0);
    // 2 double_forfeits × 4 players = 8 extra losses with no corresponding wins
    const totalForfeits = Object.values(totals).reduce((s, d) => s + d.forfeits, 0);
    expect(totalLosses - totalWins).toBe(totalForfeits);
  });

  it("matchup history: 10 games, correct winner entries", () => {
    const norm = normalizeMatchup(teamA, teamB);
    const history = fixtures
      .map((r) => canonicalWinner(teamA, teamB, r, norm))
      .filter((w): w is NonNullable<typeof w> => w !== null);

    expect(history).toHaveLength(10);
    expect(history.filter((w) => w === "A")).toHaveLength(5); // 3 teamA_win + 2 special_win_A
    expect(history.filter((w) => w === "B")).toHaveLength(3); // 2 teamB_win + 1 special_win_B
    expect(history.filter((w) => w === "X")).toHaveLength(2); // 2 double_forfeit
  });

  it("pair stats: p1+p2 played 10 games, won 5", () => {
    const norm = normalizeMatchup(teamA, teamB);
    let pairAGames = 0;
    let pairAWins = 0;
    for (const result of fixtures) {
      pairAGames++;
      const winner = canonicalWinner(teamA, teamB, result, norm);
      // p1+p2 is canonical teamA
      if (winner === "A") pairAWins++;
    }
    expect(pairAGames).toBe(10);
    expect(pairAWins).toBe(5);
  });
});
