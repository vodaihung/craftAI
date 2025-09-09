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

// Hook for login with error handling
export function useLogin() {
  const { login } = useAuth()
  
  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password)
    
    if (result.success) {
      // Redirect to dashboard or callback URL
      const urlParams = new URLSearchParams(window.location.search)
      const callbackUrl = urlParams.get('callbackUrl') || '/dashboard'
      window.location.href = callbackUrl
    }
    
    return result
  }
  
  return { login: handleLogin }
}

// Hook for signup with error handling
export function useSignup() {
  const { signup } = useAuth()
  
  const handleSignup = async (name: string, email: string, password: string, confirmPassword: string) => {
    const result = await signup(name, email, password, confirmPassword)
    
    if (result.success) {
      // Redirect to dashboard or callback URL
      const urlParams = new URLSearchParams(window.location.search)
      const callbackUrl = urlParams.get('callbackUrl') || '/dashboard'
      window.location.href = callbackUrl
    }
    
    return result
  }
  
  return { signup: handleSignup }
}
