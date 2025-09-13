import React, { useState } from 'react';
import { Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import type { CartLineItem } from '../../types';

interface CartItemProps {
  item: CartLineItem;
  onUpdateQuantity: (lineItemId: string, quantity: number) => Promise<void>;
  onRemove: (lineItemId: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CartItem({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  isLoading = false 
}: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 0 || isUpdating) return;

    try {
      setIsUpdating(true);
      await onUpdateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isRemoving) return;

    try {
      setIsRemoving(true);
      await onRemove(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setIsRemoving(false);
    }
  };

  const isDisabled = isLoading || isUpdating || isRemoving;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-200">
      {/* Product Image */}
      <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
        <img
          src={
            item.thumbnail || 
            item.product?.thumbnail || 
            item.product?.images?.[0]?.url || 
            '/api/placeholder/64/64'
          }
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {item.title}
        </h3>
        {item.variant.title && item.variant.title !== 'Default Title' && (
          <p className="text-xs text-gray-500 mt-1">
            Variant: {item.variant.title}
          </p>
        )}
        {item.variant.sku && (
          <p className="text-xs text-gray-500">
            SKU: {item.variant.sku}
          </p>
        )}
        <p className="text-sm font-medium text-gray-900 mt-1">
          {formatCurrency(item.unit_price)} each
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={isDisabled || item.quantity <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>

        <div className="flex items-center justify-center min-w-[2rem] h-8 px-2 border border-gray-300 rounded text-sm">
          {isUpdating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            item.quantity
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={isDisabled}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Item Total & Remove */}
      <div className="flex flex-col items-end gap-2">
        <div className="text-sm font-semibold text-gray-900">
          {formatCurrency(item.total)}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isDisabled}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}