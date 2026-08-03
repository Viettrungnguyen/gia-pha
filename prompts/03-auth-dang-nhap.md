---
project: NguyenDinhHoaNgai
path: prompts/03-auth-dang-nhap.md
type: prompt
version: 1.0.0
updated: 2026-07-23
---

# 03 - Auth Provider, Login Form, Middleware Guard

## 1. Mục tiêu

Implement authentication với Supabase Auth: AuthProvider context, form đăng nhập, middleware proxy guard `/admin/**`.

## 2. Tiêu chí hoàn thành

- [ ] File `src/lib/supabase/server.ts` tạo server client với cookie handling.
- [ ] File `src/components/auth/auth-provider.tsx` cung cấp context: `user`, `profile`, `signIn`, `signOut`, `isAdmin`.
- [ ] File `src/app/(auth)/dang-nhap/page.tsx` có form email/password.
- [ ] File `src/proxy.ts` (middleware Next.js 16) guard `/admin/**` yêu cầu role admin.
- [ ] File `src/middleware.ts` re-export `proxy`.
- [ ] Root layout wrap children với `<AuthProvider>` và `<QueryClientProvider>`.
- [ ] Smoke test: khách vào `/admin` → redirect `/dang-nhap`; đăng nhập thành công → vào `/admin`.

## 3. File cần tạo/sửa

```
src/
├── lib/supabase/
│   ├── client.ts (đã có ở prompt 01)
│   └── server.ts                                  # NEW
├── components/
│   ├── auth/
│   │   ├── auth-provider.tsx                      # NEW
│   │   └── login-form.tsx                         # NEW
│   └── ui/                                        # shadcn primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── label.tsx
├── hooks/
│   └── use-auth.ts                                # NEW
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                             # NEW
│   │   └── dang-nhap/
│   │       └── page.tsx                           # NEW
│   └── layout.tsx (sửa: thêm Providers)
├── proxy.ts                                       # NEW
└── middleware.ts                                  # NEW
```

## 4. Phụ thuộc

- Đã hoàn thành [01-scaffold-frontend.md](01-scaffold-frontend.md) và [02-supabase-schema-rls.md](02-supabase-schema-rls.md).
- Đã tạo admin user trong Supabase Dashboard.

## 5. Bước thực hiện

### Bước 1: Setup shadcn/ui primitives

Cài shadcn components cần thiết:

```bash
cd frontend
pnpm dlx shadcn@latest add button card input label
```

Nếu `pnpm dlx shadcn` không hoạt động, manually tạo 4 file từ [ui.shadcn.com](https://ui.shadcn.com/docs/components) trong `src/components/ui/`.

### Bước 2: Tạo `src/lib/supabase/server.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase/server.ts
 * @description Supabase server client with cookie handling
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
    }
  );
}
```

### Bước 3: Tạo `src/types/auth.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/types/auth.ts
 * @description Auth-related types
 * @version 1.0.0
 */

import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin';
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

### Bước 4: Tạo `src/components/auth/auth-provider.tsx`

```tsx
/**
 * @project NguyenDinhHoaNgai
 * @file src/components/auth/auth-provider.tsx
 * @description Auth context provider
 * @version 1.0.0
 * @updated 2026-07-23
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AuthContextValue, Profile } from '@/types/auth';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile;
  }, [supabase]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const profile = await fetchProfile(user.id);
      setProfile(profile);
    } else {
      setProfile(null);
    }
    setIsLoading(false);
  }, [supabase, fetchProfile]);

  useEffect(() => {
    refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await refresh();
  }, [supabase, refresh]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const value: AuthContextValue = {
    user,
    profile,
    isLoading,
    isAdmin: profile?.role === 'admin',
    signIn,
    signOut,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
```

### Bước 5: Tạo `src/components/auth/login-form.tsx`

```tsx
/**
 * @project NguyenDinhHoaNgai
 * @file src/components/auth/login-form.tsx
 * @description Login form for admin
 * @version 1.0.0
 * @updated 2026-07-23
 */

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from './auth-provider';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      await signIn(email, password);
      toast.success('Đăng nhập thành công');
      router.push(next);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      if (message.includes('Invalid login')) {
        setError('Email hoặc mật khẩu không đúng');
      } else {
        setError(message);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>Dành cho quản trị viên dòng họ</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@nguyen-dinh.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isPending}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Bước 6: Tạo `src/app/(auth)/layout.tsx`

```tsx
import { SITE_CONFIG } from '@/lib/site-config';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-primary">{SITE_CONFIG.name}</h1>
        <p className="text-sm text-muted-foreground">{SITE_CONFIG.description}</p>
      </div>
      {children}
    </div>
  );
}
```

### Bước 7: Tạo `src/app/(auth)/dang-nhap/page.tsx`

```tsx
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Đăng nhập',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
```

### Bước 8: Tạo `src/proxy.ts` (middleware)

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/proxy.ts
 * @description Next.js 16 middleware for auth + route protection
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public paths: always allow
  const publicPaths = ['/', '/cay-gia-pha', '/thanh-vien', '/lich-cung-le', '/tai-lieu', '/dang-nhap'];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  // If logged in and on /dang-nhap, redirect to /admin
  if (user && pathname === '/dang-nhap') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (isPublic) {
    return supabaseResponse;
  }

  // Admin routes: require admin role
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = new URL('/dang-nhap', request.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    // Check role
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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Bước 9: Tạo `src/middleware.ts`

```typescript
/**
 * Next.js convention: re-export proxy as middleware.
 */
export { proxy as middleware } from './proxy';
```

### Bước 10: Cập nhật `src/app/layout.tsx` - thêm Providers

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { SITE_CONFIG } from '@/lib/site-config';
import { AuthProvider } from '@/components/auth/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';

export const metadata: Metadata = {
  title: { default: SITE_CONFIG.name, template: `%s | ${SITE_CONFIG.name}` },
  description: SITE_CONFIG.description,
  openGraph: {
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    locale: SITE_CONFIG.locale,
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

### Bước 11: Tạo `src/components/providers/query-provider.tsx`

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

### Bước 12: Cập nhật trang chủ để hiển thị login link

Sửa `src/app/page.tsx`:

```tsx
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
```

### Bước 13: Tạo admin layout placeholder

Tạo `src/app/admin/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/dang-nhap?next=/admin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return <>{children}</>;
}
```

Tạo `src/app/admin/page.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Archive, GitBranchPlus } from 'lucide-react';

export const metadata = { title: 'Quản trị' };

export default function AdminDashboardPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Quản trị</h1>
      <p className="mt-2 text-muted-foreground">Dashboard tổng quan</p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Thành viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quan hệ</CardTitle>
            <GitBranchPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sự kiện 60 ngày</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tài liệu</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 rounded-md border border-dashed p-8 text-center text-muted-foreground">
        <p>Dashboard sẽ được hoàn thiện ở Sprint 3.</p>
      </div>
    </main>
  );
}
```

## 6. Smoke test

```bash
cd frontend
pnpm tsc       # Phải pass
pnpm lint      # Phải pass
pnpm build     # Phải pass
pnpm dev       # Mở http://localhost:3000
```

Verify:

1. Truy cập `/` → hiển thị trang chủ với 4 nút + link "Đăng nhập".
2. Click "Đăng nhập" → vào `/dang-nhap` → form hiển thị.
3. Nhập `admin@nguyen-dinh.local` / `Admin@2026` → submit → redirect `/admin`.
4. `/admin` hiển thị dashboard placeholder.
5. Logout (sẽ tạo nút ở prompt sau) → vào lại `/admin` → redirect `/dang-nhap`.
6. Vào `/admin` khi chưa login → redirect `/dang-nhap?next=/admin`.
7. Sau khi login, vào `/` → có thể thấy nút "Đăng xuất" (khi đã có UI).

## 7. Lưu ý rủi ro

- **Middleware timeout:** Nếu Supabase lạnh (cold start), `auth.getUser()` có thể timeout 5-10s. Tạm thời không có timeout fail-closed; nếu cần, thêm Promise.race.
- **Cookie không đồng bộ:** Nếu login OK nhưng middleware không thấy user, check cookie domain có khớp giữa `NEXT_PUBLIC_SUPABASE_URL` và domain Vercel.
- **Service role key:** KHÔNG commit, không dùng ở client.
- **RLS bypass:** Nếu INSERT thành công với anon → check lại RLS policy ở [02-supabase-schema-rls.md](02-supabase-schema-rls.md).

## 8. Liên kết

- [02-supabase-schema-rls.md](02-supabase-schema-rls.md) - Trước đó.
- [04-public-cay-gia-pha.md](04-public-cay-gia-pha.md) - Tiếp theo.
- [TECHNICAL-DESIGN.md §5](../docs/02-design/TECHNICAL-DESIGN.md) - Auth flow.
- [SECURITY-PRIVACY.md §3](../docs/02-design/SECURITY-PRIVACY.md) - Auth security.