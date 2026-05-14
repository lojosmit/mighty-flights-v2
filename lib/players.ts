"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/index";
import { players, type NewPlayer, type Player } from "./db/schema";

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
