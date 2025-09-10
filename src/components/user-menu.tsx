'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
import { useAuth } from '@/contexts/auth-context'

export function UserMenu() {
  const { user, status, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState(false)

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      // Check if click is outside both the button and the dropdown
      if (!target.closest('[data-user-menu]') && !target.closest('[data-user-dropdown]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  // Update button position when dropdown opens
  const updateButtonPosition = (button: HTMLButtonElement) => {
    if (button) {
      const rect = button.getBoundingClientRect()
      setButtonRect(rect)
    }
  }

  const handleSignOut = async () => {
    setIsOpen(false)
    setIsLoggingOut(true)
    try {
      await logout('/')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (!user || status === 'unauthenticated') {
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
        ref={(button) => {
          if (button && isOpen && !buttonRect) {
            updateButtonPosition(button)
          }
        }}
        variant="ghost"
        onClick={(e) => {
          updateButtonPosition(e.currentTarget)
          setIsOpen(!isOpen)
        }}
        className="flex items-center space-x-2 h-auto p-2"
        disabled={isLoggingOut}
      >
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User'}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
            {user?.name?.[0] || user?.email?.[0] || 'U'}
          </div>
        )}
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-foreground">
            {user?.name || 'User'}
          </span>
          <span className="text-xs text-muted-foreground">
            {user?.email}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && mounted && buttonRect && createPortal(
        <div
          data-user-dropdown
          className="fixed w-56 bg-background border border-border rounded-lg shadow-lg z-[9999]"
          style={{
            top: buttonRect.bottom + 8,
            right: window.innerWidth - buttonRect.right,
          }}
        >
          <div className="p-1">
            {/* User Info */}
            <div className="px-3 py-2 text-sm border-b border-border">
              <div className="font-medium">{user?.name || 'User'}</div>
              <div className="text-muted-foreground">{user?.email}</div>
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
        </div>,
        document.body
      )}
    </div>
  )
}
