"use server";

import { db } from "./db";
import * as schema from "./db/schema";
import { eq, isNull, or } from "drizzle-orm";

export async function createRegistrationRequest(data: {
  name: string;
  email: string;
  leagueNightId?: string;
  clubId?: string;
}) {
  const [req] = await db
    .insert(schema.registrationRequests)
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
  const rows = await db
    .select()
    .from(schema.registrationRequests)
    .where(
      clubId
        ? eq(schema.registrationRequests.clubId, clubId)
        : or(
            isNull(schema.registrationRequests.clubId),
            eq(schema.registrationRequests.fulfilled, false)
          )
    );
  return rows.filter((r) => !r.fulfilled);
}

export async function fulfillRegistrationRequest(id: string) {
  await db
    .update(schema.registrationRequests)
    .set({ fulfilled: true })
    .where(eq(schema.registrationRequests.id, id));
}
