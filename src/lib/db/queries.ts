import { eq, desc, count } from 'drizzle-orm'
import { db, users, forms, formResponses, type User, type Form, type FormResponse, type NewUser, type NewForm, type NewFormResponse } from './index'

// User queries
export async function createUser(userData: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(userData).returning()
  return user
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user || null
}

export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user || null
}

// Form queries
export async function createForm(formData: NewForm): Promise<Form> {
  const [form] = await db.insert(forms).values(formData).returning()
  return form
}

export async function getFormById(id: string): Promise<Form | null> {
  const [form] = await db.select().from(forms).where(eq(forms.id, id)).limit(1)
  return form || null
}

export async function getFormsByUserId(userId: string): Promise<Form[]> {
  return await db.select().from(forms).where(eq(forms.userId, userId)).orderBy(desc(forms.createdAt))
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

export async function getUserFormStats(userId: string) {
  const userForms = await getFormsByUserId(userId)
  const totalForms = userForms.length
  const publishedForms = userForms.filter(form => form.isPublished).length
  
  let totalResponses = 0
  for (const form of userForms) {
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
