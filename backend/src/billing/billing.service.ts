import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { PlanType } from './dto/create-checkout.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { Decimal } from '@prisma/client/runtime/library';
import * as crypto from 'crypto';

enum NotificationCategory {
  UPCOMING_CONTENT = 'UPCOMING_CONTENT',
  TASK_REMINDER = 'TASK_REMINDER',
  DEADLINE_ALERT = 'DEADLINE_ALERT',
  SYSTEM = 'SYSTEM',
  ACHIEVEMENT = 'ACHIEVEMENT',
}

export enum UserPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  AGENCY = 'AGENCY',
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-10-29.clover',
    });
  }

  async createCheckoutSession(userId: string, userEmail: string, planType: PlanType, couponCode?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if user already has lifetime deal
    if (user.lifetimeDeal) {
      throw new BadRequestException('You already have a lifetime deal activated');
    }

    // Get Stripe price ID based on plan type
    const priceId = this.getPriceIdForPlan(planType);
    if (!priceId) {
      throw new BadRequestException(`Price ID not configured for plan: ${planType}`);
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
        },
      });

      customerId = customer.id;

      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Determine plan based on planType
    const targetPlan = planType === PlanType.AGENCY ? UserPlan.AGENCY : UserPlan.PRO;

    // Check if user is eligible for free trial
    const isEligibleForTrial = !user.freeTrialUsed && user.plan === UserPlan.FREE;

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${this.configService.get<string>('FRONTEND_URL')}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get<string>('FRONTEND_URL')}/billing/cancel`,
      metadata: {
        userId,
        planType,
        targetPlan,
      },
    };

    // Add free trial if eligible
    if (isEligibleForTrial) {
      const trialDays = parseInt(this.configService.get<string>('FREE_TRIAL_DAYS') || '14', 10);
      sessionParams.subscription_data = {
        trial_period_days: trialDays,
      };
    }

    // Add coupon code if provided
    if (couponCode) {
      sessionParams.discounts = [{ coupon: couponCode }];
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  private getPriceIdForPlan(planType: PlanType): string | null {
    const configMap: Record<PlanType, string> = {
      [PlanType.PRO_MONTHLY]: this.configService.get<string>('STRIPE_PRO_MONTHLY_PRICE_ID') || '',
      [PlanType.PRO_YEARLY]: this.configService.get<string>('STRIPE_PRO_YEARLY_PRICE_ID') || '',
      [PlanType.AGENCY]: this.configService.get<string>('STRIPE_AGENCY_PRICE_ID') || '',
    };
    return configMap[planType] || null;
  }

  async handleWebhook(event: Stripe.Event) {
    // Store webhook event for audit trail
    await this.storeWebhookEvent(event);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await this.handleCheckoutCompleted(session);
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionActivated(subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionCanceled(subscription);
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          await this.handlePaymentSucceeded(invoice);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          await this.handlePaymentFailed(invoice);
          break;
        }

        case 'customer.subscription.trial_will_end': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleTrialEnding(subscription);
          break;
        }

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      await this.markWebhookEventProcessed(event.id);
    } catch (error) {
      this.logger.error(`Error processing webhook event ${event.id}:`, error);
      await this.markWebhookEventError(event.id, error.message);
      throw error;
    }
  }

  private async storeWebhookEvent(event: Stripe.Event) {
    try {
      // Extract userId from event metadata if available
      let userId: string | null = null;
      if (event.data.object && typeof event.data.object === 'object' && 'metadata' in event.data.object) {
        const metadata = (event.data.object as any).metadata;
        userId = metadata?.userId || null;
      }

      // Also try to get from customer
      if (!userId && event.data.object && typeof event.data.object === 'object' && 'customer' in event.data.object) {
        const customerId = (event.data.object as any).customer as string;
        const user = await this.prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });
        userId = user?.id || null;
      }

      await this.prisma.webhookEvent.create({
        data: {
          eventId: event.id,
          eventType: event.type,
          userId,
          data: event as any,
        },
      });
    } catch (error) {
      this.logger.error('Failed to store webhook event:', error);
      // Don't throw - continue processing
    }
  }

  private async markWebhookEventProcessed(eventId: string) {
    try {
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to mark webhook event as processed:', error);
    }
  }

  private async markWebhookEventError(eventId: string, errorMessage: string) {
    try {
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: {
          error: errorMessage,
        },
      });
    } catch (error) {
      this.logger.error('Failed to mark webhook event error:', error);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const targetPlan = session.metadata?.targetPlan as UserPlan;

    if (!userId) {
      console.error('No userId in session metadata');
      return;
    }

    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    const updateData: any = {
      plan: targetPlan || UserPlan.PRO,
      stripeSubscriptionId: subscription.id,
    };

    // Mark free trial as used if subscription has trial
    if (subscription.trial_start && subscription.trial_end) {
      updateData.freeTrialUsed = true;
      updateData.freeTrialStartedAt = new Date(subscription.trial_start * 1000);
      updateData.freeTrialEndsAt = new Date(subscription.trial_end * 1000);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Create affiliate commission if user was referred by an affiliate
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referredByAffiliate: true },
    });

    if (user?.referredByAffiliate) {
      try {
        const subscription = await this.stripe.subscriptions.retrieve(
          session.subscription as string,
        );
        const subscriptionAmount = subscription.items.data[0]?.price?.unit_amount
          ? subscription.items.data[0].price.unit_amount / 100
          : 0;

        if (subscriptionAmount > 0) {
          await this.createAffiliateCommission(
            user.referredByAffiliate,
            subscription.id,
            subscriptionAmount,
          );
        }
      } catch (error: any) {
        this.logger.error(`Failed to create affiliate commission: ${error.message}`);
      }
    }
  }

  /**
   * Handle subscription activated/updated
   */
  private async handleSubscriptionActivated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.error('User not found for customer:', customerId);
      return;
    }

    // Don't update if user has lifetime deal
    if (user.lifetimeDeal) {
      return;
    }

    if (subscription.status === 'active' || subscription.status === 'trialing') {
      // Determine plan from subscription items
      const items = subscription.items.data;
      let targetPlan = UserPlan.PRO;

      for (const item of items) {
        const priceId = item.price.id;
        if (priceId === this.configService.get<string>('STRIPE_AGENCY_PRICE_ID')) {
          targetPlan = UserPlan.AGENCY;
          break;
        }
      }

      const updateData: any = {
        plan: targetPlan,
        stripeSubscriptionId: subscription.id,
      };

      // Update trial info if trialing
      if (subscription.status === 'trialing' && subscription.trial_start && subscription.trial_end) {
        updateData.freeTrialUsed = true;
        updateData.freeTrialStartedAt = new Date(subscription.trial_start * 1000);
        updateData.freeTrialEndsAt = new Date(subscription.trial_end * 1000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Create affiliate commission if user was referred by an affiliate
      if (user.referredByAffiliate) {
        try {
          const subscriptionAmount = subscription.items.data[0]?.price?.unit_amount
            ? subscription.items.data[0].price.unit_amount / 100
            : 0;

          if (subscriptionAmount > 0) {
            await this.createAffiliateCommission(
              user.referredByAffiliate,
              subscription.id,
              subscriptionAmount,
            );
          }
        } catch (error: any) {
          this.logger.error(`Failed to create affiliate commission: ${error.message}`);
        }
      }

      // Send notification
      await this.sendSubscriptionActivatedNotification(user.id, targetPlan, subscription.status === 'trialing');
    }
  }

  /**
   * Create affiliate commission (helper method)
   */
  private async createAffiliateCommission(
    affiliateId: string,
    orderId: string,
    amount: number,
  ): Promise<void> {
    const affiliate = await this.prisma.user.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate || !affiliate.isAffiliate || !affiliate.affiliateApproved) {
      return; // Invalid affiliate
    }

    const commissionPercentage = 20; // 20% default
    const commissionAmount = (amount * commissionPercentage) / 100;

    await this.prisma.affiliateCommission.create({
      data: {
        affiliateId,
        orderId,
        amount: new Decimal(commissionAmount),
        percentage: new Decimal(commissionPercentage),
        status: 'PENDING',
        description: `Commission for subscription ${orderId}`,
      },
    });

    this.logger.log(`Affiliate commission created: ${affiliateId} - $${commissionAmount}`);
  }

  /**
   * Handle subscription canceled
   */
  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.error('User not found for customer:', customerId);
      return;
    }

    // Don't downgrade if user has lifetime deal
    if (user.lifetimeDeal) {
      return;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: UserPlan.FREE,
        stripeSubscriptionId: null,
      },
    });

    // Send notification
    await this.sendSubscriptionCanceledNotification(user.id);
  }

  /**
   * Handle payment succeeded
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.error('User not found for customer:', customerId);
      return;
    }

    // Send notification
    await this.sendPaymentSucceededNotification(
      user.id,
      invoice.amount_paid,
      invoice.currency,
      invoice.hosted_invoice_url,
    );
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.error('User not found for customer:', customerId);
      return;
    }

    // Don't downgrade if user has lifetime deal
    if (user.lifetimeDeal) {
      return;
    }

    // Only downgrade if subscription is past_due or unpaid
    // invoice.subscription can be string | Stripe.Subscription | null
    const subscription = (invoice as any).subscription;
    let subscriptionId: string | null = null;
    if (typeof subscription === 'string') {
      subscriptionId = subscription;
    } else if (subscription && typeof subscription === 'object' && 'id' in subscription) {
      subscriptionId = subscription.id;
    }
    if (subscriptionId) {
      try {
        const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
        if (sub.status === 'past_due' || sub.status === 'unpaid') {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              plan: UserPlan.FREE,
              stripeSubscriptionId: null,
            },
          });
        }
      } catch (error) {
        this.logger.error('Failed to retrieve subscription:', error);
      }
    }

    // Send notification
    await this.sendPaymentFailedNotification(user.id, invoice.amount_due, invoice.currency, invoice.hosted_invoice_url);
  }

  /**
   * Handle trial ending
   */
  private async handleTrialEnding(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true, email: true, name: true, freeTrialEndsAt: true },
    });

    if (!user) {
      this.logger.error('User not found for customer:', customerId);
      return;
    }

    // Send notification
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    await this.sendTrialEndingNotification(user.id, trialEnd);

    // Send email
    if (user.freeTrialEndsAt) {
      const now = new Date();
      const trialEndDate = new Date(user.freeTrialEndsAt);
      const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0 && daysRemaining <= 3) {
        await this.emailService.queueEmail(
          user.email,
          `Your Trial Ends in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}`,
          'trial-expiring',
          {
            userName: user.name || 'User',
            daysRemaining,
          },
        );
      }
    }
  }

  async getSubscriptionStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        stripeSubscriptionId: true,
        freeTrialUsed: true,
        freeTrialEndsAt: true,
        dailyAiGenerations: true,
        lastGenerationReset: true,
      },
    });

    if (!user || !user.stripeSubscriptionId) {
      return {
        plan: user?.plan || UserPlan.FREE,
        active: false,
        onTrial: false,
        usage: {
          dailyGenerations: user?.dailyAiGenerations || 0,
          limit: this.getDailyGenerationLimit(user?.plan || UserPlan.FREE),
        },
      };
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        user.stripeSubscriptionId,
      ) as any;

      const isOnTrial = subscription.status === 'trialing' || 
        (user.freeTrialEndsAt && new Date() < user.freeTrialEndsAt);

      return {
        plan: user.plan,
        active: subscription.status === 'active' || subscription.status === 'trialing',
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000)
          : undefined,
        onTrial: isOnTrial,
        trialEndsAt: user.freeTrialEndsAt,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        usage: {
          dailyGenerations: user.dailyAiGenerations || 0,
          limit: this.getDailyGenerationLimit(user.plan),
        },
      };
    } catch (error) {
      return {
        plan: UserPlan.FREE,
        active: false,
        onTrial: false,
        usage: {
          dailyGenerations: user?.dailyAiGenerations || 0,
          limit: this.getDailyGenerationLimit(user?.plan || UserPlan.FREE),
        },
      };
    }
  }

  private getDailyGenerationLimit(plan: UserPlan): number {
    switch (plan) {
      case UserPlan.FREE:
        return 5;
      case UserPlan.PRO:
      case UserPlan.AGENCY:
        return -1; // Unlimited
      default:
        return 5;
    }
  }

  async createPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      throw new BadRequestException('No active subscription');
    }

    // Don't allow portal access for lifetime deals
    if (user.lifetimeDeal) {
      throw new BadRequestException('Lifetime deal users cannot access billing portal');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.configService.get<string>('FRONTEND_URL')}/billing`,
    });

    return {
      url: session.url,
    };
  }

  /**
   * Get invoices for a user
   */
  async getInvoices(userId: string, limit: number = 10) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user || !user.stripeCustomerId) {
      return [];
    }

    const invoices = await this.stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit,
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      created: new Date(invoice.created * 1000),
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      description: invoice.description,
    }));
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeSubscriptionId: true,
        lifetimeDeal: true,
      },
    });

    if (!user || !user.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    if (user.lifetimeDeal) {
      throw new BadRequestException('Cannot cancel lifetime deal');
    }

    if (cancelAtPeriodEnd) {
      // Schedule cancellation at period end
      await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      return {
        message: 'Subscription will be cancelled at the end of the billing period',
        cancelAtPeriodEnd: true,
      };
    } else {
      // Cancel immediately
      await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          plan: UserPlan.FREE,
          stripeSubscriptionId: null,
        },
      });
      return {
        message: 'Subscription cancelled immediately',
        cancelAtPeriodEnd: false,
      };
    }
  }

  /**
   * Upgrade or downgrade subscription
   */
  async upgradeDowngrade(userId: string, newPlanType: PlanType) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeSubscriptionId: true,
        stripeCustomerId: true,
        lifetimeDeal: true,
      },
    });

    if (!user || !user.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    if (user.lifetimeDeal) {
      throw new BadRequestException('Cannot change plan for lifetime deal users');
    }

    const newPriceId = this.getPriceIdForPlan(newPlanType);
    if (!newPriceId) {
      throw new BadRequestException(`Price ID not configured for plan: ${newPlanType}`);
    }

    // Get current subscription
    const subscription = await this.stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    // Update subscription with new price
    const updatedSubscription = await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice', // Prorate the difference
    });

    // Determine new plan
    const newPlan = newPlanType === PlanType.AGENCY ? UserPlan.AGENCY : UserPlan.PRO;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan: newPlan,
      },
    });

    return {
      message: 'Subscription updated successfully',
      plan: newPlan,
      subscriptionId: updatedSubscription.id,
    };
  }

  /**
   * Validate and apply coupon code
   */
  async validateCoupon(couponCode: string) {
    try {
      const coupon = await this.stripe.coupons.retrieve(couponCode);
      
      if (!coupon.valid) {
        throw new BadRequestException('Coupon is not valid');
      }

      return {
        valid: true,
        id: coupon.id,
        name: coupon.name,
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off,
        currency: coupon.currency,
        duration: coupon.duration,
        durationInMonths: coupon.duration_in_months,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid coupon code');
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        dailyAiGenerations: true,
        lastGenerationReset: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Reset daily count if needed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = user.lastGenerationReset ? new Date(user.lastGenerationReset) : null;

    if (!lastReset || lastReset < today) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          dailyAiGenerations: 0,
          lastGenerationReset: today,
        },
      });
      user.dailyAiGenerations = 0;
    }

    const limit = this.getDailyGenerationLimit(user.plan);
    const isUnlimited = limit === -1;

    return {
      dailyGenerations: user.dailyAiGenerations,
      dailyLimit: isUnlimited ? null : limit,
      remaining: isUnlimited ? null : Math.max(0, limit - user.dailyAiGenerations),
      isUnlimited,
      plan: user.plan,
    };
  }

  /**
   * Send subscription activated notification
   */
  private async sendSubscriptionActivatedNotification(userId: string, plan: UserPlan, isTrial: boolean) {
    try {
      const planName = plan === UserPlan.AGENCY ? 'Agency' : 'Pro';
      const title = isTrial ? `Free Trial Started - ${planName} Plan` : `Subscription Activated - ${planName} Plan`;
      const message = isTrial
        ? `Your free trial for the ${planName} plan has started! Enjoy unlimited features during your trial period.`
        : `Your ${planName} subscription has been activated successfully. Enjoy all premium features!`;

      await this.notificationsService.createNotification(
        userId,
        NotificationCategory.SYSTEM,
        title,
        message,
        { plan, isTrial },
      );
    } catch (error) {
      this.logger.error('Failed to send subscription activated notification:', error);
    }
  }

  /**
   * Send subscription canceled notification
   */
  private async sendSubscriptionCanceledNotification(userId: string) {
    try {
      const title = 'Subscription Canceled';
      const message = 'Your subscription has been canceled. You will continue to have access until the end of your billing period.';

      await this.notificationsService.createNotification(
        userId,
        NotificationCategory.SYSTEM,
        title,
        message,
        { type: 'subscription_canceled' },
      );
    } catch (error) {
      this.logger.error('Failed to send subscription canceled notification:', error);
    }
  }

  /**
   * Send payment succeeded notification
   */
  private async sendPaymentSucceededNotification(userId: string, amount: number, currency: string, invoiceUrl?: string | null) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, plan: true },
      });

      if (!user) {
        return;
      }

      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(amount / 100);

      const planName = user.plan === UserPlan.AGENCY ? 'Agency' : user.plan === UserPlan.PRO ? 'Pro' : 'Premium';
      const title = 'Payment Successful';
      const message = `Your payment of ${formattedAmount} has been processed successfully. Thank you for your subscription!`;

      await this.notificationsService.createNotification(
        userId,
        NotificationCategory.SYSTEM,
        title,
        message,
        { amount, currency, invoiceUrl },
      );

      // Send email
      await this.emailService.queueEmail(
        user.email,
        'Payment Successful - Thank You!',
        'payment-success',
        {
          userName: user.name || 'User',
          planName,
          amount,
          invoiceUrl,
        },
      );
    } catch (error) {
      this.logger.error('Failed to send payment succeeded notification:', error);
    }
  }

  /**
   * Send payment failed notification
   */
  private async sendPaymentFailedNotification(userId: string, amount: number, currency: string, invoiceUrl?: string | null) {
    try {
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(amount / 100);

      const title = 'Payment Failed';
      const message = `Your payment of ${formattedAmount} could not be processed. Please update your payment method to continue your subscription.`;

      await this.notificationsService.createNotification(
        userId,
        NotificationCategory.SYSTEM,
        title,
        message,
        { amount, currency, invoiceUrl },
      );
    } catch (error) {
      this.logger.error('Failed to send payment failed notification:', error);
    }
  }

  /**
   * Send trial ending notification
   */
  private async sendTrialEndingNotification(userId: string, trialEndDate: Date | null) {
    try {
      const title = 'Free Trial Ending Soon';
      const endDate = trialEndDate ? trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'soon';
      const message = `Your free trial ends on ${endDate}. Update your payment method to continue enjoying premium features after the trial.`;

      await this.notificationsService.createNotification(
        userId,
        NotificationCategory.SYSTEM,
        title,
        message,
        { trialEndDate: trialEndDate?.toISOString() },
      );
    } catch (error) {
      this.logger.error('Failed to send trial ending notification:', error);
    }
  }

  /**
   * Activate AppSumo lifetime deal
   */
  async activateLifetimeDeal(userId: string, licenseKey: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate license key
    const isValid = await this.validateAppSumoLicense(licenseKey);
    if (!isValid) {
      throw new BadRequestException('Invalid license key');
    }

    // Check if license key is already used
    const existingUser = await this.prisma.user.findUnique({
      where: { appSumoLicenseKey: licenseKey },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestException('License key is already in use');
    }

    // Activate lifetime deal
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan: UserPlan.PRO,
        lifetimeDeal: true,
        appSumoLicenseKey: licenseKey,
        lifetimeDealActivatedAt: new Date(),
        // Cancel any existing Stripe subscription
        stripeSubscriptionId: null,
      },
    });

    // Cancel Stripe subscription if exists
    if (user.stripeSubscriptionId) {
      try {
        await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);
      } catch (error) {
        console.error('Failed to cancel Stripe subscription:', error);
      }
    }

    return {
      message: 'Lifetime deal activated successfully',
      plan: UserPlan.PRO,
    };
  }

  /**
   * Validate AppSumo license key
   * In production, this should validate against AppSumo API
   */
  private async validateAppSumoLicense(licenseKey: string): Promise<boolean> {
    // Get secret from environment
    const appSumoSecret = this.configService.get<string>('APPSUMO_SECRET');
    
    if (!appSumoSecret) {
      // Development mode: accept any key that matches pattern
      return /^[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}$/i.test(licenseKey);
    }

    // Production: Validate with AppSumo API
    // For now, we'll use a simple hash-based validation
    // In production, you should call AppSumo's API to verify the license
    try {
      // Example: Validate license key format and checksum
      const expectedHash = crypto
        .createHash('sha256')
        .update(licenseKey + appSumoSecret)
        .digest('hex');
      
      // In real implementation, you would:
      // 1. Call AppSumo API to verify license
      // 2. Check if license is valid and not expired
      // 3. Check if license has available activations
      
      return true; // Placeholder - implement actual validation
    } catch (error) {
      console.error('Error validating AppSumo license:', error);
      return false;
    }
  }

  /**
   * Get available plans with pricing
   */
  getAvailablePlans() {
    return {
      free: {
        name: 'Free',
        plan: UserPlan.FREE,
        price: 0,
        interval: null,
        features: [
          '5 AI idea generations per day',
          'Basic idea management',
          'Calendar planner',
          'Export to CSV',
        ],
      },
      proMonthly: {
        name: 'Pro Monthly',
        plan: UserPlan.PRO,
        planType: PlanType.PRO_MONTHLY,
        price: 29,
        interval: 'month',
        features: [
          'Unlimited AI idea generations',
          'Advanced AI tools',
          'Multi-platform support',
          'Multi-language output',
          'Export to PDF, Google Sheets, Notion',
          'Priority support',
        ],
      },
      proYearly: {
        name: 'Pro Yearly',
        plan: UserPlan.PRO,
        planType: PlanType.PRO_YEARLY,
        price: 290,
        interval: 'year',
        pricePerMonth: 24.17,
        savings: 'Save 17%',
        features: [
          'Unlimited AI idea generations',
          'Advanced AI tools',
          'Multi-platform support',
          'Multi-language output',
          'Export to PDF, Google Sheets, Notion',
          'Priority support',
        ],
      },
      agency: {
        name: 'Agency',
        plan: UserPlan.AGENCY,
        planType: PlanType.AGENCY,
        price: 99,
        interval: 'month',
        features: [
          'Everything in Pro',
          'Team collaboration',
          'Unlimited team members',
          'Advanced analytics',
          'White-label options',
          'Dedicated support',
        ],
      },
      lifetime: {
        name: 'Lifetime Deal',
        plan: UserPlan.PRO,
        price: 199,
        oneTime: true,
        features: [
          'Unlimited AI idea generations',
          'Advanced AI tools',
          'Multi-platform support',
          'Multi-language output',
          'Export to PDF, Google Sheets, Notion',
          'Lifetime access',
          'All future features included',
        ],
        note: 'Available through AppSumo',
      },
    };
  }
}

