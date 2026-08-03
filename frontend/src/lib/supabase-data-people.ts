/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase-data-people.ts
 * @description People data layer
 * @version 1.3.0
 * @updated 2026-08-03
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Person, Family } from '@/types';

const AVATAR_BUCKET = 'people';
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export const MAX_AVATAR_BYTES = MAX_AVATAR_SIZE;
export const ALLOWED_AVATAR_MIME = ALLOWED_AVATAR_TYPES;

export function validateAvatarFile(file: File): string | null {
  if (file.size > MAX_AVATAR_SIZE) {
    return `Ảnh quá lớn (tối đa 5MB). Ảnh của bạn: ${(file.size / 1024 / 1024).toFixed(1)}MB`;
  }
  if (file.type && !ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return `Định dạng không hỗ trợ: ${file.type}`;
  }
  return null;
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
}

export function extractAvatarPath(fileUrl: string): string | null {
  const marker = `/${AVATAR_BUCKET}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx < 0) return null;
  const tail = fileUrl.slice(idx + marker.length);
  return tail.split('?')[0] || null;
}

export async function uploadAvatarFile(file: File, personId?: string): Promise<string> {
  const validation = validateAvatarFile(file);
  if (validation) throw new Error(validation);

  const supabase = getSupabaseBrowserClient();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
  const prefix = personId ? `${personId}-` : '';
  const fileName = `${prefix}${Date.now()}-${sanitizeFileName(file.name.split('.').slice(0, -1).join('.'))}.${safeExt}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function deleteAvatarFile(fileUrl: string | null | undefined): Promise<void> {
  if (!fileUrl) return;
  const supabase = getSupabaseBrowserClient();
  const path = extractAvatarPath(fileUrl);
  if (!path) return;
  await supabase.storage.from(AVATAR_BUCKET).remove([path]);
}

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

export type CreatePersonInput = Omit<
  Person,
  'id' | 'created_at' | 'updated_at' | 'handle'
> & { handle?: string };
export type UpdatePersonInput = Partial<CreatePersonInput>;

function toHandle(displayName: string, existing?: string): string {
  if (existing?.trim()) return existing.trim();
  const base =
    displayName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 40) || 'nguoi';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

async function ensureHandleUnique(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
  handle: string,
  excludeId?: string
): Promise<string> {
  let candidate = handle;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let query = supabase.from('people').select('id').eq('handle', candidate);
    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (error) throw error;
    if ((data?.length ?? 0) === 0) return candidate;
    candidate = `${handle}-${Math.random().toString(36).slice(2, 6)}`;
  }
  throw new Error('Không thể tạo handle duy nhất, vui lòng thử lại');
}

export async function createPerson(input: CreatePersonInput): Promise<Person> {
  const supabase = getSupabaseBrowserClient();
  const handle = await ensureHandleUnique(supabase, toHandle(input.display_name ?? '', input.handle));
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
  const { data: person } = await supabase
    .from('people')
    .select('avatar_url')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('people').delete().eq('id', id);
  if (error) throw error;

  if (person?.avatar_url) {
    await deleteAvatarFile(person.avatar_url);
  }
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
