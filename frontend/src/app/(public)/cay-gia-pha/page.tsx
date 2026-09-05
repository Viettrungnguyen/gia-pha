'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTreeData } from '@/hooks/use-families';
import { TreeFallbackList } from '@/components/tree/tree-fallback-list';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
            <GitBranchPlus className="h-6 w-6" />
            Cây Gia Phả
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sơ đồ cây gia đình dòng họ Nguyễn Đình
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
          <Button asChild variant="ghost" size="sm" aria-label="Cây compact">
            <Link href="/cay-gia-pha/compact">
              <GitBranchPlus className="mr-1 h-4 w-4" /> Compact
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" aria-label="Cây dọc">
            <Link href="/cay-gia-pha/vertical">
              <GitBranchPlus className="mr-1 h-4 w-4" /> Dọc
            </Link>
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
