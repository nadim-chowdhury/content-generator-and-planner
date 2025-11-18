import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Headers,
  Query,
  Delete,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { ActivateLifetimeDto } from './dto/activate-lifetime.dto';
import { UpgradeDowngradeDto } from './dto/upgrade-downgrade.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import Stripe from 'stripe';

@Controller('api/billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private configService: ConfigService,
  ) {}

  @Post('create-checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @CurrentUser() user: any,
    @Body() dto: CreateCheckoutDto & { couponCode?: string },
  ) {
    return this.billingService.createCheckoutSession(
      user.id,
      user.email,
      dto.planType,
      dto.couponCode,
    );
  }

  @Get('plans')
  getPlans() {
    return this.billingService.getAvailablePlans();
  }

  @Post('activate-lifetime')
  @UseGuards(JwtAuthGuard)
  async activateLifetime(@CurrentUser() user: any, @Body() dto: ActivateLifetimeDto) {
    return this.billingService.activateLifetimeDeal(user.id, dto.licenseKey);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    if (!signature) {
      throw new Error('Stripe signature is missing');
    }

    let event: Stripe.Event;

    try {
      const stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
        apiVersion: '2025-10-29.clover',
      });

      event = stripe.webhooks.constructEvent(
        req.rawBody as Buffer,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      throw new Error('Webhook signature verification failed');
    }

    await this.billingService.handleWebhook(event);

    return { received: true };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@CurrentUser() user: any) {
    return this.billingService.getSubscriptionStatus(user.id);
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortalSession(@CurrentUser() user: any) {
    return this.billingService.createPortalSession(user.id);
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  async getInvoices(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.billingService.getInvoices(user.id, limit ? parseInt(limit, 10) : 10);
  }

  @Delete('subscription')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @CurrentUser() user: any,
    @Query('atPeriodEnd') atPeriodEnd?: string,
  ) {
    const cancelAtPeriodEnd = atPeriodEnd !== 'false';
    return this.billingService.cancelSubscription(user.id, cancelAtPeriodEnd);
  }

  @Post('upgrade-downgrade')
  @UseGuards(JwtAuthGuard)
  async upgradeDowngrade(@CurrentUser() user: any, @Body() dto: UpgradeDowngradeDto) {
    return this.billingService.upgradeDowngrade(user.id, dto.planType);
  }

  @Post('validate-coupon')
  @UseGuards(JwtAuthGuard)
  async validateCoupon(@Body() dto: ApplyCouponDto) {
    return this.billingService.validateCoupon(dto.couponCode);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async getUsageStats(@CurrentUser() user: any) {
    return this.billingService.getUsageStats(user.id);
  }
}

