import React, { useState, useEffect, useCallback } from 'react';
import CategoryTree, { type Category } from './CategoryTree';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Textarea } from '../../ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/Dialog';
import { Switch } from '../../ui/Switch';
import { Badge } from '../../ui/Badge';
import { PageLoadingState, ErrorState } from '../shared/AdminLoadingStates';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Search,
  Folder,
  FolderPlus,
  Settings,
  BarChart3,
  Package
} from 'lucide-react';

interface CategoryManagementWrapperProps {
  className?: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  parent_id?: string;
  is_active: boolean;
  sort_order: number;
}

const CategoryManagementWrapper: React.FC<CategoryManagementWrapperProps> = ({
  className
}) => {
  // State management
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_id: undefined,
    is_active: true,
    sort_order: 0
  });

  // Statistics
  const [stats, setStats] = useState({
    total_categories: 0,
    active_categories: 0,
    categories_with_products: 0,
    total_products: 0
  });

  // Load categories from API
  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/categories');

      if (!response.ok) {
        throw new Error('Failed to load categories');
      }

      const data = await response.json();
      setCategories(data.categories || []);

      // Calculate statistics
      const totalCategories = data.categories.length;
      const activeCategories = data.categories.filter((cat: Category) => cat.is_active).length;
      const categoriesWithProducts = data.categories.filter((cat: Category) => (cat.product_count || 0) > 0).length;
      const totalProducts = data.categories.reduce((sum: number, cat: Category) => sum + (cat.product_count || 0), 0);

      setStats({
        total_categories: totalCategories,
        active_categories: activeCategories,
        categories_with_products: categoriesWithProducts,
        total_products: totalProducts
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadCategories();
  }, []);

  // Handle create category
  const handleCreateCategory = useCallback((parentId?: string) => {
    setSelectedParentId(parentId || null);
    setFormData({
      name: '',
      description: '',
      parent_id: parentId,
      is_active: true,
      sort_order: 0
    });
    setCreateModalOpen(true);
  }, []);

  // Handle edit category
  const handleEditCategory = useCallback((categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setSelectedCategoryId(categoryId);
      setFormData({
        name: category.name,
        description: category.description || '',
        parent_id: category.parent_id,
        is_active: category.is_active,
        sort_order: category.sort_order
      });
      setEditModalOpen(true);
    }
  }, [categories]);

  // Handle delete category
  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete category');
      }

      toast.success('Category deleted successfully');
      await loadCategories(); // Reload categories
    } catch (error) {
      console.error('Delete category error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  }, []);

  // Handle move category
  const handleMoveCategory = useCallback(async (categoryId: string, newParentId?: string, newSortOrder?: number) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent_id: newParentId,
          sort_order: newSortOrder
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to move category');
      }

      toast.success('Category moved successfully');
      await loadCategories(); // Reload categories
    } catch (error) {
      console.error('Move category error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to move category');
    }
  }, []);

  // Handle form submission
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const isEdit = !!selectedCategoryId;
      const url = isEdit
        ? `/api/admin/categories/${selectedCategoryId}`
        : '/api/admin/categories';

      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${isEdit ? 'update' : 'create'} category`);
      }

      toast.success(`Category ${isEdit ? 'updated' : 'created'} successfully`);

      // Close modals and reload
      setCreateModalOpen(false);
      setEditModalOpen(false);
      setSelectedCategoryId(null);
      setSelectedParentId(null);
      await loadCategories();

    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle modal close
  const handleCloseModals = () => {
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setSelectedCategoryId(null);
    setSelectedParentId(null);
  };

  if (loading && categories.length === 0) {
    return <PageLoadingState message="Loading categories..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load categories"
        message={error}
        onRetry={loadCategories}
      />
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-1">
            Organize your products with hierarchical categories
          </p>
        </div>
        <Button onClick={() => handleCreateCategory()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Folder className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Categories</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total_categories}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FolderPlus className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Categories</p>
              <p className="text-xl font-semibold text-gray-900">{stats.active_categories}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With Products</p>
              <p className="text-xl font-semibold text-gray-900">{stats.categories_with_products}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total_products}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Tree */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CategoryTree
          categories={filteredCategories}
          onCreateCategory={handleCreateCategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onMoveCategory={handleMoveCategory}
          loading={loading}
        />
      </div>

      {/* Create Category Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Category
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter category name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional category description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active Category</Label>
            </div>

            {selectedParentId && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  This will be created as a subcategory
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Create Category
              </Button>
              <Button type="button" variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Edit Category
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Category Name *</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter category name"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional category description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit_sort_order">Sort Order</Label>
              <Input
                id="edit_sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="edit_is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="edit_is_active">Active Category</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Update Category
              </Button>
              <Button type="button" variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagementWrapper;