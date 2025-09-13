import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface Column<T> {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
  };
  sorting?: {
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    onSortChange: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
  };
  selection?: {
    selectedItems: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    getItemId: (item: T) => string;
  };
  search?: {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    placeholder?: string;
  };
  actions?: React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
}

function AdminDataTable<T>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  selection,
  search,
  actions,
  emptyState,
  className
}: DataTableProps<T>) {
  const [selectAll, setSelectAll] = useState(false);

  // Handle select all functionality
  const handleSelectAll = (checked: boolean) => {
    if (!selection) return;

    setSelectAll(checked);
    if (checked) {
      const allIds = data.map(selection.getItemId);
      selection.onSelectionChange(allIds);
    } else {
      selection.onSelectionChange([]);
    }
  };

  // Handle individual item selection
  const handleItemSelect = (itemId: string, checked: boolean) => {
    if (!selection) return;

    const currentSelected = selection.selectedItems;
    let newSelected: string[];

    if (checked) {
      newSelected = [...currentSelected, itemId];
    } else {
      newSelected = currentSelected.filter(id => id !== itemId);
      setSelectAll(false);
    }

    selection.onSelectionChange(newSelected);
  };

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (!sorting) return;

    let newSortOrder: 'ASC' | 'DESC' = 'ASC';
    if (sorting.sortBy === columnKey && sorting.sortOrder === 'ASC') {
      newSortOrder = 'DESC';
    }

    sorting.onSortChange(columnKey, newSortOrder);
  };

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (!sorting || sorting.sortBy !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }

    return sorting.sortOrder === 'ASC'
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  // Calculate if all items are selected
  const allSelected = useMemo(() => {
    if (!selection || data.length === 0) return false;
    return data.every(item => selection.selectedItems.includes(selection.getItemId(item)));
  }, [selection?.selectedItems, data, selection?.getItemId]);

  // Calculate if some items are selected (indeterminate state)
  const someSelected = useMemo(() => {
    if (!selection || data.length === 0) return false;
    return selection.selectedItems.length > 0 && !allSelected;
  }, [selection?.selectedItems, allSelected]);

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {columns.map((column, j) => (
            <div
              key={`${i}-${j}`}
              className="h-4 bg-gray-200 rounded animate-pulse"
              style={{ width: column.width || `${100 / columns.length}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with search and actions */}
      {(search || actions) && (
        <div className="flex items-center justify-between gap-4">
          {search && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={search.placeholder || "Search..."}
                value={search.searchTerm}
                onChange={(e) => search.onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Selection info */}
      {selection && selection.selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selection.selectedItems.length} item{selection.selectedItems.length !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selection.onSelectionChange([])}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear selection
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {selection && (
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                      column.className,
                      column.sortable && "cursor-pointer hover:bg-gray-100"
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.title}
                      {column.sortable && renderSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (selection ? 1 : 0)} className="px-4 py-8">
                    <LoadingSkeleton />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selection ? 1 : 0)} className="px-4 py-8 text-center">
                    {emptyState || (
                      <div className="text-gray-500">
                        <p className="text-lg font-medium">No data found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => {
                  const itemId = selection?.getItemId(item);
                  const isSelected = itemId ? selection?.selectedItems.includes(itemId) : false;

                  return (
                    <tr
                      key={itemId || index}
                      className={cn(
                        "hover:bg-gray-50 transition-colors",
                        isSelected && "bg-blue-50"
                      )}
                    >
                      {selection && itemId && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleItemSelect(itemId, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn("px-4 py-4 text-sm", column.className)}
                          style={{ width: column.width }}
                        >
                          {column.render
                            ? column.render(item[column.key as keyof T], item, index)
                            : String(item[column.key as keyof T] || '')
                          }
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} results
            </span>
            {pagination.onItemsPerPageChange && (
              <div className="flex items-center gap-2 ml-4">
                <span>Items per page:</span>
                <select
                  value={pagination.itemsPerPage}
                  onChange={(e) => pagination.onItemsPerPageChange!(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {[10, 25, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum = i + 1;

                // Calculate page numbers to show
                if (pagination.totalPages > 5) {
                  const start = Math.max(1, pagination.currentPage - 2);
                  const end = Math.min(pagination.totalPages, start + 4);
                  pageNum = start + i;

                  if (pageNum > end) return null;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => pagination.onPageChange(pageNum)}
                    className="min-w-[32px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDataTable;