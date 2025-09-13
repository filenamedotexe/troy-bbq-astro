import { Pool } from 'pg';

// Database connection (reusing existing pattern)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Email preference categories
export enum EmailPreferenceCategory {
  QUOTES = 'quotes',
  PAYMENTS = 'payments',
  ORDER_UPDATES = 'order_updates',
  EVENT_REMINDERS = 'event_reminders',
  MARKETING = 'marketing',
  NEWSLETTERS = 'newsletters'
}

// Email preferences data structure
export interface EmailPreferences {
  email: string;
  quotes: boolean;
  payments: boolean;
  order_updates: boolean;
  event_reminders: boolean;
  marketing: boolean;
  newsletters: boolean;
  unsubscribed_all: boolean;
  created_at: Date;
  updated_at: Date;
  unsubscribe_token: string;
}

// Email preference service
export class EmailPreferencesService {
  /**
   * Initialize email preferences table if not exists
   */
  async initializeTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS email_preferences (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        quotes BOOLEAN DEFAULT true,
        payments BOOLEAN DEFAULT true,
        order_updates BOOLEAN DEFAULT true,
        event_reminders BOOLEAN DEFAULT true,
        marketing BOOLEAN DEFAULT false,
        newsletters BOOLEAN DEFAULT false,
        unsubscribed_all BOOLEAN DEFAULT false,
        unsubscribe_token VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_email_preferences_email ON email_preferences(email);
      CREATE INDEX IF NOT EXISTS idx_email_preferences_token ON email_preferences(unsubscribe_token);
      
      -- Add trigger for updated_at
      DROP TRIGGER IF EXISTS update_email_preferences_updated_at ON email_preferences;
      CREATE TRIGGER update_email_preferences_updated_at
        BEFORE UPDATE ON email_preferences
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;
    
    try {
      await pool.query(createTableQuery);
    } catch (error) {
      console.error('Failed to initialize email preferences table:', error);
      throw error;
    }
  }

  /**
   * Generate a unique unsubscribe token
   */
  private generateUnsubscribeToken(): string {
    return crypto.randomUUID();
  }

  /**
   * Get email preferences for a user
   */
  async getPreferences(email: string): Promise<EmailPreferences | null> {
    try {
      const query = 'SELECT * FROM email_preferences WHERE email = $1';
      const result = await pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0] as EmailPreferences;
    } catch (error) {
      console.error('Failed to get email preferences:', error);
      throw error;
    }
  }

  /**
   * Create or update email preferences for a user
   */
  async setPreferences(email: string, preferences: Partial<EmailPreferences>): Promise<EmailPreferences> {
    try {
      const existingPrefs = await this.getPreferences(email);
      
      if (existingPrefs) {
        // Update existing preferences
        const updateFields = Object.keys(preferences)
          .filter(key => key !== 'email' && key !== 'created_at' && key !== 'unsubscribe_token')
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');
        
        const updateValues = Object.keys(preferences)
          .filter(key => key !== 'email' && key !== 'created_at' && key !== 'unsubscribe_token')
          .map(key => preferences[key as keyof EmailPreferences]);
        
        const query = `
          UPDATE email_preferences 
          SET ${updateFields}
          WHERE email = $1 
          RETURNING *
        `;
        
        const result = await pool.query(query, [email, ...updateValues]);
        return result.rows[0] as EmailPreferences;
      } else {
        // Create new preferences
        const defaultPrefs = {
          email,
          quotes: true,
          payments: true,
          order_updates: true,
          event_reminders: true,
          marketing: false,
          newsletters: false,
          unsubscribed_all: false,
          unsubscribe_token: this.generateUnsubscribeToken(),
          ...preferences
        };
        
        const query = `
          INSERT INTO email_preferences (
            email, quotes, payments, order_updates, event_reminders, 
            marketing, newsletters, unsubscribed_all, unsubscribe_token
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;
        
        const values = [
          defaultPrefs.email,
          defaultPrefs.quotes,
          defaultPrefs.payments,
          defaultPrefs.order_updates,
          defaultPrefs.event_reminders,
          defaultPrefs.marketing,
          defaultPrefs.newsletters,
          defaultPrefs.unsubscribed_all,
          defaultPrefs.unsubscribe_token
        ];
        
        const result = await pool.query(query, values);
        return result.rows[0] as EmailPreferences;
      }
    } catch (error) {
      console.error('Failed to set email preferences:', error);
      throw error;
    }
  }

  /**
   * Check if user can receive specific email type
   */
  async canReceiveEmail(email: string, category: EmailPreferenceCategory): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(email);
      
      if (!preferences) {
        // Default to allowing essential emails only
        return ['quotes', 'payments', 'order_updates'].includes(category);
      }
      
      // If unsubscribed from all, only allow critical transactional emails
      if (preferences.unsubscribed_all) {
        return ['quotes', 'payments', 'order_updates'].includes(category);
      }
      
      // Check specific category preference
      return preferences[category] === true;
    } catch (error) {
      console.error('Failed to check email permission:', error);
      // Default to not sending if there's an error
      return false;
    }
  }

  /**
   * Unsubscribe user from specific category
   */
  async unsubscribeFromCategory(email: string, category: EmailPreferenceCategory): Promise<void> {
    try {
      await this.setPreferences(email, {
        [category]: false
      });
    } catch (error) {
      console.error('Failed to unsubscribe from category:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe user from all emails using token
   */
  async unsubscribeAll(token: string): Promise<boolean> {
    try {
      const query = `
        UPDATE email_preferences 
        SET unsubscribed_all = true
        WHERE unsubscribe_token = $1
        RETURNING email
      `;
      
      const result = await pool.query(query, [token]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Failed to unsubscribe all:', error);
      throw error;
    }
  }

  /**
   * Get user by unsubscribe token
   */
  async getUserByToken(token: string): Promise<EmailPreferences | null> {
    try {
      const query = 'SELECT * FROM email_preferences WHERE unsubscribe_token = $1';
      const result = await pool.query(query, [token]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0] as EmailPreferences;
    } catch (error) {
      console.error('Failed to get user by token:', error);
      throw error;
    }
  }

  /**
   * Generate unsubscribe URL
   */
  getUnsubscribeUrl(token: string, domain?: string): string {
    const baseUrl = domain || process.env.DOMAIN || 'troybbq.com';
    return `https://${baseUrl}/unsubscribe?token=${token}`;
  }

  /**
   * Generate preference management URL
   */
  getPreferencesUrl(token: string, domain?: string): string {
    const baseUrl = domain || process.env.DOMAIN || 'troybbq.com';
    return `https://${baseUrl}/email-preferences?token=${token}`;
  }

  /**
   * Ensure user has preferences record (create with defaults if needed)
   */
  async ensurePreferences(email: string): Promise<EmailPreferences> {
    try {
      let preferences = await this.getPreferences(email);
      
      if (!preferences) {
        preferences = await this.setPreferences(email, {});
      }
      
      return preferences;
    } catch (error) {
      console.error('Failed to ensure preferences:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const emailPreferencesService = new EmailPreferencesService();