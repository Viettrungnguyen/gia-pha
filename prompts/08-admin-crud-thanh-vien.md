---
project: NguyenDinhHoaNgai
path: prompts/08-admin-crud-thanh-vien.md
type: prompt
version: 1.0.0
updated: 2026-07-23
---

# 08 - Admin CRUD Thành Viên

## 1. Mục tiêu

Trang `/admin/thanh-vien` cung cấp đầy đủ CRUD cho thành viên và quan hệ gia phả (cha-mẹ, vợ-chồng, con). Đây là chức năng admin phức tạp nhất.

## 2. Tiêu chí hoàn thành

- [ ] Data layer `supabase-data-people.ts` có thêm `createPerson`, `updatePerson`, `deletePerson`.
- [ ] Data layer `supabase-data-families.ts` có thêm `createFamily`, `addChild`, `deleteFamily`.
- [ ] Hooks `use-people.ts` có thêm mutations.
- [ ] Trang `/admin/thanh-vien` có table/list với search + filter.
- [ ] Modal tạo/sửa thành viên với form đầy đủ (React Hook Form + Zod).
- [ ] Khi chọn cha + mẹ → tự động tạo `family` và `children` rows.
- [ ] Validate: handle unique, tên không rỗng, gender enum.
- [ ] AlertDialog xác nhận trước khi xóa.
- [ ] Cascade delete: nếu người đang là cha/mẹ/vợ chồng → cảnh báo.

## 3. File cần tạo/sửa

```
src/
├── lib/
│   ├── supabase-data-people.ts           # Thêm mutations
│   └── supabase-data-families.ts         # Thêm mutations
├── hooks/
│   ├── use-people.ts                     # Thêm mutations
│   └── use-families.ts                   # NEW (families mutations)
├── components/
│   ├── people/
│   │   ├── person-form.tsx               # NEW
│   │   ├── person-delete-dialog.tsx      # NEW
│   │   └── parent-combobox.tsx           # NEW
│   ├── ui/                               # shadcn primitives
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   └── alert-dialog.tsx
└── app/admin/
    ├── layout.tsx                        # Thêm admin sidebar
    ├── page.tsx                          # Dashboard (cập nhật)
    └── thanh-vien/
        ├── page.tsx                      # NEW
        └── loading.tsx                   # NEW
```

## 4. Phụ thuộc

- Đã có 18 thành viên seed.
- Đã có `use-people.ts` (từ prompt 05).
- Đã có `use-families.ts` (từ prompt 04, có `useTreeData`).
- Đã đăng nhập admin.

## 5. Bước thực hiện

### Bước 1: Cài thêm shadcn primitives

```bash
cd frontend
pnpm dlx shadcn@latest add dialog select textarea table alert-dialog
```

### Bước 2: Cập nhật `src/lib/supabase-data-people.ts`

Thêm các function sau:

```typescript
// Thêm vào src/lib/supabase-data-people.ts (đã có sẵn getPeople, getPerson, searchPeople)

export type CreatePersonInput = Omit<Person, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePersonInput = Partial<CreatePersonInput>;

/**
 * Validate handle unique trước khi insert.
 */
async function ensureHandleUnique(supabase: ReturnType<typeof getSupabaseBrowserClient>, handle: string, excludeId?: string): Promise<boolean> {
  let query = supabase.from('people').select('id').eq('handle', handle);
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data?.length ?? 0) === 0;
}

export async function createPerson(input: CreatePersonInput): Promise<Person> {
  const supabase = getSupabaseBrowserClient();
  const unique = await ensureHandleUnique(supabase, input.handle);
  if (!unique) throw new Error(`Handle "${input.handle}" đã tồn tại`);

  const { data, error } = await supabase
    .from('people')
    .insert(input)
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
  // Xóa row children liên quan (cũng tự động nhờ ON DELETE CASCADE)
  // Family với father/mother → SET NULL
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
    asChild: (asChildRes.data ?? []).map((c: any) => ({ family: c.family, sortOrder: c.sort_order })),
  };
}
```

### Bước 3: Cập nhật `src/lib/supabase-data-families.ts`

```typescript
// Thêm vào src/lib/supabase-data-families.ts

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
```

### Bước 4: Cập nhật `src/hooks/use-people.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPeople, getPerson, searchPeople,
  createPerson, updatePerson, deletePerson,
  type CreatePersonInput, type UpdatePersonInput
} from '@/lib/supabase-data-people';
import type { Person } from '@/types';

export function usePeople() {
  return useQuery<Person[]>({ queryKey: ['people'], queryFn: getPeople });
}

export function usePerson(id: string | undefined) {
  return useQuery<Person | null>({
    queryKey: ['person', id],
    queryFn: () => getPerson(id!),
    enabled: !!id,
  });
}

export function useSearchPeople(query: string) {
  return useQuery<Person[]>({
    queryKey: ['search-people', query],
    queryFn: () => searchPeople(query),
    enabled: query.length >= 2,
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPerson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['tree-data'] });
    },
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePersonInput }) => updatePerson(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['tree-data'] });
    },
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePerson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['tree-data'] });
      qc.invalidateQueries({ queryKey: ['families'] });
    },
  });
}
```

### Bước 5: Tạo `src/hooks/use-families.ts` mutations

```typescript
// src/hooks/use-families.ts (cập nhật - thêm mutations)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTreeData, type TreeData, createFamily, addChild, type CreateFamilyInput } from '@/lib/supabase-data-families';

export function useTreeData() {
  return useQuery<TreeData>({ queryKey: ['tree-data'], queryFn: getTreeData });
}

export function useCreateFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFamilyInput) => createFamily(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tree-data'] }),
  });
}

export function useAddChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, personId, sortOrder }: { familyId: string; personId: string; sortOrder?: number }) =>
      addChild(familyId, personId, sortOrder),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tree-data'] }),
  });
}
```

### Bước 6: Tạo `src/components/people/parent-combobox.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useSearchPeople } from '@/hooks/use-people';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X } from 'lucide-react';

interface Props {
  selectedId?: string;
  onSelect: (id: string, displayName: string) => void;
  placeholder?: string;
}

export function ParentCombobox({ selectedId, onSelect, placeholder = 'Tìm theo tên...' }: Props) {
  const [search, setSearch] = useState('');
  const { data: results } = useSearchPeople(search);

  const handleSelect = (id: string, name: string) => {
    onSelect(id, name);
    setSearch('');
  };

  const handleClear = () => onSelect('', '');

  return (
    <div className="space-y-2">
      {selectedId ? (
        <Card>
          <CardContent className="flex items-center justify-between p-2">
            <span className="text-sm">Đã chọn</span>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {search.length >= 2 && results && results.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-md border bg-card">
              {results.slice(0, 10).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p.id, p.display_name)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <div className="font-medium">{p.display_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Đời {p.generation}
                    {p.birth_year ? ` · ${p.birth_year}` : ''}
                    {!p.is_living ? ' †' : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### Bước 7: Tạo `src/components/people/person-form.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ParentCombobox } from './parent-combobox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCreatePerson, useUpdatePerson } from '@/hooks/use-people';
import { useCreateFamily, useAddChild } from '@/hooks/use-families';
import type { Person } from '@/types';

const personSchema = z.object({
  handle: z.string().min(1, 'Bắt buộc').max(50),
  display_name: z.string().min(1, 'Bắt buộc').max(255),
  first_name: z.string().max(100).optional().nullable(),
  middle_name: z.string().max(100).optional().nullable(),
  surname: z.string().min(1, 'Bắt buộc').max(100),
  gender: z.union([z.literal(1), z.literal(2)]).optional().nullable(),
  generation: z.coerce.number().int().min(1).max(20),
  chi: z.coerce.number().int().min(1).optional().nullable(),
  birth_year: z.coerce.number().int().optional().nullable(),
  birth_place: z.string().max(255).optional().nullable(),
  death_year: z.coerce.number().int().optional().nullable(),
  death_lunar: z.string().regex(/^\d{1,2}\/\d{1,2}$/, 'Định dạng DD/MM').optional().nullable().or(z.literal('')),
  death_place: z.string().max(255).optional().nullable(),
  is_living: z.boolean().default(true),
  occupation: z.string().max(255).optional().nullable(),
  hometown: z.string().max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  biography: z.string().max(5000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  father_id: z.string().optional().nullable(),
  mother_id: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof personSchema>;

interface Props {
  initial?: Person | null;
  onSuccess: () => void;
}

export function PersonForm({ initial, onSuccess }: Props) {
  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();
  const createFamily = useCreateFamily();
  const addChild = useAddChild();

  const [fatherId, setFatherId] = useState<string | null>(null);
  const [motherId, setMotherId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(personSchema) as any,
    defaultValues: initial ? {
      ...initial,
      father_id: null,
      mother_id: null,
    } : {
      handle: '',
      display_name: '',
      surname: 'Nguyễn Đình',
      generation: 1,
      is_living: true,
    },
  });

  const isLiving = watch('is_living');

  const onSubmit = async (values: FormValues) => {
    try {
      let personId: string;
      const cleanValues = {
        ...values,
        death_lunar: values.death_lunar === '' ? null : values.death_lunar,
        email: values.email === '' ? null : values.email,
      };

      if (initial) {
        const updated = await updatePerson.mutateAsync({ id: initial.id, input: cleanValues });
        personId = updated.id;
      } else {
        const created = await createPerson.mutateAsync(cleanValues as any);
        personId = created.id;

        // Nếu có cha hoặc mẹ, tạo family + children
        if (fatherId || motherId) {
          const family = await createFamily.mutateAsync({
            father_id: fatherId || undefined,
            mother_id: motherId || undefined,
          });
          await addChild.mutateAsync({ familyId: family.id, personId });
        }
      }

      toast.success(initial ? 'Đã cập nhật thành viên' : 'Đã thêm thành viên');
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  const isPending = createPerson.isPending || updatePerson.isPending || createFamily.isPending || addChild.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Thông tin cơ bản */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="handle">Handle *</Label>
          <Input id="handle" {...register('handle')} placeholder="VD: ND019" />
          {errors.handle && <p className="text-xs text-destructive">{errors.handle.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="display_name">Tên hiển thị *</Label>
          <Input id="display_name" {...register('display_name')} placeholder="VD: Nguyễn Đình A" />
          {errors.display_name && <p className="text-xs text-destructive">{errors.display_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="surname">Họ *</Label>
          <Input id="surname" {...register('surname')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="middle_name">Tên đệm</Label>
          <Input id="middle_name" {...register('middle_name')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="first_name">Tên</Label>
          <Input id="first_name" {...register('first_name')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Giới tính</Label>
          <Select
            value={watch('gender')?.toString() || ''}
            onValueChange={(v) => setValue('gender', parseInt(v) as 1 | 2)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Nam</SelectItem>
              <SelectItem value="2">Nữ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="generation">Đời *</Label>
          <Input id="generation" type="number" min={1} {...register('generation')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="chi">Chi</Label>
          <Input id="chi" type="number" min={1} {...register('chi')} />
        </div>
      </div>

      {/* Sinh */}
      <div className="border-t pt-4">
        <h3 className="mb-3 text-sm font-semibold">Thông tin sinh</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="birth_year">Năm sinh</Label>
            <Input id="birth_year" type="number" {...register('birth_year')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_place">Nơi sinh</Label>
            <Input id="birth_place" {...register('birth_place')} />
          </div>
        </div>
      </div>

      {/* Mất */}
      <div className="border-t pt-4">
        <div className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="is_living"
            checked={isLiving}
            {...register('is_living')}
            className="h-4 w-4"
          />
          <Label htmlFor="is_living" className="cursor-pointer">Còn sống</Label>
        </div>
        {!isLiving && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="death_year">Năm mất</Label>
              <Input id="death_year" type="number" {...register('death_year')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="death_lunar">Ngày giỗ (DD/MM)</Label>
              <Input id="death_lunar" {...register('death_lunar')} placeholder="VD: 15/7" />
              {errors.death_lunar && <p className="text-xs text-destructive">{errors.death_lunar.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="death_place">Nơi mất</Label>
              <Input id="death_place" {...register('death_place')} />
            </div>
          </div>
        )}
      </div>

      {/* Liên hệ */}
      <div className="border-t pt-4">
        <h3 className="mb-3 text-sm font-semibold">Liên hệ</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Điện thoại</Label>
            <Input id="phone" {...register('phone')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" {...register('address')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hometown">Quê quán</Label>
            <Input id="hometown" {...register('hometown')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occupation">Nghề nghiệp</Label>
            <Input id="occupation" {...register('occupation')} />
          </div>
        </div>
      </div>

      {/* Quan hệ - chỉ khi tạo mới */}
      {!initial && (
        <div className="border-t pt-4">
          <h3 className="mb-3 text-sm font-semibold">Quan hệ cha mẹ</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cha</Label>
              <ParentCombobox
                selectedId={fatherId || undefined}
                onSelect={(id) => setFatherId(id || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mẹ</Label>
              <ParentCombobox
                selectedId={motherId || undefined}
                onSelect={(id) => setMotherId(id || null)}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Nếu chọn cả cha và mẹ, hệ thống sẽ tự tạo quan hệ gia đình.
          </p>
        </div>
      )}

      {/* Tiểu sử */}
      <div className="border-t pt-4">
        <div className="space-y-2">
          <Label htmlFor="biography">Tiểu sử</Label>
          <Textarea id="biography" rows={4} {...register('biography')} />
        </div>
        <div className="mt-3 space-y-2">
          <Label htmlFor="notes">Ghi chú</Label>
          <Textarea id="notes" rows={2} {...register('notes')} />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </form>
  );
}
```

### Bước 8: Tạo `src/components/people/person-delete-dialog.tsx`

```tsx
'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeletePerson } from '@/hooks/use-people';
import { useRelationships } from '@/hooks/use-relationships';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Person } from '@/types';

interface Props {
  person: Person | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PersonDeleteDialog({ person, open, onOpenChange, onSuccess }: Props) {
  const deletePerson = useDeletePerson();
  const { data: rels, isLoading: relsLoading } = useRelationships(person?.id);

  const handleDelete = async () => {
    if (!person) return;
    try {
      await deletePerson.mutateAsync(person.id);
      toast.success(`Đã xóa ${person.display_name}`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi xóa';
      toast.error(message);
    }
  };

  const hasRelationships =
    rels && (rels.asFather.length > 0 || rels.asMother.length > 0 || rels.asChild.length > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa thành viên</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa <strong>{person?.display_name}</strong>?
            {hasRelationships && (
              <span className="mt-2 block rounded-md bg-destructive/10 p-2 text-destructive">
                ⚠️ Người này đang có quan hệ gia phả. Xóa có thể ảnh hưởng đến các quan hệ cha/mẹ/vợ chồng/con.
              </span>
            )}
            <span className="mt-2 block text-xs">Hành động này không thể hoàn tác.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deletePerson.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Bước 9: Tạo `src/hooks/use-relationships.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getRelationships } from '@/lib/supabase-data-people';

export function useRelationships(id: string | undefined) {
  return useQuery({
    queryKey: ['relationships', id],
    queryFn: () => getRelationships(id!),
    enabled: !!id,
  });
}
```

### Bước 10: Tạo `src/components/layout/admin-sidebar.tsx`

```tsx
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { LayoutDashboard, Users, Calendar, Archive, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { SITE_CONFIG } from '@/lib/site-config';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/thanh-vien', label: 'Thành viên', icon: Users },
  { href: '/admin/lich-cung-le', label: 'Lịch cúng lễ', icon: Calendar },
  { href: '/admin/tai-lieu', label: 'Tài liệu', icon: Archive },
];

export function AdminSidebar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="border-b p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">
            NĐ
          </div>
          <div>
            <div className="text-sm font-semibold">Quản trị</div>
            <div className="text-xs text-muted-foreground">{SITE_CONFIG.shortName}</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 px-3">
          <div className="text-sm font-medium truncate">{profile?.full_name || user?.email}</div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
        </div>
        <div className="space-y-1">
          <Button asChild variant="ghost" className="w-full justify-start" size="sm">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Về trang chính
            </Link>
          </Button>
          <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </div>
    </aside>
  );
}
```

### Bước 11: Cập nhật `src/app/admin/layout.tsx`

```tsx
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/dang-nhap?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/');

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
```

### Bước 12: Tạo `src/app/admin/thanh-vien/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { usePeople } from '@/hooks/use-people';
import { PersonForm } from '@/components/people/person-form';
import { PersonDeleteDialog } from '@/components/people/person-delete-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import type { Person } from '@/types';

export default function AdminThanhVienPage() {
  const { data: people, isLoading } = usePeople();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState<Person | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = people?.filter((p) =>
    !search || p.display_name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý thành viên</h1>
          <p className="text-sm text-muted-foreground">
            {people?.length ?? 0} thành viên trong hệ thống
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Thêm thành viên mới</DialogTitle>
            </DialogHeader>
            <PersonForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? 'Không tìm thấy kết quả.' : 'Chưa có thành viên nào.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Đời</TableHead>
                  <TableHead>Năm sinh</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[120px]">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.display_name}</TableCell>
                    <TableCell>{p.gender === 1 ? 'Nam' : p.gender === 2 ? 'Nữ' : '—'}</TableCell>
                    <TableCell>{p.generation}</TableCell>
                    <TableCell>{p.birth_year ?? '—'}</TableCell>
                    <TableCell>{p.is_living ? 'Còn sống' : 'Đã mất †'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(p)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sửa thành viên</DialogTitle>
          </DialogHeader>
          {editing && (
            <PersonForm initial={editing} onSuccess={() => setEditing(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <PersonDeleteDialog
        person={deleting}
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}
```

## 6. Smoke test

```bash
pnpm tsc && pnpm lint && pnpm build
pnpm dev
```

Verify:

- [ ] Đăng nhập admin → vào `/admin` → thấy sidebar.
- [ ] Click "Thành viên" → vào `/admin/thanh-vien` → thấy table 18 rows.
- [ ] Click "Thêm mới" → form modal mở → điền đầy đủ → submit → thành viên mới xuất hiện.
- [ ] Thêm mới có chọn cha + mẹ → tự động tạo family.
- [ ] Click icon sửa → form pre-fill → sửa → submit → cập nhật.
- [ ] Click icon xóa → dialog xác nhận → confirm → xóa thành công.
- [ ] Sau khi thêm/sửa/xóa → trang public `/thanh-vien` cập nhật theo.

## 7. Lưu ý rủi ro

- **Cascade delete:** Khi xóa người, family.father_id hoặc mother_id được SET NULL (theo schema). Có thể gây mất liên kết. Cân nhắc thêm option "Xóa cả family" trong dialog.
- **Generation auto-set:** MVP để admin tự nhập. Có thể auto-derive từ cha/mẹ nếu muốn.
- **Avatar upload:** Prompt này chưa có. Có thể mở rộng ở admin prompt khác.
- **RLS test:** Insert/update qua UI OK, nhưng cần test với anon key (sẽ fail).

## 8. Liên kết

- [07-public-tai-lieu.md](07-public-tai-lieu.md) - Trước đó.
- [09-admin-crud-lich-cung-le.md](09-admin-crud-lich-cung-le.md) - Tiếp theo.
- [BRD.md §3.3.2](../docs/01-planning/BRD.md) - Yêu cầu FR-ADM-02.