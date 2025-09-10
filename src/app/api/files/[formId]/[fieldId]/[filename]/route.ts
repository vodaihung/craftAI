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
    // Special case: allow test forms for development
    const isTestForm = formId.startsWith('test-') && process.env.NODE_ENV === 'development'

    if (!isTestForm) {
      let form = await getPublishedFormById(formId)
      if (!form) {
        // If not published, check if form exists at all
        form = await getFormById(formId)
        if (!form) {
          return new NextResponse('Form not found', { status: 404 })
        }
        // For unpublished forms, we allow access for now (could add user auth check here)
      }
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
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'ico': 'image/x-icon',
    'heic': 'image/heic',
    'heif': 'image/heif',
    'avif': 'image/avif',

    // Documents
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'rtf': 'text/rtf',
    'csv': 'text/csv',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'odt': 'application/vnd.oasis.opendocument.text',
    'ods': 'application/vnd.oasis.opendocument.spreadsheet',
    'odp': 'application/vnd.oasis.opendocument.presentation',
    'pages': 'application/vnd.apple.pages',
    'numbers': 'application/vnd.apple.numbers',
    'key': 'application/vnd.apple.keynote',

    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    'bz2': 'application/x-bzip2',
    'xz': 'application/x-xz',
    'dmg': 'application/x-apple-diskimage',

    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'aac': 'audio/aac',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4',
    'wma': 'audio/x-ms-wma',
    'opus': 'audio/opus',
    'webm': 'audio/webm',

    // Video
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    '3gp': 'video/3gpp',
    'm4v': 'video/x-m4v',
    'mpg': 'video/mpeg',
    'mpeg': 'video/mpeg',

    // Code/Text
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'mjs': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    'md': 'text/markdown',
    'markdown': 'text/markdown',
    'py': 'text/x-python',
    'java': 'text/x-java-source',
    'c': 'text/x-c',
    'cpp': 'text/x-c++',
    'h': 'text/x-c',
    'hpp': 'text/x-c++',
    'php': 'text/x-php',
    'rb': 'text/x-ruby',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
    'swift': 'text/x-swift',
    'kt': 'text/x-kotlin',
    'ts': 'text/typescript',
    'tsx': 'text/typescript',
    'jsx': 'text/javascript',
    'vue': 'text/x-vue',
    'sql': 'text/x-sql',
    'sh': 'text/x-shellscript',
    'bash': 'text/x-shellscript',
    'ps1': 'text/x-powershell',
    'bat': 'text/x-msdos-batch',
    'cmd': 'text/x-msdos-batch',

    // Fonts
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'eot': 'application/vnd.ms-fontobject',

    // 3D/CAD
    'obj': 'text/plain',
    'stl': 'application/sla',
    'ply': 'text/plain',
    'dae': 'model/vnd.collada+xml',
    'fbx': 'application/octet-stream',
    'blend': 'application/x-blender',

    // Adobe
    'psd': 'image/vnd.adobe.photoshop',
    'ai': 'application/postscript',
    'eps': 'application/postscript',
    'indd': 'application/x-indesign',

    // Other common formats
    'epub': 'application/epub+zip',
    'mobi': 'application/x-mobipocket-ebook',
    'azw': 'application/vnd.amazon.ebook',
    'ics': 'text/calendar',
    'vcf': 'text/vcard',
    'gpx': 'application/gpx+xml',
    'kml': 'application/vnd.google-earth.kml+xml',
    'kmz': 'application/vnd.google-earth.kmz',
  }

  return mimeTypes[ext || ''] || 'application/octet-stream'
}
