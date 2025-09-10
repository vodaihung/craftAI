'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/file-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface FileInfo {
  id: string
  originalName: string
  filename: string
  size: number
  type: string
  uploadedAt: string
  url: string
  extension?: string
  sizeFormatted?: string
}

export default function TestUploadPage() {
  const [allFiles, setAllFiles] = useState<FileInfo[]>([])
  const [imageFiles, setImageFiles] = useState<FileInfo[]>([])
  const [documentFiles, setDocumentFiles] = useState<FileInfo[]>([])

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">File Upload Test Page</h1>
        <p className="text-muted-foreground">
          Test the enhanced file upload functionality with comprehensive file type support
        </p>
        <Badge variant="outline" className="text-green-600">
          ✅ All File Types Supported (except dangerous executables)
        </Badge>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
        {/* All File Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All File Types</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload any file type (max 10MB)
            </p>
          </CardHeader>
          <CardContent>
            <FileUpload
              fieldId="all-files"
              formId="test-form"
              label="Upload Any File"
              multiple={true}
              maxSize={10}
              allowedTypes={[]}
              value={allFiles}
              onChange={setAllFiles}
            />
          </CardContent>
        </Card>

        {/* Images Only */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Images Only</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload image files only (max 5MB)
            </p>
          </CardHeader>
          <CardContent>
            <FileUpload
              fieldId="image-files"
              formId="test-form"
              label="Upload Images"
              multiple={true}
              maxSize={5}
              allowedTypes={['image/*']}
              value={imageFiles}
              onChange={setImageFiles}
            />
          </CardContent>
        </Card>

        {/* Documents Only */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documents Only</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload PDF, Word, Excel files (max 20MB)
            </p>
          </CardHeader>
          <CardContent>
            <FileUpload
              fieldId="document-files"
              formId="test-form"
              label="Upload Documents"
              multiple={true}
              maxSize={20}
              allowedTypes={[
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              ]}
              value={documentFiles}
              onChange={setDocumentFiles}
            />
          </CardContent>
        </Card>
      </div>

      {/* Upload Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{allFiles.length}</div>
              <div className="text-sm text-muted-foreground">All Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{imageFiles.length}</div>
              <div className="text-sm text-muted-foreground">Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{documentFiles.length}</div>
              <div className="text-sm text-muted-foreground">Documents</div>
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            <h4 className="font-medium">Features Tested:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">✅ All file types</Badge>
              <Badge variant="outline">✅ File type restrictions</Badge>
              <Badge variant="outline">✅ Size limits</Badge>
              <Badge variant="outline">✅ Multiple files</Badge>
              <Badge variant="outline">✅ Drag & drop</Badge>
              <Badge variant="outline">✅ Security validation</Badge>
              <Badge variant="outline">✅ Error handling</Badge>
              <Badge variant="outline">✅ Progress indicators</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Test All File Types:</h4>
            <p className="text-sm text-muted-foreground">
              Try uploading various file types: images, documents, archives, audio, video, code files, etc.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">2. Test Restrictions:</h4>
            <p className="text-sm text-muted-foreground">
              Try uploading non-image files to the "Images Only" section - should be rejected.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">3. Test Size Limits:</h4>
            <p className="text-sm text-muted-foreground">
              Try uploading files larger than the specified limits - should be rejected.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">4. Test Security:</h4>
            <p className="text-sm text-muted-foreground">
              Try uploading executable files (.exe, .js, .bat) - should be blocked for security.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
