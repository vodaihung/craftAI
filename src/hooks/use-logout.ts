'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface UseLogoutOptions {
  redirectTo?: string
  clearStorage?: boolean
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useLogout(options: UseLogoutOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const {
    redirectTo = '/',
    clearStorage = true,
    onSuccess,
    onError
  } = options

  const clearCookies = () => {
    if (typeof window === 'undefined') return

    // List of NextAuth cookies to clear
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'next-auth.pkce.code_verifier',
      '__Secure-next-auth.pkce.code_verifier'
    ]

    // Clear each cookie
    cookiesToClear.forEach(cookieName => {
      // Clear for current domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      
      // Clear for secure cookies
      if (cookieName.startsWith('__Secure-') || cookieName.startsWith('__Host-')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`
      }
      
      // Clear for different path variations
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api/auth;`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api;`
    })
  }

  const clearStorageData = () => {
    if (typeof window === 'undefined') return

    try {
      // Clear session storage completely
      sessionStorage.clear()
      
      // Clear specific localStorage items (preserve theme and other user preferences)
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
    } catch (error) {
      console.warn('Error clearing storage:', error)
    }
  }

  const logout = async () => {
    if (isLoading) return

    setIsLoading(true)

    try {
      // Call our custom logout API first for additional cleanup
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (apiError) {
        console.warn('Logout API call failed:', apiError)
        // Continue with logout even if API fails
      }

      // Clear cookies
      clearCookies()

      // Clear storage if requested
      if (clearStorage) {
        clearStorageData()
      }

      // Sign out with NextAuth
      await signOut({
        callbackUrl: redirectTo,
        redirect: false // Handle redirect manually for better control
      })

      // Call success callback
      onSuccess?.()

      // Force redirect after a short delay to ensure cleanup
      setTimeout(() => {
        window.location.href = redirectTo
      }, 100)

    } catch (error) {
      console.error('Logout error:', error)

      // Even if signOut fails, clear everything and redirect
      clearCookies()
      if (clearStorage) {
        clearStorageData()
      }

      onError?.(error as Error)

      // Force redirect
      window.location.href = redirectTo
    } finally {
      setIsLoading(false)
    }
  }

  return {
    logout,
    isLoading,
    clearCookies,
    clearStorageData
  }
}

// Hook for handling tab close cleanup
export function useTabCloseCleanup() {
  const { clearCookies, clearStorageData } = useLogout()

  const setupTabCloseCleanup = () => {
    if (typeof window === 'undefined') return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Clear session data when tab is closed
      clearCookies()
      clearStorageData()
      
      // Note: We don't prevent the default behavior here
      // as we want the tab to close normally
    }

    const handleVisibilityChange = () => {
      // Clear data when tab becomes hidden (user switches tabs or minimizes)
      if (document.visibilityState === 'hidden') {
        clearCookies()
        clearStorageData()
      }
    }

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }

  return { setupTabCloseCleanup }
}
