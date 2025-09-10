'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { ChatInterface } from '@/components/chat-interface'
import { FormPreview } from '@/components/form-preview'
import { TemplateSelector } from '@/components/template-selector'
import { ChatErrorBoundary, FormErrorBoundary } from '@/components/error-boundary'
import { UserMenu } from '@/components/user-menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Share } from 'lucide-react'
import Link from 'next/link'
import type { FormSchema } from '@/lib/db/schema'

export default function CreateFormPage() {
  const { user, status } = useAuth()
  const router = useRouter()
  const [currentFormSchema, setCurrentFormSchema] = useState<FormSchema | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formsCount, setFormsCount] = useState(0)
  const [currentTier] = useState('free') // This would come from user data in a real app
  const [showTemplates, setShowTemplates] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchFormsCount()
    }
  }, [status, router])

  const fetchFormsCount = async () => {
    try {
      const response = await fetch('/api/forms')
      const result = await response.json()
      if (result.success) {
        setFormsCount(result.forms.length)
      }
    } catch (error) {
      console.error('Failed to fetch forms count:', error)
    }
  }

  const handleFormGenerated = (formSchema: FormSchema) => {
    // Check form limits for free tier
    if (currentTier === 'free' && formsCount >= 3) {
      alert('You\'ve reached the limit of 3 forms on the free plan. Please upgrade to create more forms.')
      return
    }

    setCurrentFormSchema(formSchema)
    setShowTemplates(false) // Hide templates once form is generated
  }

  const handleTemplateSelect = (template: any) => {
    if (template.id === 'blank') {
      setCurrentFormSchema(template.schema)
      setShowTemplates(false)
    } else {
      // Use template as starting point
      setCurrentFormSchema(template.schema)
      setShowTemplates(false)
    }
  }

  const handleSaveForm = async () => {
    if (!currentFormSchema) return

    setIsSaving(true)
    try {
      console.log('Saving form:', currentFormSchema)

      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentFormSchema.title,
          schema: currentFormSchema,
          isPublished: false
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update the form schema with the saved form ID
        setCurrentFormSchema(prev => prev ? { ...prev, id: result.form.id } : null)
        alert(`Form "${result.form.name}" saved successfully! You can now share it or find it in your dashboard.`)
        setFormsCount(prev => prev + 1) // Update local count
        // Don't redirect immediately - let user share if they want
      } else {
        throw new Error(result.error || 'Failed to save form')
      }
    } catch (error) {
      console.error('Failed to save form:', error)
      alert(`Failed to save form: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleShareForm = async () => {
    if (!currentFormSchema) return

    // First save the form if it hasn't been saved yet
    if (!currentFormSchema.id) {
      alert('Please save your form first before sharing.')
      return
    }

    // Show sharing modal with public URL
    const publicUrl = `${window.location.origin}/forms/${currentFormSchema.id}`

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(publicUrl)
      alert(`Form URL copied to clipboard!\n\n${publicUrl}\n\nShare this link with anyone to collect responses.`)
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      prompt('Copy this URL to share your form:', publicUrl)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              {!showTemplates && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplates(true)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Templates
                </Button>
              )}
              <div>
                <h1 className="text-xl font-semibold">
                  {showTemplates ? 'Choose Template' : 'Create New Form'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {showTemplates
                    ? 'Start with a template or create from scratch'
                    : 'Describe your form and watch AI create it instantly'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleShareForm}
                disabled={!currentFormSchema}
              >
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={handleSaveForm}
                disabled={!currentFormSchema || isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Form'}
              </Button>

              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {showTemplates ? (
          /* Template Selection */
          <TemplateSelector onTemplateSelect={handleTemplateSelect} />
        ) : (
          /* Form Builder */
          <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            {/* Chat Interface */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">AI</span>
                    </div>
                    <span>Form Builder Assistant</span>
                  </CardTitle>
                </CardHeader>
              </Card>

              <ChatErrorBoundary>
                <ChatInterface
                  onFormGenerated={handleFormGenerated}
                  currentFormSchema={currentFormSchema}
                  formAnalytics={currentFormSchema ? {
                    responseCount: 0, // TODO: Get from actual analytics
                    completionRate: 0, // TODO: Get from actual analytics
                    averageTimeToComplete: undefined
                  } : null}
                  className="flex-1"
                />
              </ChatErrorBoundary>
            </div>

            {/* Form Preview */}
            <div className="space-y-4">
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

              <FormErrorBoundary>
                <FormPreview
                  formSchema={currentFormSchema}
                  className="flex-1"
                />
              </FormErrorBoundary>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
