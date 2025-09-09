import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../[...nextauth]/route'

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)
    
    if (session?.user?.email) {
      console.log('Manual logout initiated for user:', session.user.email)
    }

    // Perform any additional cleanup here
    // For example:
    // - Clear user-specific cache
    // - Log logout event
    // - Invalidate refresh tokens
    // - Clear temporary data

    // Create response with cleared cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logout successful' 
    })

    // Clear NextAuth cookies
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url'
    ]

    cookiesToClear.forEach(cookieName => {
      // Clear regular cookies
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
      })
      
      // Clear secure cookies if in production
      if (process.env.NODE_ENV === 'production') {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path: '/',
          secure: true,
          httpOnly: true,
        })
      }
    })

    return response

  } catch (error) {
    console.error('Logout API error:', error)
    
    // Even if there's an error, still clear cookies
    const response = NextResponse.json({ 
      success: false, 
      error: 'Logout failed but cookies cleared' 
    }, { status: 500 })

    // Clear cookies anyway
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token'
    ]

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
      })
    })

    return response
  }
}
