import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';
import type { Cart } from '../../types';

interface CartSummaryProps {
  cart: Cart;
  onCheckout?: () => void;
  isLoading?: boolean;
  showTitle?: boolean;
}

export default function CartSummary({ 
  cart, 
  onCheckout, 
  isLoading = false,
  showTitle = true 
}: CartSummaryProps) {
  const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
  const hasItems = itemCount > 0;

  return (
    <Card className="sticky top-4">
      {showTitle && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Order Summary</h2>
          </div>
        </div>
      )}
      
      <CardContent className="p-4 space-y-4">
        {/* Item Count */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Items in cart</span>
          <span className="font-medium">{itemCount}</span>
        </div>

        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatCurrency(cart.subtotal || 0)}</span>
        </div>

        {/* Shipping */}
        {cart.shipping_total > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">{formatCurrency(cart.shipping_total)}</span>
          </div>
        )}

        {/* Discount */}
        {cart.discount_total > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span className="font-medium">-{formatCurrency(cart.discount_total)}</span>
          </div>
        )}

        {/* Tax */}
        {cart.tax_total > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">{formatCurrency(cart.tax_total)}</span>
          </div>
        )}

        <hr className="border-gray-200" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(cart.total || 0)}
          </span>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={onCheckout}
          disabled={!hasItems || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            'Processing...'
          ) : hasItems ? (
            <>
              Proceed to Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            'Cart is Empty'
          )}
        </Button>

        {/* Additional Info */}
        {hasItems && (
          <div className="text-xs text-gray-500 text-center">
            <p>Shipping and taxes calculated at checkout</p>
            <p className="mt-1">Free delivery on orders over $50</p>
          </div>
        )}

        {/* Empty Cart Message */}
        {!hasItems && (
          <div className="text-center py-6 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Your cart is empty</p>
            <p className="text-xs mt-1">Add some delicious BBQ items to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}