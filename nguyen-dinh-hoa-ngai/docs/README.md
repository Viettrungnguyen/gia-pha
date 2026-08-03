---
project: NguyenDinhHoaNgai
path: docs/README.md
type: index
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Tài liệu dự án - NguyenDinhHoaNgai

Điều hướng nhanh đến các tài liệu SDLC.

## 00 - Foundation

| File | Mô tả |
|------|-------|
| [VISION.md](00-foundation/VISION.md) | Tầm nhìn, sứ mệnh, mục tiêu kinh doanh |
| [PROJECT-CHARTER.md](00-foundation/PROJECT-CHARTER.md) | Phạm vi, stakeholder, rủi ro sơ bộ |

## 01 - Planning

| File | Mô tả |
|------|-------|
| [BRD.md](01-planning/BRD.md) | Business Requirements - yêu cầu nghiệp vụ |

## 02 - Design

| File | Mô tả |
|------|-------|
| [TECHNICAL-DESIGN.md](02-design/TECHNICAL-DESIGN.md) | Kiến trúc tổng thể, tech stack, deployment |
| [DATA-MODEL.md](02-design/DATA-MODEL.md) | ERD, schema chi tiết, RLS matrix |
| [SECURITY-PRIVACY.md](02-design/SECURITY-PRIVACY.md) | Auth flow, RLS chi tiết, upload guard, secret handling |
| [UI-UX-DESIGN.md](02-design/UI-UX-DESIGN.md) | Design tokens, layout, components, accessibility |
| [SITEMAP-USER-FLOWS.md](02-design/SITEMAP-USER-FLOWS.md) | Site map, user flow khách + admin |

## 04 - Build

| File | Mô tả |
|------|-------|
| [IMPLEMENTATION-PLAN.md](04-build/IMPLEMENTATION-PLAN.md) | Sprint breakdown, thứ tự code, ước lượng |
| [LOCAL-DEVELOPMENT.md](04-build/LOCAL-DEVELOPMENT.md) | Cài đặt local, Supabase CLI, dev workflow |
| [VERCEL-SUPABASE-DEPLOY.md](04-build/VERCEL-SUPABASE-DEPLOY.md) | Triển khai production, env, custom domain |

## 05 - Test

| File | Mô tả |
|------|-------|
| [TEST-PLAN.md](05-test/TEST-PLAN.md) | Test scope, test cases, tools |
| [ACCEPTANCE-CHECKLIST.md](05-test/ACCEPTANCE-CHECKLIST.md) | Checklist nghiệm thu từng chức năng |
| [REQUIREMENTS-TRACEABILITY.md](05-test/REQUIREMENTS-TRACEABILITY.md) | Map yêu cầu ↔ implementation ↔ test |

## Quy tắc

- Mọi file Markdown phải có YAML front matter (theo `CLAUDE.md`).
- Stage 03 (Implementation) được lược bỏ vì LITE tier, các bước impl nằm trong stage 04.
- Tham chiếu chéo giữa các file dùng relative path.