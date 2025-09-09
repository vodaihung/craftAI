import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db'
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema'
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

  // Add OAuth providers only if credentials are properly configured
  if (process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' &&
      process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret') {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    )
  }

  if (process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET &&
      process.env.GITHUB_CLIENT_ID !== 'your-github-client-id' &&
      process.env.GITHUB_CLIENT_SECRET !== 'your-github-client-secret') {
    providers.push(
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    )
  }

  return providers
}

export const authOptions = {
  // Remove adapter for credentials provider compatibility
  // adapter: DrizzleAdapter(db, {
  //   usersTable: users,
  //   accountsTable: accounts,
  //   sessionsTable: sessions,
  //   verificationTokensTable: verificationTokens,
  // }),
  providers: createProviders(),
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub || token.id || '1'
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  session: {
    strategy: 'jwt', // Use JWT for credentials provider compatibility
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
