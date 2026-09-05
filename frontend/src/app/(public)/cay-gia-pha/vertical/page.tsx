/**
 * @project NguyenDinhHoaNgai
 * @file src/app/(public)/cay-gia-pha/vertical/page.tsx
 * @description Trang cây gia phả dạng "dọc" (đời 1-5 giống compact, đời 6+ rải chữ dọc)
 * @version 1.0.0
 * @updated 2026-09-06
 */

'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTreeData } from '@/hooks/use-families';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranchPlus, List, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const VerticalFamilyTree = dynamic(
  () =>
    import('@/components/tree/vertical-family-tree').then(
      (m) => m.VerticalFamilyTree
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[70vh] w-full" />,
  }
);

export default function CayGiaPhaVerticalPage() {
  const { data, isLoading, error } = useTreeData();

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Lỗi khi tải dữ liệu: {error.message}
            </p>
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
            Cây Gia Phả (Dọc)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Đời 1-5: giống compact · Đời 6+: ô couple có viền, tên chồng (xanh) + vợ (hồng) + Đời, rải chữ theo chiều dọc
          </p>
        </div>
        <div className="flex gap-1 rounded-md border p-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/cay-gia-pha">
              <ArrowLeft className="mr-1 h-4 w-4" /> Cây đầy đủ
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/cay-gia-pha/compact">
              <GitBranchPlus className="mr-1 h-4 w-4" /> Compact
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" aria-label="Danh sách">
            <Link href="/cay-gia-pha">
              <List className="mr-1 h-4 w-4" /> Danh sách
            </Link>
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-[70vh] w-full" />
      ) : (
        <VerticalFamilyTree
          people={data.people}
          families={data.families}
          children={data.children}
        />
      )}

      <Card className="mt-6">
        <CardContent className="space-y-2 py-4 text-sm text-muted-foreground">
          <p>
            <strong>Cây dọc</strong> từ đời 6 trở đi đổi cách hiển thị: ô couple
            chỉ giữ viền (background trong suốt), tên chồng và vợ được tách
            thành từng từ và xếp dọc từ trên xuống — chồng viết dọc trái
            (màu xanh), vợ viết dọc phía sau (màu hồng). Mỗi người có dòng
            <em> Đời N</em> riêng. Ô con trai và ô con gái cũng rải tên theo
            chiều dọc.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
