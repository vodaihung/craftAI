'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'

// Debug component to help troubleshoot authentication issues
// Only render in development or when DEBUG_AUTH is set
export function AuthDebug() {
  const { user, status } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Only show in development or when debug is enabled
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_DEBUG_AUTH) {
    return null
  }

  const fetchDebugInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/debug', {
        credentials: 'include'
      })
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      setDebugInfo({ error: 'Failed to fetch debug info' })
    } finally {
      setLoading(false)
    }
  }

  const testSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })
      const data = await response.json()
      console.log('Session test result:', data)
      alert(`Session test: ${data.session?.status || 'unknown'}`)
    } catch (error) {
      console.error('Session test failed:', error)
      alert('Session test failed - check console')
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md text-xs">
      <div className="mb-2">
        <strong>Auth Debug Panel</strong>
      </div>
      
      <div className="mb-2">
        <div>Status: <span className="text-green-400">{status}</span></div>
        <div>User: <span className="text-blue-400">{user?.email || 'none'}</span></div>
        <div>Environment: <span className="text-yellow-400">{process.env.NODE_ENV}</span></div>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={fetchDebugInfo}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          {loading ? 'Loading...' : 'Debug Info'}
        </button>
        <button
          onClick={testSession}
          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
        >
          Test Session
        </button>
      </div>

      {debugInfo && (
        <div className="mt-2 max-h-64 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
