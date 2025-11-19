import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  /**
   * Post to Instagram (requires Instagram Graph API)
   * Note: Instagram posting requires a business account and Instagram Graph API
   */
  async postToInstagram(
    pageAccessToken: string,
    instagramBusinessAccountId: string,
    content: { caption?: string; hashtags?: string[]; imageUrl?: string },
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      // Build caption
      let caption = content.caption || '';

      // Add hashtags if provided
      if (content.hashtags && content.hashtags.length > 0) {
        const hashtagsText = content.hashtags
          .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
          .join(' ');
        caption = `${caption} ${hashtagsText}`.trim();
      }

      if (!content.imageUrl) {
        return { success: false, error: 'Instagram requires an image URL' };
      }

      // Step 1: Create media container
      const createUrl = `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media`;
      const createResponse = await axios.post(createUrl, {
        image_url: content.imageUrl,
        caption: caption.substring(0, 2200), // Instagram caption limit
        access_token: pageAccessToken,
      });

      const creationId = createResponse.data.id;

      // Step 2: Publish the media container
      const publishUrl = `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media_publish`;
      const publishResponse = await axios.post(publishUrl, {
        creation_id: creationId,
        access_token: pageAccessToken,
      });

      this.logger.log(
        `Successfully posted to Instagram: ${publishResponse.data.id}`,
      );
      return { success: true, postId: publishResponse.data.id };
    } catch (error: any) {
      this.logger.error(
        `Failed to post to Instagram: ${error.message}`,
        error.stack,
      );
      const errorMessage =
        error.response?.data?.error?.message || error.message;
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Verify token is valid
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get('https://graph.facebook.com/v18.0/me', {
        params: { access_token: accessToken },
      });
      return !!response.data.id;
    } catch (error) {
      return false;
    }
  }
}
