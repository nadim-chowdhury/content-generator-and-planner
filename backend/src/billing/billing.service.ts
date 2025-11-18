import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { UserPlan } from '@prisma/client';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-10-29.clover',
    });
  }

  async createCheckoutSession(userId: string, userEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
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

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: this.configService.get<string>('STRIPE_PRICE_ID') || '',
          quantity: 1,
        },
      ],
      success_url: `${this.configService.get<string>('FRONTEND_URL')}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get<string>('FRONTEND_URL')}/billing/cancel`,
      metadata: {
        userId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionChange(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;

    if (!userId) {
      console.error('No userId in session metadata');
      return;
    }

    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan: UserPlan.PRO,
        stripeSubscriptionId: subscription.id,
      },
    });
  }

  private async handleSubscriptionChange(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    if (subscription.status === 'active') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          plan: UserPlan.PRO,
          stripeSubscriptionId: subscription.id,
        },
      });
    } else if (
      subscription.status === 'canceled' ||
      subscription.status === 'past_due' ||
      subscription.status === 'unpaid'
    ) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          plan: UserPlan.FREE,
          stripeSubscriptionId: null,
        },
      });
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Downgrade to FREE on payment failure
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: UserPlan.FREE,
      },
    });
  }

  async getSubscriptionStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user || !user.stripeSubscriptionId) {
      return {
        plan: user?.plan || UserPlan.FREE,
        active: false,
      };
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        user.stripeSubscriptionId,
      );

      return {
        plan: user.plan,
        active: subscription.status === 'active',
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      };
    } catch (error) {
      return {
        plan: UserPlan.FREE,
        active: false,
      };
    }
  }

  async createPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      throw new BadRequestException('No active subscription');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.configService.get<string>('FRONTEND_URL')}/billing`,
    });

    return {
      url: session.url,
    };
  }
}

