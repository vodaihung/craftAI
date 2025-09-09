'use client'

import { useAuth, User } from '@/contexts/auth-context'
import { verifySessionDetailed } from '@/lib/auth-utils'

// Types to match NextAuth's useSession interface
export interface Session {
  user: User
}

export interface UseSessionResult {
  data: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  update: () => Promise<void>
}

// Hook that provides NextAuth-compatible interface
export function useSession(): UseSessionResult {
  const { user, status, refreshSession } = useAuth()

  const session: Session | null = user ? { user } : null

  return {
    data: session,
    status,
    update: refreshSession,
  }
}

// Re-export auth functions for convenience
export function useAuthActions() {
  const { login, signup, logout } = useAuth()
  return { login, signup, logout }
}

// Hook for checking if user is authenticated
export function useIsAuthenticated(): boolean {
  const { status } = useAuth()
  return status === 'authenticated'
}

// Hook for getting current user
export function useCurrentUser(): User | null {
  const { user } = useAuth()
  return user
}

// Hook for authentication loading state
export function useAuthLoading(): boolean {
  const { status } = useAuth()
  return status === 'loading'
}

// Hook that redirects to login if not authenticated
export function useRequireAuth(): UseSessionResult {
  const session = useSession()
  
  if (typeof window !== 'undefined' && session.status === 'unauthenticated') {
    window.location.href = '/auth/signin'
  }
  
  return session
}

// Hook for logout with cleanup
export function useLogout() {
  const { logout } = useAuth()
  
  const handleLogout = async (redirectTo: string = '/') => {
    await logout()
    
    // Redirect after logout
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo
    }
  }
  
  return { logout: handleLogout }
}

// Session verification with detailed logging (using the new utility)
async function verifySessionWithRetry(maxRetries: number = 3): Promise<boolean> {
  console.log('Starting session verification with detailed logging...')
  const result = await verifySessionDetailed(maxRetries)

  console.log('Session verification result:', result)

  if (!result.success) {
    console.error('Session verification failed:', {
      hasToken: result.hasToken,
      sessionValid: result.sessionValid,
      error: result.error,
      attempts: result.attempts
    })
  }

  return result.success
}

// Hook for login with error handling and session verification
export function useLogin() {
  const { login, refreshSession } = useAuth()

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password)

    if (result.success) {
      console.log('Login API successful, verifying session...')

      // Wait a moment for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify session is working before redirect
      const sessionVerified = await verifySessionWithRetry()

      if (sessionVerified) {
        // Refresh the auth context to ensure it's in sync
        await refreshSession()

        // Now safe to redirect
        const urlParams = new URLSearchParams(window.location.search)
        const callbackUrl = urlParams.get('callbackUrl') || '/dashboard'
        console.log('Session verified, redirecting to:', callbackUrl)
        window.location.href = callbackUrl
      } else {
        console.error('Session verification failed after login')
        return { success: false, error: 'Authentication verification failed. Please try again.' }
      }
    }

    return result
  }

  return { login: handleLogin }
}

// Hook for signup with error handling and session verification
export function useSignup() {
  const { signup, refreshSession } = useAuth()

  const handleSignup = async (name: string, email: string, password: string, confirmPassword: string) => {
    const result = await signup(name, email, password, confirmPassword)

    if (result.success) {
      console.log('Signup API successful, verifying session...')

      // Wait a moment for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify session is working before redirect
      const sessionVerified = await verifySessionWithRetry()

      if (sessionVerified) {
        // Refresh the auth context to ensure it's in sync
        await refreshSession()

        // Now safe to redirect
        const urlParams = new URLSearchParams(window.location.search)
        const callbackUrl = urlParams.get('callbackUrl') || '/dashboard'
        console.log('Session verified, redirecting to:', callbackUrl)
        window.location.href = callbackUrl
      } else {
        console.error('Session verification failed after signup')
        return { success: false, error: 'Authentication verification failed. Please try again.' }
      }
    }

    return result
  }

  return { signup: handleSignup }
}
