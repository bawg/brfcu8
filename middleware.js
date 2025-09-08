import { NextResponse } from 'next/server';

export function middleware(request) {
  const sessionCookie = request.cookies.get('__session');

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login.html', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/index.html'],
};
