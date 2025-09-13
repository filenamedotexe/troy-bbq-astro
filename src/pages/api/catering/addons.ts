import type { APIRoute } from 'astro';
import { db } from '../../../lib/database';
import { cateringAddonSchema } from '../../../lib/schemas';
import { z } from 'zod';

// Schema for creating a new addon (without id and createdAt)
const createAddonSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  priceCents: z.number().int().min(0),
  isActive: z.boolean().optional().default(true),
  category: z.string().max(100).optional(),
});

// Schema for updating an addon
const updateAddonSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  priceCents: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  category: z.string().max(100).optional(),
});

// GET /api/catering/addons - Fetch add-ons with optional filtering
export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const activeOnly = searchParams.get('active') !== 'false'; // default to true
    const category = searchParams.get('category');
    const id = searchParams.get('id');

    // If specific ID is requested, fetch single addon
    if (id) {
      const addons = await db.getCateringAddons(false); // Get all to find specific ID
      const addon = addons.find(a => a.id === id);
      
      if (!addon) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Add-on not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: addon
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Fetch add-ons with filtering
    let addons = await db.getCateringAddons(activeOnly);
    
    // Filter by category if provided
    if (category) {
      addons = addons.filter(addon => 
        addon.category?.toLowerCase() === category.toLowerCase()
      );
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: addons,
      filters: {
        activeOnly,
        category: category || null
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching catering add-ons:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch catering add-ons'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

// POST /api/catering/addons - Create a new add-on
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validate the request body against our schema
    const validationResult = createAddonSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid add-on data',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Create the add-on in database
    const addonId = await db.createCateringAddon(validationResult.data);
    
    return new Response(JSON.stringify({
      success: true,
      data: { id: addonId },
      message: 'Add-on created successfully'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating catering add-on:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create catering add-on'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

// PUT /api/catering/addons - Update an existing add-on
export const PUT: APIRoute = async ({ request, url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Add-on ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const body = await request.json();
    
    // Validate the request body against our schema
    const validationResult = updateAddonSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid add-on data',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Check if any fields are provided for update
    const updateData = validationResult.data;
    const hasUpdates = Object.keys(updateData).length > 0;
    
    if (!hasUpdates) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No update fields provided'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Check if add-on exists by attempting to fetch all and filter
    const allAddons = await db.getCateringAddons(false);
    const existingAddon = allAddons.find(addon => addon.id === id);
    
    if (!existingAddon) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Add-on not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Update add-on in database
    await db.updateCateringAddon(id, updateData);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Add-on updated successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating catering add-on:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update catering add-on'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

// DELETE /api/catering/addons - Delete an add-on
export const DELETE: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Add-on ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Check if add-on exists by attempting to fetch all and filter
    const allAddons = await db.getCateringAddons(false);
    const existingAddon = allAddons.find(addon => addon.id === id);
    
    if (!existingAddon) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Add-on not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Delete add-on from database
    await db.deleteCateringAddon(id);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Add-on deleted successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting catering add-on:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete catering add-on'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};