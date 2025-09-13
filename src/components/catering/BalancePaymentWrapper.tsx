import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import BalancePayment from './BalancePayment';
import type { CateringQuote, PaymentResult } from '../../types';

interface BalancePaymentWrapperProps {
  quoteId: string;
  token?: string | null;
}

export default function BalancePaymentWrapper({ 
  quoteId, 
  token 
}: BalancePaymentWrapperProps) {
  const [quote, setQuote] = useState<CateringQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuoteData();
  }, [quoteId, token]);

  const fetchQuoteData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build URL with optional token
      const url = new URL('/api/catering/payments/balance', window.location.origin);
      url.searchParams.set('quoteId', quoteId);
      if (token) {
        url.searchParams.set('token', token);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch quote data');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch quote data');
      }

      // Check if balance is already paid
      if (data.data.balancePaid) {
        setPaymentComplete(true);
        return;
      }

      // Check if event has passed
      if (data.data.timeline?.eventPassed) {
        setError('This event has already passed. Balance payment is no longer available.');
        return;
      }

      // Fetch the full quote details
      const quoteResponse = await fetch(`/api/catering/quotes?id=${quoteId}`);
      const quoteData = await quoteResponse.json();

      if (!quoteResponse.ok || !quoteData.success) {
        throw new Error('Failed to fetch quote details');
      }

      setQuote(quoteData.data);

    } catch (err) {
      console.error('Error fetching quote data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentComplete(true);
    setPaymentError(null);
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  const handleRetry = () => {
    setPaymentError(null);
    fetchQuoteData();
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="text-center py-8">
            <Loader2 className="h-12 w-12 text-orange-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading Payment Information
            </h3>
            <p className="text-gray-600">
              Please wait while we retrieve your catering order details...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Unable to Load Payment
            </h3>
            <p className="text-red-600 mb-4">
              {error}
            </p>
            <div className="space-y-2">
              <Button
                onClick={handleRetry}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
              <div className="text-sm text-red-600">
                <p>If this problem persists, please contact support:</p>
                <p className="font-medium">catering@troybbq.com</p>
                <p className="font-medium">(555) 123-4567</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              Payment Complete!
            </h3>
            <p className="text-gray-600 mb-6">
              Your catering order has been fully paid and confirmed.
            </p>
            
            {quote && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                <h4 className="font-medium text-green-800 mb-3">Order Confirmed</h4>
                <div className="text-sm space-y-2 text-green-700">
                  <div className="flex justify-between">
                    <span>Event Date:</span>
                    <span className="font-medium">
                      {new Date(quote.eventDetails.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guest Count:</span>
                    <span className="font-medium">{quote.eventDetails.guestCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Paid:</span>
                    <span className="font-medium">
                      ${(quote.pricing.totalCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 text-sm text-gray-600">
              <p>You will receive a confirmation email with event details.</p>
              <p>Our team will contact you 48 hours before your event.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              Quote Not Found
            </h3>
            <p className="text-yellow-600 mb-4">
              We couldn't find the catering quote associated with this payment link.
            </p>
            <Button
              onClick={() => window.location.href = '/catering'}
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Return to Catering
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Error Display */}
      {paymentError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Payment Error</p>
                <p className="text-sm">{paymentError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balance Payment Component */}
      <BalancePayment
        quote={quote}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </div>
  );
}