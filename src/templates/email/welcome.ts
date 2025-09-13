import { createBaseTemplate, createButton, emailStyles } from '../../lib/email/base-template';
import type { BaseTemplateData } from '../../lib/email/base-template';

export interface WelcomeData extends BaseTemplateData {
  websiteUrl?: string;
  menuUrl?: string;
  cateringUrl?: string;
}

export function WelcomeTemplate(data: WelcomeData): { html: string; text: string } {
  const {
    customerName = 'BBQ Lover',
    websiteUrl = 'https://troybbq.com',
    menuUrl = 'https://troybbq.com/menu',
    cateringUrl = 'https://troybbq.com/catering'
  } = data;

  const content = `
    <div style="text-align: center; margin: 0 0 ${emailStyles.spacing.lg};">
      <h1 style="margin: 0 0 ${emailStyles.spacing.sm}; color: ${emailStyles.colors.primary}; font-size: 28px;">
        🎉 Welcome to Troy BBQ! 🎉
      </h1>
      <p style="margin: 0; color: ${emailStyles.colors.text}; font-size: 18px;">
        Where every meal is a celebration!
      </p>
    </div>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Hi ${customerName},
    </p>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Welcome to the Troy BBQ family! We're thrilled to have you join us on this delicious journey of authentic, mouth-watering BBQ.
    </p>

    <p style="margin: 0 0 ${emailStyles.spacing.lg}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Whether you're looking for your next favorite meal or planning the perfect catered event, we're here to serve you BBQ excellence that will have you coming back for more.
    </p>

    <div style="text-align: center; margin: ${emailStyles.spacing.lg} 0;">
      ${createButton('🍖 Explore Our Menu', menuUrl, 'primary')}
      ${createButton('🎪 Plan Your Event', cateringUrl, 'secondary')}
    </div>

    <p style="margin: ${emailStyles.spacing.lg} 0; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6; text-align: center;">
      <strong>The Troy BBQ Team</strong><br>
      <em>"Your satisfaction is our recipe for success"</em> 🍖
    </p>
  `;

  return createBaseTemplate('Welcome to Troy BBQ!', content, data);
}