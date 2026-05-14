"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, type UserRole } from "./db/schema";

export async function createUser({
  email,
  password,
  name,
  role,
  clubId,
  playerId,
}: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  clubId: string | null;
  playerId?: string | null;
}) {
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
      clubId: clubId ?? undefined,
      playerId: playerId ?? undefined,
    })
    .returning();
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));
  return user ?? null;
}

export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));
}

export async function getUsersByClub(clubId: string) {
  return db.select().from(users).where(eq(users.clubId, clubId));
}
