# Complete Frontend Environment Variables Template

Copy this content to your `.env.local` file (or `.env` for production) and fill in your actual values.

## Important Notes

- **Next.js requires `NEXT_PUBLIC_` prefix** for environment variables that need to be accessible in the browser
- Variables without `NEXT_PUBLIC_` prefix are only available on the server-side
- Use `.env.local` for local development (this file is gitignored)
- Use `.env` for production deployments

```bash
# ============================================
# Content Generator & Planner - Frontend .env
# ============================================
# Copy this file to .env.local for development
# NEVER commit .env.local to version control

# ============================================
# API CONFIGURATION
# ============================================
# Backend API URL (required)
NEXT_PUBLIC_API_URL="http://localhost:3000"

# For production, use your backend domain
# NEXT_PUBLIC_API_URL="https://api.yourdomain.com"

# ============================================
# ERROR MONITORING (Sentry)
# ============================================
# Get from: https://sentry.io/settings/projects/
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# Enable Sentry in development (optional, default: false)
NEXT_PUBLIC_SENTRY_ENABLE_DEV=false

# Sentry organization and project (for build-time configuration)
# These are used during build, not runtime
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"

# ============================================
# ANALYTICS (PostHog)
# ============================================
# Get from: https://app.posthog.com/project/settings
NEXT_PUBLIC_POSTHOG_API_KEY="phc_..."

# PostHog host (optional, defaults to https://app.posthog.com)
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# For self-hosted PostHog
# NEXT_PUBLIC_POSTHOG_HOST="https://posthog.yourdomain.com"

# ============================================
# STRIPE (Billing - Frontend)
# ============================================
# Get from: https://dashboard.stripe.com/apikeys
# Use publishable key (starts with pk_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# For production
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# ============================================
# APPLICATION CONFIGURATION
# ============================================
# Node environment (automatically set by Next.js)
# NODE_ENV="development"  # or "production"

# Application name (optional, for meta tags)
NEXT_PUBLIC_APP_NAME="Content Generator & Planner"

# Application URL (optional, for sharing/OG tags)
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# For production
# NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# ============================================
# FEATURE FLAGS (Optional)
# ============================================
# Enable/disable features
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_MONITORING=true
NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true

# ============================================
# SOCIAL LOGIN (Optional - URLs are auto-generated)
# ============================================
# Social login URLs are automatically generated from NEXT_PUBLIC_API_URL
# No additional configuration needed unless you have custom OAuth endpoints

# ============================================
# DEVELOPMENT ONLY
# ============================================
# Enable debug mode (optional)
NEXT_PUBLIC_DEBUG=false

# ============================================
# PRODUCTION-SPECIFIC
# ============================================
# These are typically set by your hosting provider (Vercel, Netlify, etc.)

# Build-time environment
# NODE_ENV="production"

# Analytics and monitoring are enabled by default in production
# Disable if needed:
# NEXT_PUBLIC_ENABLE_ANALYTICS=false
# NEXT_PUBLIC_ENABLE_ERROR_MONITORING=false
```

## Quick Setup Guide

### 1. Minimum Required Variables

```bash
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 2. Recommended Variables

```bash
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
NEXT_PUBLIC_POSTHOG_API_KEY="phc_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 3. File Location

- **Development**: Create `.env.local` in the `frontend/` directory
- **Production**: Set environment variables in your hosting provider (Vercel, Netlify, etc.)

### 4. Variable Categories

1. **API Configuration** - Backend API URL
2. **Error Monitoring** - Sentry DSN and configuration
3. **Analytics** - PostHog API key and host
4. **Billing** - Stripe publishable key
5. **Application** - App name, URL, feature flags
6. **Development** - Debug settings

## Environment-Specific Examples

### Development (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
NEXT_PUBLIC_SENTRY_ENABLE_DEV=false
NEXT_PUBLIC_POSTHOG_API_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3001"
NEXT_PUBLIC_DEBUG=true
```

### Production (Vercel/Netlify Environment Variables)
```bash
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
NEXT_PUBLIC_POSTHOG_API_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

## Security Notes

1. **Never commit `.env.local` files** to version control (already in .gitignore)
2. **Use different keys** for development and production
3. **Stripe keys**: Use test keys (`pk_test_`) for development, live keys (`pk_live_`) for production
4. **Sentry DSN**: Can be public (it's safe to expose in frontend code)
5. **PostHog API Key**: Can be public (it's safe to expose in frontend code)
6. **API URL**: Make sure your backend CORS is configured to allow requests from your frontend URL

## Next.js Environment Variables

### Public Variables (Browser Accessible)
- Must start with `NEXT_PUBLIC_`
- Exposed to the browser
- Included in the client bundle
- Examples: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SENTRY_DSN`

### Server-Only Variables
- No `NEXT_PUBLIC_` prefix
- Only available in server-side code (API routes, server components)
- Not exposed to the browser
- Examples: `SENTRY_ORG`, `SENTRY_PROJECT`

## Troubleshooting

### Variables not working?
1. Make sure they start with `NEXT_PUBLIC_` if needed in browser
2. Restart the Next.js dev server after adding new variables
3. Check that the file is named `.env.local` (not `.env`)
4. Verify the variable names match exactly (case-sensitive)

### Build-time vs Runtime
- Variables used in `next.config.ts` are read at build time
- Variables with `NEXT_PUBLIC_` are embedded at build time
- Server-only variables are read at runtime

