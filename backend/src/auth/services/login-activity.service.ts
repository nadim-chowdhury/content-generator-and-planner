import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LoginActivityData {
  userId: string;
  loginType:
    | 'password'
    | 'google'
    | 'facebook'
    | 'github'
    | 'magic_link'
    | 'session_revocation';
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  failureReason?: string;
}

@Injectable()
export class LoginActivityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log login activity
   */
  async logActivity(data: LoginActivityData) {
    return this.prisma.loginActivity.create({
      data,
    });
  }

  /**
   * Get user's login activities
   */
  async getUserActivities(userId: string, limit: number = 50) {
    return this.prisma.loginActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get recent failed login attempts
   */
  async getRecentFailedAttempts(userId: string, hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.prisma.loginActivity.findMany({
      where: {
        userId,
        success: false,
        createdAt: {
          gte: since,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
