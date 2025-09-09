'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus } from 'lucide-react'
import Link from 'next/link'
import { FormCard } from './form-card'
import type { Form } from '@/lib/db/schema'

interface FormWithStats extends Form {
  responseCount?: number
}

interface FormsListProps {
  forms: FormWithStats[]
  actionLoading: Record<string, boolean>
  onDeleteForm: (formId: string, formName: string) => void
  onTogglePublish: (formId: string, isCurrentlyPublished: boolean) => void
  onTroubleshoot: (formId: string, formName: string) => void
  onRefreshForms: () => void
}

function FormsListComponent({
  forms,
  actionLoading,
  onDeleteForm,
  onTogglePublish,
  onTroubleshoot,
  onRefreshForms
}: FormsListProps) {
  if (forms.length === 0) {
    return (
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
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Forms</h2>
        <div className="text-sm text-muted-foreground">
          {forms.length} form{forms.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="grid gap-4">
        {forms.map((form) => (
          <FormCard
            key={form.id}
            form={form}
            actionLoading={actionLoading}
            onDelete={onDeleteForm}
            onTogglePublish={onTogglePublish}
            onTroubleshoot={onTroubleshoot}
            onRefreshForms={onRefreshForms}
          />
        ))}
      </div>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const FormsList = memo(FormsListComponent)
