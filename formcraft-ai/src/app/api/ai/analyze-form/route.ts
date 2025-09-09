import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { FormSchemaSchema } from '@/lib/db/schema'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Analysis result schema
const FormAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('Overall form quality score out of 100'),
  issues: z.array(z.object({
    type: z.enum(['critical', 'warning', 'suggestion']),
    category: z.enum(['ux', 'conversion', 'accessibility', 'performance', 'structure']),
    title: z.string(),
    description: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    solution: z.string()
  })),
  strengths: z.array(z.string()),
  recommendations: z.array(z.object({
    priority: z.enum(['high', 'medium', 'low']),
    title: z.string(),
    description: z.string(),
    expectedImpact: z.string()
  })),
  summary: z.string()
})

// Request schema
const AnalyzeFormRequestSchema = z.object({
  formSchema: FormSchemaSchema,
  context: z.object({
    responseCount: z.number().optional(),
    completionRate: z.number().optional(),
    averageTimeToComplete: z.number().optional(),
    commonDropOffPoints: z.array(z.string()).optional(),
    userQuestion: z.string().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
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
        error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.'
      }, { status: 500 })
    }

    // Parse request body
    const body = await request.json()
    const { formSchema, context = {} } = AnalyzeFormRequestSchema.parse(body)

    console.log('🔍 Analyzing form:', formSchema.title)

    // Build analysis prompt
    const systemPrompt = `You are an expert UX researcher and form optimization specialist. Your job is to analyze form schemas and provide actionable insights to improve user experience and conversion rates.

Analyze the provided form considering:

**UX & Usability:**
- Field order and logical flow
- Label clarity and helpfulness
- Required vs optional field balance
- Form length and complexity
- Mobile-friendliness considerations

**Conversion Optimization:**
- Potential friction points
- Drop-off risks
- Trust and credibility factors
- Call-to-action effectiveness

**Accessibility:**
- Field labeling
- Required field indicators
- Error handling considerations
- Screen reader compatibility

**Performance Factors:**
- Form completion time estimates
- Cognitive load assessment
- User motivation alignment

**Best Practices:**
- Industry standards compliance
- Progressive disclosure opportunities
- Field validation approaches
- Success messaging

Provide specific, actionable recommendations with clear explanations of expected impact.`

    const userPrompt = `Please analyze this form:

**Form Schema:**
${JSON.stringify(formSchema, null, 2)}

**Performance Context:**
${context.responseCount ? `- Response Count: ${context.responseCount}` : ''}
${context.completionRate ? `- Completion Rate: ${context.completionRate}%` : ''}
${context.averageTimeToComplete ? `- Average Completion Time: ${context.averageTimeToComplete} seconds` : ''}
${context.commonDropOffPoints?.length ? `- Common Drop-off Points: ${context.commonDropOffPoints.join(', ')}` : ''}

${context.userQuestion ? `**Specific Question:** ${context.userQuestion}` : ''}

Provide a comprehensive analysis with specific, actionable recommendations.`

    // Generate analysis using AI
    const { object: analysis } = await generateObject({
      model: openai('gpt-4o-mini'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      schema: FormAnalysisSchema,
      temperature: 0.3, // Lower temperature for more consistent analysis
    })

    console.log('✅ Form analysis completed')

    return NextResponse.json({
      success: true,
      analysis,
      message: 'Form analysis completed successfully!'
    })

  } catch (error) {
    console.error('❌ Form analysis failed:', error)

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
      error: 'Failed to analyze form. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'AI Form Analysis API is running',
    usage: 'POST to this endpoint with a form schema to get analysis and recommendations',
    example: {
      formSchema: { /* FormSchema object */ },
      context: {
        responseCount: 150,
        completionRate: 65,
        userQuestion: "Why isn't my form getting responses?"
      }
    }
  })
}
