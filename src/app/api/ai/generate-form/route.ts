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
  })).optional(),
  currentFormSchema: FormSchemaSchema.optional()
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
    const { prompt, conversationHistory = [], currentFormSchema } = GenerateFormRequestSchema.parse(body)

    console.log('🤖 Generating form from prompt:', prompt)

    // Build conversation context
    const systemPrompt = currentFormSchema
      ? `You are an expert form builder AI and UX consultant. Your job is to modify existing form schemas based on user requests while providing helpful guidance.

IMPORTANT: You are working with an EXISTING form. The user wants to modify it, not create a new one from scratch.

Current form schema:
${JSON.stringify(currentFormSchema, null, 2)}

Guidelines for modifications:
- PRESERVE existing fields unless explicitly asked to remove them
- When adding fields, append them to the existing fields array
- When removing fields, only remove the specifically mentioned fields
- When modifying fields, only change the requested properties
- Keep the same form title and description unless explicitly asked to change them
- When asked to change the title, update ONLY the title field, keep all other properties the same
- Detect title change requests from phrases like "change title to", "rename to", "call it", etc.
- Maintain field IDs for existing fields to preserve form data
- For new fields, generate unique IDs that don't conflict with existing ones

User request types:
- "Add [field]" → Add new field(s) while keeping all existing fields
- "Remove [field]" → Remove only the specified field(s)
- "Change [field]" → Modify only the specified field properties
- "Make [field] required/optional" → Update only the required property
- "Change the form title to [title]" → Update only the form title
- "Rename the form to [title]" → Update only the form title
- "Call the form [title]" → Update only the form title

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
- file: File upload (specify allowed types and size limits)

CONVERSATIONAL INTELLIGENCE:
- If the request is vague or could benefit from clarification, ask specific follow-up questions
- Provide proactive suggestions for improving the form
- Consider UX best practices and suggest improvements
- If adding complex fields (like select/radio), suggest appropriate options

Always respond with the COMPLETE modified form schema, preserving all existing fields unless explicitly asked to remove them.`
      : `You are an expert form builder AI and UX consultant. Your job is to convert natural language descriptions into structured form schemas while providing intelligent guidance.

CONVERSATIONAL INTELLIGENCE:
- If the request is vague, ask clarifying questions to create better forms
- Suggest improvements and best practices proactively
- Consider the form's purpose and target audience
- Ask about specific requirements when they could impact the form design

Examples of good clarifying questions:
- "Should the rating be 1-5 stars or 1-10 scale?"
- "Would you like the phone number field to be required or optional?"
- "Should I add any validation rules for the email field?"
- "Do you want to collect any additional contact information?"

Guidelines:
- Create forms that are user-friendly and accessible
- Use appropriate field types (text, email, textarea, number, select, radio, checkbox, rating, date, file)
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
- file: File upload (specify allowed types and size limits)

Always respond with a valid JSON schema that matches the FormSchema type.`

    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
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
        details: error.issues
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
