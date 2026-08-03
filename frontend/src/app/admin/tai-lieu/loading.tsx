import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-6 lg:p-8">
      <Skeleton className="mb-4 h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}