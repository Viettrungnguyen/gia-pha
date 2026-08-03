/**
 * @project NguyenDinhHoaNgai
 * @file src/hooks/use-documents.ts
 * @description Documents React Query hooks
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  type DocumentFilter,
  type CreateDocumentInput,
  type UpdateDocumentInput,
} from '@/lib/supabase-data-documents';
import type { ClanDocument } from '@/types';

export function useDocuments(filter: DocumentFilter = {}) {
  return useQuery<ClanDocument[]>({
    queryKey: ['documents', filter],
    queryFn: () => getDocuments(filter),
  });
}

export function useDocument(id: string | undefined) {
  return useQuery<ClanDocument | null>({
    queryKey: ['document', id],
    queryFn: () => getDocument(id!),
    enabled: !!id,
  });
}

export type CreateDocumentVariables = {
  input: CreateDocumentInput;
  file: File;
  userId: string;
};

export type UpdateDocumentVariables = {
  id: string;
  input: UpdateDocumentInput;
  newFile?: File;
};

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation<ClanDocument, Error, CreateDocumentVariables>({
    mutationFn: ({ input, file, userId }) => createDocument(input, file, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation<ClanDocument, Error, UpdateDocumentVariables>({
    mutationFn: ({ id, input, newFile }) => updateDocument(id, input, newFile),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}