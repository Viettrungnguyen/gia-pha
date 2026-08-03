/**
 * @project NguyenDinhHoaNgai
 * @file src/components/events/event-card.tsx
 * @description Event card with lunar/solar date
 * @version 1.0.0
 * @updated 2026-07-23
 */

import Link from 'next/link';
import type { Event } from '@/types';

interface Props {
  event: Event;
  peopleMap?: Map<string, { display_name: string }>;
}

const TYPE_LABEL: Record<string, string> = {
  gio: 'Giỗ',
  hop_ho: 'Họp họ',
  le_tet: 'Lễ/Tết',
  other: 'Khác',
};

const TYPE_COLOR: Record<string, string> = {
  gio: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  hop_ho: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  le_tet: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  other: 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300',
};

function formatSolar(d: string | null) {
  if (!d) return null;
  const date = new Date(d);
  return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function EventCard({ event, peopleMap }: Props) {
  const solar = formatSolar(event.event_date);
  const personName = event.person_id && peopleMap?.get(event.person_id)?.display_name;

  const wrapperClass = "flex items-start gap-4 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md";
  const inner = (
    <>
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border bg-muted text-center">
        {event.event_date ? (
          <>
            <div className="text-lg font-bold leading-none">
              {new Date(event.event_date).getDate()}
            </div>
            <div className="text-[10px] uppercase text-muted-foreground">
              Th {new Date(event.event_date).getMonth() + 1}
            </div>
          </>
        ) : (
          <div className="text-[10px] text-muted-foreground">—</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[event.event_type] ?? TYPE_COLOR.other}`}>
            {TYPE_LABEL[event.event_type] ?? event.event_type}
          </span>
          {event.recurring && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              Hằng năm
            </span>
          )}
        </div>
        <h3 className="font-semibold">{event.title}</h3>
        {solar && <p className="mt-0.5 text-xs text-muted-foreground">Dương: {solar}</p>}
        {event.event_lunar && <p className="text-xs text-muted-foreground">Âm: {event.event_lunar}</p>}
        {event.location && <p className="mt-1 text-sm">📍 {event.location}</p>}
        {personName && <p className="mt-1 text-xs text-primary">→ {personName}</p>}
        {event.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        )}
      </div>
    </>
  );

  if (personName) {
    return (
      <Link href={`/thanh-vien/${event.person_id}`} className={wrapperClass}>
        {inner}
      </Link>
    );
  }
  return <div className={wrapperClass}>{inner}</div>;
}