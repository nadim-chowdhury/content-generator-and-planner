# Admin Panel (Full SaaS Backoffice) Implementation

## Overview
This document describes the implementation of the full admin panel (SaaS backoffice) with user management and billing controls.

## Features Implemented

### 10.1 User Management

#### View Users
- Enhanced the existing user list view to include:
  - Banned status indicator
  - Daily AI generations count
  - Bonus credits count
  - Improved user details display

#### Ban/Unban Users
- **Backend:**
  - `AdminUserManagementService.banUser()` - Bans a user with optional reason
  - `AdminUserManagementService.unbanUser()` - Unbans a user
  - Automatically revokes all active sessions when a user is banned
  - Added banned user checks in JWT strategy and login flow
- **Frontend:**
  - Ban button with modal for entering reason
  - Unban button with confirmation
  - Visual indicator for banned users

#### Change Plan Manually
- Already implemented in existing admin controller
- Enhanced UI in admin users page

#### Reset User Quota
- **Backend:**
  - `AdminUserManagementService.resetUserQuota()` - Resets daily AI generations to 0
- **Frontend:**
  - "Reset Quota" button in user actions

#### Add Bonus Credits
- **Backend:**
  - `AdminUserManagementService.addBonusCredits()` - Adds bonus credits to user account
- **Frontend:**
  - Input field and button per user to add bonus credits

### 10.2 Billing Controls

#### View Subscriptions
- **Backend:**
  - `AdminBillingService.getAllSubscriptions()` - Lists all active subscriptions with user info
  - Fetches subscription details from Stripe
  - Includes pagination
- **Frontend:**
  - Subscriptions tab in billing page
  - Displays user, plan, status, amount, and billing period
  - Pagination controls

#### Manage Invoices
- **Backend:**
  - `AdminBillingService.getAllInvoices()` - Lists all invoices from Stripe
  - `AdminBillingService.getUserInvoices()` - Gets invoices for a specific user
  - Includes user information mapping
- **Frontend:**
  - Invoices tab in billing page
  - Displays invoice number, user, amount, status, and date
  - Link to view invoice PDF

#### Refunds
- **Backend:**
  - `AdminBillingService.processRefund()` - Processes refunds via Stripe API
  - Supports full or partial refunds
  - Optional refund reason
- **Frontend:**
  - Refunds tab with form to process refunds
  - Input for payment intent ID
  - Optional amount and reason fields

#### Cancel Accounts
- **Backend:**
  - `AdminBillingService.cancelUserSubscription()` - Cancels user subscriptions
  - Supports immediate cancellation or cancellation at period end
  - Updates user plan to FREE if canceled immediately
- **Frontend:**
  - Cancel button in subscriptions list
  - Modal to choose immediate or period-end cancellation

## Database Changes

### Schema Updates
Added to `User` model:
- `banned: Boolean @default(false)` - Whether the user is banned
- `bannedAt: DateTime?` - When the user was banned
- `bannedReason: String?` - Reason for banning
- `bonusCredits: Int @default(0)` - Bonus AI generation credits

### Migration
Created `backend/prisma/migrations/add_admin_fields.sql` with:
- ALTER TABLE statements to add new fields
- Index on `banned` field for faster queries

## Backend Implementation

### New Services

1. **AdminUserManagementService** (`backend/src/admin/services/admin-user-management.service.ts`)
   - Ban/unban users
   - Reset user quotas
   - Add bonus credits
   - Get user quota information

2. **AdminBillingService** (`backend/src/admin/services/admin-billing.service.ts`)
   - Manage subscriptions
   - Manage invoices
   - Process refunds
   - Cancel subscriptions

### Updated Services

1. **AdminController** (`backend/src/admin/admin.controller.ts`)
   - Added endpoints for user management (ban, unban, reset quota, add credits)
   - Added endpoints for billing management (subscriptions, invoices, refunds, cancel)

2. **JwtStrategy** (`backend/src/auth/strategies/jwt.strategy.ts`)
   - Added banned user check in token validation

3. **AuthService** (`backend/src/auth/auth.service.ts`)
   - Added banned user check in login flow

### New Endpoints

#### User Management
- `POST /api/admin/users/:userId/ban` - Ban a user
- `POST /api/admin/users/:userId/unban` - Unban a user
- `POST /api/admin/users/:userId/reset-quota` - Reset user quota
- `POST /api/admin/users/:userId/bonus-credits` - Add bonus credits
- `GET /api/admin/users/:userId/quota` - Get user quota info

#### Billing Management
- `GET /api/admin/billing/subscriptions` - List all subscriptions
- `GET /api/admin/billing/invoices` - List all invoices
- `GET /api/admin/billing/users/:userId/subscription` - Get user subscription
- `GET /api/admin/billing/users/:userId/invoices` - Get user invoices
- `POST /api/admin/billing/refund` - Process refund
- `POST /api/admin/billing/users/:userId/cancel-subscription` - Cancel subscription

## Frontend Implementation

### Updated Components

1. **Admin Users Page** (`frontend/app/admin/users/page.tsx`)
   - Added ban/unban functionality
   - Added reset quota button
   - Added bonus credits input per user
   - Enhanced user display with banned status
   - Added usage info in edit modal

2. **Admin Dashboard** (`frontend/app/admin/dashboard/page.tsx`)
   - Added link to billing management page

### New Components

1. **Admin Billing Page** (`frontend/app/admin/billing/page.tsx`)
   - Tabs for Subscriptions, Invoices, and Refunds
   - Subscription management with cancel functionality
   - Invoice listing with links to PDFs
   - Refund processing form

### Updated API Client

**Admin API** (`frontend/lib/admin.ts`)
- Added interfaces for `Subscription`, `SubscriptionWithUser`, `Invoice`, `UserQuota`
- Added methods:
  - `banUser()`, `unbanUser()`, `resetUserQuota()`, `addBonusCredits()`, `getUserQuota()`
  - `getAllSubscriptions()`, `getAllInvoices()`, `getUserSubscription()`, `getUserInvoices()`
  - `processRefund()`, `cancelUserSubscription()`

## Security Considerations

1. **Banned User Protection:**
   - Banned users cannot authenticate (checked in JWT strategy and login)
   - All sessions are revoked when a user is banned
   - Banned status is checked on every authenticated request

2. **Admin-Only Access:**
   - All admin endpoints are protected by `JwtAuthGuard` and `RolesGuard`
   - Only users with `ADMIN` role can access these endpoints

3. **Self-Protection:**
   - Admins cannot ban themselves
   - Admins cannot change their own role

## Usage

### Banning a User
1. Navigate to Admin > Users
2. Click "Ban" on the user
3. Enter optional reason
4. Click "Ban User"
5. User's sessions are revoked immediately

### Adding Bonus Credits
1. Navigate to Admin > Users
2. Enter credits in the "Bonus credits" input field
3. Click "Add Credits"
4. Credits are added to the user's account

### Processing a Refund
1. Navigate to Admin > Billing > Refunds
2. Enter payment intent ID
3. Optionally enter amount (leave empty for full refund)
4. Optionally select refund reason
5. Click "Process Refund"

### Canceling a Subscription
1. Navigate to Admin > Billing > Subscriptions
2. Click "Cancel" on the subscription
3. Choose immediate or period-end cancellation
4. Confirm cancellation

## Testing Checklist

- [ ] Ban user and verify they cannot login
- [ ] Unban user and verify they can login again
- [ ] Reset user quota and verify it's reset
- [ ] Add bonus credits and verify they're added
- [ ] View subscriptions list
- [ ] View invoices list
- [ ] Process a refund (test with Stripe test mode)
- [ ] Cancel a subscription (immediate and period-end)
- [ ] Verify banned users cannot access protected routes
- [ ] Verify admin-only access is enforced

## Notes

- Stripe integration requires `STRIPE_SECRET_KEY` environment variable
- Refunds require valid payment intent IDs from Stripe
- Subscription cancellation updates user plan to FREE if immediate
- Bonus credits are stored in the database and should be consumed by the quota system
- Banned users' sessions are automatically revoked when banned

