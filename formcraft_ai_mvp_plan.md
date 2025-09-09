# FormCraft AI - Detailed Implementation Plan

## Project Overview

**Objective:** Build an AI-powered form builder that lets users describe forms in natural language and instantly generates a working, shareable form.

**Key Skills Tested:**

- Neon PostgreSQL integration
- AI chat interface (Vercel AI SDK)
- Modern UI/UX (Tailwind CSS + Vercel AI Elements)
- Frontend-heavy features ("Troubleshoot with AI")
- Product thinking and feature prioritization

---

## 1. Tech Stack

| Layer             | Technology                       | Purpose                                              |
| ----------------- | -------------------------------- | ---------------------------------------------------- |
| Frontend          | Next.js 15 + App Router          | Page routing, SSR/SSG for public forms               |
| UI Components     | Vercel AI Elements, Tailwind CSS | Chat UI, form preview, modals, tables                |
| Backend           | Neon PostgreSQL                  | Form and response storage                            |
| ORM               | Drizzle ORM                      | Database queries and migrations                      |
| Auth              | Clerk / Auth.js                  | User management                                      |
| AI                | Vercel AI SDK                    | Natural language form generation and troubleshooting |
| Deployment        | Vercel                           | Hosting, serverless functions, edge runtime          |
| Real-time updates | WebSockets / SSE                 | New responses, analytics updates                     |

---

## 2. Project Structure

```
/formcraft-ai
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── [formId]/
│   │   │   ├── page.tsx
│   │   │   └── responses.tsx
│   ├── forms/
│   │   └── create.tsx
│   ├── api/
│       ├── ai/
│       │   └── generate-form.ts
│       ├── forms/
│       │   ├── create.ts
│       │   ├── get.ts
│       │   └── responses.ts
│       └── subscription/
│           └── check.ts
├── components/
│   ├── ChatInterface.tsx
│   ├── FormPreview.tsx
│   ├── ResponseTable.tsx
│   ├── Modal.tsx
│   └── Toast.tsx
├── lib/
│   ├── db.ts
│   ├── ai.ts
│   └── auth.ts
├── prisma/ (optional if using Prisma)
├── migrations/
└── types/
    └── form.ts
```

---

## 3. Database Schema (Neon/PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forms table
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schema JSONB NOT NULL, -- stores form fields and configurations
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form Responses table
CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- stores submitted form values
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Notes:**

- Use `JSONB` for flexible form schema and responses.
- Ensure proper indexing on `user_id` and `form_id` for fast queries.
- Optional: row-level security to prevent users from accessing other users' forms.

---

## 4. Feature Breakdown by Days

### Day 1-2: Foundation & Setup

- Initialize Next.js 15 project with App Router
- Install Tailwind CSS and configure dark/light mode
- Setup Neon PostgreSQL connection and Drizzle ORM
- Implement authentication (Clerk/Auth.js)
- Create database tables and migrations
- Setup base layouts, pages, and routing

### Day 3-4: AI Form Generator

- **Chat Interface**: Create `ChatInterface.tsx` component
- **AI Integration**:
  - Endpoint `api/ai/generate-form.ts`
  - Accept natural language input
  - Return structured form schema
- **Form Preview**: `FormPreview.tsx` dynamically renders schema
- Save generated forms to Neon
- Handle AI errors and malformed responses

### Day 5-6: Form Management & Responses

- **Dashboard** (`/dashboard`):
  - List user forms
  - View analytics (# responses, completion rate)
  - Share link generation
- **Public Form Pages** (`/forms/[formId]`):
  - Render form using schema
  - Handle form submissions
  - Display "Thank You" page
- Real-time updates (WebSockets or SSE) for new responses
- Responses table (`ResponseTable.tsx`) with filtering/sorting

### Day 7: Polish & Special Features

- **Troubleshoot with AI**:
  - Chat button opens AI to answer user queries
  - AI suggests UX improvements or debugging steps
- **Subscription UI**:
  - Free: max 3 forms
  - Pro: unlimited
  - Show prompts if limits exceeded
  - Non-functional mock upgrade button
- UI polish: animations, skeleton loading states, responsive design

---

## 5. AI Flow & Example

**User Interaction Flow:**

```
User: "I need a customer feedback form with rating, comments, and contact info"
AI: "Should the rating be 1-5 stars or 1-10 scale?"
User: "1-5 stars"
AI: Generates schema:
{
  "fields": [
    {"type": "text", "label": "Name", "required": true},
    {"type": "email", "label": "Email", "required": true},
    {"type": "rating", "label": "Rate our service", "scale": 5},
    {"type": "textarea", "label": "Comments"}
  ]
}
```

- **AI Endpoint**: validates input, returns JSON schema
- **Frontend**: dynamically renders form preview
- **Database**: stores schema in `forms` table

---

## 6. UI/UX Components

| Component     | Purpose                                         |
| ------------- | ----------------------------------------------- |
| ChatInterface | AI conversation with user                       |
| FormPreview   | Real-time rendering of generated forms          |
| ResponseTable | Display responses with filters and analytics    |
| Modal         | Settings, subscription, AI troubleshooting      |
| Toast         | Notifications for save, error, success          |
| Skeleton      | Loading placeholders for AI responses or tables |

**Design Notes:**

- Mobile-first, responsive
- Smooth transitions/animations
- Loading states for AI and form submissions
- Dark/light toggle support

---

## 7. Testing & Quality Assurance

- **Unit Tests**:
  - Database queries (Drizzle ORM)
  - API endpoints (AI generation, form submission)
- **Integration Tests**:
  - End-to-end form creation and submission
  - Dashboard analytics updates
- **UI Tests**:
  - Chat interface renders correctly
  - Form preview matches AI schema
- **Manual Testing**:
  - Check multi-device responsiveness
  - Test AI error handling

---

## 8. Deployment

- Use **Vercel** for deployment
- Environment variables:
  - `NEON_DB_URL`
  - `AI_API_KEY`
  - `AUTH_SECRET` (if needed)
- Setup CI/CD: push to main → auto-deploy

---

## 9. Bonus Feature Ideas (Optional)

- File upload fields
- Conditional logic (show/hide fields)
- Multi-step forms
- AI-generated form templates
- Webhook integration (Slack, email)
- Collaboration features (multi-user editing)
- White-labeling forms

---

## 10. Deliverables

1. GitHub repository with full source code & README
2. Live demo on Vercel
3. Loom video (5 mins) showcasing:
   - AI form generation
   - Form dashboard
   - Responses view
   - "Troubleshoot with AI"
4. Write-up explaining:
   - Technical decisions
   - Trade-offs
   - Bonus features if implemented

---

## 11. Time Allocation (15-20 Hours)

| Day | Tasks                                               |
| --- | --------------------------------------------------- |
| 1-2 | Setup, database, auth, project structure            |
| 3-4 | AI chat interface, form generation, preview         |
| 5-6 | Dashboard, public forms, form submission, analytics |
| 7   | Troubleshoot AI, subscription UI, polish & deploy   |

