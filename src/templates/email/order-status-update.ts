import { createBaseTemplate, createAlert, emailStyles } from '../../lib/email/base-template';
import type { BaseTemplateData } from '../../lib/email/base-template';

export interface OrderStatusUpdateData extends BaseTemplateData {
  orderId: string;
  status: string;
  statusMessage: string;
  trackingUrl?: string;
}

export function OrderStatusUpdateTemplate(data: OrderStatusUpdateData): { html: string; text: string } {
  const {
    customerName = 'Valued Customer',
    orderId,
    status,
    statusMessage
  } = data;

  const content = `
    <h2 style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.primary}; font-size: 24px; text-align: center;">
      📦 Order Update
    </h2>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Hi ${customerName},
    </p>
    
    <p style="margin: 0 0 ${emailStyles.spacing.md}; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6;">
      Your order status has been updated:
    </p>

    ${createAlert(statusMessage, 'info')}

    <p style="margin: ${emailStyles.spacing.lg} 0; color: ${emailStyles.colors.text}; font-size: 16px; line-height: 1.6; text-align: center;">
      Order ID: ${orderId}
    </p>
  `;

  return createBaseTemplate('Order Status Update - Troy BBQ', content, data);
}