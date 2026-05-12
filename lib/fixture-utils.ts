// Pure functions — no DB, no side effects. Per DESIGN.md Section 5.

const BOARD_LABELS = ["A", "B", "C", "D", "E"] as const;

export type BoardSpec = {
  boardLabel: string;
  type: "2v2" | "1v1";
  slots: 4 | 2;
};

export type AssignedBoard = {
  boardLabel: string;
  type: "2v2" | "1v1";
  teamA: { playerIds: string[] };
  teamB: { playerIds: string[] };
};

export type AllocationResult = {
  boards: AssignedBoard[];
  bench: string[];
};

// Step 1: determine type + slots per board (no players needed).
export function allocateBoardSpecs(
  playerCount: number,
  boardCount: number
): BoardSpec[] {
  if (playerCount < 4) throw new Error("Board A requires at least 4 players.");

  const specs: BoardSpec[] = [];
  let remaining = playerCount;

  // Board A — always 2v2 per DESIGN.md §5
  specs.push({ boardLabel: "A", type: "2v2", slots: 4 });
  remaining -= 4;

  for (let i = 1; i < boardCount; i++) {
    const label = BOARD_LABELS[i];
    if (remaining >= 4) {
      specs.push({ boardLabel: label, type: "2v2", slots: 4 });
      remaining -= 4;
    } else if (remaining >= 2) {
      specs.push({ boardLabel: label, type: "1v1", slots: 2 });
      remaining -= 2;
    } else {
      break;
    }
  }

  return specs;
}

// Step 2: shuffle players and assign to boards.
export function assignPlayers(
  playerIds: string[],
  specs: BoardSpec[]
): AllocationResult {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const boards: AssignedBoard[] = [];
  let cursor = 0;

  for (const spec of specs) {
    const slice = shuffled.slice(cursor, cursor + spec.slots);
    cursor += spec.slots;

    if (spec.type === "2v2") {
      boards.push({
        boardLabel: spec.boardLabel,
        type: "2v2",
        teamA: { playerIds: [slice[0], slice[1]] },
        teamB: { playerIds: [slice[2], slice[3]] },
      });
    } else {
      boards.push({
        boardLabel: spec.boardLabel,
        type: "1v1",
        teamA: { playerIds: [slice[0]] },
        teamB: { playerIds: [slice[1]] },
      });
    }
  }

  return { boards, bench: shuffled.slice(cursor) };
}

// Convenience: both steps together.
export function allocateFixtures(
  playerIds: string[],
  boardCount: number
): AllocationResult {
  const specs = allocateBoardSpecs(playerIds.length, boardCount);
  return assignPlayers(playerIds, specs);
}

// Swap two player IDs anywhere across the allocation (slot↔slot, slot↔bench).
export function swapPlayers(
  result: AllocationResult,
  idA: string,
  idB: string
): AllocationResult {
  function replaceIn(ids: string[]) {
    return ids.map((id) => (id === idA ? idB : id === idB ? idA : id));
  }

  return {
    bench: replaceIn(result.bench),
    boards: result.boards.map((b) => ({
      ...b,
      teamA: { playerIds: replaceIn(b.teamA.playerIds) },
      teamB: { playerIds: replaceIn(b.teamB.playerIds) },
    })),
  };
}
