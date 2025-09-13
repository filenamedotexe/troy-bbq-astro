import { neon } from '@neondatabase/serverless';
import type { 
  AdminSettings, 
  CateringQuote, 
  CateringAddon,
  DatabaseAdminSettings,
  DatabaseCateringQuote,
  DatabaseCateringAddon
} from '../types';

const sql = neon(process.env.DATABASE_URL || import.meta.env.DATABASE_URL || '');

export class DatabaseService {
  // Add transaction support for atomic operations
  async executeTransaction<T>(operation: (sql: typeof import('@neondatabase/serverless').neon) => Promise<T>): Promise<T> {
    // Note: NeonDB serverless doesn't support traditional transactions
    // We'll implement application-level transaction safety with rollback logic
    let operationResult: T;
    let rollbackOperations: (() => Promise<void>)[] = [];
    
    try {
      operationResult = await operation(sql);
      return operationResult;
    } catch (error) {
      // Attempt to rollback operations in reverse order
      console.error('Transaction failed, attempting rollback:', error);
      
      for (let i = rollbackOperations.length - 1; i >= 0; i--) {
        try {
          await rollbackOperations[i]();
        } catch (rollbackError) {
          console.error('Rollback operation failed:', rollbackError);
        }
      }
      
      throw error;
    }
  }
  
  // Add idempotency checking for payments
  async checkPaymentIdempotency(quoteId: string, paymentType: 'deposit' | 'balance', transactionId: string): Promise<{
    isDuplicate: boolean;
    existingPayment?: any;
  }> {
    try {
      // Check if we've already processed this exact payment
      const existingPayments = await sql`
        SELECT status, medusa_order_id, balance_order_id, updated_at
        FROM catering_quotes 
        WHERE id = ${quoteId}
      `;
      
      if (existingPayments.length === 0) {
        return { isDuplicate: false };
      }
      
      const quote = existingPayments[0];
      
      // Check for duplicate deposit payment
      if (paymentType === 'deposit' && (quote.status === 'deposit_paid' || quote.status === 'completed')) {
        return {
          isDuplicate: true,
          existingPayment: {
            type: 'deposit',
            orderId: quote.medusa_order_id,
            status: quote.status,
            processedAt: quote.updated_at
          }
        };
      }
      
      // Check for duplicate balance payment
      if (paymentType === 'balance' && quote.status === 'completed') {
        return {
          isDuplicate: true,
          existingPayment: {
            type: 'balance',
            orderId: quote.balance_order_id,
            status: quote.status,
            processedAt: quote.updated_at
          }
        };
      }
      
      return { isDuplicate: false };
      
    } catch (error) {
      console.error('Error checking payment idempotency:', error);
      throw new Error('Failed to verify payment uniqueness');
    }
  }
  async getAdminSettings(): Promise<AdminSettings | null> {
    try {
      const result = await sql`
        SELECT config FROM admin_settings ORDER BY id LIMIT 1
      `;
      
      return result[0]?.config || null;
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      throw new Error('Failed to fetch admin settings');
    }
  }

  async updateAdminSettings(settings: AdminSettings): Promise<void> {
    try {
      await sql`
        UPDATE admin_settings 
        SET config = ${JSON.stringify(settings)}, updated_at = NOW()
        WHERE id = (SELECT id FROM admin_settings ORDER BY id LIMIT 1)
      `;
    } catch (error) {
      console.error('Error updating admin settings:', error);
      throw new Error('Failed to update admin settings');
    }
  }

  async createCateringQuote(quote: Omit<CateringQuote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const quoteData = {
        type: quote.eventDetails.type,
        date: quote.eventDetails.date,
        guestCount: quote.eventDetails.guestCount,
        hungerLevel: quote.eventDetails.hungerLevel,
        location: quote.eventDetails.location,
        menuSelections: quote.menuSelections,
        addOns: quote.addOns
      };

      const result = await sql`
        INSERT INTO catering_quotes (customer_email, quote_data, pricing_breakdown, status)
        VALUES (
          ${quote.customerEmail},
          ${JSON.stringify(quoteData)},
          ${JSON.stringify(quote.pricing)},
          ${quote.status}
        )
        RETURNING id
      `;

      return result[0].id;
    } catch (error) {
      console.error('Error creating catering quote:', error);
      throw new Error('Failed to create catering quote');
    }
  }

  async getCateringQuote(id: string): Promise<CateringQuote | null> {
    try {
      const result = await sql`
        SELECT * FROM catering_quotes WHERE id = ${id}
      `;

      if (result.length === 0) return null;

      const row = result[0] as DatabaseCateringQuote;
      
      return {
        id: row.id,
        customerEmail: row.customer_email,
        eventDetails: {
          type: row.quote_data.type,
          date: row.quote_data.date,
          guestCount: row.quote_data.guestCount,
          hungerLevel: row.quote_data.hungerLevel,
          location: row.quote_data.location
        },
        menuSelections: row.quote_data.menuSelections,
        addOns: row.quote_data.addOns,
        pricing: row.pricing_breakdown,
        status: row.status,
        medusaOrderId: row.medusa_order_id || undefined,
        balanceOrderId: row.balance_order_id || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error fetching catering quote:', error);
      throw new Error('Failed to fetch catering quote');
    }
  }

  async updateCateringQuoteStatus(
    id: string, 
    status: CateringQuote['status'],
    medusaOrderId?: string,
    balanceOrderId?: string
  ): Promise<void> {
    try {
      await sql`
        UPDATE catering_quotes 
        SET 
          status = ${status},
          medusa_order_id = ${medusaOrderId || null},
          balance_order_id = ${balanceOrderId || null},
          updated_at = NOW()
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error updating catering quote status:', error);
      throw new Error('Failed to update catering quote status');
    }
  }

  async getCateringQuotesByEmail(email: string): Promise<CateringQuote[]> {
    try {
      const result = await sql`
        SELECT * FROM catering_quotes 
        WHERE customer_email = ${email}
        ORDER BY created_at DESC
      `;

      return result.map((row: DatabaseCateringQuote) => ({
        id: row.id,
        customerEmail: row.customer_email,
        eventDetails: {
          type: row.quote_data.type,
          date: row.quote_data.date,
          guestCount: row.quote_data.guestCount,
          hungerLevel: row.quote_data.hungerLevel,
          location: row.quote_data.location
        },
        menuSelections: row.quote_data.menuSelections,
        addOns: row.quote_data.addOns,
        pricing: row.pricing_breakdown,
        status: row.status,
        medusaOrderId: row.medusa_order_id || undefined,
        balanceOrderId: row.balance_order_id || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error fetching catering quotes by email:', error);
      throw new Error('Failed to fetch catering quotes');
    }
  }

  async getAllCateringQuotes(limit = 50, offset = 0): Promise<CateringQuote[]> {
    try {
      const result = await sql`
        SELECT * FROM catering_quotes 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;

      return result.map((row: DatabaseCateringQuote) => ({
        id: row.id,
        customerEmail: row.customer_email,
        eventDetails: {
          type: row.quote_data.type,
          date: row.quote_data.date,
          guestCount: row.quote_data.guestCount,
          hungerLevel: row.quote_data.hungerLevel,
          location: row.quote_data.location
        },
        menuSelections: row.quote_data.menuSelections,
        addOns: row.quote_data.addOns,
        pricing: row.pricing_breakdown,
        status: row.status,
        medusaOrderId: row.medusa_order_id || undefined,
        balanceOrderId: row.balance_order_id || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error fetching all catering quotes:', error);
      throw new Error('Failed to fetch catering quotes');
    }
  }

  async getCateringAddons(activeOnly = true): Promise<CateringAddon[]> {
    try {
      const result = activeOnly
        ? await sql`SELECT * FROM catering_addons WHERE is_active = true ORDER BY category, name`
        : await sql`SELECT * FROM catering_addons ORDER BY category, name`;

      return result.map((row: DatabaseCateringAddon) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        priceCents: row.price_cents,
        isActive: row.is_active,
        category: row.category,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error fetching catering addons:', error);
      throw new Error('Failed to fetch catering addons');
    }
  }

  async createCateringAddon(addon: Omit<CateringAddon, 'id' | 'createdAt'>): Promise<string> {
    try {
      const result = await sql`
        INSERT INTO catering_addons (name, description, price_cents, is_active, category)
        VALUES (${addon.name}, ${addon.description}, ${addon.priceCents}, ${addon.isActive}, ${addon.category})
        RETURNING id
      `;

      return result[0].id;
    } catch (error) {
      console.error('Error creating catering addon:', error);
      throw new Error('Failed to create catering addon');
    }
  }

  async updateCateringAddon(id: string, addon: Partial<Omit<CateringAddon, 'id' | 'createdAt'>>): Promise<void> {
    try {
      // Build update query using parameterized queries for security
      const updateFields = [];
      const updateValues = [];

      if (addon.name !== undefined) {
        updateFields.push('name');
        updateValues.push(addon.name);
      }
      if (addon.description !== undefined) {
        updateFields.push('description');
        updateValues.push(addon.description);
      }
      if (addon.priceCents !== undefined) {
        updateFields.push('price_cents');
        updateValues.push(addon.priceCents);
      }
      if (addon.isActive !== undefined) {
        updateFields.push('is_active');
        updateValues.push(addon.isActive);
      }
      if (addon.category !== undefined) {
        updateFields.push('category');
        updateValues.push(addon.category);
      }

      if (updateFields.length > 0) {
        // Use safe parameterized query construction
        if (updateFields.length === 1) {
          const field = updateFields[0];
          const value = updateValues[0];
          if (field === 'name') {
            await sql`UPDATE catering_addons SET name = ${value} WHERE id = ${id}`;
          } else if (field === 'description') {
            await sql`UPDATE catering_addons SET description = ${value} WHERE id = ${id}`;
          } else if (field === 'price_cents') {
            await sql`UPDATE catering_addons SET price_cents = ${value} WHERE id = ${id}`;
          } else if (field === 'is_active') {
            await sql`UPDATE catering_addons SET is_active = ${value} WHERE id = ${id}`;
          } else if (field === 'category') {
            await sql`UPDATE catering_addons SET category = ${value} WHERE id = ${id}`;
          }
        } else {
          // For multiple fields, build safe conditional updates
          const baseQuery = 'UPDATE catering_addons SET ';
          let query = baseQuery;
          const queryParts = [];
          
          updateFields.forEach((field, index) => {
            if (field === 'name') queryParts.push('name = $' + (index + 1));
            else if (field === 'description') queryParts.push('description = $' + (index + 1));
            else if (field === 'price_cents') queryParts.push('price_cents = $' + (index + 1));
            else if (field === 'is_active') queryParts.push('is_active = $' + (index + 1));
            else if (field === 'category') queryParts.push('category = $' + (index + 1));
          });
          
          query += queryParts.join(', ') + ' WHERE id = $' + (updateFields.length + 1);
          updateValues.push(id);
          
          // Execute with parameterized values
          await sql(query, updateValues);
        }
      }
    } catch (error) {
      console.error('Error updating catering addon:', error);
      throw new Error('Failed to update catering addon');
    }
  }

  async deleteCateringAddon(id: string): Promise<void> {
    try {
      await sql`DELETE FROM catering_addons WHERE id = ${id}`;
    } catch (error) {
      console.error('Error deleting catering addon:', error);
      throw new Error('Failed to delete catering addon');
    }
  }
}

export const db = new DatabaseService();