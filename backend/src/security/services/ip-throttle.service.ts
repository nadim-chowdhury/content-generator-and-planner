import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IpThrottleService {
  private readonly logger = new Logger(IpThrottleService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check if IP is blocked
   */
  async isBlocked(ipAddress: string): Promise<boolean> {
    const throttle = await this.prisma.ipThrottle.findUnique({
      where: { ipAddress },
    });

    if (!throttle || !throttle.blocked) {
      return false;
    }

    // Check if block has expired
    if (throttle.blockedUntil && throttle.blockedUntil < new Date()) {
      // Unblock
      await this.prisma.ipThrottle.update({
        where: { ipAddress },
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
   * Record failed attempt
   */
  async recordFailedAttempt(
    ipAddress: string,
    maxAttempts: number = 5,
    blockDurationMinutes: number = 15,
  ) {
    const throttle = await this.prisma.ipThrottle.upsert({
      where: { ipAddress },
      create: {
        ipAddress,
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
    if (throttle.attempts >= maxAttempts) {
      const blockedUntil = new Date();
      blockedUntil.setMinutes(blockedUntil.getMinutes() + blockDurationMinutes);

      await this.prisma.ipThrottle.update({
        where: { ipAddress },
        data: {
          blocked: true,
          blockedUntil,
        },
      });

      this.logger.warn(
        `IP ${ipAddress} blocked for ${blockDurationMinutes} minutes after ${maxAttempts} failed attempts`,
      );
    }
  }

  /**
   * Reset attempts on successful action
   */
  async resetAttempts(ipAddress: string) {
    await this.prisma.ipThrottle.upsert({
      where: { ipAddress },
      create: {
        ipAddress,
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
  async getAttemptCount(ipAddress: string): Promise<number> {
    const throttle = await this.prisma.ipThrottle.findUnique({
      where: { ipAddress },
    });

    return throttle?.attempts || 0;
  }
}
