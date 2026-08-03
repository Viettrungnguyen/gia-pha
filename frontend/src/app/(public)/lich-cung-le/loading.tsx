import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Skeleton className="mb-6 h-10 w-64" />
      <Skeleton className="mb-4 h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </main>
  );
}