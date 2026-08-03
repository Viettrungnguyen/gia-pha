---
project: NguyenDinhHoaNgai
path: docs/05-test/REQUIREMENTS-TRACEABILITY.md
type: traceability
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Requirements Traceability Matrix

Bảng map giữa yêu cầu (BRD) ↔ implementation (file/folder) ↔ test cases (TEST-PLAN).

## 1. Functional Requirements

| ID | Mô tả ngắn | BRD ref | Implementation | Test case |
|----|-----------|---------|----------------|-----------|
| FR-PUB-01 | Trang chủ | §3.1.1 | `frontend/src/app/page.tsx` | TC-PUB-01 |
| FR-PUB-02 | Cây gia phả | §3.1.2 | `frontend/src/app/(public)/cay-gia-pha/page.tsx` | TC-PUB-02 |
| FR-PUB-03 | Danh sách thành viên | §3.1.3 | `frontend/src/app/(public)/thanh-vien/page.tsx` | TC-PUB-03 |
| FR-PUB-04 | Chi tiết thành viên | §3.1.4 | `frontend/src/app/(public)/thanh-vien/[id]/page.tsx` | TC-PUB-04 |
| FR-PUB-05 | Lịch cúng lễ | §3.1.5 | `frontend/src/app/(public)/lich-cung-le/page.tsx` | TC-PUB-05 |
| FR-PUB-06 | Kho tài liệu | §3.1.6 | `frontend/src/app/(public)/tai-lieu/page.tsx` | TC-PUB-06 |
| FR-AUTH-01 | Đăng nhập | §3.2.1 | `frontend/src/app/(auth)/dang-nhap/page.tsx` + `frontend/src/components/auth/login-form.tsx` | TC-AUTH-01, 02 |
| FR-AUTH-02 | Đăng xuất | §3.2.2 | `frontend/src/components/layout/admin-sidebar.tsx` | TC-AUTH-04 |
| FR-ADM-01 | Dashboard | §3.3.1 | `frontend/src/app/admin/page.tsx` | TC-AUTH-01 |
| FR-ADM-02 | CRUD thành viên | §3.3.2 | `frontend/src/app/admin/thanh-vien/page.tsx` + `frontend/src/components/people/person-form.tsx` | TC-ADM-01, 02 |
| FR-ADM-03 | CRUD lịch | §3.3.3 | `frontend/src/app/admin/lich-cung-le/page.tsx` + `frontend/src/components/events/event-form.tsx` | TC-ADM-03 |
| FR-ADM-04 | CRUD tài liệu | §3.3.4 | `frontend/src/app/admin/tai-lieu/page.tsx` + `frontend/src/components/documents/document-form.tsx` | TC-ADM-04, 05 |
| FR-SYS-01 | Bảo mật (RLS) | §3.4.1 | `frontend/supabase/migrations/20260723000000_initial_schema.sql` | TC-SYS-01, 02, 03, 04, 05 |
| FR-SYS-02 | SEO & Metadata | §3.4.2 | `frontend/src/app/sitemap.ts`, `robots.ts`, `layout.tsx` | TC-SYS-06 |
| FR-SYS-03 | Performance | §3.4.3 | - | Lighthouse audit |
| FR-SYS-04 | Responsive | §3.4.4 | Tailwind CSS classes | Cross-browser test |
| FR-SYS-05 | Accessibility | §3.4.5 | aria-labels, focus management | a11y test |

## 2. Non-Functional Requirements

| ID | Yêu cầu | Implementation / Verification | Test |
|----|----------|-------------------------------|------|
| NFR-01 | Tiếng Việt 100% UI | Manual review tất cả UI strings | Code review |
| NFR-02 | Code/comments tiếng Anh | Manual review | Code review |
| NFR-03 | Cross-browser | Browser testing | §5 TEST-PLAN |
| NFR-04 | Mobile iOS + Android | Mobile testing | §5 TEST-PLAN |
| NFR-05 | Uptime ≥ 99% | Vercel + Supabase SLA | Monitor |
| NFR-06 | Backup DB hàng tuần | Supabase built-in | Verify dashboard |
| NFR-07 | Không lưu PII nhạy cảm | Schema restriction | Code review |
| NFR-08 | Logs chỉ admin | Supabase Dashboard | Verify |
| NFR-09 | Env secrets không commit | `.gitignore` | Verify repo |
| NFR-10 | TypeScript strict | `tsconfig.json` | `pnpm tsc` |

## 3. Business Rules

| ID | Rule | Implementation | Test |
|----|------|----------------|------|
| BR-01 | Mọi thông tin công khai | `frontend/supabase/migrations/20260723000000_initial_schema.sql` (RLS policies) | TC-SYS-01 |
| BR-02 | Quan hệ gia phả qua `families` + `children` | `frontend/supabase/migrations/...initial_schema.sql` + `person-form.tsx` | TC-ADM-02 |
| BR-03 | Lịch cúng lễ DD/MM âm lịch | `event-form.tsx` + `lunar-calendar.ts` | TC-ADM-03 |
| BR-04 | Tài liệu 1 file/Storage | `supabase-data-documents.ts` + Storage policy | TC-ADM-04 |
| BR-05 | Admin đầu tiên manual | `docs/04-build/VERCEL-SUPABASE-DEPLOY.md §6` | Manual |

## 4. SDLC Docs ↔ Prompts Mapping

| Doc stage | File | Prompt liên quan |
|-----------|------|------------------|
| 00-foundation | `docs/00-foundation/*` | - (vision & scope) |
| 01-planning | `docs/01-planning/BRD.md` | - (requirements) |
| 02-design | `docs/02-design/TECHNICAL-DESIGN.md` | [prompts/01](../prompts/01-scaffold-frontend.md), [03](../prompts/03-auth-dang-nhap.md) |
| 02-design | `docs/02-design/DATA-MODEL.md` | [prompts/02](../prompts/02-supabase-schema-rls.md) |
| 02-design | `docs/02-design/SECURITY-PRIVACY.md` | [prompts/02](../prompts/02-supabase-schema-rls.md), [10](../prompts/10-admin-crud-tai-lieu.md) |
| 02-design | `docs/02-design/UI-UX-DESIGN.md` | Tất cả prompts (visual) |
| 02-design | `docs/02-design/SITEMAP-USER-FLOWS.md` | [prompts/03-07](../prompts/) |
| 04-build | `docs/04-build/IMPLEMENTATION-PLAN.md` | Tất cả prompts |
| 04-build | `docs/04-build/LOCAL-DEVELOPMENT.md` | [prompts/01](../prompts/01-scaffold-frontend.md) |
| 04-build | `docs/04-build/VERCEL-SUPABASE-DEPLOY.md` | [prompts/11](../prompts/11-deploy-vercel-supabase.md) |
| 05-test | `docs/05-test/TEST-PLAN.md` | Tất cả (acceptance) |
| 05-test | `docs/05-test/ACCEPTANCE-CHECKLIST.md` | Tất cả (final check) |

## 5. Implementation ↔ Prompts Mapping

| Implementation | Prompt |
|----------------|--------|
| `frontend/package.json` + deps | [prompts/01](../prompts/01-scaffold-frontend.md) |
| 6 tables + RLS + seed | [prompts/02](../prompts/02-supabase-schema-rls.md) |
| `src/proxy.ts` + auth provider + login form | [prompts/03](../prompts/03-auth-dang-nhap.md) |
| `src/app/(public)/cay-gia-pha/page.tsx` | [prompts/04](../prompts/04-public-cay-gia-pha.md) |
| `src/app/(public)/thanh-vien/page.tsx` | [prompts/05](../prompts/05-public-thanh-vien.md) |
| `src/app/(public)/lich-cung-le/page.tsx` | [prompts/06](../prompts/06-public-lich-cung-le.md) |
| `src/app/(public)/tai-lieu/page.tsx` | [prompts/07](../prompts/07-public-tai-lieu.md) |
| `src/app/admin/thanh-vien/page.tsx` | [prompts/08](../prompts/08-admin-crud-thanh-vien.md) |
| `src/app/admin/lich-cung-le/page.tsx` | [prompts/09](../prompts/09-admin-crud-lich-cung-le.md) |
| `src/app/admin/tai-lieu/page.tsx` | [prompts/10](../prompts/10-admin-crud-tai-lieu.md) |
| Vercel deployment | [prompts/11](../prompts/11-deploy-vercel-supabase.md) |

## 6. Risk Coverage

| Risk (from PROJECT-CHARTER) | Mitigation | Verified by |
|-----------------------------|------------|-------------|
| Supabase free tier không đủ | Monitor usage, nâng Pro nếu >400MB | Manual check dashboard |
| Admin duy nhất nghỉ | Tạo backup admin ngay | Setup script |
| Dữ liệu lịch sử không chính xác | Admin sửa được | TC-ADM-01 |
| Supabase/Vercel down | Có backup, status page | Monitor |
| Người lớn tuổi không dùng được UI | List view fallback, font lớn | UAT |
| Mất tài khoản admin | Password manager dòng họ | Manual |

## 7. Acceptance Criteria Mapping

Tất cả criteria từ [BRD.md §7](../01-planning/BRD.md#7-acceptance-criteria-tổng-thể) được cover bởi:

| AC# | Yêu cầu | Verified by |
|-----|---------|------------|
| 1 | FR-PUB-01 → FR-PUB-06 pass | TC-PUB-01 → 06 |
| 2 | FR-AUTH-01 + 02 pass | TC-AUTH-01 → 04 |
| 3 | FR-ADM-01 → 04 pass | TC-ADM-01 → 05 |
| 4 | FR-SYS-01 → 05 pass | TC-SYS-01 → 07 + Lighthouse + a11y |
| 5 | Lighthouse ≥ 90 | Performance test |
| 6 | Test cases pass | TEST-PLAN |
| 7 | Acceptance checklist tick | ACCEPTANCE-CHECKLIST |

## 8. Cập nhật matrix

Khi thêm feature mới:

1. Thêm ID vào bảng §1 hoặc §2.
2. Reference file/component.
3. Thêm test case trong TEST-PLAN.md.
4. Update acceptance checklist.

## 9. Liên kết

- [BRD.md](../01-planning/BRD.md) - Source requirements.
- [TEST-PLAN.md](TEST-PLAN.md) - Test cases.
- [ACCEPTANCE-CHECKLIST.md](ACCEPTANCE-CHECKLIST.md) - Final check.
- [prompts/](../prompts/) - Implementation guides.