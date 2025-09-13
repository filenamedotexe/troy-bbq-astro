import { createBaseTemplate, createButton, createAlert, emailStyles } from '../../lib/email/base-template';
import type { BaseTemplateData } from '../../lib/email/base-template';

export interface EventReminder24hData extends BaseTemplateData {
  quoteId: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  guestCount: number;
  setupTime?: string;
  contactPhone?: string;
  specialInstructions?: string;
  eventDetailsUrl?: string;
  contactUrl?: string;
}

export function EventReminder24hTemplate(data: EventReminder24hData): { html: string; text: string } {
  const {
    customerName = 'Valued Customer',
    quoteId,
    eventDate,
    eventTime,
    eventLocation,
    guestCount,
    setupTime = '',
    contactPhone = '(555) 123-4567',
    specialInstructions = '',
    eventDetailsUrl = '',
    contactUrl = ''
  } = data;

  const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isToday = new Date(eventDate).toDateString() === new Date().toDateString();
  const isTomorrow = new Date(eventDate).toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

  const getEventTimingText = () => {
    if (isToday) return 'today';
    if (isTomorrow) return 'tomorrow';
    return 'soon';
  };

  const content = `
    <!-- Excitement Header -->
    <div style="text-align: center; margin: 0 0 ${emailStyles.spacing.lg};">
      <h1 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.primary}; font-size: 28px;">
        🎉 Your BBQ Event is ${getEventTimingText().charAt(0).toUpperCase() + getEventTimingText().slice(1)}! 🎉
      </h1>
      <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 18px;">
        We can't wait to serve you amazing BBQ!
      </p>
    </div>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Hi ${customerName},
    </p>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      This is your friendly reminder that your Troy BBQ catering event is ${getEventTimingText()}! Our team is excited and ready to make your event absolutely delicious.
    </p>

    ${createAlert('📅 Event Reminder: Quote #' + quoteId + ' - Your catering event is in 24 hours!', 'info')}

    <!-- Event Countdown -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background: linear-gradient(135deg, ${emailStyles.colors.primary}, ${emailStyles.colors.secondary}); border-radius: 12px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg}; text-align: center;">
          <h2 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.background}; font-size: 24px;">
            ⏰ Event Countdown
          </h2>
          <p style="margin: 0; color: ${emailStyles.colors.background}; font-size: 32px; font-weight: bold;">
            24 Hours to Go!
          </p>
          <p style="margin: ${emailStyles.spacing.xs} 0 0; color: ${emailStyles.colors.background}; font-size: 16px;">
            Get ready for some incredible BBQ! 🍖
          </p>
        </td>
      </tr>
    </table>

    <!-- Event Details Reminder -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.lg} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px; border: 2px solid ${emailStyles.colors.primary};">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg};">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 20px; text-align: center;">
            📋 Final Event Details
          </h3>
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; width: 120px; vertical-align: top;">
                <strong>📅 Date:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.text}; font-size: 15px; font-weight: bold;">
                ${eventDateFormatted}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; vertical-align: top;">
                <strong>🕐 Event Time:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.text}; font-size: 15px; font-weight: bold;">
                ${eventTime}
              </td>
            </tr>
            ${setupTime ? `
            <tr>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.textLight}; font-size: 15px; vertical-align: top;">
                <strong>🚚 Setup Time:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.sm} 0; color: ${emailStyles.colors.text}; font-size: 15px; font-weight: bold;">
                ${setupTime} (30-60 min before event)
              </td>
            </tr>
            ` : ''}
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

    <!-- What to Expect -->
    <h3 style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 20px; text-align: center;">
      🌟 What to Expect Tomorrow
    </h3>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0;">
      <tr>
        <td style="width: 60px; vertical-align: top; padding-right: ${emailStyles.spacing.sm};">
          <div style="width: 50px; height: 50px; background-color: ${emailStyles.colors.success}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">🚚</div>
        </td>
        <td style="vertical-align: top; padding: ${emailStyles.spacing.sm} 0;">
          <h4 style="margin: 0 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.text}; font-size: 16px;">On-Time Arrival</h4>
          <p style="margin: 0; color: ${emailStyles.colors.textLight}; font-size: 14px;">Our professional team will arrive ${setupTime || '30-60 minutes before your event'} to ensure everything is perfectly set up</p>
        </td>
      </tr>
    </table>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0;">
      <tr>
        <td style="width: 60px; vertical-align: top; padding-right: ${emailStyles.spacing.sm};">
          <div style="width: 50px; height: 50px; background-color: ${emailStyles.colors.secondary}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">🍖</div>
        </td>
        <td style="vertical-align: top; padding: ${emailStyles.spacing.sm} 0;">
          <h4 style="margin: 0 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.text}; font-size: 16px;">Fresh, Hot BBQ</h4>
          <p style="margin: 0; color: ${emailStyles.colors.textLight}; font-size: 14px;">All your BBQ will be prepared fresh that day and delivered at the perfect serving temperature</p>
        </td>
      </tr>
    </table>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0;">
      <tr>
        <td style="width: 60px; vertical-align: top; padding-right: ${emailStyles.spacing.sm};">
          <div style="width: 50px; height: 50px; background-color: ${emailStyles.colors.accent}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">✨</div>
        </td>
        <td style="vertical-align: top; padding: ${emailStyles.spacing.sm} 0;">
          <h4 style="margin: 0 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.text}; font-size: 16px;">Complete Setup</h4>
          <p style="margin: 0; color: ${emailStyles.colors.textLight}; font-size: 14px;">We'll handle all setup, serving equipment, and cleanup so you can focus on enjoying your event</p>
        </td>
      </tr>
    </table>

    ${specialInstructions ? `
    <!-- Special Instructions -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.lg} 0; background-color: #E3F2FD; border-left: 4px solid #2196F3; border-radius: 4px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.md};">
          <h4 style="margin: 0 0 ${emailStyles.spacing.sm}; color: #1565C0; font-size: 16px;">
            📝 Special Instructions Noted
          </h4>
          <p style="margin: 0; color: #1565C0; font-size: 14px; line-height: 1.5;">
            ${specialInstructions}
          </p>
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- Preparation Checklist -->
    <h3 style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
      ✅ Quick Preparation Checklist
    </h3>
    
    <ul style="margin: 0 0 ${emailStyles.spacing.md}; padding-left: 20px; color: ${emailStyles.colors.text}; font-size: 14px; line-height: 1.8;">
      <li>Ensure venue access is available for our setup team</li>
      <li>Clear space for buffet setup (tables/serving area)</li>
      <li>Confirm final guest count (let us know if it changed)</li>
      <li>Have contact person available for any questions</li>
      <li>Get ready to enjoy amazing BBQ! 🎉</li>
    </ul>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: ${emailStyles.spacing.lg} 0;">
      ${eventDetailsUrl ? createButton('📋 View Full Event Details', eventDetailsUrl, 'primary') : ''}
      ${contactUrl ? createButton('💬 Contact Our Team', contactUrl, 'secondary') : ''}
    </div>

    <!-- Emergency Contact -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.lg} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg}; text-align: center;">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
            📞 Need to Reach Us?
          </h3>
          <p style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.text}; font-size: 14px;">
            For any last-minute questions or changes:
          </p>
          <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 16px;">
            <strong>Phone:</strong> <a href="tel:${contactPhone}" style="color: ${emailStyles.colors.primary}; text-decoration: none; font-weight: bold;">${contactPhone}</a><br>
            <strong>Email:</strong> <a href="mailto:catering@troybbq.com" style="color: ${emailStyles.colors.primary}; text-decoration: none; font-weight: bold;">catering@troybbq.com</a>
          </p>
          <p style="margin: ${emailStyles.spacing.sm} 0 0; color: ${emailStyles.colors.textLight}; font-size: 12px;">
            <em>Please mention Quote ID: ${quoteId}</em>
          </p>
        </td>
      </tr>
    </table>

    <!-- Excitement Closing -->
    <p style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6; text-align: center;">
      <strong>We're incredibly excited to be part of your special day!</strong><br>
      Our team has been working hard to ensure everything will be perfect for your event.
    </p>
    
    <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6; text-align: center;">
      <strong>The Troy BBQ Team</strong><br>
      <em>"Get ready for the best BBQ experience of your life!"</em> 🔥🍖
    </p>
  `;

  return createBaseTemplate(
    `🎉 Your BBQ Event is ${getEventTimingText().charAt(0).toUpperCase() + getEventTimingText().slice(1)}! - Quote #${quoteId}`,
    content,
    data
  );
}