import { integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  seasonRank: integer("season_rank").notNull().default(1),
  // stats — per DESIGN.md Section 8
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  doves: integer("doves").notNull().default(0),
  doveWins: integer("dove_wins").notNull().default(0),
  forfeits: integer("forfeits").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

export const handicapSettings = pgTable("handicap_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  rankFrom: integer("rank_from").notNull(),
  rankTo: integer("rank_to").notNull(),
  multiplier: numeric("multiplier", { precision: 4, scale: 2 }).notNull(),
});

export type HandicapSetting = typeof handicapSettings.$inferSelect;

// ── League Night ─────────────────────────────────────────────────────────────

export type LeagueNightStatus = "setup" | "in_progress" | "completed";

export const leagueNights = pgTable("league_nights", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: timestamp("date").notNull().defaultNow(),
  attendingPlayerIds: jsonb("attending_player_ids").$type<string[]>().notNull().default([]),
  boardCount: integer("board_count").notNull().default(1),
  status: text("status").$type<LeagueNightStatus>().notNull().default("setup"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LeagueNight = typeof leagueNights.$inferSelect;
export type NewLeagueNight = typeof leagueNights.$inferInsert;

// ── Round ─────────────────────────────────────────────────────────────────────

export type OverrideLog = {
  swappedA: string;
  swappedB: string;
  timestamp: string;
};

export type PairStreakRecord = {
  playerIds: [string, string];
  count: number;
};

export const rounds = pgTable("rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  leagueNightId: uuid("league_night_id").notNull().references(() => leagueNights.id),
  roundNumber: integer("round_number").notNull(),
  bench: jsonb("bench").$type<string[]>().notNull().default([]),
  overrides: jsonb("overrides").$type<OverrideLog[]>().notNull().default([]),
  streaks: jsonb("streaks").$type<PairStreakRecord[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Round = typeof rounds.$inferSelect;

// ── Fixture ───────────────────────────────────────────────────────────────────

export type FixtureTeam = {
  playerIds: string[];
  score: number;
  handicapApplied: number;
};

export type FixtureResult =
  | "teamA_win" | "teamB_win"
  | "special_win_A" | "special_win_B"
  | "double_forfeit" | "in_progress";

export const fixtures = pgTable("fixtures", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id").notNull().references(() => rounds.id),
  boardLabel: text("board_label").notNull(),
  type: text("type").$type<"2v2" | "1v1">().notNull(),
  teamA: jsonb("team_a").$type<FixtureTeam>().notNull(),
  teamB: jsonb("team_b").$type<FixtureTeam>().notNull(),
  result: text("result").$type<FixtureResult>().notNull().default("in_progress"),
  forfeitReason: text("forfeit_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Fixture = typeof fixtures.$inferSelect;

// ── Pair Stats (DESIGN.md §8) ─────────────────────────────────────────────────
// Tracks stats for any two players who have ever played on the same team.

export const pairStats = pgTable(
  "pair_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerIdA: text("player_id_a").notNull(), // alphabetically first
    playerIdB: text("player_id_b").notNull(), // alphabetically second
    gamesPlayed: integer("games_played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("pair_stats_unique_pair").on(t.playerIdA, t.playerIdB)]
);

export type PairStat = typeof pairStats.$inferSelect;

// ── Matchup History (DESIGN.md §8) ───────────────────────────────────────────
// Tracks head-to-head history between two teams (pair vs pair or solo vs solo).

export const matchupHistory = pgTable("matchup_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchupKey: text("matchup_key").notNull().unique(),
  teamAPlayerIds: jsonb("team_a_player_ids").$type<string[]>().notNull(),
  teamBPlayerIds: jsonb("team_b_player_ids").$type<string[]>().notNull(),
  gamesPlayed: integer("games_played").notNull().default(0),
  // "A" = canonical teamA won, "B" = canonical teamB won, "X" = double forfeit
  winnerHistory: jsonb("winner_history").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MatchupHistoryRecord = typeof matchupHistory.$inferSelect;
