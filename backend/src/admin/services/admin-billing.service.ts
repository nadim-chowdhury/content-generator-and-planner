import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class AdminBillingService {
  private readonly logger = new Logger(AdminBillingService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || '',
      {
        apiVersion: '2025-10-29.clover',
      },
    );
  }

  /**
   * Get all subscriptions with user information
   */
  async getAllSubscriptions(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get users with active subscriptions
    const users = await this.prisma.user.findMany({
      where: {
        stripeSubscriptionId: { not: null },
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.user.count({
      where: {
        stripeSubscriptionId: { not: null },
      },
    });

    // Fetch subscription details from Stripe
    const subscriptions = await Promise.all(
      users.map(async (user) => {
        if (!user.stripeSubscriptionId) {
          return null;
        }

        try {
          const subscription = await this.stripe.subscriptions.retrieve(
            user.stripeSubscriptionId,
            {
              expand: ['customer', 'items.data.price.product'],
            },
          );

          return {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
            subscription: {
              id: subscription.id,
              status: subscription.status,
              currentPeriodStart: new Date(
                (subscription as any).current_period_start * 1000,
              ),
              currentPeriodEnd: new Date(
                (subscription as any).current_period_end * 1000,
              ),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              canceledAt: subscription.canceled_at
                ? new Date(subscription.canceled_at * 1000)
                : null,
              plan: user.plan,
              amount: subscription.items.data[0]?.price?.unit_amount
                ? subscription.items.data[0].price.unit_amount / 100
                : 0,
              currency: subscription.items.data[0]?.price?.currency || 'usd',
            },
          };
        } catch (error) {
          this.logger.error(
            `Failed to fetch subscription for user ${user.id}:`,
            error,
          );
          return {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
            subscription: {
              id: user.stripeSubscriptionId,
              status: 'unknown',
              error: 'Failed to fetch from Stripe',
            },
          };
        }
      }),
    );

    return {
      subscriptions: subscriptions.filter((s) => s !== null),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all invoices
   */
  async getAllInvoices(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    try {
      const invoices = await this.stripe.invoices.list({
        limit,
        starting_after: skip > 0 ? undefined : undefined, // Stripe uses cursor-based pagination
        expand: ['data.customer', 'data.subscription'],
      });

      // Map invoices to include user information
      const invoicesWithUsers = await Promise.all(
        invoices.data.map(async (invoice) => {
          const customerId = invoice.customer as string;
          const user = await this.prisma.user.findUnique({
            where: { stripeCustomerId: customerId },
            select: {
              id: true,
              email: true,
              name: true,
            },
          });

          return {
            id: invoice.id,
            number: invoice.number,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: invoice.status,
            paid: (invoice as any).paid,
            created: new Date(invoice.created * 1000),
            dueDate: invoice.due_date
              ? new Date(invoice.due_date * 1000)
              : null,
            user: user || null,
            subscriptionId: ((invoice as any).subscription as string) || null,
            invoicePdf: invoice.invoice_pdf,
            hostedInvoiceUrl: invoice.hosted_invoice_url,
          };
        }),
      );

      // Note: Stripe's pagination doesn't provide total count easily
      // For simplicity, we'll return the invoices and indicate if there are more
      return {
        invoices: invoicesWithUsers,
        hasMore: invoices.has_more,
        pagination: {
          page,
          limit,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch invoices:', error);
      throw new BadRequestException('Failed to fetch invoices from Stripe');
    }
  }

  /**
   * Process a refund for a payment
   */
  async processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
  ): Promise<any> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      if (reason) {
        refundParams.reason = reason as Stripe.RefundCreateParams.Reason;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      this.logger.log(
        `Refund processed: ${refund.id} for payment ${paymentIntentId}`,
      );

      return {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        created: new Date(refund.created * 1000),
      };
    } catch (error: any) {
      this.logger.error(`Failed to process refund: ${error.message}`);
      throw new BadRequestException(
        `Failed to process refund: ${error.message}`,
      );
    }
  }

  /**
   * Cancel a user's subscription
   */
  async cancelUserSubscription(
    userId: string,
    immediately: boolean = false,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripeSubscriptionId: true,
        plan: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeSubscriptionId) {
      throw new BadRequestException(
        'User does not have an active subscription',
      );
    }

    try {
      if (immediately) {
        // Cancel immediately
        await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);
      } else {
        // Cancel at period end
        await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      // Update user plan to FREE if canceled immediately
      if (immediately) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            plan: 'FREE',
            stripeSubscriptionId: null,
          },
        });
      }

      this.logger.log(
        `Subscription canceled for user ${userId}. Immediately: ${immediately}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
      throw new BadRequestException(
        `Failed to cancel subscription: ${error.message}`,
      );
    }
  }

  /**
   * Get subscription details for a specific user
   */
  async getUserSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeSubscriptionId) {
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        subscription: null,
      };
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        user.stripeSubscriptionId,
        {
          expand: ['customer', 'items.data.price.product'],
        },
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(
            (subscription as any).current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(
            (subscription as any).current_period_end * 1000,
          ),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
          plan: user.plan,
          amount: subscription.items.data[0]?.price?.unit_amount
            ? subscription.items.data[0].price.unit_amount / 100
            : 0,
          currency: subscription.items.data[0]?.price?.currency || 'usd',
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch subscription: ${error.message}`);
      throw new BadRequestException(
        `Failed to fetch subscription: ${error.message}`,
      );
    }
  }

  /**
   * Get invoices for a specific user
   */
  async getUserInvoices(userId: string, limit: number = 10) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeCustomerId) {
      return {
        user: {
          id: user.id,
          email: user.email,
        },
        invoices: [],
      };
    }

    try {
      const invoices = await this.stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit,
        expand: ['data.subscription'],
      });

      return {
        user: {
          id: user.id,
          email: user.email,
        },
        invoices: invoices.data.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: invoice.status,
          paid: (invoice as any).paid,
          created: new Date(invoice.created * 1000),
          dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
          subscriptionId: ((invoice as any).subscription as string) || null,
          invoicePdf: invoice.invoice_pdf,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
        })),
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch invoices: ${error.message}`);
      throw new BadRequestException(
        `Failed to fetch invoices: ${error.message}`,
      );
    }
  }
}
