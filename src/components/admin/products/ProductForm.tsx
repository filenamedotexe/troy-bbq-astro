import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Textarea } from '../../ui/Textarea';
import { Switch } from '../../ui/Switch';
import { Badge } from '../../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Minus,
  AlertTriangle,
  Package,
  ImageIcon,
  Tag,
  DollarSign,
  Scale,
  Ruler,
  BarChart3,
  Clock,
  ChefHat,
  Flame,
  Leaf,
  Shield
} from 'lucide-react';
import type {
  CreateProductInput,
  UpdateProductInput,
  DatabaseProduct,
  DatabaseProductCategory,
  DatabaseProductCollection
} from '../../../types';
import { createProductSchema, updateProductSchema } from '../../../lib/schemas';
import ProductImageManager from './ProductImageManager';

// Restaurant-specific metadata schema
const restaurantMetadataSchema = z.object({
  menuSection: z.enum(['appetizers', 'mains', 'sides', 'desserts', 'beverages', 'specials']).optional(),
  dietaryInfo: z.object({
    vegetarian: z.boolean().optional(),
    vegan: z.boolean().optional(),
    glutenFree: z.boolean().optional(),
    dairyFree: z.boolean().optional(),
    nutFree: z.boolean().optional(),
    containsAllergens: z.array(z.string()).optional()
  }).optional(),
  nutritionalInfo: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    fiber: z.number().optional(),
    sodium: z.number().optional()
  }).optional(),
  heatLevel: z.enum(['none', 'mild', 'medium', 'hot', 'extra-hot']).optional(),
  cookingTime: z.number().optional(), // in minutes
  isDailySpecial: z.boolean().optional(),
  isSeasonalItem: z.boolean().optional(),
  chefChoice: z.boolean().optional(),
  servingSize: z.string().optional(),
  preparationNotes: z.string().optional()
});

// Extended product schema for restaurant use
const restaurantProductSchema = createProductSchema.extend({
  metadata: restaurantMetadataSchema.optional().default({})
});

type RestaurantProductInput = z.infer<typeof restaurantProductSchema>;

interface ProductFormProps {
  mode: 'create' | 'edit';
  product?: DatabaseProduct;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface CategoryOption {
  id: string;
  name: string;
  handle: string;
}

interface CollectionOption {
  id: string;
  title: string;
  handle: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
  mode,
  product,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  // State for categories and collections
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form setup
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, isValid }
  } = useForm<RestaurantProductInput>({
    resolver: zodResolver(restaurantProductSchema),
    defaultValues: {
      title: product?.title || '',
      subtitle: product?.subtitle || '',
      description: product?.description || '',
      status: product?.status || 'draft',
      is_giftcard: product?.is_giftcard || false,
      discountable: product?.discountable || true,
      categories: [],
      collections: [],
      tags: [],
      variants: [{
        title: 'Default',
        price_cents: 0,
        inventory_quantity: 0,
        manage_inventory: true,
        allow_backorder: false
      }],
      images: [],
      metadata: {
        menuSection: 'mains',
        dietaryInfo: {
          vegetarian: false,
          vegan: false,
          glutenFree: false,
          dairyFree: false,
          nutFree: false,
          containsAllergens: []
        },
        heatLevel: 'none',
        isDailySpecial: false,
        isSeasonalItem: false,
        chefChoice: false
      }
    }
  });

  // Field arrays for dynamic sections
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants'
  });

  const { fields: imageFields, append: appendImage, remove: removeImage, move: moveImage } = useFieldArray({
    control,
    name: 'images'
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control,
    name: 'tags'
  });

  // Watch form values for dynamic updates
  const watchedStatus = watch('status');
  const watchedMetadata = watch('metadata');
  const watchedVariants = watch('variants');

  // Load categories and collections
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [categoriesRes, collectionsRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/collections')
        ]);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.categories || []);
        }

        if (collectionsRes.ok) {
          const collectionsData = await collectionsRes.json();
          setCollections(collectionsData.collections || []);
        }
      } catch (error) {
        console.error('Failed to load form data:', error);
        toast.error('Failed to load categories and collections');
      } finally {
        setLoadingData(false);
      }
    };

    loadFormData();
  }, []);

  // Handle form submission
  const onSubmitForm = useCallback(async (data: RestaurantProductInput) => {
    try {
      // Validate required fields
      if (!data.title.trim()) {
        toast.error('Product title is required');
        return;
      }

      if (!data.variants || data.variants.length === 0 || data.variants[0].price_cents <= 0) {
        toast.error('At least one variant with a valid price is required');
        return;
      }

      // Prepare submission data
      const submissionData = {
        ...data,
        handle: data.handle || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        metadata: {
          ...data.metadata,
          // Add restaurant-specific defaults
          restaurantItem: true,
          lastUpdated: new Date().toISOString()
        }
      };

      await onSubmit(submissionData);

      if (mode === 'create') {
        toast.success('Product created successfully!');
      } else {
        toast.success('Product updated successfully!');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    }
  }, [onSubmit, mode]);

  // Handle image upload
  const handleImageUpload = useCallback((imageData: { url: string; alt_text?: string }) => {
    appendImage({
      url: imageData.url,
      alt_text: imageData.alt_text || '',
      sort_order: imageFields.length,
      metadata: {}
    });
  }, [appendImage, imageFields.length]);

  // Dietary restriction options
  const dietaryOptions = [
    { key: 'vegetarian', label: 'Vegetarian', icon: Leaf },
    { key: 'vegan', label: 'Vegan', icon: Leaf },
    { key: 'glutenFree', label: 'Gluten Free', icon: Shield },
    { key: 'dairyFree', label: 'Dairy Free', icon: Shield },
    { key: 'nutFree', label: 'Nut Free', icon: Shield }
  ];

  // Heat level options
  const heatLevels = [
    { value: 'none', label: 'No Heat', color: 'bg-gray-100' },
    { value: 'mild', label: 'Mild', color: 'bg-green-100' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100' },
    { value: 'hot', label: 'Hot', color: 'bg-orange-100' },
    { value: 'extra-hot', label: 'Extra Hot', color: 'bg-red-100' }
  ];

  // Menu section options
  const menuSections = [
    { value: 'appetizers', label: 'Appetizers' },
    { value: 'mains', label: 'Main Dishes' },
    { value: 'sides', label: 'Sides' },
    { value: 'desserts', label: 'Desserts' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'specials', label: 'Daily Specials' }
  ];

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2">Loading form data...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Menu Item' : 'Edit Menu Item'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          <Badge
            variant={watchedStatus === 'published' ? 'default' : 'secondary'}
            className={watchedStatus === 'published' ? 'bg-green-100 text-green-800' : ''}
          >
            {watchedStatus === 'published' ? 'Published' : 'Draft'}
          </Badge>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                Product Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., BBQ Pulled Pork Sandwich"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                {...register('subtitle')}
                placeholder="e.g., Slow-smoked with our signature sauce"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Detailed description of the menu item..."
              className="min-h-24"
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="draft">Draft</option>
                <option value="proposed">Proposed</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="menuSection">Menu Section</Label>
              <Controller
                name="metadata.menuSection"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {menuSections.map(section => (
                      <option key={section.value} value={section.value}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heatLevel" className="flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Heat Level
              </Label>
              <Controller
                name="metadata.heatLevel"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {heatLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing & Variants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {variantFields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Variant {index + 1}</h4>
                {variantFields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeVariant(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`variants.${index}.title`}>
                    Variant Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register(`variants.${index}.title`)}
                    placeholder="e.g., Regular, Large, Family Size"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`variants.${index}.price_cents`}>
                    Price (cents) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    {...register(`variants.${index}.price_cents`, { valueAsNumber: true })}
                    placeholder="1299"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`variants.${index}.sku`}>SKU</Label>
                  <Input
                    {...register(`variants.${index}.sku`)}
                    placeholder="PULLED-PORK-REG"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`variants.${index}.inventory_quantity`}>
                    Inventory Quantity
                  </Label>
                  <Input
                    type="number"
                    {...register(`variants.${index}.inventory_quantity`, { valueAsNumber: true })}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name={`variants.${index}.manage_inventory`}
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label>Track Inventory</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name={`variants.${index}.allow_backorder`}
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label>Allow Backorders</Label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => appendVariant({
              title: '',
              price_cents: 0,
              inventory_quantity: 0,
              manage_inventory: true,
              allow_backorder: false
            })}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </CardContent>
      </Card>

      {/* Dietary Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dietary Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {dietaryOptions.map(option => (
              <div key={option.key} className="flex items-center space-x-2">
                <Controller
                  name={`metadata.dietaryInfo.${option.key}` as any}
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label className="flex items-center gap-2">
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </Label>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Contains Allergens</Label>
            <Input
              placeholder="Enter allergens separated by commas (e.g., nuts, dairy, soy)"
              onChange={(e) => {
                const allergens = e.target.value.split(',').map(a => a.trim()).filter(Boolean);
                setValue('metadata.dietaryInfo.containsAllergens', allergens);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Special Attributes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Special Attributes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Controller
                name="metadata.isDailySpecial"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label>Daily Special</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="metadata.isSeasonalItem"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label>Seasonal Item</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="metadata.chefChoice"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label>Chef's Choice</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cookingTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Cooking Time (minutes)
              </Label>
              <Controller
                name="metadata.cookingTime"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    placeholder="15"
                    min="0"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servingSize">Serving Size</Label>
              <Controller
                name="metadata.servingSize"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="1 sandwich, 2 people, etc."
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preparationNotes">Preparation Notes</Label>
            <Controller
              name="metadata.preparationNotes"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Special preparation instructions, cooking tips, etc."
                  className="min-h-20"
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Image Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductImageManager
            images={imageFields}
            onImageAdd={handleImageUpload}
            onImageRemove={removeImage}
            onImageReorder={moveImage}
            onImageUpdate={(index, data) => {
              setValue(`images.${index}`, { ...imageFields[index], ...data });
            }}
          />
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!isValid && (
            <Badge variant="outline" className="text-red-600 border-red-600">
              Please fix errors above
            </Badge>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="min-w-32"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </div>
            ) : (
              mode === 'create' ? 'Create Product' : 'Update Product'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;