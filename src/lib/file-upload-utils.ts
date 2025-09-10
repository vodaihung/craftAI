/**
 * Utility functions for managing file upload restrictions
 */

import type { FormField, FormSchema } from '@/lib/db/schema'

/**
 * Remove file type restrictions from a form field
 */
export function removeFileTypeRestrictions(field: FormField): FormField {
  if (field.type === 'file' && field.fileConfig) {
    return {
      ...field,
      fileConfig: {
        ...field.fileConfig,
        allowedTypes: [] // Empty array allows all file types
      }
    }
  }
  return field
}

/**
 * Remove file type restrictions from all file fields in a form schema
 */
export function removeAllFileTypeRestrictions(schema: FormSchema): FormSchema {
  return {
    ...schema,
    fields: schema.fields.map(field => removeFileTypeRestrictions(field))
  }
}

/**
 * Check if a form has any file type restrictions
 */
export function hasFileTypeRestrictions(schema: FormSchema): boolean {
  return schema.fields.some(field => 
    field.type === 'file' && 
    field.fileConfig?.allowedTypes && 
    field.fileConfig.allowedTypes.length > 0
  )
}

/**
 * Get all file fields with restrictions
 */
export function getRestrictedFileFields(schema: FormSchema): FormField[] {
  return schema.fields.filter(field => 
    field.type === 'file' && 
    field.fileConfig?.allowedTypes && 
    field.fileConfig.allowedTypes.length > 0
  )
}

/**
 * Create a file field configuration that allows all file types
 */
export function createUnrestrictedFileConfig(maxSize: number = 50, multiple: boolean = true) {
  return {
    maxSize, // MB
    allowedTypes: [], // Empty array = all file types allowed
    multiple
  }
}

/**
 * Common file type groups for easy configuration
 */
export const FILE_TYPE_GROUPS = {
  // Allow all files (recommended)
  ALL: [],
  
  // Common document types
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/rtf'
  ],
  
  // All image types
  IMAGES: ['image/*'],
  
  // Specific image formats
  COMMON_IMAGES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  
  // Media files
  MEDIA: [
    'image/*',
    'video/*',
    'audio/*'
  ],
  
  // Archives
  ARCHIVES: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip'
  ]
}

/**
 * Get human-readable description of allowed file types
 */
export function getFileTypeDescription(allowedTypes: string[]): string {
  if (!allowedTypes || allowedTypes.length === 0) {
    return 'All file types allowed'
  }
  
  if (allowedTypes.includes('image/*')) {
    return 'All image files'
  }
  
  if (allowedTypes.includes('video/*')) {
    return 'All video files'
  }
  
  if (allowedTypes.includes('audio/*')) {
    return 'All audio files'
  }
  
  // Convert MIME types to readable format
  const readable = allowedTypes.map(type => {
    if (type.endsWith('/*')) {
      return type.replace('/*', ' files')
    }
    
    const extension = type.split('/')[1]
    if (extension) {
      return extension.toUpperCase()
    }
    
    return type
  })
  
  return readable.join(', ')
}

/**
 * Validate if a file type is allowed
 */
export function isFileTypeAllowed(fileType: string, allowedTypes: string[]): boolean {
  // If no restrictions, allow all files
  if (!allowedTypes || allowedTypes.length === 0) {
    return true
  }
  
  return allowedTypes.some(allowedType => {
    // Support wildcard matching (e.g., "image/*")
    if (allowedType.endsWith('/*')) {
      const category = allowedType.slice(0, -2)
      return fileType.startsWith(category + '/')
    }
    return fileType === allowedType
  })
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().split('.').pop() || ''
}

/**
 * Check if file extension is safe (not executable)
 */
export function isSafeFileExtension(filename: string): boolean {
  const ext = getFileExtension(filename)
  const dangerousExtensions = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 
    'sh', 'ps1', 'msi', 'app', 'deb', 'rpm', 'dmg'
  ]
  return !dangerousExtensions.includes(ext)
}
