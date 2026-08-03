/**
 * @project NguyenDinhHoaNgai
 * @file src/components/people/person-form.tsx
 * @description Person create/edit form using only existing UI primitives
 * @version 2.0.0
 * @updated 2026-08-03
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePerson, useUpdatePerson } from '@/hooks/use-people';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Person } from '@/types';

const personSchema = z.object({
  handle: z.string().trim().min(1, 'Bắt buộc').max(64),
  display_name: z.string().trim().min(1, 'Bắt buộc').max(128),
  surname: z.string().trim().max(64).default(''),
  middle_name: z.string().trim().max(64).default(''),
  first_name: z.string().trim().max(64).default(''),
  gender: z.union([z.literal(1), z.literal(2)]),
  generation: z.coerce.number().int().min(1).max(20),
  chi: z.union([z.coerce.number().int().min(1).max(10), z.nan()]).optional(),
  birth_year: z.union([z.coerce.number().int().min(1000).max(3000), z.nan()]).optional(),
  birth_date: z.string().max(32).default(''),
  birth_place: z.string().max(128).default(''),
  death_year: z.union([z.coerce.number().int().min(1000).max(3000), z.nan()]).optional(),
  death_date: z.string().max(32).default(''),
  death_place: z.string().max(128).default(''),
  death_lunar: z.string().max(16).default(''),
  is_living: z.boolean(),
  is_patrilineal: z.boolean(),
  phone: z.string().max(32).default(''),
  email: z.string().email('Email không hợp lệ').or(z.literal('')).default(''),
  zalo: z.string().max(32).default(''),
  facebook: z.string().max(256).default(''),
  address: z.string().max(256).default(''),
  hometown: z.string().max(256).default(''),
  occupation: z.string().max(128).default(''),
  biography: z.string().max(4000).default(''),
  notes: z.string().max(2000).default(''),
  avatar_url: z.string().url('URL không hợp lệ').or(z.literal('')).default(''),
  privacy_level: z.union([z.literal(0), z.literal(1), z.literal(2)]),
});

type PersonFormData = z.infer<typeof personSchema>;

function toFormData(p: Person): PersonFormData {
  return {
    handle: p.handle ?? '',
    display_name: p.display_name ?? '',
    surname: p.surname ?? '',
    middle_name: p.middle_name ?? '',
    first_name: p.first_name ?? '',
    gender: (p.gender === 2 ? 2 : 1) as 1 | 2,
    generation: p.generation ?? 1,
    chi: p.chi ?? undefined,
    birth_year: p.birth_year ?? undefined,
    birth_date: p.birth_date ?? '',
    birth_place: p.birth_place ?? '',
    death_year: p.death_year ?? undefined,
    death_date: p.death_date ?? '',
    death_place: p.death_place ?? '',
    death_lunar: p.death_lunar ?? '',
    is_living: !!p.is_living,
    is_patrilineal: !!p.is_patrilineal,
    phone: p.phone ?? '',
    email: p.email ?? '',
    zalo: p.zalo ?? '',
    facebook: p.facebook ?? '',
    address: p.address ?? '',
    hometown: p.hometown ?? '',
    occupation: p.occupation ?? '',
    biography: p.biography ?? '',
    notes: p.notes ?? '',
    avatar_url: p.avatar_url ?? '',
    privacy_level: p.privacy_level ?? 0,
  };
}

function toNull(v: number | undefined | null): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'number' && Number.isNaN(v)) return null;
  return v;
}

function toCreateInput(d: PersonFormData) {
  return {
    handle: d.handle,
    display_name: d.display_name,
    surname: d.surname,
    middle_name: d.middle_name || null,
    first_name: d.first_name || null,
    gender: d.gender,
    generation: d.generation,
    chi: toNull(d.chi),
    birth_year: toNull(d.birth_year),
    birth_date: d.birth_date || null,
    birth_place: d.birth_place || null,
    death_year: toNull(d.death_year),
    death_date: d.death_date || null,
    death_place: d.death_place || null,
    death_lunar: d.death_lunar || null,
    is_living: d.is_living,
    is_patrilineal: d.is_patrilineal,
    phone: d.phone || null,
    email: d.email || null,
    zalo: d.zalo || null,
    facebook: d.facebook || null,
    address: d.address || null,
    hometown: d.hometown || null,
    occupation: d.occupation || null,
    biography: d.biography || null,
    notes: d.notes || null,
    avatar_url: d.avatar_url || null,
    privacy_level: d.privacy_level,
  };
}

interface PersonFormProps {
  initial?: Person;
  onSuccess: () => void;
}

export function PersonForm({ initial, onSuccess }: PersonFormProps) {
  const isEdit = !!initial;
  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PersonFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(personSchema) as any,
    defaultValues: initial
      ? toFormData(initial)
      : {
          handle: '',
          display_name: '',
          surname: 'Nguyễn Đình',
          middle_name: '',
          first_name: '',
          gender: 1,
          generation: 1,
          is_living: true,
          is_patrilineal: true,
          privacy_level: 0,
        },
  });

  const isLiving = watch('is_living');
  const gender = watch('gender');
  const privacy = watch('privacy_level');

  const onSubmit = async (data: PersonFormData) => {
    setServerError(null);
    const payload = toCreateInput(data);
    try {
      if (isEdit && initial) {
        await updatePerson.mutateAsync({ id: initial.id, input: payload });
        toast.success('Đã cập nhật thành viên');
      } else {
        await createPerson.mutateAsync(payload);
        toast.success('Đã thêm thành viên mới');
      }
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu';
      setServerError(message);
      toast.error(message);
    }
  };

  const isSaving = createPerson.isPending || updatePerson.isPending;

  const fieldError = (key: keyof PersonFormData) =>
    errors[key]?.message ? (
      <p className="mt-1 text-xs text-destructive">{errors[key]?.message as string}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Tên hiển thị *</label>
              <Input placeholder="Nguyễn Đình Tài" {...register('display_name')} />
              {fieldError('display_name')}
            </div>
            <div>
              <label className="text-sm font-medium">Handle *</label>
              <Input placeholder="nguyen-dinh-tai" {...register('handle')} />
              <p className="mt-1 text-xs text-muted-foreground">URL-friendly, không dấu. Để trống sẽ tự tạo.</p>
              {fieldError('handle')}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Họ</label>
              <Input placeholder="Nguyễn Đình" {...register('surname')} />
            </div>
            <div>
              <label className="text-sm font-medium">Tên đệm</label>
              <Input placeholder="Văn" {...register('middle_name')} />
            </div>
            <div>
              <label className="text-sm font-medium">Tên</label>
              <Input placeholder="Tài" {...register('first_name')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Giới tính *</label>
              <Select
                value={gender.toString()}
                onValueChange={(v) => setValue('gender', v === '2' ? 2 : 1, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Nam</SelectItem>
                  <SelectItem value="2">Nữ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Đời *</label>
              <Input type="number" min={1} max={20} {...register('generation')} />
              {fieldError('generation')}
            </div>

            <div>
              <label className="text-sm font-medium">Chi</label>
              <Input
                type="number"
                min={1}
                max={10}
                {...register('chi')}
                onChange={(e) => {
                  const raw = e.target.value;
                  setValue('chi', raw === '' ? undefined : Number(raw));
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Quyền riêng tư</label>
              <Select
                value={privacy.toString()}
                onValueChange={(v) =>
                  setValue('privacy_level', (Number(v) as 0 | 1 | 2), { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Công khai</SelectItem>
                  <SelectItem value="1">Thành viên</SelectItem>
                  <SelectItem value="2">Riêng tư</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                {...register('is_living')}
              />
              Còn sống
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                {...register('is_patrilineal')}
              />
              Chính tộc (dòng cha)
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sinh / Mất</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Năm sinh</label>
              <Input
                type="number"
                placeholder="1990"
                {...register('birth_year')}
                onChange={(e) => {
                  const raw = e.target.value;
                  setValue('birth_year', raw === '' ? undefined : Number(raw));
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ngày sinh</label>
              <Input type="date" {...register('birth_date')} />
            </div>
            <div>
              <label className="text-sm font-medium">Nơi sinh</label>
              <Input placeholder="Hà Nam" {...register('birth_place')} />
            </div>
          </div>

          {!isLiving && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium">Năm mất</label>
                <Input
                  type="number"
                  placeholder="2020"
                  {...register('death_year')}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setValue('death_year', raw === '' ? undefined : Number(raw));
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ngày mất</label>
                <Input type="date" {...register('death_date')} />
              </div>
              <div>
                <label className="text-sm font-medium">Ngày giỗ (Âm)</label>
                <Input placeholder="15/7" {...register('death_lunar')} />
                <p className="mt-1 text-xs text-muted-foreground">DD/MM</p>
              </div>
              <div>
                <label className="text-sm font-medium">Nơi mất</label>
                <Input placeholder="Hà Nội" {...register('death_place')} />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Quê quán</label>
            <Input placeholder="Hòa Ngãi, Thanh Liêm, Hà Nam" {...register('hometown')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liên hệ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Điện thoại</label>
              <Input placeholder="0912345678" {...register('phone')} />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="email@example.com" {...register('email')} />
              {fieldError('email')}
            </div>
            <div>
              <label className="text-sm font-medium">Zalo</label>
              <Input placeholder="0912345678" {...register('zalo')} />
            </div>
            <div>
              <label className="text-sm font-medium">Facebook</label>
              <Input placeholder="https://facebook.com/username" {...register('facebook')} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Địa chỉ hiện tại</label>
            <Input {...register('address')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tiểu sử & Ghi chú</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nghề nghiệp</label>
            <Input placeholder="Giáo viên" {...register('occupation')} />
          </div>
          <div>
            <label className="text-sm font-medium">Tiểu sử</label>
            <Textarea rows={4} placeholder="Giới thiệu về người này..." {...register('biography')} />
          </div>
          <div>
            <label className="text-sm font-medium">Ghi chú</label>
            <Textarea rows={3} placeholder="Ghi chú thêm..." {...register('notes')} />
          </div>
          <div>
            <label className="text-sm font-medium">URL Ảnh đại diện</label>
            <Input placeholder="https://example.com/avatar.jpg" {...register('avatar_url')} />
            {fieldError('avatar_url')}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? 'Cập nhật' : 'Thêm mới'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
