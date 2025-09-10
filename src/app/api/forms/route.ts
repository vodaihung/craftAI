import { NextRequest, NextResponse } from 'next/server'
import { createForm, getAllForms, getFormsByUserId } from '@/lib/db/queries'
import { insertFormSchema, FormSchemaSchema } from '@/lib/db/schema'
import { requireAuth } from '@/lib/session'
import { logProductionCookieDebug } from '@/lib/production-auth-debug'
import { z } from 'zod'

// Simple in-memory cache for forms data
const formsCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

function getCacheKey(userId: string): string {
  return `forms:${userId}`
}

function getFromCache<T>(key: string): T | null {
  const cached = formsCache.get(key)
  if (!cached) return null

  if (Date.now() - cached.timestamp > cached.ttl) {
    formsCache.delete(key)
    return null
  }

  return cached.data as T
}

function setCache<T>(key: string, data: T, ttlMs: number = 120000): void {
  // Limit cache size to prevent memory leaks
  if (formsCache.size > 50) {
    const oldestKey = formsCache.keys().next().value
    if (oldestKey) formsCache.delete(oldestKey)
  }

  formsCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  })
}

function invalidateCache(userId: string): void {
  const key = getCacheKey(userId)
  formsCache.delete(key)
}

// Request schema for creating forms
const CreateFormRequestSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  schema: FormSchemaSchema,
  isPublished: z.boolean().optional().default(false)
})

// GET /api/forms - Get user's forms
export async function GET(request: NextRequest) {
  try {
    // PRODUCTION: Enhanced debugging for authentication issues
    logProductionCookieDebug(request)

    const session = await requireAuth()
    const userId = session.userId

    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published')

    console.log('📋 Fetching forms for user:', userId)

    // Check cache first
    const cacheKey = getCacheKey(userId)
    const cachedForms = getFromCache(cacheKey)

    if (cachedForms) {
      // Filter cached results by published status if specified
      const filteredForms = published !== null
        ? (cachedForms as any[]).filter((form: { isPublished: boolean }) => form.isPublished === (published === 'true'))
        : cachedForms

      console.log(`✅ Retrieved ${(filteredForms as any[]).length} forms from cache`)
      return NextResponse.json({
        success: true,
        forms: filteredForms,
        total: (filteredForms as any[]).length
      })
    }

    const forms = await getFormsByUserId(userId)

    // Cache the results for 2 minutes
    setCache(cacheKey, forms, 120000)

    // Filter by published status if specified
    const filteredForms = published !== null
      ? forms.filter(form => form.isPublished === (published === 'true'))
      : forms

    console.log(`✅ Retrieved ${filteredForms.length} forms from database`)

    return NextResponse.json({
      success: true,
      forms: filteredForms,
      total: filteredForms.length
    })

  } catch (error) {
    console.error('❌ Failed to fetch forms:', error)

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch forms',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/forms - Create a new form
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.userId

    const body = await request.json()
    console.log('📝 Creating new form for user:', userId)

    // Validate request body
    const validatedData = CreateFormRequestSchema.parse(body)

    // Create form in database
    const newForm = await createForm({
      userId: userId,
      name: validatedData.name,
      schema: validatedData.schema,
      isPublished: validatedData.isPublished
    })

    // Invalidate cache when new form is created
    invalidateCache(userId)

    console.log('✅ Form created successfully:', newForm.id)
    
    return NextResponse.json({
      success: true,
      form: newForm,
      message: 'Form created successfully!'
    }, { status: 201 })
    
  } catch (error) {
    console.error('❌ Failed to create form:', error)

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid form data',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create form',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
