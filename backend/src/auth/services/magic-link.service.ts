import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class MagicLinkService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate magic link token
   */
  async generateMagicLink(email: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return null;
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        magicLinkToken: token,
        magicLinkExpires: expiresAt,
      },
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    return `${frontendUrl}/auth/magic-link?token=${token}`;
  }

  /**
   * Verify magic link token
   */
  async verifyMagicLink(
    token: string,
  ): Promise<{ userId: string; email: string } | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        magicLinkToken: token,
        magicLinkExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return null;
    }

    // Clear token after use
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        magicLinkToken: null,
        magicLinkExpires: null,
      },
    });

    return {
      userId: user.id,
      email: user.email,
    };
  }
}
