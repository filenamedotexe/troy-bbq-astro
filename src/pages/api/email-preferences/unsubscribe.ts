import type { APIRoute } from 'astro';
import { emailPreferencesService, EmailPreferenceCategory } from '../../../lib/email/email-preferences';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { token, email, category } = body;

    if (!token && !email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token or email is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (token && !category) {
      // Unsubscribe from all emails using token
      const success = await emailPreferencesService.unsubscribeAll(token);
      
      if (!success) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid token or user not found'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Successfully unsubscribed from all emails'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (email && category) {
      // Unsubscribe from specific category
      await emailPreferencesService.unsubscribeFromCategory(email, category as EmailPreferenceCategory);
      
      return new Response(JSON.stringify({
        success: true,
        message: `Successfully unsubscribed from ${category} emails`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request parameters'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Also support GET for direct unsubscribe links
export const GET: APIRoute = async ({ url }) => {
  try {
    const token = url.searchParams.get('token');
    
    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const success = await emailPreferencesService.unsubscribeAll(token);
    
    if (!success) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Unsubscribe Failed</title></head>
        <body>
          <h1>Unsubscribe Failed</h1>
          <p>The unsubscribe link appears to be invalid or expired.</p>
          <p>Please contact support@troybbq.com for assistance.</p>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Successfully Unsubscribed</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .success { color: #28a745; }
          .container { text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="success">✅ Successfully Unsubscribed</h1>
          <p>You have been successfully unsubscribed from all Troy BBQ emails.</p>
          <p>You will no longer receive marketing emails, newsletters, or promotional content.</p>
          <p><strong>Note:</strong> You may still receive essential transactional emails related to your orders and catering events.</p>
          <hr>
          <p>If you change your mind, you can <a href="/email-preferences?token=${token}">manage your email preferences</a> anytime.</p>
          <p>Thank you for being part of the Troy BBQ family!</p>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Unsubscribe Error</title></head>
      <body>
        <h1>Error</h1>
        <p>An error occurred while processing your unsubscribe request.</p>
        <p>Please contact support@troybbq.com for assistance.</p>
      </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
};