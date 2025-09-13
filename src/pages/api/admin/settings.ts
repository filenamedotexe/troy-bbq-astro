import type { APIRoute } from 'astro';
import { db } from '../../../lib/database';
import { adminSettingsSchema } from '../../../lib/schemas';
import { createAdminRoute, validateInput, handleCORSPreflight } from '../../../lib/middleware';
import { getSecurityHeaders } from '../../../lib/auth';

export const GET: APIRoute = createAdminRoute(async () => {
  try {
    const settings = await db.getAdminSettings();

    return new Response(JSON.stringify({
      success: true,
      data: settings
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        ...getSecurityHeaders()
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
        ...getSecurityHeaders()
      },
    });
  }
});

export const POST: APIRoute = createAdminRoute(async ({ request }) => {
  try {
    const body = await request.json();

    // Sanitize input data
    const sanitizedBody = validateInput(body);

    // Validate the request body against our schema
    const validationResult = adminSettingsSchema.safeParse(sanitizedBody);

    if (!validationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid settings data',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getSecurityHeaders()
        },
      });
    }

    // Update settings in database
    await db.updateAdminSettings(validationResult.data);

    // Log admin action
    console.info('Admin settings updated successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Settings updated successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getSecurityHeaders()
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
        ...getSecurityHeaders()
      },
    });
  }
});

// Handle OPTIONS requests for CORS
export const OPTIONS: APIRoute = ({ request }) => {
  return handleCORSPreflight(request);
};