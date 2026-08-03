/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase-data-families.ts
 * @description Family tree data layer
 * @version 1.1.0
 * @updated 2026-07-24
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Person, Family, Child } from '@/types';

export interface TreeData {
  people: Person[];
  families: Family[];
  children: Child[];
}

export async function getTreeData(): Promise<TreeData> {
  const supabase = getSupabaseBrowserClient();
  const { data: authData } = await supabase.auth.getUser();
  const peopleSource = authData.user ? 'people' : 'public_people';
  const [peopleRes, familiesRes, childrenRes] = await Promise.all([
    supabase.from(peopleSource).select('*').order('generation').order('birth_year'),
    supabase.from('families').select('*'),
    supabase.from('children').select('*').order('sort_order'),
  ]);

  if (peopleRes.error) throw peopleRes.error;
  if (familiesRes.error) throw familiesRes.error;
  if (childrenRes.error) throw childrenRes.error;

  return {
    people: peopleRes.data ?? [],
    families: familiesRes.data ?? [],
    children: childrenRes.data ?? [],
  };
}

export interface CreateFamilyInput {
  father_id?: string;
  mother_id?: string;
  marriage_date?: string | null;
  marriage_place?: string | null;
  notes?: string | null;
}

export async function createFamily(input: CreateFamilyInput): Promise<Family> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from('families').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function addChild(familyId: string, personId: string, sortOrder: number = 0): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('children')
    .insert({ family_id: familyId, person_id: personId, sort_order: sortOrder });
  if (error) throw error;
}

export async function removeChild(familyId: string, personId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('children')
    .delete()
    .eq('family_id', familyId)
    .eq('person_id', personId);
  if (error) throw error;
}

export async function deleteFamily(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('families').delete().eq('id', id);
  if (error) throw error;
}
