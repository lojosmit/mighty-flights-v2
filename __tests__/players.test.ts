import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db/index";
import { players } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// These are integration tests — they hit the real Supabase DB.
// Requires DATABASE_URL set in .env.local.

const TEST_PREFIX = "__test__";

async function cleanup() {
  await db.delete(players).where(
    eq(players.name, `${TEST_PREFIX}Alice`)
  );
  await db.delete(players).where(
    eq(players.name, `${TEST_PREFIX}Alice Updated`)
  );
}

beforeAll(cleanup);
afterAll(cleanup);

describe("players CRUD", () => {
  let createdId: string;

  it("creates a player", async () => {
    const [player] = await db
      .insert(players)
      .values({ name: `${TEST_PREFIX}Alice` })
      .returning();

    expect(player.id).toBeTruthy();
    expect(player.name).toBe(`${TEST_PREFIX}Alice`);
    expect(player.seasonRank).toBeGreaterThanOrEqual(1);
    expect(player.wins).toBe(0);
    expect(player.losses).toBe(0);
    expect(player.doves).toBe(0);
    expect(player.doveWins).toBe(0);

    createdId = player.id;
  });

  it("reads the player back", async () => {
    const result = await db
      .select()
      .from(players)
      .where(eq(players.id, createdId));

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe(`${TEST_PREFIX}Alice`);
  });

  it("updates name and rank", async () => {
    const [updated] = await db
      .update(players)
      .set({ name: `${TEST_PREFIX}Alice Updated`, seasonRank: 5 })
      .where(eq(players.id, createdId))
      .returning();

    expect(updated.name).toBe(`${TEST_PREFIX}Alice Updated`);
    expect(updated.seasonRank).toBe(5);
  });

  it("deletes the player", async () => {
    await db.delete(players).where(eq(players.id, createdId));

    const result = await db
      .select()
      .from(players)
      .where(eq(players.id, createdId));

    expect(result).toHaveLength(0);
  });
});
