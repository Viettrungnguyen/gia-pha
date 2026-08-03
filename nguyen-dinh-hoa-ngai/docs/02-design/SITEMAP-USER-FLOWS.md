---
project: NguyenDinhHoaNgai
path: docs/02-design/SITEMAP-USER-FLOWS.md
type: sitemap
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Sitemap & User Flows

## 1. Sitemap

```
nguyen-dinh-hoa-ngai/
│
├── /                              # Trang chủ (public)
├── /cay-gia-pha                   # Cây gia phả (public)
├── /thanh-vien                    # Danh sách (public)
│   └── /thanh-vien/[id]           # Chi tiết (public)
├── /lich-cung-le                  # Lịch cúng lễ (public)
├── /tai-lieu                      # Kho tài liệu (public)
│
├── /dang-nhap                     # Đăng nhập (public, redirect nếu đã login)
│
└── /admin                         # Khu quản trị (admin only)
    ├── /admin                     # Dashboard
    ├── /admin/thanh-vien          # CRUD thành viên + quan hệ
    ├── /admin/lich-cung-le        # CRUD lịch
    └── /admin/tai-lieu            # CRUD tài liệu + upload
```

## 2. URL Slugs

Dùng tiếng Việt không dấu, kebab-case cho dễ đọc.

| Slug | Mục đích |
|------|----------|
| `/` | Trang chủ |
| `/cay-gia-pha` | Cây gia phả |
| `/thanh-vien` | Danh sách thành viên |
| `/thanh-vien/{uuid}` | Chi tiết thành viên |
| `/lich-cung-le` | Lịch cúng lễ |
| `/tai-lieu` | Kho tài liệu |
| `/dang-nhap` | Đăng nhập |
| `/admin` | Dashboard admin |
| `/admin/thanh-vien` | CRUD thành viên |
| `/admin/lich-cung-le` | CRUD lịch |
| `/admin/tai-lieu` | CRUD tài liệu |

## 3. Metadata cho mỗi page

| Page | Title | Description |
|------|-------|-------------|
| `/` | Dòng họ Nguyễn Đình - Gia phả điện tử | Website gia phả điện tử dòng họ Nguyễn Đình, làng Hòa Ngãi, Hà Nam |
| `/cay-gia-pha` | Cây gia phả - Dòng họ Nguyễn Đình | Sơ đồ cây gia đình dòng họ Nguyễn Đình |
| `/thanh-vien` | Danh sách thành viên - Dòng họ Nguyễn Đình | Tìm kiếm và xem hồ sơ thành viên dòng họ |
| `/thanh-vien/[id]` | [Tên thành viên] - Dòng họ Nguyễn Đình | Hồ sơ chi tiết của [tên thành viên] |
| `/lich-cung-le` | Lịch cúng lễ - Dòng họ Nguyễn Đình | Lịch giỗ, họp họ, lễ tết dòng họ |
| `/tai-lieu` | Kho tài liệu - Dòng họ Nguyễn Đình | Ảnh lịch sử, giấy tờ, PDF, video |
| `/dang-nhap` | Đăng nhập - Dòng họ Nguyễn Đình | Đăng nhập quản trị |
| `/admin` | Quản trị - Dòng họ Nguyễn Đình | Dashboard quản trị |

## 4. User Flows

### 4.1 Khách xem cây gia phả

```
1. User mở trang chủ (/)
2. Click card "Cây gia phả"
3. Điều hướng đến /cay-gia-pha
4. Hệ thống load data (people, families, children)
5. Hiển thị SVG cây gia phả
6. User kéo/zoom bằng chuột hoặc touch
7. User click vào node một người
8. Điều hướng đến /thanh-vien/[id]
```

### 4.2 Khách tìm thành viên

```
1. User ở /thanh-vien
2. Gõ tên vào ô tìm kiếm (vd: "Văn A")
3. Hệ thống filter real-time (fuzzy search)
4. Hiển thị kết quả
5. User click vào card
6. Điều hướng đến /thanh-vien/[id]
7. Hiển thị hồ sơ đầy đủ + quan hệ
```

### 4.3 Khách xem lịch sắp tới

```
1. User mở /lich-cung-le
2. Hệ thống load events trong 60 ngày tới
3. Hiển thị banner "Sắp tới" với top 5
4. User click vào event
5. (Optional) Click tên thành viên → /thanh-vien/[id]
```

### 4.4 Khách tải tài liệu

```
1. User mở /tai-lieu
2. Tìm kiếm/lọc
3. Click vào card tài liệu
4. Mở file trong tab mới
5. User Ctrl+S để lưu
```

### 4.5 Admin đăng nhập

```
1. Admin mở /admin (lần đầu)
2. proxy.ts redirect → /dang-nhap?next=/admin
3. Nhập email + password
4. Submit → Supabase Auth signInWithPassword
5. Thành công → redirect /admin
6. proxy.ts check role=admin → cho phép
7. Dashboard load stats
```

### 4.6 Admin thêm thành viên

```
1. Admin ở /admin/thanh-vien
2. Click [Thêm mới]
3. Modal mở với form
4. Điền: tên, họ, đời, chi, ngày sinh...
5. (Optional) Chọn cha, chọn mẹ
   → Hệ thống tự sinh generation = parent.gen + 1
   → Click submit sẽ tạo family row và children row
6. Submit → useCreatePerson mutation
7. Optimistic update + invalidate ['people'] query
8. Modal đóng, danh sách refresh
9. Toast "Đã thêm thành viên thành công"
```

### 4.7 Admin upload tài liệu

```
1. Admin ở /admin/tai-lieu
2. Click [Tải lên]
3. Modal mở với form
4. Điền tiêu đề, chọn file, danh mục...
5. Validate MIME + size (client-side)
6. Submit → uploadMutation.uploadFile → Storage
7. Nếu upload OK → createDocument mutation → insert row
8. Nếu lỗi ở bước nào → toast lỗi, dừng
9. Thành công → refresh danh sách
```

### 4.8 Admin xóa thành viên

```
1. Admin ở /admin/thanh-vien
2. Click icon [Xóa] trên row
3. AlertDialog mở với cảnh báo
4. (Nếu có quan hệ cha/mẹ/con) Hiển thị cảnh báo cascade
5. Admin xác nhận → deletePerson mutation
6. Cascade: nếu là father_id/mother_id của family → family.father_id SET NULL
7. Nếu là con của family → xóa row children
8. Refresh danh sách, toast "Đã xóa"
```

## 5. Navigation Map

```
┌────────────────────────────────────────────────────────┐
│                     SITE HEADER                         │
│  Logo | Trang chủ | Cây gia phả | Thành viên | Lịch   │
│         | Tài liệu                          [Đăng nhập]│
└────────────────────────────────────────────────────────┘

[Khi đã đăng nhập admin]
┌────────────────────────────────────────────────────────┐
│              ADMIN SIDEBAR                              │
│  ────────────                                           │
│  📊 Dashboard                                           │
│  👥 Thành viên                                          │
│  📅 Lịch cúng lễ                                        │
│  📁 Tài liệu                                           │
│  ────────────                                           │
│  [Avatar] Admin ▼                                       │
│     ↳ Đăng xuất                                        │
└────────────────────────────────────────────────────────┘
```

## 6. Error Pages

| Path | Code | Mục đích |
|------|------|----------|
| `/not-found` | 404 | Trang không tồn tại |
| `/error` | 500 | Lỗi server |
| `/dang-nhap?error=suspended` | - | Tài khoản bị khóa (future) |
| `/dang-nhap?error=invalid_credentials` | - | Sai email/password |

## 7. Loading States

Mỗi page có `loading.tsx` riêng (Next.js convention):

```tsx
// app/(public)/thanh-vien/loading.tsx
export default function Loading() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
```

## 8. Liên kết

- [UI-UX-DESIGN.md](UI-UX-DESIGN.md) - Thiết kế chi tiết.
- [TECHNICAL-DESIGN.md §3](TECHNICAL-DESIGN.md#3-frontend-structure) - Cấu trúc route.
- [BRD.md](../01-planning/BRD.md) - Yêu cầu chức năng.