import { SITE_CONFIG } from '@/lib/site-config';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <h3 className="font-semibold">{SITE_CONFIG.name}</h3>
            <p className="mt-2 text-muted-foreground">
              Gia phả điện tử - {SITE_CONFIG.location.village}, {SITE_CONFIG.location.commune},
              {' '}{SITE_CONFIG.location.district}, {SITE_CONFIG.location.province}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Liên kết</h3>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li><a href="/cay-gia-pha" className="hover:underline">Cây gia phả</a></li>
              <li><a href="/thanh-vien" className="hover:underline">Thành viên</a></li>
              <li><a href="/lich-cung-le" className="hover:underline">Lịch cúng lễ</a></li>
              <li><a href="/tai-lieu" className="hover:underline">Tài liệu</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Liên hệ</h3>
            <p className="mt-2 text-muted-foreground">
              Email: nguyenviettrungk55@gmail.com
            </p>
            <p className="mt-1 text-muted-foreground">
              Số điện thoại: 0978278180
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              © {new Date().getFullYear()} {SITE_CONFIG.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
