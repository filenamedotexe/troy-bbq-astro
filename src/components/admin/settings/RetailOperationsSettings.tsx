import React from 'react';
import type { Control, FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Button } from '../../ui/Button';
import type { AdminSettings } from '../../../types';

interface RetailOperationsSettingsProps {
  control: Control<AdminSettings>;
  register: UseFormRegister<AdminSettings>;
  errors: FieldErrors<AdminSettings>;
  watch: UseFormWatch<AdminSettings>;
  setValue: UseFormSetValue<AdminSettings>;
}

export default function RetailOperationsSettings({
  control,
  register,
  errors,
  watch,
  setValue
}: RetailOperationsSettingsProps) {
  const [isExpanded, setIsExpanded] = React.useState<Record<string, boolean>>({
    quickAccess: true,
    services: false,
    pickup: false,
    delivery: false,
    pricing: false,
    specials: false,
    pos: false
  });

  const toggleSection = (section: string) => {
    setIsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const FrequentlyUpdated = () => (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ml-2">
      Frequently Updated
    </span>
  );

  const currentTaxRate = watch('taxRate');
  const currentMinimumOrder = watch('minimumOrder');
  const currentDeliveryRadius = watch('deliveryRadius');
  const currentBaseFeePerMile = watch('baseFeePerMile');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">🏪</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Retail Operations</h3>
            <p className="text-green-700 text-sm mt-1">
              Settings for walk-in customers, pickup orders, and delivery operations.
              Items marked as "Frequently Updated" are commonly adjusted during daily operations.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access - Most Frequently Updated */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">⚡</span>
              Quick Access - Daily Updates
              <FrequentlyUpdated />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('quickAccess')}
            >
              {isExpanded.quickAccess ? '📁' : '📂'}
            </Button>
          </div>
          <p className="text-sm text-orange-700 mt-1">
            The settings you'll update most often - prices, delivery zones, and daily specials.
          </p>
        </CardHeader>
        {isExpanded.quickAccess && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="taxRate-quick">
                  Tax Rate (%)
                  <FrequentlyUpdated />
                </Label>
                <div className="relative">
                  <Input
                    id="taxRate-quick"
                    type="number"
                    step="0.001"
                    max="1"
                    min="0"
                    {...register('taxRate', { valueAsNumber: true })}
                    className={errors.taxRate ? 'border-red-500' : 'border-orange-300'}
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500">
                    {((currentTaxRate || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                {errors.taxRate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.taxRate.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="minimumOrder-quick">
                  Minimum Order ($)
                  <FrequentlyUpdated />
                </Label>
                <Input
                  id="minimumOrder-quick"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('minimumOrder', { valueAsNumber: true })}
                  className={errors.minimumOrder ? 'border-red-500' : 'border-orange-300'}
                />
                {errors.minimumOrder && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.minimumOrder.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="deliveryRadius-quick">
                  Delivery Radius (mi)
                  <FrequentlyUpdated />
                </Label>
                <Input
                  id="deliveryRadius-quick"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...register('deliveryRadius', { valueAsNumber: true })}
                  className={errors.deliveryRadius ? 'border-red-500' : 'border-orange-300'}
                />
                {errors.deliveryRadius && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.deliveryRadius.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="baseFeePerMile-quick">
                  Fee Per Mile ($)
                  <FrequentlyUpdated />
                </Label>
                <Input
                  id="baseFeePerMile-quick"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('baseFeePerMile', { valueAsNumber: true })}
                  className={errors.baseFeePerMile ? 'border-red-500' : 'border-orange-300'}
                />
                {errors.baseFeePerMile && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.baseFeePerMile.message}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h4 className="font-medium text-orange-900 mb-2">💡 Quick Tips</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Update tax rates when local tax changes occur</li>
                <li>• Adjust delivery radius during busy periods or weather events</li>
                <li>• Modify minimum order amounts for promotions</li>
                <li>• Change delivery fees based on fuel costs or demand</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Service Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">🚀</span>
              Service Options
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('services')}
            >
              {isExpanded.services ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.services && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="operations.serviceOptions.pickup"
                  {...register('operations.serviceOptions.pickup')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="operations.serviceOptions.pickup" className="text-sm font-medium">
                  Pickup Orders
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="operations.serviceOptions.delivery"
                  {...register('operations.serviceOptions.delivery')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="operations.serviceOptions.delivery" className="text-sm font-medium">
                  Delivery
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="operations.serviceOptions.catering"
                  {...register('operations.serviceOptions.catering')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="operations.serviceOptions.catering" className="text-sm font-medium">
                  Catering
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="operations.serviceOptions.dineIn"
                  {...register('operations.serviceOptions.dineIn')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="operations.serviceOptions.dineIn" className="text-sm font-medium">
                  Dine-In
                </Label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Pickup Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">🥡</span>
              Pickup Window Settings
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('pickup')}
            >
              {isExpanded.pickup ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.pickup && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="operations.orderTiming.minimumLeadTimeMinutes">
                  Minimum Lead Time (minutes)
                </Label>
                <Input
                  id="operations.orderTiming.minimumLeadTimeMinutes"
                  type="number"
                  min="5"
                  max="120"
                  {...register('operations.orderTiming.minimumLeadTimeMinutes', { valueAsNumber: true })}
                  className={errors.operations?.orderTiming?.minimumLeadTimeMinutes ? 'border-red-500' : ''}
                />
                {errors.operations?.orderTiming?.minimumLeadTimeMinutes && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.operations.orderTiming.minimumLeadTimeMinutes.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="operations.orderTiming.maximumAdvanceOrderDays">
                  Max Advance Order Days
                </Label>
                <Input
                  id="operations.orderTiming.maximumAdvanceOrderDays"
                  type="number"
                  min="1"
                  max="365"
                  {...register('operations.orderTiming.maximumAdvanceOrderDays', { valueAsNumber: true })}
                  className={errors.operations?.orderTiming?.maximumAdvanceOrderDays ? 'border-red-500' : ''}
                />
                {errors.operations?.orderTiming?.maximumAdvanceOrderDays && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.operations.orderTiming.maximumAdvanceOrderDays.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="pickup-capacity">
                  Pickup Window Capacity
                </Label>
                <Input
                  id="pickup-capacity"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Orders per 15-minute window
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">💰</span>
              Pricing & Portions
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('pricing')}
            >
              {isExpanded.pricing ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.pricing && (
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Hunger Level Multipliers</h4>
              <p className="text-sm text-blue-700 mb-3">
                Adjust portion sizes based on customer appetite. These multipliers affect the quantity of food served.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="hungerMultipliers.normal">
                    Normal Appetite (1.0x)
                  </Label>
                  <Input
                    id="hungerMultipliers.normal"
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="2"
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
                  <Label htmlFor="hungerMultipliers.prettyHungry">
                    Pretty Hungry (1.25x)
                  </Label>
                  <Input
                    id="hungerMultipliers.prettyHungry"
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="2"
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
                  <Label htmlFor="hungerMultipliers.reallyHungry">
                    Really Hungry (1.5x)
                  </Label>
                  <Input
                    id="hungerMultipliers.reallyHungry"
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="2"
                    {...register('hungerMultipliers.reallyHungry', { valueAsNumber: true })}
                    className={errors.hungerMultipliers?.reallyHungry ? 'border-red-500' : ''}
                  />
                  {errors.hungerMultipliers?.reallyHungry && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.hungerMultipliers.reallyHungry.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Daily Specials */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">⭐</span>
              Daily Specials Management
              <FrequentlyUpdated />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('specials')}
            >
              {isExpanded.specials ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.specials && (
          <CardContent className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed border-yellow-300 rounded-lg">
              <span className="text-4xl mb-2 block">🚧</span>
              <h4 className="font-medium text-yellow-900">Daily Specials Coming Soon</h4>
              <p className="text-sm text-yellow-700 mt-1">
                This feature will allow you to quickly add, edit, and manage daily specials and limited-time offers.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* POS Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">💳</span>
              POS Integration
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('pos')}
            >
              {isExpanded.pos ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.pos && (
          <CardContent className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <span className="text-4xl mb-2 block">🔌</span>
              <h4 className="font-medium text-gray-900">POS Integration Coming Soon</h4>
              <p className="text-sm text-gray-600 mt-1">
                Connect with Square, Toast, Clover, and other POS systems to sync inventory and orders.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}