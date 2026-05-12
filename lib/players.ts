"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/index";
import { players, type NewPlayer, type Player } from "./db/schema";

export async function getPlayers(): Promise<Player[]> {
  return db.select().from(players).orderBy(players.seasonRank);
}

export async function createPlayer(
  data: Pick<NewPlayer, "name" | "seasonRank">
): Promise<Player> {
  const [player] = await db.insert(players).values(data).returning();
  revalidatePath("/players");
  return player;
}

export async function updatePlayer(
  id: string,
  data: Pick<NewPlayer, "name" | "seasonRank">
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
