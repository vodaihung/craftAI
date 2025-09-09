import { NextRequest, NextResponse } from 'next/server'
import { createForm, getAllForms, getFormsByUserId } from '@/lib/db/queries'
import { insertFormSchema, FormSchemaSchema } from '@/lib/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

// Request schema for creating forms
const CreateFormRequestSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  schema: FormSchemaSchema,
  isPublished: z.boolean().optional().default(false)
})

// GET /api/forms - Get user's forms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published')

    console.log('📋 Fetching forms for user:', session.user.id)

    const forms = await getFormsByUserId(session.user.id)

    // Filter by published status if specified
    const filteredForms = published !== null
      ? forms.filter(form => form.isPublished === (published === 'true'))
      : forms

    console.log(`✅ Retrieved ${filteredForms.length} forms`)

    return NextResponse.json({
      success: true,
      forms: filteredForms,
      total: filteredForms.length
    })

  } catch (error) {
    console.error('❌ Failed to fetch forms:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch forms',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/forms - Create a new form
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const body = await request.json()
    console.log('📝 Creating new form for user:', session.user.id)

    // Validate request body
    const validatedData = CreateFormRequestSchema.parse(body)

    // Create form in database
    const newForm = await createForm({
      userId: session.user.id,
      name: validatedData.name,
      schema: validatedData.schema,
      isPublished: validatedData.isPublished
    })
    
    console.log('✅ Form created successfully:', newForm.id)
    
    return NextResponse.json({
      success: true,
      form: newForm,
      message: 'Form created successfully!'
    }, { status: 201 })
    
  } catch (error) {
    console.error('❌ Failed to create form:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid form data',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create form',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
