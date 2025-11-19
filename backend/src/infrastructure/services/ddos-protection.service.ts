import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Enhanced DDOS Protection Service
 *
 * Implements multiple layers of protection:
 * - Request rate limiting per IP
 * - Request size limits
 * - Connection tracking
 * - IP reputation tracking
 * - Automatic blocking of suspicious IPs
 */
@Injectable()
export class DdosProtectionService {
  private readonly logger = new Logger(DdosProtectionService.name);
  private readonly maxRequestSize: number;
  private readonly maxRequestsPerMinute: number;
  private readonly maxRequestsPerHour: number;
  private readonly blockDurationMinutes: number;
  private readonly suspiciousThreshold: number;

  // In-memory tracking for fast lookups (can be moved to Redis for distributed systems)
  private requestCounts: Map<string, { count: number; resetAt: number }> =
    new Map();
  private hourlyCounts: Map<string, { count: number; resetAt: number }> =
    new Map();
  private blockedIPs: Map<string, number> = new Map(); // IP -> unblock timestamp
  private suspiciousIPs: Map<string, number> = new Map(); // IP -> suspicious score

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.maxRequestSize = parseInt(
      this.configService.get<string>('DDOS_MAX_REQUEST_SIZE') || '10485760', // 10MB default
    );
    this.maxRequestsPerMinute = parseInt(
      this.configService.get<string>('DDOS_MAX_REQUESTS_PER_MINUTE') || '100',
    );
    this.maxRequestsPerHour = parseInt(
      this.configService.get<string>('DDOS_MAX_REQUESTS_PER_HOUR') || '1000',
    );
    this.blockDurationMinutes = parseInt(
      this.configService.get<string>('DDOS_BLOCK_DURATION_MINUTES') || '60',
    );
    this.suspiciousThreshold = parseInt(
      this.configService.get<string>('DDOS_SUSPICIOUS_THRESHOLD') || '5',
    );

    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if IP is blocked
   */
  async isBlocked(ipAddress: string): Promise<boolean> {
    // Check in-memory block list
    const unblockTime = this.blockedIPs.get(ipAddress);
    if (unblockTime && Date.now() < unblockTime) {
      return true;
    }

    // Check database block list
    const throttle = await this.prisma.ipThrottle.findUnique({
      where: { ipAddress },
    });

    if (
      throttle?.blocked &&
      throttle.blockedUntil &&
      throttle.blockedUntil > new Date()
    ) {
      return true;
    }

    // Remove from in-memory if expired
    if (unblockTime && Date.now() >= unblockTime) {
      this.blockedIPs.delete(ipAddress);
    }

    return false;
  }

  /**
   * Check request rate limits
   */
  async checkRateLimit(
    ipAddress: string,
  ): Promise<{ allowed: boolean; remaining: number }> {
    if (await this.isBlocked(ipAddress)) {
      return { allowed: false, remaining: 0 };
    }

    const now = Date.now();
    const minuteKey = `${ipAddress}:minute`;
    const hourKey = `${ipAddress}:hour`;

    // Check per-minute limit
    const minuteData = this.requestCounts.get(minuteKey);
    if (minuteData && minuteData.resetAt > now) {
      if (minuteData.count >= this.maxRequestsPerMinute) {
        await this.recordSuspiciousActivity(ipAddress);
        return { allowed: false, remaining: 0 };
      }
      minuteData.count++;
    } else {
      this.requestCounts.set(minuteKey, {
        count: 1,
        resetAt: now + 60000, // 1 minute
      });
    }

    // Check per-hour limit
    const hourData = this.hourlyCounts.get(hourKey);
    if (hourData && hourData.resetAt > now) {
      if (hourData.count >= this.maxRequestsPerHour) {
        await this.blockIP(ipAddress, 'Hourly limit exceeded');
        return { allowed: false, remaining: 0 };
      }
      hourData.count++;
    } else {
      this.hourlyCounts.set(hourKey, {
        count: 1,
        resetAt: now + 3600000, // 1 hour
      });
    }

    const minuteRemaining = Math.max(
      0,
      this.maxRequestsPerMinute - (minuteData?.count || 0),
    );
    const hourRemaining = Math.max(
      0,
      this.maxRequestsPerHour - (hourData?.count || 0),
    );

    return {
      allowed: true,
      remaining: Math.min(minuteRemaining, hourRemaining),
    };
  }

  /**
   * Check request size
   */
  checkRequestSize(contentLength: number): {
    allowed: boolean;
    reason?: string;
  } {
    if (contentLength > this.maxRequestSize) {
      return {
        allowed: false,
        reason: `Request size exceeds maximum allowed size of ${this.maxRequestSize} bytes`,
      };
    }
    return { allowed: true };
  }

  /**
   * Record suspicious activity
   */
  private async recordSuspiciousActivity(ipAddress: string): Promise<void> {
    const currentScore = this.suspiciousIPs.get(ipAddress) || 0;
    const newScore = currentScore + 1;
    this.suspiciousIPs.set(ipAddress, newScore);

    if (newScore >= this.suspiciousThreshold) {
      await this.blockIP(ipAddress, 'Suspicious activity detected');
      this.logger.warn(
        `IP ${ipAddress} blocked due to suspicious activity (score: ${newScore})`,
      );
    }
  }

  /**
   * Block IP address
   */
  async blockIP(ipAddress: string, reason: string): Promise<void> {
    const blockedUntil = new Date();
    blockedUntil.setMinutes(
      blockedUntil.getMinutes() + this.blockDurationMinutes,
    );

    // Update in-memory block list
    this.blockedIPs.set(ipAddress, blockedUntil.getTime());

    // Update database
    await this.prisma.ipThrottle.upsert({
      where: { ipAddress },
      create: {
        ipAddress,
        blocked: true,
        blockedUntil,
        attempts: 0,
      },
      update: {
        blocked: true,
        blockedUntil,
      },
    });

    this.logger.warn(
      `IP ${ipAddress} blocked until ${blockedUntil.toISOString()}. Reason: ${reason}`,
    );
  }

  /**
   * Unblock IP address
   */
  async unblockIP(ipAddress: string): Promise<void> {
    this.blockedIPs.delete(ipAddress);
    this.suspiciousIPs.delete(ipAddress);

    await this.prisma.ipThrottle.updateMany({
      where: { ipAddress },
      data: {
        blocked: false,
        blockedUntil: null,
      },
    });

    this.logger.log(`IP ${ipAddress} unblocked`);
  }

  /**
   * Get IP statistics
   */
  async getIPStatistics(ipAddress: string): Promise<{
    blocked: boolean;
    requestsLastMinute: number;
    requestsLastHour: number;
    suspiciousScore: number;
    blockedUntil?: Date;
  }> {
    const minuteKey = `${ipAddress}:minute`;
    const hourKey = `${ipAddress}:hour`;
    const minuteData = this.requestCounts.get(minuteKey);
    const hourData = this.hourlyCounts.get(hourKey);
    const suspiciousScore = this.suspiciousIPs.get(ipAddress) || 0;

    const throttle = await this.prisma.ipThrottle.findUnique({
      where: { ipAddress },
    });

    return {
      blocked: await this.isBlocked(ipAddress),
      requestsLastMinute: minuteData?.count || 0,
      requestsLastHour: hourData?.count || 0,
      suspiciousScore,
      blockedUntil: throttle?.blockedUntil || undefined,
    };
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now();

    // Cleanup request counts
    for (const [key, data] of this.requestCounts.entries()) {
      if (data.resetAt < now) {
        this.requestCounts.delete(key);
      }
    }

    // Cleanup hourly counts
    for (const [key, data] of this.hourlyCounts.entries()) {
      if (data.resetAt < now) {
        this.hourlyCounts.delete(key);
      }
    }

    // Cleanup blocked IPs
    for (const [ip, unblockTime] of this.blockedIPs.entries()) {
      if (unblockTime < now) {
        this.blockedIPs.delete(ip);
      }
    }

    // Cleanup suspicious IPs (reset after 1 hour of no activity)
    // This is simplified - in production, use a more sophisticated approach
  }

  /**
   * Get protection statistics
   */
  getProtectionStats(): {
    activeBlocks: number;
    trackedIPs: number;
    suspiciousIPs: number;
  } {
    return {
      activeBlocks: this.blockedIPs.size,
      trackedIPs: this.requestCounts.size,
      suspiciousIPs: this.suspiciousIPs.size,
    };
  }
}
