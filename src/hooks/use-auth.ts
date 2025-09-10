'use client'

import { useAuth, User } from '@/contexts/auth-context'

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

// SIMPLIFIED session verification - just check if session API responds correctly
async function verifySessionQuick(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-cache'
    })

    if (response.ok) {
      const data = await response.json()
      return data.success && data.session?.user
    }
    return false
  } catch (error) {
    console.error('Quick session verification failed:', error)
    return false
  }
}

// FIXED: Hook for login with proper session confirmation
export function useLogin() {
  const { refreshSession } = useAuth()

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('Starting login process for:', email)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      
      console.log('Login API response:', {
        ok: response.ok,
        status: response.status,
        success: result.success,
        sessionReady: result.sessionReady,
        hasUser: !!result.user
      })

      if (response.ok && result.success) {
        // CRITICAL FIX: Server already confirmed session is ready
        // No need for arbitrary delays or complex retry logic
        
        console.log('Login successful, server confirmed session ready')
        
        // Update auth context to reflect new state
        await refreshSession()
        
        // Small delay to ensure auth context update completes
        await new Promise(resolve => setTimeout(resolve, 50))
        
        // Quick verification that our context is updated
        const isSessionValid = await verifySessionQuick()
        
        if (isSessionValid) {
          // Now safe to redirect - session is confirmed both server and client side
          const urlParams = new URLSearchParams(window.location.search)
          const callbackUrl = urlParams.get('callbackUrl') || '/dashboard'
          console.log('Session verified, redirecting to:', callbackUrl)
          
          // Use router.push instead of window.location.href for better UX
          window.location.href = callbackUrl
        } else {
          console.error('Session context update failed')
          return { success: false, error: 'Authentication state update failed. Please try again.' }
        }
        
        return { success: true }
      } else {
        console.log('Login failed:', result.error)
        return { success: false, error: result.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  return { login: handleLogin }
}

// FIXED: Hook for signup with proper session confirmation  
export function useSignup() {
  const { refreshSession } = useAuth()

  const handleSignup = async (name: string, email: string, password: string, confirmPassword: string) => {
    try {
      console.log('Starting signup process for:', email)
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, confirmPassword }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log('Signup successful, updating auth context')
        
        // Update auth context
        await refreshSession()
        
        // Small delay to ensure context update
        await new Promise(resolve => setTimeout(resolve, 50))
        
        // Quick verification
        const isSessionValid = await verifySessionQuick()
        
        if (isSessionValid) {
          const urlParams = new URLSearchParams(window.location.search)
          const callbackUrl = urlParams.get('callbackUrl') || '/dashboard'
          console.log('Signup session verified, redirecting to:', callbackUrl)
          window.location.href = callbackUrl
        } else {
          console.error('Signup session context update failed')
          return { success: false, error: 'Authentication state update failed. Please try again.' }
        }
        
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Signup failed' }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  return { signup: handleSignup }
}
