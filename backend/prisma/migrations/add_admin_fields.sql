-- Add admin control fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bannedReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bonusCredits" INTEGER NOT NULL DEFAULT 0;

-- Create index on banned field for faster queries
CREATE INDEX IF NOT EXISTS "users_banned_idx" ON "users"("banned");


