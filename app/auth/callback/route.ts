// app/auth/callback/route.ts
// Handles Supabase auth callbacks: email confirmation, magic link sign-in.
// Exchanges the code for a session, then redirects to the intended destination.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code        = requestUrl.searchParams.get('code');
  const redirectTo  = requestUrl.searchParams.get('redirectTo') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback] Code exchange failed:', error.message);
      return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin));
    }
  }

  // Redirect to the intended destination after successful auth
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
