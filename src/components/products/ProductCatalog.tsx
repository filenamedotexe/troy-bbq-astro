import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import { Button } from '../ui/Button';
import { ProductService } from '../../lib/medusa';
import { debounce } from '../../lib/utils';
import type { 
  Product, 
  ProductFilters as ProductFiltersType, 
  ProductCategory, 
  ProductCollection 
} from '../../types';

interface ProductCatalogProps {
  initialProducts?: Product[];
  categories?: ProductCategory[];
  collections?: ProductCollection[];
  onAddToCart?: (productId: string, variantId: string) => void;
  onViewProduct?: (productId: string) => void;
}

export default function ProductCatalog({
  initialProducts = [],
  categories = [],
  collections = [],
  onAddToCart,
  onViewProduct
}: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFiltersType>({
    search: '',
    sort: 'created_at'
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(initialProducts.length);
  const productsPerPage = 12;

  // Calculate pagination
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const offset = (currentPage - 1) * productsPerPage;

  // Debounced search function
  const debouncedFetchProducts = useCallback(
    debounce(async (searchFilters: ProductFiltersType, pageOffset: number) => {
      await fetchProducts(searchFilters, pageOffset);
    }, 300),
    []
  );

  const fetchProducts = async (searchFilters: ProductFiltersType, pageOffset: number = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert our filters to MedusaJS API parameters
      const params: any = {
        limit: productsPerPage,
        offset: pageOffset,
        fields: 'id,*variants.prices,*collection,*categories,*tags,*images'
      };

      if (searchFilters.search?.trim()) {
        params.q = searchFilters.search.trim();
      }

      if (searchFilters.category_id?.length) {
        params.category_id = searchFilters.category_id;
      }

      if (searchFilters.collection_id?.length) {
        params.collection_id = searchFilters.collection_id;
      }

      if (searchFilters.tags?.length) {
        params.tags = searchFilters.tags;
      }

      const response = await ProductService.listProducts(params);
      
      if (response?.products) {
        // Apply client-side price filtering if needed (MedusaJS doesn't support price range filtering directly)
        let filteredProducts = response.products;
        
        if (searchFilters.price_min !== undefined || searchFilters.price_max !== undefined) {
          filteredProducts = response.products.filter(product => {
            const price = product.variants[0]?.prices.find(p => p.currency_code === 'usd')?.amount || 0;
            const priceInDollars = price / 100;
            
            if (searchFilters.price_min !== undefined && priceInDollars < searchFilters.price_min) {
              return false;
            }
            
            if (searchFilters.price_max !== undefined && priceInDollars > searchFilters.price_max) {
              return false;
            }
            
            return true;
          });
        }

        // Apply client-side sorting
        if (searchFilters.sort) {
          filteredProducts = [...filteredProducts].sort((a, b) => {
            switch (searchFilters.sort) {
              case 'title':
                return a.title.localeCompare(b.title);
              case 'price_asc': {
                const priceA = a.variants[0]?.prices.find(p => p.currency_code === 'usd')?.amount || 0;
                const priceB = b.variants[0]?.prices.find(p => p.currency_code === 'usd')?.amount || 0;
                return priceA - priceB;
              }
              case 'price_desc': {
                const priceA = a.variants[0]?.prices.find(p => p.currency_code === 'usd')?.amount || 0;
                const priceB = b.variants[0]?.prices.find(p => p.currency_code === 'usd')?.amount || 0;
                return priceB - priceA;
              }
              case 'created_at':
              default:
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
          });
        }

        setProducts(filteredProducts);
        setTotalProducts(response.count || filteredProducts.length);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: ProductFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    debouncedFetchProducts(newFilters, 0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const pageOffset = (page - 1) * productsPerPage;
    fetchProducts(filters, pageOffset);
    
    // Scroll to top of products
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Initial load when component mounts (if no initial products)
  useEffect(() => {
    if (initialProducts.length === 0) {
      fetchProducts(filters);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ProductFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={categories}
        collections={collections}
        isLoading={isLoading}
      />

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {isLoading ? (
            'Loading products...'
          ) : (
            `Showing ${products.length} of ${totalProducts} products`
          )}
        </p>
        
        {totalPages > 1 && (
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500 w-5 h-5" />
          <p className="text-red-800">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchProducts(filters, offset)}
            className="ml-auto"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-300 aspect-square rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">
            {filters.search || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : Boolean(v)) 
              ? 'Try adjusting your filters or search terms.'
              : 'No products are currently available.'}
          </p>
          {(filters.search || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : Boolean(v))) && (
            <Button 
              variant="outline" 
              onClick={() => setFilters({ search: '', sort: 'created_at' })}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onViewDetails={onViewProduct}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          {/* Page Numbers */}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = Math.max(1, currentPage - 2) + i;
              if (pageNumber > totalPages) return null;
              
              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  className="w-10"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}