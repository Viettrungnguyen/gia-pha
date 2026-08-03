'use client';

import { useState, useMemo } from 'react';
import { Archive, Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDocuments } from '@/hooks/use-documents';
import { DocumentCard } from '@/components/documents/document-card';
import type { DocumentCategory } from '@/types';

const CATEGORIES: Array<{ value: DocumentCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'anh_lich_su', label: 'Ảnh lịch sử' },
  { value: 'giay_to', label: 'Giấy tờ' },
  { value: 'ban_do', label: 'Bản đồ' },
  { value: 'video', label: 'Video' },
  { value: 'bai_viet', label: 'Bài viết' },
  { value: 'khac', label: 'Khác' },
];

export default function TaiLieuPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');

  const filter = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...(category !== 'all' ? { category } : {}),
    }),
    [search, category]
  );

  const { data: documents, isLoading, error } = useDocuments(filter);

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
  };

  const hasFilters = !!search || category !== 'all';

  const counts = useMemo(() => {
    if (!documents) return null;
    const map = new Map<string, number>();
    documents.forEach((d) => map.set(d.category, (map.get(d.category) ?? 0) + 1));
    return map;
  }, [documents]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Archive className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Kho tài liệu</h1>
          <p className="text-sm text-muted-foreground">
            Ảnh, giấy tờ, bản đồ và tài liệu lịch sử dòng họ
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tiêu đề, mô tả, thẻ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={category === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
                {counts && cat.value !== 'all' && counts.has(cat.value) && (
                  <span className="ml-1 text-xs opacity-70">
                    ({counts.get(cat.value)})
                  </span>
                )}
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
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5]" />
          ))}
        </div>
      ) : !documents || documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {hasFilters ? (
              <>
                <p>Không tìm thấy tài liệu phù hợp.</p>
                <Button variant="link" onClick={clearFilters}>Xóa bộ lọc</Button>
              </>
            ) : (
              <p>Kho tài liệu chưa có nội dung.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Hiển thị {documents.length} tài liệu
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}