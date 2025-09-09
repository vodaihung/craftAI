import { eq, desc, count } from 'drizzle-orm'
import { db, users, forms, formResponses, checkDbHealth, type User, type NewUser, type Form, type FormResponse, type NewForm, type NewFormResponse } from './index'

// Simple in-memory cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

function getCacheKey(operation: string, params: any[]): string {
  return `${operation}:${JSON.stringify(params)}`
}

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null

  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key)
    return null
  }

  return cached.data as T
}

function setCache<T>(key: string, data: T, ttlMs: number = 60000): void {
  // Limit cache size to prevent memory leaks
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value
    cache.delete(oldestKey)
  }

  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  })
}

// Database operation wrapper with health check
async function withHealthCheck<T>(operation: () => Promise<T>): Promise<T> {
  const isHealthy = await checkDbHealth()
  if (!isHealthy) {
    throw new Error('Database is not healthy')
  }
  return operation()
}

// User queries
export async function createUser(userData: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(userData).returning()
  return user
}

// Create user with password for manual authentication
export async function createUserWithPassword(userData: {
  email: string
  name: string
  password: string
}): Promise<User> {
  const [user] = await db.insert(users).values({
    email: userData.email,
    name: userData.name,
    password: userData.password,
  }).returning()
  return user
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const cacheKey = getCacheKey('getUserByEmail', [email])
  const cached = getFromCache<User | null>(cacheKey)
  if (cached !== null) return cached

  const result = await withHealthCheck(async () => {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return user || null
  })

  // Cache user data for 5 minutes
  setCache(cacheKey, result, 300000)
  return result
}

export async function getUserById(id: string): Promise<User | null> {
  const cacheKey = getCacheKey('getUserById', [id])
  const cached = getFromCache<User | null>(cacheKey)
  if (cached !== null) return cached

  const result = await withHealthCheck(async () => {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return user || null
  })

  // Cache user data for 5 minutes
  setCache(cacheKey, result, 300000)
  return result
}

// Form queries
export async function createForm(formData: NewForm): Promise<Form> {
  const [form] = await db.insert(forms).values(formData).returning()
  return form
}

export async function getFormById(id: string): Promise<Form | null> {
  const cacheKey = getCacheKey('getFormById', [id])
  const cached = getFromCache<Form | null>(cacheKey)
  if (cached !== null) return cached

  const result = await withHealthCheck(async () => {
    const [form] = await db.select().from(forms).where(eq(forms.id, id)).limit(1)
    return form || null
  })

  // Cache form data for 2 minutes (forms change more frequently)
  setCache(cacheKey, result, 120000)
  return result
}

export async function getAllForms(): Promise<Form[]> {
  return await db.select().from(forms).orderBy(desc(forms.createdAt))
}

export async function getFormsByUserId(userId: string): Promise<(Form & { responseCount: number })[]> {
  // First get the basic forms
  const basicForms = await db.select().from(forms).where(eq(forms.userId, userId)).orderBy(desc(forms.createdAt))

  // Then get response counts for each form
  const formsWithCounts = await Promise.all(
    basicForms.map(async (form) => {
      try {
        const responseCount = await getFormResponseCount(form.id)
        return {
          ...form,
          responseCount
        }
      } catch (error) {
        console.error('Error getting response count for form:', form.id, error)
        return {
          ...form,
          responseCount: 0
        }
      }
    })
  )

  return formsWithCounts
}

export async function getPublishedFormById(id: string): Promise<Form | null> {
  const [form] = await db.select().from(forms).where(eq(forms.id, id)).limit(1)
  return (form && form.isPublished) ? form : null
}

export async function updateForm(id: string, formData: Partial<NewForm>): Promise<Form | null> {
  const [form] = await db.update(forms).set(formData).where(eq(forms.id, id)).returning()
  return form || null
}

export async function deleteForm(id: string): Promise<boolean> {
  const result = await db.delete(forms).where(eq(forms.id, id))
  return result.rowCount > 0
}

export async function publishForm(id: string): Promise<Form | null> {
  return await updateForm(id, { isPublished: true })
}

export async function unpublishForm(id: string): Promise<Form | null> {
  return await updateForm(id, { isPublished: false })
}

// Form response queries
export async function createFormResponse(responseData: NewFormResponse): Promise<FormResponse> {
  const [response] = await db.insert(formResponses).values(responseData).returning()
  return response
}

export async function getFormResponses(formId: string): Promise<FormResponse[]> {
  return await db.select().from(formResponses).where(eq(formResponses.formId, formId)).orderBy(desc(formResponses.submittedAt))
}

export async function getFormResponseById(id: string): Promise<FormResponse | null> {
  const [response] = await db.select().from(formResponses).where(eq(formResponses.id, id)).limit(1)
  return response || null
}

export async function getFormResponseCount(formId: string): Promise<number> {
  const [result] = await db.select({ count: count() }).from(formResponses).where(eq(formResponses.formId, formId))
  return result.count
}

export async function deleteFormResponse(id: string): Promise<boolean> {
  const result = await db.delete(formResponses).where(eq(formResponses.id, id))
  return result.rowCount > 0
}

// Analytics queries
export async function getFormAnalytics(formId: string) {
  const responseCount = await getFormResponseCount(formId)
  const responses = await getFormResponses(formId)
  
  return {
    totalResponses: responseCount,
    recentResponses: responses.slice(0, 5), // Last 5 responses
    responseRate: responseCount > 0 ? 100 : 0, // Simplified - would need view tracking for real rate
  }
}

export async function getGlobalFormStats() {
  const allForms = await getAllForms()
  const totalForms = allForms.length
  const publishedForms = allForms.filter(form => form.isPublished).length

  let totalResponses = 0
  for (const form of allForms) {
    const count = await getFormResponseCount(form.id)
    totalResponses += count
  }

  return {
    totalForms,
    publishedForms,
    totalResponses,
    averageResponsesPerForm: totalForms > 0 ? Math.round(totalResponses / totalForms) : 0,
  }
}
