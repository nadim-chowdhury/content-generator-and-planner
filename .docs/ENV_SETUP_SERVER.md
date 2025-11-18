# Backend Environment Variables Setup Guide

## Quick Setup

1. Copy the example file:
```bash
cp .env.example .env
```

2. Fill in the required values (see below)

3. Never commit `.env` to git (it's already in `.gitignore`)

## Required Variables

### 1. DATABASE_URL
**Required**: Yes  
**Example**: `postgresql://postgres:password@localhost:5432/content_generator?schema=public`

**How to get it:**
- Local PostgreSQL: Use your local database credentials
- Neon (Free PostgreSQL): Sign up at https://neon.tech, create a project, copy the connection string
- Supabase: Sign up at https://supabase.com, create a project, go to Settings > Database, copy the connection string
- Railway: Create a PostgreSQL service, copy the DATABASE_URL from the service variables

### 2. JWT_SECRET
**Required**: Yes  
**Example**: `your-super-secret-jwt-key-change-this-in-production-min-32-chars`

**How to generate:**
```bash
# Using OpenSSL
openssl rand -base64 32

# Or use any random string generator (minimum 32 characters)
```

### 3. OPENAI_API_KEY
**Required**: Yes (for AI idea generation)  
**Example**: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**How to get it:**
1. Sign up at https://platform.openai.com
2. Go to API Keys section
3. Create a new secret key
4. Copy and paste it here

**Note**: You'll need to add credits to your OpenAI account to use the API.

### 4. STRIPE_SECRET_KEY
**Required**: Yes (for payments)  
**Example (Test)**: `sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**How to get it:**
1. Sign up at https://stripe.com
2. Go to Developers > API keys
3. Copy the "Secret key" (use test key for development)
4. For production, use the live key from the same page

### 5. STRIPE_WEBHOOK_SECRET
**Required**: Yes (for webhook verification)  
**Example**: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**How to get it:**
1. In Stripe Dashboard, go to Developers > Webhooks
2. Click "Add endpoint"
3. Set URL to: `https://your-backend-url.com/api/billing/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the "Signing secret" (starts with `whsec_`)

**For local development:**
- Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/billing/webhook`
- It will give you a webhook secret starting with `whsec_`

### 6. STRIPE_PRICE_ID
**Required**: Yes (for Pro subscription)  
**Example**: `price_1xxxxxxxxxxxxxxxxxxxxx`

**How to get it:**
1. In Stripe Dashboard, go to Products
2. Create a new product (e.g., "Pro Plan")
3. Add a price: $10/month, recurring
4. Copy the Price ID (starts with `price_`)

### 7. FRONTEND_URL
**Required**: Yes  
**Development**: `http://localhost:3001`  
**Production**: `https://your-frontend-domain.com`

Used for:
- CORS configuration
- Stripe redirect URLs
- Email verification links

### 8. PORT
**Required**: No (defaults to 3000)  
**Example**: `3000`

The port your backend server will run on.

## Optional Variables

### Email Configuration
If you want to send verification emails and password reset emails, configure SMTP settings:
- `SMTP_HOST`: Your SMTP server (e.g., `smtp.gmail.com`)
- `SMTP_PORT`: SMTP port (usually 587 for TLS)
- `SMTP_USER`: Your email address
- `SMTP_PASS`: Your email password or app password
- `EMAIL_FROM`: The "from" address for emails

### Redis (Advanced)
For advanced caching and rate limiting:
- `REDIS_HOST`: Redis server host
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password (if required)

## Environment-Specific Setup

### Development
```env
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
PORT=3000
# Use test Stripe keys
STRIPE_SECRET_KEY=sk_test_...
```

### Production
```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
PORT=3000
# Use live Stripe keys
STRIPE_SECRET_KEY=sk_live_...
```

## Security Best Practices

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Use strong JWT_SECRET** - Minimum 32 characters, random
3. **Rotate keys regularly** - Especially in production
4. **Use different keys for dev/prod** - Never use production keys in development
5. **Restrict database access** - Use connection pooling and SSL in production
6. **Monitor API usage** - Set up alerts for OpenAI and Stripe usage

## Testing Your Configuration

After setting up your `.env` file:

1. **Test database connection:**
```bash
npx prisma db pull
```

2. **Test OpenAI connection:**
```bash
# The app will test this when you try to generate ideas
```

3. **Test Stripe connection:**
```bash
# Use Stripe CLI to test webhooks locally
stripe listen --forward-to localhost:3000/api/billing/webhook
```

## Troubleshooting

### Database Connection Issues
- Check if PostgreSQL is running
- Verify DATABASE_URL format is correct
- Ensure database exists
- Check firewall/network settings

### OpenAI API Issues
- Verify API key is correct
- Check if you have credits in your OpenAI account
- Ensure API key has proper permissions

### Stripe Webhook Issues
- Verify webhook secret is correct
- Check webhook URL is accessible
- Ensure webhook events are selected correctly
- Use Stripe CLI for local testing

## Need Help?

- Database: Check Prisma docs at https://www.prisma.io/docs
- OpenAI: Check OpenAI docs at https://platform.openai.com/docs
- Stripe: Check Stripe docs at https://stripe.com/docs

