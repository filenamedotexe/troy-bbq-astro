import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { adminSettingsSchema, type AdminSettingsInput } from '../../lib/schemas';
import type { AdminSettings } from '../../types';

// Import new logical settings components
import BusinessProfileSettings from './settings/BusinessProfileSettings';
import RetailOperationsSettings from './settings/RetailOperationsSettings';
import CateringOperationsSettings from './settings/CateringOperationsSettings';
import MarketingSettings from './settings/MarketingSettings';
import AdvancedSettings from './settings/AdvancedSettings';

// Import legacy components for backward compatibility
import BusinessHoursEditor from './BusinessHoursEditor';
import StoreInformationEditor from './StoreInformationEditor';
import BrandingEditor from './BrandingEditor';
import NotificationPreferences from './NotificationPreferences';
import SocialMediaEditor from './SocialMediaEditor';
import OperationalSettings from './OperationalSettings';

interface AdminSettingsFormProps {
  initialSettings?: AdminSettings | null;
  onSubmit: (settings: AdminSettings) => Promise<void>;
  isLoading?: boolean;
}

const SETTINGS_VIEWS = [
  { id: 'logical', label: 'Business-Focused View' },
  { id: 'legacy', label: 'Technical View' }
] as const;

const LOGICAL_TABS = [
  {
    id: 'businessProfile',
    label: 'Business Profile',
    icon: '🏪',
    description: 'Core business information',
    priority: 'required',
    frequency: 'setup'
  },
  {
    id: 'retailOperations',
    label: 'Retail Operations',
    icon: '🛒',
    description: 'Walk-in, pickup & delivery',
    priority: 'important',
    frequency: 'daily'
  },
  {
    id: 'cateringOperations',
    label: 'Catering Operations',
    icon: '🎉',
    description: 'Events & large orders',
    priority: 'important',
    frequency: 'frequent'
  },
  {
    id: 'marketing',
    label: 'Marketing & Communication',
    icon: '📱',
    description: 'Social media & customer outreach',
    priority: 'optional',
    frequency: 'occasional'
  },
  {
    id: 'advanced',
    label: 'Advanced Operations',
    icon: '⚙️',
    description: 'Power user features',
    priority: 'optional',
    frequency: 'rare'
  },
] as const;

const LEGACY_TABS = [
  { id: 'pricing', label: 'Pricing & Delivery', icon: '💰' },
  { id: 'business', label: 'Business Info', icon: '🏪' },
  { id: 'hours', label: 'Hours', icon: '🕒' },
  { id: 'branding', label: 'Branding', icon: '🎨' },
  { id: 'notifications', label: 'Notifications', icon: '📧' },
  { id: 'social', label: 'Social Media', icon: '📱' },
  { id: 'operations', label: 'Operations', icon: '⚙️' },
] as const;

export default function AdminSettingsForm({
  initialSettings,
  onSubmit,
  isLoading = false
}: AdminSettingsFormProps) {
  const [currentView, setCurrentView] = React.useState<'logical' | 'legacy'>('logical');
  const [activeTab, setActiveTab] = React.useState<string>('businessProfile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  const defaultValues: AdminSettings = {
    // Legacy pricing settings
    deliveryRadius: 25,
    baseFeePerMile: 2.50,
    taxRate: 0.08,
    depositPercentage: 0.30,
    hungerMultipliers: {
      normal: 1.0,
      prettyHungry: 1.25,
      reallyHungry: 1.5,
    },
    minimumOrder: 50,
    // Enhanced business configuration
    businessHours: {
      monday: { isOpen: true, openTime: '10:00', closeTime: '20:00' },
      tuesday: { isOpen: true, openTime: '10:00', closeTime: '20:00' },
      wednesday: { isOpen: true, openTime: '10:00', closeTime: '20:00' },
      thursday: { isOpen: true, openTime: '10:00', closeTime: '20:00' },
      friday: { isOpen: true, openTime: '10:00', closeTime: '21:00' },
      saturday: { isOpen: true, openTime: '11:00', closeTime: '21:00' },
      sunday: { isOpen: true, openTime: '11:00', closeTime: '19:00' },
    },
    storeInformation: {
      businessName: 'Troy BBQ',
      address: {
        street: '123 BBQ Street',
        city: 'Troy',
        state: 'Texas',
        zipCode: '75001',
        country: 'United States',
      },
      contact: {
        phone: '(555) 123-4567',
        email: 'info@troybbq.com',
        website: 'https://troybbq.com',
      },
      description: 'Authentic Texas BBQ with house-smoked meats and traditional sides',
      tagline: 'Smokin Good BBQ Since Day One',
    },
    branding: {
      primaryColor: '#DC2626',
      secondaryColor: '#7C2D12',
      accentColor: '#F59E0B',
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
    },
    notifications: {
      emailNotifications: {
        orderUpdates: true,
        cateringInquiries: true,
        lowInventoryAlerts: true,
        dailyReports: false,
        weeklyReports: true,
      },
      smsNotifications: {
        enabled: false,
        orderUpdates: false,
        urgentAlerts: false,
      },
      adminEmails: ['admin@troybbq.com'],
      customerEmailSettings: {
        orderConfirmationTemplate: 'default',
        orderStatusUpdateTemplate: 'default',
        cateringQuoteTemplate: 'default',
      },
    },
    socialMedia: {
      facebook: 'https://facebook.com/troybbq',
      instagram: 'https://instagram.com/troybbq',
    },
    operations: {
      serviceOptions: {
        pickup: true,
        delivery: true,
        catering: true,
        dineIn: false,
      },
      orderTiming: {
        minimumLeadTimeMinutes: 30,
        maximumAdvanceOrderDays: 30,
        cateringMinimumLeadTimeHours: 48,
      },
      specialHours: [],
    },
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    control,
    setValue,
    watch
  } = useForm<AdminSettings>({
    resolver: zodResolver(adminSettingsSchema),
    defaultValues: initialSettings || defaultValues
  });

  React.useEffect(() => {
    if (initialSettings) {
      reset(initialSettings);
    }
  }, [initialSettings, reset]);

  React.useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  const onFormSubmit = async (data: AdminSettings) => {
    try {
      await onSubmit(data);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const renderLogicalTabContent = () => {
    switch (activeTab) {
      case 'businessProfile':
        return <BusinessProfileSettings control={control} register={register} errors={errors} watch={watch} />;

      case 'retailOperations':
        return <RetailOperationsSettings control={control} register={register} errors={errors} watch={watch} setValue={setValue} />;

      case 'cateringOperations':
        return <CateringOperationsSettings control={control} register={register} errors={errors} watch={watch} setValue={setValue} />;

      case 'marketing':
        return <MarketingSettings control={control} register={register} errors={errors} watch={watch} />;

      case 'advanced':
        return <AdvancedSettings control={control} register={register} errors={errors} watch={watch} />;

      default:
        return null;
    }
  };

  const renderLegacyTabContent = () => {
    switch (activeTab) {
      case 'pricing':
        return (
          <div className="space-y-6">
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
          </div>
        );

      case 'business':
        return <StoreInformationEditor control={control} register={register} errors={errors} />;

      case 'hours':
        return <BusinessHoursEditor control={control} errors={errors} />;

      case 'branding':
        return <BrandingEditor control={control} register={register} errors={errors} watch={watch} />;

      case 'notifications':
        return <NotificationPreferences control={control} register={register} errors={errors} setValue={setValue} watch={watch} />;

      case 'social':
        return <SocialMediaEditor control={control} register={register} errors={errors} />;

      case 'operations':
        return <OperationalSettings control={control} register={register} errors={errors} setValue={setValue} watch={watch} />;

      default:
        return null;
    }
  };

  const renderTabContent = () => {
    return currentView === 'logical' ? renderLogicalTabContent() : renderLegacyTabContent();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Settings</h1>
          <p className="text-gray-600 mt-2">
            {currentView === 'logical'
              ? 'Business-focused settings organized by how you actually run your restaurant'
              : 'Technical settings view for advanced configuration'
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {hasUnsavedChanges && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              <p className="text-sm text-amber-800 font-medium">Unsaved changes</p>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            {SETTINGS_VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => {
                  setCurrentView(view.id);
                  setActiveTab(view.id === 'logical' ? 'businessProfile' : 'pricing');
                }}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  currentView === view.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Tab Navigation */}
        <Card>
          <CardContent className="p-0">
            {currentView === 'logical' && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200 px-6 py-3">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-xl">💡</span>
                  <span className="font-medium text-gray-900">Business-Focused Organization:</span>
                  <span className="text-gray-600">
                    Settings are grouped by how you actually use them in restaurant operations.
                  </span>
                </div>
              </div>
            )}

            <div className="border-b border-gray-200">
              <nav className="flex space-x-6 px-6 overflow-x-auto" aria-label="Tabs">
                {(currentView === 'logical' ? LOGICAL_TABS : LEGACY_TABS).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors min-w-max
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <div className="flex flex-col items-start">
                      <span>{tab.label}</span>
                      {currentView === 'logical' && 'description' in tab && (
                        <span className="text-xs text-gray-400 font-normal">
                          {'description' in tab ? tab.description : ''}
                        </span>
                      )}
                    </div>
                    {currentView === 'logical' && 'priority' in tab && tab.priority === 'required' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                    {currentView === 'logical' && 'frequency' in tab && tab.frequency === 'daily' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Daily
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Panel for Logical View */}
        {currentView === 'logical' && activeTab === 'businessProfile' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">🚀</span>
                Quick Start Guide
              </CardTitle>
              <p className="text-sm text-green-700">
                New restaurant? Start here! Complete these essential steps to get your restaurant ready to accept orders.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">1️⃣</span>
                    <h4 className="font-medium">Business Profile</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Complete your business information, address, and contact details
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">2️⃣</span>
                    <h4 className="font-medium">Retail Operations</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Set up pricing, delivery zones, and daily operations
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">3️⃣</span>
                    <h4 className="font-medium">Catering Setup</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Configure event catering options and pricing models
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {renderTabContent()}
        </div>

        {/* Save Button */}
        <Card>
          <CardContent className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {hasUnsavedChanges ? (
                <span className="text-amber-600">You have unsaved changes</span>
              ) : (
                <span>All changes saved</span>
              )}
            </div>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setHasUnsavedChanges(false);
                }}
                disabled={isSubmitting || isLoading}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading || !hasUnsavedChanges}
              >
                {isSubmitting || isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}