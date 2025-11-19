import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FacebookPostingService {
  private readonly logger = new Logger(FacebookPostingService.name);

  /**
   * Post to Facebook page
   */
  async postToPage(
    pageAccessToken: string,
    pageId: string,
    content: { caption?: string; hashtags?: string[] },
    imageUrl?: string,
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      // Build message
      let message = content.caption || '';
      
      // Add hashtags if provided
      if (content.hashtags && content.hashtags.length > 0) {
        const hashtagsText = content.hashtags
          .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
          .join(' ');
        message = `${message} ${hashtagsText}`.trim();
      }

      const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;

      const postData: any = {
        message,
        access_token: pageAccessToken,
      };

      // Add image if provided
      if (imageUrl) {
        postData.link = imageUrl;
      }

      const response = await axios.post(url, postData);

      this.logger.log(`Successfully posted to Facebook: ${response.data.id}`);
      return { success: true, postId: response.data.id };
    } catch (error: any) {
      this.logger.error(`Failed to post to Facebook: ${error.message}`, error.stack);
      const errorMessage = error.response?.data?.error?.message || error.message;
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Post image to Facebook page
   */
  async postImageToPage(
    pageAccessToken: string,
    pageId: string,
    imageUrl: string,
    caption?: string,
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      const url = `https://graph.facebook.com/v18.0/${pageId}/photos`;

      const postData: any = {
        url: imageUrl,
        access_token: pageAccessToken,
      };

      if (caption) {
        postData.caption = caption;
      }

      const response = await axios.post(url, postData);

      this.logger.log(`Successfully posted image to Facebook: ${response.data.id}`);
      return { success: true, postId: response.data.id };
    } catch (error: any) {
      this.logger.error(`Failed to post image to Facebook: ${error.message}`, error.stack);
      const errorMessage = error.response?.data?.error?.message || error.message;
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

  /**
   * Refresh access token
   */
  async refreshToken(
    appId: string,
    appSecret: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number } | null> {
    try {
      const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: refreshToken,
        },
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      this.logger.error(`Failed to refresh Facebook token: ${error}`);
      return null;
    }
  }
}

