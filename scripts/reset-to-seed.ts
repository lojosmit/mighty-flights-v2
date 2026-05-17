// npx tsx scripts/reset-to-seed.ts
// Wipes all game data (league nights, rounds, fixtures, pair stats, matchup history)
// and resets every player's stats to the initial seeded values.
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, ssl: "require" });
const db = drizzle(sql, { schema });

// Seeded baseline — matches seed-mf-vaal.ts + seed-mf-vaal-scores.ts + seed-dove-counts.ts
const SEED: {
  name: string;
  wins: number;
  losses: number;
  doves: number;
  doveWins: number;
  totalPoints: string;
  seasonRank: number;
}[] = [
  { name: "Harry",    wins: 50, losses: 14, doves: 2, doveWins: 2, totalPoints: "69.0",  seasonRank:  1 },
  { name: "Bertie",   wins: 41, losses: 31, doves: 4, doveWins: 4, totalPoints: "60.5",  seasonRank:  2 },
  { name: "Niel",     wins: 50, losses: 35, doves: 3, doveWins: 3, totalPoints: "58.6",  seasonRank:  3 },
  { name: "Michiel",  wins: 27, losses: 17, doves: 0, doveWins: 0, totalPoints: "46.6",  seasonRank:  4 },
  { name: "Stian",    wins: 22, losses: 21, doves: 2, doveWins: 2, totalPoints: "39.0",  seasonRank:  5 },
  { name: "Gideon",   wins: 22, losses: 29, doves: 3, doveWins: 3, totalPoints: "36.8",  seasonRank:  6 },
  { name: "Leonard",  wins: 18, losses: 22, doves: 2, doveWins: 2, totalPoints: "35.9",  seasonRank:  7 },
  { name: "Hennie",   wins: 22, losses: 26, doves: 3, doveWins: 3, totalPoints: "23.0",  seasonRank:  8 },
  { name: "Norman",   wins:  8, losses: 25, doves: 0, doveWins: 0, totalPoints: "9.0",   seasonRank:  9 },
  { name: "Zander",   wins: 13, losses:  6, doves: 0, doveWins: 0, totalPoints: "28.3",  seasonRank: 10 },
  { name: "Christos", wins:  8, losses: 25, doves: 3, doveWins: 3, totalPoints: "20.7",  seasonRank: 11 },
  { name: "Jak",      wins:  8, losses: 11, doves: 0, doveWins: 0, totalPoints: "12.0",  seasonRank: 12 },
  { name: "James",    wins: 20, losses: 13, doves: 1, doveWins: 1, totalPoints: "13.0",  seasonRank: 13 },
  { name: "Wikus",    wins: 10, losses: 12, doves: 0, doveWins: 0, totalPoints: "11.0",  seasonRank: 14 },
  { name: "Terrie",   wins:  6, losses: 14, doves: 4, doveWins: 4, totalPoints: "9.3",   seasonRank: 15 },
  { name: "Ravon",    wins:  3, losses:  8, doves: 1, doveWins: 1, totalPoints: "6.3",   seasonRank: 16 },
  { name: "Hanno",    wins:  7, losses:  3, doves: 1, doveWins: 1, totalPoints: "6.3",   seasonRank: 17 },
  { name: "Tertius",  wins:  5, losses:  7, doves: 0, doveWins: 0, totalPoints: "5.0",   seasonRank: 18 },
  { name: "Tiaan",    wins: 11, losses: 19, doves: 1, doveWins: 1, totalPoints: "3.8",   seasonRank: 19 },
  { name: "Waldo",    wins:  1, losses:  0, doves: 0, doveWins: 0, totalPoints: "2.1",   seasonRank: 20 },
];

async function main() {
  const [club] = await db.select().from(schema.clubs).where(eq(schema.clubs.slug, "mf-vaal"));
  if (!club) { console.error("Club mf-vaal not found"); process.exit(1); }

  console.log("── Deleting game data ───────────────────────────────");

  // Must delete in FK order: fixtures → rounds → rsvps → league nights
  const nights = await db.select({ id: schema.leagueNights.id }).from(schema.leagueNights);
  for (const n of nights) {
    const nightRounds = await db.select({ id: schema.rounds.id }).from(schema.rounds)
      .where(eq(schema.rounds.leagueNightId, n.id));
    for (const r of nightRounds) {
      await db.delete(schema.fixtures).where(eq(schema.fixtures.roundId, r.id));
    }
    await db.delete(schema.rounds).where(eq(schema.rounds.leagueNightId, n.id));
    await db.delete(schema.rsvps).where(eq(schema.rsvps.leagueNightId, n.id));
    await db.delete(schema.leagueNights).where(eq(schema.leagueNights.id, n.id));
    console.log(`  ✓ Deleted league night ${n.id.slice(0, 8)}`);
  }
  if (nights.length === 0) console.log("  (no league nights to delete)");

  console.log("  Clearing matchup history & pair stats…");
  await db.delete(schema.matchupHistory);
  await db.delete(schema.pairStats);

  console.log("\n── Resetting player stats ───────────────────────────");
  for (const s of SEED) {
    const result = await db
      .update(schema.players)
      .set({
        wins:        s.wins,
        losses:      s.losses,
        doves:       s.doves,
        doveWins:    s.doveWins,
        forfeits:    0,
        totalPoints: s.totalPoints,
      })
      .where(eq(schema.players.name, s.name))
      .returning({ id: schema.players.id });

    if (result.length === 0) {
      console.warn(`  ⚠ Not found: ${s.name}`);
    } else {
      console.log(`  ✓ ${s.name.padEnd(10)} W:${s.wins} L:${s.losses} Pts:${s.totalPoints}`);
    }
  }

  console.log("\nDone — database is at seed baseline.");
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
