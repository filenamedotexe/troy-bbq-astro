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
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      setIsLoadingMeta(true);
      
      // For now, we'll load categories and collections from the initial products
      // In a full implementation, you might have separate API endpoints for these
      
      // Extract unique categories from products
      const uniqueCategories = new Map<string, ProductCategory>();
      const uniqueCollections = new Map<string, ProductCollection>();

      // If we have initial products, extract metadata from them
      if (initialProducts.length > 0) {
        initialProducts.forEach(product => {
          product.categories?.forEach(category => {
            uniqueCategories.set(category.id, category);
          });

          if (product.collection) {
            uniqueCollections.set(product.collection.id, product.collection);
          }
        });
      } else {
        // Fetch some products to get metadata
        try {
          const response = await ProductService.listProducts({
            limit: 50,
            fields: 'id,*categories,*collection'
          });

          response.products?.forEach(product => {
            product.categories?.forEach(category => {
              uniqueCategories.set(category.id, category);
            });

            if (product.collection) {
              uniqueCollections.set(product.collection.id, product.collection);
            }
          });
        } catch (error) {
          console.error('Error loading product metadata:', error);
        }
      }

      setCategories(Array.from(uniqueCategories.values()));
      setCollections(Array.from(uniqueCollections.values()));
    } finally {
      setIsLoadingMeta(false);
    }
  };

  const handleAddToCart = async (productId: string, variantId: string) => {
    try {
      await addToCart(productId, variantId, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const handleViewProduct = (productId: string) => {
    // Navigate to product detail page (to be implemented)
    console.log('View product:', productId);
    alert(`Product detail page for ${productId} will be implemented in a future phase.`);
  };

  if (isLoadingMeta) {
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
      initialProducts={initialProducts}
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