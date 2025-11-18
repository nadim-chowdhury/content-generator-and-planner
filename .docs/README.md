# Content Idea Generator + Planner SaaS

A full-stack SaaS application for content creators to generate AI-powered content ideas and plan their content calendar.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, Zustand
- **Backend**: NestJS, Prisma, PostgreSQL
- **AI**: OpenAI API
- **Payments**: Stripe
- **Authentication**: JWT

## Features

- ✅ User authentication (signup, login, JWT)
- ✅ AI-powered content idea generation (10 ideas per generation)
- ✅ Quota system (Free: 5 generations/day, Pro: unlimited)
- ✅ Ideas library with save, edit, delete, copy
- ✅ Calendar planner for scheduling content
- ✅ Stripe integration for Pro subscriptions
- ✅ Dashboard with statistics
- ✅ Responsive UI with dark mode support

## Setup Instructions

### Prerequisites

- Node.js 20+
- PostgreSQL database
- OpenAI API key
- Stripe account (for payments)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
   - Set `DATABASE_URL` to your PostgreSQL connection string
   - Set `JWT_SECRET` to a secure random string
   - Set `OPENAI_API_KEY` to your OpenAI API key
   - Set Stripe keys (for production)

5. Generate Prisma client:
```bash
npx prisma generate
```

6. Run database migrations:
```bash
npx prisma migrate dev --name init
```

7. Start the backend server:
```bash
npm run start:dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your backend URL:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3001`

## Database Schema

The application uses the following main tables:

- **users**: User accounts with authentication and billing info
- **ideas**: Generated and saved content ideas
- **sessions**: JWT session tokens
- **idea_generations**: Daily generation quota tracking

## API Endpoints

### Auth
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Ideas
- `POST /api/ideas/generate` - Generate 10 ideas
- `GET /api/ideas` - Get all user's ideas
- `GET /api/ideas/stats` - Get statistics
- `POST /api/ideas` - Create/save an idea
- `PATCH /api/ideas/:id` - Update an idea
- `DELETE /api/ideas/:id` - Delete an idea

### Planner
- `POST /api/planner/ideas/:id/schedule` - Schedule an idea
- `DELETE /api/planner/ideas/:id/schedule` - Unschedule an idea
- `GET /api/planner/calendar` - Get calendar events
- `GET /api/planner/upcoming` - Get upcoming scheduled items

### Billing
- `POST /api/billing/create-checkout` - Create Stripe checkout session
- `POST /api/billing/webhook` - Stripe webhook handler
- `GET /api/billing/status` - Get subscription status
- `POST /api/billing/portal` - Create billing portal session

## Stripe Setup

1. Create a Stripe account and get your API keys
2. Create a product and price in Stripe dashboard
3. Set up a webhook endpoint pointing to `/api/billing/webhook`
4. Add the webhook secret to your `.env` file
5. Update `STRIPE_PRICE_ID` in `.env` with your price ID

## Quota System

- **Free Plan**: 5 idea generations per day (each generation = 10 ideas)
- **Pro Plan**: Unlimited generations

The quota resets daily at midnight UTC.

## Development

### Backend
- Run in development mode: `npm run start:dev`
- Run tests: `npm test`
- Generate Prisma client: `npx prisma generate`
- View database: `npx prisma studio`

### Frontend
- Run in development mode: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm start`

## Deployment

### Backend
- Deploy to Railway, Render, or Fly.io
- Set environment variables in your hosting platform
- Run migrations: `npx prisma migrate deploy`

### Frontend
- Deploy to Vercel (recommended)
- Set `NEXT_PUBLIC_API_URL` environment variable
- Connect your repository and deploy

## License

MIT

