---
project: NguyenDinhHoaNgai
path: prompts/09-admin-crud-lich-cung-le.md
type: prompt
version: 1.0.0
updated: 2026-07-23
---

# 09 - Admin CRUD Lịch Cúng Lễ

## 1. Mục tiêu

Trang `/admin/lich-cung-le` cung cấp CRUD cho sự kiện ngày giỗ, họp họ, lễ tết.

## 2. Tiêu chí hoàn thành

- [ ] Data layer có `createEvent`, `updateEvent`, `deleteEvent`.
- [ ] Hooks có mutations.
- [ ] Trang admin có table/list với search + filter loại.
- [ ] Form tạo/sửa với validation (DD/MM regex cho ngày âm lịch).
- [ ] Combobox chọn thành viên liên quan.
- [ ] Cascade delete không có (event là độc lập).
- [ ] Smoke test: CRUD 14 events từ seed.

## 3. File cần tạo/sửa

```
src/
├── lib/supabase-data-events.ts           # Thêm mutations
├── hooks/use-events.ts                   # Thêm mutations
├── components/events/event-form.tsx      # NEW
├── components/events/event-delete-dialog.tsx  # NEW
└── app/admin/lich-cung-le/
    ├── page.tsx                          # NEW
    └── loading.tsx                       # NEW
```

## 4. Phụ thuộc

- Đã có 14 events từ seed.
- Đã có `useEvents` (từ prompt 06).
- Đã có admin sidebar (từ prompt 08).

## 5. Bước thực hiện

### Bước 1: Cập nhật `src/lib/supabase-data-events.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase-data-events.ts
 * @description Events data layer
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Event, EventType } from '@/types';

export async function getEvents(): Promise<Event[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export type CreateEventInput = Omit<Event, 'id' | 'created_at'>;
export type UpdateEventInput = Partial<CreateEventInput>;

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('events')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, input: UpdateEventInput): Promise<Event> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('events')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
```

### Bước 2: Cập nhật `src/hooks/use-events.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEvents, createEvent, updateEvent, deleteEvent,
  type CreateEventInput, type UpdateEventInput,
} from '@/lib/supabase-data-events';
import type { Event } from '@/types';

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: getEvents,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) => updateEvent(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}
```

### Bước 3: Tạo `src/components/events/event-form.tsx`

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
import { ParentCombobox } from '@/components/people/parent-combobox';
import { EVENT_TYPE_LABELS } from './event-constants';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCreateEvent, useUpdateEvent } from '@/hooks/use-events';
import type { Event, EventType } from '@/types';

const eventSchema = z.object({
  title: z.string().min(1, 'Bắt buộc').max(255),
  description: z.string().max(2000).optional().nullable(),
  event_type: z.enum(['gio', 'hop_ho', 'le_tet', 'other']),
  event_date: z.string().optional().nullable().or(z.literal('')),
  event_lunar: z.string().regex(/^\d{1,2}\/\d{1,2}$/, 'Định dạng DD/MM').optional().nullable().or(z.literal('')),
  person_id: z.string().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  recurring: z.boolean().default(false),
}).refine((data) => !!data.event_date || !!data.event_lunar, {
  message: 'Phải có ít nhất ngày dương hoặc ngày âm lịch',
  path: ['event_lunar'],
});

type FormValues = z.infer<typeof eventSchema>;

interface Props {
  initial?: Event | null;
  onSuccess: () => void;
}

export function EventForm({ initial, onSuccess }: Props) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const [personId, setPersonId] = useState<string | null>(initial?.person_id ?? null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: initial ? {
      ...initial,
      event_date: initial.event_date || '',
      event_lunar: initial.event_lunar || '',
      description: initial.description || '',
      location: initial.location || '',
    } : {
      title: '',
      event_type: 'other' as EventType,
      recurring: false,
    },
  });

  const eventType = watch('event_type');

  const onSubmit = async (values: FormValues) => {
    try {
      const cleanValues = {
        ...values,
        event_date: values.event_date || null,
        event_lunar: values.event_lunar || null,
        description: values.description || null,
        location: values.location || null,
        person_id: personId || null,
      };

      if (initial) {
        await updateEvent.mutateAsync({ id: initial.id, input: cleanValues });
      } else {
        await createEvent.mutateAsync(cleanValues as any);
      }
      toast.success(initial ? 'Đã cập nhật sự kiện' : 'Đã thêm sự kiện');
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Tiêu đề *</Label>
          <Input id="title" {...register('title')} placeholder="VD: Giỗ Ông Nội" />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_type">Loại sự kiện *</Label>
          <Select value={eventType} onValueChange={(v) => setValue('event_type', v as EventType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_TYPE_LABELS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recurring">Lặp lại hàng năm</Label>
          <div className="flex h-10 items-center">
            <input
              type="checkbox"
              id="recurring"
              {...register('recurring')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="recurring" className="ml-2 cursor-pointer">
              Lặp lại
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_date">Ngày dương lịch</Label>
          <Input id="event_date" type="date" {...register('event_date')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_lunar">Ngày âm lịch (DD/MM)</Label>
          <Input id="event_lunar" {...register('event_lunar')} placeholder="VD: 15/7" />
          {errors.event_lunar && <p className="text-xs text-destructive">{errors.event_lunar.message}</p>}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Thành viên liên quan</Label>
          <ParentCombobox
            selectedId={personId || undefined}
            onSelect={(id) => setPersonId(id || null)}
            placeholder="Tìm thành viên..."
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="location">Địa điểm</Label>
          <Input id="location" {...register('location')} placeholder="VD: Nhà thờ họ" />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea id="description" rows={3} {...register('description')} />
        </div>
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </form>
  );
}
```

### Bước 4: Tạo `src/components/events/event-delete-dialog.tsx`

```tsx
'use client';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteEvent } from '@/hooks/use-events';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Event } from '@/types';

interface Props {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDeleteDialog({ event, open, onOpenChange }: Props) {
  const deleteEvent = useDeleteEvent();

  const handleDelete = async () => {
    if (!event) return;
    try {
      await deleteEvent.mutateAsync(event.id);
      toast.success(`Đã xóa "${event.title}"`);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi xóa';
      toast.error(message);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa sự kiện</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa sự kiện <strong>{event?.title}</strong>?
            <span className="mt-2 block text-xs">Hành động này không thể hoàn tác.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deleteEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Bước 5: Tạo `src/app/admin/lich-cung-le/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useEvents } from '@/hooks/use-events';
import { usePeople } from '@/hooks/use-people';
import { EventForm } from '@/components/events/event-form';
import { EventDeleteDialog } from '@/components/events/event-delete-dialog';
import { EVENT_TYPE_LABELS } from '@/components/events/event-constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import type { Event, Person } from '@/types';

export default function AdminLichCungLePage() {
  const { data: events, isLoading } = useEvents();
  const { data: people } = usePeople();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editing, setEditing] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState<Event | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const peopleById = new Map((people ?? []).map((p: Person) => [p.id, p]));

  const filtered = (events ?? []).filter((e) => {
    if (typeFilter !== 'all' && e.event_type !== typeFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý lịch cúng lễ</h1>
          <p className="text-sm text-muted-foreground">
            {events?.length ?? 0} sự kiện trong hệ thống
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm sự kiện mới</DialogTitle>
            </DialogHeader>
            <EventForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tiêu đề..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tất cả loại</option>
              {Object.entries(EVENT_TYPE_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search || typeFilter !== 'all' ? 'Không có kết quả phù hợp.' : 'Chưa có sự kiện nào.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Thành viên</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead className="w-[100px]">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{EVENT_TYPE_LABELS[e.event_type].label}</Badge>
                    </TableCell>
                    <TableCell>
                      {e.event_date && new Date(e.event_date).toLocaleDateString('vi-VN')}
                      {e.event_lunar && ` (${e.event_lunar} âm)`}
                      {e.recurring && <Badge variant="secondary" className="ml-2 text-xs">Hàng năm</Badge>}
                    </TableCell>
                    <TableCell>
                      {e.person_id ? peopleById.get(e.person_id)?.display_name ?? '—' : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.location || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(e)}>
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

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa sự kiện</DialogTitle>
          </DialogHeader>
          {editing && <EventForm initial={editing} onSuccess={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <EventDeleteDialog
        event={deleting}
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

- [ ] Đăng nhập admin → `/admin/lich-cung-le` → thấy 14 events.
- [ ] Click "Thêm mới" → form modal → điền đầy đủ → submit → thêm thành công.
- [ ] Sửa event → cập nhật thành công.
- [ ] Xóa event → confirm → xóa thành công.
- [ ] Sau CRUD → trang public `/lich-cung-le` cập nhật theo.

## 7. Lưu ý rủi ro

- **Validation DD/MM:** Regex đã có, nhưng chưa check ngày hợp lệ (vd: 30/2 sai). Có thể refine sau.
- **Date format:** Database lưu ISO `YYYY-MM-DD`. Input type="date" tự động convert.
- **Person reference:** Nếu xóa người có event liên quan, event.person_id SET NULL (theo schema).

## 8. Liên kết

- [08-admin-crud-thanh-vien.md](08-admin-crud-thanh-vien.md) - Trước đó.
- [10-admin-crud-tai-lieu.md](10-admin-crud-tai-lieu.md) - Tiếp theo.
- [BRD.md §3.3.3](../docs/01-planning/BRD.md) - Yêu cầu FR-ADM-03.