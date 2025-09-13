import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import type { CateringQuote, QuoteStatus } from '../../types';
import { formatCurrency, capitalizeFirst } from '../../lib/utils';

interface QuoteStatusUpdateProps {
  quote: CateringQuote;
  onUpdate: (quoteId: string) => Promise<void>;
  onClose: () => void;
}

interface StatusOption {
  value: QuoteStatus;
  label: string;
  description: string;
  requiresOrderId?: 'deposit' | 'balance';
  color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'pending',
    label: 'Pending',
    description: 'Quote is awaiting review and approval',
    color: 'text-yellow-600'
  },
  {
    value: 'approved',
    label: 'Approved',
    description: 'Quote has been approved and awaiting deposit payment',
    color: 'text-blue-600'
  },
  {
    value: 'deposit_paid',
    label: 'Deposit Paid',
    description: 'Customer has paid the deposit',
    requiresOrderId: 'deposit',
    color: 'text-purple-600'
  },
  {
    value: 'confirmed',
    label: 'Confirmed',
    description: 'Event is confirmed and scheduled',
    color: 'text-green-600'
  },
  {
    value: 'completed',
    label: 'Completed',
    description: 'Event has been completed and final payment received',
    requiresOrderId: 'balance',
    color: 'text-gray-600'
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    description: 'Quote/event has been cancelled',
    color: 'text-red-600'
  }
];

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export default function QuoteStatusUpdate({ quote, onUpdate, onClose }: QuoteStatusUpdateProps) {
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus>(quote.status);
  const [medusaOrderId, setMedusaOrderId] = useState(quote.medusaOrderId || '');
  const [balanceOrderId, setBalanceOrderId] = useState(quote.balanceOrderId || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStatusOption = STATUS_OPTIONS.find(opt => opt.value === selectedStatus);
  const isStatusChanged = selectedStatus !== quote.status;
  const requiresDepositOrderId = currentStatusOption?.requiresOrderId === 'deposit' && !medusaOrderId.trim();
  const requiresBalanceOrderId = currentStatusOption?.requiresOrderId === 'balance' && !balanceOrderId.trim();
  const canUpdate = isStatusChanged && !requiresDepositOrderId && !requiresBalanceOrderId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canUpdate) return;

    try {
      setIsUpdating(true);
      setError(null);

      const updateData: {
        status: QuoteStatus;
        medusaOrderId?: string;
        balanceOrderId?: string;
      } = {
        status: selectedStatus
      };

      // Only include order IDs if they're provided
      if (medusaOrderId.trim()) {
        updateData.medusaOrderId = medusaOrderId.trim();
      }
      if (balanceOrderId.trim()) {
        updateData.balanceOrderId = balanceOrderId.trim();
      }

      const response = await fetch(`/api/catering/quotes?id=${quote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        await onUpdate(quote.id);
      } else {
        setError(result.error || 'Failed to update quote status');
      }
    } catch (error) {
      console.error('Error updating quote status:', error);
      setError('Failed to update quote status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusChangeDescription = () => {
    if (!isStatusChanged) return null;

    const fromStatus = STATUS_OPTIONS.find(opt => opt.value === quote.status);
    const toStatus = STATUS_OPTIONS.find(opt => opt.value === selectedStatus);

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
        <div className="flex items-center space-x-2">
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-blue-800">Status Change:</span>
        </div>
        <div className="mt-1 text-blue-700">
          <span className={fromStatus?.color}>{fromStatus?.label}</span>
          {' → '}
          <span className={toStatus?.color}>{toStatus?.label}</span>
        </div>
        <div className="mt-1 text-blue-600">
          {toStatus?.description}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Update Quote Status</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Quote #{quote.id.slice(-8).toUpperCase()} - {quote.customerEmail}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isUpdating}
              >
                ✕
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Quote Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Quote Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Event Date:</span>
                    <div className="font-medium">{new Date(quote.eventDetails.date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Guest Count:</span>
                    <div className="font-medium">{quote.eventDetails.guestCount}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <div className="font-medium">{formatCurrency(quote.pricing.totalCents)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Status:</span>
                    <div className="font-medium">{capitalizeFirst(quote.status.replace('_', ' '))}</div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Selection */}
              <div>
                <Label htmlFor="status">New Status</Label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as QuoteStatus)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isUpdating}
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {currentStatusOption && (
                  <p className="mt-1 text-sm text-gray-600">
                    {currentStatusOption.description}
                  </p>
                )}
              </div>

              {/* Order ID Fields */}
              {(currentStatusOption?.requiresOrderId === 'deposit' || medusaOrderId) && (
                <div>
                  <Label htmlFor="medusaOrderId">
                    Deposit Order ID {currentStatusOption?.requiresOrderId === 'deposit' && '*'}
                  </Label>
                  <Input
                    id="medusaOrderId"
                    type="text"
                    value={medusaOrderId}
                    onChange={(e) => setMedusaOrderId(e.target.value)}
                    placeholder="Enter MedusaJS order ID for deposit payment"
                    disabled={isUpdating}
                    className={requiresDepositOrderId ? 'border-red-500' : ''}
                  />
                  {requiresDepositOrderId && (
                    <p className="mt-1 text-sm text-red-600">
                      Deposit order ID is required for this status
                    </p>
                  )}
                </div>
              )}

              {(currentStatusOption?.requiresOrderId === 'balance' || balanceOrderId) && (
                <div>
                  <Label htmlFor="balanceOrderId">
                    Balance Order ID {currentStatusOption?.requiresOrderId === 'balance' && '*'}
                  </Label>
                  <Input
                    id="balanceOrderId"
                    type="text"
                    value={balanceOrderId}
                    onChange={(e) => setBalanceOrderId(e.target.value)}
                    placeholder="Enter MedusaJS order ID for balance payment"
                    disabled={isUpdating}
                    className={requiresBalanceOrderId ? 'border-red-500' : ''}
                  />
                  {requiresBalanceOrderId && (
                    <p className="mt-1 text-sm text-red-600">
                      Balance order ID is required for this status
                    </p>
                  )}
                </div>
              )}

              {/* Status Change Preview */}
              {getStatusChangeDescription()}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!canUpdate || isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}