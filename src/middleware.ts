import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/mot-de-passe-oublie']
const DIST_PUBLIC_PATHS = ['/distributeur/login']

/** URL de base respectant le host ngrok (X-Forwarded-*) */
function requestOrigin(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    request.nextUrl.host
  return `${proto}://${host}`
}

function distributeurMiddleware(request: NextRequest, origin: string) {
  const { pathname } = request.nextUrl
  const authCookie = request.cookies.get('prospera_dist_auth')
  const isPublic = DIST_PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isAuthenticated = !!authCookie?.value

  if (!isAuthenticated && !isPublic && pathname !== '/distributeur') {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/distributeur/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && isPublic) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/distributeur/dashboard'
    dashboardUrl.search = ''
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

function imfMiddleware(request: NextRequest, origin: string) {
  const { pathname } = request.nextUrl
  const authCookie = request.cookies.get('prospera_auth')
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isAuthenticated = !!authCookie?.value

  // Utilisateur non connecté → vers /login
  if (!isAuthenticated && !isPublic && pathname !== '/') {
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Utilisateur connecté qui va sur /login → vers /dashboard
  if (isAuthenticated && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  return NextResponse.next()
}

export function middleware(request: NextRequest) {
  const origin = requestOrigin(request)

  if (request.nextUrl.pathname.startsWith('/distributeur')) {
    return distributeurMiddleware(request, origin)
  }

  return imfMiddleware(request, origin)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
