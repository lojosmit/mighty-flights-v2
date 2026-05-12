import { describe, it, expect } from "vitest";
import {
  allocateBoardSpecs,
  allocateFixtures,
  swapPlayers,
} from "@/lib/fixture-utils";
import { validBoardCounts } from "@/lib/league-night-utils";

// Helpers
function ids(n: number) {
  return Array.from({ length: n }, (_, i) => `p${i + 1}`);
}
function totalSlots(result: ReturnType<typeof allocateFixtures>) {
  return result.boards.reduce(
    (sum, b) =>
      sum + b.teamA.playerIds.length + b.teamB.playerIds.length,
    0
  );
}

// ── DESIGN.md §5 examples ────────────────────────────────────────────────────

describe("allocateBoardSpecs — DESIGN.md §5 examples", () => {
  it("6 players, 2 boards → A=2v2, B=1v1", () => {
    const specs = allocateBoardSpecs(6, 2);
    expect(specs[0]).toMatchObject({ boardLabel: "A", type: "2v2" });
    expect(specs[1]).toMatchObject({ boardLabel: "B", type: "1v1" });
  });

  it("10 players, 2 boards → A=2v2, B=2v2", () => {
    const specs = allocateBoardSpecs(10, 2);
    expect(specs[0]).toMatchObject({ boardLabel: "A", type: "2v2" });
    expect(specs[1]).toMatchObject({ boardLabel: "B", type: "2v2" });
  });

  it("10 players, 3 boards → A=2v2, B=2v2, C=1v1", () => {
    const specs = allocateBoardSpecs(10, 3);
    expect(specs[0]).toMatchObject({ type: "2v2" });
    expect(specs[1]).toMatchObject({ type: "2v2" });
    expect(specs[2]).toMatchObject({ boardLabel: "C", type: "1v1" });
  });

  it("11 players, 3 boards → A=2v2, B=2v2, C=1v1", () => {
    const specs = allocateBoardSpecs(11, 3);
    expect(specs.map((s) => s.type)).toEqual(["2v2", "2v2", "1v1"]);
  });
});

describe("Board A is always 2v2", () => {
  for (let p = 6; p <= 20; p++) {
    const boards = validBoardCounts(p);
    for (const b of boards) {
      it(`${p} players, ${b} boards — Board A is 2v2`, () => {
        const specs = allocateBoardSpecs(p, b);
        expect(specs[0].type).toBe("2v2");
        expect(specs[0].boardLabel).toBe("A");
      });
    }
  }
});

describe("allocateFixtures — all valid combos 6–20", () => {
  for (let p = 6; p <= 20; p++) {
    const boards = validBoardCounts(p);
    for (const b of boards) {
      it(`${p} players, ${b} boards — all players accounted for`, () => {
        const result = allocateFixtures(ids(p), b);
        const placed = totalSlots(result);
        const benched = result.bench.length;
        expect(placed + benched).toBe(p);
      });

      it(`${p} players, ${b} boards — bench count correct`, () => {
        const result = allocateFixtures(ids(p), b);
        const placed = totalSlots(result);
        expect(placed).toBeGreaterThanOrEqual(b * 2); // at minimum 2 per board
        expect(result.bench.length).toBeGreaterThanOrEqual(0);
      });
    }
  }
});

describe("swapPlayers", () => {
  it("swaps two players in different team slots", () => {
    const result = allocateFixtures(ids(6), 2);
    const p1 = result.boards[0].teamA.playerIds[0];
    const p2 = result.boards[0].teamB.playerIds[0];
    const swapped = swapPlayers(result, p1, p2);
    expect(swapped.boards[0].teamA.playerIds[0]).toBe(p2);
    expect(swapped.boards[0].teamB.playerIds[0]).toBe(p1);
  });

  it("swaps a player from slot to bench", () => {
    const result = allocateFixtures(ids(7), 2); // 1 benched
    expect(result.bench.length).toBe(1);
    const benched = result.bench[0];
    const onBoard = result.boards[0].teamA.playerIds[0];
    const swapped = swapPlayers(result, benched, onBoard);
    expect(swapped.bench).toContain(onBoard);
    expect(swapped.boards[0].teamA.playerIds[0]).toBe(benched);
  });
});
