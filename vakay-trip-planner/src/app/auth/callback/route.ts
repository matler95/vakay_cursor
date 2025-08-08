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
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);

    // --- NEW: Smart Redirect Logic ---
    if (session) {
      // After getting the session, check the user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_set_password')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.has_set_password) {
        // If they have set a password, send them to the dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        // If it's their first time, send them to the profile page to set a password
        return NextResponse.redirect(new URL('/dashboard/profile', request.url));
      }
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL('/', request.url));
}