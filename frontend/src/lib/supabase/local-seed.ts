/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase/local-seed.ts
 * @description Demo dataset: 4 generations with a multi-spouse family case
 * @version 2.2.0
 * @updated 2026-07-24
 */

import type { Person, Family, Child, Event, ClanDocument } from '@/types';

const T = '2026-01-01T00:00:00.000Z';

const personDefaults: Omit<Person, 'id' | 'created_at' | 'updated_at'> = {
  handle: '', display_name: '', first_name: null, middle_name: null, surname: '',
  gender: null, generation: 1, chi: null, tree_label: null,
  birth_date: null, birth_year: null, birth_place: null,
  death_date: null, death_year: null, death_place: null, death_lunar: null,
  is_living: true, is_patrilineal: true,
  phone: null, email: null, zalo: null, facebook: null, address: null, hometown: null, occupation: null,
  biography: null, notes: null, avatar_url: null, privacy_level: 0,
};

const mkP = (id: string, data: Partial<Omit<Person, 'id' | 'created_at' | 'updated_at'>>): Person => ({
  ...personDefaults,
  ...data,
  id,
  created_at: T,
  updated_at: T,
});

const mkF = (id: string, data: Partial<Omit<Family, 'id' | 'created_at' | 'updated_at'>>): Family => ({
  notes: null, sort_order: 0,
  father_id: null, mother_id: null, marriage_date: null, marriage_place: null,
  ...data,
  id,
  created_at: T,
  updated_at: T,
});

const mkC = (id: string, familyId: string, personId: string, sortOrder: number): Child => ({
  id, family_id: familyId, person_id: personId, sort_order: sortOrder, created_at: T,
});

const mkE = (id: string, data: Partial<Omit<Event, 'id' | 'created_at'>>): Event => ({
  title: '', description: null, event_date: null, event_lunar: null, person_id: null, location: null,
  event_type: 'other', recurring: false,
  ...data,
  id,
  created_at: T,
});

const mkD = (id: string, data: Partial<Omit<ClanDocument, 'id' | 'created_at' | 'updated_at'>>): ClanDocument => ({
  title: '', description: null, file_url: '', file_type: null, file_size: null, tags: null, person_id: null, uploaded_by: 'local-admin',
  category: 'khac',
  ...data,
  id,
  created_at: T,
  updated_at: T,
});

// ═══════════════════════════════════════════════════════════════════════════
// MÔ HÌNH 4 ĐỜI × 3 CON / ĐỜI
//
// Đời 1: Thủy tổ + Bà (1 cặp)
//   ├── Đời 2: 3 người con (1 nam, 1 nữ, 1 nam)
//   │     └── Đời 3: người con đầu có 3 con (1 nam, 1 nữ, 1 nam)
//   │           └── Đời 4: người con đầu đời 3 có 3 con (1 nam, 1 nữ, 1 nam)
//
// Tổng: 2 + 3 + 3 + 3 = 11 người, 3 family, 9 children
// ═══════════════════════════════════════════════════════════════════════════

// Đời 1
const p1a = mkP('p_g1_father', { handle: 'G1F', display_name: 'Nguyễn Đình Tổ', first_name: 'Tổ', surname: 'Nguyễn Đình', gender: 1, generation: 1, tree_label: 'Thủy tổ', birth_year: 1920, death_year: 1995, death_lunar: '15/7', is_living: false, is_patrilineal: true, occupation: 'Nông dân', hometown: 'Làng Hòa Ngãi, Thanh Liêm, Hà Nam', biography: 'Thủy tổ dòng họ Nguyễn Đình làng Hòa Ngãi.' });
const p1b = mkP('p_g1_mother', { handle: 'G1M', display_name: 'Nguyễn Thị Bà', first_name: 'Bà', middle_name: 'Thị', surname: 'Nguyễn', gender: 2, generation: 1, tree_label: 'Tổ mẫu', birth_year: 1925, death_year: 2000, death_lunar: '20/3', is_living: false, is_patrilineal: false, occupation: 'Nội trợ', hometown: 'Làng Hòa Ngãi' });

// Đời 2 — 3 con của đời 1
const p2a = mkP('p_g2_a', { handle: 'G2A', display_name: 'Nguyễn Đình Hùng', first_name: 'Hùng', surname: 'Nguyễn Đình', gender: 1, generation: 2, chi: 1, tree_label: 'Trưởng nam chi 1', birth_year: 1948, is_living: true, is_patrilineal: true, occupation: 'Bác sĩ', hometown: 'Hà Nội', phone: '0912345678' });
const p2b = mkP('p_g2_b', { handle: 'G2B', display_name: 'Nguyễn Thị Lan', first_name: 'Lan', middle_name: 'Thị', surname: 'Nguyễn', gender: 2, generation: 2, chi: 1, tree_label: 'Tổ cô', birth_year: 1952, is_living: true, is_patrilineal: true, occupation: 'Giáo viên', hometown: 'Hà Nội' });
const p2c = mkP('p_g2_c', { handle: 'G2C', display_name: 'Nguyễn Đình Mạnh', first_name: 'Mạnh', surname: 'Nguyễn Đình', gender: 1, generation: 2, chi: 1, birth_year: 1955, is_living: true, is_patrilineal: true, occupation: 'Kỹ sư', hometown: 'TP HCM', phone: '0938765432' });
// Vợ/chồng của 3 người đời 2 (lấy vợ/chồng ngoài họ)
const p2d = mkP('p_g2_a_spouse', { handle: 'G2AS', display_name: 'Trần Thị Mai', first_name: 'Mai', middle_name: 'Thị', surname: 'Trần', gender: 2, generation: 2, birth_year: 1950, is_living: true, is_patrilineal: false, occupation: 'Kế toán', hometown: 'Ninh Bình' });
const p2g = mkP('p_g2_a_spouse_2', { handle: 'G2AS2', display_name: 'Lê Thị Thu', first_name: 'Thu', middle_name: 'Thị', surname: 'Lê', gender: 2, generation: 2, birth_year: 1956, is_living: true, is_patrilineal: false, occupation: 'Giáo viên', hometown: 'Hà Nam' });
const p2e = mkP('p_g2_b_spouse', { handle: 'G2BS', display_name: 'Lê Văn Bình', first_name: 'Bình', middle_name: 'Văn', surname: 'Lê', gender: 1, generation: 2, birth_year: 1950, is_living: true, is_patrilineal: false, occupation: 'Bác sĩ', hometown: 'Hải Phòng' });
const p2f = mkP('p_g2_c_spouse', { handle: 'G2CS', display_name: 'Phạm Thị Hoa', first_name: 'Hoa', middle_name: 'Thị', surname: 'Phạm', gender: 2, generation: 2, birth_year: 1958, is_living: true, is_patrilineal: false, occupation: 'Giáo viên', hometown: 'Thanh Hóa' });

// Đời 3 — 3 con của p2a (Hùng + Mai)
const p3a = mkP('p_g3_a', { handle: 'G3A', display_name: 'Nguyễn Đình Tuấn', first_name: 'Tuấn', surname: 'Nguyễn Đình', gender: 1, generation: 3, chi: 1, tree_label: 'Trưởng nam', birth_year: 1975, is_living: true, is_patrilineal: true, occupation: 'Lập trình viên', hometown: 'Hà Nội', email: 'tuan@example.vn', phone: '0981234567' });
const p3b = mkP('p_g3_b', { handle: 'G3B', display_name: 'Nguyễn Thị Hương', first_name: 'Hương', middle_name: 'Thị', surname: 'Nguyễn', gender: 2, generation: 3, chi: 1, birth_year: 1978, is_living: true, is_patrilineal: true, occupation: 'Bác sĩ', hometown: 'Hà Nội' });
const p3c = mkP('p_g3_c', { handle: 'G3C', display_name: 'Nguyễn Đình Hòa', first_name: 'Hòa', surname: 'Nguyễn Đình', gender: 1, generation: 3, chi: 1, tree_label: 'Thứ nam', birth_year: 1982, is_living: true, is_patrilineal: true, occupation: 'Kỹ sư xây dựng', hometown: 'Đà Nẵng', phone: '0976543210' });
const p3d = mkP('p_g3_a_spouse', { handle: 'G3AS', display_name: 'Hoàng Thị Linh', first_name: 'Linh', middle_name: 'Thị', surname: 'Hoàng', gender: 2, generation: 3, birth_year: 1978, is_living: true, is_patrilineal: false, occupation: 'Kế toán', hometown: 'Hà Nội' });

// Đời 4 — 3 con của p3a (Tuấn + Linh)
const p4a = mkP('p_g4_a', { handle: 'G4A', display_name: 'Nguyễn Đình An', first_name: 'An', surname: 'Nguyễn Đình', gender: 1, generation: 4, chi: 1, tree_label: 'Trưởng nam', birth_year: 2005, is_living: true, is_patrilineal: true, occupation: 'Sinh viên', hometown: 'Hà Nội' });
const p4b = mkP('p_g4_b', { handle: 'G4B', display_name: 'Nguyễn Thị Bình', first_name: 'Bình', middle_name: 'Thị', surname: 'Nguyễn', gender: 2, generation: 4, chi: 1, birth_year: 2008, is_living: true, is_patrilineal: true, occupation: 'Học sinh', hometown: 'Hà Nội' });
const p4c = mkP('p_g4_c', { handle: 'G4C', display_name: 'Nguyễn Đình Khôi', first_name: 'Khôi', surname: 'Nguyễn Đình', gender: 1, generation: 4, chi: 1, birth_year: 2012, is_living: true, is_patrilineal: true, occupation: 'Học sinh', hometown: 'Hà Nội' });

export const PEOPLE_SEED: Person[] = [
  // Đời 1
  p1a, p1b,
  // Đời 2
  p2a, p2b, p2c, p2d, p2g, p2e, p2f,
  // Đời 3
  p3a, p3b, p3c, p3d,
  // Đời 4
  p4a, p4b, p4c,
];

// FAMILIES: p2a có hai vợ, mỗi quan hệ là một family độc lập
const f1 = mkF('f_g1', { father_id: p1a.id, mother_id: p1b.id, marriage_date: '1945-02-10', marriage_place: 'Làng Hòa Ngãi' });
const f2a = mkF('f_g2a', { father_id: p2a.id, mother_id: p2d.id, marriage_date: '1973-05-20', marriage_place: 'Hà Nội', sort_order: 1, notes: 'Vợ thứ nhất' });
const f2aSecond = mkF('f_g2a_second', { father_id: p2a.id, mother_id: p2g.id, marriage_date: '1990-03-18', marriage_place: 'Hà Nam', sort_order: 2, notes: 'Vợ thứ hai' });
const f2b = mkF('f_g2b', { father_id: p2e.id, mother_id: p2b.id, marriage_date: '1975-09-12', marriage_place: 'Hải Phòng' });
const f2c = mkF('f_g2c', { father_id: p2c.id, mother_id: p2f.id, marriage_date: '1980-11-08', marriage_place: 'Hà Nội' });
const f3a = mkF('f_g3a', { father_id: p3a.id, mother_id: p3d.id, marriage_date: '2003-10-25', marriage_place: 'Hà Nội' });

export const FAMILIES_SEED: Family[] = [f1, f2a, f2aSecond, f2b, f2c, f3a];

// CHILDREN
export const CHILDREN_SEED: Child[] = [
  // F1 (G1F+G1M) → 3 con đời 2
  mkC('c_f1_2a', f1.id, p2a.id, 1),
  mkC('c_f1_2b', f1.id, p2b.id, 2),
  mkC('c_f1_2c', f1.id, p2c.id, 3),
  // F2a (G2A+Mai) → 3 con đời 3
  mkC('c_f2a_3a', f2a.id, p3a.id, 1),
  mkC('c_f2a_3b', f2a.id, p3b.id, 2),
  mkC('c_f2a_3c', f2a.id, p3c.id, 3),
  // F2b (Bình+Lan) → không có con (giữ 1 family đơn giản)
  // F2c (Mạnh+Hoa) → không có con
  // F3a (G3A+Linh) → 3 con đời 4
  mkC('c_f3a_4a', f3a.id, p4a.id, 1),
  mkC('c_f3a_4b', f3a.id, p4b.id, 2),
  mkC('c_f3a_4c', f3a.id, p4c.id, 3),
];

// EVENTS — giỗ 2 vợ chồng thủy tổ + sự kiện cộng đồng
const deceased = PEOPLE_SEED.filter((p) => !p.is_living);
const gioEvents: Event[] = deceased
  .filter((p) => p.death_lunar)
  .map((p) =>
    mkE(`e_gio_${p.handle}`, {
      title: `Giỗ ${p.display_name}`,
      description: `Lễ giỗ ${p.display_name} (đời ${p.generation})`,
      event_type: 'gio',
      event_lunar: p.death_lunar!,
      person_id: p.id,
      recurring: true,
      location: 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi',
    })
  );

const fixedEvents: Event[] = [
  mkE('e_gio_to_nam_2024', { title: 'Giỗ Tổ năm 2024 (Giáp Thìn)', description: 'Lễ giỗ Tổ năm Giáp Thìn - đã tổ chức.', event_type: 'gio', event_date: '2024-08-19', recurring: false, location: 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi' }),
  mkE('e_gio_to_nam_2025', { title: 'Giỗ Tổ năm 2025 (Ất Tỵ)', description: 'Lễ giỗ Tổ năm Ất Tỵ - đã tổ chức.', event_type: 'gio', event_date: '2025-08-08', recurring: false, location: 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi' }),
  mkE('e_gio_to_nam_2026', { title: 'Giỗ Tổ năm 2026 (Bính Ngọ)', description: 'Lễ giỗ Tổ năm Bính Ngọ - dự kiến 15/7 âm lịch.', event_type: 'gio', event_date: '2026-08-27', recurring: false, location: 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi' }),
  mkE('e_hop_ho_dau_xuan_2026', { title: 'Họp họ đầu xuân 2026', description: 'Họp mặt đầu năm, tổng kết năm cũ.', event_type: 'hop_ho', event_date: '2026-02-15', recurring: true, location: 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi' }),
  mkE('e_tao_mo_2026', { title: 'Lễ tảo mộ 2026', description: 'Đi tảo mộ các thế hệ tiền bối.', event_type: 'le_tet', event_date: '2026-04-05', recurring: true, location: 'Nghĩa trang làng Hòa Ngãi' }),
];

export const EVENTS_SEED: Event[] = [...gioEvents, ...fixedEvents];

// DOCUMENTS
const svg = (label: string, sub: string, bg: string, fg: string) =>
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="${bg}"/><text x="400" y="240" font-family="serif" font-size="36" fill="${fg}" text-anchor="middle">${label}</text><text x="400" y="290" font-family="serif" font-size="20" fill="${fg}" text-anchor="middle">${sub}</text></svg>`
  );

export const DOCUMENTS_SEED: ClanDocument[] = [
  mkD('d_nha_tho_cu', { title: 'Ảnh nhà thờ họ cũ (1940)', description: 'Ảnh chụp nhà thờ họ Nguyễn Đình thời Pháp thuộc.', file_url: svg('Nhà thờ họ cũ - 1940', 'Làng Hòa Ngãi - Thanh Liêm - Hà Nam', '%238B4513', '%23FDE68A'), file_type: 'image/svg+xml', file_size: 524288, category: 'anh_lich_su', tags: 'nhà thờ, lịch sử, 1940' }),
  mkD('d_gia_pha_1920', { title: 'Gia phả sách giấy 1920', description: 'Bản gia phả giấy viết tay năm 1920.', file_url: svg('Gia Phả 1920', '(Bản demo - placeholder)', '%23F5F5DC', '%232F2F2F'), file_type: 'application/pdf', file_size: 1048576, category: 'giay_to', tags: 'gia phả, sách, 1920' }),
  mkD('d_ban_do_lang', { title: 'Bản đồ làng Hòa Ngãi', description: 'Bản đồ cổ làng Hòa Ngãi thế kỷ 19.', file_url: svg('Bản đồ Làng Hòa Ngãi', 'Thế kỷ 19', '%23DEB887', '%233B2F2F'), file_type: 'image/svg+xml', file_size: 786432, category: 'ban_do', tags: 'bản đồ, làng, lịch sử' }),
  mkD('d_huong_uoc_1932', { title: 'Hương ước dòng họ 1932', description: 'Bản hương ước quy định 13 điều.', file_url: svg('Hương ước 1932', '(Bản demo - placeholder)', '%23FFFAF0', '%232F2F2F'), file_type: 'application/pdf', file_size: 2097152, category: 'giay_to', tags: 'hương ước, 1932, nội quy' }),
];
