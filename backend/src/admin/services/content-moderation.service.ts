import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface FlaggedIdea {
  id: string;
  ideaId: string;
  ideaTitle: string;
  userId: string;
  userEmail: string;
  flaggedBy: string | null;
  reason: string;
  category: string;
  reviewed: boolean;
  createdAt: string;
}

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all flagged ideas
   */
  async getFlaggedIdeas(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [flags, total] = await Promise.all([
      this.prisma.ideaFlag.findMany({
        skip,
        take: limit,
        include: {
          idea: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.ideaFlag.count(),
    ]);

    return {
      flags: flags.map((flag) => ({
        id: flag.id,
        ideaId: flag.ideaId,
        ideaTitle: flag.idea.title,
        userId: flag.idea.userId,
        userEmail: flag.idea.user.email,
        flaggedBy: flag.flaggedBy,
        reason: flag.reason,
        category: flag.category,
        reviewed: flag.reviewed,
        reviewedBy: flag.reviewedBy,
        reviewedAt: flag.reviewedAt,
        action: flag.action,
        createdAt: flag.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Flag an idea
   */
  async flagIdea(ideaId: string, reason: string, category: string = 'OTHER', flaggedBy?: string) {
    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    // Create flag
    const flag = await this.prisma.ideaFlag.create({
      data: {
        ideaId,
        flaggedBy: flaggedBy || null,
        reason,
        category,
      },
    });

    // Update idea as flagged
    await this.prisma.idea.update({
      where: { id: ideaId },
      data: {
        flagged: true,
        flaggedAt: new Date(),
        flaggedReason: reason,
      },
    });

    this.logger.log(`Idea ${ideaId} flagged: ${reason}`);
    return flag;
  }

  /**
   * Review a flagged idea
   */
  async reviewFlag(flagId: string, action: 'BLOCKED' | 'IGNORED' | 'DELETED', reviewedBy: string) {
    const flag = await this.prisma.ideaFlag.findUnique({
      where: { id: flagId },
      include: { idea: true },
    });

    if (!flag) {
      throw new NotFoundException('Flag not found');
    }

    // Update flag
    await this.prisma.ideaFlag.update({
      where: { id: flagId },
      data: {
        reviewed: true,
        reviewedBy,
        reviewedAt: new Date(),
        action,
      },
    });

    // Update idea based on action
    if (action === 'BLOCKED') {
      await this.prisma.idea.update({
        where: { id: flag.ideaId },
        data: {
          blocked: true,
          blockedAt: new Date(),
          blockedReason: flag.reason,
        },
      });
    } else if (action === 'DELETED') {
      await this.prisma.idea.delete({
        where: { id: flag.ideaId },
      });
    } else if (action === 'IGNORED') {
      // Unflag the idea
      await this.prisma.idea.update({
        where: { id: flag.ideaId },
        data: {
          flagged: false,
          flaggedAt: null,
          flaggedReason: null,
        },
      });
    }

    this.logger.log(`Flag ${flagId} reviewed with action: ${action}`);
    return { message: `Flag reviewed: ${action}` };
  }

  /**
   * Block an idea
   */
  async blockIdea(ideaId: string, reason: string) {
    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    await this.prisma.idea.update({
      where: { id: ideaId },
      data: {
        blocked: true,
        blockedAt: new Date(),
        blockedReason: reason,
      },
    });

    this.logger.log(`Idea ${ideaId} blocked: ${reason}`);
    return { message: 'Idea blocked successfully' };
  }

  /**
   * Unblock an idea
   */
  async unblockIdea(ideaId: string) {
    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    await this.prisma.idea.update({
      where: { id: ideaId },
      data: {
        blocked: false,
        blockedAt: null,
        blockedReason: null,
      },
    });

    this.logger.log(`Idea ${ideaId} unblocked`);
    return { message: 'Idea unblocked successfully' };
  }

  /**
   * Get blacklist keywords
   */
  async getBlacklistKeywords(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [keywords, total] = await Promise.all([
      this.prisma.blacklistKeyword.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.blacklistKeyword.count(),
    ]);

    return {
      keywords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Add blacklist keyword
   */
  async addBlacklistKeyword(
    keyword: string,
    category: string = 'GENERAL',
    severity: string = 'MEDIUM',
    action: string = 'FLAG',
    createdBy?: string,
  ) {
    // Check if keyword already exists
    const existing = await this.prisma.blacklistKeyword.findUnique({
      where: { keyword: keyword.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestException('Keyword already exists in blacklist');
    }

    const blacklistKeyword = await this.prisma.blacklistKeyword.create({
      data: {
        keyword: keyword.toLowerCase(),
        category,
        severity,
        action,
        createdBy: createdBy || null,
      },
    });

    this.logger.log(`Blacklist keyword added: ${keyword}`);
    return blacklistKeyword;
  }

  /**
   * Delete blacklist keyword
   */
  async deleteBlacklistKeyword(keywordId: string) {
    await this.prisma.blacklistKeyword.delete({
      where: { id: keywordId },
    });

    this.logger.log(`Blacklist keyword deleted: ${keywordId}`);
    return { message: 'Keyword deleted successfully' };
  }

  /**
   * Update blacklist keyword
   */
  async updateBlacklistKeyword(
    keywordId: string,
    updates: {
      category?: string;
      severity?: string;
      action?: string;
      enabled?: boolean;
    },
  ) {
    const keyword = await this.prisma.blacklistKeyword.update({
      where: { id: keywordId },
      data: updates,
    });

    this.logger.log(`Blacklist keyword updated: ${keywordId}`);
    return keyword;
  }

  /**
   * Check if content contains blacklisted keywords
   */
  async checkContentForBlacklist(content: string): Promise<{
    hasBlacklist: boolean;
    matches: Array<{ keyword: string; category: string; severity: string; action: string }>;
  }> {
    const enabledKeywords = await this.prisma.blacklistKeyword.findMany({
      where: { enabled: true },
    });

    const contentLower = content.toLowerCase();
    const matches: Array<{ keyword: string; category: string; severity: string; action: string }> = [];

    for (const keyword of enabledKeywords) {
      if (contentLower.includes(keyword.keyword)) {
        matches.push({
          keyword: keyword.keyword,
          category: keyword.category,
          severity: keyword.severity,
          action: keyword.action,
        });
      }
    }

    return {
      hasBlacklist: matches.length > 0,
      matches,
    };
  }
}


