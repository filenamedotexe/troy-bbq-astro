import type { APIRoute } from 'astro';
import { validateAdminCredentials, createJWTToken, getSessionCookieHeader, getLogoutCookieHeader, checkRateLimit, getClientIP, getSecurityHeaders } from '../../../lib/auth';
import { createSecureRoute, validateInput, handleCORSPreflight } from '../../../lib/middleware';

export const POST: APIRoute = createSecureRoute(async ({ request }) => {
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
        headers: {
          'Content-Type': 'application/json',
          ...getSecurityHeaders()
        }
      }
    );
  }
}, {
  rateLimit: {
    requests: 10, // Strict rate limiting for auth endpoints
    windowMs: 15 * 60 * 1000 // 15 minutes
  }
});

async function handleLogin(request: Request) {
  // Additional rate limiting specifically for login attempts
  const clientIP = getClientIP(request);
  if (!checkRateLimit(`login_${clientIP}`, 5, 15 * 60 * 1000)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many login attempts. Please try again in 15 minutes.'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '900',
          ...getSecurityHeaders()
        }
      }
    );
  }

  const formData = await request.formData();
  const rawEmail = formData.get('email')?.toString();
  const rawPassword = formData.get('password')?.toString();

  if (!rawEmail || !rawPassword) {
    return new Response(
      JSON.stringify({ success: false, error: 'Email and password are required' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getSecurityHeaders()
        }
      }
    );
  }

  // Validate and sanitize input
  const sanitizedInput = validateInput({ email: rawEmail, password: rawPassword });
  const { email, password } = sanitizedInput;

  const isValid = await validateAdminCredentials(email, password);

  if (!isValid) {
    // Log failed login attempt
    console.warn(`Failed login attempt from IP: ${clientIP}, Email: ${email}`);

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid credentials' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...getSecurityHeaders()
        }
      }
    );
  }

  // Log successful login
  console.info(`Successful login for: ${email} from IP: ${clientIP}`);

  const jwtToken = createJWTToken(email);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Login successful',
      redirectUrl: '/admin/settings',
      token: jwtToken // Include token in response for API clients
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': getSessionCookieHeader(jwtToken),
        ...getSecurityHeaders()
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
        'Set-Cookie': getLogoutCookieHeader(),
        ...getSecurityHeaders()
      }
    }
  );
}

// Handle OPTIONS requests for CORS
export const OPTIONS: APIRoute = ({ request }) => {
  return handleCORSPreflight(request);
};

// Handle GET requests (for logout via GET)
export const GET: APIRoute = createSecureRoute(async ({ request }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'logout') {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin/login',
        'Set-Cookie': getLogoutCookieHeader(),
        ...getSecurityHeaders()
      }
    });
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...getSecurityHeaders()
      }
    }
  );
}, {
  rateLimit: {
    requests: 20,
    windowMs: 15 * 60 * 1000
  }
});