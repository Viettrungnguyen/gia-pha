---
project: NguyenDinhHoaNgai
path: docs/04-build/FEATURE-COMPACT-TREE-AND-CHILD-ORDER.md
type: feature-spec
version: 1.5.0
updated: 2026-09-05
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

**Cập nhật docs:**
- `docs/02-design/DATA-MODEL.md` (ghi chú về usage sort_order)
- `docs/02-design/UI-UX-DESIGN.md` (thêm section cây compact)
- `README.md` (liệt kê view mới)
- `prompts/04-public-cay-gia-pha.md` (liên kết tới cây compact)
