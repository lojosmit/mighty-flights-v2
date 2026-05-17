// npx tsx scripts/seed-mf-vaal-scores.ts
// Sets totalPoints for MF Vaal players from the 2025 season spreadsheet.
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import * as schema from "../lib/db/schema";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, ssl: "require" });
const db = drizzle(sql, { schema });

const SCORES: { name: string; totalPoints: string }[] = [
  { name: "Harry",    totalPoints: "69.0" },
  { name: "Bertie",   totalPoints: "60.5" },
  { name: "Niel",     totalPoints: "58.6" },
  { name: "Michiel",  totalPoints: "46.6" },
  { name: "Stian",    totalPoints: "39.0" },
  { name: "Gideon",   totalPoints: "36.8" },
  { name: "Leonard",  totalPoints: "35.9" },
  { name: "Zander",   totalPoints: "28.3" },
  { name: "Hennie",   totalPoints: "23.0" },
  { name: "Christos", totalPoints: "20.7" },
  { name: "James",    totalPoints: "13.0" },
  { name: "Jak",      totalPoints: "12.0" },
  { name: "Wikus",    totalPoints: "11.0" },
  { name: "Terrie",   totalPoints: "9.3"  },
  { name: "Norman",   totalPoints: "9.0"  },
  { name: "Ravon",    totalPoints: "6.3"  },
  { name: "Hanno",    totalPoints: "6.3"  },
  { name: "Tertius",  totalPoints: "5.0"  },
  { name: "Tiaan",    totalPoints: "3.8"  },
  { name: "Waldo",    totalPoints: "2.1"  },
];

async function main() {
  const [club] = await db
    .select()
    .from(schema.clubs)
    .where(eq(schema.clubs.slug, "mf-vaal"));

  if (!club) {
    console.error('Club "mf-vaal" not found.');
    process.exit(1);
  }

  console.log(`Updating total points for ${club.name}…`);

  for (const { name, totalPoints } of SCORES) {
    const result = await db
      .update(schema.players)
      .set({ totalPoints })
      .where(
        and(
          eq(schema.players.clubId, club.id),
          eq(schema.players.name, name)
        )
      )
      .returning({ id: schema.players.id });

    if (result.length === 0) {
      console.warn(`  ⚠ Not found: ${name}`);
    } else {
      console.log(`  ✓ ${name.padEnd(10)} → ${totalPoints}`);
    }
  }

  console.log("\nDone.");
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
