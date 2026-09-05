/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/dev-fake-vertical-tree.ts
 * @description Dev-only vertical fake tree (7 generations).
 *              Đời 1-5 giống dev-fake-compact-tree (test view giống compact),
 *              đời 6-7 mở rộng để test view "dọc" (rải tên theo chiều dọc).
 *
 *              Bật bằng NEXT_PUBLIC_USE_FAKE_TREE=vertical.
 * @version 1.0.0
 * @updated 2026-09-06
 */

import type { Child, Family, Person } from '@/types';
import type { TreeData } from '@/lib/supabase-data-families';

interface RawPerson {
  key: string;
  display_name: string;
  gender: 1 | 2;
  generation: number;
  chi?: number;
  tree_label?: string;
  birth_year: number;
  death_year: number;
  is_patrilineal?: boolean;
}

interface RawChild {
  key: string;
  /** undefined → coi như chưa nhập (NULLS LAST) */
  sort_order?: number;
}

interface RawFamily {
  key: string;
  husband_key: string;
  wife_key: string;
  child_keys: RawChild[];
}

/**
 * 7 đời:
 *   - Đời 1-5: giống dev-fake-compact-tree (5 đời, ~38 người).
 *   - Đời 6-7: mở rộng thêm ~12-15 người để test view dọc (tên dài,
 *     nhiều vợ, con gái).
 */
function build(): TreeData {
  const rawPeople: Record<string, RawPerson> = {
    // ===== Đời 1 =====
    A: { key: 'A', display_name: 'Nguyễn Đình Tổ A', gender: 1, generation: 1, tree_label: 'Tổ', birth_year: 1700, death_year: 1770 },
    B: { key: 'B', display_name: 'Nguyễn Thị Tổ Mẫu B', gender: 2, generation: 1, tree_label: 'Tổ Mẫu', birth_year: 1705, death_year: 1780, is_patrilineal: false },

    // ===== Đời 2 =====
    C1: { key: 'C1', display_name: 'Nguyễn Đình C1', gender: 1, generation: 2, chi: 1, tree_label: 'Chi trưởng', birth_year: 1730, death_year: 1800 },
    D1: { key: 'D1', display_name: 'Lê Thị D1', gender: 2, generation: 2, is_patrilineal: false, birth_year: 1735, death_year: 1805 },
    H1: { key: 'H1', display_name: 'Trần Thị H1', gender: 2, generation: 2, is_patrilineal: false, birth_year: 1740, death_year: 1810 },

    C2: { key: 'C2', display_name: 'Nguyễn Đình C2', gender: 1, generation: 2, chi: 2, birth_year: 1732, death_year: 1802 },
    D2: { key: 'D2', display_name: 'Hoàng Thị D2', gender: 2, generation: 2, is_patrilineal: false, birth_year: 1737, death_year: 1807 },

    C3: { key: 'C3', display_name: 'Nguyễn Đình C3', gender: 1, generation: 2, chi: 3, birth_year: 1734, death_year: 1804 },
    D3: { key: 'D3', display_name: 'Đặng Thị D3', gender: 2, generation: 2, is_patrilineal: false, birth_year: 1739, death_year: 1809 },

    // ===== Đời 3 =====
    E1: { key: 'E1', display_name: 'Nguyễn Đình E1', gender: 1, generation: 3, chi: 1, birth_year: 1755, death_year: 1820 },
    E2: { key: 'E2', display_name: 'Nguyễn Thị E2', gender: 2, generation: 3, birth_year: 1758, death_year: 1825 },
    E3: { key: 'E3', display_name: 'Nguyễn Đình E3', gender: 1, generation: 3, chi: 2, birth_year: 1760, death_year: 1830 },

    E4: { key: 'E4', display_name: 'Nguyễn Đình E4', gender: 1, generation: 3, chi: 3, birth_year: 1762, death_year: 1835 },
    E5: { key: 'E5', display_name: 'Nguyễn Thị E5', gender: 2, generation: 3, birth_year: 1765, death_year: 1840 },

    E6: { key: 'E6', display_name: 'Nguyễn Đình E6', gender: 1, generation: 3, chi: 1, birth_year: 1759, death_year: 1824 },
    E7: { key: 'E7', display_name: 'Nguyễn Thị E7', gender: 2, generation: 3, birth_year: 1761, death_year: 1826 },
    E8: { key: 'E8', display_name: 'Nguyễn Đình E8', gender: 1, generation: 3, chi: 2, birth_year: 1764, death_year: 1829 },

    E9: { key: 'E9', display_name: 'Nguyễn Thị E9', gender: 2, generation: 3, birth_year: 1763, death_year: 1828 },
    EA: { key: 'EA', display_name: 'Nguyễn Thị EA', gender: 2, generation: 3, birth_year: 1766, death_year: 1831 },
    EB: { key: 'EB', display_name: 'Nguyễn Thị EB', gender: 2, generation: 3, birth_year: 1768, death_year: 1833 },

    F1: { key: 'F1', display_name: 'Bùi Thị F1', gender: 2, generation: 3, is_patrilineal: false, birth_year: 1760, death_year: 1825 },
    F2: { key: 'F2', display_name: 'Phùng Thị F2', gender: 2, generation: 3, is_patrilineal: false, birth_year: 1765, death_year: 1830 },
    F3: { key: 'F3', display_name: 'Ngô Thị F3', gender: 2, generation: 3, is_patrilineal: false, birth_year: 1770, death_year: 1835 },
    F4: { key: 'F4', display_name: 'Vũ Thị F4', gender: 2, generation: 3, is_patrilineal: false, birth_year: 1775, death_year: 1840 },

    // ===== Đời 4 =====
    G1: { key: 'G1', display_name: 'Nguyễn Đình G1', gender: 1, generation: 4, chi: 1, birth_year: 1780, death_year: 1850 },
    G2: { key: 'G2', display_name: 'Nguyễn Thị G2', gender: 2, generation: 4, birth_year: 1782, death_year: 1852 },
    G3: { key: 'G3', display_name: 'Nguyễn Đình G3', gender: 1, generation: 4, chi: 1, birth_year: 1785, death_year: 1855 },
    G4: { key: 'G4', display_name: 'Nguyễn Đình G4', gender: 1, generation: 4, chi: 2, birth_year: 1788, death_year: 1858 },
    G5: { key: 'G5', display_name: 'Nguyễn Thị G5', gender: 2, generation: 4, birth_year: 1791, death_year: 1861 },

    H2: { key: 'H2', display_name: 'Trịnh Thị H2', gender: 2, generation: 4, is_patrilineal: false, birth_year: 1785, death_year: 1855 },
    H3: { key: 'H3', display_name: 'Đỗ Thị H3', gender: 2, generation: 4, is_patrilineal: false, birth_year: 1790, death_year: 1860 },

    // ===== Đời 5 =====
    I1: { key: 'I1', display_name: 'Nguyễn Đình I1', gender: 1, generation: 5, chi: 1, birth_year: 1810, death_year: 1880 },
    I2: { key: 'I2', display_name: 'Nguyễn Thị I2', gender: 2, generation: 5, birth_year: 1812, death_year: 1882 },
    I3: { key: 'I3', display_name: 'Nguyễn Đình I3', gender: 1, generation: 5, chi: 2, birth_year: 1815, death_year: 1885 },
    I4: { key: 'I4', display_name: 'Nguyễn Đình I4', gender: 1, generation: 5, chi: 1, birth_year: 1818, death_year: 1888 },
    I5: { key: 'I5', display_name: 'Nguyễn Thị I5', gender: 2, generation: 5, birth_year: 1820, death_year: 1890 },

    // Vợ đời 5
    J1: { key: 'J1', display_name: 'Lý Thị J1', gender: 2, generation: 5, is_patrilineal: false, birth_year: 1812, death_year: 1882 },
    J2: { key: 'J2', display_name: 'Đinh Thị J2', gender: 2, generation: 5, is_patrilineal: false, birth_year: 1820, death_year: 1890 },

    // ===== Đời 6 — test view dọc =====
    // Tên dài hơn để demo rải nhiều từ theo chiều dọc
    K1: { key: 'K1', display_name: 'Nguyễn Đình K1', gender: 1, generation: 6, chi: 1, birth_year: 1840, death_year: 1910 },
    K2: { key: 'K2', display_name: 'Nguyễn Thị K2', gender: 2, generation: 6, birth_year: 1842, death_year: 1912 },
    K3: { key: 'K3', display_name: 'Nguyễn Đình K3', gender: 1, generation: 6, chi: 2, birth_year: 1845, death_year: 1915 },
    K4: { key: 'K4', display_name: 'Nguyễn Thị K4', gender: 2, generation: 6, birth_year: 1847, death_year: 1917 },
    K5: { key: 'K5', display_name: 'Nguyễn Đình K5', gender: 1, generation: 6, chi: 1, birth_year: 1850, death_year: 1920 },
    K6: { key: 'K6', display_name: 'Nguyễn Thị K6', gender: 2, generation: 6, birth_year: 1852, death_year: 1922 },

    // Vợ/chồng đời 6
    L1: { key: 'L1', display_name: 'Phạm Thị L1', gender: 2, generation: 6, is_patrilineal: false, birth_year: 1842, death_year: 1912 },
    L2: { key: 'L2', display_name: 'Tô Thị L2', gender: 2, generation: 6, is_patrilineal: false, birth_year: 1847, death_year: 1917 },
    L3: { key: 'L3', display_name: 'Hà Thị L3', gender: 2, generation: 6, is_patrilineal: false, birth_year: 1852, death_year: 1922 },
    L4: { key: 'L4', display_name: 'Nguyễn Thị L4', gender: 2, generation: 6, is_patrilineal: false, birth_year: 1855, death_year: 1925 },

    // ===== Đời 7 — test view dọc tiếp =====
    M1: { key: 'M1', display_name: 'Nguyễn Đình M1', gender: 1, generation: 7, chi: 1, birth_year: 1870, death_year: 1940 },
    M2: { key: 'M2', display_name: 'Nguyễn Thị M2', gender: 2, generation: 7, birth_year: 1872, death_year: 1942 },
    M3: { key: 'M3', display_name: 'Nguyễn Đình M3', gender: 1, generation: 7, chi: 2, birth_year: 1875, death_year: 1945 },
    M4: { key: 'M4', display_name: 'Nguyễn Thị M4', gender: 2, generation: 7, birth_year: 1878, death_year: 1948 },

    N1: { key: 'N1', display_name: 'Bùi Thị N1', gender: 2, generation: 7, is_patrilineal: false, birth_year: 1872, death_year: 1942 },
    N2: { key: 'N2', display_name: 'Chu Thị N2', gender: 2, generation: 7, is_patrilineal: false, birth_year: 1880, death_year: 1950 },
  };

  const rawFamilies: RawFamily[] = [
    // ===== Đời 1 -> 2 =====
    { key: 'F1', husband_key: 'A', wife_key: 'B', child_keys: [
      { key: 'C1' },
      { key: 'C2' },
      { key: 'C3' },
    ] },

    // ===== Đời 2 -> 3 =====
    { key: 'F2', husband_key: 'C1', wife_key: 'D1', child_keys: [
      { key: 'E1', sort_order: 0 },
      { key: 'E2', sort_order: 1 },
      { key: 'E3' },
    ] },
    { key: 'F3', husband_key: 'C1', wife_key: 'H1', child_keys: [
      { key: 'E4', sort_order: 0 },
      { key: 'E5', sort_order: 1 },
    ] },
    { key: 'F4', husband_key: 'C2', wife_key: 'D2', child_keys: [
      { key: 'E6', sort_order: 0 },
      { key: 'E7', sort_order: 1 },
      { key: 'E8', sort_order: 2 },
    ] },
    { key: 'F5', husband_key: 'C3', wife_key: 'D3', child_keys: [
      { key: 'E9', sort_order: 0 },
      { key: 'EA', sort_order: 1 },
      { key: 'EB', sort_order: 2 },
    ] },

    // ===== Đời 3 -> 4 =====
    { key: 'F6', husband_key: 'E1', wife_key: 'F1', child_keys: [
      { key: 'G1', sort_order: 0 },
      { key: 'G2', sort_order: 1 },
    ] },
    { key: 'F7', husband_key: 'E3', wife_key: 'F2', child_keys: [
      { key: 'G3', sort_order: 0 },
      { key: 'G4', sort_order: 1 },
    ] },
    { key: 'F8', husband_key: 'E4', wife_key: 'F3', child_keys: [
      { key: 'G5', sort_order: 0 },
    ] },
    { key: 'F9', husband_key: 'E6', wife_key: 'F4', child_keys: [] },

    // ===== Đời 4 -> 5 =====
    { key: 'FA', husband_key: 'G1', wife_key: 'H2', child_keys: [
      { key: 'I1', sort_order: 0 },
      { key: 'I2', sort_order: 1 },
      { key: 'I3', sort_order: 2 },
    ] },
    { key: 'FB', husband_key: 'G3', wife_key: 'H3', child_keys: [
      { key: 'I4', sort_order: 0 },
      { key: 'I5', sort_order: 1 },
    ] },

    // ===== Đời 5 -> 6 (test view dọc) =====
    // I1 + J1: 3 con (K1, K2, K3) — multi-wife không, nhưng có K1 lấy 2 vợ ở gen 6
    { key: 'FC', husband_key: 'I1', wife_key: 'J1', child_keys: [
      { key: 'K1', sort_order: 0 },
      { key: 'K2', sort_order: 1 },
    ] },
    // I3 + J2
    { key: 'FD', husband_key: 'I3', wife_key: 'J2', child_keys: [
      { key: 'K3', sort_order: 0 },
      { key: 'K4', sort_order: 1 },
      { key: 'K5', sort_order: 2 },
      { key: 'K6', sort_order: 3 },
    ] },

    // ===== Đời 6 -> 7 =====
    // K1 + L1 (vợ 1) + L2 (vợ 2) — multi-wife ở gen 6
    { key: 'FE', husband_key: 'K1', wife_key: 'L1', child_keys: [
      { key: 'M1', sort_order: 0 },
      { key: 'M2', sort_order: 1 },
    ] },
    { key: 'FF', husband_key: 'K1', wife_key: 'L2', child_keys: [
      { key: 'M3', sort_order: 0 },
    ] },
    // K5 + L3
    { key: 'FG', husband_key: 'K5', wife_key: 'L3', child_keys: [
      { key: 'M4', sort_order: 0 },
    ] },
  ];

  const idCounter = { v: 0 };
  const nextId = () => `fake-v-${(++idCounter.v).toString().padStart(4, '0')}`;
  const keyToId = new Map<string, string>();

  const people: Person[] = Object.values(rawPeople).map((rp) => {
    const id = nextId();
    keyToId.set(rp.key, id);
    const surname = rp.gender === 1 ? 'Nguyễn Đình' : 'Nguyễn Thị';
    const parts = rp.display_name.split(/\s+/);
    const firstName = parts[parts.length - 1] ?? null;
    return {
      id,
      handle: `vertical-${rp.key.toLowerCase()}`,
      display_name: rp.display_name,
      first_name: firstName,
      middle_name: parts[parts.length - 2] ?? null,
      surname,
      gender: rp.gender,
      generation: rp.generation,
      chi: rp.chi ?? null,
      tree_label: rp.tree_label ?? null,
      birth_date: `${rp.birth_year}-01-01`,
      birth_year: rp.birth_year,
      birth_place: 'Làng Hòa Ngãi',
      death_date: `${rp.death_year}-01-01`,
      death_year: rp.death_year,
      death_place: null,
      death_lunar: null,
      is_living: false,
      is_patrilineal: rp.is_patrilineal ?? true,
      phone: null,
      email: null,
      zalo: null,
      facebook: null,
      address: null,
      hometown: 'Làng Hòa Ngãi',
      occupation: null,
      biography: null,
      notes: null,
      avatar_url: null,
      privacy_level: 0,
      created_at: '2026-09-06T00:00:00Z',
      updated_at: '2026-09-06T00:00:00Z',
    };
  });

  const familyIdByKey = new Map<string, string>();
  const families: Family[] = rawFamilies.map((rf, idx) => {
    const id = nextId();
    familyIdByKey.set(rf.key, id);
    return {
      id,
      father_id: keyToId.get(rf.husband_key) ?? null,
      mother_id: keyToId.get(rf.wife_key) ?? null,
      marriage_date: null,
      marriage_place: 'Làng Hòa Ngãi',
      notes: null,
      sort_order: idx,
      created_at: '2026-09-06T00:00:00Z',
      updated_at: '2026-09-06T00:00:00Z',
    };
  });

  const children: Child[] = [];
  rawFamilies.forEach((rf) => {
    const familyId = familyIdByKey.get(rf.key);
    if (!familyId) return;
    rf.child_keys.forEach((rc) => {
      const childId = keyToId.get(rc.key);
      if (!childId) return;
      children.push({
        id: nextId(),
        family_id: familyId,
        person_id: childId,
        sort_order: rc.sort_order ?? 9999,
        created_at: '2026-09-06T00:00:00Z',
      });
    });
  });

  return { people, families, children };
}

export function generateVerticalFakeTree(): TreeData {
  return build();
}
