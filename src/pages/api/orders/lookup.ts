import type { APIRoute } from 'astro';
import { orderTrackingService } from '../../../lib/orderTracking';
import { orderLookupInputSchema } from '../../../lib/schemas';
import type { OrderLookupResponse } from '../../../types';

/**
 * Customer order lookup endpoint
 * Allows customers to find their orders by email or phone number
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = orderLookupInputSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid input',
          details: validationResult.error.issues
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { identifier, orderNumber } = validationResult.data;

    // Lookup orders using the tracking service
    const result: OrderLookupResponse = await orderTrackingService.lookupOrders({
      identifier,
      orderNumber
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in order lookup:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to lookup orders'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Handle preflight requests for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};