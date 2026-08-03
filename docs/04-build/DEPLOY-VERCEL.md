---
project: NguyenDinhHoaNgai
path: docs/04-build/DEPLOY-VERCEL.md
type: deploy-guide
version: 1.0.0
updated: 2026-08-03
owner: "@dev-team"
status: approved
---

# Hướng dẫn Deploy lên Vercel

> Repo: `https://github.com/Viettrungnguyen/gia-pha` (remote `main` chỉ chứa
> thư mục `nguyen-dinh-hoa-ngai/`). Đối với bản hướng dẫn đầy đủ có ảnh minh
> hoạ, tham khảo [`VERCEL-SUPABASE-DEPLOY.md`](./VERCEL-SUPABASE-DEPLOY.md).

## 0. Tổng quan kiến trúc

```
GitHub: Viettrungnguyen/gia-pha
   ├─ .sdlc-config.json                  ← cấu hình SDLC
   ├─ CLAUDE.md
   ├─ README.md
   ├─ docs/                              ← tài liệu SDLC
   ├─ frontend/                          ← Next.js 16 (Root Directory cho Vercel)
   │     ├─ vercel.json                  ← đã cấu hình sẵn (sin1, 2GB build)
   │     ├─ package.json                 ← Next.js 16, React 19, Tailwind 4
   │     └─ supabase/
   │           ├─ migrations/            ← SQL schema
   │           └─ seed.sql               ← dữ liệu demo 18 thành viên
   └─ prompts/                           ← hướng dẫn AI theo chức năng
```

| Hạng mục        | Giá trị                                                           |
|-----------------|-------------------------------------------------------------------|
| Git repo        | `https://github.com/Viettrungnguyen/gia-pha`                      |
| Branch mặc định  | `main`                                                            |
| Root Directory  | `frontend`                                                          |
| Framework       | Next.js 16 (auto-detect)                                          |
| Build Command   | `pnpm run build`                                                  |
| Install Command | `pnpm install`                                                    |
| Output          | `.next`                                                           |
| Region          | Singapore (`sin1`) — khớp với Supabase                            |
| Memory build    | 2048 MB (đã khoá trong `vercel.json`)                             |

## 1. Checklist triển khai

- [ ] Supabase Cloud project tại region Singapore đã tạo.
- [ ] Hai file SQL đã chạy: `20260723000000_initial_schema.sql` và `20260724000001_restore_directory_privacy.sql`.
- [ ] `seed.sql` đã chạy, bảng `people` có 18 bản ghi.
- [ ] Hai Storage bucket đã tạo: `media` và `clan-documents` (public).
- [ ] Admin user đã tạo và đã gán `role = 'admin'` trong bảng `profiles`.
- [ ] Ba biến môi trường đã thêm trong Vercel (xem mục 4).
- [ ] Site URL trong Supabase đã trỏ về domain Vercel.
- [ ] Smoke test xong 6 trang public + `/admin` + login admin.

## 2. Chuẩn bị phía Supabase (chạy một lần)

### 2.1 Tạo project

1. Vào <https://supabase.com/dashboard> → **New Project**.
2. Đặt tên: `giapha-nguyen-dinh-hoa-ngai`.
3. Chọn Region: **Singapore** (trùng với `sin1` của Vercel).
4. Lưu lại Database Password (≥ 16 ký tự).
5. Sau khi provision, mở **Settings → API** và copy:
   - `Project URL` → sẽ dán vào `NEXT_PUBLIC_SUPABASE_URL`.
   - `anon public` key → sẽ dán vào `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 2.2 Chạy migration + seed

Trong Supabase Dashboard → **SQL Editor → New query**, lần lượt dán và chạy:

1. `nguyen-dinh-hoa-ngai/frontend/supabase/migrations/20260723000000_initial_schema.sql`
2. `nguyen-dinh-hoa-ngai/frontend/supabase/migrations/20260724000001_restore_directory_privacy.sql`
3. `nguyen-dinh-hoa-ngai/frontend/supabase/seed.sql`

Sau khi chạy xong, **Table Editor** phải hiển thị 6 bảng (`profiles`, `people`,
`families`, `children`, `events`, `clan_documents`) và `people` có 18 hàng.

### 2.3 Tạo Storage buckets

**Storage → New bucket** (lặp lại 2 lần):

| Bucket name        | Public | Giới hạn |
|--------------------|--------|----------|
| `media`            | ✓      | 50 MB    |
| `clan-documents`   | ✓      | 50 MB    |

Mặc định Storage chặn đọc công khai. Mở **Storage → Policies → New Policy** cho
`SELECT` của bucket `media` và `clan-documents` (target role `anon`) hoặc chạy
SQL:

```sql
CREATE POLICY "Public read media" ON storage.objects
  FOR SELECT USING (bucket_id IN ('media', 'clan-documents'));
```

### 2.4 Tạo admin user

**Authentication → Users → Add user → Create new user**:

- Email: `admin@nguyen-dinh.local`
- Password: `Admin@2026` (đổi sau lần đăng nhập đầu)
- Auto Confirm User: bật

Sau đó chạy SQL Editor:

```sql
UPDATE profiles
SET role = 'admin', full_name = 'Admin Nguyễn Đình'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@nguyen-dinh.local'
);
```

Kiểm tra:

```sql
SELECT u.email, p.role
FROM auth.users u
JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'admin@nguyen-dinh.local';
-- role phải là 'admin'
```

## 3. Chuẩn bị phía GitHub (đã xong)

Repo đã được push lên `https://github.com/Viettrungnguyen/gia-pha` trên nhánh
`main` (commit `69e2c0e feat(nguyen-dinh-hoa-ngai): initial scaffold …`).

Nếu cần đẩy bổ sung sau này:

```bash
cd C:\Users\Administrator\Documents\Proj\AncestorTree
git add .
git commit -m "feat(<module>): <nội dung>"
git push origin main
```

> **Lưu ý:** file `.env.docker` ở thư mục gốc chứa service-role key thật của
> Supabase. Tuyệt đối không commit và không đẩy lên GitHub. Nếu lỡ push, hãy
> rotate key trong Supabase Dashboard ngay lập tức.

## 4. Cấu hình Vercel

### 4.1 Import project

1. Đăng nhập <https://vercel.com> bằng tài khoản GitHub `viettrungnguyen`.
2. **Add New → Project → Import** repo `Viettrungnguyen/gia-pha`.
3. **Configure Project**:

   | Field            | Value                              |
   |------------------|------------------------------------|
   | Project Name     | `giapha-nguyen-dinh-hoa-ngai`      |
   | Framework        | Next.js (auto)                     |
   | **Root Directory** | **`frontend`** |
   | Build Command    | `pnpm run build`                   |
   | Install Command  | `pnpm install`                     |
   | Output Directory | `.next`                            |

4. **Environment Variables** — thêm 3 biến (áp dụng cho cả Production, Preview
   và Development nếu cần):

   | Name                            | Value                                              |
   |---------------------------------|----------------------------------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL`      | `https://<project-ref>.supabase.co`                |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ…` (anon public key từ Supabase)               |
   | `NEXT_PUBLIC_SITE_URL`          | `https://giapha-nguyen-dinh-hoa-ngai.vercel.app`   |

   > Không cần thêm `NEXT_PUBLIC_LOCAL_MODE`; trên Vercel biến này vắng mặt nên
   > ứng dụng tự dùng Supabase thật.

5. Nhấn **Deploy** và chờ 2-3 phút.

### 4.2 Tự động hoá bằng Vercel CLI (không bắt buộc)

Nếu không muốn dùng UI, có thể chạy CLI từ thư mục gốc repo:

```bash
cd C:\Users\Administrator\Documents\Proj\AncestorTree
npx vercel login
npx vercel link --project giapha-nguyen-dinh-hoa-ngai
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add NEXT_PUBLIC_SITE_URL production
npx vercel --prod
```

## 5. Cấu hình lại Supabase sau khi Deploy

Vào **Supabase Dashboard → Settings → API → URL Configuration**:

- **Site URL**: `https://giapha-nguyen-dinh-hoa-ngai.vercel.app`
- **Additional Redirect URLs** (mỗi dòng một URL):
  - `https://giapha-nguyen-dinh-hoa-ngai.vercel.app/**`
  - `https://giapha-nguyen-dinh-hoa-ngai-*.vercel.app/**` (preview deployments)

Bước này **bắt buộc** — nếu thiếu, middleware sẽ rơi vào vòng lặp redirect khi
gọi `supabase.auth.getUser()`.

## 6. Smoke test production

Mở `https://giapha-nguyen-dinh-hoa-ngai.vercel.app` và kiểm tra tuần tự:

| # | URL                       | Kỳ vọng                                            |
|---|---------------------------|----------------------------------------------------|
| 1 | `/`                       | Hero + 4 section link, không lỗi 500               |
| 2 | `/cay-gia-pha`            | SVG cây gia phả render, không lỗi console          |
| 3 | `/thanh-vien`             | 18 thành viên + ô tìm kiếm                         |
| 4 | `/thanh-vien/<id>`        | Chi tiết thành viên + quan hệ                      |
| 5 | `/danh-ba`                | Danh bạ có lọc theo quyền riêng tư                 |
| 6 | `/lich-cung-le`           | Lịch tháng hiện tại + danh sách sự kiện            |
| 7 | `/stats`                  | Biểu đồ thống kê theo đời/chi/giới tính            |
| 8 | `/tai-lieu`               | Grid tài liệu, có placeholder nếu bucket rỗng      |
| 9 | `/robots.txt`             | Trả về `User-agent: * / Allow: / / Disallow: /admin/` |
| 10| `/sitemap.xml`            | XML sitemap hợp lệ, có 6+ URL                      |

Test luồng admin:

1. `/dang-nhap` → nhập `admin@nguyen-dinh.local` / `Admin@2026` → redirect `/admin`.
2. Vào `/admin/thanh-vien` → tạo mới một thành viên → kiểm tra xuất hiện ở `/thanh-vien`.
3. Vào `/admin/lich-cung-le` → tạo sự kiện thử → kiểm tra ở `/lich-cung-le`.
4. Vào `/admin/tai-lieu` → upload 1 ảnh nhỏ → mở `/tai-lieu` xem ảnh.
5. Click **Đăng xuất** → về `/` và cookie session bị xoá.

## 7. Lỗi thường gặp & cách xử lý

### 7.1 Build fail — "Cannot find module '@/...'"

Nguyên nhân: TypeScript path alias không resolve khi Vercel build.

Cách xử lý:

- Kiểm tra `frontend/tsconfig.json` có `"paths": { "@/*": ["./src/*"] }`.
- Không thêm webpack alias trong `next.config.ts` (Next.js tự dùng tsconfig).

### 7.2 Build fail — "Out of memory" hoặc treo ở `pnpm install`

Đã được xử lý bằng `vercel.json` (`"memory": 2048`). Nếu vẫn lỗi, vào
**Vercel → Settings → Build & Development Settings** và thêm vào **Install
Command**:

```
pnpm install --config.confirmModulesPurge=false
```

### 7.3 Login fail — "Invalid login credentials"

User chưa được confirm email. Chạy SQL:

```sql
UPDATE auth.users SET email_confirmed_at = NOW()
WHERE email = 'admin@nguyen-dinh.local';
```

### 7.4 Middleware redirect loop

- `NEXT_PUBLIC_SUPABASE_URL` phải **không có** dấu `/` cuối.
- **Supabase → Settings → API → Site URL** phải trỏ đúng domain Vercel.
- Sau khi sửa env, **Vercel → Deployments → Redeploy** (không tự động nhận).

### 7.5 Storage upload fail — "Bucket not found"

Bucket chưa được tạo hoặc đặt sai tên. Tạo lại `media` và `clan-documents`
theo mục 2.3.

### 7.6 Trang public trống, console báo "supabase url is invalid"

Biến môi trường chưa được inject lúc build. Vào **Vercel → Project → Settings →
Environment Variables** kiểm tra 3 biến đã set cho đúng môi trường (Production)
và **Redeploy**.

## 8. CI/CD sau khi deploy

- Mỗi lần `git push origin main` → Vercel tự build và deploy Production.
- Push lên nhánh khác (ví dụ `feature/...`) → tạo **Preview URL**
  (`feature-x-giapha-nguyen-dinh-hoa-ngai.vercel.app`) để review trước khi merge.
- Rollback: vào **Deployments → chọn bản cũ → Promote to Production**, hoặc
  dùng `npx vercel rollback`.

## 9. Custom domain (tuỳ chọn)

1. Mua domain (Cloudflare Registrar, Namecheap… ~$10/năm).
2. Vercel → **Settings → Domains → Add** → nhập domain.
3. Trỏ DNS theo hướng dẫn của Vercel.
4. Đợi SSL provision (5-30 phút).
5. Cập nhật lại **Supabase Site URL** và **Additional Redirect URLs** sang
   domain mới.

## 10. Monitoring & backup

- **Vercel Analytics**: Dashboard → Analytics → page views, Web Vitals.
- **Supabase Logs**: Dashboard → Logs → API (slow queries, auth errors).
- **Backup dữ liệu**: Supabase Free chỉ giữ backup 7 ngày. Nếu cần giữ lâu hơn,
  dùng `pg_dump` định kỳ lưu local.
- **Rollback code**: giữ commit ổn định trên `main`; trước khi sửa lớn hãy tạo
  nhánh `feature/...` để Preview trước.

## 11. Liên kết tham chiếu

- [`VERCEL-SUPABASE-DEPLOY.md`](./VERCEL-SUPABASE-DEPLOY.md) — bản chi tiết
  có ảnh minh hoạ.
- [`LOCAL-DEVELOPMENT.md`](./LOCAL-DEVELOPMENT.md) — chạy local.
- [`../02-design/SECURITY-PRIVACY.md`](../02-design/SECURITY-PRIVACY.md) —
  chính sách bảo mật, RLS, PII.
- [`../../prompts/11-deploy-vercel-supabase.md`](../../prompts/11-deploy-vercel-supabase.md)
  — prompt hướng dẫn AI triển khai.
