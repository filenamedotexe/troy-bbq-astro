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

// Enhanced Payment Utilities with Security and Precision
export const ZERO_DECIMAL_CURRENCIES = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];

// Secure currency validation
export const validateCurrency = (currency: string): boolean => {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'SEK', 'NZD'];
  return validCurrencies.includes(currency.toUpperCase());
};

// Safe amount conversion to prevent precision errors
export const toCents = (dollarAmount: number, currency: string = 'USD'): number => {
  if (typeof dollarAmount !== 'number' || isNaN(dollarAmount) || dollarAmount < 0) {
    throw new Error('Invalid amount: must be a non-negative number');
  }
  
  if (!validateCurrency(currency)) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  
  if (ZERO_DECIMAL_CURRENCIES.includes(currency.toLowerCase())) {
    return Math.round(dollarAmount);
  }
  
  // Use proper rounding to avoid floating point precision issues
  return Math.round(dollarAmount * 100);
};

// Safe amount conversion from cents
export const fromCents = (centsAmount: number, currency: string = 'USD'): number => {
  if (typeof centsAmount !== 'number' || isNaN(centsAmount) || centsAmount < 0) {
    throw new Error('Invalid cents amount: must be a non-negative number');
  }
  
  if (!validateCurrency(currency)) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  
  if (ZERO_DECIMAL_CURRENCIES.includes(currency.toLowerCase())) {
    return centsAmount;
  }
  
  return Math.round(centsAmount) / 100;
};

export const formatAmountForStripe = (amount: number, currency: string = 'USD'): number => {
  // Validate inputs
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    throw new Error('Invalid amount for Stripe: must be a non-negative number');
  }
  
  if (!validateCurrency(currency)) {
    throw new Error(`Unsupported currency for Stripe: ${currency}`);
  }
  
  // Stripe expects amounts in cents for most currencies
  if (ZERO_DECIMAL_CURRENCIES.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }
  
  return toCents(amount, currency);
};

export const formatAmountForSquare = (amount: number, currency: string = 'USD'): number => {
  // Validate inputs
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    throw new Error('Invalid amount for Square: must be a non-negative number');
  }
  
  if (!validateCurrency(currency)) {
    throw new Error(`Unsupported currency for Square: ${currency}`);
  }
  
  // Square expects amounts in the smallest currency unit (cents for USD)
  return toCents(amount, currency);
};

export const formatAmountForDisplay = (centsAmount: number, currency: string = 'USD'): string => {
  if (typeof centsAmount !== 'number' || isNaN(centsAmount)) {
    throw new Error('Invalid amount for display: must be a number');
  }
  
  if (!validateCurrency(currency)) {
    throw new Error(`Unsupported currency for display: ${currency}`);
  }
  
  const dollarAmount = fromCents(centsAmount, currency);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: ZERO_DECIMAL_CURRENCIES.includes(currency.toLowerCase()) ? 0 : 2,
    maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.includes(currency.toLowerCase()) ? 0 : 2,
  }).format(dollarAmount);
};

// Validate payment amount ranges
export const validatePaymentAmount = (amount: number, currency: string = 'USD'): { valid: boolean; error?: string } => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }
  
  if (amount < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }
  
  if (!validateCurrency(currency)) {
    return { valid: false, error: `Unsupported currency: ${currency}` };
  }
  
  // Set reasonable limits (in dollars)
  const minAmount = 1.00; // $1.00 minimum
  const maxAmount = 50000.00; // $50,000 maximum for catering orders
  
  if (amount < minAmount) {
    return { valid: false, error: `Amount must be at least ${formatAmountForDisplay(toCents(minAmount, currency), currency)}` };
  }
  
  if (amount > maxAmount) {
    return { valid: false, error: `Amount cannot exceed ${formatAmountForDisplay(toCents(maxAmount, currency), currency)}` };
  }
  
  return { valid: true };
};