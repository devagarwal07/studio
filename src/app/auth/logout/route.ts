
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // In a real app, you would invalidate the session/token on the server-side.
  // Here, we just clear the cookie.

  const response = NextResponse.redirect(new URL('/auth/login', request.url), 302); // Redirect to login

  // Clear the userRole cookie
  response.cookies.set('userRole', '', { path: '/', maxAge: -1 }); // Set maxAge to -1 to delete

  return response;
}

// Allow GET requests for simpler testing/linking if needed, but POST is more standard for actions.
export async function GET(request: NextRequest) {
   return POST(request);
}

