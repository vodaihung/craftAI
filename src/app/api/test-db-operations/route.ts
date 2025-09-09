import { NextResponse } from 'next/server'
import { createForm, getAllForms, getFormById, createFormResponse, getFormResponses } from '@/lib/db/queries'
import type { FormSchema } from '@/lib/db/schema'

export async function GET() {
  try {
    console.log('🧪 Testing database operations...')
    
    // Test form creation
    const sampleFormSchema: FormSchema = {
      title: 'Test Contact Form',
      description: 'A simple test form for database operations',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Full Name',
          required: true,
          placeholder: 'Enter your full name'
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
          placeholder: 'Enter your email'
        },
        {
          id: 'message',
          type: 'textarea',
          label: 'Message',
          required: false,
          placeholder: 'Enter your message'
        }
      ],
      settings: {
        submitButtonText: 'Send Message',
        successMessage: 'Thank you for your message!',
        allowMultipleSubmissions: true
      }
    }

    console.log('📝 Creating test form...')
    const newForm = await createForm({
      userId: 'test-user-id',
      name: 'Test Contact Form',
      schema: sampleFormSchema,
      isPublished: true
    })
    console.log('✅ Form created:', newForm.id)

    // Test form retrieval
    console.log('📖 Retrieving form by ID...')
    const retrievedForm = await getFormById(newForm.id)
    console.log('✅ Form retrieved:', retrievedForm?.name)

    // Test form listing
    console.log('📋 Getting all forms...')
    const allForms = await getAllForms()
    console.log('✅ Total forms:', allForms.length)

    // Test form response creation
    console.log('💬 Creating test response...')
    const sampleResponse = await createFormResponse({
      formId: newForm.id,
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message from the database operations test.'
      }
    })
    console.log('✅ Response created:', sampleResponse.id)

    // Test response retrieval
    console.log('📥 Getting form responses...')
    const responses = await getFormResponses(newForm.id)
    console.log('✅ Total responses:', responses.length)

    return NextResponse.json({
      success: true,
      message: 'Database operations test completed successfully! ✅',
      results: {
        formCreated: {
          id: newForm.id,
          name: newForm.name,
          isPublished: newForm.isPublished
        },
        formRetrieved: {
          id: retrievedForm?.id,
          name: retrievedForm?.name
        },
        totalForms: allForms.length,
        responseCreated: {
          id: sampleResponse.id,
          formId: sampleResponse.formId
        },
        totalResponses: responses.length,
        sampleResponseData: responses[0]?.data
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Database operations test failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database operations test failed ❌',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
