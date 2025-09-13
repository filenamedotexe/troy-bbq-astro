import { createBaseTemplate, createButton, createPricingTable, emailStyles } from '../../lib/email/base-template';
import type { BaseTemplateData } from '../../lib/email/base-template';

export interface PaymentReceiptData extends BaseTemplateData {
  transactionId: string;
  paymentAmount: number;
  paymentMethod: string;
  paymentDate: string;
  receiptUrl?: string;
}

export function PaymentReceiptTemplate(data: PaymentReceiptData): { html: string; text: string } {
  const {
    customerName = 'Valued Customer',
    transactionId,
    paymentAmount,
    paymentMethod,
    paymentDate
  } = data;

  const content = `
    <h2 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 24px; text-align: center;">
      💳 Payment Receipt
    </h2>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Hi ${customerName},
    </p>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      This is your official payment receipt for your Troy BBQ transaction.
    </p>

    ${createPricingTable([
      { label: 'Amount Paid', amount: paymentAmount },
      { label: 'Payment Method', amount: 0 },
      { label: 'Transaction ID', amount: 0 }
    ])}

    <p style="margin: ${emailStyles.spacing.lg} 0; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6; text-align: center;">
      Thank you for your business!
    </p>
  `;

  return createBaseTemplate('Payment Receipt - Troy BBQ', content, data);
}