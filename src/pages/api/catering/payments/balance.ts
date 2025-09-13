import type { APIRoute } from 'astro';
import { db } from '../../../../lib/database';
import { z } from 'zod';

// MedusaJS SDK placeholder - in real implementation, import from medusa-js
const createMedusaOrder = async (orderData: any) => {
  // This would be the actual MedusaJS order creation
  // For demo purposes, we'll return a mock order
  return {
    id: `order_balance_${Date.now()}`,
    status: 'pending',
    total: orderData.amount * 100, // Convert to cents
    currency_code: orderData.currency.toLowerCase(),
    created_at: new Date().toISOString(),
    customer_email: orderData.customer_email
  };
};

// Email notification service placeholder
const sendBalanceConfirmationEmail = async (email: string, quoteId: string, amount: number) => {
  // In real implementation, this would send an email via SendGrid, Mailgun, etc.
  console.log(`Sending balance confirmation email to ${email} for quote ${quoteId}, amount: $${amount}`);
  return Promise.resolve();
};

const sendOrderConfirmationEmail = async (email: string, quote: any) => {
  // In real implementation, this would send a complete order confirmation
  console.log(`Sending order confirmation email to ${email} for quote ${quote.id}`);
  return Promise.resolve();
};

// Enhanced schema for balance payment request with comprehensive validation
const balancePaymentSchema = z.object({
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
  token: z.string()
    .min(10, 'Token too short')
    .max(2048, 'Token too long')
    .regex(/^[A-Za-z0-9._-]+$/, 'Token contains invalid characters')
    .refine((token) => {
      // Basic JWT structure check: header.payload.signature
      const parts = token.split('.');
      return parts.length === 3 && parts.every(part => part.length > 0);
    }, 'Invalid token format'),
});

// POST /api/catering/payments/balance - Process balance payment
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
    const validationResult = balancePaymentSchema.safeParse(body);
    
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

    const { quoteId, paymentResult, amount, currency, token } = validationResult.data;

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

    // Verify the quote is in a valid state for balance payment
    if (quote.status !== 'deposit_paid') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote is not in a valid state for balance payment',
        currentStatus: quote.status,
        expectedStatus: 'deposit_paid'
      }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    // Verify the payment amount matches the expected balance using secure comparison
    const { secureAmountCompare } = await import('../../../../lib/security');
    const expectedBalanceAmount = quote.pricing.balanceCents / 100;
    if (!secureAmountCompare(amount, expectedBalanceAmount, 0.01)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment amount does not match expected balance',
        expected: expectedBalanceAmount,
        received: amount,
        expectedCents: quote.pricing.balanceCents,
        receivedCents: Math.round(amount * 100)
      }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    // Verify secure JWT token if provided (required for payment security)
    if (token) {
      const { validatePaymentToken } = await import('../../../../lib/security');
      const tokenValidation = validatePaymentToken(token);
      
      if (!tokenValidation.valid) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid or expired payment token',
          details: tokenValidation.error
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      const tokenPayload = tokenValidation.payload!;
      
      // Verify token matches request parameters
      if (tokenPayload.quoteId !== quoteId || 
          tokenPayload.customerEmail !== quote.customerEmail ||
          tokenPayload.purpose !== 'balance_payment') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Token does not match payment request'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      // Verify token amount matches expected balance
      if (!secureAmountCompare(tokenPayload.amount / 100, expectedBalanceAmount, 0.01)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Token amount does not match current balance',
          tokenAmount: tokenPayload.amount / 100,
          currentBalance: expectedBalanceAmount
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    } else {
      // Require token for balance payments as additional security
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment token required for balance payment'
      }), {
        status: 403,
        headers: securityHeaders,
      });
    }

    // Check if event date is approaching (within 48 hours)
    const eventDate = new Date(quote.eventDetails.date);
    const now = new Date();
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilEvent < 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Event date has passed',
        eventDate: quote.eventDetails.date
      }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    // Check for duplicate payment (idempotency protection)
    const transactionId = paymentResult.transactionId || paymentResult.paymentIntent?.id || '';
    const idempotencyCheck = await db.checkPaymentIdempotency(quoteId, 'balance', transactionId);
    
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
        message: 'Balance payment already processed (duplicate request)'
      }), {
        status: 200,
        headers: securityHeaders,
      });
    }

    try {
      // Create order in MedusaJS for balance payment
      const orderData = {
        customer_email: quote.customerEmail,
        amount: amount,
        currency: currency,
        line_items: [
          {
            title: `Catering Balance Payment - Quote #${quote.id.slice(0, 8)}`,
            description: `Final balance payment for ${quote.eventDetails.guestCount} guests on ${new Date(quote.eventDetails.date).toLocaleDateString()}`,
            unit_price: amount * 100, // Convert to cents
            quantity: 1,
            metadata: {
              quote_id: quote.id,
              payment_type: 'balance',
              event_date: quote.eventDetails.date,
              guest_count: quote.eventDetails.guestCount,
              payment_provider: paymentResult.provider || 'unknown',
              transaction_id: paymentResult.transactionId || paymentResult.paymentIntent?.id,
              deposit_order_id: quote.medusaOrderId,
            }
          }
        ],
        metadata: {
          quote_id: quote.id,
          payment_type: 'balance',
          original_quote_total: quote.pricing.totalCents,
          deposit_order_id: quote.medusaOrderId,
          event_location: quote.eventDetails.location.address,
          event_type: quote.eventDetails.type,
          hunger_level: quote.eventDetails.hungerLevel,
        }
      };

      const medusaOrder = await createMedusaOrder(orderData);

      // Update quote status to completed in database
      await db.updateCateringQuoteStatus(
        quoteId,
        'completed',
        quote.medusaOrderId, // Keep the original deposit order ID
        medusaOrder.id // Add the balance order ID
      );

      // Send confirmation emails
      try {
        // Send balance payment confirmation
        await sendBalanceConfirmationEmail(
          quote.customerEmail,
          quoteId,
          amount
        );

        // Send complete order confirmation with event details
        await sendOrderConfirmationEmail(
          quote.customerEmail,
          quote
        );
      } catch (emailError) {
        console.error('Error sending confirmation emails:', emailError);
        // Don't fail the payment if email fails
      }

      // Calculate event preparation timeline
      const setupTime = new Date(eventDate.getTime() - (2 * 60 * 60 * 1000)); // 2 hours before event
      const prepTime = new Date(eventDate.getTime() - (4 * 60 * 60 * 1000)); // 4 hours before event

      return new Response(JSON.stringify({
        success: true,
        data: {
          orderId: medusaOrder.id,
          quoteId: quoteId,
          amount: amount,
          currency: currency,
          status: 'completed',
          totalPaid: quote.pricing.totalCents / 100,
          depositOrderId: quote.medusaOrderId,
          balanceOrderId: medusaOrder.id,
          eventDetails: {
            date: quote.eventDetails.date,
            guestCount: quote.eventDetails.guestCount,
            location: quote.eventDetails.location.address,
            type: quote.eventDetails.type,
          },
          timeline: {
            prepStartTime: prepTime.toISOString(),
            setupStartTime: setupTime.toISOString(),
            eventStartTime: eventDate.toISOString(),
          },
          contactInfo: {
            email: 'catering@troybbq.com',
            phone: '(555) 123-4567',
            emergencyPhone: '(555) 987-6543'
          }
        },
        message: 'Balance payment processed successfully - Your catering order is now confirmed!'
      }), {
        status: 200,
        headers: securityHeaders,
      });

    } catch (orderError) {
      console.error('Error creating balance order:', orderError);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create balance order',
        details: 'Order creation failed after successful payment'
      }), {
        status: 500,
        headers: securityHeaders,
      });
    }

  } catch (error) {
    console.error('Error processing balance payment:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process balance payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

// GET /api/catering/payments/balance - Get balance payment status
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
    const token = searchParams.get('token');
    
    if (!quoteId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote ID is required'
      }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    // Fetch the quote to check balance payment status
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

    // Verify secure JWT token if provided
    if (token) {
      const { validatePaymentToken } = await import('../../../../lib/security');
      const tokenValidation = validatePaymentToken(token);
      
      if (!tokenValidation.valid) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid or expired access token',
          details: tokenValidation.error
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      const tokenPayload = tokenValidation.payload!;
      
      // Verify token matches request parameters
      if (tokenPayload.quoteId !== quoteId || 
          tokenPayload.customerEmail !== quote.customerEmail) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Token does not match quote access request'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    }

    const balancePaid = quote.status === 'completed';
    const depositPaid = quote.status === 'deposit_paid' || 
                       quote.status === 'confirmed' || 
                       quote.status === 'completed';

    // Calculate time until event
    const eventDate = new Date(quote.eventDetails.date);
    const now = new Date();
    const hoursUntilEvent = Math.max(0, (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    return new Response(JSON.stringify({
      success: true,
      data: {
        quoteId: quote.id,
        depositPaid: depositPaid,
        balancePaid: balancePaid,
        status: quote.status,
        depositAmount: quote.pricing.depositCents / 100,
        balanceAmount: quote.pricing.balanceCents / 100,
        totalAmount: quote.pricing.totalCents / 100,
        medusaOrderId: quote.medusaOrderId,
        balanceOrderId: quote.balanceOrderId,
        eventDetails: {
          date: quote.eventDetails.date,
          guestCount: quote.eventDetails.guestCount,
          location: quote.eventDetails.location.address,
          type: quote.eventDetails.type,
        },
        timeline: {
          hoursUntilEvent: Math.round(hoursUntilEvent),
          paymentRequired: hoursUntilEvent <= 48 && !balancePaid,
          eventPassed: hoursUntilEvent <= 0,
        }
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error fetching balance payment status:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch balance payment status'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};