import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

// Payment Provider Configuration
export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  SQUARE: 'square',
} as const;

export type PaymentProvider = typeof PAYMENT_PROVIDERS[keyof typeof PAYMENT_PROVIDERS];

// Stripe Configuration
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  'pk_test_51234567890abcdef'; // Placeholder for demo

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Square Configuration
export const SQUARE_CONFIG = {
  applicationId: process.env.SQUARE_APPLICATION_ID || 
    process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || 
    'sandbox-sq0idb-demo', // Placeholder for demo
  locationId: process.env.SQUARE_LOCATION_ID || 
    process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || 
    'LH2G6QZQB4A6B', // Placeholder for demo
  environment: (process.env.SQUARE_ENVIRONMENT || 
    process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 
    'sandbox') as 'sandbox' | 'production',
};

// Payment Method Types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntent?: PaymentIntent;
  error?: string;
  transactionId?: string;
}

// Payment Provider Service Interface
export interface PaymentProviderService {
  processPayment(amount: number, currency: string): Promise<PaymentResult>;
  createPaymentIntent?(amount: number, currency: string): Promise<PaymentIntent>;
}

// Payment Utilities
export const formatAmountForStripe = (amount: number, currency: string = 'usd'): number => {
  // Stripe expects amounts in cents for zero-decimal currencies
  const zeroDecimalCurrencies = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
  
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }
  
  return Math.round(amount * 100);
};

export const formatAmountForSquare = (amount: number, currency: string = 'USD'): number => {
  // Square expects amounts in the smallest currency unit (cents for USD)
  return Math.round(amount * 100);
};

export const formatAmountForDisplay = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100);
};