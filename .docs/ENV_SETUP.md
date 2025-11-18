# Frontend Environment Variables Setup Guide

## Quick Setup

1. Copy the example file:
```bash
cp .env.example .env.local
```

2. Fill in the required values (see below)

3. Never commit `.env.local` to git (it's already in `.gitignore`)

## Required Variables

### NEXT_PUBLIC_API_URL
**Required**: Yes  
**Description**: The URL of your backend API server

**Development**: 
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

**Production**: 
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
```

**How to set it:**
- For local development: Use `http://localhost:3000` (or whatever port your backend runs on)
- For production: Use your deployed backend URL (e.g., `https://api.yourdomain.com` or `https://your-backend.railway.app`)

**Note**: 
- The `NEXT_PUBLIC_` prefix is required for Next.js to expose this variable to the browser
- This variable is used in `lib/api.ts` to configure the axios base URL
- Make sure your backend CORS settings allow requests from your frontend domain

## Environment-Specific Setup

### Development
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

Make sure:
- Your backend is running on port 3000 (or update to match your backend port)
- Backend CORS is configured to allow `http://localhost:3001` (default Next.js dev port)

### Production
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
```

Make sure:
- Your backend is deployed and accessible
- Backend CORS is configured to allow your frontend domain
- Both frontend and backend use HTTPS in production

## File Locations

Next.js supports multiple environment files with different priorities:

1. `.env.local` - **Recommended for local development** (ignored by git)
2. `.env.development` - Used in development mode
3. `.env.production` - Used in production builds
4. `.env` - Default fallback

**Best Practice**: Use `.env.local` for your local development setup.

## Testing Your Configuration

After setting up your `.env.local` file:

1. **Restart your Next.js dev server:**
```bash
npm run dev
```

2. **Check if the API URL is loaded:**
- Open browser console
- The API client should use the URL from `NEXT_PUBLIC_API_URL`
- Try making a request (e.g., signup/login) and check network tab

3. **Verify CORS:**
- If you see CORS errors, check your backend CORS configuration
- Ensure `FRONTEND_URL` in backend matches your frontend URL

## Troubleshooting

### API Requests Failing
- **Check the URL**: Verify `NEXT_PUBLIC_API_URL` is correct
- **Check CORS**: Ensure backend allows your frontend origin
- **Check backend is running**: Make sure your backend server is up
- **Check network tab**: Look for 404 or CORS errors in browser console

### Environment Variable Not Loading
- **Restart dev server**: Next.js only loads env vars on startup
- **Check prefix**: Must start with `NEXT_PUBLIC_` to be available in browser
- **Check file name**: Use `.env.local` for local development
- **Clear cache**: Try deleting `.next` folder and restarting

### CORS Errors
- **Backend CORS**: Check `FRONTEND_URL` in backend `.env` matches your frontend URL
- **Credentials**: If using cookies/auth, ensure CORS allows credentials
- **Headers**: Verify Authorization header is allowed

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use different URLs for dev/prod** - Never use production API in development
3. **HTTPS in production** - Always use HTTPS for production API URLs
4. **Validate URLs** - Ensure API URL is correct before deploying

## Example Files

### `.env.local` (Development)
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### `.env.production` (Production - optional)
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
```

## Need Help?

- Next.js Environment Variables: https://nextjs.org/docs/basic-features/environment-variables
- API Configuration: Check `lib/api.ts` in this project
- CORS Issues: Check backend `main.ts` CORS configuration

