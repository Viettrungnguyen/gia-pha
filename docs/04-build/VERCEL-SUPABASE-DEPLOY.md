---
project: NguyenDinhHoaNgai
path: docs/04-build/VERCEL-SUPABASE-DEPLOY.md
type: deploy-guide
version: 2.0.0
updated: 2026-08-03
owner: minh-tam
status: approved
---

# Hướng dẫn Deploy lên Vercel + Supabase Cloud

> Triển khai **NguyenDinhHoaNgai** lên production với chi phí **$0/tháng**.
> Stack: Vercel Hobby + Supabase Cloud Free + GitHub.

## Đường dẫn thật của project (cập nhật 2026-08-03)

```
C:\Users\Administrator\Documents\Proj\gia-pha\                  ← repo root
C:\Users\Administrator\Documents\Proj\gia-pha\frontend\         ← Next.js app (subfolder Vercel dùng làm Root Directory)
C:\Users\Administrator\Documents\Proj\gia-pha\frontend\supabase\migrations\   ← SQL migrations
C:\Users\Administrator\Documents\Proj\gia-pha\frontend\supabase\seed.sql      ← seed data
```

> Tài liệu cũ ghi `Documents/Proj/AncestorTree/...` — bỏ qua, đó là đường dẫn tham chiếu cũ.
> Đường dẫn dưới đây dùng `C:\Users\Administrator\Documents\Proj\gia-pha` cho khớp với repo hiện tại.

## 1. Tổng quan

```
[GitHub repo]  ──push──▶  [Vercel]  ──build──▶  https://giapha-nguyen-dinh-hoa-ngai.vercel.app
                                  │
                                  └──env──▶  Supabase Cloud (Singapore)
                                              - Postgres  (6 bảng + RLS)
                                              - Storage   (media, clan-documents)
                                              - Auth      (admin user)
```

| Service        | Tier   | Chi phí    | Region      |
|----------------|--------|------------|-------------|
| Vercel         | Hobby  | $0         | Edge global |
| Supabase       | Free   | $0         | Singapore   |
| GitHub         | Free   | $0         | -           |
| Domain (tuỳ chọn) | -     | ~$10/năm  | -           |

## 2. Checklist triển khai

- [ ] Tạo Supabase Cloud project tại Singapore
- [ ] Chạy migration `frontend/supabase/migrations/20260723000000_initial_schema.sql`
- [ ] Chạy migration `frontend/supabase/migrations/20260724000001_restore_directory_privacy.sql`
- [ ] Chạy `frontend/supabase/seed.sql`
- [ ] Tạo 2 Storage buckets `media` + `clan-documents`
- [ ] Tạo admin user + gán role `admin`
- [ ] Push code lên GitHub
- [ ] Import vào Vercel với **Root Directory = `frontend`**
- [ ] Cấu hình 3 env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`)
- [ ] Cập nhật Site URL trong Supabase
- [ ] Smoke test production

## 3. Bước 1 — Tạo Supabase Cloud project

1. Mở <https://supabase.com/dashboard>
2. **New Project**:
   - **Name:** `giapha-nguyen-dinh-hoa-ngai`
   - **Database Password:** ≥ 16 ký tự, gồm chữ hoa, số, ký tự đặc biệt (lưu lại ở password manager)
   - **Region:** **Singapore** (bắt buộc, vì `vercel.json` đặt `regions: ["sin1"]`)
   - **Plan:** Free
3. Đợi 1-2 phút để provision.
4. **Settings → API** copy 2 giá trị:
   - `Project URL` (dạng `https://abcdefgh.supabase.co`) → sẽ dán vào `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key (chuỗi JWT bắt đầu `eyJ...`) → sẽ dán vào `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Bước 2 — Chạy Migration + Seed

### 4.1 Migration (chạy theo thứ tự thời gian trong tên file)

1. Mở `C:\Users\Administrator\Documents\Proj\gia-pha\frontend\supabase\migrations\20260723000000_initial_schema.sql` bằng VS Code/Notepad.
2. **Supabase Dashboard → SQL Editor → New query**.
3. `Ctrl+A` → `Ctrl+C` → Paste vào editor → **Run** (`Ctrl+Enter`).
4. Verify **Table Editor** có đủ 6 bảng: `profiles`, `people`, `families`, `children`, `events`, `clan_documents`.
5. Lặp lại với file `20260724000001_restore_directory_privacy.sql`.

### 4.2 Seed

1. Mở `frontend\supabase\seed.sql` → copy toàn bộ (~29 KB).
2. **SQL Editor → New query** → Paste → **Run**.
3. Verify:

```sql
SELECT COUNT(*) AS people_count FROM people;
```

→ phải trả về `people_count > 0` (tùy dữ liệu demo).

## 5. Bước 3 — Tạo Storage buckets

Vào **Storage → New bucket** (lặp lại 2 lần):

| Bucket name         | Public | File size limit | MIME types                                 |
|---------------------|--------|-----------------|--------------------------------------------|
| `media`             | ✓      | 50 MB           | image/jpeg, image/png, image/webp, image/gif |
| `clan-documents`    | ✓      | 50 MB           | image/*, application/pdf, video/mp4         |

Sau khi tạo bucket, cần policy public read. Cách nhanh nhất — **SQL Editor → New query**:

```sql
CREATE POLICY "Public read media" ON storage.objects FOR SELECT
  USING ( bucket_id IN ('media', 'clan-documents') );
```

Hoặc vào **Storage → Policies → New Policy → SELECT → Allow → all users** cho từng bucket.

## 6. Bước 4 — Tạo Admin user

### 6.1 Tạo user

**Authentication → Users → Add user → Create new user**:

- **Email:** `admin@nguyen-dinh.local` *(đổi sau khi ổn định)*
- **Password:** `Admin@2026` *(đổi ngay sau lần đăng nhập đầu tiên)*
- **Auto Confirm User:** ✓ (tick)

### 6.2 Gán role admin

**SQL Editor → New query**, paste và Run:

```sql
UPDATE profiles
SET role = 'admin', full_name = 'Admin Nguyễn Đình'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@nguyen-dinh.local'
);
```

Verify:

```sql
SELECT u.email, p.role, p.full_name
FROM auth.users u
JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'admin@nguyen-dinh.local';
```

→ phải trả về `role = 'admin'`.

## 7. Bước 5 — Push code lên GitHub

Repo hiện tại đã có `.git` ở `C:\Users\Administrator\Documents\Proj\gia-pha` và đang ở branch `main`. Kiểm tra:

```powershell
cd C:\Users\Administrator\Documents\Proj\gia-pha
git status           # phải sạch (working tree clean)
git log --oneline -5 # xem lịch sử
```

Nếu repo chưa có trên GitHub, tạo mới tại <https://github.com/new> (KHÔNG tick "Initialize with README", KHÔNG thêm `.gitignore`, KHÔNG chọn license). Rồi kết nối + push:

```powershell
# HTTPS
git remote add origin https://github.com/<username>/NguyenDinhHoaNgai.git
git branch -M main
git push -u origin main
```

```powershell
# SSH (khuyến nghị nếu đã có SSH key)
git remote add origin git@github.com:<username>/NguyenDinhHoaNgai.git
git push -u origin main
```

## 8. Bước 6 — Deploy lên Vercel

### 8.1 Import project

1. Mở <https://vercel.com> → **Sign Up with GitHub** (đúng account chứa repo).
2. **Add New → Project** → chọn repo `NguyenDinhHoaNgai`.
3. **Configure Project:**

| Field                | Value                            |
|----------------------|----------------------------------|
| Project Name         | `giapha-nguyen-dinh-hoa-ngai`    |
| Framework Preset     | Next.js (auto-detect)            |
| **Root Directory**   | **`frontend`** ⚠️ Bắt buộc       |
| Build Command        | `pnpm build` (mặc định)          |
| Install Command      | `pnpm install` (mặc định)        |
| Output Directory     | `.next` (mặc định)               |
| Node.js Version      | 20.x (mặc định Vercel)           |

4. **Environment Variables** — thêm 3 biến (mục "Environment Variables" trong cùng trang):

| Name                          | Value                                                       |
|-------------------------------|-------------------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`    | `https://YOUR_PROJECT.supabase.co`                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (anon public key từ Bước 1)               |
| `NEXT_PUBLIC_SITE_URL`        | `https://giapha-nguyen-dinh-hoa-ngai.vercel.app` *(tạm thời, sửa lại khi có custom domain)* |

Tick cả 3 môi trường: **Production**, **Preview**, **Development** (để preview deploy cũng dùng được).

5. Click **Deploy**.

### 8.2 Theo dõi build

- Lần đầu: 2-3 phút (cold start, install deps).
- Sau đó mỗi lần push: 30-60 giây.
- Nếu build fail, mở **Deployments → chọn deployment đỏ → Logs** để xem chi tiết.

### 8.3 File `frontend/vercel.json` hiện tại

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

Đã được commit ở `frontend/vercel.json`. Vercel tự đọc — không cần copy vào dashboard.

> **Nếu build fail do `sharp` / `unrs-resolver`** (lỗi native module trên Vercel Ubuntu runtime): vào **Settings → Build & Development Settings → Install Command** đổi thành:
> ```
> pnpm install --config.confirmModulesPurge=false
> ```
> Hoặc thêm `frontend/.npmrc` (đã có sẵn trong repo) với:
> ```
> public-hoist-pattern[]=*sharp*
> ```

## 9. Bước 7 — Cập nhật Site URL trong Supabase

Quan trọng — thiếu bước này sẽ gây **redirect loop** ở `/dang-nhap`.

1. **Supabase Dashboard → Settings → API → URL Configuration**
2. **Site URL:** `https://giapha-nguyen-dinh-hoa-ngai.vercel.app`
3. **Additional Redirect URLs:** thêm
   ```
   https://giapha-nguyen-dinh-hoa-ngai.vercel.app/**
   http://localhost:4000/**     ← nếu muốn test local từ máy khác
   ```
4. **Save**

## 10. Bước 8 — Smoke test production

URL: `https://giapha-nguyen-dinh-hoa-ngai.vercel.app`

| # | URL                | Kỳ vọng                                          |
|---|--------------------|--------------------------------------------------|
| 1 | `/`                | Hero + 4 section link                            |
| 2 | `/cay-gia-pha`     | SVG cây gia phả                                  |
| 3 | `/thanh-vien`      | Danh sách + search + filter                      |
| 4 | `/thanh-vien/<id>` | Chi tiết + quan hệ                               |
| 5 | `/lich-cung-le`    | Calendar tháng hiện tại                          |
| 6 | `/tai-lieu`        | Grid tài liệu + filter                           |
| 7 | `/danh-ba`         | Sổ liên lạc dòng họ                              |
| 8 | `/dang-nhap`       | Form login                                       |
| 9 | `/robots.txt`      | `User-agent: * Allow: /`                         |
| 10 | `/sitemap.xml`     | XML sitemap hợp lệ                               |

Test admin:

1. `/dang-nhap` → `admin@nguyen-dinh.local` / `Admin@2026`
2. Redirect → `/admin` → dashboard với stats
3. `/admin/thanh-vien` → CRUD thử (tạo mới 1 người, sửa, xóa)
4. `/admin/lich-cung-le` → CRUD thử
5. `/admin/tai-lieu` → Upload 1 ảnh vào bucket `clan-documents` → kiểm tra hiển thị ở `/tai-lieu`
6. Click **Đăng xuất** → về `/`

## 11. Lỗi thường gặp & cách xử lý

### 11.1 Build fail — "Cannot find module '@/...'"

**Nguyên nhân:** Path alias không resolve.

**Cách xử lý:**
1. Mở `frontend\tsconfig.json`, kiểm tra có `"paths": { "@/*": ["./src/*"] }`.
2. Mở `frontend\next.config.ts`, đảm bảo không có webpack override gây xung đột.
3. Chạy local trước:
   ```powershell
   cd C:\Users\Administrator\Documents\Proj\gia-pha\frontend
   pnpm run build
   ```
   Nếu local fail → sửa trước khi push. Nếu local pass mà Vercel fail → kiểm tra **Root Directory** đã đặt đúng `frontend`.

### 11.2 Build fail — "The 'middleware' file convention is deprecated"

Đã được fix bằng cách dùng `proxy.ts` (Next.js 16 convention). Nếu vẫn còn:
- Đảm bảo file `frontend/src/proxy.ts` tồn tại.
- `frontend/src/middleware.ts` (nếu có) chỉ là re-export.

### 11.3 Login fail — "Invalid login credentials"

**Nguyên nhân:** User chưa confirm email.

**Cách xử lý:**

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@nguyen-dinh.local';
```

### 11.4 Middleware redirect loop

**Cách xử lý:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` **không có trailing slash**.
2. **Vercel → Deployments → Redeploy** sau khi sửa env.
3. Clear browser cookies cho domain (DevTools → Application → Cookies → Clear).

### 11.5 RLS deny INSERT khi CRUD

**Cách xử lý:**

```sql
SELECT u.email, p.role
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'admin@nguyen-dinh.local';

UPDATE profiles SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@nguyen-dinh.local');
```

### 11.6 Storage upload fail — "Bucket not found"

**Cách xử lý:** Tạo lại buckets `media` và `clan-documents` (xem Bước 3).

### 11.7 Build chậm / OOM trên Free tier

**Cách xử lý:** Tạo `frontend/vercel.json`:

```json
{
  "build": { "memory": 2048 }
}
```

> ⚠️ Lưu ý: nếu thêm key `build` vào `vercel.json`, Vercel yêu cầu build phải dùng đúng memory đó. Với project này, build 17 routes mất ~12s, không cần tăng.

### 11.8 Site URL redirect sai domain

Sau khi đổi custom domain, **BẮT BUỘC** cập nhật lại:
1. **Supabase → Settings → API → Site URL** + **Additional Redirect URLs**.
2. Vercel env var `NEXT_PUBLIC_SITE_URL` → redeploy.

### 11.9 Build OK nhưng trang lỗi "supabase.from(...).select(...).single() returns null"

RLS đang chặn. Kiểm tra user đã đăng nhập hay chưa, role admin hay public. Xem `frontend/src/lib/supabase-data-people.ts` — code đã có fallback `source = authData.user ? 'people' : 'public_people'`.

## 12. Custom Domain (tuỳ chọn)

1. Mua domain (Cloudflare Registrar / Namecheap — ~$10/năm cho `.vn`/`.com`).
2. **Vercel Dashboard → Settings → Domains → Add** → nhập domain.
3. Cấu hình DNS theo hướng dẫn của Vercel (thường là CNAME hoặc A record).
4. Đợi SSL provision (5-30 phút).
5. Cập nhật lại:
   - **Supabase Site URL** sang domain mới.
   - Vercel env `NEXT_PUBLIC_SITE_URL` → redeploy.

## 13. CI/CD workflow

Mỗi lần push code → Vercel tự động:

- Detect thay đổi → build
- Branch ≠ `main` → tạo **Preview URL** (vd: `feature-x-nguyen-dinh.vercel.app`)
- Merge vào `main` → tự động deploy **Production**

Workflow khuyến nghị:

```powershell
# Tạo branch mới
cd C:\Users\Administrator\Documents\Proj\gia-pha
git checkout -b feature/my-feature

# Code, test local
cd frontend
pnpm tsc
pnpm run build

# Commit + push
cd ..
git add .
git commit -m "feat: add feature"
git push origin feature/my-feature

# Mở PR trên GitHub → Vercel tạo Preview URL → review → merge vào main
# Production tự động deploy sau merge
```

## 14. Monitoring

### Vercel Analytics

**Vercel Dashboard → Analytics:** real-user pageviews, top pages, Web Vitals (LCP, FID, CLS).

### Supabase Logs

**Supabase Dashboard → Logs → API:** query count, slow queries (>1s), auth errors, storage errors.

### Lighthouse Audit (chạy thủ công)

```powershell
npm install -g lighthouse
lighthouse https://giapha-nguyen-dinh-hoa-ngai.vercel.app --view
```

**Target:**

| Metric         | Target |
|----------------|--------|
| Performance    | ≥ 90   |
| Accessibility  | ≥ 90   |
| SEO            | ≥ 90   |
| Best Practices | ≥ 90   |

## 15. Backup plan

| Sự cố                  | Hành động                                                              |
|------------------------|------------------------------------------------------------------------|
| Vercel down            | Check <https://vercel.com/status>. Code ở GitHub, có thể deploy sang Netlify / Cloudflare Pages |
| Supabase down          | Check <https://status.supabase.com>. Data an toàn (Supabase backup daily) |
| Cần rollback           | `vercel rollback` hoặc **Deployments → chọn bản cũ → Promote to Production** |
| Database xoá nhầm      | **Supabase Dashboard → Database → Backups → Restore** (Free giữ 7 ngày) |

## 16. Bảo trì định kỳ

| Tần suất    | Công việc                                                       |
|-------------|-----------------------------------------------------------------|
| Hàng tuần   | Kiểm tra Supabase logs, tìm query chậm                          |
| Hàng tháng  | Review Vercel Analytics, xoá branch cũ trong GitHub              |
| Hàng quý    | Đổi mật khẩu admin, rotate Supabase service key                 |
| Hàng năm    | Gia hạn domain, review chi phí                                  |

## 17. Tham chiếu

- [LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md) — Setup local (nếu có)
- [DATA-MODEL.md](../02-design/DATA-MODEL.md) — Schema 6 bảng
- [Supabase Docs](https://supabase.com/docs) — Auth, RLS, Storage
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying) — Vercel specifics
- [Vercel Docs](https://vercel.com/docs) — Project config, env vars, domains

---

**🎉 Production URL đã live.** Chia sẻ với dòng họ qua Zalo / Facebook.
