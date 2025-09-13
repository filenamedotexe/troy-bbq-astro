import type { APIRoute } from 'astro';
import { db } from '../../../../lib/database';

// GET /api/store/collections - List collections for customer store
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const collections = await db.listCollections(limit, offset);

    // Transform to MedusaJS-compatible format
    const transformedCollections = collections.map(collection => ({
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      metadata: collection.metadata,
      created_at: collection.created_at,
      updated_at: collection.updated_at
    }));

    return new Response(JSON.stringify({
      collections: transformedCollections,
      count: transformedCollections.length,
      offset,
      limit
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600' // Cache for 10 minutes
      }
    });

  } catch (error) {
    console.error('Error fetching store collections:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch collections',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};