/**
 * @project NguyenDinhHoaNgai
 * @file src/components/documents/document-form.tsx
 * @description Document form with file upload
 * @version 1.0.0
 * @updated 2026-07-23
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
import { ParentCombobox } from '@/components/people/parent-combobox';
import { DOCUMENT_CATEGORY_OPTIONS } from './document-constants';
import { validateFile, MAX_DOCUMENT_SIZE } from '@/lib/supabase-data-documents';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-documents';
import type { ClanDocument, DocumentCategory } from '@/types';

const docSchema = z.object({
  title: z.string().min(1, 'Bắt buộc').max(500),
  description: z.string().max(2000).optional().nullable(),
  category: z.enum(['anh_lich_su', 'giay_to', 'ban_do', 'video', 'bai_viet', 'khac']),
  tags: z.string().max(500).optional().nullable(),
  person_id: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof docSchema>;

interface Props {
  initial?: ClanDocument | null;
  onSuccess: () => void;
}

export function DocumentForm({ initial, onSuccess }: Props) {
  const { user } = useAuth();
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const [personId, setPersonId] = useState<string | null>(initial?.person_id ?? null);
  const [personName, setPersonName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const defaults: FormValues = initial
    ? {
        title: initial.title,
        description: initial.description,
        category: initial.category,
        tags: initial.tags,
        person_id: initial.person_id,
      }
    : {
        title: '',
        category: 'khac' as DocumentCategory,
        description: null,
        tags: null,
        person_id: null,
      };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(docSchema),
    defaultValues: defaults,
  });

  const category = watch('category');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setFileError(null);
      return;
    }
    const error = validateFile(selected);
    if (error) {
      setFileError(error);
      setFile(null);
    } else {
      setFileError(null);
      setFile(selected);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error('Chưa đăng nhập');
      return;
    }
    if (!initial && !file) {
      setFileError('Vui lòng chọn file');
      return;
    }

    try {
      const cleanValues = {
        title: values.title,
        description: values.description || null,
        category: values.category,
        tags: values.tags || null,
        person_id: personId || null,
      };

      if (initial) {
        await updateDocument.mutateAsync({
          id: initial.id,
          input: cleanValues,
          newFile: file ?? undefined,
        });
      } else if (file) {
        await createDocument.mutateAsync({
          input: cleanValues,
          file,
          userId: user.id,
        });
      }

      toast.success(initial ? 'Đã cập nhật tài liệu' : 'Đã tải lên tài liệu');
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(message);
    }
  };

  const isPending = createDocument.isPending || updateDocument.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề *</Label>
        <Input id="title" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Danh mục *</Label>
          <Select
            value={category}
            onValueChange={(v) => setValue('category', v as DocumentCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (phân cách dấu phẩy)</Label>
          <Input
            id="tags"
            {...register('tags')}
            placeholder="VD: nhà thờ, lịch sử, 1940"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Thành viên liên quan</Label>
        <ParentCombobox
          selectedId={personId ?? undefined}
          selectedName={personName}
          onSelect={(id, name) => {
            setPersonId(id || null);
            setPersonName(name);
          }}
          placeholder="Tìm thành viên..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea id="description" rows={3} {...register('description')} />
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label htmlFor="file">File {initial ? '(tùy chọn)' : '*'}</Label>
        <Input
          id="file"
          type="file"
          onChange={handleFileChange}
          accept="image/*,application/pdf,video/mp4,video/webm,.doc,.docx"
        />
        <p className="text-xs text-muted-foreground">
          Hỗ trợ: ảnh, PDF, Word, MP4/WebM. Tối đa {MAX_DOCUMENT_SIZE / 1024 / 1024}MB.
        </p>
        {file && (
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2 text-sm">
            <Upload className="h-4 w-4" />
            <span className="flex-1 truncate">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setFile(null)}
              aria-label="Bỏ chọn file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {fileError && <p className="text-xs text-destructive">{fileError}</p>}
        {initial && !file && (
          <p className="text-xs text-muted-foreground">
            File hiện tại: {initial.file_url.split('/').pop()}
          </p>
        )}
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? 'Cập nhật' : 'Tải lên'}
        </Button>
      </div>
    </form>
  );
}