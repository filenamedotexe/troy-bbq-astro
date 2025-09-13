import React from 'react';
import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Button } from '../../ui/Button';
import type { AdminSettings } from '../../../types';

interface AdvancedSettingsProps {
  control: Control<AdminSettings>;
  register: UseFormRegister<AdminSettings>;
  errors: FieldErrors<AdminSettings>;
  watch: UseFormWatch<AdminSettings>;
}

export default function AdvancedSettings({
  control,
  register,
  errors,
  watch
}: AdvancedSettingsProps) {
  const [isExpanded, setIsExpanded] = React.useState<Record<string, boolean>>({
    inventory: false,
    thirdParty: false,
    reporting: false,
    staff: false,
    multiLocation: false,
    integrations: false
  });

  const toggleSection = (section: string) => {
    setIsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const PowerUserBadge = () => (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 ml-2">
      Power User
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">⚙️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-indigo-900">Advanced Operations</h3>
            <p className="text-indigo-700 text-sm mt-1">
              Advanced features for established restaurants ready to scale operations.
              These settings require additional setup and integration with third-party services.
            </p>
          </div>
        </div>
      </div>

      {/* Warning Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h4 className="font-semibold text-amber-900">Advanced Features Notice</h4>
              <p className="text-amber-700 text-sm mt-1">
                These features are designed for restaurants with established operations and technical resources.
                Most settings require additional subscriptions, integrations, or custom setup.
                Consider your current needs before enabling these features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">📦</span>
              Inventory Management Integration
              <PowerUserBadge />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('inventory')}
            >
              {isExpanded.inventory ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.inventory && (
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="inventory-enabled"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="inventory-enabled" className="font-medium">
                  Enable inventory tracking
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inventory-provider">Inventory System</Label>
                  <select
                    id="inventory-provider"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="none">Select Provider</option>
                    <option value="toast">Toast POS</option>
                    <option value="resy">Resy</option>
                    <option value="custom">Custom Integration</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="low-stock-alerts"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="low-stock-alerts" className="text-sm">Low stock alerts</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-reorder"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="auto-reorder" className="text-sm">Automatic reordering</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <span className="text-3xl mb-2 block">📊</span>
              <h4 className="font-medium text-gray-900">Advanced Inventory Features</h4>
              <p className="text-sm text-gray-600 mt-1">
                Real-time ingredient tracking, waste management, cost analysis, and automated supplier ordering.
              </p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                Configure Inventory System
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Third-Party Delivery Platforms */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">🛵</span>
              Third-Party Delivery Platforms
              <PowerUserBadge />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('thirdParty')}
            >
              {isExpanded.thirdParty ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.thirdParty && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Uber Eats */}
              <Card className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">🚗</span>
                    <div>
                      <h4 className="font-semibold">Uber Eats</h4>
                      <p className="text-xs text-gray-600">Food delivery platform</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="ubereats-enabled"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="ubereats-enabled" className="text-sm">Enable integration</Label>
                    </div>

                    <div>
                      <Label htmlFor="ubereats-store-id">Store ID</Label>
                      <Input
                        id="ubereats-store-id"
                        placeholder="Enter Uber Eats store ID"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ubereats-commission">Commission Rate (%)</Label>
                      <Input
                        id="ubereats-commission"
                        type="number"
                        step="0.01"
                        min="0"
                        max="50"
                        placeholder="30"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* DoorDash */}
              <Card className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">🏪</span>
                    <div>
                      <h4 className="font-semibold">DoorDash</h4>
                      <p className="text-xs text-gray-600">Food delivery platform</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="doordash-enabled"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="doordash-enabled" className="text-sm">Enable integration</Label>
                    </div>

                    <div>
                      <Label htmlFor="doordash-store-id">Store ID</Label>
                      <Input
                        id="doordash-store-id"
                        placeholder="Enter DoorDash store ID"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="doordash-commission">Commission Rate (%)</Label>
                      <Input
                        id="doordash-commission"
                        type="number"
                        step="0.01"
                        min="0"
                        max="50"
                        placeholder="30"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grubhub */}
              <Card className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">🍔</span>
                    <div>
                      <h4 className="font-semibold">Grubhub</h4>
                      <p className="text-xs text-gray-600">Food delivery platform</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="grubhub-enabled"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="grubhub-enabled" className="text-sm">Enable integration</Label>
                    </div>

                    <div>
                      <Label htmlFor="grubhub-store-id">Store ID</Label>
                      <Input
                        id="grubhub-store-id"
                        placeholder="Enter Grubhub store ID"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="grubhub-commission">Commission Rate (%)</Label>
                      <Input
                        id="grubhub-commission"
                        type="number"
                        step="0.01"
                        min="0"
                        max="50"
                        placeholder="30"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2">📋 Third-Party Platform Considerations</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Each platform takes a commission fee (typically 15-30%)</li>
                <li>• Menu prices may need to be higher to account for fees</li>
                <li>• Order volume can increase significantly</li>
                <li>• Customer data and relationships are managed by the platform</li>
                <li>• Integration requires technical setup and ongoing management</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Reporting & Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">📊</span>
              Advanced Reporting & Analytics
              <PowerUserBadge />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('reporting')}
            >
              {isExpanded.reporting ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.reporting && (
          <CardContent className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-3">Report Frequency</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="daily-reports"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    defaultChecked
                  />
                  <Label htmlFor="daily-reports" className="text-sm">Daily sales reports</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="weekly-reports"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    defaultChecked
                  />
                  <Label htmlFor="weekly-reports" className="text-sm">Weekly summaries</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="monthly-reports"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="monthly-reports" className="text-sm">Monthly analytics</Label>
                </div>
              </div>
            </div>

            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <span className="text-3xl mb-2 block">📈</span>
              <h4 className="font-medium text-gray-900">Custom Reporting Dashboard</h4>
              <p className="text-sm text-gray-600 mt-1">
                Advanced analytics including profit margins, customer lifetime value, popular items,
                peak hours analysis, and forecasting tools.
              </p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                Setup Custom Reports
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Staff Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">👥</span>
              Staff Management System
              <PowerUserBadge />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('staff')}
            >
              {isExpanded.staff ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.staff && (
          <CardContent className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <span className="text-4xl mb-2 block">👨‍💼</span>
              <h4 className="font-medium text-gray-900">Staff Management Coming Soon</h4>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive staff management including time clock, scheduling, performance tracking,
                role-based permissions, and payroll integration.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500">
                  Features: Digital time clock, shift scheduling, performance metrics, access control
                </p>
                <Button variant="outline" size="sm" disabled>
                  Setup Staff Management
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Multi-Location Support */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">🏢</span>
              Multi-Location Management
              <PowerUserBadge />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('multiLocation')}
            >
              {isExpanded.multiLocation ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.multiLocation && (
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="multi-location-enabled"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="multi-location-enabled" className="font-medium">
                  Enable multi-location support
                </Label>
              </div>

              <div className="text-sm text-red-700">
                ⚠️ This feature requires enterprise-level setup and additional licensing costs.
                Contact support for implementation details.
              </div>
            </div>

            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <span className="text-3xl mb-2 block">🗺️</span>
              <h4 className="font-medium text-gray-900">Enterprise Multi-Location Features</h4>
              <p className="text-sm text-gray-600 mt-1">
                Centralized management across multiple restaurant locations including shared inventory,
                cross-location orders, unified reporting, and location-specific customization.
              </p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                Contact Enterprise Sales
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* API & Custom Integrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="mr-2">🔌</span>
              API & Custom Integrations
              <PowerUserBadge />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('integrations')}
            >
              {isExpanded.integrations ? '📁' : '📂'}
            </Button>
          </div>
        </CardHeader>
        {isExpanded.integrations && (
          <CardContent className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <span className="text-4xl mb-2 block">⚡</span>
              <h4 className="font-medium text-gray-900">Developer API & Webhooks</h4>
              <p className="text-sm text-gray-600 mt-1">
                REST API access for custom integrations, webhooks for real-time data sync,
                and SDK for building custom applications.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500">
                  Perfect for: Custom POS systems, accounting software, marketing tools, loyalty programs
                </p>
                <Button variant="outline" size="sm" disabled>
                  View API Documentation
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Advanced Features Summary */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">🎓</span>
            </div>
            <div>
              <h4 className="font-semibold text-indigo-900">Ready to Scale?</h4>
              <p className="text-indigo-700 text-sm">
                These advanced features help established restaurants optimize operations, reduce costs,
                and scale efficiently. Most features require additional setup and may have subscription costs.
                Start with basic operations and add these features as your business grows.
              </p>
              <div className="mt-3">
                <Button variant="outline" size="sm" disabled>
                  Contact Sales for Enterprise Features
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}