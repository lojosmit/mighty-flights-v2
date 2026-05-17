// npx tsx scripts/seed-dove-counts.ts
// Sets doves count for MF Vaal players from the 2025 season spreadsheet.
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import * as schema from "../lib/db/schema";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, ssl: "require" });
const db = drizzle(sql, { schema });

const DOVES: { name: string; doves: number }[] = [
  { name: "Gideon",   doves: 3 },
  { name: "Stian",    doves: 2 },
  { name: "Wikus",    doves: 0 },
  { name: "Terrie",   doves: 4 },
  { name: "Norman",   doves: 0 },
  { name: "Niel",     doves: 3 },
  { name: "Bertie",   doves: 4 },
  { name: "James",    doves: 1 },
  { name: "Michiel",  doves: 0 },
  { name: "Tiaan",    doves: 1 },
  { name: "Harry",    doves: 2 },
  { name: "Hennie",   doves: 3 },
  { name: "Christos", doves: 3 },
  { name: "Leonard",  doves: 2 },
  { name: "Jak",      doves: 0 },
  { name: "Zander",   doves: 0 },
  { name: "Ravon",    doves: 1 },
  { name: "Waldo",    doves: 0 },
  { name: "Hanno",    doves: 1 },
  { name: "Tertius",  doves: 0 },
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

  console.log(`Updating dove counts for ${club.name}…`);

  for (const { name, doves } of DOVES) {
    const result = await db
      .update(schema.players)
      .set({ doves })
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
      console.log(`  ✓ ${name.padEnd(10)} → ${doves}`);
    }
  }

  console.log("\nDone.");
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
