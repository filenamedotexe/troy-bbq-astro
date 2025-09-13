import type { APIRoute } from 'astro';
import { db } from '../../../../lib/database';
import { bulkCategoryOperationSchema } from '../../../../lib/schemas';

// Helper function to check if user is authenticated (placeholder - implement based on your auth system)
async function isAuthenticated(request: Request): Promise<boolean> {
  // TODO: Implement proper authentication check
  // For now, return true for development
  return true;
}

// POST /api/admin/categories/bulk - Perform bulk operations on categories
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
    const validationResult = bulkCategoryOperationSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid bulk operation data',
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

    const { category_ids, operation, metadata } = validationResult.data;
    const results = {
      success: [],
      failed: [],
      total: category_ids.length
    };

    // Process each category ID
    for (const categoryId of category_ids) {
      try {
        // Check if category exists
        const existingCategory = await db.getCategory(categoryId);
        if (!existingCategory) {
          results.failed.push({
            category_id: categoryId,
            error: 'Category not found'
          });
          continue;
        }

        switch (operation) {
          case 'delete':
            await db.deleteCategory(categoryId);
            results.success.push({
              category_id: categoryId,
              operation: 'deleted'
            });
            break;

          case 'activate':
            await db.updateCategory(categoryId, { is_active: true });
            results.success.push({
              category_id: categoryId,
              operation: 'activated'
            });
            break;

          case 'deactivate':
            await db.updateCategory(categoryId, { is_active: false });
            results.success.push({
              category_id: categoryId,
              operation: 'deactivated'
            });
            break;

          default:
            results.failed.push({
              category_id: categoryId,
              error: 'Unknown operation'
            });
        }
      } catch (error) {
        results.failed.push({
          category_id: categoryId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const statusCode = results.failed.length === 0 ? 200 : (results.success.length === 0 ? 400 : 207); // 207 = Multi-Status

    return new Response(JSON.stringify({
      success: results.failed.length === 0,
      data: results,
      message: `Bulk ${operation} operation completed. ${results.success.length} succeeded, ${results.failed.length} failed.`
    }), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('Error performing bulk operation:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to perform bulk operation',
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

// OPTIONS /api/admin/categories/bulk - Handle CORS preflight
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