import type { APIRoute } from 'astro';
import { db } from '../../../../lib/database';
import { z } from 'zod';

// MedusaJS SDK placeholder - in real implementation, import from medusa-js
const createMedusaOrder = async (orderData: any) => {
  // This would be the actual MedusaJS order creation
  // For demo purposes, we'll return a mock order
  return {
    id: `order_${Date.now()}`,
    status: 'pending',
    total: orderData.amount * 100, // Convert to cents
    currency_code: orderData.currency.toLowerCase(),
    created_at: new Date().toISOString(),
    customer_email: orderData.customer_email
  };
};

// Email notification service placeholder
const sendDepositConfirmationEmail = async (email: string, quoteId: string, amount: number) => {
  // In real implementation, this would send an email via SendGrid, Mailgun, etc.
  console.log(`Sending deposit confirmation email to ${email} for quote ${quoteId}, amount: $${amount}`);
  return Promise.resolve();
};

// Enhanced schema for deposit payment request with comprehensive validation
const depositPaymentSchema = z.object({
  quoteId: z.string()
    .uuid('Quote ID must be a valid UUID')
    .refine((id) => id.length === 36, 'Quote ID must be exactly 36 characters'),
  paymentResult: z.object({
    success: z.boolean(),
    paymentIntent: z.object({
      id: z.string()
        .min(1, 'Payment intent ID is required')
        .max(255, 'Payment intent ID too long')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Payment intent ID contains invalid characters'),
      amount: z.number()
        .min(0, 'Payment intent amount must be non-negative')
        .max(5000000, 'Payment intent amount too large'), // $50,000 in cents
      currency: z.string()
        .length(3, 'Currency must be 3 characters')
        .regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters'),
      status: z.string()
        .min(1, 'Payment status is required')
        .max(50, 'Payment status too long')
        .regex(/^[a-z_]+$/, 'Payment status contains invalid characters'),
      client_secret: z.string()
        .max(255, 'Client secret too long')
        .optional(),
    }).optional(),
    transactionId: z.string()
      .min(1, 'Transaction ID must not be empty')
      .max(255, 'Transaction ID too long')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Transaction ID contains invalid characters')
      .optional(),
    provider: z.enum(['stripe', 'square', 'unknown'])
      .optional(),
    error: z.string()
      .max(1000, 'Error message too long')
      .optional(),
  }),
  amount: z.number()
    .min(1, 'Payment amount must be at least $1.00')
    .max(50000, 'Payment amount cannot exceed $50,000')
    .refine((val) => Number.isFinite(val), 'Amount must be a finite number')
    .refine((val) => Math.round(val * 100) / 100 === val, 'Amount cannot have more than 2 decimal places'),
  currency: z.string()
    .length(3, 'Currency must be 3 characters')
    .regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters')
    .default('USD')
    .refine((cur) => ['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(cur), 'Unsupported currency'),
});

// POST /api/catering/payments/deposit - Process deposit payment
export const POST: APIRoute = async ({ request }) => {
  // Security headers for all responses
  const securityHeaders = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  try {
    // Rate limiting check (basic implementation)
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    
    // Basic bot/suspicious activity detection
    if (userAgent.toLowerCase().includes('bot') || userAgent === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request source'
      }), {
        status: 403,
        headers: securityHeaders,
      });
    }
    
    const body = await request.json();
    
    // Validate the request body
    const validationResult = depositPaymentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid payment data',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    const { quoteId, paymentResult, amount, currency } = validationResult.data;

    // Check if payment was successful
    if (!paymentResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment failed',
        details: paymentResult.error || 'Payment was not successful'
      }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    // Fetch the quote to verify it exists and get details
    const quote = await db.getCateringQuote(quoteId);
    
    if (!quote) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote not found'
      }), {
        status: 404,
        headers: securityHeaders,
      });
    }

    // Verify the quote is in a valid state for deposit payment
    if (quote.status !== 'pending' && quote.status !== 'approved') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote is not in a valid state for deposit payment',
        currentStatus: quote.status
      }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    // Verify the payment amount matches the expected deposit using secure comparison
    const { secureAmountCompare } = await import('../../../../lib/security');
    const expectedDepositAmount = quote.pricing.depositCents / 100;
    if (!secureAmountCompare(amount, expectedDepositAmount, 0.01)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment amount does not match expected deposit',
        expected: expectedDepositAmount,
        received: amount,
        expectedCents: quote.pricing.depositCents,
        receivedCents: Math.round(amount * 100)
      }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    // Check for duplicate payment (idempotency protection)
    const transactionId = paymentResult.transactionId || paymentResult.paymentIntent?.id || '';
    const idempotencyCheck = await db.checkPaymentIdempotency(quoteId, 'deposit', transactionId);
    
    if (idempotencyCheck.isDuplicate) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          orderId: idempotencyCheck.existingPayment.orderId,
          quoteId: quoteId,
          amount: amount,
          currency: currency,
          status: idempotencyCheck.existingPayment.status,
          isDuplicate: true,
          processedAt: idempotencyCheck.existingPayment.processedAt
        },
        message: 'Deposit payment already processed (duplicate request)'
      }), {
        status: 200,
        headers: securityHeaders,
      });
    }

    try {
      // Create order in MedusaJS for deposit payment
      const orderData = {
        customer_email: quote.customerEmail,
        amount: amount,
        currency: currency,
        line_items: [
          {
            title: `Catering Deposit - Quote #${quote.id.slice(0, 8)}`,
            description: `Deposit payment for ${quote.eventDetails.guestCount} guests on ${new Date(quote.eventDetails.date).toLocaleDateString()}`,
            unit_price: amount * 100, // Convert to cents
            quantity: 1,
            metadata: {
              quote_id: quote.id,
              payment_type: 'deposit',
              event_date: quote.eventDetails.date,
              guest_count: quote.eventDetails.guestCount,
              payment_provider: paymentResult.provider || 'unknown',
              transaction_id: paymentResult.transactionId || paymentResult.paymentIntent?.id,
            }
          }
        ],
        metadata: {
          quote_id: quote.id,
          payment_type: 'deposit',
          original_quote_total: quote.pricing.totalCents,
          balance_remaining: quote.pricing.balanceCents,
        }
      };

      const medusaOrder = await createMedusaOrder(orderData);

      // Update quote status in database
      await db.updateCateringQuoteStatus(
        quoteId,
        'deposit_paid',
        medusaOrder.id
      );

      // Send confirmation email
      try {
        await sendDepositConfirmationEmail(
          quote.customerEmail,
          quoteId,
          amount
        );
      } catch (emailError) {
        console.error('Error sending deposit confirmation email:', emailError);
        // Don't fail the payment if email fails
      }

      // Generate secure balance payment link with JWT-like token
      const { generatePaymentToken } = await import('../../../../lib/security');
      const balancePaymentToken = generatePaymentToken(
        quoteId,
        quote.customerEmail,
        'balance_payment',
        quote.pricing.balanceCents,
        currency
      );
      const balancePaymentLink = `${request.headers.get('origin') || 'http://localhost:4005'}/catering/balance-payment?quote=${quoteId}&token=${balancePaymentToken}`;

      return new Response(JSON.stringify({
        success: true,
        data: {
          orderId: medusaOrder.id,
          quoteId: quoteId,
          amount: amount,
          currency: currency,
          status: 'deposit_paid',
          balancePaymentLink: balancePaymentLink,
          balanceAmount: quote.pricing.balanceCents / 100,
          eventDate: quote.eventDetails.date,
        },
        message: 'Deposit payment processed successfully'
      }), {
        status: 200,
        headers: securityHeaders,
      });

    } catch (orderError) {
      console.error('Error creating MedusaJS order:', orderError);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create order',
        details: 'Order creation failed after successful payment'
      }), {
        status: 500,
        headers: securityHeaders,
      });
    }

  } catch (error) {
    console.error('Error processing deposit payment:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process deposit payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

// GET /api/catering/payments/deposit - Get deposit payment status
export const GET: APIRoute = async ({ url }) => {
  // Security headers for all responses
  const securityHeaders = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  try {
    const searchParams = new URL(url).searchParams;
    const quoteId = searchParams.get('quoteId');
    
    if (!quoteId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote ID is required'
      }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    // Fetch the quote to check deposit status
    const quote = await db.getCateringQuote(quoteId);
    
    if (!quote) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote not found'
      }), {
        status: 404,
        headers: securityHeaders,
      });
    }

    const depositPaid = quote.status === 'deposit_paid' || 
                       quote.status === 'confirmed' || 
                       quote.status === 'completed';

    return new Response(JSON.stringify({
      success: true,
      data: {
        quoteId: quote.id,
        depositPaid: depositPaid,
        status: quote.status,
        depositAmount: quote.pricing.depositCents / 100,
        balanceAmount: quote.pricing.balanceCents / 100,
        medusaOrderId: quote.medusaOrderId,
        eventDate: quote.eventDetails.date,
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error fetching deposit payment status:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch deposit payment status'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};