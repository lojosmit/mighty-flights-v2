"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "./db";
import { players, users, type UserRole } from "./db/schema";
import { isValidEmail } from "./validate";

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
      mustResetPassword: true,
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
  const session = await auth();
  if (!session) throw new Error("Not authenticated");
  // Allow only the account owner or a super_admin
  if (session.user.id !== userId && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));
}

export async function getUsersByClub(clubId: string) {
  return db.select().from(users).where(eq(users.clubId, clubId));
}

export async function updateUserRole(id: string, role: UserRole): Promise<void> {
  await db.update(users).set({ role }).where(eq(users.id, id));
  revalidatePath("/admin");
}

export async function completeAccountSetup(
  newEmail: string,
  newPassword: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const userId = session.user.id;
  const trimmedEmail = newEmail.trim().toLowerCase();

  if (!isValidEmail(trimmedEmail)) return { error: "Please enter a valid email address." };

  // Check email not taken by another user
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, trimmedEmail));
  if (existing && existing.id !== userId) {
    return { error: "That email address is already in use." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ email: trimmedEmail, passwordHash, mustResetPassword: false })
    .where(eq(users.id, userId));

  return {};
}

export async function deleteUser(id: string): Promise<void> {
  await db.update(players).set({ userId: null }).where(eq(players.userId, id));
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin");
}
