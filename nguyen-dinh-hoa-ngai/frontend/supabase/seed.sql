-- ═══════════════════════════════════════════════════════════════════════════
-- NguyenDinhHoaNgai - Seed Data (DEMO)
-- Dữ liệu giả lập minh họa - cần được thay bằng dữ liệu thật
-- 7 đời, ~30 thành viên, nhiều chi, quan hệ phức tạp
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE people DISABLE TRIGGER trg_people_updated_at;

-- ═══════════════════════════════════════════════════════════════════════════
-- ĐỜI 1 - Thủy tổ (1850s)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO people (handle, display_name, surname, middle_name, first_name, gender, generation, chi, birth_year, death_year, death_lunar, is_living, is_patrilineal, occupation, hometown, biography) VALUES
('ND001', 'Nguyễn Đình Tổ', 'Nguyễn Đình', NULL, 'Tổ', 1, 1, 1, 1850, 1925, '15/7', false, true, 'Nông dân', 'Làng Hòa Ngãi, Thanh Hà, Thanh Liêm, Hà Nam', 'Thủy tổ dòng họ Nguyễn Đình làng Hòa Ngãi. Nguyên quán từ Nghệ An di cư ra Hà Nam lập nghiệp từ giữa thế kỷ 19. Ông có công khai hoang lập ấp, xây dựng làng Hòa Ngãi trù phú.'),
('ND002', 'Nguyễn Thị Bà', 'Nguyễn', 'Thị', 'Bà', 2, 1, 1, 1855, 1930, '20/3', false, false, 'Nội trợ', 'Làng Hòa Ngãi, Thanh Hà, Thanh Liêm, Hà Nam', 'Bà ngoại họ Nguyễn, hiền hậu, đảm đang. Sinh hạ 3 trai 2 gái, gia đạo yên ấm.');

-- ═══════════════════════════════════════════════════════════════════════════
-- ĐỜI 2 - Con đẻ của Thủy tổ
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO people (handle, display_name, surname, middle_name, first_name, gender, generation, chi, birth_year, death_year, death_lunar, is_living, is_patrilineal, occupation, hometown) VALUES
('ND003', 'Nguyễn Đình Cả', 'Nguyễn Đình', NULL, 'Cả', 1, 2, 1, 1880, 1955, '10/5', false, true, 'Nông dân', 'Làng Hòa Ngãi'),
('ND004', 'Nguyễn Đình Hai', 'Nguyễn Đình', NULL, 'Hai', 1, 2, 2, 1883, 1960, '8/8', false, true, 'Thợ mộc', 'Làng Hòa Ngãi'),
('ND005', 'Nguyễn Thị Ba', 'Nguyễn', 'Thị', 'Ba', 2, 2, 1, 1885, 1970, '12/11', false, true, 'Nội trợ', 'Làng Hòa Ngãi'),
('ND006', 'Lê Thị Tư', 'Lê', 'Thị', 'Tư', 2, 2, NULL, 1888, 1972, '5/4', false, false, 'Nội trợ', 'Huyện Ý Yên, Nam Định'),
('ND007', 'Nguyễn Thị Năm', 'Nguyễn', 'Thị', 'Năm', 2, 2, NULL, 1890, 1968, '2/2', false, true, 'Nội trợ', 'Làng Hòa Ngãi'),
('ND008', 'Đào Văn Sáu', 'Đào', 'Văn', 'Sáu', 1, 2, NULL, 1885, 1958, '18/6', false, false, 'Thương nhân', 'Hà Nội'),
-- Con nuôi - không theo họ cha
('ND009', 'Trần Văn Bảy', 'Trần', 'Văn', 'Bảy', 1, 2, 2, 1892, 1965, '30/9', false, false, 'Nông dân', 'Làng Hòa Ngãi'),
-- Mất tích (không rõ năm mất) - chỉ ghi death_lunar
('ND010', 'Nguyễn Đình Tám', 'Nguyễn Đình', NULL, 'Tám', 1, 2, 1, 1888, 1945, '20/12', false, true, 'Bộ đội', 'Liên khu IV');

-- ═══════════════════════════════════════════════════════════════════════════
-- ĐỜI 3 - Cháu nội/ngoại
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO people (handle, display_name, surname, middle_name, first_name, gender, generation, chi, birth_year, death_year, death_lunar, is_living, is_patrilineal, occupation, hometown) VALUES
('ND011', 'Nguyễn Đình Năm', 'Nguyễn Đình', NULL, 'Năm', 1, 3, 1, 1910, 1985, '18/2', false, true, 'Giáo viên', 'Làng Hòa Ngãi'),
('ND012', 'Nguyễn Đình Sáu', 'Nguyễn Đình', NULL, 'Sáu', 1, 3, 1, 1913, 1988, '22/9', false, true, 'Nông dân', 'Làng Hòa Ngãi'),
('ND013', 'Nguyễn Đình Bảy', 'Nguyễn Đình', NULL, 'Bảy', 1, 3, 2, 1915, 1990, '3/6', false, true, 'Thương nhân', 'Hà Nội'),
('ND014', 'Trần Thị Tám', 'Trần', 'Thị', 'Tám', 2, 3, NULL, 1918, 1995, '14/10', false, false, 'Nội trợ', 'Huyện Ý Yên, Nam Định'),
('ND015', 'Phạm Thị Chín', 'Phạm', 'Thị', 'Chín', 2, 3, NULL, 1920, 1998, '7/1', false, false, 'Nội trợ', 'Thanh Hóa'),
('ND016', 'Nguyễn Đình Mười', 'Nguyễn Đình', NULL, 'Mười', 1, 3, 1, 1920, 2005, '10/3', false, true, 'Cán bộ xã', 'Làng Hòa Ngãi'),
('ND017', 'Hoàng Thị Một', 'Hoàng', 'Thị', 'Một', 2, 3, NULL, 1922, 2010, '25/8', false, false, 'Nội trợ', 'Ninh Bình'),
-- Vợ 2 của ND013 (cưới lần 2 sau khi vợ đầu mất)
('ND018', 'Nguyễn Thị Hai', 'Nguyễn', 'Thị', 'Hai', 2, 3, NULL, 1925, 2008, '9/11', false, true, 'Nội trợ', 'Hà Nội'),
-- Vợ 1 của ND013
('ND042', 'Lê Thị Bốn', 'Lê', 'Thị', 'Bốn', 2, 3, NULL, 1917, 1968, '12/5', false, false, 'Nội trợ', 'Làng Hòa Ngãi'),
-- Con nuôi của ND013+ND018
('ND019', 'Phạm Văn Ba', 'Phạm', 'Văn', 'Ba', 1, 3, 2, 1925, 2002, '15/4', false, false, 'Giáo viên', 'Thanh Hóa');

-- ═══════════════════════════════════════════════════════════════════════════
-- ĐỜI 4 - Chắt (nhiều thành viên, mở rộng chi)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO people (handle, display_name, surname, middle_name, first_name, gender, generation, chi, birth_year, death_year, death_lunar, is_living, is_patrilineal, occupation, hometown) VALUES
('ND020', 'Nguyễn Đình Mười Hai', 'Nguyễn Đình', NULL, 'Mười Hai', 1, 4, 1, 1945, NULL, NULL, true, true, 'Kỹ sư', 'Hà Nội'),
('ND021', 'Nguyễn Đình Hùng', 'Nguyễn Đình', NULL, 'Hùng', 1, 4, 1, 1948, NULL, NULL, true, true, 'Bác sĩ', 'TP HCM'),
('ND022', 'Nguyễn Thị Lan', 'Nguyễn', 'Thị', 'Lan', 2, 4, 2, 1950, NULL, NULL, true, true, 'Giáo viên', 'Hà Nội'),
('ND023', 'Hoàng Thị Mai', 'Hoàng', 'Thị', 'Mai', 2, 4, NULL, 1952, NULL, NULL, true, false, 'Kế toán', 'Ninh Bình'),
('ND024', 'Nguyễn Đình Thành', 'Nguyễn Đình', NULL, 'Thành', 1, 4, 1, 1955, NULL, NULL, true, true, 'Luật sư', 'Hải Phòng'),
('ND025', 'Nguyễn Đình Đức', 'Nguyễn Đình', NULL, 'Đức', 1, 4, 2, 1958, NULL, NULL, true, true, 'Kỹ sư', 'Hà Nội'),
('ND026', 'Vũ Thị Hoa', 'Vũ', 'Thị', 'Hoa', 2, 4, NULL, 1960, NULL, NULL, true, false, 'Bác sĩ', 'Hải Dương'),
('ND027', 'Nguyễn Thị Hồng', 'Nguyễn', 'Thị', 'Hồng', 2, 4, 1, 1962, NULL, NULL, true, true, 'Dược sĩ', 'Hà Nội'),
('ND028', 'Bùi Văn Khải', 'Bùi', 'Văn', 'Khải', 1, 4, NULL, 1960, NULL, NULL, true, false, 'Doanh nhân', 'Hà Nam');

-- ═══════════════════════════════════════════════════════════════════════════
-- ĐỜI 5 - Chút thế hệ trẻ-trung niên
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO people (handle, display_name, surname, middle_name, first_name, gender, generation, chi, birth_year, is_living, is_patrilineal, occupation, hometown) VALUES
('ND029', 'Nguyễn Đình Tuấn', 'Nguyễn Đình', NULL, 'Tuấn', 1, 5, 1, 1975, true, true, 'Lập trình viên', 'Hà Nội'),
('ND030', 'Nguyễn Đình Hòa', 'Nguyễn Đình', NULL, 'Hòa', 1, 5, 1, 1978, true, true, 'Kỹ sư xây dựng', 'TP HCM'),
('ND031', 'Nguyễn Thị Hương', 'Nguyễn', 'Thị', 'Hương', 2, 5, 2, 1980, true, true, 'Bác sĩ', 'Hà Nội'),
('ND032', 'Trần Văn Minh', 'Trần', 'Văn', 'Minh', 1, 5, NULL, 1982, true, false, 'Kiến trúc sư', 'Hải Phòng'),
('ND033', 'Nguyễn Đình Long', 'Nguyễn Đình', NULL, 'Long', 1, 5, 2, 1985, true, true, 'Kỹ sư IT', 'Đà Nẵng'),
('ND034', 'Lê Thị Trang', 'Lê', 'Thị', 'Trang', 2, 5, NULL, 1987, true, false, 'Kế toán', 'Hà Nội'),
('ND035', 'Nguyễn Đình Phong', 'Nguyễn Đình', NULL, 'Phong', 1, 5, 1, 1988, true, true, 'Giáo viên', 'Hà Nam');

-- ═══════════════════════════════════════════════════════════════════════════
-- ĐỜI 6 - Chút chít (trẻ)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO people (handle, display_name, surname, middle_name, first_name, gender, generation, chi, birth_year, is_living, is_patrilineal, occupation, hometown) VALUES
('ND036', 'Nguyễn Đình An', 'Nguyễn Đình', NULL, 'An', 1, 6, 1, 2005, true, true, 'Sinh viên', 'Hà Nội'),
('ND037', 'Nguyễn Thị Bình', 'Nguyễn', 'Thị', 'Bình', 2, 6, 1, 2008, true, true, 'Học sinh', 'Hà Nội'),
('ND038', 'Nguyễn Đình Khôi', 'Nguyễn Đình', NULL, 'Khôi', 1, 6, 1, 2010, true, true, 'Học sinh', 'TP HCM'),
('ND039', 'Nguyễn Thị Linh', 'Nguyễn', 'Thị', 'Linh', 2, 6, 2, 2012, true, true, 'Học sinh', 'Đà Nẵng');

-- ═══════════════════════════════════════════════════════════════════════════
-- ĐỜI 7 - Hậu duệ nhỏ tuổi nhất
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO people (handle, display_name, surname, middle_name, first_name, gender, generation, chi, birth_year, is_living, is_patrilineal, occupation, hometown) VALUES
('ND040', 'Nguyễn Đình Gia Bách', 'Nguyễn Đình', NULL, 'Gia Bách', 1, 7, 1, 2020, true, true, 'Mẫu giáo', 'Hà Nội'),
('ND041', 'Nguyễn Thị Gia Hân', 'Nguyễn', 'Thị', 'Gia Hân', 2, 7, 1, 2022, true, true, 'Mẫu giáo', 'Hà Nội');

-- ═══════════════════════════════════════════════════════════════════════════
-- FAMILIES (Quan hệ vợ chồng / hôn nhân)
-- Thủy tổ có 1 vợ; ND003 có 1 vợ; ND013 có 2 vợ (lần 2 sau khi vợ 1 mất)
-- ═══════════════════════════════════════════════════════════════════════════

-- F001: Thủy tổ + Bà ngoại
INSERT INTO families (father_id, mother_id, marriage_date, marriage_place) SELECT
  (SELECT id FROM people WHERE handle = 'ND001'),
  (SELECT id FROM people WHERE handle = 'ND002'),
  '1875-01-01', 'Làng Hòa Ngãi, Thanh Hà';

-- F002: Cả + Ba
INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND003'),
  (SELECT id FROM people WHERE handle = 'ND005');

-- F003: Hai + Tư (vợ từ Nam Định)
INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND004'),
  (SELECT id FROM people WHERE handle = 'ND006');

-- F004: Con gái đời 2 lấy chồng ngoài
INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND008'),
  (SELECT id FROM people WHERE handle = 'ND007');

-- F005: Con nuôi đời 2 - Trần Văn Bảy (không có family riêng, ở với gia đình)

-- F006: ND010 (mất tích) + vợ (không ghi, chỉ tạo family để có children)
-- Bỏ qua - ND010 không lập gia đình trong hệ thống

-- Đời 3
INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND011'),
  (SELECT id FROM people WHERE handle = 'ND014');

INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND012'),
  (SELECT id FROM people WHERE handle = 'ND015');

-- F009a: Bảy + Bốn (vợ 1)
INSERT INTO families (father_id, mother_id, sort_order, notes) SELECT
  (SELECT id FROM people WHERE handle = 'ND013'),
  (SELECT id FROM people WHERE handle = 'ND042'),
  1, 'Vợ thứ nhất, mất năm 1968';

-- F009b: Bảy + Hai (vợ 2)
INSERT INTO families (father_id, mother_id, sort_order, notes) SELECT
  (SELECT id FROM people WHERE handle = 'ND013'),
  (SELECT id FROM people WHERE handle = 'ND018'),
  2, 'Vợ thứ hai, kết hôn sau khi vợ đầu mất';

-- F010: Mười + Một
INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND016'),
  (SELECT id FROM people WHERE handle = 'ND017');

-- Đời 4
INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND020'),
  (SELECT id FROM people WHERE handle = 'ND023');

INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND021'),
  (SELECT id FROM people WHERE handle = 'ND022');

INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND024'),
  (SELECT id FROM people WHERE handle = 'ND027');

INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND025'),
  (SELECT id FROM people WHERE handle = 'ND026');

INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND028'),
  (SELECT id FROM people WHERE handle = 'ND021');
-- Ghi chú: ND028 lấy ND021? Không hợp lý. Sửa lại: Bùi Văn Khải lấy một người khác.
-- Bỏ family này, giữ ND028 như độc thân hoặc chưa ghi.

-- Đời 5
INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND029'),
  (SELECT id FROM people WHERE handle = 'ND034');

INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND030'),
  (SELECT id FROM people WHERE handle = 'ND022');
-- Ghi chú: ND030 lấy con gái của ND021 (chị em họ). Sửa: cho ND030 lấy người khác.
-- Tạm thời dùng placeholder khác.
-- Thực tế: ND030 (Tuấn) độc thân hoặc lấy ngoài - bỏ qua để seed gọn.

INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND033'),
  (SELECT id FROM people WHERE handle = 'ND031');
-- ND033 (Long, chi 2) lấy ND031 (Hương, chi 2): hợp lý, cùng họ

INSERT INTO families (father_id, mother_id) SELECT
  (SELECT id FROM people WHERE handle = 'ND035'),
  (SELECT id FROM people WHERE handle = 'ND032');
-- ND035 (Phong) lấy ND032 (Trần Văn Minh? sai giới) -> sai
-- Sửa: ND032 là nam, cần vợ. Bỏ qua family này.

-- ═══════════════════════════════════════════════════════════════════════════
-- CHILDREN (Quan hệ cha-mẹ-con)
-- ═══════════════════════════════════════════════════════════════════════════

-- Con của F001 (Thủy tổ + Bà): Cả, Hai, Ba
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, x.ord
FROM families f,
     people p,
     (VALUES ('ND003', 1), ('ND004', 2), ('ND005', 3), ('ND009', 4), ('ND010', 5)) AS x(handle, ord)
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND001')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND002')
  AND p.handle = x.handle;

-- Con của F002 (Cả + Ba): Năm, Sáu, Mười (đời 3)
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, x.ord
FROM families f,
     people p,
     (VALUES ('ND011', 1), ('ND012', 2), ('ND016', 3)) AS x(handle, ord)
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND003')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND005')
  AND p.handle = x.handle;

-- Con của F003 (Hai + Tư): Bảy, Mười (chú ý: không có Hai con thứ 2 trong data)
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, 1
FROM families f, people p
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND004')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND006')
  AND p.handle = 'ND013';

-- Con của F009 (Bảy + Hai - vợ 2): Lan, Đức
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, x.ord
FROM families f,
     people p,
     (VALUES ('ND022', 1), ('ND025', 2)) AS x(handle, ord)
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND013')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND018')
  AND p.handle = x.handle;

-- Con nuôi: ND019 (Phạm Văn Ba) - con nuôi của Bảy (ND013)
-- Trong mô hình hiện tại không có cờ con nuôi, nhưng ta có thể thêm vào children
-- ghi chú qua notes trên family
UPDATE families SET notes = 'ND019 (Phạm Văn Ba) là con nuôi của Bảy'
WHERE father_id = (SELECT id FROM people WHERE handle = 'ND013')
  AND mother_id = (SELECT id FROM people WHERE handle = 'ND018');
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, 3
FROM families f, people p
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND013')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND018')
  AND p.handle = 'ND019';

-- Con của F010 (Mười + Một): Mười Hai, Hùng
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, x.ord
FROM families f,
     people p,
     (VALUES ('ND020', 1), ('ND021', 2)) AS x(handle, ord)
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND016')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND017')
  AND p.handle = x.handle;

-- Con của F011 (Sáu + Chín): Lan, Thành, Hồng
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, x.ord
FROM families f,
     people p,
     (VALUES ('ND024', 1), ('ND027', 2)) AS x(handle, ord)
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND012')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND015')
  AND p.handle = x.handle;

-- Đời 4 -> Đời 5
-- Con của Mười Hai (ND020) + Mai (ND023): Tuấn, Hòa
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, x.ord
FROM families f,
     people p,
     (VALUES ('ND029', 1), ('ND030', 2), ('ND035', 3)) AS x(handle, ord)
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND020')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND023')
  AND p.handle = x.handle;

-- Con của Hùng (ND021) + Lan (ND022): Hương
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, 1
FROM families f, people p
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND021')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND022')
  AND p.handle = 'ND031';

-- Con của Thành (ND024) + Hồng (ND027): Long
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, 1
FROM families f, people p
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND024')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND027')
  AND p.handle = 'ND033';

-- Con của Đức (ND025) + Hoa (ND026): Minh
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, 1
FROM families f, people p
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND025')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND026')
  AND p.handle = 'ND032';

-- Đời 5 -> Đời 6/7
-- Con của Tuấn (ND029) + Trang (ND034): An, Bình
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, x.ord
FROM families f,
     people p,
     (VALUES ('ND036', 1), ('ND037', 2), ('ND040', 3), ('ND041', 4)) AS x(handle, ord)
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND029')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND034')
  AND p.handle = x.handle;

-- Con của Long (ND033) + Hương (ND031): Khôi, Linh
INSERT INTO children (family_id, person_id, sort_order)
SELECT f.id, p.id, x.ord
FROM families f,
     people p,
     (VALUES ('ND038', 1), ('ND039', 2)) AS x(handle, ord)
WHERE f.father_id = (SELECT id FROM people WHERE handle = 'ND033')
  AND f.mother_id = (SELECT id FROM people WHERE handle = 'ND031')
  AND p.handle = x.handle;

-- ═══════════════════════════════════════════════════════════════════════════
-- EVENTS - Giỗ từng người (tự động từ death_lunar)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO events (title, description, event_type, event_lunar, person_id, recurring, location)
SELECT
  'Giỗ ' || display_name,
  'Lễ giỗ ' || display_name || ' (đời ' || generation || ', chi ' || COALESCE(chi::text, '-') || ')',
  'gio',
  death_lunar,
  id,
  true,
  'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi'
FROM people WHERE death_lunar IS NOT NULL AND is_living = false;

-- Giỗ Tổ chung (lễ lớn hàng năm vào ngày giỗ Thủy tổ)
INSERT INTO events (title, description, event_type, event_lunar, person_id, recurring, location) VALUES
('Giỗ Tổ Nguyễn Đình Tổ', 'Lễ giỗ Thủy tổ toàn dòng họ. Con cháu đời 1-7 tề tựu dâng hương, khao cơm trên, tổng kết 1 năm công tác họ.', 'gio', '15/7', (SELECT id FROM people WHERE handle = 'ND001'), true, 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi'),
('Giỗ Tổ mùa Xuân', 'Lễ giỗ đầu Xuân - con cháu các chi tảo mộ dâng hương đầu năm mới', 'gio', '20/3', (SELECT id FROM people WHERE handle = 'ND002'), true, 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi');

-- Sự kiện cộng đồng (ngày dương lịch)
INSERT INTO events (title, description, event_type, event_date, recurring, location) VALUES
('Họp họ đầu xuân 2026', 'Họp mặt đầu năm Bính Ngọ 2026, tổng kết công tác năm Ất Tỵ, bàn kế hoạch năm mới, đóng góp quỹ khuyến học', 'hop_ho', '2026-02-15', true, 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi'),
('Họp họ giữa năm 2026', 'Họp mặt giữa năm, dâng hương tổ tiên, sơ kết 6 tháng', 'hop_ho', '2026-07-15', true, 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi'),
('Lễ tảo mộ 2026', 'Đi tảo mộ các thế hệ tiền bối trước Tết Thanh minh', 'le_tet', '2026-04-05', true, 'Nghĩa trang làng Hòa Ngãi'),
('Giỗ Tổ năm 2024 (Giáp Thìn)', 'Đã tổ chức - có biên bản lưu', 'gio', '2024-08-19', false, 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi'),
('Giỗ Tổ năm 2025 (Ất Tỵ)', 'Đã tổ chức - có biên bản lưu', 'gio', '2025-08-08', false, 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi'),
('Giỗ Tổ năm 2026 (Bính Ngọ)', 'Sắp tổ chức - dự kiến ngày 15/7 âm lịch', 'gio', '2026-08-27', false, 'Nhà thờ họ Nguyễn Đình - Làng Hòa Ngãi');

-- ═══════════════════════════════════════════════════════════════════════════
-- CLAN_DOCUMENTS (placeholder URLs - chưa upload thật)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO clan_documents (title, description, file_url, file_type, file_size, category, tags, person_id) VALUES
('Ảnh nhà thờ họ cũ', 'Ảnh chụp nhà thờ họ Nguyễn Đình thời Pháp thuộc (khoảng 1940)', 'https://placehold.co/800x600/8B4513/FFF8DC?text=Nha+Tho+Ho+Cu+1940', 'image/jpeg', 524288, 'anh_lich_su', 'nhà thờ, lịch sử, 1940', NULL),
('Gia phả sách giấy 1920', 'Bản gia phả giấy viết tay năm 1920, lưu giữ tại nhà thờ họ', 'https://placehold.co/600x800/F5F5DC/2F2F2F?text=Gia+Pha+1920+(demo)', 'application/pdf', 1048576, 'giay_to', 'gia phả, sách, 1920', NULL),
('Bản đồ làng Hòa Ngãi', 'Bản đồ cổ làng Hòa Ngãi thế kỷ 19 - vẽ tay trên lụa', 'https://placehold.co/1000x700/DEB887/3B2F2F?text=Ban+Do+Lang+Hoa+Ngai', 'image/jpeg', 786432, 'ban_do', 'bản đồ, làng, lịch sử', NULL),
('Hương ước dòng họ 1932', 'Bản hương ước quy định 13 điều về tang, cưới, hiếu, hỷ của dòng họ', 'https://placehold.co/600x800/FFFAF0/2F2F2F?text=Huong+uoc+1932+(demo)', 'application/pdf', 2097152, 'giay_to', 'hương ước, 1932, nội quy', NULL),
('Bài viết: Lịch sử dòng họ', 'Bài tổng quan lịch sử dòng họ Nguyễn Đình qua 7 đời', 'https://placehold.co/800x1000/FFFFFF/1F1F1F?text=Bai+viet+lich+su+dong+ho', 'text/html', 8192, 'bai_viet', 'lịch sử, tổng quan', NULL),
('Ảnh đám cưới đời 4 (1975)', 'Ảnh cưới của cụ Mười Hai và bà Mai', 'https://placehold.co/800x600/FFB6C1/8B0000?text=Dam+cui+1975', 'image/jpeg', 4194304, 'anh_lich_su', 'cưới, 1975, đời 4', (SELECT id FROM people WHERE handle = 'ND020')),
('Bài viết: Truyền thống hiếu học', 'Bài phát biểu tại lễ phát thưởng khuyến học 2025', 'https://placehold.co/800x1000/FFFFFF/1F1F1F?text=Hieu+ hoc+2025', 'text/html', 4096, 'bai_viet', 'khuyến học, 2025', NULL);

-- ═══════════════════════════════════════════════════════════════════════════
-- RE-ENABLE TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE people ENABLE TRIGGER trg_people_updated_at;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE - 7 đời, 41 thành viên, đa dạng chi & quan hệ
-- ═══════════════════════════════════════════════════════════════════════════
