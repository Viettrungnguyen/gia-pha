/**
 * @project NguyenDinhHoaNgai
 * @file src/components/people/person-delete-dialog.tsx
 * @description Delete confirmation with relationship warning
 * @version 1.0.0
 * @updated 2026-07-23
 */

'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeletePerson } from '@/hooks/use-people';
import { useRelationships } from '@/hooks/use-relationships';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Person } from '@/types';

interface Props {
  person: Person | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PersonDeleteDialog({ person, open, onOpenChange, onSuccess }: Props) {
  const deletePerson = useDeletePerson();
  const { data: rels } = useRelationships(person?.id);

  const handleDelete = async () => {
    if (!person) return;
    try {
      await deletePerson.mutateAsync(person.id);
      toast.success(`Đã xóa ${person.display_name}`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi xóa';
      toast.error(message);
    }
  };

  const hasRelationships =
    rels && (rels.asFather.length > 0 || rels.asMother.length > 0 || rels.asChild.length > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa thành viên</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa <strong>{person?.display_name}</strong>?
            {hasRelationships && (
              <span className="mt-2 block rounded-md bg-destructive/10 p-2 text-destructive">
                Người này đang có quan hệ gia phả. Xóa có thể ảnh hưởng đến các quan hệ cha/mẹ/vợ
                chồng/con.
              </span>
            )}
            <span className="mt-2 block text-xs">Hành động này không thể hoàn tác.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deletePerson.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}