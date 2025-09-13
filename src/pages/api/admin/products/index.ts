import type { APIRoute } from 'astro';
import { db } from '../../../../lib/database';
import { createProductSchema, productQuerySchema } from '../../../../lib/schemas';
import { createAdminRoute, handleCORSPreflight } from '../../../../lib/middleware';

// GET /api/admin/products - List products with filtering and pagination
export const GET: APIRoute = createAdminRoute(async ({ request, url }) => {
  try {
    // Parse query parameters
    const searchParams = url.searchParams;
    const queryParams: any = {};

    // Handle string parameters
    if (searchParams.get('search')) queryParams.search = searchParams.get('search');
    if (searchParams.get('sort_by')) queryParams.sort_by = searchParams.get('sort_by');
    if (searchParams.get('sort_order')) queryParams.sort_order = searchParams.get('sort_order');

    // Handle array parameters
    if (searchParams.get('category_ids')) {
      queryParams.category_ids = searchParams.get('category_ids')?.split(',');
    }
    if (searchParams.get('collection_ids')) {
      queryParams.collection_ids = searchParams.get('collection_ids')?.split(',');
    }
    if (searchParams.get('tag_values')) {
      queryParams.tag_values = searchParams.get('tag_values')?.split(',');
    }
    if (searchParams.get('status')) {
      queryParams.status = searchParams.get('status')?.split(',');
    }

    // Handle numeric parameters
    if (searchParams.get('price_min_cents')) {
      queryParams.price_min_cents = parseInt(searchParams.get('price_min_cents') || '0');
    }
    if (searchParams.get('price_max_cents')) {
      queryParams.price_max_cents = parseInt(searchParams.get('price_max_cents') || '0');
    }
    if (searchParams.get('limit')) {
      queryParams.limit = parseInt(searchParams.get('limit') || '50');
    }
    if (searchParams.get('offset')) {
      queryParams.offset = parseInt(searchParams.get('offset') || '0');
    }

    // Handle boolean parameters
    if (searchParams.get('is_giftcard') !== null) {
      queryParams.is_giftcard = searchParams.get('is_giftcard') === 'true';
    }
    if (searchParams.get('discountable') !== null) {
      queryParams.discountable = searchParams.get('discountable') === 'true';
    }
    if (searchParams.get('has_inventory') !== null) {
      queryParams.has_inventory = searchParams.get('has_inventory') === 'true';
    }

    // Validate query parameters
    const validationResult = productQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid query parameters',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Fetch products from database
    const result = await db.listProducts(validationResult.data);

    return new Response(JSON.stringify({
      success: true,
      data: result.products,
      pagination: {
        total_count: result.total_count,
        has_more: result.has_more,
        limit: validationResult.data.limit,
        offset: validationResult.data.offset
      },
      filters: result.filters
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
});

// POST /api/admin/products - Create a new product
export const POST: APIRoute = createAdminRoute(async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate the request body
    const validationResult = createProductSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid product data',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Create the product in database
    const productId = await db.createProduct(validationResult.data);

    // Fetch the created product with all related data
    const createdProduct = await db.getProduct(productId);

    return new Response(JSON.stringify({
      success: true,
      data: createdProduct,
      message: 'Product created successfully'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('Error creating product:', error);

    // Handle specific errors
    let statusCode = 500;
    let errorMessage = 'Failed to create product';

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        statusCode = 409;
        errorMessage = error.message;
      } else if (error.message.includes('Invalid')) {
        statusCode = 400;
        errorMessage = error.message;
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
});

// OPTIONS /api/admin/products - Handle CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
};