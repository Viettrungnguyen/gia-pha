---
project: NguyenDinhHoaNgai
path: prompts/07-public-tai-lieu.md
type: prompt
version: 1.0.0
updated: 2026-07-23
---

# 07 - Public Kho Tài Liệu

## 1. Mục tiêu

Trang `/tai-lieu` hiển thị grid các tài liệu dòng họ (ảnh, PDF, video, bài viết) với tìm kiếm, lọc danh mục, và cho phép tải xuống.

## 2. Tiêu chí hoàn thành

- [ ] Data layer `supabase-data-documents.ts` cung cấp `getDocuments`.
- [ ] Hook `use-documents.ts` wrap React Query.
- [ ] Trang `/tai-lieu` có search + filter danh mục.
- [ ] Grid card hiển thị thumbnail (icon cho PDF/video, ảnh cho image).
- [ ] Click card → mở file trong tab mới.
- [ ] Hiển thị size, danh mục, tags.
- [ ] Smoke test: 3 tài liệu từ seed hiển thị.

## 3. File cần tạo

```
src/
├── lib/
│   └── supabase-data-documents.ts        # NEW
├── hooks/
│   └── use-documents.ts                  # NEW
├── components/
│   └── documents/
│       └── document-card.tsx             # NEW
└── app/(public)/
    └── tai-lieu/
        ├── page.tsx                      # NEW
        └── loading.tsx                   # NEW
```

## 4. Phụ thuộc

- Có seed documents (3 rows từ prompt 02).
- Có `ClanDocument` type từ prompt 04.

## 5. Bước thực hiện

### Bước 1: Tạo `src/lib/supabase-data-documents.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase-data-documents.ts
 * @description Documents data layer
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ClanDocument } from '@/types';

export async function getDocuments(): Promise<ClanDocument[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('clan_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
```

### Bước 2: Tạo `src/hooks/use-documents.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getDocuments } from '@/lib/supabase-data-documents';
import type { ClanDocument } from '@/types';

export function useDocuments() {
  return useQuery<ClanDocument[]>({
    queryKey: ['documents'],
    queryFn: getDocuments,
  });
}
```

### Bước 3: Tạo `src/components/documents/document-card.tsx`

```tsx
/**
 * @project NguyenDinhHoaNgai
 * @file src/components/documents/document-card.tsx
 * @description Document card for grid display
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { FileText, Image as ImageIcon, Video, FileType } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DOCUMENT_CATEGORY_LABELS } from './document-constants';
import type { ClanDocument } from '@/types';

interface Props {
  document: ClanDocument;
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime?: string | null) {
  if (!mime) return FileText;
  if (mime.startsWith('image/')) return ImageIcon;
  if (mime.startsWith('video/')) return Video;
  if (mime.includes('pdf')) return FileType;
  return FileText;
}

export function DocumentCard({ document: doc }: Props) {
  const Icon = getFileIcon(doc.file_type);
  const isImage = doc.file_type?.startsWith('image/');

  return (
    <a
      href={doc.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block transition-transform hover:scale-[1.02]"
    >
      <Card className="h-full overflow-hidden">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted">
          {isImage ? (
            <img
              src={doc.file_url}
              alt={doc.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback to icon if image fails to load (e.g., placeholder URL)
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Icon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="line-clamp-2 font-medium">{doc.title}</h3>
          {doc.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{doc.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">{DOCUMENT_CATEGORY_LABELS[doc.category]}</Badge>
            {doc.file_size && (
              <span className="text-muted-foreground">{formatSize(doc.file_size)}</span>
            )}
          </div>
          {doc.tags && (
            <div className="mt-2 flex flex-wrap gap-1">
              {doc.tags.split(',').slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </a>
  );
}
```

### Bước 4: Tạo `src/components/documents/document-constants.ts`

```typescript
import type { DocumentCategory } from '@/types';

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  anh_lich_su: 'Ảnh lịch sử',
  giay_to: 'Giấy tờ',
  ban_do: 'Bản đồ',
  video: 'Video',
  bai_viet: 'Bài viết',
  khac: 'Khác',
};

export const DOCUMENT_CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: 'anh_lich_su', label: 'Ảnh lịch sử' },
  { value: 'giay_to', label: 'Giấy tờ' },
  { value: 'ban_do', label: 'Bản đồ' },
  { value: 'video', label: 'Video' },
  { value: 'bai_viet', label: 'Bài viết' },
  { value: 'khac', label: 'Khác' },
];
```

### Bước 5: Tạo `src/app/(public)/tai-lieu/page.tsx`

```tsx
'use client';

import { useState, useMemo } from 'react';
import { useDocuments } from '@/hooks/use-documents';
import { DocumentCard } from '@/components/documents/document-card';
import { DOCUMENT_CATEGORY_OPTIONS, DOCUMENT_CATEGORY_LABELS } from '@/components/documents/document-constants';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Archive, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TaiLieuPage() {
  const { data: documents, isLoading, error } = useDocuments();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    if (!documents) return [];
    return documents.filter((d) => {
      if (category !== 'all' && d.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${d.title} ${d.description || ''} ${d.tags || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [documents, search, category]);

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
  };

  const hasFilters = search || category !== 'all';

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
          <Archive className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Kho tài liệu</h1>
          <p className="text-sm text-muted-foreground">
            Ảnh lịch sử, giấy tờ, PDF, video và bài viết về dòng họ
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tiêu đề, mô tả, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={category === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory('all')}
            >
              Tất cả
            </Button>
            {DOCUMENT_CATEGORY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={category === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" />
              Xóa bộ lọc
            </Button>
          )}
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Lỗi khi tải dữ liệu: {error.message}</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {hasFilters ? (
              <>
                <p>Không tìm thấy tài liệu phù hợp.</p>
                <Button variant="link" onClick={clearFilters}>Xóa bộ lọc</Button>
              </>
            ) : (
              <>
                <Archive className="mx-auto mb-2 h-10 w-10 opacity-50" />
                <p>Chưa có tài liệu nào.</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Hiển thị {filtered.length} / {documents?.length ?? 0} tài liệu
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
```

### Bước 6: Tạo `src/app/(public)/tai-lieu/loading.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Skeleton className="mb-4 h-10 w-48" />
      <Skeleton className="mb-6 h-32 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video" />
        ))}
      </div>
    </main>
  );
}
```

## 6. Smoke test

```bash
cd frontend
pnpm tsc && pnpm lint && pnpm build
pnpm dev
```

Verify:

- [ ] Vào `/tai-lieu` → hiển thị 3 cards (1 ảnh, 1 PDF, 1 ảnh).
- [ ] Card ảnh hiển thị `<img>` tag (sẽ fail load vì placeholder URL, nhưng fallback icon hiển thị).
- [ ] Card PDF hiển thị icon FileType.
- [ ] Filter danh mục "Ảnh lịch sử" → chỉ hiển thị 2 cards.
- [ ] Tìm "gia phả" → chỉ hiển thị card "Gia phả sách giấy".
- [ ] Click card → mở file trong tab mới (sẽ 404 do placeholder URL, nhưng flow đúng).

## 7. Lưu ý rủi ro

- **Placeholder URLs:** Seed dùng URL `https://placeholder.supabase.co/...` không load được. Khi admin upload file thật qua admin panel, URLs sẽ thật.
- **Image preview:** Có fallback khi ảnh fail (do CORS hoặc URL sai).
- **Search đơn giản:** Substring match. Có thể nâng cấp fuzzy search sau.
- **File types hỗ trợ:** Ảnh, PDF, video. Có thể mở rộng thêm (Word, Excel).

## 8. Liên kết

- [06-public-lich-cung-le.md](06-public-lich-cung-le.md) - Trước đó.
- [08-admin-crud-thanh-vien.md](08-admin-crud-thanh-vien.md) - Tiếp theo (admin CRUD).
- [BRD.md §3.1.6](../docs/01-planning/BRD.md) - Yêu cầu FR-PUB-06.