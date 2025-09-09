'use client'

// Client-side authentication utilities for debugging and verification

export interface SessionVerificationResult {
  success: boolean
  hasToken: boolean
  sessionValid: boolean
  userEmail?: string
  error?: string
  attempts: number
}

// Verify session with detailed debugging information
export async function verifySessionDetailed(maxRetries: number = 3): Promise<SessionVerificationResult> {
  let attempts = 0
  let lastError: string | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts = attempt
    
    try {
      console.log(`Session verification attempt ${attempt}/${maxRetries}`)
      
      // Check if auth token cookie exists
      const hasToken = document.cookie.includes('auth-token=')
      console.log('Auth token cookie present:', hasToken)
      
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      console.log('Session API response:', {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Session data:', {
          success: data.success,
          hasUser: !!data.session?.user,
          userEmail: data.session?.user?.email,
          status: data.session?.status
        })

        if (data.success && data.session?.user) {
          return {
            success: true,
            hasToken,
            sessionValid: true,
            userEmail: data.session.user.email,
            attempts
          }
        } else {
          lastError = 'Session API returned no user data'
        }
      } else {
        lastError = `Session API failed with status ${response.status}`
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Session verification attempt ${attempt} failed:`, error)
    }

    if (attempt < maxRetries) {
      const delay = 300 * attempt // Increasing delay
      console.log(`Retrying session verification in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return {
    success: false,
    hasToken: document.cookie.includes('auth-token='),
    sessionValid: false,
    error: lastError,
    attempts
  }
}

// Check if cookies are working properly
export function checkCookieSupport(): boolean {
  try {
    // Test cookie setting and reading
    const testCookie = 'test-cookie-support=true'
    document.cookie = testCookie + '; path=/; max-age=1'
    const cookieWorks = document.cookie.includes('test-cookie-support=true')
    
    // Clean up test cookie
    document.cookie = 'test-cookie-support=; path=/; max-age=0'
    
    return cookieWorks
  } catch (error) {
    console.error('Cookie support check failed:', error)
    return false
  }
}

// Get detailed authentication debug information
export async function getAuthDebugInfo(): Promise<any> {
  const cookieSupport = checkCookieSupport()
  const hasAuthToken = document.cookie.includes('auth-token=')
  const sessionVerification = await verifySessionDetailed(1)
  
  return {
    timestamp: new Date().toISOString(),
    cookieSupport,
    hasAuthToken,
    sessionVerification,
    userAgent: navigator.userAgent,
    location: {
      href: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname
    },
    cookies: {
      all: document.cookie,
      authTokenPresent: hasAuthToken
    }
  }
}

// Wait for authentication to be ready
export async function waitForAuth(maxWaitTime: number = 5000): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitTime) {
    const verification = await verifySessionDetailed(1)
    if (verification.success) {
      return true
    }
    
    // Wait 100ms before checking again
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return false
}
