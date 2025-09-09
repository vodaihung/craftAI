'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Bell,
  BellOff,
  X,
  Wifi,
  WifiOff
} from 'lucide-react'

interface RealTimeNotificationsProps {
  formId: string
  onNewResponse?: () => void
  className?: string
}

export function RealTimeNotifications({
  formId,
  onNewResponse,
  className = ''
}: RealTimeNotificationsProps) {
  // Simplified version without SSE to improve performance
  const [isEnabled, setIsEnabled] = useState(false) // Disabled by default
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  // Simplified - no real-time connections to improve performance
  useEffect(() => {
    // Just show that notifications are available but not active
    return () => {
      // Cleanup if needed
    }
  }, [formId, isEnabled])

  const toggleNotifications = () => {
    setIsEnabled(!isEnabled)
  }

  const toggleNotificationPanel = () => {
    setShowNotifications(!showNotifications)
    if (showNotifications) {
      setUnreadCount(0) // Mark as read when opening
    }
  }

  const clearAllNotifications = () => {
    setUnreadCount(0)
  }

  // Simplified render without complex SSE logic
  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleNotificationPanel}
          className="relative"
        >
          {isEnabled ? (
            <Bell className="w-4 h-4" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleNotifications}
          className="text-xs"
        >
          {isEnabled ? (
            <Wifi className="w-3 h-3 mr-1" />
          ) : (
            <WifiOff className="w-3 h-3 mr-1" />
          )}
          {isEnabled ? 'On' : 'Off'}
        </Button>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-hidden z-50 shadow-lg">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                Clear
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleNotificationPanel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Real-time notifications are disabled for better performance.</p>
              <p className="text-xs mt-2">Refresh the page to see latest updates.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
