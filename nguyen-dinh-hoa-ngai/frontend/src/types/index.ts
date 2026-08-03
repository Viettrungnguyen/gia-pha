/**
 * @project NguyenDinhHoaNgai
 * @file src/types/index.ts
 * @description Shared types
 * @version 1.1.0
 * @updated 2026-07-24
 */

export interface Person {
  id: string;
  handle: string;
  display_name: string;
  first_name: string | null;
  middle_name: string | null;
  surname: string;
  gender: 1 | 2 | null;
  generation: number;
  chi: number | null;
  birth_date: string | null;
  birth_year: number | null;
  birth_place: string | null;
  death_date: string | null;
  death_year: number | null;
  death_place: string | null;
  death_lunar: string | null;
  is_living: boolean;
  is_patrilineal: boolean;
  phone: string | null;
  email: string | null;
  zalo: string | null;
  facebook: string | null;
  address: string | null;
  hometown: string | null;
  occupation: string | null;
  biography: string | null;
  notes: string | null;
  avatar_url: string | null;
  privacy_level: 0 | 1 | 2;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  father_id: string | null;
  mother_id: string | null;
  marriage_date: string | null;
  marriage_place: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  family_id: string;
  person_id: string;
  sort_order: number;
  created_at: string;
}

export type EventType = 'gio' | 'hop_ho' | 'le_tet' | 'other';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  event_date: string | null;
  event_lunar: string | null;
  person_id: string | null;
  location: string | null;
  recurring: boolean;
  created_at: string;
}

export type DocumentCategory =
  | 'anh_lich_su'
  | 'giay_to'
  | 'ban_do'
  | 'video'
  | 'bai_viet'
  | 'khac';

export interface ClanDocument {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category: DocumentCategory;
  tags: string | null;
  person_id: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin';
  created_at: string;
  updated_at: string;
}
