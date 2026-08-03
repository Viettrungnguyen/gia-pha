/**
 * @project NguyenDinhHoaNgai
 * @file src/components/layout/admin-sidebar.tsx
 * @description Admin sidebar with nav + signout
 * @version 1.1.0
 * @updated 2026-07-24
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import {
  LayoutDashboard,
  Users,
  BookUser,
  BarChart3,
  Calendar,
  Archive,
  LogOut,
  Home,
  FileUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { SITE_CONFIG } from '@/lib/site-config';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/thanh-vien', label: 'Thành viên', icon: Users },
  { href: '/danh-ba', label: 'Danh bạ', icon: BookUser },
  { href: '/stats', label: 'Thống kê', icon: BarChart3 },
  { href: '/admin/lich-cung-le', label: 'Lịch cúng lễ', icon: Calendar },
  { href: '/admin/tai-lieu', label: 'Tài liệu', icon: Archive },
  { href: '/admin/nhap-lieu', label: 'Nhập dữ liệu', icon: FileUp },
];

export function AdminSidebar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="border-b p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">
            NĐ
          </div>
          <div>
            <div className="text-sm font-semibold">Quản trị</div>
            <div className="text-xs text-muted-foreground">{SITE_CONFIG.shortName}</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 px-3">
          <div className="truncate text-sm font-medium">
            {profile?.full_name || user?.email}
          </div>
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
        </div>
        <div className="space-y-1">
          <Button asChild variant="ghost" className="w-full justify-start" size="sm">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Về trang chính
            </Link>
          </Button>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </div>
    </aside>
  );
}