import React from 'react';
import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Button } from '../../ui/Button';
import type { AdminSettings } from '../../../types';

interface MarketingSettingsProps {
  control: Control<AdminSettings>;
  register: UseFormRegister<AdminSettings>;
  errors: FieldErrors<AdminSettings>;
  watch: UseFormWatch<AdminSettings>;
}

export default function MarketingSettings({
  control,
  register,
  errors,
  watch
}: MarketingSettingsProps) {
  const [isExpanded, setIsExpanded] = React.useState<Record<string, boolean>>({
    social: true,
    email: false,
    reviews: false,
    loyalty: false,
    notifications: false
  });

  const toggleSection = (section: string) => {
    setIsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const OptionalBadge = () => (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 ml-2">
      Optional
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">📱</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-pink-900">Marketing & Customer Communication</h3>
            <p className="text-pink-700 text-sm mt-1">
              Optional features to help you connect with customers, build loyalty, and grow your business.
              These settings enhance your customer experience but aren't required for operations.
            </p>
          </div>
        </div>
      </div>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">📲</span>
              Social Media Links
              <OptionalBadge />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('social')}
            >
              {isExpanded.social ? '📁' : '📂'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Connect your social media accounts to display on your website and marketing materials.
          </p>
        </CardHeader>
        {isExpanded.social && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="socialMedia.facebook" className="flex items-center">
                  <span className="mr-2">📘</span>
                  Facebook Page URL
                </Label>
                <Input
                  id="socialMedia.facebook"
                  type="url"
                  {...register('socialMedia.facebook')}
                  className={errors.socialMedia?.facebook ? 'border-red-500' : ''}
                  placeholder="https://facebook.com/troybbq"
                />
                {errors.socialMedia?.facebook && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.socialMedia.facebook.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="socialMedia.instagram" className="flex items-center">
                  <span className="mr-2">📷</span>
                  Instagram Profile URL
                </Label>
                <Input
                  id="socialMedia.instagram"
                  type="url"
                  {...register('socialMedia.instagram')}
                  className={errors.socialMedia?.instagram ? 'border-red-500' : ''}
                  placeholder="https://instagram.com/troybbq"
                />
                {errors.socialMedia?.instagram && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.socialMedia.instagram.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="socialMedia.twitter" className="flex items-center">
                  <span className="mr-2">🐦</span>
                  Twitter Profile URL
                </Label>
                <Input
                  id="socialMedia.twitter"
                  type="url"
                  {...register('socialMedia.twitter')}
                  className={errors.socialMedia?.twitter ? 'border-red-500' : ''}
                  placeholder="https://twitter.com/troybbq"
                />
                {errors.socialMedia?.twitter && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.socialMedia.twitter.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="socialMedia.youtube" className="flex items-center">
                  <span className="mr-2">📺</span>
                  YouTube Channel URL
                </Label>
                <Input
                  id="socialMedia.youtube"
                  type="url"
                  {...register('socialMedia.youtube')}
                  className={errors.socialMedia?.youtube ? 'border-red-500' : ''}
                  placeholder="https://youtube.com/@troybbq"
                />
                {errors.socialMedia?.youtube && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.socialMedia.youtube.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="socialMedia.tiktok" className="flex items-center">
                  <span className="mr-2">🎵</span>
                  TikTok Profile URL
                </Label>
                <Input
                  id="socialMedia.tiktok"
                  type="url"
                  {...register('socialMedia.tiktok')}
                  className={errors.socialMedia?.tiktok ? 'border-red-500' : ''}
                  placeholder="https://tiktok.com/@troybbq"
                />
                {errors.socialMedia?.tiktok && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.socialMedia.tiktok.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="socialMedia.linkedin" className="flex items-center">
                  <span className="mr-2">💼</span>
                  LinkedIn Company URL
                </Label>
                <Input
                  id="socialMedia.linkedin"
                  type="url"
                  {...register('socialMedia.linkedin')}
                  className={errors.socialMedia?.linkedin ? 'border-red-500' : ''}
                  placeholder="https://linkedin.com/company/troybbq"
                />
                {errors.socialMedia?.linkedin && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.socialMedia.linkedin.message}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">💡 Social Media Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use your business page URLs, not personal profiles</li>
                <li>• Keep your social media updated with daily specials and events</li>
                <li>• Share behind-the-scenes content to build community</li>
                <li>• Respond promptly to customer messages and reviews</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Email Marketing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">📧</span>
              Email Marketing
              <OptionalBadge />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('email')}
            >
              {isExpanded.email ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.email && (
          <CardContent className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <span className="text-4xl mb-2 block">📬</span>
              <h4 className="font-medium text-gray-900">Email Marketing Integration Coming Soon</h4>
              <p className="text-sm text-gray-600 mt-1">
                Connect with Mailchimp, Constant Contact, or other email marketing platforms to send newsletters, promotions, and customer updates.
              </p>
              <div className="mt-4">
                <Button variant="outline" size="sm" disabled>
                  Connect Email Provider
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Review Platform Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">⭐</span>
              Review Platform Integration
              <OptionalBadge />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('reviews')}
            >
              {isExpanded.reviews ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.reviews && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Google Reviews */}
              <Card className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">🔍</span>
                    <div>
                      <h4 className="font-semibold">Google Reviews</h4>
                      <p className="text-sm text-gray-600">Manage Google Business Profile reviews</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="google-reviews-enabled"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="google-reviews-enabled" className="text-sm">Enable Google Reviews integration</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="google-auto-request"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="google-auto-request" className="text-sm">Auto-request reviews after orders</Label>
                    </div>

                    <div>
                      <Label htmlFor="socialMedia.googleBusiness">Google Business Profile URL</Label>
                      <Input
                        id="socialMedia.googleBusiness"
                        type="url"
                        {...register('socialMedia.googleBusiness')}
                        placeholder="https://goo.gl/maps/..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Yelp Integration */}
              <Card className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">🍽️</span>
                    <div>
                      <h4 className="font-semibold">Yelp Integration</h4>
                      <p className="text-sm text-gray-600">Connect with your Yelp business page</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="yelp-enabled"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="yelp-enabled" className="text-sm">Enable Yelp integration</Label>
                    </div>

                    <div>
                      <Label htmlFor="socialMedia.yelp">Yelp Business URL</Label>
                      <Input
                        id="socialMedia.yelp"
                        type="url"
                        {...register('socialMedia.yelp')}
                        placeholder="https://yelp.com/biz/troy-bbq..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ Review Management Best Practices</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Respond to all reviews, both positive and negative</li>
                <li>• Address concerns professionally and offer solutions</li>
                <li>• Thank customers for positive feedback</li>
                <li>• Use reviews to improve your service and menu</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Loyalty Program */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">🎁</span>
              Loyalty Program
              <OptionalBadge />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('loyalty')}
            >
              {isExpanded.loyalty ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.loyalty && (
          <CardContent className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <span className="text-4xl mb-2 block">🏆</span>
              <h4 className="font-medium text-gray-900">Customer Loyalty Program Coming Soon</h4>
              <p className="text-sm text-gray-600 mt-1">
                Reward repeat customers with points, discounts, and special offers to build long-term relationships.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500">
                  Features will include: Points system, rewards tiers, birthday specials, referral bonuses
                </p>
                <Button variant="outline" size="sm" disabled>
                  Setup Loyalty Program
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Customer Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">🔔</span>
              Customer Notification Preferences
              <OptionalBadge />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('notifications')}
            >
              {isExpanded.notifications ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.notifications && (
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-3">Customer Communication Preferences</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-green-800 mb-2">Order-Related Notifications</h5>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notifications.customerEmailSettings.orderUpdates"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        defaultChecked
                      />
                      <Label htmlFor="notifications.customerEmailSettings.orderUpdates" className="text-sm">
                        Order status updates
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="customer-sms-enabled"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="customer-sms-enabled" className="text-sm">
                        SMS notifications
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="customer-push-enabled"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="customer-push-enabled" className="text-sm">
                        Push notifications (mobile app)
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-green-800 mb-2">Marketing Communications</h5>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="customer-promotions"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="customer-promotions" className="text-sm">
                        Promotional offers
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="customer-surveys"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="customer-surveys" className="text-sm">
                        Feedback surveys
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="customer-newsletter"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="customer-newsletter" className="text-sm">
                        Monthly newsletter
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">📱 Communication Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Always get customer consent before sending marketing messages</li>
                <li>• Keep promotional emails focused on value and specials</li>
                <li>• Use SMS sparingly for time-sensitive updates only</li>
                <li>• Provide easy unsubscribe options in all communications</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Setup Progress */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚀</span>
            </div>
            <div>
              <h4 className="font-semibold text-pink-900">Marketing Enhancement</h4>
              <p className="text-pink-700 text-sm">
                These optional features help you connect with customers and grow your business.
                Start with social media links and add other features as your business grows.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}