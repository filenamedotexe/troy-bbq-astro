import { createBaseTemplate, createButton, createAlert, createPricingTable, emailStyles } from '../../lib/email/base-template';
import type { BaseTemplateData } from '../../lib/email/base-template';

export interface PaymentConfirmationData extends BaseTemplateData {
  quoteId: string;
  paymentType: 'deposit' | 'balance' | 'full';
  paymentAmount: number;
  paymentMethod: string;
  transactionId: string;
  eventDate: string;
  eventTime: string;
  balanceRemaining?: number;
  balanceDueDate?: string;
  receiptUrl?: string;
  eventDetailsUrl?: string;
  contactPhone?: string;
}

export function PaymentConfirmationTemplate(data: PaymentConfirmationData): { html: string; text: string } {
  const {
    customerName = 'Valued Customer',
    quoteId,
    paymentType,
    paymentAmount,
    paymentMethod,
    transactionId,
    eventDate,
    eventTime,
    balanceRemaining = 0,
    balanceDueDate = '',
    receiptUrl = '',
    eventDetailsUrl = '',
    contactPhone = '(555) 123-4567'
  } = data;

  const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const balanceDueDateFormatted = balanceDueDate ? new Date(balanceDueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  const getPaymentTypeTitle = () => {
    switch (paymentType) {
      case 'deposit':
        return '💰 Deposit Payment Confirmed!';
      case 'balance':
        return '✅ Final Payment Complete!';
      case 'full':
        return '🎉 Payment Complete!';
      default:
        return '💳 Payment Confirmed!';
    }
  };

  const getPaymentTypeMessage = () => {
    switch (paymentType) {
      case 'deposit':
        return 'Your deposit has been successfully processed and your catering event is now secured!';
      case 'balance':
        return 'Your final payment has been received! You\'re all set for your event.';
      case 'full':
        return 'Your full payment has been processed successfully! Everything is confirmed for your event.';
      default:
        return 'Your payment has been processed successfully!';
    }
  };

  const content = `
    <!-- Success Header -->
    <div style="text-align: center; margin: 0 0 ${emailStyles.spacing.lg};">
      <h1 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.success}; font-size: 28px;">
        ${getPaymentTypeTitle()}
      </h1>
      <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 18px;">
        Thank you for your payment!
      </p>
    </div>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Hi ${customerName},
    </p>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      ${getPaymentTypeMessage()}
    </p>

    ${createAlert('Payment processed successfully! ✅ Quote #' + quoteId + ' - ' + paymentType.charAt(0).toUpperCase() + paymentType.slice(1) + ' payment confirmed.', 'success')}

    <!-- Payment Details -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px; border: 2px solid ${emailStyles.colors.success};">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg};">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 20px; text-align: center;">
            💳 Payment Receipt
          </h3>
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; width: 140px; vertical-align: top;">
                <strong>Amount Paid:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.success}; font-size: 20px; font-weight: bold;">
                $${(paymentAmount / 100).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; vertical-align: top;">
                <strong>Payment Type:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.text}; font-size: 15px; font-weight: bold;">
                ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} Payment
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; vertical-align: top;">
                <strong>Payment Method:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.text}; font-size: 15px;">
                ${paymentMethod}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; vertical-align: top;">
                <strong>Transaction ID:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.text}; font-size: 15px; font-family: monospace;">
                ${transactionId}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; vertical-align: top;">
                <strong>Quote ID:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.text}; font-size: 15px; font-family: monospace;">
                ${quoteId}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; vertical-align: top;">
                <strong>Payment Date:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.text}; font-size: 15px;">
                ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Event Details Reminder -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg};">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
            📅 Your Event Details
          </h3>
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; width: 80px; vertical-align: top;">
                <strong>Date:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px; font-weight: bold;">
                ${eventDateFormatted}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; vertical-align: top;">
                <strong>Time:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px; font-weight: bold;">
                ${eventTime}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${balanceRemaining > 0 ? `
    <!-- Balance Remaining -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: #FFF3CD; border-left: 4px solid ${emailStyles.colors.warning}; border-radius: 4px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.md};">
          <h4 style="margin: 0 0 ${emailStyles.spacing.sm}; color: #856404; font-size: 16px;">
            💡 Balance Remaining
          </h4>
          <p style="margin: 0 0 ${emailStyles.spacing.xs}; color: #856404; font-size: 14px;">
            <strong>Amount Due:</strong> $${(balanceRemaining / 100).toFixed(2)}
          </p>
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Due Date:</strong> ${balanceDueDateFormatted || 'Day of event'}
          </p>
        </td>
      </tr>
    </table>
    ` : `
    <!-- Full Payment Complete -->
    ${createAlert('🎉 Congratulations! Your payment is complete. You\'re all set for your event!', 'success')}
    `}

    <!-- Action Buttons -->
    <div style="text-align: center; margin: ${emailStyles.spacing.lg} 0;">
      ${receiptUrl ? createButton('📄 Download Receipt', receiptUrl, 'secondary') : ''}
      ${eventDetailsUrl ? createButton('📋 View Event Details', eventDetailsUrl, 'primary') : ''}
    </div>

    <!-- What's Next -->
    <h3 style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
      🎯 What Happens Next?
    </h3>
    
    ${paymentType === 'deposit' ? `
    <ol style="margin: 0 0 ${emailStyles.spacing.md}; padding-left: 20px; color: ${emailStyles.colors.text}; font-size: 14px; line-height: 1.8;">
      <li><strong>Event Secured:</strong> Your date and time are now reserved exclusively for you</li>
      <li><strong>Planning Begins:</strong> Our team starts detailed preparation for your event</li>
      <li><strong>Reminders:</strong> We'll send helpful reminders as your event approaches</li>
      <li><strong>Balance Payment:</strong> Final payment will be due on the day of your event</li>
      <li><strong>Delivery & Setup:</strong> We'll arrive on time and make everything perfect</li>
    </ol>
    ` : `
    <ol style="margin: 0 0 ${emailStyles.spacing.md}; padding-left: 20px; color: ${emailStyles.colors.text}; font-size: 14px; line-height: 1.8;">
      <li><strong>Final Preparations:</strong> Our team is putting the finishing touches on your order</li>
      <li><strong>Event Reminders:</strong> We'll send you timely reminders before your event</li>
      <li><strong>Quality Assurance:</strong> Everything will be prepared fresh and with care</li>
      <li><strong>On-Time Delivery:</strong> We'll arrive punctually and handle all setup</li>
      <li><strong>Exceptional Service:</strong> Enjoy delicious BBQ and worry-free catering</li>
    </ol>
    `}

    <!-- Contact Information -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.lg} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg}; text-align: center;">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
            💬 Need Assistance?
          </h3>
          <p style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.text}; font-size: 14px;">
            Have questions about your order or need to make changes?
          </p>
          <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 14px;">
            <strong>Phone:</strong> <a href="tel:${contactPhone}" style="color: ${emailStyles.colors.primary}; text-decoration: none;">${contactPhone}</a><br>
            <strong>Email:</strong> <a href="mailto:catering@troybbq.com" style="color: ${emailStyles.colors.primary}; text-decoration: none;">catering@troybbq.com</a>
          </p>
          <p style="margin: ${emailStyles.spacing.sm} 0 0; color: ${emailStyles.colors.textLight}; font-size: 12px;">
            <em>Please include your Quote ID (${quoteId}) when contacting us</em>
          </p>
        </td>
      </tr>
    </table>

    <!-- Closing -->
    <p style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6; text-align: center;">
      Thank you for choosing Troy BBQ! We're committed to making your event absolutely delicious and memorable.
    </p>
    
    <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6; text-align: center;">
      <strong>The Troy BBQ Team</strong><br>
      <em>"Your satisfaction is our recipe for success"</em> 🍖
    </p>
  `;

  return createBaseTemplate(
    `${paymentType === 'deposit' ? 'Deposit' : paymentType === 'balance' ? 'Final Payment' : 'Payment'} Confirmation - Quote #${quoteId}`,
    content,
    data
  );
}