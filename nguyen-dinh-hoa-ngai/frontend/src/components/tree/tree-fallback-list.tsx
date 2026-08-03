/**
 * @project NguyenDinhHoaNgai
 * @file src/components/tree/tree-fallback-list.tsx
 * @description List view by generation
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
