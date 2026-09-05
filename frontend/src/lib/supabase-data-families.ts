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
  // Dev-only fake tree (Local): bật bằng NEXT_PUBLIC_USE_FAKE_TREE trong .env.local.
  //  'compact' → mini tree test cho cây compact (CV2)
  //  '1'      → big tree ~500 người (kiểm thử cây lớn)
  // Cờ NODE_ENV đảm bảo production build của Vercel không bao giờ gọi fake data,
  // ngay cả khi env lỡ bị set.
  if (process.env.NODE_ENV !== 'production') {
    if (process.env.NEXT_PUBLIC_USE_FAKE_TREE === 'compact') {
      const { generateCompactFakeTree } = await import('@/lib/dev-fake-compact-tree');
      return generateCompactFakeTree();
    }
    if (process.env.NEXT_PUBLIC_USE_FAKE_TREE === '1') {
      const { generateFakeTree } = await import('@/lib/dev-fake-tree');
      return generateFakeTree();
    }
  }
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
  father_id?: string | null;
  mother_id?: string | null;
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

export async function findFamilyByPair(
  fatherId: string | null,
  motherId: string | null
): Promise<Family | null> {
  if (!fatherId && !motherId) return null;
  const supabase = getSupabaseBrowserClient();
  let query = supabase.from('families').select('*').limit(1);
  if (fatherId) query = query.eq('father_id', fatherId);
  else query = query.is('father_id', null);
  if (motherId) query = query.eq('mother_id', motherId);
  else query = query.is('mother_id', null);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function ensureFamilyAndAddChild(input: {
  fatherId: string | null;
  motherId: string | null;
  personId: string;
  sortOrder?: number;
}): Promise<{ family: Family; childId: string }> {
  const { fatherId, motherId, personId, sortOrder = 0 } = input;

  const supabase = getSupabaseBrowserClient();

  // Xóa tất cả các liên kết cha mẹ cũ của người này
  await removeAllChildrenLinks(personId);

  // Nếu không có cha mẹ mới thì chỉ xóa liên kết cũ và thôi
  if (!fatherId && !motherId) {
    throw new Error('Cần chọn ít nhất cha hoặc mẹ để thêm con vào gia đình');
  }

  const existing = await findFamilyByPair(fatherId, motherId);
  let family = existing;
  if (!family) {
    family = await createFamily({ father_id: fatherId, mother_id: motherId });
  }

  const { data: childRow, error: childErr } = await supabase
    .from('children')
    .insert({ family_id: family.id, person_id: personId, sort_order: sortOrder })
    .select()
    .single();
  if (childErr) throw childErr;

  return { family, childId: childRow.id };
}

export async function removeAllChildrenLinks(personId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('children').delete().eq('person_id', personId);
  if (error) throw error;
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

/**
 * Cập nhật sort_order cho 1 liên kết cha-mẹ-con hiện có.
 * Dùng khi admin đổi thứ tự con trong gia đình qua PersonForm.
 */
export async function updateChildSortOrder(
  familyId: string,
  personId: string,
  sortOrder: number
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('children')
    .update({ sort_order: sortOrder })
    .eq('family_id', familyId)
    .eq('person_id', personId);
  if (error) throw error;
}

/**
 * Cập nhật sort_order cho 1 family (cặp vợ chồng).
 * Dùng khi admin đổi thứ tự vợ/chồng qua SpouseManagerDialog.
 */
export async function updateFamilySortOrder(
  familyId: string,
  sortOrder: number
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('families')
    .update({ sort_order: sortOrder })
    .eq('id', familyId);
  if (error) throw error;
}

