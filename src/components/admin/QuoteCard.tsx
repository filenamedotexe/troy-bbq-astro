import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import type { CateringQuote } from '../../types';
import { formatCurrency, formatDate, formatDateTime, capitalizeFirst } from '../../lib/utils';

interface QuoteCardProps {
  quote: CateringQuote;
  onStatusUpdate: (quote: CateringQuote) => void;
}

const STATUS_COLORS: Record<CateringQuote['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  deposit_paid: 'bg-purple-100 text-purple-800 border-purple-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

const EVENT_TYPE_LABELS = {
  corporate: 'Corporate Event',
  private: 'Private Event'
};

const HUNGER_LEVEL_LABELS = {
  normal: 'Normal Appetite',
  prettyHungry: 'Pretty Hungry',
  reallyHungry: 'Really Hungry'
};

export default function QuoteCard({ quote, onStatusUpdate }: QuoteCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const statusColorClass = STATUS_COLORS[quote.status];
  
  // Date validation with error handling
  const validateEventDate = (dateString: string): { date: Date | null; isValid: boolean; isUpcoming: boolean } => {
    try {
      const eventDate = new Date(dateString);
      const isValid = !isNaN(eventDate.getTime()) && eventDate.getFullYear() > 1900;
      const isUpcoming = isValid && eventDate > new Date();
      return { date: isValid ? eventDate : null, isValid, isUpcoming };
    } catch {
      return { date: null, isValid: false, isUpcoming: false };
    }
  };
  
  const { date: eventDate, isValid: isValidDate, isUpcoming } = validateEventDate(quote.eventDetails.date);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-lg">
              Quote #{quote.id.slice(-8).toUpperCase()}
            </CardTitle>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColorClass}`}>
              {capitalizeFirst(quote.status.replace('_', ' '))}
            </span>
            {isValidDate && isUpcoming && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                Upcoming
              </span>
            )}
            {!isValidDate && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                Invalid Date
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
            <Button
              size="sm"
              onClick={() => onStatusUpdate(quote)}
            >
              Update Status
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer & Event */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Customer & Event</h4>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Email:</span> {quote.customerEmail}</div>
              <div><span className="font-medium">Event Date:</span> 
                {isValidDate ? formatDate(quote.eventDetails.date) : 
                  <span className="text-red-600">Invalid Date: {quote.eventDetails.date}</span>
                }
              </div>
              <div><span className="font-medium">Type:</span> {EVENT_TYPE_LABELS[quote.eventDetails.type]}</div>
              <div><span className="font-medium">Guests:</span> {quote.eventDetails.guestCount}</div>
              <div><span className="font-medium">Hunger Level:</span> {HUNGER_LEVEL_LABELS[quote.eventDetails.hungerLevel]}</div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Address:</span></div>
              <div className="text-gray-600">{quote.eventDetails.location.address}</div>
              <div><span className="font-medium">Distance:</span> {quote.eventDetails.location.distanceMiles} miles</div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(quote.pricing.subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(quote.pricing.taxCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>{formatCurrency(quote.pricing.deliveryFeeCents)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-1">
                <span>Total:</span>
                <span>{formatCurrency(quote.pricing.totalCents)}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Deposit:</span>
                <span>{formatCurrency(quote.pricing.depositCents)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Balance:</span>
                <span>{formatCurrency(quote.pricing.balanceCents)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Created/Updated */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Created: {formatDateTime(quote.createdAt)}</span>
            <span>Updated: {formatDateTime(quote.updatedAt)}</span>
          </div>
        </div>

        {/* Detailed Information (Expandable) */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
            {/* Menu Selections */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Menu Selections</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {quote.menuSelections.length > 0 ? (
                  <div className="space-y-2">
                    {quote.menuSelections.map((selection, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>
                          Protein: <span className="font-mono text-xs bg-gray-100 px-1 rounded">{selection.proteinId}</span> | 
                          Side: <span className="font-mono text-xs bg-gray-100 px-1 rounded">{selection.sideId}</span>
                          <span className="text-gray-500 text-xs ml-2">(IDs need name resolution)</span>
                        </span>
                        <span className="font-medium">Qty: {selection.quantity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No menu selections</p>
                )}
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Add-ons</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {quote.addOns.length > 0 ? (
                  <div className="space-y-2">
                    {quote.addOns.map((addon, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>
                          Add-on ID: <span className="font-mono text-xs bg-gray-100 px-1 rounded">{addon.addOnId}</span>
                          <span className="text-gray-500 text-xs ml-2">(ID needs name resolution)</span>
                        </span>
                        <span className="font-medium">Qty: {addon.quantity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No add-ons selected</p>
                )}
              </div>
            </div>

            {/* Order IDs */}
            {(quote.medusaOrderId || quote.balanceOrderId) && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Order References</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {quote.medusaOrderId && (
                    <div className="text-sm">
                      <span className="font-medium">Deposit Order ID:</span> {quote.medusaOrderId}
                    </div>
                  )}
                  {quote.balanceOrderId && (
                    <div className="text-sm">
                      <span className="font-medium">Balance Order ID:</span> {quote.balanceOrderId}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const quoteData = {
                    'Quote ID': quote.id,
                    'Customer Email': quote.customerEmail,
                    'Event Date': formatDate(quote.eventDetails.date),
                    'Event Type': EVENT_TYPE_LABELS[quote.eventDetails.type],
                    'Guest Count': quote.eventDetails.guestCount,
                    'Hunger Level': HUNGER_LEVEL_LABELS[quote.eventDetails.hungerLevel],
                    'Address': quote.eventDetails.location.address,
                    'Distance': `${quote.eventDetails.location.distanceMiles} miles`,
                    'Status': capitalizeFirst(quote.status.replace('_', ' ')),
                    'Subtotal': formatCurrency(quote.pricing.subtotalCents),
                    'Tax': formatCurrency(quote.pricing.taxCents),
                    'Delivery Fee': formatCurrency(quote.pricing.deliveryFeeCents),
                    'Total': formatCurrency(quote.pricing.totalCents),
                    'Deposit': formatCurrency(quote.pricing.depositCents),
                    'Balance': formatCurrency(quote.pricing.balanceCents),
                    'Menu Selections': quote.menuSelections.length,
                    'Add-ons': quote.addOns.length,
                    'Deposit Order ID': quote.medusaOrderId || '',
                    'Balance Order ID': quote.balanceOrderId || '',
                    'Created At': formatDateTime(quote.createdAt),
                    'Updated At': formatDateTime(quote.updatedAt)
                  };

                  // Sanitize CSV data to prevent injection attacks
                  const sanitizeCSVValue = (value: any): string => {
                    const str = String(value || '');
                    // Remove dangerous characters and escape quotes
                    return str.replace(/["'\r\n\t]/g, ' ').replace(/=/g, ' ');
                  };
                  
                  const csvContent = [
                    Object.keys(quoteData).join(','),
                    Object.values(quoteData).map(value => `"${sanitizeCSVValue(value)}"`).join(',')
                  ].join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', `quote-${sanitizeCSVValue(quote.id.slice(-8))}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
              >
                Export Quote
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Validate email before creating mailto link
                  const validateEmail = (email: string): boolean => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return emailRegex.test(email) && email.length <= 254;
                  };
                  
                  if (!validateEmail(quote.customerEmail)) {
                    alert('Invalid email address');
                    return;
                  }
                  
                  // Sanitize email components to prevent injection
                  const sanitizeEmailComponent = (str: string): string => {
                    return encodeURIComponent(str.replace(/[\r\n\t]/g, ' '));
                  };
                  
                  const subject = sanitizeEmailComponent(`Regarding your catering quote ${quote.id.slice(-8).toUpperCase()}`);
                  const body = sanitizeEmailComponent(
                    `Dear Customer,\n\nThank you for your interest in Troy BBQ catering services.\n\nQuote Details:\n- Quote ID: ${quote.id}\n- Event Date: ${isValidDate ? formatDate(quote.eventDetails.date) : 'Invalid Date'}\n- Guest Count: ${quote.eventDetails.guestCount}\n- Total Amount: ${formatCurrency(quote.pricing.totalCents)}\n\nBest regards,\nTroy BBQ Team`
                  );
                  
                  const mailtoLink = `mailto:${encodeURIComponent(quote.customerEmail)}?subject=${subject}&body=${body}`;
                  window.open(mailtoLink);
                }}
              >
                Email Customer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}