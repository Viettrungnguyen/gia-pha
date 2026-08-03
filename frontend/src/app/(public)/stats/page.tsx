/**
 * @project NguyenDinhHoaNgai
 * @file src/app/(public)/stats/page.tsx
 * @description Public family-tree statistics dashboard
 * @version 1.0.0
 * @updated 2026-07-24
 */

'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, Heart, Layers, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTreeData } from '@/hooks/use-families';
import { calculateDetailedStats } from '@/lib/stats-calculator';

const StatsCharts = dynamic(() => import('./stats-charts'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
});

export default function StatsPage() {
  const { data: treeData, isLoading, error } = useTreeData();
  const stats = useMemo(() => treeData ? calculateDetailedStats(treeData) : null, [treeData]);

  if (isLoading) {
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

  if (error || !stats) {
    return <main className="container mx-auto px-4 py-16 text-center text-destructive">Không thể tải dữ liệu thống kê.</main>;
  }

  const summary = [
    { label: 'Tổng thành viên', value: stats.totalPeople, icon: Users },
    { label: 'Số đời', value: stats.totalGenerations, icon: Layers },
    { label: 'Số gia đình', value: stats.totalFamilies, icon: Heart },
  ];

  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold"><BarChart3 className="h-7 w-7 text-primary" />Thống kê gia phả</h1>
        <p className="text-sm text-muted-foreground">Biểu đồ phân bố và số liệu tổng hợp</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <item.icon className="h-4 w-4" />{item.label}
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold">{item.value}</p></CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">TB con/gia đình</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.avgChildrenPerFamily}</p>
            <p className="text-xs text-muted-foreground">Tuyệt tự: {stats.childlessRate}%</p>
          </CardContent>
        </Card>
      </div>

      <StatsCharts stats={stats} />
    </main>
  );
}
