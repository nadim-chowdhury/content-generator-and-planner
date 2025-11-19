import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LinkedInService {
  private readonly logger = new Logger(LinkedInService.name);

  /**
   * Post to LinkedIn
   */
  async postToLinkedIn(
    accessToken: string,
    personUrn: string,
    content: { caption?: string; hashtags?: string[] },
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      // Build text
      let text = content.caption || '';
      
      // Add hashtags if provided
      if (content.hashtags && content.hashtags.length > 0) {
        const hashtagsText = content.hashtags
          .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
          .join(' ');
        text = `${text} ${hashtagsText}`.trim();
      }

      // LinkedIn API v2 for posts
      const url = 'https://api.linkedin.com/v2/ugcPosts';
      
      const postData = {
        author: `urn:li:person:${personUrn}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text.substring(0, 3000), // LinkedIn text limit
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await axios.post(url, postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      // Extract post ID from response
      const postId = response.headers['x-linkedin-id'] || response.data.id;

      this.logger.log(`Successfully posted to LinkedIn: ${postId}`);
      return { success: true, postId };
    } catch (error: any) {
      this.logger.error(`Failed to post to LinkedIn: ${error.message}`, error.stack);
      const errorMessage = error.response?.data?.message || error.message;
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Verify token is valid
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      return !!response.data.id;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get person URN from access token
   */
  async getPersonUrn(accessToken: string): Promise<string | null> {
    try {
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      return response.data.id || null;
    } catch (error) {
      return null;
    }
  }
}

