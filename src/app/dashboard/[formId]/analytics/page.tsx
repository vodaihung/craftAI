'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FormAnalytics } from '@/components/form-analytics'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface AnalyticsPageProps {
  params: Promise<{ formId: string }>
}

interface FormData {
  id: string
  name: string
  schema: any
  isPublished: boolean
  createdAt: string
}

export default function FormAnalyticsPage({ params }: AnalyticsPageProps) {
  const { user, status } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedParams, setResolvedParams] = useState<{ formId: string } | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && resolvedParams) {
      fetchFormData()
    }
  }, [status, router, resolvedParams])

  const fetchFormData = async () => {
    if (!resolvedParams) return

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/forms/${resolvedParams.formId}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch form')
      }

      setFormData(result.form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch form')
      console.error('Error fetching form:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect in useEffect
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Form</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={fetchFormData}>Try Again</Button>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!formData || !resolvedParams) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Form Not Found</h3>
          <p className="text-muted-foreground mb-4">The requested form could not be found.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">Form Analytics</h1>
                <p className="text-sm text-muted-foreground">
                  Detailed insights for "{formData.name}"
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link href={`/dashboard/${resolvedParams.formId}/responses`}>
                <Button variant="outline" size="sm">
                  View Responses
                </Button>
              </Link>
              {formData.isPublished && (
                <Link href={`/forms/${resolvedParams.formId}`} target="_blank">
                  <Button variant="outline" size="sm">
                    Preview Form
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <FormAnalytics 
          formId={resolvedParams.formId} 
          formName={formData.name} 
        />
      </main>
    </div>
  )
}
