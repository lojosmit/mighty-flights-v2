"use server";

import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/index";
import { clubs, leagueNights, type LeagueNight } from "./db/schema";
import { auth } from "@/auth";

async function requireManager() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { role } = session.user;
  if (role !== "super_admin" && role !== "club_manager") throw new Error("Forbidden");
}

async function requireGameRole() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { role } = session.user;
  if (!["super_admin", "club_manager", "host"].includes(role)) throw new Error("Forbidden");
}

export type LeagueNightWithClub = LeagueNight & { clubName: string | null };

export async function createLeagueNight({
  attendingPlayerIds,
  boardCount,
  clubId,
  date,
  enableRsvp,
  rsvpDeadline,
  hostUserId,
}: {
  attendingPlayerIds: string[];
  boardCount: number;
  clubId?: string | null;
  date?: Date;
  enableRsvp?: boolean;
  rsvpDeadline?: Date;
  hostUserId?: string | null;
}): Promise<LeagueNight> {
  await requireGameRole();
  const rsvpToken = (enableRsvp || rsvpDeadline) ? crypto.randomUUID() : undefined;

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

export async function updateLeagueNight(
  id: string,
  data: {
    date?: Date;
    boardCount?: number;
    hostUserId?: string | null;
  }
): Promise<void> {
  await requireManager();
  await db
    .update(leagueNights)
    .set({
      ...(data.date !== undefined ? { date: data.date } : {}),
      ...(data.boardCount !== undefined ? { boardCount: data.boardCount } : {}),
      ...(data.hostUserId !== undefined ? { hostUserId: data.hostUserId } : {}),
    })
    .where(eq(leagueNights.id, id));
  revalidatePath(`/league-night/${id}`);
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
