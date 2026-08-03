/**
 * @project NguyenDinhHoaNgai
 * @file src/app/admin/thanh-vien/page.tsx
 * @description Admin people and family relationship CRUD
 * @version 1.1.0
 * @updated 2026-07-24
 */

'use client';

import { useState, useMemo } from 'react';
import { usePeople } from '@/hooks/use-people';
import { PersonForm } from '@/components/people/person-form';
import { PersonDeleteDialog } from '@/components/people/person-delete-dialog';
import { SpouseManagerDialog } from '@/components/people/spouse-manager-dialog';
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
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import type { Person } from '@/types';

export default function AdminThanhVienPage() {
  const { data: people, isLoading } = usePeople();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Person | null>(null);
  const [managingSpouses, setManagingSpouses] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState<Person | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(
    () =>
      people?.filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          p.display_name.toLowerCase().includes(q) ||
          (p.first_name ?? '').toLowerCase().includes(q) ||
          (p.middle_name ?? '').toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q)
        );
      }) ?? [],
    [people, search]
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý thành viên</h1>
          <p className="text-sm text-muted-foreground">
            {people?.length ?? 0} thành viên trong hệ thống
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Thêm thành viên mới</DialogTitle>
            </DialogHeader>
            <PersonForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên hoặc handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? 'Không tìm thấy kết quả.' : 'Chưa có thành viên nào.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Giới tính</TableHead>
                    <TableHead>Đời</TableHead>
                    <TableHead>Năm sinh</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-[160px]">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.display_name}</TableCell>
                      <TableCell>
                        {p.gender === 1 ? 'Nam' : p.gender === 2 ? 'Nữ' : '—'}
                      </TableCell>
                      <TableCell>
                        {p.generation}
                        {p.chi ? `.${p.chi}` : ''}
                      </TableCell>
                      <TableCell>{p.birth_year ?? '—'}</TableCell>
                      <TableCell>
                        {p.is_living ? 'Còn sống' : 'Đã mất †'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setManagingSpouses(p)}
                            aria-label={`Quản lý vợ chồng của ${p.display_name}`}
                            title="Quản lý vợ/chồng"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditing(p)}
                            aria-label={`Sửa ${p.display_name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(p)}
                            aria-label={`Xóa ${p.display_name}`}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sửa thành viên</DialogTitle>
          </DialogHeader>
          {editing && <PersonForm initial={editing} onSuccess={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <SpouseManagerDialog
        person={managingSpouses}
        open={!!managingSpouses}
        onOpenChange={(open) => !open && setManagingSpouses(null)}
      />

      <PersonDeleteDialog
        person={deleting}
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}