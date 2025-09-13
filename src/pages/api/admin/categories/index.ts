import type { APIRoute } from 'astro';
import { db } from '../../../../lib/database';
import { createCategorySchema, categoryQuerySchema } from '../../../../lib/schemas';

// Helper function to check if user is authenticated (placeholder - implement based on your auth system)
async function isAuthenticated(request: Request): Promise<boolean> {
  // TODO: Implement proper authentication check
  // For now, return true for development
  return true;
}

// GET /api/admin/categories - List categories with filtering and pagination
export const GET: APIRoute = async ({ request, url }) => {
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

    // Parse query parameters
    const searchParams = url.searchParams;
    const queryParams: any = {};

    // Handle string parameters
    if (searchParams.get('search')) queryParams.search = searchParams.get('search');
    if (searchParams.get('sort_by')) queryParams.sort_by = searchParams.get('sort_by');
    if (searchParams.get('sort_order')) queryParams.sort_order = searchParams.get('sort_order');

    // Handle parent_id (can be null, string, or undefined)
    const parentId = searchParams.get('parent_id');
    if (parentId !== null) {
      queryParams.parent_id = parentId === 'null' ? null : parentId;
    }

    // Handle numeric parameters
    if (searchParams.get('limit')) {
      queryParams.limit = parseInt(searchParams.get('limit') || '100');
    }
    if (searchParams.get('offset')) {
      queryParams.offset = parseInt(searchParams.get('offset') || '0');
    }

    // Handle boolean parameters
    if (searchParams.get('is_active') !== null) {
      queryParams.is_active = searchParams.get('is_active') === 'true';
    }

    // Special query parameter for tree structure
    const includeTree = searchParams.get('tree') === 'true';

    if (includeTree) {
      // Return category tree structure
      const categoryTree = await db.getCategoryTree();

      return new Response(JSON.stringify({
        success: true,
        data: categoryTree,
        tree: true
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Validate query parameters
    const validationResult = categoryQuerySchema.safeParse(queryParams);
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

    // Fetch categories from database
    const result = await db.listCategories(validationResult.data);

    return new Response(JSON.stringify({
      success: true,
      data: result.categories,
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
    console.error('Error fetching categories:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch categories',
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

// POST /api/admin/categories - Create a new category
export const POST: APIRoute = async ({ request }) => {
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

    // Parse request body
    const body = await request.json();

    // Validate the request body
    const validationResult = createCategorySchema.safeParse(body);
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

    // Create the category in database
    const categoryId = await db.createCategory(validationResult.data);

    // Fetch the created category
    const createdCategory = await db.getCategory(categoryId);

    return new Response(JSON.stringify({
      success: true,
      data: createdCategory,
      message: 'Category created successfully'
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
    console.error('Error creating category:', error);

    // Handle specific errors
    let statusCode = 500;
    let errorMessage = 'Failed to create category';

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        statusCode = 409;
        errorMessage = error.message;
      } else if (error.message.includes('does not exist')) {
        statusCode = 400;
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
};

// OPTIONS /api/admin/categories - Handle CORS preflight
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