"use server";

import { getTableColumns, eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { registrationRequests, clubs } from "./db/schema";

export async function createRegistrationRequest(data: {
  name: string;
  email: string;
  leagueNightId?: string;
  clubId?: string;
}) {
  const [req] = await db
    .insert(registrationRequests)
    .values({
      name: data.name,
      email: data.email,
      leagueNightId: data.leagueNightId ?? null,
      clubId: data.clubId ?? null,
    })
    .returning();
  return req;
}

export async function getPendingRegistrationRequests(clubId?: string) {
  const cols = getTableColumns(registrationRequests);
  const q = db
    .select({ ...cols, clubName: clubs.name })
    .from(registrationRequests)
    .leftJoin(clubs, eq(registrationRequests.clubId, clubs.id))
    .where(
      clubId
        ? and(eq(registrationRequests.clubId, clubId), eq(registrationRequests.fulfilled, false))
        : eq(registrationRequests.fulfilled, false)
    );
  return q;
}

export async function fulfillRegistrationRequest(id: string) {
  await db
    .update(registrationRequests)
    .set({ fulfilled: true })
    .where(eq(registrationRequests.id, id));
  revalidatePath("/admin");
}

export async function rejectRegistrationRequest(id: string) {
  await db
    .update(registrationRequests)
    .set({ fulfilled: true })
    .where(eq(registrationRequests.id, id));
  revalidatePath("/admin");
}
