import type { APIRoute } from 'astro';
import { db } from '../../../../lib/database';
import { z } from 'zod';

// Email service placeholder - in real implementation, use SendGrid, Mailgun, etc.
const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  // This would be the actual email sending implementation
  return Promise.resolve({ messageId: `msg_${Date.now()}` });
};

// Generate HTML email template for balance payment link
const generateBalancePaymentEmail = (quote: any, balanceLink: string) => {
  const eventDate = new Date(quote.eventDetails.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Balance Payment Required - Troy BBQ Catering</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
            .button { display: inline-block; background: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .event-details { background: #fef3f2; border: 1px solid #fed7d7; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .payment-summary { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .warning { background: #fef3e2; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔥 Troy BBQ Catering</h1>
                <h2>Final Payment Required</h2>
            </div>
            
            <div class="content">
                <p>Hello,</p>
                
                <p>Your catering deposit has been received! To complete your order and confirm your catering event, we need to collect the final balance payment.</p>
                
                <div class="event-details">
                    <h3>📅 Event Details</h3>
                    <p><strong>Date:</strong> ${eventDate}</p>
                    <p><strong>Guest Count:</strong> ${quote.eventDetails.guestCount} people</p>
                    <p><strong>Location:</strong> ${quote.eventDetails.location.address}</p>
                    <p><strong>Event Type:</strong> ${quote.eventDetails.type.charAt(0).toUpperCase() + quote.eventDetails.type.slice(1)}</p>
                </div>
                
                <div class="payment-summary">
                    <h3>💰 Payment Summary</h3>
                    <p><strong>Total Order:</strong> $${(quote.pricing.totalCents / 100).toFixed(2)}</p>
                    <p><strong>Deposit Paid:</strong> <span style="color: green;">✅ $${(quote.pricing.depositCents / 100).toFixed(2)}</span></p>
                    <p><strong>Balance Due:</strong> <span style="color: #ea580c; font-size: 18px; font-weight: bold;">$${(quote.pricing.balanceCents / 100).toFixed(2)}</span></p>
                </div>
                
                <div class="warning">
                    <p><strong>⏰ Important:</strong> Balance payment must be completed 48 hours before your event to ensure confirmed catering service.</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${balanceLink}" class="button">Pay Balance Now - $${(quote.pricing.balanceCents / 100).toFixed(2)}</a>
                </div>
                
                <p><strong>What happens next:</strong></p>
                <ul>
                    <li>Click the button above to complete your balance payment</li>
                    <li>Choose your preferred payment method (Stripe or Square)</li>
                    <li>Your order will be confirmed immediately after payment</li>
                    <li>Our team will arrive 2 hours before your event for setup</li>
                </ul>
                
                <p><strong>Need changes or have questions?</strong></p>
                <p>Contact us at <a href="mailto:catering@troybbq.com">catering@troybbq.com</a> or call <strong>(555) 123-4567</strong></p>
                
                <p>We're excited to serve you amazing BBQ!</p>
                
                <p>Best regards,<br>
                The Troy BBQ Catering Team</p>
            </div>
            
            <div class="footer">
                <p>Troy BBQ | 123 Smoke Street, BBQ City, TX 12345</p>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>Questions? Contact us at catering@troybbq.com</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Enhanced schema for balance link email request with validation
const balanceLinkEmailSchema = z.object({
  quoteId: z.string()
    .uuid('Quote ID must be a valid UUID')
    .refine((id) => id.length === 36, 'Quote ID must be exactly 36 characters'),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email address too long')
    .refine((email) => !email.includes('..'), 'Email contains consecutive dots')
    .refine((email) => !email.startsWith('.') && !email.endsWith('.'), 'Email cannot start or end with a dot'),
  link: z.string()
    .url('Invalid URL format')
    .max(2048, 'URL too long')
    .refine((url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, 'URL must use HTTP or HTTPS protocol'),
});

// POST /api/catering/payments/send-balance-link - Send balance payment link via email
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
    const body = await request.json();
    
    // Validate the request body
    const validationResult = balanceLinkEmailSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    const { quoteId, email, link } = validationResult.data;

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

    // Verify the email matches the quote's customer email
    if (quote.customerEmail !== email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email does not match quote customer'
      }), {
        status: 403,
        headers: securityHeaders,
      });
    }

    // Verify the quote is in a valid state for balance payment
    if (quote.status !== 'deposit_paid') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote is not ready for balance payment',
        currentStatus: quote.status,
        expectedStatus: 'deposit_paid'
      }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    // Check if event is still upcoming
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

    try {
      // Generate email content
      const subject = `Final Payment Required - Troy BBQ Catering (${new Date(quote.eventDetails.date).toLocaleDateString()})`;
      const htmlContent = generateBalancePaymentEmail(quote, link);
      
      // Send the email
      const emailResult = await sendEmail(email, subject, htmlContent);
      
      // Calculate urgency level based on time until event
      let urgencyLevel = 'normal';
      if (hoursUntilEvent <= 48) {
        urgencyLevel = 'urgent';
      } else if (hoursUntilEvent <= 168) { // 7 days
        urgencyLevel = 'high';
      }

      return new Response(JSON.stringify({
        success: true,
        data: {
          messageId: emailResult.messageId,
          sentTo: email,
          quoteId: quoteId,
          balanceAmount: quote.pricing.balanceCents / 100,
          eventDate: quote.eventDetails.date,
          hoursUntilEvent: Math.round(hoursUntilEvent),
          urgencyLevel: urgencyLevel,
        },
        message: 'Balance payment link sent successfully'
      }), {
        status: 200,
        headers: securityHeaders,
      });

    } catch (emailError) {
      console.error('Error sending balance payment email:', emailError);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to send email',
        details: emailError instanceof Error ? emailError.message : 'Email service unavailable'
      }), {
        status: 500,
        headers: securityHeaders,
      });
    }

  } catch (error) {
    console.error('Error processing balance link email request:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process email request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};