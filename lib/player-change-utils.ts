// Pure helpers for mid-night player changes — no DB, no side effects.

import type { Fixture } from "./db/schema";
import { maxBoards } from "./league-night-utils";

export type PlayerLocation =
  | { status: "active_board"; boardLabel: string; fixtureId: string }
  | { status: "bench" }
  | { status: "completed_board" }
  | { status: "not_found" };

export function locatePlayer(
  fixtures: Fixture[],
  bench: string[],
  playerId: string
): PlayerLocation {
  if (bench.includes(playerId)) return { status: "bench" };

  for (const f of fixtures) {
    const onFixture = [...f.teamA.playerIds, ...f.teamB.playerIds].includes(playerId);
    if (!onFixture) continue;
    if (f.result === "in_progress") {
      return { status: "active_board", boardLabel: f.boardLabel, fixtureId: f.id };
    }
    return { status: "completed_board" };
  }

  return { status: "not_found" };
}

// True when removing one player makes the current boardCount invalid for next round.
export function boardReductionNeeded(
  newPlayerCount: number,
  currentBoardCount: number
): boolean {
  return currentBoardCount > maxBoards(newPlayerCount);
}
