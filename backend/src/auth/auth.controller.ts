import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { SpamPreventionGuard } from '../security/guards/spam-prevention.guard';
import { IpThrottleGuard } from '../security/guards/ip-throttle.guard';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 signups per minute
  @UseGuards(SpamPreventionGuard, IpThrottleGuard)
  async signup(@Body() signupDto: SignupDto, @Req() req?: any) {
    const ipAddress =
      req?.ip ||
      req?.connection?.remoteAddress ||
      req?.headers['x-forwarded-for']?.split(',')[0]?.trim();

    try {
      const result = await this.authService.signup(signupDto);

      // Reset spam prevention on successful signup
      if (ipAddress) {
        await this.authService.resetSpamAttempts(ipAddress, signupDto.email);
      }

      return result;
    } catch (error) {
      // Record failed attempt
      if (ipAddress) {
        await this.authService.recordFailedSignupAttempt(
          ipAddress,
          signupDto.email,
        );
      }
      throw error;
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  @UseGuards(SpamPreventionGuard, IpThrottleGuard)
  async login(
    @Body() loginDto: LoginDto,
    @Body('twoFactorToken') twoFactorToken?: string,
    @Req() req?: any,
  ) {
    const ipAddress =
      req?.ip ||
      req?.connection?.remoteAddress ||
      req?.headers['x-forwarded-for']?.split(',')[0]?.trim();
    const userAgent = req?.headers?.['user-agent'];
    const deviceInfo = req?.headers?.['device-info'];

    try {
      const result = await this.authService.login(
        loginDto,
        ipAddress,
        userAgent,
        deviceInfo,
        twoFactorToken,
      );

      // Reset spam prevention on successful login
      if (ipAddress) {
        await this.authService.resetSpamAttempts(ipAddress, loginDto.email);
      }

      return result;
    } catch (error) {
      // Record failed attempt
      if (ipAddress) {
        await this.authService.recordFailedLoginAttempt(
          ipAddress,
          loginDto.email,
        );
      }
      throw error;
    }
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return { user };
  }

  @Post('refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: any, @Req() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(user.id, token);
  }

  // Social Login
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
    // If credentials are missing, Passport will throw an error
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    try {
      if (!req.user) {
        throw new Error('Authentication failed: No user data received');
      }
      const profile = req.user;
      const ipAddress = req.ip || req.connection?.remoteAddress;
      const userAgent = req.headers?.['user-agent'];
      const deviceInfo = req.headers?.['device-info'];
      const result = await this.authService.handleSocialLogin(
        'google',
        profile,
        ipAddress,
        userAgent,
        deviceInfo,
      );

      // Redirect to frontend with token and refresh token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const params = new URLSearchParams({
        token: result.token,
        ...(result.refreshToken && { refreshToken: result.refreshToken }),
      });
      res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (error: any) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const errorMessage = encodeURIComponent(
        error.message || 'Authentication failed',
      );
      res.redirect(`${frontendUrl}/auth/callback?error=${errorMessage}`);
    }
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {
    // Initiates Facebook OAuth flow
    // If credentials are missing, Passport will throw an error
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: any, @Res() res: any) {
    try {
      if (!req.user) {
        throw new Error('Authentication failed: No user data received');
      }
      const profile = req.user;
      const ipAddress = req.ip || req.connection?.remoteAddress;
      const userAgent = req.headers?.['user-agent'];
      const deviceInfo = req.headers?.['device-info'];
      const result = await this.authService.handleSocialLogin(
        'facebook',
        profile,
        ipAddress,
        userAgent,
        deviceInfo,
      );

      // Redirect to frontend with token and refresh token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const params = new URLSearchParams({
        token: result.token,
        ...(result.refreshToken && { refreshToken: result.refreshToken }),
      });
      res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (error: any) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const errorMessage = encodeURIComponent(
        error.message || 'Authentication failed',
      );
      res.redirect(`${frontendUrl}/auth/callback?error=${errorMessage}`);
    }
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Initiates GitHub OAuth flow
    // If credentials are missing, Passport will throw an error
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: any, @Res() res: any) {
    try {
      if (!req.user) {
        throw new Error('Authentication failed: No user data received');
      }
      const profile = req.user;
      const ipAddress = req.ip || req.connection?.remoteAddress;
      const userAgent = req.headers?.['user-agent'];
      const deviceInfo = req.headers?.['device-info'];
      const result = await this.authService.handleSocialLogin(
        'github',
        profile,
        ipAddress,
        userAgent,
        deviceInfo,
      );

      // Redirect to frontend with token and refresh token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const params = new URLSearchParams({
        token: result.token,
        ...(result.refreshToken && { refreshToken: result.refreshToken }),
      });
      res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (error: any) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const errorMessage = encodeURIComponent(
        error.message || 'Authentication failed',
      );
      res.redirect(`${frontendUrl}/auth/callback?error=${errorMessage}`);
    }
  }

  // Magic Link
  @Post('magic-link/request')
  async requestMagicLink(@Body('email') email: string) {
    const magicLinkService = (this.authService as any).magicLinkService;
    const link = await magicLinkService.generateMagicLink(email);
    // TODO: Send email with magic link
    return { message: 'If the email exists, a magic link has been sent' };
  }

  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMagicLink(@Body('token') token: string, @Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers?.['user-agent'];
    const deviceInfo = req.headers?.['device-info'];
    return this.authService.loginWithMagicLink(
      token,
      ipAddress,
      userAgent,
      deviceInfo,
    );
  }

  // 2FA
  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  async setup2FA(@CurrentUser() user: any) {
    return this.authService.setup2FA(user.id);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  async enable2FA(@CurrentUser() user: any, @Body('token') token: string) {
    return this.authService.enable2FA(user.id, token);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  async disable2FA(@CurrentUser() user: any) {
    return this.authService.disable2FA(user.id);
  }

  // Sessions
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser() user: any, @Req() req: any) {
    const sessions = await this.authService.getUserSessions(user.id);
    const token = req.headers.authorization?.replace('Bearer ', '');

    // Mark current session
    if (token) {
      const currentSession = await this.authService['prisma'].session.findFirst(
        {
          where: { token },
        },
      );
      if (currentSession) {
        const sessionIndex = sessions.findIndex(
          (s: any) => s.id === currentSession.id,
        );
        if (sessionIndex !== -1) {
          sessions[sessionIndex].isCurrent = true;
        }
      }
    }

    return sessions;
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(user.id, sessionId);
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  async revokeAllSessions(@CurrentUser() user: any, @Req() req: any) {
    // Get current session ID from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const currentSession = await this.authService['prisma'].session.findFirst({
      where: { token },
    });
    return this.authService.revokeAllSessions(user.id, currentSession?.id);
  }

  // Login Activities
  @Get('activities')
  @UseGuards(JwtAuthGuard)
  async getActivities(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.authService.getLoginActivities(
      user.id,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // Profile Management
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getUserProfile(user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, updateDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  async resendVerification(@CurrentUser() user: any) {
    return this.authService.resendVerificationEmail(user.id);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(
    @CurrentUser() user: any,
    @Body('password') password?: string,
    @Body('hardDelete') hardDelete?: boolean,
  ) {
    return this.authService.deleteAccount(
      user.id,
      password,
      hardDelete || false,
    );
  }

  // GDPR Data Export
  @Get('export-data')
  @UseGuards(JwtAuthGuard)
  async exportData(@CurrentUser() user: any) {
    return this.authService.exportUserData(user.id);
  }
}
