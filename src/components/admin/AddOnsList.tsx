import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import type { CateringAddon } from '../../types';

interface AddOnsListProps {
  addons: CateringAddon[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  activeFilter: boolean;
  onActiveFilterChange: (active: boolean) => void;
  categories: string[];
  selectedAddons: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onEdit: (addon: CateringAddon) => void;
  onDelete: (id: string) => void;
  onBulkAction: (action: 'activate' | 'deactivate' | 'delete', addonIds: string[]) => void;
}

export default function AddOnsList({
  addons,
  isLoading,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  activeFilter,
  onActiveFilterChange,
  categories,
  selectedAddons,
  onSelectionChange,
  onEdit,
  onDelete,
  onBulkAction,
}: AddOnsListProps) {
  const handleSelectAll = () => {
    if (selectedAddons.size === addons.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(addons.map(addon => addon.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelection = new Set(selectedAddons);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getCategoryBadgeColor = (category: string | null) => {
    if (!category) return 'bg-gray-100 text-gray-800';
    
    const colors: Record<string, string> = {
      setup: 'bg-blue-100 text-blue-800',
      equipment: 'bg-purple-100 text-purple-800',
      staff: 'bg-green-100 text-green-800',
      service: 'bg-yellow-100 text-yellow-800',
      tableware: 'bg-pink-100 text-pink-800',
      beverages: 'bg-indigo-100 text-indigo-800',
      desserts: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };
    
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="search">Search Add-Ons</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by name, description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="categoryFilter">Category</Label>
          <select
            id="categoryFilter"
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="activeFilter">Status</Label>
          <select
            id="activeFilter"
            value={activeFilter ? 'active' : 'all'}
            onChange={(e) => onActiveFilterChange(e.target.value === 'active')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button
            onClick={() => {
              onSearchChange('');
              onCategoryFilterChange('all');
              onActiveFilterChange(true);
            }}
            variant="outline"
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAddons.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-blue-900">
              {selectedAddons.size} add-on(s) selected
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction('activate', Array.from(selectedAddons))}
              >
                Activate Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction('deactivate', Array.from(selectedAddons))}
              >
                Deactivate Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction('delete', Array.from(selectedAddons))}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add-Ons Table */}
      {addons.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">No add-ons found</div>
          <div className="text-gray-400 text-sm">
            {searchQuery || categoryFilter !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'Create your first catering add-on to get started'
            }
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 font-medium text-gray-900">
                  <input
                    type="checkbox"
                    checked={selectedAddons.size === addons.length && addons.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </th>
                <th className="text-left p-3 font-medium text-gray-900">Name</th>
                <th className="text-left p-3 font-medium text-gray-900">Price</th>
                <th className="text-left p-3 font-medium text-gray-900">Category</th>
                <th className="text-left p-3 font-medium text-gray-900">Status</th>
                <th className="text-left p-3 font-medium text-gray-900">Created</th>
                <th className="text-right p-3 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {addons.map((addon) => (
                <tr 
                  key={addon.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedAddons.has(addon.id)}
                      onChange={() => handleSelectOne(addon.id)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium text-gray-900">{addon.name}</div>
                      {addon.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {addon.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(addon.priceCents)}
                    </span>
                  </td>
                  <td className="p-3">
                    {addon.category ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(addon.category)}`}>
                        {addon.category.charAt(0).toUpperCase() + addon.category.slice(1)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">No Category</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      addon.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {addon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(addon.createdAt)}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(addon)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(addon.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-500 text-center">
        Showing {addons.length} add-on{addons.length !== 1 ? 's' : ''}
        {searchQuery && (
          <span> matching "{searchQuery}"</span>
        )}
        {categoryFilter !== 'all' && (
          <span> in "{categoryFilter}" category</span>
        )}
      </div>
    </div>
  );
}