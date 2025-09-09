'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Download, 
  Search, 
  Filter,
  Calendar,
  Users,
  Eye,
  Trash2
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
  params: {
    formId: string
  }
}

export default function ResponsesPage({ params }: ResponsesPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState<FormWithResponses | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResponses, setSelectedResponses] = useState<string[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (status === 'authenticated') {
      fetchFormResponses()
    }
  }, [status, router, params.formId])

  const fetchFormResponses = async () => {
    try {
      setIsLoading(true)
      
      // Fetch form details
      const formResponse = await fetch(`/api/forms/${params.formId}`)
      const formResult = await formResponse.json()
      
      if (!formResult.success) {
        throw new Error(formResult.error || 'Failed to fetch form')
      }

      // Fetch responses
      const responsesResponse = await fetch(`/api/forms/${params.formId}/responses?includeData=true`)
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
              <Card key={response.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">
                          Response #{response.id.slice(-8)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(response.submittedAt)}
                        </span>
                      </div>
                      
                      <div className="grid gap-2">
                        {formData.schema?.fields?.map((field: any) => (
                          <div key={field.id} className="flex items-start space-x-2">
                            <span className="text-sm font-medium min-w-[120px]">
                              {field.label}:
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {response.data[field.id] || 'No response'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-1" />
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
    </div>
  )
}
