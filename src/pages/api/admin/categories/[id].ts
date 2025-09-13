import type { APIRoute } from 'astro';
import { db } from '../../../../lib/database';
import { updateCategorySchema } from '../../../../lib/schemas';

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

// GET /api/admin/categories/[id] - Get a single category
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

    const categoryId = params.id;

    // Validate category ID format
    if (!categoryId || !isValidUUID(categoryId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid category ID format'
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

    // Fetch category from database
    const category = await db.getCategory(categoryId);

    if (!category) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Category not found'
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
      data: category
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
    console.error('Error fetching category:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch category',
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

// PUT /api/admin/categories/[id] - Update a category
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

    const categoryId = params.id;

    // Validate category ID format
    if (!categoryId || !isValidUUID(categoryId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid category ID format'
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

    // Check if category exists
    const existingCategory = await db.getCategory(categoryId);
    if (!existingCategory) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Category not found'
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
    const validationResult = updateCategorySchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid category data',
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

    // Update the category in database
    await db.updateCategory(categoryId, validationResult.data);

    // Fetch the updated category
    const updatedCategory = await db.getCategory(categoryId);

    return new Response(JSON.stringify({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
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
    console.error('Error updating category:', error);

    // Handle specific errors
    let statusCode = 500;
    let errorMessage = 'Failed to update category';

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        statusCode = 409;
        errorMessage = error.message;
      } else if (error.message.includes('does not exist')) {
        statusCode = 400;
        errorMessage = error.message;
      } else if (error.message.includes('circular') || error.message.includes('descendant')) {
        statusCode = 400;
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

// DELETE /api/admin/categories/[id] - Delete a category
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

    const categoryId = params.id;

    // Validate category ID format
    if (!categoryId || !isValidUUID(categoryId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid category ID format'
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

    // Check if category exists
    const existingCategory = await db.getCategory(categoryId);
    if (!existingCategory) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Category not found'
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

    // Delete the category from database
    await db.deleteCategory(categoryId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Category deleted successfully'
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
    console.error('Error deleting category:', error);

    // Handle specific errors
    let statusCode = 500;
    let errorMessage = 'Failed to delete category';

    if (error instanceof Error) {
      if (error.message.includes('child categories')) {
        statusCode = 400;
        errorMessage = 'Cannot delete category with child categories';
      } else if (error.message.includes('associated products')) {
        statusCode = 400;
        errorMessage = 'Cannot delete category with associated products';
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

// OPTIONS /api/admin/categories/[id] - Handle CORS preflight
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