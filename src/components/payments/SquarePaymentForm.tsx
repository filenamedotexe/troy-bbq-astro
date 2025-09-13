import React, { useState } from 'react';
import {
  PaymentForm,
  CreditCard,
  ApplePay,
  GooglePay
} from 'react-square-web-payments-sdk';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { CreditCard as CreditCardIcon, Smartphone, Loader2 } from 'lucide-react';
import { SQUARE_CONFIG, formatAmountForSquare } from '../../lib/payments';
import type { PaymentResult } from '../../lib/payments';

interface SquarePaymentFormProps {
  amount: number; // Amount in dollars
  currency?: string;
  onPaymentSuccess: (result: PaymentResult) => void;
  onPaymentError: (error: string) => void;
}

export default function SquarePaymentForm({
  amount,
  currency = 'USD',
  onPaymentSuccess,
  onPaymentError
}: SquarePaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'digital' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleCardTokenReceived = async (token: any, buyer?: any) => {
    setIsProcessing(true);
    setMessage(null);

    try {
      // In a real implementation, you would send the token to your backend
      // to process the payment with the Square Payments API
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful payment
      const mockResult: PaymentResult = {
        success: true,
        transactionId: `sq_demo_${Date.now()}`,
        paymentIntent: {
          id: `sq_demo_${Date.now()}`,
          amount: formatAmountForSquare(amount, currency),
          currency: currency,
          status: 'succeeded'
        }
      };

      setMessage('Payment succeeded! (Demo Mode)');
      onPaymentSuccess(mockResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setMessage(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMethodError = (errors: any[]) => {
    console.error('Payment method error:', errors);
    const errorMessage = errors.map(error => error.message).join(', ');
    setMessage(errorMessage);
    onPaymentError(errorMessage);
  };

  // Demo mode fallback if Square config is not properly set up
  if (SQUARE_CONFIG.applicationId === 'sandbox-sq0idb-demo') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            Square Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <div className="flex justify-center gap-4 mb-4">
              <CreditCardIcon className="h-8 w-8 text-gray-400" />
              <Smartphone className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Square Integration Ready
            </h3>
            <p className="text-gray-600 mb-4">
              Square Web Payments SDK is configured. Add your Square credentials to enable live payments.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <Button
                variant="outline"
                onClick={() => {
                  onPaymentSuccess({
                    success: true,
                    transactionId: `demo_square_card_${Date.now()}`
                  });
                }}
              >
                <CreditCardIcon className="h-4 w-4 mr-2" />
                Simulate Card Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onPaymentSuccess({
                    success: true,
                    transactionId: `demo_square_digital_${Date.now()}`
                  });
                }}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Simulate Digital Wallet
              </Button>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>💳 Supports all major credit/debit cards</p>
              <p>📱 Apple Pay, Google Pay, and other digital wallets</p>
              <p>🔒 PCI compliant and secure</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Payment Method Selection */}
      {!paymentMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5" />
              Choose Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setPaymentMethod('card')}
                className="p-6 h-auto flex-col"
              >
                <CreditCardIcon className="h-8 w-8 mb-2" />
                <span className="font-medium">Credit/Debit Card</span>
                <span className="text-sm text-gray-500">Visa, Mastercard, etc.</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setPaymentMethod('digital')}
                className="p-6 h-auto flex-col"
              >
                <Smartphone className="h-8 w-8 mb-2" />
                <span className="font-medium">Digital Wallet</span>
                <span className="text-sm text-gray-500">Apple Pay, Google Pay</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Square Payment Form */}
      {paymentMethod && (
        <PaymentForm
          applicationId={SQUARE_CONFIG.applicationId}
          locationId={SQUARE_CONFIG.locationId}
          cardTokenizeResponseReceived={handleCardTokenReceived}
          createPaymentRequest={() => ({
            countryCode: 'US',
            currencyCode: currency,
            total: {
              amount: formatAmountForSquare(amount, currency).toString(),
              label: 'Total',
            },
          })}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {paymentMethod === 'card' ? (
                    <>
                      <CreditCardIcon className="h-5 w-5" />
                      Credit Card Payment
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-5 w-5" />
                      Digital Wallet Payment
                    </>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentMethod(null)}
                >
                  Change
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <CreditCard
                    callbacks={{
                      cardNonceResponseReceived: handleCardTokenReceived,
                      unsupportedBrowserDetected: () => {
                        setMessage('This browser is not supported');
                      },
                      inputEventReceived: () => {
                        setMessage(null);
                      }
                    }}
                  />
                  
                  {isProcessing && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Processing payment...</span>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'digital' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ApplePay />
                    <GooglePay />
                  </div>
                  
                  <div className="text-center text-sm text-gray-500 mt-4">
                    <p>Digital wallet payments available</p>
                  </div>
                </div>
              )}

              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.includes('succeeded') 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="text-xs text-gray-500 text-center">
                <p>🔒 Secure payment processing by Square</p>
                <p className="mt-1">💡 Demo Mode: No real charges will be made</p>
              </div>
            </CardContent>
          </Card>
        </PaymentForm>
      )}
    </div>
  );
}