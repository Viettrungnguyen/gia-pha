/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase/local-seed.ts
 * @description Demo dataset mở rộng: 5 đời, 3 chi, 50+ người với đầy đủ sự kiện và tài liệu
 * @version 3.0.0
 * @updated 2026-08-04
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
// CẤU TRÚC DÒNG HỌ - 5 ĐỜI × 3 CHI
//
// Đời 1 (Thủy tổ): Nguyễn Đình Hạo + vợ
//     ├── Chi 1: Trưởng - Nguyễn Đình Cảnh (2 vợ)
//     │     └── Đời 3: 4 người con
//     │           └── Đời 4: 5 người cháu
//     │                 └── Đời 5: 3 chắt
//     ├── Chi 2: Nguyễn Đình Thành
//     │     └── Đời 3: 3 người con
//     │           └── Đời 4: 4 người cháu
//     └── Chi 3: Nguyễn Đình Long
//           └── Đời 3: 2 người con
//                 └── Đời 4: 3 người cháu
//
// Tổng: ~50 người, 20+ family, 35+ children
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// ĐỜI 1 - THỦY TỔ
// ═══════════════════════════════════════════════════════════════════════════
const to_vo = mkP('p_d1_0', {
  handle: 'D1T', display_name: 'Nguyễn Đình Hạo', first_name: 'Hạo', surname: 'Nguyễn Đình',
  gender: 1, generation: 1, tree_label: 'Thủy tổ', birth_year: 1885, death_year: 1965,
  death_lunar: '10/8', is_living: false, is_patrilineal: true,
  occupation: 'Nông dân', hometown: 'Làng Hòa Ngãi, Thanh Liêm, Hà Nam',
  biography: 'Thủy tổ dòng họ Nguyễn Đình, làng Hòa Ngãi. Ông là người sáng lập và gây dựng cơ đồ cho dòng họ.'
});
const to_vo_wife = mkP('p_d1_1', {
  handle: 'D1V', display_name: 'Nguyễn Thị Sen', first_name: 'Sen', middle_name: 'Thị', surname: 'Nguyễn',
  gender: 2, generation: 1, tree_label: 'Tổ mẫu', birth_year: 1890, death_year: 1975,
  death_lunar: '15/2', is_living: false, is_patrilineal: false,
  occupation: 'Nội trợ', hometown: 'Làng Hòa Ngãi'
});

// ═══════════════════════════════════════════════════════════════════════════
// ĐỜI 2 - 3 NGƯỜI CON
// ═══════════════════════════════════════════════════════════════════════════
const d2_c1_cha = mkP('p_d2_1', {
  handle: 'D2C1', display_name: 'Nguyễn Đình Cảnh', first_name: 'Cảnh', surname: 'Nguyễn Đình',
  gender: 1, generation: 2, chi: 1, tree_label: 'Trưởng chi 1', birth_year: 1910, death_year: 1980,
  death_lunar: '20/6', is_living: false, is_patrilineal: true,
  occupation: 'Thầy giáo', hometown: 'Hà Nội', notes: 'Người có công lớn trong việc xây dựng nhà thờ họ'
});
const d2_c1_vo1 = mkP('p_d2_1v1', {
  handle: 'D2C1V1', display_name: 'Trần Thị Lan', first_name: 'Lan', middle_name: 'Thị', surname: 'Trần',
  gender: 2, generation: 2, birth_year: 1915, is_living: false, death_year: 1990,
  death_lunar: '5/10', is_patrilineal: false, occupation: 'Nội trợ'
});
const d2_c1_vo2 = mkP('p_d2_1v2', {
  handle: 'D2C1V2', display_name: 'Lê Thị Hương', first_name: 'Hương', middle_name: 'Thị', surname: 'Lê',
  gender: 2, generation: 2, birth_year: 1920, is_living: true, is_patrilineal: false, occupation: 'Nội trợ'
});

const d2_c2_cha = mkP('p_d2_2', {
  handle: 'D2C2', display_name: 'Nguyễn Đình Thành', first_name: 'Thành', surname: 'Nguyễn Đình',
  gender: 1, generation: 2, chi: 2, tree_label: 'Trưởng chi 2', birth_year: 1915, death_year: 1995,
  death_lunar: '12/9', is_living: false, is_patrilineal: true,
  occupation: 'Bác sĩ', hometown: 'Hải Phòng'
});
const d2_c2_vo = mkP('p_d2_2v', {
  handle: 'D2C2V', display_name: 'Phạm Thị Mai', first_name: 'Mai', middle_name: 'Thị', surname: 'Phạm',
  gender: 2, generation: 2, birth_year: 1918, is_living: false, death_year: 2000,
  death_lunar: '8/4', is_patrilineal: false, occupation: 'Giáo viên'
});

const d2_c3_cha = mkP('p_d2_3', {
  handle: 'D2C3', display_name: 'Nguyễn Đình Long', first_name: 'Long', surname: 'Nguyễn Đình',
  gender: 1, generation: 2, chi: 3, tree_label: 'Trưởng chi 3', birth_year: 1920, death_year: 2005,
  death_lunar: '25/3', is_living: false, is_patrilineal: true,
  occupation: 'Kỹ sư nông nghiệp', hometown: 'Nam Định'
});
const d2_c3_vo = mkP('p_d2_3v', {
  handle: 'D2C3V', display_name: 'Hoàng Thị Loan', first_name: 'Loan', middle_name: 'Thị', surname: 'Hoàng',
  gender: 2, generation: 2, birth_year: 1925, is_living: true, is_patrilineal: false, occupation: 'Nội trợ'
});

// ═══════════════════════════════════════════════════════════════════════════
// ĐỜI 3 - CON CỦA ĐỜI 2
// ═══════════════════════════════════════════════════════════════════════════

// --- CHI 1: Con ông Cảnh ---
const d3_c1_1 = mkP('p_d3_1a', {
  handle: 'D3C1A', display_name: 'Nguyễn Đình Hùng', first_name: 'Hùng', surname: 'Nguyễn Đình',
  gender: 1, generation: 3, chi: 1, tree_label: 'Trưởng nam chi 1', birth_year: 1940, is_living: true,
  is_patrilineal: true, occupation: 'Bác sĩ', hometown: 'Hà Nội', phone: '0912345001',
  email: 'hung.nd@email.vn', address: '123 Đường Giảng Võ, Ba Đình, Hà Nội'
});
const d3_c1_1_vo = mkP('p_d3_1av', {
  handle: 'D3C1AV', display_name: 'Đỗ Thị Hà', first_name: 'Hà', middle_name: 'Thị', surname: 'Đỗ',
  gender: 2, generation: 3, birth_year: 1942, is_living: true, is_patrilineal: false, occupation: 'Bác sĩ'
});
const d3_c1_2 = mkP('p_d3_1b', {
  handle: 'D3C1B', display_name: 'Nguyễn Thị Hương', first_name: 'Hương', middle_name: 'Thị', surname: 'Nguyễn',
  gender: 2, generation: 3, chi: 1, birth_year: 1943, is_living: true, is_patrilineal: true, occupation: 'Giáo viên'
});
const d3_c1_2_chong = mkP('p_d3_1bc', {
  handle: 'D3C1BC', display_name: 'Trần Văn Đức', first_name: 'Đức', surname: 'Trần',
  gender: 1, generation: 3, birth_year: 1940, is_living: true, is_patrilineal: false, occupation: 'Kỹ sư'
});
const d3_c1_3 = mkP('p_d3_1c', {
  handle: 'D3C1C', display_name: 'Nguyễn Đình Lâm', first_name: 'Lâm', surname: 'Nguyễn Đình',
  gender: 1, generation: 3, chi: 1, birth_year: 1948, is_living: true, is_patrilineal: true, occupation: 'Doanh nhân'
});
const d3_c1_3_vo = mkP('p_d3_1cv', {
  handle: 'D3C1CV', display_name: 'Ngô Thị Thanh', first_name: 'Thanh', middle_name: 'Thị', surname: 'Ngô',
  gender: 2, generation: 3, birth_year: 1950, is_living: true, is_patrilineal: false, occupation: 'Kế toán'
});
const d3_c1_4 = mkP('p_d3_1d', {
  handle: 'D3C1D', display_name: 'Nguyễn Đình Kiên', first_name: 'Kiên', surname: 'Nguyễn Đình',
  gender: 1, generation: 3, chi: 1, birth_year: 1952, is_living: true, is_patrilineal: true, occupation: 'Luật sư',
  hometown: 'Hà Nội', phone: '0912345004', email: 'kien.nd@email.vn'
});
const d3_c1_4_vo = mkP('p_d3_1dv', {
  handle: 'D3C1DV', display_name: 'Vũ Thị Minh', first_name: 'Minh', middle_name: 'Thị', surname: 'Vũ',
  gender: 2, generation: 3, birth_year: 1955, is_living: true, is_patrilineal: false, occupation: 'Giáo viên'
});

// --- CHI 2: Con ông Thành ---
const d3_c2_1 = mkP('p_d3_2a', {
  handle: 'D3C2A', display_name: 'Nguyễn Đình Phú', first_name: 'Phú', surname: 'Nguyễn Đình',
  gender: 1, generation: 3, chi: 2, tree_label: 'Trưởng nam chi 2', birth_year: 1942, death_year: 2020,
  death_lunar: '18/7', is_living: false, is_patrilineal: true, occupation: 'Giáo sư đại học'
});
const d3_c2_1_vo = mkP('p_d3_2av', {
  handle: 'D3C2AV', display_name: 'Bùi Thị Thu', first_name: 'Thu', middle_name: 'Thị', surname: 'Bùi',
  gender: 2, generation: 3, birth_year: 1945, is_living: true, is_patrilineal: false, occupation: 'Bác sĩ'
});
const d3_c2_2 = mkP('p_d3_2b', {
  handle: 'D3C2B', display_name: 'Nguyễn Thị Lan', first_name: 'Lan', middle_name: 'Thị', surname: 'Nguyễn',
  gender: 2, generation: 3, chi: 2, birth_year: 1945, is_living: true, is_patrilineal: true, occupation: 'Kỹ sư'
});
const d3_c2_2_chong = mkP('p_d3_2bc', {
  handle: 'D3C2BC', display_name: 'Lê Văn Minh', first_name: 'Minh', surname: 'Lê',
  gender: 1, generation: 3, birth_year: 1943, is_living: true, is_patrilineal: false, occupation: 'Kiến trúc sư'
});
const d3_c2_3 = mkP('p_d3_2c', {
  handle: 'D3C2C', display_name: 'Nguyễn Đình Quang', first_name: 'Quang', surname: 'Nguyễn Đình',
  gender: 1, generation: 3, chi: 2, birth_year: 1950, is_living: true, is_patrilineal: true, occupation: 'Kỹ sư IT'
});
const d3_c2_3_vo = mkP('p_d3_2cv', {
  handle: 'D3C2CV', display_name: 'Trịnh Thị Yến', first_name: 'Yến', middle_name: 'Thị', surname: 'Trịnh',
  gender: 2, generation: 3, birth_year: 1953, is_living: true, is_patrilineal: false, occupation: 'Y tá'
});

// --- CHI 3: Con ông Long ---
const d3_c3_1 = mkP('p_d3_3a', {
  handle: 'D3C3A', display_name: 'Nguyễn Đình Sơn', first_name: 'Sơn', surname: 'Nguyễn Đình',
  gender: 1, generation: 3, chi: 3, tree_label: 'Trưởng nam chi 3', birth_year: 1948, is_living: true,
  is_patrilineal: true, occupation: 'Bộ đội', hometown: 'Nam Định'
});
const d3_c3_1_vo = mkP('p_d3_3av', {
  handle: 'D3C3AV', display_name: 'Đinh Thị Hòa', first_name: 'Hòa', middle_name: 'Thị', surname: 'Đinh',
  gender: 2, generation: 3, birth_year: 1950, is_living: true, is_patrilineal: false, occupation: 'Công nhân'
});
const d3_c3_2 = mkP('p_d3_3b', {
  handle: 'D3C3B', display_name: 'Nguyễn Thị Thơm', first_name: 'Thơm', middle_name: 'Thị', surname: 'Nguyễn',
  gender: 2, generation: 3, chi: 3, birth_year: 1952, is_living: true, is_patrilineal: true, occupation: 'Nông dân'
});
const d3_c3_2_chong = mkP('p_d3_3bc', {
  handle: 'D3C3BC', display_name: 'Phạm Văn Toàn', first_name: 'Toàn', surname: 'Phạm',
  gender: 1, generation: 3, birth_year: 1950, is_living: true, is_patrilineal: false, occupation: 'Nông dân'
});

// ═══════════════════════════════════════════════════════════════════════════
// ĐỜI 4 - CHÁU
// ═══════════════════════════════════════════════════════════════════════════

// --- CHÁU CHI 1 ---
const d4_c1_1a = mkP('p_d4_1aa', {
  handle: 'D4C1AA', display_name: 'Nguyễn Đình Tuấn', first_name: 'Tuấn', surname: 'Nguyễn Đình',
  gender: 1, generation: 4, chi: 1, tree_label: 'Trưởng cháu', birth_year: 1970, is_living: true,
  is_patrilineal: true, occupation: 'Lập trình viên', hometown: 'Hà Nội',
  email: 'tuan.nd@email.vn', phone: '0981234001'
});
const d4_c1_1a_vo = mkP('p_d4_1aav', {
  handle: 'D4C1AAV', display_name: 'Hoàng Thị Linh', first_name: 'Linh', middle_name: 'Thị', surname: 'Hoàng',
  gender: 2, generation: 4, birth_year: 1972, is_living: true, is_patrilineal: false, occupation: 'Kế toán'
});
const d4_c1_1b = mkP('p_d4_1ab', {
  handle: 'D4C1AB', display_name: 'Nguyễn Thị Hạnh', first_name: 'Hạnh', middle_name: 'Thị', surname: 'Nguyễn',
  gender: 2, generation: 4, chi: 1, birth_year: 1973, is_living: true, is_patrilineal: true, occupation: 'Bác sĩ'
});
const d4_c1_1b_chong = mkP('p_d4_1abc', {
  handle: 'D4C1ABC', display_name: 'Đặng Văn Hùng', first_name: 'Hùng', surname: 'Đặng',
  gender: 1, generation: 4, birth_year: 1970, is_living: true, is_patrilineal: false, occupation: 'Kỹ sư'
});
const d4_c1_1c = mkP('p_d4_1ac', {
  handle: 'D4C1AC', display_name: 'Nguyễn Đình Phong', first_name: 'Phong', surname: 'Nguyễn Đình',
  gender: 1, generation: 4, chi: 1, birth_year: 1976, is_living: true, is_patrilineal: true, occupation: 'Doanh nhân'
});
const d4_c1_1c_vo = mkP('p_d4_1acv', {
  handle: 'D4C1ACV', display_name: 'Trần Thị Phương', first_name: 'Phương', middle_name: 'Thị', surname: 'Trần',
  gender: 2, generation: 4, birth_year: 1978, is_living: true, is_patrilineal: false, occupation: 'Giáo viên'
});
const d4_c1_2a = mkP('p_d4_1ba', {
  handle: 'D4C1BA', display_name: 'Nguyễn Đình Bảo', first_name: 'Bảo', surname: 'Nguyễn Đình',
  gender: 1, generation: 4, chi: 1, birth_year: 1975, is_living: true, is_patrilineal: true, occupation: 'Luật sư'
});
const d4_c1_2a_vo = mkP('p_d4_1bav', {
  handle: 'D4C1BAV', display_name: 'Lê Thị Ngọc', first_name: 'Ngọc', middle_name: 'Thị', surname: 'Lê',
  gender: 2, generation: 4, birth_year: 1977, is_living: true, is_patrilineal: false, occupation: 'Y tá'
});
const d4_c1_2b = mkP('p_d4_1bb', {
  handle: 'D4C1BB', display_name: 'Nguyễn Thị Uyên', first_name: 'Uyên', middle_name: 'Thị', surname: 'Nguyễn',
  gender: 2, generation: 4, chi: 1, birth_year: 1978, is_living: true, is_patrilineal: true, occupation: 'Nhân viên văn phòng'
});
const d4_c1_3a = mkP('p_d4_1ca', {
  handle: 'D4C1CA', display_name: 'Nguyễn Đình Nam', first_name: 'Nam', surname: 'Nguyễn Đình',
  gender: 1, generation: 4, chi: 1, birth_year: 1980, is_living: true, is_patrilineal: true, occupation: 'Kỹ sư xây dựng'
});
const d4_c1_3a_vo = mkP('p_d4_1cav', {
  handle: 'D4C1CAV', display_name: 'Phạm Thị Yến', first_name: 'Yến', middle_name: 'Thị', surname: 'Phạm',
  gender: 2, generation: 4, birth_year: 1982, is_living: true, is_patrilineal: false, occupation: 'Kế toán'
});
const d4_c1_3b = mkP('p_d4_1cb', {
  handle: 'D4C1CB', display_name: 'Nguyễn Đình Khoa', first_name: 'Khoa', surname: 'Nguyễn Đình',
  gender: 1, generation: 4, chi: 1, birth_year: 1985, is_living: true, is_patrilineal: true, occupation: 'Bác sĩ'
});
const d4_c1_4a = mkP('p_d4_1da', {
  handle: 'D4C1DA', display_name: 'Nguyễn Đình Hưng', first_name: 'Hưng', surname: 'Nguyễn Đình',
  gender: 1, generation: 4, chi: 1, birth_year: 1982, is_living: true, is_patrilineal: true, occupation: 'Giáo viên'
});

// --- CHÁU CHI 2 ---
const d4_c2_1a = mkP('p_d4_2aa', {
  handle: 'D4C2AA', display_name: 'Nguyễn Đình Minh', first_name: 'Minh', surname: 'Nguyễn Đình',
  gender: 1, generation: 4, chi: 2, birth_year: 1972, is_living: true, is_patrilineal: true, occupation: 'Giáo sư'
});
const d4_c2_1a_vo = mkP('p_d4_2aav', {
  handle: 'D4C2AAV', display_name: 'Đỗ Thị Lan', first_name: 'Lan', middle_name: 'Thị', surname: 'Đỗ',
  gender: 2, generation: 4, birth_year: 1974, is_living: true, is_patrilineal: false, occupation: 'Bác sĩ'
});
const d4_c2_1b = mkP('p_d4_2ab', {
  handle: 'D4C2AB', display_name: 'Nguyễn Thị Hồng', first_name: 'Hồng', middle_name: 'Thị', surname: 'Nguyễn',
  gender: 2, generation: 4, chi: 2, birth_year: 1975, is_living: true, is_patrilineal: true, occupation: 'Kỹ sư'
});
const d4_c2_1b_chong = mkP('p_d4_2abc', {
  handle: 'D4C2ABC', display_name: 'Vũ Văn Thắng', first_name: 'Thắng', surname: 'Vũ',
  gender: 1, generation: 4, birth_year: 1973, is_living: true, is_patrilineal: false, occupation: 'Kinh doanh'
});
const d4_c2_2a = mkP('p_d4_2ba', {
  handle: 'D4C2BA', display_name: 'Nguyễn Đình Thắng', first_name: 'Thắng', surname: 'Nguyễn Đình',
  gender: 1, generation: 4, chi: 2, birth_year: 1978, is_living: true, is_patrilineal: true, occupation: 'Doanh nhân'
});
const d4_c2_2b = mkP('p_d4_2bb', {
  handle: 'D4C2BB', display_name: 'Nguyễn Thị Thanh', first_name: 'Thanh', middle_name: 'Thị', surname: 'Nguyễn',
  gender: 2, generation: 4, chi: 2, birth_year: 1980, is_living: true, is_patrilineal: true, occupation: 'Nhân viên'
});
const d4_c2_3a = mkP('p_d4_2ca', {
  handle: 'D4C2CA', display_name: 'Nguyễn Đình Dũng', first_name: 'Dũng', surname: 'Nguyễn Đình',
  gender: 1, generation: 4, chi: 2, birth_year: 1982, is_living: true, is_patrilineal: true, occupation: 'Kỹ sư IT',
  email: 'dung.nd@email.vn'
});
const d4_c2_3a_vo = mkP('p_d4_2cav', {
  handle: 'D4C2CAV', display_name: 'Nguyễn Thị Mai', first_name: 'Mai', middle_name: 'Thị', surname: 'Nguyễn',
  gender: 2, generation: 4, birth_year: 1985, is_living: true, is_patrilineal: false, occupation: 'Kế toán'
});

// --- CHÁU CHI 3 ---
const d4_c3_1a = mkP('p_d4_3aa', {
  handle: 'D4C3AA', display_name: 'Nguyễn Đình Tùng', first_name: 'Tùng', surname: 'Nguyễn Đình',
  gender: 1, generation: 4, chi: 3, birth_year: 1975, is_living: true, is_patrilineal: true, occupation: 'Quân nhân'
});
const d4_c3_1a_vo = mkP('p_d4_3aav', {
  handle: 'D4C3AAV', display_name: 'Trịnh Thị Hương', first_name: 'Hương', middle_name: 'Thị', surname: 'Trịnh',
  gender: 2, generation: 4, birth_year: 1977, is_living: true, is_patrilineal: false, occupation: 'Công nhân'
});
const d4_c3_1b = mkP('p_d4_3ab', {
  handle: 'D4C3AB', display_name: 'Nguyễn Thị Nhung', first_name: 'Nhung', middle_name: 'Thị', surname: 'Nguyễn',
  gender: 2, generation: 4, chi: 3, birth_year: 1978, is_living: true, is_patrilineal: true, occupation: 'Giáo viên'
});
const d4_c3_2a = mkP('p_d4_3ba', {
  handle: 'D4C3BA', display_name: 'Nguyễn Đình Lâm', first_name: 'Lâm', surname: 'Nguyễn Đình',
  gender: 1, generation: 4, chi: 3, birth_year: 1980, is_living: true, is_patrilineal: true, occupation: 'Nông dân'
});
const d4_c3_2a_vo = mkP('p_d4_3bav', {
  handle: 'D4C3BAV', display_name: 'Phạm Thị Len', first_name: 'Len', middle_name: 'Thị', surname: 'Phạm',
  gender: 2, generation: 4, birth_year: 1982, is_living: true, is_patrilineal: false, occupation: 'Nông dân'
});
const d4_c3_2b = mkP('p_d4_3bb', {
  handle: 'D4C3BB', display_name: 'Nguyễn Đình Tiến', first_name: 'Tiến', surname: 'Nguyễn Đình',
  gender: 1, generation: 4, chi: 3, birth_year: 1985, is_living: true, is_patrilineal: true, occupation: 'Công nhân'
});

// ═══════════════════════════════════════════════════════════════════════════
// ĐỜI 5 - CHẮT
// ═══════════════════════════════════════════════════════════════════════════
const d5_c1_1a_1 = mkP('p_d5_1aa1', {
  handle: 'D5C1AA1', display_name: 'Nguyễn Đình An', first_name: 'An', surname: 'Nguyễn Đình',
  gender: 1, generation: 5, chi: 1, birth_year: 1998, is_living: true, is_patrilineal: true, occupation: 'Sinh viên'
});
const d5_c1_1a_2 = mkP('p_d5_1aa2', {
  handle: 'D5C1AA2', display_name: 'Nguyễn Thị Bình', first_name: 'Bình', middle_name: 'Thị', surname: 'Nguyễn',
  gender: 2, generation: 5, chi: 1, birth_year: 2000, is_living: true, is_patrilineal: true, occupation: 'Sinh viên'
});
const d5_c1_1a_3 = mkP('p_d5_1aa3', {
  handle: 'D5C1AA3', display_name: 'Nguyễn Đình Khôi', first_name: 'Khôi', surname: 'Nguyễn Đình',
  gender: 1, generation: 5, chi: 1, birth_year: 2005, is_living: true, is_patrilineal: true, occupation: 'Học sinh'
});
const d5_c2_3a_1 = mkP('p_d5_2ca1', {
  handle: 'D5C2CA1', display_name: 'Nguyễn Đình Phúc', first_name: 'Phúc', surname: 'Nguyễn Đình',
  gender: 1, generation: 5, chi: 2, birth_year: 2010, is_living: true, is_patrilineal: true, occupation: 'Học sinh'
});
const d5_c2_3a_2 = mkP('p_d5_2ca2', {
  handle: 'D5C2CA2', display_name: 'Nguyễn Thị Vy', first_name: 'Vy', middle_name: 'Thị', surname: 'Nguyễn',
  gender: 2, generation: 5, chi: 2, birth_year: 2012, is_living: true, is_patrilineal: true, occupation: 'Học sinh'
});

// ═══════════════════════════════════════════════════════════════════════════
// TỔNG HỢP PEOPLE
// ═══════════════════════════════════════════════════════════════════════════
export const PEOPLE_SEED: Person[] = [
  // Đời 1
  to_vo, to_vo_wife,
  // Đời 2
  d2_c1_cha, d2_c1_vo1, d2_c1_vo2,
  d2_c2_cha, d2_c2_vo,
  d2_c3_cha, d2_c3_vo,
  // Đời 3 - Chi 1
  d3_c1_1, d3_c1_1_vo, d3_c1_2, d3_c1_2_chong, d3_c1_3, d3_c1_3_vo, d3_c1_4, d3_c1_4_vo,
  // Đời 3 - Chi 2
  d3_c2_1, d3_c2_1_vo, d3_c2_2, d3_c2_2_chong, d3_c2_3, d3_c2_3_vo,
  // Đời 3 - Chi 3
  d3_c3_1, d3_c3_1_vo, d3_c3_2, d3_c3_2_chong,
  // Đời 4 - Chi 1
  d4_c1_1a, d4_c1_1a_vo, d4_c1_1b, d4_c1_1b_chong, d4_c1_1c, d4_c1_1c_vo,
  d4_c1_2a, d4_c1_2a_vo, d4_c1_2b, d4_c1_3a, d4_c1_3a_vo, d4_c1_3b, d4_c1_4a,
  // Đời 4 - Chi 2
  d4_c2_1a, d4_c2_1a_vo, d4_c2_1b, d4_c2_1b_chong, d4_c2_2a, d4_c2_2b, d4_c2_3a, d4_c2_3a_vo,
  // Đời 4 - Chi 3
  d4_c3_1a, d4_c3_1a_vo, d4_c3_1b, d4_c3_2a, d4_c3_2a_vo, d4_c3_2b,
  // Đời 5
  d5_c1_1a_1, d5_c1_1a_2, d5_c1_1a_3, d5_c2_3a_1, d5_c2_3a_2,
];

// ═══════════════════════════════════════════════════════════════════════════
// FAMILIES
// ═══════════════════════════════════════════════════════════════════════════
const f_to = mkF('f_d1', { father_id: to_vo.id, mother_id: to_vo_wife.id, marriage_date: '1940-01-15', marriage_place: 'Làng Hòa Ngãi' });

// Chi 1
const f_d2_c1 = mkF('f_d2_c1', { father_id: d2_c1_cha.id, mother_id: d2_c1_vo1.id, marriage_date: '1938-05-20', marriage_place: 'Hà Nội', sort_order: 1 });
const f_d2_c1_v2 = mkF('f_d2_c1_v2', { father_id: d2_c1_cha.id, mother_id: d2_c1_vo2.id, marriage_date: '1970-03-18', marriage_place: 'Hà Nội', sort_order: 2, notes: 'Vợ thứ hai' });
const f_d3_c1_1 = mkF('f_d3_c1_1', { father_id: d3_c1_1.id, mother_id: d3_c1_1_vo.id, marriage_date: '1968-10-25', marriage_place: 'Hà Nội' });
const f_d3_c1_2 = mkF('f_d3_c1_2', { father_id: d3_c1_2_chong.id, mother_id: d3_c1_2.id, marriage_date: '1970-02-14', marriage_place: 'Hà Nội' });
const f_d3_c1_3 = mkF('f_d3_c1_3', { father_id: d3_c1_3.id, mother_id: d3_c1_3_vo.id, marriage_date: '1975-08-15', marriage_place: 'Hà Nội' });
const f_d3_c1_4 = mkF('f_d3_c1_4', { father_id: d3_c1_4.id, mother_id: d3_c1_4_vo.id, marriage_date: '1980-05-20', marriage_place: 'Hà Nội' });

// Chi 2
const f_d2_c2 = mkF('f_d2_c2', { father_id: d2_c2_cha.id, mother_id: d2_c2_vo.id, marriage_date: '1940-10-01', marriage_place: 'Hải Phòng' });
const f_d3_c2_1 = mkF('f_d3_c2_1', { father_id: d3_c2_1.id, mother_id: d3_c2_1_vo.id, marriage_date: '1969-07-20', marriage_place: 'Hà Nội' });
const f_d3_c2_2 = mkF('f_d3_c2_2', { father_id: d3_c2_2_chong.id, mother_id: d3_c2_2.id, marriage_date: '1970-04-10', marriage_place: 'Hà Nội' });
const f_d3_c2_3 = mkF('f_d3_c2_3', { father_id: d3_c2_3.id, mother_id: d3_c2_3_vo.id, marriage_date: '1978-12-25', marriage_place: 'Hà Nội' });

// Chi 3
const f_d2_c3 = mkF('f_d2_c3', { father_id: d2_c3_cha.id, mother_id: d2_c3_vo.id, marriage_date: '1948-02-28', marriage_place: 'Nam Định' });
const f_d3_c3_1 = mkF('f_d3_c3_1', { father_id: d3_c3_1.id, mother_id: d3_c3_1_vo.id, marriage_date: '1972-10-10', marriage_place: 'Nam Định' });
const f_d3_c3_2 = mkF('f_d3_c3_2', { father_id: d3_c3_2_chong.id, mother_id: d3_c3_2.id, marriage_date: '1975-05-15', marriage_place: 'Nam Định' });

// Đời 4
const f_d4_c1_1a = mkF('f_d4_c1_1a', { father_id: d4_c1_1a.id, mother_id: d4_c1_1a_vo.id, marriage_date: '1995-06-10', marriage_place: 'Hà Nội' });
const f_d4_c1_1b = mkF('f_d4_c1_1b', { father_id: d4_c1_1b_chong.id, mother_id: d4_c1_1b.id, marriage_date: '1997-03-15', marriage_place: 'Hà Nội' });
const f_d4_c1_1c = mkF('f_d4_c1_1c', { father_id: d4_c1_1c.id, mother_id: d4_c1_1c_vo.id, marriage_date: '2000-09-20', marriage_place: 'Hà Nội' });
const f_d4_c1_2a = mkF('f_d4_c1_2a', { father_id: d4_c1_2a.id, mother_id: d4_c1_2a_vo.id, marriage_date: '2002-01-01', marriage_place: 'Hà Nội' });
const f_d4_c1_3a = mkF('f_d4_c1_3a', { father_id: d4_c1_3a.id, mother_id: d4_c1_3a_vo.id, marriage_date: '2005-05-20', marriage_place: 'Hà Nội' });
const f_d4_c2_1a = mkF('f_d4_c2_1a', { father_id: d4_c2_1a.id, mother_id: d4_c2_1a_vo.id, marriage_date: '1996-02-20', marriage_place: 'Hà Nội' });
const f_d4_c2_1b = mkF('f_d4_c2_1b', { father_id: d4_c2_1b_chong.id, mother_id: d4_c2_1b.id, marriage_date: '1998-08-15', marriage_place: 'Hà Nội' });
const f_d4_c2_3a = mkF('f_d4_c2_3a', { father_id: d4_c2_3a.id, mother_id: d4_c2_3a_vo.id, marriage_date: '2008-06-10', marriage_place: 'Hà Nội' });
const f_d4_c3_1a = mkF('f_d4_c3_1a', { father_id: d4_c3_1a.id, mother_id: d4_c3_1a_vo.id, marriage_date: '2000-10-01', marriage_place: 'Nam Định' });
const f_d4_c3_2a = mkF('f_d4_c3_2a', { father_id: d4_c3_2a.id, mother_id: d4_c3_2a_vo.id, marriage_date: '2003-04-20', marriage_place: 'Nam Định' });

export const FAMILIES_SEED: Family[] = [
  f_to,
  f_d2_c1, f_d2_c1_v2, f_d2_c2, f_d2_c3,
  f_d3_c1_1, f_d3_c1_2, f_d3_c1_3, f_d3_c1_4,
  f_d3_c2_1, f_d3_c2_2, f_d3_c2_3,
  f_d3_c3_1, f_d3_c3_2,
  f_d4_c1_1a, f_d4_c1_1b, f_d4_c1_1c, f_d4_c1_2a, f_d4_c1_3a,
  f_d4_c2_1a, f_d4_c2_1b, f_d4_c2_3a,
  f_d4_c3_1a, f_d4_c3_2a,
];

// ═══════════════════════════════════════════════════════════════════════════
// CHILDREN
// ═══════════════════════════════════════════════════════════════════════════
export const CHILDREN_SEED: Child[] = [
  // Đời 1 → Đời 2
  mkC('c_d1_2a', f_to.id, d2_c1_cha.id, 1),
  mkC('c_d1_2b', f_to.id, d2_c2_cha.id, 2),
  mkC('c_d1_2c', f_to.id, d2_c3_cha.id, 3),

  // Chi 1: Đời 2 → Đời 3
  mkC('c_d2c1_3a', f_d2_c1.id, d3_c1_1.id, 1),
  mkC('c_d2c1_3b', f_d2_c1.id, d3_c1_2.id, 2),
  mkC('c_d2c1_3c', f_d2_c1.id, d3_c1_3.id, 3),
  mkC('c_d2c1_3d', f_d2_c1_v2.id, d3_c1_4.id, 1),

  // Chi 2: Đời 2 → Đời 3
  mkC('c_d2c2_3a', f_d2_c2.id, d3_c2_1.id, 1),
  mkC('c_d2c2_3b', f_d2_c2.id, d3_c2_2.id, 2),
  mkC('c_d2c2_3c', f_d2_c2.id, d3_c2_3.id, 3),

  // Chi 3: Đời 2 → Đời 3
  mkC('c_d2c3_3a', f_d2_c3.id, d3_c3_1.id, 1),
  mkC('c_d2c3_3b', f_d2_c3.id, d3_c3_2.id, 2),

  // Chi 1: Đời 3 → Đời 4
  mkC('c_d3c1_4a', f_d3_c1_1.id, d4_c1_1a.id, 1),
  mkC('c_d3c1_4b', f_d3_c1_1.id, d4_c1_1b.id, 2),
  mkC('c_d3c1_4c', f_d3_c1_1.id, d4_c1_1c.id, 3),
  mkC('c_d3c1_4d', f_d3_c1_2.id, d4_c1_2a.id, 1),
  mkC('c_d3c1_4e', f_d3_c1_2.id, d4_c1_2b.id, 2),
  mkC('c_d3c1_4f', f_d3_c1_3.id, d4_c1_3a.id, 1),
  mkC('c_d3c1_4g', f_d3_c1_3.id, d4_c1_3b.id, 2),
  mkC('c_d3c1_4h', f_d3_c1_4.id, d4_c1_4a.id, 1),

  // Chi 2: Đời 3 → Đời 4
  mkC('c_d3c2_4a', f_d3_c2_1.id, d4_c2_1a.id, 1),
  mkC('c_d3c2_4b', f_d3_c2_1.id, d4_c2_1b.id, 2),
  mkC('c_d3c2_4c', f_d3_c2_2.id, d4_c2_2a.id, 1),
  mkC('c_d3c2_4d', f_d3_c2_2.id, d4_c2_2b.id, 2),
  mkC('c_d3c2_4e', f_d3_c2_3.id, d4_c2_3a.id, 1),

  // Chi 3: Đời 3 → Đời 4
  mkC('c_d3c3_4a', f_d3_c3_1.id, d4_c3_1a.id, 1),
  mkC('c_d3c3_4b', f_d3_c3_1.id, d4_c3_1b.id, 2),
  mkC('c_d3c3_4c', f_d3_c3_2.id, d4_c3_2a.id, 1),
  mkC('c_d3c3_4d', f_d3_c3_2.id, d4_c3_2b.id, 2),

  // Chi 1: Đời 4 → Đời 5
  mkC('c_d4c1_5a', f_d4_c1_1a.id, d5_c1_1a_1.id, 1),
  mkC('c_d4c1_5b', f_d4_c1_1a.id, d5_c1_1a_2.id, 2),
  mkC('c_d4c1_5c', f_d4_c1_1a.id, d5_c1_1a_3.id, 3),

  // Chi 2: Đời 4 → Đời 5
  mkC('c_d4c2_5a', f_d4_c2_3a.id, d5_c2_3a_1.id, 1),
  mkC('c_d4c2_5b', f_d4_c2_3a.id, d5_c2_3a_2.id, 2),
];

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS - Sự kiện đầy đủ
// ═══════════════════════════════════════════════════════════════════════════
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
  // Giỗ Tổ hàng năm
  mkE('e_gio_to_2024', { title: 'Giỗ Tổ năm 2024 (Giáp Thìn)', description: 'Lễ giỗ Tổ năm Giáp Thìn - đã tổ chức thành công với 150 người tham dự.', event_type: 'gio', event_date: '2024-08-19', recurring: false, location: 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi' }),
  mkE('e_gio_to_2025', { title: 'Giỗ Tổ năm 2025 (Ất Tỵ)', description: 'Lễ giỗ Tổ năm Ất Tỵ - đã tổ chức với sự tham gia của đông đủ bà con.', event_type: 'gio', event_date: '2025-08-08', recurring: false, location: 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi' }),
  mkE('e_gio_to_2026', { title: 'Giỗ Tổ năm 2026 (Bính Ngọ)', description: 'Lễ giỗ Tổ năm Bính Ngọ - dự kiến tổ chức ngày 15/7 âm lịch.', event_type: 'gio', event_date: '2026-08-27', recurring: false, location: 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi' }),

  // Họp họ
  mkE('e_hop_ho_2026_xuan', { title: 'Họp họ đầu xuân 2026', description: 'Họp mặt đầu năm, tổng kết năm cũ, bàn kế hoạch năm mới. Tham dự: 80 người.', event_type: 'hop_ho', event_date: '2026-02-15', recurring: true, location: 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi' }),
  mkE('e_hop_ho_2025_xuan', { title: 'Họp họ đầu xuân 2025', description: 'Họp mặt đầu năm 2025, bầu ban quản trị họ mới.', event_type: 'hop_ho', event_date: '2025-02-10', recurring: false, location: 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi' }),

  // Lễ tết
  mkE('e_tao_mo_2026', { title: 'Lễ tảo mộ 2026', description: 'Đi tảo mộ các thế hệ tiền bối nhân dịp năm mới.', event_type: 'le_tet', event_date: '2026-04-05', recurring: true, location: 'Nghĩa trang làng Hòa Ngãi' }),
  mkE('e_le_dot_2026', { title: 'Lễ đón Tổ về nhà thờ', description: 'Lễ đón Tổ về nhà thờ sau khi tu sửa.', event_type: 'le_tet', event_date: '2026-01-20', recurring: false, location: 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi' }),

  // Sự kiện khác
  mkE('e_le_trao_giai_2025', { title: 'Lễ trao học bổng 2025', description: 'Trao học bổng cho 10 sinh viên xuất sắc trong dòng họ.', event_type: 'other', event_date: '2025-08-15', recurring: false, location: 'Nhà thờ họ Nguyễn Đình' }),
  mkE('e_le_xay_nha_tho_2020', { title: 'Khởi công xây dựng nhà thờ mới', description: 'Lễ động thổ xây dựng nhà thờ họ mới thay thế nhà thờ cũ.', event_type: 'other', event_date: '2020-03-15', recurring: false, location: 'Làng Hòa Ngãi' }),
];

export const EVENTS_SEED: Event[] = [...gioEvents, ...fixedEvents];

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTS - Tài liệu dòng họ
// ═══════════════════════════════════════════════════════════════════════════
const svg = (label: string, sub: string, bg: string, fg: string) =>
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="${bg}"/><text x="400" y="220" font-family="serif" font-size="42" fill="${fg}" text-anchor="middle" font-weight="bold">${label}</text><text x="400" y="280" font-family="serif" font-size="22" fill="${fg}" text-anchor="middle">${sub}</text></svg>`
  );

export const DOCUMENTS_SEED: ClanDocument[] = [
  // Ảnh lịch sử
  mkD('d_nha_tho_cu', {
    title: 'Ảnh nhà thờ họ cũ (1940)',
    description: 'Ảnh chụp nhà thờ họ Nguyễn Đình thời Pháp thuộc. Đây là ngôi nhà thờ đầu tiên được xây dựng bởi thủy tổ.',
    file_url: svg('Nhà thờ họ cũ - 1940', 'Làng Hòa Ngãi - Thanh Liêm - Hà Nam', '%238B4513', '%23FDE68A'),
    file_type: 'image/svg+xml', file_size: 524288, category: 'anh_lich_su', tags: 'nhà thờ, lịch sử, 1940'
  }),
  mkD('d_anh_gia_dinh_1960', {
    title: 'Ảnh gia đình lớn năm 1960',
    description: 'Ảnh chụp toàn thể gia đình năm 1960 nhân dịp giỗ Tổ.',
    file_url: svg('Gia đình lớn 1960', 'Giỗ Tổ - Làng Hòa Ngãi', '%23654321', '%23FFE4B5'),
    file_type: 'image/svg+xml', file_size: 786432, category: 'anh_lich_su', tags: 'gia đình, 1960'
  }),
  mkD('d_anh_nha_tho_moi', {
    title: 'Nhà thờ họ mới (2022)',
    description: 'Hình ảnh nhà thờ họ mới sau khi hoàn thành xây dựng.',
    file_url: svg('Nhà thờ họ mới', 'Hoàn thành 2022 - Làng Hòa Ngãi', '%238B0000', '%23FFD700'),
    file_type: 'image/svg+xml', file_size: 1048576, category: 'anh_lich_su', tags: 'nhà thờ, mới, 2022'
  }),

  // Giấy tờ
  mkD('d_gia_pha_1920', {
    title: 'Gia phả sách giấy 1920',
    description: 'Bản gia phả giấy viết tay năm 1920, ghi chép công lao của các bậc tiền bối.',
    file_url: svg('Gia Phả 1920', '(Bản sao lưu trữ)', '%23F5F5DC', '%232F2F2F'),
    file_type: 'application/pdf', file_size: 1048576, category: 'giay_to', tags: 'gia phả, sách, 1920'
  }),
  mkD('d_huong_uoc_1932', {
    title: 'Hương ước dòng họ 1932',
    description: 'Bản hương ước quy định 13 điều, do cụ Nguyễn Đình Hạo soạn thảo.',
    file_url: svg('Hương ước 1932', '13 điều - Nguyễn Đình Hạo', '%23FFFAF0', '%232F2F2F'),
    file_type: 'application/pdf', file_size: 2097152, category: 'giay_to', tags: 'hương ước, 1932, nội quy'
  }),
  mkD('d_so_hon_nhan_1975', {
    title: 'Sổ họ nạn nhân chiến tranh 1975',
    description: 'Danh sách các thành viên dòng họ tham gia kháng chiến.',
    file_url: svg('Sổ họ nạn nhân chiến tranh', '1975', '%23DEB887', '%23333'),
    file_type: 'application/pdf', file_size: 524288, category: 'giay_to', tags: 'chiến tranh, 1975'
  }),

  // Bản đồ
  mkD('d_ban_do_lang', {
    title: 'Bản đồ làng Hòa Ngãi',
    description: 'Bản đồ cổ làng Hòa Ngãi thế kỷ 19, vẽ tay.',
    file_url: svg('Bản đồ Làng Hòa Ngãi', 'Thế kỷ 19 - Bản đồ cổ', '%23DEB887', '%233B2F2F'),
    file_type: 'image/svg+xml', file_size: 786432, category: 'ban_do', tags: 'bản đồ, làng, lịch sử'
  }),
  mkD('d_ban_do_vi_tri_nha_tho', {
    title: 'Bản đồ vị trí nhà thờ và nghĩa trang',
    description: 'Sơ đồ vị trí nhà thờ họ và khu nghĩa trang tổ tiên.',
    file_url: svg('Sơ đồ vị trí', 'Nhà thờ & Nghĩa trang', '%23228B22', '%23FFFFFF'),
    file_type: 'image/svg+xml', file_size: 314572, category: 'ban_do', tags: 'bản đồ, nhà thờ, nghĩa trang'
  }),

  // Video
  mkD('d_video_le_gio_to_2025', {
    title: 'Video Lễ Giỗ Tổ 2025',
    description: 'Video ghi lại toàn bộ lễ giỗ Tổ năm 2025 tại nhà thờ họ.',
    file_url: svg('Video Lễ Giỗ Tổ 2025', 'Nhà thờ họ Nguyễn Đình', '%23400000', '%23FFFFFF'),
    file_type: 'video/mp4', file_size: 52428800, category: 'video', tags: 'video, giỗ tổ, 2025'
  }),
  mkD('d_video_le_xay_nha_tho', {
    title: 'Video Lễ động thổ xây nhà thờ',
    description: 'Video clip ngắn ghi lại lễ động thổ xây dựng nhà thờ mới.',
    file_url: svg('Video Lễ động thổ', 'Xây dựng nhà thờ mới', '%23000000', '%23FFFF00'),
    file_type: 'video/mp4', file_size: 10485760, category: 'video', tags: 'video, xây nhà thờ'
  }),
];
