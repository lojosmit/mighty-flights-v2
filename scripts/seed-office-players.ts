// Run once: npx tsx scripts/seed-office-players.ts
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, max } from "drizzle-orm";
import * as schema from "../lib/db/schema";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, ssl: "require" });
const db = drizzle(sql, { schema });

const PLAYERS = [
  { name: "Michael Scott",  email: "michael@dundermifflin.com" },
  { name: "Dwight Schrute", email: "dwight@dundermifflin.com"  },
  { name: "Jim Halpert",    email: "jim@dundermifflin.com"     },
  { name: "Pam Beesly",     email: "pam@dundermifflin.com"     },
  { name: "Kevin Malone",   email: "kevin@dundermifflin.com"   },
];

async function main() {
  // Use the first club found
  const [club] = await db.select().from(schema.clubs).limit(1);
  if (!club) {
    console.error("No clubs found. Create a club first.");
    await sql.end();
    process.exit(1);
  }

  console.log(`Adding players to club: ${club.name} (${club.id})`);

  const [{ maxRank }] = await db
    .select({ maxRank: max(schema.players.seasonRank) })
    .from(schema.players)
    .where(eq(schema.players.clubId, club.id));

  let nextRank = (maxRank ?? 0) + 1;

  for (const p of PLAYERS) {
    const existing = await db
      .select()
      .from(schema.players)
      .where(eq(schema.players.email, p.email));

    if (existing.length > 0) {
      console.log(`  Already exists: ${p.name}`);
      continue;
    }

    await db.insert(schema.players).values({
      name: p.name,
      email: p.email,
      clubId: club.id,
      seasonRank: nextRank++,
    });
    console.log(`  Created: ${p.name}`);
  }

  console.log("Done.");
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
