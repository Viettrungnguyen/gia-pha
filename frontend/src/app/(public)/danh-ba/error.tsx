/**
 * @project NguyenDinhHoaNgai
 * @file src/app/(public)/danh-ba/error.tsx
 * @description Error boundary for member directory
 * @version 1.0.0
 * @updated 2026-07-24
 */

'use client';

import { Button } from '@/components/ui/button';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-destructive">Không thể tải danh bạ</h1>
      <Button className="mt-6" onClick={reset}>Thử lại</Button>
    </main>
  );
}
