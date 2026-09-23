-- Migration 0009: Seed ONLY Nayla (hidden member)
-- Run this in Supabase SQL Editor. Only inserts/updates Nayla.
-- Idempotent — ON CONFLICT (slug) DO UPDATE. Safe to run multiple times.

BEGIN;

INSERT INTO "Member" (
  "slug", "name", "nick", "role", "img", "color", "highlight", "bio",
  "tagline", "quote", "funFactsJson", "element", "joinYear",
  "statsJson", "socialsJson", "taglineCareer", "location",
  "availability", "educationJson", "workHistoryJson", "skillsJson",
  "hidden", "order", "createdAt", "updatedAt"
) VALUES (
  'nayla',
  'Nayla',
  'Naye',
  'THE PHANTOM',
  '',
  'bg-[#ff006e]',
  'text-[#ff006e]',
  'Entitas misterius yang muncul hanya saat chaos mode aktif. Hadir di bayang-bayang, namun selalu ada saat dibutuhkan.',
  'Here when chaos calls. Gone when it fades.',
  'Aku bukan glitch. Aku fitur yang belum kamu temukan.',
  $$["Muncul hanya dalam chaos mode","Identitas sebenarnya tidak ada yang tahu","Selalu hadir saat konami code diaktifkan","Lebih mirip hantu daripada member"]$$,
  'PHANTOM',
  '2026',
  $$[{"label":"STR","value":"10"},{"label":"DEX","value":"20"},{"label":"CON","value":"8"},{"label":"INT","value":"18"},{"label":"WIS","value":"16"},{"label":"CHA","value":"20"}]$$,
  $$[{"label":"INSTAGRAM","href":"#"},{"label":"X_TWITTER","href":"#"},{"label":"DISCORD","href":"#"}]$$,
  'Phantom Developer & Digital Ghost',
  'Unknown',
  'GHOST',
  $$[]$$,
  $$[]$$,
  $$[]$$,
  true,
  7,
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "nick" = EXCLUDED."nick",
  "role" = EXCLUDED."role",
  "img" = EXCLUDED."img",
  "color" = EXCLUDED."color",
  "highlight" = EXCLUDED."highlight",
  "bio" = EXCLUDED."bio",
  "tagline" = EXCLUDED."tagline",
  "quote" = EXCLUDED."quote",
  "funFactsJson" = EXCLUDED."funFactsJson",
  "element" = EXCLUDED."element",
  "joinYear" = EXCLUDED."joinYear",
  "statsJson" = EXCLUDED."statsJson",
  "socialsJson" = EXCLUDED."socialsJson",
  "taglineCareer" = EXCLUDED."taglineCareer",
  "location" = EXCLUDED."location",
  "availability" = EXCLUDED."availability",
  "educationJson" = EXCLUDED."educationJson",
  "workHistoryJson" = EXCLUDED."workHistoryJson",
  "skillsJson" = EXCLUDED."skillsJson",
  "hidden" = EXCLUDED."hidden",
  "order" = EXCLUDED."order",
  "updatedAt" = NOW();

COMMIT;
