import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Only allow in production for debugging
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ error: 'Debug endpoint only available in production' }, { status: 403 })
  }

  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_URL
  const cookieHeader = request.headers.get('cookie')
  const authToken = cookieHeader?.split(';').find(c => c.trim().startsWith('auth-token='))

  const debugInfo = {
    // Environment
    nodeEnv: process.env.NODE_ENV,
    isVercel,
    vercelUrl: process.env.VERCEL_URL,
    vercelEnv: process.env.VERCEL_ENV,
    
    // Authentication
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    
    // Cookie configuration
    cookieDomain: process.env.COOKIE_DOMAIN || 'not set',
    forceHttps: process.env.FORCE_HTTPS || 'not set',
    
    // Request headers
    host: request.headers.get('host'),
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent')?.substring(0, 100),
    xForwardedFor: request.headers.get('x-forwarded-for'),
    xForwardedProto: request.headers.get('x-forwarded-proto'),
    
    // Cookies
    hasCookieHeader: !!cookieHeader,
    cookieHeaderLength: cookieHeader?.length || 0,
    hasAuthToken: !!authToken,
    authTokenLength: authToken?.split('=')[1]?.length || 0,
    allCookies: cookieHeader?.split(';').map(c => c.trim().split('=')[0]) || [],
    
    // Timestamp
    timestamp: new Date().toISOString()
  }

  console.log('VERCEL DEBUG: Authentication debug info requested:', debugInfo)

  return NextResponse.json(debugInfo)
}
