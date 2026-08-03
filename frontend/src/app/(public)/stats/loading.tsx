/**
 * @project NguyenDinhHoaNgai
 * @file src/app/(public)/stats/loading.tsx
 * @description Loading boundary for statistics dashboard
 * @version 1.0.0
 * @updated 2026-07-24
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
      </div>
      <Skeleton className="h-80" />
    </main>
  );
}
