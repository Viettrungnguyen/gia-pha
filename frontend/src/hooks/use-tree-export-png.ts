/**
 * @project NguyenDinhHoaNgai
 * @file src/hooks/use-tree-export-png.ts
 * @description Hook xuất cây gia phả ra file PNG (có fallback SVG).
 * Dùng chung cho compact + vertical view.
 * @version 1.0.0
 * @updated 2026-09-06
 */

'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseTreeExportPngOptions {
  /** Serialize layout hiện tại ra chuỗi SVG (full XML, có xmlns). */
  serializeSvg: () => string;
  /** width/height của layout (pixel, scale = 1). */
  width: number;
  height: number;
  /** Tiền tố tên file, vd: 'cay-gia-pha-compact' / 'cay-gia-pha-vertical'. */
  fileNamePrefix: string;
  /** Màu nền fill trước khi vẽ SVG (vd: '#fff7ed'). */
  backgroundColor?: string;
}

interface UseTreeExportPngResult {
  isExporting: boolean;
  exportPng: () => Promise<void>;
}

/**
 * Xuất layout cây gia phả ra PNG với fallback SVG khi canvas quá lớn.
 *
 * Luồng:
 *  1. Serialize SVG → Blob → URL.
 *  2. Load vào <img>, vẽ lên <canvas> với scale (mặc định 2x, kẹp theo MAX_DIM).
 *  3. canvas.toBlob('image/png'). Nếu fail, thử scale nhỏ hơn (1x → 0.5x → 0.25x).
 *  4. Nếu vẫn fail → tải SVG fallback, cảnh báo user.
 *  5. Tạo <a download> để trình duyệt tự lưu file.
 */
export function useTreeExportPng({
  serializeSvg,
  width,
  height,
  fileNamePrefix,
  backgroundColor = '#fff7ed',
}: UseTreeExportPngOptions): UseTreeExportPngResult {
  const [isExporting, setIsExporting] = useState(false);

  const exportPng = useCallback(async () => {
    if (isExporting || width <= 0 || height <= 0) return;
    setIsExporting(true);
    try {
      const svgString = serializeSvg();

      // Giới hạn canvas của trình duyệt:
      //  - Chrome/Edge: width/height tối đa 32767, area tối đa ~268MP.
      //  - Firefox: tối đa 32767 mỗi chiều, area 472907776.
      // Khi vượt, canvas.toBlob() sẽ trả về null → "Xuất PNG thất bại".
      // Ta giảm scale hoặc tile theo trục để luôn nằm trong giới hạn.
      const MAX_DIM = 8192; // an toàn cho mọi trình duyệt kể cả mobile
      const REQUESTED_SCALE = 2;

      const scale = Math.min(
        REQUESTED_SCALE,
        MAX_DIM / width,
        MAX_DIM / height,
      );
      const finalW = Math.floor(width * scale);
      const finalH = Math.floor(height * scale);

      const svgBlob = new Blob([svgString], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Không thể render SVG'));
        img.src = svgUrl;
      });
      URL.revokeObjectURL(svgUrl);

      // Xuất PNG qua toBlob. Một số trình duyệt vẫn fail khi area quá lớn
      // (vd. iPad Safari cũ) — thử lại với scale thấp hơn trước khi bỏ cuộc.
      let pngBlob: Blob | null = null;
      let usedScale = scale;
      for (const attempt of [scale, scale / 2, scale / 4, 1]) {
        const aw = Math.max(1, Math.floor(width * attempt));
        const ah = Math.max(1, Math.floor(height * attempt));
        if (aw > MAX_DIM || ah > MAX_DIM) continue;
        const c = document.createElement('canvas');
        c.width = aw;
        c.height = ah;
        const cx = c.getContext('2d');
        if (!cx) continue;
        cx.fillStyle = backgroundColor;
        cx.fillRect(0, 0, aw, ah);
        cx.drawImage(img, 0, 0, aw, ah);
        pngBlob = await new Promise<Blob | null>((resolve) =>
          c.toBlob((b) => resolve(b), 'image/png'),
        );
        if (pngBlob) {
          usedScale = attempt;
          break;
        }
      }

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');

      if (!pngBlob) {
        // Fallback cuối: tải SVG về máy thay vì PNG.
        const svgName = `${fileNamePrefix}-${yyyy}-${mm}-${dd}.svg`;
        const fallback = await fetch(svgString)
          .then((r) => r.blob())
          .catch(() => svgBlob);
        const fbUrl = URL.createObjectURL(fallback);
        const a = document.createElement('a');
        a.href = fbUrl;
        a.download = svgName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(fbUrl), 1000);
        toast.warning(
          'Ảnh PNG quá lớn, đã tải xuống định dạng SVG (có thể mở và in từ trình duyệt).',
        );
        return;
      }

      const fileName = `${fileNamePrefix}-${yyyy}-${mm}-${dd}.png`;
      const url = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      // Cảnh báo thân thiện nếu đã phải giảm chất lượng.
      if (usedScale < REQUESTED_SCALE) {
        toast.info(
          `Cây quá lớn nên ảnh xuất ở mức ${Math.round(
            usedScale * 100,
          )}% (thay vì ${REQUESTED_SCALE * 100}%).`,
        );
      }
    } catch (err) {
      console.error('[useTreeExportPng] export failed', err);
      toast.error('Xuất ảnh thất bại. Vui lòng thử lại hoặc dùng SVG.');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, serializeSvg, width, height, fileNamePrefix, backgroundColor]);

  return { isExporting, exportPng };
}
