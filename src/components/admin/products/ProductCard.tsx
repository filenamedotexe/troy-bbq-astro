import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card, CardContent, CardHeader } from '../../ui/Card';
import {
  Eye,
  Edit,
  MoreVertical,
  Package,
  DollarSign,
  Tag,
  Calendar,
  AlertCircle,
  Copy,
  Archive,
  Trash2,
  Image as ImageIcon,
  ShoppingCart
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type {
  DatabaseProduct,
  DatabaseProductVariant,
  DatabaseProductImage,
  DatabaseProductCategory
} from '../../../types';

export interface ProductCardProps {
  product: DatabaseProduct & {
    variants: DatabaseProductVariant[];
    images: DatabaseProductImage[];
    categories: DatabaseProductCategory[];
  };
  onView?: (productId: string) => void;
  onEdit?: (productId: string) => void;
  onDuplicate?: (productId: string) => void;
  onArchive?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  selected?: boolean;
  onSelectionChange?: (productId: string, selected: boolean) => void;
  className?: string;
  showSelection?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  selected = false,
  onSelectionChange,
  className,
  showSelection = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Calculate derived data
  const primaryVariant = product.variants.find(v => v.variant_rank === 0) || product.variants[0];
  const primaryImage = product.images?.find(img => img.sort_order === 0) || product.images?.[0];

  const priceRange = product.variants.length > 0 ? (() => {
    const prices = product.variants.map(v => v.price_cents);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  })() : null;

  const totalInventory = product.variants.reduce((sum, variant) =>
    sum + (variant.inventory_quantity || 0), 0
  );

  const lowStock = totalInventory < 10 && totalInventory > 0;
  const outOfStock = totalInventory === 0;

  // Format price
  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Format price range
  const formatPriceRange = (): string => {
    if (!priceRange) return '-';

    if (priceRange.min === priceRange.max) {
      return formatPrice(priceRange.min);
    }

    return `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`;
  };

  // Render status badge
  const renderStatusBadge = () => {
    const statusConfig = {
      published: { label: 'Published', className: 'bg-green-100 text-green-800 border-green-200' },
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      proposed: { label: 'Proposed', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = statusConfig[product.status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <Badge className={cn("border", config.className)}>
        {config.label}
      </Badge>
    );
  };

  // Handle menu actions
  const handleMenuAction = (action: string) => {
    setShowMenu(false);

    switch (action) {
      case 'view':
        onView?.(product.id);
        break;
      case 'edit':
        onEdit?.(product.id);
        break;
      case 'duplicate':
        onDuplicate?.(product.id);
        break;
      case 'archive':
        onArchive?.(product.id);
        break;
      case 'delete':
        onDelete?.(product.id);
        break;
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200 hover:shadow-md",
      selected && "ring-2 ring-blue-500 ring-offset-2",
      className
    )}>
      {/* Selection checkbox */}
      {showSelection && onSelectionChange && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelectionChange(product.id, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 shadow-sm"
          />
        </div>
      )}

      {/* Actions menu */}
      <div className="absolute top-3 right-3 z-10">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm hover:bg-white/90"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  {onView && (
                    <button
                      onClick={() => handleMenuAction('view')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4" />
                      View Product
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => handleMenuAction('edit')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Product
                    </button>
                  )}
                  {onDuplicate && (
                    <button
                      onClick={() => handleMenuAction('duplicate')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </button>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  {onArchive && (
                    <button
                      onClick={() => handleMenuAction('archive')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => handleMenuAction('delete')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Product image */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {primaryImage && !imageError ? (
          <img
            src={product.thumbnail || primaryImage.url}
            alt={primaryImage.alt_text || product.title}
            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-16 w-16 text-gray-400" />
          </div>
        )}

        {/* Image count overlay */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            +{product.images.length - 1}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Status and date */}
        <div className="flex items-center justify-between mb-3">
          {renderStatusBadge()}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            {new Date(product.updated_at).toLocaleDateString()}
          </div>
        </div>

        {/* Product info */}
        <div className="space-y-2 mb-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
            {product.title}
          </h3>

          {product.subtitle && (
            <p className="text-sm text-gray-600 line-clamp-1">
              {product.subtitle}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">
              {formatPriceRange()}
            </span>
          </div>
        </div>

        {/* Categories */}
        {product.categories && product.categories.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-2">
              <Tag className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">Categories</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {product.categories.slice(0, 2).map((category) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className="text-xs"
                >
                  {category.name}
                </Badge>
              ))}
              {product.categories.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{product.categories.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Inventory status */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {totalInventory} in stock
              </span>
            </div>
            {lowStock && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-yellow-600">Low stock</span>
              </div>
            )}
            {outOfStock && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-600">Out of stock</span>
              </div>
            )}
          </div>

          {/* Variants count */}
          <div className="flex items-center gap-1 mt-1">
            <ShoppingCart className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(product.id)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
          {onEdit && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onEdit(product.id)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;