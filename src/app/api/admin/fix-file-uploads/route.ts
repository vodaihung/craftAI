import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { forms } from '@/lib/db/schema'
import { removeAllFileTypeRestrictions, hasFileTypeRestrictions, getRestrictedFileFields } from '@/lib/file-upload-utils'
import { eq } from 'drizzle-orm'

/**
 * API endpoint to remove file type restrictions from forms
 * GET: List forms with file type restrictions
 * POST: Remove file type restrictions from specified forms or all forms
 */

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get all forms
    const allForms = await db.select().from(forms)
    
    // Find forms with file type restrictions
    const formsWithRestrictions = allForms.filter(form => {
      try {
        const schema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema
        return hasFileTypeRestrictions(schema)
      } catch (error) {
        console.error('Error parsing form schema:', error)
        return false
      }
    })

    // Get details about restrictions
    const restrictionDetails = formsWithRestrictions.map(form => {
      try {
        const schema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema
        const restrictedFields = getRestrictedFileFields(schema)
        
        return {
          id: form.id,
          title: schema.title || 'Untitled Form',
          createdAt: form.createdAt,
          restrictedFields: restrictedFields.map(field => ({
            id: field.id,
            label: field.label,
            allowedTypes: field.fileConfig?.allowedTypes || [],
            maxSize: field.fileConfig?.maxSize || 10
          }))
        }
      } catch (error) {
        console.error('Error processing form:', error)
        return null
      }
    }).filter(Boolean)

    return NextResponse.json({
      success: true,
      message: `Found ${formsWithRestrictions.length} forms with file type restrictions`,
      totalForms: allForms.length,
      formsWithRestrictions: restrictionDetails.length,
      forms: restrictionDetails
    })

  } catch (error) {
    console.error('Error checking file upload restrictions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check file upload restrictions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { formIds, removeAll = false } = body

    let formsToUpdate: any[] = []

    if (removeAll) {
      // Get all forms with restrictions
      const allForms = await db.select().from(forms)
      formsToUpdate = allForms.filter(form => {
        try {
          const schema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema
          return hasFileTypeRestrictions(schema)
        } catch (error) {
          return false
        }
      })
    } else if (formIds && Array.isArray(formIds)) {
      // Get specific forms
      for (const formId of formIds) {
        const form = await db.select().from(forms).where(eq(forms.id, formId)).limit(1)
        if (form.length > 0) {
          formsToUpdate.push(form[0])
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Either provide formIds array or set removeAll to true' },
        { status: 400 }
      )
    }

    // Update forms
    const updatedForms = []
    const errors = []

    for (const form of formsToUpdate) {
      try {
        const schema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema
        const updatedSchema = removeAllFileTypeRestrictions(schema)
        
        await db.update(forms)
          .set({ 
            schema: JSON.stringify(updatedSchema),
            updatedAt: new Date()
          })
          .where(eq(forms.id, form.id))

        updatedForms.push({
          id: form.id,
          title: schema.title || 'Untitled Form'
        })
      } catch (error) {
        console.error(`Error updating form ${form.id}:`, error)
        errors.push({
          formId: form.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedForms.length} forms to allow all file types`,
      updatedForms,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: formsToUpdate.length,
        updated: updatedForms.length,
        failed: errors.length
      }
    })

  } catch (error) {
    console.error('Error removing file upload restrictions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove file upload restrictions' },
      { status: 500 }
    )
  }
}

// PUT: Update specific form's file upload settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { formId, fieldId, fileConfig } = body

    if (!formId || !fieldId) {
      return NextResponse.json(
        { success: false, error: 'formId and fieldId are required' },
        { status: 400 }
      )
    }

    // Get the form
    const form = await db.select().from(forms).where(eq(forms.id, formId)).limit(1)
    if (form.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      )
    }

    // Parse and update schema
    const schema = typeof form[0].schema === 'string' ? JSON.parse(form[0].schema) : form[0].schema
    
    // Find and update the field
    const fieldIndex = schema.fields.findIndex((f: any) => f.id === fieldId)
    if (fieldIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Field not found' },
        { status: 404 }
      )
    }

    if (schema.fields[fieldIndex].type !== 'file') {
      return NextResponse.json(
        { success: false, error: 'Field is not a file field' },
        { status: 400 }
      )
    }

    // Update the field configuration
    schema.fields[fieldIndex].fileConfig = {
      ...schema.fields[fieldIndex].fileConfig,
      ...fileConfig
    }

    // Save the updated schema
    await db.update(forms)
      .set({ 
        schema: JSON.stringify(schema),
        updatedAt: new Date()
      })
      .where(eq(forms.id, formId))

    return NextResponse.json({
      success: true,
      message: 'File upload configuration updated',
      field: {
        id: fieldId,
        label: schema.fields[fieldIndex].label,
        fileConfig: schema.fields[fieldIndex].fileConfig
      }
    })

  } catch (error) {
    console.error('Error updating file upload configuration:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update file upload configuration' },
      { status: 500 }
    )
  }
}
