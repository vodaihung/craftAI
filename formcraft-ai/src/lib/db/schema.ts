import { pgTable, uuid, text, jsonb, boolean, timestamp, integer, primaryKey } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import type { AdapterAccount } from '@auth/core/adapters'

// Users table (for NextAuth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'), // For manual authentication
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Accounts table (for NextAuth OAuth)
export const accounts = pgTable(
  'account',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

// Sessions table (for NextAuth)
export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

// Verification tokens table (for NextAuth)
export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

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
  type: z.enum(['text', 'email', 'textarea', 'number', 'select', 'radio', 'checkbox', 'rating', 'date']),
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
})

export const FormSchemaSchema = z.object({
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


