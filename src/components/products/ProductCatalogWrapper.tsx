import React, { useState, useEffect } from 'react';
import ProductCatalog from './ProductCatalog';
import AppProviders from '../providers/AppProviders';
import { ProductService } from '../../lib/medusa';
import { useCart } from '../../contexts/CartContext';
import type { Product, ProductCategory, ProductCollection } from '../../types';

interface ProductCatalogWrapperProps {
  initialProducts?: Product[];
}

function ProductCatalogContent({ initialProducts = [] }: ProductCatalogWrapperProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(initialProducts.length === 0);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    loadMetadata();
    if (initialProducts.length === 0) {
      loadProducts();
    }
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await ProductService.listProducts({
        limit: 50,
        status: ['published']
      });

      if (response.products) {
        setProducts(response.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Keep empty array as fallback
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadMetadata = async () => {
    try {
      setIsLoadingMeta(true);

      // Load categories and collections from dedicated API endpoints
      const [categoriesResponse, collectionsResponse] = await Promise.allSettled([
        ProductService.getCategories({ limit: 100 }),
        ProductService.getCollections({ limit: 100 })
      ]);

      // Process categories
      if (categoriesResponse.status === 'fulfilled' && categoriesResponse.value.categories) {
        setCategories(categoriesResponse.value.categories);
      } else {
        console.error('Error loading categories:', categoriesResponse.status === 'rejected' ? categoriesResponse.reason : 'Unknown error');
        // Fallback: extract categories from loaded products if available
        if (products.length > 0) {
          const uniqueCategories = new Map<string, ProductCategory>();
          products.forEach(product => {
            product.categories?.forEach(category => {
              uniqueCategories.set(category.id, category);
            });
          });
          setCategories(Array.from(uniqueCategories.values()));
        }
      }

      // Process collections
      if (collectionsResponse.status === 'fulfilled' && collectionsResponse.value.collections) {
        setCollections(collectionsResponse.value.collections);
      } else {
        console.error('Error loading collections:', collectionsResponse.status === 'rejected' ? collectionsResponse.reason : 'Unknown error');
        // Fallback: extract collections from loaded products if available
        if (products.length > 0) {
          const uniqueCollections = new Map<string, ProductCollection>();
          products.forEach(product => {
            if (product.collection) {
              uniqueCollections.set(product.collection.id, product.collection);
            }
          });
          setCollections(Array.from(uniqueCollections.values()));
        }
      }
    } catch (error) {
      console.error('Error loading metadata:', error);
      // Final fallback: use empty arrays but don't block the UI
      setCategories([]);
      setCollections([]);
    } finally {
      setIsLoadingMeta(false);
    }
  };

  const handleAddToCart = async (productId: string, variantId: string) => {
    try {
      await addToCart(productId, variantId, 1);
      // Optional: Show success message
      console.log('Successfully added item to cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // More user-friendly error handling
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart. Please try again.';
      alert(errorMessage);
    }
  };

  const handleViewProduct = (productId: string) => {
    // Navigate to product detail page (to be implemented)
    console.log('View product:', productId);
    alert(`Product detail page for ${productId} will be implemented in a future phase.`);
  };

  if (isLoadingProducts || isLoadingMeta) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-300 rounded mb-4"></div>
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="bg-gray-300 aspect-square rounded-lg"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProductCatalog
      initialProducts={products}
      categories={categories}
      collections={collections}
      onAddToCart={handleAddToCart}
      onViewProduct={handleViewProduct}
    />
  );
}

export default function ProductCatalogWrapper({ initialProducts = [] }: ProductCatalogWrapperProps) {
  return (
    <AppProviders>
      <ProductCatalogContent initialProducts={initialProducts} />
    </AppProviders>
  );
}