---
project: NguyenDinhHoaNgai
path: README.md
type: readme
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Gia phả điện tử - Dòng họ Nguyễn Đình làng Hòa Ngãi

Website gia phả điện tử công khai cho dòng họ Nguyễn Đình, làng Hòa Ngãi, xã Thanh Hà, huyện Thanh Liêm, tỉnh Hà Nam.

## Tính năng chính

### Công khai (không cần đăng nhập)

- **Cây gia phả trực quan** - Sơ đồ cây gia đình nhiều đời, kéo/zoom, click để xem chi tiết.
- **Danh sách thành viên** - Tìm kiếm theo tên, lọc theo đời/chi, xem hồ sơ đầy đủ.
- **Lịch cúng lễ** - Lịch tháng + danh sách, ngày âm/dương, sự kiện sắp tới.
- **Kho tài liệu** - Ảnh lịch sử, giấy tờ, PDF, video lễ hội.

### Khu quản trị (đăng nhập admin)

- CRUD thành viên và quan hệ cha-mẹ-vợ-chồng-con.
- CRUD lịch cúng lễ, liên kết người được cúng giỗ.
- CRUD kho tài liệu, upload file.

## Tech stack

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| UI | shadcn/ui, Lucide icons |
| State | React Query (TanStack Query) |
| Form | React Hook Form + Zod |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Hosting | Vercel (region Singapore) |
| Database | PostgreSQL 15+ (managed by Supabase) |

## Cấu trúc

```
nguyen-dinh-hoa-ngai/
├── frontend/                # Next.js 16 app
├── docs/                    # SDLC docs (00, 01, 02, 04, 05)
├── prompts/                 # Hướng dẫn từng chức năng cho AI
├── .sdlc-config.json
├── CLAUDE.md
└── README.md
```

## Cài đặt nhanh

```bash
# Cài pnpm nếu chưa có
npm install -g pnpm

# Cài dependencies
cd frontend
pnpm install

# Tạo file env (xem .env.example)
cp .env.example .env.local

# Chạy dev server (localhost:3000)
pnpm dev
```

Xem chi tiết tại [`docs/04-build/LOCAL-DEVELOPMENT.md`](docs/04-build/LOCAL-DEVELOPMENT.md).

## Triển khai

- Backend: Tạo Supabase Cloud project tại Singapore, chạy migration + seed từ `frontend/supabase/`.
- Frontend: Push code lên GitHub, import vào Vercel với Root Directory = `frontend`, thêm 2 env vars.

Xem chi tiết tại [`docs/04-build/VERCEL-SUPABASE-DEPLOY.md`](docs/04-build/VERCEL-SUPABASE-DEPLOY.md).

## Tài liệu

- [Foundation](docs/00-foundation/) - Tầm nhìn, phạm vi, business case.
- [Planning](docs/01-planning/) - BRD, sprints.
- [Design](docs/02-design/) - Kiến trúc, data model, security, UI/UX, sitemap.
- [Build](docs/04-build/) - Hướng dẫn implementation, deploy.
- [Test](docs/05-test/) - Test plan, acceptance.

## Hướng dẫn cho AI

Đọc [`CLAUDE.md`](CLAUDE.md) để hiểu quy tắc làm việc với dự án.
Đọc file trong [`prompts/`](prompts/) tương ứng với chức năng cần code.

## Liên hệ

- Dòng họ Nguyễn Đình - làng Hòa Ngãi - xã Thanh Hà - huyện Thanh Liêm - tỉnh Hà Nam.

## Giấy phép

Private repository - chỉ dành cho dòng họ Nguyễn Đình.