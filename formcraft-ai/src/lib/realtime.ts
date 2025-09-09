// Real-time updates using Server-Sent Events (SSE)
// This is a simplified implementation for the MVP

export class RealtimeClient {
  private eventSource: EventSource | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  connect(userId: string) {
    if (this.eventSource) {
      this.disconnect()
    }

    // In a real implementation, this would connect to a proper SSE endpoint
    // For now, we'll simulate real-time updates with polling
    this.simulateRealtime(userId)
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  subscribe(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
        if (eventListeners.size === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data))
    }
  }

  private simulateRealtime(userId: string) {
    // Simulate periodic updates
    const interval = setInterval(async () => {
      try {
        // Check for new responses
        const response = await fetch('/api/forms?includeResponseCount=true')
        const result = await response.json()
        
        if (result.success) {
          this.emit('forms_updated', {
            forms: result.forms,
            timestamp: new Date().toISOString()
          })

          // Simulate new response notifications
          const hasNewResponses = Math.random() > 0.9 // 10% chance
          if (hasNewResponses) {
            this.emit('new_response', {
              formId: result.forms[0]?.id,
              formName: result.forms[0]?.name,
              timestamp: new Date().toISOString()
            })
          }
        }
      } catch (error) {
        console.error('Realtime update error:', error)
      }
    }, 30000) // Check every 30 seconds

    // Store interval for cleanup
    this.eventSource = {
      close: () => clearInterval(interval)
    } as EventSource
  }
}

// Singleton instance
export const realtimeClient = new RealtimeClient()

// React hook for real-time updates
export function useRealtime(userId?: string) {
  const [isConnected, setIsConnected] = React.useState(false)

  React.useEffect(() => {
    if (userId) {
      realtimeClient.connect(userId)
      setIsConnected(true)

      return () => {
        realtimeClient.disconnect()
        setIsConnected(false)
      }
    }
  }, [userId])

  const subscribe = React.useCallback((event: string, callback: (data: any) => void) => {
    return realtimeClient.subscribe(event, callback)
  }, [])

  return { isConnected, subscribe }
}

// For environments where React is not available
declare global {
  var React: any
}

if (typeof React === 'undefined') {
  // Fallback for non-React environments
  (global as any).React = {
    useState: (initial: any) => [initial, () => {}],
    useEffect: () => {},
    useCallback: (fn: any) => fn
  }
}
