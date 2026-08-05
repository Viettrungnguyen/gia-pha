-- Migration: Auto-add mother-child relationship when father has only 1 wife
-- Description: Khi gắn cha cho người con, nếu cha có đúng 1 vợ thì tự động gắn mẹ cho người con đó

BEGIN;

CREATE OR REPLACE FUNCTION auto_add_mother_for_child()
RETURNS TRIGGER AS $$
DECLARE
  v_father_id UUID;
  v_family_id UUID;
  v_mother_id UUID;
  v_spouse_count INTEGER;
BEGIN
  -- Chỉ chạy khi thêm mới (INSERT) vào bảng children
  IF TG_OP = 'INSERT' THEN
    -- Lấy father_id từ family mới
    SELECT father_id INTO v_father_id
    FROM families
    WHERE id = NEW.family_id;

    -- Nếu có father_id, kiểm tra số vợ
    IF v_father_id IS NOT NULL THEN
      -- Đếm số gia đình mà người cha này là head
      SELECT COUNT(*) INTO v_spouse_count
      FROM families
      WHERE father_id = v_father_id;

      -- Nếu chỉ có đúng 1 vợ, lấy mother_id
      IF v_spouse_count = 1 THEN
        SELECT mother_id INTO v_mother_id
        FROM families
        WHERE father_id = v_father_id
        LIMIT 1;

        -- Nếu có mother_id và người mẹ chưa được gắn cho đứa con này
        IF v_mother_id IS NOT NULL THEN
          -- Kiểm tra xem mối quan hệ này đã tồn tại chưa
          IF NOT EXISTS (
            SELECT 1 FROM children c2
            JOIN families f2 ON c2.family_id = f2.id
            WHERE f2.father_id = v_father_id
              AND f2.mother_id = v_mother_id
              AND c2.person_id = NEW.person_id
          ) THEN
            -- Tìm hoặc tạo family mới với cả cha và mẹ
            SELECT id INTO v_family_id
            FROM families
            WHERE father_id = v_father_id AND mother_id = v_mother_id;

            IF v_family_id IS NULL THEN
              -- Tạo family mới
              INSERT INTO families (father_id, mother_id)
              VALUES (v_father_id, v_mother_id)
              RETURNING id INTO v_family_id;
            END IF;

            -- Thêm child vào family mới
            INSERT INTO children (family_id, person_id, sort_order)
            VALUES (v_family_id, NEW.person_id, NEW.sort_order);
          END IF;
        END IF;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger
DROP TRIGGER IF EXISTS trg_auto_add_mother ON children;
CREATE TRIGGER trg_auto_add_mother
  AFTER INSERT ON children
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_mother_for_child();

COMMIT;
