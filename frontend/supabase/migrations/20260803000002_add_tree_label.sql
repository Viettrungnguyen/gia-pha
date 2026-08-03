-- @project NguyenDinhHoaNgai
-- @file supabase/migrations/20260803000002_add_tree_label.sql
-- @description Add free-text label to render on the family tree node (e.g. "Tổ cô", "Chi trưởng")
-- @version 1.0.0
-- @updated 2026-08-03

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS tree_label VARCHAR(64);

-- Cập nhật view public_people để lộ cột cho người xem (chỉ với privacy_level = 0)
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
  tree_label,
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

-- Cập nhật grant cho anon trên people: thêm tree_label
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
  tree_label,
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
