/**
 * @project NguyenDinhHoaNgai
 * @file src/components/people/spouse-manager-dialog.tsx
 * @description Manage multiple spouse relationships for a person.
 *              - Thêm vợ/chồng mới kèm ô nhập số thứ tự (1..N).
 *              - Sửa thứ tự trực tiếp bằng ô input thay cho nút lên/xuống.
 * @version 1.1.0
 * @updated 2026-09-05
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreateFamily,
  useDeleteFamily,
  useSwapFamilySortOrder,
  useTreeData,
  useUpdateFamilySortOrder,
} from '@/hooks/use-families';
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

function getSpouseBaseLabel(person: Person | null): string {
  if (!person) return 'Quan hệ';
  if (person.gender === 1) return 'Vợ';
  if (person.gender === 2) return 'Chồng';
  return 'Quan hệ';
}

export function SpouseManagerDialog({ person, open, onOpenChange }: Props) {
  const { data, isLoading } = useTreeData();
  const createFamily = useCreateFamily();
  const deleteFamily = useDeleteFamily();
  const updateFamilySortOrder = useUpdateFamilySortOrder();
  // Hook còn giữ để dùng ở nơi khác; trong dialog này đã bỏ nút lên/xuống.
  useSwapFamilySortOrder();

  const [spouseId, setSpouseId] = useState('');
  const [spouseName, setSpouseName] = useState('');
  // Thứ tự vợ/chồng mới: mặc định = số hiện tại + 1.
  const [newSortOrder, setNewSortOrder] = useState<string>('');

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

  const baseLabel = getSpouseBaseLabel(person);

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

    // Mặc định thứ tự = relationships.length + 1 nếu người dùng không nhập.
    const parsedOrder = newSortOrder.trim() === '' ? null : Number.parseInt(newSortOrder, 10);
    let sortOrder: number;
    if (parsedOrder === null || Number.isNaN(parsedOrder)) {
      const maxOrder = relationships.reduce(
        (acc, relationship) => Math.max(acc, relationship.family.sort_order),
        0,
      );
      sortOrder = maxOrder + 1;
    } else {
      if (parsedOrder < 1) {
        toast.error('Thứ tự vợ/chồng phải là số nguyên dương (bắt đầu từ 1)');
        return;
      }
      sortOrder = parsedOrder;
      if (relationships.some((relationship) => relationship.family.sort_order === sortOrder)) {
        toast.warning(
          `Đã có quan hệ ở vị trí ${sortOrder}. Khi hiển thị cây các quan hệ cùng số sẽ được phụ thuộc thêm ngày tạo.`,
        );
      }
    }

    try {
      await createFamily.mutateAsync({
        father_id: man.id,
        mother_id: woman.id,
        sort_order: sortOrder,
      });
      setSpouseId('');
      setSpouseName('');
      setNewSortOrder('');
      toast.success(`Đã thêm quan hệ với ${selectedSpouse.display_name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể thêm quan hệ vợ/chồng');
    }
  };

  const handleDelete = async (relationship: SpouseRelationship) => {
    if (relationship.childCount > 0) return;
    try {
      await deleteFamily.mutateAsync(relationship.family.id);
      toast.success('Đã xóa quan hệ vợ/chồng');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa quan hệ vợ/chồng');
    }
  };

  // Cập nhật trực tiếp sort_order từ ô input. Tránh gọi nhiều lần liên tục
  // bằng cách chỉ ghi khi giá trị thay đổi so với DB.
  const handleSortOrderChange = async (relationship: SpouseRelationship, raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      toast.error('Thứ tự phải là số nguyên dương');
      return;
    }
    if (parsed === relationship.family.sort_order) return;
    try {
      await updateFamilySortOrder.mutateAsync({
        familyId: relationship.family.id,
        sortOrder: parsed,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật thứ tự');
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
              <div className="grid grid-cols-[1fr_120px] gap-2">
                <ParentCombobox
                  selectedId={spouseId || undefined}
                  selectedName={spouseName}
                  onSelect={(id, name) => {
                    setSpouseId(id);
                    setSpouseName(name);
                  }}
                  placeholder="Tìm thành viên để ghép đôi..."
                />
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={newSortOrder}
                  onChange={(event) => setNewSortOrder(event.target.value)}
                  placeholder={`${relationships.length + 1}`}
                  aria-label="Thứ tự vợ/chồng"
                  title="Thứ tự hiển thị (1 = đầu tiên). Để trống sẽ tự đặt vào cuối."
                />
              </div>
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!spouseId || createFamily.isPending}
              >
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
                  {relationships.map((relationship) => {
                    const order = relationship.family.sort_order;
                    const label =
                      relationships.length === 1 ? baseLabel : `${baseLabel} ${order}`;
                    return (
                      <div
                        key={relationship.family.id}
                        className="flex items-center gap-3 rounded-md border p-3"
                      >
                        <div className="flex shrink-0 flex-col items-center gap-1">
                          <Label
                            htmlFor={`sort-${relationship.family.id}`}
                            className="text-xs text-muted-foreground"
                          >
                            STT
                          </Label>
                          <Input
                            id={`sort-${relationship.family.id}`}
                            type="number"
                            min={1}
                            inputMode="numeric"
                            defaultValue={order}
                            onBlur={(event) =>
                              handleSortOrderChange(relationship, event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.currentTarget.blur();
                              }
                            }}
                            disabled={updateFamilySortOrder.isPending}
                            className="h-9 w-16 text-center"
                            aria-label={`Thứ tự của ${relationship.spouse?.display_name ?? 'quan hệ'}`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {label}:{' '}
                            <span className="text-foreground">
                              {relationship.spouse?.display_name ?? 'Chưa rõ thông tin'}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {relationship.childCount} người con trong gia đình này
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={
                              relationship.childCount > 0 || deleteFamily.isPending
                            }
                            onClick={() => handleDelete(relationship)}
                            aria-label={`Xóa quan hệ với ${relationship.spouse?.display_name ?? 'người này'}`}
                            title={
                              relationship.childCount > 0
                                ? 'Cần chuyển hoặc xóa quan hệ con trước'
                                : 'Xóa quan hệ vợ/chồng'
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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
