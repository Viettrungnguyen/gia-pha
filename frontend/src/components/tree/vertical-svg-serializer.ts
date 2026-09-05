/**
 * @project NguyenDinhHoaNgai
 * @file src/components/tree/vertical-svg-serializer.ts
 * @description Serialize vertical layout ra SVG string (độc lập với CSS transform).
 *              Đợt 14: tách riêng để vertical view có serializer riêng,
 *              compact view không bị ảnh hưởng bởi nhánh vertical.
 *
 * Quy ước style:
 *   - Gen < 6: compact style (ô vàng + chữ ngang, giống compact view).
 *   - Gen >= 6: vertical style (chữ xoay -90°, palette xanh/hồng theo giới tính).
 *
 * @version 1.0.0
 * @updated 2026-09-06
 */

import type { Person } from '@/types';
import type {
  CompactLayout,
  CompactCoupleNode,
  CompactSonNode,
  CompactDaughterCell,
} from '@/components/tree/compact-family-tree';

export type VerticalExportLayout = CompactLayout;

// --- Style constants ---
// Compact style (gen < 6) — giữ tone ấm vàng, giống CompactFamilyTree.
const C_BG = '#fef3c7';
const C_BORDER = '#b45309';
const C_TEXT = '#1f2937';
const C_META = '#b45309';
const C_SPOUSE_TEXT = '#9d174d';

const COUPLE_BOX_WIDTH = 185;
const COUPLE_BOX_HEADER_HEIGHT = 40;
const COUPLE_BOX_HEIGHT_PER_SPOUSE = 26;
const COUPLE_BOX_PADDING = 8;
const SON_NODE_WIDTH = 168;
const SON_NODE_HEIGHT = 52;
const DAUGHTER_CELL_ROW_HEIGHT = 18;
const DAUGHTER_CELL_PADDING = 10;

// Vertical style (gen >= 6) — palette xanh nam / hồng nữ, chữ xoay -90°.
const VERT_FROM_GEN = 6;
// Couple bg theo anchor gender (đợt 14: nhánh anchor = nữ vẫn dùng palette nữ).
const VERT_COUPLE_BG_M = '#eff6ff';
const VERT_COUPLE_BORDER_M = '#60a5fa';
const VERT_COUPLE_BG_F = '#fff1f2';
const VERT_COUPLE_BORDER_F = '#f472b6';
const VERT_SON_BG_M = '#eff6ff';
const VERT_SON_BORDER_M = '#60a5fa';
const VERT_DAUGHTER_BG_F = '#fff1f2';
const VERT_DAUGHTER_BORDER_F = '#f472b6';
const VERT_PADDING_X = 8;
const VERT_PADDING_Y = 8;
const VERT_COL_GAP = 6;
const VERT_META_H = 18;
const VERT_FONT = 13;
const VERT_META_FONT = 11;
const VERT_HUSBAND_TEXT = '#1e3a8a';
const VERT_WIFE_TEXT = '#9d174d';
const VERT_META_TEXT = '#78350f';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function coupleMeta(person: Person): string {
  // Đợt 14.1: bỏ năm sinh khỏi meta (chỉ giữ "Đời N" + dấu † nếu đã mất).
  const dy = !person.is_living ? ' †' : '';
  return `Đời ${person.generation}${dy}`;
}

/**
 * Serialize vertical layout ra SVG. Gen < 6 dùng compact style (ngang),
 * gen >= 6 dùng vertical style (xoay -90°).
 */
export function serializeVerticalLayoutToSvg(layout: CompactLayout): string {
  const w = layout.width;
  const h = layout.height;
  const ox = layout.offsetX;
  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<rect width="100%" height="100%" fill="#fff7ed"/>`,
    `<g transform="translate(${ox}, 0)" font-family="ui-sans-serif, system-ui, sans-serif">`,
  ];

  for (const c of layout.connections) {
    out.push(
      `<path d="M ${c.x1} ${c.y1} L ${c.x1} ${(c.y1 + c.y2) / 2} L ${c.x2} ${(c.y1 + c.y2) / 2} L ${c.x2} ${c.y2}" fill="none" stroke="#eab308" stroke-width="2.5"/>`,
    );
  }

  for (const node of layout.nodes) {
    if (node.kind === 'couple') {
      const { person: husband, spouses, x, y, width, height } = node;
      if (husband.generation >= VERT_FROM_GEN) {
        renderVerticalCouple(out, node, x, y, width, height);
      } else {
        renderCompactCouple(out, husband, spouses, x, y, width, height);
      }
    } else if (node.kind === 'son') {
      const { person, x, y, width, height } = node;
      if (person.generation >= VERT_FROM_GEN) {
        renderVerticalSon(out, person, x, y, width, height);
      } else {
        renderCompactSon(out, person, x, y, width, height);
      }
    } else {
      // Daughter cell — gen < 6 dùng compact style, gen >= 6 dùng vertical
      // style (xoay -90°) cho khớp UI render.
      if (node.daughters.some((d) => (d.generation ?? 0) >= VERT_FROM_GEN)) {
        renderVerticalDaughterCell(out, node);
      } else {
        renderDaughterCell(out, node);
      }
    }
  }

  out.push(`</g></svg>`);
  return out.join('');
}

// ===== Compact style (gen < 6) =====
function renderCompactCouple(
  out: string[],
  husband: Person,
  spouses: CompactCoupleNode['spouses'],
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  out.push(
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${C_BG}" stroke="${C_BORDER}" stroke-width="1.5"/>`,
  );
  const centerX = x + width / 2;
  const nameLines = splitName(husband.display_name);
  if (nameLines.length === 1) {
    out.push(`<text x="${centerX}" y="${y + 22}" text-anchor="middle" font-size="13" font-weight="700" fill="${C_TEXT}">${esc(nameLines[0])}</text>`);
  } else {
    out.push(`<text x="${centerX}" y="${y + 18}" text-anchor="middle" font-size="12" font-weight="700" fill="${C_TEXT}">${esc(nameLines[0])}</text>`);
    out.push(`<text x="${centerX}" y="${y + 32}" text-anchor="middle" font-size="12" font-weight="700" fill="${C_TEXT}">${esc(nameLines[1])}</text>`);
  }
  out.push(`<text x="${centerX}" y="${y + height - 8}" text-anchor="middle" font-size="10" fill="${C_META}">${esc(coupleMeta(husband))}</text>`);

  const baseLabel = husband.gender === 2 ? 'Chồng' : 'Vợ';
  spouses.forEach((sp, idx) => {
    const sy = y + COUPLE_BOX_HEADER_HEIGHT + idx * COUPLE_BOX_HEIGHT_PER_SPOUSE;
    const labelText = spouses.length === 1 ? `${baseLabel}: ` : `${baseLabel} ${sp.sortOrder}: `;
    const nameText = `${esc(labelText)}${esc(sp.person.display_name)}`;
    const metaText = sp.person.birth_year
      ? esc(sp.person.birth_year.toString()) + (!sp.person.is_living ? ' †' : '')
      : (!sp.person.is_living ? '†' : '');
    const nameY = sy + COUPLE_BOX_HEIGHT_PER_SPOUSE / 2 + 4;
    out.push(`<text x="${x + COUPLE_BOX_PADDING}" y="${nameY}" font-size="11" fill="${C_SPOUSE_TEXT}" font-weight="600">${nameText}</text>`);
    if (metaText) {
      out.push(`<text x="${x + width - COUPLE_BOX_PADDING}" y="${nameY}" font-size="11" fill="${C_SPOUSE_TEXT}" font-weight="600" text-anchor="end">${metaText}</text>`);
    }
  });
}

function renderCompactSon(
  out: string[],
  person: Person,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const isMale = person.gender === 1;
  const fill = isMale ? '#eff6ff' : '#fff1f2';
  const stroke = isMale ? '#60a5fa' : '#f472b6';
  out.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`);
  const centerX = x + width / 2;
  const nameLines = splitName(person.display_name);
  if (nameLines.length === 1) {
    out.push(`<text x="${centerX}" y="${y + 22}" text-anchor="middle" font-size="13" font-weight="600" fill="${C_TEXT}">${esc(nameLines[0])}</text>`);
  } else {
    out.push(`<text x="${centerX}" y="${y + 18}" text-anchor="middle" font-size="12" font-weight="600" fill="${C_TEXT}">${esc(nameLines[0])}</text>`);
    out.push(`<text x="${centerX}" y="${y + 32}" text-anchor="middle" font-size="12" font-weight="600" fill="${C_TEXT}">${esc(nameLines[1])}</text>`);
  }
  const meta = coupleMeta(person);
  out.push(`<text x="${centerX}" y="${y + height - 8}" text-anchor="middle" font-size="10" fill="${isMale ? '#60a5fa' : '#f472b6'}">${esc(meta)}</text>`);
}

function renderDaughterCell(out: string[], node: CompactDaughterCell): void {
  const { daughters, x, y, width, height } = node;
  out.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="#fff1f2" stroke="#f472b6" stroke-width="1.2"/>`);
  const showBullet = daughters.length > 1;
  daughters.forEach((d, idx) => {
    const ly = y + DAUGHTER_CELL_PADDING + idx * DAUGHTER_CELL_ROW_HEIGHT + DAUGHTER_CELL_ROW_HEIGHT / 2 + 4;
    if (ly + 4 > y + height) return;
    if (showBullet) {
      out.push(`<circle cx="${x + 12}" cy="${ly - 4}" r="2" fill="#ec4899"/>`);
    }
    out.push(`<text x="${x + (showBullet ? 20 : DAUGHTER_CELL_PADDING)}" y="${ly}" font-size="12" fill="${C_SPOUSE_TEXT}" font-weight="600">${esc(d.display_name.length > 22 ? `${d.display_name.slice(0, 21)}…` : d.display_name)}</text>`);
    // Đợt 14.1: bỏ năm sinh ở cuối dòng theo yêu cầu user.
  });
}

// ===== Vertical style (gen >= 6) =====
function renderVerticalCouple(
  out: string[],
  node: CompactCoupleNode,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const { person: husband, spouses } = node;
  const anchorIsMale = husband.gender === 1;
  const coupleBg = anchorIsMale ? VERT_COUPLE_BG_M : VERT_COUPLE_BG_F;
  const coupleBorder = anchorIsMale ? VERT_COUPLE_BORDER_M : VERT_COUPLE_BORDER_F;

  const persons: Array<{ person: Person; isAnchor: boolean }> = [
    { person: husband, isAnchor: true },
    ...spouses.map((s) => ({ person: s.person, isAnchor: false })),
  ];

  out.push(
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="${coupleBg}" stroke="${coupleBorder}" stroke-width="1.5"/>`,
  );

  const innerW = width - VERT_PADDING_X * 2;
  const innerH = height - VERT_PADDING_Y * 2;
  const colGapTotal = Math.max(0, persons.length - 1) * VERT_COL_GAP;
  const colW = Math.max(8, (innerW - colGapTotal) / Math.max(1, persons.length));
  // Name area: trừ vùng meta ở đáy (VERT_META_H), để chữ xoay không che meta.
  const nameAreaH = Math.max(8, innerH - VERT_META_H - 4);
  const baseY = y + VERT_PADDING_Y + nameAreaH;

  // Render TẤT CẢ persons (kể cả anchor nam/nữ, kể cả các vợ) đều xoay -90°.
  persons.forEach((p, idx) => {
    const cx = x + VERT_PADDING_X + idx * (colW + VERT_COL_GAP) + colW / 2;
    const isMale = p.person.gender === 1;
    const textColor = isMale ? VERT_HUSBAND_TEXT : VERT_WIFE_TEXT;
    out.push(
      `<text x="${cx}" y="${baseY}" text-anchor="start" font-size="${VERT_FONT}" font-weight="700" fill="${textColor}" transform="rotate(-90, ${cx}, ${baseY})">${esc(p.person.display_name)}</text>`,
    );
  });

  // Meta: y rõ ràng ở dưới cùng, đảm bảo không bị text xoay che.
  const metaY = y + height - 4;
  const meta = coupleMeta(husband);
  out.push(
    `<text x="${x + width / 2}" y="${metaY}" text-anchor="middle" font-size="${VERT_META_FONT}" fill="${VERT_META_TEXT}">${esc(meta)}</text>`,
  );
}

function renderVerticalSon(
  out: string[],
  person: Person,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const isMale = person.gender === 1;
  const fill = isMale ? VERT_SON_BG_M : VERT_DAUGHTER_BG_F;
  const stroke = isMale ? VERT_SON_BORDER_M : VERT_DAUGHTER_BORDER_F;
  out.push(
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`,
  );
  const innerW = width - VERT_PADDING_X * 2;
  const innerH = height - VERT_PADDING_Y * 2;
  const colW = Math.max(8, innerW);
  const nameAreaH = Math.max(8, innerH - VERT_META_H - 4);
  const baseY = y + VERT_PADDING_Y + nameAreaH;
  const cx = x + VERT_PADDING_X + colW / 2;
  const textColor = isMale ? VERT_HUSBAND_TEXT : VERT_WIFE_TEXT;
  out.push(
    `<text x="${cx}" y="${baseY}" text-anchor="start" font-size="${VERT_FONT}" font-weight="700" fill="${textColor}" transform="rotate(-90, ${cx}, ${baseY})">${esc(person.display_name)}</text>`,
  );
  const metaY = y + height - 4;
  const meta = coupleMeta(person);
  out.push(
    `<text x="${x + width / 2}" y="${metaY}" text-anchor="middle" font-size="${VERT_META_FONT}" fill="${VERT_META_TEXT}">${esc(meta)}</text>`,
  );
}

function renderVerticalDaughterCell(out: string[], node: CompactDaughterCell): void {
  // Đợt 14.1: từ gen 6 trở lên, ô gộp con gái xoay -90° cho khớp UI render.
  // Mỗi con gái 1 cột, đồng bộ palette hồng.
  const { daughters, x, y, width, height } = node;
  out.push(
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="${VERT_DAUGHTER_BG_F}" stroke="${VERT_DAUGHTER_BORDER_F}" stroke-width="1.2"/>`,
  );

  const innerW = width - VERT_PADDING_X * 2;
  const innerH = height - VERT_PADDING_Y * 2;
  const colGapTotal = Math.max(0, daughters.length - 1) * VERT_COL_GAP;
  const colW = Math.max(8, (innerW - colGapTotal) / Math.max(1, daughters.length));
  // Name area chừa đáy cho meta (đời).
  const nameAreaH = Math.max(8, innerH - VERT_META_H - 4);
  const baseY = y + VERT_PADDING_Y + nameAreaH;

  daughters.forEach((d, idx) => {
    const cx = x + VERT_PADDING_X + idx * (colW + VERT_COL_GAP) + colW / 2;
    out.push(
      `<text x="${cx}" y="${baseY}" text-anchor="start" font-size="${VERT_FONT}" font-weight="700" fill="${VERT_WIFE_TEXT}" transform="rotate(-90, ${cx}, ${baseY})">${esc(d.display_name)}</text>`,
    );
  });

  // Meta: lấy đời của anchor (cha) — đợt 14.1 bỏ năm sinh, chỉ giữ "Đời N".
  const anchorGen = daughters[0]?.generation ?? 0;
  const meta = `Đời ${anchorGen}`;
  out.push(
    `<text x="${x + width / 2}" y="${y + height - 4}" text-anchor="middle" font-size="${VERT_META_FONT}" fill="${VERT_META_TEXT}">${esc(meta)}</text>`,
  );
}

// ===== Helpers =====
function splitName(name: string): string[] {
  if (name.length <= 22) return [name];
  const mid = Math.ceil(name.length / 2);
  let cut = name.lastIndexOf(' ', mid);
  if (cut < 0) cut = mid;
  return [name.slice(0, cut).trim(), name.slice(cut).trim()];
}

export type { CompactLayout, CompactCoupleNode, CompactSonNode, CompactDaughterCell };
