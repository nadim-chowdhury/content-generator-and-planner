-- Add referral and affiliate fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referralCode" TEXT UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referredBy" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referralCredits" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isAffiliate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "affiliateCode" TEXT UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "affiliateApproved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "affiliateApprovedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referredByAffiliate" TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_referralCode_idx" ON "users"("referralCode");
CREATE INDEX IF NOT EXISTS "users_referredBy_idx" ON "users"("referredBy");
CREATE INDEX IF NOT EXISTS "users_affiliateCode_idx" ON "users"("affiliateCode");
CREATE INDEX IF NOT EXISTS "users_referredByAffiliate_idx" ON "users"("referredByAffiliate");

-- Create ReferralStatus enum
DO $$ BEGIN
  CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'CONVERTED', 'REWARDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create referrals table
CREATE TABLE IF NOT EXISTS "referrals" (
  "id" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "referredUserId" TEXT,
  "referralCode" TEXT NOT NULL,
  "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
  "creditsEarned" INTEGER NOT NULL DEFAULT 0,
  "creditsGiven" INTEGER NOT NULL DEFAULT 0,
  "referredEmail" TEXT,
  "convertedAt" TIMESTAMP(3),
  "rewardedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- Create indexes for referrals
CREATE INDEX IF NOT EXISTS "referrals_referrerId_idx" ON "referrals"("referrerId");
CREATE INDEX IF NOT EXISTS "referrals_referredUserId_idx" ON "referrals"("referredUserId");
CREATE INDEX IF NOT EXISTS "referrals_referralCode_idx" ON "referrals"("referralCode");
CREATE INDEX IF NOT EXISTS "referrals_status_idx" ON "referrals"("status");

-- Add foreign keys for referrals
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create AffiliateCommissionStatus enum
DO $$ BEGIN
  CREATE TYPE "AffiliateCommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create affiliate_commissions table
CREATE TABLE IF NOT EXISTS "affiliate_commissions" (
  "id" TEXT NOT NULL,
  "affiliateId" TEXT NOT NULL,
  "orderId" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "percentage" DECIMAL(5,2) NOT NULL,
  "status" "AffiliateCommissionStatus" NOT NULL DEFAULT 'PENDING',
  "description" TEXT,
  "paidAt" TIMESTAMP(3),
  "payoutId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "affiliate_commissions_pkey" PRIMARY KEY ("id")
);

-- Create indexes for affiliate_commissions
CREATE INDEX IF NOT EXISTS "affiliate_commissions_affiliateId_idx" ON "affiliate_commissions"("affiliateId");
CREATE INDEX IF NOT EXISTS "affiliate_commissions_status_idx" ON "affiliate_commissions"("status");
CREATE INDEX IF NOT EXISTS "affiliate_commissions_payoutId_idx" ON "affiliate_commissions"("payoutId");

-- Add foreign key for affiliate_commissions
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create AffiliatePayoutStatus enum
DO $$ BEGIN
  CREATE TYPE "AffiliatePayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create affiliate_payouts table
CREATE TABLE IF NOT EXISTS "affiliate_payouts" (
  "id" TEXT NOT NULL,
  "affiliateId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" "AffiliatePayoutStatus" NOT NULL DEFAULT 'PENDING',
  "paymentMethod" TEXT,
  "paymentDetails" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "affiliate_payouts_pkey" PRIMARY KEY ("id")
);

-- Create indexes for affiliate_payouts
CREATE INDEX IF NOT EXISTS "affiliate_payouts_affiliateId_idx" ON "affiliate_payouts"("affiliateId");
CREATE INDEX IF NOT EXISTS "affiliate_payouts_status_idx" ON "affiliate_payouts"("status");

-- Add foreign keys for affiliate_payouts
ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "affiliate_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

