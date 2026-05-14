"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { clubs } from "./db/schema";

export async function createClub(name: string, slug: string) {
  const [club] = await db
    .insert(clubs)
    .values({ name, slug: slug.toLowerCase().replace(/\s+/g, "-") })
    .returning();
  revalidatePath("/admin");
  return club;
}

export async function getAllClubs() {
  return db.select().from(clubs).orderBy(clubs.name);
}

export async function getClubById(id: string) {
  const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
  return club ?? null;
}

export async function getClubBySlug(slug: string) {
  const [club] = await db.select().from(clubs).where(eq(clubs.slug, slug));
  return club ?? null;
}
