import type { APIRoute } from 'astro';
import { db } from '../../../../lib/database';
import type { ProductQueryFilters } from '../../../../types';
import { createStoreRoute, validateInput, handleCORSPreflight, generateETag } from '../../../../lib/middleware';
import { getSecurityHeaders } from '../../../../lib/auth';

// GET /api/store/products - List products for customer store
export const GET: APIRoute = createStoreRoute(async ({ request }) => {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse query parameters
    const filters: ProductQueryFilters = {
      search: searchParams.get('q') || undefined,
      category_ids: searchParams.getAll('category_id').filter(Boolean),
      collection_ids: searchParams.getAll('collection_id').filter(Boolean),
      tag_values: searchParams.getAll('tag').filter(Boolean),
      status: ['published'], // Only show published products in store
      price_min_cents: searchParams.get('price_min') ? parseInt(searchParams.get('price_min')!) : undefined,
      price_max_cents: searchParams.get('price_max') ? parseInt(searchParams.get('price_max')!) : undefined,
      is_giftcard: searchParams.get('is_giftcard') === 'true' ? true :
                   searchParams.get('is_giftcard') === 'false' ? false : undefined,
      has_inventory: searchParams.get('has_inventory') === 'true' ? true :
                     searchParams.get('has_inventory') === 'false' ? false : undefined,
      sort_by: searchParams.get('sort_by') as any || 'created_at',
      sort_order: (searchParams.get('sort_order')?.toUpperCase() as 'ASC' | 'DESC') || 'DESC',
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
      offset: Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    };

    let result;
    try {
      result = await db.listProducts(filters);
    } catch (error: any) {
      // Fallback to demo data if database tables don't exist
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.warn('Product tables do not exist, returning demo data');
        result = {
          products: [
            {
              id: 'demo-brisket',
              title: 'Smoked Beef Brisket',
              subtitle: 'Tender, slow-smoked for 12 hours',
              description: 'Our signature brisket, rubbed with our secret spice blend and smoked over hickory for 12 hours until it reaches perfect tenderness.',
              handle: 'smoked-beef-brisket',
              is_giftcard: false,
              status: 'published',
              thumbnail: '/api/placeholder/400/400',
              images: [{ id: '1', url: '/api/placeholder/400/400', alt_text: 'Smoked Beef Brisket' }],
              variants: [{
                id: 'var-brisket-1',
                title: 'Half Pound',
                sku: 'BRISKET-HALF',
                price_cents: 1899,
                inventory_quantity: 10,
                allow_backorder: false,
                manage_inventory: true,
              }],
              categories: [{ id: 'cat-beef', name: 'BBQ Meats', handle: 'bbq-meats' }],
              collections: [{ id: 'col-mains', title: 'Main Dishes', handle: 'main-dishes' }],
              tags: [{ id: 'tag-1', value: 'signature' }, { id: 'tag-2', value: 'smoked' }],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'demo-pork',
              title: 'Pulled Pork',
              subtitle: 'Customer Favorite',
              description: 'Tender pulled pork shoulder smoked low and slow until it falls apart.',
              handle: 'pulled-pork',
              is_giftcard: false,
              status: 'published',
              thumbnail: '/api/placeholder/400/400',
              images: [{ id: '2', url: '/api/placeholder/400/400', alt_text: 'Pulled Pork' }],
              variants: [{
                id: 'var-pork-1',
                title: 'Half Pound',
                sku: 'PORK-HALF',
                price_cents: 1599,
                inventory_quantity: 8,
                allow_backorder: false,
                manage_inventory: true,
              }],
              categories: [{ id: 'cat-pork', name: 'BBQ Meats', handle: 'bbq-meats' }],
              collections: [{ id: 'col-mains', title: 'Main Dishes', handle: 'main-dishes' }],
              tags: [{ id: 'tag-3', value: 'popular' }],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'demo-sauce',
              title: 'Troy BBQ Sauce',
              subtitle: 'Original Recipe',
              description: 'Our signature BBQ sauce - tangy, sweet, and smoky.',
              handle: 'troy-bbq-sauce',
              is_giftcard: false,
              status: 'published',
              thumbnail: '/api/placeholder/400/400',
              images: [{ id: '3', url: '/api/placeholder/400/400', alt_text: 'Troy BBQ Sauce' }],
              variants: [{
                id: 'var-sauce-1',
                title: '16oz Bottle',
                sku: 'SAUCE-16OZ',
                price_cents: 899,
                inventory_quantity: 25,
                allow_backorder: true,
                manage_inventory: true,
              }],
              categories: [{ id: 'cat-sauce', name: 'Sauces & Rubs', handle: 'sauces-rubs' }],
              collections: [{ id: 'col-retail', title: 'Retail Items', handle: 'retail-items' }],
              tags: [{ id: 'tag-4', value: 'signature' }, { id: 'tag-5', value: 'retail' }],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ],
          total_count: 3,
          has_more: false,
          filters
        };
      } else {
        throw error;
      }
    }

    // Transform database products to MedusaJS-compatible format
    const transformedProducts = result.products.map(product => ({
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      handle: product.handle,
      is_giftcard: product.is_giftcard,
      status: product.status,
      thumbnail: product.thumbnail,
      images: product.images.map(img => ({
        id: img.id,
        url: img.url,
        alt_text: img.alt_text
      })),
      variants: product.variants.map(variant => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        prices: [{
          id: `price_${variant.id}`,
          amount: variant.price_cents,
          currency_code: 'usd'
        }],
        inventory_quantity: variant.inventory_quantity,
        allow_backorder: variant.allow_backorder,
        manage_inventory: variant.manage_inventory
      })),
      categories: product.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        handle: cat.handle
      })),
      collection: product.collections.length > 0 ? {
        id: product.collections[0].id,
        title: product.collections[0].title,
        handle: product.collections[0].handle
      } : undefined,
      tags: product.tags.map(tag => ({
        id: tag.id,
        value: tag.value
      })),
      created_at: product.created_at,
      updated_at: product.updated_at
    }));

    const responseData = {
      products: transformedProducts,
      count: transformedProducts.length,
      offset: filters.offset,
      limit: filters.limit,
      total_count: result.total_count,
      has_more: result.has_more
    };

    const responseJson = JSON.stringify(responseData);
    const etag = generateETag(responseJson);

    return new Response(responseJson, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // Cache for 5 minutes
        'ETag': etag,
        'Vary': 'Accept-Encoding, X-Publishable-Api-Key',
        ...getSecurityHeaders()
      }
    });

  } catch (error) {
    console.error('Error fetching store products:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch products',
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