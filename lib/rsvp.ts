"use server";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { leagueNights, rsvps, users } from "./db/schema";

export async function setLeagueNightRsvp(leagueNightId: string, deadline: Date) {
  const token = randomUUID();
  const [night] = await db
    .update(leagueNights)
    .set({ rsvpDeadline: deadline, rsvpToken: token })
    .where(eq(leagueNights.id, leagueNightId))
    .returning();
  revalidatePath(`/league-night/${leagueNightId}`);
  return { night, token };
}

export async function getLeagueNightByRsvpToken(token: string) {
  const [night] = await db
    .select()
    .from(leagueNights)
    .where(eq(leagueNights.rsvpToken, token));
  return night ?? null;
}

export async function submitRsvp(leagueNightId: string, userId: string) {
  const existing = await db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.leagueNightId, leagueNightId), eq(rsvps.userId, userId)));

  if (existing.length > 0) return { alreadyRsvped: true };

  await db.insert(rsvps).values({ leagueNightId, userId });

  // Add this user's player profile to the night's attendingPlayerIds
  const [user] = await db.select({ playerId: users.playerId }).from(users).where(eq(users.id, userId));
  if (user?.playerId) {
    const [night] = await db.select({ attendingPlayerIds: leagueNights.attendingPlayerIds }).from(leagueNights).where(eq(leagueNights.id, leagueNightId));
    if (night && !night.attendingPlayerIds.includes(user.playerId)) {
      await db
        .update(leagueNights)
        .set({ attendingPlayerIds: [...night.attendingPlayerIds, user.playerId] })
        .where(eq(leagueNights.id, leagueNightId));
    }
  }

  revalidatePath(`/league-night/${leagueNightId}`);
  return { alreadyRsvped: false };
}

export async function getRsvpsForNight(leagueNightId: string) {
  return db.select().from(rsvps).where(eq(rsvps.leagueNightId, leagueNightId));
}
