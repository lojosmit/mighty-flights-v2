"use server";

import { db } from "@/lib/db";
import { handicapSettings } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const MAX_RANK = 20;

export async function regenerateHandicapTable(
  baseMultiplier: number,
  increment: number,
  intervalRanks: number,
): Promise<void> {
  const session = await auth();
  if (session?.user.role !== "super_admin") throw new Error("Forbidden");

  const rows: { rankFrom: number; rankTo: number; multiplier: string }[] = [];
  for (let tier = 0; tier * intervalRanks < MAX_RANK; tier++) {
    const rankFrom = tier * intervalRanks + 1;
    const rankTo = Math.min((tier + 1) * intervalRanks, MAX_RANK);
    const multiplier = (baseMultiplier + tier * increment).toFixed(2);
    rows.push({ rankFrom, rankTo, multiplier });
  }

  await db.delete(handicapSettings);
  await db.insert(handicapSettings).values(rows);
  revalidatePath("/admin");
}
