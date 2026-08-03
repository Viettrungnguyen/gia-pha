/**
 * @project NguyenDinhHoaNgai
 * @file src/app/admin/page.tsx
 * @description Admin dashboard with live stats
 * @version 1.0.0
 * @updated 2026-07-23
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Calendar,
  Archive,
  GitBranchPlus,
  ArrowRight,
} from 'lucide-react';

export const metadata = { title: 'Quản trị' };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [peopleRes, familiesRes, documentsRes, eventsRes] = await Promise.all([
    supabase.from('people').select('id', { count: 'exact', head: true }),
    supabase.from('families').select('id', { count: 'exact', head: true }),
    supabase.from('clan_documents').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: 'Thành viên', value: peopleRes.count ?? 0, icon: Users, href: '/admin/thanh-vien' },
    { label: 'Quan hệ', value: familiesRes.count ?? 0, icon: GitBranchPlus, href: '/admin/thanh-vien' },
    { label: 'Sự kiện', value: eventsRes.count ?? 0, icon: Calendar, href: '/admin/lich-cung-le' },
    { label: 'Tài liệu', value: documentsRes.count ?? 0, icon: Archive, href: '/admin/tai-lieu' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Tổng quan hệ thống gia phả</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  Quản lý <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Hướng dẫn nhanh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Thành viên:</strong> CRUD đầy đủ + tạo quan hệ cha/mẹ tự động.
          </p>
          <p>
            • <strong>Lịch cúng lễ:</strong> Quản lý các ngày giỗ, họp họ, lễ tết.
          </p>
          <p>
            • <strong>Tài liệu:</strong> Upload ảnh lịch sử, giấy tờ, video.
          </p>
          <p>
            • Trang public tự động cập nhật sau khi thay đổi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}