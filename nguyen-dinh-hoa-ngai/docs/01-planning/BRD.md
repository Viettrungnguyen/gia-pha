---
project: NguyenDinhHoaNgai
path: docs/01-planning/BRD.md
type: brd
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Business Requirements Document (BRD)

## 1. Giới thiệu

Tài liệu này mô tả chi tiết yêu cầu nghiệp vụ của dự án gia phả điện tử dòng họ Nguyễn Đình, làng Hòa Ngãi. Đối tượng đọc: đội phát triển, admin vận hành, sponsor (trưởng tộc).

## 2. Actors (Tác nhân)

| Actor | Mô tả | Quyền |
|-------|-------|-------|
| **Khách (Guest)** | Bất kỳ ai truy cập URL website, không cần đăng nhập | Xem 5 trang public |
| **Admin** | 1-2 người được ủy quyền, có tài khoản Supabase | Xem tất cả + CRUD 4 nội dung + đăng nhập/đăng xuất |
| **Supabase (system)** | Backend tự động phản hồi query, validate RLS | Cấp quyền SELECT cho anon, INSERT/UPDATE/DELETE chỉ cho admin |

## 3. Functional Requirements (Yêu cầu chức năng)

### 3.1 FR-PUB - Trang công khai (Guest)

#### FR-PUB-01: Trang chủ

- **Mô tả:** Hiển thị giới thiệu dòng họ, thống kê tổng quan, lối tắt đến 4 trang chính.
- **Acceptance:**
  - Tên dòng họ "Nguyễn Đình" hiển thị rõ ở hero.
  - Địa danh "Làng Hòa Ngãi, xã Thanh Hà, huyện Thanh Liêm, tỉnh Hà Nam" hiển thị.
  - Số liệu: tổng thành viên, tổng đời, tổng sự kiện sắp tới, tổng tài liệu.
  - 4 card lối tắt: Cây gia phả, Thành viên, Lịch cúng lễ, Tài liệu.

#### FR-PUB-02: Cây gia phả

- **Mô tả:** Sơ đồ cây gia đình nhiều đời.
- **Acceptance:**
  - Hiển thị đầy đủ thành viên đã nhập, phân biệt nam (viền xanh) / nữ (viền hồng).
  - Vợ chồng nối bằng đường hồng, cha-mẹ-con nối bằng đường đen.
  - Kéo (pan) và zoom bằng chuột hoặc nút +/-, hoạt động trên mobile.
  - Click vào node → điều hướng đến trang chi tiết thành viên.
  - Có chế độ danh sách theo đời (fallback khi màn hình nhỏ hoặc người dùng chọn).

#### FR-PUB-03: Danh sách thành viên

- **Mô tả:** Bảng/card danh sách với tìm kiếm và lọc.
- **Acceptance:**
  - Ô tìm kiếm theo tên (không phân biệt dấu, fuzzy).
  - Lọc theo: đời, chi, trạng thái sống/mất.
  - Hiển thị dạng card grid (mobile: 1 cột, tablet: 2, desktop: 3).
  - Click vào card → trang chi tiết.

#### FR-PUB-04: Chi tiết thành viên

- **Mô tả:** Hồ sơ đầy đủ 1 thành viên.
- **Acceptance:**
  - Ảnh đại diện (nếu có).
  - Tên hiển thị, họ, tên đệm, tên, giới tính, đời, chi.
  - Ngày sinh (dương + năm), nơi sinh.
  - Ngày mất (nếu có), nơi mất, ngày giỗ âm lịch.
  - Nghề nghiệp, quê quán, địa chỉ liên hệ (nếu có).
  - Tiểu sử (nếu có).
  - Quan hệ: cha, mẹ, vợ/chồng, con, anh chị em ruột.
  - Nút "Quay lại danh sách".

#### FR-PUB-05: Lịch cúng lễ

- **Mô tả:** Lịch tháng kết hợp danh sách sự kiện.
- **Acceptance:**
  - Lịch tháng hiển thị ngày dương, có đánh dấu sự kiện (badge màu theo loại).
  - Có nút chuyển tháng trước/sau.
  - Tab "Danh sách" hiển thị tất cả sự kiện, sắp xếp theo ngày, có lọc theo loại.
  - Loại sự kiện: giỗ, họp họ, lễ tết, khác.
  - Ngày âm lịch hiển thị kèm (nếu có).
  - Sự kiện sắp tới (trong 60 ngày) hiển thị ở banner đầu trang.

#### FR-PUB-06: Kho tài liệu

- **Mô tả:** Danh sách tài liệu dòng họ (ảnh, PDF, video).
- **Acceptance:**
  - Grid card với thumbnail, tiêu đề, mô tả ngắn, danh mục, tags.
  - Tìm kiếm theo tiêu đề/tags/thành viên liên quan.
  - Lọc theo danh mục: ảnh lịch sử, giấy tờ, bản đồ, video, bài viết, khác.
  - Click vào card → mở file trong tab mới (ảnh/PDF/video).
  - Có nút tải xuống trực tiếp.

### 3.2 FR-AUTH - Đăng nhập (Admin)

#### FR-AUTH-01: Trang đăng nhập

- **Mô tả:** Form email/password.
- **Acceptance:**
  - Email và password required.
  - Submit → gọi Supabase Auth `signInWithPassword`.
  - Thành công → redirect `/admin`.
  - Thất bại → hiển thị thông báo lỗi tiếng Việt.
  - Không có link "Quên mật khẩu" hoặc "Đăng ký" (theo yêu cầu MVP).
  - Nếu đã đăng nhập → redirect `/admin`.

#### FR-AUTH-02: Đăng xuất

- **Mô tả:** Nút đăng xuất trong sidebar admin.
- **Acceptance:**
  - Click → gọi Supabase Auth `signOut`, xóa session.
  - Redirect về trang chủ public.

### 3.3 FR-ADM - Khu quản trị (Admin)

#### FR-ADM-01: Dashboard

- **Mô tả:** Trang chính khu admin, hiển thị tổng quan.
- **Acceptance:**
  - 4 stat card: tổng thành viên, tổng sự kiện trong 60 ngày, tổng tài liệu, tổng quan hệ gia đình.
  - Lối tắt đến 3 trang CRUD: Thành viên, Lịch cúng lễ, Tài liệu.

#### FR-ADM-02: CRUD thành viên

- **Mô tả:** Quản lý thông tin thành viên và quan hệ gia phả.
- **Acceptance:**
  - Danh sách thành viên (table), có tìm kiếm + lọc đời/chi.
  - **Tạo mới:**
    - Form: tên hiển thị, họ, tên đệm, tên, giới tính (1=Nam, 2=Nữ), đời (number), chi (number, optional).
    - Ngày sinh (date), năm sinh (number), nơi sinh.
    - Nếu không còn sống: hiển thị thêm ngày mất, nơi mất, ngày giỗ âm lịch.
    - Nghề nghiệp, quê quán, địa chỉ, số điện thoại, email.
    - Tiểu sử (textarea).
    - **Quan hệ (tùy chọn):** chọn cha, chọn mẹ → tự động tạo `family` và `children` row.
    - Validation: handle phải unique, tên hiển thị không được rỗng.
    - Upload avatar (optional) → vào bucket `media`.
  - **Sửa:** Form pre-fill, cập nhật DB.
  - **Xóa:** Hiển thị hộp thoại xác nhận với tên người, cảnh báo nếu có quan hệ cha/mẹ/vợ chồng/con; cascade xóa family/children.

#### FR-ADM-03: CRUD lịch cúng lễ

- **Mô tả:** Quản lý sự kiện ngày giỗ, họp họ.
- **Acceptance:**
  - Danh sách sự kiện, lọc theo loại, tìm kiếm theo tiêu đề.
  - **Tạo mới:**
    - Loại sự kiện (giỗ, họp họ, lễ tết, khác).
    - Tiêu đề (required).
    - Ngày âm lịch (DD/MM) và/hoặc ngày dương lịch.
    - Thành viên liên quan (optional, dùng search combobox).
    - Địa điểm, ghi chú, lặp lại hàng năm (checkbox).
    - Validate định dạng DD/MM nếu có.
  - **Sửa:** Form pre-fill.
  - **Xóa:** Xác nhận, xóa row.

#### FR-ADM-04: CRUD kho tài liệu

- **Mô tả:** Quản lý tài liệu dòng họ và upload file.
- **Acceptance:**
  - Danh sách tài liệu, có tìm kiếm, lọc theo danh mục.
  - **Upload mới:**
    - Tiêu đề (required).
    - File (required khi tạo, optional khi sửa) - chấp nhận: image/*, .pdf, .doc, .docx, .mp4, .webm. Max 50MB.
    - Danh mục: ảnh lịch sử, giấy tờ, bản đồ, video, bài viết, khác.
    - Thành viên liên quan (optional).
    - Mô tả, tags (chuỗi phân cách dấu phẩy).
    - File được upload lên bucket `clan-documents`, lưu URL vào DB.
  - **Sửa:** Form pre-fill, không yêu cầu file mới (giữ file cũ nếu không chọn).
  - **Xóa:** Xác nhận, xóa row + xóa file trong Storage.

### 3.4 FR-SYS - Yêu cầu hệ thống

#### FR-SYS-01: Bảo mật

- RLS Supabase: anon SELECT, chỉ role `admin` INSERT/UPDATE/DELETE.
- Không có endpoint public nào ghi dữ liệu.
- Cookie session HttpOnly, secure, sameSite=lax.
- File upload: validate MIME type + size ở cả UI (UX) và RLS (security).

#### FR-SYS-02: SEO & Metadata

- Mỗi trang có title, description, Open Graph tags.
- Có `sitemap.xml` và `robots.txt`.
- Có `not-found.tsx` 404 page.

#### FR-SYS-03: Performance

- Lighthouse Performance ≥ 90 trên mobile và desktop.
- First Contentful Paint < 1.5s.
- Largest Contentful Paint < 2.5s.

#### FR-SYS-04: Responsive

- Mobile (375px), tablet (768px), desktop (1280px+) đều hiển thị tốt.
- Cây gia phả có fallback danh sách theo đời cho mobile.

#### FR-SYS-05: Accessibility

- Tất cả hình ảnh có alt text.
- Form có label rõ ràng.
- Keyboard navigation hoạt động (Tab, Enter).
- Color contrast ≥ AA.

## 4. Non-Functional Requirements (Yêu cầu phi chức năng)

| Mã | Yêu cầu | Đo lường |
|----|----------|---------|
| NFR-01 | Ngôn ngữ UI 100% tiếng Việt | Manual review |
| NFR-02 | Comments/code tiếng Anh | Manual review |
| NFR-03 | Hoạt động trên Chrome, Edge, Safari, Firefox (2 phiên bản mới nhất) | Cross-browser test |
| NFR-04 | Hoạt động trên iOS Safari, Android Chrome | Mobile test |
| NFR-05 | Uptime ≥ 99% | Vercel + Supabase SLA |
| NFR-06 | Backup DB tự động hàng tuần | Supabase built-in |
| NFR-07 | Không lưu PII nhạy cảm ngoài DB (CCCD, số tài khoản) | DB schema restriction |
| NFR-08 | Logs Supabase chỉ truy cập bởi admin | Dashboard Supabase |
| NFR-09 | Mọi env secret không commit vào git | .gitignore + .env.example |
| NFR-10 | Code có TypeScript strict mode, không `any` không cần thiết | tsc --noEmit pass |

## 5. Business Rules

### BR-01: Quyền riêng tư

- Toàn bộ thông tin thành viên và tài liệu là **công khai** theo quyết định của dòng họ ngày 2026-07-23.
- Sau này nếu muốn giới hạn, thêm cột `privacy_level` vào DB, cập nhật RLS (xem [DATA-MODEL.md §6](../02-design/DATA-MODEL.md)).

### BR-02: Quan hệ gia phả

- Một người có thể thuộc nhiều `family` (qua `children`): là con của cha-mẹ, đồng thời là vợ/chồng trong family khác.
- `family` có thể chỉ có cha (mẹ không rõ) hoặc chỉ có mẹ.
- `generation` của con = max(generation cha, generation mẹ) + 1. Admin có thể override nếu cần.
- Khi xóa một người: cảnh báo nếu họ đang là cha/mẹ/vợ/chồng của người khác; cho phép cascade hoặc giữ orphan.

### BR-03: Lịch cúng lễ

- Ngày giỗ lưu dạng `DD/MM` âm lịch (string), VD `"15/7"`.
- Sự kiện họp họ thường dùng ngày dương lịch cố định.
- Sự kiện `recurring=true` hiển thị mỗi năm.

### BR-04: Tài liệu

- Mỗi tài liệu có 1 file duy nhất lưu trong Storage bucket `clan-documents`.
- File được đặt tên theo convention: `{timestamp}-{sanitized-original-name}`.
- MIME type được kiểm tra ở cả UI và RLS policy (nếu dùng Storage RLS).

### BR-05: Admin

- Admin đầu tiên được tạo thủ công trong Supabase Dashboard (xem [VERCEL-SUPABASE-DEPLOY.md](../04-build/VERCEL-SUPABASE-DEPLOY.md) §4).
- Một tài khoản admin backup nên được tạo ngay, lưu mật khẩu trong password manager dòng họ.

## 6. Assumptions & Constraints

### Assumptions

- Supabase Cloud Singapore có latency chấp nhận được (< 200ms) từ Việt Nam.
- Vercel Edge Network có POP ở Singapore hoặc gần đó.
- Dòng họ cung cấp đủ dữ liệu ban đầu trong 2 tuần.

### Constraints

- **Chi phí $0** trong MVP.
- **Stack:** Next.js + Supabase + Vercel (theo quyết định team).
- **Một ngôn ngữ:** tiếng Việt.
- **Không desktop app, không Docker.**

## 7. Acceptance Criteria tổng thể

Dự án được coi là hoàn thành khi:

1. Tất cả FR-PUB-01 đến FR-PUB-06 pass smoke test.
2. FR-AUTH-01 và FR-AUTH-02 pass.
3. FR-ADM-01 đến FR-ADM-04 pass với tài khoản admin thực.
4. FR-SYS-01 đến FR-SYS-05 pass.
5. Lighthouse Performance ≥ 90 mobile và desktop.
6. Tất cả test cases trong [TEST-PLAN.md](../05-test/TEST-PLAN.md) pass.
7. Tất cả acceptance checklist trong [ACCEPTANCE-CHECKLIST.md](../05-test/ACCEPTANCE-CHECKLIST.md) tick.

## 8. Liên kết

- [VISION.md](../00-foundation/VISION.md) - Tầm nhìn.
- [DATA-MODEL.md](../02-design/DATA-MODEL.md) - Schema.
- [SITEMAP-USER-FLOWS.md](../02-design/SITEMAP-USER-FLOWS.md) - Site map.
- [TEST-PLAN.md](../05-test/TEST-PLAN.md) - Test plan.