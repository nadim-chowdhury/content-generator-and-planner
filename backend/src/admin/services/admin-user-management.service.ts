import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminUserManagementService {
  private readonly logger = new Logger(AdminUserManagementService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Ban a user account
   */
  async banUser(userId: string, reason?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.banned) {
      throw new BadRequestException('User is already banned');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        banned: true,
        bannedAt: new Date(),
        bannedReason: reason || null,
      },
    });

    // Revoke all active sessions
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    this.logger.log(`User ${userId} has been banned. Reason: ${reason || 'No reason provided'}`);
  }

  /**
   * Unban a user account
   */
  async unbanUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.banned) {
      throw new BadRequestException('User is not banned');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        banned: false,
        bannedAt: null,
        bannedReason: null,
      },
    });

    this.logger.log(`User ${userId} has been unbanned`);
  }

  /**
   * Reset user's daily quota
   */
  async resetUserQuota(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        dailyAiGenerations: 0,
        lastGenerationReset: new Date(),
      },
    });

    this.logger.log(`Quota reset for user ${userId}`);
  }

  /**
   * Add bonus credits to a user
   */
  async addBonusCredits(userId: string, credits: number): Promise<void> {
    if (credits <= 0) {
      throw new BadRequestException('Credits must be a positive number');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        bonusCredits: {
          increment: credits,
        },
      },
    });

    this.logger.log(`Added ${credits} bonus credits to user ${userId}`);
  }

  /**
   * Get user details with quota information
   */
  async getUserWithQuota(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        banned: true,
        bannedAt: true,
        bannedReason: true,
        dailyAiGenerations: true,
        lastGenerationReset: true,
        bonusCredits: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}

