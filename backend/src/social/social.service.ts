import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectPlatformDto, SocialPlatform } from './dto/connect-platform.dto';
import { FacebookService } from './facebook.service';
import { ConnectFacebookPageDto } from './dto/facebook-pages.dto';

@Injectable()
export class SocialService {
  constructor(
    private prisma: PrismaService,
    private facebookService: FacebookService,
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

    // TODO: Implement actual posting logic for each platform
    // This is a placeholder - you'll need to integrate with each platform's API
    const posted = await this.postToPlatformAPI(connection, content);

    if (posted) {
      // Update idea to mark as posted
      const postedTo = idea.postedTo || [];
      const platformStr = connection.platform;
      if (!postedTo.includes(platformStr)) {
        await this.prisma.idea.update({
          where: { id: ideaId },
          data: {
            postedTo: [...postedTo, platformStr],
            status: 'POSTED',
          },
        });
      }
    }

    return { success: true, platform: connection.platform, message: `Posted to ${connection.platform}` };
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
    content: { caption?: string; hashtags?: string[] },
  ): Promise<boolean> {
    // Placeholder - implement actual API calls for each platform
    // Each platform has different APIs:
    // - Twitter: Twitter API v2
    // - Facebook: Facebook Graph API
    // - Instagram: Instagram Basic Display API / Instagram Graph API
    // - LinkedIn: LinkedIn API
    // - Reddit: Reddit API
    // - Pinterest: Pinterest API
    // etc.

    switch (connection.platform) {
      case 'TWITTER':
        // return await this.postToTwitter(connection.accessToken, content);
        break;
      case 'FACEBOOK':
        // return await this.postToFacebook(connection.accessToken, content);
        break;
      case 'INSTAGRAM':
        // return await this.postToInstagram(connection.accessToken, content);
        break;
      // Add other platforms...
    }

    // For now, return true as placeholder
    return true;
  }
}

