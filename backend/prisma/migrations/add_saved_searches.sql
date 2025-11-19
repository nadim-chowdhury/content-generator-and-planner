-- Migration: Add SavedSearch model

CREATE TABLE IF NOT EXISTS "saved_searches" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "query" TEXT,
  "filters" JSONB,
  "teamId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "saved_searches_userId_idx" ON "saved_searches"("userId");
CREATE INDEX IF NOT EXISTS "saved_searches_teamId_idx" ON "saved_searches"("teamId");

ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;



