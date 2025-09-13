import React from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/Button';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import AppProviders from '../providers/AppProviders';
import { useCart } from '../../contexts/CartContext';

function CartPageContent() {
  const { 
    cart, 
    isLoading, 
    error, 
    removeFromCart, 
    updateQuantity, 
    getTotalItems,
    clearCart 
  } = useCart();

  const totalItems = getTotalItems();

  const handleContinueShopping = () => {
    window.location.href = '/menu';
  };

  const handleCheckout = () => {
    window.location.href = '/checkout';
  };

  if (isLoading && !cart) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 py-4 border-b">
                  <div className="w-16 h-16 bg-gray-300 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="w-24 h-8 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
            <div className="bg-gray-300 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <ShoppingBag className="h-16 w-16 mx-auto mb-2" />
            <h2 className="text-xl font-semibold">Error Loading Cart</h2>
            <p className="text-gray-600 mt-2">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!cart || totalItems === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-lg text-gray-600 mb-8">
            Looks like you haven't added any delicious BBQ items to your cart yet.
          </p>
          <Button onClick={handleContinueShopping} size="lg">
            Browse Our Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <Button variant="outline" onClick={handleContinueShopping}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Cart Items</h2>
                {totalItems > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear Cart
                  </Button>
                )}
              </div>
              
              <div className="space-y-0">
                {cart.items.map((item, index) => (
                  <div key={item.id}>
                    <CartItem
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                      isLoading={isLoading}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations or Upsells */}
          <div className="mt-8 p-6 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Complete Your BBQ Experience
            </h3>
            <p className="text-gray-600 mb-4">
              Don't forget sides and drinks to go with your BBQ!
            </p>
            <Button variant="outline" onClick={handleContinueShopping}>
              Add More Items
            </Button>
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <CartSummary
            cart={cart}
            onCheckout={handleCheckout}
            isLoading={isLoading}
            showTitle={false}
          />

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Order Information</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Free delivery on orders over $50</li>
              <li>• Delivery time: 30-45 minutes</li>
              <li>• All items prepared fresh daily</li>
              <li>• Contact us for custom orders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPageWrapper() {
  return (
    <AppProviders>
      <CartPageContent />
    </AppProviders>
  );
}