-- Migration 0006: Add bioPortfolio column to Member + MemberProfileHistory
-- A separate bio for the portfolio page (below the normal bio).
-- Idempotent — safe to run multiple times.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Member' AND column_name = 'bioPortfolio') THEN
    ALTER TABLE "Member" ADD COLUMN "bioPortfolio" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MemberProfileHistory' AND column_name = 'bioPortfolio') THEN
    ALTER TABLE "MemberProfileHistory" ADD COLUMN "bioPortfolio" TEXT;
  END IF;
END $$;
