'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileX, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Settings
} from 'lucide-react'

interface RestrictedForm {
  id: string
  title: string
  createdAt: string
  restrictedFields: {
    id: string
    label: string
    allowedTypes: string[]
    maxSize: number
  }[]
}

interface ApiResponse {
  success: boolean
  message: string
  totalForms: number
  formsWithRestrictions: number
  forms: RestrictedForm[]
}

export default function FileUploadsAdminPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [fixing, setFixing] = useState(false)
  const [fixResult, setFixResult] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/fix-file-uploads')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fixAllRestrictions = async () => {
    setFixing(true)
    setFixResult(null)
    try {
      const response = await fetch('/api/admin/fix-file-uploads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ removeAll: true })
      })
      const result = await response.json()
      setFixResult(result)
      
      // Reload data to show updated state
      await loadData()
    } catch (error) {
      console.error('Error fixing restrictions:', error)
      setFixResult({
        success: false,
        error: 'Failed to fix file upload restrictions'
      })
    } finally {
      setFixing(false)
    }
  }

  const fixSpecificForm = async (formId: string) => {
    try {
      const response = await fetch('/api/admin/fix-file-uploads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ formIds: [formId] })
      })
      const result = await response.json()
      
      if (result.success) {
        // Reload data to show updated state
        await loadData()
      }
    } catch (error) {
      console.error('Error fixing form:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getFileTypeDescription = (allowedTypes: string[]) => {
    if (!allowedTypes || allowedTypes.length === 0) {
      return 'All file types'
    }
    
    return allowedTypes.map(type => {
      if (type.endsWith('/*')) return type
      return type.split('/')[1] || type
    }).join(', ')
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">File Upload Management</h1>
        <p className="text-muted-foreground">
          Manage file type restrictions across all forms
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : data ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{data.totalForms}</div>
                <div className="text-sm text-muted-foreground">Total Forms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{data.formsWithRestrictions}</div>
                <div className="text-sm text-muted-foreground">With Restrictions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{data.totalForms - data.formsWithRestrictions}</div>
                <div className="text-sm text-muted-foreground">Unrestricted</div>
              </div>
            </div>
          ) : (
            <div>No data loaded</div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            {data && data.formsWithRestrictions > 0 && (
              <Button 
                onClick={fixAllRestrictions} 
                disabled={fixing}
                className="bg-green-600 hover:bg-green-700"
              >
                {fixing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Fix All Restrictions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fix Result */}
      {fixResult && (
        <Alert className={fixResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {fixResult.success ? (
              <div>
                <strong>Success!</strong> {fixResult.message}
                {fixResult.summary && (
                  <div className="mt-2 text-sm">
                    Updated: {fixResult.summary.updated}, Failed: {fixResult.summary.failed}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <strong>Error:</strong> {fixResult.error}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Forms with Restrictions */}
      {data && data.forms && data.forms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileX className="h-5 w-5" />
              Forms with File Type Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.forms.map((form) => (
                <div key={form.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{form.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(form.createdAt).toLocaleDateString()}
                      </p>
                      
                      <div className="mt-2 space-y-2">
                        {form.restrictedFields.map((field) => (
                          <div key={field.id} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{field.label}</Badge>
                            <span className="text-muted-foreground">
                              Max: {field.maxSize}MB, Types: {getFileTypeDescription(field.allowedTypes)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => fixSpecificForm(form.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Fix This Form
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Fix File Upload Restrictions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Option 1: Fix All Forms (Recommended)</h4>
            <p className="text-sm text-muted-foreground">
              Click "Fix All Restrictions" to remove file type restrictions from all forms. 
              This will allow users to upload any file type (except dangerous executables).
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Option 2: Fix Individual Forms</h4>
            <p className="text-sm text-muted-foreground">
              Use "Fix This Form" button next to specific forms to remove restrictions from just that form.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">What Gets Changed</h4>
            <p className="text-sm text-muted-foreground">
              File fields will be updated to allow all file types (allowedTypes = []), 
              increase max file size to 50MB, and enable multiple file uploads.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Security</h4>
            <p className="text-sm text-muted-foreground">
              Dangerous executable files (.exe, .bat, .sh, etc.) are still blocked for security reasons.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
