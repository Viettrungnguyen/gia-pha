---
project: NguyenDinhHoaNgai
path: docs/04-build/VERCEL-SUPABASE-DEPLOY.md
type: deploy-guide
version: 1.1.0
updated: 2026-07-23
owner: minh-tam
status: approved
---

# Hướng dẫn Deploy lên Vercel + Supabase Cloud

> Triển khai **NguyenDinhHoaNgai** lên production với chi phí **$0/tháng**.
> Stack: Vercel Hobby + Supabase Cloud Free.

## Đường dẫn thật của project

```
C:\Users\Administrator\Documents\Proj\AncestorTree\nguyen-dinh-hoa-ngai\   ← root
nguyen-dinh-hoa-ngai\frontend\                                              ← Next.js app
nguyen-dinh-hoa-ngai\frontend\supabase\migrations\                          ← SQL migrations
nguyen-dinh-hoa-ngai\frontend\supabase\seed.sql                             ← seed data
```

Mọi lệnh dưới đây dùng **đường dẫn tuyệt đối** (Windows PowerShell) — copy/paste chạy được ngay.

## 1. Tổng quan

```
[GitHub repo]  ──push──▶  [Vercel]  ──build──▶  https://giapha-...vercel.app
                                  │
                                  └──env──▶  Supabase Cloud (Singapore)
                                              - Postgres  (6 tables + RLS)
                                              - Storage   (media, clan-documents)
                                              - Auth      (admin user)
```

| Service | Tier | Chi phí | Region |
|---------|------|---------|--------|
| Vercel | Hobby | $0 | Edge global |
| Supabase | Free | $0 | Singapore |
| Domain (tuỳ chọn) | - | ~$10/năm | - |

## 2. Checklist triển khai

- [ ] Tạo Supabase Cloud project tại Singapore
- [ ] Chạy migration `frontend/supabase/migrations/20260723000000_initial_schema.sql`
- [ ] Chạy `frontend/supabase/seed.sql`
- [ ] Tạo 2 buckets `media` + `clan-documents`
- [ ] Tạo admin user + gán role `admin`
- [ ] Push code lên GitHub
- [ ] Import vào Vercel với **Root Directory = `frontend`**
- [ ] Cấu hình 2 env vars
- [ ] Cập nhật Site URL trong Supabase
- [ ] Smoke test production

## 3. Bước 1 — Tạo Supabase Cloud project

1. Mở <https://supabase.com/dashboard>
2. **New Project**:
   - **Name:** `giapha-nguyen-dinh-hoa-ngai`
   - **Database Password:** ≥ 16 ký tự (lưu lại)
   - **Region:** **Singapore**
   - **Plan:** Free
3. Đợi 2 phút để provision xong.
4. **Settings → API** copy 2 giá trị:
   - `Project URL` → sẽ dán vào `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → sẽ dán vào `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Bước 2 — Chạy Migration + Seed

### 4.1 Migration

1. Mở file `C:\Users\Administrator\Documents\Proj\AncestorTree\nguyen-dinh-hoa-ngai\frontend\supabase\migrations\20260723000000_initial_schema.sql` bằng Notepad / VS Code.
2. **Supabase Dashboard → SQL Editor → New query**.
3. Ctrl+A file SQL → Ctrl+C → Paste vào editor → **Run** (Ctrl+Enter).
4. Verify **Table Editor** có 6 bảng: `profiles`, `people`, `families`, `children`, `events`, `clan_documents`.

### 4.2 Seed

1. Mở `frontend\supabase\seed.sql` → copy toàn bộ.
2. **SQL Editor → New query** → Paste → **Run**.
3. Verify bảng `people` có 18 rows.

## 5. Bước 3 — Tạo Storage buckets

Vào **Storage → New bucket** (lặp lại 2 lần):

| Bucket name | Public | File size limit |
|-------------|--------|-----------------|
| `media` | ✓ | 50 MB |
| `clan-documents` | ✓ | 50 MB |

> Mặc định RLS deny-all; cần thêm policy public read. Có thể dùng SQL:
> ```sql
> CREATE POLICY "Public read media" ON storage.objects FOR SELECT
>   USING ( bucket_id IN ('media', 'clan-documents') );
> ```
> Hoặc vào **Storage → Policies → New Policy → SELECT → Allow → all users**.

## 6. Bước 4 — Tạo Admin user

### 6.1 Tạo user

**Authentication → Users → Add user → Create new user**:

- **Email:** `admin@nguyen-dinh.local`
- **Password:** `Admin@2026` (đổi sau lần đăng nhập đầu)
- **Auto Confirm User:** ✓

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

Mở **PowerShell**:

```powershell
cd C:\Users\Administrator\Documents\Proj\AncestorTree\nguyen-dinh-hoa-ngai

# Khởi tạo git (chỉ chạy nếu chưa có git)
git init
git add .
git commit -m "feat: initial commit - NguyenDinhHoaNgai v1.0"

# Tạo repo trống trên GitHub: https://github.com/new
# (KHÔNG tích "Initialize with README", KHÔNG thêm .gitignore, KHÔNG chọn license)

# Kết nối với repo vừa tạo — THAY <username> bằng tài khoản GitHub của bạn
git remote add origin https://github.com/<username>/NguyenDinhHoaNgai.git
git branch -M main
git push -u origin main
```

Nếu dùng SSH thay HTTPS:

```powershell
git remote add origin git@github.com:<username>/NguyenDinhHoaNgai.git
git push -u origin main
```

## 8. Bước 6 — Deploy lên Vercel

### 8.1 Import project

1. Mở <https://vercel.com> → **Sign Up with GitHub** (cùng account với repo).
2. **Add New → Project** → chọn repo `NguyenDinhHoaNgai`.
3. **Configure Project:**

| Field | Value |
|-------|-------|
| Project Name | `giapha-nguyen-dinh-hoa-ngai` |
| Framework Preset | Next.js (auto) |
| **Root Directory** | **`frontend`** ⚠️ **Bắt buộc** |
| Build Command | `pnpm build` (mặc định) |
| Install Command | `pnpm install` (mặc định) |
| Output Directory | `.next` (mặc định) |

4. **Environment Variables** — thêm 3 biến:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` |
| `NEXT_PUBLIC_SITE_URL` | `https://giapha-nguyen-dinh-hoa-ngai.vercel.app` |

5. Click **Deploy**.

### 8.2 Theo dõi build

- Lần đầu: 2-3 phút
- Sau đó mỗi lần push: 30-60 giây

> **Tip:** Nếu build fail do `sharp` / `unrs-resolver`, vào Vercel **Settings → Build & Development Settings**, thêm vào **Install Command**:
> ```
> pnpm install --config.confirmModulesPurge=false
> ```
> Hoặc tạo file `frontend/.npmrc` trong repo với:
> ```
> public-hoist-pattern[]=*sharp*
> ```

## 9. Bước 7 — Cập nhật Site URL trong Supabase

Quan trọng — middleware redirect loop nếu thiếu bước này:

1. **Supabase Dashboard → Settings → API → URL Configuration**
2. **Site URL:** `https://giapha-nguyen-dinh-hoa-ngai.vercel.app`
3. **Additional Redirect URLs:** thêm dòng
   ```
   https://giapha-nguyen-dinh-hoa-ngai.vercel.app/**
   ```
4. **Save**

## 10. Bước 8 — Smoke test production

URL: `https://giapha-nguyen-dinh-hoa-ngai.vercel.app`

| # | URL | Kỳ vọng |
|---|-----|---------|
| 1 | `/` | Hero + 4 section link |
| 2 | `/cay-gia-pha` | SVG cây gia phả, 18 nodes |
| 3 | `/thanh-vien` | 18 thành viên + search + filter |
| 4 | `/thanh-vien/<id>` | Chi tiết + quan hệ |
| 5 | `/lich-cung-le` | Calendar tháng hiện tại |
| 6 | `/tai-lieu` | Grid tài liệu + filter |
| 7 | `/dang-nhap` | Form login |
| 8 | `/robots.txt` | `User-agent: * Allow: /` |
| 9 | `/sitemap.xml` | XML sitemap hợp lệ |

Test admin:

1. `/dang-nhap` → `admin@nguyen-dinh.local` / `Admin@2026`
2. Redirect → `/admin` → 4 stats card
3. `/admin/thanh-vien` → CRUD thử
4. `/admin/lich-cung-le` → CRUD thử
5. `/admin/tai-lieu` → Upload 1 ảnh → kiểm tra hiển thị ở `/tai-lieu`
6. Click **Đăng xuất** → về `/`

## 11. Lỗi thường gặp & cách xử lý

### 11.1 Build fail — "Cannot find module '@/...'"

**Nguyên nhân:** Path alias không resolve.

**Cách xử lý:**
1. Mở `frontend\tsconfig.json`, kiểm tra có `"paths": { "@/*": ["./src/*"] }`.
2. Mở `frontend\next.config.ts`, đảm bảo không có webpack override gây xung đột.

### 11.2 Login fail — "Invalid login credentials"

**Nguyên nhân:** User chưa confirm email.

**Cách xử lý:**

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@nguyen-dinh.local';
```

### 11.3 Middleware redirect loop

**Cách xử lý:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` **không có trailing slash**.
2. **Vercel → Deployments → Redeploy** sau khi sửa env.
3. Clear browser cookies cho domain.

### 11.4 RLS deny INSERT khi CRUD

**Cách xử lý:**

```sql
SELECT u.email, p.role
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'admin@nguyen-dinh.local';

UPDATE profiles SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@nguyen-dinh.local');
```

### 11.5 Storage upload fail — "Bucket not found"

**Cách xử lý:** Tạo lại buckets `media` và `clan-documents` (xem Bước 3).

### 11.6 Build chậm / OOM trên Free tier

**Cách xử lý:** Tạo `frontend/vercel.json`:

```json
{
  "build": { "memory": 2048 }
}
```

Commit + push → Vercel tự rebuild.

### 11.7 Site URL redirect sai domain

Sau khi đổi custom domain, **BẮT BUỘC** cập nhật lại **Supabase → Settings → API → Site URL** + **Additional Redirect URLs**.

## 12. Custom Domain (tuỳ chọn)

1. Mua domain (Cloudflare Registrar / Namecheap — ~$10/năm).
2. **Vercel Dashboard → Settings → Domains → Add** → nhập domain.
3. Cấu hình DNS theo hướng dẫn của Vercel.
4. Đợi SSL provision (5-30 phút).
5. Cập nhật lại **Supabase Site URL** sang domain mới.

## 13. CI/CD workflow

Mỗi lần push code → Vercel tự động:

- Detect thay đổi → build
- Branch ≠ `main` → tạo **Preview URL** (vd: `feature-x-nguyen-dinh.vercel.app`)
- Merge vào `main` → tự động deploy **Production**

Workflow khuyến nghị:

```powershell
# Branch mới
git checkout -b feature/my-feature

# Code, test local
cd C:\Users\Administrator\Documents\Proj\AncestorTree\nguyen-dinh-hoa-ngai\frontend
pnpm tsc

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

| Metric | Target |
|--------|--------|
| Performance | ≥ 90 |
| Accessibility | ≥ 90 |
| SEO | ≥ 90 |
| Best Practices | ≥ 90 |

## 15. Backup plan

| Sự cố | Hành động |
|-------|-----------|
| Vercel down | Check <https://vercel.com/status>. Code ở GitHub, có thể deploy sang Netlify / Cloudflare Pages |
| Supabase down | Check <https://status.supabase.com>. Data an toàn (Supabase backup daily) |
| Cần rollback | `vercel rollback` hoặc **Deployments → chọn bản cũ → Promote to Production** |
| Database xoá nhầm | **Supabase Dashboard → Database → Backups → Restore** (Free giữ 7 ngày) |

## 16. Bảo trì định kỳ

| Tần suất | Công việc |
|----------|-----------|
| Hàng tuần | Kiểm tra Supabase logs, tìm query chậm |
| Hàng tháng | Review Vercel Analytics, xoá branch cũ trong GitHub |
| Hàng quý | Đổi mật khẩu admin, rotate Supabase service key |
| Hàng năm | Gia hạn domain, review chi phí |

## 17. Tham chiếu

- [LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md) — Setup local
- [Supabase Docs](https://supabase.com/docs) — Auth, RLS, Storage
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying) — Vercel specifics
- [Vercel Docs](https://vercel.com/docs) — Project config, env vars, domains

---

**🎉 Production URL của bạn đã live.** Chia sẻ với dòng họ qua Zalo / Facebook.