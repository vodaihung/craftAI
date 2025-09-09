import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db'
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema'
import { getUserByEmail, createUserWithPassword } from '@/lib/db/queries'
import bcrypt from 'bcryptjs'

export const authOptions = {
  // Remove adapter for credentials provider compatibility
  // adapter: DrizzleAdapter(db, {
  //   usersTable: users,
  //   accountsTable: accounts,
  //   sessionsTable: sessions,
  //   verificationTokensTable: verificationTokens,
  // }),
  providers: [
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
    // OAuth Providers
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
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
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
