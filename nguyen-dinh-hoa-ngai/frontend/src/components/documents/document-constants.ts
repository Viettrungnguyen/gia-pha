/**
 * @project NguyenDinhHoaNgai
 * @file src/components/documents/document-constants.ts
 * @description Document category options
 * @version 1.0.0
 * @updated 2026-07-23
 */

import type { DocumentCategory } from '@/types';

export const DOCUMENT_CATEGORY_OPTIONS: Array<{ value: DocumentCategory; label: string }> = [
  { value: 'anh_lich_su', label: 'Ảnh lịch sử' },
  { value: 'giay_to', label: 'Giấy tờ' },
  { value: 'ban_do', label: 'Bản đồ' },
  { value: 'video', label: 'Video' },
  { value: 'bai_viet', label: 'Bài viết' },
  { value: 'khac', label: 'Khác' },
];