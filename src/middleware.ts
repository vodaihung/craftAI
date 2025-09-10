import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { isProtectedRoute, isAuthRoute, isPublicRoute } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProduction = process.env.NODE_ENV === 'production'

  // PRODUCTION: Validate environment on first request
  if (isProduction && !globalThis.__productionValidated) {
    try {
      const { logProductionValidation } = await import('@/lib/production-validation')
      logProductionValidation()
      globalThis.__productionValidated = true
    } catch (error) {
      console.error('Production validation import failed:', error)
    }
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Get session from request with enhanced debugging
  const session = await getSessionFromRequest(request)
  const hasAuthToken = !!request.cookies.get('auth-token')?.value
  const authTokenValue = request.cookies.get('auth-token')?.value

  // ENHANCED: Production-aware logging
  const logData = {
    pathname,
    hasAuthToken,
    tokenLength: authTokenValue?.length || 0,
    hasSession: !!session,
    sessionUserId: session?.userId || 'none',
    userAgent: request.headers.get('user-agent')?.substring(0, 50),
    timestamp: new Date().toISOString(),
    isProduction,
    // PRODUCTION: Additional debugging info
    referer: request.headers.get('referer'),
    host: request.headers.get('host'),
    origin: request.headers.get('origin'),
    httpsDetected: request.headers.get('x-forwarded-proto') === 'https' || 
                   request.headers.get('x-forwarded-ssl') === 'on' ||
                   request.url.startsWith('https://'),
    forwardedFor: request.headers.get('x-forwarded-for'),
    realIp: request.headers.get('x-real-ip')
  }

  // PRODUCTION: Conditional logging based on environment
  if (isProduction) {
    // Only log failures and important events in production
    if (!session && isProtectedRoute(pathname)) {
      console.log('PRODUCTION: Middleware auth failure:', logData)
    }
  } else {
    // Full logging in development
    console.log('DEV: Middleware authentication check:', logData)
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!session) {
      const failureReason = hasAuthToken ? 'Token present but session invalid' : 'No auth token'
      
      console.log(`${isProduction ? 'PRODUCTION' : 'DEV'}: Redirecting to signin - no session for protected route:`, {
        pathname,
        hasAuthToken,
        tokenLength: authTokenValue?.length || 0,
        reason: failureReason,
        referer: request.headers.get('referer'),
        httpsDetected: logData.httpsDetected
      })

      // Redirect to signin with callback URL
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }

    // ENHANCED: Additional session validation for production
    if (session.exp && session.exp < Math.floor(Date.now() / 1000)) {
      console.log(`${isProduction ? 'PRODUCTION' : 'DEV'}: Redirecting to signin - session expired:`, {
        pathname,
        userId: session.userId,
        exp: session.exp,
        now: Math.floor(Date.now() / 1000),
        expiredBy: Math.floor(Date.now() / 1000) - session.exp
      })

      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }

    // PRODUCTION: Success logging (minimal)
    if (isProduction) {
      console.log('PRODUCTION: Protected route access granted:', {
        pathname,
        userId: session.userId,
        userEmail: session.email?.substring(0, 3) + '***' // Partial email for privacy
      })
    } else {
      console.log('DEV: Allowing access to protected route:', {
        pathname,
        userId: session.userId,
        userEmail: session.email
      })
    }

    // User is authenticated, allow access
    return NextResponse.next()
  }

  // Handle auth routes (signin, signup)
  if (isAuthRoute(pathname)) {
    if (session) {
      // User is already authenticated, redirect to dashboard or callback
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard'
      
      console.log(`${isProduction ? 'PRODUCTION' : 'DEV'}: Redirecting authenticated user from auth page:`, {
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

// Global type declaration for production validation flag
declare global {
  var __productionValidated: boolean | undefined
}
