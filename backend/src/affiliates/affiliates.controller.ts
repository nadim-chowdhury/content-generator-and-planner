import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  async applyForAffiliate(@CurrentUser() user: any) {
    return this.affiliatesService.applyForAffiliate(user.id);
  }

  @Get('link')
  @UseGuards(JwtAuthGuard)
  async getAffiliateLink(@CurrentUser() user: any) {
    return this.affiliatesService.getAffiliateLink(user.id);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@CurrentUser() user: any) {
    return this.affiliatesService.getAffiliateDashboard(user.id);
  }

  @Post('payout/request')
  @UseGuards(JwtAuthGuard)
  async requestPayout(
    @CurrentUser() user: any,
    @Body('paymentMethod') paymentMethod: string,
    @Body('paymentDetails') paymentDetails: string,
  ) {
    return this.affiliatesService.requestPayout(
      user.id,
      paymentMethod,
      paymentDetails,
    );
  }

  // Admin endpoints
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllAffiliates() {
    return this.affiliatesService.getAllAffiliates();
  }

  @Put('approve/:affiliateId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async approveAffiliate(@Param('affiliateId') affiliateId: string) {
    await this.affiliatesService.approveAffiliate(affiliateId);
    return { message: 'Affiliate approved' };
  }

  @Get('payouts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllPayouts() {
    return this.affiliatesService.getAllPayouts();
  }

  @Put('payouts/:payoutId/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async processPayout(
    @Param('payoutId') payoutId: string,
    @Body('status') status: 'COMPLETED' | 'FAILED',
    @Body('notes') notes?: string,
  ) {
    await this.affiliatesService.processPayout(payoutId, status, notes);
    return { message: `Payout ${status.toLowerCase()}` };
  }
}
