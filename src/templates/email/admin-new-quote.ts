import { createBaseTemplate, createButton, createAlert, createPricingTable, emailStyles, BaseTemplateData } from '../../lib/email/base-template';

export interface AdminNewQuoteData extends BaseTemplateData {
  quoteId: string;
  customerEmail: string;
  customerName?: string;
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
  };
  adminDashboardUrl?: string;
  approveQuoteUrl?: string;
  customerPhone?: string;
  specialRequests?: string;
  submittedAt?: string;
}

export function AdminNewQuoteTemplate(data: AdminNewQuoteData): { html: string; text: string } {
  const {
    customerName = 'Customer',
    customerEmail,
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
    adminDashboardUrl = '',
    approveQuoteUrl = '',
    customerPhone = '',
    specialRequests = '',
    submittedAt = new Date().toISOString()
  } = data;

  const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const submittedAtFormatted = new Date(submittedAt).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const content = `
    <!-- Alert Header -->
    <div style="text-align: center; margin: 0 0 ${emailStyles.spacing.lg};">
      <h1 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.accent}; font-size: 28px;">
        🚨 NEW CATERING QUOTE REQUEST 🚨
      </h1>
      <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 18px; font-weight: bold;">
        Action Required: Review and Approve
      </p>
    </div>

    ${createAlert('New Quote #' + quoteId + ' requires your review and approval. Customer is waiting for response within 24 hours.', 'warning')}

    <!-- Quick Stats -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0;">
      <tr>
        <td style="width: 25%; text-align: center; padding: ${emailStyles.spacing.md}; background-color: ${emailStyles.colors.primary}; border-radius: 8px 0 0 8px;">
          <h3 style="margin: 0; color: ${emailStyles.colors.background}; font-size: 24px;">${guestCount}</h3>
          <p style="margin: 0; color: ${emailStyles.colors.background}; font-size: 12px;">Guests</p>
        </td>
        <td style="width: 25%; text-align: center; padding: ${emailStyles.spacing.md}; background-color: ${emailStyles.colors.secondary};">
          <h3 style="margin: 0; color: ${emailStyles.colors.background}; font-size: 20px;">$${(pricingBreakdown.total / 100).toFixed(0)}</h3>
          <p style="margin: 0; color: ${emailStyles.colors.background}; font-size: 12px;">Total Value</p>
        </td>
        <td style="width: 25%; text-align: center; padding: ${emailStyles.spacing.md}; background-color: ${emailStyles.colors.success};">
          <h3 style="margin: 0; color: ${emailStyles.colors.background}; font-size: 16px;">${hungerLevel}</h3>
          <p style="margin: 0; color: ${emailStyles.colors.background}; font-size: 12px;">Hunger Level</p>
        </td>
        <td style="width: 25%; text-align: center; padding: ${emailStyles.spacing.md}; background-color: ${emailStyles.colors.accent}; border-radius: 0 8px 8px 0;">
          <h3 style="margin: 0; color: ${emailStyles.colors.background}; font-size: 14px;">${new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h3>
          <p style="margin: 0; color: ${emailStyles.colors.background}; font-size: 12px;">Event Date</p>
        </td>
      </tr>
    </table>

    <!-- Customer Information -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.lg} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px; border: 2px solid ${emailStyles.colors.primary};">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg};">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 20px;">
            👤 Customer Details
          </h3>
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; width: 120px; vertical-align: top;">
                <strong>Name:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px; font-weight: bold;">
                ${customerName}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; vertical-align: top;">
                <strong>Email:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px;">
                <a href="mailto:${customerEmail}" style="color: ${emailStyles.colors.primary}; text-decoration: none;">${customerEmail}</a>
              </td>
            </tr>
            ${customerPhone ? `
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; vertical-align: top;">
                <strong>Phone:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px;">
                <a href="tel:${customerPhone}" style="color: ${emailStyles.colors.primary}; text-decoration: none;">${customerPhone}</a>
              </td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; vertical-align: top;">
                <strong>Submitted:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px;">
                ${submittedAtFormatted}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Event Information -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg};">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
            📅 Event Details
          </h3>
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; width: 100px; vertical-align: top;">
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
            🍽️ Menu Selection
          </h3>
          
          <div style="margin-bottom: ${emailStyles.spacing.md};">
            <h4 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.text}; font-size: 16px;">
              Meats Selected:
            </h4>
            <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 14px; line-height: 1.5;">
              ${selectedMeats.join(', ')}
            </p>
          </div>
          
          <div style="margin-bottom: ${emailStyles.spacing.md};">
            <h4 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.text}; font-size: 16px;">
              Sides Selected:
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

    ${specialRequests ? `
    <!-- Special Requests -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: #FFF3CD; border-left: 4px solid ${emailStyles.colors.warning}; border-radius: 4px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.md};">
          <h4 style="margin: 0 0 ${emailStyles.spacing.sm}; color: #856404; font-size: 16px;">
            📝 Special Requests/Notes
          </h4>
          <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
            ${specialRequests}
          </p>
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- Pricing Summary -->
    <h3 style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
      💰 Revenue Breakdown
    </h3>
    
    ${createPricingTable([
      { label: 'Subtotal', amount: pricingBreakdown.subtotal },
      { label: 'Tax', amount: pricingBreakdown.tax },
      { label: 'Delivery Fee', amount: pricingBreakdown.deliveryFee },
      { label: '<strong>Total Revenue</strong>', amount: pricingBreakdown.total }
    ])}

    <!-- Action Required -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.lg} 0; background-color: ${emailStyles.colors.accent}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg}; text-align: center;">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.background}; font-size: 20px;">
            ⚡ ACTION REQUIRED
          </h3>
          <p style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.background}; font-size: 14px;">
            This customer is waiting for quote approval within 24 hours
          </p>
          <p style="margin: 0; color: ${emailStyles.colors.background}; font-size: 16px; font-weight: bold;">
            Quote ID: ${quoteId}
          </p>
        </td>
      </tr>
    </table>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: ${emailStyles.spacing.lg} 0;">
      ${approveQuoteUrl ? createButton('✅ APPROVE QUOTE NOW', approveQuoteUrl, 'success') : ''}
      ${adminDashboardUrl ? createButton('📊 View in Admin Dashboard', adminDashboardUrl, 'secondary') : ''}
    </div>

    <!-- Urgency Reminder -->
    ${createAlert('⏰ Remember: Customers expect a response within 24 hours. Quick approval leads to higher conversion rates!', 'warning')}

    <!-- Admin Notes -->
    <h3 style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
      📋 Review Checklist
    </h3>
    
    <ul style="margin: 0 0 ${emailStyles.spacing.md}; padding-left: 20px; color: ${emailStyles.colors.text}; font-size: 14px; line-height: 1.8;">
      <li>✅ Check event date availability in calendar</li>
      <li>✅ Verify delivery location is within service area</li>
      <li>✅ Confirm capacity for guest count on event date</li>
      <li>✅ Review any special requests for feasibility</li>
      <li>✅ Validate pricing calculations</li>
      <li>✅ Check for potential scheduling conflicts</li>
    </ul>

    <!-- Contact Customer -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.lg} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg}; text-align: center;">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
            📞 Customer Contact Info
          </h3>
          <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 14px;">
            <strong>Email:</strong> <a href="mailto:${customerEmail}?subject=Re: Catering Quote ${quoteId}" style="color: ${emailStyles.colors.primary}; text-decoration: none;">${customerEmail}</a><br>
            ${customerPhone ? `<strong>Phone:</strong> <a href="tel:${customerPhone}" style="color: ${emailStyles.colors.primary}; text-decoration: none;">${customerPhone}</a>` : ''}
          </p>
        </td>
      </tr>
    </table>

    <!-- System Info -->
    <p style="margin: ${emailStyles.spacing.lg} 0 0; color: ${emailStyles.colors.textLight}; font-size: 12px; text-align: center;">
      <em>This is an automated admin notification. Quote submitted at ${submittedAtFormatted}</em><br>
      <em>Quote ID: ${quoteId} | Customer: ${customerEmail}</em>
    </p>
  `;

  return createBaseTemplate(
    `🚨 NEW Catering Quote #${quoteId} - $${(pricingBreakdown.total / 100).toFixed(0)} - ${guestCount} guests`,
    content,
    { ...data, unsubscribeUrl: '#', preferencesUrl: '#' } // Admin emails don't need unsubscribe
  );
}