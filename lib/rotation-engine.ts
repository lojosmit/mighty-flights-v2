// Pure rotation engine — no DB, no side effects. Per DESIGN.md Section 6.

import { allocateBoardSpecs } from "./fixture-utils";
import type { AssignedBoard } from "./fixture-utils";
import type { FixtureResult } from "./db/schema";

export type PairStreak = {
  playerIds: [string, string];
  count: number;
};

export type CompletedBoard = {
  boardLabel: string;
  type: "2v2" | "1v1";
  teamA: { playerIds: string[] };
  teamB: { playerIds: string[] };
  result: FixtureResult;
};

export type RoundState = {
  boards: CompletedBoard[];
  bench: string[];
  streaks: PairStreak[];
};

export type NextRoundResult = {
  boards: AssignedBoard[];
  bench: string[];
  streaks: PairStreak[];
};

// ── internal helpers ─────────────────────────────────────────────────────────

const LABEL_ORDER = ["A", "B", "C", "D", "E"] as const;

function labelIndex(label: string): number {
  return LABEL_ORDER.indexOf(label as (typeof LABEL_ORDER)[number]);
}

function prevLabel(label: string): string | null {
  const idx = labelIndex(label);
  return idx > 0 ? LABEL_ORDER[idx - 1] : null;
}

function getWinners(board: CompletedBoard): string[] {
  switch (board.result) {
    case "teamA_win":
    case "special_win_A":
      return board.teamA.playerIds;
    case "teamB_win":
    case "special_win_B":
      return board.teamB.playerIds;
    default:
      return [];
  }
}

function getPairStreak(streaks: PairStreak[], ids: string[]): number {
  if (ids.length !== 2) return 0;
  const [a, b] = [...ids].sort();
  return (
    streaks.find((s) => {
      const [sa, sb] = [...s.playerIds].sort();
      return sa === a && sb === b;
    })?.count ?? 0
  );
}

function fisherYates<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Pure rotation function. Takes the completed previous round and returns
 * the next round's board assignments, bench, and updated streaks.
 *
 * @param rng  Optional deterministic RNG — used for tests. Defaults to Math.random.
 */
export function nextRound(
  prev: RoundState,
  allPlayerIds: string[],
  boardCount: number,
  rng: () => number = Math.random
): NextRoundResult {
  const specs = allocateBoardSpecs(allPlayerIds.length, boardCount);
  const specMap = new Map(specs.map((s) => [s.boardLabel, s]));

  // boardLabel → playerIds already committed for the next round
  const slots = new Map<string, string[]>();
  const placed = new Set<string>();
  const newStreaks: PairStreak[] = [];

  // ── Step 1: Resolve Board A ──────────────────────────────────────────────

  const boardA = prev.boards.find((b) => b.boardLabel === "A");

  if (boardA && boardA.result !== "double_forfeit") {
    const winners = getWinners(boardA);
    if (winners.length === 2) {
      const prevStreak = getPairStreak(prev.streaks, winners);
      const newStreak = prevStreak + 1;

      if (newStreak < 3) {
        // Pair stays on Board A as teammates
        slots.set("A", [...winners]);
        winners.forEach((id) => placed.add(id));
        newStreaks.push({
          playerIds: winners as [string, string],
          count: newStreak,
        });
      }
      // newStreak === 3: pair is split — both fall into pool (do nothing here)
    }
  }

  // ── Step 2: Promote winners from lower boards (bottom-up: C → B → A) ────

  const lowerBoards = prev.boards
    .filter((b) => b.boardLabel !== "A")
    .sort((a, b) => labelIndex(b.boardLabel) - labelIndex(a.boardLabel)); // descending

  for (const board of lowerBoards) {
    if (board.result === "double_forfeit") continue;

    const winners = getWinners(board);
    if (winners.length === 0) continue;

    const target = prevLabel(board.boardLabel);
    if (!target || !specMap.has(target)) continue;

    const targetSpec = specMap.get(target)!;
    const existing = slots.get(target) ?? [];
    const slotsLeft = targetSpec.slots - existing.length;

    if (winners.length === 2) {
      // Pair promoted — carry streak + 1 for this win
      if (slotsLeft >= 2) {
        const prevStreak = getPairStreak(prev.streaks, winners);
        const newStreak = prevStreak + 1;
        slots.set(target, [...existing, ...winners]);
        winners.forEach((id) => placed.add(id));
        newStreaks.push({
          playerIds: winners as [string, string],
          count: newStreak,
        });
      }
    } else if (winners.length === 1) {
      // Solo winner from 1v1 — promoted with streak 0 (needs a partner first)
      if (slotsLeft >= 1) {
        slots.set(target, [...existing, winners[0]]);
        placed.add(winners[0]);
        // No streak recorded for a solo
      }
    }
  }

  // ── Step 3: Build available pool ─────────────────────────────────────────

  const pool = allPlayerIds.filter((id) => !placed.has(id));

  // ── Step 4 + 5: Fill remaining slots ─────────────────────────────────────
  // Benched players MUST fill first (mandatory), then shuffled regular pool.
  // Fill order: lowest board first (C → B → A).

  const benchedInPool = prev.bench.filter((id) => pool.includes(id));
  const regularPool = fisherYates(
    pool.filter((id) => !prev.bench.includes(id)),
    rng
  );
  const fillQueue = [...benchedInPool, ...regularPool];

  const fillOrder = [...specs].sort(
    (a, b) => labelIndex(b.boardLabel) - labelIndex(a.boardLabel) // C first
  );

  for (const spec of fillOrder) {
    const existing = slots.get(spec.boardLabel) ?? [];
    const needed = spec.slots - existing.length;
    if (needed <= 0) continue;
    const taken = fillQueue.splice(0, needed);
    slots.set(spec.boardLabel, [...existing, ...taken]);
  }

  // ── Step 6: New bench ────────────────────────────────────────────────────

  const newBench = fillQueue; // whatever remains after all boards filled

  // ── Convert slots → AssignedBoard[] ──────────────────────────────────────

  const boards: AssignedBoard[] = specs.map((spec) => {
    const players = slots.get(spec.boardLabel) ?? [];
    if (spec.type === "2v2") {
      return {
        boardLabel: spec.boardLabel,
        type: "2v2",
        teamA: { playerIds: [players[0] ?? "", players[1] ?? ""] },
        teamB: { playerIds: [players[2] ?? "", players[3] ?? ""] },
      };
    }
    return {
      boardLabel: spec.boardLabel,
      type: "1v1",
      teamA: { playerIds: [players[0] ?? ""] },
      teamB: { playerIds: [players[1] ?? ""] },
    };
  });

  return { boards, bench: newBench, streaks: newStreaks };
}
