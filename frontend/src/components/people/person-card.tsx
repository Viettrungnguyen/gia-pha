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
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{person.display_name}</h3>
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
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {person.occupation}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
