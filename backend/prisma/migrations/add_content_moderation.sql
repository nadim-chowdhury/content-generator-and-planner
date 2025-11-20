-- Add content moderation fields to ideas table
ALTER TABLE "ideas" ADD COLUMN IF NOT EXISTS "flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ideas" ADD COLUMN IF NOT EXISTS "flaggedAt" TIMESTAMP(3);
ALTER TABLE "ideas" ADD COLUMN IF NOT EXISTS "flaggedReason" TEXT;
ALTER TABLE "ideas" ADD COLUMN IF NOT EXISTS "blocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ideas" ADD COLUMN IF NOT EXISTS "blockedAt" TIMESTAMP(3);
ALTER TABLE "ideas" ADD COLUMN IF NOT EXISTS "blockedReason" TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS "ideas_flagged_idx" ON "ideas"("flagged");
CREATE INDEX IF NOT EXISTS "ideas_blocked_idx" ON "ideas"("blocked");

-- Create idea_flags table
CREATE TABLE IF NOT EXISTS "idea_flags" (
  "id" TEXT NOT NULL,
  "ideaId" TEXT NOT NULL,
  "flaggedBy" TEXT,
  "reason" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'OTHER',
  "reviewed" BOOLEAN NOT NULL DEFAULT false,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "action" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "idea_flags_pkey" PRIMARY KEY ("id")
);

-- Create indexes for idea_flags
CREATE INDEX IF NOT EXISTS "idea_flags_ideaId_idx" ON "idea_flags"("ideaId");
CREATE INDEX IF NOT EXISTS "idea_flags_reviewed_idx" ON "idea_flags"("reviewed");
CREATE INDEX IF NOT EXISTS "idea_flags_category_idx" ON "idea_flags"("category");

-- Add foreign key
ALTER TABLE "idea_flags" ADD CONSTRAINT "idea_flags_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create blacklist_keywords table
CREATE TABLE IF NOT EXISTS "blacklist_keywords" (
  "id" TEXT NOT NULL,
  "keyword" TEXT NOT NULL UNIQUE,
  "category" TEXT NOT NULL DEFAULT 'GENERAL',
  "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
  "action" TEXT NOT NULL DEFAULT 'FLAG',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "blacklist_keywords_pkey" PRIMARY KEY ("id")
);

-- Create indexes for blacklist_keywords
CREATE INDEX IF NOT EXISTS "blacklist_keywords_keyword_idx" ON "blacklist_keywords"("keyword");
CREATE INDEX IF NOT EXISTS "blacklist_keywords_category_idx" ON "blacklist_keywords"("category");
CREATE INDEX IF NOT EXISTS "blacklist_keywords_enabled_idx" ON "blacklist_keywords"("enabled");






