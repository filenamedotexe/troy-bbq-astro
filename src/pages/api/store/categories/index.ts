import type { APIRoute } from 'astro';
import { db } from '../../../../lib/database';
import { createStoreRoute, handleCORSPreflight, generateETag } from '../../../../lib/middleware';
import { getSecurityHeaders } from '../../../../lib/auth';

// GET /api/store/categories - List categories for customer store
export const GET: APIRoute = createStoreRoute(async ({ request }) => {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse query parameters
    const parentId = searchParams.get('parent_id') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const result = await db.listCategories({
      parent_id: parentId === 'null' ? null : parentId,
      is_active: true, // Only show active categories in store
      sort_by: 'sort_order',
      sort_order: 'ASC',
      limit,
      offset
    });

    // Transform to MedusaJS-compatible format
    const transformedCategories = result.categories.map(category => ({
      id: category.id,
      name: category.name,
      handle: category.handle,
      description: category.description,
      parent_id: category.parent_id,
      is_active: category.is_active,
      sort_order: category.sort_order,
      product_count: category.product_count,
      children: category.children?.map(child => ({
        id: child.id,
        name: child.name,
        handle: child.handle,
        description: child.description,
        parent_id: child.parent_id,
        is_active: child.is_active,
        sort_order: child.sort_order
      })),
      created_at: category.created_at,
      updated_at: category.updated_at
    }));

    const responseData = {
      categories: transformedCategories,
      count: transformedCategories.length,
      offset,
      limit,
      total_count: result.total_count,
      has_more: result.has_more
    };

    const responseJson = JSON.stringify(responseData);
    const etag = generateETag(responseJson);

    return new Response(responseJson, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=1200', // Cache for 10 minutes
        'ETag': etag,
        'Vary': 'Accept-Encoding, X-Publishable-Api-Key',
        ...getSecurityHeaders()
      }
    });

  } catch (error) {
    console.error('Error fetching store categories:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch categories',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getSecurityHeaders()
      }
    });
  }
});

// Handle OPTIONS requests for CORS
export const OPTIONS: APIRoute = ({ request }) => {
  return handleCORSPreflight(request);
};