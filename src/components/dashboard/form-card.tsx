'use client'

import { memo, Suspense, lazy } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Eye,
  Edit,
  Trash2,
  Share,
  BarChart3,
  Calendar,
  Users,
  Globe,
  Lock,
  Bot,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import type { Form } from '@/lib/db/schema'

// Lazy load components
const RealTimeNotifications = lazy(() => import('@/components/real-time-notifications').then(m => ({ default: m.RealTimeNotifications })))
const ShareFormModal = lazy(() => import('@/components/share-form-modal').then(m => ({ default: m.ShareFormModal })))

interface FormWithStats extends Form {
  responseCount?: number
}

interface FormCardProps {
  form: FormWithStats
  actionLoading: Record<string, boolean>
  onDelete: (formId: string, formName: string) => void
  onTogglePublish: (formId: string, isCurrentlyPublished: boolean) => void
  onTroubleshoot: (formId: string, formName: string) => void
  onRefreshForms: () => void
}

function FormCardComponent({
  form,
  actionLoading,
  onDelete,
  onTogglePublish,
  onTroubleshoot,
  onRefreshForms
}: FormCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
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
                    onNewResponse={onRefreshForms}
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
              onClick={() => onTroubleshoot(form.id, form.name)}
            >
              <Bot className="w-4 h-4 mr-1" />
              Troubleshoot
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTogglePublish(form.id, form.isPublished)}
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
                onPublishToggle={() => onTogglePublish(form.id, form.isPublished)}
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
              onClick={() => onDelete(form.id, form.name)}
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
  )
}

// Memoize the component to prevent unnecessary re-renders
export const FormCard = memo(FormCardComponent)
