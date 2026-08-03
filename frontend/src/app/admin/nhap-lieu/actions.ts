'use server';

/**
 * @project NguyenDinhHoaNgai
 * @file src/app/admin/nhap-lieu/actions.ts
 * @description Server action: insert imported people + families into local shim / Supabase
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ImportPayload, ImportPerson } from '@/lib/import/parsers';
import { toPersonRow } from '@/lib/import/parsers';

export interface ImportResult {
  inserted: number;
  skipped: number;
  errors: string[];
  newHandles: string[];
}

export async function importPeopleAction(payload: ImportPayload): Promise<ImportResult> {
  const supabase = await createClient();
  const errors: string[] = [];
  const newHandles: string[] = [];
  let inserted = 0;
  let skipped = 0;

  // 1) Lấy handle đã tồn tại để tránh trùng
  const { data: existing } = await supabase.from('people').select('handle');
  const existingHandles = new Set((existing ?? []).map((r: { handle: string }) => r.handle));

  // 2) Insert people
  for (const p of payload.people) {
    if (existingHandles.has(p.handle)) {
      skipped++;
      continue;
    }
    const row = toPersonRow(p);
    const { data, error } = await supabase.from('people').insert(row).select('id').single();
    if (error) {
      errors.push(`Lỗi insert ${p.handle}: ${error.message}`);
    } else {
      inserted++;
      newHandles.push(p.handle);
      existingHandles.add(p.handle);
    }
  }

  // 3) Insert families (cần map handle -> id)
  const { data: allPeople } = await supabase.from('people').select('id, handle');
  const handleToId = new Map((allPeople ?? []).map((r: { id: string; handle: string }) => [r.handle, r.id]));

  for (const fam of payload.families) {
    const fatherId = fam.father_handle ? handleToId.get(fam.father_handle) ?? null : null;
    const motherId = fam.mother_handle ? handleToId.get(fam.mother_handle) ?? null : null;
    if (!fatherId && !motherId) continue;

    const { data: famRow, error: famErr } = await supabase
      .from('families')
      .insert({ father_id: fatherId, mother_id: motherId, marriage_date: fam.marriage_date, marriage_place: fam.marriage_place, notes: fam.notes })
      .select('id')
      .single();
    if (famErr) {
      errors.push(`Lỗi tạo gia đình: ${famErr.message}`);
      continue;
    }
    const familyId = (famRow as { id: string }).id;

    for (let i = 0; i < fam.child_handles.length; i++) {
      const childHandle = fam.child_handles[i];
      const childId = handleToId.get(childHandle);
      if (!childId) continue;
      const { error: cErr } = await supabase
        .from('children')
        .insert({ family_id: familyId, person_id: childId, sort_order: i + 1 });
      if (cErr) {
        errors.push(`Lỗi gắn con ${childHandle}: ${cErr.message}`);
      }
    }
  }

  revalidatePath('/admin/thanh-vien');
  revalidatePath('/cay-gia-pha');
  revalidatePath('/thanh-vien');
  return { inserted, skipped, errors, newHandles };
}
