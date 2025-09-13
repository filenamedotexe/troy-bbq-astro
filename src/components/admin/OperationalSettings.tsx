import React from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Switch } from '../ui/Switch';
import type { AdminSettings } from '../../types';

interface OperationalSettingsProps {
  control: Control<AdminSettings>;
  register: any;
  errors?: FieldErrors<AdminSettings>;
  setValue: any;
  watch: any;
}

export default function OperationalSettings({
  control,
  register,
  errors,
  setValue,
  watch
}: OperationalSettingsProps) {
  const serviceOptions = watch('operations.serviceOptions');

  return (
    <div className="space-y-6">
      {/* Service Options */}
      <Card>
        <CardHeader>
          <CardTitle>Service Options</CardTitle>
          <p className="text-sm text-gray-600">
            Choose which services your restaurant offers to customers
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Pickup</Label>
                  <p className="text-sm text-gray-500">Customers pick up orders</p>
                </div>
                <Switch
                  checked={serviceOptions?.pickup}
                  onChange={(checked) => setValue('operations.serviceOptions.pickup', checked)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Delivery</Label>
                  <p className="text-sm text-gray-500">Deliver to customer locations</p>
                </div>
                <Switch
                  checked={serviceOptions?.delivery}
                  onChange={(checked) => setValue('operations.serviceOptions.delivery', checked)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Catering</Label>
                  <p className="text-sm text-gray-500">Large event catering services</p>
                </div>
                <Switch
                  checked={serviceOptions?.catering}
                  onChange={(checked) => setValue('operations.serviceOptions.catering', checked)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Dine-In</Label>
                  <p className="text-sm text-gray-500">Restaurant seating available</p>
                </div>
                <Switch
                  checked={serviceOptions?.dineIn}
                  onChange={(checked) => setValue('operations.serviceOptions.dineIn', checked)}
                />
              </div>
            </div>
          </div>

          {(!serviceOptions?.pickup && !serviceOptions?.delivery && !serviceOptions?.catering && !serviceOptions?.dineIn) && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-amber-800 text-sm">
                <strong>Warning:</strong> At least one service option should be enabled for customers to place orders.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Timing */}
      <Card>
        <CardHeader>
          <CardTitle>Order Timing</CardTitle>
          <p className="text-sm text-gray-600">
            Set timing requirements for different types of orders
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="operations.orderTiming.minimumLeadTimeMinutes">
                Minimum Lead Time (Minutes)
              </Label>
              <Input
                id="operations.orderTiming.minimumLeadTimeMinutes"
                type="number"
                min="0"
                max="480"
                {...register('operations.orderTiming.minimumLeadTimeMinutes', { valueAsNumber: true })}
                className={errors?.operations?.orderTiming?.minimumLeadTimeMinutes ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                How far in advance regular orders must be placed
              </p>
              {errors?.operations?.orderTiming?.minimumLeadTimeMinutes && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.operations.orderTiming.minimumLeadTimeMinutes.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="operations.orderTiming.maximumAdvanceOrderDays">
                Maximum Advance Order (Days)
              </Label>
              <Input
                id="operations.orderTiming.maximumAdvanceOrderDays"
                type="number"
                min="1"
                max="365"
                {...register('operations.orderTiming.maximumAdvanceOrderDays', { valueAsNumber: true })}
                className={errors?.operations?.orderTiming?.maximumAdvanceOrderDays ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                How far in advance customers can place orders
              </p>
              {errors?.operations?.orderTiming?.maximumAdvanceOrderDays && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.operations.orderTiming.maximumAdvanceOrderDays.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="operations.orderTiming.cateringMinimumLeadTimeHours">
                Catering Lead Time (Hours)
              </Label>
              <Input
                id="operations.orderTiming.cateringMinimumLeadTimeHours"
                type="number"
                min="1"
                max="720"
                {...register('operations.orderTiming.cateringMinimumLeadTimeHours', { valueAsNumber: true })}
                className={errors?.operations?.orderTiming?.cateringMinimumLeadTimeHours ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum advance notice required for catering orders
              </p>
              {errors?.operations?.orderTiming?.cateringMinimumLeadTimeHours && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.operations.orderTiming.cateringMinimumLeadTimeHours.message}
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Timing Guidelines</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Regular Orders:</strong> Consider prep time and peak hours (typically 30-60 minutes)</p>
              <p>• <strong>Advance Orders:</strong> Allow flexibility for special occasions (typically 7-30 days)</p>
              <p>• <strong>Catering:</strong> Ensure adequate prep time for large orders (typically 24-72 hours)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Hours Management */}
      <Card>
        <CardHeader>
          <CardTitle>Special Hours & Holidays</CardTitle>
          <p className="text-sm text-gray-600">
            Manage special operating hours for holidays, events, or temporary schedule changes
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-6 rounded-lg border text-center">
            <div className="w-16 h-16 mx-auto bg-gray-200 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">No Special Hours Set</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add special hours for holidays, events, or temporary schedule changes.
            </p>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Special Hours
            </button>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-900 mb-2">Common Special Hours</h4>
            <div className="text-sm text-amber-800 space-y-1">
              <p>• Holiday closures (Christmas, Thanksgiving, etc.)</p>
              <p>• Extended hours for special events</p>
              <p>• Early closures for staff training</p>
              <p>• Temporary schedule changes during renovations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}