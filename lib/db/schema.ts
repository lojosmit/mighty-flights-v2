import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  seasonRank: integer("season_rank").notNull().default(1),
  // stats — per DESIGN.md Section 2
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  doves: integer("doves").notNull().default(0),
  doveWins: integer("dove_wins").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
