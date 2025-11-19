-- Migration: Add workspace collaboration features
-- Run with: npx prisma migrate dev --name add_workspace_collaboration

-- Add TeamRole enum
CREATE TYPE "TeamRole" AS ENUM ('VIEWER', 'EDITOR', 'MANAGER', 'ADMIN');

-- Add currentWorkspaceId to users
ALTER TABLE "users" ADD COLUMN "currentWorkspaceId" TEXT;

-- Update team_members to use TeamRole enum
ALTER TABLE "team_members" 
  ALTER COLUMN "role" TYPE "TeamRole" USING 
    CASE 
      WHEN "role" = 'MEMBER' THEN 'EDITOR'::"TeamRole"
      WHEN "role" = 'ADMIN' THEN 'ADMIN'::"TeamRole"
      ELSE 'EDITOR'::"TeamRole"
    END;

-- Add mentions to kanban_comments
ALTER TABLE "kanban_comments" ADD COLUMN "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create team_activities table
CREATE TABLE "team_activities" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_activities_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "team_activities_teamId_idx" ON "team_activities"("teamId");
CREATE INDEX "team_activities_userId_idx" ON "team_activities"("userId");
CREATE INDEX "team_activities_createdAt_idx" ON "team_activities"("createdAt");

-- Add foreign keys
ALTER TABLE "team_activities" ADD CONSTRAINT "team_activities_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_activities" ADD CONSTRAINT "team_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;





