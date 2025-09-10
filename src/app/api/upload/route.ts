import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Comprehensive MIME type validation
const DANGEROUS_FILE_TYPES = [
  'application/x-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-msi',
  'application/x-bat',
  'application/x-sh',
  'application/x-csh',
  'text/x-script',
  'application/javascript',
  'text/javascript',
  'application/x-javascript'
]

const COMMON_MIME_TYPES = new Set([
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'image/bmp', 'image/tiff', 'image/x-icon', 'image/vnd.microsoft.icon',

  // Documents
  'application/pdf', 'text/plain', 'text/csv', 'text/rtf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',

  // Archives
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'application/x-tar', 'application/gzip', 'application/x-bzip2',

  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac',
  'audio/x-ms-wma', 'audio/webm',

  // Video
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
  'video/x-ms-wmv', 'video/x-flv',

  // Code/Text
  'text/html', 'text/css', 'application/json', 'application/xml', 'text/xml',
  'text/markdown', 'text/x-python', 'text/x-java-source', 'text/x-c', 'text/x-c++',

  // Other common types
  'application/octet-stream'
])

function isFileTypeSafe(mimeType: string, filename: string): boolean {
  // Check for dangerous executable types
  if (DANGEROUS_FILE_TYPES.includes(mimeType.toLowerCase())) {
    return false
  }

  // Check for dangerous file extensions
  const ext = filename.toLowerCase().split('.').pop() || ''
  const dangerousExtensions = ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'sh', 'ps1']
  if (dangerousExtensions.includes(ext)) {
    return false
  }

  return true
}

// POST /api/upload - Handle file uploads
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fieldId = formData.get('fieldId') as string
    const formId = formData.get('formId') as string
    const maxSize = parseInt(formData.get('maxSize') as string || '10') // Default 10MB
    const allowedTypes = (formData.get('allowedTypes') as string)?.split(',').filter(Boolean) || []

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }

    if (!fieldId || !formId) {
      return NextResponse.json({
        success: false,
        error: 'Missing fieldId or formId'
      }, { status: 400 })
    }

    // Validate file size (convert MB to bytes)
    const maxSizeBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json({
        success: false,
        error: `File size exceeds ${maxSize}MB limit`
      }, { status: 400 })
    }

    // Enhanced file type validation
    const fileType = file.type || 'application/octet-stream'
    const fileName = file.name || 'unknown'

    // Security check - block dangerous file types
    if (!isFileTypeSafe(fileType, fileName)) {
      return NextResponse.json({
        success: false,
        error: `File type "${fileType}" is not allowed for security reasons`
      }, { status: 400 })
    }

    // Validate against allowed types if specified
    if (allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some(allowedType => {
        // Support wildcard matching (e.g., "image/*")
        if (allowedType.endsWith('/*')) {
          const category = allowedType.slice(0, -2)
          return fileType.startsWith(category + '/')
        }
        return fileType === allowedType
      })

      if (!isAllowed) {
        return NextResponse.json({
          success: false,
          error: `File type "${fileType}" not allowed. Allowed types: ${allowedTypes.join(', ')}`
        }, { status: 400 })
      }
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', formId, fieldId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename with better sanitization
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)

    // More comprehensive filename sanitization
    const sanitizedName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid characters
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 100) // Limit filename length

    const filename = `${timestamp}_${randomSuffix}_${sanitizedName}`
    const filepath = join(uploadDir, filename)

    // Validate file content (basic check)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Additional security: Check for null bytes (potential security issue)
    if (buffer.includes(0x00) && !['image/', 'video/', 'audio/', 'application/pdf'].some(type => fileType.startsWith(type))) {
      return NextResponse.json({
        success: false,
        error: 'File contains invalid content'
      }, { status: 400 })
    }

    // Save file with error handling
    try {
      await writeFile(filepath, buffer)
    } catch (writeError) {
      console.error('❌ File write failed:', writeError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save file to disk'
      }, { status: 500 })
    }

    console.log(`📁 File uploaded successfully: ${filename} (${file.size} bytes, ${fileType})`)

    // Return comprehensive file info
    const fileInfo = {
      id: `${timestamp}_${randomSuffix}_${fieldId}`,
      originalName: file.name,
      filename,
      size: file.size,
      type: fileType,
      uploadedAt: new Date().toISOString(),
      url: `/api/files/${formId}/${fieldId}/${filename}`,
      // Additional metadata
      extension: fileName.split('.').pop()?.toLowerCase() || '',
      sizeFormatted: formatFileSize(file.size)
    }

    return NextResponse.json({
      success: true,
      file: fileInfo,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('❌ File upload failed:', error)

    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('ENOSPC')) {
        return NextResponse.json({
          success: false,
          error: 'Server storage is full. Please try again later.'
        }, { status: 507 })
      }

      if (error.message.includes('EACCES')) {
        return NextResponse.json({
          success: false,
          error: 'Server permission error. Please contact support.'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to upload file',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 })
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// GET /api/upload - Get upload configuration
export async function GET() {
  return NextResponse.json({
    message: 'File Upload API - Supports All File Types',
    maxFileSize: '10MB (configurable per field)',
    supportedTypes: 'All file types supported except dangerous executables',
    commonTypes: {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'],
      documents: [
        'application/pdf', 'text/plain', 'text/csv', 'text/rtf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ],
      archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'],
      video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
      code: ['text/html', 'text/css', 'application/json', 'application/xml', 'text/markdown']
    },
    blockedTypes: DANGEROUS_FILE_TYPES,
    features: [
      'Drag and drop support',
      'Multiple file upload',
      'File type validation',
      'Size limit enforcement',
      'Wildcard type matching (e.g., image/*)',
      'Security scanning for dangerous files'
    ],
    usage: 'POST multipart/form-data with file, fieldId, formId, maxSize (optional), allowedTypes (optional)'
  })
}
