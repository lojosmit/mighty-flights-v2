"use server";

import { and, eq, lte, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db/index";
import { handicapSettings, type HandicapSetting } from "./db/schema";

// Default table per DESIGN.md Section 3 — ranks 1–20, +0.1 per pair.
const DEFAULT_ROWS = Array.from({ length: 10 }, (_, i) => ({
  rankFrom: i * 2 + 1,
  rankTo: i * 2 + 2,
  multiplier: String((1.0 + i * 0.1).toFixed(2)),
}));

export async function getHandicapTable(): Promise<HandicapSetting[]> {
  const rows = await db
    .select()
    .from(handicapSettings)
    .orderBy(handicapSettings.rankFrom);

  if (rows.length === 0) {
    const seeded = await db
      .insert(handicapSettings)
      .values(DEFAULT_ROWS)
      .returning();
    return seeded;
  }

  return rows;
}

// Pure function — usable in tests and rotation engine without DB.
export function computeMultiplier(rank: number): number {
  return parseFloat((1.0 + Math.floor((rank - 1) / 2) * 0.1).toFixed(2));
}

export async function getMultiplier(rank: number): Promise<number> {
  const [row] = await db
    .select()
    .from(handicapSettings)
    .where(
      and(
        lte(handicapSettings.rankFrom, rank),
        gte(handicapSettings.rankTo, rank)
      )
    );

  if (!row) return computeMultiplier(rank);
  return parseFloat(row.multiplier);
}

export async function updateMultiplier(
  id: number,
  multiplier: number
): Promise<HandicapSetting> {
  const [row] = await db
    .update(handicapSettings)
    .set({ multiplier: multiplier.toFixed(2) })
    .where(eq(handicapSettings.id, id))
    .returning();
  try { revalidatePath("/settings/handicap"); } catch {}
  return row;
}
