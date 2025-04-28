
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Mock function to get user role - replace with actual authentication logic
async function getUserRole(request: NextRequest): Promise<'admin' | 'member' | null> {
  // In a real app, you'd verify a session token or similar
  // For this example, we'll use a simple cookie
  const roleCookie = request.cookies.get('userRole');
  const role = roleCookie?.value;

  if (role === 'admin' || role === 'member') {
    return role;
  }
  return null; // No valid role found or not logged in
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userRole = await getUserRole(request);
  console.log(`Middleware processing path: ${pathname}, User role: ${userRole}`); // Added for debugging

  // Prevent infinite redirects for auth pages
  if (pathname.startsWith('/auth')) {
    // If logged in and trying to access auth, redirect to dashboard
    if (userRole) {
      const redirectUrl = userRole === 'admin' ? '/admin' : '/member';
      console.log(`Redirecting logged-in user from auth page to: ${redirectUrl}`);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    console.log("Allowing access to auth page for non-logged-in user.");
    return NextResponse.next();
  }

  // If not logged in, redirect to login page (except for auth pages)
  if (!userRole) {
    console.log("User not logged in, redirecting to /auth/login");
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If logged in, redirect based on role if accessing wrong dashboard or root
  if (userRole === 'admin') {
    if (pathname.startsWith('/member') || pathname === '/') {
       console.log("Admin accessing member page or root, redirecting to /admin");
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  } else if (userRole === 'member') {
    if (pathname.startsWith('/admin') || pathname === '/') {
       console.log("Member accessing admin page or root, redirecting to /member");
       return NextResponse.redirect(new URL('/member', request.url));
    }
  }

  console.log("Allowing request to proceed.");
  return NextResponse.next();
}

// Define paths for which the middleware should run
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
