import React, { useState } from 'react';
import { CreditCard, Building, Smartphone } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import StripePaymentForm from './StripePaymentForm';
import SquarePaymentForm from './SquarePaymentForm';
import { PAYMENT_PROVIDERS } from '../../lib/payments';

type PaymentProviderType = typeof PAYMENT_PROVIDERS[keyof typeof PAYMENT_PROVIDERS];
import type { PaymentResult } from '../../lib/payments';

interface PaymentProviderProps {
  amount: number; // Amount in dollars
  currency?: string;
  onPaymentSuccess: (result: PaymentResult) => void;
  onPaymentError: (error: string) => void;
  defaultProvider?: PaymentProviderType;
  showProviderSelection?: boolean;
}

export default function PaymentProvider({
  amount,
  currency = 'USD',
  onPaymentSuccess,
  onPaymentError,
  defaultProvider = PAYMENT_PROVIDERS.STRIPE,
  showProviderSelection = true
}: PaymentProviderProps) {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderType | null>(
    showProviderSelection ? null : defaultProvider
  );

  const handleProviderSelect = (provider: PaymentProviderType) => {
    setSelectedProvider(provider);
  };

  const handleBackToSelection = () => {
    setSelectedProvider(null);
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    // Add provider info to the result
    const enhancedResult = {
      ...result,
      provider: selectedProvider
    };
    onPaymentSuccess(enhancedResult);
  };

  // Provider Selection Screen
  if (showProviderSelection && !selectedProvider) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Choose Payment Method</CardTitle>
          <p className="text-center text-gray-600">
            Select your preferred payment processor
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stripe Option */}
            <Button
              variant="outline"
              onClick={() => handleProviderSelect(PAYMENT_PROVIDERS.STRIPE)}
              className="p-6 h-auto flex-col gap-3 hover:bg-blue-50 hover:border-blue-300"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">Stripe</div>
                <div className="text-sm text-gray-600">Cards & Digital Wallets</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>💳</span>
                <span>📱</span>
                <span>🌍</span>
                <span>Global Leader</span>
              </div>
            </Button>

            {/* Square Option */}
            <Button
              variant="outline"
              onClick={() => handleProviderSelect(PAYMENT_PROVIDERS.SQUARE)}
              className="p-6 h-auto flex-col gap-3 hover:bg-orange-50 hover:border-orange-300"
            >
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">Square</div>
                <div className="text-sm text-gray-600">Business Focused</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>🏪</span>
                <span>📊</span>
                <span>🔧</span>
                <span>Business Tools</span>
              </div>
            </Button>
          </div>

          {/* Feature Comparison */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Stripe Features</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Global payment processing</li>
                <li>• 100+ payment methods</li>
                <li>• Advanced fraud protection</li>
                <li>• Subscription management</li>
                <li>• Developer-friendly APIs</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Square Features</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Integrated POS systems</li>
                <li>• Business management tools</li>
                <li>• Inventory tracking</li>
                <li>• Employee management</li>
                <li>• In-person & online sales</li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              Both providers offer secure, PCI-compliant payment processing
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Payment Form Screen
  return (
    <div className="space-y-4">
      {/* Back Button */}
      {showProviderSelection && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToSelection}
          >
            ← Back to payment options
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Using</span>
            <span className="font-medium capitalize">{selectedProvider}</span>
          </div>
        </div>
      )}

      {/* Payment Form */}
      {selectedProvider === PAYMENT_PROVIDERS.STRIPE && (
        <StripePaymentForm
          amount={amount}
          currency={currency.toLowerCase()}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={onPaymentError}
        />
      )}

      {selectedProvider === PAYMENT_PROVIDERS.SQUARE && (
        <SquarePaymentForm
          amount={amount}
          currency={currency.toUpperCase()}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={onPaymentError}
        />
      )}

      {/* Security Badge */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-xs text-gray-600">
          <span>🔒</span>
          <span>256-bit SSL encryption</span>
          <span>•</span>
          <span>PCI DSS compliant</span>
          <span>•</span>
          <span>Your data is protected</span>
        </div>
      </div>
    </div>
  );
}