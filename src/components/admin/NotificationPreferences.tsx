import React from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control, FieldErrors } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import type { AdminSettings } from '../../types';

interface NotificationPreferencesProps {
  control: Control<AdminSettings>;
  register: any;
  errors?: FieldErrors<AdminSettings>;
  setValue: any;
  watch: any;
}

export default function NotificationPreferences({
  control,
  register,
  errors,
  setValue,
  watch
}: NotificationPreferencesProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'notifications.adminEmails'
  });

  const smsEnabled = watch('notifications.smsNotifications.enabled');

  const emailNotifications = watch('notifications.emailNotifications');

  const addEmailAddress = () => {
    append('');
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <p className="text-sm text-gray-600">
            Configure which email notifications your restaurant will receive
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Order Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Order Updates</Label>
                    <p className="text-xs text-gray-500">New orders, status changes, cancellations</p>
                  </div>
                  <Switch
                    checked={emailNotifications?.orderUpdates}
                    onChange={(checked) => setValue('notifications.emailNotifications.orderUpdates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Catering Inquiries</Label>
                    <p className="text-xs text-gray-500">New catering quote requests</p>
                  </div>
                  <Switch
                    checked={emailNotifications?.cateringInquiries}
                    onChange={(checked) => setValue('notifications.emailNotifications.cateringInquiries', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Business Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Low Inventory Alerts</Label>
                    <p className="text-xs text-gray-500">When products are running low</p>
                  </div>
                  <Switch
                    checked={emailNotifications?.lowInventoryAlerts}
                    onChange={(checked) => setValue('notifications.emailNotifications.lowInventoryAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Daily Reports</Label>
                    <p className="text-xs text-gray-500">Daily sales and order summaries</p>
                  </div>
                  <Switch
                    checked={emailNotifications?.dailyReports}
                    onChange={(checked) => setValue('notifications.emailNotifications.dailyReports', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Weekly Reports</Label>
                    <p className="text-xs text-gray-500">Weekly business performance reports</p>
                  </div>
                  <Switch
                    checked={emailNotifications?.weeklyReports}
                    onChange={(checked) => setValue('notifications.emailNotifications.weeklyReports', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            SMS Notifications
            <Switch
              checked={smsEnabled}
              onChange={(checked) => setValue('notifications.smsNotifications.enabled', checked)}
            />
          </CardTitle>
          <p className="text-sm text-gray-600">
            Receive urgent notifications via text message (requires SMS service setup)
          </p>
        </CardHeader>
        <CardContent>
          {smsEnabled ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> SMS notifications require integration with a SMS service provider like Twilio.
                  Contact support for setup assistance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Order Updates</Label>
                    <p className="text-xs text-gray-500">Critical order status changes</p>
                  </div>
                  <Switch
                    {...register('notifications.smsNotifications.orderUpdates')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Urgent Alerts</Label>
                    <p className="text-xs text-gray-500">System errors, payment failures</p>
                  </div>
                  <Switch
                    {...register('notifications.smsNotifications.urgentAlerts')}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Enable SMS notifications to configure text message alerts</p>
          )}
        </CardContent>
      </Card>

      {/* Admin Email Addresses */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Email Addresses</CardTitle>
          <p className="text-sm text-gray-600">
            Email addresses that will receive notifications and admin alerts
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-3">
                <div className="flex-1">
                  <Input
                    {...register(`notifications.adminEmails.${index}` as const)}
                    type="email"
                    placeholder="admin@troybbq.com"
                    className={errors?.notifications?.adminEmails?.[index] ? 'border-red-500' : ''}
                  />
                  {errors?.notifications?.adminEmails?.[index] && (
                    <p className="text-sm text-red-600 mt-1">
                      Valid email address required
                    </p>
                  )}
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addEmailAddress}
            className="w-full"
          >
            + Add Email Address
          </Button>
        </CardContent>
      </Card>

      {/* Customer Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Email Templates</CardTitle>
          <p className="text-sm text-gray-600">
            Choose email templates for customer communications
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="notifications.customerEmailSettings.orderConfirmationTemplate">
                Order Confirmation
              </Label>
              <select
                id="notifications.customerEmailSettings.orderConfirmationTemplate"
                {...register('notifications.customerEmailSettings.orderConfirmationTemplate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="default">Default Template</option>
                <option value="branded">Branded Template</option>
                <option value="minimal">Minimal Template</option>
              </select>
            </div>

            <div>
              <Label htmlFor="notifications.customerEmailSettings.orderStatusUpdateTemplate">
                Order Status Updates
              </Label>
              <select
                id="notifications.customerEmailSettings.orderStatusUpdateTemplate"
                {...register('notifications.customerEmailSettings.orderStatusUpdateTemplate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="default">Default Template</option>
                <option value="branded">Branded Template</option>
                <option value="minimal">Minimal Template</option>
              </select>
            </div>

            <div>
              <Label htmlFor="notifications.customerEmailSettings.cateringQuoteTemplate">
                Catering Quotes
              </Label>
              <select
                id="notifications.customerEmailSettings.cateringQuoteTemplate"
                {...register('notifications.customerEmailSettings.cateringQuoteTemplate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="default">Default Template</option>
                <option value="branded">Branded Template</option>
                <option value="professional">Professional Template</option>
              </select>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-900 mb-2">Template Customization</h4>
            <p className="text-sm text-amber-800">
              Want to customize your email templates with your own branding and messaging?
              Contact support to set up custom templates for your restaurant.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}