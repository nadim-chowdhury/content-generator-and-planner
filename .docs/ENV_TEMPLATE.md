# Complete Backend Environment Variables Template

Copy this content to your `.env` file and fill in your actual values.

```bash
# ============================================
# Content Generator & Planner - Backend .env
# ============================================
# Copy this file to .env and fill in your values
# NEVER commit .env to version control

# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL="postgresql://user:password@localhost:5432/content_generator"

# ============================================
# APPLICATION CONFIGURATION
# ============================================
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:3001"
API_URL="http://localhost:3000"
ALLOWED_ORIGINS="http://localhost:3001,http://localhost:3000"

# ============================================
# JWT AUTHENTICATION
# ============================================
# Generate strong secrets: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-token-secret-minimum-32-characters-long"
JWT_REFRESH_EXPIRES_IN="7d"

# ============================================
# OPENAI CONFIGURATION (AI Features)
# ============================================
# Primary API key (required)
OPENAI_API_KEY="sk-proj-..."

# Additional API keys for load balancing (optional, comma or space separated)
# The system will automatically rotate between keys and handle rate limits
OPENAI_API_KEYS="sk-proj-...,sk-proj-...,sk-proj-..."

# Model to use (default: gpt-4o)
# Options: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
OPENAI_MODEL="gpt-4o"

# ============================================
# STRIPE CONFIGURATION (Billing)
# ============================================
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Product IDs (optional, for plan management)
STRIPE_PRODUCT_ID_FREE="prod_..."
STRIPE_PRODUCT_ID_PRO="prod_..."
STRIPE_PRODUCT_ID_AGENCY="prod_..."

# Stripe Price IDs (optional, for plan management)
STRIPE_PRICE_ID_PRO_MONTHLY="price_..."
STRIPE_PRICE_ID_PRO_YEARLY="price_..."
STRIPE_PRICE_ID_AGENCY_MONTHLY="price_..."
STRIPE_PRICE_ID_AGENCY_YEARLY="price_..."

# ============================================
# EMAIL CONFIGURATION (SMTP)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@contentgenerator.com"
SMTP_FROM_NAME="Content Generator & Planner"

# Alternative: SendGrid
# SMTP_HOST="smtp.sendgrid.net"
# SMTP_PORT=587
# SMTP_USER="apikey"
# SMTP_PASS="SG.xxx"

# Alternative: AWS SES
# SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
# SMTP_PORT=587
# SMTP_USER="your-access-key"
# SMTP_PASS="your-secret-key"

# ============================================
# REDIS CONFIGURATION (Queue & Caching)
# ============================================
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_DB=0
REDIS_URL="redis://localhost:6379"

# For Redis Cloud or production
# REDIS_URL="redis://:password@host:port"

# ============================================
# SOCIAL AUTHENTICATION (OAuth)
# ============================================
# Google OAuth
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

# Facebook OAuth
# Get from: https://developers.facebook.com/apps
FACEBOOK_APP_ID="..."
FACEBOOK_APP_SECRET="..."
FACEBOOK_CALLBACK_URL="http://localhost:3000/api/auth/facebook/callback"

# GitHub OAuth
# Get from: https://github.com/settings/developers
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GITHUB_CALLBACK_URL="http://localhost:3000/api/auth/github/callback"

# ============================================
# SOCIAL MEDIA PLATFORM APIs (Auto-Posting)
# ============================================
# Twitter/X API (for token refresh)
# Get from: https://developer.twitter.com/en/portal/dashboard
TWITTER_CLIENT_ID="..."
TWITTER_CLIENT_SECRET="..."

# LinkedIn API (for token refresh)
# Get from: https://www.linkedin.com/developers/apps
LINKEDIN_CLIENT_ID="..."
LINKEDIN_CLIENT_SECRET="..."

# Instagram uses Facebook Graph API (same as Facebook)
# No additional credentials needed if Facebook is configured

# ============================================
# ERROR MONITORING (Sentry)
# ============================================
# Get from: https://sentry.io/settings/projects/
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_ENABLE_DEV=false
APP_VERSION="1.0.0"

# ============================================
# ANALYTICS (PostHog)
# ============================================
# Get from: https://app.posthog.com/project/settings
POSTHOG_API_KEY="..."
POSTHOG_HOST="https://app.posthog.com"

# ============================================
# LOGGING CONFIGURATION
# ============================================
# Options: debug, info, warn, error
LOG_LEVEL="info"

# ============================================
# API DOCUMENTATION (Swagger)
# ============================================
# Set to true to enable Swagger UI in production (disabled by default)
ENABLE_SWAGGER=false

# ============================================
# SECURITY & ENCRYPTION
# ============================================
# Generate: openssl rand -base64 32
# Used for encrypting sensitive data (tokens, etc.)
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# ============================================
# RATE LIMITING
# ============================================
# Requests per minute per IP
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# ============================================
# FILE UPLOAD (if applicable)
# ============================================
# Maximum file size in bytes (default: 10MB)
MAX_FILE_SIZE=10485760
UPLOAD_DEST="./uploads"

# ============================================
# CORS CONFIGURATION
# ============================================
# Comma-separated list of allowed origins
# CORS_ORIGINS="http://localhost:3001,https://yourdomain.com"

# ============================================
# SESSION CONFIGURATION
# ============================================
SESSION_SECRET="your-session-secret-minimum-32-characters"
SESSION_MAX_AGE=86400000

# ============================================
# PRODUCTION-SPECIFIC
# ============================================
# Set these in production environment

# Database connection pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Health check
HEALTH_CHECK_ENABLED=true

# ============================================
# DEVELOPMENT ONLY
# ============================================
# Set to true to enable detailed error messages
DEBUG=false
```

## Quick Setup Guide

### 1. Generate Secrets
```bash
# Generate JWT secrets
openssl rand -base64 32

# Generate encryption key
openssl rand -base64 32
```

### 2. Required Variables (Minimum)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - At least 32 characters
- `JWT_REFRESH_SECRET` - At least 32 characters
- `OPENAI_API_KEY` - Your OpenAI API key
- `ENCRYPTION_KEY` - 32 character encryption key

### 3. Optional but Recommended
- `STRIPE_SECRET_KEY` - For billing features
- `SMTP_*` - For email functionality
- `REDIS_*` - For queue and caching
- `SENTRY_DSN` - For error monitoring
- `POSTHOG_API_KEY` - For analytics

### 4. Social Media (Auto-Posting)
- `FACEBOOK_APP_ID` & `FACEBOOK_APP_SECRET` - For Facebook/Instagram posting
- `TWITTER_CLIENT_ID` & `TWITTER_CLIENT_SECRET` - For Twitter/X posting
- `LINKEDIN_CLIENT_ID` & `LINKEDIN_CLIENT_SECRET` - For LinkedIn posting

## Security Notes

1. **Never commit `.env` files to version control**
2. **Use strong, unique secrets** (minimum 32 characters)
3. **Rotate secrets regularly** in production
4. **Use environment-specific values** (different keys for dev/staging/prod)
5. **Store sensitive variables** in secure secret management systems (AWS Secrets Manager, HashiCorp Vault, etc.)
6. **For production**, use environment variables from your hosting provider instead of `.env` file

