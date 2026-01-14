import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { JWT_SECRET } from '@/lib/jwt-config';

// Protected routes that require authentication
const protectedRoutes = ['/admin'];

// Routes that should NOT require authentication
const authExemptRoutes = ['/login', '/forgot-password', '/reset-password'];

// Public routes that don't require authentication
const publicRoutes = ['/', '/about', '/events', '/contact', '/resources', '/api/contacts', '/api/newsletter', '/api/events'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth-exempt routes (login, forgot password, etc.)
  if (authExemptRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route) || pathname === route);

  // Allow public routes
  if (isPublicRoute && !isProtectedRoute) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  if (isProtectedRoute) {
    const token = request.cookies.get('session')?.value;

    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      
      // Check if token is expired
      if (verified.payload.expiresAt && new Date(verified.payload.expiresAt as string) < new Date()) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        url.searchParams.set('expired', 'true');
        
        const response = NextResponse.redirect(url);
        response.cookies.delete('session');
        return response;
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Token verification failed:', error);
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      
      const response = NextResponse.redirect(url);
      response.cookies.delete('session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|uploads).*)',
  ],
};
