---
project: NguyenDinhHoaNgai
path: prompts/11-deploy-vercel-supabase.md
type: prompt
version: 1.0.0
updated: 2026-07-23
---

# 11 - Deploy lên Vercel + Supabase

## 1. Mục tiêu

Triển khai production: Supabase Cloud project + Vercel deployment. Chi phí $0/tháng.

## 2. Tiêu chí hoàn thành

- [ ] Supabase Cloud project tại Singapore.
- [ ] Migration + seed đã chạy.
- [ ] Admin user đã tạo và verify role.
- [ ] Storage buckets đã tạo.
- [ ] Code push lên GitHub.
- [ ] Vercel project import với Root Directory = `frontend`.
- [ ] 2 env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) configured.
- [ ] URL public truy cập được, hiển thị trang chủ.
- [ ] Đăng nhập admin hoạt động trên production URL.
- [ ] Smoke test toàn bộ.

## 3. Hướng dẫn chi tiết

> Tham chiếu: [`docs/04-build/VERCEL-SUPABASE-DEPLOY.md`](../docs/04-build/VERCEL-SUPABASE-DEPLOY.md) - có ảnh minh họa chi tiết.

Prompt này tóm tắt các bước cho AI thực hiện deployment tự động hoặc hỗ trợ user.

## 4. Bước thực hiện

### Bước 1: Hướng dẫn user tạo Supabase project

```bash
# Yêu cầu user:
# 1. Vào https://supabase.com/dashboard
# 2. New Project:
#    - Name: giapha-nguyen-dinh-hoa-ngai
#    - Database Password: <mật khẩu mạnh - lưu lại>
#    - Region: Singapore
# 3. Save Project URL và anon key (Settings → API)
```

### Bước 2: Hướng dẫn chạy migrations

```bash
# Yêu cầu user:
# 1. SQL Editor → New query
# 2. Paste toàn bộ frontend/supabase/migrations/20260723000000_initial_schema.sql → Run
# 3. New query → Paste frontend/supabase/seed.sql → Run
# 4. Verify: Table Editor → 6 bảng có data
```

### Bước 3: Tạo Storage buckets

```bash
# Yêu cầu user (qua UI):
# Storage → New bucket:
#   - media (Public, 50MB)
#   - clan-documents (Public, 50MB)
```

### Bước 4: Tạo admin user

```bash
# Yêu cầu user (qua UI):
# Authentication → Users → Add user → Create new user
#   - Email: admin@nguyen-dinh.local
#   - Password: Admin@2026
#   - Auto Confirm User: ✓
# 
# Sau đó SQL Editor:
UPDATE profiles
SET role = 'admin', full_name = 'Admin Nguyễn Đình'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@nguyen-dinh.local'
);
```

### Bước 5: Hướng dẫn push code lên GitHub

```powershell
cd C:\Users\Administrator\Documents\Proj\AncestorTree\nguyen-dinh-hoa-ngai

# Khởi tạo git (nếu chưa)
git init
git add .
git commit -m "feat: initial commit - NguyenDinhHoaNgai v1.0"

# Push
git remote add origin https://github.com/<username>/NguyenDinhHoaNgai.git
git branch -M main
git push -u origin main
```

### Bước 6: Hướng dẫn deploy Vercel

```bash
# Yêu cầu user (qua UI):
# 1. Vào https://vercel.com → Sign Up with GitHub
# 2. Add New → Project → Import NguyenDinhHoaNgai
# 3. Configure:
#    - Project Name: giapha-nguyen-dinh-hoa-ngai
#    - Framework: Next.js
#    - Root Directory: frontend
#    - Build Command: pnpm build
#    - Install Command: pnpm install
# 4. Environment Variables:
#    - NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
# 5. Deploy
```

### Bước 7: Cấu hình Site URL trong Supabase

```bash
# Yêu cầu user:
# Settings → API → URL Configuration
#   Site URL: https://giapha-nguyen-dinh-hoa-ngai.vercel.app
#   Additional Redirect URLs: https://giapha-nguyen-dinh-hoa-ngai.vercel.app/**
# Save
```

### Bước 8: Smoke test production

```bash
# Test checklist:
# 1. Truy cập https://giapha-nguyen-dinh-hoa-ngai.vercel.app → trang chủ load
# 2. /cay-gia-pha → SVG cây gia phả
# 3. /thanh-vien → 18 thành viên
# 4. /lich-cung-le → calendar + danh sách
# 5. /tai-lieu → 3 tài liệu
# 6. /dang-nhap → login admin → vào /admin thành công
# 7. CRUD ở /admin/thanh-vien, /lich-cung-le, /tai-lieu
# 8. Lighthouse audit: Performance ≥ 90
```

## 5. Tự động hóa với Vercel CLI (optional)

Nếu user muốn tự động deploy từ terminal:

```bash
# Cài Vercel CLI
npm install -g vercel

# Login
vercel login

# Trong thư mục nguyen-dinh-hoa-ngai
cd nguyen-dinh-hoa-ngai
vercel --prod

# Làm theo prompt:
# - Set up and deploy? Yes
# - Which scope? <user account>
# - Link to existing project? No (first time) hoặc Yes
# - Project name: giapha-nguyen-dinh-hoa-ngai
# - In which directory is your code located? ./frontend
# - Override settings? No

# Sau khi deploy lần đầu, thêm env vars:
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste value
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste value

# Redeploy
vercel --prod
```

## 6. Custom Domain (optional)

```bash
# 1. Mua domain (Cloudflare Registrar, Namecheap)
# 2. Vercel Dashboard → Settings → Domains → Add
# 3. Configure DNS theo hướng dẫn
# 4. Đợi SSL (5-30 phút)
# 5. Update Site URL trong Supabase
```

## 7. Lỗi thường gặp và cách xử lý

### Lỗi 1: Build fail "Cannot find module '@/...'"

**Nguyên nhân:** Path alias `@/*` không resolve được.

**Cách xử lý:**
1. Verify `tsconfig.json` có `paths: { "@/*": ["./src/*"] }`.
2. Vercel có thể không cần `tsconfig.json` paths (chỉ Next.js dùng). Verify `next.config.ts` không có config khác.

### Lỗi 2: Login fail "Invalid login credentials"

**Nguyên nhân:** User chưa confirm email.

**Cách xử lý:**
```sql
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'admin@nguyen-dinh.local';
```

### Lỗi 3: Middleware redirect loop

**Nguyên nhân:** Cookie không sync giữa Supabase và Vercel domain.

**Cách xử lý:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` đúng (không có trailing slash).
2. Vào Vercel → redeploy với env mới.

### Lỗi 4: RLS deny INSERT

**Nguyên nhân:** User role không phải 'admin'.

**Cách xử lý:**
```sql
-- Verify role
SELECT email, role FROM profiles
JOIN auth.users ON auth.users.id = profiles.user_id
WHERE email = 'admin@nguyen-dinh.local';

-- Fix nếu cần
UPDATE profiles SET role = 'admin' WHERE ...;
```

### Lỗi 5: Storage upload fail "Bucket not found"

**Nguyên nhân:** Bucket chưa tạo.

**Cách xử lý:**
1. Supabase Dashboard → Storage → New bucket → `media` và `clan-documents`.

## 8. Post-deployment checklist

Sau khi deploy thành công, kiểm tra:

- [ ] **Performance:** Lighthouse mobile ≥ 90.
- [ ] **Accessibility:** Lighthouse a11y ≥ 90.
- [ ] **SEO:** Lighthouse SEO ≥ 90.
- [ ] **Best Practices:** Lighthouse BP ≥ 90.
- [ ] **Sitemap:** `https://...vercel.app/sitemap.xml` trả về XML.
- [ ] **Robots:** `https://...vercel.app/robots.txt` trả về text.
- [ ] **404 page:** `https://...vercel.app/random-path` hiển thị 404.
- [ ] **404 metadata:** OG image preview OK.
- [ ] **Admin login:** Admin đăng nhập thành công.
- [ ] **CRUD:** Tạo/sửa/xóa thành viên, sự kiện, tài liệu OK.
- [ ] **Upload:** Upload 1 ảnh thành công, hiển thị ở trang public.
- [ ] **Logout:** Click logout → redirect về `/`.

## 9. Backup plan

### Nếu Vercel down

1. Check status: https://vercel.com/status
2. Nếu > 5 phút, thông báo user qua kênh riêng (Zalo, SMS).
3. Code vẫn ở GitHub, có thể deploy sang Netlify, Cloudflare Pages.

### Nếu Supabase down

1. Check status: https://status.supabase.com
2. Nếu > 5 phút, thông báo user.
3. Data vẫn an toàn (Supabase có backup).

### Nếu cần rollback

```bash
# Rollback Vercel deployment
vercel rollback

# Hoặc trên UI: Deployments → chọn deployment cũ → Promote to Production
```

## 10. CI/CD workflow

Sau khi deploy lần đầu, mỗi lần push code sẽ tự động:

1. Vercel detect thay đổi → build.
2. Build pass → tạo preview URL (cho branches khác main).
3. Merge vào main → tự động deploy production.

Khuyến nghị workflow:

```bash
# Làm việc trên branch
git checkout -b feature/my-feature

# Code, test
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature

# Mở PR trên GitHub
# Vercel tự động tạo preview URL → review → merge

# Sau merge, production tự động deploy
```

## 11. Monitoring

### Vercel Analytics

Vào Vercel Dashboard → Analytics → xem:
- Real Users page views
- Top pages
- Top countries
- Web Vitals

### Supabase Logs

Vào Supabase Dashboard → Logs → API:
- Query count
- Slow queries
- Errors

### Optional: Sentry

Nếu muốn theo dõi lỗi chi tiết:

1. Tạo account tại [sentry.io](https://sentry.io).
2. Cài `@sentry/nextjs`.
3. Thêm DSN vào Vercel env.
4. Errors sẽ được gửi về Sentry dashboard.

(MVP không cần, có thể thêm sau.)

## 12. Liên kết

- [VERCEL-SUPABASE-DEPLOY.md](../docs/04-build/VERCEL-SUPABASE-DEPLOY.md) - Chi tiết với ảnh.
- [LOCAL-DEVELOPMENT.md](../docs/04-build/LOCAL-DEVELOPMENT.md) - Setup local.
- [SECURITY-PRIVACY.md §14](../docs/02-design/SECURITY-PRIVACY.md) - Incident response.