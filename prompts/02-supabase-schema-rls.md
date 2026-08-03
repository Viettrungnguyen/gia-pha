---
project: NguyenDinhHoaNgai
path: prompts/02-supabase-schema-rls.md
type: prompt
version: 1.0.0
updated: 2026-07-23
---

# 02 - Supabase Schema, RLS và Seed

## 1. Mục tiêu

Tạo database schema cho 6 bảng, RLS policies, storage buckets, và seed data demo Nguyễn Đình.

## 2. Tiêu chí hoàn thành

- [ ] File `frontend/supabase/migrations/20260723000000_initial_schema.sql` chạy không lỗi.
- [ ] 6 bảng được tạo: `profiles`, `people`, `families`, `children`, `events`, `clan_documents`.
- [ ] RLS enabled và policies đúng (anon SELECT, admin write).
- [ ] 2 Storage buckets: `media`, `clan-documents`.
- [ ] File `frontend/supabase/seed.sql` insert thành công ~18 thành viên demo.
- [ ] Verify: anon key đọc được, INSERT bị deny.

## 3. File cần tạo

```
frontend/supabase/
├── migrations/
│   └── 20260723000000_initial_schema.sql
└── seed.sql
```

## 4. Phụ thuộc

- Đã tạo Supabase project Singapore (xem [VERCEL-SUPABASE-DEPLOY.md §3](../docs/04-build/VERCEL-SUPABASE-DEPLOY.md)).
- Đã lấy `anon` key.

## 5. Bước thực hiện

### Bước 1: Tạo file migration

File `frontend/supabase/migrations/20260723000000_initial_schema.sql`:

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- NguyenDinhHoaNgai - Initial Schema
-- Dòng họ Nguyễn Đình - Làng Hòa Ngãi - Hà Nam
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. profiles (admin accounts)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       VARCHAR(255),
  full_name   VARCHAR(255),
  role        VARCHAR(20) NOT NULL DEFAULT 'admin'
                CHECK (role IN ('admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. people
CREATE TABLE IF NOT EXISTS people (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle          VARCHAR(50) UNIQUE NOT NULL,
  display_name    VARCHAR(255) NOT NULL,
  first_name      VARCHAR(100),
  middle_name     VARCHAR(100),
  surname         VARCHAR(100) NOT NULL,

  gender          SMALLINT CHECK (gender IN (1, 2)),
  generation      INTEGER NOT NULL DEFAULT 1,
  chi             INTEGER,

  birth_date      DATE,
  birth_year      INTEGER,
  birth_place     VARCHAR(255),

  death_date      DATE,
  death_year      INTEGER,
  death_place     VARCHAR(255),
  death_lunar     VARCHAR(20),

  is_living       BOOLEAN DEFAULT true,
  is_patrilineal  BOOLEAN DEFAULT true,

  phone           VARCHAR(20),
  email           VARCHAR(255),
  address         TEXT,
  hometown        VARCHAR(255),

  occupation      VARCHAR(255),
  biography       TEXT,
  notes           TEXT,
  avatar_url      TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_people_surname ON people(surname);
CREATE INDEX IF NOT EXISTS idx_people_generation ON people(generation);
CREATE INDEX IF NOT EXISTS idx_people_chi ON people(chi);
CREATE INDEX IF NOT EXISTS idx_people_display_name_trgm ON people USING GIN(display_name gin_trgm_ops);

CREATE TRIGGER trg_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. families
CREATE TABLE IF NOT EXISTS families (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  father_id       UUID REFERENCES people(id) ON DELETE SET NULL,
  mother_id       UUID REFERENCES people(id) ON DELETE SET NULL,
  marriage_date   DATE,
  marriage_place  VARCHAR(255),
  notes           TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  CHECK (father_id IS NOT NULL OR mother_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_families_father ON families(father_id);
CREATE INDEX IF NOT EXISTS idx_families_mother ON families(mother_id);

CREATE TRIGGER trg_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. children
CREATE TABLE IF NOT EXISTS children (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  person_id   UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(family_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);
CREATE INDEX IF NOT EXISTS idx_children_person ON children(person_id);

-- 5. events
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  event_type  VARCHAR(20) NOT NULL DEFAULT 'other'
                CHECK (event_type IN ('gio', 'hop_ho', 'le_tet', 'other')),
  event_date  DATE,
  event_lunar VARCHAR(20),
  person_id   UUID REFERENCES people(id) ON DELETE SET NULL,
  location    VARCHAR(255),
  recurring   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_person ON events(person_id);

-- 6. clan_documents
CREATE TABLE IF NOT EXISTS clan_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  file_url      TEXT NOT NULL,
  file_type     VARCHAR(100),
  file_size     INTEGER,
  category      VARCHAR(50) NOT NULL DEFAULT 'khac'
                  CHECK (category IN ('anh_lich_su', 'giay_to', 'ban_do', 'video', 'bai_viet', 'khac')),
  tags          TEXT,
  person_id     UUID REFERENCES people(id) ON DELETE SET NULL,
  uploaded_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clan_documents_category ON clan_documents(category);
CREATE INDEX IF NOT EXISTS idx_clan_documents_person ON clan_documents(person_id);

CREATE TRIGGER trg_clan_documents_updated_at
  BEFORE UPDATE ON clan_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_documents ENABLE ROW LEVEL SECURITY;

-- profiles: SELECT cho tất cả (cần để check role ở middleware)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

-- people: SELECT public, write admin
DROP POLICY IF EXISTS "people_select_all" ON people;
CREATE POLICY "people_select_all" ON people FOR SELECT USING (true);

DROP POLICY IF EXISTS "people_admin_write" ON people;
CREATE POLICY "people_admin_write" ON people
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );

-- families
DROP POLICY IF EXISTS "families_select_all" ON families;
CREATE POLICY "families_select_all" ON families FOR SELECT USING (true);

DROP POLICY IF EXISTS "families_admin_write" ON families;
CREATE POLICY "families_admin_write" ON families
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );

-- children
DROP POLICY IF EXISTS "children_select_all" ON children;
CREATE POLICY "children_select_all" ON children FOR SELECT USING (true);

DROP POLICY IF EXISTS "children_admin_write" ON children;
CREATE POLICY "children_admin_write" ON children
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );

-- events
DROP POLICY IF EXISTS "events_select_all" ON events;
CREATE POLICY "events_select_all" ON events FOR SELECT USING (true);

DROP POLICY IF EXISTS "events_admin_write" ON events;
CREATE POLICY "events_admin_write" ON events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );

-- clan_documents
DROP POLICY IF EXISTS "clan_documents_select_all" ON clan_documents;
CREATE POLICY "clan_documents_select_all" ON clan_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "clan_documents_admin_write" ON clan_documents;
CREATE POLICY "clan_documents_admin_write" ON clan_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Bucket 'media' và 'clan-documents': SELECT public, write admin

-- Helper: tạo policy trên bucket 'media'
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_admin_write" ON storage.objects;
CREATE POLICY "media_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "media_admin_update" ON storage.objects;
CREATE POLICY "media_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "media_admin_delete" ON storage.objects;
CREATE POLICY "media_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Bucket 'clan-documents'
DROP POLICY IF EXISTS "clan_documents_public_read" ON storage.objects;
CREATE POLICY "clan_documents_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'clan-documents');

DROP POLICY IF EXISTS "clan_documents_admin_write" ON storage.objects;
CREATE POLICY "clan_documents_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'clan-documents'
    AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "clan_documents_admin_update" ON storage.objects;
CREATE POLICY "clan_documents_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'clan-documents'
    AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "clan_documents_admin_delete" ON storage.objects;
CREATE POLICY "clan_documents_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'clan-documents'
    AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE ON SIGNUP
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════════════
```

### Bước 2: Chạy migration

1. Mở Supabase Dashboard → SQL Editor → New query.
2. Copy toàn bộ nộiộng file → paste → Run.
3. Verify "Success".

### Bước 3: Tạo Storage buckets

Vào **Storage → New bucket**:
- `media` (Public, 50MB)
- `clan-documents` (Public, 50MB)

### Bước 4: Tạo file seed

File `frontend/supabase/seed.sql`:

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- NguyenDinhHoaNgai - Seed Data (DEMO)
-- Dữ liệu giả lập minh họa - cần được thay bằng dữ liệu thật
-- ═══════════════════════════════════════════════════════════════════════════

-- Tắt trigger tạm thời để insert nhanh
ALTER TABLE people DISABLE TRIGGER trg_people_updated_at;

-- ═══════════════════════════════════════════════════════════════════════════
-- ĐỜI 1 (Thủy tổ - 1850s)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO people (handle, display_name, surname, middle_name, first_name, gender, generation, chi, birth_year, death_year, death_lunar, is_living, is_patrilineal, occupation, hometown) VALUES
('ND001', 'Nguyễn Đình Tổ', 'Nguyễn Đình', NULL, 'Tổ', 1, 1, 1, 1850, 1925, '15/7', false, true, 'Nông dân', 'Làng Hòa Ngãi, Thanh Hà, Thanh Liêm, Hà Nam'),
('ND002', 'Nguyễn Thị Bà', 'Nguyễn', 'Thị', 'Bà', 2, 1, 1, 1855, 1930, '20/3', false, false, 'Nội trợ', 'Làng Hòa Ngãi, Thanh Hà, Thanh Liêm, Hà Nam');

-- ═══════════════════════════════════════════════════════════════════════════
-- ĐỜI 2 (Con của Đời 1)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO people (handle, display_name, surname, middle_name, first_name, gender, generation, chi, birth_year, death_year, death_lunar, is_living, is_patrilineal, occupation) VALUES
('ND003', 'Nguyễn Đình Cả', 'Nguyễn Đình', NULL, 'Cả', 1, 2, 1, 1880, 1955, '10/5', false, true, 'Nông dân'),
('ND004', 'Nguyễn Đình Hai', 'Nguyễn Đình', NULL, 'Hai', 1, 2, 2, 1883, 1960, '8/8', false, true, 'Thợ mộc'),
('ND005', 'Nguyễn Thị Ba', 'Nguyễn', 'Thị', 'Ba', 2, 2, 1, 1885, 1970, '12/11', false, true, 'Nội trợ'),
('ND006', 'Lê Thị Tư', 'Lê', 'Thị', 'Tư', 2, 2, NULL, 1888, 1972, '5/4', false, false, 'Nội trợ');

-- ═══════════════════════════════════════════════════════════════════════════
-- ĐỜI 3 (Cháu của Đời 1)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO people (handle, display_name, surname, middle_name, first_name, gender, generation, chi, birth_year, death_year, death_lunar, is_living, is_patrilineal, occupation) VALUES
('ND007', 'Nguyễn Đình Năm', 'Nguyễn Đình', NULL, 'Năm', 1, 3, 1, 1910, 1985, '18/2', false, true, 'Giáo viên'),
('ND008', 'Nguyễn Đình Sáu', 'Nguyễn Đình', NULL, 'Sáu', 1, 3, 1, 1913, 1988, '22/9', false, true, 'Nông dân'),
('ND009', 'Nguyễn Đình Bảy', 'Nguyễn Đình', NULL, 'Bảy', 1, 3, 2, 1915, 1990, '3/6', false, true, 'Thương nhân'),
('ND010', 'Trần Thị Tám', 'Trần', 'Thị', 'Tám', 2, 3, NULL, 1918, 1995, '14/10', false, false, 'Nội trợ'),
('ND011', 'Phạm Thị Chín', 'Phạm', 'Thị', 'Chín', 2, 3, NULL, 1920, 1998, '7/1', false, false, 'Nội trợ');

-- ═══════════════════════════════════════════════════════════════════════════
-- ĐỜI 4 (Chắt - hiện đang sống)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO people (handle, display_name, surname, middle_name, first_name, gender, generation, chi, birth_year, is_living, is_patrilineal, occupation) VALUES
('ND012', 'Nguyễn Đình Mười', 'Nguyễn Đình', NULL, 'Mười', 1, 4, 1, 1945, true, true, 'Kỹ sư'),
('ND013', 'Nguyễn Đình Hùng', 'Nguyễn Đình', NULL, 'Hùng', 1, 4, 1, 1948, true, true, 'Bác sĩ'),
('ND014', 'Nguyễn Thị Lan', 'Nguyễn', 'Thị', 'Lan', 2, 4, 2, 1950, true, true, 'Giáo viên'),
('ND015', 'Hoàng Thị Mai', 'Hoàng', 'Thị', 'Mai', 2, 4, NULL, 1952, true, false, 'Kế toán');

-- ═══════════════════════════════════════════════════════════════════════════
-- ĐỜI 5 (Chút - thế hệ trẻ)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO people (handle, display_name, surname, middle_name, first_name, gender, generation, chi, birth_year, is_living, is_patrilineal, occupation) VALUES
('ND016', 'Nguyễn Đình Tuấn', 'Nguyễn Đình', NULL, 'Tuấn', 1, 5, 1, 1975, true, true, 'Lập trình viên'),
('ND017', 'Nguyễn Đình Hòa', 'Nguyễn Đình', NULL, 'Hòa', 1, 5, 1, 1978, true, true, 'Kỹ sư xây dựng'),
('ND018', 'Nguyễn Thị Hương', 'Nguyễn', 'Thị', 'Hương', 2, 5, 2, 1980, true, true, 'Bác sĩ');

-- ═══════════════════════════════════════════════════════════════════════════
-- FAMILIES (Quan hệ vợ chồng)
-- ═══════════════════════════════════════════════════════════════════════════

-- Thủy tổ + Bà ngoại
INSERT INTO families (handle, father_id, mother_id, marriage_date, marriage_place)
SELECT 'F001',
  (SELECT id FROM people WHERE handle = 'ND001'),
  (SELECT id FROM people WHERE handle = 'ND002'),
  '1875', 'Làng Hòa Ngãi, Thanh Hà';

-- Đời 2 các cặp
INSERT INTO families (handle, father_id, mother_id) SELECT 'F002',
  (SELECT id FROM people WHERE handle = 'ND003'),
  (SELECT id FROM people WHERE handle = 'ND005');

INSERT INTO families (handle, father_id, mother_id) SELECT 'F003',
  (SELECT id FROM people WHERE handle = 'ND004'),
  (SELECT id FROM people WHERE handle = 'ND006');

-- Đời 3
INSERT INTO families (handle, father_id, mother_id) SELECT 'F004',
  (SELECT id FROM people WHERE handle = 'ND007'),
  (SELECT id FROM people WHERE handle = 'ND010');

INSERT INTO families (handle, father_id, mother_id) SELECT 'F005',
  (SELECT id FROM people WHERE handle = 'ND008'),
  (SELECT id FROM people WHERE handle = 'ND011');

INSERT INTO families (handle, father_id, mother_id) SELECT 'F006',
  (SELECT id FROM people WHERE handle = 'ND009'),
  NULL;  -- chưa có vợ trong dữ liệu demo

-- Đời 4
INSERT INTO families (handle, father_id, mother_id) SELECT 'F007',
  (SELECT id FROM people WHERE handle = 'ND012'),
  (SELECT id FROM people WHERE handle = 'ND015');

INSERT INTO families (handle, father_id, mother_id) SELECT 'F008',
  (SELECT id FROM people WHERE handle = 'ND013'),
  (SELECT id FROM people WHERE handle = 'ND014');

-- ═══════════════════════════════════════════════════════════════════════════
-- CHILDREN (Quan hệ cha-mẹ-con)
-- ═══════════════════════════════════════════════════════════════════════════

-- Con của F001 (Thủy tổ + Bà)
INSERT INTO children (family_id, person_id, sort_order) SELECT
  (SELECT id FROM families WHERE handle = 'F001'),
  (SELECT id FROM people WHERE handle = 'ND003'), 1
WHERE EXISTS (SELECT 1 FROM families WHERE handle='F001');

INSERT INTO children (family_id, person_id, sort_order) SELECT
  (SELECT id FROM families WHERE handle = 'F001'),
  (SELECT id FROM people WHERE handle = 'ND004'), 2
WHERE EXISTS (SELECT 1 FROM families WHERE handle='F001');

INSERT INTO children (family_id, person_id, sort_order) SELECT
  (SELECT id FROM families WHERE handle = 'F001'),
  (SELECT id FROM people WHERE handle = 'ND005'), 3
WHERE EXISTS (SELECT 1 FROM families WHERE handle='F001');

-- Con của F002 (Cả + Ba)
INSERT INTO children (family_id, person_id, sort_order) SELECT
  (SELECT id FROM families WHERE handle = 'F002'),
  (SELECT id FROM people WHERE handle = 'ND007'), 1
WHERE EXISTS (SELECT 1 FROM families WHERE handle='F002');

INSERT INTO children (family_id, person_id, sort_order) SELECT
  (SELECT id FROM families WHERE handle = 'F002'),
  (SELECT id FROM people WHERE handle = 'ND008'), 2
WHERE EXISTS (SELECT 1 FROM families WHERE handle='F002');

-- Con của F003 (Hai + Tư)
INSERT INTO children (family_id, person_id, sort_order) SELECT
  (SELECT id FROM families WHERE handle = 'F003'),
  (SELECT id FROM people WHERE handle = 'ND009'), 1
WHERE EXISTS (SELECT 1 FROM families WHERE handle='F003');

-- Con của F004 (Năm + Tám)
INSERT INTO children (family_id, person_id, sort_order) SELECT
  (SELECT id FROM families WHERE handle = 'F004'),
  (SELECT id FROM people WHERE handle = 'ND012'), 1
WHERE EXISTS (SELECT 1 FROM families WHERE handle='F004');

INSERT INTO children (family_id, person_id, sort_order) SELECT
  (SELECT id FROM families WHERE handle = 'F004'),
  (SELECT id FROM people WHERE handle = 'ND013'), 2
WHERE EXISTS (SELECT 1 FROM families WHERE handle='F004');

-- Con của F005 (Sáu + Chín)
INSERT INTO children (family_id, person_id, sort_order) SELECT
  (SELECT id FROM families WHERE handle = 'F005'),
  (SELECT id FROM people WHERE handle = 'ND014'), 1
WHERE EXISTS (SELECT 1 FROM families WHERE handle='F005');

-- Con của F007 (Mười + Mai)
INSERT INTO children (family_id, person_id, sort_order) SELECT
  (SELECT id FROM families WHERE handle = 'F007'),
  (SELECT id FROM people WHERE handle = 'ND016'), 1
WHERE EXISTS (SELECT 1 FROM families WHERE handle='F007');

INSERT INTO children (family_id, person_id, sort_order) SELECT
  (SELECT id FROM families WHERE handle = 'F007'),
  (SELECT id FROM people WHERE handle = 'ND017'), 2
WHERE EXISTS (SELECT 1 FROM families WHERE handle='F007');

-- Con của F008 (Hùng + Lan)
INSERT INTO children (family_id, person_id, sort_order) SELECT
  (SELECT id FROM families WHERE handle = 'F008'),
  (SELECT id FROM people WHERE handle = 'ND018'), 1
WHERE EXISTS (SELECT 1 FROM families WHERE handle='F008');

-- ═══════════════════════════════════════════════════════════════════════════
-- EVENTS (Lịch cúng lễ)
-- ═══════════════════════════════════════════════════════════════════════════

-- Giỗ (lấy từ death_lunar của người đã mất)
INSERT INTO events (title, event_type, event_lunar, person_id, recurring, location)
SELECT 'Giỗ ' || display_name, 'gio', death_lunar, id, true, 'Nhà thờ họ Nguyễn Đình'
FROM people WHERE death_lunar IS NOT NULL AND is_living = false;

-- Họp họ đầu xuân
INSERT INTO events (title, description, event_type, event_date, recurring, location) VALUES
('Họp họ đầu xuân', 'Họp mặt đầu năm, tổng kết công tác năm cũ, bàn kế hoạch năm mới', 'hop_ho', '2026-02-15', true, 'Nhà thờ họ Nguyễn Đình'),
('Họp họ giữa năm', 'Họp mặt giữa năm, dâng hương tổ tiên', 'hop_ho', '2026-07-15', true, 'Nhà thờ họ Nguyễn Đình'),
('Lễ tảo mộ', 'Đi tảo mộ các thế hệ tiền bối', 'le_tet', '2026-03-10', true, 'Nghĩa trang làng Hòa Ngãi'),
('Ngày giỗ tổ', 'Giỗ chung các vị tiền bối dòng họ', 'le_tet', NULL, true, 'Nhà thờ họ Nguyễn Đình');

-- ═══════════════════════════════════════════════════════════════════════════
-- CLAN_DOCUMENTS (placeholder URLs)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO clan_documents (title, description, file_url, file_type, file_size, category, tags) VALUES
('Ảnh nhà thờ họ cũ', 'Ảnh chụp nhà thờ họ Nguyễn Đình thời Pháp thuộc', 'https://placeholder.supabase.co/storage/v1/object/public/clan-documents/nha-tho-cu.jpg', 'image/jpeg', 524288, 'anh_lich_su', 'nhà thờ, lịch sử, 1940'),
('Gia phả sách giấy', 'Bản gia phả giấy viết tay năm 1920', 'https://placeholder.supabase.co/storage/v1/object/public/clan-documents/gia-pha-1920.pdf', 'application/pdf', 1048576, 'giay_to', 'gia phả, sách, 1920'),
('Bản đồ làng Hòa Ngãi', 'Bản đồ cổ làng Hòa Ngãi thế kỷ 19', 'https://placeholder.supabase.co/storage/v1/object/public/clan-documents/ban-do-lang.jpg', 'image/jpeg', 786432, 'ban_do', 'bản đồ, làng, lịch sử');

-- ═══════════════════════════════════════════════════════════════════════════
-- RE-ENABLE TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE people ENABLE TRIGGER trg_people_updated_at;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════════════
```

### Bước 5: Chạy seed

Trong SQL Editor, chạy file `seed.sql`. Verify số rows:

```sql
SELECT 'people' as table, COUNT(*) FROM people
UNION ALL SELECT 'families', COUNT(*) FROM families
UNION ALL SELECT 'children', COUNT(*) FROM children
UNION ALL SELECT 'events', COUNT(*) FROM events
UNION ALL SELECT 'clan_documents', COUNT(*) FROM clan_documents;
```

Expected:
- people: 18
- families: 8
- children: 11+
- events: 11+ (10 giỗ + 4 sự kiện)
- clan_documents: 3

### Bước 6: Verify RLS

Test từ SQL Editor:

```sql
-- Mọi user có thể SELECT
SELECT COUNT(*) FROM people;  -- Phải thấy 18

-- Test INSERT với anon (sẽ fail)
SET ROLE anon;
INSERT INTO people (handle, display_name, surname, gender, generation)
VALUES ('TEST', 'Test', 'Test', 1, 1);  -- Phải fail: violates row-level security
RESET ROLE;
```

## 6. Smoke test

1. Vào Table Editor → từng bảng → verify có rows.
2. Chạy query `SELECT COUNT(*)` cho mỗi bảng → đúng số expected.
3. Test INSERT với role anon → fail.
4. Tạo admin user trong Dashboard (xem [VERCEL-SUPABASE-DEPLOY.md §6](../docs/04-build/VERCEL-SUPABASE-DEPLOY.md)).

## 7. Lưu ý rủi ro

- **Trigger conflict:** Nếu seed fail vì trigger `handle_new_user`, comment phần trigger tạm thời.
- **Seed có placeholder URLs** cho documents - chỉ dùng để demo giao diện, sẽ bị 404 khi click. Admin cần upload file thật.
- **Demo data giả định:** Tên "Cả, Hai, Ba..." chỉ là placeholder. Admin sẽ sửa thành tên thật sau.
- **Reset seed:** Nếu muốn reset, `TRUNCATE people, families, children, events, clan_documents CASCADE;` rồi chạy lại seed.

## 8. Liên kết

- [01-scaffold-frontend.md](01-scaffold-frontend.md) - Trước đó.
- [03-auth-dang-nhap.md](03-auth-dang-nhap.md) - Tiếp theo.
- [DATA-MODEL.md](../docs/02-design/DATA-MODEL.md) - Schema chi tiết.
- [SECURITY-PRIVACY.md](../docs/02-design/SECURITY-PRIVACY.md) - RLS policy.