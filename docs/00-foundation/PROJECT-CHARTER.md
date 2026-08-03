---
project: NguyenDinhHoaNgai
path: docs/00-foundation/PROJECT-CHARTER.md
type: charter
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Project Charter - NguyenDinhHoaNgai

## 1. Thông tin dự án

| Mục | Giá trị |
|-----|---------|
| Tên dự án | Gia phả điện tử - Dòng họ Nguyễn Đình làng Hòa Ngãi |
| Mã dự án | NguyenDinhHoaNgai |
| Phiên bản | 1.0.0 |
| Ngày bắt đầu | 2026-07-23 |
| Ngày kết thúc dự kiến | 2026-10-23 (3 tháng) |
| Người quản lý | Trưởng tộc / người được ủy quyền |
| Đội phát triển | @dev-team |
| Tech Lead | Minh-Tam-Solution |

## 2. Lý do thực hiện

Dòng họ Nguyễn Đình có lịch sử lâu đời tại làng Hòa Ngãi, xã Thanh Hà, huyện Thanh Liêm, tỉnh Hà Nam. Hiện tại:

- Thông tin thành viên được lưu trên giấy, dễ thất lạc.
- Con cháu ở xa không nắm được quan hệ họ hàng.
- Lịch cúng lễ, ngày giỗ phụ thuộc vào trí nhớ của một số người lớn tuổi.
- Ảnh cũ, giấy tờ, tài liệu lịch sử chưa được số hóa.

Website gia phả điện tử sẽ giải quyết các vấn đề trên với chi phí tối thiểu.

## 3. Mục tiêu (SMART)

| # | Mục tiêu | Cách đo |
|---|----------|---------|
| 1 | Số hóa 100% thành viên đang sinh sống trong dòng họ (ước ~80 người) | Số row trong bảng `people` |
| 2 | Số hóa ít nhất 3 thế hệ trước (thông tin từ người lớn tuổi) | Số row có `generation ≤ 3` |
| 3 | Upload ít nhất 20 tài liệu (ảnh + PDF) | Số row trong `clan_documents` |
| 4 | Website đạt Lighthouse ≥ 90 trên mobile và desktop | Lighthouse CI |
| 5 | 100% lịch cúng lễ trong 5 năm gần nhất được số hóa | Số row trong `events` |
| 6 | Chi phí vận hành $0/năm | Supabase free + Vercel free |

## 4. Phạm vi (Scope)

### 4.1 Trong phạm vi

- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui.
- **Backend:** Supabase (Auth + PostgreSQL + Storage).
- **Hosting:** Vercel (region gần Việt Nam, Singapore).
- **6 bảng DB:** profiles, people, families, children, events, clan_documents.
- **2 Storage bucket:** media (avatar/ảnh), clan-documents (PDF/video).
- **5 trang public:** trang chủ, cây gia phả, thành viên, lịch cúng lễ, tài liệu.
- **1 trang auth:** đăng nhập.
- **4 trang admin:** dashboard, CRUD thành viên/quan hệ, CRUD lịch, CRUD tài liệu.
- **1 tài khoản admin** đầu tiên được tạo thủ công.

### 4.2 Ngoài phạm vi

- Đăng ký thành viên mới từ công cộng (chỉ admin thêm).
- Phân quyền nhiều role (admin/editor/viewer/guest).
- Xác minh email, MFA/TOTP.
- Desktop app (Electron), Docker container.
- GEDCOM import/export.
- Feed cộng đồng, bình luận, like.
- Quỹ khuyến học, học bổng, vinh danh.
- Cầu đương, hương ước, đề xuất chỉnh sửa.
- Tìm quan hệ nâng cao, thống kê nâng cao.
- Đa ngôn ngữ (chỉ tiếng Việt).
- Mobile app native, PWA offline.

## 5. Stakeholder

| Vai trò | Người/Đơn vị | Trách nhiệm |
|---------|---------------|-------------|
| Sponsor | Trưởng tộc Nguyễn Đình | Phê duyệt scope, ngân sách |
| Product Owner | Con cháu phụ trách IT | Xác định yêu cầu, ưu tiên |
| Tech Lead | @dev-team | Kiến trúc, code, deploy |
| Admin vận hành | 1-2 người trong dòng họ | Nhập liệu, upload tài liệu |
| Cố vấn | Người lớn tuổi trong dòng họ | Xác minh dữ liệu, cung cấp ảnh cũ |
| End user | Toàn bộ con cháu + khách | Truy cập website |

## 6. Rủi ro sơ bộ

| Rủi ro | Xác suất | Tác động | Biện pháp |
|--------|----------|---------|-----------|
| Supabase free tier không đủ dung lượng | Thấp | Cao | Theo dõi; nếu >400MB, nâng Pro ($25/tháng) |
| Admin duy nhất nghỉ/bận | Trung bình | Cao | Tạo tài khoản admin backup ngay từ đầu |
| Dữ liệu lịch sử không chính xác | Cao | Trung bình | Cho phép admin sửa, có `updated_at` và audit đơn giản |
| Supabase/Vercel down | Thấp | Trung bình | Có backup DB hàng tuần, thông báo user |
| Người lớn tuổi không dùng được UI | Trung bình | Thấp | Có chế độ danh sách theo đời (text), font lớn |
| Mất tài khoản admin | Thấp | Rất cao | Lưu mật khẩu trong password manager gia đình |

## 7. Giả định

- Dòng họ cung cấp được dữ liệu ban đầu (tên, năm sinh, quan hệ) trong 2 tuần đầu.
- Có ít nhất 1 người trong dòng họ quen dùng email và trình duyệt web.
- Supabase Auth và Vercel free tier đủ cho 500 người dùng/tháng.
- Tất cả thành viên đồng ý công khai thông tin (theo quyết định của dòng họ).

## 8. Ngân sách

| Hạng mục | Chi phí |
|---------|---------|
| Supabase Cloud free tier | $0 |
| Vercel free tier | $0 |
| Tên miền tuỳ chọn (nếu muốn) | ~$10-15/năm |
| Lưu trữ backup DB (Supabase Pro nếu cần) | $25/năm (chỉ khi vượt free tier) |
| **Tổng MVP** | **$0** |

## 9. Tiêu chí nghiệm thu

- Website hoạt động trên Vercel, URL công khai.
- Admin đăng nhập được, CRUD 4 nội dung thành công.
- 5 trang public hiển thị đúng dữ liệu từ Supabase.
- RLS chặn đúng: anon SELECT OK, anon INSERT/UPDATE/DELETE đều fail.
- Lighthouse Performance ≥ 90.
- Tài liệu SDLC đầy đủ 5 stages.
- Bộ prompt trong `prompts/` có thể dùng để maintain/extend.

## 10. Phê duyệt

| Vai trò | Người | Ngày | Chữ ký |
|---------|-------|------|--------|
| Sponsor | _________________ | ____/____/____ | _________________ |
| Tech Lead | _________________ | ____/____/____ | _________________ |

## 11. Liên kết

- [VISION.md](VISION.md) - Tầm nhìn.
- [BRD.md](../01-planning/BRD.md) - Yêu cầu nghiệp vụ.
- [IMPLEMENTATION-PLAN.md](../04-build/IMPLEMENTATION-PLAN.md) - Sprint breakdown.