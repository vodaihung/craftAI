'use client'

import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/user-menu'
import { Crown, Plus } from 'lucide-react'
import Link from 'next/link'

interface DashboardHeaderProps {
  currentTier: string
  onShowSubscriptionManager: () => void
}

export function DashboardHeader({ 
  currentTier, 
  onShowSubscriptionManager 
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">FC</span>
                </div>
                <span className="text-xl font-bold">FormCraft AI</span>
              </div>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-xl font-semibold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your forms</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={onShowSubscriptionManager}
            >
              <Crown className="w-4 h-4 mr-2" />
              {currentTier === 'free' ? 'Upgrade' : 'Manage Plan'}
            </Button>

            <Link href="/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Form
              </Button>
            </Link>

            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
