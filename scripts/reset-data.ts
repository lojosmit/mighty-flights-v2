// Run: npx tsx scripts/reset-data.ts
// Clears all game/club/player data while keeping the super_admin user intact.
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/db/schema";
import { eq } from "drizzle-orm";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, ssl: "require" });
const db = drizzle(sql, { schema });

async function main() {
  // Save the super_admin before wiping everything
  const [admin] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, "super_admin"));

  if (!admin) {
    console.error("No super_admin found — aborting.");
    process.exit(1);
  }

  console.log(`Preserving admin: ${admin.email}`);
  console.log("Clearing all data…");

  await sql`TRUNCATE fixtures, rounds, rsvps, matchup_history, pair_stats, league_nights, registration_requests, invite_tokens, players, handicap_settings, users, clubs RESTART IDENTITY CASCADE`;

  // Restore admin exactly as it was (password hash preserved)
  const [restored] = await db
    .insert(schema.users)
    .values({
      id: admin.id,
      email: admin.email,
      passwordHash: admin.passwordHash,
      name: admin.name,
      role: "super_admin",
      clubId: undefined,
      createdAt: admin.createdAt,
    })
    .returning();

  console.log(`Done. Admin restored: ${restored.email}`);
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
