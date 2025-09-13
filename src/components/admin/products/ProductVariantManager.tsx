import React, { useState, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Badge } from '../../ui/Badge';
import {
  Plus,
  X,
  Move,
  Package,
  DollarSign,
  Hash,
  Barcode,
  AlertCircle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type {
  DatabaseProductVariant,
  CreateVariantInput,
  UpdateVariantInput
} from '../../../types';

// Validation schema for variant form
const variantSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  sku: z.string().max(255).optional(),
  barcode: z.string().max(255).optional(),
  ean: z.string().max(255).optional(),
  upc: z.string().max(255).optional(),
  price_cents: z.number().int().min(0, 'Price cannot be negative'),
  inventory_quantity: z.number().int().min(0, 'Inventory cannot be negative'),
  allow_backorder: z.boolean().optional(),
  manage_inventory: z.boolean().optional(),
  weight: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  width: z.number().min(0).optional()
});

const variantsFormSchema = z.object({
  variants: z.array(variantSchema).min(1, 'At least one variant is required')
});

type VariantFormData = z.infer<typeof variantsFormSchema>;

export interface ProductVariantManagerProps {
  productId?: string;
  variants: DatabaseProductVariant[];
  onVariantsChange: (variants: DatabaseProductVariant[]) => void;
  onSaveVariant?: (variant: CreateVariantInput | (UpdateVariantInput & { id: string })) => Promise<DatabaseProductVariant>;
  onDeleteVariant?: (variantId: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({
  productId,
  variants,
  onVariantsChange,
  onSaveVariant,
  onDeleteVariant,
  disabled = false,
  className
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedVariants, setExpandedVariants] = useState<Set<number>>(new Set([0]));
  const [savingVariants, setSavingVariants] = useState<Set<string>>(new Set());

  // Initialize form with existing variants
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue,
    getValues
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantsFormSchema),
    defaultValues: {
      variants: variants.length > 0 ? variants.map(variant => ({
        title: variant.title,
        sku: variant.sku || '',
        barcode: variant.barcode || '',
        ean: variant.ean || '',
        upc: variant.upc || '',
        price_cents: variant.price_cents,
        inventory_quantity: variant.inventory_quantity || 0,
        allow_backorder: variant.allow_backorder || false,
        manage_inventory: variant.manage_inventory !== false,
        weight: variant.weight || undefined,
        length: variant.length || undefined,
        height: variant.height || undefined,
        width: variant.width || undefined
      })) : [{
        title: '',
        sku: '',
        barcode: '',
        ean: '',
        upc: '',
        price_cents: 0,
        inventory_quantity: 0,
        allow_backorder: false,
        manage_inventory: true,
        weight: undefined,
        length: undefined,
        height: undefined,
        width: undefined
      }]
    }
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'variants'
  });

  const watchedVariants = watch('variants');

  // Format price for display
  const formatPrice = (cents: number): string => {
    return (cents / 100).toFixed(2);
  };

  // Parse price from string to cents
  const parsePriceInput = (value: string): number => {
    const parsed = parseFloat(value) || 0;
    return Math.round(parsed * 100);
  };

  // Add new variant
  const addVariant = () => {
    const newVariant = {
      title: `Variant ${fields.length + 1}`,
      sku: '',
      barcode: '',
      ean: '',
      upc: '',
      price_cents: 0,
      inventory_quantity: 0,
      allow_backorder: false,
      manage_inventory: true,
      weight: undefined,
      length: undefined,
      height: undefined,
      width: undefined
    };

    append(newVariant);
    setExpandedVariants(prev => new Set([...prev, fields.length]));
  };

  // Remove variant
  const removeVariant = async (index: number) => {
    const variant = variants[index];

    if (variant && variant.id && onDeleteVariant) {
      try {
        await onDeleteVariant(variant.id);
      } catch (error) {
        console.error('Failed to delete variant:', error);
        return;
      }
    }

    remove(index);
    setExpandedVariants(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      // Adjust indices for remaining variants
      const adjustedSet = new Set();
      newSet.forEach(i => {
        if (i < index) {
          adjustedSet.add(i);
        } else if (i > index) {
          adjustedSet.add(i - 1);
        }
      });
      return adjustedSet;
    });
  };

  // Duplicate variant
  const duplicateVariant = (index: number) => {
    const variant = getValues(`variants.${index}`);
    const duplicatedVariant = {
      ...variant,
      title: `${variant.title} (Copy)`,
      sku: variant.sku ? `${variant.sku}-copy` : ''
    };

    append(duplicatedVariant);
    setExpandedVariants(prev => new Set([...prev, fields.length]));
  };

  // Toggle variant expansion
  const toggleVariantExpansion = (index: number) => {
    setExpandedVariants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Handle drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    move(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  // Save variant changes
  const saveVariant = async (index: number) => {
    if (!onSaveVariant) return;

    const variantData = getValues(`variants.${index}`);
    const existingVariant = variants[index];

    setSavingVariants(prev => new Set([...prev, index.toString()]));

    try {
      let savedVariant: DatabaseProductVariant;

      if (existingVariant && existingVariant.id) {
        // Update existing variant
        savedVariant = await onSaveVariant({
          id: existingVariant.id,
          ...variantData
        });
      } else {
        // Create new variant
        savedVariant = await onSaveVariant({
          ...variantData,
          variant_rank: index
        });
      }

      // Update the variants array
      const updatedVariants = [...variants];
      updatedVariants[index] = savedVariant;
      onVariantsChange(updatedVariants);

    } catch (error) {
      console.error('Failed to save variant:', error);
    } finally {
      setSavingVariants(prev => {
        const newSet = new Set(prev);
        newSet.delete(index.toString());
        return newSet;
      });
    }
  };

  // Submit all variants
  const onSubmit = (data: VariantFormData) => {
    // Update the variants in the parent component
    const updatedVariants = data.variants.map((variantData, index) => {
      const existingVariant = variants[index];

      if (existingVariant && existingVariant.id) {
        return {
          ...existingVariant,
          ...variantData,
          variant_rank: index
        };
      } else {
        return {
          id: `temp_${Date.now()}_${index}`,
          product_id: productId || '',
          ...variantData,
          variant_rank: index,
          created_at: new Date(),
          updated_at: new Date()
        } as DatabaseProductVariant;
      }
    });

    onVariantsChange(updatedVariants);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage different variations of this product (size, color, etc.)
          </p>
        </div>
        <Button
          type="button"
          onClick={addVariant}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Variant
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field, index) => {
          const isExpanded = expandedVariants.has(index);
          const isSaving = savingVariants.has(index.toString());
          const hasErrors = errors.variants?.[index];
          const variant = watchedVariants[index];

          return (
            <div
              key={field.id}
              draggable={!disabled}
              onDragStart={(e) => !disabled && handleDragStart(e, index)}
              onDragOver={!disabled ? handleDragOver : undefined}
              onDrop={(e) => !disabled && handleDrop(e, index)}
              className={cn(
                "border rounded-lg bg-white transition-all",
                draggedIndex === index && "opacity-50",
                hasErrors && "border-red-300",
                isExpanded && "shadow-sm"
              )}
            >
              {/* Variant header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleVariantExpansion(index)}
                    className="flex items-center gap-2 hover:bg-gray-50 rounded p-1"
                  >
                    {isExpanded ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="font-medium text-gray-900">
                      {variant?.title || `Variant ${index + 1}`}
                    </span>
                  </button>

                  {variant?.price_cents > 0 && (
                    <Badge variant="outline" className="text-xs">
                      ${formatPrice(variant.price_cents)}
                    </Badge>
                  )}

                  {variant?.sku && (
                    <Badge variant="secondary" className="text-xs">
                      SKU: {variant.sku}
                    </Badge>
                  )}

                  {hasErrors && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!disabled && (
                    <Move className="h-4 w-4 text-gray-400 cursor-move" />
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateVariant(index)}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                    title="Duplicate variant"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(index)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                      title="Remove variant"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Variant form fields */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {/* Basic info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`variant-title-${index}`}>
                        Variant Title *
                      </Label>
                      <Controller
                        name={`variants.${index}.title`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id={`variant-title-${index}`}
                            placeholder="e.g., Small, Red, etc."
                            disabled={disabled}
                            className={errors.variants?.[index]?.title ? 'border-red-500' : ''}
                          />
                        )}
                      />
                      {errors.variants?.[index]?.title && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.variants[index]?.title?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`variant-sku-${index}`}>
                        SKU
                      </Label>
                      <Controller
                        name={`variants.${index}.sku`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id={`variant-sku-${index}`}
                            placeholder="Unique identifier"
                            disabled={disabled}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Pricing and inventory */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`variant-price-${index}`}>
                        Price ($) *
                      </Label>
                      <Controller
                        name={`variants.${index}.price_cents`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formatPrice(field.value || 0)}
                            onChange={(e) => field.onChange(parsePriceInput(e.target.value))}
                            id={`variant-price-${index}`}
                            placeholder="0.00"
                            disabled={disabled}
                            className={errors.variants?.[index]?.price_cents ? 'border-red-500' : ''}
                          />
                        )}
                      />
                      {errors.variants?.[index]?.price_cents && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.variants[index]?.price_cents?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`variant-inventory-${index}`}>
                        Inventory Quantity
                      </Label>
                      <Controller
                        name={`variants.${index}.inventory_quantity`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            id={`variant-inventory-${index}`}
                            placeholder="0"
                            disabled={disabled}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Barcodes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`variant-barcode-${index}`}>
                        Barcode
                      </Label>
                      <Controller
                        name={`variants.${index}.barcode`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id={`variant-barcode-${index}`}
                            placeholder="Barcode"
                            disabled={disabled}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`variant-ean-${index}`}>
                        EAN
                      </Label>
                      <Controller
                        name={`variants.${index}.ean`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id={`variant-ean-${index}`}
                            placeholder="EAN"
                            disabled={disabled}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`variant-upc-${index}`}>
                        UPC
                      </Label>
                      <Controller
                        name={`variants.${index}.upc`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id={`variant-upc-${index}`}
                            placeholder="UPC"
                            disabled={disabled}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`variant-weight-${index}`}>
                        Weight (lbs)
                      </Label>
                      <Controller
                        name={`variants.${index}.weight`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            id={`variant-weight-${index}`}
                            placeholder="0.00"
                            disabled={disabled}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`variant-length-${index}`}>
                        Length (in)
                      </Label>
                      <Controller
                        name={`variants.${index}.length`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            id={`variant-length-${index}`}
                            placeholder="0.00"
                            disabled={disabled}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`variant-width-${index}`}>
                        Width (in)
                      </Label>
                      <Controller
                        name={`variants.${index}.width`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            id={`variant-width-${index}`}
                            placeholder="0.00"
                            disabled={disabled}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`variant-height-${index}`}>
                        Height (in)
                      </Label>
                      <Controller
                        name={`variants.${index}.height`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            id={`variant-height-${index}`}
                            placeholder="0.00"
                            disabled={disabled}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Inventory options */}
                  <div className="space-y-3">
                    <Controller
                      name={`variants.${index}.manage_inventory`}
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={disabled}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Track inventory for this variant
                          </span>
                        </label>
                      )}
                    />

                    <Controller
                      name={`variants.${index}.allow_backorder`}
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={disabled}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Allow backorders when out of stock
                          </span>
                        </label>
                      )}
                    />
                  </div>

                  {/* Individual save button */}
                  {onSaveVariant && (
                    <div className="pt-4 border-t border-gray-100">
                      <Button
                        type="button"
                        onClick={() => saveVariant(index)}
                        disabled={disabled || isSaving}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Variant'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Form actions */}
        {!onSaveVariant && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={disabled || !isDirty}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Save All Variants
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProductVariantManager;