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

    setIsUploading(true)
    setUploadError(null)

    try {
      const uploadPromises = filesToUpload.map(file => uploadFile(file))
      const uploadedFiles = await Promise.all(uploadPromises)

      const newFiles = multiple ? [...value, ...uploadedFiles] : uploadedFiles
      onChange(newFiles)

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

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error)
    }

    return result.file
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

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4" />
    } else if (type === 'application/pdf' || type.startsWith('text/')) {
      return <FileText className="w-4 h-4" />
    } else {
      return <File className="w-4 h-4" />
    }
  }

  const getAcceptedTypes = () => {
    if (allowedTypes.length === 0) return undefined
    return allowedTypes.join(',')
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
                {allowedTypes.length > 0 && (
                  <span className="block">
                    Allowed: {allowedTypes.map(type => type.split('/')[1] || type).join(', ')}
                  </span>
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
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Uploaded
                    </Badge>
                    <Button
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
