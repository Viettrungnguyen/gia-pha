---
project: NguyenDinhHoaNgai
path: docs/05-test/TEST-PLAN.md
type: test-plan
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Test Plan

## 1. Phạm vi test

| Layer | Loại test | Công cụ |
|-------|-----------|---------|
| Frontend Unit | Hooks, components | Vitest (optional), React Testing Library |
| Frontend E2E | User flows | Playwright (optional) |
| Database | RLS policies, schema | SQL Editor, manual |
| Integration | API endpoints | Manual + Postman/Insomnia |
| UI | Cross-browser | Chrome, Edge, Firefox, Safari |
| Performance | Lighthouse | Chrome DevTools |
| Accessibility | a11y | axe DevTools |
| Security | RLS bypass test | SQL Editor, anon key |

## 2. Môi trường test

- **Local:** `pnpm dev` + Supabase project test
- **Staging (Preview):** Vercel preview URL per PR
- **Production:** `https://giapha-nguyen-dinh-hoa-ngai.vercel.app`

## 3. Test Cases

### 3.1 FR-PUB: Trang công khai

#### TC-PUB-01: Trang chủ load thành công

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Truy cập `/` | Hiển thị title "Dòng họ Nguyễn Đình" |
| 2 | Xem stats | Hiển thị số thành viên, đời, sự kiện, tài liệu (từ DB) |
| 3 | Click card "Cây gia phả" | Điều hướng `/cay-gia-pha` |
| 4 | Click card "Thành viên" | Điều hướng `/thanh-vien` |
| 5 | Click card "Lịch cúng lễ" | Điều hưởng `/lich-cung-le` |
| 6 | Click card "Tài liệu" | Điều hướng `/tai-lieu` |
| 7 | Click "Đăng nhập" | Điều hướng `/dang-nhap` |

#### TC-PUB-02: Cây gia phả

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Truy cập `/cay-gia-pha` | Hiển thị SVG với 18 nodes (từ seed) |
| 2 | Kéo chuột | Pan hoạt động |
| 3 | Scroll | Zoom in/out |
| 4 | Click node "Nguyễn Đình Tổ" | Điều hướng `/thanh-vien/[id]` |
| 5 | Click nút "Danh sách" | Chuyển sang list view theo đời |
| 6 | Click nút "Cây" | Quay lại tree view |

#### TC-PUB-03: Danh sách thành viên

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Truy cập `/thanh-vien` | Hiển thị grid 18 cards |
| 2 | Tìm "tuấn" | Filter chỉ hiển thị "Nguyễn Đình Tuấn" |
| 3 | Filter "Đời 1" | Chỉ hiển thị thủy tổ + bà (2 người) |
| 4 | Filter "Chi 1" | Chỉ hiển thị chi 1 |
| 5 | Filter "Còn sống" | Chỉ hiển thị đời 4-5 |
| 6 | Click card | Điều hướng detail |
| 7 | Click "Xóa bộ lọc" | Reset về tất cả |

#### TC-PUB-04: Chi tiết thành viên

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Truy cập `/thanh-vien/[id của "Nguyễn Đình Tổ"]` | Hiển thị hồ sơ |
| 2 | Xem thông tin cơ bản | Tên, giới tính, đời, năm sinh/mất |
| 3 | Xem quan hệ | Hiển thị vợ + con |
| 4 | Click vào "Nguyễn Thị Bà" (vợ) | Điều hướng đến trang chi tiết của bà |
| 5 | Click "Quay lại danh sách" | Về `/thanh-vien` |

#### TC-PUB-05: Lịch cúng lễ

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Truy cập `/lich-cung-le` | Hiển thị banner "Sắp tới" + tabs |
| 2 | Xem banner | Hiển thị top 5 sự kiện trong 60 ngày |
| 3 | Tab "Lịch tháng" | Hiển thị calendar tháng hiện tại |
| 4 | Click nút next month | Chuyển tháng, có thể có badge events |
| 5 | Tab "Danh sách" | Hiển thị tất cả events |
| 6 | Filter "Giỗ" | Chỉ hiển thị events giỗ |
| 7 | Click vào event | Hiển thị chi tiết (hoặc link person) |

#### TC-PUB-06: Kho tài liệu

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Truy cập `/tai-lieu` | Hiển thị grid 3 cards (từ seed) |
| 2 | Filter "Ảnh lịch sử" | Chỉ hiển thị 2 cards |
| 3 | Tìm "gia phả" | Filter "Gia phả sách giấy" |
| 4 | Click card | Mở file trong tab mới |

### 3.2 FR-AUTH: Đăng nhập

#### TC-AUTH-01: Đăng nhập thành công

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Truy cập `/admin` | Redirect `/dang-nhap?next=/admin` |
| 2 | Nhập email + password đúng | Form validate OK |
| 3 | Submit | Redirect `/admin` |
| 4 | Xem dashboard | Hiển thị stats + sidebar |

#### TC-AUTH-02: Sai mật khẩu

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Truy cập `/dang-nhap` | Form hiển thị |
| 2 | Nhập email đúng, password sai | Submit |
| 3 | Xem lỗi | Hiển thị "Email hoặc mật khẩu không đúng" |

#### TC-AUTH-03: User không phải admin

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Trong SQL, tạo user `viewer@test.local` với role mặc định (nếu có) | Row trong profiles |
| 2 | Đăng nhập với user đó | Login thành công |
| 3 | Truy cập `/admin` | Redirect `/` (không phải admin) |

#### TC-AUTH-04: Đăng xuất

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Đăng nhập admin | Vào `/admin` |
| 2 | Click "Đăng xuất" trong sidebar | Sign out |
| 3 | Redirect về `/` | Cookie bị xóa |

### 3.3 FR-ADM: Khu quản trị

#### TC-ADM-01: CRUD thành viên

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Vào `/admin/thanh-vien` | Thấy table 18 rows |
| 2 | Click "Thêm mới" | Modal form mở |
| 3 | Điền: handle ND019, tên "Nguyễn Đình Test", họ "Nguyễn Đình", giới tính Nam, đời 5 | Form OK |
| 4 | Submit | Toast "Đã thêm thành viên", table có 19 rows |
| 5 | Verify ở `/thanh-vien` (public) | Thành viên mới xuất hiện |
| 6 | Click icon sửa trên row mới | Form pre-fill |
| 7 | Đổi tên → submit | Toast "Đã cập nhật" |
| 8 | Click icon xóa | Dialog xác nhận |
| 9 | Confirm | Toast "Đã xóa", table còn 18 rows |

#### TC-ADM-02: CRUD với quan hệ cha mẹ

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Tạo thành viên mới, chọn cha = "Nguyễn Đình Cả", mẹ = "Nguyễn Thị Ba" | Form OK |
| 2 | Submit | Toast thành công |
| 3 | Verify ở `/thanh-vien/[id]` (public) | Hiển thị cha mẹ trong quan hệ |
| 4 | Verify ở `/cay-gia-pha` | Có node mới nối với cha mẹ |

#### TC-ADM-03: CRUD lịch cúng lễ

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Vào `/admin/lich-cung-le` | Table 14 rows |
| 2 | Click "Thêm mới" → điền "Test event", loại "Họp họ", ngày dương 2026-12-31, recurring | Form OK |
| 3 | Submit | Toast thành công |
| 4 | Verify ở `/lich-cung-le` (public) | Event mới hiển thị |
| 5 | Sửa → đổi tiêu đề → submit | OK |
| 6 | Xóa → confirm | OK |

#### TC-ADM-04: CRUD tài liệu với upload

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Vào `/admin/tai-lieu` | Table 3 rows |
| 2 | Click "Tải lên mới" → điền tiêu đề, chọn ảnh 2MB, danh mục "Ảnh lịch sử" | Form OK |
| 3 | Submit | Toast "Đã tải lên tài liệu" |
| 4 | Vào Supabase Storage → bucket `clan-documents` | File mới xuất hiện |
| 5 | Verify ở `/tai-lieu` (public) | Card mới với thumbnail |
| 6 | Click thumbnail | Mở file trong tab mới |
| 7 | Xóa → confirm | Toast, file trong Storage cũng bị xóa |

#### TC-ADM-05: Upload file không hợp lệ

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Thử upload file .exe | Validation client báo lỗi "Định dạng không hỗ trợ" |
| 2 | Thử upload file 100MB | Validation báo "File quá lớn (tối đa 50MB)" |

### 3.4 FR-SYS: Hệ thống

#### TC-SYS-01: RLS - Anon SELECT

```sql
SET ROLE anon;
SELECT COUNT(*) FROM people;  -- Expected: 18 (không lỗi)
RESET ROLE;
```

#### TC-SYS-02: RLS - Anon INSERT deny

```sql
SET ROLE anon;
INSERT INTO people (handle, display_name, surname, generation)
VALUES ('TEST', 'Test', 'Test', 1);
-- Expected: ERROR: new row violates row-level security policy for table "people"
RESET ROLE;
```

#### TC-SYS-03: RLS - Anon UPDATE deny

```sql
SET ROLE anon;
UPDATE people SET display_name = 'Hacked';
-- Expected: ERROR
RESET ROLE;
```

#### TC-SYS-04: RLS - Anon DELETE deny

```sql
SET ROLE anon;
DELETE FROM people;
-- Expected: ERROR
RESET ROLE;
```

#### TC-SYS-05: RLS - Admin có thể CRUD

```sql
-- Test với admin's JWT token (qua Postman/Insomnia):
POST /rest/v1/people
{ "handle": "TEST", "display_name": "Test", "surname": "Test", "generation": 1 }
-- Expected: 201 Created

DELETE /rest/v1/people?id=eq.<TEST_ID>
-- Expected: 204 No Content
```

#### TC-SYS-06: SEO Metadata

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | View source `/` | Có `<title>Dòng họ Nguyễn Đình</title>` |
| 2 | View source `/cay-gia-pha` | Có title + description + OG tags |
| 3 | Truy cập `/sitemap.xml` | Trả về XML với 5 URLs |
| 4 | Truy cập `/robots.txt` | Cho phép all, disallow /admin/ |

#### TC-SYS-07: 404 page

| Bước | Hành động | Expected |
|------|-----------|----------|
| 1 | Truy cập `/random-path` | Hiển thị trang 404 với link về trang chủ |
| 2 | Truy cập `/thanh-vien/00000000-0000-0000-0000-000000000000` | Hiển thị 404 |

## 4. Performance Test

### Lighthouse Audit

Chạy cho mỗi page:

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| / | ≥ 90 | ≥ 90 | ≥ 90 | ≥ 90 |
| /cay-gia-pha | ≥ 80 | ≥ 90 | ≥ 90 | ≥ 90 |
| /thanh-vien | ≥ 90 | ≥ 90 | ≥ 90 | ≥ 90 |
| /thanh-vien/[id] | ≥ 90 | ≥ 90 | ≥ 90 | ≥ 90 |
| /lich-cung-le | ≥ 90 | ≥ 90 | ≥ 90 | ≥ 90 |
| /tai-lieu | ≥ 90 | ≥ 90 | ≥ 90 | ≥ 90 |
| /admin | ≥ 80 | ≥ 90 | ≥ 90 | - |
| /admin/* | ≥ 80 | ≥ 90 | ≥ 90 | - |

Test trên 2 thiết bị:
- Mobile (Moto G Power mặc định)
- Desktop

## 5. Cross-browser Test

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 120+ | Phải pass |
| Edge | 120+ | Phải pass |
| Firefox | 120+ | Phải pass |
| Safari | 17+ (macOS, iOS) | Phải pass |
| Samsung Internet | 22+ | Best effort |
| UC Browser | - | Không test |

## 6. Accessibility Test

- Tab navigation: tất cả interactive elements có thể truy cập qua Tab.
- Screen reader: Test với NVDA (Windows) hoặc VoiceOver (macOS).
- Color contrast: ≥ 4.5:1 cho text.
- Form labels: tất cả input có label.
- Alt text: tất cả images có alt.

## 7. Security Test

| Test | Cách làm | Expected |
|------|----------|----------|
| XSS trong tiểu sử | Login admin → sửa người → tiểu sử: `<script>alert(1)</script>` | Hiển thị text, không chạy script |
| SQL Injection | Trong search box: `' OR '1'='1` | Không break query, hiển thị "no result" |
| CSRF | Logout từ tab A, trong tab B click vào form submit | Form redirect về login |
| Cookie theft | DevTools → Application → Cookies | Cookie có HttpOnly + Secure (prod) |
| Path traversal | Upload file tên `../../etc/passwd` | Sanitize tên file |

## 8. Load Test

Vì dòng họ cỡ vài chục-ngàn người dùng/tháng (worst case), không cần load test chuyên sâu.

Nhưng kiểm tra:

- Với 100 người trong `people`: cây gia phả render trong < 2 giây.
- Với 100 events: lịch render trong < 1 giây.
- Với 50 documents: grid render trong < 1 giây.

## 9. Test Data

- 18 người demo (seed).
- 14 events demo.
- 3 documents demo.
- 1 admin user.

## 10. Bug Severity

| Severity | Mô tả | SLA |
|----------|-------|-----|
| Critical | Không thể login, không thể truy cập trang | Fix trong 4 giờ |
| High | Chức năng chính lỗi | Fix trong 24 giờ |
| Medium | UI lỗi nhỏ, không block | Fix trong 1 tuần |
| Low | Cosmetic, typo | Fix khi rảnh |

## 11. Test Report Template

Sau mỗi sprint, điền:

```markdown
## Test Report - Sprint X

### Pass/Fail Summary
- TC pass: X
- TC fail: Y
- Blocked: Z

### Failures
- TC-XXX: [mô tả]
  - Expected: ...
  - Actual: ...
  - Repro: ...

### Performance
- Lighthouse mobile: ...
- Lighthouse desktop: ...

### Sign-off
- [ ] All critical issues resolved
- [ ] Performance targets met
- [ ] Sign-off: @name date
```

## 12. Liên kết

- [ACCEPTANCE-CHECKLIST.md](ACCEPTANCE-CHECKLIST.md) - Checklist nghiệm thu.
- [REQUIREMENTS-TRACEABILITY.md](REQUIREMENTS-TRACEABILITY.md) - Map yêu cầu ↔ test.
- [BRD.md §3](../01-planning/BRD.md) - Acceptance criteria.