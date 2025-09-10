import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// Debug endpoint to help troubleshoot authentication issues
// Enhanced for production debugging
export async function GET(request: NextRequest) {
  // ENHANCED: Allow debug in production with explicit flag
  const isProductionDebugEnabled = process.env.NODE_ENV === 'production' && process.env.ENABLE_PRODUCTION_DEBUG === 'true'
  const isDevMode = process.env.NODE_ENV !== 'production'
  
  if (!isDevMode && !isProductionDebugEnabled) {
    return NextResponse.json(
      { error: 'Debug endpoint not available. Set ENABLE_PRODUCTION_DEBUG=true to enable in production.' },
      { status: 404 }
    )
  }

  try {
    const session = await getSession()
    const authToken = request.cookies.get('auth-token')?.value
    
    // ENHANCED: More comprehensive debug information
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasJWT_SECRET: !!process.env.JWT_SECRET,
        hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        JWT_SECRET_length: (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET)?.length || 0,
        hasCOOKIE_DOMAIN: !!process.env.COOKIE_DOMAIN,
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'not set',
        FORCE_HTTPS: process.env.FORCE_HTTPS || 'not set',
        // PRODUCTION: Additional environment info
        hasENABLE_PRODUCTION_DEBUG: !!process.env.ENABLE_PRODUCTION_DEBUG,
        hasDATABASE_URL: !!process.env.DATABASE_URL
      },
      request: {
        hasAuthToken: !!authToken,
        authTokenLength: authToken?.length || 0,
        authTokenPrefix: authToken?.substring(0, 20) + '...' || 'none',
        userAgent: request.headers.get('user-agent')?.substring(0, 100),
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        // PRODUCTION: Additional request info
        forwarded: request.headers.get('x-forwarded-for'),
        forwardedProto: request.headers.get('x-forwarded-proto'),
        realIp: request.headers.get('x-real-ip'),
        cloudflareIp: request.headers.get('cf-connecting-ip')
      },
      session: {
        hasSession: !!session,
        userId: session?.userId || null,
        email: session?.email || null,
        name: session?.name || null,
        iat: session?.iat || null,
        exp: session?.exp || null,
        isExpired: session?.exp ? session.exp < Math.floor(Date.now() / 1000) : null,
        // PRODUCTION: Session timing info
        timeUntilExpiry: session?.exp ? session.exp - Math.floor(Date.now() / 1000) : null,
        createdAt: session?.iat ? new Date(session.iat * 1000).toISOString() : null,
        expiresAt: session?.exp ? new Date(session.exp * 1000).toISOString() : null
      },
      cookies: {
        allCookies: Object.fromEntries(
          request.cookies.getAll().map(cookie => [cookie.name, {
            value: cookie.name === 'auth-token' ? `${cookie.value.substring(0, 20)}...` : cookie.value,
            length: cookie.value.length
          }])
        ),
        // PRODUCTION: Cookie analysis
        authTokenPresent: !!authToken,
        cookieCount: request.cookies.getAll().length
      },
      // PRODUCTION: Additional debugging info
      production: {
        isProduction: process.env.NODE_ENV === 'production',
        debugEnabled: isProductionDebugEnabled,
        httpsDetected: request.headers.get('x-forwarded-proto') === 'https' || 
                      request.headers.get('x-forwarded-ssl') === 'on' ||
                      request.url.startsWith('https://'),
        loadBalancerDetected: !!(request.headers.get('x-forwarded-for') || 
                                 request.headers.get('x-real-ip') ||
                                 request.headers.get('cf-connecting-ip'))
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })

  } catch (error) {
    // ENHANCED: Production error handling
    const errorInfo = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.stack : undefined) : undefined,
      debug: {
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          hasJWT_SECRET: !!process.env.JWT_SECRET,
          hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
          debugEnabled: isProductionDebugEnabled
        },
        production: {
          isProduction: process.env.NODE_ENV === 'production',
          httpsDetected: request.headers.get('x-forwarded-proto') === 'https' || 
                        request.headers.get('x-forwarded-ssl') === 'on' ||
                        request.url.startsWith('https://')
        }
      }
    }
    
    // Log error for production debugging
    if (process.env.NODE_ENV === 'production') {
      console.error('PRODUCTION: Debug API error:', errorInfo)
    }
    
    return NextResponse.json(errorInfo, { status: 500 })
  }
}

