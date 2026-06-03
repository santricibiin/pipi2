import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const token = url.searchParams.get('token')

  // If token is in URL, set it as a cookie and redirect without the query param
  if (token && url.pathname === '/') {
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.set('sid', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
