'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

// Types
export interface User {
  id: string
  email: string
  name: string
  image?: string | null
}

export interface AuthContextType {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  // Check session on mount and periodically with enhanced error handling
  const checkSession = useCallback(async () => {
    try {
      console.log('Checking session...')
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache', // Ensure fresh session check
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Session check response:', {
          success: data.success,
          hasUser: !!data.session?.user,
          userEmail: data.session?.user?.email
        })

        if (data.success && data.session?.user) {
          setUser(data.session.user)
          setStatus('authenticated')
          console.log('Session authenticated for user:', data.session.user.email)
        } else {
          setUser(null)
          setStatus('unauthenticated')
          console.log('Session check: user not authenticated')
        }
      } else {
        console.log('Session check failed with status:', response.status)
        setUser(null)
        setStatus('unauthenticated')
      }
    } catch (error) {
      console.error('Session check error:', error)
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  // Login function with proper session synchronization
  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log('Login API response:', {
        ok: response.ok,
        status: response.status,
        success: data.success,
        hasUser: !!data.user,
        hasCookieHeader: response.headers.has('set-cookie')
      })

      if (response.ok && data.success) {
        console.log('Login successful, waiting for session synchronization...')

        // CRITICAL FIX: Wait for cookie to be properly set before updating state
        // This prevents race conditions in production
        await new Promise(resolve => setTimeout(resolve, 100))

        // Verify session is actually available by checking the session endpoint
        let sessionVerified = false
        let attempts = 0
        const maxAttempts = 5

        while (!sessionVerified && attempts < maxAttempts) {
          try {
            const sessionResponse = await fetch('/api/auth/session', {
              method: 'GET',
              credentials: 'include',
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            })

            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json()
              if (sessionData.success && sessionData.session?.user) {
                sessionVerified = true
                console.log('Session verified successfully after login')

                // Update state with verified session data
                setUser(sessionData.session.user)
                setStatus('authenticated')
                break
              }
            }
          } catch (sessionError) {
            console.warn('Session verification attempt failed:', sessionError)
          }

          attempts++
          if (attempts < maxAttempts) {
            // Wait progressively longer between attempts
            await new Promise(resolve => setTimeout(resolve, 100 * attempts))
          }
        }

        if (!sessionVerified) {
          console.error('Session verification failed after login - falling back to login response data')
          // Fallback to login response data if session verification fails
          setUser(data.user)
          setStatus('authenticated')
        }

        return { success: true }
      } else {
        console.log('Login failed:', data.error)
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [])

  // Signup function
  const signup = useCallback(async (name: string, email: string, password: string, confirmPassword: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, confirmPassword }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        setStatus('authenticated')
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Signup failed' }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setStatus('unauthenticated')
      
      // Clear any client-side storage
      if (typeof window !== 'undefined') {
        // Clear session storage
        sessionStorage.clear()
        
        // Clear specific localStorage items
        const keysToRemove = [
          'user-session',
          'auth-token',
          'user-data',
          'form-drafts',
          'temp-session'
        ]
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
        })
      }
    }
  }, [])

  // Refresh session function with production enhancements
  const refreshSession = useCallback(async () => {
    console.log('Refreshing session...')

    // PRODUCTION: Clear any cached session data before refresh
    if (typeof window !== 'undefined') {
      // Clear any localStorage session data
      localStorage.removeItem('auth-session')
      localStorage.removeItem('user-data')
    }

    await checkSession()
  }, [checkSession])

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, []) // Remove checkSession from dependencies to prevent infinite loop

  // Set up periodic session check (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'authenticated') {
        checkSession()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [status]) // Remove checkSession from dependencies to prevent infinite loop

  // Handle visibility change (refresh session when tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'authenticated') {
        checkSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [status]) // Remove checkSession from dependencies to prevent infinite loop

  const value: AuthContextType = useMemo(() => ({
    user,
    status,
    login,
    signup,
    logout,
    refreshSession,
  }), [user, status, login, signup, logout, refreshSession])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Convenience hooks
export function useUser() {
  const { user, status } = useAuth()
  return { user, status }
}

export function useAuthActions() {
  const { login, signup, logout, refreshSession } = useAuth()
  return { login, signup, logout, refreshSession }
}
