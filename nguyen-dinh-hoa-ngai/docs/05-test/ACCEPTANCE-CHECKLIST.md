---
project: NguyenDinhHoaNgai
path: docs/05-test/ACCEPTANCE-CHECKLIST.md
type: acceptance
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Acceptance Checklist

Checklist để verify dự án hoàn thành và sẵn sàng go-live. Tick vào ô khi hoàn thành.

## 1. Foundation

- [ ] **Vision** (`docs/00-foundation/VISION.md`) đã được phê duyệt bởi sponsor.
- [ ] **Project Charter** (`docs/00-foundation/PROJECT-CHARTER.md`) đã ký bởi sponsor + tech lead.
- [ ] **BRD** (`docs/01-planning/BRD.md`) đã phê duyệt yêu cầu.
- [ ] **Technical Design** (`docs/02-design/TECHNICAL-DESIGN.md`) đã review bởi tech lead.
- [ ] **Data Model** (`docs/02-design/DATA-MODEL.md`) đã review bởi người hiểu gia phả Việt Nam.

## 2. Infrastructure

- [ ] **Supabase project** đã tạo tại Singapore.
- [ ] **Migration script** (`frontend/supabase/migrations/20260723000000_initial_schema.sql`) chạy thành công.
- [ ] **Seed data** (`frontend/supabase/seed.sql`) đã insert thành công.
- [ ] **RLS policies** đã verify (anon SELECT OK, INSERT/UPDATE/DELETE deny).
- [ ] **Storage bucket** `media` đã tạo.
- [ ] **Storage bucket** `clan-documents` đã tạo.
- [ ] **Storage RLS** đã verify (chỉ admin write).
- [ ] **Admin user** đã tạo với role='admin'.

## 3. Frontend - Foundation

- [ ] `frontend/package.json` có đầy đủ deps.
- [ ] `pnpm install` không lỗi.
- [ ] `pnpm tsc` không có error.
- [ ] `pnpm lint` không có error.
- [ ] `pnpm build` thành công.
- [ ] `.env.example` có 2 env vars cần thiết.
- [ ] `.gitignore` chuẩn (`.env`, `.next`, `node_modules`).
- [ ] `src/proxy.ts` đã implement.
- [ ] `src/middleware.ts` re-export proxy.
- [ ] Root layout có QueryProvider + AuthProvider + Toaster.

## 4. Frontend - Public Pages

### Trang chủ (`/`)

- [ ] Hiển thị tên dòng họ "Nguyễn Đình" + địa danh.
- [ ] 4 stat card (tổng thành viên, đời, sự kiện, tài liệu).
- [ ] 4 quick link cards.
- [ ] Link "Đăng nhập" hoạt động.
- [ ] Mobile responsive.

### Cây gia phả (`/cay-gia-pha`)

- [ ] SVG render 18 nodes (từ seed).
- [ ] Phân biệt nam (viền xanh) / nữ (viền hồng).
- [ ] Vợ chồng nối bằng đường hồng.
- [ ] Cha mẹ con nối bằng đường đen.
- [ ] Pan (kéo chuột) hoạt động.
- [ ] Zoom (scroll) hoạt động.
- [ ] Click vào node → điều hướng detail.
- [ ] Nút "Danh sách" hiển thị list theo đời.

### Danh sách thành viên (`/thanh-vien`)

- [ ] Grid 18 cards (từ seed).
- [ ] Search hoạt động (VD: "tuấn").
- [ ] Filter theo đời.
- [ ] Filter theo chi.
- [ ] Filter "Còn sống" / "Đã mất".
- [ ] Click card → điều hướng detail.

### Chi tiết thành viên (`/thanh-vien/[id]`)

- [ ] Hiển thị avatar (placeholder nếu không có).
- [ ] Hiển thị tên, giới tính, đời, chi.
- [ ] Hiển thị năm sinh, nơi sinh.
- [ ] Hiển thị năm mất, nơi mất, ngày giỗ (nếu đã mất).
- [ ] Hiển thị nghề nghiệp, quê quán, liên hệ.
- [ ] Hiển thị quan hệ: cha mẹ, vợ chồng, con, anh chị em.
- [ ] Click vào quan hệ → điều hướng đúng.

### Lịch cúng lễ (`/lich-cung-le`)

- [ ] Banner "Sắp tới" hiển thị top 5.
- [ ] Tab "Lịch tháng" render calendar đúng.
- [ ] Click nút next/prev tháng → chuyển tháng.
- [ ] Badge events trên calendar.
- [ ] Tab "Danh sách" hiển thị tất cả events.
- [ ] Filter theo loại (Giỗ, Họp họ, Lễ tết, Khác).
- [ ] Auto-generate giỗ từ `people.death_lunar`.

### Kho tài liệu (`/tai-lieu`)

- [ ] Grid cards (3 từ seed).
- [ ] Filter theo danh mục.
- [ ] Search hoạt động.
- [ ] Click card → mở file tab mới.
- [ ] Thumbnail hiển thị cho ảnh, icon cho PDF/video.

## 5. Frontend - Auth

- [ ] `/dang-nhap` form email/password.
- [ ] Validation client: required email, required password.
- [ ] Submit → Supabase Auth signInWithPassword.
- [ ] Thành công → redirect `/admin`.
- [ ] Sai mật khẩu → hiển thị "Email hoặc mật khẩu không đúng".
- [ ] Nếu đã đăng nhập → redirect `/admin`.
- [ ] Cookie HttpOnly + Secure (production).
- [ ] Middleware guard `/admin/**`.

## 6. Frontend - Admin

### Dashboard (`/admin`)

- [ ] 4 stat card.
- [ ] 3 quick action cards (Thành viên, Lịch, Tài liệu).
- [ ] Admin sidebar với 4 nav items.

### CRUD thành viên (`/admin/thanh-vien`)

- [ ] Table hiển thị 18 rows.
- [ ] Search hoạt động.
- [ ] "Thêm mới" modal mở form.
- [ ] Form đầy đủ (handle, tên, giới tính, đời, chi, sinh, mất, liên hệ, tiểu sử).
- [ ] Validate: handle unique, tên không rỗng, DD/MM regex.
- [ ] Chọn cha/mẹ → auto-tạo family + children.
- [ ] Submit → insert DB → invalidate query → table refresh.
- [ ] Sửa → form pre-fill → submit → update.
- [ ] Xóa → AlertDialog xác nhận → submit → cascade.
- [ ] Sau CRUD → trang public cập nhật theo.

### CRUD lịch (`/admin/lich-cung-le`)

- [ ] Table hiển thị 14 rows.
- [ ] Filter theo loại.
- [ ] "Thêm mới" → form đầy đủ.
- [ ] Validate: phải có ngày dương hoặc âm.
- [ ] DD/MM regex validation.
- [ ] Submit → OK.
- [ ] Sau CRUD → trang public cập nhật theo.

### CRUD tài liệu (`/admin/tai-lieu`)

- [ ] Table hiển thị 3 rows.
- [ ] "Tải lên mới" → form + file input.
- [ ] Validate MIME type + size (50MB).
- [ ] Sanitize tên file.
- [ ] Upload → Storage → insert DB.
- [ ] Submit OK.
- [ ] Sau CRUD → trang public cập nhật theo.
- [ ] Xóa → file trong Storage cũng bị xóa.

## 7. SEO & Performance

- [ ] Mỗi page có title + description + OG tags.
- [ ] `sitemap.xml` trả về XML hợp lệ.
- [ ] `robots.txt` cho phép crawler, disallow `/admin/`.
- [ ] `not-found.tsx` 404 page đẹp.
- [ ] `error.tsx` 500 page đẹp.
- [ ] Lighthouse Performance ≥ 90 mobile + desktop (mỗi trang).
- [ ] Lighthouse Accessibility ≥ 90.
- [ ] Lighthouse Best Practices ≥ 90.
- [ ] Lighthouse SEO ≥ 90.

## 8. Security

- [ ] RLS: anon SELECT OK, INSERT/UPDATE/DELETE deny (verified).
- [ ] Storage RLS: anon read OK, admin write (verified).
- [ ] Cookie HttpOnly + Secure + SameSite=lax.
- [ ] Không có `SUPABASE_SERVICE_ROLE_KEY` ở client.
- [ ] `.env.local` không commit.
- [ ] XSS: tiểu sử có `<script>` không chạy.
- [ ] File upload: không nhận `.exe`, không nhận >50MB.

## 9. Cross-browser & Responsive

- [ ] Chrome desktop pass.
- [ ] Edge desktop pass.
- [ ] Firefox desktop pass.
- [ ] Safari desktop pass (macOS).
- [ ] Mobile Safari pass (iOS 16+).
- [ ] Mobile Chrome pass (Android 12+).
- [ ] Responsive: 375px, 768px, 1280px đều hiển thị OK.

## 10. Accessibility

- [ ] Tab navigation hoạt động.
- [ ] Form có label rõ ràng.
- [ ] Images có alt text.
- [ ] Color contrast ≥ AA (4.5:1).
- [ ] Modal có focus trap, ESC đóng.
- [ ] Người lớn tuổi dùng được list view fallback.

## 11. Documentation

- [ ] `CLAUDE.md` đầy đủ.
- [ ] `README.md` có hướng dẫn cài đặt nhanh.
- [ ] `docs/` 5 stages đầy đủ.
- [ ] `prompts/` 11 file prompt chi tiết.
- [ ] SDLC config `.sdlc-config.json` đúng.

## 12. Deployment

- [ ] Code push lên GitHub.
- [ ] Vercel project đã import.
- [ ] Root Directory = `frontend`.
- [ ] 2 env vars configured (Production, Preview, Development).
- [ ] Auto-deploy hoạt động (push vào main → deploy).
- [ ] Site URL configured trong Supabase.
- [ ] Production URL accessible.
- [ ] Admin login trên production OK.

## 13. User Acceptance Test (UAT)

- [ ] Người trong dòng họ (không phải dev) đăng nhập admin thành công.
- [ ] Người trong dòng họ thêm được thành viên mới.
- [ ] Người trong dòng họ upload được tài liệu.
- [ ] Người trong dòng họ (60+ tuổi) xem được danh sách thành viên.
- [ ] Người trong dòng họ (60+ tuổi) xem được lịch (list mode).
- [ ] Khách (không đăng nhập) truy cập được 5 trang public.

## 14. Go-Live

- [ ] Tất cả checklist trên đã tick.
- [ ] [TEST-PLAN.md](TEST-PLAN.md) tất cả test cases pass.
- [ ] [REQUIREMENTS-TRACEABILITY.md](REQUIREMENTS-TRACEABILITY.md) verified.
- [ ] Backup plan đã document.
- [ ] Admin đã thay mật khẩu mặc định.
- [ ] Custom domain (nếu có) đã setup.
- [ ] Thông báo go-live đã gửi dòng họ.

## Sign-off

| Vai trò | Người | Ngày | Chữ ký |
|---------|-------|------|--------|
| Tech Lead | _________________ | ____/____/____ | _________________ |
| Product Owner | _________________ | ____/____/____ | _________________ |
| Sponsor | _________________ | ____/____/____ | _________________ |

## Liên kết

- [TEST-PLAN.md](TEST-PLAN.md) - Chi tiết test cases.
- [REQUIREMENTS-TRACEABILITY.md](REQUIREMENTS-TRACEABILITY.md) - Map yêu cầu.
- [IMPLEMENTATION-PLAN.md](../04-build/IMPLEMENTATION-PLAN.md) - Sprint breakdown.