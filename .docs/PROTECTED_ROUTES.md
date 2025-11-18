# Protected Routes Implementation

## Overview

The frontend now has a comprehensive protected route system with two layers of protection:

1. **Next.js Middleware** - Server-side route protection
2. **ProtectedRoute Component** - Client-side authentication verification

## Implementation Details

### 1. Next.js Middleware (`middleware.ts`)

Located at the root of the `frontend` directory, this middleware runs on the server before requests are processed.

**Features:**
- Protects routes: `/dashboard`, `/ideas`, `/planner`, `/billing`
- Redirects unauthenticated users to `/login` with a redirect parameter
- Redirects authenticated users away from `/login` and `/signup` to `/dashboard`
- Checks for token in cookies or Authorization header

**Protected Routes:**
```typescript
const protectedRoutes = ['/dashboard', '/ideas', '/planner', '/billing'];
```

**Auth Routes (redirect if authenticated):**
```typescript
const authRoutes = ['/login', '/signup'];
```

### 2. ProtectedRoute Component (`components/ProtectedRoute.tsx`)

A reusable React component that wraps protected pages.

**Features:**
- Verifies authentication token by calling `/api/auth/me`
- Shows loading state while checking authentication
- Redirects to login if not authenticated
- Can be configured to require or not require authentication

**Usage:**
```tsx
<ProtectedRoute>
  {/* Your protected content */}
</ProtectedRoute>
```

**Props:**
- `requireAuth` (default: `true`) - Whether authentication is required
- `redirectTo` (default: `/login`) - Where to redirect if not authenticated

### 3. Auth Store Updates (`store/auth-store.ts`)

The auth store now:
- Stores token in both localStorage and cookies
- Cookies are accessible to middleware
- Clears both on logout

## Protected Pages

All these pages are now protected:

1. **Dashboard** (`/dashboard`)
2. **Ideas Library** (`/ideas`)
3. **Planner** (`/planner`)
4. **Billing** (`/billing`)

## Public Pages

These pages are accessible without authentication:

1. **Landing Page** (`/`)
2. **Login** (`/login`) - Redirects to dashboard if already authenticated
3. **Signup** (`/signup`) - Redirects to dashboard if already authenticated

## How It Works

### Flow for Protected Route Access:

1. User tries to access `/dashboard`
2. **Middleware** checks for token in cookies/headers
3. If no token → Redirect to `/login?redirect=/dashboard`
4. If token exists → Allow request to proceed
5. **ProtectedRoute Component** verifies token with backend (`/api/auth/me`)
6. If token invalid → Clear auth, redirect to login
7. If token valid → Render page content

### Flow for Login/Signup:

1. User tries to access `/login`
2. **Middleware** checks for token
3. If token exists → Redirect to `/dashboard`
4. If no token → Allow access
5. **ProtectedRoute Component** (with `requireAuth={false}`) allows rendering

## Benefits

1. **Double Protection**: Both server-side (middleware) and client-side (component) checks
2. **Better UX**: Loading states while verifying authentication
3. **Token Validation**: Actually verifies token is still valid with backend
4. **Redirect Preservation**: Saves intended destination and redirects after login
5. **Automatic Cleanup**: Clears invalid tokens automatically

## Testing

### Test Protected Routes:
1. Try accessing `/dashboard` without logging in → Should redirect to `/login`
2. After login, try accessing `/dashboard` → Should work
3. Logout and try accessing `/dashboard` → Should redirect to `/login`

### Test Auth Routes:
1. While logged in, try accessing `/login` → Should redirect to `/dashboard`
2. While logged out, try accessing `/login` → Should show login form

### Test Token Validation:
1. Manually invalidate token in localStorage
2. Try accessing protected route → Should redirect to login
3. Token is automatically cleared

## Security Notes

- Tokens are stored in both localStorage (for API calls) and cookies (for middleware)
- Cookies use `SameSite=Lax` for CSRF protection
- Tokens are validated with backend on each protected route access
- Invalid tokens are automatically cleared
- All API calls include token in Authorization header

## Future Enhancements

Potential improvements:
- Refresh token mechanism
- Role-based access control (RBAC)
- Route-level permissions
- Session timeout handling
- Remember me functionality

