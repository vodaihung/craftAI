import { NextRequest, NextResponse } from 'next/server'
import { getPublishedFormById, createFormResponse } from '@/lib/db/queries'
import { z } from 'zod'

// Request schema for form submissions
const SubmitFormRequestSchema = z.object({
  formId: z.string().uuid('Invalid form ID'),
  responseData: z.record(z.any()) // Dynamic object for form field responses
})

// POST /api/forms/submit - Submit a form response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Processing form submission...', body)

    // Validate request body
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body')
    }

    if (!body.formId || typeof body.formId !== 'string') {
      throw new Error('Invalid form ID')
    }

    if (!body.responseData || typeof body.responseData !== 'object') {
      throw new Error('Invalid response data')
    }

    const validatedData = { formId: body.formId, responseData: body.responseData }
    const { formId, responseData } = validatedData
    
    // Check if form exists and is published
    const form = await getPublishedFormById(formId)
    if (!form) {
      return NextResponse.json({
        success: false,
        error: 'Form not found or not published'
      }, { status: 404 })
    }
    
    // Validate form data against schema
    const validationResult = validateFormSubmission(form.schema, responseData)
    if (!validationResult.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Form validation failed',
        details: validationResult.errors
      }, { status: 400 })
    }
    
    // Create form response
    const formResponse = await createFormResponse({
      formId,
      data: responseData as any // Cast to JSONB type
    })
    
    console.log('✅ Form response created:', formResponse.id)
    
    // Get success message from form settings
    const successMessage = form.schema && 
      typeof form.schema === 'object' && 
      'settings' in form.schema &&
      form.schema.settings &&
      typeof form.schema.settings === 'object' &&
      'successMessage' in form.schema.settings
        ? (form.schema.settings as any).successMessage
        : 'Thank you for your submission!'
    
    return NextResponse.json({
      success: true,
      responseId: formResponse.id,
      message: successMessage
    }, { status: 201 })
    
  } catch (error) {
    console.error('❌ Failed to submit form:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid submission data',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to submit form',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Validate form submission against form schema
function validateFormSubmission(formSchema: any, responseData: Record<string, any>) {
  const errors: Record<string, string> = {}
  
  if (!formSchema || !formSchema.fields) {
    return { isValid: false, errors: { form: 'Invalid form schema' } }
  }
  
  // Validate each field
  formSchema.fields.forEach((field: any) => {
    const value = responseData[field.id]
    
    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      errors[field.id] = `${field.label} is required`
      return
    }
    
    // Skip validation if field is not required and empty
    if (!field.required && (value === undefined || value === null || value === '')) {
      return
    }
    
    // Type-specific validation
    switch (field.type) {
      case 'email':
        if (typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            errors[field.id] = 'Please enter a valid email address'
          }
        }
        break
        
      case 'number':
        if (isNaN(Number(value))) {
          errors[field.id] = 'Please enter a valid number'
        }
        break
        
      case 'date':
        if (typeof value === 'string') {
          const date = new Date(value)
          if (isNaN(date.getTime())) {
            errors[field.id] = 'Please enter a valid date'
          }
        }
        break
        
      case 'select':
      case 'radio':
        if (field.options && Array.isArray(field.options)) {
          if (!field.options.includes(value)) {
            errors[field.id] = 'Please select a valid option'
          }
        }
        break
        
      case 'checkbox':
        if (typeof value !== 'boolean') {
          errors[field.id] = 'Invalid checkbox value'
        }
        break
        
      case 'rating':
        const rating = Number(value)
        if (isNaN(rating) || rating < 1 || rating > 5) {
          errors[field.id] = 'Please provide a rating between 1 and 5'
        }
        break
    }
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
