-- Migration: Add Social Media Connections
-- This migration adds support for connecting multiple social media platforms

-- Create enum for supported platforms
CREATE TYPE "SocialPlatform" AS ENUM (
  'FACEBOOK',
  'TWITTER',
  'INSTAGRAM',
  'THREADS',
  'LINKEDIN',
  'REDDIT',
  'QUORA',
  'PINTEREST',
  'TIKTOK',
  'YOUTUBE'
);

-- Create social_connections table
CREATE TABLE "social_connections" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "platform" "SocialPlatform" NOT NULL,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "platformUserId" TEXT,
  "platformUsername" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "social_connections_pkey" PRIMARY KEY ("id")
);

-- Create index for user lookups
CREATE INDEX "social_connections_userId_idx" ON "social_connections"("userId");
CREATE INDEX "social_connections_platform_idx" ON "social_connections"("platform");

-- Create unique constraint for user + platform combination
CREATE UNIQUE INDEX "social_connections_userId_platform_key" ON "social_connections"("userId", "platform");

-- Add foreign key
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add postedTo field to ideas table for tracking where content was posted
ALTER TABLE "ideas" ADD COLUMN "postedTo" TEXT[] DEFAULT ARRAY[]::TEXT[];

