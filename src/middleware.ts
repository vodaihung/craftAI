import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Add any custom middleware logic here
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
                                req.nextUrl.pathname.startsWith('/create') ||
                                req.nextUrl.pathname.startsWith('/api/forms') ||
                                req.nextUrl.pathname.startsWith('/api/ai')

        console.log('Middleware auth check:', {
          path: req.nextUrl.pathname,
          isProtected: isProtectedRoute,
          hasToken: !!token,
          tokenId: token?.id,
          tokenEmail: token?.email
        })

        // Protect dashboard and create routes
        if (isProtectedRoute) {
          return !!token
        }

        // Allow access to other routes
        return true
      },
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/create/:path*',
    '/api/forms/:path*',
    '/api/ai/:path*'
  ]
}
