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

  // Get session from request with enhanced debugging
  const session = await getSessionFromRequest(request)
  const hasAuthToken = !!request.cookies.get('auth-token')?.value
  const authTokenValue = request.cookies.get('auth-token')?.value

  // Enhanced logging for debugging authentication issues
  const logData = {
    pathname,
    hasAuthToken,
    tokenLength: authTokenValue?.length || 0,
    hasSession: !!session,
    sessionUserId: session?.userId || 'none',
    userAgent: request.headers.get('user-agent')?.substring(0, 50),
    timestamp: new Date().toISOString(),
    isProduction,
    // NEW: Add more debugging info
    referer: request.headers.get('referer'),
    host: request.headers.get('host'),
    origin: request.headers.get('origin')
  }

  // Always log in development, limited logging in production
  if (!isProduction || !session) {
    console.log('Middleware authentication check:', logData)
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!session) {
      console.log('Redirecting to signin - no session for protected route:', {
        pathname,
        hasAuthToken,
        tokenLength: authTokenValue?.length || 0,
        reason: hasAuthToken ? 'Token present but session invalid' : 'No auth token',
        referer: request.headers.get('referer')
      })

      // Redirect to signin with callback URL
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }

    // ENHANCED: Additional session validation
    if (session.exp && session.exp < Math.floor(Date.now() / 1000)) {
      console.log('Redirecting to signin - session expired:', {
        pathname,
        userId: session.userId,
        exp: session.exp,
        now: Math.floor(Date.now() / 1000)
      })

      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }

    console.log('Allowing access to protected route:', {
      pathname,
      userId: session.userId,
      userEmail: session.email
    })

    // User is authenticated, allow access
    return NextResponse.next()
  }

  // Handle auth routes (signin, signup)
  if (isAuthRoute(pathname)) {
    if (session) {
      // User is already authenticated, redirect to dashboard or callback
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard'
      console.log('Redirecting authenticated user from auth page:', {
        pathname,
        userId: session.userId,
        redirectTo: callbackUrl
      })
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
