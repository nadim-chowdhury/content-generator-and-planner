-- Migration: Add UserSettings and WorkspaceSettings models

-- Create UserSettings table
CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'en',
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "dateFormat" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  "timeFormat" TEXT NOT NULL DEFAULT '12h',
  "preferredPlatforms" "SocialPlatform"[] DEFAULT ARRAY[]::"SocialPlatform"[],
  "contentTemplates" JSONB,
  "aiTone" TEXT NOT NULL DEFAULT 'professional',
  "aiStyle" TEXT NOT NULL DEFAULT 'balanced',
  "aiPersonality" TEXT,
  "aiMaxLength" INTEGER NOT NULL DEFAULT 280,
  "aiIncludeHashtags" BOOLEAN NOT NULL DEFAULT true,
  "aiIncludeEmojis" BOOLEAN NOT NULL DEFAULT false,
  "theme" TEXT NOT NULL DEFAULT 'light',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- Create WorkspaceSettings table
CREATE TABLE IF NOT EXISTS "workspace_settings" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "brandName" TEXT,
  "brandColors" JSONB,
  "brandLogo" TEXT,
  "brandFont" TEXT,
  "defaultPostingSchedule" JSONB,
  "defaultTimeZone" TEXT NOT NULL DEFAULT 'UTC',
  "allowViewersToComment" BOOLEAN NOT NULL DEFAULT true,
  "allowEditorsToSchedule" BOOLEAN NOT NULL DEFAULT true,
  "allowEditorsToPublish" BOOLEAN NOT NULL DEFAULT false,
  "requireApprovalForPublishing" BOOLEAN NOT NULL DEFAULT false,
  "contentGuidelines" TEXT,
  "hashtagPolicy" TEXT,
  "autoScheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "workspace_settings_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "user_settings_userId_key" ON "user_settings"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_settings_teamId_key" ON "workspace_settings"("teamId");

-- Create indexes
CREATE INDEX IF NOT EXISTS "user_settings_userId_idx" ON "user_settings"("userId");
CREATE INDEX IF NOT EXISTS "workspace_settings_teamId_idx" ON "workspace_settings"("teamId");

-- Add foreign key constraints
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_settings" ADD CONSTRAINT "workspace_settings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;





