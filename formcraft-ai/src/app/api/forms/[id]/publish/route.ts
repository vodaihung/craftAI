import { NextRequest, NextResponse } from 'next/server'
import { getFormById, publishForm, unpublishForm } from '@/lib/db/queries'

// POST /api/forms/[id]/publish - Publish a form
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`📢 Publishing form: ${id}`)
    
    // Check if form exists
    const existingForm = await getFormById(id)
    if (!existingForm) {
      return NextResponse.json({
        success: false,
        error: 'Form not found'
      }, { status: 404 })
    }
    
    // Publish form
    const publishedForm = await publishForm(id)
    
    if (!publishedForm) {
      return NextResponse.json({
        success: false,
        error: 'Failed to publish form'
      }, { status: 500 })
    }
    
    console.log('✅ Form published successfully')
    
    return NextResponse.json({
      success: true,
      form: publishedForm,
      message: 'Form published successfully!',
      publicUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/forms/${id}`
    })
    
  } catch (error) {
    console.error('❌ Failed to publish form:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to publish form',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/forms/[id]/publish - Unpublish a form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`📝 Unpublishing form: ${id}`)
    
    // Check if form exists
    const existingForm = await getFormById(id)
    if (!existingForm) {
      return NextResponse.json({
        success: false,
        error: 'Form not found'
      }, { status: 404 })
    }
    
    // Unpublish form
    const unpublishedForm = await unpublishForm(id)
    
    if (!unpublishedForm) {
      return NextResponse.json({
        success: false,
        error: 'Failed to unpublish form'
      }, { status: 500 })
    }
    
    console.log('✅ Form unpublished successfully')
    
    return NextResponse.json({
      success: true,
      form: unpublishedForm,
      message: 'Form unpublished successfully!'
    })
    
  } catch (error) {
    console.error('❌ Failed to unpublish form:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to unpublish form',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
