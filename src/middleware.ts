import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { isProtectedRoute, isAuthRoute, isPublicRoute } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProduction = process.env.NODE_ENV === 'production'

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Get session from request
  const session = await getSessionFromRequest(request)
  const hasAuthToken = !!request.cookies.get('auth-token')?.value

  if (isProduction) {
    console.log('Middleware check:', {
      pathname,
      hasAuthToken,
      hasSession: !!session,
      userAgent: request.headers.get('user-agent')?.substring(0, 50)
    })
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!session) {
      if (isProduction) {
        console.log('Redirecting to signin - no session for protected route:', pathname)
      }
      // Redirect to signin with callback URL
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }

    // User is authenticated, allow access
    return NextResponse.next()
  }

  // Handle auth routes (signin, signup)
  if (isAuthRoute(pathname)) {
    if (session) {
      // User is already authenticated, redirect to dashboard
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard'
      if (isProduction) {
        console.log('Redirecting authenticated user to dashboard:', callbackUrl)
      }
      return NextResponse.redirect(new URL(callbackUrl, request.url))
    }

    // User is not authenticated, allow access to auth pages
    return NextResponse.next()
  }

  // For all other routes, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
