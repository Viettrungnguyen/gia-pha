/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase/local-seed-expansion.ts
 * @description Mở rộng local seed: thêm ~500 người qua 6 đời tiếp theo (đời 6-11).
 *              Hợp nhất với local-seed.ts (đời 1-5, ~50 người) trong local-shim.ts.
 *              Bật bằng NEXT_PUBLIC_USE_FAKE_TREE=1 (dev-only) hoặc mặc định bật
 *              nếu NEXT_PUBLIC_LOCAL_MODE=true.
 * @version 1.0.0
 * @updated 2026-08-05
 */

import type { Child, Family, Person } from '@/types';
import {
  PEOPLE_SEED,
  FAMILIES_SEED,
  CHILDREN_SEED,
} from './local-seed';

const T = '2026-01-01T00:00:00.000Z';

const personDefaults: Omit<Person, 'id' | 'created_at' | 'updated_at'> = {
  handle: '',
  display_name: '',
  first_name: null,
  middle_name: null,
  surname: 'Nguyễn Đình',
  gender: null,
  generation: 1,
  chi: null,
  tree_label: null,
  birth_date: null,
  birth_year: null,
  birth_place: null,
  death_date: null,
  death_year: null,
  death_place: null,
  death_lunar: null,
  is_living: true,
  is_patrilineal: true,
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
};

const familyDefaults: Omit<Family, 'id' | 'created_at' | 'updated_at'> = {
  father_id: null,
  mother_id: null,
  marriage_date: null,
  marriage_place: null,
  notes: null,
  sort_order: 0,
};

function mkP(
  id: string,
  data: Partial<Omit<Person, 'id' | 'created_at' | 'updated_at'>>
): Person {
  return {
    ...personDefaults,
    ...data,
    id,
    created_at: T,
    updated_at: T,
  };
}

function mkF(
  id: string,
  data: Partial<Omit<Family, 'id' | 'created_at' | 'updated_at'>>
): Family {
  return {
    ...familyDefaults,
    ...data,
    id,
    created_at: T,
    updated_at: T,
  };
}

function mkC(
  id: string,
  familyId: string,
  personId: string,
  sortOrder: number
): Child {
  return {
    id,
    family_id: familyId,
    person_id: personId,
    sort_order: sortOrder,
    created_at: T,
  };
}

const SURNAMES_FEMALE = ['Nguyễn Thị', 'Trần Thị', 'Lê Thị', 'Phạm Thị'];
const GIVEN_NAMES_MALE = [
  'An', 'Bình', 'Cương', 'Dũng', 'Đức', 'Hải', 'Hiếu', 'Hùng', 'Khánh',
  'Long', 'Minh', 'Nam', 'Nghĩa', 'Phong', 'Phú', 'Phúc', 'Quang', 'Quốc',
  'Sơn', 'Thành', 'Thiện', 'Tiến', 'Trí', 'Tú', 'Tùng', 'Văn', 'Việt', 'Vũ', 'Xuân',
];
const GIVEN_NAMES_FEMALE = [
  'Anh', 'Hà', 'Hoa', 'Hương', 'Lan', 'Linh', 'Mai', 'My', 'Nga', 'Phương',
  'Quyên', 'Tâm', 'Thảo', 'Thu', 'Thủy', 'Trang', 'Trinh', 'Uyên', 'Yến', 'Tuyết',
];
const MIDDLE_PARTS = ['Văn', 'Đức', 'Hữu', 'Công', 'Quang', 'Kim', 'Thế', 'Bảo'];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

/**
 * Sinh thêm ~500 người qua 6 đời tiếp theo (đời 6-11).
 *
 * Cách tiếp cận: mỗi người ở đời G tự lập gia đình "mới" với một spouse sinh cùng
 * đợt, sinh ra N con đời G+1. Điều này giúp số người tăng đều qua từng thế hệ
 * thay vì phụ thuộc vào việc ghép cặp xuyên thế hệ (chỉ giới hạn bởi 2 người/cặp).
 */
function generateExpansion(): {
  people: Person[];
  families: Family[];
  children: Child[];
} {
  const people: Person[] = [];
  const families: Family[] = [];
  const children: Child[] = [];

  // Số con mỗi family, theo đời của family (đời 6 → sinh con đời 7, ...)
  // Mục tiêu: tổng expansion ~485 người mới + 50 seed gốc ≈ 535.
  const CHILDREN_PER_FAMILY_BY_GEN: Record<number, number> = {
    6: 2,
    7: 2,
    8: 3,
    9: 1,
    10: 1,
    11: 1,
  };

  let idSeq = 100_000;
  const nextId = (prefix: string) => `${prefix}_${(++idSeq).toString(36)}`;

  // Birth year tương ứng với đời: đời 6 ~ 1955, đời 11 ~ 2010
  function birthYear(gen: number, idx: number): number {
    return 1900 + (gen - 1) * 11 + ((idx * 7) % 11) - 5;
  }

  // Thế hệ nguồn: tất cả person ở đời 5 từ seed (chỉ 5 người — quá ít).
  // Để base đủ rộng, ta tạo thêm vài "thế hệ nền" ảo ở đời 6 để bắt đầu.
  // Mỗi người đời 5 sẽ là cha/mẹ của 3 người đời 6 (mỗi người tự ghép với 1 spouse).
  const seedGen5 = PEOPLE_SEED.filter((p) => p.generation === 5);
  if (seedGen5.length === 0) {
    return { people, families, children };
  }

  let nextGenPeople: Person[] = [];

  // Bước 1: Sinh đời 6 từ đời 5
  // Mỗi người đời 5 ghép với 1 spouse "sinh cùng đợt" (cũng đời 6, không thuộc nhánh cha)
  // → tạo family → sinh 3 con đời 6 (sẽ chuyển đời 6 → đời 7 sau).
  //
  // Nhưng để đơn giản hơn: mỗi người đời 5 tự sinh thẳng đời 6 với 1 spouse cùng gen 5.
  // Ta pair người đời 5 với nhau. Với 5 người → 2 cặp + 1 dư → 2 family × 3 con = 6 người đời 6.
  //
  // Đó vẫn quá ít. Cách tốt hơn: tạo base lớn ở đời 6 bằng cách nhân đôi qua nhiều chi.
  //
  // → Chiến lược: 5 người đời 5 × 3 con/người (giả định mỗi người đời 5 có 3 family riêng với 3 spouse khác nhau)
  //   = 15 người đời 6. Mỗi người đời 6 lại sinh 3 con → 45 người đời 7.
  //   V.v. đến đời 11 với N=2 sẽ tăng chậm lại.

  // Chiến lược: Với mỗi người ở đời G, tạo 1 family "ảo" ghép với 1 spouse sinh cùng đợt,
  // sinh N con. Spouse không thuộc cây phả hệ → chỉ để có family hoàn chỉnh cho display.
  //
  // Cách cài đặt rõ ràng: parent generation gốc = đời 5 (5 người).
  // Vòng 1: tạo families cho 5 người đời 5, mỗi family có 1 spouse, sinh con đời 6.
  //         Con đời 6 sẽ lập family riêng ở vòng tiếp theo.
  let currentGenParents: Person[] = seedGen5;
  let chiGlobal = 1;

  for (let gen = 6; gen <= 11; gen++) {
    const numChildren = CHILDREN_PER_FAMILY_BY_GEN[gen] ?? 2;
    const nextGenChildren: Person[] = [];

    for (let pi = 0; pi < currentGenParents.length; pi++) {
      const parent = currentGenParents[pi];

      // Tạo spouse (cùng đời cha, không thuộc seed chính)
      const isMale = pi % 2 === 0 ? parent.gender !== 1 : parent.gender === 1;
      const spouseGender: 1 | 2 = isMale ? 1 : 2;
      const isFemaleSpouse = spouseGender === 2;
      const spouseGiven = isFemaleSpouse
        ? pick(GIVEN_NAMES_FEMALE, gen * 11 + pi * 5)
        : pick(GIVEN_NAMES_MALE, gen * 7 + pi * 3);
      const spouseSurname = isFemaleSpouse
        ? pick(SURNAMES_FEMALE, gen + pi)
        : 'Nguyễn Đình';
      const spouseDisplay = isFemaleSpouse
        ? `${spouseSurname} ${spouseGiven}`
        : `Nguyễn Đình ${pick(MIDDLE_PARTS, gen + pi)} ${spouseGiven}`;
      const spouseId = nextId('p_exp');
      const spouseBy = birthYear(gen - 1, pi);
      const spouse = mkP(spouseId, {
        handle: `EXP-SP-${gen}-${pi}`,
        display_name: spouseDisplay,
        first_name: isFemaleSpouse ? spouseGiven : pick(MIDDLE_PARTS, gen + pi),
        middle_name: isFemaleSpouse ? null : pick(MIDDLE_PARTS, gen + pi),
        surname: isFemaleSpouse ? 'Nguyễn' : 'Nguyễn Đình',
        gender: spouseGender,
        generation: gen - 1,
        chi: 99,
        tree_label: null,
        birth_date: `${spouseBy}-01-01`,
        birth_year: spouseBy,
        birth_place: 'Làng Hòa Ngãi',
        is_living: false,
        is_patrilineal: !isFemaleSpouse,
      });
      people.push(spouse);

      // Tạo family (parent + spouse)
      const fatherId = parent.gender === 1 ? parent.id : spouseGender === 1 ? spouse.id : parent.id;
      const motherId = parent.gender === 2 ? parent.id : spouseGender === 2 ? spouse.id : parent.id;
      const famId = nextId('f_exp');
      const family = mkF(famId, {
        father_id: fatherId,
        mother_id: motherId,
        marriage_date: `${spouseBy + 22}-02-15`,
        marriage_place: 'Làng Hòa Ngãi',
        sort_order: pi,
      });
      families.push(family);

      // Sinh con đời `gen`
      for (let c = 0; c < numChildren; c++) {
        const isChildMale = (gen * 13 + pi * 7 + c) % 2 === 0;
        const childGender: 1 | 2 = isChildMale ? 1 : 2;
        const isChildFemale = childGender === 2;
        const given = isChildFemale
          ? pick(GIVEN_NAMES_FEMALE, gen * 11 + pi * 5 + c)
          : pick(GIVEN_NAMES_MALE, gen * 7 + pi * 3 + c);
        const middle = pick(MIDDLE_PARTS, gen * 3 + pi + c);
        const childSurname = isChildFemale
          ? pick(SURNAMES_FEMALE, gen + pi + c)
          : 'Nguyễn Đình';
        const displayName = isChildFemale
          ? `${childSurname} ${given}`
          : `Nguyễn Đình ${middle} ${given}`;
        const by = birthYear(gen, chiGlobal);
        const isLiving = gen >= 11;

        const childId = nextId('p_exp');
        const child = mkP(childId, {
          handle: `EXP-${gen}-${chiGlobal}`,
          display_name: displayName,
          first_name: isChildFemale ? given : middle,
          middle_name: isChildFemale ? null : middle,
          surname: isChildFemale ? 'Nguyễn' : 'Nguyễn Đình',
          gender: childGender,
          generation: gen,
          chi: chiGlobal,
          tree_label: null,
          birth_date: `${by}-01-01`,
          birth_year: by,
          birth_place: 'Làng Hòa Ngãi, Thanh Liêm, Hà Nam',
          death_year: isLiving ? null : by + 65 + ((by * 13) % 25),
          is_living: isLiving,
          is_patrilineal: !isChildFemale,
          occupation: isLiving ? null : 'Nông dân',
        });

        people.push(child);
        nextGenChildren.push(child);
        children.push(mkC(nextId('c_exp'), famId, child.id, c));
        chiGlobal++;
      }
    }

    currentGenParents = nextGenChildren;
  }

  return { people, families, children };
}

/** Gộp seed gốc (đời 1-5) + expansion (đời 6-11) ~ tổng 500-600 người. */
const expansion = generateExpansion();

export const EXPANDED_PEOPLE_SEED: Person[] = [
  ...PEOPLE_SEED,
  ...expansion.people,
];
export const EXPANDED_FAMILIES_SEED: Family[] = [
  ...FAMILIES_SEED,
  ...expansion.families,
];
export const EXPANDED_CHILDREN_SEED: Child[] = [
  ...CHILDREN_SEED,
  ...expansion.children,
];

/**
 * Trả về seed mở rộng hay seed gốc tùy cờ env.
 * Bật mở rộng bằng NEXT_PUBLIC_EXPANDED_SEED=1 (chỉ dev; production tự bypass qua check NODE_ENV).
 */
export function getSeedPeople(): Person[] {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_EXPANDED_SEED === '1'
  ) {
    return EXPANDED_PEOPLE_SEED;
  }
  return PEOPLE_SEED;
}

export function getSeedFamilies(): Family[] {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_EXPANDED_SEED === '1'
  ) {
    return EXPANDED_FAMILIES_SEED;
  }
  return FAMILIES_SEED;
}

export function getSeedChildren(): Child[] {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_EXPANDED_SEED === '1'
  ) {
    return EXPANDED_CHILDREN_SEED;
  }
  return CHILDREN_SEED;
}
