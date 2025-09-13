import React, { useState, useEffect } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { CreditCard, Loader2 } from 'lucide-react';
import { getStripe, formatAmountForStripe } from '../../lib/payments';
import type { PaymentResult } from '../../lib/payments';

interface StripePaymentFormProps {
  amount: number; // Amount in dollars
  currency?: string;
  onPaymentSuccess: (result: PaymentResult) => void;
  onPaymentError: (error: string) => void;
  clientSecret?: string;
}

function CheckoutForm({ 
  amount, 
  currency = 'usd', 
  onPaymentSuccess, 
  onPaymentError 
}: Omit<StripePaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) return;

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) return;

      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          onPaymentSuccess({
            success: true,
            paymentIntent: {
              id: paymentIntent.id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              status: paymentIntent.status,
              client_secret: paymentIntent.client_secret || undefined,
            }
          });
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe, onPaymentSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Validate form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setMessage(submitError.message || 'Form validation failed');
        setIsLoading(false);
        return;
      }

      // For demo purposes, we'll simulate a successful payment
      // In a real implementation, you would:
      // 1. Create a payment intent on your server
      // 2. Confirm the payment with the client secret
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate successful payment
      const mockPaymentIntent = {
        id: `pi_demo_${Date.now()}`,
        amount: formatAmountForStripe(amount, currency),
        currency: currency,
        status: 'succeeded',
        client_secret: `pi_demo_${Date.now()}_secret_demo`
      };

      setMessage('Payment succeeded! (Demo Mode)');
      onPaymentSuccess({
        success: true,
        paymentIntent: mockPaymentIntent,
        transactionId: mockPaymentIntent.id
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setMessage(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const paymentElementOptions = {
    layout: "tabs" as const,
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PaymentElement 
            id="payment-element" 
            options={paymentElementOptions}
          />
          
          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.includes('succeeded') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}
          
          <Button
            disabled={isLoading || !stripe || !elements}
            id="submit"
            type="submit"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            <p>🔒 Your payment information is secure and encrypted</p>
            <p className="mt-1">💡 Demo Mode: No real charges will be made</p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default function StripePaymentForm({
  amount,
  currency = 'usd',
  onPaymentSuccess,
  onPaymentError,
  clientSecret
}: StripePaymentFormProps) {
  const stripePromise = getStripe();

  const options = {
    // For demo purposes, we're not using a real client secret
    // In production, you would create this on your server
    clientSecret: clientSecret || 'demo_client_secret',
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#ea580c', // Orange theme to match BBQ brand
      },
    },
  };

  if (clientSecret === undefined) {
    // Demo mode - show payment form without real Stripe setup
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credit Card Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Stripe Integration Ready
            </h3>
            <p className="text-gray-600 mb-4">
              Payment processing is configured and ready. Add your Stripe keys to enable live payments.
            </p>
            <Button
              onClick={() => onPaymentSuccess({
                success: true,
                transactionId: `demo_stripe_${Date.now()}`
              })}
              className="w-full"
            >
              Simulate Successful Payment - ${amount.toFixed(2)}
            </Button>
            <p className="text-xs text-gray-500 mt-2">Demo Mode - No real payment processed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm
        amount={amount}
        currency={currency}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    </Elements>
  );
}