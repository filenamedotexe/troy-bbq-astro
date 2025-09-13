import React from 'react';
import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Button } from '../../ui/Button';
import type { AdminSettings } from '../../../types';

interface BusinessProfileSettingsProps {
  control: Control<AdminSettings>;
  register: UseFormRegister<AdminSettings>;
  errors: FieldErrors<AdminSettings>;
  watch: UseFormWatch<AdminSettings>;
}

export default function BusinessProfileSettings({
  control,
  register,
  errors,
  watch
}: BusinessProfileSettingsProps) {
  const [isExpanded, setIsExpanded] = React.useState<Record<string, boolean>>({
    basic: true,
    address: false,
    contact: false,
    business: false,
    hours: false
  });

  const toggleSection = (section: string) => {
    setIsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const RequiredIndicator = () => (
    <span className="text-red-500 ml-1" title="Required field">*</span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">🏪</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Business Profile</h3>
            <p className="text-blue-700 text-sm mt-1">
              Core business information required to operate. Fields marked with <RequiredIndicator /> are mandatory and must be completed before your restaurant can accept orders.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">📋</span>
              Basic Information
              <RequiredIndicator />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('basic')}
            >
              {isExpanded.basic ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.basic && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeInformation.businessName">
                  Business Name <RequiredIndicator />
                </Label>
                <Input
                  id="storeInformation.businessName"
                  {...register('storeInformation.businessName')}
                  className={errors.storeInformation?.businessName ? 'border-red-500' : ''}
                  placeholder="Troy BBQ"
                />
                {errors.storeInformation?.businessName && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.storeInformation.businessName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="storeInformation.tagline">
                  Tagline
                </Label>
                <Input
                  id="storeInformation.tagline"
                  {...register('storeInformation.tagline')}
                  className={errors.storeInformation?.tagline ? 'border-red-500' : ''}
                  placeholder="Smokin Good BBQ Since Day One"
                />
                {errors.storeInformation?.tagline && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.storeInformation.tagline.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="storeInformation.description">
                Business Description
              </Label>
              <textarea
                id="storeInformation.description"
                {...register('storeInformation.description')}
                className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.storeInformation?.description ? 'border-red-500' : ''
                }`}
                placeholder="Authentic Texas BBQ with house-smoked meats and traditional sides"
                rows={3}
              />
              {errors.storeInformation?.description && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.description.message}
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">📍</span>
              Business Address
              <RequiredIndicator />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('address')}
            >
              {isExpanded.address ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.address && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="storeInformation.address.street">
                Street Address <RequiredIndicator />
              </Label>
              <Input
                id="storeInformation.address.street"
                {...register('storeInformation.address.street')}
                className={errors.storeInformation?.address?.street ? 'border-red-500' : ''}
                placeholder="123 BBQ Street"
              />
              {errors.storeInformation?.address?.street && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.address.street.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="storeInformation.address.city">
                  City <RequiredIndicator />
                </Label>
                <Input
                  id="storeInformation.address.city"
                  {...register('storeInformation.address.city')}
                  className={errors.storeInformation?.address?.city ? 'border-red-500' : ''}
                  placeholder="Troy"
                />
                {errors.storeInformation?.address?.city && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.storeInformation.address.city.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="storeInformation.address.state">
                  State <RequiredIndicator />
                </Label>
                <Input
                  id="storeInformation.address.state"
                  {...register('storeInformation.address.state')}
                  className={errors.storeInformation?.address?.state ? 'border-red-500' : ''}
                  placeholder="Texas"
                />
                {errors.storeInformation?.address?.state && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.storeInformation.address.state.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="storeInformation.address.zipCode">
                  ZIP Code <RequiredIndicator />
                </Label>
                <Input
                  id="storeInformation.address.zipCode"
                  {...register('storeInformation.address.zipCode')}
                  className={errors.storeInformation?.address?.zipCode ? 'border-red-500' : ''}
                  placeholder="75001"
                />
                {errors.storeInformation?.address?.zipCode && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.storeInformation.address.zipCode.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="storeInformation.address.country">
                Country <RequiredIndicator />
              </Label>
              <Input
                id="storeInformation.address.country"
                {...register('storeInformation.address.country')}
                className={errors.storeInformation?.address?.country ? 'border-red-500' : ''}
                placeholder="United States"
              />
              {errors.storeInformation?.address?.country && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.address.country.message}
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">📞</span>
              Contact Information
              <RequiredIndicator />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('contact')}
            >
              {isExpanded.contact ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.contact && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeInformation.contact.phone">
                  Business Phone <RequiredIndicator />
                </Label>
                <Input
                  id="storeInformation.contact.phone"
                  type="tel"
                  {...register('storeInformation.contact.phone')}
                  className={errors.storeInformation?.contact?.phone ? 'border-red-500' : ''}
                  placeholder="(555) 123-4567"
                />
                {errors.storeInformation?.contact?.phone && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.storeInformation.contact.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="storeInformation.contact.email">
                  Business Email <RequiredIndicator />
                </Label>
                <Input
                  id="storeInformation.contact.email"
                  type="email"
                  {...register('storeInformation.contact.email')}
                  className={errors.storeInformation?.contact?.email ? 'border-red-500' : ''}
                  placeholder="info@troybbq.com"
                />
                {errors.storeInformation?.contact?.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.storeInformation.contact.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="storeInformation.contact.website">
                Website URL
              </Label>
              <Input
                id="storeInformation.contact.website"
                type="url"
                {...register('storeInformation.contact.website')}
                className={errors.storeInformation?.contact?.website ? 'border-red-500' : ''}
                placeholder="https://troybbq.com"
              />
              {errors.storeInformation?.contact?.website && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.contact.website.message}
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Setup Completion Status */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <h4 className="font-semibold text-green-900">Setup Progress</h4>
              <p className="text-green-700 text-sm">
                Complete all required fields above to enable order processing.
                Your restaurant will be ready to accept orders once all mandatory information is provided.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}