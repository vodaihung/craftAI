import { NextRequest, NextResponse } from 'next/server'
import { getSession, createSession } from '@/lib/auth'
import { 
  createClientSession, 
  createSessionResponse, 
  shouldRefreshSession,
  setSessionCookie,
  isSessionExpired 
} from '@/lib/session'
import { getUserById } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({
        success: true,
        session: {
          user: null,
          status: 'unauthenticated'
        }
      })
    }

    // Check if session is expired
    if (isSessionExpired(session)) {
      return NextResponse.json({
        success: true,
        session: {
          user: null,
          status: 'unauthenticated'
        }
      })
    }

    // Check if we should refresh the session
    if (await shouldRefreshSession(session)) {
      try {
        // Get fresh user data from database
        const user = await getUserById(session.userId)
        if (!user) {
          return NextResponse.json({
            success: true,
            session: {
              user: null,
              status: 'unauthenticated'
            }
          })
        }

        // Create new session token
        const newSessionToken = await createSession({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        })

        // Create response with updated session
        const response = createSessionResponse({
          userId: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        })

        // Set new session cookie
        setSessionCookie(response, newSessionToken)

        return response
      } catch (refreshError) {
        console.error('Session refresh error:', refreshError)
        // Fall back to existing session if refresh fails
      }
    }

    // Return existing session
    return createSessionResponse(session)

  } catch (error) {
    console.error('Session check error:', error)
    
    return NextResponse.json({
      success: true,
      session: {
        user: null,
        status: 'unauthenticated'
      }
    })
  }
}

// Handle session updates (for future use)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'refresh') {
      // Force refresh session
      const user = await getUserById(session.userId)
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      const newSessionToken = await createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      })

      const response = NextResponse.json({
        success: true,
        message: 'Session refreshed',
        session: createClientSession({
          userId: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        })
      })

      setSessionCookie(response, newSessionToken)
      return response
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Session update error:', error)
    
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
