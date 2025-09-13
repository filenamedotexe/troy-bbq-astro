import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { createCateringAddonSchema, updateCateringAddonSchema } from '../../lib/schemas';
import type { CreateCateringAddonInput, UpdateCateringAddonInput } from '../../lib/schemas';
import type { CateringAddon } from '../../types';

interface AddOnFormProps {
  initialAddon?: CateringAddon | null;
  onSubmit: (data: CreateCateringAddonInput | UpdateCateringAddonInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ADDON_CATEGORIES = [
  { value: '', label: 'No Category' },
  { value: 'setup', label: 'Setup & Breakdown' },
  { value: 'equipment', label: 'Equipment Rental' },
  { value: 'staff', label: 'Additional Staff' },
  { value: 'service', label: 'Service Add-Ons' },
  { value: 'tableware', label: 'Tableware & Linens' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'desserts', label: 'Desserts & Extras' },
  { value: 'other', label: 'Other' },
];

export default function AddOnForm({ 
  initialAddon, 
  onSubmit, 
  onCancel,
  isLoading = false 
}: AddOnFormProps) {
  const isEditing = Boolean(initialAddon);
  const schema = isEditing ? updateCateringAddonSchema : createCateringAddonSchema;
  
  const defaultValues = isEditing && initialAddon ? {
    name: initialAddon.name,
    description: initialAddon.description || '',
    priceCents: initialAddon.priceCents,
    isActive: initialAddon.isActive,
    category: initialAddon.category || '',
  } : {
    name: '',
    description: '',
    priceCents: 0,
    isActive: true,
    category: '',
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch
  } = useForm<CreateCateringAddonInput | UpdateCateringAddonInput>({
    resolver: zodResolver(schema),
    defaultValues
  });

  React.useEffect(() => {
    if (initialAddon) {
      reset({
        name: initialAddon.name,
        description: initialAddon.description || '',
        priceCents: initialAddon.priceCents,
        isActive: initialAddon.isActive,
        category: initialAddon.category || '',
      });
    }
  }, [initialAddon, reset]);

  const onFormSubmit = async (data: CreateCateringAddonInput | UpdateCateringAddonInput) => {
    try {
      // Clean up empty strings to undefined for optional fields
      const cleanData = {
        ...data,
        description: data.description?.trim() || undefined,
        category: data.category?.trim() || undefined,
      };
      
      await onSubmit(cleanData);
    } catch (error) {
      console.error('Failed to save add-on:', error);
    }
  };

  const handleReset = () => {
    reset(defaultValues);
  };

  const priceDollars = watch('priceCents') / 100;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="md:col-span-1">
          <Label htmlFor="name">Add-On Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., Additional Server"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="md:col-span-1">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            {...register('category')}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              errors.category ? 'border-red-500' : ''
            }`}
          >
            {ADDON_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-sm text-red-600 mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="md:col-span-1">
          <Label htmlFor="priceCents">Price (cents) *</Label>
          <Input
            id="priceCents"
            type="number"
            min="0"
            step="1"
            placeholder="e.g., 5000 for $50.00"
            {...register('priceCents', { valueAsNumber: true })}
            className={errors.priceCents ? 'border-red-500' : ''}
          />
          {!errors.priceCents && !isNaN(priceDollars) && (
            <p className="text-sm text-gray-600 mt-1">
              Price: ${priceDollars.toFixed(2)}
            </p>
          )}
          {errors.priceCents && (
            <p className="text-sm text-red-600 mt-1">
              {errors.priceCents.message}
            </p>
          )}
        </div>

        {/* Active Status */}
        <div className="md:col-span-1">
          <div className="flex items-center space-x-2 pt-6">
            <input
              id="isActive"
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <Label htmlFor="isActive" className="text-sm font-normal">
              Active (available for selection)
            </Label>
          </div>
          {errors.isActive && (
            <p className="text-sm text-red-600 mt-1">
              {errors.isActive.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={3}
            placeholder="Detailed description of the add-on service..."
            {...register('description')}
            className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              errors.description ? 'border-red-500' : ''
            }`}
          />
          {errors.description && (
            <p className="text-sm text-red-600 mt-1">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting || isLoading || !isDirty}
          >
            Reset
          </Button>
        </div>
        <Button
          type="submit"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading 
            ? (isEditing ? 'Updating...' : 'Creating...') 
            : (isEditing ? 'Update Add-On' : 'Create Add-On')
          }
        </Button>
      </div>
    </form>
  );
}