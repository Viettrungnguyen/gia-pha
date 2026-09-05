---
project: NguyenDinhHoaNgai
path: CLAUDE.md
type: agent-guidelines
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# CLAUDE.md

Hướng dẫn cho các AI assistant (Claude, GPT, Cursor) khi làm việc với dự án **NguyenDinhHoaNgai** (Gia phả điện tử dòng họ Nguyễn Đình, làng Hòa Ngãi).

## 1. Tổng quan

- **Tên dự án:** Gia phả điện tử - Dòng họ Nguyễn Đình làng Hòa Ngãi
- **Địa danh:** Xã Thanh Hà, huyện Thanh Liêm, tỉnh Hà Nam
- **Mục tiêu:** Website công khai cho phép khách xem cây gia phả, thành viên, lịch cúng lễ, tài liệu; admin đăng nhập để CRUD.
- **Tech stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, React Query, React Hook Form + Zod, Supabase (Auth + PostgreSQL + Storage).
- **Triển khai:** Vercel (frontend), Supabase Cloud Singapore (backend).
- **SDLC Tier:** LITE (5 stages: 00-foundation, 01-planning, 02-design, 04-build, 05-test).
- **Tài liệu gốc tham khảo:** Thư mục `../AncestorTree/` (dự án họ hàng, phức tạp hơn nhiều) - chỉ tham khảo pattern, KHÔNG copy toàn bộ.

## 2. Cấu trúc thư mục dự kiến

```
nguyen-dinh-hoa-ngai/
├── .sdlc-config.json
├── CLAUDE.md
├── README.md
├── frontend/
│   ├── package.json              # Next.js 16, React 19, Supabase SSR
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── .env.example              # NEXT_PUBLIC_SUPABASE_URL, _ANON_KEY
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # Root layout (AuthProvider, QueryProvider)
│   │   │   ├── page.tsx          # Trang chủ (giới thiệu, thống kê)
│   │   │   ├── robots.ts
│   │   │   ├── sitemap.ts
│   │   │   ├── (public)/
│   │   │   │   ├── layout.tsx    # Header + Footer
│   │   │   │   ├── cay-gia-pha/page.tsx
│   │   │   │   ├── cay-gia-pha/compact/page.tsx  # View gộp vợ chồng + ô con gái
│   │   │   │   ├── thanh-vien/page.tsx
│   │   │   │   ├── thanh-vien/[id]/page.tsx
│   │   │   │   ├── thanh-vien/people-list-client.tsx
│   │   │   │   ├── lich-cung-le/page.tsx
│   │   │   │   └── tai-lieu/page.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── dang-nhap/page.tsx
│   │   │   └── admin/
│   │   │       ├── layout.tsx    # Sidebar admin
│   │   │       ├── page.tsx      # Dashboard
│   │   │       ├── thanh-vien/page.tsx
│   │   │       ├── thu-tu-con/page.tsx   # Placeholder: sắp xếp thứ tự con
│   │   │       ├── lich-cung-le/page.tsx
│   │   │       └── tai-lieu/page.tsx
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui primitives
│   │   │   ├── layout/
│   │   │   │   ├── site-header.tsx
│   │   │   │   ├── site-footer.tsx
│   │   │   │   └── admin-sidebar.tsx
│   │   │   ├── auth/
│   │   │   │   ├── auth-provider.tsx
│   │   │   │   └── login-form.tsx
│   │   │   ├── tree/
│   │   │   │   ├── family-tree.tsx         # SVG tree layout (CV1: sort_order, nối từ ô mẹ)
│   │   │   │   ├── compact-family-tree.tsx # CV2: view gộp vợ chồng + ô con gái
│   │   │   │   └── tree-canvas.tsx
│   │   │   └── people/
│   │   │       ├── person-card.tsx
│   │   │       ├── person-detail.tsx
│   │   │       └── person-form.tsx       # Admin CRUD
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts      # createBrowserClient
│   │   │   │   └── server.ts      # createServerClient (cookies)
│   │   │   ├── site-config.ts     # Tên dòng họ, địa danh
│   │   │   ├── lunar-calendar.ts  # Âm/dương conversion
│   │   │   ├── supabase-data-people.ts
│   │   │   ├── supabase-data-families.ts
│   │   │   ├── supabase-data-events.ts
│   │   │   └── supabase-data-documents.ts
│   │   ├── hooks/
│   │   │   ├── use-people.ts
│   │   │   ├── use-families.ts
│   │   │   ├── use-events.ts
│   │   │   └── use-documents.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── proxy.ts               # Next.js 16 middleware
│   │   └── middleware.ts          # re-export proxy
│   ├── public/                    # Logo, favicon
│   └── supabase/
│       ├── migrations/
│       │   └── 20260723000000_initial_schema.sql
│       └── seed.sql               # Dữ liệu demo Nguyễn Đình
├── docs/
│   ├── 00-foundation/
│   ├── 01-planning/
│   ├── 02-design/
│   ├── 04-build/
│   └── 05-test/
└── prompts/                       # File hướng dẫn chi tiết cho AI (Markdown)
    ├── 01-scaffold-frontend.md
    ├── 02-supabase-schema-rls.md
    ├── 03-auth-dang-nhap.md
    ├── 04-public-cay-gia-pha.md
    ├── 05-public-thanh-vien.md
    ├── 06-public-lich-cung-le.md
    ├── 07-public-tai-lieu.md
    ├── 08-admin-crud-thanh-vien.md
    ├── 09-admin-crud-lich-cung-le.md
    ├── 10-admin-crud-tai-lieu.md
    └── 11-deploy-vercel-supabase.md
```

## 3. Database schema tối giản (6 bảng)

| Bảng | Mục đích | Quan hệ chính |
|------|----------|---------------|
| `profiles` | Tài khoản admin | `user_id → auth.users` |
| `people` | Thành viên dòng họ | - |
| `families` | Cặp vợ chồng | `father_id, mother_id → people` |
| `children` | Quan hệ cha-mẹ-con | `family_id → families`, `person_id → people` |
| `events` | Giỗ, họp họ, lễ tết | `person_id → people` |
| `clan_documents` | Tài liệu dòng họ | `person_id → people`, `uploaded_by → auth.users` |

Xem chi tiết tại `docs/02-design/DATA-MODEL.md`.

## 4. Quy tắc code

### TypeScript
- Strict mode bắt buộc.
- Không dùng `any` nếu không cần; dùng `unknown` rồi type-guard.
- Dùng `interface` cho object, `type` cho union/utility.

### React/Next.js
- Server Components mặc định, `'use client'` chỉ khi cần state/effects.
- 2 route groups: `(public)` cho khách, `admin` cho khu quản trị (không cần `(auth)` riêng ngoài login).
- Dùng React Query cho server state (people, families, events, documents).
- Mỗi feature module có: types (`src/types/`) + data layer (`src/lib/supabase-data-*.ts`) + hooks (`src/hooks/use-*.ts`) + pages.

### Styling
- Tailwind CSS 4, shadcn/ui.
- Mobile-first, responsive breakpoints `sm md lg xl`.
- Màu chính: đỏ nâu (gợi từ đường) + vàng ấm + trắng ngà.

### Naming
- File: `kebab-case.tsx`.
- Component: `PascalCase.tsx`.
- Hook: `use-{module}.ts`.
- Data layer: `supabase-data-{module}.ts`.

### File header (BẮT BUỘC cho code)
```typescript
/**
 * @project NguyenDinhHoaNgai
 * @file src/path/to/file.ts
 * @description Mô tả ngắn
 * @version 1.0.0
 * @updated 2026-07-23
 */
```

### YAML front matter (BẮT BUỘC cho docs)
```yaml
---
project: NguyenDinhHoaNgai
path: docs/XX-stage/filename.md
type: document-type
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft|review|approved
---
```

## 5. Quyết định quan trọng

- **Quyền riêng tư:** Toàn bộ thông tin thành viên và tài liệu công khai (theo yêu cầu user). Admin quyết định nội dung; khách chỉ đọc.
- **Auth:** Chỉ đăng nhập bằng email/password Supabase Auth. Không có đăng ký công khai. Admin đầu tiên được tạo thủ công trong Supabase Dashboard.
- **Upload:** Supabase Storage với 2 bucket công khai `media` (avatar/ảnh) và `clan-documents` (PDF, ảnh, video). MIME type và kích thước được kiểm tra ở cả UI và RLS.
- **Triển khai:** Một Vercel project, Root Directory = `frontend`. Supabase Cloud Singapore. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Không dùng:** Electron, Docker, GEDCOM, MFA, editor/viewer roles, đơn ghi danh.

## 6. Khi nào hỏi user

- Khi cần thêm cột DB ngoài 6 bảng đã định.
- Khi cần thêm route public ngoài 5 trang đã chốt.
- Khi cần thêm module admin ngoài 3 (thành viên, lịch, tài liệu).
- Khi cần đổi policy công khai/riêng tư.
- Khi cần tích hợp bên thứ ba (Google OAuth, Facebook, Zalo, SMS...).

## 7. Khi nào KHÔNG hỏi

- Chi tiết UI nhỏ (margin, padding, màu sắc).
- Cách tổ chức component.
- Tên hàm/biến nội bộ.
- Lựa chọn thư viện phụ trợ (date-fns vs dayjs, lodash vs native).

## 8. Quy trình làm việc với prompts/

Thư mục `prompts/` chứa các file hướng dẫn chi tiết cho AI từng chức năng. Mỗi file:
- Mục tiêu + tiêu chí hoàn thành.
- File cần tạo/sửa.
- Bước thực hiện cụ thể.
- Snippet code mẫu khi cần.
- Smoke test.
- Lưu ý rủi ro.

Đọc file prompt tương ứng trước khi code chức năng đó. Cập nhật prompt nếu phát hiện bước mới cần thiết.