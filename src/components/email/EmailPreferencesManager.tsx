import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface EmailPreferences {
  email: string;
  quotes: boolean;
  payments: boolean;
  order_updates: boolean;
  event_reminders: boolean;
  marketing: boolean;
  newsletters: boolean;
  unsubscribed_all: boolean;
}

interface EmailPreferencesManagerProps {
  token?: string;
  email?: string;
}

export function EmailPreferencesManager({ token, email }: EmailPreferencesManagerProps) {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [token, email]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (token) params.append('token', token);
      if (email) params.append('email', email);
      
      const response = await fetch(`/api/email-preferences?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.preferences);
      } else {
        setError(data.error || 'Failed to load preferences');
      }
    } catch (err) {
      setError('Failed to load email preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<EmailPreferences>) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const requestBody = {
        preferences: newPreferences,
        ...(token && { token }),
        ...(email && { email })
      };
      
      const response = await fetch('/api/email-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.preferences);
        setSuccess('Preferences updated successfully!');
      } else {
        setError(data.error || 'Failed to update preferences');
      }
    } catch (err) {
      setError('Failed to update email preferences');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof EmailPreferences, value: boolean) => {
    if (!preferences) return;
    
    const newPreferences = {
      ...preferences,
      [key]: value
    };
    
    setPreferences(newPreferences);
    updatePreferences({ [key]: value });
  };

  const handleUnsubscribeAll = async () => {
    if (!confirm('Are you sure you want to unsubscribe from all emails? You will only receive essential order-related notifications.')) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const requestBody = {
        ...(token && { token }),
        ...(email && { email })
      };
      
      const response = await fetch('/api/email-preferences/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Successfully unsubscribed from all emails!');
        // Reload preferences to reflect changes
        await loadPreferences();
      } else {
        setError(data.error || 'Failed to unsubscribe');
      }
    } catch (err) {
      setError('Failed to process unsubscribe request');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your email preferences...</p>
        </div>
      </Card>
    );
  }

  if (error && !preferences) {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadPreferences}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-orange-800 mb-2">Email Preferences</h1>
        <p className="text-gray-600">Manage your Troy BBQ email notifications</p>
        {preferences && (
          <p className="text-sm text-gray-500 mt-2">Managing preferences for: {preferences.email}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {preferences && (
        <div className="space-y-6">
          {preferences.unsubscribed_all ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                You are currently unsubscribed from all emails
              </h3>
              <p className="text-yellow-700 mb-4">
                You will only receive essential order and catering notifications.
              </p>
              <Button
                onClick={() => handlePreferenceChange('unsubscribed_all', false)}
                disabled={saving}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                Re-subscribe to Emails
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Email Types</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.quotes}
                      onChange={(e) => handlePreferenceChange('quotes', e.target.checked)}
                      disabled={saving}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Quote Notifications</span>
                      <p className="text-sm text-gray-600">Confirmations and updates about your catering quotes</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.payments}
                      onChange={(e) => handlePreferenceChange('payments', e.target.checked)}
                      disabled={saving}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Payment Confirmations</span>
                      <p className="text-sm text-gray-600">Receipts and payment confirmations</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.order_updates}
                      onChange={(e) => handlePreferenceChange('order_updates', e.target.checked)}
                      disabled={saving}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Order Updates</span>
                      <p className="text-sm text-gray-600">Status updates about your catering orders</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.event_reminders}
                      onChange={(e) => handlePreferenceChange('event_reminders', e.target.checked)}
                      disabled={saving}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Event Reminders</span>
                      <p className="text-sm text-gray-600">Helpful reminders before your catering events</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                      disabled={saving}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Marketing Emails</span>
                      <p className="text-sm text-gray-600">Special offers, promotions, and announcements</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.newsletters}
                      onChange={(e) => handlePreferenceChange('newsletters', e.target.checked)}
                      disabled={saving}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Newsletter</span>
                      <p className="text-sm text-gray-600">Monthly updates, recipes, and BBQ tips</p>
                    </div>
                  </label>
                </div>
              </div>

              <hr className="border-gray-200" />

              <div className="text-center">
                <Button
                  onClick={handleUnsubscribeAll}
                  disabled={saving}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Unsubscribe from All Emails
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  You'll still receive essential order and catering notifications
                </p>
              </div>
            </>
          )}

          {saving && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
              <span className="ml-2 text-gray-600">Saving...</span>
            </div>
          )}
        </div>
      )}

      <div className="text-center mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Need help? Contact us at <a href="mailto:support@troybbq.com" className="text-orange-600 hover:underline">support@troybbq.com</a>
        </p>
      </div>
    </Card>
  );
}