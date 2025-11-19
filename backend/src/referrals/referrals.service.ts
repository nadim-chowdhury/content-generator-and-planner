import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);
  private readonly REFERRER_REWARD_CREDITS = 50; // Credits for referrer when someone signs up
  private readonly REFERRED_REWARD_CREDITS = 25; // Credits for referred user on signup

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate or get user's referral code
   */
  async getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.referralCode) {
      return user.referralCode;
    }

    // Generate unique referral code
    let referralCode: string = '';
    let isUnique = false;

    while (!isUnique) {
      // Generate 8-character code
      referralCode = randomBytes(4).toString('hex').toUpperCase();
      const existing = await this.prisma.user.findUnique({
        where: { referralCode },
      });
      isUnique = !existing;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode },
    });

    this.logger.log(
      `Generated referral code for user ${userId}: ${referralCode}`,
    );
    return referralCode;
  }

  /**
   * Get referral link for user
   */
  async getReferralLink(userId: string): Promise<string> {
    const code = await this.getOrCreateReferralCode(userId);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return `${frontendUrl}/signup?ref=${code}`;
  }

  /**
   * Process referral when a new user signs up
   */
  async processReferralSignup(
    userId: string,
    referralCode?: string,
  ): Promise<void> {
    if (!referralCode) {
      return; // No referral code provided
    }

    // Find referrer by code
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      this.logger.warn(`Invalid referral code: ${referralCode}`);
      return;
    }

    if (referrer.id === userId) {
      this.logger.warn(`User cannot refer themselves`);
      return;
    }

    // Check if user was already referred
    const existingReferral = await this.prisma.referral.findFirst({
      where: {
        referredUserId: userId,
      },
    });

    if (existingReferral) {
      this.logger.warn(`User ${userId} was already referred`);
      return;
    }

    // Create referral record
    const referral = await this.prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: userId,
        referralCode,
        status: 'CONVERTED',
        convertedAt: new Date(),
      },
    });

    // Give credits to both users
    await Promise.all([
      // Give credits to referrer
      this.prisma.user.update({
        where: { id: referrer.id },
        data: {
          referralCredits: {
            increment: this.REFERRER_REWARD_CREDITS,
          },
          bonusCredits: {
            increment: this.REFERRER_REWARD_CREDITS,
          },
        },
      }),
      // Give credits to referred user
      this.prisma.user.update({
        where: { id: userId },
        data: {
          referredBy: referrer.id,
          bonusCredits: {
            increment: this.REFERRED_REWARD_CREDITS,
          },
        },
      }),
    ]);

    // Update referral record
    await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'REWARDED',
        creditsEarned: this.REFERRER_REWARD_CREDITS,
        creditsGiven: this.REFERRED_REWARD_CREDITS,
        rewardedAt: new Date(),
      },
    });

    this.logger.log(`Processed referral: ${referrer.id} -> ${userId}`);
  }

  /**
   * Get user's referral stats
   */
  async getReferralStats(userId: string) {
    const [referrals, totalCredits] = await Promise.all([
      this.prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referredUser: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { referralCredits: true },
      }),
    ]);

    const stats = {
      totalReferrals: referrals.length,
      convertedReferrals: referrals.filter(
        (r) => r.status === 'CONVERTED' || r.status === 'REWARDED',
      ).length,
      pendingReferrals: referrals.filter((r) => r.status === 'PENDING').length,
      totalCreditsEarned: totalCredits?.referralCredits || 0,
      referrals: referrals.map((r) => ({
        id: r.id,
        referredUser: r.referredUser
          ? {
              id: r.referredUser.id,
              email: r.referredUser.email,
              name: r.referredUser.name,
              signedUpAt: r.referredUser.createdAt,
            }
          : null,
        status: r.status,
        creditsEarned: r.creditsEarned,
        createdAt: r.createdAt,
        convertedAt: r.convertedAt,
      })),
    };

    return stats;
  }

  /**
   * Get referral leaderboard
   */
  async getLeaderboard(limit: number = 10) {
    const users = await this.prisma.user.findMany({
      where: {
        referralCredits: {
          gt: 0,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        referralCredits: true,
        _count: {
          select: {
            referralsMade: {
              where: {
                status: {
                  in: ['CONVERTED', 'REWARDED'],
                },
              },
            },
          },
        },
      },
      orderBy: {
        referralCredits: 'desc',
      },
      take: limit,
    });

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      totalReferrals: user._count.referralsMade,
      totalCredits: user.referralCredits,
    }));
  }

  /**
   * Track referral click (before signup)
   */
  async trackReferralClick(
    referralCode: string,
    email?: string,
  ): Promise<void> {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      return; // Invalid code, ignore
    }

    // Check if referral already exists for this email
    if (email) {
      const existing = await this.prisma.referral.findFirst({
        where: {
          referrerId: referrer.id,
          referredEmail: email,
        },
      });

      if (existing) {
        return; // Already tracked
      }

      // Create pending referral
      await this.prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referralCode,
          referredEmail: email,
          status: 'PENDING',
        },
      });
    }
  }
}
