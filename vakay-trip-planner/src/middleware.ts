// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Fetch profile to check has_set_password
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_set_password')
      .eq('id', user.id)
      .single();

    // If password not set, redirect to /set-password (unless already there)
    if (!profile?.has_set_password && req.nextUrl.pathname !== '/set-password') {
      return NextResponse.redirect(new URL('/set-password', req.url));
    }

    // If already set and on /set-password, redirect to dashboard
    if (profile?.has_set_password && req.nextUrl.pathname === '/set-password') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // If on login page, redirect to dashboard
    if (req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } else {
    // Not signed in, protect all routes except login
    if (req.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}

// Configure the middleware to run on the root and all dashboard/trip/set-password paths
export const config = {
  matcher: ['/', '/dashboard/:path*', '/trip/:path*', '/set-password'],
};