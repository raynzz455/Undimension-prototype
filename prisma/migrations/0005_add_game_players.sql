-- Migration 0005: Add GamePlayer table
-- Game players — can be collective members OR external players.
-- Independent of Member so games can include non-collective players.
-- Each player has their OWN photo (separate from the member profile photo).

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

-- FK to Game.gameId (match the existing pattern used by GameMoment/GamePlayerStat)
ALTER TABLE "GamePlayer"
    ADD CONSTRAINT "GamePlayer_gameId_fkey"
    FOREIGN KEY ("gameId") REFERENCES "Game"("gameId") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "GamePlayer_gameId_idx" ON "GamePlayer"("gameId");
CREATE INDEX IF NOT EXISTS "GamePlayer_isMember_idx" ON "GamePlayer"("isMember");
