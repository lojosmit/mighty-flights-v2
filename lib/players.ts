"use server";

import { and, eq, max, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/index";
import { players, users, type NewPlayer, type Player } from "./db/schema";

export async function getPlayers(clubId?: string | null): Promise<Player[]> {
  if (clubId) {
    return db.select().from(players).where(eq(players.clubId, clubId)).orderBy(players.seasonRank);
  }
  return db.select().from(players).orderBy(players.seasonRank);
}

export async function createPlayer(
  data: Pick<NewPlayer, "name" | "email">,
  clubId?: string | null
): Promise<Player> {
  const conditions = clubId ? [eq(players.clubId, clubId)] : [];
  const [{ maxRank }] = await db
    .select({ maxRank: max(players.seasonRank) })
    .from(players)
    .where(conditions.length ? and(...conditions) : undefined);
  const seasonRank = (maxRank ?? 0) + 1;
  const [player] = await db
    .insert(players)
    .values({ ...data, seasonRank, clubId: clubId ?? undefined })
    .returning();
  revalidatePath("/players");
  return player;
}

export async function updatePlayer(
  id: string,
  data: Pick<NewPlayer, "name" | "seasonRank" | "email">
): Promise<Player> {
  const [player] = await db
    .update(players)
    .set(data)
    .where(eq(players.id, id))
    .returning();
  revalidatePath("/players");
  return player;
}

export async function deletePlayer(id: string): Promise<void> {
  await db.delete(players).where(eq(players.id, id));
  revalidatePath("/players");
}

// Ensures every user in a club has a linked players record.
// Safe to call on every page load — no-ops when all users are already linked.
export async function syncClubPlayers(clubId: string): Promise<void> {
  const [clubUsers, existingPlayers] = await Promise.all([
    db.select().from(users).where(eq(users.clubId, clubId)),
    db.select({ userId: players.userId }).from(players).where(eq(players.clubId, clubId)),
  ]);

  const linkedUserIds = new Set(existingPlayers.map((p) => p.userId).filter(Boolean));
  const unlinked = clubUsers.filter((u) => !linkedUserIds.has(u.id));
  if (unlinked.length === 0) return;

  const [{ maxRank }] = await db
    .select({ maxRank: max(players.seasonRank) })
    .from(players)
    .where(eq(players.clubId, clubId));
  let nextRank = (maxRank ?? 0) + 1;

  for (const user of unlinked) {
    const [newPlayer] = await db
      .insert(players)
      .values({ name: user.name, email: user.email, clubId, userId: user.id, seasonRank: nextRank++ })
      .returning();
    await db.update(users).set({ playerId: newPlayer.id }).where(eq(users.id, user.id));
  }
}
