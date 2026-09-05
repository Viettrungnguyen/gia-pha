---
project: NguyenDinhHoaNgai
path: docs/02-design/UI-UX-DESIGN.md
type: ui-ux
version: 1.1.0
updated: 2026-09-05
owner: "@dev-team"
status: approved
---

# UI/UX Design

## 1. Nguyên tắc thiết kế

- **Tôn kính và ấm áp:** màu đỏ nâu + vàng ấm gợi từ đường, nhà thờ họ.
- **Dễ đọc cho người lớn tuổi:** font size mặc định 16px, button tối thiểu 44x44px.
- **Mobile-first:** thiết kế cho mobile trước, scale up cho desktop.
- **Đơn giản:** ít element, không trang trí thừa.
- **Nhất quán:** mọi page dùng chung shadcn/ui primitives.

## 2. Design Tokens

### 2.1 Màu sắc (Tailwind CSS 4 + CSS variables)

```css
/* globals.css */
:root {
  --background: 30 30% 98%;        /* Trắng ngà */
  --foreground: 20 14% 12%;        /* Đen nâu */
  --card: 0 0% 100%;
  --card-foreground: 20 14% 12%;
  --primary: 16 65% 35%;           /* Đỏ nâu */
  --primary-foreground: 30 30% 98%;
  --secondary: 38 60% 50%;         /* Vàng ấm */
  --secondary-foreground: 20 14% 12%;
  --muted: 30 15% 92%;
  --muted-foreground: 20 10% 40%;
  --accent: 38 70% 92%;            /* Vàng nhạt */
  --accent-foreground: 16 65% 35%;
  --destructive: 0 70% 45%;        /* Đỏ cảnh báo */
  --border: 30 15% 88%;
  --input: 30 15% 88%;
  --ring: 16 65% 45%;
}

.dark {
  --background: 20 14% 8%;
  --foreground: 30 30% 95%;
  /* ... dark overrides */
}
```

### 2.2 Typography

| Token | Size | Line-height | Use case |
|-------|------|-------------|----------|
| `text-xs` | 12px | 16px | Helper text |
| `text-sm` | 14px | 20px | Body small |
| `text-base` | 16px | 24px | Body |
| `text-lg` | 18px | 28px | Body large |
| `text-xl` | 20px | 28px | Heading 4 |
| `text-2xl` | 24px | 32px | Heading 3 |
| `text-3xl` | 30px | 36px | Heading 2 |
| `text-4xl` | 36px | 40px | Heading 1, hero |

**Font family:**

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-serif: 'Merriweather', 'Times New Roman', serif; /* Optional cho tiêu đề trang trọng */
```

Inter được chọn vì dễ đọc, hỗ trợ tiếng Việt đầy đủ.

### 2.3 Spacing & Sizing

| Element | Tailwind class |
|---------|----------------|
| Container padding | `px-4 sm:px-6 lg:px-8` |
| Section spacing | `py-8 lg:py-12` |
| Card padding | `p-4 lg:p-6` |
| Button padding | `px-4 py-2` (md: `px-6 py-3`) |
| Form field gap | `space-y-4` |
| Grid gap | `gap-4 lg:gap-6` |

### 2.4 Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `rounded-sm` | 2px | Input |
| `rounded-md` | 6px | Button, Card |
| `rounded-lg` | 8px | Card lớn, Dialog |
| `rounded-full` | 9999px | Avatar |

### 2.5 Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

## 3. Layout

### 3.1 Site Shell (Public)

```
┌─────────────────────────────────────────────────┐
│ [LOGO] Dòng họ Nguyễn Đình         [Menu]      │ ← Site Header (sticky)
├─────────────────────────────────────────────────┤
│                                                 │
│   ┌─────────────────────────────────────┐       │
│   │        Page content                 │       │
│   │                                     │       │
│   └─────────────────────────────────────┘       │
│                                                 │
├─────────────────────────────────────────────────┤
│ © 2026 Dòng họ Nguyễn Đình - Hòa Ngãi          │ ← Site Footer
└─────────────────────────────────────────────────┘
```

### 3.2 Admin Shell

```
┌─────────────────────────────────────────────────┐
│ [Sidebar 256px]  │  Page content               │
│ ─────────────    │                              │
│ Dashboard        │                              │
│ Thành viên       │                              │
│ Lịch cúng lễ     │                              │
│ Tài liệu         │                              │
│ ─────────────    │                              │
│ [User dropdown]  │                              │
└─────────────────────────────────────────────────┘
```

### 3.3 Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Laptop */
xl: 1280px  /* Desktop */
2xl: 1536px /* Large desktop */
```

## 4. Pages

### 4.1 Trang chủ (`/`)

**Hero section:**
- H1: "Dòng họ Nguyễn Đình" (text-4xl, font-serif, primary color).
- Subtitle: "Gia phả điện tử - Làng Hòa Ngãi, xã Thanh Hà, huyện Thanh Liêm, tỉnh Hà Nam".
- CTA buttons: [Xem cây gia phả] [Danh sách thành viên].

**Stats section:**
- 4 stat card (md:grid-cols-4):
  - Tổng thành viên
  - Tổng đời
  - Sự kiện sắp tới (trong 60 ngày)
  - Tổng tài liệu

**Quick links section:**
- 4 card lớn dẫn đến:
  - Cây gia phả (icon: GitBranchPlus)
  - Thành viên (icon: Users)
  - Lịch cúng lễ (icon: Calendar)
  - Tài liệu (icon: Archive)

**Giới thiệu section:**
- Đoạn văn ngắn về lịch sử dòng họ.
- "Đăng nhập" link nhỏ ở góc (không nổi bật).

### 4.2 Cây gia phả (`/cay-gia-pha`)

- Header: title + nút chuyển chế độ (Cây / Danh sách / Compact).
- Nếu chế độ cây: full-width canvas (SVG), controls góc dưới phải (zoom in/out, fit).
- Nếu chế độ danh sách: table theo đời, mỗi đời là một section.
- **Compact (`/cay-gia-pha/compact`):** view gộp, hiển thị mỗi couple là 1 ô
  (chồng + các vợ xếp dọc), con trai ô riêng, con gái gộp ô liệt kê tên.
  Phù hợp in ấn / xem nhanh tổng quan.

### 4.2.1 Cây gia phả Compact (`/cay-gia-pha/compact`)

```
┌──────────────────────────────────────────┐
│  ┌──────────────────────────────────┐    │
│  │ NGÔ - ÔNG A           (Đời 1)  │    │ ← Header tên chồng
│  │ ───────────────                   │    │
│  │ Vợ 1: Bà B                       │    │ ← Vợ xếp dọc
│  │ Vợ 2: Bà C                       │    │
│  └────────┬─────────────────────────┘    │
│           │                              │
│   ┌───────┼───────┬──────────────┐       │
│   ▼       ▼       ▼              ▼       │
│ ┌─────┐┌─────┐┌──────────────────┐     │
│ │Con X││Con Y││ Con gái (2)       │     │ ← Con trai ô riêng,
│ │Đời 2││Đời 2││ • Ng G (1980)    │     │ ← con gái gộp pill
│ └─────┘└─────┘│ • Ng H (1983)    │     │
│               └──────────────────┘     │
└──────────────────────────────────────────┘
```

**Mục đích**: nhìn tổng quan nhanh, in ấn được, tiết kiệm không gian khi
nhiều con gái.

### 4.3 Danh sách thành viên (`/thanh-vien`)

- Header: title + ô tìm kiếm + filter (đời, chi, trạng thái).
- Grid card: 1 col mobile, 2 tablet, 3 desktop.
- Mỗi card: avatar (placeholder nếu không có), tên, giới tính, đời, năm sinh.

### 4.4 Chi tiết thành viên (`/thanh-vien/[id]`)

- Breadcrumb: Trang chủ / Thành viên / Tên.
- 2 cột (md+):
  - Cột trái (1/3): avatar lớn, tên, thông tin cơ bản.
  - Cột phải (2/3): quan hệ gia đình, tiểu sử.
- Mobile: stack dọc.

### 4.5 Lịch cúng lễ (`/lich-cung-le`)

- Banner "Sắp tới" (nếu có): top 5 events.
- Tabs: [Lịch tháng] [Danh sách].
- Lịch tháng: grid 7x6, ô có badge màu nếu có event.
- Danh sách: card hoặc table, có filter loại.

### 4.6 Tài liệu (`/tai-lieu`)

- Header: search + filter danh mục.
- Grid card: 1 col mobile, 2 tablet, 3-4 desktop.
- Mỗi card: thumbnail (icon cho PDF/video, ảnh preview cho ảnh), tiêu đề, danh mục, size.

### 4.7 Đăng nhập (`/dang-nhap`)

- Center card, max-width 400px.
- Logo + tên dòng họ ở top.
- Form: email, password, [Đăng nhập] button.
- Error message dưới form nếu có.

### 4.8 Admin Dashboard (`/admin`)

- 4 stat card (grid-cols-1 md:grid-cols-2 lg:grid-cols-4).
- Quick actions: 3 card lớn dẫn đến CRUD pages.

### 4.9 Admin CRUD pages

- Header: title + [Thêm mới] button (primary).
- Toolbar: search + filters.
- Body: table hoặc card list.
- Mỗi row/card có [Sửa] [Xóa] actions.
- Modal dialog cho form (create/edit).
- AlertDialog xác nhận trước khi xóa.

## 5. Components

### 5.1 Person Card

```
┌─────────────────────────┐
│  ┌──┐                   │
│  │👤│  Nguyễn Văn A     │
│  └──┘  Đời 3, Chi 1     │
│        1920 - 1985       │
│        Nghề: Nông dân   │
└─────────────────────────┘
```

- Avatar 56x56, rounded-full.
- Border trái màu giới tính: 4px solid blue (nam) hoặc pink (nữ).
- Hover: shadow-md.

### 5.2 Event Card

```
┌────────────────────────────────────┐
│ [Icon]  Giỗ Ông Nội                │
│         15/7 âm lịch · Hàng năm    │
│         Nhà thờ họ                 │
│                          [5 ngày]  │ ← Badge màu
└────────────────────────────────────┘
```

### 5.3 Document Card

```
┌─────────────────────────┐
│  ┌─────────┐            │
│  │ [Ảnh]   │            │
│  └─────────┘            │
│  Ảnh nhà thờ 1960       │
│  📷 Ảnh lịch sử · 2.3MB │
└─────────────────────────┘
```

### 5.4 Form Patterns

**Input field:**
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email *</Label>
  <Input id="email" type="email" required />
  <p className="text-xs text-muted-foreground">Mô tả nếu cần</p>
</div>
```

**Select:**
```tsx
<div className="space-y-2">
  <Label>Loại sự kiện *</Label>
  <Select value={type} onValueChange={setType}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="gio">Giỗ</SelectItem>
      <SelectItem value="hop_ho">Họp họ</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Submit button:**
```tsx
<Button type="submit" disabled={isPending}>
  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
  {isPending ? 'Đang lưu...' : 'Lưu'}
</Button>
```

## 6. States

### 6.1 Loading

- **Skeleton** cho table rows, cards.
- **Spinner** cho button submit.
- **Skeleton** cho full page khi lần đầu load.

### 6.2 Empty

```tsx
<Card className="border-dashed">
  <CardContent className="py-12 text-center">
    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
    <p className="text-muted-foreground">Chưa có thành viên nào</p>
    {isAdmin && (
      <Button asChild className="mt-4">
        <Link href="/admin/thanh-vien">Thêm thành viên đầu tiên</Link>
      </Button>
    )}
  </CardContent>
</Card>
```

### 6.3 Error

```tsx
<Card className="border-destructive">
  <CardContent className="pt-6">
    <div className="flex items-center gap-2 text-destructive">
      <AlertCircle className="h-5 w-5" />
      <p>Lỗi khi tải dữ liệu: {error.message}</p>
    </div>
    <Button onClick={() => refetch()} className="mt-4">
      Thử lại
    </Button>
  </CardContent>
</Card>
```

## 7. Accessibility

- Mọi input có `<Label htmlFor>` hoặc aria-label.
- Modal: focus trap, ESC đóng, click outside đóng.
- Button: type="button" mặc định (tránh submit form ngoài ý muốn).
- Color contrast ≥ 4.5:1 (text on background).
- Keyboard navigation: Tab order rõ ràng, Enter để submit form.

## 8. Responsive

| Page | Mobile (<768px) | Tablet (768-1024px) | Desktop (1024px+) |
|------|-----------------|---------------------|-------------------|
| Trang chủ | Stack dọc, stats 1 col | 2 col stats | 4 col stats |
| Cây gia phả | Chế độ danh sách | Chế độ cây (compact) | Chế độ cây đầy đủ |
| Danh sách thành viên | 1 col card | 2 col card | 3 col card |
| Chi tiết | Stack dọc | 2 col (60/40) | 2 col (1/3 + 2/3) |
| Lịch | Calendar mini | Calendar full | Calendar full + sidebar |
| Admin | Full-width | Sidebar collapsed | Sidebar expanded |

## 9. Iconography

Dùng Lucide React. Một số icon dùng nhiều:

| Icon | Use |
|------|-----|
| `Users` | Thành viên |
| `GitBranchPlus` | Cây gia phả |
| `Calendar` | Lịch cúng lễ |
| `Archive` | Kho tài liệu |
| `LogIn` / `LogOut` | Đăng nhập/Đăng xuất |
| `Plus` | Thêm mới |
| `Pencil` | Sửa |
| `Trash2` | Xóa |
| `Search` | Tìm kiếm |
| `Upload` | Upload file |
| `Download` | Tải file |

## 10. Liên kết

- [TECHNICAL-DESIGN.md §3](TECHNICAL-DESIGN.md) - Cấu trúc component.
- [SITEMAP-USER-FLOWS.md](SITEMAP-USER-FLOWS.md) - Site map.
- [BRD.md §3](../01-planning/BRD.md) - Yêu cầu UI.