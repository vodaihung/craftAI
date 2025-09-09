'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardLoading } from '@/components/loading'
import { UserMenu } from '@/components/user-menu'
import ErrorBoundary from '@/components/error-boundary'
import { lazy, Suspense } from 'react'

// Lazy load heavy components to improve initial page load
const TroubleshootChat = lazy(() => import('@/components/troubleshoot-chat').then(m => ({ default: m.TroubleshootChat })))
const SubscriptionManager = lazy(() => import('@/components/subscription-manager').then(m => ({ default: m.SubscriptionManager })))
const ShareFormModal = lazy(() => import('@/components/share-form-modal').then(m => ({ default: m.ShareFormModal })))
const RealTimeNotifications = lazy(() => import('@/components/real-time-notifications').then(m => ({ default: m.RealTimeNotifications })))
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Share,
  BarChart3,
  Calendar,
  Users,
  FileText,
  Globe,
  Lock,
  MessageCircle,
  Bot,
  Crown,
  Settings,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import type { Form } from '@/lib/db/schema'

interface FormWithStats extends Form {
  responseCount?: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [forms, setForms] = useState<FormWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [troubleshootFormId, setTroubleshootFormId] = useState<string | null>(null)
  const [troubleshootFormName, setTroubleshootFormName] = useState<string>('')
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false)
  const [currentTier, setCurrentTier] = useState('free')
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Wait for session loading to complete
    if (status === 'loading') {
      return
    }

    // Only redirect if we're definitely unauthenticated AND not loading
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    // Fetch forms if authenticated
    if (status === 'authenticated' && session) {
      fetchForms()
    }
  }, [status, session, router])

  const fetchForms = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/forms')
      const result = await response.json()
      
      if (result.success) {
        setForms(result.forms)
      } else {
        setError(result.error || 'Failed to fetch forms')
      }
    } catch (err) {
      setError('Failed to fetch forms')
      console.error('Error fetching forms:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteForm = async (formId: string, formName: string) => {
    if (!confirm(`Are you sure you want to delete "${formName}"? This action cannot be undone.`)) {
      return
    }

    const actionKey = `delete-${formId}`
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }))

      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setForms(forms.filter(form => form.id !== formId))
        console.log('Form deleted successfully!')
      } else {
        alert(`Failed to delete form: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting form:', error)
      alert('Failed to delete form. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  const handleTogglePublish = async (formId: string, isCurrentlyPublished: boolean) => {
    const actionKey = `publish-${formId}`
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }))

      const endpoint = `/api/forms/${formId}/publish`
      const method = isCurrentlyPublished ? 'DELETE' : 'POST'

      const response = await fetch(endpoint, { method })
      const result = await response.json()

      if (result.success) {
        setForms(forms.map(form =>
          form.id === formId
            ? { ...form, isPublished: !isCurrentlyPublished }
            : form
        ))
        // Use a more subtle notification instead of alert
        console.log(result.message)
      } else {
        alert(`Failed to ${isCurrentlyPublished ? 'unpublish' : 'publish'} form: ${result.error}`)
      }
    } catch (error) {
      console.error('Error toggling publish status:', error)
      alert('Failed to update form status. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <DashboardLoading />
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
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <FileText className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Forms</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchForms}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">FC</span>
                  </div>
                  <span className="text-xl font-bold">FormCraft AI</span>
                </div>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage your forms</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSubscriptionManager(true)}
              >
                <Crown className="w-4 h-4 mr-2" />
                {currentTier === 'free' ? 'Upgrade' : 'Manage Plan'}
              </Button>

              <Link href="/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Form
                </Button>
              </Link>

              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forms.length}</div>
              <p className="text-xs text-muted-foreground">
                {forms.filter(f => f.isPublished).length} published
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Forms</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forms.filter(f => f.isPublished).length}</div>
              <p className="text-xs text-muted-foreground">
                {forms.filter(f => !f.isPublished).length} drafts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {forms.reduce((sum, form) => sum + (form.responseCount || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all forms
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Forms List */}
        {forms.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-muted-foreground mb-4">
                <FileText className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No forms yet</h3>
                <p className="text-sm">Create your first form to get started</p>
              </div>
              <Link href="/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Form
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Forms</h2>
              <div className="text-sm text-muted-foreground">
                {forms.length} form{forms.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="grid gap-4">
              {forms.map((form) => (
                <Card key={form.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <CardTitle className="text-lg">{form.name}</CardTitle>
                          <Badge variant={form.isPublished ? "default" : "secondary"}>
                            {form.isPublished ? (
                              <>
                                <Globe className="w-3 h-3 mr-1" />
                                Published
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 mr-1" />
                                Draft
                              </>
                            )}
                          </Badge>
                        </div>
                        <CardDescription>
                          {form.schema && typeof form.schema === 'object' && 'description' in form.schema 
                            ? (form.schema as any).description 
                            : `${(form.schema as any)?.fields?.length || 0} fields`}
                        </CardDescription>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Created {formatDate(form.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{form.responseCount || 0} responses</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {form.isPublished && (
                          <>
                            <Suspense fallback={<div className="w-8 h-8 animate-pulse bg-muted rounded" />}>
                              <RealTimeNotifications
                                formId={form.id}
                                onNewResponse={fetchForms}
                              />
                            </Suspense>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/forms/${form.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Link>
                            </Button>
                          </>
                        )}
                        
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/${form.id}/responses`}>
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Responses
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTroubleshootFormId(form.id)
                            setTroubleshootFormName(form.name)
                          }}
                        >
                          <Bot className="w-4 h-4 mr-1" />
                          Troubleshoot
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(form.id, form.isPublished)}
                          disabled={actionLoading[`publish-${form.id}`]}
                        >
                          {actionLoading[`publish-${form.id}`] ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Globe className="w-4 h-4 mr-1" />
                          )}
                          {form.isPublished ? 'Unpublish' : 'Publish'}
                        </Button>

                        <Suspense fallback={<Button variant="outline" size="sm" disabled><Share className="w-4 h-4 mr-1" />Share</Button>}>
                          <ShareFormModal
                            formId={form.id}
                            formName={form.name}
                            isPublished={form.isPublished}
                            onPublishToggle={() => handleTogglePublish(form.id, form.isPublished)}
                          >
                            <Button variant="outline" size="sm">
                              <Share className="w-4 h-4 mr-1" />
                              Share
                            </Button>
                          </ShareFormModal>
                        </Suspense>

                        <Link href={`/dashboard/${form.id}/analytics`}>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Analytics
                          </Button>
                        </Link>

                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/forms/${form.id}/edit`}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteForm(form.id, form.name)}
                          disabled={actionLoading[`delete-${form.id}`]}
                        >
                          {actionLoading[`delete-${form.id}`] ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-1" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Troubleshoot Modal */}
      {troubleshootFormId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl h-[80vh] flex flex-col">
            <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              <TroubleshootChat
                formId={troubleshootFormId}
                formName={troubleshootFormName}
                onClose={() => {
                  setTroubleshootFormId(null)
                  setTroubleshootFormName('')
                }}
                className="flex-1"
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Subscription Manager Modal */}
      {showSubscriptionManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Subscription Management</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSubscriptionManager(false)}
                >
                  ×
                </Button>
              </div>

              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                <SubscriptionManager
                  currentTier={currentTier}
                  formsCount={forms.length}
                  responsesCount={forms.reduce((sum, form) => sum + (form.responseCount || 0), 0)}
                  onUpgrade={(tierId) => {
                    setCurrentTier(tierId)
                    setShowSubscriptionManager(false)
                  }}
                  onClose={() => setShowSubscriptionManager(false)}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  )
}
