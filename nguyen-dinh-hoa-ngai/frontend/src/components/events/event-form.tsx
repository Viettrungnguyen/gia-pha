/**
 * @project NguyenDinhHoaNgai
 * @file src/components/events/event-form.tsx
 * @description Event create/edit form with deceased-person selection
 * @version 1.1.0
 * @updated 2026-07-24
 */

'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateEvent, useUpdateEvent } from '@/hooks/use-events';
import { usePeople } from '@/hooks/use-people';
import { parseLunarString } from '@/lib/lunar-calendar';
import { toast } from 'sonner';
import { Loader2, Search, X } from 'lucide-react';
import type { Event } from '@/types';

const eventSchema = z.object({
  title: z.string().min(1, 'Bắt buộc').max(255),
  description: z.string().max(2000).optional().nullable(),
  event_type: z.enum(['gio', 'hop_ho', 'le_tet', 'other']),
  event_date: z.string().optional().nullable(),
  event_lunar: z
    .string()
    .max(5)
    .optional()
    .nullable()
    .refine((value) => !value || parseLunarString(value) !== null, 'Ngày âm phải hợp lệ theo định dạng DD/MM'),
  person_id: z.string().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  recurring: z.boolean(),
});

type FormValues = z.infer<typeof eventSchema>;

interface Props {
  initial?: Event | null;
  onSuccess: () => void;
}

export function EventForm({ initial, onSuccess }: Props) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { data: people } = usePeople();
  const [personSearch, setPersonSearch] = useState('');

  const defaults: FormValues = initial
    ? {
        title: initial.title,
        description: initial.description,
        event_type: initial.event_type,
        event_date: initial.event_date,
        event_lunar: initial.event_lunar,
        person_id: initial.person_id,
        location: initial.location,
        recurring: initial.recurring,
      }
    : {
        title: '',
        event_type: 'gio',
        recurring: true,
        description: null,
        event_date: null,
        event_lunar: null,
        person_id: null,
        location: null,
      };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: defaults,
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const cleanValues = {
        title: values.title,
        description: values.description || null,
        event_type: values.event_type,
        event_date: values.event_date || null,
        event_lunar: values.event_lunar || null,
        person_id: values.person_id || null,
        location: values.location || null,
        recurring: values.recurring,
      };
      if (initial) {
        await updateEvent.mutateAsync({ id: initial.id, input: cleanValues });
        toast.success('Đã cập nhật sự kiện');
      } else {
        await createEvent.mutateAsync(cleanValues as Parameters<typeof createEvent.mutateAsync>[0]);
        toast.success('Đã thêm sự kiện');
      }
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;
  const eventType = watch('event_type');
  const recurring = watch('recurring');
  const selectedPersonId = watch('person_id');

  const filteredPeople = useMemo(() => {
    if (!people) return [];
    return people
      .filter((p) => !p.is_living)
      .filter((p) => {
        if (!personSearch) return false;
        const q = personSearch.toLowerCase();
        return p.display_name.toLowerCase().includes(q);
      })
      .slice(0, 10);
  }, [people, personSearch]);

  const selectedPerson = useMemo(
    () => people?.find((p) => p.id === selectedPersonId) ?? null,
    [people, selectedPersonId]
  );

  const handleSelectPerson = (personId: string) => {
    const person = people?.find((p) => p.id === personId);
    if (!person) return;
    setValue('person_id', person.id);
    if (eventType === 'gio') {
      if (!watch('title')) setValue('title', `Giỗ ${person.display_name}`);
      if (!watch('event_lunar') && person.death_lunar) {
        setValue('event_lunar', person.death_lunar);
      }
    }
    setPersonSearch('');
  };

  const handleClearPerson = () => {
    setValue('person_id', null);
    setPersonSearch('');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề *</Label>
        <Input id="title" {...register('title')} placeholder="VD: Giỗ ông tổ" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_type">Loại sự kiện *</Label>
        <Select
          value={eventType}
          onValueChange={(v) =>
            setValue('event_type', v as 'gio' | 'hop_ho' | 'le_tet' | 'other')
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gio">Giỗ</SelectItem>
            <SelectItem value="hop_ho">Họp họ</SelectItem>
            <SelectItem value="le_tet">Lễ/Tết</SelectItem>
            <SelectItem value="other">Khác</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Người được giỗ</Label>
        {selectedPerson ? (
          <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
            <div className="text-sm">
              <div className="font-medium">{selectedPerson.display_name}</div>
              <div className="text-xs text-muted-foreground">
                Đời {selectedPerson.generation}
                {selectedPerson.death_lunar && ` · Giỗ ${selectedPerson.death_lunar} ÂL`}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClearPerson}
              aria-label="Bỏ chọn"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={personSearch}
                onChange={(e) => setPersonSearch(e.target.value)}
                placeholder="Tìm theo tên người đã mất..."
                className="pl-9"
              />
            </div>
            {personSearch.length >= 2 && filteredPeople.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-md border bg-card shadow-sm">
                {filteredPeople.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPerson(p.id)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <div className="font-medium">{p.display_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Đời {p.generation}
                      {p.death_lunar && ` · Giỗ ${p.death_lunar} ÂL`}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Chỉ hiển thị thành viên đã mất. Khi chọn, tiêu đề và ngày âm sẽ tự động điền.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="event_date">Ngày dương lịch</Label>
          <Input id="event_date" type="date" {...register('event_date')} />
          <p className="text-xs text-muted-foreground">Có thể bỏ trống nếu dùng âm lịch</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="event_lunar">Ngày âm lịch (DD/MM)</Label>
          <Input id="event_lunar" {...register('event_lunar')} placeholder="VD: 15/7" />
          {errors.event_lunar && (
            <p className="text-xs text-destructive">{errors.event_lunar.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Địa điểm</Label>
        <Input id="location" {...register('location')} placeholder="VD: Đền thờ họ Nguyễn Đình" />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="recurring"
          checked={recurring}
          onChange={(e) => setValue('recurring', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="recurring" className="cursor-pointer">
          Sự kiện hằng năm (tính theo âm lịch)
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea id="description" rows={3} {...register('description')} />
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