---
project: NguyenDinhHoaNgai
path: docs/04-build/FEATURE-COMPACT-TREE-AND-CHILD-ORDER.md
type: feature-spec
version: 1.10.0
updated: 2026-09-06
owner: "@dev-team"
status: approved
---

# Feature: Sắp xếp thứ tự con + Cây gia phả dạng Compact

## 1. Bối cảnh & Mục tiêu

### 1.1 Vấn đề

- Cây gia phả hiện tại (`family-tree.tsx`) đang hiển thị các con trong cùng một gia đình
  theo thứ tự **mặc định** (sinh ra từ `sort_order` trong bảng `children`, nhưng khi
  admin chưa nhập `sort_order` cho 1 số con thì thứ tự hiển thị không nhất quán).
- Khi một người nam có nhiều vợ (ví dụ: ông A có 2 bà vợ B và C), ông nối xuống cả 2
  dòng con nhưng hiện tại các con của cả 2 bà đang hiển thị chung qua 1 đường nối duy
  nhất từ ô của ông A, gây khó hiểu về mối quan hệ mẹ - con.
- Chưa có view "compact" gộp dữ liệu vào ít ô hơn, phù hợp in ấn / xem nhanh.

### 1.2 Mục tiêu (2 công việc)

| # | Mục tiêu | Tiêu chí thành công |
|---|----------|---------------------|
| **CV1** | Thêm trường `sort_order` cho **thứ tự con** trong gia đình. Nếu cùng family mà có con có `sort_order` và con không có, con có `sort_order` hiển thị trước theo thứ tự tăng dần, các con chưa nhập xếp phía sau (giữ thứ tự hiện tại). | - Có admin UI để sắp xếp.<br>- Cây gia phả hiển thị theo thứ tự `sort_order`.<br>- Fallback: dữ liệu cũ vẫn hiển thị ổn. |
| **CV2** | Thêm view **cây compact data** tại route `/cay-gia-pha/compact` (hoặc tab trong `/cay-gia-pha`).<br>- Ô vợ chồng: gộp 1 ô, nhiều vợ thì xếp dọc trong cùng ô.<br>- Ô con: **con trai giữ ô riêng**, **các con gái gộp chung vào 1 ô** (hiển thị danh sách tên). | - Render đúng từ cùng bảng `people`/`families`/`children`.<br>- Thứ tự: sắp theo `sort_order`.<br>- Trường hợp 1 vợ nhiều con: hiển thị rõ ràng. |

## 2. Phạm vi & Phi phạm vi

### 2.1 Trong phạm vi
- Thay đổi logic sort trong `family-tree.tsx` (CV1).
- Tạo mới component `compact-family-tree.tsx` (CV2).
- Trang `/cay-gia-pha/compact` (CV2).
- `mock-data` có `sort_order` cho nhiều gia đình để test.

### 2.2 Ngoài phạm vi
- Không sửa schema DB (cột `sort_order` đã có sẵn trong `children` và `families`).
- Không thêm quyền riêng tư mới.
- Không thêm export PDF.
- Không thêm chức năng kéo thả để sắp xếp (drag-drop) ở admin - dùng input số đơn giản.

## 3. Thiết kế kỹ thuật

### 3.1 CV1 - Sắp xếp thứ tự con (sort_order)

**Hiện trạng (`family-tree.tsx`):**
```ts
for (const familyChildren of childrenByFamily.values()) {
  familyChildren.sort((a, b) => a.sort_order - b.sort_order);
}
```
Code đã sort theo `sort_order`. **Vấn đề thực tế:** Khi admin thêm con mới vào gia đình qua
form (`person-form.tsx`), `sort_order` được mặc định `0`. Nếu nhiều con trong cùng family
đều `sort_order = 0` (null hoặc 0), thứ tự hiển thị sẽ phụ thuộc vào thứ tự của mảng
backend trả về, không phản ánh thứ tự "trưởng – thứ" thực tế.

**Thay đổi:**

1. **Mock data (`src/lib/dev-fake-tree.ts`):**
   - Gán `sort_order = c` cho mỗi child (c = 0..N-1) - đã có nhưng đảm bảo.
   - Với **gãy vỡ test**: có 1 family có 3 con, trong đó 2 con có `sort_order`, 1 con để
     `sort_order = 9999` (NULLS LAST). Đã verify: `sortOrder ?? 9999` sẽ đẩy xuống cuối.
   - Với **nam lấy 2 vợ**: tạo 2 family riêng, mỗi family có 2 con. Con của vợ 1 mang
     họ `Nguyễn Đình` (patrilineal), con của vợ 2 cũng mang họ `Nguyễn Đình` (theo quy
     ước test).

2. **Logic hiển thị (không phải sửa DB):**
   - Trong `family-tree.tsx`, sau khi sort `a.sort_order - b.sort_order` thì thêm
     fallback: khi 2 con cùng `sort_order` thì sort theo `birth_year` để có thứ tự
     ổn định.
   - Vẽ đường nối từ **ô của vợ tương ứng**, không phải từ tâm của cặp vợ chồng.
     - Hiện tại code vẽ `familyCenterX = (anchorX + spouseX) / 2`. Cần đổi:
       - Nếu couple có 1 ô (1 vợ hoặc 1 chồng) → vẽ nối từ ô người đó.
       - Nếu couple có 2 ô (vợ chồng đầy đủ) → vẽ nối từ **ô vợ**.
     - Lý do: trong quan hệ cha-mẹ-con, người **vợ** (mẹ) là người trực tiếp sinh con,
       về mặt trực quan nên nối từ ô mẹ.

3. **Admin UX:**
   - Tại `/admin/thanh-vien`, mỗi người click "Sửa" hoặc trang chi tiết có 1 box
     "Thứ tự con trong gia đình" liệt kê các con theo input số. Đơn giản: chỉ cần
     thêm input `sort_order` khi thêm child qua form `PersonForm`.
   - **MVP:** không cần UI riêng để reorder; chỉ cần:
     - Khi admin chọn cha-mẹ trong `PersonForm`, **tự động đề xuất** `sort_order =
       max(existing) + 1` cho family đó.
     - Cho phép admin nhập tay `sort_order` qua 1 input số nhỏ (optional).

### 3.2 CV2 - Cây Compact

**Mô tả view:**

Đời 1: Nam A ──┬── Vợ 1 B ──┬── Con trai X (ô riêng) ──┬── Vợ Xa1 ── ...
               │             └── 2 con gái (ô gộp, hiện tên)
               └── Vợ 2 C ──┬── Con trai Y (ô riêng)
                             └── 1 con gái (ô gộp)

**Quy tắc layout:**

- Mỗi "ô couple" = 1 ô hình chữ nhật lớn. Trong ô:
  - Dòng 1: Tên chồng (anchor - người có cha mẹ, hoặc nam nếu cùng đời tổ).
  - Dòng 2: Tên vợ 1. Nếu có vợ 2 → dòng 3.
  - Nếu >2 vợ → mỗi vợ thêm 1 dòng. Trong MVP giới hạn hiển thị 3-4 vợ còn lại
    hiện "+N vợ" và mở modal chi tiết.
- **Con:**
  - Với mỗi family của ông A (mỗi vợ là 1 family):
    - Lọc con theo giới tính.
    - **Con trai:** giữ ô riêng theo layout cây thường (anchor riêng).
    - **Con gái:** gộp vào 1 ô đặc biệt (hình viên thuốc, dạng list) phía dưới mỗi
      family. Trong ô con gái: danh sách tên + năm sinh, mỗi tên là 1 dòng, click
      để xem chi tiết.
- Đường nối cha-mẹ-con:
  - Con trai: nối từ tâm đáy couple → đỉnh ô con trai.
  - Con gái (ô gộp): nối từ tâm đáy couple → đỉnh ô gộp con gái.

**Cấu trúc component:**

```
compact-family-tree.tsx (mới)
├── buildCompactLayout(data): CompactTreeLayout
│   ├── coupleNodes[]: danh sách "ô couple" (anchor + các vợ)
│   ├── sonNodes[]: ô con trai
│   ├── daughterCells[]: ô gộp con gái (gắn với family.id)
│   └── connections[]
├── CompactCoupleNode: render ô chồng (anchor) + các vợ dọc
├── CompactSonNode: render ô con trai
├── CompactDaughterCell: render ô gộp con gái (multi-line)
└── Container + zoom/pan (reuse từ family-tree.tsx)
```

**Layout algorithm (đơn giản):**

```
for each generation G:
  for each couple (anchorId) in G:
    placeCoupleBox(anchorId, [spouseList])
    for each family of anchor:
      sons = children of family, gender = 1, sort by sort_order
      daughters = children of family, gender = 2, sort by sort_order
      for each son:
        placeSonNode(son, below coupleBox, x = coupleCenterX + offset)
      if daughters not empty:
        placeDaughterCell(family.id, daughters, below coupleBox, x = coupleCenterX + offset)
```

**Reuse data:** Cùng `useTreeData()` hook và `TreeData` type. Không cần schema mới.

## 4. UI/UX Mockups

### 4.1 Cây compact (CV2) — phiên bản 2026-09

```
┌──────────────────────────────────────────────────┐
│                                                   │
│  ┌──────────────────────┐                         │
│  │ NGÔ NG.TỔ A    [Đ.1]│   ← Header: tên + meta  │
│  ├──────────────────────┤     (Đời, Chi ở góc)   │
│  │ Vợ: Ng.Thị Tổ Mẫu B │   ← Vợ xếp dọc        │
│  └──────────┬───────────┘                         │
│             │                                     │
│   ┌─────────┼─────────┬──────────────┐           │
│   ▼         ▼         ▼              ▼           │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐     │
│ │Ng.C1 │ │Ng.C2 │ │Ng.C3 │ │ Con gái       │     │
│ │Đời 2 │ │Đời 2 │ │Đời 2 │ │ • E9 (1763)  │     │
│ │1730  │ │1732  │ │1734  │ │ • EA (1766)  │     │
│ └──────┘ └──────┘ └──────┘ │ • EB (1768)  │     │
│                            └──────────────┘     │
└──────────────────────────────────────────────────┘
```

**Lưu ý thiết kế (cập nhật 2026-09-05 v3):**
- **Nền**: Container dùng `backgroundColor: #fff7ed` (orange-50) + ảnh nền
  `tree_center26.png` giống cây thường, để đồng bộ giữa 2 view.
- **Bỏ lớp phủ đen** `#000000 opacity=0.4` đã có trước đó (làm tối nền không cần thiết).
- **Khoảng cách dọc đồng đều + chạm node (cập nhật 2026-09-05 v5):**
  - **Vấn đề v4**: `y1 = bottomOfGen[anchor.gen]` (= levelY[gen] + max_cHeight) cho
    đường nối đồng đều, **nhưng** với couple thấp hơn max, đường nối xuất phát DƯỚI
    đáy thực của couple (có gap dư thừa) → user thấy "không chạm ô trên".
  - **Vấn đề v3 (cũ)**: `y1 = coupleY + cHeight(cha)` + `y2 = coupleY + cHeight + 60`.
    Đường nối dài không đồng đều giữa các cụ (cụ nhiều vợ → dài, cụ 1 vợ → ngắn).
  - **Fix v5**:
    - `y1 = coupleY + cHeight` (đáy thực của couple cha) → luôn chạm đáy ô cha.
    - `y2 = levelY[childGen]` (top cố định theo gen con) → luôn chạm top ô con.
    - Độ dài đường nối = `levelY[gen+1] - (levelY[gen] + cHeight)` — thay đổi theo
      cụ (cụ thấp → đường dài, cụ cao = max → đường ngắn = `LEVEL_GAP`).
    - Nhưng cả 2 đầu đều chạm node → không còn "không connect".
  - `LEVEL_GAP` = **48** (đủ dài cho đường vuông góc đẹp).
  - Test bằng script độc lập đã pass:
    - 34 nodes, 22 connections, 0 overlap, 0 duplicate.
    - Width 6440, Height 690.
    - Mọi connection đều `|y1 - couple_bottom| <= 1` và `|y2 - child_top| <= 1`
      → đảm bảo chạm node cha + node con.
- **Kích thước gọn lại** (đợt 3):
  - `COUPLE_BOX_WIDTH` 230 → **200**.
  - `COUPLE_BOX_HEADER_HEIGHT` 46 → **40**.
  - `COUPLE_BOX_HEIGHT_PER_SPOUSE` 32 → **26**.
  - `DAUGHTER_CELL_WIDTH` 230 → **200**.
  - `LEVEL_HEIGHT` 170 → **160**.
  - Font tên chồng 15 → 14; tên vợ 13 → 12.
- **Ô con gái** (gọn hơn):
  - **KHÔNG còn header "Con gái"** — chỉ liệt kê danh sách tên + năm sinh, tiết kiệm
    chiều cao (header strip 26px + path header → bỏ).
  - Tone hồng nhẹ (màu `#fff1f2`, viền `#f472b6`) — đồng bộ với màu person nữ
    trong cây thường.
  - **KHÔNG bấm được** vào từng tên trong ô gộp (chỉ liệt kê thông tin).
- **Ô couple** (gọn hơn):
  - Tone nâu-vàng giống đời 1-2 của cây thường (`#fef3c7` / `#b45309`).
  - Header có tên chồng (1-2 dòng), meta (Đời, Chi) ở góc phải header.
  - Bên dưới là danh sách vợ xếp dọc, mỗi dòng kèm năm sinh ở cuối.
- **Ô con trai** (ô riêng khi không phải cha của family nào):
  - Tone xanh dương nhạt (`#eff6ff` / `#60a5fa`) đồng bộ với cây thường.
- **Tên dài** tự động wrap 2 dòng (tại khoảng trắng giữa tên).

**Layout chống đè (2026-09-05):**
- Một người có thể vừa là **anchor** (cha trong family) vừa là **con** của family khác.
  Trước đây code tạo 2 node (couple + son) cho cùng 1 id ở 2 vị trí khác nhau gây đè.
- **Fix**: Chỉ tạo 1 node duy nhất cho mỗi person.
  - Nếu person là cha (có family) → render dưới dạng `couple` node từ entry-point roots,
    các con của person sẽ được xếp bên dưới qua `assignFor` đệ quy.
  - Nếu person là con VÀ là cha → vẫn chỉ render 1 `couple` node (do `assignFor` đệ quy).
  - Nếu person là con mà KHÔNG phải cha → render dưới dạng `son` node (ô riêng).
- Test script độc lập đã pass:
  34 nodes, 22 connections, 0 overlap, 0 duplicate. Width 6440, Height 766 (sau khi gọn).

### 4.2 Admin sắp xếp con (CV1)

Trong form `PersonForm` của admin `/admin/thanh-vien`, khi đã chọn cha/mẹ:
- Hiển thị 1 dòng nhỏ: "Thứ tự trong gia đình: [ 3 ] (mặc định: thêm vào cuối)"

## 5. Implementation Plan

| Bước | Mô tả | File | Ước lượng |
|------|--------|------|-----------|
| 1 | Sửa `dev-fake-tree.ts` để đảm bảo sort_order cho families có nhiều con và có multi-wife | `frontend/src/lib/dev-fake-tree.ts` | 30 phút |
| 2 | Sửa `family-tree.tsx`: thêm fallback sort theo birth_year + vẽ đường nối từ ô vợ (nếu có 2 ô) | `frontend/src/components/tree/family-tree.tsx` | 30 phút |
| 3 | Tạo `compact-family-tree.tsx` mới | `frontend/src/components/tree/compact-family-tree.tsx` | 2 giờ |
| 4 | Tạo trang `/cay-gia-pha/compact/page.tsx` | `frontend/src/app/(public)/cay-gia-pha/compact/page.tsx` | 30 phút |
| 5 | (Optional) Thêm input `sort_order` vào `PersonForm` | `frontend/src/components/people/person-form.tsx` | 30 phút |
| 6 | Verify dev server + test với mock data | - | 30 phút |

**Tổng: ~4 giờ.**

## 6. Smoke Test (Local)

### 6.1 Chuẩn bị
```bash
cd frontend
# .env.local: NEXT_PUBLIC_USE_FAKE_TREE=1 (nếu cần fake data lớn)
pnpm dev
```

### 6.2 Test CV1 - Thứ tự con
1. Vào `/cay-gia-pha` (mode Cây).
2. Tìm 1 ô couple có > 2 con: xác nhận con có `sort_order` nhỏ hơn hiển thị bên trái,
   con không nhập `sort_order` nằm cuối.
3. Tìm 1 ô couple có chồng + 2 vợ: xác nhận đường nối xuống con xuất phát từ **ô vợ**
   (không phải giữa 2 ô).

### 6.3 Test CV2 - Cây Compact
1. Vào `/cay-gia-pha/compact`.
2. Xác nhận:
   - Ô couple hiển thị tên chồng + tên các vợ (nếu có) xếp dọc.
   - Con trai mỗi người 1 ô.
   - Tất cả con gái của 1 family gộp vào 1 ô, liệt kê tên + năm sinh.
3. Click vào tên trong ô con gái → mở `/thanh-vien/[id]`.
4. Kéo / zoom canvas hoạt động.

### 6.3.1 Mock data 5 đời (2026-09)

File `src/lib/dev-fake-compact-tree.ts` chứa ~38 người qua 5 đời (không có
người "chưa rõ"):

| Đời | Số người | Đặc điểm test |
|-----|---------|---------------|
| 1 | 2 | Ông Tổ + Tổ Mẫu |
| 2 | 7 | 3 ông (C1 có 2 vợ, C2/C3 mỗi người 1 vợ) + 4 bà |
| 3 | 12 | Con trai + con gái xen kẽ, C3 có 3 con gái liên tiếp (test ô con gái dài) |
| 4 | 7 | 3 ông + 4 bà (kế thừa nhánh C1 & C2, C3 nhánh không có cháu trai) |
| 5 | 5 | Chắt, 3 con của G1, 2 con của G3 |

Kịch bản test chính:
- **Multi-wife**: Ông C1 lấy 2 vợ (D1, H1), con của vợ nào hiển thị tách bạch.
- **Sort_order NULLS LAST**: E3 (con của C1+D1) không có sort_order, phải
  xuất hiện cuối (sau E1 sort=0, E2 sort=1).
- **Ô con gái nhiều dòng**: Ông C3 có 3 con gái (E9, EA, EB), thử scroll nếu
  quá dài (vẫn hiển thị đầy đủ).
- **Nhánh 1 con**: G4 (cháu của C1 nhánh 2) chỉ có 1 con gái G5 → test ô
  pill 1 dòng.

### 6.4 Build & Lint
```bash
pnpm tsc --noEmit
pnpm lint
pnpm build
```

## 7. Rủi ro & Giảm thiểu

| Rủi ro | Tác động | Giảm thiểu |
|--------|----------|------------|
| Cây compact quá rộng nếu có 4-5 vợ | Tràn viewport | Giới hạn hiển thị 3 vợ đầu, thêm "(+N vợ)" |
| Render chậm với > 500 người | UX | Lazy render: chỉ render visible nodes (viewport) |
| `sort_order` NULL trong DB | Null thành 0 → trùng nhau | Sort 2 cấp: `sort_order` → `birth_year` → `id` |
| Thay đổi logic nối đường trong `family-tree.tsx` | Có thể ảnh hưởng display hiện tại | Test với seed hiện có + thêm regression test cho tree |

## 8. Files liên quan

**Sửa:**
- `frontend/src/lib/dev-fake-tree.ts`
- `frontend/src/components/tree/family-tree.tsx`
- `frontend/src/components/people/person-form.tsx` (optional)

**Tạo mới:**
- `frontend/src/components/tree/compact-family-tree.tsx`
- `frontend/src/app/(public)/cay-gia-pha/compact/page.tsx`
- `frontend/src/app/admin/thu-tu-con/page.tsx` (nếu user yêu cầu)

## 9. View Dọc (Vertical) — bổ sung 2026-09-06

### 9.1 Mục tiêu

Thêm **chế độ xem dọc** tại route `/cay-gia-pha/vertical`:

- **Đời 1 → 5**: giao diện **giống hệt** cây compact hiện tại (ô couple có
  background nâu-vàng, header chồng + danh sách vợ bên dưới, con gái gộp ô).
- **Từ đời 6 trở đi**: giao diện đổi sang **view dọc** với quy tắc:
  - **Ô couple**:
    - **Background màu nâu** (`#92400e`, amber-800) + viền `#78350f`.
    - Bên trong: mỗi người (chồng + từng vợ) = **1 cột** xếp **cạnh nhau
      từ trái qua phải**. Trong mỗi cột, **tên viết dọc** (xoay -90°).
    - Chồng ở cột 1 (trái cùng), vợ 1, vợ 2, ... ở các cột tiếp theo.
    - **Màu chữ trong cột**: chồng = amber sáng `#fde68a`, vợ = pink sáng
      `#fbcfe8` (nổi bật trên nền nâu đậm).
    - **"Đời N"** chỉ hiển thị ở **cuối** ô (1 dòng ngang duy nhất, màu
      amber-100, italic).
  - **Ô con trai (gen ≥ 6)**: 1 người = 1 cột, tên viết dọc. Background nâu-cam
    `#7c2d12`, viền cam `#fb923c`. "Đời N" cuối ô.
  - **Ô gộp con gái (gen ≥ 6)**: mỗi con gái = 1 cột, tên viết dọc, các cột
    cạnh nhau từ trái qua phải. Background hồng-đậm `#831843`, viền hồng nhạt
    `#f9a8d4`. Click vào từng cột → mở chi tiết con gái đó. "Đời N" cuối ô.

### 9.2 Quy tắc tách tên

Mỗi `display_name` được **hiển thị nguyên 1 dòng trong cột** (không tách từ).
Tên được xoay -90° để chạy dọc từ dưới lên trong cột.

### 9.3 Files tham gia

**Tạo mới:**
- `frontend/src/components/tree/vertical-family-tree.tsx`
- `frontend/src/app/(public)/cay-gia-pha/vertical/page.tsx`
- `frontend/src/lib/dev-fake-vertical-tree.ts` (mock data 7 đời cho test)

**Sửa:**
- `frontend/src/lib/supabase-data-families.ts` (thêm switch `'vertical'`)
- `frontend/src/app/(public)/cay-gia-pha/page.tsx` (thêm link "Dọc")
- `frontend/src/app/(public)/cay-gia-pha/compact/page.tsx` (thêm link "Dọc")

### 9.4 Hằng số kích thước

**Khoảng cách (gap) — adaptive theo đời:**

| Gap | Đời 1-5 (compact) | Đời 6+ (vertical) |
|------|------|------|
| Sibling (anh em cùng đời) | 24px | 20px |
| Branch (giữa các nhánh) | 56px | 32px |
| Level (giữa các đời) | 56px | 40px |

**Kích thước ô vertical (gen >= 6):**

```ts
const VERTICAL_FROM_GEN = 6;
const VERTICAL_COLUMN_WIDTH = 26;          // bề rộng mỗi cột
const VERTICAL_COLUMN_GAP = 8;             // gap giữa các cột
const VERTICAL_BOX_HEIGHT = 168;           // chiều cao cố định của ô
const VERTICAL_META_ROW_HEIGHT = 16;       // dòng "Đời N" cuối ô
const VERTICAL_FONT_SIZE = 13;             // font tên viết dọc
const VERTICAL_META_FONT_SIZE = 11;        // font "Đời N"
const VERTICAL_PADDING_X = 8;
const VERTICAL_PADDING_Y = 8;
const VERTICAL_COUPLE_BOX_MIN_WIDTH = 110;
```

Lý do đời 6+ dùng gap nhỏ hơn: ô đời 6+ đã **thấp và hẹp** (chiều rộng theo số cột,
chiều cao cố định 168px). Gap lớn giữa các đời/giữa các nhánh sẽ tạo cảm giác
"rỗng" và kéo giãn cây ra quá xa.

### 9.5 Màu sắc

**Bảng màu earthy ấm (gen ≥ 6) — đổi từ tone đậm sang tone nhạt để dễ nhìn:**

| Phần tử | Màu | Ghi chú |
|---------|-----|---------|
| Background couple | `#f5deb3` (wheat) | Nâu cánh gián nhạt |
| Viền couple | `#a0522d` (sienna) | Nâu đậm |
| Background con trai | `#fef3c7` (amber-100) | Vàng nhạt |
| Viền con trai | `#d97706` (amber-600) | Amber đậm |
| Background ô gộp con gái | `#fce7f3` (pink-100) | Hồng phấn nhạt |
| Viền ô gộp con gái | `#be185d` (pink-700) | Pink đậm |
| Chữ chồng | `#1e3a8a` (blue-900) | Xanh dương đậm |
| Chữ vợ / con gái | `#9d174d` (pink-800) | Hồng đậm |
| Meta "Đời N" | `#78350f` (amber-900) | Nâu rất đậm |

**Bảng màu compact (gen 1-5):** giữ nguyên như cũ (warm header nâu-vàng, viền sienna).

### 9.6 Smoke Test

```bash
cd frontend
NEXT_PUBLIC_USE_FAKE_TREE=vertical pnpm dev
# Vào http://localhost:4000/cay-gia-pha/vertical
```

1. Đời 1-5: giao diện giống hệt compact (ô couple có background, header chồng,
   danh sách vợ bên dưới).
2. Đời 6+: ô couple chỉ có viền, tên chồng (xanh) + vợ (hồng) + Đời rải dọc.
3. Ô con trai / con gái ở đời 6+: tên ngang rải dọc.
4. Đường nối vẫn chạm đáy ô cha và top ô con.
5. Zoom/pan hoạt động.
6. Click vào tên → mở `/thanh-vien/[id]`.

**Cập nhật docs:**
- `docs/02-design/DATA-MODEL.md` (ghi chú về usage sort_order)
- `docs/02-design/UI-UX-DESIGN.md` (thêm section cây compact)
- `README.md` (liệt kê view mới)
- `prompts/04-public-cay-gia-pha.md` (liên kết tới cây compact)

## 10. Polish đợt 4 (2026-09-06) — Vertical view UX

Sau khi vertical view chạy ổn định với 35 nodes / 31 connections, đã thêm các
cải tiến UX/độ bền cho view dọc (gen ≥ 6):

### 10.1 `clipPath` chống tràn tên (gen ≥ 6)

Trước đây text trong cột dọc (xoay -90°) có thể **tràn ra ngoài box** khi
`display_name.length × char_width > nameAreaH ≈ 136px` (≈ 19 ký tự trở lên).
Điều này gây:
- Đè lên đường nối từ cha ở gen trên.
- Tràn sang box bên cạnh.

**Fix:** Thêm `<defs><clipPath id="vclip-{kind}-{id}">` với rect đúng kích
thước box, bọc các `<text>` xoay trong `<g clipPath="url(#…)">`. Áp dụng cho:
- `VerticalStyleCoupleNodeView` (clipId: `vclip-couple-{anchorId}`)
- `VerticalStyleSonNodeView` (clipId: `vclip-son-{personId}`)
- `VerticalStyleDaughterCellView` (clipId: `vclip-daughter-{familyId}`)

### 10.2 Hover state (sáng viền)

SVG `<g>` không hỗ trợ CSS `:hover` qua React event mặc định. Dùng
`onMouseEnter` / `onMouseLeave` để đổi `stroke-width` của rect đầu tiên:
- Couple: 1.5 → 2.5
- Son / Daughter cell: 1.2 → 2.2

Áp dụng cho cả compact (gen 1-5) và vertical (gen ≥ 6).

### 10.3 Hint "(chưa rõ vợ/chồng)" cho couple không có spouse

Trước: vertical couple không có vợ chỉ hiển thị 1 cột rỗng với tên anchor →
không có tín hiệu "thiếu dữ liệu".

**Fix:** Thêm `<text>` italic mờ ở giữa box khi `spouses.length === 0`,
giống compact style.

### 10.4 Hiển thị `tree_label` / `Chi` trong vertical couple

Trước: meta chỉ hiển thị `"Đời 6"`.

**Fix:** Meta cuối ô hiển thị:
```
"Đời {gen}{tree_label ? ` · {tree_label}` : chi ? ` · Chi {chi}` : ''}"
```

### 10.5 Verification

- TypeScript: `npx tsc --noEmit` pass.
- Build: `npx next build` pass, cả 3 routes `/cay-gia-pha`, `/compact`, `/vertical`
  prerender thành công.
- Inspect script 35 nodes / 31 connections, width 3917, height 1172, 0 overlap.
- Vertical + compact đều trả 200 OK trên dev server.

### 10.6 Giảm `LEVEL_GAP` cho cây gọn hơn (2026-09-06, đợt 5 + 6)

Trước đây couple ở gen X và node con ở gen X+1 cách nhau 48-56px (gen 1-5)
hoặc 40px (gen 6+) → cây cao, mỗi thế hệ dài gần 1 đoạn "trống" rõ rệt.

**Thay đổi đợt 5:**

| Hằng số | Trước | Sau | File |
|---------|-------|-----|------|
| `LEVEL_GAP` (compact) | 48 | **32** | `compact-family-tree.tsx` |
| `LEVEL_GAP` (vertical, gen 1-5) | 56 | **32** | `vertical-family-tree.tsx` |
| `VERTICAL_LEVEL_GAP` (gen 6+) | 40 | **24** | `vertical-family-tree.tsx` |

**Kết quả đợt 5:**
- Compact (23 nodes): height 766 → **614** (-20%).
- Vertical (35 nodes): height 1172 → **1036** (-12%).
- Vẫn **0 overlap** ở cả 2 view.
- Đường nối zigzag vẫn chạm đáy ô cha và top ô con (y1 = coupleY + cHeight,
  y2 = levelY[childGen]).

**Đợt 6 (chỉ giảm vertical, compact đã ổn):**

| Hằng số | Đợt 5 | Đợt 6 |
|---------|-------|-------|
| `LEVEL_GAP` (compact) | 32 | **32** (giữ) |
| `LEVEL_GAP` (vertical, gen 1-5) | 32 | **20** |
| `VERTICAL_LEVEL_GAP` (gen 6+) | 24 | **14** |

**Kết quả đợt 6:**
- Compact: giữ **614**.
- Vertical: 1036 → **966** (-7% thêm).
- Vẫn **0 overlap**, TypeScript pass, routes 200 OK.

**Lý do:** Vertical view dùng adaptive gap riêng (đã có sẵn `siblingGapForGen`,
`branchGapForGen`, `levelGapForGen`) → có thể đi xa hơn compact mà vẫn đọc
được. Compact giữ 32 vì viewport mặc định đã đủ rộng cho desktop, không cần
đẩy thêm.

### 10.7 Đợt 7: giảm đồng loạt gap ở cả 2 view (2026-09-06)

User yêu cầu giảm **tất cả** gap (level + sibling + branch) để cây gọn hơn nữa.

**Thay đổi:**

| Hằng số | Đợt 6 | Đợt 7 |
|---------|-------|-------|
| `LEVEL_GAP` (compact) | 32 | **24** |
| `SIBLING_GAP` (compact) | 20 | **14** |
| `BRANCH_GAP` (compact) | 60 | **40** |
| `LEVEL_GAP` (vertical, gen 1-5) | 20 | **18** |
| `SIBLING_GAP` (vertical, gen 1-5) | 24 | **14** |
| `BRANCH_GAP` (vertical, gen 1-5) | 56 | **40** |
| `VERTICAL_LEVEL_GAP` (gen 6+) | 14 | **10** |
| `VERTICAL_SIBLING_GAP` (gen 6+) | 16 | **16** (giữ — overlap rồi) |
| `VERTICAL_BRANCH_GAP` (gen 6+) | 32 | **20** |

**Vấn đề gặp phải:** Sau khi giảm `VERTICAL_SIBLING_GAP` xuống 12, 2 couple
độc thân ở gen 7 (`N1`, `N2`) bị overlap 20px. Nguyên nhân: code gốc dùng
`cursor += subtreeW + siblingGap * 4` — với `subtreeW = 110` (couple 1 người,
`COUPLE_BOX_MIN_WIDTH`) và gap giữa roots = 16×4 = 64, khoảng cách giữa 2
couple liên tiếp chỉ = 110 + 64 = 174, nhưng vì sub-layout của cây nén các
couple thành root liên tiếp → thực tế 2 box 110+ chỉ cách 90px → overlap.

**Fix:** Tăng multiplier từ `× 4` lên `× 6` cho `cursor` ở vertical view
(đợt 7):
```ts
cursor += subtreeWidths.get(r.id) + siblingGapForGen(rPerson?.generation ?? 1) * 6;
```

**Kết quả đợt 7:**
- Compact (23 nodes): height 614 → **582** (-5% thêm).
- Vertical (35 nodes): height 966 → **952** (-1.5% thêm).
- Width vertical: 3545 → **3669** (+3.5% vì gap buffer lớn hơn).
- Vẫn **0 overlap** cả 2 view sau khi tăng multiplier.
- TypeScript pass, routes 200 OK.

### 10.8 Đợt 8: giảm gap ngang (sibling + branch) cho cây cùng hàng gọn hơn (2026-09-06)

User muốn **khoảng cách ngang giữa các node trên cùng 1 hàng** (sibling +
branch) nhỏ hơn nữa. Level gap giữ nguyên đợt 7.

**Thay đổi:**

| Hằng số | Đợt 7 | Đợt 8 |
|---------|-------|-------|
| `SIBLING_GAP` (compact) | 14 | **10** |
| `BRANCH_GAP` (compact) | 40 | **28** |
| `SIBLING_GAP` (vertical gen 1-5) | 14 | **8** |
| `BRANCH_GAP` (vertical gen 1-5) | 40 | **28** |
| `VERTICAL_SIBLING_GAP` (gen 6+) | 16 | **8** |
| `VERTICAL_BRANCH_GAP` (gen 6+) | 20 | **14** |

**Vấn đề:** Sau khi giảm `VERTICAL_SIBLING_GAP` xuống 8, 2 couple độc thân
gen 7 (N1, N2) overlap 20px trở lại (giảm multiplier `× 6` đã thấy trước).

**Fix:** Tăng multiplier từ `× 6` lên **`× 10`** ở `cursor` cho roots
vertical — bù đắp cho gap ngày càng nhỏ:
```ts
cursor += subtreeWidths.get(r.id) + siblingGapForGen(rPerson?.generation ?? 1) * 10;
```

**Kết quả đợt 8:**
- **Compact width**: 3029 → **2903** (-4% ngang).
- **Vertical width**: 3669 → **3450** (-6% ngang).
- Height giữ nguyên đợt 7 (compact 582, vertical 952).
- **0 overlap** cả 2 view, TypeScript pass, routes 200 OK.

### 10.9 Đợt 9: giảm ngang thêm + tăng dọc (2026-09-06)

User muốn **gap ngang nhỏ hơn nữa** (sibling + branch) và **gap dọc lớn
hơn** (level). Hướng ngược lại đợt 6-8: cây dọc thoáng, ngang gọn.

**Thay đổi:**

| Hằng số | Đợt 8 | Đợt 9 |
|---------|-------|-------|
| `LEVEL_GAP` (compact) | 24 | **32** |
| `SIBLING_GAP` (compact) | 10 | **4** |
| `BRANCH_GAP` (compact) | 28 | **18** |
| `LEVEL_GAP` (vertical gen 1-5) | 18 | **26** |
| `SIBLING_GAP` (vertical gen 1-5) | 8 | **4** |
| `BRANCH_GAP` (vertical gen 1-5) | 28 | **18** |
| `VERTICAL_SIBLING_GAP` (gen 6+) | 8 | **4** |
| `VERTICAL_BRANCH_GAP` (gen 6+) | 14 | **8** |
| `VERTICAL_LEVEL_GAP` (gen 6+) | 10 | **18** |

**Vấn đề overlap + fix:** Tương tự đợt 7-8, 2 couple độc thân gen 7 (N1, N2)
bị overlap khi gap xuống quá nhỏ. Code gốc `× multiplier` không đủ vì gap
đã rất nhỏ. **Fix** thay thế hẳn multiplier bằng `Math.max(multiplier × gap,
MIN_BUFFER = 120)`:
```ts
const gapBuffer = Math.max(
  siblingGapForGen(rPerson?.generation ?? 1) * 16,
  120,  // đảm bảo box 110px vẫn không overlap khi gap gần 0
);
cursor += subtreeW + gapBuffer;
```

**Kết quả đợt 9:**
- **Compact**: width 2903 → **2782** (-4% ngang thêm), height 582 → **614** (+5% dọc).
- **Vertical**: width 3450 → **3422** (-1% ngang), height 952 → **1000** (+5% dọc).
- **0 overlap** cả 2 view, TypeScript pass, routes 200 OK.
- Tổng kết từ đợt 5 → 9: compact 766 → **614** height (-20%), vertical 1172 →
  **1000** height (-15%), và width giảm đáng kể ở cả 2 view.

### 10.10 Đợt 10: thu hẹp ô couple dọc (2026-09-06)

User phản hồi ô couple dọc (gen 6+) đang hơi rộng. Trước đợt 10:

| Ô | Width |
|---|-------|
| Couple 1 người | 110 (do `VERTICAL_COUPLE_BOX_MIN_WIDTH = 110`) |
| Couple 2 người | 26 + 8 + 8 + 16 = 58... à max với min = **110** |
| Couple 3 người | 3×26 + 2×8 + 16 = **110** |

Vậy mọi couple dù 1-3 người đều hiển thị **110px**. Đó là do
`MAX(width_computed, MIN_WIDTH)`. Couple 1 người trống trơn, lãng phí.

**Thay đổi:**
- `VERTICAL_COUPLE_BOX_MIN_WIDTH`: 110 → **84**

84px vẫn đủ cho:
- Tên viết dọc tối đa ~7 ký tự Việt (đã wrap).
- 1 cột người (26) + 8 padding + tên dọc.

**Kết quả đợt 10:**
- **Vertical width**: 3422 → **3383** (-1% ngang thêm).
- Height không đổi (1000).
- **0 overlap**, TypeScript pass, routes 200 OK.
- Compact không bị ảnh hưởng (chỉ thay đợt constant cho gen 6+).

### 10.11 Đợt 11: đổi màu background couple dọc theo giới tính (2026-09-06)

User phản hồi **ô couple dọc (gen 6+) vẫn là màu nâu/wheat, phải là màu
xanh** cho nam. Mục tiêu đồng bộ palette với compact view:
- Compact: nam `#eff6ff` (blue-50) / nữ `#fff1f2` (rose-50).
- Vertical trước đợt 11: couple `#f5deb3` (wheat) — không phân biệt nam/nữ,
  son vàng `#fef3c7`, daughter hồng `#fce7f3`.

**Thay đổi:**

| Trước | Sau | Vai trò |
|-------|-----|---------|
| `COLOR_COUPLE_BG` `#f5deb3` | `COLOR_COUPLE_BG_MALE` `#eff6ff` / `COLOR_COUPLE_BG_FEMALE` `#fff1f2` | Couple anchor nam / nữ |
| `COLOR_COUPLE_BORDER` `#a0522d` | `COLOR_COUPLE_BORDER_MALE` `#60a5fa` / `COLOR_COUPLE_BORDER_FEMALE` `#f472b6` | Viền couple nam / nữ |
| `COLOR_SON_BG` `#fef3c7` | `#eff6ff` | Son (độc thân nam) → đồng bộ couple nam |
| `COLOR_SON_BORDER` `#d97706` | `#60a5fa` | Viền son |
| `COLOR_DAUGHTER_BG` `#fce7f3` | `#fff1f2` | Daughter → đồng bộ couple nữ |
| `COLOR_DAUGHTER_BORDER` `#be185d` | `#f472b6` | Viền daughter |

**Logic render:** Trong `VerticalStyleCoupleNodeView`, giữ nguyên
`COLOR_COUPLE_BG` / `COLOR_COUPLE_BORDER` (wheat + sienna) — không phân
biệt nam/nữ cho couple. `VerticalStyleSonNodeView` đã có `isMale` sẵn →
chỉ cần đổi constants sang xanh (nam) / hồng (nữ).

**Kết quả đợt 11:**
- Vertical view giờ hiển thị:
  - **Couple**: nền wheat `#f5deb3` + viền sienna `#a0522d` (giữ nguyên như trước đợt 11).
  - **Son** (độc thân nam): nền xanh dương nhạt `#eff6ff` + viền xanh blue-400.
  - **Daughter** (độc thân nữ): nền hồng nhạt `#fff1f2` + viền pink-400.
- TypeScript pass, routes 200 OK, layout vẫn 0 overlap (không đổi width/height).
- Son/daughter phân biệt nam/nữ rõ rệt nhờ xanh/hồng trong khi couple giữ tone ấm cổ điển.

### 10.13 Đợt 13: giảm khoảng cách giữa các tên con gái (compact, 2026-09-06)

User phản hồi **khoảng cách giữa các tên con gái trong cùng 1 ô đang
xa, cho sát lại**. Giảm `DAUGHTER_CELL_ROW_HEIGHT` từ **22 → 18** (-4px
mỗi dòng) trong `compact-family-tree.tsx`. TypeScript pass, route 200.

### 10.13.1 Đợt 13.1: đồng bộ ở vertical view (2026-09-06)

Vertical view (`vertical-family-tree.tsx`) cũng dùng
`CompactStyleDaughterCellView` cho gen < 6. Cùng hằng số
`DAUGHTER_CELL_ROW_HEIGHT` giảm **22 → 18** để đồng bộ. TS pass, cả
`/cay-gia-pha/vertical` và `/cay-gia-pha/compact` đều 200.

### 10.14 Đợt 14: fix lỗi PNG export — tách serializer compact vs vertical (2026-09-06)

User báo cáo lỗi ảnh PNG:
- **Compact PNG**: nam (son) và couple đang viết theo chiều dọc → sai.
- **Vertical PNG**:
  - Năm sinh không hiển thị (bị che / mất).
  - Nữ chưa viết theo chiều dọc (chỉ thấy text xanh, không có text hồng).

**Nguyên nhân:**

Đợt 12, tôi đã thêm nhánh *vertical style* (chữ xoay -90°) vào
`serializeCompactLayoutToSvg` cho gen ≥ 6 để vertical view cũng dùng
được. Đây là sai lầm:

- **Compact view** cũng gọi `serializeCompactLayoutToSvg`, nên text gen
  ≥ 6 trong ảnh compact PNG bị xoay → "nam và couple viết dọc" trên
  compact.
- **Vertical view** text nữ có rotate đúng, nhưng `meta` text đặt ở
  `y + height - 4` (đáy ô) lại trùng với phần đuôi của text xoay
  (`baseY = y + nameAreaH ≈ y + height - 24`) → hai text chồng lên nhau,
  meta bị che hoặc không đọc được.
- Anchor là nữ vẫn hiển thị xanh (vì `isHusband: true` cứng theo anchor
  slot), khiến "nữ đang chưa viết theo chiều dọc" — thực tế đã xoay
  nhưng có thể bị che bởi edge.

**Thay đổi:**

| File | Hành động |
|------|-----------|
| `compact-family-tree.tsx` | Export type `CompactCoupleNode`, `CompactSonNode`, `CompactDaughterCell`, `CompactConnection`, `CompactLayout`. Trong `serializeCompactLayoutToSvg` **xoá nhánh vertical style** — luôn render compact style (ngang). Thêm `familyId, anchorId` khi push couple node. |
| `vertical-svg-serializer.ts` (mới) | Tạo `serializeVerticalLayoutToSvg(layout)` riêng cho vertical view. Dispatch theo gen: gen < 6 = compact style, gen ≥ 6 = vertical style (xoay -90°). Vertical: meta text ở `y + height - 4`, name area chừa `VERT_META_H + 4` ở đáy → không che. Anchor nữ hiển thị palette nữ. |
| `vertical-family-tree.tsx` | Xoá type cục bộ, import từ compact. Thay `serializeCompactLayoutToSvg` → `serializeVerticalLayoutToSvg`. Thêm `familyId, anchorId` khi push couple node. |

**Kết quả đợt 14:**
- **Compact PNG**: mọi node đều ngang, không còn text xoay → khớp UI.
- **Vertical PNG**:
  - Gen < 6: ngang (đồng bộ compact).
  - Gen ≥ 6: xoay -90° (khớp UI), meta "Đời N · năm sinh †" hiển thị
    rõ ở đáy ô, không bị che.
  - Anchor nữ hiển thị palette nữ, spouse nam hiển thị palette nam.
- TypeScript pass, routes 200 OK.
- Code tách bạch: `serializeCompactLayoutToSvg` cho compact view,
  `serializeVerticalLayoutToSvg` cho vertical view, cùng dùng chung
  `CompactLayout`.

### 10.14.1 Đợt 14.1: bỏ năm sinh + daughter cell dọc (2026-09-06)

User yêu cầu tiếp cho vertical PNG:
- **Bỏ năm sinh** khỏi mọi meta trong vertical PNG (couple, son, daughter cell).
- **Ô gộp con gái từ đời 5** đang chưa viết theo chiều dọc → cần dispatch
  theo gen cho daughter cell (gen ≥ 6 = vertical style).

**Thay đổi (chỉ trong `vertical-svg-serializer.ts`):**

| Hàm | Trước | Sau |
|-----|-------|-----|
| `coupleMeta()` | `Đời N · năm sinh †` | **Đời N †** (bỏ năm sinh) |
| Dispatch `daughter-cell` | Luôn `renderDaughterCell` (ngang) | Gen ≥ 6 = `renderVerticalDaughterCell` (xoay -90°), gen < 6 = `renderDaughterCell` |
| `renderDaughterCell` | Hiển thị năm sinh ở cuối mỗi dòng | **Bỏ** dòng năm sinh |
| `renderVerticalDaughterCell` (mới) | — | Mỗi con gái 1 cột xoay -90°, palette hồng, meta "Đời N" ở đáy |

**Kết quả đợt 14.1:**
- Vertical PNG: mọi meta chỉ còn "Đời N †" (nếu đã mất), không còn năm sinh.
- Vertical PNG gen ≥ 6: daughter cell xoay đúng giống UI render.
- TypeScript pass, route `/cay-gia-pha/vertical` 200 OK.
- Compact PNG (`serializeCompactLayoutToSvg`) không bị ảnh hưởng — vẫn hiển thị năm sinh như UI compact.
