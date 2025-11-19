# Frontend - Content Generator & Planner

Next.js 16 frontend application for Content Generator & Planner SaaS.

## Features

- ✅ React 19 with Next.js 16
- ✅ TypeScript
- ✅ Tailwind CSS 4
- ✅ Sentry error monitoring
- ✅ PostHog analytics
- ✅ Responsive design
- ✅ Dark mode support

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_POSTHOG_API_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/             # Utility functions and API clients
├── hooks/           # Custom React hooks
├── store/           # State management (Zustand)
└── public/          # Static assets
```

## Features Implemented

- Authentication (login, signup, social login)
- AI content idea generation
- Planner and calendar
- Kanban board
- Team collaboration
- Billing and subscriptions
- Admin panel
- Settings
- Help center
- Legal pages (Terms, Privacy, Cookies)

## Error Monitoring

Sentry is integrated for error tracking. Configure `NEXT_PUBLIC_SENTRY_DSN` to enable.

## Analytics

PostHog is integrated for user analytics. Configure `NEXT_PUBLIC_POSTHOG_API_KEY` to enable.

## Deployment

The app can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Any Node.js hosting platform

## Support

For issues or questions, contact support@contentgenerator.com
