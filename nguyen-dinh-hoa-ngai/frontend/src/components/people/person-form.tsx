/**
 * @project NguyenDinhHoaNgai
 * @file src/components/people/person-form.tsx
 * @description Person form (create/edit)
 * @version 1.2.0
 * @updated 2026-07-24
 */

'use client';

import { useState } from 'react';
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
import { ParentCombobox } from './parent-combobox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCreatePerson, useUpdatePerson } from '@/hooks/use-people';
import { useCreateFamily, useAddChild } from '@/hooks/use-families';
import type { Person } from '@/types';

const personSchema = z.object({
  handle: z.string().max(50).optional().nullable(),
  display_name: z.string().min(1, 'Bắt buộc').max(255),
  first_name: z.string().max(100).optional().nullable(),
  middle_name: z.string().max(100).optional().nullable(),
  surname: z.string().min(1, 'Bắt buộc').max(100),
  gender: z
    .union([z.literal(1), z.literal(2)])
    .optional()
    .nullable(),
  generation: z.coerce.number().int().min(1).max(20),
  chi: z.coerce.number().int().min(1).optional().nullable(),
  birth_year: z.coerce.number().int().optional().nullable(),
  birth_place: z.string().max(255).optional().nullable(),
  death_year: z.coerce.number().int().optional().nullable(),
  death_lunar: z
    .string()
    .regex(/^\d{1,2}\/\d{1,2}$/, 'Định dạng DD/MM')
    .optional()
    .nullable()
    .or(z.literal('')),
  death_place: z.string().max(255).optional().nullable(),
  is_living: z.boolean(),
  occupation: z.string().max(255).optional().nullable(),
  hometown: z.string().max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  zalo: z.string().max(50).optional().nullable(),
  facebook: z.string().url('URL không hợp lệ').optional().nullable().or(z.literal('')),
  email: z
    .string()
    .email()
    .optional()
    .nullable()
    .or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  privacy_level: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  biography: z.string().max(5000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

type FormValues = z.infer<typeof personSchema>;

interface Props {
  initial?: Person | null;
  onSuccess: () => void;
}

const toNullable = <T extends string | number | undefined | null>(v: T): T extends '' ? null : T => {
  if (v === '' || v === undefined) return null as T extends '' ? null : T;
  return v as T extends '' ? null : T;
};

export function PersonForm({ initial, onSuccess }: Props) {
  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();
  const createFamily = useCreateFamily();
  const addChild = useAddChild();

  const [fatherId, setFatherId] = useState<string | null>(null);
  const [fatherName, setFatherName] = useState<string>('');
  const [motherId, setMotherId] = useState<string | null>(null);
  const [motherName, setMotherName] = useState<string>('');

  const defaults: FormValues = initial
    ? {
        handle: initial.handle,
        display_name: initial.display_name,
        first_name: initial.first_name,
        middle_name: initial.middle_name,
        surname: initial.surname,
        gender: initial.gender,
        generation: initial.generation,
        chi: initial.chi,
        birth_year: initial.birth_year,
        birth_place: initial.birth_place,
        death_year: initial.death_year,
        death_lunar: initial.death_lunar,
        death_place: initial.death_place,
        is_living: initial.is_living,
        occupation: initial.occupation,
        hometown: initial.hometown,
        phone: initial.phone,
        email: initial.email,
        zalo: initial.zalo,
        facebook: initial.facebook,
        address: initial.address,
        privacy_level: initial.privacy_level,
        biography: initial.biography,
        notes: initial.notes,
      }
    : {
        handle: '',
        display_name: '',
        surname: 'Nguyễn Đình',
        generation: 1,
        is_living: true,
        first_name: null,
        middle_name: null,
        gender: null,
        chi: null,
        birth_year: null,
        birth_place: null,
        death_year: null,
        death_lunar: null,
        death_place: null,
        occupation: null,
        hometown: null,
        phone: null,
        email: null,
        zalo: null,
        facebook: null,
        address: null,
        privacy_level: 0,
        biography: null,
        notes: null,
      };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: defaults,
  });

  const isLiving = watch('is_living');
  const genderVal = watch('gender');
  const privacyLevel = watch('privacy_level');

  const onSubmit = async (values: FormValues) => {
    try {
        const cleanValues = {
          handle: toNullable(values.handle),
          display_name: values.display_name,
        first_name: toNullable(values.first_name),
        middle_name: toNullable(values.middle_name),
        surname: values.surname,
        gender: values.gender ?? null,
        generation: values.generation,
        chi: toNullable(values.chi),
        birth_year: toNullable(values.birth_year),
        birth_place: toNullable(values.birth_place),
        death_year: toNullable(values.death_year),
        death_lunar: toNullable(values.death_lunar),
        death_place: toNullable(values.death_place),
        is_living: values.is_living,
        occupation: toNullable(values.occupation),
        hometown: toNullable(values.hometown),
        phone: toNullable(values.phone),
        email: toNullable(values.email),
        zalo: toNullable(values.zalo),
        facebook: toNullable(values.facebook),
        address: toNullable(values.address),
        privacy_level: values.privacy_level,
        biography: toNullable(values.biography),
        notes: toNullable(values.notes),
        avatar_url: null,
      };

      let personId: string;
      if (initial) {
        const updatePayload = { ...cleanValues, handle: cleanValues.handle ?? undefined };
        const updated = await updatePerson.mutateAsync({ id: initial.id, input: updatePayload });
        personId = updated.id;
      } else {
        const createPayload = { ...cleanValues, handle: cleanValues.handle ?? '' };
        const created = await createPerson.mutateAsync(createPayload as Parameters<typeof createPerson.mutateAsync>[0]);
        personId = created.id;

        if (fatherId || motherId) {
          const family = await createFamily.mutateAsync({
            father_id: fatherId ?? undefined,
            mother_id: motherId ?? undefined,
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

  const isPending =
    createPerson.isPending ||
    updatePerson.isPending ||
    createFamily.isPending ||
    addChild.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {initial ? (
          <div className="space-y-2 sm:col-span-2">
            <Label>Mã thành viên</Label>
            <Input value={initial.handle} readOnly disabled />
            <p className="text-xs text-muted-foreground">Mã này đã được tự sinh và không thể chỉnh sửa.</p>
          </div>
        ) : (
          <div className="space-y-2 sm:col-span-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Mã thành viên sẽ được tự sinh khi lưu (ví dụ: <code>ND019</code>).
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="display_name">Tên hiển thị *</Label>
          <Input
            id="display_name"
            {...register('display_name')}
            placeholder="VD: Nguyễn Đình A"
          />
          {errors.display_name && (
            <p className="text-xs text-destructive">{errors.display_name.message}</p>
          )}
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
            value={genderVal?.toString() ?? ''}
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
          {errors.generation && (
            <p className="text-xs text-destructive">{errors.generation.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="chi">Chi</Label>
          <Input id="chi" type="number" min={1} {...register('chi')} />
        </div>
      </div>

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

      <div className="border-t pt-4">
        <div className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="is_living"
            checked={isLiving}
            onChange={(e) => setValue('is_living', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="is_living" className="cursor-pointer">
            Còn sống
          </Label>
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
              {errors.death_lunar && (
                <p className="text-xs text-destructive">{errors.death_lunar.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="death_place">Nơi mất</Label>
              <Input id="death_place" {...register('death_place')} />
            </div>
          </div>
        )}
      </div>

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
          <div className="space-y-2">
            <Label htmlFor="zalo">Zalo</Label>
            <Input id="zalo" {...register('zalo')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input id="facebook" type="url" {...register('facebook')} placeholder="https://facebook.com/..." />
            {errors.facebook && <p className="text-xs text-destructive">{errors.facebook.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" {...register('address')} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="privacy_level">Quyền riêng tư</Label>
            <Select
              value={String(privacyLevel)}
              onValueChange={(value) => setValue('privacy_level', Number(value) as 0 | 1 | 2)}
            >
              <SelectTrigger id="privacy_level"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Công khai hồ sơ, ẩn thông tin liên hệ</SelectItem>
                <SelectItem value="1">Chỉ quản trị viên</SelectItem>
                <SelectItem value="2">Riêng tư</SelectItem>
              </SelectContent>
            </Select>
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

      {!initial && (
        <div className="border-t pt-4">
          <h3 className="mb-3 text-sm font-semibold">Quan hệ cha mẹ</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cha</Label>
              <ParentCombobox
                selectedId={fatherId ?? undefined}
                selectedName={fatherName}
                onSelect={(id, name) => {
                  setFatherId(id || null);
                  setFatherName(name);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Mẹ</Label>
              <ParentCombobox
                selectedId={motherId ?? undefined}
                selectedName={motherName}
                onSelect={(id, name) => {
                  setMotherId(id || null);
                  setMotherName(name);
                }}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Nếu chọn cả cha và mẹ, hệ thống sẽ tự tạo quan hệ gia đình.
          </p>
        </div>
      )}

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