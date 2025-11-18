import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Send email (placeholder - integrate with email service like SendGrid, AWS SES, etc.)
   */
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      // TODO: Integrate with actual email service
      // For now, just log the email
      this.logger.log(`Email would be sent to ${to}: ${subject}`);
      this.logger.debug(`Email content: ${text || html.substring(0, 100)}...`);

      // Example integration with nodemailer or SendGrid:
      // const nodemailer = require('nodemailer');
      // const transporter = nodemailer.createTransport({
      //   host: this.configService.get('SMTP_HOST'),
      //   port: this.configService.get('SMTP_PORT'),
      //   auth: {
      //     user: this.configService.get('SMTP_USER'),
      //     pass: this.configService.get('SMTP_PASS'),
      //   },
      // });
      // await transporter.sendMail({ to, subject, html, text });

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send upcoming content reminder
   */
  async sendUpcomingContentReminder(
    to: string,
    userName: string,
    content: Array<{ title: string; scheduledAt: string; platform: string }>,
  ): Promise<boolean> {
    const subject = `Upcoming Content Reminder - ${content.length} item(s) scheduled`;
    
    const contentList = content
      .map(
        (item) => `
      <li>
        <strong>${item.title}</strong><br>
        Platform: ${item.platform}<br>
        Scheduled: ${new Date(item.scheduledAt).toLocaleString()}
      </li>
    `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            ul { list-style: none; padding: 0; }
            li { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4F46E5; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Upcoming Content Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${userName || 'there'},</p>
              <p>You have <strong>${content.length}</strong> content item(s) scheduled soon:</p>
              <ul>
                ${contentList}
              </ul>
              <p>Don't forget to prepare and post your content on time!</p>
              <p>Best regards,<br>Content Generator Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Upcoming Content Reminder

      Hi ${userName || 'there'},

      You have ${content.length} content item(s) scheduled soon:

      ${content.map((item) => `- ${item.title} (${item.platform}) - ${new Date(item.scheduledAt).toLocaleString()}`).join('\n')}

      Don't forget to prepare and post your content on time!

      Best regards,
      Content Generator Team
    `;

    return this.sendEmail(to, subject, html, text);
  }

  /**
   * Send task reminder
   */
  async sendTaskReminder(
    to: string,
    userName: string,
    task: { title: string; deadline: string; description?: string },
  ): Promise<boolean> {
    const subject = `Task Reminder: ${task.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .task-box { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4F46E5; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Task Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${userName || 'there'},</p>
              <p>This is a reminder about your upcoming task:</p>
              <div class="task-box">
                <h2>${task.title}</h2>
                ${task.description ? `<p>${task.description}</p>` : ''}
                <p><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleString()}</p>
              </div>
              <p>Best regards,<br>Content Generator Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Task Reminder

      Hi ${userName || 'there'},

      This is a reminder about your upcoming task:

      ${task.title}
      ${task.description ? `\n${task.description}\n` : ''}
      Deadline: ${new Date(task.deadline).toLocaleString()}

      Best regards,
      Content Generator Team
    `;

    return this.sendEmail(to, subject, html, text);
  }
}


