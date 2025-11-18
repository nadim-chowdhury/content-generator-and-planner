# Setup Guide

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/content_generator?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_MODEL="gpt-4o-mini"
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
STRIPE_PRICE_ID="price_your-price-id"
FRONTEND_URL="http://localhost:3001"
PORT=3000
```

Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

Start the backend:
```bash
npm run start:dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

Start the frontend:
```bash
npm run dev
```

## Database Setup

1. Install PostgreSQL if not already installed
2. Create a new database:
```sql
CREATE DATABASE content_generator;
```
3. Update `DATABASE_URL` in backend `.env` file
4. Run migrations: `npx prisma migrate dev`

## OpenAI Setup

1. Sign up at https://platform.openai.com
2. Create an API key
3. Add it to `OPENAI_API_KEY` in backend `.env`
4. Recommended model: `gpt-4o-mini` (cheaper) or `gpt-4o` (better quality)

## Stripe Setup

1. Sign up at https://stripe.com
2. Get your API keys from the dashboard
3. Create a product and price for the Pro plan ($10/month)
4. Set up a webhook endpoint:
   - URL: `https://your-backend-url.com/api/billing/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Add all Stripe values to backend `.env`

## Testing

### Test Authentication
1. Sign up at http://localhost:3001/signup
2. Login at http://localhost:3001/login

### Test Idea Generation
1. Go to Dashboard
2. Enter a niche (e.g., "fitness")
3. Select platform and tone
4. Click "Generate 10 Ideas"
5. Save ideas to library

### Test Planner
1. Go to Planner page
2. Select an unscheduled idea
3. Choose a date
4. Click "Schedule"

### Test Billing (Test Mode)
1. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
2. Any future expiry date and CVC
3. Upgrade to Pro and verify unlimited generations

## Troubleshooting

### Backend won't start
- Check if PostgreSQL is running
- Verify DATABASE_URL is correct
- Run `npx prisma generate` again

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify NEXT_PUBLIC_API_URL matches backend URL
- Check backend is running on correct port

### OpenAI errors
- Verify API key is correct
- Check you have credits in OpenAI account
- Try a different model

### Stripe webhook not working
- Verify webhook URL is accessible
- Check webhook secret is correct
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/billing/webhook`

## Production Deployment

### Backend
1. Set all environment variables in your hosting platform
2. Run `npx prisma migrate deploy` to apply migrations
3. Build: `npm run build`
4. Start: `npm run start:prod`

### Frontend
1. Set `NEXT_PUBLIC_API_URL` to your production backend URL
2. Deploy to Vercel (recommended) or similar
3. Update CORS in backend to allow your frontend domain

