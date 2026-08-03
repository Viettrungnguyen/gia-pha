/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase/client.ts
 * @description Supabase browser client (uses local in-memory shim when LOCAL_MODE=true)
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { createBrowserClient } from '@supabase/ssr';
import { createLocalSupabase } from './local-shim';

export const IS_LOCAL_MODE =
  process.env.NEXT_PUBLIC_LOCAL_MODE === 'true' ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

export function createClient() {
  if (IS_LOCAL_MODE) {
    return createLocalSupabase() as unknown as ReturnType<typeof createBrowserClient>;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
