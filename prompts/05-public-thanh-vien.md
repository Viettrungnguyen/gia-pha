---
project: NguyenDinhHoaNgai
path: prompts/05-public-thanh-vien.md
type: prompt
version: 1.0.0
updated: 2026-07-23
---

# 05 - Public Thành Viên (List + Detail)

## 1. Mục tiêu

Hai trang `/thanh-vien` (danh sách) và `/thanh-vien/[id]` (chi tiết) hiển thị thông tin đầy đủ các thành viên trong dòng họ.

## 2. Tiêu chí hoàn thành

- [ ] Data layer `supabase-data-people.ts` cung cấp `getPeople`, `getPerson`.
- [ ] Hooks `use-people.ts` wrap React Query.
- [ ] Trang `/thanh-vien` có search + filter (đời, chi, trạng thái).
- [ ] Trang `/thanh-vien/[id]` hiển thị hồ sơ + quan hệ gia đình.
- [ ] Component `person-card.tsx` cho grid.
- [ ] Component `person-detail.tsx` cho trang detail.
- [ ] Smoke test: 18 thành viên từ seed hiển thị, search/filter hoạt động.

## 3. File cần tạo

```
src/
├── lib/
│   └── supabase-data-people.ts     # NEW
├── hooks/
│   └── use-people.ts               # NEW
├── components/
│   └── people/
│       ├── person-card.tsx         # NEW
│       └── person-detail.tsx       # NEW
└── app/(public)/
    ├── thanh-vien/
    │   ├── page.tsx                # NEW
    │   ├── loading.tsx             # NEW
    │   └── [id]/
    │       ├── page.tsx            # NEW
    │       └── loading.tsx         # NEW
```

## 4. Phụ thuộc

- Đã có 18 thành viên seed.
- Đã có `src/types/index.ts` (từ prompt 04).
- Đã có `src/app/(public)/layout.tsx` (từ prompt 04).

## 5. Bước thực hiện

### Bước 1: Tạo `src/lib/supabase-data-people.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase-data-people.ts
 * @description People data layer
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Person } from '@/types';

export async function getPeople(): Promise<Person[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('generation')
    .order('birth_year');

  if (error) throw error;
  return data ?? [];
}

export async function getPerson(id: string): Promise<Person | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function searchPeople(query: string, limit = 20): Promise<Person[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .or(`display_name.ilike.%${query}%,first_name.ilike.%${query}%,middle_name.ilike.%${query}%`)
    .order('display_name')
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
```

### Bước 2: Tạo `src/hooks/use-people.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/hooks/use-people.ts
 * @description People React Query hooks
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { useQuery } from '@tanstack/react-query';
import { getPeople, getPerson, searchPeople } from '@/lib/supabase-data-people';
import type { Person } from '@/types';

export function usePeople() {
  return useQuery<Person[]>({
    queryKey: ['people'],
    queryFn: getPeople,
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
```

### Bước 3: Tạo `src/components/people/person-card.tsx`

```tsx
/**
 * @project NguyenDinhHoaNgai
 * @file src/components/people/person-card.tsx
 * @description Person card for grid display
 * @version 1.0.0
 * @updated 2026-07-23
 */

import Link from 'next/link';
import type { Person } from '@/types';

interface Props {
  person: Person;
}

export function PersonCard({ person }: Props) {
  const borderColor = person.gender === 1 ? 'border-l-blue-500' : 'border-l-pink-500';

  return (
    <Link
      href={`/thanh-vien/${person.id}`}
      className={`block rounded-lg border border-l-4 ${borderColor} bg-card p-4 shadow-sm transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
          {person.avatar_url ? (
            <img
              src={person.avatar_url}
              alt={person.display_name}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            person.display_name.charAt(0)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{person.display_name}</h3>
            {!person.is_living && <span className="text-xs">†</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            Đời {person.generation}
            {person.chi ? ` · Chi ${person.chi}` : ''}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {person.birth_year ?? '?'}
            {' - '}
            {person.is_living ? 'nay' : person.death_year ?? '?'}
          </p>
          {person.occupation && (
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {person.occupation}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
```

### Bước 4: Tạo `src/components/people/person-detail.tsx`

```tsx
/**
 * @project NguyenDinhHoaNgai
 * @file src/components/people/person-detail.tsx
 * @description Person full profile view
 * @version 1.0.0
 * @updated 2026-07-23
 */

import Link from 'next/link';
import type { Person, Family, Child } from '@/types';

interface Props {
  person: Person;
  families: Family[];
  children: Child[];
  allPeople: Person[];
}

export function PersonDetail({ person, families, children, allPeople }: Props) {
  const peopleById = new Map(allPeople.map((p) => [p.id, p]));

  // Tìm family mà person là father hoặc mother
  const ownFamilies = families.filter(
    (f) => f.father_id === person.id || f.mother_id === person.id
  );

  // Tìm family mà person là child (thông qua children table)
  const parentFamilyIds = children
    .filter((c) => c.person_id === person.id)
    .map((c) => c.family_id);
  const parentFamilies = families.filter((f) => parentFamilyIds.includes(f.id));

  // Lấy cha mẹ
  const parents = parentFamilies
    .flatMap((f) => [f.father_id, f.mother_id])
    .filter(Boolean)
    .map((id) => peopleById.get(id!))
    .filter(Boolean) as Person[];

  // Lấy vợ chồng
  const spouses = ownFamilies
    .flatMap((f) => {
      const ids: string[] = [];
      if (f.father_id === person.id && f.mother_id) ids.push(f.mother_id);
      if (f.mother_id === person.id && f.father_id) ids.push(f.father_id);
      return ids;
    })
    .map((id) => peopleById.get(id))
    .filter(Boolean) as Person[];

  // Lấy con (từ ownFamilies)
  const ownChildren = ownFamilies
    .flatMap((f) => children.filter((c) => c.family_id === f.id))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => peopleById.get(c.person_id))
    .filter(Boolean) as Person[];

  // Lấy anh chị em ruột (cùng parent family)
  const siblings = parentFamilies
    .flatMap((f) =>
      children.filter((c) => c.family_id === f.id && c.person_id !== person.id)
    )
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => peopleById.get(c.person_id))
    .filter(Boolean) as Person[];

  const Field = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <div>
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-0.5">{value}</dd>
      </div>
    );
  };

  const PersonLink = ({ p }: { p: Person }) => (
    <Link
      href={`/thanh-vien/${p.id}`}
      className="block rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <div className="font-medium">{p.display_name}</div>
      <div className="text-xs text-muted-foreground">
        Đời {p.generation}
        {!p.is_living && ' †'}
      </div>
    </Link>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Cột trái: Thông tin cơ bản */}
      <aside className="lg:col-span-1">
        <div className="rounded-lg border bg-card p-6 text-center">
          {person.avatar_url ? (
            <img
              src={person.avatar_url}
              alt={person.display_name}
              className="mx-auto h-32 w-32 rounded-full object-cover"
            />
          ) : (
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-muted text-5xl font-semibold text-muted-foreground">
              {person.display_name.charAt(0)}
            </div>
          )}
          <h1 className="mt-4 text-2xl font-bold">{person.display_name}</h1>
          {!person.is_living && <p className="text-sm text-muted-foreground">Đã mất †</p>}
          <p className="mt-1 text-sm text-muted-foreground">
            Đời {person.generation}
            {person.chi && ` · Chi ${person.chi}`}
          </p>
        </div>

        <dl className="mt-6 space-y-4 rounded-lg border bg-card p-6">
          <Field label="Họ" value={person.surname} />
          <Field label="Tên đệm" value={person.middle_name} />
          <Field label="Tên" value={person.first_name} />
          <Field label="Giới tính" value={person.gender === 1 ? 'Nam' : person.gender === 2 ? 'Nữ' : null} />
          <Field
            label="Năm sinh"
            value={`${person.birth_year ?? '?'}${person.birth_place ? ` tại ${person.birth_place}` : ''}`}
          />
          {!person.is_living && (
            <>
              <Field
                label="Năm mất"
                value={`${person.death_year ?? '?'}${person.death_place ? ` tại ${person.death_place}` : ''}`}
              />
              <Field label="Ngày giỗ âm lịch" value={person.death_lunar} />
            </>
          )}
          <Field label="Nghề nghiệp" value={person.occupation} />
          <Field label="Quê quán" value={person.hometown} />
          {person.phone && <Field label="Điện thoại" value={person.phone} />}
          {person.email && <Field label="Email" value={person.email} />}
          {person.address && <Field label="Địa chỉ" value={person.address} />}
        </dl>
      </aside>

      {/* Cột phải: Quan hệ + tiểu sử */}
      <div className="space-y-6 lg:col-span-2">
        {/* Quan hệ */}
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Quan hệ gia đình</h2>

          {parents.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Cha mẹ</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {parents.map((p) => <PersonLink key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {siblings.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Anh chị em ruột</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {siblings.map((p) => <PersonLink key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {spouses.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Vợ / Chồng</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {spouses.map((p) => <PersonLink key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {ownChildren.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Con ({ownChildren.length})</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {ownChildren.map((p) => <PersonLink key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {parents.length === 0 && spouses.length === 0 && ownChildren.length === 0 && siblings.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có thông tin quan hệ.</p>
          )}
        </section>

        {/* Tiểu sử */}
        {person.biography && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Tiểu sử</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{person.biography}</p>
          </section>
        )}

        {person.notes && (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Ghi chú</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{person.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}
```

### Bước 5: Tạo `src/app/(public)/thanh-vien/page.tsx`

```tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePeople } from '@/hooks/use-people';
import { PersonCard } from '@/components/people/person-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, X } from 'lucide-react';

export default function ThanhVienPage() {
  const { data: people, isLoading, error } = usePeople();
  const [search, setSearch] = useState('');
  const [genFilter, setGenFilter] = useState<string>('all');
  const [chiFilter, setChiFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Search: lowercase + remove diacritics
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

  const filtered = useMemo(() => {
    if (!people) return [];
    return people.filter((p) => {
      if (search) {
        const haystack = normalize(`${p.display_name} ${p.first_name || ''} ${p.middle_name || ''}`);
        if (!haystack.includes(normalize(search))) return false;
      }
      if (genFilter !== 'all' && p.generation !== parseInt(genFilter)) return false;
      if (chiFilter !== 'all' && p.chi !== parseInt(chiFilter)) return false;
      if (statusFilter === 'living' && !p.is_living) return false;
      if (statusFilter === 'deceased' && p.is_living) return false;
      return true;
    });
  }, [people, search, genFilter, chiFilter, statusFilter]);

  const generations = useMemo(
    () => people ? Array.from(new Set(people.map((p) => p.generation))).sort((a, b) => a - b) : [],
    [people]
  );
  const chis = useMemo(
    () => people ? Array.from(new Set(people.filter((p) => p.chi).map((p) => p.chi!))).sort((a, b) => a - b) : [],
    [people]
  );

  const clearFilters = () => {
    setSearch('');
    setGenFilter('all');
    setChiFilter('all');
    setStatusFilter('all');
  };

  const hasFilters = search || genFilter !== 'all' || chiFilter !== 'all' || statusFilter !== 'all';

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Thành viên</h1>
          <p className="text-sm text-muted-foreground">
            {people ? `${people.length} người trong ${generations.length} đời` : 'Đang tải...'}
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={genFilter}
              onChange={(e) => setGenFilter(e.target.value)}
            >
              <option value="all">Tất cả đời</option>
              {generations.map((g) => (
                <option key={g} value={g}>Đời {g}</option>
              ))}
            </select>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={chiFilter}
              onChange={(e) => setChiFilter(e.target.value)}
            >
              <option value="all">Tất cả chi</option>
              {chis.map((c) => (
                <option key={c} value={c}>Chi {c}</option>
              ))}
            </select>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="living">Còn sống</option>
              <option value="deceased">Đã mất</option>
            </select>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" />
              Xóa bộ lọc
            </Button>
          )}
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Lỗi khi tải dữ liệu: {error.message}</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {hasFilters ? (
              <>
                <p>Không tìm thấy kết quả phù hợp.</p>
                <Button variant="link" onClick={clearFilters}>Xóa bộ lọc</Button>
              </>
            ) : (
              <p>Chưa có thành viên nào trong database.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Hiển thị {filtered.length} / {people?.length ?? 0} người
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
```

### Bước 6: Tạo `src/app/(public)/thanh-vien/loading.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Skeleton className="mb-4 h-10 w-48" />
      <Skeleton className="mb-6 h-32 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </main>
  );
}
```

### Bước 7: Tạo `src/app/(public)/thanh-vien/[id]/page.tsx`

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PersonDetail } from '@/components/people/person-detail';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('people').select('display_name').eq('id', id).single();
  return {
    title: data?.display_name || 'Thành viên',
  };
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [personRes, familiesRes, childrenRes, allPeopleRes] = await Promise.all([
    supabase.from('people').select('*').eq('id', id).single(),
    supabase.from('families').select('*'),
    supabase.from('children').select('*').order('sort_order'),
    supabase.from('people').select('*').order('generation').order('birth_year'),
  ]);

  if (personRes.error || !personRes.data) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/thanh-vien">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Link>
        </Button>
      </div>

      <PersonDetail
        person={personRes.data}
        families={familiesRes.data ?? []}
        children={childrenRes.data ?? []}
        allPeople={allPeopleRes.data ?? []}
      />
    </main>
  );
}
```

### Bước 8: Tạo `src/app/(public)/thanh-vien/[id]/loading.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Skeleton className="mb-4 h-8 w-32" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-1" />
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </main>
  );
}
```

## 6. Smoke test

```bash
cd frontend
pnpm tsc && pnpm lint && pnpm build
pnpm dev
```

Verify:

- [ ] Vào `/thanh-vien` → hiển thị 18 cards.
- [ ] Tìm "tuấn" → hiển thị "Nguyễn Đình Tuấn".
- [ ] Filter đời = 1 → chỉ hiển thị thủy tổ + bà.
- [ ] Filter "Còn sống" → chỉ hiển thị đời 4-5.
- [ ] Click vào một card → vào `/thanh-vien/[id]`.
- [ ] Trang detail hiển thị thông tin + quan hệ (cha mẹ, con, vợ chồng, anh chị em).
- [ ] Click vào người liên quan → điều hướng đúng.

## 7. Lưu ý rủi ro

- **Search chưa fuzzy:** Dùng substring match. Nếu cần fuzzy (chính tả), thêm Fuse.js.
- **Diacritics:** Đã normalize cơ bản; có thể thiếu một số trường hợp đặc biệt.
- **Server-side rendering cho detail page:** Dùng Server Component cho SEO + performance.
- **Family queries:** Có thể tối ưu bằng cách chỉ query family liên quan, không cần load tất cả. Nhưng MVP chấp nhận được vì 18 người.

## 8. Liên kết

- [04-public-cay-gia-pha.md](04-public-cay-gia-pha.md) - Trước đó.
- [06-public-lich-cung-le.md](06-public-lich-cung-le.md) - Tiếp theo.
- [BRD.md §3.1.3](../docs/01-planning/BRD.md) - Yêu cầu FR-PUB-03, FR-PUB-04.