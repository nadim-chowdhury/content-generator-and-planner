import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService, EmailJob } from '../queue.service';
import { EmailService } from '../../email/email.service';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<EmailJob>) {
    this.logger.log(`Processing email: ${job.id}`);

    try {
      const { to, subject, template, data } = job.data;

      // Get user email if userId is provided in data
      let emailAddress = to;
      if (data?.userId && !emailAddress) {
        const user = await this.prisma.user.findUnique({
          where: { id: data.userId },
          select: { email: true },
        });
        if (user) {
          emailAddress = user.email;
        }
      }

      if (!emailAddress) {
        throw new Error('No email address provided');
      }

      // Use EmailService to send email based on template
      await this.sendEmailByTemplate(
        emailAddress,
        subject,
        template,
        data || {},
      );

      return { sent: true, to: emailAddress };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async sendEmailByTemplate(
    to: string,
    subject: string,
    template: string,
    data: Record<string, any>,
  ): Promise<void> {
    switch (template) {
      case 'welcome':
        await this.emailService.sendWelcomeEmail(
          to,
          data.userName || 'User',
          data.verificationToken,
        );
        break;
      case 'email-verification':
        await this.emailService.sendVerificationEmail(
          to,
          data.verificationToken,
        );
        break;
      case 'password-reset':
        await this.emailService.sendPasswordResetEmail(to, data.resetToken);
        break;
      case 'trial-expiring':
        await this.emailService.sendTrialEndingEmail(
          to,
          data.userName || 'User',
          data.daysRemaining || 3,
        );
        break;
      case 'trial-expired':
        // Use trial-expiring template with 0 days
        await this.emailService.sendTrialEndingEmail(
          to,
          data.userName || 'User',
          0,
        );
        break;
      case 'payment-success':
        await this.emailService.sendPaymentSuccessEmail(
          to,
          data.userName || 'User',
          data.planName || 'Premium',
          data.amount || 0,
          data.invoiceUrl,
        );
        break;
      case 'posting-reminder':
        await this.emailService.sendPostingReminderEmail(
          to,
          data.userName || 'User',
          data.ideaTitle,
          data.platform,
          new Date(data.scheduledDate),
        );
        break;
      case 'batch-generation-complete': {
        // Fallback to simple email for batch generation
        const html = `
          <h2>Batch Generation Complete</h2>
          <p>Your batch generation has been completed.</p>
          <p>Generated: ${data.count} out of ${data.totalRequested} ideas</p>
        `;
        await this.emailService.sendEmail(to, subject, html);
        break;
      }
      default: {
        // Generic email
        const defaultHtml = `<p>${JSON.stringify(data)}</p>`;
        await this.emailService.sendEmail(to, subject, defaultHtml);
      }
    }
  }
}
