import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getPublishedFormById, getFormById } from '@/lib/db/queries'

// GET /api/files/[formId]/[fieldId]/[filename] - Serve uploaded files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string; fieldId: string; filename: string }> }
) {
  try {
    const { formId, fieldId, filename } = await params
    
    // Validate form exists (allow both published and unpublished forms)
    // For published forms, anyone can access files
    // For unpublished forms, only allow access (this could be enhanced with user auth in the future)
    let form = await getPublishedFormById(formId)
    if (!form) {
      // If not published, check if form exists at all
      form = await getFormById(formId)
      if (!form) {
        return new NextResponse('Form not found', { status: 404 })
      }
      // For unpublished forms, we allow access for now (could add user auth check here)
    }

    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '')
    if (sanitizedFilename !== filename) {
      return new NextResponse('Invalid filename', { status: 400 })
    }

    // Construct file path
    const filepath = join(process.cwd(), 'uploads', formId, fieldId, sanitizedFilename)
    
    // Check if file exists
    if (!existsSync(filepath)) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(filepath)
    
    // Determine content type based on file extension
    const contentType = getContentType(sanitizedFilename)
    
    // Return file with appropriate headers
    return new NextResponse(Buffer.from(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${sanitizedFilename}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })

  } catch (error) {
    console.error('❌ File serving error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  
  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Documents
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    
    // Audio/Video
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    
    // Code
    'js': 'application/javascript',
    'css': 'text/css',
    'html': 'text/html',
    'json': 'application/json',
    'xml': 'application/xml',
  }
  
  return mimeTypes[ext || ''] || 'application/octet-stream'
}
