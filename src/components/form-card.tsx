'use client'

import React, { memo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShareFormModal } from '@/components/share-form-modal'
import { 
  Eye, 
  Edit, 
  Trash2, 
  Share, 
  BarChart3, 
  Calendar, 
  Users, 
  Globe,
  Loader2,
  MessageSquare,
  Settings
} from 'lucide-react'

interface FormWithStats {
  id: string
  name: string
  description: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  _count: {
    responses: number
  }
}

interface FormCardProps {
  form: FormWithStats
  actionLoading: Record<string, boolean>
  onDelete: (formId: string, formName: string) => void
  onTogglePublish: (formId: string, isCurrentlyPublished: boolean) => void
  onTroubleshoot: (formId: string, formName: string) => void
  formatDate: (dateString: string) => string
}

export const FormCard = memo(function FormCard({
  form,
  actionLoading,
  onDelete,
  onTogglePublish,
  onTroubleshoot,
  formatDate
}: FormCardProps) {
  return (
    <Card key={form.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{form.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {form.description}
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-2">
              <Badge variant={form.isPublished ? 'default' : 'secondary'}>
                {form.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{form._count.responses}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(form.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/forms/${form.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            </Link>

            <Link href={`/forms/${form.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </Link>

            <Link href={`/dashboard/${form.id}/analytics`}>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-1" />
                Analytics
              </Button>
            </Link>
            
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

            <ShareFormModal
              formId={form.id}
              formName={form.name}
              isPublished={form.isPublished}
              trigger={
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-1" />
                  Share
                </Button>
              }
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => onTroubleshoot(form.id, form.name)}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Troubleshoot
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
})

// Performance optimization: Only re-render if form data or loading states change
FormCard.displayName = 'FormCard'
