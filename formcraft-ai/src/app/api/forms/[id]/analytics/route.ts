import { NextRequest, NextResponse } from 'next/server'
import { getFormById, getFormAnalytics } from '@/lib/db/queries'

// GET /api/forms/[id]/analytics - Get form analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`📊 Fetching analytics for form: ${id}`)
    
    // Check if form exists
    const existingForm = await getFormById(id)
    if (!existingForm) {
      return NextResponse.json({
        success: false,
        error: 'Form not found'
      }, { status: 404 })
    }
    
    // Get analytics
    const analytics = await getFormAnalytics(id)
    
    console.log('✅ Analytics retrieved successfully')
    
    return NextResponse.json({
      success: true,
      analytics: {
        formId: id,
        formName: existingForm.name,
        isPublished: existingForm.isPublished,
        createdAt: existingForm.createdAt,
        ...analytics
      }
    })
    
  } catch (error) {
    console.error('❌ Failed to fetch analytics:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
