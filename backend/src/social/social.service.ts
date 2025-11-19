import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectPlatformDto, SocialPlatform } from './dto/connect-platform.dto';
import { FacebookService } from './facebook.service';
import { ConnectFacebookPageDto } from './dto/facebook-pages.dto';
import { TwitterService } from './services/twitter.service';
import { FacebookPostingService } from './services/facebook.service';
import { InstagramService } from './services/instagram.service';
import { LinkedInService } from './services/linkedin.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private prisma: PrismaService,
    private facebookService: FacebookService,
    private twitterService: TwitterService,
    private facebookPostingService: FacebookPostingService,
    private instagramService: InstagramService,
    private linkedInService: LinkedInService,
    private configService: ConfigService,
  ) {}

  async connectPlatform(userId: string, dto: ConnectPlatformDto) {
    // If this is set as default, unset other defaults for this platform
    if (dto.isDefault) {
      await this.prisma.socialConnection.updateMany({
        where: {
          userId,
          platform: dto.platform,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // If no account name provided, generate one
    let accountName = dto.accountName;
    if (!accountName) {
      if (dto.pageName) {
        accountName = dto.pageName;
      } else if (dto.platformUsername) {
        accountName = dto.platformUsername;
      } else {
        // Count existing connections to generate name
        const count = await this.prisma.socialConnection.count({
          where: { userId, platform: dto.platform },
        });
        accountName = count === 0 ? 'Default' : `${dto.platform} ${count + 1}`;
      }
    }

    // Create new connection (allows multiple accounts per platform)
    return this.prisma.socialConnection.create({
      data: {
        userId,
        platform: dto.platform,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        platformUserId: dto.platformUserId,
        platformUsername: dto.platformUsername,
        pageId: dto.pageId,
        pageName: dto.pageName,
        accountName,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async getConnections(userId: string, platform?: SocialPlatform) {
    const where: any = { userId, isActive: true };
    if (platform) {
      where.platform = platform;
    }

    return this.prisma.socialConnection.findMany({
      where,
      select: {
        id: true,
        platform: true,
        platformUsername: true,
        accountName: true,
        pageId: true,
        pageName: true,
        isActive: true,
        isDefault: true,
        createdAt: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getFacebookPages(userId: string) {
    // Get all Facebook connections (both personal and pages)
    return this.prisma.socialConnection.findMany({
      where: {
        userId,
        platform: SocialPlatform.FACEBOOK,
        isActive: true,
      },
      select: {
        id: true,
        platformUsername: true,
        accountName: true,
        pageId: true,
        pageName: true,
        isDefault: true,
        createdAt: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async disconnectPlatform(userId: string, connectionId: string) {
    const connection = await this.prisma.socialConnection.findFirst({
      where: {
        id: connectionId,
        userId,
      },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    return this.prisma.socialConnection.update({
      where: { id: connection.id },
      data: { isActive: false },
    });
  }

  async setDefaultConnection(userId: string, connectionId: string) {
    const connection = await this.prisma.socialConnection.findFirst({
      where: {
        id: connectionId,
        userId,
        isActive: true,
      },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Unset other defaults for this platform
    await this.prisma.socialConnection.updateMany({
      where: {
        userId,
        platform: connection.platform,
        isDefault: true,
        id: { not: connectionId },
      },
      data: {
        isDefault: false,
      },
    });

    // Set this as default
    return this.prisma.socialConnection.update({
      where: { id: connectionId },
      data: { isDefault: true },
    });
  }

  async postToPlatform(
    userId: string,
    ideaId: string,
    connectionId: string,
    content: { caption?: string; hashtags?: string[] },
  ) {
    // Get connection by ID (allows selecting specific account/page)
    const connection = await this.prisma.socialConnection.findFirst({
      where: {
        id: connectionId,
        userId,
        isActive: true,
      },
    });

    if (!connection) {
      throw new BadRequestException('Connection not found or inactive');
    }

    // Get idea
    const idea = await this.prisma.idea.findFirst({
      where: { id: ideaId, userId },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    // Post to platform
    const result = await this.postToPlatformAPI(connection, {
      caption: content.caption || idea.caption || idea.title,
      hashtags: content.hashtags || idea.hashtags || [],
      imageUrl: idea.thumbnailUrl,
    });

    if (result.success) {
      // Update idea to mark as posted
      const postedTo = idea.postedTo || [];
      const platformStr = connection.platform;
      if (!postedTo.includes(platformStr)) {
        await this.prisma.idea.update({
          where: { id: ideaId },
          data: {
            postedTo: [...postedTo, platformStr],
            status: 'POSTED',
            postedAt: new Date(),
          },
        });
      }

      // Log successful post
      await this.prisma.contentAnalytics.create({
        data: {
          userId,
          ideaId,
          platform: connection.platform,
          postedAt: new Date(),
        },
      });

      return {
        success: true,
        platform: connection.platform,
        postId: result.postId,
        message: `Successfully posted to ${connection.platform}`,
      };
    } else {
      throw new BadRequestException(
        result.error || `Failed to post to ${connection.platform}`,
      );
    }
  }

  /**
   * Get Facebook pages for a user
   * This requires the user's access token to fetch their pages
   */
  async fetchFacebookPages(userAccessToken: string) {
    return this.facebookService.getUserPages(userAccessToken);
  }

  /**
   * Connect a Facebook page
   */
  async connectFacebookPage(userId: string, dto: ConnectFacebookPageDto) {
    // First, verify the page access token is valid
    try {
      const pages = await this.facebookService.getUserPages(dto.userAccessToken);
      const page = pages.find((p) => p.id === dto.pageId);

      if (!page) {
        throw new BadRequestException('Page not found or you do not have access');
      }

      // Connect the page
      return this.connectPlatform(userId, {
        platform: SocialPlatform.FACEBOOK,
        accessToken: dto.pageAccessToken,
        pageId: dto.pageId,
        pageName: dto.pageName || page.name,
        accountName: dto.accountName || page.name,
        platformUserId: dto.pageId,
        platformUsername: page.name,
      });
    } catch (error) {
      throw new BadRequestException('Failed to connect Facebook page: ' + error.message);
    }
  }

  private async postToPlatformAPI(
    connection: any,
    content: { caption?: string; hashtags?: string[]; imageUrl?: string },
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      // Check if token is expired and refresh if needed
      if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) < new Date()) {
        const refreshed = await this.refreshConnectionToken(connection);
        if (!refreshed) {
          return { success: false, error: 'Token expired and refresh failed' };
        }
        // Reload connection with new token
        const updated = await this.prisma.socialConnection.findUnique({
          where: { id: connection.id },
        });
        if (updated) {
          connection = updated;
        }
      }

      switch (connection.platform) {
        case SocialPlatform.TWITTER:
          return await this.twitterService.postTweet(connection.accessToken, content);

        case SocialPlatform.FACEBOOK:
          if (connection.pageId) {
            return await this.facebookPostingService.postToPage(
              connection.accessToken,
              connection.pageId,
              content,
              content.imageUrl,
            );
          }
          return { success: false, error: 'Facebook page ID required' };

        case SocialPlatform.INSTAGRAM:
          // Instagram requires Instagram Business Account ID
          // This should be stored in platformUserId or pageId
          const instagramAccountId = connection.platformUserId || connection.pageId;
          if (!instagramAccountId) {
            return { success: false, error: 'Instagram Business Account ID required' };
          }
          return await this.instagramService.postToInstagram(
            connection.accessToken,
            instagramAccountId,
            content,
          );

        case SocialPlatform.LINKEDIN:
          // LinkedIn requires person URN
          const personUrn = connection.platformUserId;
          if (!personUrn) {
            // Try to get it from the token
            const urn = await this.linkedInService.getPersonUrn(connection.accessToken);
            if (!urn) {
              return { success: false, error: 'LinkedIn person URN required' };
            }
            // Update connection with URN
            await this.prisma.socialConnection.update({
              where: { id: connection.id },
              data: { platformUserId: urn },
            });
            return await this.linkedInService.postToLinkedIn(connection.accessToken, urn, content);
          }
          return await this.linkedInService.postToLinkedIn(connection.accessToken, personUrn, content);

        default:
          this.logger.warn(`Platform ${connection.platform} not yet implemented`);
          return { success: false, error: `Platform ${connection.platform} not supported` };
      }
    } catch (error: any) {
      this.logger.error(`Failed to post to platform: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresh connection token if refresh token is available
   */
  private async refreshConnectionToken(connection: any): Promise<boolean> {
    if (!connection.refreshToken) {
      return false;
    }

    try {
      switch (connection.platform) {
        case SocialPlatform.FACEBOOK:
          const facebookAppId = this.configService.get<string>('FACEBOOK_APP_ID');
          const facebookAppSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
          if (facebookAppId && facebookAppSecret) {
            const refreshed = await this.facebookPostingService.refreshToken(
              facebookAppId,
              facebookAppSecret,
              connection.refreshToken,
            );
            if (refreshed) {
              await this.prisma.socialConnection.update({
                where: { id: connection.id },
                data: {
                  accessToken: refreshed.accessToken,
                  tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
                },
              });
              return true;
            }
          }
          break;

        // Add other platforms as needed
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to refresh token for connection ${connection.id}: ${error}`);
      return false;
    }
  }
}

