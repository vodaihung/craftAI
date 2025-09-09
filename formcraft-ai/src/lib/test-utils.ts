// Test utilities and validation helpers for FormCraft AI

import type { FormSchema, FormField } from '@/lib/db/schema'

export interface TestResult {
  passed: boolean
  message: string
  details?: any
}

export interface FormValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Form schema validation
export function validateFormSchema(schema: FormSchema): FormValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic schema validation
  if (!schema.title || schema.title.trim().length === 0) {
    errors.push('Form title is required')
  }

  if (!schema.fields || schema.fields.length === 0) {
    errors.push('Form must have at least one field')
  }

  // Field validation
  schema.fields?.forEach((field, index) => {
    const fieldErrors = validateFormField(field, index)
    errors.push(...fieldErrors.errors)
    warnings.push(...fieldErrors.warnings)
  })

  // Settings validation
  if (!schema.settings?.submitButtonText) {
    warnings.push('Submit button text not specified, using default')
  }

  if (!schema.settings?.successMessage) {
    warnings.push('Success message not specified, using default')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateFormField(field: FormField, index: number): FormValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic field validation
  if (!field.id || field.id.trim().length === 0) {
    errors.push(`Field ${index + 1}: ID is required`)
  }

  if (!field.label || field.label.trim().length === 0) {
    errors.push(`Field ${index + 1}: Label is required`)
  }

  if (!field.type) {
    errors.push(`Field ${index + 1}: Type is required`)
  }

  // Type-specific validation
  switch (field.type) {
    case 'select':
    case 'radio':
    case 'checkbox':
      if (!field.options || field.options.length === 0) {
        errors.push(`Field ${index + 1}: ${field.type} field requires options`)
      }
      break

    case 'rating':
      if (!field.scale || field.scale < 1 || field.scale > 10) {
        warnings.push(`Field ${index + 1}: Rating scale should be between 1-10`)
      }
      break

    case 'file':
      if (field.fileConfig) {
        if (field.fileConfig.maxSize && field.fileConfig.maxSize > 100) {
          warnings.push(`Field ${index + 1}: Large file size limit (${field.fileConfig.maxSize}MB)`)
        }
        if (field.fileConfig.allowedTypes && field.fileConfig.allowedTypes.length === 0) {
          warnings.push(`Field ${index + 1}: No file types specified`)
        }
      }
      break
  }

  // Validation rules
  if (field.validation) {
    if (field.validation.min !== undefined && field.validation.max !== undefined) {
      if (field.validation.min > field.validation.max) {
        errors.push(`Field ${index + 1}: Min value cannot be greater than max value`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// API endpoint testing
export async function testAPIEndpoint(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  headers?: Record<string, string>
): Promise<TestResult> {
  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        passed: false,
        message: `API call failed: ${response.status} ${response.statusText}`,
        details: data
      }
    }

    return {
      passed: true,
      message: `API call successful: ${method} ${endpoint}`,
      details: data
    }
  } catch (error) {
    return {
      passed: false,
      message: `API call error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

// Form submission testing
export async function testFormSubmission(formId: string, formData: Record<string, any>): Promise<TestResult> {
  try {
    const response = await fetch(`/api/forms/${formId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ responses: formData })
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        passed: false,
        message: `Form submission failed: ${response.status}`,
        details: result
      }
    }

    return {
      passed: true,
      message: 'Form submission successful',
      details: result
    }
  } catch (error) {
    return {
      passed: false,
      message: `Form submission error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

// File upload testing
export async function testFileUpload(
  formId: string,
  fieldId: string,
  file: File
): Promise<TestResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('formId', formId)
    formData.append('fieldId', fieldId)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        passed: false,
        message: `File upload failed: ${response.status}`,
        details: result
      }
    }

    return {
      passed: true,
      message: 'File upload successful',
      details: result
    }
  } catch (error) {
    return {
      passed: false,
      message: `File upload error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

// Authentication testing
export async function testAuthentication(): Promise<TestResult> {
  try {
    const response = await fetch('/api/auth/session')
    const session = await response.json()

    if (!response.ok) {
      return {
        passed: false,
        message: 'Authentication check failed',
        details: session
      }
    }

    return {
      passed: true,
      message: session.user ? 'User authenticated' : 'No active session',
      details: session
    }
  } catch (error) {
    return {
      passed: false,
      message: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

// Comprehensive system test
export async function runSystemTests(): Promise<{
  passed: number
  failed: number
  results: Array<{ test: string; result: TestResult }>
}> {
  const tests = [
    { name: 'Authentication', test: () => testAuthentication() },
    { name: 'Templates API', test: () => testAPIEndpoint('/api/templates') },
    { name: 'Forms API', test: () => testAPIEndpoint('/api/forms') },
    { name: 'AI Generate API', test: () => testAPIEndpoint('/api/ai/test-generate', 'POST', { prompt: 'contact form' }) }
  ]

  const results: Array<{ test: string; result: TestResult }> = []
  let passed = 0
  let failed = 0

  for (const { name, test } of tests) {
    try {
      const result = await test()
      results.push({ test: name, result })
      
      if (result.passed) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      results.push({
        test: name,
        result: {
          passed: false,
          message: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error
        }
      })
      failed++
    }
  }

  return { passed, failed, results }
}

// Performance testing
export function measureRenderTime<T>(
  component: () => T,
  iterations: number = 10
): { average: number; min: number; max: number } {
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    component()
    const end = performance.now()
    times.push(end - start)
  }

  return {
    average: times.reduce((sum, time) => sum + time, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times)
  }
}

// Mock data generators for testing
export function generateMockForm(): FormSchema {
  return {
    title: 'Test Form',
    description: 'A test form for validation',
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        required: true,
        placeholder: 'Enter your name'
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        placeholder: 'Enter your email'
      },
      {
        id: 'rating',
        type: 'rating',
        label: 'Rating',
        required: false,
        scale: 5
      }
    ],
    settings: {
      submitButtonText: 'Submit',
      successMessage: 'Thank you!',
      allowMultipleSubmissions: true
    }
  }
}

export function generateMockFile(name: string = 'test.txt', size: number = 1024): File {
  const content = 'x'.repeat(size)
  return new File([content], name, { type: 'text/plain' })
}
