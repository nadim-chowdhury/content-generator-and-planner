# Email System Setup Guide

## SMTP Configuration (Gmail/Google)

The email system uses SMTP with Gmail/Google as the provider. Follow these steps to configure:

### 1. Gmail App Password Setup

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already enabled)
3. Go to **App passwords**: https://myaccount.google.com/apppasswords
4. Select **Mail** and **Other (Custom name)**
5. Enter "Content Generator & Planner" as the name
6. Click **Generate**
7. Copy the 16-character app password (you'll use this as `SMTP_PASSWORD`)

### 2. Environment Variables

Add the following to your `.env` file:

```env
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM_EMAIL=noreply@yourdomain.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3001
```

### 3. Alternative SMTP Providers

If you want to use a different SMTP provider, update the environment variables:

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASSWORD=your-aws-secret-key
```

**Outlook/Office 365:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### 4. Testing Email Configuration

The email service will automatically verify the SMTP connection on startup. Check the logs for:
- `SMTP server is ready to send emails` (success)
- `SMTP connection error:` (failure - check credentials)

### 5. Email Templates

The system includes the following email templates:

1. **Welcome Email** - Sent on signup with verification link
2. **Email Verification** - Sent when user requests verification
3. **Password Reset** - Sent when user requests password reset
4. **Trial Ending** - Sent 3 days before trial expires
5. **Payment Success** - Sent after successful payment
6. **Posting Reminder** - Sent 1 hour before scheduled content

All emails are queued through BullMQ for reliable delivery.

### 6. Troubleshooting

**Common Issues:**

1. **"Invalid login" error:**
   - Make sure you're using an App Password, not your regular Gmail password
   - Verify 2-Step Verification is enabled

2. **"Connection timeout":**
   - Check firewall settings
   - Verify SMTP_PORT is correct (587 for TLS, 465 for SSL)

3. **Emails not sending:**
   - Check Redis is running (required for email queue)
   - Check email queue stats in admin panel: `/admin/queue`
   - Review application logs for errors

### 7. Production Considerations

1. **Use a dedicated email service** (SendGrid, AWS SES, Mailgun) for better deliverability
2. **Set up SPF, DKIM, and DMARC records** for your domain
3. **Monitor email bounce rates** and handle them appropriately
4. **Use a custom domain** for `SMTP_FROM_EMAIL` instead of Gmail address
5. **Implement rate limiting** to avoid being flagged as spam

