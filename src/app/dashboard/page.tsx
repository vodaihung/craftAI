'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardLoading } from '@/components/loading'
import ErrorBoundary from '@/components/error-boundary'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { FormsList } from '@/components/dashboard/forms-list'
import { TroubleshootChat } from '@/components/troubleshoot-chat'
import { SubscriptionManager } from '@/components/subscription-manager'
import { useAlertModal } from '@/components/ui/alert-modal'
import { FileText } from 'lucide-react'
import type { Form } from '@/lib/db/schema'

interface FormWithStats extends Form {
  responseCount?: number
}

export default function DashboardPage() {
  const { status } = useAuth()
  const router = useRouter()
  const { showAlert, AlertModal } = useAlertModal()
  const [forms, setForms] = useState<FormWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [troubleshootFormId, setTroubleshootFormId] = useState<string | null>(null)
  const [troubleshootFormName, setTroubleshootFormName] = useState<string>('')
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false)
  const [currentTier, setCurrentTier] = useState('free')
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const fetchForms = useCallback(async () => {
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
  }, [])

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

    // Fetch forms if authenticated - removed session dependency to prevent infinite loop
    if (status === 'authenticated') {
      // Define the fetch function inline to avoid dependency issues
      const loadForms = async () => {
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

      loadForms()
      fetchUserSubscriptionTier()
    }
  }, [status, router]) // Removed session from dependencies to prevent infinite loop

  const fetchUserSubscriptionTier = async () => {
    try {
      const response = await fetch('/api/subscription')
      const result = await response.json()
      if (result.subscriptionTier) {
        setCurrentTier(result.subscriptionTier)
      }
    } catch (error) {
      console.error('Failed to fetch subscription tier:', error)
      // Default to free tier on error
      setCurrentTier('free')
    }
  }

  const handleDeleteForm = async (formId: string, formName: string) => {
    showAlert('confirm', `Are you sure you want to delete "${formName}"? This action cannot be undone.`, {
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const actionKey = `delete-${formId}`
        try {
          setActionLoading(prev => ({ ...prev, [actionKey]: true }))

          const response = await fetch(`/api/forms/${formId}`, {
            method: 'DELETE'
          })

          const result = await response.json()

          if (result.success) {
            setForms(forms.filter(form => form.id !== formId))
            showAlert('success', 'Form deleted successfully!')
          } else {
            showAlert('error', `Failed to delete form: ${result.error}`)
          }
        } catch (error) {
          console.error('Error deleting form:', error)
          showAlert('error', 'Failed to delete form. Please try again.')
        } finally {
          setActionLoading(prev => ({ ...prev, [actionKey]: false }))
        }
      }
    })
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
        showAlert('success', result.message)
      } else {
        showAlert('error', `Failed to ${isCurrentlyPublished ? 'unpublish' : 'publish'} form: ${result.error}`)
      }
    } catch (error) {
      console.error('Error toggling publish status:', error)
      showAlert('error', 'Failed to update form status. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
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
      <DashboardHeader
        currentTier={currentTier}
        onShowSubscriptionManager={() => setShowSubscriptionManager(true)}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <DashboardStats forms={forms} />

        <FormsList
          forms={forms}
          actionLoading={actionLoading}
          onDeleteForm={handleDeleteForm}
          onTogglePublish={handleTogglePublish}
          onTroubleshoot={(formId, formName) => {
            setTroubleshootFormId(formId)
            setTroubleshootFormName(formName)
          }}
          onRefreshForms={fetchForms}
        />
      </main>

      {/* Troubleshoot Modal */}
      {troubleshootFormId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl h-[80vh] flex flex-col">
            <TroubleshootChat
              formId={troubleshootFormId}
              formName={troubleshootFormName}
              onClose={() => {
                setTroubleshootFormId(null)
                setTroubleshootFormName('')
              }}
              className="flex-1"
            />
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

              <SubscriptionManager
                currentTier={currentTier}
                formsCount={forms.length}
                responsesCount={forms.reduce((sum, form) => sum + (form.responseCount || 0), 0)}
                onUpgrade={(tierId) => {
                  setCurrentTier(tierId)
                  setShowSubscriptionManager(false)
                  // Refresh subscription tier from server to ensure consistency
                  fetchUserSubscriptionTier()
                }}
                onClose={() => setShowSubscriptionManager(false)}
              />
            </div>
          </div>
        </div>
      )}
      <AlertModal />
      </div>
    </ErrorBoundary>
  )
}
