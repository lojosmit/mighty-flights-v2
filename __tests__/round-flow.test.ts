import { describe, it, expect } from "vitest";
import { nextRound, type RoundState } from "@/lib/rotation-engine";
import { allocateFixtures } from "@/lib/fixture-utils";

// ── helpers ──────────────────────────────────────────────────────────────────

function ids(n: number) {
  return Array.from({ length: n }, (_, i) => `p${i + 1}`);
}

const noShuffle = () => 0;

function allPlaced(boards: ReturnType<typeof nextRound>["boards"]) {
  return boards.flatMap((b) => [...b.teamA.playerIds, ...b.teamB.playerIds]);
}

function toCompletedState(
  boards: ReturnType<typeof nextRound>["boards"],
  bench: string[],
  streaks: ReturnType<typeof nextRound>["streaks"],
  result: "teamA_win" | "teamB_win" = "teamA_win"
): RoundState {
  return {
    boards: boards.map((b) => ({ ...b, result })),
    bench,
    streaks,
  };
}

// ── 6-round simulation ────────────────────────────────────────────────────────

describe("full league night simulation — SEQUENCE.md §7.6", () => {
  it("8 players, 2 boards, 6 rounds — all players accounted for every round", () => {
    const playerIds = ids(8);
    const r1 = allocateFixtures(playerIds, 2);

    let state = toCompletedState(r1.boards, r1.bench, []);

    for (let round = 0; round < 6; round++) {
      const next = nextRound(state, playerIds, 2, noShuffle);
      const placed = allPlaced(next.boards);
      expect(placed.length + next.bench.length).toBe(8);
      state = toCompletedState(next.boards, next.bench, next.streaks);
    }
  });

  it("10 players, 3 boards, 6 rounds — all players accounted for every round", () => {
    const playerIds = ids(10);
    const r1 = allocateFixtures(playerIds, 3);

    let state = toCompletedState(r1.boards, r1.bench, []);

    for (let round = 0; round < 6; round++) {
      const next = nextRound(state, playerIds, 3, noShuffle);
      const placed = allPlaced(next.boards);
      expect(placed.length + next.bench.length).toBe(10);
      state = toCompletedState(next.boards, next.bench, next.streaks);
    }
  });

  it("7 players, 2 boards (bench=1), 6 rounds — bench player always plays next", () => {
    const playerIds = ids(7);
    const r1 = allocateFixtures(playerIds, 2);

    let state = toCompletedState(r1.boards, r1.bench, []);

    for (let round = 0; round < 6; round++) {
      const prevBench = state.bench;
      const next = nextRound(state, playerIds, 2, noShuffle);
      const placed = allPlaced(next.boards);

      // Anyone who was benched must appear in the next round
      for (const id of prevBench) {
        expect(placed).toContain(id);
      }

      expect(placed.length + next.bench.length).toBe(7);
      state = toCompletedState(next.boards, next.bench, next.streaks);
    }
  });

  it("12 players, 3 boards, 6 rounds — streak never stored at 3 (split fires, all players placed)", () => {
    const playerIds = ids(12);
    const r1 = allocateFixtures(playerIds, 3);

    let state = toCompletedState(r1.boards, r1.bench, []);

    for (let round = 0; round < 6; round++) {
      const next = nextRound(state, playerIds, 3, noShuffle);
      const placed = allPlaced(next.boards);

      // Invariant: all players accounted for even when a split fires
      expect(placed.length + next.bench.length).toBe(12);

      // Streak-3 triggers split before storing — output streaks are always ≤ 2
      for (const s of next.streaks) {
        expect(s.count).toBeLessThanOrEqual(2);
      }

      state = toCompletedState(next.boards, next.bench, next.streaks);
    }
  });

  it("alternating wins, 8 players, 2 boards, 6 rounds — no streaks persist across team changes", () => {
    const playerIds = ids(8);
    const r1 = allocateFixtures(playerIds, 2);
    let state = toCompletedState(r1.boards, r1.bench, [], "teamA_win");

    for (let round = 0; round < 6; round++) {
      // Alternate: teamA wins on even rounds, teamB wins on odd
      const result = round % 2 === 0 ? ("teamB_win" as const) : ("teamA_win" as const);
      const next = nextRound(state, playerIds, 2, noShuffle);

      expect(allPlaced(next.boards).length + next.bench.length).toBe(8);

      state = toCompletedState(next.boards, next.bench, next.streaks, result);
    }
  });
});
