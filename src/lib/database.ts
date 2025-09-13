import { neon } from '@neondatabase/serverless';
import type {
  AdminSettings,
  CateringQuote,
  CateringAddon,
  DatabaseAdminSettings,
  DatabaseCateringQuote,
  DatabaseCateringAddon,
  DatabaseProduct,
  DatabaseProductCategory,
  DatabaseProductVariant,
  DatabaseProductImage,
  DatabaseProductCollection,
  DatabaseProductTag,
  CreateProductInput,
  UpdateProductInput,
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
  CreateProductVariantInput,
  UpdateProductVariantInput,
  CreateProductImageInput,
  UpdateProductImageInput,
  CreateProductCollectionInput,
  UpdateProductCollectionInput,
  ProductQueryFilters,
  CategoryQueryFilters,
  ProductListQueryResponse,
  CategoryListQueryResponse,
  InventoryAdjustmentInput
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
          
          // For multiple field updates, we need to use individual queries for Neon compatibility
          // Execute each field update individually to avoid parameterized query issues
          for (let i = 0; i < updateFields.length; i++) {
            const field = updateFields[i];
            const value = updateValues[i];

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
          }
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

  // =====================================
  // PRODUCT MANAGEMENT METHODS
  // =====================================

  // Utility method to generate handle from title
  private generateHandle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-|-$/g, '');
  }

  // Create a new product with variants, categories, and images
  async createProduct(input: CreateProductInput): Promise<string> {
    try {
      // Generate handle if not provided
      const handle = input.handle || this.generateHandle(input.title);

      // Check if handle already exists
      const existingProduct = await sql`
        SELECT id FROM products WHERE handle = ${handle}
      `;

      if (existingProduct.length > 0) {
        throw new Error(`Product with handle '${handle}' already exists`);
      }

      // Insert the main product
      const productResult = await sql`
        INSERT INTO products (
          title, subtitle, description, handle, status, thumbnail,
          weight, length, height, width, hs_code, origin_country, mid_code, material,
          metadata, is_giftcard, discountable, external_id
        )
        VALUES (
          ${input.title},
          ${input.subtitle || null},
          ${input.description || null},
          ${handle},
          ${input.status || 'draft'},
          ${input.thumbnail || null},
          ${input.weight || null},
          ${input.length || null},
          ${input.height || null},
          ${input.width || null},
          ${input.hs_code || null},
          ${input.origin_country || null},
          ${input.mid_code || null},
          ${input.material || null},
          ${JSON.stringify(input.metadata || {})},
          ${input.is_giftcard || false},
          ${input.discountable !== undefined ? input.discountable : true},
          ${input.external_id || null}
        )
        RETURNING id
      `;

      const productId = productResult[0].id;

      // Add product variants if provided
      if (input.variants && input.variants.length > 0) {
        for (const variant of input.variants) {
          await this.createProductVariant(productId, variant);
        }
      }

      // Add product images if provided
      if (input.images && input.images.length > 0) {
        for (const image of input.images) {
          await this.addProductImage(productId, image);
        }
      }

      // Add category relationships if provided
      if (input.categories && input.categories.length > 0) {
        await this.setProductCategories(productId, input.categories);
      }

      // Add collection relationships if provided
      if (input.collections && input.collections.length > 0) {
        await this.setProductCollections(productId, input.collections);
      }

      // Add tag relationships if provided
      if (input.tags && input.tags.length > 0) {
        await this.setProductTags(productId, input.tags);
      }

      return productId;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get a single product with all related data
  async getProduct(id: string): Promise<DatabaseProduct & {
    variants: DatabaseProductVariant[];
    images: DatabaseProductImage[];
    categories: DatabaseProductCategory[];
    collections: DatabaseProductCollection[];
    tags: DatabaseProductTag[];
  } | null> {
    try {
      // Get the main product
      const productResult = await sql`
        SELECT * FROM products WHERE id = ${id}
      `;

      if (productResult.length === 0) return null;

      const product = productResult[0] as DatabaseProduct;

      // Get variants
      const variants = await sql`
        SELECT * FROM product_variants
        WHERE product_id = ${id}
        ORDER BY variant_rank, created_at
      ` as DatabaseProductVariant[];

      // Get images
      const images = await sql`
        SELECT * FROM product_images
        WHERE product_id = ${id}
        ORDER BY sort_order, created_at
      ` as DatabaseProductImage[];

      // Get categories
      const categories = await sql`
        SELECT pc.* FROM product_categories pc
        INNER JOIN product_category_relations pcr ON pc.id = pcr.category_id
        WHERE pcr.product_id = ${id}
        ORDER BY pc.sort_order, pc.name
      ` as DatabaseProductCategory[];

      // Get collections
      const collections = await sql`
        SELECT pco.* FROM product_collections pco
        INNER JOIN product_collection_relations pcor ON pco.id = pcor.collection_id
        WHERE pcor.product_id = ${id}
        ORDER BY pco.title
      ` as DatabaseProductCollection[];

      // Get tags
      const tags = await sql`
        SELECT pt.* FROM product_tags pt
        INNER JOIN product_tag_relations ptr ON pt.id = ptr.tag_id
        WHERE ptr.product_id = ${id}
        ORDER BY pt.value
      ` as DatabaseProductTag[];

      return {
        ...product,
        variants,
        images,
        categories,
        collections,
        tags
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
    }
  }

  // Get a product by handle
  async getProductByHandle(handle: string): Promise<DatabaseProduct & {
    variants: DatabaseProductVariant[];
    images: DatabaseProductImage[];
    categories: DatabaseProductCategory[];
    collections: DatabaseProductCollection[];
    tags: DatabaseProductTag[];
  } | null> {
    try {
      const productResult = await sql`
        SELECT * FROM products WHERE handle = ${handle}
      `;

      if (productResult.length === 0) return null;

      return this.getProduct(productResult[0].id);
    } catch (error) {
      console.error('Error fetching product by handle:', error);
      throw new Error('Failed to fetch product by handle');
    }
  }

  // Update a product
  async updateProduct(id: string, input: UpdateProductInput): Promise<void> {
    try {
      // Use individual field updates with tagged template literals for Neon compatibility
      if (input.title !== undefined) {
        await sql`UPDATE products SET title = ${input.title}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.subtitle !== undefined) {
        await sql`UPDATE products SET subtitle = ${input.subtitle}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.description !== undefined) {
        await sql`UPDATE products SET description = ${input.description}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.handle !== undefined) {
        await sql`UPDATE products SET handle = ${input.handle}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.status !== undefined) {
        await sql`UPDATE products SET status = ${input.status}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.thumbnail !== undefined) {
        await sql`UPDATE products SET thumbnail = ${input.thumbnail}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.weight !== undefined) {
        await sql`UPDATE products SET weight = ${input.weight}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.length !== undefined) {
        await sql`UPDATE products SET length = ${input.length}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.height !== undefined) {
        await sql`UPDATE products SET height = ${input.height}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.width !== undefined) {
        await sql`UPDATE products SET width = ${input.width}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.hs_code !== undefined) {
        await sql`UPDATE products SET hs_code = ${input.hs_code}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.origin_country !== undefined) {
        await sql`UPDATE products SET origin_country = ${input.origin_country}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.mid_code !== undefined) {
        await sql`UPDATE products SET mid_code = ${input.mid_code}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.material !== undefined) {
        await sql`UPDATE products SET material = ${input.material}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.metadata !== undefined) {
        await sql`UPDATE products SET metadata = ${JSON.stringify(input.metadata)}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.is_giftcard !== undefined) {
        await sql`UPDATE products SET is_giftcard = ${input.is_giftcard}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.discountable !== undefined) {
        await sql`UPDATE products SET discountable = ${input.discountable}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.external_id !== undefined) {
        await sql`UPDATE products SET external_id = ${input.external_id}, updated_at = NOW() WHERE id = ${id}`;
      }
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Failed to update product');
    }
  }

  // Delete a product and all related data
  async deleteProduct(id: string): Promise<void> {
    try {
      // Due to CASCADE constraints, this will automatically delete:
      // - product_variants
      // - product_images
      // - product_category_relations
      // - product_collection_relations
      // - product_tag_relations
      await sql`DELETE FROM products WHERE id = ${id}`;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }

  // List products with filtering and pagination
  async listProducts(filters: ProductQueryFilters = {}): Promise<ProductListQueryResponse> {
    try {
      const {
        search,
        category_ids,
        collection_ids,
        tag_values,
        status,
        price_min_cents,
        price_max_cents,
        is_giftcard,
        discountable,
        has_inventory,
        sort_by = 'created_at',
        sort_order = 'DESC',
        limit = 50,
        offset = 0
      } = filters;

      // For now, implement a simpler version that works with Neon's tagged templates
      // Start with basic query and add filters progressively

      let products: any[] = [];

      if (status && status.includes('published')) {
        // Get published products
        products = await sql`
          SELECT p.* FROM products p
          WHERE p.status = 'published'
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (status && status.length > 0) {
        // Get products with specific status
        products = await sql`
          SELECT p.* FROM products p
          WHERE p.status = ANY(${status})
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else {
        // Get all products
        products = await sql`
          SELECT p.* FROM products p
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }

      // Get total count
      let countResult: any[];
      if (status && status.length > 0) {
        countResult = await sql`
          SELECT COUNT(*) as total FROM products p
          WHERE p.status = ANY(${status})
        `;
      } else {
        countResult = await sql`
          SELECT COUNT(*) as total FROM products p
        `;
      }

      const totalCount = parseInt(countResult[0].total);

      // Fetch related data for each product
      const enrichedProducts = [];
      for (const product of products) {
        const fullProduct = await this.getProduct(product.id);
        if (fullProduct) {
          enrichedProducts.push(fullProduct);
        }
      }

      return {
        products: enrichedProducts,
        total_count: totalCount,
        has_more: offset + limit < totalCount,
        filters
      };
    } catch (error) {
      console.error('Error listing products:', error);
      // Re-throw the original error to preserve error codes for fallback handling
      throw error;
    }
  }

  // =====================================
  // PRODUCT VARIANT METHODS
  // =====================================

  async createProductVariant(productId: string, input: CreateProductVariantInput): Promise<string> {
    try {
      const result = await sql`
        INSERT INTO product_variants (
          product_id, title, sku, barcode, ean, upc, variant_rank,
          inventory_quantity, allow_backorder, manage_inventory, price_cents,
          weight, length, height, width, hs_code, origin_country, mid_code, material, metadata
        )
        VALUES (
          ${productId},
          ${input.title},
          ${input.sku || null},
          ${input.barcode || null},
          ${input.ean || null},
          ${input.upc || null},
          ${input.variant_rank || 0},
          ${input.inventory_quantity || 0},
          ${input.allow_backorder || false},
          ${input.manage_inventory !== undefined ? input.manage_inventory : true},
          ${input.price_cents},
          ${input.weight || null},
          ${input.length || null},
          ${input.height || null},
          ${input.width || null},
          ${input.hs_code || null},
          ${input.origin_country || null},
          ${input.mid_code || null},
          ${input.material || null},
          ${JSON.stringify(input.metadata || {})}
        )
        RETURNING id
      `;

      return result[0].id;
    } catch (error) {
      console.error('Error creating product variant:', error);
      throw new Error('Failed to create product variant');
    }
  }

  async updateProductVariant(id: string, input: UpdateProductVariantInput): Promise<void> {
    try {
      // Use individual field updates with tagged template literals for Neon compatibility
      if (input.title !== undefined) {
        await sql`UPDATE product_variants SET title = ${input.title}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.sku !== undefined) {
        await sql`UPDATE product_variants SET sku = ${input.sku}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.barcode !== undefined) {
        await sql`UPDATE product_variants SET barcode = ${input.barcode}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.ean !== undefined) {
        await sql`UPDATE product_variants SET ean = ${input.ean}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.upc !== undefined) {
        await sql`UPDATE product_variants SET upc = ${input.upc}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.variant_rank !== undefined) {
        await sql`UPDATE product_variants SET variant_rank = ${input.variant_rank}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.inventory_quantity !== undefined) {
        await sql`UPDATE product_variants SET inventory_quantity = ${input.inventory_quantity}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.allow_backorder !== undefined) {
        await sql`UPDATE product_variants SET allow_backorder = ${input.allow_backorder}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.manage_inventory !== undefined) {
        await sql`UPDATE product_variants SET manage_inventory = ${input.manage_inventory}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.price_cents !== undefined) {
        await sql`UPDATE product_variants SET price_cents = ${input.price_cents}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.weight !== undefined) {
        await sql`UPDATE product_variants SET weight = ${input.weight}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.length !== undefined) {
        await sql`UPDATE product_variants SET length = ${input.length}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.height !== undefined) {
        await sql`UPDATE product_variants SET height = ${input.height}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.width !== undefined) {
        await sql`UPDATE product_variants SET width = ${input.width}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.hs_code !== undefined) {
        await sql`UPDATE product_variants SET hs_code = ${input.hs_code}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.origin_country !== undefined) {
        await sql`UPDATE product_variants SET origin_country = ${input.origin_country}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.mid_code !== undefined) {
        await sql`UPDATE product_variants SET mid_code = ${input.mid_code}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.material !== undefined) {
        await sql`UPDATE product_variants SET material = ${input.material}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.metadata !== undefined) {
        await sql`UPDATE product_variants SET metadata = ${JSON.stringify(input.metadata)}, updated_at = NOW() WHERE id = ${id}`;
      }
    } catch (error) {
      console.error('Error updating product variant:', error);
      throw new Error('Failed to update product variant');
    }
  }

  async deleteProductVariant(id: string): Promise<void> {
    try {
      await sql`DELETE FROM product_variants WHERE id = ${id}`;
    } catch (error) {
      console.error('Error deleting product variant:', error);
      throw new Error('Failed to delete product variant');
    }
  }

  async adjustInventory(input: InventoryAdjustmentInput): Promise<void> {
    try {
      await sql`
        UPDATE product_variants
        SET
          inventory_quantity = inventory_quantity + ${input.quantity_change},
          updated_at = NOW()
        WHERE id = ${input.variant_id} AND manage_inventory = true
      `;
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      throw new Error('Failed to adjust inventory');
    }
  }

  // =====================================
  // PRODUCT IMAGE METHODS
  // =====================================

  async addProductImage(productId: string, input: CreateProductImageInput): Promise<string> {
    try {
      const result = await sql`
        INSERT INTO product_images (product_id, url, alt_text, sort_order, metadata)
        VALUES (
          ${productId},
          ${input.url},
          ${input.alt_text || null},
          ${input.sort_order || 0},
          ${JSON.stringify(input.metadata || {})}
        )
        RETURNING id
      `;

      return result[0].id;
    } catch (error) {
      console.error('Error adding product image:', error);
      throw new Error('Failed to add product image');
    }
  }

  async updateProductImage(id: string, input: UpdateProductImageInput): Promise<void> {
    try {
      // Use individual field updates with tagged template literals for Neon compatibility
      if (input.url !== undefined) {
        await sql`UPDATE product_images SET url = ${input.url} WHERE id = ${id}`;
      }
      if (input.alt_text !== undefined) {
        await sql`UPDATE product_images SET alt_text = ${input.alt_text} WHERE id = ${id}`;
      }
      if (input.sort_order !== undefined) {
        await sql`UPDATE product_images SET sort_order = ${input.sort_order} WHERE id = ${id}`;
      }
      if (input.metadata !== undefined) {
        await sql`UPDATE product_images SET metadata = ${JSON.stringify(input.metadata)} WHERE id = ${id}`;
      }
    } catch (error) {
      console.error('Error updating product image:', error);
      throw new Error('Failed to update product image');
    }
  }

  async removeProductImage(id: string): Promise<void> {
    try {
      await sql`DELETE FROM product_images WHERE id = ${id}`;
    } catch (error) {
      console.error('Error removing product image:', error);
      throw new Error('Failed to remove product image');
    }
  }

  async updateImageOrder(productId: string, imageOrdering: Array<{ id: string; sort_order: number }>): Promise<void> {
    try {
      for (const image of imageOrdering) {
        await sql`
          UPDATE product_images
          SET sort_order = ${image.sort_order}
          WHERE id = ${image.id} AND product_id = ${productId}
        `;
      }
    } catch (error) {
      console.error('Error updating image order:', error);
      throw new Error('Failed to update image order');
    }
  }

  // =====================================
  // PRODUCT RELATIONSHIP METHODS
  // =====================================

  async setProductCategories(productId: string, categoryIds: string[]): Promise<void> {
    try {
      // Remove existing category relationships
      await sql`DELETE FROM product_category_relations WHERE product_id = ${productId}`;

      // Add new category relationships
      if (categoryIds.length > 0) {
        const values = categoryIds.map(categoryId => `('${productId}', '${categoryId}')`).join(', ');
        await sql`INSERT INTO product_category_relations (product_id, category_id) VALUES ${sql.unsafe(values)}`;
      }
    } catch (error) {
      console.error('Error setting product categories:', error);
      throw new Error('Failed to set product categories');
    }
  }

  async setProductCollections(productId: string, collectionIds: string[]): Promise<void> {
    try {
      // Remove existing collection relationships
      await sql`DELETE FROM product_collection_relations WHERE product_id = ${productId}`;

      // Add new collection relationships
      if (collectionIds.length > 0) {
        const values = collectionIds.map(collectionId => `('${productId}', '${collectionId}')`).join(', ');
        await sql`INSERT INTO product_collection_relations (product_id, collection_id) VALUES ${sql.unsafe(values)}`;
      }
    } catch (error) {
      console.error('Error setting product collections:', error);
      throw new Error('Failed to set product collections');
    }
  }

  async setProductTags(productId: string, tagValues: string[]): Promise<void> {
    try {
      // Remove existing tag relationships
      await sql`DELETE FROM product_tag_relations WHERE product_id = ${productId}`;

      if (tagValues.length > 0) {
        // Create tags that don't exist
        for (const tagValue of tagValues) {
          await sql`
            INSERT INTO product_tags (value)
            VALUES (${tagValue})
            ON CONFLICT (value) DO NOTHING
          `;
        }

        // Add new tag relationships
        const tagIds = await sql`
          SELECT id FROM product_tags WHERE value = ANY(${tagValues})
        `;

        for (const tag of tagIds) {
          await sql`
            INSERT INTO product_tag_relations (product_id, tag_id)
            VALUES (${productId}, ${tag.id})
          `;
        }
      }
    } catch (error) {
      console.error('Error setting product tags:', error);
      throw new Error('Failed to set product tags');
    }
  }

  // =====================================
  // CATEGORY MANAGEMENT METHODS
  // =====================================

  async createCategory(input: CreateProductCategoryInput): Promise<string> {
    try {
      // Generate handle if not provided
      const handle = input.handle || this.generateHandle(input.name);

      // Check if handle already exists
      const existingCategory = await sql`
        SELECT id FROM product_categories WHERE handle = ${handle}
      `;

      if (existingCategory.length > 0) {
        throw new Error(`Category with handle '${handle}' already exists`);
      }

      // Validate parent category exists if provided
      if (input.parent_id) {
        const parentCategory = await sql`
          SELECT id FROM product_categories WHERE id = ${input.parent_id}
        `;

        if (parentCategory.length === 0) {
          throw new Error('Parent category does not exist');
        }
      }

      const result = await sql`
        INSERT INTO product_categories (name, handle, description, parent_id, metadata, is_active, sort_order)
        VALUES (
          ${input.name},
          ${handle},
          ${input.description || null},
          ${input.parent_id || null},
          ${JSON.stringify(input.metadata || {})},
          ${input.is_active !== undefined ? input.is_active : true},
          ${input.sort_order || 0}
        )
        RETURNING id
      `;

      return result[0].id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCategory(id: string): Promise<DatabaseProductCategory | null> {
    try {
      const result = await sql`
        SELECT * FROM product_categories WHERE id = ${id}
      `;

      return result.length > 0 ? result[0] as DatabaseProductCategory : null;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw new Error('Failed to fetch category');
    }
  }

  async getCategoryByHandle(handle: string): Promise<DatabaseProductCategory | null> {
    try {
      const result = await sql`
        SELECT * FROM product_categories WHERE handle = ${handle}
      `;

      return result.length > 0 ? result[0] as DatabaseProductCategory : null;
    } catch (error) {
      console.error('Error fetching category by handle:', error);
      throw new Error('Failed to fetch category by handle');
    }
  }

  async updateCategory(id: string, input: UpdateProductCategoryInput): Promise<void> {
    try {
      // Validate parent category exists if provided and not null
      if (input.parent_id) {
        const parentCategory = await sql`
          SELECT id FROM product_categories WHERE id = ${input.parent_id}
        `;

        if (parentCategory.length === 0) {
          throw new Error('Parent category does not exist');
        }

        // Prevent circular references
        const descendants = await this.getCategoryDescendants(id);
        if (descendants.some(desc => desc.id === input.parent_id)) {
          throw new Error('Cannot set parent to a descendant category');
        }
      }

      // Use individual field updates with tagged template literals for Neon compatibility
      if (input.name !== undefined) {
        await sql`UPDATE product_categories SET name = ${input.name}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.handle !== undefined) {
        await sql`UPDATE product_categories SET handle = ${input.handle}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.description !== undefined) {
        await sql`UPDATE product_categories SET description = ${input.description}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.parent_id !== undefined) {
        await sql`UPDATE product_categories SET parent_id = ${input.parent_id}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.metadata !== undefined) {
        await sql`UPDATE product_categories SET metadata = ${JSON.stringify(input.metadata)}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.is_active !== undefined) {
        await sql`UPDATE product_categories SET is_active = ${input.is_active}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.sort_order !== undefined) {
        await sql`UPDATE product_categories SET sort_order = ${input.sort_order}, updated_at = NOW() WHERE id = ${id}`;
      }
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error(`Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      // Check if category has any children
      const children = await sql`
        SELECT id FROM product_categories WHERE parent_id = ${id}
      `;

      if (children.length > 0) {
        throw new Error('Cannot delete category with child categories');
      }

      // Check if category has any products
      const products = await sql`
        SELECT product_id FROM product_category_relations WHERE category_id = ${id}
      `;

      if (products.length > 0) {
        throw new Error('Cannot delete category with associated products');
      }

      await sql`DELETE FROM product_categories WHERE id = ${id}`;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listCategories(filters: CategoryQueryFilters = {}): Promise<CategoryListQueryResponse> {
    try {
      const {
        search,
        parent_id,
        is_active,
        sort_by = 'sort_order',
        sort_order = 'ASC',
        limit = 100,
        offset = 0
      } = filters;

      // For simplicity, get all categories and filter in memory
      // This avoids dynamic SQL construction issues with Neon
      let categories: DatabaseProductCategory[];

      if (is_active !== undefined) {
        categories = await sql`
          SELECT * FROM product_categories
          WHERE is_active = ${is_active}
          ORDER BY sort_order, name
        ` as DatabaseProductCategory[];
      } else {
        categories = await sql`
          SELECT * FROM product_categories
          ORDER BY sort_order, name
        ` as DatabaseProductCategory[];
      }

      // Apply in-memory filtering
      let filteredCategories = categories;

      if (search) {
        const searchLower = search.toLowerCase();
        filteredCategories = filteredCategories.filter(cat =>
          cat.name.toLowerCase().includes(searchLower) ||
          (cat.description && cat.description.toLowerCase().includes(searchLower))
        );
      }

      if (parent_id !== undefined) {
        if (parent_id === null) {
          filteredCategories = filteredCategories.filter(cat => cat.parent_id === null);
        } else {
          filteredCategories = filteredCategories.filter(cat => cat.parent_id === parent_id);
        }
      }

      // Apply sorting
      if (sort_by === 'name') {
        filteredCategories.sort((a, b) => {
          return sort_order === 'DESC' ?
            b.name.localeCompare(a.name) :
            a.name.localeCompare(b.name);
        });
      } else if (sort_by === 'created_at') {
        filteredCategories.sort((a, b) => {
          const aTime = new Date(a.created_at).getTime();
          const bTime = new Date(b.created_at).getTime();
          return sort_order === 'DESC' ? bTime - aTime : aTime - bTime;
        });
      }

      // Apply pagination
      const total_count = filteredCategories.length;
      const paginatedCategories = filteredCategories.slice(offset, offset + limit);

      // Add product counts for each category
      const enrichedCategories = [];
      for (const category of paginatedCategories) {
        const productCount = await sql`
          SELECT COUNT(*) as count
          FROM product_category_relations
          WHERE category_id = ${category.id}
        `;

        // Get immediate children
        const children = await sql`
          SELECT * FROM product_categories
          WHERE parent_id = ${category.id}
          ORDER BY sort_order, name
        ` as DatabaseProductCategory[];

        enrichedCategories.push({
          ...category,
          children: children.length > 0 ? children : undefined,
          product_count: parseInt(productCount[0].count)
        });
      }

      return {
        categories: enrichedCategories,
        total_count,
        has_more: offset + limit < total_count,
        filters
      };
    } catch (error) {
      console.error('Error listing categories:', error);
      throw new Error('Failed to list categories');
    }
  }

  async getCategoryTree(): Promise<(DatabaseProductCategory & {
    children?: DatabaseProductCategory[];
    product_count?: number;
  })[]> {
    try {
      // Get all categories
      const allCategories = await sql`
        SELECT * FROM product_categories
        WHERE is_active = true
        ORDER BY sort_order, name
      ` as DatabaseProductCategory[];

      // Build tree structure
      const categoryMap = new Map();
      const rootCategories = [];

      // First pass: create map and find root categories
      for (const category of allCategories) {
        categoryMap.set(category.id, { ...category, children: [] });
        if (!category.parent_id) {
          rootCategories.push(categoryMap.get(category.id));
        }
      }

      // Second pass: build parent-child relationships
      for (const category of allCategories) {
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children.push(categoryMap.get(category.id));
          }
        }
      }

      // Add product counts
      for (const [categoryId, category] of categoryMap) {
        const productCount = await sql`
          SELECT COUNT(*) as count
          FROM product_category_relations
          WHERE category_id = ${categoryId}
        `;
        category.product_count = parseInt(productCount[0].count);
      }

      return rootCategories;
    } catch (error) {
      console.error('Error building category tree:', error);
      throw new Error('Failed to build category tree');
    }
  }

  private async getCategoryDescendants(categoryId: string): Promise<DatabaseProductCategory[]> {
    try {
      const descendants = [];
      const toProcess = [categoryId];

      while (toProcess.length > 0) {
        const currentId = toProcess.shift();
        const children = await sql`
          SELECT * FROM product_categories WHERE parent_id = ${currentId}
        ` as DatabaseProductCategory[];

        for (const child of children) {
          descendants.push(child);
          toProcess.push(child.id);
        }
      }

      return descendants;
    } catch (error) {
      console.error('Error getting category descendants:', error);
      throw new Error('Failed to get category descendants');
    }
  }

  // =====================================
  // COLLECTION MANAGEMENT METHODS
  // =====================================

  async createCollection(input: CreateProductCollectionInput): Promise<string> {
    try {
      // Generate handle if not provided
      const handle = input.handle || this.generateHandle(input.title);

      // Check if handle already exists
      const existingCollection = await sql`
        SELECT id FROM product_collections WHERE handle = ${handle}
      `;

      if (existingCollection.length > 0) {
        throw new Error(`Collection with handle '${handle}' already exists`);
      }

      const result = await sql`
        INSERT INTO product_collections (title, handle, metadata)
        VALUES (
          ${input.title},
          ${handle},
          ${JSON.stringify(input.metadata || {})}
        )
        RETURNING id
      `;

      return result[0].id;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw new Error(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCollection(id: string): Promise<DatabaseProductCollection | null> {
    try {
      const result = await sql`
        SELECT * FROM product_collections WHERE id = ${id}
      `;

      return result.length > 0 ? result[0] as DatabaseProductCollection : null;
    } catch (error) {
      console.error('Error fetching collection:', error);
      throw new Error('Failed to fetch collection');
    }
  }

  async updateCollection(id: string, input: UpdateProductCollectionInput): Promise<void> {
    try {
      // Use individual field updates with tagged template literals for Neon compatibility
      if (input.title !== undefined) {
        await sql`UPDATE product_collections SET title = ${input.title}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.handle !== undefined) {
        await sql`UPDATE product_collections SET handle = ${input.handle}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (input.metadata !== undefined) {
        await sql`UPDATE product_collections SET metadata = ${JSON.stringify(input.metadata)}, updated_at = NOW() WHERE id = ${id}`;
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      throw new Error('Failed to update collection');
    }
  }

  async deleteCollection(id: string): Promise<void> {
    try {
      // Check if collection has any products
      const products = await sql`
        SELECT product_id FROM product_collection_relations WHERE collection_id = ${id}
      `;

      if (products.length > 0) {
        throw new Error('Cannot delete collection with associated products');
      }

      await sql`DELETE FROM product_collections WHERE id = ${id}`;
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw new Error('Failed to delete collection');
    }
  }

  async listCollections(limit = 50, offset = 0): Promise<DatabaseProductCollection[]> {
    try {
      const result = await sql`
        SELECT * FROM product_collections
        ORDER BY title
        LIMIT ${limit} OFFSET ${offset}
      `;

      return result as DatabaseProductCollection[];
    } catch (error) {
      console.error('Error listing collections:', error);
      throw new Error('Failed to list collections');
    }
  }
}

export const db = new DatabaseService();