import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { isProtectedRoute, isAuthRoute, isPublicRoute } from '@/lib/session'

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Allow public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next()
    }

    // Get session from request
    const session = await getSessionFromRequest(request)

    // Handle protected routes
    if (isProtectedRoute(pathname)) {
      if (!session) {
        const signInUrl = new URL('/auth/signin', request.url)
        signInUrl.searchParams.set('callbackUrl', request.url)
        return NextResponse.redirect(signInUrl)
      }

      // Check if session is expired
      if (session.exp && session.exp < Math.floor(Date.now() / 1000)) {
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
        // User is already authenticated, redirect to dashboard or callback
        const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard'
        return NextResponse.redirect(new URL(callbackUrl, request.url))
      }

      // User is not authenticated, allow access to auth pages
      return NextResponse.next()
    }

    // For all other routes, allow access
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to continue to avoid breaking the app
    return NextResponse.next()
  }
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
