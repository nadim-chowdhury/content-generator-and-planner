import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Controller('api/billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private configService: ConfigService,
  ) {}

  @Post('create-checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(@CurrentUser() user: any) {
    return this.billingService.createCheckoutSession(user.id, user.email);
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
}

