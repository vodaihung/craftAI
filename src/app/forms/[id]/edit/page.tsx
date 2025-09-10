'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { ChatInterface } from '@/components/chat-interface'
import { FormPreview } from '@/components/form-preview'
import { ChatErrorBoundary, FormErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertModal, useAlertModal } from '@/components/ui/alert-modal'
import { ArrowLeft, Save, Share, Eye } from 'lucide-react'
import Link from 'next/link'
import type { FormSchema } from '@/lib/db/schema'

interface EditFormPageProps {
  params: Promise<{ id: string }>
}

export default function EditFormPage({ params }: EditFormPageProps) {
  const { user, status } = useAuth()
  const router = useRouter()
  const [formId, setFormId] = useState<string | null>(null)
  const [currentFormSchema, setCurrentFormSchema] = useState<FormSchema | null>(null)
  const [originalForm, setOriginalForm] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showAlert, AlertModal: AlertModalComponent } = useAlertModal()

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => setFormId(id))
  }, [params])

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const loadFormData = useCallback(async () => {
    if (!formId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/forms/${formId}`)
      const result = await response.json()

      if (result.success) {
        setOriginalForm(result.form)
        setCurrentFormSchema(result.form.schema)
      } else {
        setError(result.error || 'Failed to load form')
      }
    } catch (error) {
      console.error('Failed to load form:', error)
      setError('Failed to load form')
    } finally {
      setIsLoading(false)
    }
  }, [formId])

  // Load form data
  useEffect(() => {
    if (status === 'authenticated' && formId) {
      loadFormData()
    }
  }, [status, formId, loadFormData])

  const handleFormGenerated = (formSchema: FormSchema) => {
    setCurrentFormSchema(formSchema)
  }

  const handleSaveForm = async () => {
    if (!currentFormSchema || !formId) return

    setIsSaving(true)
    try {
      console.log('Updating form:', currentFormSchema)

      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentFormSchema.title,
          schema: currentFormSchema
        })
      })

      const result = await response.json()

      if (result.success) {
        setOriginalForm(result.form)
        showAlert('success', 'Form Saved', `Form "${result.form.name}" updated successfully!`)
      } else {
        throw new Error(result.error || 'Failed to update form')
      }
    } catch (error) {
      console.error('Failed to save form:', error)
      showAlert('error', 'Save Failed', `Failed to save form: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleShareForm = () => {
    if (!originalForm) return
    
    if (originalForm.isPublished) {
      const formUrl = `${window.location.origin}/forms/${formId}`
      navigator.clipboard.writeText(formUrl)
      showAlert('success', 'URL Copied', 'Form URL copied to clipboard!')
    } else {
      showAlert('warning', 'Form Not Published', 'Please publish the form first to share it.')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!originalForm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Form Not Found</h1>
          <p className="text-muted-foreground mb-4">The form you're looking for doesn't exist or you don't have permission to edit it.</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
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
                <h1 className="text-xl font-semibold">Edit Form</h1>
                <p className="text-sm text-muted-foreground">
                  Modify "{originalForm.name}" using AI assistance
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {originalForm.isPublished && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/forms/${formId}`} target="_blank">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleShareForm}
                disabled={!originalForm.isPublished}
              >
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={handleSaveForm}
                disabled={!currentFormSchema || isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chat Interface */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">AI</span>
                  </div>
                  <span>Form Editor Assistant</span>
                </CardTitle>
              </CardHeader>
            </Card>

            <ChatErrorBoundary>
              <ChatInterface
                onFormGenerated={handleFormGenerated}
                currentFormSchema={currentFormSchema}
                formAnalytics={{
                  responseCount: originalForm._count?.responses || 0,
                  completionRate: 85, // TODO: Calculate from actual data
                  averageTimeToComplete: undefined
                }}
                className="flex-1"
              />
            </ChatErrorBoundary>
          </div>

          {/* Form Preview - Sticky */}
          <div className="relative">
            <div className="sticky top-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">📝</span>
                    </div>
                    <span>Live Preview</span>
                  </CardTitle>
                </CardHeader>
              </Card>

              <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
                <FormErrorBoundary>
                  <FormPreview
                    formSchema={currentFormSchema}
                    className=""
                  />
                </FormErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Alert Modal */}
      <AlertModalComponent />
    </div>
  )
}
