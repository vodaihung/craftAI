'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const errorMessages: Record<string, { title: string; description: string; suggestion: string }> = {
  Configuration: {
    title: 'Server Configuration Error',
    description: 'There is a problem with the server configuration.',
    suggestion: 'Please contact support if this issue persists.'
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in.',
    suggestion: 'Please contact an administrator for access.'
  },
  Verification: {
    title: 'Verification Failed',
    description: 'The verification token has expired or has already been used.',
    suggestion: 'Please request a new verification link.'
  },
  OAuthSignin: {
    title: 'OAuth Sign-in Error',
    description: 'An error occurred during the OAuth sign-in process.',
    suggestion: 'Please try signing in again or use a different provider.'
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description: 'An error occurred during the OAuth callback.',
    suggestion: 'Please try signing in again.'
  },
  OAuthCreateAccount: {
    title: 'Account Creation Failed',
    description: 'Could not create your account with the OAuth provider.',
    suggestion: 'Please try again or contact support.'
  },
  EmailCreateAccount: {
    title: 'Email Account Creation Failed',
    description: 'Could not create an account with that email address.',
    suggestion: 'The email might already be in use. Try signing in instead.'
  },
  Callback: {
    title: 'Callback Error',
    description: 'An error occurred during the authentication callback.',
    suggestion: 'Please try signing in again.'
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    description: 'This email is already associated with another account.',
    suggestion: 'Please sign in with your original provider or contact support.'
  },
  EmailSignin: {
    title: 'Email Sign-in',
    description: 'Check your email for the sign-in link.',
    suggestion: 'Click the link in your email to complete sign-in.'
  },
  CredentialsSignin: {
    title: 'Invalid Credentials',
    description: 'The credentials you provided are incorrect.',
    suggestion: 'Please check your email and password and try again.'
  },
  SessionRequired: {
    title: 'Session Required',
    description: 'You must be signed in to access this page.',
    suggestion: 'Please sign in to continue.'
  },
  Default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred during authentication.',
    suggestion: 'Please try again or contact support if the issue persists.'
  }
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorInfo = error && errorMessages[error] 
    ? errorMessages[error] 
    : errorMessages.Default

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-600 to-rose-600 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-red-800">
              {errorInfo.title}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {errorInfo.description}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Details */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Suggestion:</strong> {errorInfo.suggestion}
            </p>
            
            {error && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs text-red-600">
                  <strong>Error Code:</strong> {error}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/auth/signin" className="block">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Signing In Again
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </div>

          {/* Support Information */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help?{' '}
              <a 
                href="mailto:support@formcraft.ai" 
                className="text-red-600 hover:text-red-500 underline"
              >
                Contact Support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
