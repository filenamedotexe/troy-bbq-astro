import type { Cart, CartItem } from '../types';
import { ProductService } from './medusa';

// Simple in-memory cart storage with localStorage persistence
// This provides a bridge until full MedusaJS backend is implemented

export class CartStorage {
  private static readonly STORAGE_KEY = 'troy_bbq_cart';

  static async getCart(cartId: string): Promise<Cart | null> {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${cartId}`);
      if (!stored) return null;

      const cartData = JSON.parse(stored);

      // Enrich cart items with current product data
      const enrichedItems = await Promise.all(
        cartData.items.map(async (item: any) => {
          try {
            const productResponse = await ProductService.getProduct(item.product_id);
            const product = productResponse.product;
            const variant = product.variants.find((v: any) => v.id === item.variant_id);

            if (!variant) {
              console.warn(`Variant ${item.variant_id} not found for product ${item.product_id}`);
              return null;
            }

            return {
              id: item.id,
              variant_id: item.variant_id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: variant.prices[0]?.amount || 0,
              total: (variant.prices[0]?.amount || 0) * item.quantity,
              product: {
                id: product.id,
                title: product.title,
                thumbnail: product.thumbnail,
                handle: product.handle
              },
              variant: {
                id: variant.id,
                title: variant.title,
                sku: variant.sku,
                inventory_quantity: variant.inventory_quantity
              }
            };
          } catch (error) {
            console.error(`Error enriching cart item ${item.id}:`, error);
            return null;
          }
        })
      );

      // Filter out null items (products that couldn't be loaded)
      const validItems = enrichedItems.filter(item => item !== null);

      // Calculate totals
      const item_total = validItems.reduce((sum, item) => sum + item.total, 0);
      const tax_total = Math.round(item_total * 0.08); // 8% tax rate - should be configurable
      const shipping_total = 0; // Free shipping for now
      const discount_total = 0; // No discounts for now
      const total = item_total + tax_total + shipping_total - discount_total;

      return {
        id: cartId,
        items: validItems,
        total,
        subtotal: item_total,
        item_total,
        tax_total,
        shipping_total,
        discount_total,
        created_at: cartData.created_at,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting cart:', error);
      return null;
    }
  }

  static async createCart(): Promise<Cart> {
    const cartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cart: Cart = {
      id: cartId,
      items: [],
      total: 0,
      subtotal: 0,
      item_total: 0,
      tax_total: 0,
      shipping_total: 0,
      discount_total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.saveCart(cart);
    return cart;
  }

  static async addLineItem(cartId: string, productId: string, variantId: string, quantity: number): Promise<Cart> {
    let cart = await this.getCart(cartId);
    if (!cart) {
      cart = await this.createCart();
    }

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(item => item.variant_id === variantId);

    if (existingItemIndex >= 0) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].total = cart.items[existingItemIndex].unit_price * cart.items[existingItemIndex].quantity;
    } else {
      // Add new item
      try {
        const productResponse = await ProductService.getProduct(productId);
        const product = productResponse.product;
        const variant = product.variants.find((v: any) => v.id === variantId);

        if (!variant) {
          throw new Error(`Variant ${variantId} not found`);
        }

        const lineItemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const unitPrice = variant.prices[0]?.amount || 0;

        cart.items.push({
          id: lineItemId,
          variant_id: variantId,
          product_id: productId,
          quantity,
          unit_price: unitPrice,
          total: unitPrice * quantity,
          product: {
            id: product.id,
            title: product.title,
            thumbnail: product.thumbnail,
            handle: product.handle
          },
          variant: {
            id: variant.id,
            title: variant.title,
            sku: variant.sku,
            inventory_quantity: variant.inventory_quantity
          }
        });
      } catch (error) {
        console.error('Error adding item to cart:', error);
        throw new Error('Failed to add item to cart');
      }
    }

    // Recalculate totals
    cart.item_total = cart.items.reduce((sum, item) => sum + item.total, 0);
    cart.subtotal = cart.item_total;
    cart.tax_total = Math.round(cart.item_total * 0.08);
    cart.total = cart.item_total + cart.tax_total + cart.shipping_total - cart.discount_total;
    cart.updated_at = new Date().toISOString();

    this.saveCart(cart);
    return cart;
  }

  static async updateLineItem(cartId: string, lineItemId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const itemIndex = cart.items.findIndex(item => item.id === lineItemId);
    if (itemIndex < 0) {
      throw new Error('Item not found in cart');
    }

    if (quantity <= 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].total = cart.items[itemIndex].unit_price * quantity;
    }

    // Recalculate totals
    cart.item_total = cart.items.reduce((sum, item) => sum + item.total, 0);
    cart.subtotal = cart.item_total;
    cart.tax_total = Math.round(cart.item_total * 0.08);
    cart.total = cart.item_total + cart.tax_total + cart.shipping_total - cart.discount_total;
    cart.updated_at = new Date().toISOString();

    this.saveCart(cart);
    return cart;
  }

  static async removeLineItem(cartId: string, lineItemId: string): Promise<Cart> {
    return this.updateLineItem(cartId, lineItemId, 0);
  }

  private static saveCart(cart: Cart): void {
    try {
      // Save a simplified version to localStorage (without enriched product data)
      const storageCart = {
        id: cart.id,
        items: cart.items.map(item => ({
          id: item.id,
          variant_id: item.variant_id,
          product_id: item.product_id,
          quantity: item.quantity
        })),
        created_at: cart.created_at,
        updated_at: cart.updated_at
      };

      localStorage.setItem(`${this.STORAGE_KEY}_${cart.id}`, JSON.stringify(storageCart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  static clearCart(cartId: string): void {
    localStorage.removeItem(`${this.STORAGE_KEY}_${cartId}`);
  }
}