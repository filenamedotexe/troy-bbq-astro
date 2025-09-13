// MedusaJS v2 SDK configuration for demo mode
// In production, uncomment and configure with your actual backend:
// import Medusa from "@medusajs/js-sdk";

// Default to localhost:9000 for MedusaJS backend
const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const MEDUSA_PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || "";

// Demo mode client - replace with actual MedusaJS client in production
export const medusaClient = {
  store: {
    product: {
      list: async (params?: any) => {
        // Demo data for development
        return {
          products: [
            {
              id: 'demo-brisket',
              title: 'Smoked Beef Brisket',
              subtitle: 'Tender, slow-smoked for 12 hours',
              description: 'Our signature brisket, rubbed with our secret spice blend and smoked over hickory for 12 hours until it reaches perfect tenderness.',
              handle: 'smoked-beef-brisket',
              is_giftcard: false,
              status: 'published',
              thumbnail: '/api/placeholder/400/400',
              images: [{ id: '1', url: '/api/placeholder/400/400' }],
              variants: [{
                id: 'var-brisket-1',
                title: 'Half Pound',
                sku: 'BRISKET-HALF',
                prices: [{ id: 'price-1', amount: 1899, currency_code: 'usd' }],
                inventory_quantity: 10,
              }],
              categories: [{ id: 'cat-beef', name: 'Beef', handle: 'beef' }],
              collection: { id: 'col-mains', title: 'Main Dishes', handle: 'main-dishes' },
              tags: [{ id: 'tag-1', value: 'signature' }, { id: 'tag-2', value: 'smoked' }],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'demo-ribs',
              title: 'Baby Back Ribs',
              subtitle: 'Fall-off-the-bone tender',
              description: 'Premium baby back ribs seasoned with our dry rub and smoked low and slow until they fall off the bone.',
              handle: 'baby-back-ribs',
              is_giftcard: false,
              status: 'published',
              thumbnail: '/api/placeholder/400/400',
              variants: [{
                id: 'var-ribs-1',
                title: 'Full Rack',
                sku: 'RIBS-FULL',
                prices: [{ id: 'price-2', amount: 2499, currency_code: 'usd' }],
                inventory_quantity: 5,
              }],
              categories: [{ id: 'cat-pork', name: 'Pork', handle: 'pork' }],
              collection: { id: 'col-mains', title: 'Main Dishes', handle: 'main-dishes' },
              tags: [{ id: 'tag-3', value: 'popular' }],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'demo-chicken',
              title: 'Smoked Half Chicken',
              subtitle: 'Juicy and flavorful',
              description: 'Half chicken marinated in our special brine and smoked to perfection with a crispy skin and juicy meat.',
              handle: 'smoked-half-chicken',
              is_giftcard: false,
              status: 'published',
              thumbnail: '/api/placeholder/400/400',
              variants: [{
                id: 'var-chicken-1',
                title: 'Half Chicken',
                sku: 'CHICKEN-HALF',
                prices: [{ id: 'price-3', amount: 1399, currency_code: 'usd' }],
                inventory_quantity: 8,
              }],
              categories: [{ id: 'cat-poultry', name: 'Poultry', handle: 'poultry' }],
              collection: { id: 'col-mains', title: 'Main Dishes', handle: 'main-dishes' },
              tags: [{ id: 'tag-4', value: 'healthy' }],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          count: 3,
          offset: params?.offset || 0,
          limit: params?.limit || 12,
        };
      },
      retrieve: async (id: string) => {
        // Demo product retrieval
        return {
          product: {
            id,
            title: 'Demo Product',
            variants: [{ id: 'var-1', prices: [{ amount: 1000, currency_code: 'usd' }] }],
          }
        };
      },
    },
    cart: {
      create: async () => ({ cart: { id: 'demo-cart', items: [], total: 0 } }),
      retrieve: async () => ({ cart: { id: 'demo-cart', items: [], total: 0, subtotal: 0, tax_total: 0, shipping_total: 0, discount_total: 0, item_total: 0 } }),
      createLineItem: async () => ({ cart: { id: 'demo-cart', items: [], total: 0 } }),
      updateLineItem: async () => ({ cart: { id: 'demo-cart', items: [], total: 0 } }),
      deleteLineItem: async () => ({ deleted: true, parent: { id: 'demo-cart', items: [], total: 0 } }),
      update: async () => ({ cart: { id: 'demo-cart', items: [], total: 0 } }),
    },
  },
};

// Product API service wrapper
export class ProductService {
  static async listProducts(params?: {
    limit?: number;
    offset?: number;
    q?: string; // Search query
    category_id?: string[];
    collection_id?: string[];
    tags?: string[];
    title?: string;
    handle?: string;
    is_giftcard?: boolean;
    status?: string[];
    fields?: string;
  }) {
    try {
      const response = await medusaClient.store.product.list(params);
      return response;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  static async getProduct(id: string, params?: {
    fields?: string;
    region_id?: string;
    country_code?: string;
    province?: string;
  }) {
    try {
      const response = await medusaClient.store.product.retrieve(id, params);
      return response;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
    }
  }

  static async searchProducts(query: string, params?: {
    limit?: number;
    offset?: number;
    category_id?: string[];
    collection_id?: string[];
    fields?: string;
  }) {
    return this.listProducts({
      q: query,
      ...params
    });
  }
}

// Cart API service wrapper
export class CartService {
  static async createCart(params?: {
    region_id?: string;
    email?: string;
    shipping_address?: any;
    billing_address?: any;
    items?: any[];
  }) {
    try {
      const response = await medusaClient.store.cart.create(params);
      return response;
    } catch (error) {
      console.error('Error creating cart:', error);
      throw new Error('Failed to create cart');
    }
  }

  static async getCart(cartId: string, params?: {
    fields?: string;
  }) {
    try {
      const response = await medusaClient.store.cart.retrieve(cartId, {
        fields: 'id,*items,*items.variant,*items.product,total,subtotal,tax_total,shipping_total,discount_total,item_total',
        ...params
      });
      return response;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw new Error('Failed to fetch cart');
    }
  }

  static async updateCart(cartId: string, params: {
    region_id?: string;
    email?: string;
    shipping_address?: any;
    billing_address?: any;
  }) {
    try {
      const response = await medusaClient.store.cart.update(cartId, params);
      return response;
    } catch (error) {
      console.error('Error updating cart:', error);
      throw new Error('Failed to update cart');
    }
  }

  static async addToCart(cartId: string, params: {
    variant_id: string;
    quantity: number;
    metadata?: Record<string, unknown>;
  }) {
    try {
      const response = await medusaClient.store.cart.createLineItem(cartId, params);
      return response;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw new Error('Failed to add item to cart');
    }
  }

  static async updateLineItem(cartId: string, lineItemId: string, params: {
    quantity: number;
    metadata?: Record<string, unknown>;
  }) {
    try {
      const response = await medusaClient.store.cart.updateLineItem(cartId, lineItemId, params);
      return response;
    } catch (error) {
      console.error('Error updating line item:', error);
      throw new Error('Failed to update line item');
    }
  }

  static async removeFromCart(cartId: string, lineItemId: string) {
    try {
      const response = await medusaClient.store.cart.deleteLineItem(cartId, lineItemId);
      return response;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw new Error('Failed to remove item from cart');
    }
  }
}

export default medusaClient;