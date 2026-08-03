/**
 * @project NguyenDinhHoaNgai
 * @file src/app/(public)/danh-ba/loading.tsx
 * @description Loading boundary for member directory
 * @version 1.0.0
 * @updated 2026-07-24
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Skeleton className="mb-6 h-10 w-64" />
      <Skeleton className="mb-6 h-32 w-full" />
      <Skeleton className="h-96 w-full" />
    </main>
  );
}
