import type { APIRoute } from 'astro';
import { orderTrackingService } from '../../../lib/orderTracking';
import { adminOrderFiltersSchema } from '../../../lib/schemas';
import type { AdminOrderListResponse } from '../../../types';

/**
 * Admin order management endpoint
 * Provides filtered order lists for admin interface
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse query parameters
    const filters: any = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Parse status filter
    const statusParam = searchParams.get('status');
    if (statusParam) {
      filters.status = statusParam.split(',');
    }

    // Parse date range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    // Parse other filters
    const customerSearch = searchParams.get('customerSearch');
    if (customerSearch) {
      filters.customerSearch = customerSearch;
    }

    const orderType = searchParams.get('orderType');
    if (orderType && ['regular', 'catering', 'all'].includes(orderType)) {
      filters.orderType = orderType;
    }

    const deliveryType = searchParams.get('deliveryType');
    if (deliveryType && ['pickup', 'delivery', 'all'].includes(deliveryType)) {
      filters.deliveryType = deliveryType;
    }

    // Validate filters
    const validationResult = adminOrderFiltersSchema.safeParse(filters);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid filters',
          details: validationResult.error.issues
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get orders with filters
    const result: AdminOrderListResponse = await orderTrackingService.getOrdersWithFilters(
      validationResult.data
    );

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
    console.error('Error in admin order listing:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to get order list'
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};