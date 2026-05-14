"use server";

import { randomUUID } from "crypto";
import { and, eq, isNull, gt, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { inviteTokens, players, users, type UserRole } from "./db/schema";
import { createUser } from "./users";

export async function createInviteToken({
  clubId,
  role,
  playerId,
  ttlHours = 72,
}: {
  clubId: string;
  role: Exclude<UserRole, "super_admin">;
  playerId?: string;
  ttlHours?: number;
}) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  const [invite] = await db
    .insert(inviteTokens)
    .values({ token, clubId, role, playerId, expiresAt })
    .returning();

  revalidatePath("/admin");
  return invite;
}

export async function getValidInviteToken(token: string) {
  const [invite] = await db
    .select()
    .from(inviteTokens)
    .where(
      and(
        eq(inviteTokens.token, token),
        isNull(inviteTokens.usedAt),
        gt(inviteTokens.expiresAt, new Date())
      )
    );
  return invite ?? null;
}

export async function consumeInviteAndRegister({
  token,
  name,
  email,
  password,
}: {
  token: string;
  name: string;
  email: string;
  password: string;
}): Promise<{ success: true; role: UserRole } | { success: false; error: string }> {
  const invite = await getValidInviteToken(token);
  if (!invite) return { success: false, error: "Invite link is invalid or has expired." };

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()));
  if (existing.length > 0) return { success: false, error: "An account with that email already exists." };

  const user = await createUser({
    email,
    password,
    name,
    role: invite.role,
    clubId: invite.clubId,
    playerId: invite.playerId ?? null,
  });

  // If the invite was linked to a player profile, bind the user_id
  if (invite.playerId) {
    await db
      .update(players)
      .set({ userId: user.id, email: email.toLowerCase() })
      .where(eq(players.id, invite.playerId));
  } else if (invite.role === "player") {
    // Auto-create a player profile so the user appears in game night selection
    const [{ maxRank }] = await db
      .select({ maxRank: max(players.seasonRank) })
      .from(players)
      .where(eq(players.clubId, invite.clubId));
    const seasonRank = (maxRank ?? 0) + 1;
    const [newPlayer] = await db
      .insert(players)
      .values({ name, email: email.toLowerCase(), clubId: invite.clubId, userId: user.id, seasonRank })
      .returning();
    await db.update(users).set({ playerId: newPlayer.id }).where(eq(users.id, user.id));
  }

  // Mark token as used
  await db
    .update(inviteTokens)
    .set({ usedAt: new Date() })
    .where(eq(inviteTokens.id, invite.id));

  return { success: true, role: invite.role };
}

export async function getInvitesByClub(clubId: string) {
  return db
    .select()
    .from(inviteTokens)
    .where(eq(inviteTokens.clubId, clubId))
    .orderBy(inviteTokens.createdAt);
}
