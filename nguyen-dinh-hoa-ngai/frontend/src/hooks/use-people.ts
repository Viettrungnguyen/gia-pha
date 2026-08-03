/**
 * @project NguyenDinhHoaNgai
 * @file src/hooks/use-people.ts
 * @description People React Query hooks
 * @version 1.1.0
 * @updated 2026-07-24
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/auth-provider';
import {
  getPeople,
  getPerson,
  searchPeople,
  createPerson,
  updatePerson,
  deletePerson,
  type CreatePersonInput,
  type UpdatePersonInput,
} from '@/lib/supabase-data-people';
import type { Person } from '@/types';

export function usePeople() {
  const { user, isLoading } = useAuth();
  return useQuery<Person[]>({
    queryKey: ['people', user?.id ?? 'public'],
    queryFn: getPeople,
    enabled: !isLoading,
  });
}

export function usePerson(id: string | undefined) {
  return useQuery<Person | null>({
    queryKey: ['person', id],
    queryFn: () => getPerson(id!),
    enabled: !!id,
  });
}

export function useSearchPeople(query: string) {
  return useQuery<Person[]>({
    queryKey: ['search-people', query],
    queryFn: () => searchPeople(query),
    enabled: query.length >= 2,
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPerson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['tree-data'] });
    },
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePersonInput }) =>
      updatePerson(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['tree-data'] });
    },
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePerson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['people'] });
      qc.invalidateQueries({ queryKey: ['tree-data'] });
      qc.invalidateQueries({ queryKey: ['families'] });
    },
  });
}
