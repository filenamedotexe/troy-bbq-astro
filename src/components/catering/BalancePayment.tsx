import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, CheckCircle, AlertCircle, DollarSign, Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import PaymentProvider from '../payments/PaymentProvider';
import type { CateringQuote, PaymentResult } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface BalancePaymentProps {
  quote: CateringQuote;
  onPaymentSuccess: (result: PaymentResult) => void;
  onPaymentError: (error: string) => void;
}

export default function BalancePayment({ 
  quote, 
  onPaymentSuccess, 
  onPaymentError 
}: BalancePaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [eventApproaching, setEventApproaching] = useState(false);
  const [daysUntilEvent, setDaysUntilEvent] = useState(0);

  const balanceAmount = quote.pricing.balanceCents / 100; // Convert to dollars
  const depositAmount = quote.pricing.depositCents / 100;

  useEffect(() => {
    // Calculate days until event
    const eventDate = new Date(quote.eventDetails.date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    setDaysUntilEvent(diffDays);
    setEventApproaching(diffDays <= 2); // Event is approaching if within 2 days
  }, [quote.eventDetails.date]);

  const handlePaymentSuccess = async (result: PaymentResult) => {
    setIsProcessing(true);
    
    try {
      // Process the balance payment through the API
      const response = await fetch('/api/catering/payments/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: quote.id,
          paymentResult: result,
          amount: balanceAmount,
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
        {/* Event Countdown */}
        {eventApproaching && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Event Approaching!</p>
                  <p className="text-sm">
                    Your catering event is in {daysUntilEvent} day{daysUntilEvent !== 1 ? 's' : ''}. 
                    Balance payment is required to confirm your order.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deposit Confirmation */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Deposit Payment Confirmed</p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(quote.pricing.depositCents)} deposit received
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Payment Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Final Balance Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">Event Date</div>
                  <div className="font-medium">
                    {new Date(quote.eventDetails.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">Location</div>
                  <div className="font-medium text-sm">
                    {quote.eventDetails.location.address}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Order Amount:</span>
                  <span className="font-medium">{formatCurrency(quote.pricing.totalCents)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Deposit Paid:</span>
                  <span>-{formatCurrency(quote.pricing.depositCents)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold text-orange-600">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(quote.pricing.balanceCents)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Order Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Guest Count:</span>
                  <span className="font-medium">{quote.eventDetails.guestCount} people</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Event Type:</span>
                  <span className="font-medium capitalize">{quote.eventDetails.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hunger Level:</span>
                  <span className="font-medium capitalize">
                    {quote.eventDetails.hungerLevel.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              </div>
            </div>

            {/* Final Payment Terms */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Final Payment Terms</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Balance payment must be received 48 hours before the event</p>
                <p>• Payment confirms final guest count and menu selections</p>
                <p>• Setup will begin 2 hours before your scheduled event time</p>
                <p>• Our team will handle complete setup and breakdown</p>
                <p>• Any last-minute changes may incur additional fees</p>
              </div>
            </div>

            {/* Payment Button */}
            <div className="pt-4">
              <Button
                onClick={() => setShowPaymentForm(true)}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay Balance - {formatCurrency(quote.pricing.balanceCents)}
                  </>
                )}
              </Button>
            </div>

            {/* Security Notice */}
            <div className="text-center pt-4">
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
              <h3 className="font-medium text-gray-900">Final Balance Payment</h3>
              <p className="text-sm text-gray-600">
                Quote #{quote.id.slice(0, 8)}... • 
                Event: {new Date(quote.eventDetails.date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(quote.pricing.balanceCents)}
              </div>
              <div className="text-sm text-green-600">
                Deposit: {formatCurrency(quote.pricing.depositCents)} ✓
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Countdown for Payment Form */}
      {eventApproaching && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-3">
            <div className="text-center text-orange-800">
              <p className="font-medium">
                ⏰ Event in {daysUntilEvent} day{daysUntilEvent !== 1 ? 's' : ''}
              </p>
              <p className="text-sm">
                Complete payment now to ensure your catering is confirmed
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Form */}
      <PaymentProvider
        amount={balanceAmount}
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
                Processing Final Payment
              </h3>
              <p className="text-gray-600">
                Please wait while we process your balance payment and confirm your catering order...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}