import { createBaseTemplate, createButton, createAlert, createPricingTable, emailStyles, BaseTemplateData } from '../../lib/email/base-template';

export interface QuoteConfirmationData extends BaseTemplateData {
  quoteId: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  guestCount: number;
  hungerLevel: string;
  selectedMeats: string[];
  selectedSides: string[];
  selectedAddons: any[];
  pricingBreakdown: {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    total: number;
    depositAmount: number;
    balanceAmount: number;
  };
  approvalUrl?: string;
  contactPhone?: string;
}

export function QuoteConfirmationTemplate(data: QuoteConfirmationData): { html: string; text: string } {
  const {
    customerName = 'Valued Customer',
    quoteId,
    eventDate,
    eventTime,
    eventLocation,
    guestCount,
    hungerLevel,
    selectedMeats,
    selectedSides,
    selectedAddons,
    pricingBreakdown,
    approvalUrl = '',
    contactPhone = '(555) 123-4567'
  } = data;

  const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
    <!-- Greeting -->
    <h2 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 24px; text-align: center;">
      Thank You for Your Catering Request! 🍖
    </h2>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Hi ${customerName},
    </p>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      We've received your catering quote request and are excited to serve you! Here are the details of your quote:
    </p>

    ${createAlert('Quote #' + quoteId + ' - Your request is being reviewed by our team. We\'ll get back to you within 24 hours!', 'info')}

    <!-- Event Details -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg};">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
            📅 Event Details
          </h3>
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; width: 120px; vertical-align: top;">
                <strong>Date:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px;">
                ${eventDateFormatted}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; vertical-align: top;">
                <strong>Time:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px;">
                ${eventTime}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; vertical-align: top;">
                <strong>Location:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px;">
                ${eventLocation}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; vertical-align: top;">
                <strong>Guests:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px;">
                ${guestCount} people (${hungerLevel} hunger level)
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Menu Selection -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg};">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
            🍽️ Your Menu Selection
          </h3>
          
          <div style="margin-bottom: ${emailStyles.spacing.md};">
            <h4 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.text}; font-size: 16px;">
              Meats:
            </h4>
            <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 14px; line-height: 1.5;">
              ${selectedMeats.join(', ')}
            </p>
          </div>
          
          <div style="margin-bottom: ${emailStyles.spacing.md};">
            <h4 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.text}; font-size: 16px;">
              Sides:
            </h4>
            <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 14px; line-height: 1.5;">
              ${selectedSides.join(', ')}
            </p>
          </div>
          
          ${selectedAddons.length > 0 ? `
          <div>
            <h4 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.text}; font-size: 16px;">
              Add-ons:
            </h4>
            <ul style="margin: 0; padding-left: 20px; color: ${emailStyles.colors.text}; font-size: 14px; line-height: 1.5;">
              ${selectedAddons.map(addon => `<li>${addon.name} - $${(addon.price_cents / 100).toFixed(2)}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </td>
      </tr>
    </table>

    <!-- Pricing Breakdown -->
    <h3 style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
      💰 Pricing Breakdown
    </h3>
    
    ${createPricingTable([
      { label: 'Subtotal', amount: pricingBreakdown.subtotal },
      { label: 'Tax', amount: pricingBreakdown.tax },
      { label: 'Delivery Fee', amount: pricingBreakdown.deliveryFee },
      { label: '<strong>Total</strong>', amount: pricingBreakdown.total }
    ])}

    <!-- Payment Information -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: #E8F5E8; border-left: 4px solid ${emailStyles.colors.success}; border-radius: 4px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.md};">
          <h4 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.success}; font-size: 16px;">
            💳 Payment Schedule
          </h4>
          <p style="margin: 0 0 ${emailStyles.spacing.xs}; color: #155724; font-size: 14px;">
            <strong>Deposit Required:</strong> $${(pricingBreakdown.depositAmount / 100).toFixed(2)} (30% of total)
          </p>
          <p style="margin: 0; color: #155724; font-size: 14px;">
            <strong>Balance Due:</strong> $${(pricingBreakdown.balanceAmount / 100).toFixed(2)} (due day of event)
          </p>
        </td>
      </tr>
    </table>

    <!-- Next Steps -->
    <h3 style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
      🎯 What Happens Next?
    </h3>
    
    <ol style="margin: 0 0 ${emailStyles.spacing.md}; padding-left: 20px; color: ${emailStyles.colors.text}; font-size: 14px; line-height: 1.8;">
      <li><strong>Review:</strong> Our team will review your quote and confirm availability</li>
      <li><strong>Approval:</strong> You'll receive an approval email within 24 hours</li>
      <li><strong>Deposit:</strong> Pay the deposit to secure your booking</li>
      <li><strong>Confirmation:</strong> We'll send final confirmation with all details</li>
      <li><strong>Preparation:</strong> We'll prepare your delicious BBQ feast</li>
      <li><strong>Delivery:</strong> We'll arrive on time and set everything up</li>
    </ol>

    ${approvalUrl ? createButton('Review & Approve Quote', approvalUrl, 'primary') : ''}

    <!-- Contact Information -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.lg} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg}; text-align: center;">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
            📞 Questions?
          </h3>
          <p style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.text}; font-size: 14px;">
            Our catering team is here to help! Contact us:
          </p>
          <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 14px;">
            <strong>Phone:</strong> <a href="tel:${contactPhone}" style="color: ${emailStyles.colors.primary}; text-decoration: none;">${contactPhone}</a><br>
            <strong>Email:</strong> <a href="mailto:catering@troybbq.com" style="color: ${emailStyles.colors.primary}; text-decoration: none;">catering@troybbq.com</a>
          </p>
        </td>
      </tr>
    </table>

    <!-- Closing -->
    <p style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Thank you for choosing Troy BBQ for your special event. We can't wait to serve you our authentic, mouth-watering BBQ!
    </p>
    
    <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      <strong>The Troy BBQ Catering Team</strong><br>
      <em>"Where every meal is a celebration"</em>
    </p>
  `;

  return createBaseTemplate(
    `Catering Quote Confirmation #${quoteId}`,
    content,
    data
  );
}