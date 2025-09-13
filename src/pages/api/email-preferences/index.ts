import type { APIRoute } from 'astro';
import { emailPreferencesService } from '../../../lib/email/email-preferences';

export const GET: APIRoute = async ({ url }) => {
  try {
    const token = url.searchParams.get('token');
    const email = url.searchParams.get('email');

    if (!token && !email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token or email is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let preferences;
    
    if (token) {
      preferences = await emailPreferencesService.getUserByToken(token);
    } else if (email) {
      preferences = await emailPreferencesService.getPreferences(email);
    }

    if (!preferences) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Preferences not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      preferences
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, preferences, token } = body;

    if (!email && !token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email or token is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let targetEmail = email;
    
    if (token && !email) {
      const user = await emailPreferencesService.getUserByToken(token);
      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid token'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      targetEmail = user.email;
    }

    const updatedPreferences = await emailPreferencesService.setPreferences(targetEmail, preferences);

    return new Response(JSON.stringify({
      success: true,
      preferences: updatedPreferences
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};