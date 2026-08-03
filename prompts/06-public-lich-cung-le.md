---
project: NguyenDinhHoaNgai
path: prompts/06-public-lich-cung-le.md
type: prompt
version: 1.0.0
updated: 2026-07-23
---

# 06 - Public Lịch Cúng Lễ

## 1. Mục tiêu

Trang `/lich-cung-le` hiển thị lịch tháng kết hợp danh sách sự kiện, hỗ trợ cả ngày dương và âm lịch.

## 2. Tiêu chí hoàn thành

- [ ] Data layer `supabase-data-events.ts` cung cấp `getEvents`.
- [ ] Hook `use-events.ts` wrap React Query.
- [ ] Trang `/lich-cung-le` có 2 tabs: Lịch tháng và Danh sách.
- [ ] Banner "Sắp tới" hiển thị top 5 sự kiện trong 60 ngày.
- [ ] Lịch tháng có nút chuyển tháng, hiển thị badge màu cho ngày có sự kiện.
- [ ] Auto-generate sự kiện giỗ từ `people.death_lunar`.
- [ ] Smoke test: hiển thị ~14 events từ seed.

## 3. File cần tạo

```
src/
├── lib/
│   ├── lunar-calendar.ts                  # NEW
│   └── supabase-data-events.ts            # NEW
├── hooks/
│   └── use-events.ts                      # NEW
├── components/
│   └── events/
│       ├── event-card.tsx                 # NEW
│       ├── event-calendar-grid.tsx        # NEW
│       └── event-constants.ts             # NEW
└── app/(public)/
    └── lich-cung-le/
        ├── page.tsx                       # NEW
        └── loading.tsx                    # NEW
```

## 4. Phụ thuộc

- Có seed events (~14 rows từ prompt 02).
- Có `Event` type từ prompt 04.

## 5. Bước thực hiện

### Bước 1: Tạo `src/lib/lunar-calendar.ts`

> Thư viện chuyển đổi âm/dương đơn giản. Production có thể dùng `am-lich` package, nhưng để giảm deps, dùng lookup table.

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/lunar-calendar.ts
 * @description Lunar-Solar calendar conversion (simplified)
 * @version 1.0.0
 * @updated 2026-07-23
 *
 * For accurate conversion, use a dedicated library like `am-lich`.
 * This is a simplified version for displaying upcoming events.
 */

export const MONTHS_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

/**
 * Parse lunar date string "DD/MM" → { day, month }
 */
export function parseLunarString(s: string | null | undefined): { day: number; month: number } | null {
  if (!s) return null;
  const match = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (day < 1 || day > 30 || month < 1 || month > 12) return null;
  return { day, month };
}

/**
 * Get next occurrence of a lunar date in solar calendar.
 * Approximate: add days based on lunar month length.
 * For exact: need full lunar-solar conversion (out of MVP scope).
 *
 * Strategy: find a solar date in current/next year whose solar-to-lunar
 * conversion matches the target. Since we don't have a full conversion,
 * we'll use a heuristic: lunar months typically start ~11 days earlier
 * each solar year. So estimate the offset.
 */
export function getNextLunarOccurrence(lunarDay: number, lunarMonth: number, from: Date = new Date()): Date {
  // Simplified: assume lunar date roughly corresponds to mid-lunar-month.
  // Add (lunarMonth - 1) months and (lunarDay - 15) days offset from a reference point.
  // Reference: lunar new year 2024 was Feb 10. For other years, adjust.
  // For MVP, just return approximate date in the same month.
  const year = from.getFullYear();
  const result = new Date(year, lunarMonth - 1, lunarDay);
  // If date is in the past, move to next year
  if (result < from) {
    result.setFullYear(year + 1);
  }
  return result;
}

export function formatLunarDate(day: number, month: number): string {
  return `${day}/${month} âm lịch`;
}

/**
 * Days in a given month (1-12)
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
```

### Bước 2: Tạo `src/lib/supabase-data-events.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase-data-events.ts
 * @description Events data layer
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Event } from '@/types';

export async function getEvents(): Promise<Event[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}
```

### Bước 3: Tạo `src/hooks/use-events.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getEvents } from '@/lib/supabase-data-events';
import type { Event } from '@/types';

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: getEvents,
  });
}
```

### Bước 4: Tạo `src/components/events/event-constants.ts`

```typescript
import { Calendar, Users, Sparkles, MoreHorizontal } from 'lucide-react';
import type { EventType } from '@/types';

export const EVENT_TYPE_LABELS: Record<EventType, { label: string; icon: typeof Calendar; color: string }> = {
  gio:    { label: 'Giỗ',        icon: Calendar,       color: 'bg-amber-100 text-amber-700' },
  hop_ho: { label: 'Họp họ',     icon: Users,          color: 'bg-blue-100 text-blue-700' },
  le_tet: { label: 'Lễ tết',     icon: Sparkles,       color: 'bg-pink-100 text-pink-700' },
  other:  { label: 'Khác',       icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' },
};

export const MONTHS_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];
```

### Bước 5: Tạo `src/components/events/event-card.tsx`

```tsx
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EVENT_TYPE_LABELS } from './event-constants';
import type { Event, Person } from '@/types';

interface Props {
  event: Event;
  person?: Person;
  nextDate?: Date;
  daysUntil?: number;
}

export function EventCard({ event, person, nextDate, daysUntil }: Props) {
  const typeInfo = EVENT_TYPE_LABELS[event.event_type];
  const TypeIcon = typeInfo.icon;

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeInfo.color}`}>
          <TypeIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{event.title}</h3>
            {event.recurring && (
              <Badge variant="outline" className="text-xs">Hàng năm</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {nextDate ? nextDate.toLocaleDateString('vi-VN') : '—'}
            {event.event_lunar && ` · ${event.event_lunar} âm lịch`}
            {person && (
              <>
                {' · '}
                <Link href={`/thanh-vien/${person.id}`} className="hover:underline">
                  {person.display_name}
                </Link>
              </>
            )}
            {event.location && ` · ${event.location}`}
          </p>
        </div>
        {typeof daysUntil === 'number' && (
          <Badge variant={daysUntil <= 7 ? 'destructive' : daysUntil <= 30 ? 'default' : 'secondary'}>
            {daysUntil === 0 ? 'Hôm nay' : `${daysUntil} ngày`}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
```

### Bước 6: Tạo `src/components/events/event-calendar-grid.tsx`

```tsx
import { EVENT_TYPE_LABELS, MONTHS_VI } from './event-constants';
import { daysInMonth } from '@/lib/lunar-calendar';
import type { Event, Person } from '@/types';

interface Props {
  month: number; // 1-12
  year: number;
  events: Event[];
  people: Person[];
}

export function EventCalendarGrid({ month, year, events, people }: Props) {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const totalDays = daysInMonth(year, month);
  const cells: Array<{ day: number | null; events: Event[] }> = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, events: [] });
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = events.filter((e) => e.event_date === dateStr);
    cells.push({ day: d, events: dayEvents });
  }

  const peopleById = new Map(people.map((p) => [p.id, p]));

  return (
    <div className="rounded-lg border bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/30 text-center text-xs font-medium">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          if (cell.day === null) {
            return <div key={i} className="aspect-square border-b border-r bg-muted/10" />;
          }
          return (
            <div
              key={i}
              className="aspect-square overflow-hidden border-b border-r p-1 text-xs"
            >
              <div className="font-medium">{cell.day}</div>
              <div className="mt-1 space-y-1">
                {cell.events.slice(0, 2).map((ev) => {
                  const info = EVENT_TYPE_LABELS[ev.event_type];
                  return (
                    <div
                      key={ev.id}
                      className={`truncate rounded px-1 py-0.5 ${info.color}`}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  );
                })}
                {cell.events.length > 2 && (
                  <div className="text-xs text-muted-foreground">+{cell.events.length - 2}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Bước 7: Tạo `src/app/(public)/lich-cung-le/page.tsx`

```tsx
'use client';

import { useState, useMemo } from 'react';
import { useEvents } from '@/hooks/use-events';
import { usePeople } from '@/hooks/use-people';
import { EventCard } from '@/components/events/event-card';
import { EventCalendarGrid } from '@/components/events/event-calendar-grid';
import { EVENT_TYPE_LABELS, MONTHS_VI } from '@/components/events/event-constants';
import { parseLunarString, getNextLunarOccurrence, formatLunarDate } from '@/lib/lunar-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';

export default function LichCungLePage() {
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: people } = usePeople();

  const [tab, setTab] = useState('calendar');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Upcoming events (next 60 days)
  const upcoming = useMemo(() => {
    if (!events || !people) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const result: Array<{
      event: Event;
      person?: Person;
      nextDate: Date;
      daysUntil: number;
      lunarDisplay: string;
      isAuto: boolean;
    }> = [];

    const peopleById = new Map(people.map((p) => [p.id, p]));

    for (const event of events) {
      let nextDate: Date | null = null;
      let lunarDisplay = '';
      if (event.event_lunar) {
        const parsed = parseLunarString(event.event_lunar);
        if (parsed) {
          nextDate = getNextLunarOccurrence(parsed.day, parsed.month, now);
          lunarDisplay = formatLunarDate(parsed.day, parsed.month);
        }
      } else if (event.event_date) {
        nextDate = new Date(event.event_date);
        lunarDisplay = '';
      }
      if (!nextDate) continue;

      const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / 86_400_000);
      if (daysUntil > 60) continue;

      result.push({
        event,
        person: event.person_id ? peopleById.get(event.person_id) : undefined,
        nextDate,
        daysUntil,
        lunarDisplay,
        isAuto: false,
      });
    }

    return result.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [events, people]);

  // Auto-generate gio events from deceased
  const autoGio = useMemo(() => {
    if (!people || !events) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const existingPersonIds = new Set(events.filter((e) => e.person_id).map((e) => e.person_id));

    const result: Array<{
      event: Event;
      person: Person;
      nextDate: Date;
      daysUntil: number;
      lunarDisplay: string;
      isAuto: boolean;
    }> = [];

    for (const person of people) {
      if (person.is_living || !person.death_lunar || existingPersonIds.has(person.id)) continue;
      const parsed = parseLunarString(person.death_lunar);
      if (!parsed) continue;

      const nextDate = getNextLunarOccurrence(parsed.day, parsed.month, now);
      const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / 86_400_000);
      if (daysUntil > 60) continue;

      result.push({
        event: {
          id: `gio-auto-${person.id}`,
          title: `Giỗ ${person.display_name}`,
          event_type: 'gio',
          event_lunar: person.death_lunar,
          event_date: null,
          person_id: person.id,
          location: 'Nhà thờ họ Nguyễn Đình',
          recurring: true,
          description: null,
          created_at: new Date().toISOString(),
        },
        person,
        nextDate,
        daysUntil,
        lunarDisplay: formatLunarDate(parsed.day, parsed.month),
        isAuto: true,
      });
    }
    return result.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [people, events]);

  const allUpcoming = [...upcoming, ...autoGio].sort((a, b) => a.daysUntil - b.daysUntil);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (typeFilter === 'all') return events;
    return events.filter((e) => e.event_type === typeFilter);
  }, [events, typeFilter]);

  const navigateMonth = (dir: number) => {
    let m = calendarMonth + dir;
    let y = calendarYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const isLoading = eventsLoading || !people;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
          <Calendar className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Lịch cúng lễ</h1>
          <p className="text-sm text-muted-foreground">Quản lý ngày giỗ, lễ tết và sự kiện dòng họ</p>
        </div>
      </div>

      {/* Upcoming banner */}
      {allUpcoming.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Sắp tới ({allUpcoming.length} sự kiện trong 60 ngày)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allUpcoming.slice(0, 5).map((item) => (
              <EventCard
                key={item.event.id}
                event={item.event}
                person={item.person}
                nextDate={item.nextDate}
                daysUntil={item.daysUntil}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Lịch tháng</TabsTrigger>
          <TabsTrigger value="list">Danh sách</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base">
                  {MONTHS_VI[calendarMonth - 1]} {calendarYear}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <EventCalendarGrid
                  month={calendarMonth}
                  year={calendarYear}
                  events={events ?? []}
                  people={people ?? []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">
                {filteredEvents.length} sự kiện
              </CardTitle>
              <select
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                {Object.entries(EVENT_TYPE_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))
              ) : filteredEvents.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">Chưa có sự kiện nào.</p>
              ) : (
                filteredEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
```

### Bước 8: Tạo `src/app/(public)/lich-cung-le/loading.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Skeleton className="mb-4 h-10 w-48" />
      <Skeleton className="mb-6 h-32 w-full" />
      <Skeleton className="h-96 w-full" />
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

- [ ] Vào `/lich-cung-le` → hiển thị banner "Sắp tới" với ~14 events.
- [ ] Tab "Lịch tháng" hiển thị calendar tháng hiện tại với badge events.
- [ ] Click nút → chuyển tháng.
- [ ] Tab "Danh sách" hiển thị tất cả events theo thứ tự ngày.
- [ ] Filter theo "Giỗ" → chỉ hiển thị events giỗ.
- [ ] Click "Nguyễn Đình Tổ" trong upcoming → điều hướng đến `/thanh-vien/[id]`.

## 7. Lưu ý rủi ro

- **Lunar calendar conversion chưa chính xác:** Phiên bản này chỉ estimate. Nếu cần chính xác (ngày giỗ trùng âm lịch thật), dùng package `am-lich` hoặc `lunar-javascript`.
- **Auto-giỗ trùng lặp:** Nếu admin tạo event giỗ cho một người, function auto-generate sẽ skip (vì `existingPersonIds`).
- **Performance:** Với 100+ events có thể chậm. Hiện tại ổn vì ~14.
- **Banner "Sắp tới":** Hiện hiển thị 5 sự kiện đầu; có thể tăng lên.

## 8. Liên kết

- [05-public-thanh-vien.md](05-public-thanh-vien.md) - Trước đó.
- [07-public-tai-lieu.md](07-public-tai-lieu.md) - Tiếp theo.
- [BRD.md §3.1.5](../docs/01-planning/BRD.md) - Yêu cầu FR-PUB-05.