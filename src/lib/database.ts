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
      const updates = [];
      const values = [];
      
      if (addon.name !== undefined) {
        updates.push(`name = $${values.length + 1}`);
        values.push(addon.name);
      }
      if (addon.description !== undefined) {
        updates.push(`description = $${values.length + 1}`);
        values.push(addon.description);
      }
      if (addon.priceCents !== undefined) {
        updates.push(`price_cents = $${values.length + 1}`);
        values.push(addon.priceCents);
      }
      if (addon.isActive !== undefined) {
        updates.push(`is_active = $${values.length + 1}`);
        values.push(addon.isActive);
      }
      if (addon.category !== undefined) {
        updates.push(`category = $${values.length + 1}`);
        values.push(addon.category);
      }

      if (updates.length > 0) {
        values.push(id);
        await sql`
          UPDATE catering_addons 
          SET ${sql.unsafe(updates.join(', '))}
          WHERE id = $${values.length}
        `;
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