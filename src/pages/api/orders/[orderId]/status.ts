import type { APIRoute } from 'astro';
import { orderTrackingService } from '../../../../lib/orderTracking';
import { orderStatusUpdateSchema } from '../../../../lib/schemas';

/**
 * Order status update endpoint
 * Allows authorized users to update order status
 */
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const orderId = params.orderId;
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = orderStatusUpdateSchema.safeParse({
      orderId,
      ...body
    });
    
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

    const updateData = validationResult.data;

    // Update order status using the tracking service
    const result = await orderTrackingService.updateOrderStatus(updateData);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Failed to update order status',
          message: result.error
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order status updated successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error updating order status:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to update order status'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Get order details by ID
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const orderId = params.orderId;
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get order details using the tracking service
    const order = await orderTrackingService.getOrderById(orderId);

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: order
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error getting order details:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to get order details'
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
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};