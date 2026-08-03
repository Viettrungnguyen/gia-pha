/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase-data-documents.ts
 * @description Documents data layer (CRUD + Storage)
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ClanDocument, DocumentCategory } from '@/types';

export interface DocumentFilter {
  category?: DocumentCategory;
  search?: string;
  personId?: string;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/webm',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const ALLOWED_DOCUMENT_TYPES = ALLOWED_MIME_TYPES;
export const MAX_DOCUMENT_SIZE = MAX_FILE_SIZE;

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File quá lớn (tối đa 50MB). File của bạn: ${(file.size / 1024 / 1024).toFixed(1)}MB`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Định dạng không hỗ trợ: ${file.type || 'không xác định'}`;
  }
  return null;
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100);
}

export function extractStoragePath(fileUrl: string, bucket: string): string | null {
  const marker = `/${bucket}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx < 0) return null;
  const tail = fileUrl.slice(idx + marker.length);
  return tail.split('?')[0] || null;
}

export async function getDocuments(filter: DocumentFilter = {}): Promise<ClanDocument[]> {
  const supabase = getSupabaseBrowserClient();
  let query = supabase.from('clan_documents').select('*').order('created_at', { ascending: false });

  if (filter.category) query = query.eq('category', filter.category);
  if (filter.personId) query = query.eq('person_id', filter.personId);
  if (filter.search) {
    const escaped = filter.search.replace(/[%_\\]/g, '\\$&');
    query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%,tags.ilike.%${escaped}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getDocument(id: string): Promise<ClanDocument | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from('clan_documents').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export type CreateDocumentInput = Omit<
  ClanDocument,
  'id' | 'created_at' | 'updated_at' | 'uploaded_by' | 'file_url' | 'file_type' | 'file_size'
>;
export type UpdateDocumentInput = Partial<CreateDocumentInput>;

export async function uploadDocumentFile(file: File): Promise<string> {
  const validation = validateFile(file);
  if (validation) throw new Error(validation);

  const supabase = getSupabaseBrowserClient();
  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage
    .from('clan-documents')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('clan-documents')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function createDocument(
  input: CreateDocumentInput,
  file: File,
  userId: string
): Promise<ClanDocument> {
  const supabase = getSupabaseBrowserClient();
  const fileUrl = await uploadDocumentFile(file);
  const fileName = extractStoragePath(fileUrl, 'clan-documents');

  const { data, error } = await supabase
    .from('clan_documents')
    .insert({
      ...input,
      file_url: fileUrl,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (fileName) await supabase.storage.from('clan-documents').remove([fileName]);
    throw error;
  }
  return data;
}

export async function updateDocument(
  id: string,
  input: UpdateDocumentInput,
  newFile?: File
): Promise<ClanDocument> {
  const supabase = getSupabaseBrowserClient();
  let fileUrl: string | undefined;
  let fileType: string | undefined;
  let fileSize: number | undefined;

  if (newFile) {
    fileUrl = await uploadDocumentFile(newFile);
    fileType = newFile.type;
    fileSize = newFile.size;
  }

  const updateData: Record<string, unknown> = { ...input };
  if (fileUrl) {
    updateData.file_url = fileUrl;
    updateData.file_type = fileType;
    updateData.file_size = fileSize;
  }

  const { data, error } = await supabase
    .from('clan_documents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (fileUrl) {
      const newPath = extractStoragePath(fileUrl, 'clan-documents');
      if (newPath) await supabase.storage.from('clan-documents').remove([newPath]);
    }
    throw error;
  }

  if (fileUrl) {
    const { data: prev } = await supabase
      .from('clan_documents')
      .select('file_url')
      .eq('id', id)
      .single();
    if (prev?.file_url && prev.file_url !== fileUrl) {
      const oldPath = extractStoragePath(prev.file_url, 'clan-documents');
      if (oldPath) await supabase.storage.from('clan-documents').remove([oldPath]);
    }
  }

  return data;
}

export async function deleteDocumentFile(fileUrl: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const fileName = extractStoragePath(fileUrl, 'clan-documents');
  if (!fileName) return;
  await supabase.storage.from('clan-documents').remove([fileName]);
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data: doc } = await supabase
    .from('clan_documents')
    .select('file_url')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('clan_documents').delete().eq('id', id);
  if (error) throw error;

  if (doc?.file_url) {
    await deleteDocumentFile(doc.file_url);
  }
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function getFileExtension(fileType: string | null | undefined, fileUrl?: string): string {
  if (fileType) {
    const parts = fileType.split('/');
    return parts[parts.length - 1].toUpperCase().slice(0, 8);
  }
  if (fileUrl) {
    const url = fileUrl.split('?')[0];
    const dot = url.lastIndexOf('.');
    if (dot >= 0 && url.length - dot <= 6) {
      return url.slice(dot + 1).toUpperCase();
    }
  }
  return 'FILE';
}