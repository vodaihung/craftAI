'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  BellOff, 
  Users, 
  Eye, 
  Share, 
  CheckCircle,
  X,
  Wifi,
  WifiOff
} from 'lucide-react'

interface RealTimeEvent {
  type: 'connected' | 'heartbeat' | 'new_response' | 'form_view' | 'form_share'
  formId: string
  timestamp: string
  data?: any
}

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
  const [isConnected, setIsConnected] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [events, setEvents] = useState<RealTimeEvent[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (isEnabled) {
      connectToEvents()
    } else {
      disconnectFromEvents()
    }

    return () => {
      disconnectFromEvents()
    }
  }, [formId, isEnabled])

  const connectToEvents = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Validate form ID - skip SSE for dashboard-level notifications
    if (!formId || formId === 'undefined' || formId === 'null' || formId === 'dashboard') {
      if (formId === 'dashboard') {
        console.log('📡 Dashboard-level notifications - SSE not needed')
        setIsConnected(false)
      } else {
        console.error('📡 Invalid form ID for SSE connection:', formId)
      }
      return
    }

    try {
      console.log(`📡 Connecting to SSE for form: ${formId}`)
      const eventSource = new EventSource(`/api/forms/${formId}/events`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('📡 Real-time connection established')
        setIsConnected(true)
        setReconnectAttempts(0) // Reset reconnect attempts on successful connection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      eventSource.onmessage = (event) => {
        try {
          const eventData: RealTimeEvent = JSON.parse(event.data)
          
          // Skip heartbeat events from UI
          if (eventData.type === 'heartbeat') {
            return
          }

          console.log('📡 Real-time event received:', eventData)
          
          setEvents(prev => [eventData, ...prev.slice(0, 49)]) // Keep last 50 events
          
          // Increment unread count for non-connection events
          if (eventData.type !== 'connected') {
            setUnreadCount(prev => prev + 1)
          }

          // Trigger callback for new responses
          if (eventData.type === 'new_response' && onNewResponse) {
            onNewResponse()
          }

        } catch (error) {
          console.error('Error parsing SSE event:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('📡 SSE connection error:', error)
        setIsConnected(false)

        // Check if the error is due to authentication or other issues
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('📡 SSE connection was closed by server')
          return
        }

        // Attempt to reconnect after a delay, but limit attempts
        if (!reconnectTimeoutRef.current && reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), 30000) // Exponential backoff, max 30s

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isEnabled && eventSource.readyState !== EventSource.CONNECTING) {
              console.log(`📡 Attempting to reconnect... (${reconnectAttempts + 1}/${maxReconnectAttempts})`)
              setReconnectAttempts(prev => prev + 1)
              connectToEvents()
            }
          }, delay)
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.warn('📡 Max reconnection attempts reached. Disabling real-time updates.')
          setIsEnabled(false)
        }
      }

    } catch (error) {
      console.error('Failed to establish SSE connection:', error)
      setIsConnected(false)
    }
  }

  const disconnectFromEvents = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
  }

  const toggleNotifications = () => {
    setIsEnabled(!isEnabled)
  }

  const toggleNotificationPanel = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications) {
      setUnreadCount(0) // Mark as read when opening
    }
  }

  const clearAllNotifications = () => {
    setEvents([])
    setUnreadCount(0)
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'new_response':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'form_view':
        return <Eye className="w-4 h-4 text-blue-500" />
      case 'form_share':
        return <Share className="w-4 h-4 text-purple-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getEventMessage = (event: RealTimeEvent) => {
    switch (event.type) {
      case 'connected':
        return 'Connected to real-time updates'
      case 'new_response':
        return `New response from ${event.data?.preview?.name || 'someone'}`
      case 'form_view':
        return 'Someone viewed your form'
      case 'form_share':
        return `Form shared via ${event.data?.platform || 'unknown'}`
      default:
        return 'Unknown event'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

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
        
        <div className="flex items-center space-x-1">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {!isEnabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setReconnectAttempts(0)
              setIsEnabled(true)
            }}
            className="text-xs"
          >
            Retry
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleNotifications}
          className="text-xs"
        >
          {isEnabled ? 'Disable' : 'Enable'}
        </Button>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-hidden z-50 shadow-lg">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Real-time Updates</h3>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                Clear
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleNotificationPanel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {events.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {events.map((event, index) => (
                  <div key={index} className="p-3 hover:bg-muted/50">
                    <div className="flex items-start space-x-3">
                      {getEventIcon(event.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {getEventMessage(event)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
