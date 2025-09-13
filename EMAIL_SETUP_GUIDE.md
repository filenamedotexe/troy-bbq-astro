# Troy BBQ Email System Setup Guide

This guide will walk you through setting up the comprehensive email notification system for Troy BBQ's catering business.

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install resend
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Update `.env` with your configuration:
```bash
# Required: Get from https://resend.com/api-keys
RESEND_API_KEY="re_your_actual_api_key_here"

# Required: Your verified sending domain
FROM_EMAIL="noreply@troybbq.com"
DOMAIN="troybbq.com"

# Required: Admin notification emails
ADMIN_EMAILS="admin@troybbq.com,manager@troybbq.com"

# Required: Secure token for cron jobs
CRON_AUTH_TOKEN="$(openssl rand -base64 32)"
```

### 3. Initialize Database Tables

The system will automatically create required tables on first run. To manually initialize:

```bash
curl -X GET \
  -H "Authorization: Bearer your-cron-auth-token" \
  http://localhost:4005/api/email-system/verify
```

### 4. Verify Setup

```bash
# Check system health
curl -X GET \
  -H "Authorization: Bearer your-cron-auth-token" \
  http://localhost:4005/api/email-system/verify

# Send test email
curl -X POST \
  -H "Authorization: Bearer your-cron-auth-token" \
  -H "Content-Type: application/json" \
  -d '{"test_email": "test@example.com"}' \
  http://localhost:4005/api/email-system/verify
```

## 📧 Resend Configuration

### 1. Create Resend Account
1. Visit [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Add Domain
1. Go to Domains in Resend dashboard
2. Add your domain (e.g., `troybbq.com`)
3. Configure DNS records as shown

### 3. DNS Records Setup

Add these DNS records to your domain:

```
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

# DKIM Record (get values from Resend dashboard)
Type: TXT
Name: resend._domainkey
Value: [provided by Resend]

# DMARC Record (optional but recommended)
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@troybbq.com
```

### 4. Generate API Key
1. Go to API Keys in Resend dashboard
2. Create new API key
3. Copy the key to your `.env` file

## 🔧 Integration with Existing Code

### Quote Submission
```typescript
import { sendQuoteConfirmationEmail } from './src/lib/email/email-integration';

// In your quote submission handler
await sendQuoteConfirmationEmail({
  quoteId: quote.id,
  customerEmail: quote.customer_email,
  customerName: quote.customer_name,
  eventDate: quote.event_date,
  eventTime: quote.event_time,
  eventLocation: quote.event_location,
  guestCount: quote.guest_count,
  hungerLevel: quote.hunger_level,
  selectedMeats: quote.selected_meats,
  selectedSides: quote.selected_sides,
  selectedAddons: quote.selected_addons,
  pricingBreakdown: quote.pricing_breakdown
});
```

### Payment Processing
```typescript
import { sendPaymentConfirmationEmail } from './src/lib/email/email-integration';

// After successful payment
await sendPaymentConfirmationEmail({
  quoteId: payment.quote_id,
  customerEmail: payment.customer_email,
  paymentType: 'deposit', // or 'balance' or 'full'
  paymentAmount: payment.amount_cents,
  paymentMethod: payment.method,
  transactionId: payment.transaction_id,
  eventDate: payment.event_date,
  eventTime: payment.event_time
});
```

### Quote Approval
```typescript
import { sendQuoteApprovedEmail } from './src/lib/email/email-integration';

// When admin approves quote
await sendQuoteApprovedEmail({
  quoteId: quote.id,
  customerEmail: quote.customer_email,
  customerName: quote.customer_name,
  eventDate: quote.event_date,
  eventTime: quote.event_time,
  eventLocation: quote.event_location,
  depositAmount: quote.deposit_amount,
  balanceAmount: quote.balance_amount,
  totalAmount: quote.total_amount,
  depositPaymentUrl: `https://troybbq.com/pay/${quote.id}/deposit`
});
```

## ⏰ Scheduled Notifications Setup

### Cron Job Configuration

Add this to your server's crontab or use Vercel Cron Jobs:

```bash
# Process scheduled notifications every 5 minutes
*/5 * * * * curl -X POST \
  -H "Authorization: Bearer your-cron-auth-token" \
  https://troybbq.com/api/notifications/process-scheduled
```

### Vercel Cron Jobs (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/notifications/process-scheduled",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## 🎨 Customizing Email Templates

### Brand Colors
Update colors in `/src/lib/email/base-template.ts`:

```typescript
export const emailStyles = {
  colors: {
    primary: '#8B4513',    // Troy BBQ brown
    secondary: '#D2691E',  // Warm orange
    accent: '#FF6B35',     // Bright orange
    // ... other colors
  }
};
```

### Logo and Branding
1. Upload logo to your CDN or static assets
2. Update logo URL in templates
3. Customize company name and taglines

### Creating Custom Templates
```typescript
// /src/templates/email/custom-template.ts
import { createBaseTemplate, createButton, emailStyles } from '../../lib/email/base-template';

export interface CustomTemplateData extends BaseTemplateData {
  customField: string;
}

export function CustomTemplate(data: CustomTemplateData): { html: string; text: string } {
  const { customerName, customField } = data;
  
  const content = `
    <h2 style="color: ${emailStyles.colors.primary};">
      Custom Email for ${customerName}
    </h2>
    <p>${customField}</p>
    ${createButton('Take Action', 'https://troybbq.com/action', 'primary')}
  `;
  
  return createBaseTemplate('Custom Email Subject', content, data);
}
```

## 🛡️ Security & Best Practices

### Email Security
- All emails include proper unsubscribe links
- Customer preferences are stored securely
- Admin endpoints require authentication
- Rate limiting prevents abuse

### GDPR Compliance
- Customers can manage preferences
- Unsubscribe is immediate and permanent
- Email data is only used for notifications
- Clear privacy policy links in emails

### Performance
- Templates are cached for efficiency
- Rate limiting respects provider limits
- Background processing for large batches
- Graceful error handling and retries

## 🐛 Troubleshooting

### Common Issues

**1. Emails not sending**
```bash
# Check API key
echo $RESEND_API_KEY

# Check domain verification
curl -X GET \
  -H "Authorization: Bearer your-cron-auth-token" \
  http://localhost:4005/api/email-system/verify
```

**2. Templates not loading**
```bash
# Check file permissions
ls -la src/templates/email/

# Verify imports
npm run build
```

**3. Database errors**
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Initialize tables manually
curl -X GET \
  -H "Authorization: Bearer your-cron-auth-token" \
  http://localhost:4005/api/email-system/verify
```

**4. Scheduled notifications not working**
```bash
# Test cron endpoint
curl -X POST \
  -H "Authorization: Bearer your-cron-auth-token" \
  http://localhost:4005/api/notifications/process-scheduled

# Check logs for errors
tail -f /var/log/cron.log
```

### Debug Mode
Set environment variable for detailed logging:
```bash
NODE_ENV=development
```

## 📊 Monitoring & Analytics

### Email Metrics
- Monitor delivery rates in Resend dashboard
- Track open rates and engagement
- Set up webhooks for bounce handling
- Monitor API usage and limits

### System Health
Regular health checks:
```bash
# Automated monitoring
curl -X GET \
  -H "Authorization: Bearer your-cron-auth-token" \
  https://troybbq.com/api/email-system/verify
```

## 🚀 Production Deployment

### Environment Variables (Production)
```bash
# Production settings
NODE_ENV="production"
RESEND_API_KEY="re_live_api_key_here"
FROM_EMAIL="noreply@troybbq.com"
DOMAIN="troybbq.com"
ENABLE_EMAIL_IN_DEV="false"
```

### Performance Optimization
- Use CDN for email assets
- Cache templates in production
- Monitor email queue length
- Set up log aggregation

### Monitoring Setup
- Set up alerts for failed emails
- Monitor API rate limits
- Track customer engagement
- Regular backup of preferences data

## 🎯 Advanced Features

### Custom Email Campaigns
```typescript
import { emailService, EmailType } from './src/lib/email/email-service';

// Send newsletter to subscribers
const subscribers = await getNewsletterSubscribers();
for (const subscriber of subscribers) {
  await emailService.sendEmail({
    to: subscriber.email,
    subject: 'Monthly BBQ Newsletter',
    type: EmailType.NEWSLETTER,
    data: {
      customerName: subscriber.name,
      content: 'Your newsletter content here...'
    }
  });
}
```

### A/B Testing
```typescript
// Test different subject lines
const subjectA = 'Your BBQ Event is Tomorrow!';
const subjectB = 'Get Ready for Amazing BBQ Tomorrow!';

const testGroup = Math.random() < 0.5 ? 'A' : 'B';
const subject = testGroup === 'A' ? subjectA : subjectB;

await emailService.sendEmail({
  to: customer.email,
  subject,
  type: EmailType.EVENT_REMINDER_24H,
  data: { ...eventData, testGroup }
});
```

## ✅ Launch Checklist

- [ ] Resend account created and verified
- [ ] Domain added and DNS configured
- [ ] API key generated and added to environment
- [ ] Database tables initialized
- [ ] Test emails sent successfully
- [ ] Cron jobs configured
- [ ] Admin emails receiving notifications
- [ ] Customer preferences working
- [ ] Unsubscribe links functional
- [ ] Templates rendering correctly
- [ ] Mobile responsiveness verified
- [ ] Production environment configured
- [ ] Monitoring and alerts set up

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review system logs
3. Test with verification endpoint
4. Contact development team

---

🎉 **Congratulations!** Your Troy BBQ email system is ready to delight customers with professional, timely notifications that enhance their catering experience!