// Production authentication debugging utilities
export function logProductionAuthEnvironment() {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  console.log('PRODUCTION: Authentication Environment Check:', {
    nodeEnv: process.env.NODE_ENV,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    cookieDomain: process.env.COOKIE_DOMAIN || 'not set',
    forceHttps: process.env.FORCE_HTTPS || 'not set',
    timestamp: new Date().toISOString()
  })

  // Check for common production issues
  const issues = []
  
  if (!process.env.JWT_SECRET && !process.env.NEXTAUTH_SECRET) {
    issues.push('No JWT secret configured')
  }
  
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    issues.push('JWT secret too short (should be at least 32 characters)')
  }
  
  if (issues.length > 0) {
    console.error('PRODUCTION: Authentication configuration issues:', issues)
  } else {
    console.log('PRODUCTION: Authentication environment looks good')
  }
}

export function logProductionCookieDebug(request: Request) {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  const cookieHeader = request.headers.get('cookie')
  const authToken = cookieHeader?.split(';').find(c => c.trim().startsWith('auth-token='))
  
  console.log('PRODUCTION: Cookie Debug:', {
    hasCookieHeader: !!cookieHeader,
    cookieHeaderLength: cookieHeader?.length || 0,
    hasAuthToken: !!authToken,
    authTokenLength: authToken?.split('=')[1]?.length || 0,
    userAgent: request.headers.get('user-agent')?.substring(0, 50),
    referer: request.headers.get('referer'),
    host: request.headers.get('host'),
    timestamp: new Date().toISOString()
  })
}
