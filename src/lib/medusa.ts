// MedusaJS v2 SDK configuration with real database integration
// Fallback to actual MedusaJS backend if configured:
// import Medusa from "@medusajs/js-sdk";

// Default to localhost:9000 for MedusaJS backend
const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const MEDUSA_PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || "";

// Internal API base URL
const API_BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : process.env.SITE_URL || 'http://localhost:4005';

// Real database-powered client
export const medusaClient = {
  store: {
    product: {
      list: async (params?: any) => {
        try {
          // Build query parameters
          const searchParams = new URLSearchParams();

          if (params?.q) searchParams.set('q', params.q);
          if (params?.category_id) {
            if (Array.isArray(params.category_id)) {
              params.category_id.forEach((id: string) => searchParams.append('category_id', id));
            } else {
              searchParams.set('category_id', params.category_id);
            }
          }
          if (params?.collection_id) {
            if (Array.isArray(params.collection_id)) {
              params.collection_id.forEach((id: string) => searchParams.append('collection_id', id));
            } else {
              searchParams.set('collection_id', params.collection_id);
            }
          }
          if (params?.tags) {
            if (Array.isArray(params.tags)) {
              params.tags.forEach((tag: string) => searchParams.append('tag', tag));
            } else {
              searchParams.set('tag', params.tags);
            }
          }
          if (params?.limit) searchParams.set('limit', params.limit.toString());
          if (params?.offset) searchParams.set('offset', params.offset.toString());
          if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
          if (params?.sort_order) searchParams.set('sort_order', params.sort_order);

          const response = await fetch(`${API_BASE_URL}/api/store/products?${searchParams}`);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        } catch (error) {
          console.error('Error fetching products from store API:', error);
          throw new Error('Failed to fetch products');
        }
      },
      retrieve: async (id: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/store/products/${id}`);

          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Product not found');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        } catch (error) {
          console.error('Error fetching product from store API:', error);
          throw new Error('Failed to fetch product');
        }
      },
    },
    cart: {
      // Real cart operations using CartStorage
      create: async () => {
        const { CartStorage } = await import('./cartStorage');
        const cart = await CartStorage.createCart();
        return { cart };
      },
      retrieve: async (id: string) => {
        const { CartStorage } = await import('./cartStorage');
        const cart = await CartStorage.getCart(id);
        if (!cart) {
          throw new Error('Cart not found');
        }
        return { cart };
      },
      createLineItem: async (cartId: string, params: any) => {
        const { CartStorage } = await import('./cartStorage');
        const cart = await CartStorage.addLineItem(
          cartId,
          params.product_id || 'unknown', // Will be provided by the calling code
          params.variant_id,
          params.quantity
        );
        return { cart };
      },
      updateLineItem: async (cartId: string, lineItemId: string, params: any) => {
        const { CartStorage } = await import('./cartStorage');
        const cart = await CartStorage.updateLineItem(cartId, lineItemId, params.quantity);
        return { cart };
      },
      deleteLineItem: async (cartId: string, lineItemId: string) => {
        const { CartStorage } = await import('./cartStorage');
        const cart = await CartStorage.removeLineItem(cartId, lineItemId);
        return {
          deleted: true,
          parent: cart
        };
      },
      update: async (cartId: string, params: any) => {
        const { CartStorage } = await import('./cartStorage');
        const cart = await CartStorage.getCart(cartId);
        if (!cart) {
          throw new Error('Cart not found');
        }
        // For now, just return the cart as-is since we're not implementing full cart updates
        return { cart };
      },
    },
  },
};

// Product API service wrapper with real database integration
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
      const response = await medusaClient.store.product.retrieve(id);
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

  // New method to get categories
  static async getCategories(params?: {
    limit?: number;
    offset?: number;
    parent_id?: string;
  }) {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      if (params?.parent_id) searchParams.set('parent_id', params.parent_id);

      const response = await fetch(`${API_BASE_URL}/api/store/categories?${searchParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  // New method to get collections
  static async getCollections(params?: {
    limit?: number;
    offset?: number;
  }) {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());

      const response = await fetch(`${API_BASE_URL}/api/store/collections?${searchParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw new Error('Failed to fetch collections');
    }
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
    product_id?: string;
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