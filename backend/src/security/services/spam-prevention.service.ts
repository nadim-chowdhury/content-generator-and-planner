import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type SpamIdentifierType = 'email' | 'ip' | 'user';

@Injectable()
export class SpamPreventionService {
  private readonly logger = new Logger(SpamPreventionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check if identifier is blocked
   */
  async isBlocked(
    identifier: string,
    type: SpamIdentifierType,
  ): Promise<boolean> {
    const spam = await this.prisma.spamPrevention.findUnique({
      where: {
        identifier_type: {
          identifier,
          type,
        },
      },
    });

    if (!spam || !spam.blocked) {
      return false;
    }

    // Check if block has expired
    if (spam.blockedUntil && spam.blockedUntil < new Date()) {
      // Unblock
      await this.prisma.spamPrevention.update({
        where: {
          identifier_type: {
            identifier,
            type,
          },
        },
        data: {
          blocked: false,
          blockedUntil: null,
          attempts: 0,
        },
      });
      return false;
    }

    return true;
  }

  /**
   * Record spam attempt
   */
  async recordAttempt(
    identifier: string,
    type: SpamIdentifierType,
    maxAttempts: number = 5,
    blockDurationMinutes: number = 60,
  ) {
    const spam = await this.prisma.spamPrevention.upsert({
      where: {
        identifier_type: {
          identifier,
          type,
        },
      },
      create: {
        identifier,
        type,
        attempts: 1,
        lastAttempt: new Date(),
      },
      update: {
        attempts: {
          increment: 1,
        },
        lastAttempt: new Date(),
      },
    });

    // Block if exceeded max attempts
    if (spam.attempts >= maxAttempts) {
      const blockedUntil = new Date();
      blockedUntil.setMinutes(blockedUntil.getMinutes() + blockDurationMinutes);

      await this.prisma.spamPrevention.update({
        where: {
          identifier_type: {
            identifier,
            type,
          },
        },
        data: {
          blocked: true,
          blockedUntil,
        },
      });

      this.logger.warn(
        `${type} ${identifier} blocked for ${blockDurationMinutes} minutes after ${maxAttempts} spam attempts`,
      );
    }
  }

  /**
   * Reset attempts on successful action
   */
  async resetAttempts(identifier: string, type: SpamIdentifierType) {
    await this.prisma.spamPrevention.upsert({
      where: {
        identifier_type: {
          identifier,
          type,
        },
      },
      create: {
        identifier,
        type,
        attempts: 0,
      },
      update: {
        attempts: 0,
        blocked: false,
        blockedUntil: null,
      },
    });
  }

  /**
   * Get current attempt count
   */
  async getAttemptCount(
    identifier: string,
    type: SpamIdentifierType,
  ): Promise<number> {
    const spam = await this.prisma.spamPrevention.findUnique({
      where: {
        identifier_type: {
          identifier,
          type,
        },
      },
    });

    return spam?.attempts || 0;
  }
}
