# 🚀 FormCraft AI

**AI-Powered Form Builder with Natural Language Processing**

FormCraft AI is a modern, intelligent form builder that leverages artificial intelligence to create, analyze, and optimize forms through natural language interactions. Built with Next.js 15, TypeScript, and OpenAI's GPT models.

## ✨ Features

### 🤖 AI-Powered Form Generation
- **Natural Language Form Creation**: Describe your form in plain English and let AI generate it
- **Intelligent Field Suggestions**: AI recommends optimal field types and configurations
- **Conversational Form Building**: Iterative improvements through chat-like interactions
- **Smart Form Analysis**: Get AI-powered insights on form performance and UX

### 🎨 Modern Form Builder
- **Drag & Drop Interface**: Intuitive visual form builder
- **Real-time Preview**: See your forms as you build them
- **Template Library**: Pre-built templates for common use cases
- **Responsive Design**: Forms that work perfectly on all devices

### 📊 Analytics & Insights
- **Response Analytics**: Track form submissions and completion rates
- **Performance Metrics**: Monitor form engagement and drop-off points
- **AI-Powered Recommendations**: Get suggestions to improve form conversion
- **Export Capabilities**: Download responses in various formats

### 🔐 Secure Authentication
- **Manual Authentication**: Secure login/signup with bcrypt password hashing
- **JWT Sessions**: Stateless authentication with secure tokens
- **Protected Routes**: Role-based access control
- **Session Management**: Automatic token refresh and logout

### 🗄️ Robust Data Management
- **PostgreSQL Database**: Reliable data storage with Drizzle ORM
- **Type-Safe Queries**: Full TypeScript support for database operations
- **Real-time Updates**: Live form response notifications
- **File Upload Support**: Secure file handling and storage

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Drizzle ORM** - Type-safe database toolkit
- **PostgreSQL** - Robust relational database
- **Zod** - Schema validation

### AI Integration
- **OpenAI GPT-4** - Advanced language model
- **AI SDK** - Vercel's AI toolkit
- **Structured Generation** - Type-safe AI responses

### Authentication & Security
- **JWT** - Secure token-based authentication
- **bcryptjs** - Password hashing
- **JOSE** - JWT operations
- **HTTP-only Cookies** - Secure session storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd formcraft-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/formcraft"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
JWT_SECRET="your-jwt-secret-here"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Set up the database**
```bash
# Generate database schema
npm run db:generate

# Run migrations
npm run db:migrate

# Optional: Open Drizzle Studio
npm run db:studio
```

5. **Start the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── ai/           # AI-powered endpoints
│   │   ├── auth/         # Authentication endpoints
│   │   └── forms/        # Form management APIs
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # User dashboard
│   ├── forms/            # Public form pages
│   └── create/           # Form builder
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── dashboard/        # Dashboard-specific components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
└── lib/                  # Utilities and configurations
    ├── db/               # Database schema and queries
    └── auth.ts           # Authentication utilities
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate database schema
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
```

## 🌟 Key Features Deep Dive

### AI Form Generation
The AI system can understand natural language prompts and generate complete form schemas:

```typescript
// Example API usage
const response = await fetch('/api/ai/generate-form', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Create a job application form with personal details, experience, and file upload for resume"
  })
})
```

### Form Analytics
Track form performance with detailed analytics:
- Submission rates and completion metrics
- Field-level drop-off analysis
- AI-powered optimization suggestions
- Real-time response monitoring

### Secure Authentication
Custom JWT-based authentication system:
- Secure password hashing with bcrypt
- HTTP-only cookie sessions
- Automatic token refresh
- Protected API routes

## 🔒 Security Features

- **Input Validation**: Zod schemas for all API endpoints
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM
- **XSS Prevention**: Sanitized user inputs
- **CSRF Protection**: SameSite cookie configuration
- **Secure Headers**: Production-ready security headers

## 🚀 Deployment

### Environment Setup
Ensure all environment variables are configured for production:
- Set `NODE_ENV=production`
- Use strong secrets for JWT tokens
- Configure secure database connections
- Set up proper CORS policies

### Build and Deploy
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the security guide in `SECURITY_GUIDE.md`

---

**Built with ❤️ using Next.js, TypeScript, and OpenAI**
