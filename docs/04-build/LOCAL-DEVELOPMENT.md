---
project: NguyenDinhHoaNgai
path: docs/04-build/LOCAL-DEVELOPMENT.md
type: dev-guide
version: 1.1.0
updated: 2026-07-23
owner: "@dev-team"
status: approved
---

# Hướng dẫn phát triển Local

> Chạy **NguyenDinhHoaNgai** trên máy cá nhân (Windows / macOS / Linux) kết nối tới **Supabase Cloud** miễn phí.

## Đường dẫn gốc của project

```
C:\Users\Administrator\Documents\Proj\AncestorTree\nguyen-dinh-hoa-ngai\
```

Mọi lệnh dưới đây đều có đường dẫn **tương đối** so với thư mục này.

## 1. Yêu cầu môi trường

| Tool | Version | Cài đặt |
|------|---------|---------|
| Node.js | 20.x hoặc 22.x | <https://nodejs.org> hoặc `nvm install 20` |
| pnpm | ≥ 9.x | `npm install -g pnpm` |
| Git | ≥ 2.30 | <https://git-scm.com> |
| Supabase CLI (tuỳ chọn) | ≥ 2.x | <https://supabase.com/docs/guides/cli> |

## 2. Clone & cài dependencies

```bash
# Mở Terminal / PowerShell, chuyển về thư mục cha
cd C:\Users\Administrator\Documents\Proj\AncestorTree

# Clone (chỉ chạy 1 lần đầu)
git clone https://github.com/Minh-Tam-Solution/NguyenDinhHoaNgai.git nguyen-dinh-hoa-ngai

# Vào thư mục project
cd nguyen-dinh-hoa-ngai

# Cài dependencies của frontend
cd frontend
pnpm install
```

> **Lưu ý pnpm 11.x:** nếu gặp `[ERR_PNPM_IGNORED_BUILDS] sharp / unrs-resolver` thì chạy tiếp:
> ```bash
> pnpm config set onlyBuiltDependencies '["sharp","unrs-resolver"]'
> pnpm install
> ```
> Hai package này chỉ cần cho Next.js Image Optimization; build vẫn pass nếu bỏ qua.

## 3. Cấu hình Supabase

### 3.1 Tạo project trên Supabase Cloud

1. Vào <https://supabase.com/dashboard>.
2. **New Project**:
   - **Name:** `giapha-nguyen-dinh-hoa-ngai`
   - **Database Password:** ≥ 16 ký tự (lưu lại)
   - **Region:** **Singapore** (`ap-southeast-1`)
   - **Plan:** Free
3. Đợi 1-2 phút để project sẵn sàng.

### 3.2 Lấy API Keys

Vào **Settings → API**, copy 2 giá trị:

| Field | Env var |
|-------|---------|
| `Project URL` (vd: `https://abcxyz.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

### 3.3 Tạo file `.env.local`

Từ thư mục project gốc:

**Windows PowerShell:**
```powershell
cd frontend
Copy-Item .env.example .env.local
notepad .env.local
```

**macOS / Linux:**
```bash
cd frontend
cp .env.example .env.local
nano .env.local
```

Sửa 2 dòng đầu:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> ⚠️ `.env.local` đã có trong `.gitignore`, KHÔNG commit.

## 4. Khởi tạo Database

### 4.1 Chạy Migration

1. Vào **Supabase Dashboard → SQL Editor → New query**.
2. Mở file `frontend/supabase/migrations/20260723000000_initial_schema.sql` bằng editor.
3. Copy **toàn bộ** nội dung → Paste vào SQL Editor → **Run** (Ctrl+Enter).
4. Kiểm tra **Table Editor**: phải có 6 bảng — `profiles`, `people`, `families`, `children`, `events`, `clan_documents`.

### 4.2 Chạy Seed (dữ liệu demo)

1. **SQL Editor → New query**.
2. Mở file `frontend/supabase/seed.sql` → copy toàn bộ → Paste → **Run**.
3. Verify trong **Table Editor**:

| Bảng | Số rows |
|------|---------|
| `people` | ~18 |
| `families` | ~6 |
| `children` | ~12 |
| `events` | ~5 |
| `clan_documents` | ~3 |

### 4.3 Tạo Storage buckets

Vào **Storage → New bucket** (lặp lại 2 lần):

| Bucket name | Public | Max size |
|-------------|--------|----------|
| `media` | ✓ | 50 MB |
| `clan-documents` | ✓ | 50 MB |

### 4.4 Tạo Admin user

1. **Authentication → Users → Add user → Create new user**:
   - Email: `admin@nguyen-dinh.local`
   - Password: `Admin@2026` (đổi sau khi đăng nhập lần đầu)
   - Auto Confirm User: ✓
2. **SQL Editor → New query**, chạy:

```sql
UPDATE profiles
SET role = 'admin', full_name = 'Admin Nguyễn Đình'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@nguyen-dinh.local'
);
```

## 5. Chạy Dev Server

Từ thư mục `frontend`:

```bash
pnpm dev
```

Mở <http://localhost:3000>:

| URL | Kiểm tra |
|-----|----------|
| `/` | Trang chủ + 4 section link |
| `/cay-gia-pha` | SVG cây gia phả |
| `/thanh-vien` | 18 thành viên |
| `/lich-cung-le` | Calendar tháng |
| `/tai-lieu` | Grid tài liệu |
| `/dang-nhap` | Form login |

Đăng nhập admin → vào `/admin` → CRUD thử.

## 6. Cấu trúc thư mục (đường dẫn thật)

```
nguyen-dinh-hoa-ngai/                                ← project root
├── docs/
│   └── 04-build/
│       ├── LOCAL-DEVELOPMENT.md                    ← file này
│       ├── VERCEL-SUPABASE-DEPLOY.md
│       └── IMPLEMENTATION-PLAN.md
├── prompts/                                         ← file hướng dẫn AI từng sprint
│   ├── 00-INDEX.md
│   ├── 01-scaffold-frontend.md
│   └── ... (11 prompts)
├── frontend/                                        ← Next.js app
│   ├── src/
│   │   ├── app/                                     ← App Router
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   └── middleware.ts                            ← Next.js 16 middleware (auth)
│   ├── supabase/
│   │   ├── migrations/
│   │   │   └── 20260723000000_initial_schema.sql
│   │   └── seed.sql
│   ├── .env.example
│   ├── .env.local                                   ← gitignore, tự tạo
│   ├── next.config.ts
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── tsconfig.json
├── CLAUDE.md                                        ← guidelines cho AI
├── README.md
└── .sdlc-config.json
```

> **Lưu ý:** Project chỉ có **1 file middleware** tại `frontend/src/middleware.ts` (không phải `proxy.ts` — convention đã đổi giữa các phiên bản Next.js).

## 7. Lệnh thường dùng

Tất cả chạy từ thư mục `frontend/`:

```bash
# Type check (không build)
pnpm tsc

# Lint
pnpm lint

# Build production (output .next/)
pnpm build

# Chạy production server sau khi build
pnpm start

# Supabase CLI (nếu cài) — KHÔNG bắt buộc, project dùng Cloud
supabase start
supabase stop
supabase db reset
```

## 8. Workflow khi code

```bash
# 1. Tạo branch mới
git checkout -b feature/my-feature

# 2. Đọc prompt tương ứng trong prompts/ (vd: prompts/05-public-thanh-vien.md)

# 3. Code theo hướng dẫn

# 4. Verify
pnpm tsc && pnpm lint && pnpm build

# 5. Test thủ công trên browser (http://localhost:3000)

# 6. Commit + Push
git add .
git commit -m "feat: add people list page"
git push origin feature/my-feature

# 7. Mở Pull Request trên GitHub
# 8. Vercel tự tạo Preview URL → review → merge vào main
```

## 9. Debug nhanh

| Lỗi | Cách xử lý |
|-----|-----------|
| Cookie không set | Check `NEXT_PUBLIC_SUPABASE_URL` trong `.env.local` khớp với **Supabase Dashboard → Settings → API** |
| RLS deny | DevTools → Network → mở response Supabase; thường thấy "new row violates row-level security policy" → kiểm tra role user trong `profiles` |
| Middleware redirect loop | Xoá cookie `sb-*-auth-token` trong DevTools → Application → Cookies |
| Build fail | Chạy `pnpm tsc` để xem lỗi TypeScript đầu tiên |
| `pnpm install` warning sharp | Chạy `pnpm config set onlyBuiltDependencies '["sharp","unrs-resolver"]'` rồi `pnpm install` lại |
| Port 3000 bận | `pnpm dev -- -p 4000` |

## 10. Liên kết

- [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) — Sprint breakdown
- [VERCEL-SUPABASE-DEPLOY.md](VERCEL-SUPABASE-DEPLOY.md) — Triển khai production
- [prompts/01-scaffold-frontend.md](../../prompts/01-scaffold-frontend.md) — Hướng dẫn scaffold
- [Supabase Docs](https://supabase.com/docs) — Auth, RLS, Storage
- [Next.js Docs](https://nextjs.org/docs) — App Router, Middleware