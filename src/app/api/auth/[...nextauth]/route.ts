import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getUserByEmail, createUserWithPassword } from '@/lib/db/queries'
import bcrypt from 'bcryptjs'

// Helper function to create providers array conditionally
const createProviders = () => {
  const providers = [
    // Manual Email/Password Authentication
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        action: { label: 'Action', type: 'hidden' }, // 'signin' or 'signup'
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const { email, password, action, name } = credentials

        try {
          if (action === 'signup') {
            // Sign up flow
            if (!name) {
              throw new Error('Name is required for sign up')
            }

            // Check if user already exists
            const existingUser = await getUserByEmail(email)
            if (existingUser) {
              throw new Error('User already exists with this email')
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12)

            // Create new user
            const newUser = await createUserWithPassword({
              email,
              name,
              password: hashedPassword,
            })

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              image: newUser.image,
            }
          } else {
            // Sign in flow
            const user = await getUserByEmail(email)
            if (!user || !user.password) {
              throw new Error('Invalid email or password')
            }

            const isPasswordValid = await bcrypt.compare(password, user.password)
            if (!isPasswordValid) {
              throw new Error('Invalid email or password')
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            }
          }
        } catch (error) {
          console.error('Auth error:', error)
          throw error
        }
      },
    }),
  ]

  // Only using credentials provider - OAuth providers removed

  return providers
}

export const authOptions = {
  providers: createProviders(),
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async redirect({ url, baseUrl }: { url: string, baseUrl: string }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      // Default redirect to dashboard after successful sign in
      return `${baseUrl}/dashboard`
    },
    async session({ session, token }: { session: any, token: any }) {
      if (token && session?.user) {
        session.user.id = token.sub || token.id || '1'
        session.user.email = token.email || session.user.email || ''
        session.user.name = token.name || session.user.name || ''
        session.user.image = token.image || session.user.image || null
      }
      return session
    },
    async jwt({ token, user, account, trigger }) {
      // On first sign in, user object will be available
      if (user) {
        token.id = user.id
        token.sub = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  debug: process.env.NODE_ENV === 'development',
  // Add error handling and logout cleanup
  events: {
    async signIn({ user, account, profile }) {
      console.log('Sign in event:', { user: user?.email, provider: account?.provider })
    },
    async signOut({ session, token }) {
      console.log('Sign out event:', { user: session?.user?.email })
      // Additional cleanup can be performed here if needed
      // For example, invalidating refresh tokens, clearing cache, etc.
    },
  },
  // Configure cookie settings for better security and cleanup
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
