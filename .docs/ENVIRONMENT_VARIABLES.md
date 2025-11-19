# Environment Variables Documentation

This document describes all environment variables required for the Content Generator & Planner backend.

## Required Environment Variables

### Database
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/content_generator"
```
PostgreSQL connection string. Required for database operations.

### JWT Authentication
```bash
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-token-secret-min-32-chars"
JWT_REFRESH_EXPIRES_IN="7d"
```
JWT configuration for authentication tokens.

### Application
```bash
NODE_ENV="development" # or "production"
PORT=3000
FRONTEND_URL="http://localhost:3001"
API_URL="http://localhost:3000"
ALLOWED_ORIGINS="http://localhost:3001,https://yourdomain.com"
```
Application configuration.

### OpenAI (AI Features)
```bash
OPENAI_API_KEY="sk-..."  # Primary API key (required)
OPENAI_API_KEYS="sk-...,sk-...,sk-..."  # Additional API keys (optional, comma or space separated)
OPENAI_MODEL="gpt-4o"  # Model to use (default: gpt-4o)
```
Required for AI content generation features. You can provide multiple API keys for load balancing and rate limit management. The system will automatically rotate between keys and handle rate limits.

### Stripe (Billing)
```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```
Stripe configuration for payment processing.

### Email (SMTP)
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@contentgenerator.com"
```
Email configuration for transactional emails.

### Redis (Queue & Caching)
```bash
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD="" # Optional
```
Redis configuration for BullMQ queues and caching.

### Social Authentication
```bash
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

FACEBOOK_APP_ID="..."
FACEBOOK_APP_SECRET="..."
FACEBOOK_CALLBACK_URL="http://localhost:3000/api/auth/facebook/callback"

GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GITHUB_CALLBACK_URL="http://localhost:3000/api/auth/github/callback"
```
OAuth credentials for social login providers.

## Optional Environment Variables

### Error Monitoring (Sentry)
```bash
SENTRY_DSN="https://..."
SENTRY_ENABLE_DEV=false # Set to true to enable in development
APP_VERSION="1.0.0"
```
Sentry configuration for error tracking. If not set, error monitoring is disabled.

### Analytics (PostHog)
```bash
POSTHOG_API_KEY="..."
POSTHOG_HOST="https://app.posthog.com"
```
PostHog configuration for analytics. If not set, analytics are disabled.

### Logging
```bash
LOG_LEVEL="info" # debug, info, warn, error
```
Logging level. Defaults to "info" in production, "debug" in development.

### Swagger API Documentation
```bash
ENABLE_SWAGGER=false # Set to true to enable in production
```
Enable Swagger API documentation in production (disabled by default).

### Encryption
```bash
ENCRYPTION_KEY="your-32-character-encryption-key"
```
AES-256-GCM encryption key for sensitive data. If not set, a default key is used (not recommended for production).

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_SWAGGER=true
SENTRY_ENABLE_DEV=false
```

### Production
```bash
NODE_ENV=production
LOG_LEVEL=info
ENABLE_SWAGGER=false
SENTRY_ENABLE_DEV=false
```

## Security Notes

1. **Never commit `.env` files to version control**
2. **Use strong, unique secrets for JWT and encryption keys**
3. **Rotate secrets regularly in production**
4. **Use environment-specific values (different keys for dev/staging/prod)**
5. **Store sensitive variables in secure secret management systems (AWS Secrets Manager, HashiCorp Vault, etc.)**

## Example .env File

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/content_generator"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-token-secret-min-32-chars"
JWT_REFRESH_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:3001"
API_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@contentgenerator.com"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Sentry (Optional)
SENTRY_DSN="https://..."

# PostHog (Optional)
POSTHOG_API_KEY="..."
```

