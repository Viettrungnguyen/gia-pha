---
project: NguyenDinhHoaNgai
path: docs/02-design/TECHNICAL-DESIGN.md
type: design
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Technical Design Document (TDD)

## 1. Tổng quan

### 1.1 Mục đích

Mô tả kiến trúc kỹ thuật, stack, pattern và deployment cho dự án NguyenDinhHoaNgai.

### 1.2 Đối tượng đọc

- Tech Lead phê duyệt kiến trúc.
- Đội dev tham chiếu khi code.
- Admin vận hành tham chiếu khi debug.

## 2. Architecture Overview

### 2.1 High-Level

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENTS                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Mobile   │  │ Tablet   │  │ Desktop  │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
│       └──────────────┼──────────────┘                        │
│                      ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             VERCEL EDGE NETWORK (CDN)                │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │          NEXT.JS 16 APP                        │  │   │
│  │  │  ┌──────────────────────────────────────────┐  │  │   │
│  │  │  │ App Router (Server + Client Components)  │  │  │   │
│  │  │  │  (public)  │  (auth)  │  admin           │  │  │   │
│  │  │  └──────────────────────────────────────────┘  │  │   │
│  │  │  ┌──────────────────────────────────────────┐  │  │   │
│  │  │  │ Data layer (supabase-data-*.ts)          │  │  │   │
│  │  │  │ Hooks (use-*.ts via React Query)         │  │  │   │
│  │  │  └──────────────────────────────────────────┘  │  │   │
│  │  │  ┌──────────────────────────────────────────┐  │  │   │
│  │  │  │ proxy.ts (Next.js 16 middleware)         │  │  │   │
│  │  │  │ - Cookie session refresh                 │  │  │   │
│  │  │  │ - /admin/** role guard                  │  │  │   │
│  │  │  └──────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Singapore)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ GoTrue Auth  │  │  PostgreSQL  │  │   Storage    │       │
│  │ (email/pwd)  │  │  + RLS       │  │ (S3-like)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | Next.js 16 (App Router) | SSR + Server Components + tích hợp sẵn middleware |
| Language | TypeScript 5 strict | Type safety, IDE hỗ trợ |
| Styling | Tailwind CSS 4 | Utility-first, mobile-first |
| UI primitives | shadcn/ui | Copy-paste, tùy biến, dùng Radix UI |
| Server state | React Query (TanStack Query v5) | Cache, invalidation, optimistic update |
| Form | React Hook Form + Zod | Validation type-safe |
| Backend | Supabase (BaaS) | Auth + DB + Storage trong 1 |
| DB | PostgreSQL 15 | Quan hệ mạnh, RLS, ACID |
| Hosting | Vercel | Free tier mạnh, auto-deploy, edge |
| Icons | Lucide React | Tree-shake, phong cách minimal |
| Date | native Intl + lunar-calendar.ts | Không cần thư viện ngoài cho ngày thường |
| Toast | sonner | Lightweight, API đơn giản |

### 2.3 Anti-patterns tránh

- KHÔNG dùng `any` không cần thiết.
- KHÔNG dùng global state (Zustand/Redux) — React Query đủ cho server state, useState cho UI.
- KHÔNG tạo wrapper không cần thiết quanh shadcn/ui.
- KHÔNG hard-code màu sắc; dùng design tokens qua Tailwind config.

## 3. Frontend Structure

### 3.1 Route Groups

```
src/app/
├── layout.tsx                 # Root layout: <html>, <body>, providers
├── page.tsx                   # Trang chủ (public, viết inline trong root layout)
├── robots.ts
├── sitemap.ts
├── (public)/                  # Group: trang khách
│   ├── layout.tsx             # Site header + footer
│   ├── cay-gia-pha/page.tsx
│   ├── thanh-vien/page.tsx
│   ├── thanh-vien/[id]/page.tsx
│   ├── thanh-vien/people-list-client.tsx
│   ├── lich-cung-le/page.tsx
│   └── tai-lieu/page.tsx
├── (auth)/
│   ├── layout.tsx
│   └── dang-nhap/page.tsx
└── admin/                     # Khu quản trị
    ├── layout.tsx             # Admin sidebar + auth guard
    ├── page.tsx               # Dashboard
    ├── thanh-vien/page.tsx
    ├── lich-cung-le/page.tsx
    └── tai-lieu/page.tsx
```

### 3.2 Providers (Root layout)

```tsx
<QueryClientProvider>      // React Query
  <AuthProvider>            // Supabase auth context
    <TooltipProvider>       // shadcn/ui tooltips
      {children}
      <Toaster richColors />  // sonner
    </TooltipProvider>
  </AuthProvider>
</QueryClientProvider>
```

### 3.3 Component Organization

```
src/components/
├── ui/               # shadcn/ui primitives (button, card, input, ...)
├── layout/
│   ├── site-header.tsx
│   ├── site-footer.tsx
│   └── admin-sidebar.tsx
├── auth/
│   ├── auth-provider.tsx     # Context: user, profile, signIn, signOut
│   └── login-form.tsx        # Form đăng nhập
├── tree/
│   ├── family-tree.tsx       # SVG layout engine
│   └── tree-fallback-list.tsx # Danh sách theo đời cho mobile
├── people/
│   ├── person-card.tsx
│   ├── person-detail.tsx
│   └── person-form.tsx       # Admin CRUD form
├── events/
│   ├── event-card.tsx
│   ├── event-calendar-grid.tsx
│   └── event-form.tsx        # Admin CRUD form
└── documents/
    ├── document-card.tsx
    └── document-form.tsx     # Admin CRUD form với file upload
```

## 4. Data Layer Pattern

### 4.1 Pattern tổng quát

Mỗi module có:

1. **Types** trong `src/types/index.ts` (hoặc file riêng).
2. **Data functions** trong `src/lib/supabase-data-{module}.ts`.
3. **Hooks** trong `src/hooks/use-{module}.ts`.
4. **Page** trong `src/app/.../{module}/page.tsx`.

### 4.2 Ví dụ: module `people`

```typescript
// src/types/index.ts
export interface Person {
  id: string;
  handle: string;
  display_name: string;
  // ...
}

// src/lib/supabase-data-people.ts
import { supabase } from '@/lib/supabase/client';
import type { Person } from '@/types';

export async function getPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('generation', { ascending: true })
    .order('birth_year', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createPerson(input: Omit<Person, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('people')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// src/hooks/use-people.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPeople, createPerson } from '@/lib/supabase-data-people';

export function usePeople() {
  return useQuery({ queryKey: ['people'], queryFn: getPeople });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPerson,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['people'] }),
  });
}
```

## 5. Middleware & Auth Flow

### 5.1 `src/proxy.ts` (Next.js 16)

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes: always allow
  const publicPaths = ['/', '/cay-gia-pha', '/thanh-vien', '/lich-cung-le', '/tai-lieu', '/dang-nhap'];
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (isPublic) {
    // If logged in and on /dang-nhap, redirect to /admin
    if (user && pathname === '/dang-nhap') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return supabaseResponse;
  }

  // Admin routes: require admin role
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL(`/dang-nhap?next=${pathname}`, request.url));
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### 5.2 Defense in depth

- **Lớp 1:** `proxy.ts` (server-side) - chặn truy cập `/admin/**` nếu không phải admin.
- **Lớp 2:** RLS Supabase (DB) - chặn INSERT/UPDATE/DELETE nếu không phải admin.
- **Lớp 3:** UI kiểm tra `isAdmin` (client) - ẩn nút CRUD nếu không phải admin.

## 6. SEO & Metadata

- Mỗi page export `metadata`:

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cây gia phả - Dòng họ Nguyễn Đình',
  description: 'Sơ đồ cây gia đình dòng họ Nguyễn Đình, làng Hòa Ngãi, Hà Nam',
  openGraph: {
    title: 'Cây gia phả - Dòng họ Nguyễn Đình',
    description: '...',
    locale: 'vi_VN',
    type: 'website',
  },
};
```

- `sitemap.ts`: liệt kê các trang public + dynamic routes cho thành viên.
- `robots.ts`: cho phép tất cả crawler.

## 7. Deployment

### 7.1 Build Configuration

- `next.config.ts`: giữ mặc định, không cần `output: 'standalone'` (Vercel tự handle).
- `package.json`:
  - `pnpm dev` → `next dev --port 3000`
  - `pnpm build` → `next build`
  - `pnpm start` → `next start`
  - `pnpm lint` → `eslint`
  - `pnpm tsc` → `tsc --noEmit`

### 7.2 Environment Variables

| Name | Scope | Value |
|------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | `eyJ...` |

Xem chi tiết tại [`VERCEL-SUPABASE-DEPLOY.md`](../04-build/VERCEL-SUPABASE-DEPLOY.md).

### 7.3 CI/CD

- Push code lên GitHub → Vercel tự động deploy.
- Mỗi PR tạo preview URL.
- Merge vào `main` → production deploy.

## 8. Performance Strategy

- **Server Components by default**: chỉ `'use client'` khi cần interactivity.
- **Dynamic import** cho cây gia phả (SVG layout nặng): `dynamic(() => import(...), { ssr: false })`.
- **Image optimization**: dùng `next/image` cho ảnh đại diện và thumbnail tài liệu.
- **Pagination**: danh sách thành viên nếu > 100 người (chưa cần MVP, nhưng chuẩn bị hook).
- **Cache**: React Query với `staleTime: 60_000` cho các query không nhạy cảm.

## 9. Error Handling

- **Page-level:** mỗi route có `error.tsx` (Next.js convention) hiển thị lỗi thân thiện.
- **Data layer:** throw error từ Supabase, React Query catch và hiển thị qua `useErrorBoundary` hoặc toast.
- **Middleware:** fail-closed — nếu không xác định được role → redirect.

## 10. Logging & Monitoring

- **Vercel:** function logs, build logs, runtime logs (real-time).
- **Supabase:** API logs, DB logs trong Dashboard.
- **Errors:** console.error ở client; structured logging ở middleware (chỉ dev).

## 11. Liên kết

- [DATA-MODEL.md](DATA-MODEL.md) - Schema chi tiết.
- [SECURITY-PRIVACY.md](SECURITY-PRIVACY.md) - Auth + RLS chi tiết.
- [UI-UX-DESIGN.md](UI-UX-DESIGN.md) - Design tokens.
- [SITEMAP-USER-FLOWS.md](SITEMAP-USER-FLOWS.md) - Site map.
- [IMPLEMENTATION-PLAN.md](../04-build/IMPLEMENTATION-PLAN.md) - Sprint breakdown.