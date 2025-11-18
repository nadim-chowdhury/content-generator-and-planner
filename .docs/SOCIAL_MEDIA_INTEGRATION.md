# Social Media Integration Guide

## Overview

This application supports connecting and auto-posting to multiple social media platforms:

- ✅ Facebook
- ✅ Twitter/X
- ✅ Instagram
- ✅ Threads
- ✅ LinkedIn
- ✅ Reddit
- ✅ Quora
- ✅ Pinterest
- ✅ TikTok
- ✅ YouTube

## Architecture

### Database Schema

The `SocialConnection` model stores OAuth tokens and connection details for each platform:

```prisma
model SocialConnection {
  id              String         @id @default(cuid())
  userId          String
  platform        SocialPlatform
  accessToken     String
  refreshToken    String?
  tokenExpiresAt  DateTime?
  platformUserId  String?
  platformUsername String?
  isActive        Boolean        @default(true)
  ...
}
```

### API Endpoints

- `POST /api/social/connect` - Connect a platform
- `GET /api/social/connections` - Get all connected platforms
- `DELETE /api/social/disconnect/:platform` - Disconnect a platform
- `POST /api/social/post/:ideaId/:platform` - Post an idea to a platform

## Implementation Status

### ✅ Completed
- Database schema for social connections
- API endpoints structure
- Service layer foundation

### 🚧 TODO: Platform-Specific Integrations

Each platform requires specific implementation:

#### 1. Twitter/X
**API**: Twitter API v2  
**OAuth**: OAuth 2.0  
**Package**: `twitter-api-v2`  
**Docs**: https://developer.twitter.com/en/docs

```typescript
// Example implementation needed
async postToTwitter(accessToken: string, content: { caption: string }) {
  const client = new TwitterApi(accessToken);
  await client.v2.tweet({ text: content.caption });
}
```

#### 2. Facebook
**API**: Facebook Graph API  
**OAuth**: OAuth 2.0  
**Package**: `facebook-nodejs-business-sdk`  
**Docs**: https://developers.facebook.com/docs/graph-api

#### 3. Instagram
**API**: Instagram Graph API  
**OAuth**: OAuth 2.0  
**Package**: `instagram-basic-display-api`  
**Docs**: https://developers.facebook.com/docs/instagram-api

#### 4. LinkedIn
**API**: LinkedIn API v2  
**OAuth**: OAuth 2.0  
**Package**: `linkedin-api`  
**Docs**: https://docs.microsoft.com/en-us/linkedin/

#### 5. Reddit
**API**: Reddit API  
**OAuth**: OAuth 2.0  
**Package**: `snoowrap`  
**Docs**: https://www.reddit.com/dev/api

#### 6. Pinterest
**API**: Pinterest API v5  
**OAuth**: OAuth 2.0  
**Package**: `pinterest-api`  
**Docs**: https://developers.pinterest.com/

#### 7. TikTok
**API**: TikTok Marketing API  
**OAuth**: OAuth 2.0  
**Package**: `tiktok-api`  
**Docs**: https://developers.tiktok.com/

#### 8. YouTube
**API**: YouTube Data API v3  
**OAuth**: OAuth 2.0  
**Package**: `googleapis`  
**Docs**: https://developers.google.com/youtube/v3

## OAuth Flow Implementation

### Step 1: Create OAuth App for Each Platform

1. **Twitter**: https://developer.twitter.com/en/portal/dashboard
2. **Facebook**: https://developers.facebook.com/apps/
3. **Instagram**: https://developers.facebook.com/apps/ (same as Facebook)
4. **LinkedIn**: https://www.linkedin.com/developers/apps
5. **Reddit**: https://www.reddit.com/prefs/apps
6. **Pinterest**: https://developers.pinterest.com/apps/
7. **TikTok**: https://developers.tiktok.com/
8. **YouTube**: https://console.cloud.google.com/apis/credentials

### Step 2: Add OAuth Credentials to .env

```env
# Twitter
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_CALLBACK_URL=https://yourdomain.com/api/social/callback/twitter

# Facebook
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_CALLBACK_URL=https://yourdomain.com/api/social/callback/facebook

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_CALLBACK_URL=https://yourdomain.com/api/social/callback/linkedin

# ... add for other platforms
```

### Step 3: Implement OAuth Callback Endpoints

Create OAuth callback handlers in `social.controller.ts`:

```typescript
@Get('oauth/:platform')
async initiateOAuth(@Param('platform') platform: string) {
  // Redirect to platform's OAuth URL
}

@Get('callback/:platform')
async handleCallback(
  @Param('platform') platform: string,
  @Query('code') code: string,
) {
  // Exchange code for tokens
  // Save to database
}
```

## Auto-Posting Implementation

### Scheduled Posts

When an idea is scheduled, you can automatically post to connected platforms:

```typescript
// In planner.service.ts or a scheduled job
async autoPostScheduledIdeas() {
  const scheduledIdeas = await this.prisma.idea.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: new Date() },
    },
  });

  for (const idea of scheduledIdeas) {
    const connections = await this.socialService.getConnections(idea.userId);
    
    for (const connection of connections) {
      if (idea.platform === connection.platform) {
        await this.socialService.postToPlatform(
          idea.userId,
          idea.id,
          connection.platform,
          {
            caption: idea.caption,
            hashtags: idea.hashtags,
          },
        );
      }
    }
  }
}
```

### Background Jobs

Use a job queue (BullMQ, Bull) to handle scheduled posts:

```typescript
// Install: npm install @nestjs/bull bull
// Create a queue for scheduled posts
@Processor('social-posts')
export class SocialPostProcessor {
  @Process('post-idea')
  async handlePost(job: Job) {
    const { ideaId, platform, userId } = job.data;
    await this.socialService.postToPlatform(...);
  }
}
```

## Frontend Implementation

### Connect Platform UI

Create a page at `/settings/connections`:

```tsx
// frontend/app/settings/connections/page.tsx
export default function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  
  const handleConnect = (platform: string) => {
    // Redirect to OAuth URL
    window.location.href = `/api/social/oauth/${platform}`;
  };
  
  return (
    <div>
      {platforms.map(platform => (
        <button onClick={() => handleConnect(platform)}>
          Connect {platform}
        </button>
      ))}
    </div>
  );
}
```

### Post to Platform Button

Add to idea cards:

```tsx
<button onClick={() => postToPlatform(idea.id, 'TWITTER')}>
  Post to Twitter
</button>
```

## Security Considerations

1. **Token Storage**: Access tokens are encrypted in database
2. **Token Refresh**: Implement automatic token refresh before expiration
3. **Rate Limiting**: Respect each platform's rate limits
4. **Error Handling**: Handle API errors gracefully
5. **User Permissions**: Verify user owns the connection before posting

## Testing

### Test OAuth Flow
1. Click "Connect Twitter"
2. Complete OAuth flow
3. Verify connection saved in database
4. Test posting

### Test Auto-Post
1. Schedule an idea
2. Wait for scheduled time
3. Verify post appears on platform
4. Check idea status updated to POSTED

## Next Steps

1. **Install platform-specific packages**:
```bash
npm install twitter-api-v2
npm install facebook-nodejs-business-sdk
npm install linkedin-api
# ... etc
```

2. **Implement OAuth callbacks** for each platform
3. **Create posting functions** for each platform
4. **Add background job processing** for scheduled posts
5. **Build frontend UI** for connecting platforms
6. **Add error handling and retry logic**

## Resources

- Twitter API: https://developer.twitter.com/en/docs
- Facebook Graph API: https://developers.facebook.com/docs/graph-api
- Instagram API: https://developers.facebook.com/docs/instagram-api
- LinkedIn API: https://docs.microsoft.com/en-us/linkedin/
- Reddit API: https://www.reddit.com/dev/api
- Pinterest API: https://developers.pinterest.com/
- TikTok API: https://developers.tiktok.com/
- YouTube API: https://developers.google.com/youtube/v3

