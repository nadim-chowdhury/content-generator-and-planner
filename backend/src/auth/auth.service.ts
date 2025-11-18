import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { TwoFactorService } from './services/two-factor.service';
import { MagicLinkService } from './services/magic-link.service';
import { LoginActivityService } from './services/login-activity.service';
import { IpThrottleService } from '../security/services/ip-throttle.service';
import { SpamPreventionService } from '../security/services/spam-prevention.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private twoFactorService: TwoFactorService,
    private magicLinkService: MagicLinkService,
    private loginActivityService: LoginActivityService,
    private ipThrottleService: IpThrottleService,
    private spamPreventionService: SpamPreventionService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password } = signupDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Generate email verification token
    const emailVerificationToken = randomBytes(32).toString('hex');

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerificationToken,
      },
      select: {
        id: true,
        email: true,
        plan: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    // Create session with refresh token
    const refreshToken = await this.createSession(user.id, token);

    // TODO: Send verification email
    // await this.emailService.sendVerificationEmail(user.email, emailVerificationToken);

    return {
      user,
      token,
      refreshToken,
    };
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
    deviceInfo?: string,
    twoFactorToken?: string,
  ) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      await this.loginActivityService.logActivity({
        userId: user?.id || 'unknown',
        loginType: 'password',
        success: false,
        ipAddress,
        userAgent,
        deviceInfo,
        failureReason: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.passwordHash, password);

    if (!isValidPassword) {
      await this.loginActivityService.logActivity({
        userId: user.id,
        loginType: 'password',
        success: false,
        ipAddress,
        userAgent,
        deviceInfo,
        failureReason: 'Invalid password',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return {
          requiresTwoFactor: true,
          message: '2FA token required',
        };
      }

      if (!user.twoFactorSecret) {
        throw new BadRequestException('2FA is enabled but no secret found');
      }

      const isValid2FA = this.twoFactorService.verifyToken(
        user.twoFactorSecret,
        twoFactorToken,
      );

      if (!isValid2FA) {
        await this.loginActivityService.logActivity({
          userId: user.id,
          loginType: 'password',
          success: false,
          ipAddress,
          userAgent,
          deviceInfo,
          failureReason: 'Invalid 2FA token',
        });
        throw new UnauthorizedException('Invalid 2FA token');
      }
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    // Create session with device info and refresh token
    const refreshToken = await this.createSession(user.id, token, ipAddress, userAgent, deviceInfo);

    // Log successful login
    await this.loginActivityService.logActivity({
      userId: user.id,
      loginType: 'password',
      success: true,
      ipAddress,
      userAgent,
      deviceInfo,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        plan: user.plan,
        role: user.role,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      token,
      refreshToken,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // TODO: Send reset email
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async logout(userId: string, token: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token,
      },
    });

    return { message: 'Logged out successfully' };
  }

  private generateToken(userId: string, email: string): string {
    const payload = { userId, email };
    // Secret and expiresIn are already configured in JwtModule
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  private async createSession(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string,
    deviceInfo?: string,
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for access token

    const refreshToken = this.generateRefreshToken();
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 30); // 30 days for refresh token

    await this.prisma.session.create({
      data: {
        userId,
        token,
        refreshToken,
        expiresAt,
        refreshTokenExpiresAt,
        ipAddress,
        userAgent,
        deviceInfo,
      },
    });

    return refreshToken;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token is expired
    if (session.refreshTokenExpiresAt && session.refreshTokenExpiresAt < new Date()) {
      // Delete expired session
      await this.prisma.session.delete({
        where: { id: session.id },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Generate new access token
    const newToken = this.generateToken(session.userId, session.user.email);

    // Update session with new token and extend expiration
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        lastUsedAt: new Date(),
      },
    });

    return {
      token: newToken,
      refreshToken: session.refreshToken, // Keep same refresh token
    };
  }

  /**
   * Social login handlers
   */
  async handleSocialLogin(
    provider: 'google' | 'facebook' | 'github',
    profile: any,
    ipAddress?: string,
    userAgent?: string,
    deviceInfo?: string,
  ) {
    const providerIdField = `${provider}Id`;
    const providerId = profile[providerIdField] || profile.id;

    // Find user by provider ID
    let user = await this.prisma.user.findUnique({
      where: { [providerIdField]: providerId },
    });

    // If not found, try to find by email
    if (!user && profile.email) {
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      // Link provider to existing account
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { [providerIdField]: providerId },
        });
      }
    }

    // Create new user if doesn't exist
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          [providerIdField]: providerId,
          emailVerified: true, // Social logins are pre-verified
        },
      });
    }

    // Generate token
    const token = this.generateToken(user.id, user.email);
    const refreshToken = await this.createSession(user.id, token, ipAddress, userAgent, deviceInfo);

    // Log activity
    await this.loginActivityService.logActivity({
      userId: user.id,
      loginType: provider,
      success: true,
      ipAddress,
      userAgent,
      deviceInfo,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        plan: user.plan,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token,
      refreshToken,
    };
  }

  /**
   * Magic link login
   */
  async loginWithMagicLink(
    token: string,
    ipAddress?: string,
    userAgent?: string,
    deviceInfo?: string,
  ) {
    const result = await this.magicLinkService.verifyMagicLink(token);

    if (!result) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: result.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const jwtToken = this.generateToken(user.id, user.email);
    const refreshToken = await this.createSession(user.id, jwtToken, ipAddress, userAgent, deviceInfo);

    await this.loginActivityService.logActivity({
      userId: user.id,
      loginType: 'magic_link',
      success: true,
      ipAddress,
      userAgent,
      deviceInfo,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        plan: user.plan,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token: jwtToken,
      refreshToken,
    };
  }

  /**
   * 2FA methods
   */
  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { secret, qrCodeUrl } = this.twoFactorService.generateSecret(user.email);
    const qrCode = await this.twoFactorService.generateQRCode(qrCodeUrl);

    // Store secret temporarily (user needs to verify before enabling)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return {
      secret,
      qrCode,
      qrCodeUrl,
    };
  }

  async enable2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not set up. Please set it up first.');
    }

    const isValid = this.twoFactorService.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: '2FA enabled successfully' };
  }

  async disable2FA(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { message: '2FA disabled successfully' };
  }

  /**
   * Session management
   */
  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });

    return { message: 'Session revoked' };
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string) {
    const where: any = { userId };
    if (exceptSessionId) {
      where.id = { not: exceptSessionId };
    }

    await this.prisma.session.deleteMany({ where });

    return { message: 'All sessions revoked' };
  }

  /**
   * Get login activities
   */
  async getLoginActivities(userId: string, limit: number = 50) {
    return this.loginActivityService.getUserActivities(userId, limit);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: { name?: string; email?: string; profileImage?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If email is being changed, check if new email is already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      // If email is changed, mark as unverified and generate new verification token
      const emailVerificationToken = randomBytes(32).toString('hex');
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          emailVerified: false,
          emailVerificationToken,
        },
      });

      // TODO: Send verification email to new address
      return {
        message: 'Profile updated. Please verify your new email address.',
        user: await this.getUserProfile(userId),
      };
    }

    // Update profile without email change
    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      message: 'Profile updated successfully',
      user: await this.getUserProfile(userId),
    };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException('Password authentication not available for this account');
    }

    // Verify current password
    const isValidPassword = await argon2.verify(user.passwordHash, currentPassword);

    if (!isValidPassword) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await argon2.hash(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all sessions except current (force re-login with new password)
    // Note: In a production app, you might want to keep the current session
    // await this.revokeAllSessions(userId);

    return { message: 'Password changed successfully' };
  }

  /**
   * Delete account
   */
  async deleteAccount(userId: string, password?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user has password, require it for deletion
    if (user.passwordHash) {
      if (!password) {
        throw new BadRequestException('Password required to delete account');
      }

      const isValidPassword = await argon2.verify(user.passwordHash, password);
      if (!isValidPassword) {
        throw new UnauthorizedException('Password is incorrect');
      }
    }

    // Delete user (cascade will handle related records)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Account deleted successfully' };
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        emailVerified: true,
        plan: true,
        role: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const emailVerificationToken = randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerificationToken },
    });

    // TODO: Send verification email
    // const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    // const verificationLink = `${frontendUrl}/auth/verify-email?token=${emailVerificationToken}`;
    // await this.emailService.sendVerificationEmail(user.email, verificationLink);

    return { message: 'Verification email sent' };
  }

  /**
   * Record failed login attempt for spam prevention
   */
  async recordFailedLoginAttempt(ipAddress: string, email: string) {
    await Promise.all([
      this.ipThrottleService.recordFailedAttempt(ipAddress, 5, 15), // 5 attempts, 15 min block
      this.spamPreventionService.recordAttempt(ipAddress, 'ip', 10, 60), // 10 attempts, 60 min block
      this.spamPreventionService.recordAttempt(email, 'email', 5, 30), // 5 attempts, 30 min block
    ]);
  }

  /**
   * Record failed signup attempt for spam prevention
   */
  async recordFailedSignupAttempt(ipAddress: string, email: string) {
    await Promise.all([
      this.ipThrottleService.recordFailedAttempt(ipAddress, 3, 30), // 3 attempts, 30 min block
      this.spamPreventionService.recordAttempt(ipAddress, 'ip', 5, 120), // 5 attempts, 2 hour block
      this.spamPreventionService.recordAttempt(email, 'email', 3, 60), // 3 attempts, 60 min block
    ]);
  }

  /**
   * Reset spam attempts on successful action
   */
  async resetSpamAttempts(ipAddress: string, email: string) {
    await Promise.all([
      this.ipThrottleService.resetAttempts(ipAddress),
      this.spamPreventionService.resetAttempts(ipAddress, 'ip'),
      this.spamPreventionService.resetAttempts(email, 'email'),
    ]);
  }
}

