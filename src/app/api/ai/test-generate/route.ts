import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { FormSchemaSchema, type FormSchema } from '@/lib/db/schema'

// Request schema
const TestGenerateRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required')
})

// Mock form generation for testing without OpenAI API key
function generateMockFormSchema(prompt: string): FormSchema {
  const lowerPrompt = prompt.toLowerCase()
  
  // Analyze prompt to determine form type and fields
  const isContact = lowerPrompt.includes('contact') || lowerPrompt.includes('message')
  const isFeedback = lowerPrompt.includes('feedback') || lowerPrompt.includes('review') || lowerPrompt.includes('rating')
  const isRegistration = lowerPrompt.includes('register') || lowerPrompt.includes('signup') || lowerPrompt.includes('sign up')
  const isSurvey = lowerPrompt.includes('survey') || lowerPrompt.includes('questionnaire')

  if (isContact) {
    return {
      title: 'Contact Form',
      description: 'Get in touch with us',
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
          placeholder: 'Enter your email address'
        },
        {
          id: 'subject',
          type: 'text',
          label: 'Subject',
          required: false,
          placeholder: 'What is this about?'
        },
        {
          id: 'message',
          type: 'textarea',
          label: 'Message',
          required: true,
          placeholder: 'Enter your message here...'
        },
        {
          id: 'attachment',
          type: 'file',
          label: 'Attachment (Optional)',
          required: false,
          fileConfig: {
            maxSize: 50,
            allowedTypes: [], // Allow all file types
            multiple: true
          }
        }
      ],
      settings: {
        submitButtonText: 'Send Message',
        successMessage: 'Thank you for your message! We\'ll get back to you soon.',
        allowMultipleSubmissions: true
      }
    }
  }

  if (isFeedback) {
    return {
      title: 'Customer Feedback Form',
      description: 'Help us improve our service',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name (Optional)',
          required: false,
          placeholder: 'Your name'
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email (Optional)',
          required: false,
          placeholder: 'your@email.com'
        },
        {
          id: 'rating',
          type: 'rating',
          label: 'Overall Rating',
          required: true,
          scale: 5
        },
        {
          id: 'experience',
          type: 'select',
          label: 'How was your experience?',
          required: true,
          options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor']
        },
        {
          id: 'comments',
          type: 'textarea',
          label: 'Additional Comments',
          required: false,
          placeholder: 'Tell us more about your experience...'
        }
      ],
      settings: {
        submitButtonText: 'Submit Feedback',
        successMessage: 'Thank you for your feedback!',
        allowMultipleSubmissions: false
      }
    }
  }

  if (isRegistration) {
    return {
      title: 'Registration Form',
      description: 'Create your account',
      fields: [
        {
          id: 'firstName',
          type: 'text',
          label: 'First Name',
          required: true,
          placeholder: 'Enter your first name'
        },
        {
          id: 'lastName',
          type: 'text',
          label: 'Last Name',
          required: true,
          placeholder: 'Enter your last name'
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
          placeholder: 'Enter your email address'
        },
        {
          id: 'phone',
          type: 'text',
          label: 'Phone Number',
          required: false,
          placeholder: 'Enter your phone number'
        },
        {
          id: 'birthDate',
          type: 'date',
          label: 'Date of Birth',
          required: false
        }
      ],
      settings: {
        submitButtonText: 'Register',
        successMessage: 'Registration successful! Welcome aboard.',
        allowMultipleSubmissions: false
      }
    }
  }

  // Default generic form
  return {
    title: 'Custom Form',
    description: 'Please fill out this form',
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Name',
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
        id: 'message',
        type: 'textarea',
        label: 'Message',
        required: false,
        placeholder: 'Enter your message'
      }
    ],
    settings: {
      submitButtonText: 'Submit',
      successMessage: 'Thank you for your submission!',
      allowMultipleSubmissions: true
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { prompt } = TestGenerateRequestSchema.parse(body)

    console.log('🧪 Mock generating form from prompt:', prompt)

    // Generate mock form schema
    const formSchema = generateMockFormSchema(prompt)

    // Validate the generated schema
    const validatedSchema = FormSchemaSchema.parse(formSchema)

    console.log('✅ Mock form schema generated successfully')

    return NextResponse.json({
      success: true,
      formSchema: validatedSchema,
      message: 'Mock form generated successfully! (This is a test version without AI)',
      isMock: true
    })

  } catch (error) {
    console.error('❌ Mock form generation failed:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to generate mock form. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Mock AI Form Generation API for testing',
    usage: 'POST to this endpoint with a "prompt" field to generate a mock form schema',
    note: 'This is a test endpoint that doesn\'t require OpenAI API key',
    example: {
      prompt: 'Create a contact form with name, email, and message fields'
    }
  })
}
