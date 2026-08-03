/**
 * @project NguyenDinhHoaNgai
 * @file src/app/admin/tai-lieu/page.tsx
 * @description Admin documents CRUD
 * @version 1.0.0
 * @updated 2026-07-23
 */

'use client';

import { useState, useMemo } from 'react';
import { useDocuments } from '@/hooks/use-documents';
import { DocumentForm } from '@/components/documents/document-form';
import { DocumentDeleteDialog } from '@/components/documents/document-delete-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Search, ExternalLink } from 'lucide-react';
import { DOCUMENT_CATEGORY_OPTIONS } from '@/components/documents/document-constants';
import {
  formatFileSize,
  getFileExtension,
} from '@/lib/supabase-data-documents';
import type { ClanDocument, DocumentCategory } from '@/types';

const CAT_LABEL: Record<string, string> = Object.fromEntries(
  DOCUMENT_CATEGORY_OPTIONS.map((o) => [o.value, o.label])
);

export default function AdminTaiLieuPage() {
  const { data: documents, isLoading } = useDocuments();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');
  const [editing, setEditing] = useState<ClanDocument | null>(null);
  const [deleting, setDeleting] = useState<ClanDocument | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!documents) return [];
    return documents.filter((d) => {
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          (d.description ?? '').toLowerCase().includes(q) ||
          (d.tags ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, search, categoryFilter]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý tài liệu</h1>
          <p className="text-sm text-muted-foreground">
            {documents?.length ?? 0} tài liệu trong hệ thống
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tải lên
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
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
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
              onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | 'all')}
              aria-label="Lọc theo danh mục"
            >
              <option value="all">Tất cả danh mục</option>
              {DOCUMENT_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search || categoryFilter !== 'all'
                ? 'Không tìm thấy kết quả.'
                : 'Chưa có tài liệu nào.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Định dạng</TableHead>
                    <TableHead>Kích thước</TableHead>
                    <TableHead>Ngày tải</TableHead>
                    <TableHead className="w-[140px]">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="line-clamp-1 font-medium">{d.title}</div>
                        {d.tags && (
                          <div className="text-xs text-muted-foreground">
                            {d.tags.split(',').slice(0, 3).join(', ')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{CAT_LABEL[d.category] ?? d.category}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {getFileExtension(d.file_type, d.file_url)}
                      </TableCell>
                      <TableCell>{formatFileSize(d.file_size)}</TableCell>
                      <TableCell>
                        {new Date(d.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button asChild variant="ghost" size="icon">
                            <a
                              href={d.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Mở ${d.title}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditing(d)}
                            aria-label={`Sửa ${d.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(d)}
                            aria-label={`Xóa ${d.title}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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