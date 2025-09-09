'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  ArrowLeft,
  Download,
  Search,
  Filter,
  Calendar,
  Users,
  Eye,
  Trash2,
  Loader2,
  X,
  FileText,
  ExternalLink,
  Image
} from 'lucide-react'
import Link from 'next/link'

interface FormResponse {
  id: string
  formId: string
  data: Record<string, any>
  submittedAt: string
}

interface FormWithResponses {
  id: string
  name: string
  schema: any
  responses: FormResponse[]
  totalResponses: number
}

interface ResponsesPageProps {
  params: Promise<{ formId: string }>
}

export default function ResponsesPage({ params }: ResponsesPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState<FormWithResponses | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResponses, setSelectedResponses] = useState<string[]>([])
  const [resolvedParams, setResolvedParams] = useState<{ formId: string } | null>(null)
  const [viewingResponse, setViewingResponse] = useState<any>(null)
  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && resolvedParams) {
      fetchFormResponses()
    }
  }, [status, router, resolvedParams])

  const fetchFormResponses = async () => {
    if (!resolvedParams) return

    try {
      setIsLoading(true)

      // Fetch form details
      const formResponse = await fetch(`/api/forms/${resolvedParams.formId}`)
      const formResult = await formResponse.json()

      if (!formResult.success) {
        throw new Error(formResult.error || 'Failed to fetch form')
      }

      // Fetch responses
      const responsesResponse = await fetch(`/api/forms/${resolvedParams.formId}/responses?includeData=true`)
      const responsesResult = await responsesResponse.json()

      if (!responsesResult.success) {
        throw new Error(responsesResult.error || 'Failed to fetch responses')
      }

      setFormData({
        ...formResult.form,
        responses: responsesResult.responses,
        totalResponses: responsesResult.total
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      console.error('Error fetching form responses:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewResponse = (response: any) => {
    setViewingResponse(response)
  }

  const handleDeleteResponse = async (responseId: string) => {
    if (!resolvedParams) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this response? This action cannot be undone.'
    )

    if (!confirmed) return

    setDeletingResponseId(responseId)

    try {
      const response = await fetch(`/api/forms/${resolvedParams.formId}/responses/${responseId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete response')
      }

      // Remove the response from local state
      setFormData(prev => prev ? {
        ...prev,
        responses: prev.responses.filter(r => r.id !== responseId),
        totalResponses: prev.totalResponses - 1
      } : null)

    } catch (err) {
      console.error('Error deleting response:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete response')
    } finally {
      setDeletingResponseId(null)
    }
  }

  const handleExportResponses = async () => {
    if (!formData) return

    try {
      const csvContent = generateCSV(formData.responses, formData.schema)
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formData.name}-responses.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export responses')
    }
  }

  const generateCSV = (responses: FormResponse[], schema: any) => {
    if (!schema?.fields || responses.length === 0) return ''

    const headers = ['Submission Date', ...schema.fields.map((field: any) => field.label)]
    const rows = responses.map(response => [
      new Date(response.submittedAt).toLocaleString(),
      ...schema.fields.map((field: any) => response.data[field.id] || '')
    ])

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
  }

  const filteredResponses = formData?.responses.filter(response => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return Object.values(response.data).some(value => 
      String(value).toLowerCase().includes(searchLower)
    ) || new Date(response.submittedAt).toLocaleDateString().includes(searchLower)
  }) || []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading responses...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Responses</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchFormResponses}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Form Not Found</h3>
            <p className="text-muted-foreground mb-4">The requested form could not be found.</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
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
                <h1 className="text-xl font-semibold">{formData.name} - Responses</h1>
                <p className="text-sm text-muted-foreground">
                  {formData.totalResponses} total responses
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleExportResponses}
                disabled={formData.responses.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
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
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formData.totalResponses}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formData.responses.filter(r => 
                  new Date(r.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Response</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {formData.responses.length > 0 
                  ? formatDate(formData.responses[0].submittedAt)
                  : 'No responses yet'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search responses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Responses List */}
        {filteredResponses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-muted-foreground mb-4">
                <Users className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {formData.totalResponses === 0 ? 'No responses yet' : 'No matching responses'}
                </h3>
                <p className="text-sm">
                  {formData.totalResponses === 0 
                    ? 'Share your form to start collecting responses'
                    : 'Try adjusting your search criteria'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResponses.map((response) => (
              <Card key={response.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary/60">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{response.id.slice(-8)}
                        </Badge>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(response.submittedAt)}</span>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {formData.schema?.fields?.slice(0, 4).map((field: any) => {
                          const value = response.data[field.id]
                          let displayValue = 'No response'
                          let displayIcon = null

                          if (value) {
                            if (field.type === 'file' && Array.isArray(value)) {
                              // Handle file uploads
                              const hasImages = value.some((file: any) => file.type && file.type.startsWith('image/'))
                              displayValue = value.length > 0
                                ? `${value.length} file${value.length > 1 ? 's' : ''} uploaded`
                                : 'No files'
                              displayIcon = hasImages
                                ? <Image className="w-3 h-3 text-green-500" />
                                : <FileText className="w-3 h-3 text-blue-500" />
                            } else if (field.type === 'select' && Array.isArray(value)) {
                              // Handle multi-select
                              displayValue = value.join(', ')
                            } else if (typeof value === 'object') {
                              // Handle other objects by converting to JSON
                              displayValue = JSON.stringify(value)
                            } else {
                              // Handle primitive values
                              displayValue = String(value)
                            }
                          }

                          return (
                            <div key={field.id} className="flex items-start space-x-3 py-1">
                              <div className="flex items-center space-x-1 min-w-[140px]">
                                {displayIcon}
                                <span className="text-sm font-medium text-foreground/80">
                                  {field.label}:
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground flex-1 truncate">
                                {displayValue}
                              </span>
                            </div>
                          )
                        })}
                        {formData.schema?.fields?.length > 4 && (
                          <div className="text-xs text-muted-foreground pt-1 border-t">
                            +{formData.schema.fields.length - 4} more fields
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewResponse(response)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteResponse(response.id)}
                        disabled={deletingResponseId === response.id}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        {deletingResponseId === response.id ? (
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
        )}
      </main>

      {/* Response View Modal */}
      <Dialog open={!!viewingResponse} onOpenChange={() => setViewingResponse(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Response Details</span>
              <Badge variant="outline">
                #{viewingResponse?.id.slice(-8)}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {viewingResponse && (
            <div className="space-y-6">
              {/* Response Metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Submitted At</span>
                  <p className="text-sm">{formatDate(viewingResponse.submittedAt)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Response ID</span>
                  <p className="text-sm font-mono">{viewingResponse.id}</p>
                </div>
              </div>

              {/* Response Data */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Form Responses</h3>
                <div className="grid gap-4">
                  {formData?.schema?.fields?.map((field: any) => {
                    const value = viewingResponse.data[field.id]

                    return (
                      <Card key={field.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{field.label}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {field.type}
                            </Badge>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            {field.type === 'file' && Array.isArray(value) ? (
                              value.length > 0 ? (
                                <div className="space-y-3">
                                  {value.map((file: any, index: number) => {
                                    const isImage = file.type && file.type.startsWith('image/')

                                    return (
                                      <div key={index} className="space-y-2">
                                        {isImage ? (
                                          // Image preview
                                          <div className="space-y-2">
                                            <div className="relative inline-block">
                                              <img
                                                src={file.url}
                                                alt={file.originalName || file.filename}
                                                className="max-w-full max-h-64 rounded-lg border shadow-sm object-contain"
                                                onError={(e) => {
                                                  // Fallback to file display if image fails to load
                                                  e.currentTarget.style.display = 'none'
                                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                                  if (fallback) fallback.style.display = 'flex'
                                                }}
                                              />
                                              {/* Fallback file display (hidden by default) */}
                                              <div className="hidden items-center justify-between p-2 bg-background rounded border">
                                                <div className="flex items-center space-x-2">
                                                  <FileText className="w-4 h-4" />
                                                  <span>{file.originalName || file.filename}</span>
                                                  <Badge variant="outline" className="text-xs">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                                <span>{file.originalName || file.filename}</span>
                                                <Badge variant="outline" className="text-xs">
                                                  {(file.size / 1024).toFixed(1)} KB
                                                </Badge>
                                              </div>
                                              {file.url && (
                                                <Button variant="ghost" size="sm" asChild>
                                                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4" />
                                                  </a>
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          // Non-image file display
                                          <div className="flex items-center justify-between p-2 bg-background rounded border">
                                            <div className="flex items-center space-x-2">
                                              <FileText className="w-4 h-4" />
                                              <span>{file.originalName || file.filename}</span>
                                              <Badge variant="outline" className="text-xs">
                                                {(file.size / 1024).toFixed(1)} KB
                                              </Badge>
                                            </div>
                                            {file.url && (
                                              <Button variant="ghost" size="sm" asChild>
                                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                  <ExternalLink className="w-4 h-4" />
                                                </a>
                                              </Button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No files uploaded</span>
                              )
                            ) : field.type === 'select' && Array.isArray(value) ? (
                              <div className="flex flex-wrap gap-1">
                                {value.map((item: string, index: number) => (
                                  <Badge key={index} variant="outline">{item}</Badge>
                                ))}
                              </div>
                            ) : value ? (
                              <div className="whitespace-pre-wrap break-words">
                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No response</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
