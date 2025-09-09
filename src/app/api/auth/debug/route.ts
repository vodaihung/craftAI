import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// Debug endpoint to help troubleshoot authentication issues
// Only available in development or when DEBUG_AUTH is set
export async function GET(request: NextRequest) {
  // Security: Only allow in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.DEBUG_AUTH) {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 404 }
    )
  }

  try {
    const session = await getSession()
    const authToken = request.cookies.get('auth-token')?.value
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasJWT_SECRET: !!process.env.JWT_SECRET,
        hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        hasCOOKIE_DOMAIN: !!process.env.COOKIE_DOMAIN,
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'not set'
      },
      request: {
        hasAuthToken: !!authToken,
        authTokenLength: authToken?.length || 0,
        userAgent: request.headers.get('user-agent')?.substring(0, 100),
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer')
      },
      session: {
        hasSession: !!session,
        userId: session?.userId || null,
        email: session?.email || null,
        name: session?.name || null,
        iat: session?.iat || null,
        exp: session?.exp || null,
        isExpired: session?.exp ? session.exp < Math.floor(Date.now() / 1000) : null
      },
      cookies: {
        allCookies: Object.fromEntries(
          request.cookies.getAll().map(cookie => [cookie.name, {
            value: cookie.name === 'auth-token' ? `${cookie.value.substring(0, 20)}...` : cookie.value,
            length: cookie.value.length
          }])
        )
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          hasJWT_SECRET: !!process.env.JWT_SECRET,
          hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET
        }
      }
    })
  }
}
