'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Globe, Users } from 'lucide-react'
import type { Form } from '@/lib/db/schema'

interface FormWithStats extends Form {
  responseCount?: number
}

interface DashboardStatsProps {
  forms: FormWithStats[]
}

export function DashboardStats({ forms }: DashboardStatsProps) {
  const totalForms = forms.length
  const publishedForms = forms.filter(f => f.isPublished).length
  const draftForms = forms.filter(f => !f.isPublished).length
  const totalResponses = forms.reduce((sum, form) => sum + (form.responseCount || 0), 0)

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalForms}</div>
          <p className="text-xs text-muted-foreground">
            {publishedForms} published
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Published Forms</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{publishedForms}</div>
          <p className="text-xs text-muted-foreground">
            {draftForms} drafts
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalResponses}</div>
          <p className="text-xs text-muted-foreground">
            Across all forms
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
