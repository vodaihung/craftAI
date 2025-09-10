import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/db/queries'
import { 
  verifyPassword, 
  createSession, 
  validateEmail, 
  validatePassword,
  getSessionFromRequest,
  AuthError,
  ValidationError 
} from '@/lib/auth'
import { setSessionCookie, createValidationErrorResponse } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return createValidationErrorResponse('Email and password are required')
    }

    if (!validateEmail(email)) {
      return createValidationErrorResponse('Invalid email format')
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return createValidationErrorResponse(passwordValidation.message!)
    }

    // Get user from database
    const user = await getUserByEmail(email.toLowerCase().trim())
    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session token
    const sessionToken = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    })

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      sessionReady: true // NEW: Confirm session is ready
    })

    // Set session cookie
    setSessionCookie(response, sessionToken)

    // CRITICAL FIX: Verify the session can be read back immediately
    // This ensures the cookie is properly set before we respond
    try {
      // Create a mock request with the cookie to test session reading
      const testRequest = new Request(request.url, {
        headers: {
          'cookie': `auth-token=${sessionToken}`
        }
      })
      
      const mockNextRequest = {
        cookies: {
          get: (name: string) => name === 'auth-token' ? { value: sessionToken } : undefined
        }
      } as NextRequest

      const testSession = await getSessionFromRequest(mockNextRequest)
      
      if (!testSession) {
        console.error('Session verification failed immediately after creation')
        return NextResponse.json(
          { success: false, error: 'Session creation failed' },
          { status: 500 }
        )
      }

      console.log('User logged in successfully with verified session:', {
        email: user.email,
        userId: user.id,
        sessionUserId: testSession.userId,
        tokenLength: sessionToken.length,
        nodeEnv: process.env.NODE_ENV
      })
    } catch (sessionTestError) {
      console.error('Session verification test failed:', sessionTestError)
      // Continue anyway - this is just a verification step
    }

    return response

  } catch (error) {
    console.error('Login error:', error)

    if (error instanceof ValidationError) {
      return createValidationErrorResponse(error.message)
    }

    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during login' },
      { status: 500 }
    )
  }
}
