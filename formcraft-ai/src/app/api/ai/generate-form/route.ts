import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { FormSchemaSchema } from '@/lib/db/schema'

// Request schema
const GenerateFormRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.'
      }, { status: 500 })
    }

    // Parse request body
    const body = await request.json()
    const { prompt, conversationHistory = [] } = GenerateFormRequestSchema.parse(body)

    console.log('🤖 Generating form from prompt:', prompt)

    // Build conversation context
    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert form builder AI. Your job is to convert natural language descriptions into structured form schemas.

Guidelines:
- Create forms that are user-friendly and accessible
- Use appropriate field types (text, email, textarea, number, select, radio, checkbox, rating, date)
- Set reasonable validation rules
- Include helpful placeholder text
- Make required fields logical and minimal
- For rating fields, use a scale of 1-5 unless specified otherwise
- For select/radio/checkbox fields, provide reasonable options
- Keep form titles concise and descriptive
- Add helpful descriptions when beneficial

Field types available:
- text: Single line text input
- email: Email address input with validation
- textarea: Multi-line text input
- number: Numeric input
- select: Dropdown selection
- radio: Single choice from multiple options
- checkbox: Multiple choice selection
- rating: Star rating (1-5 scale by default)
- date: Date picker

Always respond with a valid JSON schema that matches the FormSchema type.`
      },
      ...conversationHistory,
      {
        role: 'user' as const,
        content: prompt
      }
    ]

    // Generate form schema using AI
    const { object: formSchema } = await generateObject({
      model: openai('gpt-4o-mini'),
      messages,
      schema: FormSchemaSchema,
      temperature: 0.7,
    })

    console.log('✅ Form schema generated successfully')

    return NextResponse.json({
      success: true,
      formSchema,
      message: 'Form generated successfully!'
    })

  } catch (error) {
    console.error('❌ Form generation failed:', error)

    // Handle different types of errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        details: error.errors
      }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API configuration error. Please check your API key.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to generate form. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'AI Form Generation API is running',
    usage: 'POST to this endpoint with a "prompt" field to generate a form schema',
    example: {
      prompt: 'Create a contact form with name, email, and message fields'
    }
  })
}
