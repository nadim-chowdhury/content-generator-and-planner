import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AffiliatesService {
  private readonly logger = new Logger(AffiliatesService.name);
  private readonly DEFAULT_COMMISSION_PERCENTAGE = 20; // 20% commission

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Apply to become an affiliate
   */
  async applyForAffiliate(userId: string): Promise<{ affiliateCode: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isAffiliate) {
      throw new BadRequestException('User is already an affiliate');
    }

    // Generate unique affiliate code
    let affiliateCode: string = '';
    let isUnique = false;

    while (!isUnique) {
      affiliateCode = `AFF${randomBytes(4).toString('hex').toUpperCase()}`;
      const existing = await this.prisma.user.findUnique({
        where: { affiliateCode },
      });
      isUnique = !existing;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isAffiliate: true,
        affiliateCode,
        affiliateApproved: false, // Requires admin approval
      },
    });

    this.logger.log(`Affiliate application submitted for user ${userId}`);
    return { affiliateCode };
  }

  /**
   * Approve affiliate (admin only)
   */
  async approveAffiliate(affiliateId: string): Promise<void> {
    const affiliate = await this.prisma.user.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    if (!affiliate.isAffiliate) {
      throw new BadRequestException('User is not an affiliate');
    }

    await this.prisma.user.update({
      where: { id: affiliateId },
      data: {
        affiliateApproved: true,
        affiliateApprovedAt: new Date(),
      },
    });

    this.logger.log(`Affiliate approved: ${affiliateId}`);
  }

  /**
   * Get affiliate code and link
   */
  async getAffiliateLink(
    userId: string,
  ): Promise<{ code: string; link: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isAffiliate: true,
        affiliateCode: true,
        affiliateApproved: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isAffiliate) {
      throw new BadRequestException('User is not an affiliate');
    }

    if (!user.affiliateApproved) {
      throw new BadRequestException('Affiliate application pending approval');
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const link = `${frontendUrl}/?aff=${user.affiliateCode}`;

    return {
      code: user.affiliateCode!,
      link,
    };
  }

  /**
   * Create commission for affiliate
   */
  async createCommission(
    affiliateId: string,
    orderId: string,
    amount: number,
    percentage?: number,
    description?: string,
  ): Promise<void> {
    const affiliate = await this.prisma.user.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate || !affiliate.isAffiliate || !affiliate.affiliateApproved) {
      throw new BadRequestException('Invalid or unapproved affiliate');
    }

    const commissionPercentage =
      percentage || this.DEFAULT_COMMISSION_PERCENTAGE;
    const commissionAmount = (amount * commissionPercentage) / 100;

    await this.prisma.affiliateCommission.create({
      data: {
        affiliateId,
        orderId,
        amount: new Decimal(commissionAmount),
        percentage: new Decimal(commissionPercentage),
        status: 'PENDING',
        description: description || `Commission for order ${orderId}`,
      },
    });

    this.logger.log(
      `Commission created for affiliate ${affiliateId}: $${commissionAmount}`,
    );
  }

  /**
   * Get affiliate dashboard stats
   */
  async getAffiliateDashboard(affiliateId: string) {
    const affiliate = await this.prisma.user.findUnique({
      where: { id: affiliateId },
      select: {
        isAffiliate: true,
        affiliateCode: true,
        affiliateApproved: true,
      },
    });

    if (!affiliate || !affiliate.isAffiliate) {
      throw new BadRequestException('User is not an affiliate');
    }

    const [commissions, payouts] = await Promise.all([
      this.prisma.affiliateCommission.findMany({
        where: { affiliateId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.affiliatePayout.findMany({
        where: { affiliateId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalEarned = commissions
      .filter((c) => c.status !== 'CANCELLED')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const totalPaid = payouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingAmount = commissions
      .filter((c) => c.status === 'PENDING')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const approvedAmount = commissions
      .filter((c) => c.status === 'APPROVED')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    return {
      affiliateCode: affiliate.affiliateCode,
      approved: affiliate.affiliateApproved,
      stats: {
        totalEarned,
        totalPaid,
        pendingAmount,
        approvedAmount,
        availableForPayout: pendingAmount + approvedAmount,
        totalCommissions: commissions.length,
        totalPayouts: payouts.length,
      },
      commissions: commissions.map((c) => ({
        id: c.id,
        orderId: c.orderId,
        amount: Number(c.amount),
        percentage: Number(c.percentage),
        status: c.status,
        description: c.description,
        createdAt: c.createdAt,
        paidAt: c.paidAt,
      })),
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        paymentMethod: p.paymentMethod,
        requestedAt: p.requestedAt,
        processedAt: p.processedAt,
        completedAt: p.completedAt,
      })),
    };
  }

  /**
   * Request payout
   */
  async requestPayout(
    affiliateId: string,
    paymentMethod: string,
    paymentDetails: string,
  ): Promise<{ payoutId: string; amount: number }> {
    const affiliate = await this.prisma.user.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate || !affiliate.isAffiliate || !affiliate.affiliateApproved) {
      throw new BadRequestException('Invalid or unapproved affiliate');
    }

    // Get pending and approved commissions
    const availableCommissions = await this.prisma.affiliateCommission.findMany(
      {
        where: {
          affiliateId,
          status: {
            in: ['PENDING', 'APPROVED'],
          },
          payoutId: null,
        },
      },
    );

    if (availableCommissions.length === 0) {
      throw new BadRequestException('No available commissions for payout');
    }

    const totalAmount = availableCommissions.reduce(
      (sum, c) => sum + Number(c.amount),
      0,
    );

    // Create payout
    const payout = await this.prisma.affiliatePayout.create({
      data: {
        affiliateId,
        amount: new Decimal(totalAmount),
        status: 'PENDING',
        paymentMethod,
        paymentDetails,
      },
    });

    // Update commissions to link to payout
    await this.prisma.affiliateCommission.updateMany({
      where: {
        id: {
          in: availableCommissions.map((c) => c.id),
        },
      },
      data: {
        payoutId: payout.id,
        status: 'APPROVED',
      },
    });

    this.logger.log(
      `Payout requested by affiliate ${affiliateId}: $${totalAmount}`,
    );
    return {
      payoutId: payout.id,
      amount: totalAmount,
    };
  }

  /**
   * Process payout (admin only)
   */
  async processPayout(
    payoutId: string,
    status: 'COMPLETED' | 'FAILED',
    notes?: string,
  ): Promise<void> {
    const payout = await this.prisma.affiliatePayout.findUnique({
      where: { id: payoutId },
      include: {
        commissions: true,
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (status === 'COMPLETED') {
      await this.prisma.affiliatePayout.update({
        where: { id: payoutId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          processedAt: new Date(),
          notes,
        },
      });

      // Mark commissions as paid
      await this.prisma.affiliateCommission.updateMany({
        where: {
          payoutId,
        },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });
    } else if (status === 'FAILED') {
      await this.prisma.affiliatePayout.update({
        where: { id: payoutId },
        data: {
          status: 'FAILED',
          processedAt: new Date(),
          notes,
        },
      });

      // Revert commissions to APPROVED
      await this.prisma.affiliateCommission.updateMany({
        where: {
          payoutId,
        },
        data: {
          status: 'APPROVED',
          payoutId: null,
        },
      });
    }

    this.logger.log(`Payout ${payoutId} processed: ${status}`);
  }

  /**
   * Get all affiliates (admin only)
   */
  async getAllAffiliates() {
    return this.prisma.user.findMany({
      where: { isAffiliate: true },
      select: {
        id: true,
        email: true,
        name: true,
        affiliateCode: true,
        affiliateApproved: true,
        affiliateApprovedAt: true,
        _count: {
          select: {
            affiliateCommissions: true,
            affiliatePayouts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all payouts (admin only)
   */
  async getAllPayouts() {
    return this.prisma.affiliatePayout.findMany({
      include: {
        affiliate: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
