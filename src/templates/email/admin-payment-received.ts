import { createBaseTemplate, createAlert, createPricingTable, emailStyles } from '../../lib/email/base-template';
import type { BaseTemplateData } from '../../lib/email/base-template';

export interface AdminPaymentReceivedData extends BaseTemplateData {
  quoteId: string;
  customerEmail: string;
  paymentAmount: number;
  paymentType: 'deposit' | 'balance' | 'full';
  transactionId: string;
  adminDashboardUrl?: string;
}

export function AdminPaymentReceivedTemplate(data: AdminPaymentReceivedData): { html: string; text: string } {
  const {
    quoteId,
    customerEmail,
    paymentAmount,
    paymentType,
    transactionId,
    adminDashboardUrl = ''
  } = data;

  const content = `
    <h2 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.success}; font-size: 24px; text-align: center;">
      💰 Payment Received!
    </h2>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} payment received for Quote #${quoteId}
    </p>

    ${createAlert('Customer: ' + customerEmail + ' | Amount: $' + (paymentAmount / 100).toFixed(2) + ' | Transaction: ' + transactionId, 'success')}

    <p style="margin: ${emailStyles.spacing.lg} 0; color: ${emailStyles.colors.text}; font-size: 14px; text-align: center;">
      Quote ID: ${quoteId}
    </p>
  `;

  return createBaseTemplate('Payment Received - Admin Alert', content, { ...data, unsubscribeUrl: '#', preferencesUrl: '#' });
}