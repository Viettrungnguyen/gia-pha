/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/dev-fake-tree.ts
 * @description Dev-only fake tree generator (500 người, 11 đời).
 *              CHỈ chạy ở local khi NODE_ENV !== 'production' VÀ
 *              NEXT_PUBLIC_USE_FAKE_TREE=1. Production sẽ tự bypass.
 *              Để bật: thêm NEXT_PUBLIC_USE_FAKE_TREE=1 vào .env.local,
 *              restart `npm run dev`. Tắt: xoá/bỏ comment dòng đó.
 * @version 1.0.0
 * @updated 2026-08-05
 */

import type { Child, Family, Person } from '@/types';
import type { TreeData } from '@/lib/supabase-data-families';

const SURNAMES = ['Nguyễn Đình', 'Nguyễn'];
const GIVEN_NAMES = [
  'An', 'Bình', 'Cương', 'Dũng', 'Đức', 'Hà', 'Hải', 'Hiếu', 'Hoa', 'Hùng',
  'Hương', 'Khánh', 'Lan', 'Linh', 'Long', 'Mai', 'Minh', 'My', 'Nam', 'Nga',
  'Nghĩa', 'Nhật', 'Phong', 'Phú', 'Phúc', 'Quang', 'Quốc', 'Sơn', 'Tâm',
  'Thảo', 'Thành', 'Thiện', 'Thu', 'Thủy', 'Tiến', 'Trang', 'Trí', 'Trinh',
  'Tú', 'Tùng', 'Uyên', 'Văn', 'Việt', 'Vũ', 'Xuân', 'Yến',
];

const MIDDLE_PARTS = ['Văn', 'Thị', 'Đức', 'Hữu', 'Công', 'Quang', 'Kim'];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function generateName(gender: 1 | 2, gen: number, idx: number): {
  display_name: string;
  first_name: string;
  middle_name: string;
} {
  const middle = pick(MIDDLE_PARTS, gen * 3 + idx);
  const given = pick(GIVEN_NAMES, gen * 7 + idx * 11 + (gender === 1 ? 0 : 5));
  const surname = gen === 1 ? 'Nguyễn Đình' : 'Nguyễn Đình';
  const firstName = middle;
  const displayName = `${surname} ${middle} ${given}`;
  return { display_name: displayName, first_name: firstName, middle_name: middle };
}

const BASE_YEAR = 1700;
const YEARS_PER_GEN = 28;

export function generateFakeTree(): TreeData {
  const people: Person[] = [];
  const families: Family[] = [];
  const children: Child[] = [];

  let idCounter = 0;
  const nextId = () => `fake-${(++idCounter).toString().padStart(6, '0')}`;

  // Birth year spread per generation
  const birthYear = (gen: number, idx: number) =>
    BASE_YEAR + (gen - 1) * YEARS_PER_GEN + (idx % 7) * 3 - 5;

  // Death year: live ~70 years
  const deathYear = (by: number) => by + 60 + ((by * 13) % 25);

  // Track person ID by (generation, index) for parents lookup
  const idAt = new Map<string, string>();
  const pushId = (gen: number, idx: number, id: string) =>
    idAt.set(`${gen}:${idx}`, id);

  function makePerson(gen: number, idx: number, gender: 1 | 2, chi?: number): Person {
    const { display_name, first_name, middle_name } = generateName(gender, gen, idx);
    const id = nextId();
    pushId(gen, idx, id);
    const by = birthYear(gen, idx);
    const isLiving = gen >= 11;
    return {
      id,
      handle: `fake-${gen}-${idx}`,
      display_name,
      first_name,
      middle_name,
      surname: 'Nguyễn Đình',
      gender,
      generation: gen,
      chi: chi ?? null,
      tree_label: gen === 1 ? 'Tổ' : chi != null ? `Chi ${chi}` : null,
      birth_date: `${by}-01-01`,
      birth_year: by,
      birth_place: 'Làng Hòa Ngãi, Thanh Hà, Thanh Liêm, Hà Nam',
      death_date: isLiving ? null : `${deathYear(by)}-01-01`,
      death_year: isLiving ? null : deathYear(by),
      death_place: null,
      death_lunar: null,
      is_living: isLiving,
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
      created_at: '2026-08-05T00:00:00Z',
      updated_at: '2026-08-05T00:00:00Z',
    };
  }

  // Đời 1: 1 cặp (Tổ + Tổ)
  const gen1Father = makePerson(1, 0, 1);
  gen1Father.tree_label = 'Tổ';
  people.push(gen1Father);
  const gen1Mother = makePerson(1, 1, 2);
  gen1Mother.tree_label = 'Tổ Mẫu';
  people.push(gen1Mother);

  const gen1Family: Family = {
    id: nextId(),
    father_id: gen1Father.id,
    mother_id: gen1Mother.id,
    marriage_date: `${birthYear(1, 0) + 20}-02-15`,
    marriage_place: 'Làng Hòa Ngãi',
    notes: 'Đôi tổ tiên dòng họ',
    sort_order: 0,
    created_at: '2026-08-05T00:00:00Z',
    updated_at: '2026-08-05T00:00:00Z',
  };
  families.push(gen1Family);

  // Đời 2..11
  // Expected count ~535 người qua 11 đời (gen 1: 2, sau đó tăng dần rồi plateau ~80/gen cuối)
  const CHILDREN_PER_FAMILY_BY_GEN: Record<number, number> = {
    2: 6,
    3: 4,
    4: 4,
    5: 3,
    6: 3,
    7: 3,
    8: 2,
    9: 2,
    10: 2,
    11: 2,
  };

  // Parent family for each (gen, idx) — store family of that person
  const parentFamilyOfPerson = new Map<string, string>();

  // BFS: từ generation 1 → build children forward
  const generationCounts: Record<number, number> = { 1: 1 }; // 1 father count
  // We'll iterate: for each person in gen G, create their own family and children in gen G+1
  const peopleByGen: Record<number, Person[]> = { 1: [gen1Father, gen1Mother] };

  for (let gen = 1; gen < 11; gen++) {
    const currentGenPeople = peopleByGen[gen] ?? [];
    const nextGenChildrenList: Person[] = [];
    let chiCounter = 0;

    for (let i = 0; i < currentGenPeople.length; i += 2) {
      const father = currentGenPeople[i];
      const mother = currentGenPeople[i + 1] ?? currentGenPeople[i];
      // Couple family
      const coupleFamily: Family = {
        id: nextId(),
        father_id: father.gender === 1 ? father.id : mother.id,
        mother_id: mother.gender === 2 ? mother.id : father.id,
        marriage_date: `${birthYear(gen, i) + 20}-02-15`,
        marriage_place: 'Làng Hòa Ngãi',
        notes: null,
        sort_order: i,
        created_at: '2026-08-05T00:00:00Z',
        updated_at: '2026-08-05T00:00:00Z',
      };
      families.push(coupleFamily);

      const numChildren = CHILDREN_PER_FAMILY_BY_GEN[gen + 1] ?? 2;
      for (let c = 0; c < numChildren; c++) {
        const childGender: 1 | 2 = (gen * 3 + c) % 2 === 0 ? 1 : 2;
        const child = makePerson(gen + 1, chiCounter, childGender, gen === 1 ? c + 1 : undefined);
        nextGenChildrenList.push(child);
        parentFamilyOfPerson.set(child.id, coupleFamily.id);

        const childRow: Child = {
          id: nextId(),
          family_id: coupleFamily.id,
          person_id: child.id,
          sort_order: c,
          created_at: '2026-08-05T00:00:00Z',
        };
        children.push(childRow);
        chiCounter++;
      }
    }

    // Pair up next gen into couples (man + woman alternating)
    const nextGenCouples: Person[] = [];
    for (let i = 0; i < nextGenChildrenList.length; i += 2) {
      const a = nextGenChildrenList[i];
      const b = nextGenChildrenList[i + 1] ?? nextGenChildrenList[i];
      nextGenCouples.push(a, b);
    }
    people.push(...nextGenChildrenList);
    peopleByGen[gen + 1] = nextGenCouples;
    generationCounts[gen + 1] = nextGenChildrenList.length;
  }

  return { people, families, children };
}