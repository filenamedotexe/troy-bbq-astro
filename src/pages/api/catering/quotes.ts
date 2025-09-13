import type { APIRoute } from 'astro';
import { db } from '../../../lib/database';
import { cateringQuoteSchema, quoteFormSchema } from '../../../lib/schemas';
import { z } from 'zod';

// Schema for creating a new quote (without id, createdAt, updatedAt)
const createQuoteSchema = z.object({
  customerEmail: z.string().email(),
  eventDetails: z.object({
    type: z.enum(['corporate', 'private']),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    }),
    guestCount: z.number().int().min(1).max(1000),
    hungerLevel: z.enum(['normal', 'prettyHungry', 'reallyHungry']),
    location: z.object({
      address: z.string().min(5).max(500),
      distanceMiles: z.number().min(0).max(100),
    }),
  }),
  menuSelections: z.array(z.object({
    proteinId: z.string().uuid(),
    sideId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).min(1),
  addOns: z.array(z.object({
    addOnId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).optional().default([]),
  pricing: z.object({
    subtotalCents: z.number().int().min(0),
    taxCents: z.number().int().min(0),
    deliveryFeeCents: z.number().int().min(0),
    totalCents: z.number().int().min(0),
    depositCents: z.number().int().min(0),
    balanceCents: z.number().int().min(0),
  }),
  status: z.enum(['pending', 'approved', 'deposit_paid', 'confirmed', 'completed', 'cancelled']).optional().default('pending'),
});

// Schema for updating quote status
const updateQuoteStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'deposit_paid', 'confirmed', 'completed', 'cancelled']),
  medusaOrderId: z.string().optional(),
  balanceOrderId: z.string().optional(),
});

// GET /api/catering/quotes - Fetch quotes with optional filtering
export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const email = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const id = searchParams.get('id');

    // If specific ID is requested, fetch single quote
    if (id) {
      const quote = await db.getCateringQuote(id);
      
      if (!quote) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Quote not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: quote
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // If email is provided, fetch quotes by email
    if (email) {
      const quotes = await db.getCateringQuotesByEmail(email);
      
      return new Response(JSON.stringify({
        success: true,
        data: quotes
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Fetch all quotes with pagination
    const quotes = await db.getAllCateringQuotes(limit, offset);
    
    return new Response(JSON.stringify({
      success: true,
      data: quotes,
      pagination: {
        limit,
        offset,
        count: quotes.length
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching catering quotes:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch catering quotes'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

// POST /api/catering/quotes - Create a new quote
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validate the request body against our schema
    const validationResult = createQuoteSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid quote data',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Create the quote in database
    const quoteId = await db.createCateringQuote(validationResult.data);
    
    return new Response(JSON.stringify({
      success: true,
      data: { id: quoteId },
      message: 'Quote created successfully'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating catering quote:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create catering quote'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

// PUT /api/catering/quotes - Update quote status
export const PUT: APIRoute = async ({ request, url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const body = await request.json();
    
    // Validate the request body against our schema
    const validationResult = updateQuoteStatusSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid update data',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Check if quote exists
    const existingQuote = await db.getCateringQuote(id);
    if (!existingQuote) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quote not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Update quote status in database
    await db.updateCateringQuoteStatus(
      id,
      validationResult.data.status,
      validationResult.data.medusaOrderId,
      validationResult.data.balanceOrderId
    );
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Quote status updated successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating catering quote status:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update catering quote status'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};