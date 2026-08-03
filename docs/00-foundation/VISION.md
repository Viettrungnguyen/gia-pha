---
project: NguyenDinhHoaNgai
path: docs/00-foundation/VISION.md
type: vision
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Vision - Gia phả điện tử Nguyễn Đình làng Hòa Ngãi

## 1. Tầm nhìn

Trở thành **nguồn số hóa gốc** của dòng họ Nguyễn Đình tại làng Hòa Ngãi, xã Thanh Hà, huyện Thanh Liêm, tỉnh Hà Nam — nơi mọi thành viên và khách quen có thể tra cứu hồ sơ, quan hệ, lịch cúng lễ và tài liệu lịch sử của dòng họ một cách minh bạch, lâu dài và dễ tiếp cận.

## 2. Sứ mệnh

- **Gìn giữ**: Lưu trữ bền vững thông tin các thế hệ đã qua và hiện tại, tránh thất truyền khi chuyển thế hệ.
- **Kết nối**: Giúp họ hàng ở xa cập nhật tin tức dòng họ, biết ai là con ai, quan hệ như thế nào.
- **Tôn vinh**: Ghi nhớ ngày giỗ, lễ họp, thành tích của tổ tiên và con cháu.
- **Chia sẻ**: Công khai thông tin để khách quen, bạn bè và đối tác tìm hiểu về dòng họ.

## 3. Giá trị cốt lõi

| Giá trị | Mô tả |
|---------|-------|
| **Trung thực** | Dữ liệu phản ánh đúng sử liệu dòng họ, có nguồn gốc rõ ràng |
| **Tôn kính** | Từ ngữ, hình ảnh thể hiện sự tôn kính với tổ tiên |
| **Minh bạch** | Mọi thông tin (trừ mật khẩu admin) đều có thể truy cứu |
| **Bền vững** | Hệ thống hoạt động ổn định ít nhất 10 năm, dễ bảo trì |
| **Đơn giản** | Giao diện thân thiện, người lớn tuổi trong dòng họ dùng được |

## 4. Đối tượng sử dụng

### Khách (không cần đăng nhập)

- **Con cháu trong dòng họ** - Tra cứu quan hệ, tìm ngày giỗ, xem ảnh cũ.
- **Người lớn tuổi** - Xem cây gia phả ở dạng danh sách theo đời.
- **Khách quen, bạn bè** - Tìm hiểu thông tin dòng họ.
- **Học giả, nhà nghiên cứu** - Tham khảo sử liệu dòng họ tại Hà Nam.

### Quản trị viên (admin)

- **Trưởng tộc / người được ủy quyền** - Cập nhật thông tin thành viên, tổ chức lễ họp.
- **Người phụ trách kho tài liệu** - Upload ảnh, PDF, video lễ hội.

## 5. Phạm vi MVP (3 tháng đầu)

### Trong phạm vi

- Cây gia phả trực quan (read-only public).
- Danh sách + chi tiết thành viên (read-only public).
- Lịch cúng lễ, ngày giỗ (read-only public).
- Kho tài liệu (read-only public).
- 1 tài khoản admin đăng nhập, CRUD 4 nội dung trên.

### Ngoài phạm vi MVP

- Đăng ký thành viên mới từ công cộng.
- Phân quyền nhiều admin/editor.
- Xác minh tài khoản.
- MFA / 2FA.
- Bình luận, like, feed cộng đồng.
- Quỹ khuyến học, học bổng.
- Đa ngôn ngữ.
- Mobile app native.

## 6. Tiêu chí thành công

| STT | Tiêu chí | Đo lường |
|-----|----------|----------|
| 1 | Website load dưới 2 giây | Lighthouse Performance ≥ 90 |
| 2 | 100% thành viên đã biết được nhập vào DB | Seed ≥ 30 người, admin thêm phần còn lại |
| 3 | Có ít nhất 10 tài liệu lịch sử được upload | Seed + admin |
| 4 | Admin cập nhật thông tin không cần hỗ trợ kỹ thuật | Smoke test với 1 người không phải dev |
| 5 | Hoạt động ổn định 6 tháng liên tục | Uptime ≥ 99%, chi phí = $0 |
| 6 | Người lớn tuổi truy cập được | Test với ≥ 2 người ≥ 60 tuổi |

## 7. Giả định và ràng buộc

### Giả định

- Có ít nhất 1 người (admin) biết dùng máy tính cơ bản và quản lý email.
- Có dữ liệu sơ bộ về các thế hệ trước (do người trong dòng họ cung cấp).
- Supabase Cloud free tier (500MB DB, 1GB storage) đủ cho dòng họ cỡ vài trăm người.

### Ràng buộc

- **Chi phí = $0** trong giai đoạn MVP.
- **Stack:** Next.js 16 + Supabase + Vercel (theo quyết định của team).
- **Triết lý công khai:** Toàn bộ thông tin thành viên và tài liệu là công khai (theo yêu cầu user ngày 2026-07-23). Sau này nếu muốn giới hạn, sẽ thêm `privacy_level`.
- **Tiếng Việt 100%** cho UI, code/comments tiếng Anh.

## 8. Liên kết

- [PROJECT-CHARTER.md](PROJECT-CHARTER.md) - Phạm vi chi tiết và stakeholder.
- [BRD.md](../01-planning/BRD.md) - Yêu cầu nghiệp vụ.
- [DATA-MODEL.md](../02-design/DATA-MODEL.md) - Schema database.