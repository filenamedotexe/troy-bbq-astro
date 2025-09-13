import type { APIRoute } from 'astro';
import { notificationAutomationService } from '../../../lib/email/notification-automation';

export const POST: APIRoute = async ({ request }) => {
  try {
    // This endpoint processes pending scheduled notifications
    // Should be called by a cron job or scheduled task
    
    // Simple authentication check (you should use proper auth)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_AUTH_TOKEN || 'your-secret-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await notificationAutomationService.processPendingNotifications();

    return new Response(JSON.stringify({
      success: true,
      message: 'Scheduled notifications processed'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Process scheduled notifications error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ request }) => {
  // For testing purposes, allow GET requests to process notifications
  return POST({ request } as any);
};