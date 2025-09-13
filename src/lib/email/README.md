# Troy BBQ Email Notification System

A comprehensive email notification system built for Troy BBQ's catering business, featuring professional HTML email templates, automated workflows, and customer preference management.

## Features

### 🎯 Core Functionality
- **Professional Email Templates**: Mobile-responsive HTML emails with Troy BBQ branding
- **Automated Workflows**: Restaurant-specific notification triggers and scheduling
- **Preference Management**: Customer-controlled email preferences and unsubscribe system
- **Multi-Provider Support**: Built with Resend, extensible to other providers
- **Security & Compliance**: DKIM, SPF, proper unsubscribe handling

### 📧 Email Types Supported

#### Customer Notifications
- **Quote Confirmation**: Immediate confirmation when catering quote is submitted
- **Quote Approved**: Notification when quote is approved with payment links
- **Payment Confirmation**: Deposit and balance payment confirmations
- **Event Reminders**: 24-hour and 2-hour reminders before events
- **Order Status Updates**: Real-time updates on catering order progress
- **Welcome Emails**: Onboarding for new customers

#### Admin Notifications
- **New Quote Alerts**: Immediate notification when new quotes require review
- **Payment Received**: Admin alerts for successful payments
- **System Reports**: Automated reporting and status updates

### 🔄 Automation Features
- **Event-Driven Triggers**: Automatic emails based on business events
- **Scheduled Reminders**: Smart scheduling for event reminders
- **Customer Lifecycle**: Automated workflows from quote to completion
- **Retry Logic**: Reliable delivery with error handling
- **Rate Limiting**: Respectful sending to avoid spam filters

## Quick Start

### 1. Environment Setup

Add these environment variables to your `.env` file:

```bash
# Required
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@troybbq.com
DOMAIN=troybbq.com

# Optional
ADMIN_EMAILS=admin@troybbq.com,manager@troybbq.com
CRON_AUTH_TOKEN=your-secret-cron-token
```

### 2. Initialize System

```typescript
import { initializeEmailSystem } from './src/lib/email/email-integration';

// Call once on server startup
await initializeEmailSystem();
```

### 3. Send Notifications

```typescript
import { 
  sendQuoteConfirmationEmail,
  sendPaymentConfirmationEmail,
  sendWelcomeEmail 
} from './src/lib/email/email-integration';

// Send quote confirmation
await sendQuoteConfirmationEmail({
  quoteId: 'Q123',
  customerEmail: 'customer@example.com',
  customerName: 'John Doe',
  eventDate: '2025-01-15',
  eventTime: '6:00 PM',
  eventLocation: '123 Main St, Dallas, TX',
  guestCount: 50,
  hungerLevel: 'really hungry',
  selectedMeats: ['Brisket', 'Pulled Pork'],
  selectedSides: ['Mac & Cheese', 'Coleslaw'],
  selectedAddons: [],
  pricingBreakdown: {
    subtotal: 150000,
    tax: 12000,
    deliveryFee: 5000,
    total: 167000,
    depositAmount: 50100,
    balanceAmount: 116900
  }
});
```

## System Architecture

### Core Services

#### 1. EmailService (`email-service.ts`)
- **Resend Integration**: Direct integration with Resend API
- **Template Management**: Dynamic template loading and rendering
- **Priority Handling**: Support for different email priorities
- **Delivery Tracking**: Message ID tracking and status monitoring

#### 2. EmailPreferencesService (`email-preferences.ts`)
- **Preference Storage**: Database-backed preference management
- **Category Controls**: Granular control over email types
- **Unsubscribe Handling**: Compliant unsubscribe functionality
- **Token Management**: Secure preference access tokens

#### 3. NotificationAutomationService (`notification-automation.ts`)
- **Trigger Processing**: Event-based notification triggers
- **Scheduling System**: Automated reminder scheduling
- **Customer Journey**: End-to-end notification workflows
- **Admin Alerts**: Administrative notification system

### Database Schema

The system creates these tables automatically:

```sql
-- Email preferences
CREATE TABLE email_preferences (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  quotes BOOLEAN DEFAULT true,
  payments BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  event_reminders BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT false,
  newsletters BOOLEAN DEFAULT false,
  unsubscribed_all BOOLEAN DEFAULT false,
  unsubscribe_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled notifications
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);
```

## Email Templates

### Template Structure
All templates follow a consistent structure:
- **Responsive Design**: Mobile-optimized with proper fallbacks
- **Brand Consistency**: Troy BBQ colors, fonts, and styling
- **Accessibility**: Screen reader friendly with proper alt text
- **Dark Mode Support**: Respects user's dark mode preferences

### Available Templates
- `quote-confirmation.ts` - Quote submission confirmation
- `quote-approved.ts` - Quote approval with payment options
- `payment-confirmation.ts` - Payment processing confirmation
- `event-reminder-24h.ts` - 24-hour event reminder
- `event-reminder-2h.ts` - 2-hour event reminder
- `admin-new-quote.ts` - Admin notification for new quotes
- `welcome.ts` - Customer welcome email

### Custom Template Creation

```typescript
import { createBaseTemplate, createButton, emailStyles } from '../base-template';

export function CustomTemplate(data: CustomData) {
  const content = `
    <h2 style="color: ${emailStyles.colors.primary};">
      Custom Email Content
    </h2>
    ${createButton('Call to Action', 'https://example.com', 'primary')}
  `;
  
  return createBaseTemplate('Subject Line', content, data);
}
```

## API Endpoints

### Send Notifications
```
POST /api/notifications/send
```

### Process Scheduled Notifications (Cron)
```
POST /api/notifications/process-scheduled
Authorization: Bearer your-cron-token
```

### Email Preferences
```
GET /api/email-preferences?token=abc123
POST /api/email-preferences
```

### Unsubscribe
```
GET /api/email-preferences/unsubscribe?token=abc123
POST /api/email-preferences/unsubscribe
```

## Production Setup

### 1. Domain Configuration
- Set up DKIM records in your DNS
- Configure SPF records for Resend
- Set up DMARC policy for enhanced security

### 2. Cron Job Setup
Set up a cron job to process scheduled notifications:

```bash
# Every 5 minutes
*/5 * * * * curl -X POST \
  -H "Authorization: Bearer your-cron-token" \
  https://your-domain.com/api/notifications/process-scheduled
```

### 3. Monitoring
- Monitor email delivery rates through Resend dashboard
- Set up alerts for failed notifications
- Track customer engagement metrics

## Best Practices

### Email Deliverability
- Always include unsubscribe links
- Use proper from addresses with verified domains
- Maintain clean email lists
- Monitor bounce rates and feedback loops

### Customer Experience
- Provide clear preference management
- Use friendly, conversational tone
- Include relevant event details
- Make unsubscribe easy and immediate

### Performance
- Rate limit email sending
- Use background processing for large batches
- Cache email templates when possible
- Monitor API usage limits

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check RESEND_API_KEY is set correctly
   - Verify domain is verified in Resend
   - Check API rate limits

2. **Templates not loading**
   - Ensure all template files are present
   - Check import paths are correct
   - Verify TypeScript compilation

3. **Database errors**
   - Run initializeEmailSystem() on startup
   - Check database connection string
   - Verify table permissions

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## Security Considerations

- Email preferences use secure random tokens
- All database queries use parameterized statements
- Unsubscribe tokens are unique and non-guessable
- Admin endpoints require authentication
- Rate limiting prevents abuse

## Performance Metrics

The system is designed to handle:
- 1000+ emails per hour
- Automatic retry for failed deliveries
- Efficient template caching
- Minimal database overhead

## Support

For questions or issues:
- Review this documentation
- Check system logs for errors
- Contact the development team
- Submit issues through the project repository

---

Built with ❤️ for Troy BBQ's catering excellence.