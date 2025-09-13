import { emailService, EmailType, EmailPriority } from './email-service';
import { emailPreferencesService, EmailPreferenceCategory } from './email-preferences';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Notification triggers and events
export enum NotificationTrigger {
  QUOTE_SUBMITTED = 'quote_submitted',
  QUOTE_APPROVED = 'quote_approved',
  DEPOSIT_PAID = 'deposit_paid',
  BALANCE_PAID = 'balance_paid',
  ORDER_CONFIRMED = 'order_confirmed',
  EVENT_APPROACHING = 'event_approaching',
  EVENT_IMMINENT = 'event_imminent',
  ORDER_COMPLETED = 'order_completed',
  CUSTOMER_REGISTERED = 'customer_registered'
}

// Notification data structures
export interface NotificationEvent {
  trigger: NotificationTrigger;
  recipientEmail: string;
  data: Record<string, any>;
  priority?: EmailPriority;
  scheduleFor?: Date;
}

export interface ScheduledNotification {
  id: string;
  trigger: NotificationTrigger;
  recipient_email: string;
  data: Record<string, any>;
  scheduled_for: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  created_at: Date;
  sent_at?: Date;
  error_message?: string;
}

// Restaurant-specific automation service
export class NotificationAutomationService {
  /**
   * Initialize scheduled notifications table
   */
  async initializeTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS scheduled_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trigger VARCHAR(50) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        sent_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
      CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_trigger ON scheduled_notifications(trigger);
    `;
    
    try {
      await pool.query(createTableQuery);
    } catch (error) {
      console.error('Failed to initialize scheduled notifications table:', error);
      throw error;
    }
  }

  /**
   * Process a notification event immediately or schedule it
   */
  async processNotification(event: NotificationEvent): Promise<void> {
    try {
      if (event.scheduleFor && event.scheduleFor > new Date()) {
        // Schedule for later
        await this.scheduleNotification(event);
      } else {
        // Send immediately
        await this.sendNotificationNow(event);
      }
    } catch (error) {
      console.error('Failed to process notification:', error);
      throw error;
    }
  }

  /**
   * Send notification immediately
   */
  private async sendNotificationNow(event: NotificationEvent): Promise<void> {
    const { trigger, recipientEmail, data, priority = EmailPriority.NORMAL } = event;
    
    // Determine email type and preference category
    const { emailType, preferenceCategory } = this.mapTriggerToEmailType(trigger);
    
    // Check if user can receive this type of email
    const canReceive = await emailPreferencesService.canReceiveEmail(recipientEmail, preferenceCategory);
    if (!canReceive) {
      console.log(`Skipping notification for ${recipientEmail}: preference disabled for ${preferenceCategory}`);
      return;
    }

    // Ensure user has preferences (creates with defaults if needed)
    const preferences = await emailPreferencesService.ensurePreferences(recipientEmail);
    
    // Add unsubscribe links to email data
    const enrichedData = {
      ...data,
      unsubscribeUrl: emailPreferencesService.getUnsubscribeUrl(preferences.unsubscribe_token),
      preferencesUrl: emailPreferencesService.getPreferencesUrl(preferences.unsubscribe_token)
    };

    // Send the email
    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: this.getSubjectForTrigger(trigger, enrichedData),
      type: emailType,
      priority,
      data: enrichedData
    });

    if (!result.success) {
      console.error(`Failed to send ${trigger} notification to ${recipientEmail}:`, result.error);
      throw new Error(result.error);
    }
  }

  /**
   * Schedule a notification for later delivery
   */
  private async scheduleNotification(event: NotificationEvent): Promise<void> {
    const query = `
      INSERT INTO scheduled_notifications (trigger, recipient_email, data, scheduled_for)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    
    const values = [
      event.trigger,
      event.recipientEmail,
      JSON.stringify(event.data),
      event.scheduleFor
    ];
    
    try {
      const result = await pool.query(query, values);
      console.log(`Scheduled notification ${result.rows[0].id} for ${event.scheduleFor}`);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Process pending scheduled notifications
   */
  async processPendingNotifications(): Promise<void> {
    const query = `
      SELECT * FROM scheduled_notifications 
      WHERE status = 'pending' AND scheduled_for <= NOW()
      ORDER BY scheduled_for ASC
      LIMIT 50
    `;
    
    try {
      const result = await pool.query(query);
      
      for (const notification of result.rows) {
        try {
          await this.sendScheduledNotification(notification);
        } catch (error) {
          await this.markNotificationFailed(notification.id, error.message);
        }
      }
    } catch (error) {
      console.error('Failed to process pending notifications:', error);
      throw error;
    }
  }

  /**
   * Send a scheduled notification
   */
  private async sendScheduledNotification(notification: ScheduledNotification): Promise<void> {
    const event: NotificationEvent = {
      trigger: notification.trigger,
      recipientEmail: notification.recipient_email,
      data: notification.data
    };
    
    await this.sendNotificationNow(event);
    await this.markNotificationSent(notification.id);
  }

  /**
   * Mark notification as sent
   */
  private async markNotificationSent(notificationId: string): Promise<void> {
    const query = `
      UPDATE scheduled_notifications 
      SET status = 'sent', sent_at = NOW()
      WHERE id = $1
    `;
    
    await pool.query(query, [notificationId]);
  }

  /**
   * Mark notification as failed
   */
  private async markNotificationFailed(notificationId: string, errorMessage: string): Promise<void> {
    const query = `
      UPDATE scheduled_notifications 
      SET status = 'failed', error_message = $2
      WHERE id = $1
    `;
    
    await pool.query(query, [notificationId, errorMessage]);
  }

  /**
   * Map notification trigger to email type and preference category
   */
  private mapTriggerToEmailType(trigger: NotificationTrigger): {
    emailType: EmailType;
    preferenceCategory: EmailPreferenceCategory;
  } {
    switch (trigger) {
      case NotificationTrigger.QUOTE_SUBMITTED:
        return { emailType: EmailType.QUOTE_CONFIRMATION, preferenceCategory: EmailPreferenceCategory.QUOTES };
      
      case NotificationTrigger.QUOTE_APPROVED:
        return { emailType: EmailType.QUOTE_APPROVED, preferenceCategory: EmailPreferenceCategory.QUOTES };
      
      case NotificationTrigger.DEPOSIT_PAID:
      case NotificationTrigger.BALANCE_PAID:
        return { emailType: EmailType.PAYMENT_CONFIRMATION, preferenceCategory: EmailPreferenceCategory.PAYMENTS };
      
      case NotificationTrigger.ORDER_CONFIRMED:
      case NotificationTrigger.ORDER_COMPLETED:
        return { emailType: EmailType.ORDER_STATUS_UPDATE, preferenceCategory: EmailPreferenceCategory.ORDER_UPDATES };
      
      case NotificationTrigger.EVENT_APPROACHING:
        return { emailType: EmailType.EVENT_REMINDER_24H, preferenceCategory: EmailPreferenceCategory.EVENT_REMINDERS };
      
      case NotificationTrigger.EVENT_IMMINENT:
        return { emailType: EmailType.EVENT_REMINDER_2H, preferenceCategory: EmailPreferenceCategory.EVENT_REMINDERS };
      
      case NotificationTrigger.CUSTOMER_REGISTERED:
        return { emailType: EmailType.WELCOME, preferenceCategory: EmailPreferenceCategory.MARKETING };
      
      default:
        throw new Error(`Unknown notification trigger: ${trigger}`);
    }
  }

  /**
   * Generate email subject based on trigger and data
   */
  private getSubjectForTrigger(trigger: NotificationTrigger, data: Record<string, any>): string {
    const eventDate = data.eventDate ? new Date(data.eventDate).toLocaleDateString() : '';
    
    switch (trigger) {
      case NotificationTrigger.QUOTE_SUBMITTED:
        return `Troy BBQ - Catering Quote Confirmation #${data.quoteId || 'NEW'}`;
      
      case NotificationTrigger.QUOTE_APPROVED:
        return `Troy BBQ - Your Catering Quote is Approved! (${eventDate})`;
      
      case NotificationTrigger.DEPOSIT_PAID:
        return `Troy BBQ - Deposit Payment Confirmed (${eventDate})`;
      
      case NotificationTrigger.BALANCE_PAID:
        return `Troy BBQ - Final Payment Received - You're All Set! (${eventDate})`;
      
      case NotificationTrigger.ORDER_CONFIRMED:
        return `Troy BBQ - Catering Order Confirmed for ${eventDate}`;
      
      case NotificationTrigger.EVENT_APPROACHING:
        return `Troy BBQ - Your Event is Tomorrow! (${eventDate})`;
      
      case NotificationTrigger.EVENT_IMMINENT:
        return `Troy BBQ - Your Catering Event Starts in 2 Hours!`;
      
      case NotificationTrigger.ORDER_COMPLETED:
        return `Troy BBQ - Thank You for Choosing Us! Event Complete`;
      
      case NotificationTrigger.CUSTOMER_REGISTERED:
        return `Welcome to Troy BBQ - Your Catering Partner`;
      
      default:
        return `Troy BBQ - Notification`;
    }
  }

  /**
   * Schedule event reminder notifications for a catering order
   */
  async scheduleEventReminders(quoteId: string, customerEmail: string, eventDateTime: Date): Promise<void> {
    const now = new Date();
    
    // 24-hour reminder
    const reminder24h = new Date(eventDateTime.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > now) {
      await this.processNotification({
        trigger: NotificationTrigger.EVENT_APPROACHING,
        recipientEmail: customerEmail,
        data: { quoteId, eventDate: eventDateTime.toISOString() },
        scheduleFor: reminder24h
      });
    }
    
    // 2-hour reminder
    const reminder2h = new Date(eventDateTime.getTime() - 2 * 60 * 60 * 1000);
    if (reminder2h > now) {
      await this.processNotification({
        trigger: NotificationTrigger.EVENT_IMMINENT,
        recipientEmail: customerEmail,
        data: { quoteId, eventDate: eventDateTime.toISOString() },
        scheduleFor: reminder2h
      });
    }
  }

  /**
   * Send admin notification for new quote
   */
  async notifyAdminNewQuote(quoteData: any): Promise<void> {
    const adminEmails = await this.getAdminEmails();
    
    for (const adminEmail of adminEmails) {
      await this.processNotification({
        trigger: NotificationTrigger.QUOTE_SUBMITTED,
        recipientEmail: adminEmail,
        data: { ...quoteData, isAdminNotification: true },
        priority: EmailPriority.HIGH
      });
    }
  }

  /**
   * Get admin email addresses from configuration
   */
  private async getAdminEmails(): Promise<string[]> {
    // This could be stored in admin_settings or environment variables
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@troybbq.com'];
    return adminEmails.map(email => email.trim());
  }

  /**
   * Cancel scheduled notifications (e.g., if event is cancelled)
   */
  async cancelNotifications(recipientEmail: string, trigger?: NotificationTrigger): Promise<void> {
    let query = `
      UPDATE scheduled_notifications 
      SET status = 'cancelled'
      WHERE recipient_email = $1 AND status = 'pending'
    `;
    const values = [recipientEmail];
    
    if (trigger) {
      query += ' AND trigger = $2';
      values.push(trigger);
    }
    
    await pool.query(query, values);
  }
}

// Export singleton instance
export const notificationAutomationService = new NotificationAutomationService();