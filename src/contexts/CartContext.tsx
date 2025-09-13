import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { CartService } from '../lib/medusa';
import type { Cart, CartState, AddToCartInput, UpdateLineItemInput } from '../types';

interface CartContextType extends CartState {
  addToCart: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  removeFromCart: (lineItemId: string) => Promise<void>;
  updateQuantity: (lineItemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  getItemQuantity: (variantId: string) => number;
  getTotalItems: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

const CART_STORAGE_KEY = 'medusa_cart_id';

export function CartProvider({ children }: CartProviderProps) {
  const [state, setState] = useState<CartState>({
    cart: null,
    isLoading: false,
    error: null,
  });

  // Initialize cart on component mount
  useEffect(() => {
    initializeCart();
  }, []);

  const initializeCart = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Try to retrieve existing cart from localStorage
      const savedCartId = localStorage.getItem(CART_STORAGE_KEY);
      
      if (savedCartId) {
        try {
          const { cart } = await CartService.getCart(savedCartId);
          setState(prev => ({ ...prev, cart, isLoading: false }));
          return;
        } catch (error) {
          // Cart might be expired or invalid, clear it
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }

      // Create new cart if none exists or existing one is invalid
      const { cart } = await CartService.createCart({
        region_id: 'reg_01JEXZ9V2K5W4JJGPZF6NJT7QB', // Default region - should be configurable
      });

      setState(prev => ({ ...prev, cart, isLoading: false }));
      localStorage.setItem(CART_STORAGE_KEY, cart.id);
    } catch (error) {
      console.error('Failed to initialize cart:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to initialize cart' 
      }));
    }
  };

  const refreshCart = async () => {
    if (!state.cart?.id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const { cart } = await CartService.getCart(state.cart.id);
      setState(prev => ({ ...prev, cart, isLoading: false }));
    } catch (error) {
      console.error('Failed to refresh cart:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to refresh cart' 
      }));
    }
  };

  const addToCart = async (productId: string, variantId: string, quantity: number = 1) => {
    if (!state.cart?.id) {
      await initializeCart();
      if (!state.cart?.id) {
        throw new Error('No cart available');
      }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if item already exists in cart
      const existingItem = state.cart.items.find(item => item.variant_id === variantId);
      
      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + quantity;
        const { cart } = await CartService.updateLineItem(
          state.cart.id,
          existingItem.id,
          { quantity: newQuantity }
        );
        setState(prev => ({ ...prev, cart, isLoading: false }));
      } else {
        // Add new item to cart
        const { cart } = await CartService.addToCart(state.cart.id, {
          variant_id: variantId,
          quantity,
          product_id: productId,
        });
        setState(prev => ({ ...prev, cart, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to add item to cart' 
      }));
      throw error;
    }
  };

  const removeFromCart = async (lineItemId: string) => {
    if (!state.cart?.id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const { parent: cart } = await CartService.removeFromCart(state.cart.id, lineItemId);
      setState(prev => ({ ...prev, cart, isLoading: false }));
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to remove item from cart' 
      }));
      throw error;
    }
  };

  const updateQuantity = async (lineItemId: string, quantity: number) => {
    if (!state.cart?.id) return;

    if (quantity <= 0) {
      await removeFromCart(lineItemId);
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const { cart } = await CartService.updateLineItem(
        state.cart.id,
        lineItemId,
        { quantity }
      );
      setState(prev => ({ ...prev, cart, isLoading: false }));
    } catch (error) {
      console.error('Failed to update item quantity:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to update item quantity' 
      }));
      throw error;
    }
  };

  const clearCart = () => {
    localStorage.removeItem(CART_STORAGE_KEY);
    setState({
      cart: null,
      isLoading: false,
      error: null,
    });
    initializeCart();
  };

  const getItemQuantity = (variantId: string): number => {
    if (!state.cart?.items) return 0;
    const item = state.cart.items.find(item => item.variant_id === variantId);
    return item?.quantity || 0;
  };

  const getTotalItems = (): number => {
    if (!state.cart?.items) return 0;
    return state.cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const contextValue: CartContextType = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    getTotalItems,
    refreshCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};