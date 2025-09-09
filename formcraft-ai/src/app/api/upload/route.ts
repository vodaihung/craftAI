import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// POST /api/upload - Handle file uploads
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fieldId = formData.get('fieldId') as string
    const formId = formData.get('formId') as string
    const maxSize = parseInt(formData.get('maxSize') as string || '10') // Default 10MB
    const allowedTypes = (formData.get('allowedTypes') as string)?.split(',') || []

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

    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
      }, { status: 400 })
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', formId, fieldId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Sanitize filename
    const filename = `${timestamp}_${originalName}`
    const filepath = join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    console.log(`📁 File uploaded: ${filename} (${file.size} bytes)`)

    // Return file info
    const fileInfo = {
      id: `${timestamp}_${fieldId}`,
      originalName: file.name,
      filename,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      url: `/api/files/${formId}/${fieldId}/${filename}` // URL to access the file
    }

    return NextResponse.json({
      success: true,
      file: fileInfo,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('❌ File upload failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/upload - Get upload configuration
export async function GET() {
  return NextResponse.json({
    message: 'File Upload API',
    maxFileSize: '10MB',
    supportedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    usage: 'POST multipart/form-data with file, fieldId, formId, maxSize (optional), allowedTypes (optional)'
  })
}
