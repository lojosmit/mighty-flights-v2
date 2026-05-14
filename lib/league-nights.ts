"use server";

import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/index";
import { clubs, leagueNights, type LeagueNight } from "./db/schema";

export type LeagueNightWithClub = LeagueNight & { clubName: string | null };

export async function createLeagueNight({
  attendingPlayerIds,
  boardCount,
  clubId,
  date,
  rsvpDeadline,
  hostUserId,
}: {
  attendingPlayerIds: string[];
  boardCount: number;
  clubId?: string | null;
  date?: Date;
  rsvpDeadline?: Date;
  hostUserId?: string | null;
}): Promise<LeagueNight> {
  const rsvpToken = rsvpDeadline ? crypto.randomUUID() : undefined;

  const [night] = await db
    .insert(leagueNights)
    .values({
      attendingPlayerIds,
      boardCount,
      status: "setup",
      clubId: clubId ?? undefined,
      date: date ?? new Date(),
      rsvpDeadline: rsvpDeadline ?? undefined,
      rsvpToken: rsvpToken ?? undefined,
      hostUserId: hostUserId ?? undefined,
    })
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

export async function getAllLeagueNights(clubId?: string | null): Promise<LeagueNightWithClub[]> {
  const cols = getTableColumns(leagueNights);
  const q = db
    .select({ ...cols, clubName: clubs.name })
    .from(leagueNights)
    .leftJoin(clubs, eq(leagueNights.clubId, clubs.id))
    .orderBy(desc(leagueNights.createdAt));

  if (clubId) {
    return q.where(eq(leagueNights.clubId, clubId));
  }
  return q;
}
