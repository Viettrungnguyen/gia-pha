'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTreeData } from '@/hooks/use-families';
import { TreeFallbackList } from '@/components/tree/tree-fallback-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranchPlus, List } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FamilyTree = dynamic(
  () => import('@/components/tree/family-tree').then((m) => m.FamilyTree),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[70vh] w-full" />,
  }
);

export default function CayGiaPhaPage() {
  const { data, isLoading, error } = useTreeData();
  const [mode, setMode] = useState<'tree' | 'list'>('tree');

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Lỗi khi tải dữ liệu: {error.message}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1800px] px-1 py-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-primary">
            <GitBranchPlus className="h-7 w-7" />
            Cây Gia Phả
          </h1>
          <p className="mt-1 text-muted-foreground">
            Sơ đồ cây gia đình dòng họ Nguyễn Đình — kéo để di chuyển, scroll để zoom
          </p>
        </div>
        <div className="flex gap-1 rounded-md border p-1">
          <Button
            variant={mode === 'tree' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('tree')}
          >
            <GitBranchPlus className="mr-1 h-4 w-4" /> Cây
          </Button>
          <Button
            variant={mode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('list')}
          >
            <List className="mr-1 h-4 w-4" /> Danh sách
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-[70vh] w-full" />
      ) : mode === 'tree' ? (
        <FamilyTree people={data.people} families={data.families} children={data.children} />
      ) : (
        <TreeFallbackList people={data.people} />
      )}

    </main>
  );
}
