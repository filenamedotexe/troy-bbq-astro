import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Badge } from '../../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/Dialog';
import { Switch } from '../../ui/Switch';
import { toast } from 'react-hot-toast';
import {
  Zap,
  DollarSign,
  Eye,
  EyeOff,
  Copy,
  Tag,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Calculator,
  TrendingUp,
  Package,
  ShoppingCart,
  Star,
  ChefHat,
  Flame,
  Leaf
} from 'lucide-react';
import type { DatabaseProduct } from '../../../types';

// Quick action schemas
const bulkPriceUpdateSchema = z.object({
  action: z.enum(['increase', 'decrease', 'set']),
  value: z.number().min(0),
  unit: z.enum(['percent', 'cents']),
  applyToAllVariants: z.boolean().default(true),
  roundToNearest: z.number().optional()
});

const bulkStatusUpdateSchema = z.object({
  status: z.enum(['draft', 'proposed', 'published', 'rejected']),
  notify: z.boolean().default(false)
});

const bulkCategoryAssignmentSchema = z.object({
  categoryIds: z.array(z.string()).min(1, 'Select at least one category'),
  action: z.enum(['add', 'replace', 'remove'])
});

const bulkInventoryUpdateSchema = z.object({
  action: z.enum(['set', 'adjust']),
  quantity: z.number().int(),
  enableTracking: z.boolean().optional(),
  allowBackorders: z.boolean().optional()
});

const duplicateProductSchema = z.object({
  titleSuffix: z.string().default(' (Copy)'),
  duplicateImages: z.boolean().default(true),
  duplicateVariants: z.boolean().default(true),
  newStatus: z.enum(['draft', 'proposed', 'published', 'rejected']).default('draft')
});

type BulkPriceUpdateInput = z.infer<typeof bulkPriceUpdateSchema>;
type BulkStatusUpdateInput = z.infer<typeof bulkStatusUpdateSchema>;
type BulkCategoryAssignmentInput = z.infer<typeof bulkCategoryAssignmentSchema>;
type BulkInventoryUpdateInput = z.infer<typeof bulkInventoryUpdateSchema>;
type DuplicateProductInput = z.infer<typeof duplicateProductSchema>;

interface QuickActionsProps {
  selectedProducts: string[];
  products: DatabaseProduct[];
  onBulkAction: (action: string, productIds: string[], data?: any) => Promise<void>;
  onRefresh: () => void;
  categories: Array<{ id: string; name: string }>;
}

interface QuickActionCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  requiresSelection: boolean;
  minSelection?: number;
  maxSelection?: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  selectedProducts,
  products,
  onBulkAction,
  onRefresh,
  categories
}) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get selected product data
  const selectedProductData = products.filter(p => selectedProducts.includes(p.id));
  const hasSelection = selectedProducts.length > 0;
  const selectionCount = selectedProducts.length;

  // Quick action definitions
  const quickActions: QuickActionCard[] = [
    {
      id: 'bulk-price-update',
      title: 'Bulk Price Update',
      description: 'Update prices across multiple products',
      icon: DollarSign,
      color: 'bg-green-100 text-green-800 border-green-200',
      requiresSelection: true,
      minSelection: 1
    },
    {
      id: 'bulk-publish',
      title: 'Quick Publish',
      description: 'Publish selected products',
      icon: Eye,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      requiresSelection: true,
      minSelection: 1
    },
    {
      id: 'bulk-unpublish',
      title: 'Quick Unpublish',
      description: 'Unpublish selected products',
      icon: EyeOff,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      requiresSelection: true,
      minSelection: 1
    },
    {
      id: 'duplicate-products',
      title: 'Duplicate Products',
      description: 'Create copies of selected products',
      icon: Copy,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      requiresSelection: true,
      minSelection: 1,
      maxSelection: 5
    },
    {
      id: 'bulk-category-assignment',
      title: 'Category Assignment',
      description: 'Add/remove categories in bulk',
      icon: Tag,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      requiresSelection: true,
      minSelection: 1
    },
    {
      id: 'bulk-inventory-update',
      title: 'Inventory Update',
      description: 'Update inventory levels',
      icon: BarChart3,
      color: 'bg-teal-100 text-teal-800 border-teal-200',
      requiresSelection: true,
      minSelection: 1
    },
    {
      id: 'special-markers',
      title: 'Special Markers',
      description: 'Mark items as specials/featured',
      icon: Star,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      requiresSelection: true,
      minSelection: 1
    },
    {
      id: 'dietary-tags',
      title: 'Dietary Tags',
      description: 'Add dietary restriction tags',
      icon: Leaf,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      requiresSelection: true,
      minSelection: 1
    }
  ];

  // Handle quick actions
  const handleQuickAction = useCallback(async (actionId: string) => {
    if (!hasSelection && quickActions.find(a => a.id === actionId)?.requiresSelection) {
      toast.error('Please select products first');
      return;
    }

    switch (actionId) {
      case 'bulk-publish':
        await handleBulkStatusUpdate('published');
        break;
      case 'bulk-unpublish':
        await handleBulkStatusUpdate('draft');
        break;
      default:
        setActiveAction(actionId);
    }
  }, [hasSelection, selectedProducts]);

  // Handle bulk status update
  const handleBulkStatusUpdate = useCallback(async (status: string) => {
    if (!hasSelection) return;

    setIsProcessing(true);
    try {
      await onBulkAction('updateStatus', selectedProducts, { status });
      toast.success(`${selectionCount} product${selectionCount !== 1 ? 's' : ''} ${status === 'published' ? 'published' : 'unpublished'}`);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update products');
    } finally {
      setIsProcessing(false);
    }
  }, [hasSelection, selectedProducts, selectionCount, onBulkAction, onRefresh]);

  // Bulk Price Update Component
  const BulkPriceUpdateForm = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm<BulkPriceUpdateInput>({
      resolver: zodResolver(bulkPriceUpdateSchema),
      defaultValues: {
        action: 'increase',
        value: 0,
        unit: 'percent',
        applyToAllVariants: true
      }
    });

    const watchedAction = watch('action');
    const watchedUnit = watch('unit');

    const onSubmit = async (data: BulkPriceUpdateInput) => {
      setIsProcessing(true);
      try {
        await onBulkAction('updatePrices', selectedProducts, data);
        toast.success('Prices updated successfully');
        setActiveAction(null);
        onRefresh();
      } catch (error) {
        toast.error('Failed to update prices');
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Action</Label>
            <select {...register('action')} className="w-full px-3 py-2 border rounded-md">
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
              <option value="set">Set to</option>
            </select>
          </div>
          <div>
            <Label>Unit</Label>
            <select {...register('unit')} className="w-full px-3 py-2 border rounded-md">
              <option value="percent">Percentage</option>
              <option value="cents">Cents</option>
            </select>
          </div>
        </div>

        <div>
          <Label>
            Value {watchedUnit === 'percent' ? '(%)' : '(cents)'}
          </Label>
          <Input
            type="number"
            {...register('value', { valueAsNumber: true })}
            placeholder={watchedUnit === 'percent' ? '10' : '100'}
            min="0"
            step={watchedUnit === 'percent' ? '0.1' : '1'}
          />
          {errors.value && <p className="text-red-500 text-sm">{errors.value.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input type="checkbox" {...register('applyToAllVariants')} />
            <Label>Apply to all variants</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setActiveAction(null)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? 'Updating...' : `Update ${selectionCount} Products`}
          </Button>
        </div>
      </form>
    );
  };

  // Category Assignment Component
  const CategoryAssignmentForm = () => {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BulkCategoryAssignmentInput>({
      resolver: zodResolver(bulkCategoryAssignmentSchema),
      defaultValues: {
        action: 'add',
        categoryIds: []
      }
    });

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const onSubmit = async (data: BulkCategoryAssignmentInput) => {
      setIsProcessing(true);
      try {
        await onBulkAction('updateCategories', selectedProducts, {
          ...data,
          categoryIds: selectedCategories
        });
        toast.success('Categories updated successfully');
        setActiveAction(null);
        onRefresh();
      } catch (error) {
        toast.error('Failed to update categories');
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Action</Label>
          <select {...register('action')} className="w-full px-3 py-2 border rounded-md">
            <option value="add">Add categories</option>
            <option value="replace">Replace categories</option>
            <option value="remove">Remove categories</option>
          </select>
        </div>

        <div>
          <Label>Select Categories</Label>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories(prev => [...prev, category.id]);
                    } else {
                      setSelectedCategories(prev => prev.filter(id => id !== category.id));
                    }
                  }}
                />
                <Label>{category.name}</Label>
              </div>
            ))}
          </div>
          {selectedCategories.length === 0 && (
            <p className="text-red-500 text-sm mt-1">Select at least one category</p>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setActiveAction(null)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isProcessing || selectedCategories.length === 0}>
            {isProcessing ? 'Updating...' : `Update ${selectionCount} Products`}
          </Button>
        </div>
      </form>
    );
  };

  // Special Markers Component
  const SpecialMarkersForm = () => {
    const [markers, setMarkers] = useState({
      isDailySpecial: false,
      isSeasonalItem: false,
      chefChoice: false,
      isFeatured: false
    });

    const handleSubmit = async () => {
      setIsProcessing(true);
      try {
        await onBulkAction('updateSpecialMarkers', selectedProducts, markers);
        toast.success('Special markers updated successfully');
        setActiveAction(null);
        onRefresh();
      } catch (error) {
        toast.error('Failed to update special markers');
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {Object.entries(markers).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label>
                {key === 'isDailySpecial' && 'Daily Special'}
                {key === 'isSeasonalItem' && 'Seasonal Item'}
                {key === 'chefChoice' && "Chef's Choice"}
                {key === 'isFeatured' && 'Featured Item'}
              </Label>
              <Switch
                checked={value}
                onCheckedChange={(checked) =>
                  setMarkers(prev => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setActiveAction(null)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? 'Updating...' : `Update ${selectionCount} Products`}
          </Button>
        </div>
      </div>
    );
  };

  // Dietary Tags Component
  const DietaryTagsForm = () => {
    const [dietaryTags, setDietaryTags] = useState({
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false,
      nutFree: false
    });

    const handleSubmit = async () => {
      setIsProcessing(true);
      try {
        await onBulkAction('updateDietaryTags', selectedProducts, dietaryTags);
        toast.success('Dietary tags updated successfully');
        setActiveAction(null);
        onRefresh();
      } catch (error) {
        toast.error('Failed to update dietary tags');
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(dietaryTags).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                {key === 'vegetarian' && 'Vegetarian'}
                {key === 'vegan' && 'Vegan'}
                {key === 'glutenFree' && 'Gluten Free'}
                {key === 'dairyFree' && 'Dairy Free'}
                {key === 'nutFree' && 'Nut Free'}
              </Label>
              <Switch
                checked={value}
                onCheckedChange={(checked) =>
                  setDietaryTags(prev => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setActiveAction(null)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? 'Updating...' : `Update ${selectionCount} Products`}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
        </div>
        {hasSelection && (
          <Badge className="bg-red-100 text-red-800">
            {selectionCount} product{selectionCount !== 1 ? 's' : ''} selected
          </Badge>
        )}
      </div>

      {/* Selection Status */}
      {!hasSelection && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800">
                Select one or more products from the list to enable bulk actions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map(action => {
          const isEnabled = hasSelection || !action.requiresSelection;
          const meetsMinSelection = !action.minSelection || selectionCount >= action.minSelection;
          const meetsMaxSelection = !action.maxSelection || selectionCount <= action.maxSelection;
          const isActionAvailable = isEnabled && meetsMinSelection && meetsMaxSelection;

          return (
            <Card
              key={action.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActionAvailable ? action.color : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => isActionAvailable && handleQuickAction(action.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <action.icon className="h-5 w-5" />
                  <h3 className="font-medium">{action.title}</h3>
                </div>
                <p className="text-sm opacity-80">{action.description}</p>
                {action.requiresSelection && (
                  <div className="mt-2 text-xs">
                    {action.minSelection && (
                      <span>Min: {action.minSelection}</span>
                    )}
                    {action.maxSelection && (
                      <span className="ml-2">Max: {action.maxSelection}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Modals */}
      <Dialog open={activeAction !== null} onOpenChange={() => setActiveAction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {activeAction === 'bulk-price-update' && 'Bulk Price Update'}
              {activeAction === 'bulk-category-assignment' && 'Category Assignment'}
              {activeAction === 'special-markers' && 'Special Markers'}
              {activeAction === 'dietary-tags' && 'Dietary Tags'}
              {activeAction === 'bulk-inventory-update' && 'Inventory Update'}
              {activeAction === 'duplicate-products' && 'Duplicate Products'}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {activeAction === 'bulk-price-update' && <BulkPriceUpdateForm />}
            {activeAction === 'bulk-category-assignment' && <CategoryAssignmentForm />}
            {activeAction === 'special-markers' && <SpecialMarkersForm />}
            {activeAction === 'dietary-tags' && <DietaryTagsForm />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Stats */}
      {hasSelection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Selection Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Products</p>
                <p className="font-medium">{selectionCount}</p>
              </div>
              <div>
                <p className="text-gray-600">Published</p>
                <p className="font-medium">
                  {selectedProductData.filter(p => p.status === 'published').length}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Draft</p>
                <p className="font-medium">
                  {selectedProductData.filter(p => p.status === 'draft').length}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Avg. Variants</p>
                <p className="font-medium">
                  {selectedProductData.length > 0
                    ? Math.round(selectedProductData.reduce((acc, p) => acc + (p as any).variants?.length || 1, 0) / selectedProductData.length)
                    : 0
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickActions;