'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  X, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface FileUploadProps {
  fieldId: string
  formId: string
  label: string
  required?: boolean
  multiple?: boolean
  maxSize?: number // in MB
  allowedTypes?: string[]
  value?: FileInfo[]
  onChange: (files: FileInfo[]) => void
  className?: string
}

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

export function FileUpload({
  fieldId,
  formId,
  label,
  required = false,
  multiple = false,
  maxSize = 10,
  allowedTypes = [],
  value = [],
  onChange,
  className = ''
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const filesToUpload = Array.from(files)

    // Validate file count
    if (!multiple && filesToUpload.length > 1) {
      setUploadError('Only one file is allowed')
      return
    }

    if (multiple && value.length + filesToUpload.length > 10) {
      setUploadError('Maximum 10 files allowed')
      return
    }

    // Pre-validate files before upload
    const validationErrors: string[] = []

    filesToUpload.forEach((file, index) => {
      // Check file size
      const maxSizeBytes = maxSize * 1024 * 1024
      if (file.size > maxSizeBytes) {
        validationErrors.push(`File "${file.name}" exceeds ${maxSize}MB limit`)
      }

      // Check file type if restrictions are set
      if (allowedTypes.length > 0) {
        const isAllowed = allowedTypes.some(allowedType => {
          if (allowedType.endsWith('/*')) {
            const category = allowedType.slice(0, -2)
            return file.type.startsWith(category + '/')
          }
          return file.type === allowedType
        })

        if (!isAllowed) {
          validationErrors.push(`File "${file.name}" type not allowed`)
        }
      }

      // Check for empty files
      if (file.size === 0) {
        validationErrors.push(`File "${file.name}" is empty`)
      }
    })

    if (validationErrors.length > 0) {
      setUploadError(validationErrors.join('; '))
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Upload files sequentially to avoid overwhelming the server
      const uploadedFiles: FileInfo[] = []

      for (const file of filesToUpload) {
        try {
          const uploadedFile = await uploadFile(file)
          uploadedFiles.push(uploadedFile)
        } catch (error) {
          // If one file fails, still try to upload others
          console.error(`Failed to upload ${file.name}:`, error)
          setUploadError(`Failed to upload "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`)
          break // Stop on first error
        }
      }

      if (uploadedFiles.length > 0) {
        const newFiles = multiple ? [...value, ...uploadedFiles] : uploadedFiles
        onChange(newFiles)

        // Clear error if at least some files uploaded successfully
        if (uploadedFiles.length === filesToUpload.length) {
          setUploadError(null)
        }
      }

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const uploadFile = async (file: File): Promise<FileInfo> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fieldId', fieldId)
    formData.append('formId', formId)
    formData.append('maxSize', maxSize.toString())
    if (allowedTypes.length > 0) {
      formData.append('allowedTypes', allowedTypes.join(','))
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header, let browser set it with boundary for multipart
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Handle different HTTP status codes
        if (response.status === 413) {
          throw new Error('File too large for server')
        } else if (response.status === 507) {
          throw new Error('Server storage full')
        } else if (response.status === 429) {
          throw new Error('Too many uploads, please wait')
        }
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      return result.file
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Upload timeout - file too large or connection slow')
        }
        throw error
      }

      throw new Error('Network error during upload')
    }
  }

  const removeFile = (fileId: string) => {
    const newFiles = value.filter(file => file.id !== fileId)
    onChange(newFiles)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string, filename?: string) => {
    const ext = filename?.toLowerCase().split('.').pop() || ''

    // Images
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4 text-blue-500" />
    }

    // Documents
    if (type === 'application/pdf') {
      return <FileText className="w-4 h-4 text-red-500" />
    }

    if (type.startsWith('text/') ||
        type.includes('document') ||
        type.includes('spreadsheet') ||
        type.includes('presentation') ||
        ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'].includes(ext)) {
      return <FileText className="w-4 h-4 text-blue-600" />
    }

    // Archives
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') ||
        ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <File className="w-4 h-4 text-yellow-600" />
    }

    // Audio
    if (type.startsWith('audio/')) {
      return <File className="w-4 h-4 text-purple-500" />
    }

    // Video
    if (type.startsWith('video/')) {
      return <File className="w-4 h-4 text-green-500" />
    }

    // Code files
    if (type.includes('javascript') || type.includes('json') || type.includes('xml') ||
        ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'c', 'cpp'].includes(ext)) {
      return <FileText className="w-4 h-4 text-green-600" />
    }

    // Default
    return <File className="w-4 h-4 text-gray-500" />
  }

  const getAcceptedTypes = () => {
    if (allowedTypes.length === 0) return undefined

    // Convert MIME types to file extensions for better browser support
    const acceptTypes = allowedTypes.map(type => {
      // Keep wildcard types as-is
      if (type.includes('*')) return type

      // Convert common MIME types to extensions for better UX
      const mimeToExt: Record<string, string> = {
        'image/jpeg': '.jpg,.jpeg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'application/pdf': '.pdf',
        'text/plain': '.txt',
        'text/csv': '.csv',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/zip': '.zip',
        'audio/mpeg': '.mp3',
        'video/mp4': '.mp4'
      }

      return mimeToExt[type] || type
    })

    return acceptTypes.join(',')
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={fieldId}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="pt-6">
          <div className="text-center">
            <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Drag and drop files here, or{' '}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  browse
                </Button>
              </p>
              <p className="text-xs text-muted-foreground">
                Max size: {maxSize}MB
                {allowedTypes.length > 0 ? (
                  <span className="block">
                    Allowed: {allowedTypes.map(type => {
                      if (type.endsWith('/*')) return type
                      return type.split('/')[1] || type.split('.')[1] || type
                    }).join(', ')}
                  </span>
                ) : (
                  <span className="block text-green-600">All file types allowed</span>
                )}
                {multiple && <span className="block">Multiple files allowed</span>}
              </p>
            </div>
          </div>
          
          <Input
            ref={fileInputRef}
            id={fieldId}
            type="file"
            multiple={multiple}
            accept={getAcceptedTypes()}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />
        </CardContent>
      </Card>

      {/* Upload Status */}
      {isUploading && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Uploading...</span>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="flex items-center space-x-2 text-sm text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Uploaded Files */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Uploaded Files</Label>
          <div className="space-y-2">
            {value.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type, file.originalName)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={file.originalName}>
                        {file.originalName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.sizeFormatted || formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                        {file.type && (
                          <span className="ml-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                            {file.extension || file.type.split('/')[1] || 'file'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Uploaded
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
