import React from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import type { AdminSettings } from '../../types';

interface BrandingEditorProps {
  control: Control<AdminSettings>;
  register: any;
  errors?: FieldErrors<AdminSettings>;
  watch: any;
}

export default function BrandingEditor({
  control,
  register,
  errors,
  watch
}: BrandingEditorProps) {
  const [primaryColor, secondaryColor, accentColor] = watch([
    'branding.primaryColor',
    'branding.secondaryColor',
    'branding.accentColor'
  ]);

  const handleImageUpload = (fieldName: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real implementation, this would upload to a storage service
      console.log(`Upload ${fieldName}:`, file);
      // For now, just simulate URL
      const url = URL.createObjectURL(file);
      // You would use setValue from useForm here
      console.log(`Set ${fieldName} to:`, url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <p className="text-sm text-gray-600">
            Choose colors that represent your restaurant's brand and will be used throughout your website
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="branding.primaryColor">Primary Color</Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="branding.primaryColor"
                  {...register('branding.primaryColor')}
                  type="color"
                  className="w-16 h-10 p-1 border rounded cursor-pointer"
                />
                <Input
                  {...register('branding.primaryColor')}
                  placeholder="#DC2626"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">Main brand color for buttons and highlights</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branding.secondaryColor">Secondary Color</Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="branding.secondaryColor"
                  {...register('branding.secondaryColor')}
                  type="color"
                  className="w-16 h-10 p-1 border rounded cursor-pointer"
                />
                <Input
                  {...register('branding.secondaryColor')}
                  placeholder="#7C2D12"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">Supporting color for backgrounds and borders</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branding.accentColor">Accent Color</Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="branding.accentColor"
                  {...register('branding.accentColor')}
                  type="color"
                  className="w-16 h-10 p-1 border rounded cursor-pointer"
                />
                <Input
                  {...register('branding.accentColor')}
                  placeholder="#F59E0B"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">Accent color for calls-to-action</p>
            </div>
          </div>

          {/* Color Preview */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium mb-3">Preview</h4>
            <div className="space-y-2">
              <div
                className="h-8 rounded flex items-center px-4 text-white font-medium"
                style={{ backgroundColor: primaryColor || '#DC2626' }}
              >
                Primary Color Sample
              </div>
              <div
                className="h-8 rounded flex items-center px-4 text-white font-medium"
                style={{ backgroundColor: secondaryColor || '#7C2D12' }}
              >
                Secondary Color Sample
              </div>
              <div
                className="h-8 rounded flex items-center px-4 text-white font-medium"
                style={{ backgroundColor: accentColor || '#F59E0B' }}
              >
                Accent Color Sample
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo & Images */}
      <Card>
        <CardHeader>
          <CardTitle>Logo & Branding Images</CardTitle>
          <p className="text-sm text-gray-600">
            Upload your restaurant's logo and favicon for consistent branding
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Restaurant Logo</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Upload your logo</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload('branding.logoUrl')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <Input
                {...register('branding.logoUrl')}
                placeholder="Or paste logo URL"
                className={errors?.branding?.logoUrl ? 'border-red-500' : ''}
              />
            </div>

            <div className="space-y-3">
              <Label>Favicon</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <div className="space-y-2">
                  <div className="w-8 h-8 mx-auto bg-gray-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Upload favicon</p>
                  <p className="text-xs text-gray-500">16x16 or 32x32 px</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload('branding.faviconUrl')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <Input
                {...register('branding.faviconUrl')}
                placeholder="Or paste favicon URL"
                className={errors?.branding?.faviconUrl ? 'border-red-500' : ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <p className="text-sm text-gray-600">
            Choose fonts that match your restaurant's personality
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="branding.fonts.heading">Heading Font</Label>
              <select
                id="branding.fonts.heading"
                {...register('branding.fonts.heading')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Inter">Inter (Modern & Clean)</option>
                <option value="Poppins">Poppins (Friendly & Round)</option>
                <option value="Roboto">Roboto (Professional)</option>
                <option value="Playfair Display">Playfair Display (Elegant)</option>
                <option value="Oswald">Oswald (Bold & Strong)</option>
                <option value="Lora">Lora (Traditional)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="branding.fonts.body">Body Font</Label>
              <select
                id="branding.fonts.body"
                {...register('branding.fonts.body')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Inter">Inter (Modern & Clean)</option>
                <option value="Open Sans">Open Sans (Readable)</option>
                <option value="Roboto">Roboto (Professional)</option>
                <option value="Source Sans Pro">Source Sans Pro (Clean)</option>
                <option value="Lato">Lato (Friendly)</option>
                <option value="Nunito">Nunito (Rounded)</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium mb-3">Typography Preview</h4>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Inter' }}>
                Sample Heading Text
              </h1>
              <p className="text-gray-700" style={{ fontFamily: 'Inter' }}>
                This is how your body text will look. It should be easy to read and match your restaurant's style.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}