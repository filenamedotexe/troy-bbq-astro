import React from 'react';
import type { Control, FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Button } from '../../ui/Button';
import type { AdminSettings } from '../../../types';

interface CateringOperationsSettingsProps {
  control: Control<AdminSettings>;
  register: UseFormRegister<AdminSettings>;
  errors: FieldErrors<AdminSettings>;
  watch: UseFormWatch<AdminSettings>;
  setValue: UseFormSetValue<AdminSettings>;
}

export default function CateringOperationsSettings({
  control,
  register,
  errors,
  watch,
  setValue
}: CateringOperationsSettingsProps) {
  const [isExpanded, setIsExpanded] = React.useState<Record<string, boolean>>({
    quickAccess: true,
    pricing: false,
    leadTimes: false,
    delivery: false,
    payments: false,
    staffing: false,
    equipment: false,
    tax: false
  });

  const toggleSection = (section: string) => {
    setIsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const FrequentlyUpdated = () => (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ml-2">
      Frequently Updated
    </span>
  );

  const currentDepositPercentage = watch('depositPercentage');
  const currentCateringLeadTime = watch('operations.orderTiming.cateringMinimumLeadTimeHours');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">🎉</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900">Catering Operations</h3>
            <p className="text-purple-700 text-sm mt-1">
              Settings for large events, corporate orders, and special occasions.
              These are often adjusted for seasonal demands and special events.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access - Most Frequently Updated */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">⚡</span>
              Quick Access - Event Planning
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
          <p className="text-sm text-purple-700 mt-1">
            Settings you'll adjust frequently for availability, pricing, and lead times.
          </p>
        </CardHeader>
        {isExpanded.quickAccess && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="depositPercentage-quick">
                  Deposit Required (%)
                  <FrequentlyUpdated />
                </Label>
                <div className="relative">
                  <Input
                    id="depositPercentage-quick"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    {...register('depositPercentage', { valueAsNumber: true })}
                    className={errors.depositPercentage ? 'border-red-500' : 'border-purple-300'}
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500">
                    {((currentDepositPercentage || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                {errors.depositPercentage && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.depositPercentage.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cateringMinimumLeadTimeHours-quick">
                  Minimum Lead Time (hours)
                  <FrequentlyUpdated />
                </Label>
                <div className="relative">
                  <Input
                    id="cateringMinimumLeadTimeHours-quick"
                    type="number"
                    min="1"
                    max="336"
                    {...register('operations.orderTiming.cateringMinimumLeadTimeHours', { valueAsNumber: true })}
                    className={errors.operations?.orderTiming?.cateringMinimumLeadTimeHours ? 'border-red-500' : 'border-purple-300'}
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500">
                    {Math.round((currentCateringLeadTime || 48) / 24)}d
                  </span>
                </div>
                {errors.operations?.orderTiming?.cateringMinimumLeadTimeHours && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.operations.orderTiming.cateringMinimumLeadTimeHours.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="catering-availability">
                  Catering Availability
                  <FrequentlyUpdated />
                </Label>
                <select
                  id="catering-availability"
                  className="flex h-10 w-full rounded-md border border-purple-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="available">Available</option>
                  <option value="limited">Limited Availability</option>
                  <option value="booked">Fully Booked</option>
                  <option value="seasonal">Seasonal Only</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-2">🎯 Quick Tips</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Increase lead times during busy seasons (holidays, graduation)</li>
                <li>• Adjust deposit percentages for high-demand periods</li>
                <li>• Update availability status as your calendar fills up</li>
                <li>• Set higher minimums for peak wedding season</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Catering Pricing Models */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">💰</span>
              Catering Pricing Models
              <FrequentlyUpdated />
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
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2">Minimum Order Requirements</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="corporate-minimum">Corporate Events ($)</Label>
                  <Input
                    id="corporate-minimum"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="500"
                    className="border-yellow-300"
                  />
                  <p className="text-xs text-yellow-700 mt-1">Business meetings, office parties</p>
                </div>

                <div>
                  <Label htmlFor="private-minimum">Private Events ($)</Label>
                  <Input
                    id="private-minimum"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="300"
                    className="border-yellow-300"
                  />
                  <p className="text-xs text-yellow-700 mt-1">Birthday parties, family gatherings</p>
                </div>

                <div>
                  <Label htmlFor="wedding-minimum">Weddings ($)</Label>
                  <Input
                    id="wedding-minimum"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="1000"
                    className="border-yellow-300"
                  />
                  <p className="text-xs text-yellow-700 mt-1">Wedding receptions, rehearsal dinners</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Volume Discounts</h4>
              <p className="text-sm text-green-700 mb-3">
                Encourage larger orders with automatic volume discounts based on guest count.
              </p>
              <div className="text-center py-4 border-2 border-dashed border-green-300 rounded-lg">
                <span className="text-2xl mb-2 block">📊</span>
                <p className="text-sm text-green-600">Volume discount tiers coming soon</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lead Time Requirements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">⏰</span>
              Lead Time Requirements
              <FrequentlyUpdated />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('leadTimes')}
            >
              {isExpanded.leadTimes ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.leadTimes && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="standard-lead-time">Standard Events (hours)</Label>
                <Input
                  id="standard-lead-time"
                  type="number"
                  min="1"
                  max="336"
                  placeholder="48"
                />
                <p className="text-xs text-gray-500 mt-1">Most catering orders</p>
              </div>

              <div>
                <Label htmlFor="corporate-lead-time">Corporate Events (hours)</Label>
                <Input
                  id="corporate-lead-time"
                  type="number"
                  min="1"
                  max="336"
                  placeholder="72"
                />
                <p className="text-xs text-gray-500 mt-1">Business meetings, conferences</p>
              </div>

              <div>
                <Label htmlFor="wedding-lead-time">Weddings (hours)</Label>
                <Input
                  id="wedding-lead-time"
                  type="number"
                  min="1"
                  max="8760"
                  placeholder="168"
                />
                <p className="text-xs text-gray-500 mt-1">Wedding receptions (1 week)</p>
              </div>

              <div>
                <Label htmlFor="holiday-lead-time">Holiday Events (hours)</Label>
                <Input
                  id="holiday-lead-time"
                  type="number"
                  min="1"
                  max="8760"
                  placeholder="336"
                />
                <p className="text-xs text-gray-500 mt-1">Holiday parties (2 weeks)</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">💡 Lead Time Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Longer lead times ensure better planning and food procurement</li>
                <li>• Corporate events often need coordination with venues</li>
                <li>• Weddings require menu tastings and final headcounts</li>
                <li>• Holiday events compete for premium dates</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Catering Delivery & Service */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">🚚</span>
              Delivery & Service Options
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('delivery')}
            >
              {isExpanded.delivery ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.delivery && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="catering-delivery"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  defaultChecked
                />
                <Label htmlFor="catering-delivery" className="text-sm font-medium">
                  Delivery Available
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="catering-setup"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  defaultChecked
                />
                <Label htmlFor="catering-setup" className="text-sm font-medium">
                  Setup Service
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="catering-full-service"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="catering-full-service" className="text-sm font-medium">
                  Full Service
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="equipment-rental"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="equipment-rental" className="text-sm font-medium">
                  Equipment Rental
                </Label>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Delivery Fee Structure</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="catering-base-fee">Base Delivery Fee ($)</Label>
                  <Input
                    id="catering-base-fee"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="50"
                  />
                </div>

                <div>
                  <Label htmlFor="catering-per-mile">Per Mile Fee ($)</Label>
                  <Input
                    id="catering-per-mile"
                    type="number"
                    step="0.50"
                    min="0"
                    placeholder="3.00"
                  />
                </div>

                <div>
                  <Label htmlFor="setup-fee">Setup Fee ($)</Label>
                  <Input
                    id="setup-fee"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="75"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Payment Terms */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">💳</span>
              Payment Terms & Policies
              <FrequentlyUpdated />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('payments')}
            >
              {isExpanded.payments ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.payments && (
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">Payment Method Options</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="payment-card"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    defaultChecked
                  />
                  <Label htmlFor="payment-card" className="text-sm">Credit Card</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="payment-check"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="payment-check" className="text-sm">Check</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="payment-invoice"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="payment-invoice" className="text-sm">Invoice (Net Terms)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="payment-cash"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="payment-cash" className="text-sm">Cash</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice-terms">Invoice Terms</Label>
                <select
                  id="invoice-terms"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="net_15">Net 15 Days</option>
                  <option value="net_30">Net 30 Days</option>
                  <option value="net_45">Net 45 Days</option>
                </select>
              </div>

              <div>
                <Label htmlFor="late-fee">Late Fee (%)</Label>
                <Input
                  id="late-fee"
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.2"
                  placeholder="0.05"
                />
                <p className="text-xs text-gray-500 mt-1">Monthly late fee percentage</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Staffing & Service */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">👥</span>
              Staffing & Service Personnel
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('staffing')}
            >
              {isExpanded.staffing ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.staffing && (
          <CardContent className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <span className="text-4xl mb-2 block">👨‍🍳</span>
              <h4 className="font-medium text-gray-900">Staffing Options Coming Soon</h4>
              <p className="text-sm text-gray-600 mt-1">
                Configure service staff availability, hourly rates, and minimum staffing requirements.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tax Handling */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">📊</span>
              Catering Tax Configuration
              <FrequentlyUpdated />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('tax')}
            >
              {isExpanded.tax ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.tax && (
          <CardContent className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-700 mb-3">
                Catering services may have different tax requirements than retail sales.
                Consult your local tax authority for specific requirements.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="catering-tax-rate">Catering Tax Rate (%)</Label>
                  <Input
                    id="catering-tax-rate"
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    placeholder="0.0825"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="setup-taxable"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked
                    />
                    <Label htmlFor="setup-taxable" className="text-sm">Setup fees are taxable</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="delivery-taxable"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="delivery-taxable" className="text-sm">Delivery fees are taxable</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="service-taxable"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked
                    />
                    <Label htmlFor="service-taxable" className="text-sm">Service fees are taxable</Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}