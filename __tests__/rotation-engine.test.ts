import { describe, it, expect } from "vitest";
import { nextRound, type RoundState } from "@/lib/rotation-engine";

// ── helpers ──────────────────────────────────────────────────────────────────

function ids(n: number) {
  return Array.from({ length: n }, (_, i) => `p${i + 1}`);
}

function allPlaced(boards: ReturnType<typeof nextRound>["boards"]) {
  return boards.flatMap((b) => [...b.teamA.playerIds, ...b.teamB.playerIds]);
}

function onBoard(
  boards: ReturnType<typeof nextRound>["boards"],
  label: string
) {
  const b = boards.find((x) => x.boardLabel === label);
  return b ? [...b.teamA.playerIds, ...b.teamB.playerIds] : [];
}

function teammates(
  boards: ReturnType<typeof nextRound>["boards"],
  idA: string,
  idB: string
) {
  for (const b of boards) {
    const onA = b.teamA.playerIds.includes(idA) && b.teamA.playerIds.includes(idB);
    const onB = b.teamB.playerIds.includes(idA) && b.teamB.playerIds.includes(idB);
    if (onA || onB) return true;
  }
  return false;
}

// Deterministic RNG (always returns 0 → no shuffle)
const noShuffle = () => 0;

// ── Section 13 scenario 1: bench rule ────────────────────────────────────────

describe("bench rule — DESIGN.md §13", () => {
  it("benched player from previous round must appear in next round", () => {
    // 7 players, 2 boards (A=2v2, B=1v1), p7 benched
    const prev: RoundState = {
      boards: [
        {
          boardLabel: "A", type: "2v2",
          teamA: { playerIds: ["p1", "p2"] },
          teamB: { playerIds: ["p3", "p4"] },
          result: "teamA_win",
        },
        {
          boardLabel: "B", type: "1v1",
          teamA: { playerIds: ["p5"] },
          teamB: { playerIds: ["p6"] },
          result: "teamA_win",
        },
      ],
      bench: ["p7"],
      streaks: [],
    };

    const result = nextRound(prev, ids(7), 2, noShuffle);
    const placed = allPlaced(result.boards);

    expect(placed).toContain("p7");
    expect(placed.length + result.bench.length).toBe(7);
  });

  it("benched player is placed before regular pool players", () => {
    // 8 players, 2 boards (A=2v2, B=2v2), 0 bench from prev
    // But let's have p7 and p8 benched
    const prev: RoundState = {
      boards: [
        {
          boardLabel: "A", type: "2v2",
          teamA: { playerIds: ["p1", "p2"] },
          teamB: { playerIds: ["p3", "p4"] },
          result: "teamA_win",
        },
        {
          boardLabel: "B", type: "2v2",
          teamA: { playerIds: ["p5", "p6"] },
          teamB: { playerIds: ["p7", "p8"] },
          result: "teamA_win",
        },
      ],
      bench: [],
      streaks: [],
    };

    // Force 2 players to bench by using 10-player allIds with boardCount=2
    // Board A=2v2, Board B=2v2 → 8 placed, 2 benched
    const prev2: RoundState = {
      boards: [
        {
          boardLabel: "A", type: "2v2",
          teamA: { playerIds: ["p1", "p2"] },
          teamB: { playerIds: ["p3", "p4"] },
          result: "teamA_win",
        },
        {
          boardLabel: "B", type: "2v2",
          teamA: { playerIds: ["p5", "p6"] },
          teamB: { playerIds: ["p7", "p8"] },
          result: "teamB_win",
        },
      ],
      bench: ["p9", "p10"],
      streaks: [],
    };

    const result = nextRound(prev2, ids(10), 2, noShuffle);
    const placed = allPlaced(result.boards);
    expect(placed).toContain("p9");
    expect(placed).toContain("p10");
    expect(placed.length + result.bench.length).toBe(10);
  });
});

// ── Section 13 scenario 2: streak 3 split ────────────────────────────────────

describe("Board A streak=3 split — DESIGN.md §13", () => {
  it("pair split when streak reaches 3, both go to pool", () => {
    // 8 players, 2 boards. p1p2 have prevStreak=2, win again → streak 3 → SPLIT
    const prev: RoundState = {
      boards: [
        {
          boardLabel: "A", type: "2v2",
          teamA: { playerIds: ["p1", "p2"] },
          teamB: { playerIds: ["p3", "p4"] },
          result: "teamA_win",
        },
        {
          boardLabel: "B", type: "2v2",
          teamA: { playerIds: ["p5", "p6"] },
          teamB: { playerIds: ["p7", "p8"] },
          result: "teamA_win",
        },
      ],
      bench: [],
      streaks: [{ playerIds: ["p1", "p2"], count: 2 }],
    };

    const result = nextRound(prev, ids(8), 2, noShuffle);

    // p1 and p2 must NOT be teammates
    expect(teammates(result.boards, "p1", "p2")).toBe(false);

    // Their streak must be gone
    const still = result.streaks.find(
      (s) => s.playerIds.includes("p1") && s.playerIds.includes("p2")
    );
    expect(still).toBeUndefined();
  });

  it("Board B winners are promoted to Board A after streak-3 split", () => {
    const prev: RoundState = {
      boards: [
        {
          boardLabel: "A", type: "2v2",
          teamA: { playerIds: ["p1", "p2"] },
          teamB: { playerIds: ["p3", "p4"] },
          result: "teamA_win",
        },
        {
          boardLabel: "B", type: "2v2",
          teamA: { playerIds: ["p5", "p6"] },
          teamB: { playerIds: ["p7", "p8"] },
          result: "teamA_win",
        },
      ],
      bench: [],
      streaks: [{ playerIds: ["p1", "p2"], count: 2 }],
    };

    const result = nextRound(prev, ids(8), 2, noShuffle);

    // p5 and p6 (Board B winners) should be on Board A
    const boardA = onBoard(result.boards, "A");
    expect(boardA).toContain("p5");
    expect(boardA).toContain("p6");
  });
});

// ── Section 13 scenario 3: streak < 3, pair stays ────────────────────────────

describe("Board A streak < 3 — pair stays — DESIGN.md §6 Step 1", () => {
  it("winning pair with streak 1 stays on Board A as teammates (streak becomes 2)", () => {
    const prev: RoundState = {
      boards: [
        {
          boardLabel: "A", type: "2v2",
          teamA: { playerIds: ["p1", "p2"] },
          teamB: { playerIds: ["p3", "p4"] },
          result: "teamA_win",
        },
        {
          boardLabel: "B", type: "1v1",
          teamA: { playerIds: ["p5"] },
          teamB: { playerIds: ["p6"] },
          result: "teamA_win",
        },
      ],
      bench: [],
      streaks: [{ playerIds: ["p1", "p2"], count: 1 }],
    };

    const result = nextRound(prev, ids(6), 2, noShuffle);

    expect(teammates(result.boards, "p1", "p2")).toBe(true);

    const streak = result.streaks.find(
      (s) => s.playerIds.includes("p1") && s.playerIds.includes("p2")
    );
    expect(streak?.count).toBe(2);
  });

  it("first win on Board A starts streak at 1", () => {
    const prev: RoundState = {
      boards: [
        {
          boardLabel: "A", type: "2v2",
          teamA: { playerIds: ["p1", "p2"] },
          teamB: { playerIds: ["p3", "p4"] },
          result: "teamA_win",
        },
        {
          boardLabel: "B", type: "1v1",
          teamA: { playerIds: ["p5"] },
          teamB: { playerIds: ["p6"] },
          result: "teamA_win",
        },
      ],
      bench: [],
      streaks: [], // no prior streak
    };

    const result = nextRound(prev, ids(6), 2, noShuffle);

    expect(teammates(result.boards, "p1", "p2")).toBe(true);
    const streak = result.streaks.find(
      (s) => s.playerIds.includes("p1") && s.playerIds.includes("p2")
    );
    expect(streak?.count).toBe(1);
  });
});

// ── Section 13 scenario 4: solo promotion — streak 0 ────────────────────────

describe("solo winner from 1v1 promoted with streak 0 — DESIGN.md §13", () => {
  it("solo winner from Board C promoted to Board B, not given a streak", () => {
    // 10 players, 3 boards: A=2v2, B=2v2, C=1v1
    const prev: RoundState = {
      boards: [
        {
          boardLabel: "A", type: "2v2",
          teamA: { playerIds: ["p1", "p2"] },
          teamB: { playerIds: ["p3", "p4"] },
          result: "teamB_win",
        },
        {
          boardLabel: "B", type: "2v2",
          teamA: { playerIds: ["p5", "p6"] },
          teamB: { playerIds: ["p7", "p8"] },
          result: "teamA_win",
        },
        {
          boardLabel: "C", type: "1v1",
          teamA: { playerIds: ["p9"] },
          teamB: { playerIds: ["p10"] },
          result: "teamA_win",
        },
      ],
      bench: [],
      streaks: [],
    };

    const result = nextRound(prev, ids(10), 3, noShuffle);

    // p9 should be on Board B (promoted from C)
    expect(onBoard(result.boards, "B")).toContain("p9");

    // p9 should have no streak entry
    expect(
      result.streaks.find((s) => s.playerIds.includes("p9"))
    ).toBeUndefined();
  });
});

// ── Section 13 scenario 5: double forfeit ────────────────────────────────────

describe("double forfeit — DESIGN.md §13", () => {
  it("double forfeit on Board A: all 4 players go to pool, no streak", () => {
    const prev: RoundState = {
      boards: [
        {
          boardLabel: "A", type: "2v2",
          teamA: { playerIds: ["p1", "p2"] },
          teamB: { playerIds: ["p3", "p4"] },
          result: "double_forfeit",
        },
        {
          boardLabel: "B", type: "1v1",
          teamA: { playerIds: ["p5"] },
          teamB: { playerIds: ["p6"] },
          result: "teamA_win",
        },
      ],
      bench: [],
      streaks: [],
    };

    const result = nextRound(prev, ids(6), 2, noShuffle);

    // All 6 players placed or benched
    expect(allPlaced(result.boards).length + result.bench.length).toBe(6);

    // Board B winner (p5) promoted to Board A
    expect(onBoard(result.boards, "A")).toContain("p5");

    // No streak produced from forfeit
    expect(result.streaks.length).toBe(0);
  });
});

// ── Edge case: streak carries C → B → A ──────────────────────────────────────

describe("streak carries through promotion — DESIGN.md §6 Step 2", () => {
  it("pair carrying streak 1 from Board B wins again → streak 2 on Board A", () => {
    // 12 players, 3 boards: A=2v2, B=2v2, C=2v2
    // p9p10 have prevStreak=1 (won Board C last round, now on Board B)
    const prev: RoundState = {
      boards: [
        {
          boardLabel: "A", type: "2v2",
          teamA: { playerIds: ["p1", "p2"] },
          teamB: { playerIds: ["p3", "p4"] },
          result: "teamA_win",
        },
        {
          boardLabel: "B", type: "2v2",
          teamA: { playerIds: ["p9", "p10"] },
          teamB: { playerIds: ["p5", "p6"] },
          result: "teamA_win",
        },
        {
          boardLabel: "C", type: "2v2",
          teamA: { playerIds: ["p7", "p8"] },
          teamB: { playerIds: ["p11", "p12"] },
          result: "teamA_win",
        },
      ],
      bench: [],
      streaks: [
        { playerIds: ["p1", "p2"], count: 1 },
        { playerIds: ["p9", "p10"], count: 1 },
      ],
    };

    const result = nextRound(prev, ids(12), 3, noShuffle);

    // p9p10 promoted to Board A
    expect(onBoard(result.boards, "A")).toContain("p9");
    expect(onBoard(result.boards, "A")).toContain("p10");

    const streak = result.streaks.find(
      (s) => s.playerIds.includes("p9") && s.playerIds.includes("p10")
    );
    expect(streak?.count).toBe(2);
  });

  it("pair with streak 2 on Board A wins → streak 3 → split next round", () => {
    // Simulate: p9p10 arrived at Board A with streak 2, win → split
    const prev: RoundState = {
      boards: [
        {
          boardLabel: "A", type: "2v2",
          teamA: { playerIds: ["p9", "p10"] },
          teamB: { playerIds: ["p1", "p2"] },
          result: "teamA_win",
        },
        {
          boardLabel: "B", type: "2v2",
          teamA: { playerIds: ["p3", "p4"] },
          teamB: { playerIds: ["p5", "p6"] },
          result: "teamA_win",
        },
        {
          boardLabel: "C", type: "2v2",
          teamA: { playerIds: ["p7", "p8"] },
          teamB: { playerIds: ["p11", "p12"] },
          result: "teamA_win",
        },
      ],
      bench: [],
      streaks: [{ playerIds: ["p9", "p10"], count: 2 }],
    };

    const result = nextRound(prev, ids(12), 3, noShuffle);

    // p9 and p10 must not be teammates
    expect(teammates(result.boards, "p9", "p10")).toBe(false);

    // No streak remaining for them
    expect(
      result.streaks.find(
        (s) => s.playerIds.includes("p9") && s.playerIds.includes("p10")
      )
    ).toBeUndefined();
  });
});

// ── Invariant: all players accounted for ─────────────────────────────────────

describe("all players accounted for — invariant", () => {
  const scenarios: Array<[number, number, string]> = [
    [6, 2, "teamA_win"],
    [7, 2, "teamB_win"],
    [8, 2, "teamA_win"],
    [10, 3, "teamA_win"],
    [12, 3, "teamB_win"],
  ];

  for (const [playerCount, boardCount, result] of scenarios) {
    it(`${playerCount} players, ${boardCount} boards — all placed or benched`, () => {
      // Build a minimal prev round using allocateFixtures output shape
      const playerIds = ids(playerCount);
      // Simple prev: Board A 2v2 teamA wins, Board B 1v1 or 2v2 teamA wins, etc.
      // We'll just build a plausible prev manually for common counts
      const prev = buildSimplePrev(playerIds, boardCount, result as "teamA_win" | "teamB_win");
      const res = nextRound(prev, playerIds, boardCount, noShuffle);
      expect(allPlaced(res.boards).length + res.bench.length).toBe(playerCount);
    });
  }
});

// ── special_win treated same as normal win ────────────────────────────────────

describe("special_win_A / special_win_B treated as normal win for rotation", () => {
  it("special_win_A winner pair stays on Board A and gains streak", () => {
    const prev: RoundState = {
      boards: [
        {
          boardLabel: "A", type: "2v2",
          teamA: { playerIds: ["p1", "p2"] },
          teamB: { playerIds: ["p3", "p4"] },
          result: "special_win_A",
        },
        {
          boardLabel: "B", type: "1v1",
          teamA: { playerIds: ["p5"] },
          teamB: { playerIds: ["p6"] },
          result: "teamA_win",
        },
      ],
      bench: [],
      streaks: [],
    };

    const result = nextRound(prev, ids(6), 2, noShuffle);

    expect(teammates(result.boards, "p1", "p2")).toBe(true);
    const streak = result.streaks.find(
      (s) => s.playerIds.includes("p1") && s.playerIds.includes("p2")
    );
    expect(streak?.count).toBe(1);
  });
});

// ── helper for invariant tests ───────────────────────────────────────────────

function buildSimplePrev(
  playerIds: string[],
  boardCount: number,
  result: "teamA_win" | "teamB_win"
): RoundState {
  // Mirrors allocateFixtures logic: Board A = 2v2, remaining boards = 2v2 or 1v1
  const boards: RoundState["boards"] = [];
  let cursor = 0;
  const labels = ["A", "B", "C", "D", "E"];
  let remaining = playerIds.length;

  for (let i = 0; i < boardCount; i++) {
    const label = labels[i];
    if (i === 0 || remaining >= 4) {
      boards.push({
        boardLabel: label,
        type: "2v2",
        teamA: { playerIds: [playerIds[cursor], playerIds[cursor + 1]] },
        teamB: { playerIds: [playerIds[cursor + 2], playerIds[cursor + 3]] },
        result,
      });
      cursor += 4;
      remaining -= 4;
    } else if (remaining >= 2) {
      boards.push({
        boardLabel: label,
        type: "1v1",
        teamA: { playerIds: [playerIds[cursor]] },
        teamB: { playerIds: [playerIds[cursor + 1]] },
        result,
      });
      cursor += 2;
      remaining -= 2;
    }
  }

  return {
    boards,
    bench: playerIds.slice(cursor),
    streaks: [],
  };
}
