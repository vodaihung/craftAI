import { NextRequest, NextResponse } from 'next/server'
import { getSession, getSessionFromRequest, getExpiredSessionCookie, SessionPayload } from './auth'

// Server-side session utilities
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()

  // PRODUCTION: Enhanced debugging for authentication failures
  if (!session && process.env.NODE_ENV === 'production') {
    console.log('PRODUCTION: Authentication failed - no session found:', {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      cookieName: 'auth-token'
    })
  }

  if (!session) {
    throw new Error('Authentication required')
  }

  return session
}

export async function requireAuthFromRequest(request: NextRequest): Promise<SessionPayload> {
  const session = await getSessionFromRequest(request)
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session
}

// ENHANCED: Production-aware cookie configuration
export function setSessionCookie(response: NextResponse, token: string): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production'
  const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds (matching auth.ts)

  // VERCEL PRODUCTION FIX: Enhanced secure context detection
  const isSecureContext = isProduction || process.env.FORCE_HTTPS === 'true'

  // VERCEL FIX: Detect if we're on Vercel deployment
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL

  const cookie = {
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: isSecureContext, // PRODUCTION FIX: Match auth.ts secure detection
    sameSite: isVercel ? 'none' as const : 'lax' as const, // VERCEL FIX: Use 'none' for Vercel deployments
    maxAge: SESSION_DURATION / 1000, // Convert to seconds (matching auth.ts calculation)
    path: '/',
    // VERCEL FIX: Don't set domain for Vercel deployments (let browser handle it)
    ...(isProduction && !isVercel && process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
  }

  // ENHANCED: Production-specific logging
  if (isProduction) {
    console.log('PRODUCTION: Setting session cookie:', {
      name: cookie.name,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      domain: cookie.domain || 'not set',
      maxAge: cookie.maxAge,
      tokenLength: token.length,
      isProduction,
      isSecureContext,
      isVercel,
      // PRODUCTION DEBUG INFO
      forceHttps: process.env.FORCE_HTTPS,
      cookieDomain: process.env.COOKIE_DOMAIN,
      vercelUrl: process.env.VERCEL_URL,
      nodeEnv: process.env.NODE_ENV,
      // PRODUCTION: Additional debugging for cookie issues
      userAgent: 'server-side',
      timestamp: new Date().toISOString()
    })
  } else {
    console.log('DEV: Setting session cookie:', {
      name: cookie.name,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      domain: cookie.domain || 'not set',
      maxAge: cookie.maxAge,
      tokenLength: token.length
    })
  }

  // Set the cookie with enhanced error handling
  try {
    response.cookies.set(cookie)

    // PRODUCTION: Verify cookie was set and add fallback
    if (isProduction) {
      const setCookieHeader = response.headers.get('set-cookie')
      if (!setCookieHeader || !setCookieHeader.includes('auth-token')) {
        console.error('PRODUCTION: Cookie may not have been set properly, trying fallback:', {
          hasCookieHeader: !!setCookieHeader,
          cookieHeaderContent: setCookieHeader?.substring(0, 100)
        })

        // PRODUCTION FIX: Manual cookie header setting as fallback
        const fallbackCookieString = `${cookie.name}=${cookie.value}; Path=${cookie.path}; Max-Age=${cookie.maxAge}; HttpOnly; SameSite=${cookie.sameSite}${cookie.secure ? '; Secure' : ''}${cookie.domain ? `; Domain=${cookie.domain}` : ''}`
        response.headers.set('Set-Cookie', fallbackCookieString)
        console.log('PRODUCTION: Fallback cookie header set')
      } else {
        console.log('PRODUCTION: Cookie header set successfully')
      }
    }
  } catch (cookieError) {
    console.error('Error setting session cookie:', cookieError)
    throw cookieError
  }

  // ENHANCED: Production debugging headers
  response.headers.set('X-Auth-Cookie-Set', 'true')
  response.headers.set('X-Auth-Secure', cookie.secure.toString())
  response.headers.set('X-Auth-Domain', cookie.domain || 'none')
  response.headers.set('X-Auth-SameSite', cookie.sameSite)

  // PRODUCTION: Add cache control headers to prevent caching of auth responses
  if (isProduction) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  const expiredCookie = getExpiredSessionCookie()
  response.cookies.set(expiredCookie)
  return response
}

// Middleware utilities
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/create',
    '/api/forms',
    '/api/ai',
  ]
  
  return protectedRoutes.some(route => pathname.startsWith(route))
}

export function isAuthRoute(pathname: string): boolean {
  const authRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    '/api/auth',
  ]
  
  return authRoutes.some(route => pathname.startsWith(route))
}

export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/_next',
    '/favicon.ico',
    '/api/health',
    // PRODUCTION: Add common production health check routes
    '/health',
    '/api/status',
    '/status'
  ]
  
  return publicRoutes.some(route => pathname.startsWith(route))
}

// Session validation utilities
export function isSessionExpired(session: SessionPayload): boolean {
  if (!session.exp) {
    return true
  }
  
  const now = Math.floor(Date.now() / 1000)
  return session.exp < now
}

export function isSessionExpiringSoon(session: SessionPayload, thresholdMinutes: number = 60): boolean {
  if (!session.exp) {
    return true
  }
  
  const now = Math.floor(Date.now() / 1000)
  const threshold = thresholdMinutes * 60 // Convert to seconds
  return session.exp - now < threshold
}

// Client-side session utilities (for use in React components)
export interface ClientSession {
  user: {
    id: string
    email: string
    name: string
    image?: string | null
  } | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

export function createClientSession(session: SessionPayload | null): ClientSession {
  if (!session) {
    return {
      user: null,
      status: 'unauthenticated'
    }
  }
  
  return {
    user: {
      id: session.userId,
      email: session.email,
      name: session.name || '',
      image: session.image,
    },
    status: 'authenticated'
  }
}

// Error response utilities
export function createUnauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  )
}

export function createForbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  )
}

export function createValidationErrorResponse(message: string): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 400 }
  )
}

// Session refresh utilities
export async function shouldRefreshSession(session: SessionPayload): Promise<boolean> {
  // Refresh if session expires in less than 7 days
  return isSessionExpiringSoon(session, 7 * 24 * 60) // 7 days in minutes
}

export function createSessionResponse(session: SessionPayload): NextResponse {
  const clientSession = createClientSession(session)
  return NextResponse.json({
    success: true,
    session: clientSession
  })
}
