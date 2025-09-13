import { Resend } from 'resend';

// Environment variables for email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@troybbq.com';
const DOMAIN = process.env.DOMAIN || 'troybbq.com';

// Initialize Resend client
const resend = new Resend(RESEND_API_KEY);

// Email types for notification system
export enum EmailType {
  QUOTE_CONFIRMATION = 'quote_confirmation',
  QUOTE_APPROVED = 'quote_approved',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  PAYMENT_RECEIPT = 'payment_receipt',
  ORDER_STATUS_UPDATE = 'order_status_update',
  EVENT_REMINDER_24H = 'event_reminder_24h',
  EVENT_REMINDER_2H = 'event_reminder_2h',
  ADMIN_NEW_QUOTE = 'admin_new_quote',
  ADMIN_PAYMENT_RECEIVED = 'admin_payment_received',
  WELCOME = 'welcome',
  NEWSLETTER = 'newsletter'
}

// Email priority levels
export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Base email data structure
export interface EmailData {
  to: string | string[];
  subject: string;
  type: EmailType;
  priority?: EmailPriority;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

// Email delivery result
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

// Email service class
export class EmailService {
  private resend: Resend;
  private fromEmail: string;
  private domain: string;

  constructor() {
    this.resend = resend;
    this.fromEmail = FROM_EMAIL;
    this.domain = DOMAIN;
  }

  /**
   * Send an email using Resend
   */
  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      const { to, subject, type, priority = EmailPriority.NORMAL, data = {}, attachments, replyTo, cc, bcc } = emailData;

      // Get email template based on type
      const template = await this.getEmailTemplate(type, data);
      
      const emailOptions = {
        from: this.fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: template.html,
        text: template.text,
        ...(replyTo && { replyTo }),
        ...(cc && { cc }),
        ...(bcc && { bcc }),
        ...(attachments && { attachments }),
        headers: {
          'X-Priority': this.getPriorityHeader(priority),
          'X-Email-Type': type,
          'X-Mailer': 'Troy BBQ Email Service'
        }
      };

      const result = await this.resend.emails.send(emailOptions);

      return {
        success: true,
        messageId: result.data?.id,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Send bulk emails with rate limiting
   */
  async sendBulkEmails(emails: EmailData[], delayMs: number = 100): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
      
      // Rate limiting delay
      if (delayMs > 0 && results.length < emails.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }

  /**
   * Verify domain settings and configuration
   */
  async verifyDomainConfiguration(): Promise<{
    domain: string;
    dkim: boolean;
    spf: boolean;
    dmarc: boolean;
    status: 'verified' | 'pending' | 'failed';
  }> {
    try {
      // This would typically call Resend's domain verification API
      // For now, return a mock response
      return {
        domain: this.domain,
        dkim: true,
        spf: true,
        dmarc: true,
        status: 'verified'
      };
    } catch (error) {
      console.error('Domain verification failed:', error);
      return {
        domain: this.domain,
        dkim: false,
        spf: false,
        dmarc: false,
        status: 'failed'
      };
    }
  }

  /**
   * Get email template based on type
   */
  private async getEmailTemplate(type: EmailType, data: Record<string, any>): Promise<{
    html: string;
    text: string;
  }> {
    // Dynamic import of template modules
    switch (type) {
      case EmailType.QUOTE_CONFIRMATION:
        const { QuoteConfirmationTemplate } = await import('../../templates/email/quote-confirmation');
        return QuoteConfirmationTemplate(data);
      
      case EmailType.QUOTE_APPROVED:
        const { QuoteApprovedTemplate } = await import('../../templates/email/quote-approved');
        return QuoteApprovedTemplate(data);
      
      case EmailType.PAYMENT_CONFIRMATION:
        const { PaymentConfirmationTemplate } = await import('../../templates/email/payment-confirmation');
        return PaymentConfirmationTemplate(data);
      
      case EmailType.PAYMENT_RECEIPT:
        const { PaymentReceiptTemplate } = await import('../../templates/email/payment-receipt');
        return PaymentReceiptTemplate(data);
      
      case EmailType.ORDER_STATUS_UPDATE:
        const { OrderStatusUpdateTemplate } = await import('../../templates/email/order-status-update');
        return OrderStatusUpdateTemplate(data);
      
      case EmailType.EVENT_REMINDER_24H:
        const { EventReminder24hTemplate } = await import('../../templates/email/event-reminder-24h');
        return EventReminder24hTemplate(data);
      
      case EmailType.EVENT_REMINDER_2H:
        const { EventReminder2hTemplate } = await import('../../templates/email/event-reminder-2h');
        return EventReminder2hTemplate(data);
      
      case EmailType.ADMIN_NEW_QUOTE:
        const { AdminNewQuoteTemplate } = await import('../../templates/email/admin-new-quote');
        return AdminNewQuoteTemplate(data);
      
      case EmailType.ADMIN_PAYMENT_RECEIVED:
        const { AdminPaymentReceivedTemplate } = await import('../../templates/email/admin-payment-received');
        return AdminPaymentReceivedTemplate(data);
      
      case EmailType.WELCOME:
        const { WelcomeTemplate } = await import('../../templates/email/welcome');
        return WelcomeTemplate(data);
      
      case EmailType.NEWSLETTER:
        const { NewsletterTemplate } = await import('../../templates/email/newsletter');
        return NewsletterTemplate(data);
      
      default:
        throw new Error(`Unknown email template type: ${type}`);
    }
  }

  /**
   * Convert priority to email header value
   */
  private getPriorityHeader(priority: EmailPriority): string {
    switch (priority) {
      case EmailPriority.URGENT:
        return '1';
      case EmailPriority.HIGH:
        return '2';
      case EmailPriority.NORMAL:
        return '3';
      case EmailPriority.LOW:
        return '4';
      default:
        return '3';
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();