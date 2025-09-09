import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { forms, formResponses } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { id: formId, responseId } = resolvedParams

    console.log(`🗑️ Deleting response: ${responseId} from form: ${formId}`)

    // Verify the form belongs to the user
    const form = await db
      .select()
      .from(forms)
      .where(and(eq(forms.id, formId), eq(forms.userId, session.user.id)))
      .limit(1)

    if (form.length === 0) {
      return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 })
    }

    // Delete the response
    const deletedResponse = await db
      .delete(formResponses)
      .where(and(eq(formResponses.id, responseId), eq(formResponses.formId, formId)))
      .returning()

    if (deletedResponse.length === 0) {
      return NextResponse.json({ success: false, error: 'Response not found' }, { status: 404 })
    }

    console.log(`✅ Response deleted successfully: ${responseId}`)

    return NextResponse.json({
      success: true,
      message: 'Response deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting response:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
