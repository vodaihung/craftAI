'use client'

import { useAuth } from '@/contexts/auth-context'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthStatusPage() {
  const { user, status, login, logout } = useAuth()
  const [sessionData, setSessionData] = useState<any>(null)
  const [formsData, setFormsData] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')

  useEffect(() => {
    // Check session API
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setSessionData(data))
      .catch(err => setSessionData({ error: err.message }))

    // Check forms API
    fetch('/api/forms')
      .then(res => res.json())
      .then(data => setFormsData(data))
      .catch(err => setFormsData({ error: err.message }))

    // Get cookies
    setCookies(document.cookie)
  }, [])

  const handleTestLogin = async () => {
    const result = await login('test@example.com', 'TestPassword123!')
    if (result.success) {
      window.location.reload()
    } else {
      alert('Login failed: ' + result.error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Authentication Status Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth Context Status */}
        <Card>
          <CardHeader>
            <CardTitle>Auth Context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Status:</strong> {status}</p>
              <p><strong>User:</strong> {user ? user.email : 'None'}</p>
              <p><strong>User ID:</strong> {user?.id || 'None'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Session API Status */}
        <Card>
          <CardHeader>
            <CardTitle>Session API</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Forms API Status */}
        <Card>
          <CardHeader>
            <CardTitle>Forms API</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(formsData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>Browser Cookies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>All Cookies:</strong></p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {cookies || 'No cookies found'}
              </pre>
              <p><strong>Has auth-token:</strong> {cookies.includes('auth-token') ? 'Yes' : 'No'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-x-4">
        <Button onClick={handleTestLogin}>Test Login</Button>
        <Button onClick={logout} variant="outline">Logout</Button>
        <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
          Go to Dashboard
        </Button>
        <Button onClick={() => window.location.href = '/auth/signin'} variant="outline">
          Go to Sign In
        </Button>
      </div>
    </div>
  )
}
