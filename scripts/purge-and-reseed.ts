// Run once: npx tsx scripts/purge-and-reseed.ts
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/db/schema";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, ssl: "require" });
const db = drizzle(sql, { schema });

const EMAIL = "admin@mightyflights.co.za";
const PASSWORD = "ChangeMe123!";

async function main() {
  console.log("Purging all data…");

  // Truncate in FK-safe order (children before parents)
  await sql`TRUNCATE fixtures, rounds, rsvps, matchup_history, pair_stats, league_nights, invite_tokens, players, handicap_settings, users, clubs RESTART IDENTITY CASCADE`;

  console.log("All tables cleared.");

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const [user] = await db
    .insert(schema.users)
    .values({
      email: EMAIL,
      passwordHash,
      name: "Admin",
      role: "super_admin",
      clubId: undefined,
    })
    .returning();

  console.log(`Re-created super-admin: ${user.email}`);
  console.log(`Temporary password: ${PASSWORD}`);
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
