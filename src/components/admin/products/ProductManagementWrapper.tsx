import React, { useState, useCallback } from 'react';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import { Button } from '../../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/Dialog';
import { toast } from 'react-hot-toast';
import { Plus, Package } from 'lucide-react';
import type { CreateProductInput, UpdateProductInput, DatabaseProduct } from '../../../types';

interface ProductManagementWrapperProps {
  className?: string;
}

const ProductManagementWrapper: React.FC<ProductManagementWrapperProps> = ({
  className
}) => {
  // State for products and form
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Load products data
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle product creation
  const handleCreateProduct = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  // Handle product form submission (create)
  const handleCreateProductSubmit = useCallback(async (data: CreateProductInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      await loadProducts();
      setCreateModalOpen(false);
      toast.success('Product created successfully!');
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadProducts]);

  // Handle product editing
  const handleEditProduct = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setEditModalOpen(true);
  }, []);

  // Handle product form submission (edit)
  const handleEditProductSubmit = useCallback(async (data: UpdateProductInput) => {
    if (!selectedProductId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/products/${selectedProductId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product');
      }

      await loadProducts();
      setEditModalOpen(false);
      setSelectedProductId(null);
      toast.success('Product updated successfully!');
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedProductId, loadProducts]);

  // Handle product viewing
  const handleViewProduct = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setViewModalOpen(true);
  }, []);

  // Handle bulk operations
  const handleBulkAction = useCallback(async (action: string, productIds: string[]) => {
    try {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          product_ids: productIds
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Bulk operation failed');
      }

      const result = await response.json();

      // Show success message
      const actionLabels: Record<string, string> = {
        publish: 'published',
        unpublish: 'unpublished',
        delete: 'deleted',
        duplicate: 'duplicated'
      };

      const actionLabel = actionLabels[action] || action;
      toast.success(`${productIds.length} product${productIds.length !== 1 ? 's' : ''} ${actionLabel} successfully`);

      // Refresh products list
      await loadProducts();

    } catch (error) {
      console.error('Bulk operation error:', error);
      toast.error(error instanceof Error ? error.message : 'Bulk operation failed');
      throw error; // Re-throw to let ProductList handle it
    }
  }, [loadProducts]);

  // Handle modal close
  const handleCloseModals = useCallback(() => {
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setViewModalOpen(false);
    setSelectedProductId(null);
  }, []);

  // Load products on mount
  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div className={className}>
      {/* Main Product List */}
      <ProductList
        onCreateProduct={handleCreateProduct}
        onEditProduct={handleEditProduct}
        onViewProduct={handleViewProduct}
        onBulkAction={handleBulkAction}
      />

      {/* Create Product Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Product
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ProductForm
              mode="create"
              onSubmit={handleCreateProductSubmit}
              onCancel={handleCloseModals}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Edit Product
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedProductId && (
              <ProductForm
                mode="edit"
                product={products.find(p => p.id === selectedProductId)}
                onSubmit={handleEditProductSubmit}
                onCancel={handleCloseModals}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Product Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Details
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* TODO: Implement ProductDetails component */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Product Details View
              </h3>
              <p className="text-gray-600 mb-4">
                Product ID: {selectedProductId}
              </p>
              <p className="text-gray-600 mb-4">
                This will show comprehensive product details including:
              </p>
              <ul className="text-sm text-gray-500 text-left max-w-md mx-auto space-y-1">
                <li>• Product information and images</li>
                <li>• All variants and pricing</li>
                <li>• Inventory levels</li>
                <li>• Category assignments</li>
                <li>• Sales analytics</li>
                <li>• Review and rating data</li>
              </ul>
              <Button
                onClick={handleCloseModals}
                variant="outline"
                className="mt-4"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagementWrapper;