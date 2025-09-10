import { NextRequest, NextResponse } from 'next/server'
import { getSession, getSessionFromRequest, getExpiredSessionCookie, SessionPayload } from './auth'

// Server-side session utilities
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()
  
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

// Response utilities for setting/clearing session cookies
export function setSessionCookie(response: NextResponse, token: string): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production'
  const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds (matching auth.ts)
  
  const cookie = {
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION / 1000, // Convert to seconds (matching auth.ts calculation)
    path: '/',
    // Add domain for production if needed
    ...(isProduction && process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
  }

  // Enhanced logging for debugging cookie issues
  console.log('Setting session cookie in response:', {
    name: cookie.name,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    domain: cookie.domain || 'not set',
    maxAge: cookie.maxAge,
    tokenLength: token.length,
    isProduction
  })

  response.cookies.set(cookie)

  // Also set a backup header for debugging
  response.headers.set('X-Auth-Cookie-Set', 'true')

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
