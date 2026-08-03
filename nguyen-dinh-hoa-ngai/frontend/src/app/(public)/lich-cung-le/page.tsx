/**
 * @project NguyenDinhHoaNgai
 * @file src/app/(public)/lich-cung-le/page.tsx
 * @description Ceremony calendar with lunar dates, upcoming events, and automatic memorials
 * @version 1.1.0
 * @updated 2026-07-24
 */

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EventCalendar } from '@/components/events/event-calendar';
import { EventCard } from '@/components/events/event-card';
import { useEvents } from '@/hooks/use-events';
import { usePeople } from '@/hooks/use-people';
import { formatLunarDate, getNextLunarOccurrence, parseLunarString, solarToLunar } from '@/lib/lunar-calendar';
import type { Event, Person } from '@/types';

interface UpcomingEvent {
  event: Event;
  person?: Person;
  nextDate: Date;
  daysUntil: number;
  lunarDisplay: string;
  isAutomatic: boolean;
}

const TYPE_LABELS: Record<Event['event_type'], string> = {
  gio: 'Giỗ',
  hop_ho: 'Họp họ',
  le_tet: 'Lễ/Tết',
  other: 'Khác',
};

export default function LichCungLePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [typeFilter, setTypeFilter] = useState('all');
  const { data: events, isLoading: eventsLoading, error: eventsError } = useEvents();
  const { data: people, isLoading: peopleLoading, error: peopleError } = usePeople();

  const peopleMap = useMemo(
    () => new Map((people ?? []).map((person) => [person.id, { display_name: person.display_name }])),
    [people]
  );

  const upcomingEvents = useMemo<UpcomingEvent[]>(() => {
    if (!events || !people) return [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const result: UpcomingEvent[] = [];

    for (const event of events) {
      let nextDate: Date | null = null;
      let lunarDisplay = '';
      if (event.event_lunar) {
        const lunar = parseLunarString(event.event_lunar);
        if (lunar) {
          nextDate = getNextLunarOccurrence(lunar.day, lunar.month, start);
          lunarDisplay = formatLunarDate(lunar.day, lunar.month);
        }
      } else if (event.event_date) {
        const date = new Date(`${event.event_date}T00:00:00`);
        if (event.recurring && date < start) {
          date.setFullYear(start.getFullYear());
          if (date < start) date.setFullYear(start.getFullYear() + 1);
        }
        nextDate = date;
        const lunar = solarToLunar(date.getDate(), date.getMonth() + 1, date.getFullYear());
        lunarDisplay = formatLunarDate(lunar.day, lunar.month);
      }
      if (!nextDate) continue;
      const daysUntil = Math.round((nextDate.getTime() - start.getTime()) / 86_400_000);
      if (daysUntil < 0 || daysUntil > 60) continue;
      result.push({
        event,
        person: event.person_id ? people.find((person) => person.id === event.person_id) : undefined,
        nextDate,
        daysUntil,
        lunarDisplay,
        isAutomatic: false,
      });
    }

    const peopleWithEvent = new Set(events.flatMap((event) => event.person_id ? [event.person_id] : []));
    for (const person of people) {
      if (person.is_living || !person.death_lunar || peopleWithEvent.has(person.id)) continue;
      const lunar = parseLunarString(person.death_lunar);
      if (!lunar) continue;
      const nextDate = getNextLunarOccurrence(lunar.day, lunar.month, start);
      const daysUntil = Math.round((nextDate.getTime() - start.getTime()) / 86_400_000);
      if (daysUntil < 0 || daysUntil > 60) continue;
      result.push({
        event: {
          id: `auto-gio-${person.id}`,
          title: `Giỗ ${person.display_name}`,
          description: null,
          event_type: 'gio',
          event_date: null,
          event_lunar: person.death_lunar,
          person_id: person.id,
          location: null,
          recurring: true,
          created_at: person.created_at,
        },
        person,
        nextDate,
        daysUntil,
        lunarDisplay: formatLunarDate(lunar.day, lunar.month),
        isAutomatic: true,
      });
    }
    return result.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [events, people]);

  const calendarEvents = useMemo(() => {
    const storedEvents = events ?? [];
    if (!people) return storedEvents;
    const peopleWithEvent = new Set(storedEvents.flatMap((event) => event.person_id ? [event.person_id] : []));
    const automaticEvents: Event[] = people
      .filter((person) => !person.is_living && person.death_lunar && !peopleWithEvent.has(person.id))
      .map((person) => ({
        id: `auto-gio-${person.id}`,
        title: `Giỗ ${person.display_name}`,
        description: null,
        event_type: 'gio',
        event_date: null,
        event_lunar: person.death_lunar,
        person_id: person.id,
        location: null,
        recurring: true,
        created_at: person.created_at,
      }));
    return [...storedEvents, ...automaticEvents];
  }, [events, people]);

  const filteredEvents = useMemo(
    () => (events ?? []).filter((event) => typeFilter === 'all' || event.event_type === typeFilter),
    [events, typeFilter]
  );

  const navigateMonth = (direction: number) => {
    const date = new Date(year, month - 1 + direction, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
  };
  const goToday = () => {
    const date = new Date();
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
  };
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const isLoading = eventsLoading || peopleLoading;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <CalendarDays className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Lịch cúng lễ</h1>
          <p className="text-sm text-muted-foreground">Các ngày giỗ, họp họ, lễ tết của dòng họ</p>
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><AlertCircle className="h-4 w-4 text-amber-600" />Sắp tới ({upcomingEvents.length} sự kiện trong 60 ngày)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.slice(0, 5).map((item) => (
              <div key={item.event.id} className="flex items-center gap-3 rounded-lg bg-background p-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{item.event.title}{item.isAutomatic && <span className="ml-1 text-xs text-muted-foreground">(tự động)</span>}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.nextDate.toLocaleDateString('vi-VN')} · {item.lunarDisplay}
                    {item.person && <> · <Link href={`/thanh-vien/${item.person.id}`} className="hover:underline">{item.person.display_name}</Link></>}
                  </div>
                </div>
                <Badge variant={item.daysUntil <= 7 ? 'destructive' : item.daysUntil <= 30 ? 'default' : 'secondary'}>
                  {item.daysUntil === 0 ? 'Hôm nay' : `${item.daysUntil} ngày`}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)} aria-label="Tháng trước"><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="min-w-[180px] text-center text-lg font-semibold capitalize">{monthLabel}</h2>
          <Button variant="outline" size="icon" onClick={() => navigateMonth(1)} aria-label="Tháng sau"><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={goToday}>Hôm nay</Button>
        </div>
        <div className="flex items-center gap-1 rounded-md border bg-card p-1">
          <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('calendar')}><CalendarDays className="mr-1 h-4 w-4" />Lịch</Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')}><List className="mr-1 h-4 w-4" />Danh sách</Button>
        </div>
      </div>

      {eventsError || peopleError ? (
        <Card className="border-destructive"><CardContent className="py-12 text-center text-destructive">Không thể tải lịch cúng lễ.</CardContent></Card>
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : view === 'calendar' ? (
        <EventCalendar year={year} month={month} events={calendarEvents} />
      ) : (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <span className="text-sm text-muted-foreground">{filteredEvents.length} sự kiện</span>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredEvents.length ? filteredEvents.map((event) => <EventCard key={event.id} event={event} peopleMap={peopleMap} />) : (
              <p className="py-10 text-center text-sm text-muted-foreground">Chưa có sự kiện nào</p>
            )}
          </CardContent>
        </Card>
      )}

      <p className="mt-8 text-xs text-muted-foreground">Các ngày giỗ được tính theo <strong>âm lịch</strong>; ngày dương có thể chênh lệch ±1 ngày.</p>
    </main>
  );
}
