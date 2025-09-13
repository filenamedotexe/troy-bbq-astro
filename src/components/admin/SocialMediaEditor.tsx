import React from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import type { AdminSettings } from '../../types';

interface SocialMediaEditorProps {
  control: Control<AdminSettings>;
  register: any;
  errors?: FieldErrors<AdminSettings>;
}

const SOCIAL_PLATFORMS = [
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/troybbq',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: 'text-blue-600'
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/troybbq',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.845 16.725c-2.067 0-3.74-1.673-3.74-3.74s1.673-3.74 3.74-3.74 3.74 1.673 3.74 3.74-1.673 3.74-3.74 3.74zm6.305-7.569h-.793c-.033-.298-.082-.593-.146-.883h.939v.883zm-.939-1.766h-.939c-.119-.302-.261-.595-.425-.873h1.364v.873zm-1.364-.873h-1.364c-.164.278-.306.571-.425.873h1.789v-.873z"/>
      </svg>
    ),
    color: 'text-pink-600'
  },
  {
    key: 'twitter',
    label: 'Twitter / X',
    placeholder: 'https://twitter.com/troybbq',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    ),
    color: 'text-blue-400'
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/company/troybbq',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    color: 'text-blue-700'
  },
  {
    key: 'youtube',
    label: 'YouTube',
    placeholder: 'https://youtube.com/c/troybbq',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    color: 'text-red-600'
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@troybbq',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
    color: 'text-black'
  }
] as const;

const BUSINESS_PLATFORMS = [
  {
    key: 'googleBusiness',
    label: 'Google Business',
    placeholder: 'https://goo.gl/maps/your-business-link',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    color: 'text-blue-600'
  },
  {
    key: 'yelp',
    label: 'Yelp',
    placeholder: 'https://yelp.com/biz/troy-bbq',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21.111 18.226c-.141.969-2.119 1.794-3.103 1.794-.27 0-.536-.058-.809-.164-1.32-.509-2.667-.927-4.017-1.368-.246-.081-.469-.224-.621-.442-.201-.288-.254-.652-.124-1.004.122-.328.353-.564.649-.691l.064-.024c.847-.289 1.679-.61 2.506-.975l.002.001c.379-.168.73-.295.915-.301.104-.003.204.004.299.023.413.082.779.363.935.776.148.413.079.878-.208 1.202l-.517.67-.001-.002c-.255.346-.479.675-.692 1.016-.115.179-.166.373-.112.569.068.253.235.456.467.568.113.056.229.087.345.098zm-8.844-2.906c.146.328.113.707-.07 1.018l-.13.24c-.148.265-.355.516-.572.728-.239.231-.568.354-.903.314-.371-.045-.686-.285-.848-.644-.147-.325-.098-.702.125-1 .127-.17.274-.325.435-.467l.024-.02c.68-.608 1.386-1.178 2.129-1.705.341-.243.764-.442 1.198-.442.297 0 .594.089.842.275.248.186.424.458.5.758.048.19.026.383-.04.564l-.69-.619zm-1.464-2.157l.477-.205c.324-.139.622-.342.865-.601.267-.284.459-.637.563-1.024.115-.428.095-.886-.058-1.297-.139-.372-.413-.681-.767-.868-.32-.169-.686-.234-1.04-.185-.383.052-.743.24-1.016.529-.156.166-.285.356-.384.563l-.009.021c-.429.914-.795 1.857-1.098 2.826-.139.445-.192.95-.075 1.413.081.318.261.601.521.807.26.206.585.315.919.315.224 0 .452-.049.671-.142.438-.185.794-.54.99-.988.117-.268.138-.566.068-.847l-.627.683zm2.167-6.587c-.085.404-.357.766-.724 1.004-.367.239-.818.333-1.244.261-.383-.065-.73-.286-.966-.614-.214-.297-.307-.664-.267-1.023.036-.324.173-.631.395-.867.221-.235.52-.386.844-.425.359-.043.728.037 1.032.225.304.188.535.477.652.814.083.239.102.487.054.727l-.776-.102z"/>
      </svg>
    ),
    color: 'text-red-500'
  }
] as const;

export default function SocialMediaEditor({
  control,
  register,
  errors
}: SocialMediaEditorProps) {
  return (
    <div className="space-y-6">
      {/* Social Media Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Profiles</CardTitle>
          <p className="text-sm text-gray-600">
            Connect your restaurant's social media accounts to build your online presence
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform.key} className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <span className={platform.color}>
                    {platform.icon}
                  </span>
                  <span>{platform.label}</span>
                </Label>
                <Input
                  {...register(`socialMedia.${platform.key}`)}
                  placeholder={platform.placeholder}
                  type="url"
                  className={errors?.socialMedia?.[platform.key as keyof typeof errors.socialMedia] ? 'border-red-500' : ''}
                />
                {errors?.socialMedia?.[platform.key as keyof typeof errors.socialMedia] && (
                  <p className="text-sm text-red-600">
                    Please enter a valid URL
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Directory Platforms */}
      <Card>
        <CardHeader>
          <CardTitle>Business Directories</CardTitle>
          <p className="text-sm text-gray-600">
            Link to your business profiles on review and directory sites
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BUSINESS_PLATFORMS.map((platform) => (
              <div key={platform.key} className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <span className={platform.color}>
                    {platform.icon}
                  </span>
                  <span>{platform.label}</span>
                </Label>
                <Input
                  {...register(`socialMedia.${platform.key}`)}
                  placeholder={platform.placeholder}
                  type="url"
                  className={errors?.socialMedia?.[platform.key as keyof typeof errors.socialMedia] ? 'border-red-500' : ''}
                />
                {errors?.socialMedia?.[platform.key as keyof typeof errors.socialMedia] && (
                  <p className="text-sm text-red-600">
                    Please enter a valid URL
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Media Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Marketing Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-green-900">Best Practices</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Post high-quality food photos regularly</li>
                <li>• Share behind-the-scenes cooking content</li>
                <li>• Respond to comments and reviews promptly</li>
                <li>• Use local hashtags to reach nearby customers</li>
                <li>• Share customer testimonials and reviews</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-blue-900">Content Ideas</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Daily specials and menu highlights</li>
                <li>• Staff spotlights and team photos</li>
                <li>• Cooking process and preparation videos</li>
                <li>• Customer photos and user-generated content</li>
                <li>• Events, catering, and special offers</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Need Help with Social Media?</h4>
            <p className="text-sm text-gray-700 mb-3">
              Consider using social media management tools or hiring a social media manager
              to maintain consistent posting and engagement.
            </p>
            <Button variant="outline" size="sm">
              Learn More About Social Media Marketing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}