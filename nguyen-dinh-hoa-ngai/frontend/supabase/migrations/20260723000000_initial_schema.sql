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
