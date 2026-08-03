/**
 * @project NguyenDinhHoaNgai
 * @file src/components/events/event-calendar.tsx
 * @description Monthly calendar with solar dates, lunar dates, and event overlays
 * @version 1.1.0
 * @updated 2026-07-24
 */

'use client';

import { useMemo } from 'react';
import type { Event } from '@/types';
import { findLunarOccurrenceInSolarMonth, parseLunarString, solarToLunar } from '@/lib/lunar-calendar';

interface Props {
  year: number;
  month: number;
  events: Event[];
  onSelectDay?: (day: number) => void;
  selectedDay?: number | null;
}

const TYPE_DOT: Record<string, string> = {
  gio: 'bg-amber-500',
  hop_ho: 'bg-blue-500',
  le_tet: 'bg-rose-500',
  other: 'bg-slate-500',
};

export function EventCalendar({ year, month, events, onSelectDay, selectedDay }: Props) {
  const cells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const eventsByDay = new Map<number, Event[]>();

    for (const event of events) {
      let occurrence: Date | null = null;
      if (event.event_lunar) {
        const lunar = parseLunarString(event.event_lunar);
        if (lunar) occurrence = findLunarOccurrenceInSolarMonth(lunar.day, lunar.month, month, year);
      } else if (event.event_date) {
        const date = new Date(`${event.event_date}T00:00:00`);
        if (date.getFullYear() === year && date.getMonth() + 1 === month) occurrence = date;
      }
      if (occurrence) {
        const dayEvents = eventsByDay.get(occurrence.getDate()) ?? [];
        dayEvents.push(event);
        eventsByDay.set(occurrence.getDate(), dayEvents);
      }
    }

    const result: Array<{ day: number | null; lunarDay: number | null; lunarMonth: number | null; events: Event[] }> = [];
    for (let index = 0; index < firstDay; index += 1) {
      result.push({ day: null, lunarDay: null, lunarMonth: null, events: [] });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const lunar = solarToLunar(day, month, year);
      result.push({ day, lunarDay: lunar.day, lunarMonth: lunar.month, events: eventsByDay.get(day) ?? [] });
    }
    while (result.length % 7 !== 0) {
      result.push({ day: null, lunarDay: null, lunarMonth: null, events: [] });
    }
    return result;
  }, [year, month, events]);

  const today = new Date();

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-semibold uppercase">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => <div key={day} className="py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, index) => {
          const isToday = cell.day !== null && today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === cell.day;
          const isSelected = cell.day !== null && cell.day === selectedDay;
          const clickable = Boolean(cell.day !== null && cell.events.length > 0 && onSelectDay);
          return (
            <button
              key={index}
              type="button"
              disabled={!clickable}
              onClick={() => cell.day !== null && clickable && onSelectDay?.(cell.day)}
              className={[
                'min-h-[86px] border-b border-r p-1.5 text-left transition-colors sm:p-2',
                cell.day === null ? 'bg-muted/30' : '',
                isToday ? 'bg-primary/10 ring-1 ring-inset ring-primary' : '',
                isSelected ? 'bg-accent' : '',
                clickable ? 'cursor-pointer hover:bg-accent' : '',
              ].join(' ')}
            >
              {cell.day !== null && (
                <>
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-sm font-semibold ${isToday ? 'text-primary' : ''}`}>{cell.day}</span>
                    <span className="text-[10px] text-muted-foreground">{cell.lunarDay}/{cell.lunarMonth}</span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {cell.events.slice(0, 2).map((event) => (
                      <div key={event.id} className="flex items-center gap-1 truncate text-[10px]" title={event.title}>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_DOT[event.event_type] ?? TYPE_DOT.other}`} />
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                    {cell.events.length > 2 && <div className="text-[10px] text-muted-foreground">+{cell.events.length - 2}</div>}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
