/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase/server.ts
 * @description Supabase server client with cookie handling (uses local in-memory shim when LOCAL_MODE=true)
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { createLocalSupabase } from './local-shim';

export const IS_LOCAL_MODE =
  process.env.NEXT_PUBLIC_LOCAL_MODE === 'true' ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

export async function createClient() {
  if (IS_LOCAL_MODE) {
    return createLocalSupabase() as unknown as Awaited<ReturnType<typeof createServerClient>>;
  }
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
    }
  );
}
