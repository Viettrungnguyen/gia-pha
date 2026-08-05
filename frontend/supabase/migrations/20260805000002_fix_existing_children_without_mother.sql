-- Migration: Fix existing children without mother when father has only 1 wife
-- Description: Sửa các bản ghi cũ - gắn mẹ cho con khi cha chỉ có 1 vợ

BEGIN;

-- Tạo function để fix dữ liệu cũ
CREATE OR REPLACE FUNCTION fix_existing_children_without_mother()
RETURNS void AS $$
DECLARE
  v_child RECORD;
  v_father_id UUID;
  v_mother_id UUID;
  v_new_family_id UUID;
  v_spouse_count INTEGER;
BEGIN
  -- Duyệt qua các children chưa có mẹ (chỉ có cha)
  FOR v_child IN
    SELECT c.id as child_id, c.person_id, f.id as family_id, f.father_id
    FROM children c
    JOIN families f ON c.family_id = f.id
    WHERE f.father_id IS NOT NULL
      AND f.mother_id IS NULL
  LOOP
    v_father_id := v_child.father_id;

    -- Đếm số vợ của người cha
    SELECT COUNT(*) INTO v_spouse_count
    FROM families
    WHERE father_id = v_father_id;

    -- Nếu chỉ có đúng 1 vợ
    IF v_spouse_count = 1 THEN
      -- Lấy mother_id của người vợ đó
      SELECT mother_id INTO v_mother_id
      FROM families
      WHERE father_id = v_father_id
      LIMIT 1;

      -- Nếu có mẹ
      IF v_mother_id IS NOT NULL THEN
        -- Kiểm tra xem đã có family cha+mẹ chưa
        SELECT id INTO v_new_family_id
        FROM families
        WHERE father_id = v_father_id AND mother_id = v_mother_id;

        -- Tạo family nếu chưa có
        IF v_new_family_id IS NULL THEN
          INSERT INTO families (father_id, mother_id)
          VALUES (v_father_id, v_mother_id)
          RETURNING id INTO v_new_family_id;
        END IF;

        -- Kiểm tra xem đã có child link chưa
        IF NOT EXISTS (
          SELECT 1 FROM children
          WHERE family_id = v_new_family_id AND person_id = v_child.person_id
        ) THEN
          -- Thêm child vào family mới
          INSERT INTO children (family_id, person_id, sort_order)
          VALUES (v_new_family_id, v_child.person_id, v_child.child_id);
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Chạy function để fix dữ liệu
SELECT fix_existing_children_without_mother();

-- Xóa function vì không cần nữa
DROP FUNCTION fix_existing_children_without_mother();

COMMIT;
