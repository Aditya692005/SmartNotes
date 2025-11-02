import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protect /dashboard, /notes, /process routes
const protectedRoutes = ['/dashboard', '/notes', '/process']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route is protected
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Check for session cookie
    const session = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token')
    if (!session) {
      // Redirect to sign-in if not authenticated
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  // Prevent direct access to /process if no sessionStorage or query params
  if (pathname.startsWith('/process')) {
    const source = request.nextUrl.searchParams.get('source')
    if (!source) {
      // Optionally redirect to dashboard or home
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/notes/:path*', '/process']
}
