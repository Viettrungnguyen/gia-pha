/**
 * @project NguyenDinhHoaNgai
 * @file src/components/layout/site-header.tsx
 * @description Public site header
 * @version 1.1.0
 * @updated 2026-07-24
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE_CONFIG } from '@/lib/site-config';
import { Users, GitBranchPlus, Calendar, Archive, BookUser, BarChart3, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/cay-gia-pha', label: 'Cây gia phả', icon: GitBranchPlus },
  { href: '/thanh-vien', label: 'Thành viên', icon: Users },
  { href: '/danh-ba', label: 'Danh bạ', icon: BookUser },
  { href: '/lich-cung-le', label: 'Lịch cúng lễ', icon: Calendar },
  { href: '/stats', label: 'Thống kê', icon: BarChart3 },
  { href: '/tai-lieu', label: 'Tài liệu', icon: Archive },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">
            NĐ
          </div>
          <span className="hidden font-semibold sm:inline">{SITE_CONFIG.shortName}</span>
        </Link>

        <nav className="ml-8 hidden gap-1 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/dang-nhap"
            className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:flex"
          >
            <LogIn className="h-4 w-4" />
            <span>Đăng nhập</span>
          </Link>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t bg-background lg:hidden">
          <div className="container mx-auto space-y-1 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <Link
              href="/dang-nhap"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
