import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { adminSettingsSchema, type AdminSettingsInput } from '../../lib/schemas';
import type { AdminSettings } from '../../types';

interface AdminSettingsFormProps {
  initialSettings?: AdminSettings | null;
  onSubmit: (settings: AdminSettings) => Promise<void>;
  isLoading?: boolean;
}

export default function AdminSettingsForm({ 
  initialSettings, 
  onSubmit, 
  isLoading = false 
}: AdminSettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<AdminSettingsInput>({
    resolver: zodResolver(adminSettingsSchema),
    defaultValues: initialSettings || {
      deliveryRadius: 25,
      baseFeePerMile: 2.50,
      taxRate: 0.08,
      depositPercentage: 0.30,
      hungerMultipliers: {
        normal: 1.0,
        prettyHungry: 1.25,
        reallyHungry: 1.5,
      },
      minimumOrder: 50
    }
  });

  React.useEffect(() => {
    if (initialSettings) {
      reset(initialSettings);
    }
  }, [initialSettings, reset]);

  const onFormSubmit = async (data: AdminSettingsInput) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure delivery zones, pricing, and business rules
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Delivery Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery & Location Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deliveryRadius">Delivery Radius (miles)</Label>
              <Input
                id="deliveryRadius"
                type="number"
                step="0.1"
                {...register('deliveryRadius', { valueAsNumber: true })}
                className={errors.deliveryRadius ? 'border-red-500' : ''}
              />
              {errors.deliveryRadius && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.deliveryRadius.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="baseFeePerMile">Base Fee Per Mile ($)</Label>
              <Input
                id="baseFeePerMile"
                type="number"
                step="0.01"
                {...register('baseFeePerMile', { valueAsNumber: true })}
                className={errors.baseFeePerMile ? 'border-red-500' : ''}
              />
              {errors.baseFeePerMile && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.baseFeePerMile.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="taxRate">Tax Rate (decimal, e.g., 0.08 for 8%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.001"
                {...register('taxRate', { valueAsNumber: true })}
                className={errors.taxRate ? 'border-red-500' : ''}
              />
              {errors.taxRate && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.taxRate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="depositPercentage">
                Deposit Percentage (decimal, e.g., 0.30 for 30%)
              </Label>
              <Input
                id="depositPercentage"
                type="number"
                step="0.01"
                {...register('depositPercentage', { valueAsNumber: true })}
                className={errors.depositPercentage ? 'border-red-500' : ''}
              />
              {errors.depositPercentage && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.depositPercentage.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="minimumOrder">Minimum Order ($)</Label>
              <Input
                id="minimumOrder"
                type="number"
                step="0.01"
                {...register('minimumOrder', { valueAsNumber: true })}
                className={errors.minimumOrder ? 'border-red-500' : ''}
              />
              {errors.minimumOrder && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.minimumOrder.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hunger Multipliers */}
        <Card>
          <CardHeader>
            <CardTitle>Hunger Level Multipliers</CardTitle>
            <p className="text-sm text-gray-600">
              Adjust portion sizes based on customer hunger level
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hungerMultipliers.normal">Normal Appetite</Label>
              <Input
                id="hungerMultipliers.normal"
                type="number"
                step="0.01"
                {...register('hungerMultipliers.normal', { valueAsNumber: true })}
                className={errors.hungerMultipliers?.normal ? 'border-red-500' : ''}
              />
              {errors.hungerMultipliers?.normal && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.hungerMultipliers.normal.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="hungerMultipliers.prettyHungry">Pretty Hungry</Label>
              <Input
                id="hungerMultipliers.prettyHungry"
                type="number"
                step="0.01"
                {...register('hungerMultipliers.prettyHungry', { valueAsNumber: true })}
                className={errors.hungerMultipliers?.prettyHungry ? 'border-red-500' : ''}
              />
              {errors.hungerMultipliers?.prettyHungry && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.hungerMultipliers.prettyHungry.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="hungerMultipliers.reallyHungry">Really Hungry</Label>
              <Input
                id="hungerMultipliers.reallyHungry"
                type="number"
                step="0.01"
                {...register('hungerMultipliers.reallyHungry', { valueAsNumber: true })}
                className={errors.hungerMultipliers?.reallyHungry ? 'border-red-500' : ''}
              />
              {errors.hungerMultipliers?.reallyHungry && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.hungerMultipliers.reallyHungry.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={isSubmitting || isLoading}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}