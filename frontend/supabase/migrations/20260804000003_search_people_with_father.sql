-- @project NguyenDinhHoaNgai
-- @file supabase/migrations/20260804000003_search_people_with_father.sql
-- @description RPC search_people_with_father: returns matching people with father_name denormalized
-- @version 1.0.0
-- @updated 2026-08-04

-- Helper to escape LIKE wildcards inside the query string.
-- Defined first so search_people_with_father can reference it on first call.
CREATE OR REPLACE FUNCTION public.escape_query(query_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT replace(replace(replace(query_text, '\', '\\'), '%', '\%'), '_', '\_');
$$;

GRANT EXECUTE ON FUNCTION public.escape_query(TEXT) TO anon, authenticated;

-- Drop previous definition if any (idempotent).
DROP FUNCTION IF EXISTS public.search_people_with_father(TEXT, INT);

CREATE OR REPLACE FUNCTION public.search_people_with_father(
  query_text TEXT,
  max_results INT DEFAULT 20
)
RETURNS TABLE (
  id              UUID,
  handle          VARCHAR(50),
  display_name    VARCHAR(255),
  first_name      VARCHAR(100),
  middle_name     VARCHAR(100),
  surname         VARCHAR(100),
  gender          SMALLINT,
  generation      INTEGER,
  chi             INTEGER,
  tree_label      VARCHAR(64),
  birth_date      DATE,
  birth_year      INTEGER,
  birth_place     VARCHAR(255),
  death_date      DATE,
  death_year      INTEGER,
  death_place     VARCHAR(255),
  death_lunar     VARCHAR(20),
  is_living       BOOLEAN,
  is_patrilineal  BOOLEAN,
  phone           VARCHAR(20),
  email           VARCHAR(255),
  zalo            VARCHAR(50),
  facebook        VARCHAR(255),
  address         TEXT,
  hometown        VARCHAR(255),
  occupation      VARCHAR(255),
  biography       TEXT,
  notes           TEXT,
  avatar_url      TEXT,
  privacy_level   SMALLINT,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  father_name     TEXT
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
  SELECT
    p.id,
    p.handle,
    p.display_name,
    p.first_name,
    p.middle_name,
    p.surname,
    p.gender,
    p.generation,
    p.chi,
    p.tree_label,
    p.birth_date,
    p.birth_year,
    p.birth_place,
    p.death_date,
    p.death_year,
    p.death_place,
    p.death_lunar,
    p.is_living,
    p.is_patrilineal,
    p.phone,
    p.email,
    p.zalo,
    p.facebook,
    p.address,
    p.hometown,
    p.occupation,
    p.biography,
    p.notes,
    p.avatar_url,
    p.privacy_level,
    p.created_at,
    p.updated_at,
    fp.display_name AS father_name
  FROM people p
  LEFT JOIN LATERAL (
    SELECT fp2.display_name
    FROM children c
    JOIN families f ON c.family_id = f.id
    JOIN people fp2 ON f.father_id = fp2.id
    WHERE c.person_id = p.id
    ORDER BY c.sort_order
    LIMIT 1
  ) fp ON TRUE
  WHERE p.display_name ILIKE '%' || escape_query(query_text) || '%'
  ORDER BY p.generation, p.birth_year NULLS LAST, p.display_name
  LIMIT GREATEST(max_results, 1);
$$;

GRANT EXECUTE ON FUNCTION public.search_people_with_father(TEXT, INT) TO anon, authenticated;
