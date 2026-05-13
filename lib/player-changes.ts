"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/index";
import { leagueNights, rounds, fixtures } from "./db/schema";
import { locatePlayer, boardReductionNeeded } from "./player-change-utils";

// Add a late-arriving player. They join the current round's bench so they
// play next round under the mandatory bench rule.
export async function addPlayerToNight(
  leagueNightId: string,
  playerId: string
): Promise<void> {
  const [night] = await db
    .select()
    .from(leagueNights)
    .where(eq(leagueNights.id, leagueNightId));
  if (!night || night.attendingPlayerIds.includes(playerId)) return;

  await db
    .update(leagueNights)
    .set({ attendingPlayerIds: [...night.attendingPlayerIds, playerId] })
    .where(eq(leagueNights.id, leagueNightId));

  const allRounds = await db
    .select()
    .from(rounds)
    .where(eq(rounds.leagueNightId, leagueNightId))
    .orderBy(rounds.roundNumber);

  if (allRounds.length > 0) {
    const current = allRounds[allRounds.length - 1];
    await db
      .update(rounds)
      .set({ bench: [...current.bench, playerId] })
      .where(eq(rounds.id, current.id));
  }

  revalidatePath(`/league-night/${leagueNightId}`);
}

export type RemovePlayerResult =
  | { status: "removed" }
  | { status: "board_reduction_required"; boardLabel: string };

// Remove a leaving player. If they are on an active (in_progress) board,
// that fixture is forfeited and the caller must prompt for board count reduction.
export async function removePlayerFromNight(
  leagueNightId: string,
  playerId: string
): Promise<RemovePlayerResult> {
  const [night] = await db
    .select()
    .from(leagueNights)
    .where(eq(leagueNights.id, leagueNightId));
  if (!night) return { status: "removed" };

  const allRounds = await db
    .select()
    .from(rounds)
    .where(eq(rounds.leagueNightId, leagueNightId))
    .orderBy(rounds.roundNumber);

  let boardLabel: string | undefined;

  if (allRounds.length > 0) {
    const current = allRounds[allRounds.length - 1];
    const currentFixtures = await db
      .select()
      .from(fixtures)
      .where(eq(fixtures.roundId, current.id));

    const location = locatePlayer(currentFixtures, current.bench, playerId);

    if (location.status === "bench") {
      await db
        .update(rounds)
        .set({ bench: current.bench.filter((id) => id !== playerId) })
        .where(eq(rounds.id, current.id));
    } else if (location.status === "active_board") {
      await db
        .update(fixtures)
        .set({ result: "double_forfeit", forfeitReason: "player_removed" })
        .where(eq(fixtures.id, location.fixtureId));
      boardLabel = location.boardLabel;
    }
  }

  await db
    .update(leagueNights)
    .set({
      attendingPlayerIds: night.attendingPlayerIds.filter((id) => id !== playerId),
    })
    .where(eq(leagueNights.id, leagueNightId));

  revalidatePath(`/league-night/${leagueNightId}`);

  const newCount = night.attendingPlayerIds.length - 1;
  if (boardLabel && boardReductionNeeded(newCount, night.boardCount)) {
    return { status: "board_reduction_required", boardLabel };
  }
  return { status: "removed" };
}

// Reduce the night's board count by one. Called after a player removal that
// left the current board count invalid for the remaining player count.
export async function reduceBoardCount(leagueNightId: string): Promise<void> {
  const [night] = await db
    .select()
    .from(leagueNights)
    .where(eq(leagueNights.id, leagueNightId));
  if (!night || night.boardCount <= 1) return;

  await db
    .update(leagueNights)
    .set({ boardCount: night.boardCount - 1 })
    .where(eq(leagueNights.id, leagueNightId));

  revalidatePath(`/league-night/${leagueNightId}`);
}
