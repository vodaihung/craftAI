import { NextRequest, NextResponse } from 'next/server'
import { getFormById, updateForm, deleteForm, publishForm, unpublishForm } from '@/lib/db/queries'
import { FormSchemaSchema } from '@/lib/db/schema'
import { z } from 'zod'

// Request schema for updating forms
const UpdateFormRequestSchema = z.object({
  name: z.string().min(1, 'Form name is required').optional(),
  schema: FormSchemaSchema.optional(),
  isPublished: z.boolean().optional()
})

// GET /api/forms/[id] - Get a specific form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`📖 Fetching form: ${id}`)
    
    const form = await getFormById(id)
    
    if (!form) {
      return NextResponse.json({
        success: false,
        error: 'Form not found'
      }, { status: 404 })
    }
    
    console.log('✅ Form retrieved successfully')
    
    return NextResponse.json({
      success: true,
      form
    })
    
  } catch (error) {
    console.error('❌ Failed to fetch form:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch form',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/forms/[id] - Update a specific form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log(`✏️ Updating form: ${id}`)
    
    // Validate request body
    const validatedData = UpdateFormRequestSchema.parse(body)
    
    // Check if form exists
    const existingForm = await getFormById(id)
    if (!existingForm) {
      return NextResponse.json({
        success: false,
        error: 'Form not found'
      }, { status: 404 })
    }
    
    // Update form
    const updatedForm = await updateForm(id, validatedData)
    
    if (!updatedForm) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update form'
      }, { status: 500 })
    }
    
    console.log('✅ Form updated successfully')
    
    return NextResponse.json({
      success: true,
      form: updatedForm,
      message: 'Form updated successfully!'
    })
    
  } catch (error) {
    console.error('❌ Failed to update form:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid form data',
        details: error.issues
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update form',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/forms/[id] - Delete a specific form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🗑️ Deleting form: ${id}`)
    
    // Check if form exists
    const existingForm = await getFormById(id)
    if (!existingForm) {
      return NextResponse.json({
        success: false,
        error: 'Form not found'
      }, { status: 404 })
    }
    
    // Delete form
    const deleted = await deleteForm(id)
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete form'
      }, { status: 500 })
    }
    
    console.log('✅ Form deleted successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Form deleted successfully!'
    })
    
  } catch (error) {
    console.error('❌ Failed to delete form:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete form',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
