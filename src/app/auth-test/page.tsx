'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthTestPage() {
  const { user, status, login, logout, refreshSession } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addTestResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, {
      timestamp: new Date().toISOString(),
      test,
      result
    }])
  }

  const runComprehensiveTest = async () => {
    setLoading(true)
    setTestResults([])
    
    try {
      // Import auth utils dynamically
      const { getAuthDebugInfo, verifySessionDetailed, checkCookieSupport } = await import('@/lib/auth-utils')
      
      // Test 1: Cookie support
      const cookieSupport = checkCookieSupport()
      addTestResult('Cookie Support', { supported: cookieSupport })
      
      // Test 2: Current auth state
      addTestResult('Current Auth State', {
        status,
        hasUser: !!user,
        userEmail: user?.email
      })
      
      // Test 3: Session verification
      const sessionVerification = await verifySessionDetailed(3)
      addTestResult('Session Verification', sessionVerification)
      
      // Test 4: Full debug info
      const fullDebugInfo = await getAuthDebugInfo()
      setDebugInfo(fullDebugInfo)
      addTestResult('Full Debug Info', 'See debug info panel')
      
      // Test 5: Manual session API call
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-cache'
        })
        const data = await response.json()
        addTestResult('Manual Session API', {
          status: response.status,
          success: data.success,
          hasUser: !!data.session?.user
        })
      } catch (error) {
        addTestResult('Manual Session API', { error: error.message })
      }
      
    } catch (error) {
      addTestResult('Test Error', { error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      // Test with a dummy login (this will fail but we can see the flow)
      const result = await login('test@example.com', 'testpassword')
      addTestResult('Test Login', result)
    } catch (error) {
      addTestResult('Test Login Error', { error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testLogout = async () => {
    setLoading(true)
    try {
      await logout()
      addTestResult('Test Logout', { success: true })
    } catch (error) {
      addTestResult('Test Logout Error', { error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const refreshAuth = async () => {
    setLoading(true)
    try {
      await refreshSession()
      addTestResult('Refresh Session', { success: true })
    } catch (error) {
      addTestResult('Refresh Session Error', { error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication System Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={runComprehensiveTest} disabled={loading}>
              Run Full Test
            </Button>
            <Button onClick={testLogin} disabled={loading} variant="outline">
              Test Login
            </Button>
            <Button onClick={testLogout} disabled={loading} variant="outline">
              Test Logout
            </Button>
            <Button onClick={refreshAuth} disabled={loading} variant="outline">
              Refresh Session
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Status:</strong> {status}
            </div>
            <div>
              <strong>User:</strong> {user?.email || 'None'}
            </div>
            <div>
              <strong>Has Cookie:</strong> {typeof document !== 'undefined' && document.cookie.includes('auth-token') ? 'Yes' : 'No'}
            </div>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="font-semibold">{result.test}</div>
                  <div className="text-sm text-gray-600">{result.timestamp}</div>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
