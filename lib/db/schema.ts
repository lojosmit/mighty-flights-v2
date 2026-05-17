import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ── Clubs ─────────────────────────────────────────────────────────────────────

export const clubs = pgTable("clubs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Club = typeof clubs.$inferSelect;

// ── Users ─────────────────────────────────────────────────────────────────────

export type UserRole = "super_admin" | "club_manager" | "host" | "player";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").$type<UserRole>().notNull().default("player"),
  clubId: uuid("club_id").references(() => clubs.id),
  playerId: uuid("player_id"), // linked to players.id after player table exists
  mustResetPassword: boolean("must_reset_password").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;

// ── Players ───────────────────────────────────────────────────────────────────

export type MembershipType = "annual" | "per_game";

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email"),
  clubId: uuid("club_id").references(() => clubs.id),
  userId: uuid("user_id").references(() => users.id),
  seasonRank: integer("season_rank").notNull().default(1),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  doves: integer("doves").notNull().default(0),
  doveWins: integer("dove_wins").notNull().default(0),
  forfeits: integer("forfeits").notNull().default(0),
  totalPoints: numeric("total_points", { precision: 8, scale: 2 }).notNull().default("0"),
  membershipType: text("membership_type").$type<MembershipType>().notNull().default("per_game"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

// ── Invite Tokens ─────────────────────────────────────────────────────────────

export const inviteTokens = pgTable("invite_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  clubId: uuid("club_id").notNull().references(() => clubs.id),
  role: text("role").$type<Exclude<UserRole, "super_admin">>().notNull().default("player"),
  playerId: uuid("player_id"), // optionally pre-links to an existing player record
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InviteToken = typeof inviteTokens.$inferSelect;

// ── Handicap Settings ─────────────────────────────────────────────────────────

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
  clubId: uuid("club_id").references(() => clubs.id),
  date: timestamp("date").notNull().defaultNow(),
  attendingPlayerIds: jsonb("attending_player_ids").$type<string[]>().notNull().default([]),
  boardCount: integer("board_count").notNull().default(1),
  status: text("status").$type<LeagueNightStatus>().notNull().default("setup"),
  rsvpDeadline: timestamp("rsvp_deadline"),
  rsvpToken: text("rsvp_token"),
  hostUserId: uuid("host_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LeagueNight = typeof leagueNights.$inferSelect;
export type NewLeagueNight = typeof leagueNights.$inferInsert;

// ── RSVPs ─────────────────────────────────────────────────────────────────────

export const rsvps = pgTable("rsvps", {
  id: uuid("id").primaryKey().defaultRandom(),
  leagueNightId: uuid("league_night_id").notNull().references(() => leagueNights.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Rsvp = typeof rsvps.$inferSelect;

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

// ── Pair Stats ────────────────────────────────────────────────────────────────

export const pairStats = pgTable(
  "pair_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerIdA: text("player_id_a").notNull(),
    playerIdB: text("player_id_b").notNull(),
    gamesPlayed: integer("games_played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("pair_stats_unique_pair").on(t.playerIdA, t.playerIdB)]
);

export type PairStat = typeof pairStats.$inferSelect;

// ── Matchup History ───────────────────────────────────────────────────────────

export const matchupHistory = pgTable("matchup_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchupKey: text("matchup_key").notNull().unique(),
  teamAPlayerIds: jsonb("team_a_player_ids").$type<string[]>().notNull(),
  teamBPlayerIds: jsonb("team_b_player_ids").$type<string[]>().notNull(),
  gamesPlayed: integer("games_played").notNull().default(0),
  winnerHistory: jsonb("winner_history").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MatchupHistoryRecord = typeof matchupHistory.$inferSelect;

// ── Contact Messages ──────────────────────────────────────────────────────────

export type ContactMessageStatus = "unread" | "read" | "archived";

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: text("status").$type<ContactMessageStatus>().notNull().default("unread"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;

// ── Registration Requests ─────────────────────────────────────────────────────

export const registrationRequests = pgTable("registration_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  leagueNightId: uuid("league_night_id").references(() => leagueNights.id),
  clubId: uuid("club_id").references(() => clubs.id),
  fulfilled: boolean("fulfilled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RegistrationRequest = typeof registrationRequests.$inferSelect;

// ── Payments ──────────────────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id").notNull().references(() => players.id),
  amountRands: integer("amount_rands").notNull(),
  paidDate: timestamp("paid_date").notNull().defaultNow(),
  season: text("season").notNull(), // e.g. "2026"
  notes: text("notes"),
  recordedByUserId: uuid("recorded_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
