import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import type { ProductFilters, ProductCategory, ProductCollection } from '../../types';

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories?: ProductCategory[];
  collections?: ProductCollection[];
  isLoading?: boolean;
}

export default function ProductFiltersComponent({ 
  filters, 
  onFiltersChange, 
  categories = [], 
  collections = [],
  isLoading = false
}: ProductFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<ProductFilters>(filters);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    onFiltersChange({ ...filters, search });
  };

  const handleTempFilterChange = (key: keyof ProductFilters, value: any) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    const clearedFilters: ProductFilters = { search: filters.search || '' };
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setIsFiltersOpen(false);
  };

  const hasActiveFilters = Boolean(
    filters.category_id?.length || 
    filters.collection_id?.length || 
    filters.tags?.length || 
    filters.price_min || 
    filters.price_max || 
    filters.sort !== 'created_at'
  );

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search BBQ items..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="pl-10"
            disabled={isLoading}
          />
        </div>

        {/* Filter Toggle Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                !
              </span>
            )}
          </Button>

          {/* Sort Dropdown */}
          <select
            value={filters.sort || 'created_at'}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              sort: e.target.value as ProductFilters['sort'] 
            })}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            disabled={isLoading}
          >
            <option value="created_at">Newest First</option>
            <option value="title">Alphabetical</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Filters Panel */}
      {isFiltersOpen && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFiltersOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Categories Filter */}
            {categories.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-3 block">Categories</Label>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFilters.category_id?.includes(category.id) || false}
                        onChange={(e) => {
                          const currentCategories = tempFilters.category_id || [];
                          if (e.target.checked) {
                            handleTempFilterChange('category_id', [...currentCategories, category.id]);
                          } else {
                            handleTempFilterChange('category_id', 
                              currentCategories.filter(id => id !== category.id)
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Collections Filter */}
            {collections.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-3 block">Collections</Label>
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <label key={collection.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFilters.collection_id?.includes(collection.id) || false}
                        onChange={(e) => {
                          const currentCollections = tempFilters.collection_id || [];
                          if (e.target.checked) {
                            handleTempFilterChange('collection_id', [...currentCollections, collection.id]);
                          } else {
                            handleTempFilterChange('collection_id', 
                              currentCollections.filter(id => id !== collection.id)
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{collection.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Price Range</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Min"
                  value={tempFilters.price_min || ''}
                  onChange={(e) => handleTempFilterChange('price_min', 
                    e.target.value ? Number(e.target.value) : undefined
                  )}
                  className="w-20"
                />
                <span className="text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={tempFilters.price_max || ''}
                  onChange={(e) => handleTempFilterChange('price_max', 
                    e.target.value ? Number(e.target.value) : undefined
                  )}
                  className="w-20"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.category_id?.map((categoryId) => {
            const category = categories.find(c => c.id === categoryId);
            return category ? (
              <span
                key={categoryId}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                {category.name}
                <button
                  onClick={() => onFiltersChange({
                    ...filters,
                    category_id: filters.category_id?.filter(id => id !== categoryId)
                  })}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null;
          })}

          {filters.collection_id?.map((collectionId) => {
            const collection = collections.find(c => c.id === collectionId);
            return collection ? (
              <span
                key={collectionId}
                className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
              >
                {collection.title}
                <button
                  onClick={() => onFiltersChange({
                    ...filters,
                    collection_id: filters.collection_id?.filter(id => id !== collectionId)
                  })}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}