'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/auth-context'

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
