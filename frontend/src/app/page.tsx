import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site-config';
import { Button } from '@/components/ui/button';
import { Users, GitBranchPlus, Calendar, Archive } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          {SITE_CONFIG.name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Gia phả điện tử — Làng Hòa Ngãi, Xã Thanh Hà, Huyện Thanh Liêm, Tỉnh Hà Nam
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {SITE_CONFIG.description}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild>
            <Link href="/cay-gia-pha">
              <GitBranchPlus className="mr-2 h-4 w-4" /> Cây gia phả
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/thanh-vien">
              <Users className="mr-2 h-4 w-4" /> Thành viên
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/lich-cung-le">
              <Calendar className="mr-2 h-4 w-4" /> Lịch cúng lễ
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tai-lieu">
              <Archive className="mr-2 h-4 w-4" /> Tài liệu
            </Link>
          </Button>
        </div>

        <div className="mt-12 text-xs text-muted-foreground">
          <Link href="/dang-nhap" className="hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </main>
  );
}
