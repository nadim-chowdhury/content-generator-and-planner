import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(
    private configService: ConfigService,
    private queueService: QueueService,
  ) {
    this.fromEmail =
      this.configService.get<string>('SMTP_FROM_EMAIL') ||
      'noreply@example.com';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

    // Create SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true', // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'), // App password for Gmail
      },
      // Connection timeout settings to prevent hanging
      connectionTimeout: 5000, // 5 seconds
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });

    // Verify connection asynchronously (non-blocking)
    // Don't block startup - verify in background
    setImmediate(() => {
      this.transporter.verify((error) => {
        if (error) {
          this.logger.warn('SMTP connection verification failed (will retry on first email):', error.message);
        } else {
          this.logger.log('SMTP server is ready to send emails');
        }
      });
    });
  }

  /**
   * Send email directly (synchronous)
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    try {
      const mailOptions = {
        from: `"Content Generator & Planner" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${to}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Queue email for sending (asynchronous)
   */
  async queueEmail(
    to: string,
    subject: string,
    template: string,
    data: Record<string, any>,
    delay?: number,
  ): Promise<string> {
    return this.queueService.queueEmail(
      {
        to,
        subject,
        template,
        data,
      },
      delay,
    );
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    verificationToken: string,
  ): Promise<void> {
    const verificationLink = `${this.frontendUrl}/auth/verify-email?token=${verificationToken}`;
    const html = this.getWelcomeEmailTemplate(userName, verificationLink);
    await this.sendEmail(
      userEmail,
      'Welcome to Content Generator & Planner!',
      html,
    );
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(
    userEmail: string,
    verificationToken: string,
  ): Promise<void> {
    const verificationLink = `${this.frontendUrl}/auth/verify-email?token=${verificationToken}`;
    const html = this.getVerificationEmailTemplate(verificationLink);
    await this.sendEmail(userEmail, 'Verify Your Email Address', html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    userEmail: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${resetToken}`;
    const html = this.getPasswordResetEmailTemplate(resetLink);
    await this.sendEmail(userEmail, 'Reset Your Password', html);
  }

  /**
   * Send trial ending email
   */
  async sendTrialEndingEmail(
    userEmail: string,
    userName: string,
    daysRemaining: number,
  ): Promise<void> {
    const upgradeLink = `${this.frontendUrl}/pricing`;
    const html = this.getTrialEndingEmailTemplate(
      userName,
      daysRemaining,
      upgradeLink,
    );
    await this.sendEmail(
      userEmail,
      `Your Trial Ends in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}`,
      html,
    );
  }

  /**
   * Send payment successful email
   */
  async sendPaymentSuccessEmail(
    userEmail: string,
    userName: string,
    planName: string,
    amount: number,
    invoiceUrl?: string,
  ): Promise<void> {
    const html = this.getPaymentSuccessEmailTemplate(
      userName,
      planName,
      amount,
      invoiceUrl,
    );
    await this.sendEmail(userEmail, 'Payment Successful - Thank You!', html);
  }

  /**
   * Send upcoming content reminder email
   */
  async sendPostingReminderEmail(
    userEmail: string,
    userName: string,
    ideaTitle: string,
    platform: string,
    scheduledDate: Date,
  ): Promise<void> {
    const html = this.getPostingReminderEmailTemplate(
      userName,
      ideaTitle,
      platform,
      scheduledDate,
    );
    await this.sendEmail(
      userEmail,
      `Reminder: Post "${ideaTitle}" on ${platform}`,
      html,
    );
  }

  /**
   * Email Templates
   */
  private getWelcomeEmailTemplate(
    userName: string,
    verificationLink: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Content Generator & Planner</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to Content Generator & Planner!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${userName || 'there'},</p>
          <p>Thank you for signing up! We're excited to have you on board.</p>
          <p>To get started, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Content Generator & Planner Team</p>
        </div>
      </body>
      </html>
    `;
  }

  private getVerificationEmailTemplate(verificationLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Verify Your Email Address</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailTemplate(resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #4facfe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Reset Your Password</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #f093fb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
          <p style="color: #dc2626; font-size: 14px; font-weight: bold;">This link will expire in 1 hour.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">For security reasons, this link can only be used once.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getTrialEndingEmailTemplate(
    userName: string,
    daysRemaining: number,
    upgradeLink: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trial Ending Soon</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Your Trial Ends Soon</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${userName || 'there'},</p>
          <p>Your free trial will expire in <strong>${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong>.</p>
          <p>Don't lose access to all the amazing features! Upgrade now to continue creating viral content with unlimited AI generations.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${upgradeLink}" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Upgrade Now</a>
          </div>
          <p>With a paid plan, you'll get:</p>
          <ul style="color: #4b5563;">
            <li>Unlimited AI idea generations</li>
            <li>Advanced AI tools and features</li>
            <li>Multi-platform support</li>
            <li>Priority support</li>
          </ul>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">Questions? Reply to this email or visit our support center.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getPaymentSuccessEmailTemplate(
    userName: string,
    planName: string,
    amount: number,
    invoiceUrl?: string,
  ): string {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Payment Successful!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${userName || 'there'},</p>
          <p>Thank you for your payment! Your subscription to <strong>${planName}</strong> has been activated.</p>
          <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #059669;">Amount Paid: ${formattedAmount}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Plan: ${planName}</p>
          </div>
          ${invoiceUrl ? `<p><a href="${invoiceUrl}" style="color: #667eea;">View Invoice</a></p>` : ''}
          <p>You now have access to all premium features. Start creating amazing content!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.frontendUrl}/ideas" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact our support team.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getPostingReminderEmailTemplate(
    userName: string,
    ideaTitle: string,
    platform: string,
    scheduledDate: Date,
  ): string {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(scheduledDate);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Posting Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">📅 Posting Reminder</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${userName || 'there'},</p>
          <p>This is a reminder that your content is scheduled to be posted soon!</p>
          <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${ideaTitle}</p>
            <p style="margin: 5px 0; color: #6b7280;">Platform: <strong>${platform}</strong></p>
            <p style="margin: 5px 0; color: #6b7280;">Scheduled: <strong>${formattedDate}</strong></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.frontendUrl}/ideas" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Content</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Don't forget to post your content at the scheduled time!</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}
