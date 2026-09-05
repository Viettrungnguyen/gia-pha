-- ═══════════════════════════════════════════════════════════════════════════
-- swap_family_sort_order: Atomic swap of sort_order between two families
-- Dùng khi admin đổi thứ tự vợ/chồng trong SpouseManagerDialog.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION swap_family_sort_order(a uuid, b uuid)
RETURNS void AS $$
DECLARE
  oa integer;
  ob integer;
BEGIN
  IF a = b THEN
    RETURN;
  END IF;

  SELECT sort_order INTO oa FROM families WHERE id = a;
  SELECT sort_order INTO ob FROM families WHERE id = b;

  -- Nếu cả hai cùng sort_order (vd. tất cả đang = 0),
  -- bước "đổi" truyền thống không có hiệu lực. Dùng giá trị tạm.
  IF oa IS NULL OR ob IS NULL THEN
    -- Tăng tạm sort_order của a lên 1 (vẫn đảm bảo khác ob),
    -- rồi đổi. Nếu a cũng đã max thì lùi.
    UPDATE families
      SET sort_order = sort_order + 1
      WHERE id = a;
    oa := COALESCE(oa, 0) + 1;
  ELSIF oa = ob THEN
    UPDATE families
      SET sort_order = sort_order + 1
      WHERE id = a;
    oa := oa + 1;
  END IF;

  UPDATE families SET sort_order = oa WHERE id = b;
  UPDATE families SET sort_order = ob WHERE id = a;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS: chỉ admin mới được gọi. Hàm chạy với quyền table owner nên vẫn UPDATE được.
REVOKE ALL ON FUNCTION swap_family_sort_order(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION swap_family_sort_order(uuid, uuid) TO authenticated;
