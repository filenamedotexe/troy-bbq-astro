import React, { useEffect } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/Button';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import { useCart } from '../../contexts/CartContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

export default function CartSidebar({ isOpen, onClose, onCheckout }: CartSidebarProps) {
  const { cart, isLoading, removeFromCart, updateQuantity, getTotalItems } = useCart();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const totalItems = getTotalItems();

  const handleCheckout = () => {
    onClose();
    if (onCheckout) {
      onCheckout();
    } else {
      // Default navigation to checkout page
      window.location.href = '/checkout';
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            {totalItems > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && !cart && (
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                    <div className="w-20 h-8 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            )}

            {cart && cart.items.length > 0 ? (
              <div className="p-4 space-y-0">
                {cart.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            ) : cart && cart.items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Looks like you haven't added any BBQ items yet.
                  </p>
                  <Button onClick={onClose} variant="outline">
                    Continue Shopping
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Cart Summary - Fixed at bottom */}
          {cart && cart.items.length > 0 && (
            <div className="border-t bg-gray-50 p-4">
              <div className="space-y-3">
                {/* Quick totals */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                  <span className="font-medium">{cart.subtotal ? `$${(cart.subtotal / 100).toFixed(2)}` : '$0.00'}</span>
                </div>
                
                {cart.tax_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${(cart.tax_total / 100).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold">
                    {cart.total ? `$${(cart.total / 100).toFixed(2)}` : '$0.00'}
                  </span>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isLoading || totalItems === 0}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Loading...' : 'Checkout'}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  Shipping and taxes calculated at checkout
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}