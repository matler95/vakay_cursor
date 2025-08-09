// src/app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    // This will set the session cookie in the response
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);

    let redirectTo = '/set-password';
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_set_password')
        .eq('id', session.user.id)
        .single();
      if (profile?.has_set_password) {
        redirectTo = '/dashboard';
      }
    }

    // Return a redirect response (cookie will be set by the helper)
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Fallback redirect
  return NextResponse.redirect(new URL('/', request.url));
}