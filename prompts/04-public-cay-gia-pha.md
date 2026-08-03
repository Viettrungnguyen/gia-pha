---
project: NguyenDinhHoaNgai
path: prompts/04-public-cay-gia-pha.md
type: prompt
version: 1.0.0
updated: 2026-07-23
---

# 04 - Public Cây Gia Phả

## 1. Mục tiêu

Trang `/cay-gia-pha` hiển thị sơ đồ cây gia đình trực quan, có thể kéo/zoom, click vào node để xem chi tiết. Có chế độ danh sách theo đời cho mobile/người lớn tuổi.

## 2. Tiêu chí hoàn thành

- [ ] `src/app/(public)/layout.tsx` có site header + footer.
- [ ] `src/app/(public)/cay-gia-pha/page.tsx` hiển thị cây gia phả.
- [ ] Component `src/components/tree/family-tree.tsx` render SVG cây với zoom/pan.
- [ ] Component `src/components/tree/tree-fallback-list.tsx` hiển thị danh sách theo đời.
- [ ] Hook `src/hooks/use-families.ts` lấy `people`, `families`, `children`.
- [ ] Click vào node → điều hướng `/thanh-vien/[id]`.
- [ ] Nút chuyển chế độ cây ↔ danh sách.
- [ ] Mobile responsive (mặc định chế độ danh sách trên < 768px).
- [ ] Smoke test: hiển thị 18 thành viên từ seed.

## 3. File cần tạo

```
src/
├── components/
│   ├── layout/
│   │   ├── site-header.tsx        # NEW
│   │   └── site-footer.tsx        # NEW
│   └── tree/
│       ├── family-tree.tsx        # NEW
│       └── tree-fallback-list.tsx # NEW
├── hooks/
│   └── use-families.ts            # NEW
├── lib/
│   └── supabase-data-families.ts  # NEW
└── app/(public)/
    ├── layout.tsx                 # NEW
    └── cay-gia-pha/
        └── page.tsx               # NEW
```

## 4. Phụ thuộc

- Đã có 18 thành viên seed (từ prompt 02).
- Đã có shadcn/ui primitives (Button, Card, Skeleton từ prompt 03).

## 5. Bước thực hiện

### Bước 1: Tạo `src/components/layout/site-header.tsx`

```tsx
/**
 * @project NguyenDinhHoaNgai
 * @file src/components/layout/site-header.tsx
 * @description Public site header
 * @version 1.0.0
 * @updated 2026-07-23
 */

import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site-config';
import { Users, GitBranchPlus, Calendar, Archive, LogIn } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Trang chủ' },
  { href: '/cay-gia-pha', label: 'Cây gia phả', icon: GitBranchPlus },
  { href: '/thanh-vien', label: 'Thành viên', icon: Users },
  { href: '/lich-cung-le', label: 'Lịch cúng lễ', icon: Calendar },
  { href: '/tai-lieu', label: 'Tài liệu', icon: Archive },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">
            NĐ
          </div>
          <span className="hidden font-semibold sm:inline">{SITE_CONFIG.shortName}</span>
        </Link>

        <nav className="ml-8 hidden gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <Link
            href="/dang-nhap"
            className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng nhập</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
```

### Bước 2: Tạo `src/components/layout/site-footer.tsx`

```tsx
import { SITE_CONFIG } from '@/lib/site-config';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <h3 className="font-semibold">{SITE_CONFIG.name}</h3>
            <p className="mt-2 text-muted-foreground">
              Gia phả điện tử - {SITE_CONFIG.location.village}, {SITE_CONFIG.location.commune},
              {' '}{SITE_CONFIG.location.district}, {SITE_CONFIG.location.province}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Liên kết</h3>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li><a href="/cay-gia-pha" className="hover:underline">Cây gia phả</a></li>
              <li><a href="/thanh-vien" className="hover:underline">Thành viên</a></li>
              <li><a href="/lich-cung-le" className="hover:underline">Lịch cúng lễ</a></li>
              <li><a href="/tai-lieu" className="hover:underline">Tài liệu</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Liên hệ</h3>
            <p className="mt-2 text-muted-foreground">
              Email: admin@nguyen-dinh.local
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              © {new Date().getFullYear()} {SITE_CONFIG.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

### Bước 3: Tạo `src/app/(public)/layout.tsx`

```tsx
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
```

### Bước 4: Tạo `src/lib/supabase-data-families.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase-data-families.ts
 * @description Family tree data layer
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Person, Family, Child } from '@/types';

export interface TreeData {
  people: Person[];
  families: Family[];
  children: Child[];
}

export async function getTreeData(): Promise<TreeData> {
  const supabase = getSupabaseBrowserClient();
  const [peopleRes, familiesRes, childrenRes] = await Promise.all([
    supabase.from('people').select('*').order('generation').order('birth_year'),
    supabase.from('families').select('*'),
    supabase.from('children').select('*').order('sort_order'),
  ]);

  if (peopleRes.error) throw peopleRes.error;
  if (familiesRes.error) throw familiesRes.error;
  if (childrenRes.error) throw childrenRes.error;

  return {
    people: peopleRes.data ?? [],
    families: familiesRes.data ?? [],
    children: childrenRes.data ?? [],
  };
}
```

### Bước 5: Tạo `src/types/index.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/types/index.ts
 * @description Shared types
 * @version 1.0.0
 * @updated 2026-07-23
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
  address: string | null;
  hometown: string | null;
  occupation: string | null;
  biography: string | null;
  notes: string | null;
  avatar_url: string | null;
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
```

### Bước 6: Tạo `src/hooks/use-families.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/hooks/use-families.ts
 * @description Family tree React Query hooks
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { useQuery } from '@tanstack/react-query';
import { getTreeData, type TreeData } from '@/lib/supabase-data-families';

export function useTreeData() {
  return useQuery<TreeData>({
    queryKey: ['tree-data'],
    queryFn: getTreeData,
  });
}
```

### Bước 7: Tạo `src/components/tree/tree-fallback-list.tsx`

```tsx
/**
 * @project NguyenDinhHoaNgai
 * @file src/components/tree/tree-fallback-list.tsx
 * @description List view by generation (mobile / accessibility)
 * @version 1.0.0
 * @updated 2026-07-23
 */

import Link from 'next/link';
import type { Person } from '@/types';

interface Props {
  people: Person[];
}

export function TreeFallbackList({ people }: Props) {
  const byGen = people.reduce<Map<number, Person[]>>((acc, p) => {
    if (!acc.has(p.generation)) acc.set(p.generation, []);
    acc.get(p.generation)!.push(p);
    return acc;
  }, new Map());

  const generations = Array.from(byGen.keys()).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {generations.map((gen) => (
        <div key={gen} className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold text-primary">Đời {gen}</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {byGen.get(gen)!.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/thanh-vien/${p.id}`}
                  className="flex items-center gap-2 rounded-md border-l-4 px-3 py-2 transition-colors hover:bg-muted"
                  style={{
                    borderLeftColor: p.gender === 1 ? '#3b82f6' : '#ec4899',
                  }}
                >
                  <span className="font-medium">{p.display_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.birth_year ?? '?'}
                    {p.death_year ? ` - ${p.death_year}` : p.is_living ? ' - nay' : ''}
                  </span>
                  {!p.is_living && <span className="text-xs">†</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### Bước 8: Tạo `src/components/tree/family-tree.tsx`

> Lưu ý: Đây là phiên bản đơn giản. Có thể tham khảo FamilyTree component của AncestorTree (1500+ dòng) để mở rộng.

```tsx
/**
 * @project NguyenDinhHoaNgai
 * @file src/components/tree/family-tree.tsx
 * @description Family tree SVG visualization
 * @version 1.0.0
 * @updated 2026-07-23
 */

'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import type { Person, Family, Child } from '@/types';

interface Props {
  people: Person[];
  families: Family[];
  children: Child[];
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 50;
const LEVEL_HEIGHT = 110;
const HORIZONTAL_GAP = 30;

export function FamilyTree({ people, families, children }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Build positions by generation
  const positions = useMemo(() => {
    const byGen = people.reduce<Map<number, Person[]>>((acc, p) => {
      if (!acc.has(p.generation)) acc.set(p.generation, []);
      acc.get(p.generation)!.push(p);
      return acc;
    }, new Map());

    const pos = new Map<string, { x: number; y: number }>();
    Array.from(byGen.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([gen, persons]) => {
        persons.forEach((p, i) => {
          pos.set(p.id, {
            x: i * (NODE_WIDTH + HORIZONTAL_GAP),
            y: (gen - 1) * LEVEL_HEIGHT,
          });
        });
      });
    return pos;
  }, [people]);

  // Compute bounding box
  const bbox = useMemo(() => {
    if (positions.size === 0) return { width: 800, height: 600 };
    const xs = Array.from(positions.values()).map((p) => p.x);
    const ys = Array.from(positions.values()).map((p) => p.y);
    return {
      width: Math.max(...xs) + NODE_WIDTH + 40,
      height: Math.max(...ys) + NODE_HEIGHT + 40,
    };
  }, [positions]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.3, Math.min(3, z + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative overflow-hidden rounded-lg border bg-card">
      <svg
        ref={svgRef}
        className="h-[70vh] w-full cursor-grab"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Spouse lines (pink) */}
          {families.map((f) => {
            if (!f.father_id || !f.mother_id) return null;
            const f1 = positions.get(f.father_id);
            const f2 = positions.get(f.mother_id);
            if (!f1 || !f2) return null;
            return (
              <line
                key={`sp-${f.id}`}
                x1={f1.x + NODE_WIDTH}
                y1={f1.y + NODE_HEIGHT / 2}
                x2={f2.x}
                y2={f2.y + NODE_HEIGHT / 2}
                stroke="#ec4899"
                strokeWidth={2}
              />
            );
          })}

          {/* Parent-child lines (black) */}
          {families.flatMap((f) => {
            const childrenOfFamily = children
              .filter((c) => c.family_id === f.id)
              .map((c) => positions.get(c.person_id))
              .filter(Boolean) as { x: number; y: number }[];

            if (childrenOfFamily.length === 0) return [];
            const parentX = (() => {
              if (f.father_id && positions.get(f.father_id)) return positions.get(f.father_id)!.x + NODE_WIDTH / 2;
              if (f.mother_id && positions.get(f.mother_id)) return positions.get(f.mother_id)!.x + NODE_WIDTH / 2;
              return 0;
            })();
            const parentY = (() => {
              if (f.father_id && positions.get(f.father_id)) return positions.get(f.father_id)!.y + NODE_HEIGHT;
              if (f.mother_id && positions.get(f.mother_id)) return positions.get(f.mother_id)!.y + NODE_HEIGHT;
              return 0;
            })();
            const minChildY = Math.min(...childrenOfFamily.map((c) => c.y));
            const midY = (parentY + minChildY) / 2;

            return [
              // Vertical from parent to midY
              <line
                key={`v-${f.id}`}
                x1={parentX}
                y1={parentY}
                x2={parentX}
                y2={midY}
                stroke="currentColor"
                strokeWidth={1}
              />,
              // Horizontal across children
              <line
                key={`h-${f.id}`}
                x1={Math.min(...childrenOfFamily.map((c) => c.x + NODE_WIDTH / 2))}
                y1={midY}
                x2={Math.max(...childrenOfFamily.map((c) => c.x + NODE_WIDTH / 2))}
                y2={midY}
                stroke="currentColor"
                strokeWidth={1}
              />,
              // Vertical from midY to each child
              ...childrenOfFamily.map((c, i) => (
                <line
                  key={`vc-${f.id}-${i}`}
                  x1={c.x + NODE_WIDTH / 2}
                  y1={midY}
                  x2={c.x + NODE_WIDTH / 2}
                  y2={c.y}
                  stroke="currentColor"
                  strokeWidth={1}
                />
              )),
            ];
          })}

          {/* Nodes */}
          {people.map((p) => {
            const pos = positions.get(p.id);
            if (!pos) return null;
            return (
              <Link key={p.id} href={`/thanh-vien/${p.id}`}>
                <g transform={`translate(${pos.x}, ${pos.y})`}>
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={6}
                    fill="white"
                    stroke={p.gender === 1 ? '#3b82f6' : '#ec4899'}
                    strokeWidth={2}
                    className="hover:fill-accent"
                  />
                  <text
                    x={NODE_WIDTH / 2}
                    y={20}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={500}
                    fill="currentColor"
                  >
                    {p.display_name.length > 18
                      ? p.display_name.slice(0, 18) + '...'
                      : p.display_name}
                  </text>
                  <text
                    x={NODE_WIDTH / 2}
                    y={38}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#666"
                  >
                    Đời {p.generation}
                    {p.birth_year ? ` · ${p.birth_year}` : ''}
                    {!p.is_living ? ' †' : ''}
                  </text>
                </g>
              </Link>
            );
          })}
        </g>
      </svg>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2 rounded-md border bg-background p-1 shadow-md">
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
          className="rounded px-2 py-1 text-sm hover:bg-muted"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}
          className="rounded px-2 py-1 text-sm hover:bg-muted"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="rounded px-2 py-1 text-sm hover:bg-muted"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
```

### Bước 9: Tạo `src/app/(public)/cay-gia-pha/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTreeData } from '@/hooks/use-families';
import { TreeFallbackList } from '@/components/tree/tree-fallback-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranchPlus, List } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FamilyTree = dynamic(
  () => import('@/components/tree/family-tree').then((m) => m.FamilyTree),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[70vh] w-full" />,
  }
);

export default function CayGiaPhaPage() {
  const { data, isLoading, error } = useTreeData();
  const [mode, setMode] = useState<'tree' | 'list'>('tree');

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Lỗi khi tải dữ liệu: {error.message}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-primary">
            <GitBranchPlus className="h-7 w-7" />
            Cây Gia Phả
          </h1>
          <p className="mt-1 text-muted-foreground">
            Sơ đồ cây gia đình dòng họ Nguyễn Đình — kéo để di chuyển, scroll để zoom
          </p>
        </div>
        <div className="flex gap-1 rounded-md border p-1">
          <Button
            variant={mode === 'tree' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('tree')}
          >
            <GitBranchPlus className="mr-1 h-4 w-4" /> Cây
          </Button>
          <Button
            variant={mode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('list')}
          >
            <List className="mr-1 h-4 w-4" /> Danh sách
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-[70vh] w-full" />
      ) : mode === 'tree' ? (
        <FamilyTree people={data.people} families={data.families} children={data.children} />
      ) : (
        <TreeFallbackList people={data.people} />
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Chú thích</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="inline-block h-3 w-3 rounded border-2 border-blue-500" /> Viền
            xanh = Nam
          </p>
          <p>
            <span className="inline-block h-3 w-3 rounded border-2 border-pink-500" /> Viền
            hồng = Nữ
          </p>
          <p>
            <span className="text-pink-500">Đường hồng</span> = Quan hệ vợ chồng
          </p>
          <p>† = Đã mất</p>
        </CardContent>
      </Card>
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

- [ ] Vào `/cay-gia-pha` → hiển thị SVG cây với 18 nodes.
- [ ] Kéo chuột → pan hoạt động.
- [ ] Scroll → zoom in/out.
- [ ] Click vào node → điều hướng `/thanh-vien/[id]`.
- [ ] Click nút "Danh sách" → chuyển sang list view theo đời.
- [ ] Mobile (<768px): mặc định vào chế độ danh sách? (Hiện chưa auto, có thể thêm media query sau).
- [ ] Hover node → đổi màu.

## 7. Lưu ý rủi ro

- **Layout không tối ưu:** Phiên bản này chỉ sắp xếp theo `generation` rồi `birth_year`. Có thể người cùng đời sẽ bị chồng nếu cùng vị trí. Có thể tham khảo thuật toán của AncestorTree (1500+ dòng) nếu cần layout đẹp hơn.
- **SVG performance:** Với 100+ người có thể chậm. Nếu dòng họ > 200 người, cần virtualization.
- **Touch events:** Chưa hỗ trợ pinch-zoom trên mobile. Có thể thêm `@use-gesture/react`.
- **Mobile auto-switch:** Hiện chưa có logic tự động chuyển sang list view trên mobile. Có thể thêm `useMediaQuery` hook.

## 8. Liên kết

- [03-auth-dang-nhap.md](03-auth-dang-nhap.md) - Trước đó.
- [05-public-thanh-vien.md](05-public-thanh-vien.md) - Tiếp theo.
- [TECHNICAL-DESIGN.md §3](../docs/02-design/TECHNICAL-DESIGN.md) - Cấu trúc component.
- [SITEMAP-USER-FLOWS.md §4.1](../docs/02-design/SITEMAP-USER-FLOWS.md) - User flow.