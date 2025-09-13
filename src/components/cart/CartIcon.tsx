import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '../ui/Button';
import CartSidebar from './CartSidebar';
import { useCart } from '../../contexts/CartContext';

interface CartIconProps {
  className?: string;
}

export default function CartIcon({ className = '' }: CartIconProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems, cart } = useCart();

  const totalItems = getTotalItems();

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  const handleCheckout = () => {
    // Navigate to checkout page
    window.location.href = '/checkout';
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCartClick}
        className={`relative ${className}`}
      >
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
        <span className="sr-only">
          Shopping cart with {totalItems} items
        </span>
      </Button>

      <CartSidebar
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        onCheckout={handleCheckout}
      />
    </>
  );
}