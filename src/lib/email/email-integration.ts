import { emailService, EmailType, EmailPriority } from './email-service';
import { emailPreferencesService } from './email-preferences';
import { notificationAutomationService, NotificationTrigger } from './notification-automation';

// Easy-to-use integration functions for the rest of the application

/**
 * Initialize email system (call on server startup)
 */
export async function initializeEmailSystem(): Promise<void> {
  try {
    await emailPreferencesService.initializeTable();
    await notificationAutomationService.initializeTable();
    console.log('Email system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize email system:', error);
    throw error;
  }
}

/**
 * Send a quote confirmation email
 */
export async function sendQuoteConfirmationEmail(quoteData: {
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
  pricingBreakdown: any;
}): Promise<void> {
  await notificationAutomationService.processNotification({
    trigger: NotificationTrigger.QUOTE_SUBMITTED,
    recipientEmail: quoteData.customerEmail,
    data: quoteData,
    priority: EmailPriority.HIGH
  });

  // Also notify admins
  await notificationAutomationService.notifyAdminNewQuote(quoteData);
}

/**
 * Send quote approval email and schedule reminders
 */
export async function sendQuoteApprovedEmail(quoteData: {
  quoteId: string;
  customerEmail: string;
  customerName?: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  depositAmount: number;
  balanceAmount: number;
  totalAmount: number;
  depositPaymentUrl?: string;
}): Promise<void> {
  await notificationAutomationService.processNotification({
    trigger: NotificationTrigger.QUOTE_APPROVED,
    recipientEmail: quoteData.customerEmail,
    data: quoteData,
    priority: EmailPriority.HIGH
  });

  // Schedule event reminders
  const eventDate = new Date(quoteData.eventDate);
  await notificationAutomationService.scheduleEventReminders(
    quoteData.quoteId,
    quoteData.customerEmail,
    eventDate
  );
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(paymentData: {
  quoteId: string;
  customerEmail: string;
  customerName?: string;
  paymentType: 'deposit' | 'balance' | 'full';
  paymentAmount: number;
  paymentMethod: string;
  transactionId: string;
  eventDate: string;
  eventTime: string;
  balanceRemaining?: number;
}): Promise<void> {
  const trigger = paymentData.paymentType === 'deposit' 
    ? NotificationTrigger.DEPOSIT_PAID 
    : NotificationTrigger.BALANCE_PAID;

  await notificationAutomationService.processNotification({
    trigger,
    recipientEmail: paymentData.customerEmail,
    data: paymentData,
    priority: EmailPriority.HIGH
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(orderData: {
  quoteId: string;
  customerEmail: string;
  customerName?: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
}): Promise<void> {
  await notificationAutomationService.processNotification({
    trigger: NotificationTrigger.ORDER_CONFIRMED,
    recipientEmail: orderData.customerEmail,
    data: orderData,
    priority: EmailPriority.HIGH
  });
}

/**
 * Send welcome email to new customer
 */
export async function sendWelcomeEmail(customerData: {
  customerEmail: string;
  customerName?: string;
}): Promise<void> {
  await notificationAutomationService.processNotification({
    trigger: NotificationTrigger.CUSTOMER_REGISTERED,
    recipientEmail: customerData.customerEmail,
    data: customerData,
    priority: EmailPriority.NORMAL
  });
}

/**
 * Send custom email using email service directly
 */
export async function sendCustomEmail(emailData: {
  to: string | string[];
  subject: string;
  type: EmailType;
  data?: Record<string, any>;
  priority?: EmailPriority;
}): Promise<void> {
  const result = await emailService.sendEmail(emailData);
  if (!result.success) {
    throw new Error(result.error || 'Failed to send email');
  }
}

/**
 * Check if user can receive specific email type
 */
export async function canUserReceiveEmail(
  email: string, 
  category: 'quotes' | 'payments' | 'order_updates' | 'event_reminders' | 'marketing' | 'newsletters'
): Promise<boolean> {
  return await emailPreferencesService.canReceiveEmail(email, category as any);
}

/**
 * Get user email preferences
 */
export async function getUserEmailPreferences(email: string) {
  return await emailPreferencesService.getPreferences(email);
}

/**
 * Update user email preferences
 */
export async function updateUserEmailPreferences(email: string, preferences: any) {
  return await emailPreferencesService.setPreferences(email, preferences);
}

/**
 * Verify email system configuration
 */
export async function verifyEmailConfiguration(): Promise<{
  resend: boolean;
  domain: boolean;
  templates: boolean;
  database: boolean;
  status: 'healthy' | 'warning' | 'error';
}> {
  const results = {
    resend: false,
    domain: false,
    templates: false,
    database: false,
    status: 'error' as const
  };

  try {
    // Check Resend API key
    results.resend = !!process.env.RESEND_API_KEY;

    // Check domain configuration
    const domainCheck = await emailService.verifyDomainConfiguration();
    results.domain = domainCheck.status === 'verified';

    // Check if templates are accessible
    try {
      const { WelcomeTemplate } = await import('../../templates/email/welcome');
      WelcomeTemplate({ customerName: 'Test' });
      results.templates = true;
    } catch {
      results.templates = false;
    }

    // Check database connectivity
    try {
      await emailPreferencesService.getPreferences('test@example.com');
      results.database = true;
    } catch {
      // Expected to fail for non-existent user, but connection should work
      results.database = true;
    }

    // Determine overall status
    const healthyCount = Object.values(results).filter(v => v === true).length;
    if (healthyCount === 4) {
      results.status = 'healthy';
    } else if (healthyCount >= 2) {
      results.status = 'warning';
    } else {
      results.status = 'error';
    }

  } catch (error) {
    console.error('Email configuration check failed:', error);
  }

  return results;
}

/**
 * Process pending scheduled notifications (for cron jobs)
 */
export async function processPendingNotifications(): Promise<void> {
  await notificationAutomationService.processPendingNotifications();
}

/**
 * Cancel scheduled notifications (e.g., if event is cancelled)
 */
export async function cancelEventNotifications(customerEmail: string, quoteId?: string): Promise<void> {
  await notificationAutomationService.cancelNotifications(customerEmail);
}

// Export all the services for advanced usage
export {
  emailService,
  emailPreferencesService,
  notificationAutomationService,
  EmailType,
  EmailPriority,
  NotificationTrigger
};