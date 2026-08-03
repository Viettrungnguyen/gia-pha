---
project: NguyenDinhHoaNgai
path: docs/02-design/DATA-MODEL.md
type: data-model
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Data Model

## 1. Tổng quan

Dự án dùng 6 bảng PostgreSQL trên Supabase Cloud:

| # | Bảng | Mục đích |
|---|------|----------|
| 1 | `profiles` | Liên kết tài khoản Supabase Auth với metadata admin |
| 2 | `people` | Thành viên dòng họ |
| 3 | `families` | Quan hệ vợ chồng (1 hoặc 2 người) |
| 4 | `children` | Junction: ai là con của family nào |
| 5 | `events` | Lịch cúng lễ (giỗ, họp họ, lễ tết) |
| 6 | `clan_documents` | Metadata tài liệu + URL trong Storage |

Cùng với 2 Storage bucket: `media` (avatar/ảnh) và `clan-documents` (file đính kèm).

## 2. ERD

```
┌──────────────────────────┐
│ auth.users (Supabase)    │
│ - id (UUID)              │
│ - email                  │
└────────────┬─────────────┘
             │ 1:1
             ▼
┌──────────────────────────┐
│ profiles                 │
│ - id                     │
│ - user_id (FK→auth.users)│
│ - email                  │
│ - full_name              │
│ - role ('admin')         │
└──────────────────────────┘

┌──────────────────────────┐
│ people                   │
│ - id                     │
│ - handle (unique)        │
│ - display_name           │
│ - gender (1=M, 2=F)      │
│ - generation             │
│ - chi                    │
│ - birth_year, birth_date │
│ - death_year, death_date │
│ - death_lunar (DD/MM)    │
│ - is_living              │
│ - avatar_url             │
└────────┬─────────────────┘
         │
         │ (cha/mẹ - nhiều quan hệ)
         ▼
┌──────────────────────────┐         ┌──────────────────────────┐
│ families                 │ 1───N  │ children                 │
│ - id                     │────────►│ family_id (FK)           │
│ - father_id (FK→people)  │        │ person_id (FK→people)    │
│ - mother_id (FK→people)  │        │ sort_order               │
│ - marriage_date          │        │ UNIQUE(family_id,        │
│ - notes                  │        │   person_id)             │
└──────────────────────────┘        └──────────────────────────┘

┌──────────────────────────┐
│ events                   │
│ - id                     │
│ - title                  │
│ - event_type             │
│   ('gio'|'hop_ho'|      │
│    'le_tet'|'other')     │
│ - event_date (solar)     │
│ - event_lunar (DD/MM)    │
│ - person_id (FK→people)  │
│ - location               │
│ - recurring              │
└──────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│ clan_documents           │         │ Storage buckets:         │
│ - id                     │         │ - media (avatar)         │
│ - title                  │         │ - clan-documents (file)  │
│ - file_url               │         └──────────────────────────┘
│ - file_type, file_size   │
│ - category               │
│ - person_id (FK→people)  │
│ - uploaded_by (FK→auth)  │
└──────────────────────────┘
```

## 3. Schema chi tiết

### 3.1 `profiles`

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       VARCHAR(255),
  full_name   VARCHAR(255),
  role        VARCHAR(20) NOT NULL DEFAULT 'admin'
                CHECK (role IN ('admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user ON profiles(user_id);

-- Auto-create profile on signup (default role = admin in MVP)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin'  -- MVP: mọi user tạo qua Dashboard đều là admin
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Lưu ý:** Trong MVP, role chỉ có 'admin'. Nếu sau này cần nhiều role, mở rộng CHECK constraint và trigger.

### 3.2 `people`

```sql
CREATE TABLE people (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle          VARCHAR(50) UNIQUE NOT NULL,
  display_name    VARCHAR(255) NOT NULL,
  first_name      VARCHAR(100),
  middle_name     VARCHAR(100),
  surname         VARCHAR(100) NOT NULL,  -- "Nguyễn Đình" hoặc "Nguyễn"

  -- Giới tính & vị trí
  gender          SMALLINT CHECK (gender IN (1, 2)), -- 1=Nam, 2=Nữ
  generation      INTEGER NOT NULL DEFAULT 1,
  chi             INTEGER, -- Chi/phái trong dòng họ

  -- Sinh
  birth_date      DATE,
  birth_year      INTEGER,
  birth_place     VARCHAR(255),

  -- Mất
  death_date      DATE,
  death_year      INTEGER,
  death_place     VARCHAR(255),
  death_lunar     VARCHAR(20), -- "15/7" (ngày/tháng âm lịch)

  -- Trạng thái
  is_living       BOOLEAN DEFAULT true,
  is_patrilineal  BOOLEAN DEFAULT true, -- Chính tộc (họ Nguyễn Đình)

  -- Liên hệ (công khai theo BR-01)
  phone           VARCHAR(20),
  email           VARCHAR(255),
  address         TEXT,
  hometown        VARCHAR(255),

  -- Tiểu sử
  occupation      VARCHAR(255),
  biography       TEXT,
  notes           TEXT,

  -- Ảnh đại diện (URL trong Storage bucket `media`)
  avatar_url      TEXT,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_people_surname ON people(surname);
CREATE INDEX idx_people_generation ON people(generation);
CREATE INDEX idx_people_chi ON people(chi);
CREATE INDEX idx_people_display_name_trgm ON people USING GIN(display_name gin_trgm_ops);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.3 `families`

```sql
CREATE TABLE families (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  father_id       UUID REFERENCES people(id) ON DELETE SET NULL,
  mother_id       UUID REFERENCES people(id) ON DELETE SET NULL,
  marriage_date   DATE,
  marriage_place  VARCHAR(255),
  notes           TEXT,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  -- Ít nhất một trong hai (father hoặc mother) phải có
  CHECK (father_id IS NOT NULL OR mother_id IS NOT NULL)
);

CREATE INDEX idx_families_father ON families(father_id);
CREATE INDEX idx_families_mother ON families(mother_id);

CREATE TRIGGER trg_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.4 `children`

```sql
CREATE TABLE children (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  person_id   UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  sort_order  INTEGER DEFAULT 0, -- Thứ tự sinh
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(family_id, person_id)
);

CREATE INDEX idx_children_family ON children(family_id);
CREATE INDEX idx_children_person ON children(person_id);
```

### 3.5 `events`

```sql
CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  event_type  VARCHAR(20) NOT NULL DEFAULT 'other'
                CHECK (event_type IN ('gio', 'hop_ho', 'le_tet', 'other')),
  event_date  DATE,                          -- Ngày dương lịch (nếu cố định)
  event_lunar VARCHAR(20),                   -- "15/7" ngày/tháng âm lịch
  person_id   UUID REFERENCES people(id) ON DELETE SET NULL,
  location    VARCHAR(255),
  recurring   BOOLEAN DEFAULT false,         -- Lặp lại hàng năm
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_person ON events(person_id);
```

### 3.6 `clan_documents`

```sql
CREATE TABLE clan_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  file_url      TEXT NOT NULL,               -- URL trong Storage bucket `clan-documents`
  file_type     VARCHAR(100),                -- MIME type
  file_size     INTEGER,                     -- bytes
  category      VARCHAR(50) NOT NULL DEFAULT 'khac'
                  CHECK (category IN ('anh_lich_su', 'giay_to', 'ban_do', 'video', 'bai_viet', 'khac')),
  tags          TEXT,                        -- comma-separated
  person_id     UUID REFERENCES people(id) ON DELETE SET NULL,
  uploaded_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clan_documents_category ON clan_documents(category);
CREATE INDEX idx_clan_documents_person ON clan_documents(person_id);

CREATE TRIGGER trg_clan_documents_updated_at
  BEFORE UPDATE ON clan_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## 4. RLS Policies

### 4.1 `profiles`

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Ai cũng đọc được (cần để check role ở middleware)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

-- Chỉ admin update (qua service role hoặc qua check role trong trigger)
-- Trong MVP, không expose UPDATE qua anon key.
```

### 4.2 `people`, `families`, `children`, `events`, `clan_documents`

Mẫu chung cho 5 bảng còn lại:

```sql
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_documents ENABLE ROW LEVEL SECURITY;

-- SELECT: mọi người (public)
CREATE POLICY "people_select_all" ON people FOR SELECT USING (true);
CREATE POLICY "families_select_all" ON families FOR SELECT USING (true);
CREATE POLICY "children_select_all" ON children FOR SELECT USING (true);
CREATE POLICY "events_select_all" ON events FOR SELECT USING (true);
CREATE POLICY "clan_documents_select_all" ON clan_documents FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE: chỉ admin
CREATE POLICY "people_admin_write" ON people
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );

-- Lặp lại cho families, children, events, clan_documents
```

### 4.3 Storage RLS

```sql
-- Bucket 'media' (public read, admin write)
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "media_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "media_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Bucket 'clan-documents' (public read, admin write)
-- Tương tự, đổi bucket_id = 'clan-documents'
```

## 5. RLS Matrix

| Bảng / Bucket | anon SELECT | anon INSERT | anon UPDATE | anon DELETE | admin SELECT | admin INSERT | admin UPDATE | admin DELETE |
|---------------|-------------|-------------|-------------|-------------|--------------|--------------|--------------|--------------|
| profiles | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ (qua service role) | ✅ | ✅ |
| people | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| families | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| children | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| events | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| clan_documents | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| media (storage) | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| clan-documents (storage) | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

## 6. Migration Path to Privacy

Nếu sau này muốn giới hạn quyền riêng tư:

1. Thêm cột `privacy_level SMALLINT DEFAULT 0` vào `people`, `clan_documents`.
   - 0 = công khai (mặc định)
   - 1 = chỉ thành viên (cần đăng nhập)
   - 2 = chỉ admin
2. Đổi policy SELECT:
   ```sql
   CREATE POLICY "people_select_with_privacy" ON people
     FOR SELECT USING (
       privacy_level = 0
       OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
       OR (privacy_level = 1 AND auth.uid() IS NOT NULL)
     );
   ```
3. Thêm UI control để admin chọn `privacy_level` khi tạo/sửa.

Xem chi tiết tại [SECURITY-PRIVACY.md §4](SECURITY-PRIVACY.md).

## 7. Seed Data

Xem `frontend/supabase/seed.sql` (sẽ tạo ở bước [prompt 02](../prompts/02-supabase-schema-rls.md)).

## 8. Liên kết

- [TECHNICAL-DESIGN.md](TECHNICAL-DESIGN.md) - Kiến trúc tổng thể.
- [SECURITY-PRIVACY.md](SECURITY-PRIVACY.md) - Auth + upload guard.
- [BRD.md §BR-01](../01-planning/BRD.md) - Quyết định công khai.