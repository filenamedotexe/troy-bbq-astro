import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Badge } from '../../ui/Badge';
import {
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  DollarSign,
  Package,
  Tag,
  Calendar
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type {
  ProductQueryFilters,
  DatabaseProductCategory,
  DatabaseProductCollection
} from '../../../types';

export interface ProductFiltersProps {
  filters: ProductQueryFilters;
  onFiltersChange: (filters: ProductQueryFilters) => void;
  categories?: DatabaseProductCategory[];
  collections?: DatabaseProductCollection[];
  onLoadCategories?: () => Promise<DatabaseProductCategory[]>;
  onLoadCollections?: () => Promise<DatabaseProductCollection[]>;
  className?: string;
}

interface FilterSection {
  id: string;
  title: string;
  isExpanded: boolean;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  categories = [],
  collections = [],
  onLoadCategories,
  onLoadCollections,
  className
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    price: false,
    categories: false,
    collections: false,
    inventory: false,
    dates: false
  });

  const [localFilters, setLocalFilters] = useState<ProductQueryFilters>(filters);
  const [priceRange, setPriceRange] = useState({
    min: filters.price_min_cents ? (filters.price_min_cents / 100).toString() : '',
    max: filters.price_max_cents ? (filters.price_max_cents / 100).toString() : ''
  });

  // Load categories and collections on mount
  useEffect(() => {
    if (categories.length === 0 && onLoadCategories) {
      onLoadCategories();
    }
    if (collections.length === 0 && onLoadCollections) {
      onLoadCollections();
    }
  }, [categories.length, collections.length, onLoadCategories, onLoadCollections]);

  // Sync with external filter changes
  useEffect(() => {
    setLocalFilters(filters);
    setPriceRange({
      min: filters.price_min_cents ? (filters.price_min_cents / 100).toString() : '',
      max: filters.price_max_cents ? (filters.price_max_cents / 100).toString() : ''
    });
  }, [filters]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Apply filters
  const applyFilters = () => {
    const updatedFilters: ProductQueryFilters = {
      ...localFilters,
      price_min_cents: priceRange.min ? Math.round(parseFloat(priceRange.min) * 100) : undefined,
      price_max_cents: priceRange.max ? Math.round(parseFloat(priceRange.max) * 100) : undefined,
      offset: 0 // Reset pagination when filters change
    };

    onFiltersChange(updatedFilters);
  };

  // Reset filters
  const resetFilters = () => {
    const defaultFilters: ProductQueryFilters = {
      search: '',
      status: [],
      sort_by: 'created_at',
      sort_order: 'DESC',
      limit: filters.limit || 50,
      offset: 0
    };

    setLocalFilters(defaultFilters);
    setPriceRange({ min: '', max: '' });
    onFiltersChange(defaultFilters);
  };

  // Handle status filter toggle
  const toggleStatusFilter = (status: string) => {
    const currentStatus = localFilters.status || [];
    let newStatus: typeof currentStatus;

    if (currentStatus.includes(status as any)) {
      newStatus = currentStatus.filter(s => s !== status);
    } else {
      newStatus = [...currentStatus, status as any];
    }

    setLocalFilters({ ...localFilters, status: newStatus });
  };

  // Handle category filter toggle
  const toggleCategoryFilter = (categoryId: string) => {
    const currentCategories = localFilters.category_ids || [];
    let newCategories: string[];

    if (currentCategories.includes(categoryId)) {
      newCategories = currentCategories.filter(id => id !== categoryId);
    } else {
      newCategories = [...currentCategories, categoryId];
    }

    setLocalFilters({ ...localFilters, category_ids: newCategories });
  };

  // Handle collection filter toggle
  const toggleCollectionFilter = (collectionId: string) => {
    const currentCollections = localFilters.collection_ids || [];
    let newCollections: string[];

    if (currentCollections.includes(collectionId)) {
      newCollections = currentCollections.filter(id => id !== collectionId);
    } else {
      newCollections = [...currentCollections, collectionId];
    }

    setLocalFilters({ ...localFilters, collection_ids: newCollections });
  };

  // Handle boolean filter toggle
  const toggleBooleanFilter = (key: keyof ProductQueryFilters, value: boolean) => {
    setLocalFilters({
      ...localFilters,
      [key]: localFilters[key] === value ? undefined : value
    });
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;

    if (filters.status && filters.status.length > 0) count += filters.status.length;
    if (filters.category_ids && filters.category_ids.length > 0) count += filters.category_ids.length;
    if (filters.collection_ids && filters.collection_ids.length > 0) count += filters.collection_ids.length;
    if (filters.price_min_cents || filters.price_max_cents) count += 1;
    if (filters.is_giftcard !== undefined) count += 1;
    if (filters.discountable !== undefined) count += 1;
    if (filters.has_inventory !== undefined) count += 1;

    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Render filter section
  const renderFilterSection = (
    id: string,
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode
  ) => (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {expandedSections[id] ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expandedSections[id] && (
        <div className="px-4 pb-4">
          {content}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={applyFilters}
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Filter sections */}
      <div className="max-h-96 overflow-y-auto">
        {/* Status filters */}
        {renderFilterSection(
          'status',
          'Status',
          <Package className="h-4 w-4 text-gray-400" />,
          <div className="space-y-2">
            {[
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
              { value: 'proposed', label: 'Proposed' },
              { value: 'rejected', label: 'Rejected' }
            ].map((status) => (
              <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.status?.includes(status.value as any) || false}
                  onChange={() => toggleStatusFilter(status.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{status.label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Price range */}
        {renderFilterSection(
          'price',
          'Price Range',
          <DollarSign className="h-4 w-4 text-gray-400" />,
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price-min" className="text-sm text-gray-600">Min Price</Label>
                <Input
                  id="price-min"
                  type="number"
                  placeholder="0.00"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="price-max" className="text-sm text-gray-600">Max Price</Label>
                <Input
                  id="price-max"
                  type="number"
                  placeholder="999.99"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">Enter prices in dollars (e.g., 19.99)</p>
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && renderFilterSection(
          'categories',
          'Categories',
          <Tag className="h-4 w-4 text-gray-400" />,
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.category_ids?.includes(category.id) || false}
                  onChange={() => toggleCategoryFilter(category.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        )}

        {/* Collections */}
        {collections.length > 0 && renderFilterSection(
          'collections',
          'Collections',
          <Tag className="h-4 w-4 text-gray-400" />,
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {collections.map((collection) => (
              <label key={collection.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.collection_ids?.includes(collection.id) || false}
                  onChange={() => toggleCollectionFilter(collection.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{collection.title}</span>
              </label>
            ))}
          </div>
        )}

        {/* Inventory & Properties */}
        {renderFilterSection(
          'inventory',
          'Properties',
          <Package className="h-4 w-4 text-gray-400" />,
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.has_inventory === true}
                onChange={() => toggleBooleanFilter('has_inventory', true)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Has inventory</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.is_giftcard === true}
                onChange={() => toggleBooleanFilter('is_giftcard', true)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Gift cards only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.discountable === false}
                onChange={() => toggleBooleanFilter('discountable', false)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Non-discountable</span>
            </label>
          </div>
        )}
      </div>

      {/* Active filters summary */}
      {activeFilterCount > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;