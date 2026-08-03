---
project: NguyenDinhHoaNgai
path: docs/04-build/VERCEL-SUPABASE-DEPLOY.md
type: deploy-guide
version: 1.0.0
updated: 2026-08-03
owner: "@dev-team"
status: approved
---

# Hướng dẫn Deploy Vercel + Supabase

> Hướng dẫn từng bước triển khai **NguyenDinhHoaNgai** lên Vercel (frontend) và
> Supabase Cloud (backend). Repo: `https://github.com/Viettrungnguyen/gia-pha`.

## 0. Tổng quan kiến trúc

```
                    ┌────────────────────────────┐
                    │   Vercel (sin1, Edge)      │
   Trình duyệt ──▶  │   Next.js 16 (frontend)    │
                    │   Root Directory: frontend │
                    └────────────┬───────────────┘
                                 │ HTTPS (anon JWT)
                                 ▼
                    ┌────────────────────────────┐
                    │ Supabase Cloud (Singapore) │
                    │  • Postgres + RLS          │
                    │  • Auth (email/password)   │
                    │  • Storage (media,         │
                    │    clan-documents)         │
                    └────────────────────────────┘
```

- **Frontend**: Vercel region `sin1` (Singapore).
- **Backend**: Supabase region Singapore.
- **3 env vars** cần thêm vào Vercel: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
- **2 migration SQL** chạy thủ công trên Supabase SQL Editor.
- **2 bucket Storage** công khai: `media`, `clan-documents`.

---

## 1. Chuẩn bị

Trước khi bắt đầu, chuẩn bị:

- [ ] Tài khoản GitHub `viettrungnguyen` đã có quyền push repo `gia-pha`.
- [ ] Tài khoản Vercel (đăng ký bằng GitHub).
- [ ] Tài khoản Supabase (đăng ký bằng GitHub).
- [ ] Local đã `pnpm install` thành công và `pnpm dev` chạy được.

---

## 2. Supabase

### 2.1 Tạo project

1. Mở https://supabase.com/dashboard → **New Project**.
2. **Organization**: tạo mới `NguyenDinh` hoặc dùng cá nhân.
3. **Project name**: `giapha-nguyen-dinh-hoa-ngai`.
4. **Database Password**: ≥ 16 ký tự, lưu vào password manager (không commit).
5. **Region**: chọn **Singapore** (khớp `sin1` của Vercel).
6. **Pricing Plan**: Free cho development.
7. Bấm **Create new project** → chờ 1-2 phút.

Sau khi project ready, mở **Settings → API** và copy ra 2 giá trị:

- **Project URL** (vd: `https://abcdefgh.supabase.co`)
- **anon public key** (JWT bắt đầu bằng `eyJ...`)

### 2.2 Chạy SQL migration

Vào **SQL Editor → New query** (lặp lại 3 lần, mỗi lần dán nội dung 1 file rồi Run):

| # | File trong repo | Mục đích |
|---|------------------|----------|
| 1 | `frontend/supabase/migrations/20260723000000_initial_schema.sql` | Tạo 6 bảng + RLS + indexes |
| 2 | `frontend/supabase/migrations/20260724000001_restore_directory_privacy.sql` | RLS bổ sung cho directory/privacy |
| 3 | `frontend/supabase/seed.sql` | 18 thành viên demo, 5 đời |

Kiểm tra:

```sql
-- Bảng `people` phải có 18 hàng
SELECT COUNT(*) AS people_count FROM people;
```

### 2.3 Tạo Storage buckets

Vào **Storage → New bucket** (lặp lại 2 lần):

| Bucket | Public | File size limit | Allowed MIME |
|--------|--------|------------------|---------------|
| `media` | ✓ | 50 MB | `image/*`, `video/mp4` |
| `clan-documents` | ✓ | 50 MB | `image/*`, `application/pdf`, `video/mp4` |

Sau khi tạo 2 bucket, vào **SQL Editor → New query**:

```sql
-- Cho phép đọc công khai (chỉ SELECT, không cần auth)
CREATE POLICY "Public read media" ON storage.objects
  FOR SELECT USING (bucket_id IN ('media', 'clan-documents'));
```

### 2.4 Tạo admin user đầu tiên

1. **Authentication → Users → Add user → Create new user**:

   | Field | Value |
   |-------|-------|
   | Email | `admin@nguyen-dinh.local` |
   | Password | `Admin@2026` (đổi sau lần đăng nhập đầu) |
   | Auto Confirm User | ✓ bật |

2. **SQL Editor → New query**:

```sql
UPDATE profiles
SET role = 'admin', full_name = 'Admin Nguyễn Đình'
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'admin@nguyen-dinh.local'
);
```

> Không có đăng ký công khai. Mỗi admin mới phải tạo thủ công theo cách này.

### 2.5 Cấu hình URL (làm sau khi deploy Vercel)

Tạm thời bỏ qua bước này. Quay lại sau khi có URL Vercel (mục 3.4).

---

## 3. Vercel

### 3.1 Import project

1. Đăng nhập https://vercel.com bằng GitHub `viettrungnguyen`.
2. **Add New → Project**.
3. **Import Git Repository**: chọn `Viettrungnguyen/gia-pha` → **Import**.
4. Trong **Configure Project**:

   | Field | Value |
   |-------|-------|
   | Project Name | `gia-pha` |
   | Framework Preset | Next.js (auto) |
   | **Root Directory** | **`frontend`** ← bắt buộc |
   | Build Command | `pnpm run build` |
   | Install Command | `pnpm install` |
   | Output Directory | `.next` |

5. Mở rộng **Environment Variables**, thêm 3 biến (chọn `Production`):

   | Name | Value | Environment |
   |------|-------|--------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://abcdefgh.supabase.co` | Production |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | Production |
   | `NEXT_PUBLIC_SITE_URL` | `https://gia-pha-[hash].vercel.app` | Production |

   > Ghi `NEXT_PUBLIC_SITE_URL` tạm bằng URL Vercel dự đoán sẽ cấp (hash là chuỗi
   > ngẫu nhiên). Sau khi deploy xong sẽ cập nhật lại cho khớp URL thực tế.

### 3.2 Deploy lần đầu

Bấm **Deploy** → chờ 2-3 phút.

Sau khi build thành công, Vercel sẽ cấp URL dạng `https://gia-pha-[hash].vercel.app`.
Nếu muốn URL đẹp `gia-pha-eight.vercel.app` → mục 3.3.

### 3.3 Gán lại domain (tuỳ chọn)

1. **Project Settings → Domains**.
2. Nhập `gia-pha` (không có phần mở rộng) → Vercel gợi ý `gia-pha.vercel.app` hoặc
   `gia-pha-N.vercel.app` với `N` là số tự tăng.
3. Bấm **Add** → đợi DNS cập nhật (~30 giây).

URL chính thức bây giờ là `https://gia-pha-eight.vercel.app` (hoặc tương tự).

### 3.4 Cập nhật Supabase Site URL

Quay lại **Supabase → Settings → API → URL Configuration**:

- **Site URL**: `https://gia-pha-eight.vercel.app`
- **Additional Redirect URLs** (mỗi dòng một entry):
  - `https://gia-pha-eight.vercel.app/**`
  - `https://gia-pha-*.vercel.app/**` (cho Preview deployments)

> Bước này bắt buộc. Nếu thiếu, middleware sẽ rơi vào vòng lặp redirect ở
> `getUser()` và toàn bộ trang auth sẽ trả về 500.

### 3.5 Cập nhật env `NEXT_PUBLIC_SITE_URL`

Sau khi có URL chính thức, quay lại **Vercel → Settings → Environment Variables**,
sửa `NEXT_PUBLIC_SITE_URL` cho đúng, rồi **Deployments → Redeploy**.

---

## 4. Smoke test

Mở trình duyệt, test theo thứ tự:

### 4.1 Public pages (không cần đăng nhập)

| # | URL | Kỳ vọng |
|---|-----|---------|
| 1 | `/` | Hero + 4 section link, không lỗi 500 |
| 2 | `/cay-gia-pha` | SVG cây gia phả render, có thể zoom/pan |
| 3 | `/thanh-vien` | Grid 18 thành viên, ô tìm kiếm hoạt động |
| 4 | `/thanh-vien/<id>` | Chi tiết thành viên + quan hệ cha/mẹ/vợ/chồng/con |
| 5 | `/lich-cung-le` | Lịch tháng + danh sách sự kiện |
| 6 | `/tai-lieu` | Grid tài liệu (hoặc empty state nếu chưa upload) |
| 7 | `/robots.txt` | Trả về `Disallow: /admin/` |
| 8 | `/sitemap.xml` | XML hợp lệ, ≥ 6 URL |

### 4.2 Admin pages (cần đăng nhập)

1. Vào `/dang-nhap` → email `admin@nguyen-dinh.local` / password `Admin@2026`.
2. Tạo 1 thành viên mới ở `/admin/thanh-vien` → reload `/thanh-vien`, kiểm tra xuất hiện.
3. Tạo 1 sự kiện ở `/admin/lich-cung-le` → reload `/lich-cung-le`, kiểm tra xuất hiện.
4. Upload 1 ảnh (≤ 5 MB) ở `/admin/tai-lieu` → reload `/tai-lieu`, kiểm tra ảnh hiển thị.
5. Đăng xuất → kiểm tra các trang public vẫn hoạt động.

### 4.3 API health (tuỳ chọn)

```bash
# Robots
curl -I https://gia-pha-eight.vercel.app/robots.txt

# Sitemap
curl https://gia-pha-eight.vercel.app/sitemap.xml | head -n 5
```

---

## 5. Xử lý lỗi thường gặp

### 5.1 Login fail — Invalid login credentials

- User chưa confirm email. Chạy SQL:

  ```sql
  UPDATE auth.users SET email_confirmed_at = NOW()
  WHERE email = 'admin@nguyen-dinh.local';
  ```
- Password sai (phân biệt hoa/thường).
- Email không tồn tại trong `auth.users`.

### 5.2 Middleware redirect loop

Triệu chứng: mọi request đều trả về 307 liên tục.

- `NEXT_PUBLIC_SUPABASE_URL` có dấu `/` ở cuối → xoá.
- Supabase **Site URL** chưa khớp domain Vercel.
- Cookie session bị hỏng → xoá cookie domain `vercel.app` rồi thử lại.
- Sau khi sửa env, **Vercel → Deployments → Redeploy**.

### 5.3 Build fail — Out of memory

Đã xử lý trong `frontend/vercel.json` (`memory: 2048`). Nếu vẫn lỗi:

- Vào **Settings → Functions → Advanced → Node Function Memory** = 2048.
- Install Command: `pnpm install --config.confirmModulesPurge=false`.

### 5.4 Storage upload fail — Bucket not found

- Bucket chưa tạo → tạo lại theo mục 2.3.
- Bucket name viết thường, không dấu gạch ngang ở đầu/cuối.

### 5.5 Trang public trống, console báo "supabase url is invalid"

- Env chưa inject lúc build. Kiểm tra 3 biến đã set cho **Production**.
- **Redeploy** sau khi sửa env.

### 5.6 RLS error — "new row violates row-level security policy"

Triệu chứng: admin không insert/update được vào `people`, `events`, `clan_documents`.

- `profiles.role` chưa được set = `'admin'`. Chạy lại SQL ở mục 2.4.
- Policies RLS yêu cầu `auth.uid()` trong `profiles.role = 'admin'`.

### 5.7 Storage RLS — Upload succeed nhưng không hiển thị public

- Policy SELECT cho `storage.objects` chưa có. Chạy lại SQL mục 2.3.
- Bucket `Public` chưa bật.

---

## 6. CI/CD & quy trình sau triển khai

### 6.1 Production

```bash
git push origin main
# Vercel tự động build + deploy Production
# Commit history xem tại https://github.com/Viettrungnguyen/gia-pha/commits/main
```

### 6.2 Preview deployments

```bash
git checkout -b feature/them-trang-moi
# sửa code
git push origin feature/them-trang-moi
# mở Pull Request trên GitHub
# Vercel bot sẽ comment URL Preview dạng feature-them-trang-moi-gia-pha.vercel.app
```

### 6.3 Rollback

- **Vercel → Deployments** → chọn bản cũ → menu ⋯ → **Promote to Production**.
- Hoặc revert commit trên GitHub rồi push.

---

## 7. Tùy chọn nâng cao

### 7.1 Custom domain

1. Mua domain (Cloudflare Registrar, Namecheap, v.v.).
2. Vercel → **Settings → Domains → Add**: nhập `giapha.nguyen-dinh.com`.
3. Trỏ DNS theo hướng dẫn Vercel (CNAME hoặc A record).
4. Sau khi active, cập nhật **Supabase Site URL** và
   `NEXT_PUBLIC_SITE_URL` cho khớp → Redeploy.

### 7.2 Tự động backup database

Vào **Supabase → Settings → Database → Backups** → bật **Point-in-time recovery**
(7 ngày trên Plan Pro, 1 ngày trên Free).

### 7.3 Monitoring

- **Vercel → Analytics** → bật Web Analytics (free).
- **Supabase → Logs** → xem API logs theo thời gian thực.
- **Supabase → Reports** → số lượng auth users, DB size, storage usage.

### 7.4 Thêm admin mới

1. Supabase → **Authentication → Users → Add user** (email mới).
2. SQL Editor:

   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'new-admin@nguyen-dinh.local');
   ```

---

## 8. Checklist triển khai

Đánh dấu khi hoàn thành:

- [ ] Supabase project tại Singapore đã tạo.
- [ ] 2 file SQL migration + 1 file seed đã chạy thành công.
- [ ] Bảng `people` có 18 bản ghi.
- [ ] 2 Storage bucket `media`, `clan-documents` đã tạo (public).
- [ ] Admin user đã tạo + `profiles.role = 'admin'`.
- [ ] Vercel project đã import, Root Directory = `frontend`.
- [ ] 3 env vars đã thêm (Production).
- [ ] Vercel deploy đầu tiên thành công.
- [ ] Supabase Site URL + Additional Redirect URLs đã trỏ về domain Vercel.
- [ ] Smoke test 8 URL public + admin CRUD pass.
- [ ] (Tuỳ chọn) custom domain đã gắn + DNS đã trỏ.
- [ ] (Tuỳ chọn) Vercel Analytics đã bật.

---

## 9. Liên hệ & tài liệu tham khảo

- **Repo**: https://github.com/Viettrungnguyen/gia-pha
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Deploy**: https://nextjs.org/docs/app/building-your-application/deploying
- **Tài liệu trong repo**:
  - [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) — bản rút gọn (cheat sheet).
  - [LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md) — phát triển cục bộ.
  - [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) — kế hoạch triển khai sprint.
