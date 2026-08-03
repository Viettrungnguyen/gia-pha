/**
 * @project NguyenDinhHoaNgai
 * @file src/app/admin/lich-cung-le/page.tsx
 * @description Admin events CRUD with search and type filtering
 * @version 1.1.0
 * @updated 2026-07-24
 */

'use client';

import { useState, useMemo } from 'react';
import { useEvents } from '@/hooks/use-events';
import { EventForm } from '@/components/events/event-form';
import { EventDeleteDialog } from '@/components/events/event-delete-dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import type { Event } from '@/types';

const TYPE_LABEL: Record<string, string> = {
  gio: 'Giỗ',
  hop_ho: 'Họp họ',
  le_tet: 'Lễ/Tết',
  other: 'Khác',
};

export default function AdminLichCungLePage() {
  const { data: events, isLoading } = useEvents();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editing, setEditing] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState<Event | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(
    () =>
      events?.filter((e) => {
        if (typeFilter !== 'all' && e.event_type !== typeFilter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          (e.description ?? '').toLowerCase().includes(q) ||
          (e.location ?? '').toLowerCase().includes(q)
        );
      }) ?? [],
    [events, search, typeFilter]
  );

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('vi-VN') : '—';

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tiêu đề, mô tả, địa điểm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="gio">Giỗ</SelectItem>
                <SelectItem value="hop_ho">Họp họ</SelectItem>
                <SelectItem value="le_tet">Lễ/Tết</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search || typeFilter !== 'all'
                ? 'Không tìm thấy kết quả.'
                : 'Chưa có sự kiện nào.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Ngày dương</TableHead>
                    <TableHead>Ngày âm</TableHead>
                    <TableHead>Địa điểm</TableHead>
                    <TableHead className="w-[100px]">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        {e.title}
                        {e.recurring && (
                          <span className="ml-1 text-xs text-muted-foreground">↻</span>
                        )}
                      </TableCell>
                      <TableCell>{TYPE_LABEL[e.event_type]}</TableCell>
                      <TableCell>{formatDate(e.event_date)}</TableCell>
                      <TableCell>{e.event_lunar ?? '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {e.location ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditing(e)}
                            aria-label={`Sửa ${e.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(e)}
                            aria-label={`Xóa ${e.title}`}
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