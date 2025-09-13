import type { APIRoute } from 'astro';
import { validateAdminCredentials, createSessionToken, getSessionCookieHeader, getLogoutCookieHeader } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'login') {
      return await handleLogin(request);
    } else if (action === 'logout') {
      return await handleLogout();
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

async function handleLogin(request: Request) {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return new Response(
      JSON.stringify({ success: false, error: 'Email and password are required' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const isValid = await validateAdminCredentials(email, password);

  if (!isValid) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid credentials' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const sessionToken = createSessionToken(email);
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Login successful',
      redirectUrl: '/admin/settings'
    }),
    { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': getSessionCookieHeader(sessionToken)
      }
    }
  );
}

async function handleLogout() {
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Logout successful',
      redirectUrl: '/admin/login'
    }),
    { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': getLogoutCookieHeader()
      }
    }
  );
}

// Handle GET requests (for logout via GET)
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'logout') {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin/login',
        'Set-Cookie': getLogoutCookieHeader()
      }
    });
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};