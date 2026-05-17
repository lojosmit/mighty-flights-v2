"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/index";
import { leagueNights, payments, players, type MembershipType } from "./db/schema";
import { auth } from "@/auth";

const ANNUAL_FEE = 1000;
const PER_GAME_FEE = 100;

async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== "super_admin") throw new Error("Forbidden");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlayerPaymentSummary = {
  id: string;
  name: string;
  membershipType: MembershipType;
  gamesAttended: number;
  amountOwed: number;
  amountPaid: number;
  balance: number; // positive = ahead, negative = owes
};

export type SeasonFinancials = {
  season: string;
  kittyTotal: number;
  members: PlayerPaymentSummary[];
};

// ── Reads ─────────────────────────────────────────────────────────────────────

export async function getSeasonFinancials(
  clubId: string,
  season: string
): Promise<SeasonFinancials> {
  const clubPlayers = await db
    .select({ id: players.id, name: players.name, membershipType: players.membershipType })
    .from(players)
    .where(eq(players.clubId, clubId));

  if (clubPlayers.length === 0) return { season, kittyTotal: 0, members: [] };

  const playerIds = clubPlayers.map((p) => p.id);

  // Games attended per player this season (filter nights by year)
  const allNights = await db
    .select({ attendingPlayerIds: leagueNights.attendingPlayerIds, date: leagueNights.date })
    .from(leagueNights)
    .where(eq(leagueNights.clubId, clubId));

  const seasonYear = parseInt(season, 10);
  const gamesAttendedMap: Record<string, number> = Object.fromEntries(
    playerIds.map((id) => [id, 0])
  );
  for (const night of allNights) {
    if (new Date(night.date).getFullYear() !== seasonYear) continue;
    for (const pid of night.attendingPlayerIds) {
      if (pid in gamesAttendedMap) gamesAttendedMap[pid]++;
    }
  }

  // Payments this season for club players
  const seasonPayments = await db
    .select({ playerId: payments.playerId, amountRands: payments.amountRands })
    .from(payments)
    .where(and(inArray(payments.playerId, playerIds), eq(payments.season, season)));

  const paidMap: Record<string, number> = Object.fromEntries(playerIds.map((id) => [id, 0]));
  for (const p of seasonPayments) {
    paidMap[p.playerId] = (paidMap[p.playerId] ?? 0) + p.amountRands;
  }

  const members: PlayerPaymentSummary[] = clubPlayers.map((p) => {
    const gamesAttended = gamesAttendedMap[p.id] ?? 0;
    const amountOwed = p.membershipType === "annual" ? ANNUAL_FEE : gamesAttended * PER_GAME_FEE;
    const amountPaid = paidMap[p.id] ?? 0;
    return {
      id: p.id,
      name: p.name,
      membershipType: p.membershipType,
      gamesAttended,
      amountOwed,
      amountPaid,
      balance: amountPaid - amountOwed,
    };
  });

  members.sort((a, b) => a.balance - b.balance); // most overdue first

  const kittyTotal = seasonPayments.reduce((sum, p) => sum + p.amountRands, 0);
  return { season, kittyTotal, members };
}

export async function getPlayerPaymentLog(
  playerId: string,
  season: string
): Promise<{ id: string; amountRands: number; paidDate: Date; notes: string | null }[]> {
  return db
    .select({ id: payments.id, amountRands: payments.amountRands, paidDate: payments.paidDate, notes: payments.notes })
    .from(payments)
    .where(and(eq(payments.playerId, playerId), eq(payments.season, season)))
    .orderBy(desc(payments.paidDate));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function addPayment(data: {
  playerId: string;
  amountRands: number;
  season: string;
  notes?: string;
  paidDate?: Date;
}): Promise<void> {
  await requireAdmin();
  const session = await auth();
  await db.insert(payments).values({
    playerId: data.playerId,
    amountRands: data.amountRands,
    season: data.season,
    notes: data.notes ?? null,
    paidDate: data.paidDate ?? new Date(),
    recordedByUserId: session!.user.id,
  });
  revalidatePath("/admin/payments");
}

export async function deletePayment(paymentId: string): Promise<void> {
  await requireAdmin();
  await db.delete(payments).where(eq(payments.id, paymentId));
  revalidatePath("/admin/payments");
}

export async function setMembershipType(
  playerId: string,
  type: MembershipType
): Promise<void> {
  await requireAdmin();
  await db.update(players).set({ membershipType: type }).where(eq(players.id, playerId));
  revalidatePath("/admin/payments");
}
