import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { clearSessionCookie } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getSession()

    if (session?.email) {
      console.log('Manual logout initiated for user:', session.email)
    }

    // Perform any additional cleanup here
    // For example:
    // - Clear user-specific cache
    // - Log logout event
    // - Invalidate refresh tokens
    // - Clear temporary data

    // Create response with cleared session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

    // Clear session cookie
    clearSessionCookie(response)

    return response

  } catch (error) {
    console.error('Logout error:', error)

    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
