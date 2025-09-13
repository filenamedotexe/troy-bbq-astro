import type { APIRoute } from 'astro';
import { verifyEmailConfiguration, initializeEmailSystem } from '../../../lib/email/email-integration';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Simple authentication check for admin access
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_AUTH_TOKEN || 'admin-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - Admin access required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize the email system
    try {
      await initializeEmailSystem();
    } catch (error) {
      console.error('Email system initialization failed:', error);
    }

    // Run verification checks
    const verification = await verifyEmailConfiguration();

    // Additional environment checks
    const envChecks = {
      resend_api_key: !!process.env.RESEND_API_KEY,
      from_email: !!process.env.FROM_EMAIL,
      domain: !!process.env.DOMAIN,
      database_url: !!process.env.DATABASE_URL,
      admin_emails: !!process.env.ADMIN_EMAILS,
      cron_token: !!process.env.CRON_AUTH_TOKEN
    };

    const allEnvPresent = Object.values(envChecks).every(check => check);

    // System status
    const systemStatus = {
      email_system: verification,
      environment: {
        variables: envChecks,
        all_present: allEnvPresent
      },
      recommendations: []
    };

    // Generate recommendations
    if (!verification.resend) {
      systemStatus.recommendations.push('Set RESEND_API_KEY in environment variables');
    }
    if (!verification.domain) {
      systemStatus.recommendations.push('Verify domain in Resend dashboard and configure DNS records');
    }
    if (!verification.database) {
      systemStatus.recommendations.push('Check database connection and ensure tables are created');
    }
    if (!envChecks.admin_emails) {
      systemStatus.recommendations.push('Set ADMIN_EMAILS for admin notifications');
    }
    if (!envChecks.cron_token) {
      systemStatus.recommendations.push('Set CRON_AUTH_TOKEN for scheduled notification processing');
    }

    // Overall health assessment
    const overallHealth = verification.status === 'healthy' && allEnvPresent ? 'healthy' : 
                         verification.status === 'warning' || !allEnvPresent ? 'warning' : 'error';

    return new Response(JSON.stringify({
      success: true,
      overall_status: overallHealth,
      system_status: systemStatus,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Email system verification failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // This endpoint can send a test email
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_AUTH_TOKEN || 'admin-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { test_email } = body;

    if (!test_email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'test_email is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send a test welcome email
    const { sendWelcomeEmail } = await import('../../../lib/email/email-integration');
    
    await sendWelcomeEmail({
      customerEmail: test_email,
      customerName: 'Test User'
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Test email sent to ${test_email}`,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test email failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};