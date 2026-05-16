ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "total_points" numeric(8,2) NOT NULL DEFAULT 0;
