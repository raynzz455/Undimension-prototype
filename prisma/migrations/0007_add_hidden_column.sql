-- Migration 0007: Add hidden column to Member table
-- Hidden members only show in chaos mode, not on public pages.
-- Idempotent — safe to run multiple times.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Member' AND column_name = 'hidden') THEN
    ALTER TABLE "Member" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Set Nayla as hidden (her slug is 'nayla')
UPDATE "Member" SET "hidden" = true WHERE "slug" = 'nayla';
