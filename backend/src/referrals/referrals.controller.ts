import { Controller, Get, Post, UseGuards, Query } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('code')
  async getReferralCode(@CurrentUser() user: any) {
    const code = await this.referralsService.getOrCreateReferralCode(user.id);
    return { code };
  }

  @Get('link')
  async getReferralLink(@CurrentUser() user: any) {
    const link = await this.referralsService.getReferralLink(user.id);
    return { link };
  }

  @Get('stats')
  async getReferralStats(@CurrentUser() user: any) {
    return this.referralsService.getReferralStats(user.id);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit: string = '10') {
    return this.referralsService.getLeaderboard(parseInt(limit, 10) || 10);
  }

  @Post('track')
  async trackReferralClick(
    @Query('code') code: string,
    @Query('email') email?: string,
  ) {
    await this.referralsService.trackReferralClick(code, email);
    return { message: 'Referral tracked' };
  }
}
