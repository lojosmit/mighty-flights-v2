"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/index";
import { leagueNights, type LeagueNight } from "./db/schema";

export async function createLeagueNight(
  attendingPlayerIds: string[],
  boardCount: number
): Promise<LeagueNight> {
  const [night] = await db
    .insert(leagueNights)
    .values({ attendingPlayerIds, boardCount, status: "setup" })
    .returning();
  revalidatePath("/league-night");
  return night;
}

export async function getLeagueNight(id: string): Promise<LeagueNight | null> {
  const [night] = await db
    .select()
    .from(leagueNights)
    .where(eq(leagueNights.id, id));
  return night ?? null;
}

export async function getActiveLeagueNight(): Promise<LeagueNight | null> {
  const [night] = await db
    .select()
    .from(leagueNights)
    .where(eq(leagueNights.status, "in_progress"));
  return night ?? null;
}
