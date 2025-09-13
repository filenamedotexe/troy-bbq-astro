import type { APIRoute } from 'astro';
import { db } from '../../../../lib/database';
import { updateProductSchema } from '../../../../lib/schemas';

// Helper function to check if user is authenticated (placeholder - implement based on your auth system)
async function isAuthenticated(request: Request): Promise<boolean> {
  // TODO: Implement proper authentication check
  // For now, return true for development
  return true;
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// GET /api/admin/products/[id] - Get a single product
export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Check authentication
    if (!(await isAuthenticated(request))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const productId = params.id;

    // Validate product ID format
    if (!productId || !isValidUUID(productId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid product ID format'
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

    // Fetch product from database
    const product = await db.getProduct(productId);

    if (!product) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: product
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
    console.error('Error fetching product:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch product',
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
};

// PUT /api/admin/products/[id] - Update a product
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    // Check authentication
    if (!(await isAuthenticated(request))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const productId = params.id;

    // Validate product ID format
    if (!productId || !isValidUUID(productId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid product ID format'
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

    // Check if product exists
    const existingProduct = await db.getProduct(productId);
    if (!existingProduct) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Parse request body
    const body = await request.json();

    // Validate the request body
    const validationResult = updateProductSchema.safeParse(body);
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

    // Update the product in database
    await db.updateProduct(productId, validationResult.data);

    // Fetch the updated product with all related data
    const updatedProduct = await db.getProduct(productId);

    return new Response(JSON.stringify({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
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
    console.error('Error updating product:', error);

    // Handle specific errors
    let statusCode = 500;
    let errorMessage = 'Failed to update product';

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        statusCode = 409;
        errorMessage = error.message;
      } else if (error.message.includes('Invalid') || error.message.includes('No fields to update')) {
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
};

// DELETE /api/admin/products/[id] - Delete a product
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    // Check authentication
    if (!(await isAuthenticated(request))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const productId = params.id;

    // Validate product ID format
    if (!productId || !isValidUUID(productId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid product ID format'
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

    // Check if product exists
    const existingProduct = await db.getProduct(productId);
    if (!existingProduct) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Delete the product from database
    await db.deleteProduct(productId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Product deleted successfully'
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
    console.error('Error deleting product:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete product',
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
};

// OPTIONS /api/admin/products/[id] - Handle CORS preflight
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