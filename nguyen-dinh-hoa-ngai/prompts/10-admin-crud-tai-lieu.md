---
project: NguyenDinhHoaNgai
path: prompts/10-admin-crud-tai-lieu.md
type: prompt
version: 1.0.0
updated: 2026-07-23
---

# 10 - Admin CRUD Kho Tài Liệu (với Upload)

## 1. Mục tiêu

Trang `/admin/tai-lieu` cho phép admin CRUD tài liệu và upload file lên Supabase Storage. Đây là chức năng admin phức tạp thứ 2 (sau CRUD thành viên).

## 2. Tiêu chí hoàn thành

- [ ] Storage bucket `clan-documents` đã tạo ở prompt 02.
- [ ] Storage RLS policy: chỉ admin INSERT/DELETE.
- [ ] Data layer có `createDocument`, `updateDocument`, `deleteDocument`, `uploadFile`, `deleteFile`.
- [ ] Hooks có mutations.
- [ ] Trang admin có table/list với search + filter.
- [ ] Form upload với file input + preview.
- [ ] Validate MIME type + size (50MB) ở client.
- [ ] Sanitize tên file.
- [ ] Khi xóa document → xóa cả file trong Storage.
- [ ] Smoke test: upload 1 ảnh/PDF thành công.

## 3. File cần tạo/sửa

```
src/
├── lib/supabase-data-documents.ts        # Thêm mutations + upload
├── hooks/use-documents.ts                # Thêm mutations
├── components/documents/
│   ├── document-form.tsx                 # NEW (với file upload)
│   └── document-delete-dialog.tsx        # NEW
└── app/admin/tai-lieu/
    ├── page.tsx                          # NEW
    └── loading.tsx                       # NEW
```

## 4. Phụ thuộc

- Storage bucket `clan-documents` đã tạo.
- Đã có admin sidebar (từ prompt 08).

## 5. Bước thực hiện

### Bước 1: Cập nhật `src/lib/supabase-data-documents.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase-data-documents.ts
 * @description Documents data layer (CRUD + Storage)
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ClanDocument } from '@/types';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4', 'video/webm',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const ALLOWED_DOCUMENT_TYPES = ALLOWED_MIME_TYPES;
export const MAX_DOCUMENT_SIZE = MAX_FILE_SIZE;

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File quá lớn (tối đa 50MB). File của bạn: ${(file.size / 1024 / 1024).toFixed(1)}MB`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Định dạng không hỗ trợ: ${file.type || 'không xác định'}`;
  }
  return null;
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100);
}

export async function getDocuments(): Promise<ClanDocument[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('clan_documents')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type CreateDocumentInput = Omit<ClanDocument, 'id' | 'created_at' | 'updated_at' | 'uploaded_by'>;
export type UpdateDocumentInput = Partial<Omit<CreateDocumentInput, 'file_url' | 'file_type' | 'file_size'>>;

export async function uploadDocumentFile(file: File): Promise<string> {
  const validation = validateFile(file);
  if (validation) throw new Error(validation);

  const supabase = getSupabaseBrowserClient();
  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage
    .from('clan-documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('clan-documents')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function createDocument(
  input: CreateDocumentInput,
  file: File,
  userId: string
): Promise<ClanDocument> {
  const supabase = getSupabaseBrowserClient();
  const fileUrl = await uploadDocumentFile(file);

  const { data, error } = await supabase
    .from('clan_documents')
    .insert({
      ...input,
      file_url: fileUrl,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) {
    // Cleanup uploaded file if DB insert fails
    await supabase.storage.from('clan-documents').remove([fileUrl.split('/').pop()!]);
    throw error;
  }

  return data;
}

export async function updateDocument(
  id: string,
  input: UpdateDocumentInput,
  newFile?: File
): Promise<ClanDocument> {
  const supabase = getSupabaseBrowserClient();
  let fileUrl: string | undefined;
  let fileType: string | undefined;
  let fileSize: number | undefined;

  if (newFile) {
    fileUrl = await uploadDocumentFile(newFile);
    fileType = newFile.type;
    fileSize = newFile.size;
  }

  const updateData: any = { ...input };
  if (fileUrl) {
    updateData.file_url = fileUrl;
    updateData.file_type = fileType;
    updateData.file_size = fileSize;
  }

  const { data, error } = await supabase
    .from('clan_documents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (fileUrl) {
      await supabase.storage.from('clan-documents').remove([fileUrl.split('/').pop()!]);
    }
    throw error;
  }

  return data;
}

export async function deleteDocumentFile(fileUrl: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  // Extract file name from URL
  const urlParts = fileUrl.split('/clan-documents/');
  if (urlParts.length < 2) return;
  const fileName = urlParts[1];
  await supabase.storage.from('clan-documents').remove([fileName]);
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  // Get current doc to find file URL
  const { data: doc } = await supabase
    .from('clan_documents')
    .select('file_url')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('clan_documents').delete().eq('id', id);
  if (error) throw error;

  // Delete file from Storage
  if (doc?.file_url) {
    await deleteDocumentFile(doc.file_url);
  }
}
```

### Bước 2: Cập nhật `src/hooks/use-documents.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocuments, createDocument, updateDocument, deleteDocument,
  type CreateDocumentInput, type UpdateDocumentInput,
} from '@/lib/supabase-data-documents';
import type { ClanDocument } from '@/types';

export function useDocuments() {
  return useQuery<ClanDocument[]>({
    queryKey: ['documents'],
    queryFn: getDocuments,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      input, file, userId,
    }: { input: CreateDocumentInput; file: File; userId: string }) =>
      createDocument(input, file, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input, newFile,
    }: { id: string; input: UpdateDocumentInput; newFile?: File }) =>
      updateDocument(id, input, newFile),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}
```

### Bước 3: Tạo `src/components/documents/document-form.tsx`

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
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(docSchema) as any,
    defaultValues: initial ? {
      ...initial,
      description: initial.description || '',
      tags: initial.tags || '',
    } : {
      title: '',
      category: 'khac' as DocumentCategory,
    },
  });

  const category = watch('category');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
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
        ...values,
        description: values.description || null,
        tags: values.tags || null,
        person_id: personId || null,
      };

      if (initial) {
        await updateDocument.mutateAsync({ id: initial.id, input: cleanValues, newFile: file || undefined });
      } else if (file) {
        await createDocument.mutateAsync({ input: cleanValues as any, file, userId: user.id });
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
          <Select value={category} onValueChange={(v) => setValue('category', v as DocumentCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (phân cách dấu phẩy)</Label>
          <Input id="tags" {...register('tags')} placeholder="VD: nhà thờ, lịch sử, 1940" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Thành viên liên quan</Label>
        <ParentCombobox
          selectedId={personId || undefined}
          onSelect={(id) => setPersonId(id || null)}
          placeholder="Tìm thành viên..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea id="description" rows={3} {...register('description')} />
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label htmlFor="file">File {initial ? '(tùy chọn - để trống nếu không thay)' : '*'}</Label>
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
            <span className="flex-1 truncate">{file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
            <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {fileError && <p className="text-xs text-destructive">{fileError}</p>}
        {initial && !file && (
          <p className="text-xs text-muted-foreground">File hiện tại: {initial.file_url.split('/').pop()}</p>
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
```

### Bước 4: Tạo `src/components/documents/document-delete-dialog.tsx`

```tsx
'use client';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteDocument } from '@/hooks/use-documents';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { ClanDocument } from '@/types';

interface Props {
  document: ClanDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentDeleteDialog({ document: doc, open, onOpenChange }: Props) {
  const deleteDocument = useDeleteDocument();

  const handleDelete = async () => {
    if (!doc) return;
    try {
      await deleteDocument.mutateAsync(doc.id);
      toast.success(`Đã xóa "${doc.title}"`);
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
          <AlertDialogTitle>Xác nhận xóa tài liệu</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa <strong>{doc?.title}</strong>?
            <span className="mt-2 block rounded-md bg-destructive/10 p-2 text-destructive">
              ⚠️ File trong Storage cũng sẽ bị xóa vĩnh viễn.
            </span>
            <span className="mt-2 block text-xs">Hành động này không thể hoàn tác.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deleteDocument.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Bước 5: Tạo `src/app/admin/tai-lieu/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useDocuments } from '@/hooks/use-documents';
import { DocumentForm } from '@/components/documents/document-form';
import { DocumentDeleteDialog } from '@/components/documents/document-delete-dialog';
import { DOCUMENT_CATEGORY_OPTIONS } from '@/components/documents/document-constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, ExternalLink } from 'lucide-react';
import type { ClanDocument } from '@/types';

export default function AdminTaiLieuPage() {
  const { data: documents, isLoading } = useDocuments();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editing, setEditing] = useState<ClanDocument | null>(null);
  const [deleting, setDeleting] = useState<ClanDocument | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = (documents ?? []).filter((d) => {
    if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${d.title} ${d.description || ''} ${d.tags || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý kho tài liệu</h1>
          <p className="text-sm text-muted-foreground">
            {documents?.length ?? 0} tài liệu trong hệ thống
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tải lên mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tải lên tài liệu mới</DialogTitle>
            </DialogHeader>
            <DocumentForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tiêu đề, mô tả, tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Tất cả danh mục</option>
              {DOCUMENT_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search || categoryFilter !== 'all' ? 'Không có kết quả phù hợp.' : 'Chưa có tài liệu nào.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-[140px]">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {d.title}
                        <ExternalLink className="ml-1 inline h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {DOCUMENT_CATEGORY_OPTIONS.find((o) => o.value === d.category)?.label || d.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.file_type?.split('/')[1]?.toUpperCase()}
                      {d.file_size && ` · ${(d.file_size / 1024 / 1024).toFixed(1)}MB`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.tags ? d.tags.split(',').slice(0, 2).join(', ') : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(d)}>
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
            <DialogTitle>Sửa tài liệu</DialogTitle>
          </DialogHeader>
          {editing && <DocumentForm initial={editing} onSuccess={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <DocumentDeleteDialog
        document={deleting}
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

- [ ] Đăng nhập admin → `/admin/tai-lieu` → thấy 3 documents từ seed.
- [ ] Click "Tải lên mới" → form → điền → chọn 1 ảnh (<50MB) → submit.
- [ ] Toast "Đã tải lên tài liệu".
- [ ] Storage Dashboard → bucket `clan-documents` → file mới xuất hiện.
- [ ] Trang public `/tai-lieu` hiển thị document mới với thumbnail.
- [ ] Click thumbnail → mở file trong tab mới.
- [ ] Sửa document (đổi tiêu đề, không đổi file) → OK.
- [ ] Xóa document → confirm → file trong Storage cũng bị xóa.

## 7. Lưu ý rủi ro

- **Storage quota:** Supabase free tier 1GB. Với 50MB mỗi file, chỉ ~20 file tối đa. Cần monitor.
- **MIME type spoofing:** Client validation có thể bypass. Production cần server-side validation. Hiện MVP chấp nhận rủi ro.
- **File lớn (>50MB):** Hiện block ở client. Có thể tăng giới hạn sau.
- **Cleanup failed uploads:** Nếu DB insert fail sau khi upload, code đã có rollback xóa file.
- **Public URLs:** File URL là public. Nếu cần giới hạn truy cập, dùng signed URL.

## 8. Liên kết

- [09-admin-crud-lich-cung-le.md](09-admin-crud-lich-cung-le.md) - Trước đó.
- [11-deploy-vercel-supabase.md](11-deploy-vercel-supabase.md) - Tiếp theo (deploy).
- [BRD.md §3.3.4](../docs/01-planning/BRD.md) - Yêu cầu FR-ADM-04.
- [SECURITY-PRIVACY.md §5](../docs/02-design/SECURITY-PRIVACY.md) - Upload security.