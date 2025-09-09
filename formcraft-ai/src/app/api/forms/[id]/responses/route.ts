import { NextRequest, NextResponse } from 'next/server'
import { getFormById, getFormResponses, getFormResponseCount } from '@/lib/db/queries'

// GET /api/forms/[id]/responses - Get form responses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeData = searchParams.get('includeData') === 'true'
    
    console.log(`📊 Fetching responses for form: ${id}`)
    
    // Check if form exists
    const form = await getFormById(id)
    if (!form) {
      return NextResponse.json({
        success: false,
        error: 'Form not found'
      }, { status: 404 })
    }
    
    // Get responses
    const responses = await getFormResponses(id)
    const totalCount = await getFormResponseCount(id)
    
    // Limit responses if requested
    const limitedResponses = limit > 0 ? responses.slice(0, limit) : responses
    
    // Optionally exclude response data for privacy/performance
    const processedResponses = includeData 
      ? limitedResponses
      : limitedResponses.map(response => ({
          id: response.id,
          formId: response.formId,
          submittedAt: response.submittedAt,
          // responseData excluded for privacy
        }))
    
    console.log(`✅ Retrieved ${processedResponses.length} responses`)
    
    return NextResponse.json({
      success: true,
      responses: processedResponses,
      total: totalCount,
      formName: form.name,
      formId: form.id
    })
    
  } catch (error) {
    console.error('❌ Failed to fetch responses:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch responses',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
