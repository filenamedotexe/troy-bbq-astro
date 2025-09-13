import React from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import type { AdminSettings } from '../../types';

interface StoreInformationEditorProps {
  control: Control<AdminSettings>;
  register: any;
  errors?: FieldErrors<AdminSettings>;
}

export default function StoreInformationEditor({
  control,
  register,
  errors
}: StoreInformationEditorProps) {
  return (
    <div className="space-y-6">
      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <p className="text-sm text-gray-600">
            Basic information about your restaurant that will appear on your website and marketing materials
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storeInformation.businessName">Business Name</Label>
              <Input
                id="storeInformation.businessName"
                {...register('storeInformation.businessName')}
                placeholder="e.g., Troy BBQ"
                className={errors?.storeInformation?.businessName ? 'border-red-500' : ''}
              />
              {errors?.storeInformation?.businessName && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.businessName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="storeInformation.tagline">Tagline</Label>
              <Input
                id="storeInformation.tagline"
                {...register('storeInformation.tagline')}
                placeholder="e.g., Smokin' Good BBQ Since Day One"
                className={errors?.storeInformation?.tagline ? 'border-red-500' : ''}
              />
              {errors?.storeInformation?.tagline && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.tagline.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="storeInformation.description">Description</Label>
            <textarea
              id="storeInformation.description"
              {...register('storeInformation.description')}
              rows={3}
              placeholder="Brief description of your restaurant..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors?.storeInformation?.description && (
              <p className="text-sm text-red-600 mt-1">
                {errors.storeInformation.description.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <p className="text-sm text-gray-600">
            Your restaurant's physical location for deliveries and customer visits
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="storeInformation.address.street">Street Address</Label>
            <Input
              id="storeInformation.address.street"
              {...register('storeInformation.address.street')}
              placeholder="123 Main Street"
              className={errors?.storeInformation?.address?.street ? 'border-red-500' : ''}
            />
            {errors?.storeInformation?.address?.street && (
              <p className="text-sm text-red-600 mt-1">
                {errors.storeInformation.address.street.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="storeInformation.address.city">City</Label>
              <Input
                id="storeInformation.address.city"
                {...register('storeInformation.address.city')}
                placeholder="Troy"
                className={errors?.storeInformation?.address?.city ? 'border-red-500' : ''}
              />
              {errors?.storeInformation?.address?.city && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.address.city.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="storeInformation.address.state">State</Label>
              <Input
                id="storeInformation.address.state"
                {...register('storeInformation.address.state')}
                placeholder="Texas"
                className={errors?.storeInformation?.address?.state ? 'border-red-500' : ''}
              />
              {errors?.storeInformation?.address?.state && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.address.state.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="storeInformation.address.zipCode">ZIP Code</Label>
              <Input
                id="storeInformation.address.zipCode"
                {...register('storeInformation.address.zipCode')}
                placeholder="75001"
                className={errors?.storeInformation?.address?.zipCode ? 'border-red-500' : ''}
              />
              {errors?.storeInformation?.address?.zipCode && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.address.zipCode.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="storeInformation.address.country">Country</Label>
              <Input
                id="storeInformation.address.country"
                {...register('storeInformation.address.country')}
                placeholder="United States"
                className={errors?.storeInformation?.address?.country ? 'border-red-500' : ''}
              />
              {errors?.storeInformation?.address?.country && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.address.country.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <p className="text-sm text-gray-600">
            How customers can reach your restaurant
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="storeInformation.contact.phone">Phone Number</Label>
              <Input
                id="storeInformation.contact.phone"
                {...register('storeInformation.contact.phone')}
                placeholder="(555) 123-4567"
                type="tel"
                className={errors?.storeInformation?.contact?.phone ? 'border-red-500' : ''}
              />
              {errors?.storeInformation?.contact?.phone && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.contact.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="storeInformation.contact.email">Email Address</Label>
              <Input
                id="storeInformation.contact.email"
                {...register('storeInformation.contact.email')}
                placeholder="info@troybbq.com"
                type="email"
                className={errors?.storeInformation?.contact?.email ? 'border-red-500' : ''}
              />
              {errors?.storeInformation?.contact?.email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.contact.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="storeInformation.contact.website">Website (Optional)</Label>
              <Input
                id="storeInformation.contact.website"
                {...register('storeInformation.contact.website')}
                placeholder="https://troybbq.com"
                type="url"
                className={errors?.storeInformation?.contact?.website ? 'border-red-500' : ''}
              />
              {errors?.storeInformation?.contact?.website && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.storeInformation.contact.website.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}