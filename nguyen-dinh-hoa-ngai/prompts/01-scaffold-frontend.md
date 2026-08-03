---
project: NguyenDinhHoaNgai
path: prompts/01-scaffold-frontend.md
type: prompt
version: 1.0.0
updated: 2026-07-23
---

# 01 - Scaffold Frontend

## 1. Mục tiêu

Khởi tạo dự án Next.js 16 với TypeScript, Tailwind CSS 4, shadcn/ui, Supabase SSR. Cấu trúc folder hoàn chỉnh, có thể chạy `pnpm dev` và xem trang chủ tạm.

## 2. Tiêu chí hoàn thành

- [ ] Folder `frontend/` có `package.json` với đúng deps.
- [ ] `pnpm install` không lỗi.
- [ ] `pnpm dev` chạy được tại `http://localhost:3000`.
- [ ] `pnpm build` pass.
- [ ] `pnpm tsc --noEmit` không có error.
- [ ] `pnpm lint` không có error.
- [ ] Trang chủ hiển thị "Dòng họ Nguyễn Đình - Gia phả điện tử".
- [ ] Supabase client (`createBrowserClient`) hoạt động (có thể gọi query test).
- [ ] Root layout có `<AuthProvider>` và `<QueryProvider>` (sẽ tạo sau ở prompt 03, nhưng có thể stub).

## 3. File cần tạo

```
frontend/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts (hoặc dùng CSS-only Tailwind 4)
├── postcss.config.mjs
├── .eslintrc.json
├── .gitignore
├── .env.example
├── public/
│   ├── favicon.ico
│   └── logo.svg (optional)
└── src/
    ├── app/
    │   ├── layout.tsx           # Root layout
    │   ├── page.tsx             # Trang chủ tạm
    │   ├── globals.css          # Tailwind + CSS variables
    │   ├── not-found.tsx
    │   ├── loading.tsx
    │   ├── error.tsx
    │   ├── robots.ts
    │   └── sitemap.ts
    ├── components/
    │   ├── ui/                  # shadcn/ui primitives (sẽ add sau)
    │   └── layout/
    │       ├── site-header.tsx
    │       └── site-footer.tsx
    ├── lib/
    │   ├── supabase/
    │   │   └── client.ts        # createBrowserClient
    │   └── site-config.ts
    ├── types/
    │   └── index.ts             # Types tổng (sẽ mở rộng sau)
    └── proxy.ts                 # Stub (sẽ implement ở prompt 03)
```

## 4. Phụ thuộc

- Node.js 20+ và pnpm 9+ đã cài.
- Có thể có hoặc chưa có Supabase project (chưa cần cho prompt này, chỉ cần client setup).

## 5. Bước thực hiện

### Bước 1: Khởi tạo project

```bash
cd nguyen-dinh-hoa-ngai
mkdir frontend
cd frontend
```

### Bước 2: Tạo `package.json`

```json
{
  "name": "nguyen-dinh-hoa-ngai-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "tsc": "tsc --noEmit"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.59.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.460.0",
    "next": "15.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.53.0",
    "sonner": "^1.7.0",
    "tailwind-merge": "^2.5.4",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.1.3",
    "postcss": "^8",
    "tailwindcss": "^4.0.0",
    "typescript": "^5"
  }
}
```

> Lưu ý: Nếu dùng Next.js 16 thật, đổi `"next": "15.1.3"` thành `"next": "^16.0.0"` và `"eslint-config-next": "^16.0.0"`.

```bash
pnpm install
```

### Bước 3: Tạo `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Bước 4: Tạo `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Giữ mặc định cho Vercel
  // Nếu sau này cần standalone build: output: 'standalone'
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
```

### Bước 5: Tạo `postcss.config.mjs`

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

### Bước 6: Tạo `src/app/globals.css`

```css
@import "tailwindcss";

@theme {
  --color-background: hsl(30 30% 98%);
  --color-foreground: hsl(20 14% 12%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(20 14% 12%);
  --color-primary: hsl(16 65% 35%);
  --color-primary-foreground: hsl(30 30% 98%);
  --color-secondary: hsl(38 60% 50%);
  --color-secondary-foreground: hsl(20 14% 12%);
  --color-muted: hsl(30 15% 92%);
  --color-muted-foreground: hsl(20 10% 40%);
  --color-accent: hsl(38 70% 92%);
  --color-accent-foreground: hsl(16 65% 35%);
  --color-destructive: hsl(0 70% 45%);
  --color-destructive-foreground: hsl(30 30% 98%);
  --color-border: hsl(30 15% 88%);
  --color-input: hsl(30 15% 88%);
  --color-ring: hsl(16 65% 45%);
  
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-serif: 'Merriweather', 'Times New Roman', serif;
  
  --radius: 0.5rem;
}

* {
  border-color: var(--color-border);
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
  font-feature-settings: "rlig" 1, "calt" 1;
}
```

### Bước 7: Tạo `src/lib/site-config.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/site-config.ts
 * @description Site metadata tổng thể
 * @version 1.0.0
 * @updated 2026-07-23
 */

export const SITE_CONFIG = {
  name: 'Dòng họ Nguyễn Đình',
  shortName: 'Nguyễn Đình',
  description: 'Gia phả điện tử - Dòng họ Nguyễn Đình làng Hòa Ngãi, xã Thanh Hà, huyện Thanh Liêm, tỉnh Hà Nam',
  location: {
    village: 'Làng Hòa Ngãi',
    commune: 'Xã Thanh Hà',
    district: 'Huyện Thanh Liêm',
    province: 'Tỉnh Hà Nam',
  },
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://giapha-nguyen-dinh-hoa-ngai.vercel.app',
  locale: 'vi_VN',
  foundingYear: 1850, // Giả định, chỉnh sau khi admin nhập
} as const;
```

### Bước 8: Tạo `src/lib/supabase/client.ts`

```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase/client.ts
 * @description Supabase browser client
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Singleton cho client components
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
```

### Bước 9: Tạo `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Bước 10: Tạo `src/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { SITE_CONFIG } from '@/lib/site-config';

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  openGraph: {
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    locale: SITE_CONFIG.locale,
    type: 'website',
    siteName: SITE_CONFIG.name,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
```

### Bước 11: Tạo `src/app/page.tsx` (trang chủ tạm)

```tsx
import { SITE_CONFIG } from '@/lib/site-config';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-primary">{SITE_CONFIG.name}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{SITE_CONFIG.description}</p>
      <div className="mt-8">
        <p className="text-sm">Trang chủ đang được xây dựng. Xem chi tiết tại docs/.</p>
      </div>
    </main>
  );
}
```

### Bước 12: Tạo các file tối thiểu khác

`src/app/not-found.tsx`:

```tsx
export default function NotFound() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-4 text-muted-foreground">Trang không tồn tại.</p>
      <a href="/" className="mt-8 inline-block text-primary hover:underline">
        ← Về trang chủ
      </a>
    </main>
  );
}
```

`src/app/loading.tsx`:

```tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <p className="text-muted-foreground">Đang tải...</p>
    </main>
  );
}
```

`src/app/error.tsx`:

```tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-destructive">Đã xảy ra lỗi</h1>
      <p className="mt-4 text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-8 underline">
        Thử lại
      </button>
    </main>
  );
}
```

`src/app/robots.ts`:

```typescript
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin/' },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
```

`src/app/sitemap.ts`:

```typescript
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/cay-gia-pha`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/thanh-vien`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/lich-cung-le`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/tai-lieu`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
```

### Bước 13: Tạo `.env.example`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Site URL (cho metadata, robots, sitemap)
NEXT_PUBLIC_SITE_URL=https://giapha-nguyen-dinh-hoa-ngai.vercel.app
```

### Bước 14: Tạo `.gitignore`

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/
*.tsbuildinfo

# Env
.env
.env.local
.env.*.local

# Vercel
.vercel

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

### Bước 15: Tạo `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
```

## 6. Smoke test

```bash
cd frontend
pnpm install
pnpm tsc       # Phải pass
pnpm lint      # Phải pass
pnpm build     # Phải pass
pnpm dev       # Mở http://localhost:3000
```

Verify:

- [ ] Trang chủ hiển thị "Dòng họ Nguyễn Đình" + mô tả.
- [ ] Console không có error/warning.
- [ ] Network tab không có request fail.
- [ ] Page render trong < 1 giây.

## 7. Lưu ý rủi ro

- **Tailwind CSS 4:** dùng CSS-first config (không cần `tailwind.config.ts`). Nếu muốn dùng `tailwind.config.ts`, đổi `postcss.config.mjs` và import khác.
- **Next.js 16 vs 15:** Nếu Next 16 chưa stable, dùng Next 15.1.3 (đã test).
- **Supabase env:** Nếu chưa có Supabase project, comment out các import supabase trong `client.ts` tạm thời, hoặc dùng placeholder URL (sẽ không gọi query ở prompt này).
- **Vietnamese font:** Inter hỗ trợ tiếng Việt đầy đủ, không cần config thêm.

## 8. Liên kết

- [02-supabase-schema-rls.md](02-supabase-schema-rls.md) - Bước tiếp theo.
- [03-auth-dang-nhap.md](03-auth-dang-nhap.md) - Auth + providers.
- [CLAUDE.md](../CLAUDE.md) - Quy tắc tổng thể.
- [TECHNICAL-DESIGN.md](../docs/02-design/TECHNICAL-DESIGN.md) - Kiến trúc.