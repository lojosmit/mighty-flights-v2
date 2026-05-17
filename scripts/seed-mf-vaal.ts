// npx tsx scripts/seed-mf-vaal.ts
// Creates MF Vaal players + linked user accounts from 2025-season spreadsheet.
// Default password for every account: MFVaal2026!
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, ssl: "require" });
const db = drizzle(sql, { schema });

const DEFAULT_PASSWORD = "MFVaal2026!";

// W = wins, L = losses, D = doves (all doves treated as dove-wins),
// rank = season rank from the 2025 spreadsheet (LOG column).
const PLAYERS = [
  { name: "Harry",    w: 50, l: 14, d: 2, rank:  1 },
  { name: "Bertie",   w: 41, l: 31, d: 4, rank:  2 },
  { name: "Niel",     w: 50, l: 35, d: 3, rank:  3 },
  { name: "Michiel",  w: 27, l: 17, d: 0, rank:  4 },
  { name: "Stian",    w: 22, l: 21, d: 2, rank:  5 },
  { name: "Gideon",   w: 22, l: 29, d: 3, rank:  6 },
  { name: "Leonard",  w: 18, l: 22, d: 2, rank:  7 },
  { name: "Hennie",   w: 22, l: 26, d: 3, rank:  8 },
  { name: "Norman",   w:  8, l: 25, d: 3, rank:  9 },
  { name: "Zander",   w: 13, l:  6, d: 0, rank: 10 },
  { name: "Christos", w:  8, l: 25, d: 3, rank: 11 },
  { name: "Jak",      w:  8, l: 11, d: 0, rank: 12 },
  { name: "James",    w: 20, l: 13, d: 1, rank: 13 },
  { name: "Wikus",    w: 10, l: 12, d: 0, rank: 14 },
  { name: "Terrie",   w:  6, l: 14, d: 4, rank: 15 },
  { name: "Ravon",    w:  3, l:  8, d: 1, rank: 16 },
  { name: "Hanno",    w:  7, l:  3, d: 1, rank: 17 },
  { name: "Tertius",  w:  5, l:  7, d: 0, rank: 18 },
  { name: "Tiaan",    w: 11, l: 19, d: 1, rank: 19 },
  { name: "Waldo",    w:  1, l:  0, d: 0, rank: 20 },
];

async function main() {
  // Find MF Vaal club
  const [club] = await db
    .select()
    .from(schema.clubs)
    .where(eq(schema.clubs.slug, "mf-vaal"));

  if (!club) {
    console.error('Club with slug "mf-vaal" not found. Create it in the admin panel first.');
    process.exit(1);
  }
  console.log(`Found club: ${club.name} (${club.id})`);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  console.log(`Hashed default password.`);

  for (const p of PLAYERS) {
    const email = `${p.name.toLowerCase()}@mf-vaal.co.za`;

    // Create player record
    const [player] = await db
      .insert(schema.players)
      .values({
        name: p.name,
        email,
        clubId: club.id,
        seasonRank: p.rank,
        wins: p.w,
        losses: p.l,
        doves: p.d,
        doveWins: p.d,
        forfeits: 0,
        totalPoints: "0",
      })
      .returning();

    // Create linked user account
    const [user] = await db
      .insert(schema.users)
      .values({
        email,
        passwordHash,
        name: p.name,
        role: "player",
        clubId: club.id,
        playerId: player.id,
      })
      .returning();

    // Back-link user → player
    await db
      .update(schema.players)
      .set({ userId: user.id })
      .where(eq(schema.players.id, player.id));

    console.log(`  ✓ ${p.name.padEnd(10)} rank ${String(p.rank).padStart(2)}  ${email}`);
  }

  console.log(`\nDone. ${PLAYERS.length} players created.`);
  console.log(`Default password: ${DEFAULT_PASSWORD}`);
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
