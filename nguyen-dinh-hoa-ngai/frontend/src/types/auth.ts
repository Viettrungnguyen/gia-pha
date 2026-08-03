/**
 * @project NguyenDinhHoaNgai
 * @file src/types/auth.ts
 * @description Auth-related types
 * @version 1.0.0
 * @updated 2026-07-23
 */

import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin';
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}
