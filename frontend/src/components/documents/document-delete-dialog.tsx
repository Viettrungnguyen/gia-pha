/**
 * @project NguyenDinhHoaNgai
 * @file src/components/documents/document-delete-dialog.tsx
 * @description Document delete confirmation
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
              File trong Storage cũng sẽ bị xóa vĩnh viễn.
            </span>
            <span className="mt-2 block text-xs">Hành động này không thể hoàn tác.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteDocument.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}