import type { APIRoute } from 'astro';
import { db } from '../../../lib/database';
import { adminSettingsSchema } from '../../../lib/schemas';

export const GET: APIRoute = async () => {
  try {
    const settings = await db.getAdminSettings();
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: settings 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to fetch admin settings' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validate the request body against our schema
    const validationResult = adminSettingsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid settings data',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Update settings in database
    await db.updateAdminSettings(validationResult.data);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Settings updated successfully' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to update admin settings' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};