'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SessionDebugInfo {
  cookies: string
  sessionAPI: any
  userAgent: string
  timestamp: string
  environment: string
}

export default function AuthDebugPage() {
  const { user, status, refreshSession } = useAuth()
  const [debugInfo, setDebugInfo] = useState<SessionDebugInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const collectDebugInfo = async () => {
    setLoading(true)
    try {
      // Get session from API
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache'
      })
      
      const sessionData = await sessionResponse.json()

      const info: SessionDebugInfo = {
        cookies: document.cookie,
        sessionAPI: sessionData,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      }

      setDebugInfo(info)
    } catch (error) {
      console.error('Debug info collection failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    collectDebugInfo()
  }, [])

  const handleRefreshSession = async () => {
    await refreshSession()
    await collectDebugInfo()
  }

  const handleTestLogin = async () => {
    // This would be for testing - you'd need to implement actual test credentials
    console.log('Test login would go here')
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Authentication Debug</h1>
        <p className="text-muted-foreground">
          Debug authentication issues in production
        </p>
        <Badge variant={status === 'authenticated' ? 'default' : 'destructive'}>
          Status: {status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Auth State */}
        <Card>
          <CardHeader>
            <CardTitle>Current Auth State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Status:</strong> {status}
            </div>
            <div>
              <strong>User:</strong> {user ? user.email : 'None'}
            </div>
            <div>
              <strong>User ID:</strong> {user ? user.id : 'None'}
            </div>
            <div>
              <strong>User Name:</strong> {user ? user.name : 'None'}
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleRefreshSession} size="sm">
                Refresh Session
              </Button>
              <Button onClick={collectDebugInfo} size="sm" variant="outline" disabled={loading}>
                {loading ? 'Loading...' : 'Refresh Debug Info'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session API Response */}
        <Card>
          <CardHeader>
            <CardTitle>Session API Response</CardTitle>
          </CardHeader>
          <CardContent>
            {debugInfo ? (
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-64">
                {JSON.stringify(debugInfo.sessionAPI, null, 2)}
              </pre>
            ) : (
              <p>Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Browser Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>Browser Cookies</CardTitle>
          </CardHeader>
          <CardContent>
            {debugInfo ? (
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>All Cookies:</strong>
                </div>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-32">
                  {debugInfo.cookies || 'No cookies found'}
                </pre>
                <div className="text-sm">
                  <strong>Auth Token Present:</strong> {debugInfo.cookies.includes('auth-token') ? '✅ Yes' : '❌ No'}
                </div>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Info</CardTitle>
          </CardHeader>
          <CardContent>
            {debugInfo ? (
              <div className="space-y-2 text-sm">
                <div><strong>Environment:</strong> {debugInfo.environment}</div>
                <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
                <div><strong>User Agent:</strong> {debugInfo.userAgent.substring(0, 100)}...</div>
                <div><strong>Protocol:</strong> {window.location.protocol}</div>
                <div><strong>Host:</strong> {window.location.host}</div>
                <div><strong>Pathname:</strong> {window.location.pathname}</div>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Check Session Status:</h4>
            <p className="text-sm text-muted-foreground">
              The "Current Auth State" should show "authenticated" if logged in.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">2. Verify API Response:</h4>
            <p className="text-sm text-muted-foreground">
              The "Session API Response" should show success: true and user data if authenticated.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">3. Check Cookies:</h4>
            <p className="text-sm text-muted-foreground">
              Look for "auth-token" in the browser cookies. If missing, login may have failed to set the cookie.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">4. Environment Issues:</h4>
            <p className="text-sm text-muted-foreground">
              Check if protocol is HTTPS in production and if the domain matches your cookie domain setting.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
