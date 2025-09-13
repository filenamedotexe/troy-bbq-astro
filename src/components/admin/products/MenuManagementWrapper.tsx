import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/Dialog';
import { Switch } from '../../ui/Switch';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { toast } from 'react-hot-toast';
import {
  Plus,
  ChefHat,
  Utensils,
  Calendar,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
  Star,
  Flame,
  Leaf,
  Shield,
  Settings,
  Filter,
  Search,
  Grid3X3,
  List,
  BarChart3,
  Package
} from 'lucide-react';
import ProductForm from './ProductForm';
import ProductList from './ProductList';
import QuickActions from './QuickActions';
import type {
  CreateProductInput,
  UpdateProductInput,
  DatabaseProduct,
  DatabaseProductCategory
} from '../../../types';

interface MenuManagementWrapperProps {
  className?: string;
}

interface MenuSection {
  id: string;
  name: string;
  handle: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
}

interface MenuStats {
  totalItems: number;
  publishedItems: number;
  draftItems: number;
  dailySpecials: number;
  seasonalItems: number;
  avgPrice: number;
  lowInventoryItems: number;
}

const MenuManagementWrapper: React.FC<MenuManagementWrapperProps> = ({ className }) => {
  // State management
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [categories, setCategories] = useState<DatabaseProductCategory[]>([]);
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlySpecials, setShowOnlySpecials] = useState(false);
  const [showOnlyLowInventory, setShowOnlyLowInventory] = useState(false);
  const [stats, setStats] = useState<MenuStats | null>(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default menu sections for restaurants
  const defaultMenuSections: Omit<MenuSection, 'productCount'>[] = [
    { id: 'appetizers', name: 'Appetizers', handle: 'appetizers', description: 'Starters and small plates', isActive: true, sortOrder: 1 },
    { id: 'mains', name: 'Main Dishes', handle: 'mains', description: 'Entrees and main courses', isActive: true, sortOrder: 2 },
    { id: 'sides', name: 'Sides', handle: 'sides', description: 'Side dishes and accompaniments', isActive: true, sortOrder: 3 },
    { id: 'desserts', name: 'Desserts', handle: 'desserts', description: 'Sweet treats and desserts', isActive: true, sortOrder: 4 },
    { id: 'beverages', name: 'Beverages', handle: 'beverages', description: 'Drinks and beverages', isActive: true, sortOrder: 5 },
    { id: 'specials', name: 'Daily Specials', handle: 'specials', description: 'Today\'s featured items', isActive: true, sortOrder: 6 }
  ];

  // Load initial data
  useEffect(() => {
    loadMenuData();
  }, []);

  // Calculate filtered products
  const filteredProducts = React.useMemo(() => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Section filter
    if (filterSection !== 'all') {
      filtered = filtered.filter(product => {
        const menuSection = product.metadata?.menuSection;
        return menuSection === filterSection;
      });
    }

    // Special items filter
    if (showOnlySpecials) {
      filtered = filtered.filter(product =>
        product.metadata?.isDailySpecial ||
        product.metadata?.chefChoice ||
        product.metadata?.isSeasonalItem
      );
    }

    // Low inventory filter
    if (showOnlyLowInventory) {
      filtered = filtered.filter(product => {
        // Check if any variant has low inventory
        return (product as any).variants?.some((variant: any) =>
          variant.manage_inventory && variant.inventory_quantity < 10
        );
      });
    }

    return filtered;
  }, [products, searchTerm, filterSection, showOnlySpecials, showOnlyLowInventory]);

  // Load menu data
  const loadMenuData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/products?limit=100'),
        fetch('/api/admin/categories')
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
        calculateStats(productsData.products || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }

      // Set up menu sections with product counts
      let productsData = [];
      if (productsRes.ok) {
        const productsJson = await productsRes.json();
        productsData = productsJson.products || [];
      }

      const sectionsWithCounts = defaultMenuSections.map(section => ({
        ...section,
        productCount: productsData.filter((p: any) => p.metadata?.menuSection === section.id).length || 0
      }));
      setMenuSections(sectionsWithCounts);

    } catch (error) {
      console.error('Failed to load menu data:', error);
      toast.error('Failed to load menu data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate menu statistics
  const calculateStats = useCallback((productsData: DatabaseProduct[]) => {
    const published = productsData.filter(p => p.status === 'published');
    const draft = productsData.filter(p => p.status === 'draft');
    const dailySpecials = productsData.filter(p => p.metadata?.isDailySpecial);
    const seasonalItems = productsData.filter(p => p.metadata?.isSeasonalItem);

    // Calculate average price from variants
    const allPrices = productsData.flatMap(p =>
      (p as any).variants?.map((v: any) => v.price_cents) || []
    ).filter(price => price > 0);
    const avgPrice = allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 0;

    // Find low inventory items
    const lowInventoryItems = productsData.filter(p =>
      (p as any).variants?.some((v: any) => v.manage_inventory && v.inventory_quantity < 10)
    );

    setStats({
      totalItems: productsData.length,
      publishedItems: published.length,
      draftItems: draft.length,
      dailySpecials: dailySpecials.length,
      seasonalItems: seasonalItems.length,
      avgPrice: avgPrice / 100, // Convert to dollars
      lowInventoryItems: lowInventoryItems.length
    });
  }, []);

  // Handle product creation
  const handleCreateProduct = useCallback(async (data: CreateProductInput) => {
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

      await loadMenuData();
      setCreateModalOpen(false);
      toast.success('Menu item created successfully!');
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadMenuData]);

  // Handle product update
  const handleUpdateProduct = useCallback(async (data: UpdateProductInput) => {
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

      await loadMenuData();
      setEditModalOpen(false);
      setSelectedProductId(null);
      toast.success('Menu item updated successfully!');
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedProductId, loadMenuData]);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action: string, productIds: string[], data?: any) => {
    try {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, product_ids: productIds, data })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Bulk operation failed');
      }

      await loadMenuData();
      setSelectedProducts([]);
    } catch (error) {
      console.error('Bulk action error:', error);
      throw error;
    }
  }, [loadMenuData]);

  // Handle product selection
  const handleEditProduct = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setEditModalOpen(true);
  }, []);

  // Handle product viewing (for now, same as edit)
  const handleViewProduct = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setEditModalOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2">Loading menu...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-gray-600">Manage your restaurant's menu items and offerings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setQuickActionsVisible(!quickActionsVisible)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Quick Actions
          </Button>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Menu Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-xl font-bold">{stats.totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-xl font-bold">{stats.publishedItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Draft</p>
                  <p className="text-xl font-bold">{stats.draftItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Specials</p>
                  <p className="text-xl font-bold">{stats.dailySpecials}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Seasonal</p>
                  <p className="text-xl font-bold">{stats.seasonalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg Price</p>
                  <p className="text-xl font-bold">${stats.avgPrice.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={stats.lowInventoryItems > 0 ? 'border-orange-200 bg-orange-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className={`h-4 w-4 ${stats.lowInventoryItems > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
                <div>
                  <p className="text-sm text-gray-600">Low Stock</p>
                  <p className="text-xl font-bold">{stats.lowInventoryItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Menu Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Menu Sections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button
              variant={filterSection === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterSection('all')}
              className="justify-start"
            >
              All Items ({products.length})
            </Button>
            {menuSections.map(section => (
              <Button
                key={section.id}
                variant={filterSection === section.id ? 'default' : 'outline'}
                onClick={() => setFilterSection(section.id)}
                className="justify-start"
              >
                {section.name} ({section.productCount})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showOnlySpecials}
                  onCheckedChange={setShowOnlySpecials}
                />
                <Label className="text-sm">Specials Only</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={showOnlyLowInventory}
                  onCheckedChange={setShowOnlyLowInventory}
                />
                <Label className="text-sm">Low Inventory</Label>
              </div>

              {/* View Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={currentView === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={currentView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Panel */}
      {quickActionsVisible && (
        <QuickActions
          selectedProducts={selectedProducts}
          products={filteredProducts}
          onBulkAction={handleBulkAction}
          onRefresh={loadMenuData}
          categories={categories.map(c => ({ id: c.id, name: c.name }))}
        />
      )}

      {/* Product List */}
      <ProductList
        onCreateProduct={() => setCreateModalOpen(true)}
        onEditProduct={handleEditProduct}
        onViewProduct={handleViewProduct}
        onBulkAction={handleBulkAction}
      />

      {/* Create Product Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Menu Item
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ProductForm
              mode="create"
              onSubmit={handleCreateProduct}
              onCancel={() => setCreateModalOpen(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Edit Menu Item
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedProductId && (
              <ProductForm
                mode="edit"
                product={products.find(p => p.id === selectedProductId)}
                onSubmit={handleUpdateProduct}
                onCancel={() => {
                  setEditModalOpen(false);
                  setSelectedProductId(null);
                }}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagementWrapper;