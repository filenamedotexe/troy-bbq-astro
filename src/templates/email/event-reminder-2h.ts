import { createBaseTemplate, createButton, createAlert, emailStyles, BaseTemplateData } from '../../lib/email/base-template';

export interface EventReminder2hData extends BaseTemplateData {
  quoteId: string;
  eventTime: string;
  eventLocation: string;
  setupTime?: string;
  driverName?: string;
  driverPhone?: string;
  emergencyContact?: string;
  specialNotes?: string;
  trackingUrl?: string;
}

export function EventReminder2hTemplate(data: EventReminder2hData): { html: string; text: string } {
  const {
    customerName = 'Valued Customer',
    quoteId,
    eventTime,
    eventLocation,
    setupTime = '',
    driverName = 'Our delivery team',
    driverPhone = '',
    emergencyContact = '(555) 123-4567',
    specialNotes = '',
    trackingUrl = ''
  } = data;

  const content = `
    <!-- Urgency Header -->
    <div style="text-align: center; margin: 0 0 ${emailStyles.spacing.lg};">
      <h1 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.accent}; font-size: 32px;">
        🚨 Your BBQ is on the way! 🚨
      </h1>
      <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 20px; font-weight: bold;">
        Event starting in 2 hours!
      </p>
    </div>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Hi ${customerName},
    </p>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      This is it! Your Troy BBQ catering event starts in just 2 hours, and we're already in motion to make sure everything is perfect. Our team is currently preparing your delicious BBQ feast! 🍖
    </p>

    ${createAlert('⚡ URGENT: Your event is starting in 2 hours! Our team is en route or preparing to depart.', 'warning')}

    <!-- Live Status -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background: linear-gradient(135deg, ${emailStyles.colors.accent}, ${emailStyles.colors.secondary}); border-radius: 12px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg}; text-align: center;">
          <h2 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.background}; font-size: 28px;">
            ⏱️ T-Minus 2 Hours!
          </h2>
          <p style="margin: 0; color: ${emailStyles.colors.background}; font-size: 18px; font-weight: bold;">
            Your BBQ team is in action!
          </p>
          <p style="margin: ${emailStyles.spacing.xs} 0 0; color: ${emailStyles.colors.background}; font-size: 14px;">
            Event Time: <strong>${eventTime}</strong>
          </p>
        </td>
      </tr>
    </table>

    <!-- Current Status -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.lg} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px; border: 2px solid ${emailStyles.colors.accent};">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg};">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 20px; text-align: center;">
            🎯 Current Status Update
          </h3>
          
          <!-- Status Steps -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="width: 40px; vertical-align: top; padding-right: ${emailStyles.spacing.sm};">
                <div style="width: 30px; height: 30px; background-color: ${emailStyles.colors.success}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">✓</div>
              </td>
              <td style="vertical-align: top; padding: ${emailStyles.spacing.xs} 0;">
                <h4 style="margin: 0 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.success}; font-size: 14px;">BBQ Prepared Fresh</h4>
                <p style="margin: 0; color: ${emailStyles.colors.textLight}; font-size: 12px;">All your delicious BBQ has been cooked to perfection</p>
              </td>
            </tr>
          </table>
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.sm} 0;">
            <tr>
              <td style="width: 40px; vertical-align: top; padding-right: ${emailStyles.spacing.sm};">
                <div style="width: 30px; height: 30px; background-color: ${emailStyles.colors.success}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">✓</div>
              </td>
              <td style="vertical-align: top; padding: ${emailStyles.spacing.xs} 0;">
                <h4 style="margin: 0 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.success}; font-size: 14px;">Equipment Loaded</h4>
                <p style="margin: 0; color: ${emailStyles.colors.textLight}; font-size: 12px;">All serving equipment and supplies are packed and ready</p>
              </td>
            </tr>
          </table>
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.sm} 0;">
            <tr>
              <td style="width: 40px; vertical-align: top; padding-right: ${emailStyles.spacing.sm};">
                <div style="width: 30px; height: 30px; background-color: ${emailStyles.colors.accent}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">🚚</div>
              </td>
              <td style="vertical-align: top; padding: ${emailStyles.spacing.xs} 0;">
                <h4 style="margin: 0 0 ${emailStyles.spacing.xs}; color: ${emailStyles.colors.accent}; font-size: 14px;">Team En Route</h4>
                <p style="margin: 0; color: ${emailStyles.colors.textLight}; font-size: 12px;">${driverName} is heading to your location now</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Delivery Team Info -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: ${emailStyles.colors.backgroundLight}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg};">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 18px;">
            👥 Your Catering Team
          </h3>
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; width: 120px; vertical-align: top;">
                <strong>Team Lead:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px; font-weight: bold;">
                ${driverName}
              </td>
            </tr>
            ${driverPhone ? `
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; vertical-align: top;">
                <strong>Direct Phone:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px;">
                <a href="tel:${driverPhone}" style="color: ${emailStyles.colors.primary}; text-decoration: none; font-weight: bold;">${driverPhone}</a>
              </td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; vertical-align: top;">
                <strong>Setup Time:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px; font-weight: bold;">
                ${setupTime || 'Arriving 30-60 minutes early'}
              </td>
            </tr>
            <tr>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.textLight}; font-size: 14px; vertical-align: top;">
                <strong>Location:</strong>
              </td>
              <td style="padding: ${emailStyles.spacing.xs} 0; color: ${emailStyles.colors.text}; font-size: 14px; font-weight: bold;">
                ${eventLocation}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${specialNotes ? `
    <!-- Special Notes -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: #E3F2FD; border-left: 4px solid #2196F3; border-radius: 4px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.md};">
          <h4 style="margin: 0 0 ${emailStyles.spacing.sm}; color: #1565C0; font-size: 16px;">
            📝 Special Event Notes
          </h4>
          <p style="margin: 0; color: #1565C0; font-size: 14px; line-height: 1.5;">
            ${specialNotes}
          </p>
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- Action Required -->
    <h3 style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.accent}; font-size: 18px;">
      🎯 Please Ensure These Are Ready
    </h3>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.md} 0; background-color: #FFF3CD; border-left: 4px solid ${emailStyles.colors.warning}; border-radius: 4px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.md};">
          <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 1.8;">
            <li><strong>Venue Access:</strong> Ensure our team can access the setup area</li>
            <li><strong>Setup Space:</strong> Clear tables/area ready for buffet arrangement</li>
            <li><strong>Contact Person:</strong> Have someone available to meet our team</li>
            <li><strong>Power Access:</strong> Electrical outlets nearby if needed</li>
            <li><strong>Parking:</strong> Clear loading/unloading access for our vehicle</li>
          </ul>
        </td>
      </tr>
    </table>

    <!-- Tracking/Contact -->
    <div style="text-align: center; margin: ${emailStyles.spacing.lg} 0;">
      ${trackingUrl ? createButton('📍 Track Delivery Status', trackingUrl, 'primary') : ''}
    </div>

    <!-- Emergency Contact -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: ${emailStyles.spacing.lg} 0; background-color: ${emailStyles.colors.primary}; border-radius: 8px;">
      <tr>
        <td style="padding: ${emailStyles.spacing.lg}; text-align: center;">
          <h3 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.background}; font-size: 18px;">
            🚨 Need Immediate Help?
          </h3>
          <p style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.background}; font-size: 14px;">
            For urgent questions or issues in the next 2 hours:
          </p>
          <p style="margin: 0; color: ${emailStyles.colors.background}; font-size: 18px; font-weight: bold;">
            📞 Call: <a href="tel:${emergencyContact}" style="color: ${emailStyles.colors.background}; text-decoration: none;">${emergencyContact}</a>
          </p>
          <p style="margin: ${emailStyles.spacing.sm} 0 0; color: ${emailStyles.colors.background}; font-size: 12px;">
            <em>Quote ID: ${quoteId} | Available 24/7 for active events</em>
          </p>
        </td>
      </tr>
    </table>

    <!-- Final Message -->
    <p style="margin: ${emailStyles.spacing.lg} 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6; text-align: center;">
      <strong>The moment has arrived!</strong><br>
      In just 2 hours, you and your guests will be enjoying the most incredible BBQ experience. Our team is fired up and ready to deliver perfection!
    </p>
    
    <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6; text-align: center;">
      <strong>The Troy BBQ Delivery Team</strong><br>
      <em>"T-minus 2 hours to BBQ greatness!"</em> 🔥🚀
    </p>
  `;

  return createBaseTemplate(
    `🚨 Your BBQ Event Starts in 2 Hours! - Quote #${quoteId}`,
    content,
    data
  );
}