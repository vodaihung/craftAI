'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Github, Mail, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

function SignUpContent() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleSignUp = async (providerId: string) => {
    setIsLoading(providerId)
    try {
      await signIn(providerId, { callbackUrl })
    } catch (error) {
      console.error('Sign up error:', error)
      setIsLoading(null)
    }
  }

  const handleCredentialsSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading('credentials')
    setAuthError('')

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setAuthError('Please fill in all fields')
      setIsLoading(null)
      return
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match')
      setIsLoading(null)
      return
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long')
      setIsLoading(null)
      return
    }

    try {
      const result = await signIn('credentials', {
        name,
        email,
        password,
        action: 'signup',
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        setAuthError(result.error)
        setIsLoading(null)
      } else if (result?.ok) {
        window.location.href = callbackUrl
      }
    } catch (error) {
      console.error('Credentials sign up error:', error)
      setAuthError('An unexpected error occurred')
      setIsLoading(null)
    }
  }

  const getOAuthProviders = () => {
    if (!providers) return []
    return Object.values(providers).filter(provider => provider.id !== 'credentials')
  }

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return <Mail className="w-5 h-5" />
      case 'github':
        return <Github className="w-5 h-5" />
      default:
        return null
    }
  }

  const getProviderColor = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'github':
        return 'bg-gray-900 hover:bg-gray-800 text-white'
      default:
        return 'bg-primary hover:bg-primary/90 text-primary-foreground'
    }
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'OAuthSignin':
        return 'Error occurred during OAuth sign-up. Please try again.'
      case 'OAuthCallback':
        return 'Error occurred during OAuth callback. Please try again.'
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account. Please try again.'
      case 'EmailCreateAccount':
        return 'Could not create account with that email address.'
      case 'Callback':
        return 'Error occurred during callback. Please try again.'
      case 'OAuthAccountNotLinked':
        return 'Email already exists with different provider. Please sign in instead.'
      default:
        return 'An error occurred during sign-up. Please try again.'
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">FC</span>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Join FormCraft AI</CardTitle>
            <p className="text-muted-foreground mt-2">
              Start creating intelligent forms in seconds
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Messages */}
          {(error || authError) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Sign-up Error</p>
                <p className="text-sm text-red-700 mt-1">
                  {authError || (error && getErrorMessage(error))}
                </p>
              </div>
            </div>
          )}

          {/* Manual Sign Up Form */}
          <form onSubmit={handleCredentialsSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading === 'credentials'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading === 'credentials'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading === 'credentials'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading === 'credentials'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading === 'credentials'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading === 'credentials'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
              disabled={isLoading === 'credentials'}
            >
              {isLoading === 'credentials' ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : null}
              Create Account
            </Button>
          </form>



          {/* Divider */}
          {getOAuthProviders().length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or sign up with
                </span>
              </div>
            </div>
          )}

          {/* OAuth Providers */}
          {getOAuthProviders().length > 0 && (
            <div className="space-y-3">
              {getOAuthProviders().map((provider) => (
                <Button
                  key={provider.name}
                  variant="outline"
                  className={`w-full h-12 ${getProviderColor(provider.id)} border-0 font-medium`}
                  onClick={() => handleSignUp(provider.id)}
                  disabled={isLoading === provider.id}
                >
                  {isLoading === provider.id ? (
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  ) : (
                    <>
                      {getProviderIcon(provider.id)}
                      <span className="ml-3">Sign up with {provider.name}</span>
                    </>
                  )}
                </Button>
              ))}
            </div>
          )}

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                href="/auth/signin" 
                className="font-medium text-green-600 hover:text-green-500 underline"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Terms and Privacy */}
          <div className="text-center text-xs text-muted-foreground">
            <p>
              By signing up, you agree to our{' '}
              <a href="#" className="underline hover:text-foreground">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="underline hover:text-foreground">
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Loading...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
