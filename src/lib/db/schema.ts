import { pgTable, uuid, text, jsonb, boolean, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'), // For manual authentication
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Forms table
export const forms = pgTable('forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  schema: jsonb('schema').notNull(), // stores form fields and configurations
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Form Responses table
export const formResponses = pgTable('form_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').references(() => forms.id, { onDelete: 'cascade' }).notNull(),
  data: jsonb('data').notNull(), // stores submitted form values
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
})

// Zod schemas for validation
export const insertFormSchema = createInsertSchema(forms)
export const selectFormSchema = createSelectSchema(forms)
export const insertFormResponseSchema = createInsertSchema(formResponses)
export const selectFormResponseSchema = createSelectSchema(formResponses)

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Form = typeof forms.$inferSelect
export type NewForm = typeof forms.$inferInsert
export type FormResponse = typeof formResponses.$inferSelect
export type NewFormResponse = typeof formResponses.$inferInsert

// Form field types for the schema JSONB
export const FormFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'email', 'textarea', 'number', 'select', 'radio', 'checkbox', 'rating', 'date', 'file']),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for select, radio, checkbox
  scale: z.number().optional(), // for rating fields
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
  fileConfig: z.object({
    maxSize: z.number().optional(), // in MB
    allowedTypes: z.array(z.string()).optional(), // MIME types
    multiple: z.boolean().optional(),
  }).optional(), // for file fields
})

export const FormSchemaSchema = z.object({
  id: z.string().optional(), // Optional ID for saved forms
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema),
  settings: z.object({
    submitButtonText: z.string().default('Submit'),
    successMessage: z.string().default('Thank you for your submission!'),
    allowMultipleSubmissions: z.boolean().default(true),
  }).optional(),
})

export type FormField = z.infer<typeof FormFieldSchema>
export type FormSchema = z.infer<typeof FormSchemaSchema>


