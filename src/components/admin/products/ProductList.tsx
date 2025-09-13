import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import AdminDataTable, { type Column } from '../shared/AdminDataTable';
import AdminSearchBar, { type QuickFilter, type SortOption } from '../shared/AdminSearchBar';
import AdminBulkOperations, { getProductBulkActions } from '../shared/AdminBulkOperations';
import { PageLoadingState, ErrorState, EmptyState } from '../shared/AdminLoadingStates';
import {
  Plus,
  Package,
  Eye,
  Edit,
  Image as ImageIcon,
  DollarSign,
  ShoppingCart,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type {
  DatabaseProduct,
  DatabaseProductVariant,
  DatabaseProductImage,
  DatabaseProductCategory,
  ProductQueryFilters,
  ProductListQueryResponse
} from '../../../types';

export interface ProductListProps {
  onCreateProduct?: () => void;
  onEditProduct?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  onBulkAction?: (action: string, productIds: string[]) => Promise<void>;
  className?: string;
}

interface ExtendedProduct extends DatabaseProduct {
  variants: DatabaseProductVariant[];
  images: DatabaseProductImage[];
  categories: DatabaseProductCategory[];
  primaryVariant?: DatabaseProductVariant;
  priceRange?: {
    min: number;
    max: number;
  };
}

const ProductList: React.FC<ProductListProps> = ({
  onCreateProduct,
  onEditProduct,
  onViewProduct,
  onBulkAction,
  className
}) => {
  // State management
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Filters and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductQueryFilters>({
    search: '',
    status: [],
    sort_by: 'created_at',
    sort_order: 'DESC',
    limit: 50,
    offset: 0
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50
  });

  // Load products from API
  const loadProducts = async (newFilters?: Partial<ProductQueryFilters>) => {
    setLoading(true);
    setError(null);

    try {
      const queryFilters = { ...filters, ...newFilters };
      const response = await fetch('/api/admin/products?' + new URLSearchParams({
        ...queryFilters,
        limit: queryFilters.limit?.toString() || '50',
        offset: queryFilters.offset?.toString() || '0'
      }));

      if (!response.ok) {
        throw new Error('Failed to load products');
      }

      const data: ProductListQueryResponse = await response.json();

      // Transform data to include calculated fields
      const transformedProducts: ExtendedProduct[] = data.products.map(product => {
        const primaryVariant = product.variants.find(v => v.variant_rank === 0) || product.variants[0];

        let priceRange;
        if (product.variants.length > 0) {
          const prices = product.variants.map(v => v.price_cents);
          priceRange = {
            min: Math.min(...prices),
            max: Math.max(...prices)
          };
        }

        return {
          ...product,
          primaryVariant,
          priceRange
        };
      });

      setProducts(transformedProducts);
      setPagination({
        currentPage: Math.floor((queryFilters.offset || 0) / (queryFilters.limit || 50)) + 1,
        totalPages: Math.ceil(data.total_count / (queryFilters.limit || 50)),
        totalItems: data.total_count,
        itemsPerPage: queryFilters.limit || 50
      });

      setFilters(queryFilters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadProducts();
  }, []);

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    loadProducts({
      search: term,
      offset: 0
    });
  };

  // Handle sorting
  const handleSort = (sortBy: string, sortOrder: 'ASC' | 'DESC') => {
    loadProducts({
      sort_by: sortBy as any,
      sort_order: sortOrder,
      offset: 0
    });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * pagination.itemsPerPage;
    loadProducts({ offset: newOffset });
  };

  // Handle items per page change
  const handleItemsPerPageChange = (itemsPerPage: number) => {
    loadProducts({
      limit: itemsPerPage,
      offset: 0
    });
  };

  // Handle quick filters
  const handleQuickFilterToggle = (filterKey: string) => {
    let newStatusFilters = [...(filters.status || [])];

    if (newStatusFilters.includes(filterKey as any)) {
      newStatusFilters = newStatusFilters.filter(s => s !== filterKey);
    } else {
      newStatusFilters.push(filterKey as any);
    }

    loadProducts({
      status: newStatusFilters,
      offset: 0
    });
  };

  // Handle bulk operations
  const handleBulkAction = async (actionKey: string) => {
    if (onBulkAction && selectedProducts.length > 0) {
      try {
        await onBulkAction(actionKey, selectedProducts);
        setSelectedProducts([]);
        await loadProducts(); // Reload to reflect changes
      } catch (error) {
        console.error('Bulk action failed:', error);
      }
    }
  };

  // Format price
  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Render product status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      published: { label: 'Published', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      draft: { label: 'Draft', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
      proposed: { label: 'Proposed', variant: 'outline' as const, className: 'bg-blue-100 text-blue-800' },
      rejected: { label: 'Rejected', variant: 'outline' as const, className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Define table columns
  const columns: Column<ExtendedProduct>[] = [
    {
      key: 'product_info',
      title: 'Product',
      render: (_, product) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : product.images && product.images.length > 0 ? (
              <img
                src={product.images[0].url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-900 truncate">
              {product.title}
            </h4>
            {product.subtitle && (
              <p className="text-sm text-gray-500 truncate">
                {product.subtitle}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      ),
      width: '300px'
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (_, product) => renderStatusBadge(product.status),
      width: '120px'
    },
    {
      key: 'price',
      title: 'Price',
      sortable: true,
      render: (_, product) => {
        if (!product.priceRange) return '-';

        if (product.priceRange.min === product.priceRange.max) {
          return formatPrice(product.priceRange.min);
        }

        return `${formatPrice(product.priceRange.min)} - ${formatPrice(product.priceRange.max)}`;
      },
      width: '120px'
    },
    {
      key: 'inventory',
      title: 'Inventory',
      render: (_, product) => {
        const totalInventory = product.variants.reduce((sum, variant) =>
          sum + (variant.inventory_quantity || 0), 0
        );

        const lowStock = totalInventory < 10;

        return (
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-medium",
              lowStock && totalInventory > 0 && "text-yellow-600",
              totalInventory === 0 && "text-red-600"
            )}>
              {totalInventory}
            </span>
            {lowStock && totalInventory > 0 && (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        );
      },
      width: '100px'
    },
    {
      key: 'categories',
      title: 'Categories',
      render: (_, product) => {
        if (!product.categories || product.categories.length === 0) {
          return <span className="text-gray-400">Uncategorized</span>;
        }

        const firstCategory = product.categories[0];
        const remainingCount = product.categories.length - 1;

        return (
          <div className="flex items-center gap-1 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {firstCategory.name}
            </Badge>
            {remainingCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{remainingCount}
              </Badge>
            )}
          </div>
        );
      },
      width: '150px'
    },
    {
      key: 'updated_at',
      title: 'Last Updated',
      sortable: true,
      render: (_, product) => (
        <span className="text-sm text-gray-500">
          {new Date(product.updated_at).toLocaleDateString()}
        </span>
      ),
      width: '120px'
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, product) => (
        <div className="flex items-center gap-1">
          {onViewProduct && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewProduct(product.id)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEditProduct && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditProduct(product.id)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
      width: '100px'
    }
  ];

  // Quick filters
  const quickFilters: QuickFilter[] = [
    {
      key: 'published',
      label: 'Published',
      value: 'published',
      active: filters.status?.includes('published') || false
    },
    {
      key: 'draft',
      label: 'Draft',
      value: 'draft',
      active: filters.status?.includes('draft') || false
    },
    {
      key: 'proposed',
      label: 'Proposed',
      value: 'proposed',
      active: filters.status?.includes('proposed') || false
    }
  ];

  // Sort options
  const sortOptions: SortOption[] = [
    { key: 'created_at', label: 'Date Created' },
    { key: 'updated_at', label: 'Last Updated' },
    { key: 'title', label: 'Name' },
    { key: 'price_asc', label: 'Price (Low to High)' },
    { key: 'price_desc', label: 'Price (High to Low)' }
  ];

  if (loading && products.length === 0) {
    return <PageLoadingState message="Loading products..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load products"
        message={error}
        onRetry={() => loadProducts()}
      />
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your product catalog and inventory
          </p>
        </div>
        {onCreateProduct && (
          <Button onClick={onCreateProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Search and filters */}
      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        placeholder="Search products by name, SKU, or description..."
        quickFilters={quickFilters}
        onQuickFilterToggle={handleQuickFilterToggle}
        sortOptions={sortOptions}
        currentSort={filters.sort_by}
        sortDirection={filters.sort_order}
        onSortChange={handleSort}
        loading={loading}
      />

      {/* Data table */}
      <AdminDataTable
        data={products}
        columns={columns}
        loading={loading}
        pagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalItems: pagination.totalItems,
          itemsPerPage: pagination.itemsPerPage,
          onPageChange: handlePageChange,
          onItemsPerPageChange: handleItemsPerPageChange
        }}
        sorting={{
          sortBy: filters.sort_by || 'created_at',
          sortOrder: filters.sort_order || 'DESC',
          onSortChange: handleSort
        }}
        selection={{
          selectedItems: selectedProducts,
          onSelectionChange: setSelectedProducts,
          getItemId: (product) => product.id
        }}
        emptyState={
          <EmptyState
            icon={<Package className="h-8 w-8 text-gray-400" />}
            title="No products found"
            description={searchTerm ?
              "Try adjusting your search terms or filters" :
              "Get started by adding your first product"
            }
            action={onCreateProduct ? {
              label: "Add Product",
              onClick: onCreateProduct
            } : undefined}
          />
        }
      />

      {/* Bulk operations */}
      <AdminBulkOperations
        selectedCount={selectedProducts.length}
        totalCount={products.length}
        actions={getProductBulkActions()}
        onActionExecute={handleBulkAction}
        onClearSelection={() => setSelectedProducts([])}
        loading={loading}
      />
    </div>
  );
};

export default ProductList;