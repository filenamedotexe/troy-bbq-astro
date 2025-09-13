import type { APIRoute } from 'astro';
import { db } from '../../../../lib/database';

// GET /api/store/products/:id - Get single product for customer store
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        error: 'Product ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const product = await db.getProduct(id);

    if (!product) {
      return new Response(JSON.stringify({
        error: 'Product not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Only return published products in store API
    if (product.status !== 'published') {
      return new Response(JSON.stringify({
        error: 'Product not available'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Transform to MedusaJS-compatible format
    const transformedProduct = {
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
    };

    return new Response(JSON.stringify({
      product: transformedProduct
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Error fetching store product:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch product',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};