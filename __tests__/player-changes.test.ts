import { describe, it, expect } from "vitest";
import { locatePlayer, boardReductionNeeded } from "@/lib/player-change-utils";
import { nextRound, type RoundState } from "@/lib/rotation-engine";
import { allocateFixtures } from "@/lib/fixture-utils";
import type { Fixture } from "@/lib/db/schema";

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
  return { boards: boards.map((b) => ({ ...b, result })), bench, streaks };
}

function fakeFixture(
  boardLabel: string,
  result: Fixture["result"],
  overrides: Partial<Fixture> = {}
): Fixture {
  return {
    id: boardLabel + "-id",
    roundId: "round-id",
    boardLabel,
    type: "2v2",
    teamA: { playerIds: ["p1", "p2"], score: 0, handicapApplied: 1 },
    teamB: { playerIds: ["p3", "p4"], score: 0, handicapApplied: 1 },
    result,
    forfeitReason: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// ── locatePlayer ─────────────────────────────────────────────────────────────

describe("locatePlayer", () => {
  it("finds a player on the bench", () => {
    const result = locatePlayer([], ["p5", "p6"], "p5");
    expect(result.status).toBe("bench");
  });

  it("finds a player on an active (in_progress) board", () => {
    const fx = [fakeFixture("B", "in_progress")];
    const result = locatePlayer(fx, [], "p1");
    expect(result).toEqual({ status: "active_board", boardLabel: "B", fixtureId: "B-id" });
  });

  it("finds a player on a completed board", () => {
    const fx = [fakeFixture("A", "teamA_win")];
    const result = locatePlayer(fx, [], "p3");
    expect(result.status).toBe("completed_board");
  });

  it("returns not_found for a player not in fixtures or bench", () => {
    const fx = [fakeFixture("A", "in_progress")];
    const result = locatePlayer(fx, [], "p99");
    expect(result.status).toBe("not_found");
  });

  it("bench takes priority over fixture lookup", () => {
    // p1 is both in bench and in a fixture (shouldn't happen but defensive)
    const fx = [fakeFixture("A", "in_progress")];
    const result = locatePlayer(fx, ["p1"], "p1");
    expect(result.status).toBe("bench");
  });
});

// ── boardReductionNeeded ──────────────────────────────────────────────────────

describe("boardReductionNeeded", () => {
  it("returns false when new player count still supports current board count", () => {
    // 8 players, 2 boards → remove 1 → 7 players, maxBoards(7)=2 → ok
    expect(boardReductionNeeded(7, 2)).toBe(false);
  });

  it("returns true when removing a player makes board count invalid", () => {
    // 9 players, 3 boards → remove 1 → 8 players, maxBoards(8)=2 → must reduce
    expect(boardReductionNeeded(8, 3)).toBe(true);
  });

  it("returns false for typical 2-board removal: 10→9 players", () => {
    // maxBoards(9) = 2, boardCount = 2 → fine
    expect(boardReductionNeeded(9, 2)).toBe(false);
  });

  it("returns true when player count drops below 6 (night can no longer run)", () => {
    // maxBoards(5) = 0
    expect(boardReductionNeeded(5, 1)).toBe(true);
  });
});

// ── 8.4 simulation: add player at round 3 ───────────────────────────────────

describe("SEQUENCE.md §8.4 — add player at round 3", () => {
  it("added player (placed on bench) appears in next round under bench rule", () => {
    const playerIds = ids(7); // p1–p7
    const r1 = allocateFixtures(playerIds, 2);
    let state = toCompletedState(r1.boards, r1.bench, []);

    // Simulate rounds 2 and 3
    for (let i = 0; i < 2; i++) {
      const next = nextRound(state, playerIds, 2, noShuffle);
      state = toCompletedState(next.boards, next.bench, next.streaks);
    }

    // Late-arriving p8 is added to current round's bench
    const newPlayerIds = [...playerIds, "p8"];
    const benchWithNew = [...state.bench, "p8"];
    const stateWithNew: RoundState = { ...state, bench: benchWithNew };

    // Generate round 4 with the new player in the pool
    const round4 = nextRound(stateWithNew, newPlayerIds, 2, noShuffle);

    // p8 was on bench → must play round 4 (bench mandate)
    expect(allPlaced(round4.boards)).toContain("p8");
    expect(allPlaced(round4.boards).length + round4.bench.length).toBe(8);
  });
});

// ── 8.4 simulation: remove player at round 5 ─────────────────────────────────

describe("SEQUENCE.md §8.4 — remove player at round 5", () => {
  it("removed player is absent from next round rotation", () => {
    const playerIds = ids(8); // p1–p8
    const r1 = allocateFixtures(playerIds, 2);
    let state = toCompletedState(r1.boards, r1.bench, []);

    // Simulate rounds 2–5
    for (let i = 0; i < 4; i++) {
      const next = nextRound(state, playerIds, 2, noShuffle);
      state = toCompletedState(next.boards, next.bench, next.streaks);
    }

    // p8 leaves → remove from player list and bench
    const reducedPlayers = playerIds.filter((id) => id !== "p8");
    const reducedBench = state.bench.filter((id) => id !== "p8");
    const stateWithout: RoundState = { ...state, bench: reducedBench };

    const round6 = nextRound(stateWithout, reducedPlayers, 2, noShuffle);

    expect(allPlaced(round6.boards)).not.toContain("p8");
    expect(round6.bench).not.toContain("p8");
    expect(allPlaced(round6.boards).length + round6.bench.length).toBe(7);
  });
});

// ── 8.4 simulation: board reduction ──────────────────────────────────────────

describe("SEQUENCE.md §8.4 — board reduction after player removal", () => {
  it("after reducing from 3 to 2 boards, next round generates correct fixture count", () => {
    // 10 players, 3 boards. After removing p10 (on Board C) → 9 players.
    // maxBoards(9)=2 so host reduces to 2 boards.
    // Manually construct state so it's deterministic regardless of shuffle.
    const tenPlayers = ids(10);
    const state: RoundState = {
      boards: [
        { boardLabel: "A", type: "2v2", teamA: { playerIds: ["p1", "p2"] }, teamB: { playerIds: ["p3", "p4"] }, result: "teamA_win" },
        { boardLabel: "B", type: "2v2", teamA: { playerIds: ["p5", "p6"] }, teamB: { playerIds: ["p7", "p8"] }, result: "teamA_win" },
        { boardLabel: "C", type: "1v1", teamA: { playerIds: ["p9"] }, teamB: { playerIds: ["p10"] }, result: "teamA_win" },
      ],
      bench: [],
      streaks: [],
    };

    // p10 leaves → 9 players, board count reduced from 3 to 2
    const reducedPlayers = tenPlayers.filter((id) => id !== "p10");
    const round2 = nextRound(state, reducedPlayers, 2, noShuffle);

    expect(round2.boards.length).toBe(2);
    expect(allPlaced(round2.boards).length + round2.bench.length).toBe(9);
  });

  it("boardReductionNeeded correctly flags the 9→8 player, 3-board scenario", () => {
    // maxBoards(8) = 2, so 3 boards is now invalid
    expect(boardReductionNeeded(8, 3)).toBe(true);
  });
});
