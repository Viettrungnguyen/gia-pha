---
project: NguyenDinhHoaNgai
path: prompts/00-INDEX.md
type: prompt-index
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Prompts Index - Hướng dẫn từng chức năng

Thư mục `prompts/` chứa các file Markdown hướng dẫn chi tiết cho AI (Claude, GPT, Cursor) khi code từng chức năng của NguyenDinhHoaNgai.

## Cách sử dụng

1. Đọc `CLAUDE.md` trước để hiểu quy tắc dự án.
2. Mở prompt tương ứng với chức năng cần code.
3. Đọc kỹ mục "Mục tiêu", "File cần tạo", "Bước thực hiện", "Snippet mẫu".
4. Code theo hướng dẫn, smoke test ở cuối.
5. Nếu phát hiện bước mới cần thiết, cập nhật prompt.

## Danh sách prompts

| # | File | Sprint | Chức năng |
|---|------|--------|-----------|
| 1 | [01-scaffold-frontend.md](01-scaffold-frontend.md) | 1 | Khởi tạo Next.js 16 + TS + Tailwind + shadcn/ui + Supabase SSR |
| 2 | [02-supabase-schema-rls.md](02-supabase-schema-rls.md) | 1 | Tạo 6 bảng + RLS + seed data |
| 3 | [03-auth-dang-nhap.md](03-auth-dang-nhap.md) | 3 | Auth provider + form đăng nhập + middleware guard |
| 4 | [04-public-cay-gia-pha.md](04-public-cay-gia-pha.md) | 2 | Cây gia phả SVG + danh sách theo đời |
| 5 | [05-public-thanh-vien.md](05-public-thanh-vien.md) | 2 | Danh sách + chi tiết thành viên |
| 6 | [06-public-lich-cung-le.md](06-public-lich-cung-le.md) | 2 | Lịch tháng + danh sách sự kiện |
| 7 | [07-public-tai-lieu.md](07-public-tai-lieu.md) | 2 | Grid tài liệu + filter + download |
| 8 | [08-admin-crud-thanh-vien.md](08-admin-crud-thanh-vien.md) | 4 | CRUD thành viên + quan hệ gia phả |
| 9 | [09-admin-crud-lich-cung-le.md](09-admin-crud-lich-cung-le.md) | 4 | CRUD lịch cúng lễ |
| 10 | [10-admin-crud-tai-lieu.md](10-admin-crud-tai-lieu.md) | 4 | CRUD tài liệu + upload file |
| 11 | [11-deploy-vercel-supabase.md](11-deploy-vercel-supabase.md) | 1, 5 | Deploy lên Vercel + Supabase Cloud |

## Cấu trúc mỗi prompt

```markdown
---
project: NguyenDinhHoaNgai
path: prompts/XX-name.md
type: prompt
version: 1.0.0
updated: 2026-07-23
---

# [Tên chức năng]

## 1. Mục tiêu
## 2. Tiêu chí hoàn thành
## 3. File cần tạo/sửa
## 4. Phụ thuộc
## 5. Bước thực hiện
## 6. Snippet code mẫu
## 7. Smoke test
## 8. Lưu ý rủi ro
## 9. Liên kết
```

## Quy tắc khi code theo prompt

- **Đọc kỹ trước khi code:** không skip bước.
- **Làm theo thứ tự:** các bước thường có dependency.
- **Tận dụng snippet:** copy và chỉnh, không viết lại từ đầu.
- **Smoke test cuối mỗi prompt:** đảm bảo chạy được trước khi qua prompt khác.
- **Commit sau mỗi prompt:** `feat: <tên chức năng>`.

## Liên kết

- [CLAUDE.md](../CLAUDE.md) - Quy tắc tổng thể.
- [IMPLEMENTATION-PLAN.md](../docs/04-build/IMPLEMENTATION-PLAN.md) - Sprint breakdown.
- [docs/](../docs/) - Toàn bộ tài liệu SDLC.