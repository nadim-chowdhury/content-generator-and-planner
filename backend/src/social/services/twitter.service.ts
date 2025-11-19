import { Injectable, Logger } from '@nestjs/common';
import { TwitterApi } from 'twitter-api-v2';

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  /**
   * Post to Twitter/X
   */
  async postTweet(
    accessToken: string,
    content: { caption?: string; hashtags?: string[] },
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      const client = new TwitterApi(accessToken);

      // Build tweet text
      let tweetText = content.caption || '';
      
      // Add hashtags if provided
      if (content.hashtags && content.hashtags.length > 0) {
        const hashtagsText = content.hashtags
          .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
          .join(' ');
        
        // Twitter has 280 character limit
        const maxLength = 280;
        const hashtagsLength = hashtagsText.length + 1; // +1 for space
        
        if (tweetText.length + hashtagsLength <= maxLength) {
          tweetText = `${tweetText} ${hashtagsText}`.trim();
        } else {
          // Truncate tweet text to fit hashtags
          const availableLength = maxLength - hashtagsLength;
          tweetText = `${tweetText.substring(0, availableLength - 3)}... ${hashtagsText}`;
        }
      }

      // Post tweet
      const tweet = await client.v2.tweet({
        text: tweetText,
      });

      this.logger.log(`Successfully posted tweet: ${tweet.data.id}`);
      return { success: true, postId: tweet.data.id };
    } catch (error: any) {
      this.logger.error(`Failed to post to Twitter: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify token is valid
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const client = new TwitterApi(accessToken);
      await client.v2.me();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh access token (if refresh token is available)
   */
  async refreshToken(refreshToken: string): Promise<string | null> {
    // Twitter OAuth 2.0 token refresh implementation
    // This requires the OAuth 2.0 client ID and secret
    // For now, return null - token refresh should be handled at OAuth level
    return null;
  }
}

