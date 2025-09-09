# FormCraft AI - Database Setup

## Overview

FormCraft AI uses **Neon PostgreSQL** as the database with **Drizzle ORM** for type-safe database operations.

## Database Schema

The application uses three main tables:

### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Forms Table
```sql
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schema JSONB NOT NULL, -- stores form fields and configurations
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Form Responses Table
```sql
CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- stores submitted form values
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and update with your Neon database URL:

```bash
cp .env.example .env.local
```

Update the `DATABASE_URL` in `.env.local`:
```
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 2. Database Migration

Generate and run migrations:

```bash
# Generate migration files
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 3. Database Studio (Optional)

View and manage your database with Drizzle Studio:

```bash
npm run db:studio
```

## Available Scripts

- `npm run db:generate` - Generate migration files from schema
- `npm run db:migrate` - Run pending migrations
- `npm run db:push` - Push schema directly to database (dev only)
- `npm run db:studio` - Open Drizzle Studio

## File Structure

```
src/lib/db/
├── index.ts          # Database connection and exports
├── schema.ts         # Database schema definitions
├── queries.ts        # Database query functions
└── connection-test.ts # Connection testing utility
```

## Usage Examples

### Creating a User
```typescript
import { createUser } from '@/lib/db/queries'

const user = await createUser({
  email: 'user@example.com',
  name: 'John Doe'
})
```

### Creating a Form
```typescript
import { createForm } from '@/lib/db/queries'

const form = await createForm({
  userId: user.id,
  name: 'Contact Form',
  schema: {
    title: 'Contact Us',
    fields: [
      { id: '1', type: 'text', label: 'Name', required: true },
      { id: '2', type: 'email', label: 'Email', required: true }
    ]
  }
})
```

### Submitting a Response
```typescript
import { createFormResponse } from '@/lib/db/queries'

const response = await createFormResponse({
  formId: form.id,
  data: {
    '1': 'John Doe',
    '2': 'john@example.com'
  }
})
```

## Type Safety

All database operations are fully type-safe using Drizzle ORM with TypeScript. The schema exports types for:

- `User`, `NewUser`
- `Form`, `NewForm` 
- `FormResponse`, `NewFormResponse`
- `FormField`, `FormSchema`

## Next Steps

1. Set up your Neon database
2. Update environment variables
3. Run database migrations
4. Start building the AI form generation features!
