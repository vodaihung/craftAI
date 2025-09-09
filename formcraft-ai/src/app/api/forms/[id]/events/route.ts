import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getFormById } from '@/lib/db/queries'

// GET /api/forms/[id]/events - Server-Sent Events for real-time form updates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params
    console.log(`📡 Starting SSE connection for form: ${id}`)

    // Validate form ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return new NextResponse('Invalid form ID format', { status: 400 })
    }

    // Verify form exists and user owns it
    const form = await getFormById(id)
    if (!form) {
      return new NextResponse('Form not found', { status: 404 })
    }
    
    if (form.userId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Create SSE response
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = JSON.stringify({
          type: 'connected',
          formId: id,
          timestamp: new Date().toISOString()
        })
        
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        
        // Set up periodic heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            const heartbeatData = JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })
            controller.enqueue(encoder.encode(`data: ${heartbeatData}\n\n`))
          } catch (error) {
            console.log('SSE heartbeat error:', error)
            clearInterval(heartbeat)
          }
        }, 30000) // Every 30 seconds
        
        // Simulate real-time events (in a real app, this would listen to database changes)
        const eventSimulator = setInterval(() => {
          try {
            // Randomly send different types of events
            const eventTypes = ['new_response', 'form_view', 'form_share']
            const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)]
            
            // Only send events occasionally to avoid spam
            if (Math.random() > 0.7) {
              const eventData = JSON.stringify({
                type: randomEvent,
                formId: id,
                timestamp: new Date().toISOString(),
                data: generateMockEventData(randomEvent)
              })
              
              controller.enqueue(encoder.encode(`data: ${eventData}\n\n`))
            }
          } catch (error) {
            console.log('SSE event simulation error:', error)
            clearInterval(eventSimulator)
          }
        }, 10000) // Every 10 seconds
        
        // Clean up on close
        request.signal.addEventListener('abort', () => {
          console.log(`📡 SSE connection closed for form: ${id}`)
          clearInterval(heartbeat)
          clearInterval(eventSimulator)
          controller.close()
        })
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    })
    
  } catch (error) {
    console.error('❌ SSE endpoint error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

function generateMockEventData(eventType: string) {
  switch (eventType) {
    case 'new_response':
      return {
        responseId: `resp_${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: new Date().toISOString(),
        preview: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      }
    case 'form_view':
      return {
        viewId: `view_${Math.random().toString(36).substr(2, 9)}`,
        userAgent: 'Mozilla/5.0...',
        referrer: 'https://example.com'
      }
    case 'form_share':
      return {
        shareId: `share_${Math.random().toString(36).substr(2, 9)}`,
        platform: 'email',
        sharedBy: 'user'
      }
    default:
      return {}
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
