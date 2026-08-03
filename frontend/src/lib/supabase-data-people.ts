/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase-data-people.ts
 * @description People data layer
 * @version 1.2.0
 * @updated 2026-07-24
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Person, Family } from '@/types';

export async function getPeople(): Promise<Person[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: authData } = await supabase.auth.getUser();
  const source = authData.user ? 'people' : 'public_people';
  const { data, error } = await supabase
    .from(source)
    .select('*')
    .order('generation')
    .order('birth_year');

  if (error) throw error;
  return (data ?? []) as unknown as Person[];
}

export async function getPerson(id: string): Promise<Person | null> {
  const supabase = getSupabaseBrowserClient();
  const { data: authData } = await supabase.auth.getUser();
  const source = authData.user ? 'people' : 'public_people';
  const { data, error } = await supabase
    .from(source)
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function searchPeople(query: string, limit = 20): Promise<Person[]> {
  const supabase = getSupabaseBrowserClient();
  const escaped = query.replace(/[%_\\]/g, '\\$&');
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .ilike('display_name', `%${escaped}%`)
    .order('display_name')
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export type CreatePersonInput = Omit<Person, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePersonInput = Partial<CreatePersonInput>;

async function ensureHandleUnique(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
  handle: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase.from('people').select('id').eq('handle', handle);
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data?.length ?? 0) === 0;
}

export async function generateNextHandle(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('people')
    .select('handle')
    .ilike('handle', 'ND%');
  if (error) throw error;
  let max = 0;
  for (const row of data ?? []) {
    const handle = typeof row.handle === 'string' ? row.handle : '';
    const match = handle.match(/^ND(\d+)$/);
    if (match) {
      const value = Number.parseInt(match[1], 10);
      if (Number.isFinite(value) && value > max) max = value;
    }
  }
  return `ND${String(max + 1).padStart(3, '0')}`;
}

export async function createPerson(input: CreatePersonInput): Promise<Person> {
  const supabase = getSupabaseBrowserClient();
  const handle = input.handle?.trim() ? input.handle : await generateNextHandle();
  const unique = await ensureHandleUnique(supabase, handle);
  if (!unique) throw new Error(`Handle "${handle}" đã tồn tại`);

  const { data, error } = await supabase
    .from('people')
    .insert({ ...input, handle })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePerson(id: string, input: UpdatePersonInput): Promise<Person> {
  const supabase = getSupabaseBrowserClient();
  if (input.handle) {
    const unique = await ensureHandleUnique(supabase, input.handle, id);
    if (!unique) throw new Error(`Handle "${input.handle}" đã tồn tại`);
  }
  const { data, error } = await supabase
    .from('people')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePerson(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('people').delete().eq('id', id);
  if (error) throw error;
}

export async function getRelationships(id: string): Promise<{
  asFather: Family[];
  asMother: Family[];
  asChild: Array<{ family: Family; sortOrder: number }>;
}> {
  const supabase = getSupabaseBrowserClient();
  const [asFatherRes, asMotherRes, asChildRes] = await Promise.all([
    supabase.from('families').select('*').eq('father_id', id),
    supabase.from('families').select('*').eq('mother_id', id),
    supabase.from('children').select('*, family:families(*)').eq('person_id', id),
  ]);
  return {
    asFather: asFatherRes.data ?? [],
    asMother: asMotherRes.data ?? [],
    asChild: (asChildRes.data ?? []).map((c: { family: Family; sort_order: number }) => ({
      family: c.family,
      sortOrder: c.sort_order,
    })),
  };
}
