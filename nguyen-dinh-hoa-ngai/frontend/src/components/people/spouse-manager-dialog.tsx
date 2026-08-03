/**
 * @project NguyenDinhHoaNgai
 * @file src/components/people/spouse-manager-dialog.tsx
 * @description Manage multiple spouse relationships for a person
 * @version 1.0.0
 * @updated 2026-07-24
 */

'use client';

import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ParentCombobox } from '@/components/people/parent-combobox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useCreateFamily, useDeleteFamily, useTreeData } from '@/hooks/use-families';
import type { Family, Person } from '@/types';

interface Props {
  person: Person | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SpouseRelationship {
  family: Family;
  spouse: Person | null;
  childCount: number;
}

export function SpouseManagerDialog({ person, open, onOpenChange }: Props) {
  const { data, isLoading } = useTreeData();
  const createFamily = useCreateFamily();
  const deleteFamily = useDeleteFamily();
  const [spouseId, setSpouseId] = useState('');
  const [spouseName, setSpouseName] = useState('');

  const relationships = useMemo<SpouseRelationship[]>(() => {
    if (!person || !data) return [];
    const peopleById = new Map(data.people.map((item) => [item.id, item]));

    return data.families
      .filter((family) => family.father_id === person.id || family.mother_id === person.id)
      .map((family) => {
        const otherId = family.father_id === person.id ? family.mother_id : family.father_id;
        return {
          family,
          spouse: otherId ? peopleById.get(otherId) ?? null : null,
          childCount: data.children.filter((child) => child.family_id === family.id).length,
        };
      })
      .sort((first, second) => first.family.sort_order - second.family.sort_order);
  }, [data, person]);

  const handleAdd = async () => {
    if (!person || !spouseId) return;
    if (spouseId === person.id) {
      toast.error('Không thể tạo quan hệ vợ chồng với chính thành viên này');
      return;
    }
    if (relationships.some((relationship) => relationship.spouse?.id === spouseId)) {
      toast.error('Quan hệ vợ chồng này đã tồn tại');
      return;
    }

    const selectedSpouse = data?.people.find((item) => item.id === spouseId);
    if (!selectedSpouse) return;
    if (person.gender && selectedSpouse.gender && person.gender === selectedSpouse.gender) {
      toast.error('Vui lòng chọn thành viên có giới tính phù hợp với vai trò vợ/chồng');
      return;
    }

    const man = person.gender === 1 ? person : selectedSpouse;
    const woman = person.gender === 2 ? person : selectedSpouse;
    if (man.gender !== 1 || woman.gender !== 2) {
      toast.error('Cần xác định giới tính Nam/Nữ trước khi tạo quan hệ');
      return;
    }

    try {
      await createFamily.mutateAsync({
        father_id: man.id,
        mother_id: woman.id,
      });
      setSpouseId('');
      setSpouseName('');
      toast.success(`Đã thêm quan hệ với ${selectedSpouse.display_name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể thêm quan hệ vợ chồng');
    }
  };

  const handleDelete = async (relationship: SpouseRelationship) => {
    if (relationship.childCount > 0) return;
    try {
      await deleteFamily.mutateAsync(relationship.family.id);
      toast.success('Đã xóa quan hệ vợ chồng');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa quan hệ vợ chồng');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Quản lý vợ/chồng</DialogTitle>
          <DialogDescription>
            {person ? `Các quan hệ hôn nhân của ${person.display_name}` : ''}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-3">
              <Label>Thêm vợ/chồng</Label>
              <ParentCombobox
                selectedId={spouseId || undefined}
                selectedName={spouseName}
                onSelect={(id, name) => {
                  setSpouseId(id);
                  setSpouseName(name);
                }}
                placeholder="Tìm thành viên để ghép đôi..."
              />
              <Button type="button" onClick={handleAdd} disabled={!spouseId || createFamily.isPending}>
                {createFamily.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Thêm quan hệ
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold">
                Danh sách vợ/chồng ({relationships.length})
              </h3>
              {relationships.length === 0 ? (
                <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                  <Users className="mx-auto mb-2 h-6 w-6" />
                  Chưa có quan hệ vợ/chồng.
                </div>
              ) : (
                <div className="space-y-2">
                  {relationships.map((relationship, index) => (
                    <div
                      key={relationship.family.id}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {index + 1}. {relationship.spouse?.display_name ?? 'Chưa rõ thông tin'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {relationship.childCount} người con trong gia đình này
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={relationship.childCount > 0 || deleteFamily.isPending}
                        onClick={() => handleDelete(relationship)}
                        aria-label={`Xóa quan hệ với ${relationship.spouse?.display_name ?? 'người này'}`}
                        title={
                          relationship.childCount > 0
                            ? 'Cần chuyển hoặc xóa quan hệ con trước'
                            : 'Xóa quan hệ vợ chồng'
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {relationships.some((relationship) => relationship.childCount > 0) && (
              <Alert>
                <AlertDescription>
                  Không thể xóa một quan hệ đang có con để tránh mất liên kết cha mẹ. Dữ liệu con
                  vẫn được tách riêng theo từng người vợ/chồng trên cây gia phả.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
