'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useLogout, useTabCloseCleanup } from '@/hooks/use-logout'

export function UserMenu() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const { logout, isLoading: isLoggingOut } = useLogout({
    redirectTo: '/',
    onSuccess: () => {
      console.log('Successfully logged out')
    },
    onError: (error) => {
      console.error('Logout failed:', error)
    }
  })
  const { setupTabCloseCleanup } = useTabCloseCleanup()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-user-menu]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  // Setup tab close cleanup
  useEffect(() => {
    const cleanup = setupTabCloseCleanup()
    return cleanup
  }, [])

  const handleSignOut = async () => {
    setIsOpen(false)
    await logout()
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center space-x-2">
        <Link href="/auth/signin">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm">
            Sign Up
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative" data-user-menu>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 h-auto p-2"
        disabled={isLoggingOut}
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
            {session.user?.name?.[0] || session.user?.email?.[0] || 'U'}
          </div>
        )}
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-foreground">
            {session.user?.name || 'User'}
          </span>
          <span className="text-xs text-muted-foreground">
            {session.user?.email}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="p-1">
            {/* User Info */}
            <div className="px-3 py-2 text-sm border-b border-border">
              <div className="font-medium">{session.user?.name || 'User'}</div>
              <div className="text-muted-foreground">{session.user?.email}</div>
            </div>
            
            {/* Menu Items */}
            <div className="py-1">
              <Link href="/dashboard">
                <button className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
              </Link>
              
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
