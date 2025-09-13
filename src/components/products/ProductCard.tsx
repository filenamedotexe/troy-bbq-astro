import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string, variantId: string) => void;
  onViewDetails?: (productId: string) => void;
}

export default function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  // Get the first variant for pricing (BBQ items typically have simple variants)
  const primaryVariant = product.variants[0];
  const price = primaryVariant?.prices.find(p => p.currency_code === 'usd')?.amount || 0;

  const handleAddToCart = () => {
    if (onAddToCart && primaryVariant) {
      onAddToCart(product.id, primaryVariant.id);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product.id);
    }
  };

  return (
    <Card className="h-full flex flex-col group hover:shadow-lg transition-shadow duration-200">
      {/* Product Image */}
      <div className="relative overflow-hidden rounded-t-lg aspect-square">
        <img
          src={product.thumbnail || product.images?.[0]?.url || '/api/placeholder/300/300'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
        {product.is_giftcard && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 text-xs font-medium rounded">
            Gift Card
          </div>
        )}
        {primaryVariant?.inventory_quantity !== undefined && primaryVariant.inventory_quantity <= 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded">
            Out of Stock
          </div>
        )}
      </div>

      {/* Product Info */}
      <CardHeader className="flex-grow">
        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
          {product.title}
        </CardTitle>
        {product.subtitle && (
          <p className="text-sm text-gray-600 line-clamp-1">
            {product.subtitle}
          </p>
        )}
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-3 mt-2">
            {product.description}
          </p>
        )}
      </CardHeader>

      {/* Product Footer */}
      <CardContent className="pt-0">
        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full"
              >
                {tag.value}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                +{product.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(price)}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
            >
              View Details
            </Button>
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={primaryVariant?.inventory_quantity === 0}
            >
              {primaryVariant?.inventory_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>

        {/* Collection Info */}
        {product.collection && (
          <div className="mt-2 text-xs text-gray-500">
            Collection: {product.collection.title}
          </div>
        )}
      </CardContent>
    </Card>
  );
}