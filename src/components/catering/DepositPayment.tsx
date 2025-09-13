import React, { useState } from 'react';
import { CreditCard, Loader2, AlertCircle, DollarSign, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import PaymentProvider from '../payments/PaymentProvider';
import type { CateringQuote, PaymentResult } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface DepositPaymentProps {
  quote: CateringQuote;
  onPaymentSuccess: (result: PaymentResult) => void;
  onPaymentError: (error: string) => void;
}

export default function DepositPayment({ 
  quote, 
  onPaymentSuccess, 
  onPaymentError 
}: DepositPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  const depositAmount = quote.pricing.depositCents / 100; // Convert to dollars
  const balanceAmount = quote.pricing.balanceCents / 100;

  const handlePaymentSuccess = async (result: PaymentResult) => {
    setIsProcessing(true);
    
    try {
      // Process the deposit payment through the API
      const response = await fetch('/api/catering/payments/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: quote.id,
          paymentResult: result,
          amount: depositAmount,
          currency: 'USD'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment processing failed');
      }

      const data = await response.json();
      
      // Call the parent success handler
      onPaymentSuccess({
        ...result,
        orderId: data.orderId,
        quoteId: quote.id
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setIsProcessing(false);
    onPaymentError(error);
  };

  if (!showPaymentForm) {
    return (
      <div className="space-y-6">
        {/* Quote Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Deposit Payment Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Details Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">Event Date</div>
                  <div className="font-medium">
                    {new Date(quote.eventDetails.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">Guest Count</div>
                  <div className="font-medium">{quote.eventDetails.guestCount} guests</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">Event Type</div>
                  <div className="font-medium capitalize">{quote.eventDetails.type}</div>
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Payment Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(quote.pricing.totalCents)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-orange-600">
                  <span>Deposit Due Now:</span>
                  <span>{formatCurrency(quote.pricing.depositCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining Balance:</span>
                  <span className="text-gray-600">{formatCurrency(quote.pricing.balanceCents)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Payment Terms</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Deposit payment secures your catering reservation</p>
                <p>• Balance payment will be collected 48 hours before the event</p>
                <p>• Deposits are non-refundable within 72 hours of the event</p>
                <p>• Menu changes must be finalized 1 week before the event</p>
                <p>• Final guest count adjustments accepted up to 48 hours prior</p>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <input
                type="checkbox"
                id="agreement"
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="agreement" className="text-sm text-gray-700">
                I agree to the payment terms and conditions outlined above. I understand that 
                the deposit is required to secure this catering reservation and that the 
                remaining balance will be collected before the event.
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowPaymentForm(true)}
                disabled={!agreementAccepted || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Deposit - {formatCurrency(quote.pricing.depositCents)}
                  </>
                )}
              </Button>
            </div>

            {/* Security Notice */}
            <div className="text-center pt-4 border-t">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-xs text-gray-600">
                <span>🔒</span>
                <span>Secure payment processing</span>
                <span>•</span>
                <span>SSL encrypted</span>
                <span>•</span>
                <span>PCI compliant</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Deposit Payment</h3>
              <p className="text-sm text-gray-600">
                Quote #{quote.id.slice(0, 8)}... • {quote.eventDetails.guestCount} guests
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(quote.pricing.depositCents)}
              </div>
              <div className="text-sm text-gray-600">
                Balance: {formatCurrency(quote.pricing.balanceCents)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <PaymentProvider
        amount={depositAmount}
        currency="USD"
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        showProviderSelection={true}
      />

      {/* Back Button */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => setShowPaymentForm(false)}
          disabled={isProcessing}
        >
          ← Back to payment details
        </Button>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="text-center py-8">
              <Loader2 className="h-12 w-12 text-orange-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Processing Payment
              </h3>
              <p className="text-gray-600">
                Please wait while we process your deposit payment...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}