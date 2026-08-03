/**
 * @project NguyenDinhHoaNgai
 * @file src/hooks/use-families.ts
 * @description Family tree React Query hooks
 * @version 1.1.0
 * @updated 2026-07-24
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/auth-provider';
import {
  getTreeData,
  createFamily,
  addChild,
  removeChild,
  deleteFamily,
  ensureFamilyAndAddChild,
  type TreeData,
  type CreateFamilyInput,
} from '@/lib/supabase-data-families';
import type { Family } from '@/types';

export function useTreeData() {
  const { user, isLoading } = useAuth();
  return useQuery<TreeData>({
    queryKey: ['tree-data', user?.id ?? 'public'],
    queryFn: getTreeData,
    enabled: !isLoading,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFamilyInput) => createFamily(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tree-data'] }),
  });
}

export function useEnsureFamilyAndAddChild() {
  const qc = useQueryClient();
  return useMutation<
    { family: Family; childId: string },
    Error,
    {
      fatherId: string | null;
      motherId: string | null;
      personId: string;
      sortOrder?: number;
    }
  >({
    mutationFn: ensureFamilyAndAddChild,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tree-data'] }),
  });
}

export function useAddChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      familyId,
      personId,
      sortOrder,
    }: {
      familyId: string;
      personId: string;
      sortOrder?: number;
    }) => addChild(familyId, personId, sortOrder),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tree-data'] }),
  });
}

export function useRemoveChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, personId }: { familyId: string; personId: string }) =>
      removeChild(familyId, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tree-data'] }),
  });
}

export function useDeleteFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFamily,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tree-data'] }),
  });
}
