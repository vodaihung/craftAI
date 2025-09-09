# FormCraft AI 🚀

**AI-Powered Form Builder** - Create beautiful, functional forms using natural language with the power of AI.

![FormCraft AI](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql)

## ✨ Features

### 🤖 AI-Powered Form Generation
- **Natural Language Processing**: Describe your form in plain English
- **Intelligent Field Detection**: AI automatically suggests appropriate field types
- **Smart Validation**: Auto-generated validation rules based on context
- **Template System**: Pre-built templates for common use cases

### 📝 Comprehensive Form Builder
- **10+ Field Types**: Text, email, select, radio, checkbox, rating, date, file upload, and more
- **File Upload Support**: Secure file handling with type and size validation
- **Real-time Preview**: See your form as you build it
- **Drag & Drop**: Intuitive file upload with progress tracking

### 🔐 Complete Authentication System
- **Multiple Auth Methods**: Email/password, Google OAuth, GitHub OAuth
- **Secure Sessions**: JWT-based authentication with NextAuth.js
- **User Management**: Complete user registration and login flows

### 📊 Advanced Analytics & Management
- **Real-time Analytics**: Response tracking, conversion rates, completion times
- **Live Notifications**: Server-Sent Events for real-time updates
- **Form Sharing**: Public URLs with customizable settings
- **Response Management**: View, export, and analyze form submissions

### 🛠️ Developer Experience
- **Error Boundaries**: Comprehensive error handling and recovery
- **Performance Monitoring**: Built-in performance tracking and optimization
- **Type Safety**: Full TypeScript implementation
- **Modern Stack**: Next.js 15, React 18, Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/formcraft-ai.git
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

   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@host:port/database"

   # Authentication
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # OAuth Providers
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_ID="your-github-client-id"
   GITHUB_SECRET="your-github-client-secret"

   # OpenAI
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Next.js API routes, Server Actions
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with multiple providers
- **AI**: OpenAI GPT-4o-mini for form generation
- **File Storage**: Local file system with secure serving
- **Real-time**: Server-Sent Events (SSE)

### Project Structure
```
formcraft-ai/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # Reusable React components
│   ├── lib/                 # Utilities and configurations
│   │   ├── db/             # Database schema and queries
│   │   ├── auth/           # Authentication configuration
│   │   └── utils/          # Helper functions
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
├── uploads/               # File upload storage
└── docs/                  # Documentation
```

## 📖 Usage Guide

### Creating Your First Form

1. **Sign up/Login**: Create an account or sign in with Google/GitHub
2. **Choose a Template**: Select from pre-built templates or start from scratch
3. **Describe Your Form**: Use natural language to describe what you need
4. **Review & Customize**: AI generates the form, you can modify as needed
5. **Publish & Share**: Make your form public and share the URL

### Form Types Supported
- **Contact Forms**: Customer inquiries, support requests
- **Surveys**: Feedback collection, market research
- **Registration**: Event sign-ups, user registration
- **Applications**: Job applications, membership forms
- **Feedback**: Product reviews, service ratings

### Field Types Available
- **Text Input**: Single-line text, email, phone numbers
- **Textarea**: Multi-line text for longer responses
- **Select/Dropdown**: Single choice from options
- **Radio Buttons**: Single choice with visible options
- **Checkboxes**: Multiple choice selections
- **Rating**: Star ratings (1-10 scale)
- **Date Picker**: Date selection
- **File Upload**: Document/image uploads with validation
- **Number Input**: Numeric values with min/max validation

## 🔧 Configuration

### Database Setup
The application uses PostgreSQL with Drizzle ORM. Schema is defined in `src/lib/db/schema.ts`.

### Authentication Providers
Configure OAuth providers in `src/app/api/auth/[...nextauth]/route.ts`:
- Google OAuth
- GitHub OAuth
- Email/Password (credentials)

### File Upload Configuration
File uploads are handled securely with:
- Type validation (MIME types)
- Size limits (configurable per field)
- Secure file serving
- Automatic cleanup

### AI Configuration
OpenAI integration for form generation:
- Model: GPT-4o-mini (cost-effective)
- Structured output for reliable form schemas
- Context-aware field suggestions

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=forms
```

### Test Utilities
The project includes comprehensive test utilities in `src/lib/test-utils.ts`:
- Form schema validation
- API endpoint testing
- File upload testing
- Performance measurement

### Manual Testing Checklist
- [ ] User registration/login flows
- [ ] Form creation with AI
- [ ] All field types rendering correctly
- [ ] File upload functionality
- [ ] Form submission and response storage
- [ ] Analytics and real-time updates
- [ ] Error handling and recovery

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
# Build the image
docker build -t formcraft-ai .

# Run the container
docker run -p 3000:3000 formcraft-ai
```

### Environment Variables for Production
Ensure all environment variables are set:
- Database connection string
- NextAuth configuration
- OAuth provider credentials
- OpenAI API key
- File upload directory permissions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Conventional commits for commit messages
- Component-driven development

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - The React framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Radix UI](https://radix-ui.com) - Unstyled, accessible components
- [OpenAI](https://openai.com) - AI-powered form generation
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [NextAuth.js](https://next-auth.js.org) - Authentication for Next.js

## 📞 Support

- 📧 Email: support@formcraft-ai.com
- 💬 Discord: [Join our community](https://discord.gg/formcraft-ai)
- 📖 Documentation: [docs.formcraft-ai.com](https://docs.formcraft-ai.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/formcraft-ai/issues)

---

**Built with ❤️ by the FormCraft AI team**
