import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getFormById, getFormAnalytics } from '@/lib/db/queries'
import { z } from 'zod'

// Request schema for troubleshooting
const TroubleshootRequestSchema = z.object({
  formId: z.string().uuid('Invalid form ID'),
  issue: z.string().min(1, 'Issue description is required'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([])
})

// Response schema for troubleshooting suggestions
const TroubleshootResponseSchema = z.object({
  diagnosis: z.string().describe('Analysis of the potential issue'),
  suggestions: z.array(z.object({
    title: z.string().describe('Brief title of the suggestion'),
    description: z.string().describe('Detailed explanation of the suggestion'),
    priority: z.enum(['high', 'medium', 'low']).describe('Priority level of this suggestion'),
    category: z.enum(['design', 'technical', 'content', 'analytics', 'user-experience']).describe('Category of the suggestion')
  })).describe('List of actionable suggestions to resolve the issue'),
  followUpQuestions: z.array(z.string()).describe('Questions to gather more information if needed')
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'AI troubleshooting is not available. OpenAI API key is not configured.'
      }, { status: 500 })
    }

    // Parse request body
    const body = await request.json()
    const { formId, issue, conversationHistory = [] } = TroubleshootRequestSchema.parse(body)

    console.log('🔧 Troubleshooting form:', formId, 'Issue:', issue)

    // Get form data and analytics
    const form = await getFormById(formId)
    if (!form) {
      return NextResponse.json({
        success: false,
        error: 'Form not found'
      }, { status: 404 })
    }

    // Verify user owns this form
    if (form.userId !== session.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 })
    }

    const analytics = await getFormAnalytics(formId)

    // Build context for AI
    const formContext = {
      name: form.name,
      isPublished: form.isPublished,
      createdAt: form.createdAt,
      fieldCount: form.schema?.fields?.length || 0,
      fieldTypes: form.schema?.fields?.map((f: { type: string }) => f.type) || [],
      totalResponses: analytics.totalResponses,
      responseRate: analytics.responseRate
    }

    // Build conversation context
    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert form optimization consultant. Your job is to help users troubleshoot and improve their forms.

Form Context:
- Name: ${formContext.name}
- Status: ${formContext.isPublished ? 'Published' : 'Draft'}
- Created: ${new Date(formContext.createdAt).toLocaleDateString()}
- Fields: ${formContext.fieldCount} fields (${formContext.fieldTypes.join(', ')})
- Responses: ${formContext.totalResponses} total responses
- Response Rate: ${formContext.responseRate}%

Your role:
1. Analyze the user's issue in the context of their form data
2. Provide specific, actionable suggestions
3. Prioritize suggestions by impact and ease of implementation
4. Ask follow-up questions if you need more information
5. Focus on practical solutions that improve form performance

Always provide concrete, implementable advice based on form optimization best practices.`
      },
      ...conversationHistory,
      {
        role: 'user' as const,
        content: `I'm having an issue with my form: ${issue}`
      }
    ]

    // Generate troubleshooting response using AI
    const { object: troubleshootResponse } = await generateObject({
      model: openai('gpt-4o-mini'),
      messages,
      schema: TroubleshootResponseSchema,
      temperature: 0.7,
    })

    console.log('✅ Troubleshooting response generated successfully')

    return NextResponse.json({
      success: true,
      troubleshooting: troubleshootResponse,
      formContext,
      message: 'Troubleshooting analysis complete!'
    })

  } catch (error) {
    console.error('❌ Failed to generate troubleshooting response:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to generate troubleshooting response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'AI Form Troubleshooting API is running',
    usage: 'POST to this endpoint with formId and issue description',
    example: {
      formId: 'uuid-of-form',
      issue: 'My form is not getting many responses',
      conversationHistory: []
    }
  })
}
