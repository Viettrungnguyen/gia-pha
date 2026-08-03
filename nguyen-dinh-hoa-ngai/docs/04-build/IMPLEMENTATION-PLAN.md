---
project: NguyenDinhHoaNgai
path: docs/04-build/IMPLEMENTATION-PLAN.md
type: implementation
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Implementation Plan

## 1. Tổng quan

Kế hoạch triển khai theo sprint 2 tuần, tổng cộng 6 sprint = 12 tuần (~3 tháng).

Mỗi sprint có output rõ ràng, có thể demo được.

## 2. Tech Stack Recap

- Next.js 16 + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Supabase (Auth + PostgreSQL + Storage)
- Vercel hosting
- React Query, React Hook Form + Zod

## 3. Sprint Breakdown

### Sprint 1: Foundation (Tuần 1-2)

**Mục tiêu:** Khởi tạo dự án, Supabase schema, deploy skeleton.

| Task | Output | Prompt ref |
|------|--------|------------|
| Scaffold Next.js project | `frontend/` với package.json, tsconfig, next.config | [01-scaffold-frontend.md](../../prompts/01-scaffold-frontend.md) |
| Tạo Supabase project Singapore | Project trên Supabase Cloud | - |
| Chạy migration + seed | 6 bảng + RLS + 18 demo records | [02-supabase-schema-rls.md](../../prompts/02-supabase-schema-rls.md) |
| Tạo admin user đầu tiên | 1 admin trong Supabase Auth | - |
| Setup Vercel project + env | Vercel project, Root Dir=frontend | [11-deploy-vercel-supabase.md](../../prompts/11-deploy-vercel-supabase.md) |
| Smoke test | URL Vercel load được, hiển thị "Coming soon" | - |

**Acceptance:**
- [ ] `pnpm dev` chạy được locally.
- [ ] Vercel URL public trả về 200.
- [ ] Supabase SQL Editor có 6 bảng.
- [ ] Admin đăng nhập được qua Supabase Dashboard.

### Sprint 2: Public Pages - Skeleton (Tuần 3-4)

**Mục tiêu:** 5 trang public có layout, header/footer, route guard.

| Task | Output | Prompt ref |
|------|--------|------------|
| Site shell (header/footer) | `components/layout/site-header.tsx`, `site-footer.tsx` | [01-scaffold-frontend.md](../../prompts/01-scaffold-frontend.md) |
| Trang chủ với stats đơn giản | `/` hiển thị tổng quan | [01-scaffold-frontend.md](../../prompts/01-scaffold-frontend.md) |
| Trang `/thanh-vien` + `/thanh-vien/[id]` | List + detail read-only | [05-public-thanh-vien.md](../../prompts/05-public-thanh-vien.md) |
| Trang `/cay-gia-pha` | SVG layout cơ bản (read-only) | [04-public-cay-gia-pha.md](../../prompts/04-public-cay-gia-pha.md) |
| Trang `/lich-cung-le` | Calendar + list (read-only) | [06-public-lich-cung-le.md](../../prompts/06-public-lich-cung-le.md) |
| Trang `/tai-lieu` | Grid card (read-only) | [07-public-tai-lieu.md](../../prompts/07-public-tai-lieu.md) |

**Acceptance:**
- [ ] 5 trang public hiển thị dữ liệu từ seed.
- [ ] Mobile responsive.
- [ ] Lighthouse Performance ≥ 80.

### Sprint 3: Auth & Admin Dashboard (Tuần 5-6)

**Mục tiêu:** Đăng nhập hoạt động, khu admin có layout.

| Task | Output | Prompt ref |
|------|--------|------------|
| Auth provider + login form | `components/auth/`, `/dang-nhap` | [03-auth-dang-nhap.md](../../prompts/03-auth-dang-nhap.md) |
| Proxy.ts (middleware) | Route guard cho `/admin/**` | [03-auth-dang-nhap.md](../../prompts/03-auth-dang-nhap.md) |
| Admin shell + sidebar | `components/layout/admin-sidebar.tsx` | - |
| Admin dashboard | `/admin` với 4 stat card | - |

**Acceptance:**
- [ ] Khách vào `/admin` → redirect `/dang-nhap`.
- [ ] Login thành công → vào `/admin`.
- [ ] User không phải admin → redirect `/`.
- [ ] Dashboard hiển thị stats real-time.

### Sprint 4: Admin CRUD (Tuần 7-8)

**Mục tiêu:** 3 trang admin CRUD hoàn chỉnh.

| Task | Output | Prompt ref |
|------|--------|------------|
| CRUD thành viên + quan hệ | `/admin/thanh-vien` | [08-admin-crud-thanh-vien.md](../../prompts/08-admin-crud-thanh-vien.md) |
| CRUD lịch cúng lễ | `/admin/lich-cung-le` | [09-admin-crud-lich-cung-le.md](../../prompts/09-admin-crud-lich-cung-le.md) |
| CRUD tài liệu + upload | `/admin/tai-lieu` | [10-admin-crud-tai-lieu.md](../../prompts/10-admin-crud-tai-lieu.md) |

**Acceptance:**
- [ ] Tạo/sửa/xóa thành viên thành công.
- [ ] Quan hệ cha-mẹ-con hoạt động.
- [ ] Upload file PDF/ảnh OK.
- [ ] Cascade delete family/children OK.

### Sprint 5: Polish & Deploy (Tuần 9-10)

**Mục tiêu:** Tối ưu UX, SEO, production-ready.

| Task | Output | Prompt ref |
|------|--------|------------|
| Tối ưu cây gia phả (mobile fallback) | List mode cho mobile | - |
| SEO metadata cho từng page | title, description, OG | - |
| `sitemap.ts`, `robots.ts` | SEO files | - |
| Error boundaries | `error.tsx` mỗi route | - |
| Empty states polish | UI đẹp cho state rỗng | - |
| Lighthouse optimization | Performance ≥ 90 | - |

**Acceptance:**
- [ ] Lighthouse mobile/desktop ≥ 90.
- [ ] Tất cả page có metadata.
- [ ] Không có 404/500 errors khi navigate.

### Sprint 6: Test & Launch (Tuần 11-12)

**Mục tiêu:** Test, bug fix, go-live.

| Task | Output | Prompt ref |
|------|--------|------------|
| Test cases theo TEST-PLAN | Test report | - |
| Cross-browser test | Chrome, Safari, Firefox, Edge | - |
| Mobile test | iOS Safari, Android Chrome | - |
| User acceptance test | Người lớn tuổi trong dòng họ test | - |
| Backup DB plan | Script hướng dẫn | - |
| Go-live announcement | Thông báo cho dòng họ | - |

**Acceptance:**
- [ ] Tất cả test cases pass.
- [ ] Người lớn tuổi dùng được.
- [ ] Docs đầy đủ.
- [ ] Custom domain (nếu có) đã setup.

## 4. Dependency Graph

```
Sprint 1 (Foundation)
    ↓
Sprint 2 (Public Skeleton)
    ↓
Sprint 3 (Auth & Admin Shell)
    ↓
Sprint 4 (Admin CRUD) ←─┐
    ↓                    │
Sprint 5 (Polish) ───────┤
    ↓                    │
Sprint 6 (Test & Launch) ┘
```

## 5. Risks & Mitigations

| Risk | Sprint impact | Mitigation |
|------|---------------|------------|
| Supabase schema sai logic gia phả | 1, 4 | Review kỹ với người hiểu gia phả Việt Nam trước khi migration |
| Cây gia phả layout quá phức tạp | 2, 5 | Tham khảo component FamilyTree của AncestorTree; có fallback list |
| Upload file vượt 50MB | 4 | Validate size ở UI + Storage settings |
| RLS policy bypass | 1, 3 | Test bằng anon key, đảm bảo INSERT fail |
| Người lớn tuổi không dùng được | 6 | Test UAT sớm ở Sprint 5 |

## 6. Effort Estimation

| Sprint | Story Points | Effort (person-days) |
|--------|--------------|----------------------|
| 1 | 13 | 5 |
| 2 | 21 | 9 |
| 3 | 13 | 5 |
| 4 | 21 | 9 |
| 5 | 13 | 5 |
| 6 | 8 | 4 |
| **Total** | **89** | **37 person-days** |

## 7. Definition of Done

Một sprint được coi là hoàn thành khi:

- Tất cả task trong sprint có output rõ ràng.
- Code đã được commit và push lên GitHub.
- Smoke test pass (xem [TEST-PLAN.md §4](../05-test/TEST-PLAN.md)).
- Tài liệu liên quan (BRD, technical-design, prompts) đã cập nhật nếu có thay đổi.
- Reviewer đã approve.

## 8. Liên kết

- [LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md) - Setup local.
- [VERCEL-SUPABASE-DEPLOY.md](VERCEL-SUPABASE-DEPLOY.md) - Deploy.
- [TEST-PLAN.md](../05-test/TEST-PLAN.md) - Test plan.
- [prompts/](../../prompts/) - Hướng dẫn từng chức năng.