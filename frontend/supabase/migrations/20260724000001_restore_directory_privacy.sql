-- @project NguyenDinhHoaNgai
-- @file supabase/migrations/20260724000001_restore_directory_privacy.sql
-- @description Restores directory contact fields with a PII-safe public view
-- @version 1.0.0
-- @updated 2026-07-24

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS zalo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS facebook VARCHAR(255),
  ADD COLUMN IF NOT EXISTS privacy_level SMALLINT NOT NULL DEFAULT 0
    CHECK (privacy_level IN (0, 1, 2));

CREATE INDEX IF NOT EXISTS idx_people_privacy_level ON people(privacy_level);

DROP POLICY IF EXISTS "people_select_all" ON people;
CREATE POLICY "people_select_public_or_admin" ON people
  FOR SELECT USING (privacy_level = 0 OR auth.uid() IS NOT NULL);

DROP VIEW IF EXISTS public_people;
CREATE VIEW public_people
WITH (security_invoker = true)
AS
SELECT
  id,
  handle,
  display_name,
  first_name,
  middle_name,
  surname,
  gender,
  generation,
  chi,
  birth_date,
  birth_year,
  birth_place,
  death_date,
  death_year,
  death_place,
  death_lunar,
  is_living,
  is_patrilineal,
  NULL::VARCHAR(20) AS phone,
  NULL::VARCHAR(255) AS email,
  NULL::VARCHAR(50) AS zalo,
  NULL::VARCHAR(255) AS facebook,
  NULL::TEXT AS address,
  hometown,
  occupation,
  biography,
  notes,
  avatar_url,
  privacy_level,
  created_at,
  updated_at
FROM people
WHERE privacy_level = 0;

GRANT SELECT ON public_people TO anon, authenticated;
REVOKE SELECT ON people FROM anon;
GRANT SELECT (
  id,
  handle,
  display_name,
  first_name,
  middle_name,
  surname,
  gender,
  generation,
  chi,
  birth_date,
  birth_year,
  birth_place,
  death_date,
  death_year,
  death_place,
  death_lunar,
  is_living,
  is_patrilineal,
  hometown,
  occupation,
  biography,
  notes,
  avatar_url,
  privacy_level,
  created_at,
  updated_at
) ON people TO anon;
