import { createBaseTemplate, createButton, emailStyles, BaseTemplateData } from '../../lib/email/base-template';

export interface NewsletterData extends BaseTemplateData {
  subject: string;
  content: string;
  callToActionText?: string;
  callToActionUrl?: string;
}

export function NewsletterTemplate(data: NewsletterData): { html: string; text: string } {
  const {
    customerName = 'BBQ Lover',
    subject,
    content,
    callToActionText = '',
    callToActionUrl = ''
  } = data;

  const emailContent = `
    <h2 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 24px; text-align: center;">
      ${subject}
    </h2>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Hi ${customerName},
    </p>
    
    <div style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      ${content}
    </div>

    ${callToActionText && callToActionUrl ? createButton(callToActionText, callToActionUrl, 'primary') : ''}

    <p style="margin: ${emailStyles.spacing.lg} 0; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6; text-align: center;">
      <strong>The Troy BBQ Team</strong>
    </p>
  `;

  return createBaseTemplate(subject, emailContent, data);
}