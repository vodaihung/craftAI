import { NextRequest, NextResponse } from 'next/server'
import { updateUserSubscriptionTier, getUserById } from '@/lib/db/queries'
import { requireAuth } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.userId

    const { subscriptionTier } = await request.json()

    if (!subscriptionTier || !['free', 'pro'].includes(subscriptionTier)) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 })
    }

    // Get user by ID
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update subscription tier
    const updatedUser = await updateUserSubscriptionTier(user.id, subscriptionTier)

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      subscriptionTier: updatedUser.subscriptionTier
    })
  } catch (error) {
    console.error('Subscription update error:', error)

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.userId

    // Get user by ID to get subscription tier
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      subscriptionTier: user.subscriptionTier || 'free'
    })
  } catch (error) {
    console.error('Get subscription error:', error)

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
