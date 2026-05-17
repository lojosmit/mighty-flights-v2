// npx tsx scripts/check-data.ts
import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/db/schema";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, ssl: "require" });
const db = drizzle(sql, { schema });

const nights = await db
  .select({ id: schema.leagueNights.id, date: schema.leagueNights.date, status: schema.leagueNights.status })
  .from(schema.leagueNights)
  .orderBy(schema.leagueNights.date);

console.log(`League nights: ${nights.length}`);
for (const n of nights) {
  console.log(" ", n.id.slice(0, 8), String(n.date).slice(0, 10), n.status);
}

const players = await db
  .select({ name: schema.players.name, wins: schema.players.wins, losses: schema.players.losses })
  .from(schema.players);

console.log("\nPlayer stats (wins / losses):");
for (const p of players) {
  console.log(" ", p.name.padEnd(12), "W:", p.wins, "L:", p.losses);
}

await sql.end();
