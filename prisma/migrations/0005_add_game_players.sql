-- Migration 0005: Add GamePlayer table (idempotent — safe to run multiple times)
-- Game players — can be collective members OR external players.
-- Independent of Member so games can include non-collective players.
-- Each player has their OWN photo (separate from the member profile photo).

-- Create the table if it doesn't exist (IF NOT EXISTS makes this safe)
CREATE TABLE IF NOT EXISTS "GamePlayer" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nick" TEXT NOT NULL,
    "img" TEXT,
    "color" TEXT NOT NULL DEFAULT '#ff8c00',
    "role" TEXT,
    "favHero" TEXT,
    "rank" TEXT,
    "kda" TEXT,
    "winRate" TEXT,
    "dndCharacter" TEXT,
    "dndRace" TEXT,
    "dndClass" TEXT,
    "dndLevel" INTEGER NOT NULL DEFAULT 1,
    "isMember" BOOLEAN NOT NULL DEFAULT false,
    "memberSlug" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamePlayer_pkey" PRIMARY KEY ("id")
);

-- Add columns if they don't exist (for when the table was created by a
-- previous prisma db push with fewer columns). Each ALTER is wrapped
-- in a DO block so it's a no-op if the column already exists.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GamePlayer' AND column_name = 'isMember') THEN
    ALTER TABLE "GamePlayer" ADD COLUMN "isMember" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GamePlayer' AND column_name = 'memberSlug') THEN
    ALTER TABLE "GamePlayer" ADD COLUMN "memberSlug" TEXT;
  END IF;
END $$;

-- FK to Game.gameId — drop if exists first, then add (idempotent).
-- PostgreSQL doesn't support ADD CONSTRAINT IF NOT EXISTS, so we use
-- DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT instead.
ALTER TABLE "GamePlayer" DROP CONSTRAINT IF EXISTS "GamePlayer_gameId_fkey";
ALTER TABLE "GamePlayer"
    ADD CONSTRAINT "GamePlayer_gameId_fkey"
    FOREIGN KEY ("gameId") REFERENCES "Game"("gameId") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "GamePlayer_gameId_idx" ON "GamePlayer"("gameId");
CREATE INDEX IF NOT EXISTS "GamePlayer_isMember_idx" ON "GamePlayer"("isMember");
