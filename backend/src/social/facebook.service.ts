import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
}

@Injectable()
export class FacebookService {
  private readonly graphApiUrl = 'https://graph.facebook.com/v18.0';

  constructor(private configService: ConfigService) {}

  /**
   * Get all Facebook pages that the user manages
   */
  async getUserPages(userAccessToken: string): Promise<FacebookPage[]> {
    try {
      const response = await axios.get(
        `${this.graphApiUrl}/me/accounts`,
        {
          params: {
            access_token: userAccessToken,
            fields: 'id,name,access_token,category',
          },
        },
      );

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching Facebook pages:', error);
      throw new Error('Failed to fetch Facebook pages');
    }
  }

  /**
   * Get user's Facebook profile info
   */
  async getUserProfile(userAccessToken: string) {
    try {
      const response = await axios.get(
        `${this.graphApiUrl}/me`,
        {
          params: {
            access_token: userAccessToken,
            fields: 'id,name,email',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching Facebook profile:', error);
      throw new Error('Failed to fetch Facebook profile');
    }
  }

  /**
   * Post to a Facebook page
   */
  async postToPage(
    pageAccessToken: string,
    pageId: string,
    message: string,
    link?: string,
  ) {
    try {
      const params: any = {
        access_token: pageAccessToken,
        message,
      };

      if (link) {
        params.link = link;
      }

      const response = await axios.post(
        `${this.graphApiUrl}/${pageId}/feed`,
        null,
        { params },
      );

      return response.data;
    } catch (error) {
      console.error('Error posting to Facebook page:', error);
      throw new Error('Failed to post to Facebook page');
    }
  }

  /**
   * Post to user's personal Facebook profile
   */
  async postToProfile(
    userAccessToken: string,
    message: string,
    link?: string,
  ) {
    try {
      const params: any = {
        access_token: userAccessToken,
        message,
      };

      if (link) {
        params.link = link;
      }

      const response = await axios.post(
        `${this.graphApiUrl}/me/feed`,
        null,
        { params },
      );

      return response.data;
    } catch (error) {
      console.error('Error posting to Facebook profile:', error);
      throw new Error('Failed to post to Facebook profile');
    }
  }
}

