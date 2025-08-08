// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  // This will refresh the session if it's expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is signed in and they are on the login page, redirect to dashboard
  if (user && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not signed in and they are trying to access a protected page, redirect to login
  if (!user && req.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

// Configure the middleware to run on the root and all dashboard paths
export const config = {
  // Add the new path to the matcher
  matcher: ['/', '/dashboard/:path*', '/trip/:path*'],
};