import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { logProductionAuthEnvironment } from '@/lib/production-auth-debug'

// Types
export interface User {
  id: string
  email: string
  name: string | null
  image?: string | null
}

export interface SessionPayload {
  userId: string
  email: string
  name: string | null
  image?: string | null
  iat?: number
  exp?: number
}

// ENHANCED: Production-safe JWT configuration
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
  
  // CRITICAL: Fail fast in production if no secret is provided
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('JWT_SECRET or NEXTAUTH_SECRET must be set in production environment')
  }
  
  // CRITICAL: Ensure secret is long enough for production
  if (process.env.NODE_ENV === 'production' && secret && secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long in production')
  }
  
  // Development fallback (only in development)
  const finalSecret = secret || 'dev-secret-key-change-in-production-at-least-32-chars-long'
  
  return new TextEncoder().encode(finalSecret)
}

// Configuration
const JWT_SECRET = getJWTSecret()
const JWT_ALGORITHM = 'HS256'
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
const COOKIE_NAME = 'auth-token'

// ENHANCED: Production logging for JWT configuration
if (process.env.NODE_ENV === 'production') {
  console.log('PRODUCTION JWT Configuration:', {
    JWT_SECRET_configured: !!process.env.JWT_SECRET,
    NEXTAUTH_SECRET_configured: !!process.env.NEXTAUTH_SECRET,
    secret_length: (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET)?.length || 0,
    cookie_name: COOKIE_NAME,
    session_duration_days: SESSION_DURATION / (24 * 60 * 60 * 1000)
  })

  // PRODUCTION: Run comprehensive environment check
  logProductionAuthEnvironment()
} else {
  console.log('DEV JWT Configuration:', {
    JWT_SECRET_configured: !!process.env.JWT_SECRET,
    NEXTAUTH_SECRET_configured: !!process.env.NEXTAUTH_SECRET,
    using_fallback: !process.env.JWT_SECRET && !process.env.NEXTAUTH_SECRET
  })
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWT utilities
export async function createJWT(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = Math.floor((Date.now() + SESSION_DURATION) / 1000)

  try {
    const token = await new SignJWT({ ...payload, iat, exp })
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .sign(JWT_SECRET)
      
    // PRODUCTION: Log token creation (without exposing the token)
    if (process.env.NODE_ENV === 'production') {
      console.log('PRODUCTION: JWT token created successfully:', {
        userId: payload.userId,
        email: payload.email,
        iat,
        exp,
        tokenLength: token.length
      })
    }
    
    return token
  } catch (error) {
    console.error('JWT creation failed:', {
      error: error instanceof Error ? error.message : error,
      userId: payload.userId,
      email: payload.email,
      hasSecret: !!JWT_SECRET,
      secretLength: JWT_SECRET.length,
      nodeEnv: process.env.NODE_ENV
    })
    throw error
  }
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    })

    // Validate payload structure
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      (typeof payload.name === 'string' || payload.name === null) &&
      typeof payload.iat === 'number' &&
      typeof payload.exp === 'number'
    ) {
      // PRODUCTION: Log successful verification (without exposing sensitive data)
      if (process.env.NODE_ENV === 'production') {
        console.log('PRODUCTION: JWT verification successful:', {
          userId: payload.userId,
          email: payload.email,
          exp: payload.exp,
          isExpired: payload.exp < Math.floor(Date.now() / 1000)
        })
      }
      
      return payload as unknown as SessionPayload
    }

    console.error('JWT payload validation failed - invalid structure:', {
      hasUserId: typeof payload.userId === 'string',
      hasEmail: typeof payload.email === 'string',
      hasName: typeof payload.name === 'string' || payload.name === null,
      hasIat: typeof payload.iat === 'number',
      hasExp: typeof payload.exp === 'number',
      nodeEnv: process.env.NODE_ENV
    })
    return null
  } catch (error) {
    // ENHANCED: Production-specific error logging
    if (process.env.NODE_ENV === 'production') {
      console.error('PRODUCTION: JWT verification failed:', {
        error: error instanceof Error ? error.message : error,
        tokenLength: token?.length || 0,
        hasSecret: !!JWT_SECRET,
        secretLength: JWT_SECRET.length,
        nodeEnv: process.env.NODE_ENV,
        // Don't log the actual token in production
        tokenPrefix: token?.substring(0, 20) + '...'
      })
    } else {
      console.error('DEV: JWT verification failed:', {
        error: error instanceof Error ? error.message : error,
        tokenLength: token?.length || 0,
        hasSecret: !!JWT_SECRET,
        nodeEnv: process.env.NODE_ENV
      })
    }
    return null
  }
}

// Session management
export async function createSession(user: User): Promise<string> {
  const sessionPayload: Omit<SessionPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  }
  
  return createJWT(sessionPayload)
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    
    if (!token) {
      return null
    }
    
    return verifyJWT(token)
  } catch (error) {
    // PRODUCTION: Enhanced error logging for session retrieval
    if (process.env.NODE_ENV === 'production') {
      console.error('PRODUCTION: Session retrieval failed:', {
        error: error instanceof Error ? error.message : error,
        cookieName: COOKIE_NAME,
        nodeEnv: process.env.NODE_ENV
      })
    } else {
      console.error('DEV: Session retrieval failed:', error)
    }
    return null
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    
    if (!token) {
      return null
    }
    
    return verifyJWT(token)
  } catch (error) {
    // PRODUCTION: Enhanced error logging for request session retrieval
    if (process.env.NODE_ENV === 'production') {
      console.error('PRODUCTION: Request session retrieval failed:', {
        error: error instanceof Error ? error.message : error,
        cookieName: COOKIE_NAME,
        hasToken: !!request.cookies.get(COOKIE_NAME)?.value,
        tokenLength: request.cookies.get(COOKIE_NAME)?.value?.length || 0,
        nodeEnv: process.env.NODE_ENV
      })
    } else {
      console.error('DEV: Request session retrieval failed:', error)
    }
    return null
  }
}

// Cookie utilities
export function getSessionCookie(token: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  const isSecureContext = isProduction || process.env.FORCE_HTTPS === 'true'

  // VERCEL FIX: Detect if we're on Vercel deployment
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL

  const cookie = {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isSecureContext, // ENHANCED: More flexible secure detection
    sameSite: isVercel ? 'none' as const : 'lax' as const, // VERCEL FIX: Use 'none' for Vercel deployments
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
    // VERCEL FIX: Don't set domain for Vercel deployments (let browser handle it)
    ...(isProduction && !isVercel && process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
  }

  // ENHANCED: Production-specific logging
  if (isProduction) {
    console.log('PRODUCTION: Creating session cookie config:', {
      name: cookie.name,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      domain: cookie.domain || 'not set',
      maxAge: cookie.maxAge,
      isProduction,
      isVercel,
      forceHttps: process.env.FORCE_HTTPS,
      vercelUrl: process.env.VERCEL_URL,
      tokenLength: token.length
    })
  }

  return cookie
}

export function getExpiredSessionCookie() {
  const isProduction = process.env.NODE_ENV === 'production'
  const isSecureContext = isProduction || process.env.FORCE_HTTPS === 'true'

  // VERCEL FIX: Detect if we're on Vercel deployment
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL

  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isSecureContext, // ENHANCED: Consistent secure detection
    sameSite: isVercel ? 'none' as const : 'lax' as const, // VERCEL FIX: Use 'none' for Vercel deployments
    maxAge: 0,
    path: '/',
    // VERCEL FIX: Don't set domain for Vercel deployments (let browser handle it)
    ...(isProduction && !isVercel && process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
  }
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' }
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters long' }
  }
  
  return { isValid: true }
}

export function validateName(name: string): { isValid: boolean; message?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: 'Name is required' }
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' }
  }
  
  if (name.length > 100) {
    return { isValid: false, message: 'Name must be less than 100 characters long' }
  }
  
  return { isValid: true }
}

// Error types
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export class ValidationError extends AuthError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}
