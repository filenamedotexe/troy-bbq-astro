import { createBaseTemplate, createButton, createAlert, createPricingTable, emailStyles, BaseTemplateData } from '../../lib/email/base-template';

export interface QuoteApprovedData extends BaseTemplateData {
  quoteId: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  guestCount: number;
  depositAmount: number;
  balanceAmount: number;
  totalAmount: number;
  depositPaymentUrl?: string;
  contractUrl?: string;
  contactPhone?: string;
}

export function QuoteApprovedTemplate(data: QuoteApprovedData): { html: string; text: string } {
  const {
    customerName = 'Valued Customer',
    quoteId,
    eventDate,
    eventTime,
    eventLocation,
    guestCount,
    depositAmount,
    balanceAmount,
    totalAmount,
    depositPaymentUrl = '',
    contractUrl = '',
    contactPhone = '(555) 123-4567'
  } = data;

  const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
    <!-- Celebration Header -->
    <div style="text-align: center; margin: 0 0 ${emailStyles.spacing.lg};">
      <h1 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.primary}; font-size: 28px;">
        🎉 Great News! Your Quote is Approved! 🎉
      </h1>
      <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 18px;">
        We're excited to cater your event!
      </p>
    </div>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Hi ${customerName},
    </p>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Fantastic news! We've reviewed and approved your catering quote. We're thrilled to be part of your special event and can't wait to serve you our delicious BBQ!
    </p>

    ${createAlert('Quote #' + quoteId + ' has been APPROVED! ✅ Ready to secure your booking with a deposit payment.', 'success')}

    <!-- Event Summary -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px; border: 2px solid ${emailStyles.colors.success};">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg};">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 20px; text-align: center;">
            📋 Event Confirmed Details
          </h3>
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; width: 100px; vertical-align: top;">
                <strong>📅 Date:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.text}; font-size: 15px; font-weight: bold;">
                ${eventDateFormatted}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; vertical-align: top;">
                <strong>🕐 Time:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.text}; font-size: 15px; font-weight: bold;">
                ${eventTime}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; vertical-align: top;">
                <strong>📍 Location:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.text}; font-size: 15px; font-weight: bold;">
                ${eventLocation}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; vertical-align: top;">
                <strong>👥 Guests:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.text}; font-size: 15px; font-weight: bold;">
                ${guestCount} people
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Payment Information -->
    <h3 style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 20px; text-align: center;">
      💳 Secure Your Booking
    </h3>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0;">
      <tr>
        <td style="width: 50%; padding-right: ${emailStyles.spacing.sm};">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #E8F5E8; border-radius: 8px; border: 2px solid ${emailStyles.colors.success};">
            <tr>
              <td style="padding: ${emailStyles.spacing.lg}; text-align: center;">
                <h4 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.success}; font-size: 18px;">
                  💰 Deposit Required
                </h4>
                <p style="margin: 0 0 ${emailStyles.spacing.sm}; color: #155724; font-size: 24px; font-weight: bold;">
                  $${(depositAmount / 100).toFixed(2)}
                </p>
                <p style="margin: 0; color: #155724; font-size: 14px;">
                  (30% of total - due now)
                </p>
              </td>
            </tr>
          </table>
        </td>
        <td style="width: 50%; padding-left: ${emailStyles.spacing.sm};">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FFF3CD; border-radius: 8px; border: 2px solid ${emailStyles.colors.warning};">
            <tr>
              <td style="padding: ${emailStyles.spacing.lg}; text-align: center;">
                <h4 style="margin: 0 0 ${emailStyles.spacing.sm}; color: #856404; font-size: 18px;">
                  🏁 Balance Due
                </h4>
                <p style="margin: 0 0 ${emailStyles.spacing.sm}; color: #856404; font-size: 24px; font-weight: bold;">
                  $${(balanceAmount / 100).toFixed(2)}
                </p>
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  (due day of event)
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Total Summary -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: ${emailStyles.colors.primary}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg}; text-align: center;">
          <h3 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.background}; font-size: 20px;">
            Total Event Cost
          </h3>
          <p style="margin: 0; color: ${emailStyles.colors.background}; font-size: 32px; font-weight: bold;">
            $${(totalAmount / 100).toFixed(2)}
          </p>
        </td>
      </tr>
    </table>

    <!-- Call to Action -->
    <div style="text-align: center; margin: ${emailStyles.spacing.lg} 0;">
      ${depositPaymentUrl ? createButton('💳 Pay Deposit Now - Secure Your Booking', depositPaymentUrl, 'success') : ''}
    </div>

    <!-- Important Notice -->
    ${createAlert('⏰ Please pay your deposit within 48 hours to secure your booking. Events are reserved on a first-come, first-served basis after approval.', 'warning')}

    <!-- Next Steps -->
    <h3 style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
      🚀 What Happens After Payment?
    </h3>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0;">
      <tr>
        <td style="width: 60px; vertical-align: top; padding-right: ${emailStyles.spacing.sm};">
          <div style="width: 40px; height: 40px; background-color: ${emailStyles.colors.success}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">1</div>
        </td>
        <td style="vertical-align: top; padding: ${emailStyles.spacing.xs} 0;">
          <h4 style="margin: 0 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.text}; font-size: 16px;">Immediate Confirmation</h4>
          <p style="margin: 0; color: ${emailStyles.colors.textLight}; font-size: 14px;">You'll receive instant payment confirmation and booking guarantee</p>
        </td>
      </tr>
    </table>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0;">
      <tr>
        <td style="width: 60px; vertical-align: top; padding-right: ${emailStyles.spacing.sm};">
          <div style="width: 40px; height: 40px; background-color: ${emailStyles.colors.secondary}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">2</div>
        </td>
        <td style="vertical-align: top; padding: ${emailStyles.spacing.xs} 0;">
          <h4 style="margin: 0 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.text}; font-size: 16px;">Event Planning</h4>
          <p style="margin: 0; color: ${emailStyles.colors.textLight}; font-size: 14px;">Our team begins detailed preparation and coordination for your event</p>
        </td>
      </tr>
    </table>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0;">
      <tr>
        <td style="width: 60px; vertical-align: top; padding-right: ${emailStyles.spacing.sm};">
          <div style="width: 40px; height: 40px; background-color: ${emailStyles.colors.accent}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">3</div>
        </td>
        <td style="vertical-align: top; padding: ${emailStyles.spacing.xs} 0;">
          <h4 style="margin: 0 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.text}; font-size: 16px;">Event Reminders</h4>
          <p style="margin: 0; color: ${emailStyles.colors.textLight}; font-size: 14px;">We'll send friendly reminders and final details before your event</p>
        </td>
      </tr>
    </table>

    ${contractUrl ? `
    <!-- Contract/Agreement -->
    <div style="text-align: center; margin: ${emailStyles.spacing.lg} 0;">
      ${createButton('📄 View Service Agreement', contractUrl, 'secondary')}
    </div>
    ` : ''}

    <!-- Contact Information -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.lg} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg}; text-align: center;">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
            💬 Questions or Special Requests?
          </h3>
          <p style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.text}; font-size: 14px;">
            Our dedicated catering team is here to make your event perfect!
          </p>
          <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 14px;">
            <strong>Phone:</strong> <a href="tel:${contactPhone}" style="color: ${emailStyles.colors.primary}; text-decoration: none;">${contactPhone}</a><br>
            <strong>Email:</strong> <a href="mailto:catering@troybbq.com" style="color: ${emailStyles.colors.primary}; text-decoration: none;">catering@troybbq.com</a>
          </p>
        </td>
      </tr>
    </table>

    <!-- Closing -->
    <p style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6; text-align: center;">
      <strong>We're honored to be part of your special day!</strong><br>
      Get ready for some seriously delicious BBQ that will have your guests talking for months.
    </p>
    
    <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6; text-align: center;">
      <strong>The Troy BBQ Team</strong><br>
      <em>"Creating memorable experiences, one meal at a time"</em> 🍖✨
    </p>
  `;

  return createBaseTemplate(
    `🎉 Your Catering Quote #${quoteId} is Approved!`,
    content,
    data
  );
}