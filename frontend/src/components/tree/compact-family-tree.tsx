/**
 * @project NguyenDinhHoaNgai
 * @file src/components/tree/compact-family-tree.tsx
 * @description Compact family tree view:
 *              - Ô couple gộp chồng + nhiều vợ (nếu có) xếp dọc trong 1 ô
 *              - Con trai giữ ô riêng, con gái gộp vào 1 ô (liệt kê tên)
 *              - Đường nối con-cha-mẹ xuất phát từ ô vợ
 *              Reuse cùng data (people + families + children) với cây thường.
 * @version 1.0.0
 * @updated 2026-09-05
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ChevronsDownUp,
  Download,
  GitBranch,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Child, Family, Person } from '@/types';

interface Props {
  people: Person[];
  families: Family[];
  children: Child[];
}

const COUPLE_BOX_WIDTH = 185;
const COUPLE_BOX_HEIGHT_PER_SPOUSE = 26;
const COUPLE_BOX_HEADER_HEIGHT = 40;
const COUPLE_BOX_PADDING = 8;
const SON_NODE_WIDTH = 168;
const SON_NODE_HEIGHT = 52;
const DAUGHTER_CELL_WIDTH = 200;
const DAUGHTER_CELL_ROW_HEIGHT = 22;
const DAUGHTER_CELL_HEADER_HEIGHT = 0; // bỏ header "Con gái"
const DAUGHTER_CELL_PADDING = 10;
// Gap dọc tối thiểu giữa bottom couple ở gen X và top couple/son ở gen X+1.
// Đường nối sẽ luôn chạm đáy ô cha (dùng coupleY + cHeight) và chạm top
// ô con (dùng levelY[childGen]) → cả 2 đầu đều connect với node.
const LEVEL_GAP = 48;
const SIBLING_GAP = 20;
const BRANCH_GAP = 60;
const COUPLE_GAP = 28; // khoảng cách giữa các couple ngang hàng

type CompactNodeKind = 'couple' | 'son' | 'daughter-cell';

interface CompactCoupleNode {
  kind: 'couple';
  id: string; // anchorId
  person: Person; // anchor (chồng hoặc người nối với cha mẹ)
  spouses: Person[]; // các vợ (có thể rỗng)
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CompactSonNode {
  kind: 'son';
  id: string; // person_id
  person: Person;
  familyId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  spouse?: Person; // nếu son có vợ chồng, hiển thị ở góc (nhỏ, optional MVP)
}

interface CompactDaughterCell {
  kind: 'daughter-cell';
  id: string; // family.id
  familyId: string;
  daughters: Person[];
  x: number;
  y: number;
  width: number;
  height: number;
  anchorId: string; // couple node cha
}

type CompactNode = CompactCoupleNode | CompactSonNode | CompactDaughterCell;

interface Connection {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'parent-child';
}

/** Tính kích thước couple box dựa trên số lượng vợ */
function getCoupleBoxSize(spouseCount: number): { width: number; height: number } {
  const w = COUPLE_BOX_WIDTH;
  const spouseRows = Math.max(1, spouseCount); // header + spouseRows spouse
  const h = COUPLE_BOX_HEADER_HEIGHT + spouseRows * COUPLE_BOX_HEIGHT_PER_SPOUSE + COUPLE_BOX_PADDING * 2;
  return { width: w, height: h };
}

function getDaughterCellSize(daughterCount: number): { width: number; height: number } {
  return {
    width: 185,
    // bỏ header → chỉ còn padding + từng dòng con gái
    height: DAUGHTER_CELL_PADDING * 2 + DAUGHTER_CELL_ROW_HEIGHT * Math.max(1, daughterCount),
  };
}

/** Build layout cho cây compact */
export function buildCompactLayout(data: Props): {
  nodes: CompactNode[];
  connections: Connection[];
  width: number;
  height: number;
  offsetX: number;
} {
  const { people, families, children } = data;
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const familiesById = new Map(families.map((family) => [family.id, family]));

  // Chỉ giữ visible people (loại bỏ người đã mất privacy? MVP: giữ tất cả)
  const visibleIds = new Set(people.map((p) => p.id));

  // Map: person_id → family mà người đó là con
  const childToFamily = new Map<string, Family>();
  for (const child of children) {
    if (!childToFamily.has(child.person_id)) {
      const f = familiesById.get(child.family_id);
      if (f) childToFamily.set(child.person_id, f);
    }
  }

  // Sort children trong mỗi family: sort_order → birth_year → id
  const childrenByFamily = new Map<string, Child[]>();
  for (const child of children) {
    const list = childrenByFamily.get(child.family_id) ?? [];
    list.push(child);
    childrenByFamily.set(child.family_id, list);
  }
  for (const list of childrenByFamily.values()) {
    // CV1: sắp xếp theo sort_order trước, nếu không có sort_order (cùng giá trị
    // hoặc đều 9999) thì fallback theo created_at → id để ổn định giữa các lần render.
    list.sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      const ca = a.created_at ?? '';
      const cb = b.created_at ?? '';
      if (ca !== cb) return ca.localeCompare(cb);
      return a.person_id.localeCompare(b.person_id);
    });
  }

  // Xác định anchor cho mỗi family: ưu tiên father_id nếu visible,
  // ngược lại dùng mother_id. Đánh dấu person là "positioned-as-spouse"
  // nếu họ là spouse trong 1 family có anchor visible (tức là sẽ được hiển thị
  // bên cạnh anchor chứ không phải root riêng).
  const familyAnchors = new Map<string, string>();
  const familySpouses = new Map<string, string>();
  const familiesByAnchor = new Map<string, Family[]>();
  const positionedAsSpouse = new Set<string>();

  for (const f of families) {
    let anchorId: string | null = null;
    if (f.father_id && visibleIds.has(f.father_id)) {
      anchorId = f.father_id;
    } else if (f.mother_id && visibleIds.has(f.mother_id)) {
      anchorId = f.mother_id;
    }
    if (!anchorId) continue;

    familyAnchors.set(f.id, anchorId);
    const spouseId = f.father_id === anchorId ? f.mother_id : f.father_id;
    if (spouseId) {
      familySpouses.set(f.id, spouseId);
      positionedAsSpouse.add(spouseId);
    }
    const list = familiesByAnchor.get(anchorId) ?? [];
    list.push(f);
    familiesByAnchor.set(anchorId, list);
  }

  for (const list of familiesByAnchor.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }

  // Xác định roots: person không phải con của bất kỳ family nào
  // (parentless hoặc parent không visible), VÀ không phải spouse của anchor khác.
  const roots = people.filter((p) => {
    if (positionedAsSpouse.has(p.id)) return false;
    const parentFamily = childToFamily.get(p.id);
    const parentAnchorId = parentFamily ? familyAnchors.get(parentFamily.id) : undefined;
    return !parentAnchorId || !visibleIds.has(parentAnchorId);
  });

  // Với mỗi anchor, thu thập các spouse (có thể là vợ hoặc chồng tùy anchor)
  function getSpousesFor(anchorId: string): Person[] {
    const list = familiesByAnchor.get(anchorId) ?? [];
    const spouses: Person[] = [];
    for (const f of list) {
      const sid = familySpouses.get(f.id);
      if (!sid) continue;
      const p = peopleById.get(sid);
      if (p && !spouses.find((x) => x.id === p.id)) spouses.push(p);
    }
    return spouses;
  }

  // Subtree width cache
  const subtreeWidths = new Map<string, number>();
  const calculating = new Set<string>();

  function computeSubtreeWidth(anchorId: string): number {
    const cached = subtreeWidths.get(anchorId);
    if (cached !== undefined) return cached;
    if (calculating.has(anchorId)) {
      const { width } = getCoupleBoxSize(getSpousesFor(anchorId).length);
      return width;
    }
    calculating.add(anchorId);

    const anchor = peopleById.get(anchorId);
    if (!anchor) {
      calculating.delete(anchorId);
      return COUPLE_BOX_WIDTH;
    }

    const fams = familiesByAnchor.get(anchorId) ?? [];
    let childrenBlockWidth = 0;

    fams.forEach((fam, idx) => {
      const kids = childrenByFamily.get(fam.id) ?? [];
      const sons = kids.filter((c) => peopleById.get(c.person_id)?.gender === 1);
      const daughters = kids.filter((c) => peopleById.get(c.person_id)?.gender === 2);

      // Mỗi son có 1 subtree width riêng (couple box của nó)
      const sonSubtreeWidths: number[] = sons.map((s) => {
        const anchor = peopleById.get(s.person_id);
        if (!anchor) return SON_NODE_WIDTH;
        // Nếu son đó cũng là father của family nào → tính recursively
        if (familiesByAnchor.has(s.person_id)) {
          return computeSubtreeWidth(s.person_id);
        }
        return SON_NODE_WIDTH;
      });

      const childrenRowWidth =
        sonSubtreeWidths.reduce((a, b) => a + b, 0) +
        Math.max(0, sonSubtreeWidths.length - 1) * SIBLING_GAP +
        (daughters.length > 0 ? BRANCH_GAP + getDaughterCellSize(daughters.length).width : 0);

      childrenBlockWidth = Math.max(childrenBlockWidth, childrenRowWidth);

      // spacing giữa các family blocks (vì mỗi vợ 1 block)
      // → Mỗi family là 1 block riêng, đặt cạnh nhau với BRANCH_GAP.
      // Để đơn giản trong MVP: chỉ 1 family hiển thị block (coi như các vợ khác hiển thị con chung trong 1 daughters cell? No, đã nói gộp con gái riêng).
      // → Thực tế: mỗi vợ có 1 block riêng (son + daughters cell riêng), xếp cạnh nhau.
    });

    if (fams.length > 1) {
      // Tính tổng width của các family blocks
      const familyBlockWidths: number[] = fams.map((fam) => {
        const kids = childrenByFamily.get(fam.id) ?? [];
        const sons = kids.filter((c) => peopleById.get(c.person_id)?.gender === 1);
        const daughters = kids.filter((c) => peopleById.get(c.person_id)?.gender === 2);
        const sonWidths = sons.map((s) =>
          familiesByAnchor.has(s.person_id)
            ? computeSubtreeWidth(s.person_id)
            : SON_NODE_WIDTH
        );
        return (
          sonWidths.reduce((a, b) => a + b, 0) +
          Math.max(0, sonWidths.length - 1) * SIBLING_GAP +
          (daughters.length > 0 ? BRANCH_GAP + getDaughterCellSize(daughters.length).width : 0)
        );
      });
      childrenBlockWidth = familyBlockWidths.reduce((a, b) => a + b, 0) +
        Math.max(0, familyBlockWidths.length - 1) * BRANCH_GAP;
    }

    const { width: coupleW } = getCoupleBoxSize(getSpousesFor(anchorId).length);
    const total = Math.max(coupleW, childrenBlockWidth);

    calculating.delete(anchorId);
    subtreeWidths.set(anchorId, total);
    return total;
  }

  roots.forEach((r) => computeSubtreeWidth(r.id));

  // Precompute y cho mỗi generation dựa trên chiều cao thực tế của couple lớn nhất
  // ở mỗi đời. Cách làm:
  //   - Với mỗi gen, tìm max cHeight của các couple ở gen đó.
  //   - levelY[gen] = tổng (max cHeight của từng gen trước) + LEVEL_GAP giữa các gen + padding top.
  // Kết quả: đường nối từ bottom couple của gen X xuống top couple/son của gen X+1
  // dài đúng LEVEL_GAP + max cHeight của gen trước — đồng đều cho mọi người.
  const maxCoupleHeightByGen = new Map<number, number>();
  for (const person of people) {
    const gen = person.generation ?? 1;
    const spouses = getSpousesFor(person.id);
    const h = getCoupleBoxSize(spouses.length).height;
    if (h > (maxCoupleHeightByGen.get(gen) ?? 0)) {
      maxCoupleHeightByGen.set(gen, h);
    }
  }
  const sortedGens = [...maxCoupleHeightByGen.keys()].sort((a, b) => a - b);
  const levelY = new Map<number, number>();
  let cursorY = 20; // padding top
  for (const gen of sortedGens) {
    levelY.set(gen, cursorY);
    cursorY += (maxCoupleHeightByGen.get(gen) ?? 0) + LEVEL_GAP;
  }

  // Bottom y của generation (cố định, dựa trên max cHeight của gen đó)
  // → dùng cho đường nối xuất phát từ cha để mọi đường nối từ cùng gen cha
  // đều dài bằng nhau (đồng đều qua cụ lấy nhiều vợ vs 1 vợ).
  const bottomOfGen = new Map<number, number>();
  for (const [gen, y] of levelY.entries()) {
    bottomOfGen.set(gen, y + (maxCoupleHeightByGen.get(gen) ?? 0));
  }

  // Assign positions
  const xPositions = new Map<string, number>(); // anchorId → startX
  const nodes: CompactNode[] = [];
  const connections: Connection[] = [];

  // Track vị trí couple node để nối đường từ couple xuống con
  const coupleNodePos = new Map<string, { x: number; y: number; width: number; height: number }>();

  /**
   * Đệ quy: tạo couple node cho anchor, sau đó xếp tất cả con (của tất cả families
   * của anchor) bên dưới. Mỗi child person được xử lý đúng 1 lần:
   *  - Nếu child là father (có family) → gọi assignFor đệ quy, child sẽ được
   *    render như 1 couple node riêng.
   *  - Nếu không → render như 'son' node (chỉ con trai) hoặc gom vào daughter cell.
   */
  function assignFor(anchorId: string, startX: number) {
    if (xPositions.has(anchorId)) return;
    const subtreeW = subtreeWidths.get(anchorId) ?? COUPLE_BOX_WIDTH;
    const coupleCenterX = startX + subtreeW / 2;
    const spouses = getSpousesFor(anchorId);
    const anchor = peopleById.get(anchorId);
    if (!anchor) return;

    const { width: cWidth, height: cHeight } = getCoupleBoxSize(spouses.length);
    const coupleX = coupleCenterX - cWidth / 2;
    const coupleY = levelY.get(anchor.generation) ?? 20;

    xPositions.set(anchorId, startX);
    coupleNodePos.set(anchorId, { x: coupleX, y: coupleY, width: cWidth, height: cHeight });

    nodes.push({
      kind: 'couple',
      id: anchorId,
      person: anchor,
      spouses,
      x: coupleX,
      y: coupleY,
      width: cWidth,
      height: cHeight,
    });

    const fams = familiesByAnchor.get(anchorId) ?? [];
    if (fams.length === 0) return;

    // Tính block cho từng family của anchor
    const familyBlocks = fams.map((fam) => {
      const kids = childrenByFamily.get(fam.id) ?? [];
      const sons = kids.filter((c) => peopleById.get(c.person_id)?.gender === 1);
      const daughters = kids.filter((c) => peopleById.get(c.person_id)?.gender === 2);
      const sonWs = sons.map((s) => subtreeWidths.get(s.person_id) ?? SON_NODE_WIDTH);
      const daughtersSize = daughters.length > 0 ? getDaughterCellSize(daughters.length) : { width: 0, height: 0 };
      const w =
        sonWs.reduce((a, b) => a + b, 0) +
        Math.max(0, sons.length - 1) * SIBLING_GAP +
        (daughters.length > 0 ? BRANCH_GAP + daughtersSize.width : 0);
      return { fam, sons, daughters, width: w };
    });

    const totalChildrenW = familyBlocks.reduce((a, b) => a + b.width, 0) +
      Math.max(0, familyBlocks.length - 1) * BRANCH_GAP;

    const blockStart = coupleCenterX - totalChildrenW / 2;

    let blockCursor = blockStart;
    familyBlocks.forEach((block, famIdx) => {
      // Vị trí bắt đầu của block = blockCursor
      // Tính X cho từng son trong block (cộng dồn subtreeWidth)
      let sonCursor = blockCursor;

      block.sons.forEach((son, sIdx) => {
        const sw = subtreeWidths.get(son.person_id) ?? SON_NODE_WIDTH;
        const sonCenterX = sonCursor + sw / 2;
        // Y của node con dùng levelY[child.gen] (đồng đều trong cả generation,
        // không phụ thuộc cHeight của cha) → đường nối đồng đều.
        const sonPerson = peopleById.get(son.person_id);
        const childGen = sonPerson?.generation ?? (anchor.generation ?? 1) + 1;
        const childY = levelY.get(childGen) ?? (coupleY + cHeight + LEVEL_GAP);

        if (familiesByAnchor.has(son.person_id)) {
          // Son này cũng là father → để assignFor đệ quy tự tạo couple node
          // cho nó (không tạo son node ở đây để tránh đè).
          assignFor(son.person_id, sonCursor);
        } else {
          if (!sonPerson) return;
          nodes.push({
            kind: 'son',
            id: son.person_id,
            person: sonPerson,
            familyId: block.fam.id,
            x: sonCenterX - SON_NODE_WIDTH / 2,
            y: childY,
            width: SON_NODE_WIDTH,
            height: SON_NODE_HEIGHT,
          });
        }

        // Đường nối: couple box (anchor) → đỉnh ô của son này.
        //   y1 = coupleY + cHeight (đáy thực của couple - đảm bảo chạm đáy ô cha)
        //   y2 = childY            (top của node con - chạm top ô con)
        // Độ dài đường nối = childY - (coupleY + cHeight) - thay đổi theo từng cụ
        // nhưng được LEVEL_GAP đảm bảo luôn dương và đẹp.
        connections.push({
          id: `p2s-${anchorId}-${son.person_id}-${famIdx}`,
          x1: coupleCenterX,
          y1: coupleY + cHeight,
          x2: sonCenterX,
          y2: childY,
          type: 'parent-child',
        });

        sonCursor += sw;
        if (sIdx < block.sons.length - 1) sonCursor += SIBLING_GAP;
      });

      // Daughter cell (đặt SAU tất cả sons trong block + BRANCH_GAP)
      if (block.daughters.length > 0) {
        // Cursor sau sons:
        let cellStart = blockCursor;
        if (block.sons.length > 0) {
          const sonWsList = block.sons.map((s) => subtreeWidths.get(s.person_id) ?? SON_NODE_WIDTH);
          cellStart = blockCursor +
            sonWsList.reduce((a, b) => a + b, 0) +
            Math.max(0, block.sons.length - 1) * SIBLING_GAP +
            BRANCH_GAP;
        }
        const dSize = getDaughterCellSize(block.daughters.length);
        const cellCenterX = cellStart + dSize.width / 2;
        // Y của daughter cell cùng generation với sons
        const firstSon = block.sons[0] ? peopleById.get(block.sons[0].person_id) : null;
        const cellGen = firstSon?.generation ?? (anchor.generation ?? 1) + 1;
        const cellY = levelY.get(cellGen) ?? (coupleY + cHeight + LEVEL_GAP);

        nodes.push({
          kind: 'daughter-cell',
          id: block.fam.id,
          familyId: block.fam.id,
          anchorId,
          daughters: block.daughters
            .map((c) => peopleById.get(c.person_id))
            .filter((p): p is Person => !!p),
          x: cellStart,
          y: cellY,
          width: dSize.width,
          height: dSize.height,
        });

        connections.push({
          id: `p2d-${anchorId}-${block.fam.id}-${famIdx}`,
          x1: coupleCenterX,
          y1: coupleY + cHeight,
          x2: cellCenterX,
          y2: cellY,
          type: 'parent-child',
        });
      }

      blockCursor += block.width;
      if (famIdx < familyBlocks.length - 1) blockCursor += BRANCH_GAP;
    });
  }

  let cursor = 0;
  roots.forEach((r) => {
    assignFor(r.id, cursor);
    cursor += (subtreeWidths.get(r.id) ?? COUPLE_BOX_WIDTH) + SIBLING_GAP * 4;
  });

  if (nodes.length === 0) {
    return { nodes: [], connections: [], width: 0, height: 0, offsetX: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = 0;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  if (!Number.isFinite(minX)) {
    return { nodes: [], connections: [], width: 0, height: 0, offsetX: 0 };
  }

  return {
    nodes,
    connections,
    width: maxX - minX + 100,
    height: maxY + 60,
    offsetX: -minX + 50,
  };
}

// Serialize một compact layout thành SVG string độc lập (không phụ thuộc transform CSS),
// dùng cho chức năng xuất ảnh PNG. Áp dụng lại offsetX giống SVG hiển thị.
function serializeCompactLayoutToSvg(layout: ReturnType<typeof buildCompactLayout>): string {
  const w = layout.width;
  const h = layout.height;
  const ox = layout.offsetX;

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<rect width="100%" height="100%" fill="#fff7ed"/>`,
    `<g transform="translate(${ox}, 0)" font-family="ui-sans-serif, system-ui, sans-serif">`,
  ];

  for (const c of layout.connections) {
    lines.push(
      `<path d="M ${c.x1} ${c.y1} L ${c.x1} ${(c.y1 + c.y2) / 2} L ${c.x2} ${(c.y1 + c.y2) / 2} L ${c.x2} ${c.y2}" fill="none" stroke="#eab308" stroke-width="2.5"/>`,
    );
  }

  for (const node of layout.nodes) {
    if (node.kind === 'couple') {
      const { person: husband, spouses, x, y, width, height } = node;
      const isMale = husband.gender === 1;
      const fill = '#fef3c7';
      const stroke = '#b45309';
      lines.push(
        `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`,
      );
      const centerX = x + width / 2;
      const linesName: string[] = [];
      const name = husband.display_name;
      if (name.length > 22) {
        const mid = Math.ceil(name.length / 2);
        let cut = name.lastIndexOf(' ', mid);
        if (cut < 0) cut = mid;
        linesName.push(name.slice(0, cut).trim(), name.slice(cut).trim());
      } else {
        linesName.push(name);
      }
      if (linesName.length === 1) {
        lines.push(`<text x="${centerX}" y="${y + 22}" text-anchor="middle" font-size="13" font-weight="700" fill="#1f2937">${esc(linesName[0])}</text>`);
      } else {
        lines.push(`<text x="${centerX}" y="${y + 18}" text-anchor="middle" font-size="12" font-weight="700" fill="#1f2937">${esc(linesName[0])}</text>`);
        lines.push(`<text x="${centerX}" y="${y + 32}" text-anchor="middle" font-size="12" font-weight="700" fill="#1f2937">${esc(linesName[1])}</text>`);
      }
      const meta = `Đời ${husband.generation}${husband.birth_year ? ` · ${husband.birth_year}` : ''}${!husband.is_living ? ' †' : ''}`;
      lines.push(`<text x="${centerX}" y="${y + height - 8}" text-anchor="middle" font-size="10" fill="#b45309">${esc(meta)}</text>`);

      // Spouses (vợ hoặc chồng tùy anchor) - chỉ chữ hồng, không nền, không viền
      const baseLabel = husband.gender === 2 ? 'Chồng' : 'Vợ';
      spouses.forEach((sp, idx) => {
        const sy = y + COUPLE_BOX_HEADER_HEIGHT + idx * COUPLE_BOX_HEIGHT_PER_SPOUSE;
        const labelText = spouses.length === 1 ? `${baseLabel}: ` : `${baseLabel} ${idx + 1}: `;
        const nameText = `${esc(labelText)}${esc(sp.display_name)}`;
        const metaText = sp.birth_year ? esc(sp.birth_year.toString()) + (!sp.is_living ? ' †' : '') : (!sp.is_living ? '†' : '');
        const nameY = sy + COUPLE_BOX_HEIGHT_PER_SPOUSE / 2 + 4;
        lines.push(`<text x="${x + COUPLE_BOX_PADDING}" y="${nameY}" font-size="11" fill="#9d174d" font-weight="600">${nameText}</text>`);
        if (metaText) {
          lines.push(`<text x="${x + width - COUPLE_BOX_PADDING}" y="${nameY}" font-size="11" fill="#9d174d" font-weight="600" text-anchor="end">${metaText}</text>`);
        }
      });
    } else if (node.kind === 'son') {
      const { person, x, y, width, height } = node;
      const isMale = person.gender === 1;
      const fill = isMale ? '#eff6ff' : '#fff1f2';
      const stroke = isMale ? '#60a5fa' : '#f472b6';
      lines.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`);
      const centerX = x + width / 2;
      const linesName: string[] = [];
      const name = person.display_name;
      if (name.length > 22) {
        const mid = Math.ceil(name.length / 2);
        let cut = name.lastIndexOf(' ', mid);
        if (cut < 0) cut = mid;
        linesName.push(name.slice(0, cut).trim(), name.slice(cut).trim());
      } else {
        linesName.push(name);
      }
      if (linesName.length === 1) {
        lines.push(`<text x="${centerX}" y="${y + 22}" text-anchor="middle" font-size="13" font-weight="600" fill="#1f2937">${esc(linesName[0])}</text>`);
      } else {
        lines.push(`<text x="${centerX}" y="${y + 18}" text-anchor="middle" font-size="12" font-weight="600" fill="#1f2937">${esc(linesName[0])}</text>`);
        lines.push(`<text x="${centerX}" y="${y + 32}" text-anchor="middle" font-size="12" font-weight="600" fill="#1f2937">${esc(linesName[1])}</text>`);
      }
      const meta = `Đời ${person.generation}${person.birth_year ? ` · ${person.birth_year}` : ''}${!person.is_living ? ' †' : ''}`;
      lines.push(`<text x="${centerX}" y="${y + height - 8}" text-anchor="middle" font-size="10" fill="${isMale ? '#60a5fa' : '#f472b6'}">${esc(meta)}</text>`);
    } else {
      // daughter cell
      const { daughters, x, y, width, height } = node;
      lines.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="#fff1f2" stroke="#f472b6" stroke-width="1.2"/>`);
      const showBullet = daughters.length > 1;
      daughters.forEach((d, idx) => {
        const ly = y + DAUGHTER_CELL_PADDING + idx * DAUGHTER_CELL_ROW_HEIGHT + DAUGHTER_CELL_ROW_HEIGHT / 2 + 4;
        if (ly + 4 > y + height) return;
        if (showBullet) {
          lines.push(`<circle cx="${x + 12}" cy="${ly - 4}" r="2" fill="#ec4899"/>`);
        }
        lines.push(`<text x="${x + (showBullet ? 20 : DAUGHTER_CELL_PADDING)}" y="${ly}" font-size="12" fill="#9d174d" font-weight="600">${esc(d.display_name.length > 22 ? `${d.display_name.slice(0, 21)}…` : d.display_name)}</text>`);
        lines.push(`<text x="${x + width - DAUGHTER_CELL_PADDING}" y="${ly}" font-size="10" fill="#9d174d" opacity="0.7" text-anchor="end">${esc((d.birth_year ?? '?').toString())}${!d.is_living ? ' †' : ''}</text>`);
      });
    }
  }

  lines.push(`</g></svg>`);
  return lines.join('');
}

// --- Render components ---

interface CoupleNodeProps {
  node: CompactCoupleNode;
  onSelect?: (person: Person) => void;
}

function CompactCoupleNodeView({ node, onSelect }: CoupleNodeProps) {
  const { person: husband, spouses, x, y, width, height } = node;

  const handleClick = () => {
    if (onSelect) onSelect(husband);
  };

  // Chia name thành 2 dòng nếu dài
  const husbandName = husband.display_name;
  const lines: string[] = [];
  if (husbandName.length > 22) {
    const mid = Math.ceil(husbandName.length / 2);
    let cut = husbandName.lastIndexOf(' ', mid);
    if (cut < 0) cut = mid;
    lines.push(husbandName.slice(0, cut).trim(), husbandName.slice(cut).trim());
  } else {
    lines.push(husbandName);
  }

  const coupleY = y;
  const headerH = COUPLE_BOX_HEADER_HEIGHT;
  const namesY1 = coupleY + 18;
  const namesY2 = coupleY + 32;
  const metaY = coupleY + headerH - 5;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Xem ${husband.display_name} và các vợ/chồng`}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
    >
      {/* Outer card */}
      <rect
        x={x}
        y={coupleY}
        width={width}
        height={height}
        rx={8}
        fill="#fef3c7"
        stroke="#b45309"
        strokeWidth={1.5}
      />

      {/* Header band (chồng) */}
      <path
        d={`M ${x} ${coupleY + 8} Q ${x} ${coupleY} ${x + 8} ${coupleY} L ${x + width - 8} ${coupleY} Q ${x + width} ${coupleY} ${x + width} ${coupleY + 8} L ${x + width} ${coupleY + headerH} L ${x} ${coupleY + headerH} Z`}
        fill="#b45309"
      />

      {/* Tên chồng (1-2 dòng) */}
      {lines.length === 1 ? (
        <text
          x={x + width / 2}
          y={namesY1 + 6}
          textAnchor="middle"
          fontSize={14}
          fontWeight={700}
          fill="#fff7ed"
          style={{ userSelect: 'none' }}
        >
          {lines[0]}
        </text>
      ) : (
        <>
          <text
            x={x + width / 2}
            y={namesY1}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill="#fff7ed"
            style={{ userSelect: 'none' }}
          >
            {lines[0]}
          </text>
          <text
            x={x + width / 2}
            y={namesY2 + 6}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill="#fff7ed"
            style={{ userSelect: 'none' }}
          >
            {lines[1]}
          </text>
        </>
      )}

      {/* Meta - canh phải header */}
      <text
        x={x + width - COUPLE_BOX_PADDING}
        y={metaY}
        textAnchor="end"
        fontSize={9}
        fill="#fde68a"
        style={{ userSelect: 'none' }}
      >
        {`Đời ${husband.generation}`}{husband.tree_label ? ` · ${husband.tree_label}` : ''}
      </text>

      {/* Spouses - xếp dọc. Label phụ thuộc giới tính anchor. */}
      {spouses.map((spouse, idx) => {
        const lineY = coupleY + headerH + COUPLE_BOX_PADDING + idx * COUPLE_BOX_HEIGHT_PER_SPOUSE + 18;
        const baseLabel = husband.gender === 2 ? 'Chồng' : 'Vợ';
        const label = spouses.length === 1 ? baseLabel : `${baseLabel} ${idx + 1}`;
        return (
          <g key={spouse.id}>
            <text
              x={x + COUPLE_BOX_PADDING}
              y={lineY}
              fontSize={12}
              fontWeight={600}
              fill="#78350f"
              style={{ userSelect: 'none' }}
            >
              <tspan fontSize={9} fill="#9a3412" fontWeight={600}>{label}: </tspan>
              {spouse.display_name.length > 22 ? `${spouse.display_name.slice(0, 21)}…` : spouse.display_name}
            </text>
            <text
              x={x + width - COUPLE_BOX_PADDING}
              y={lineY}
              fontSize={10}
              fill="#92400e"
              textAnchor="end"
              style={{ userSelect: 'none' }}
            >
              {spouse.birth_year ?? ''}{!spouse.is_living ? ' †' : ''}
            </text>
          </g>
        );
      })}

      {spouses.length === 0 && (
        <text
          x={x + width / 2}
          y={coupleY + headerH + COUPLE_BOX_PADDING + 18}
          textAnchor="middle"
          fontSize={10}
          fill="#9a3412"
          fontStyle="italic"
          style={{ userSelect: 'none' }}
        >
          (chưa rõ vợ/chồng)
        </text>
      )}
    </g>
  );
}

interface SonNodeProps {
  node: CompactSonNode;
  onSelect?: (person: Person) => void;
}

function CompactSonNodeView({ node, onSelect }: SonNodeProps) {
  const { person, x, y, width, height } = node;
  const isMale = person.gender === 1;
  const fill = isMale ? '#eff6ff' : '#fff1f2';
  const stroke = isMale ? '#60a5fa' : '#f472b6';
  const centerX = x + width / 2;

  const handleClick = () => onSelect?.(person);

  // chia 2 dòng nếu tên dài
  const name = person.display_name;
  const lines: string[] = [];
  if (name.length > 22) {
    const mid = Math.ceil(name.length / 2);
    let cut = name.lastIndexOf(' ', mid);
    if (cut < 0) cut = mid;
    lines.push(name.slice(0, cut).trim(), name.slice(cut).trim());
  } else {
    lines.push(name);
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Xem ${person.display_name}`}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
    >
      <rect x={x} y={y} width={width} height={height} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {lines.length === 1 ? (
        <text
          x={centerX}
          y={y + 22}
          textAnchor="middle"
          fontSize={13}
          fontWeight={600}
          fill="#1f2937"
          style={{ userSelect: 'none' }}
        >
          {lines[0]}
        </text>
      ) : (
        <>
          <text
            x={centerX}
            y={y + 18}
            textAnchor="middle"
            fontSize={12}
            fontWeight={600}
            fill="#1f2937"
            style={{ userSelect: 'none' }}
          >
            {lines[0]}
          </text>
          <text
            x={centerX}
            y={y + 32}
            textAnchor="middle"
            fontSize={12}
            fontWeight={600}
            fill="#1f2937"
            style={{ userSelect: 'none' }}
          >
            {lines[1]}
          </text>
        </>
      )}
      <text
        x={centerX}
        y={y + height - 8}
        textAnchor="middle"
        fontSize={10}
        fill={isMale ? '#60a5fa' : '#f472b6'}
        style={{ userSelect: 'none' }}
      >
        {`Đời ${person.generation}`}{person.birth_year ? ` · ${person.birth_year}` : ''}{!person.is_living ? ' †' : ''}
      </text>
    </g>
  );
}

interface DaughterCellProps {
  node: CompactDaughterCell;
}

function CompactDaughterCellView({ node }: DaughterCellProps) {
  const { daughters, x, y, width, height } = node;

  return (
    <g>
      {/* Outer rect - tone hồng nhẹ giống person nữ ở family-tree thường */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        fill="#fff1f2"
        stroke="#f472b6"
        strokeWidth={1.2}
      />

      {/* Chỉ liệt kê tên - không header, không click */}
      {daughters.map((d, idx) => {
        const ly = y + DAUGHTER_CELL_PADDING + idx * DAUGHTER_CELL_ROW_HEIGHT + DAUGHTER_CELL_ROW_HEIGHT / 2 + 4;
        if (ly + 4 > y + height) return null;
        // 1 con gái: bỏ bullet (thừa); nhiều con: hiện bullet cho rõ danh sách
        const showBullet = daughters.length > 1;
        return (
          <g key={d.id}>
            {showBullet && <circle cx={x + 12} cy={ly - 4} r={2} fill="#ec4899" />}
            <text
              x={x + (showBullet ? 20 : DAUGHTER_CELL_PADDING)}
              y={ly}
              fontSize={12}
              fill="#9d174d"
              fontWeight={600}
              style={{ userSelect: 'none' }}
            >
              {d.display_name.length > 22 ? `${d.display_name.slice(0, 21)}…` : d.display_name}
            </text>
            <text
              x={x + width - DAUGHTER_CELL_PADDING}
              y={ly}
              fontSize={10}
              fill="#9d174d"
              opacity={0.7}
              textAnchor="end"
              style={{ userSelect: 'none' }}
            >
              {d.birth_year ?? '?'}{!d.is_living ? ' †' : ''}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// --- Main component ---

export function CompactFamilyTree({ people, families, children }: Props) {
  const [scale, setScale] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 0.7 : 1
  );
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const targetScaleRef = useRef(scale);
  const targetPanRef = useRef(pan);
  const currentScaleRef = useRef(scale);
  const currentPanRef = useRef(pan);
  const animFrameRef = useRef<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const data = useMemo(() => ({ people, families, children }), [people, families, children]);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const update = () => setContainerSize({ width: c.clientWidth, height: c.clientHeight });
    update();
    const obs = new ResizeObserver(update);
    obs.observe(c);
    return () => obs.disconnect();
  }, []);

  const layout = useMemo(() => buildCompactLayout(data), [data]);

  const selectedPerson = selectedPersonId
    ? people.find((p) => p.id === selectedPersonId) ?? null
    : null;

  // Animation tick
  useEffect(() => {
    targetScaleRef.current = scale;
    targetPanRef.current = pan;
    const tick = () => {
      const ts = targetScaleRef.current;
      const tp = targetPanRef.current;
      const cs = currentScaleRef.current;
      const cp = currentPanRef.current;
      const newScale = cs + (ts - cs) * 0.18;
      const newPan = {
        x: cp.x + (tp.x - cp.x) * 0.18,
        y: cp.y + (tp.y - cp.y) * 0.18,
      };
      currentScaleRef.current = newScale;
      currentPanRef.current = newPan;
      targetScaleRef.current = newScale;
      targetPanRef.current = newPan;
      setScale(newScale);
      setPan(newPan);

      const sDelta = Math.abs(ts - newScale);
      const pDelta = Math.abs(tp.x - newPan.x) + Math.abs(tp.y - newPan.y);

      if (sDelta > 0.0005 || pDelta > 0.05) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        animFrameRef.current = null;
      }
    };
    const start = () => {
      if (animFrameRef.current === null) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      start();
      const rect = containerRef.current!.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const normalizedDelta =
        e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 100 : e.deltaY;
      const factor = Math.exp(-normalizedDelta * 0.0025);
      const cur = targetScaleRef.current;
      const next = Math.max(0.3, Math.min(2, cur * factor));
      if (next === cur) return;
      targetScaleRef.current = next;
      targetPanRef.current = {
        x: cursorX - ((cursorX - targetPanRef.current.x) / cur) * next,
        y: cursorY - ((cursorY - targetPanRef.current.y) / cur) * next,
      };
    };

    const container = containerRef.current!;
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const next = { x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y };
    setPan(next);
    targetPanRef.current = next;
    currentPanRef.current = next;
  };
  const handleReset = useCallback(() => {
    const next = window.innerWidth < 768 ? 0.7 : 1;
    setScale(next);
    setPan({ x: 0, y: 0 });
    targetScaleRef.current = next;
    targetPanRef.current = { x: 0, y: 0 };
    currentScaleRef.current = next;
    currentPanRef.current = { x: 0, y: 0 };
  }, []);

  const handleExportPng = useCallback(async () => {
    if (isExporting || layout.nodes.length === 0) return;
    setIsExporting(true);
    try {
      const svgString = serializeCompactLayoutToSvg(layout);

      // Giới hạn canvas của trình duyệt:
      //  - Chrome/Edge: width/height tối đa 32767, area tối đa ~268MP.
      //  - Firefox: tối đa 32767 mỗi chiều, area 472907776.
      // Khi vượt, canvas.toBlob() sẽ trả về null → "Xuất PNG thất bại".
      // Ta giảm scale hoặc tile theo trục để luôn nằm trong giới hạn.
      const MAX_DIM = 8192; // an toàn cho mọi trình duyệt kể cả mobile
      const REQUESTED_SCALE = 2;

      const targetWidth = layout.width * REQUESTED_SCALE;
      const targetHeight = layout.height * REQUESTED_SCALE;
      const scale = Math.min(REQUESTED_SCALE, MAX_DIM / layout.width, MAX_DIM / layout.height);
      const finalW = Math.floor(layout.width * scale);
      const finalH = Math.floor(layout.height * scale);

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Không thể render SVG'));
        img.src = svgUrl;
      });
      URL.revokeObjectURL(svgUrl);

      // Vẽ SVG lên canvas đúng cỡ mong muốn (đã kẹp scale).
      const canvas = document.createElement('canvas');
      canvas.width = finalW;
      canvas.height = finalH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas không khả dụng');
      ctx.fillStyle = '#fff7ed';
      ctx.fillRect(0, 0, finalW, finalH);
      ctx.drawImage(img, 0, 0, finalW, finalH);

      // Xuất PNG qua toBlob. Một số trình duyệt vẫn fail khi area quá lớn
      // (vd. iPad Safari cũ) — thử lại với scale thấp hơn trước khi bỏ cuộc.
      let pngBlob: Blob | null = null;
      for (const attempt of [scale, scale / 2, scale / 4, 1]) {
        const aw = Math.max(1, Math.floor(layout.width * attempt));
        const ah = Math.max(1, Math.floor(layout.height * attempt));
        if (aw > MAX_DIM || ah > MAX_DIM) continue;
        const c = document.createElement('canvas');
        c.width = aw;
        c.height = ah;
        const cx = c.getContext('2d');
        if (!cx) continue;
        cx.fillStyle = '#fff7ed';
        cx.fillRect(0, 0, aw, ah);
        cx.drawImage(img, 0, 0, aw, ah);
        pngBlob = await new Promise<Blob | null>((resolve) =>
          c.toBlob((b) => resolve(b), 'image/png'),
        );
        if (pngBlob) break;
      }

      if (!pngBlob) {
        // Fallback cuối: tải SVG về máy thay vì PNG.
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const svgName = `cay-gia-pha-compact-${yyyy}-${mm}-${dd}.svg`;
        const fallbackUrl = URL.createObjectURL(svgBlob);
        const fallback = await fetch(svgString).then((r) => r.blob()).catch(() => svgBlob);
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

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const fileName = `cay-gia-pha-compact-${yyyy}-${mm}-${dd}.png`;

      const url = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      // Cảnh báo thân thiện nếu đã phải giảm chất lượng.
      if (scale < REQUESTED_SCALE) {
        toast.info(
          `Cây quá lớn nên ảnh xuất ở mức ${Math.round(scale * 100)}% (thay vì ${REQUESTED_SCALE * 100}%).`,
        );
      }
    } catch (err) {
      console.error('[CompactFamilyTree] export PNG failed', err);
      toast.error('Xuất ảnh thất bại. Vui lòng thử lại hoặc dùng SVG.');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, layout]);

  if (layout.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Chưa có dữ liệu để hiển thị cây gia phả compact.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/40 p-2">
        <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium">Cây compact (gộp vợ chồng & con gái)</span>
        <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
          {people.length} người · {families.length} gia đình
        </span>

        <div className="ml-auto flex items-center gap-1 rounded-md border bg-background p-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale((s) => Math.max(0.3, s - 0.1))} aria-label="Thu nhỏ">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs leading-none">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale((s) => Math.min(2, s + 0.1))} aria-label="Phóng to">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset} aria-label="Đặt lại">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleExportPng}
            disabled={isExporting}
            aria-label="Xuất ảnh PNG"
            title="Xuất ảnh PNG"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-[70vh] min-h-[560px] select-none overflow-hidden rounded-lg border bg-muted/30"
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
          touchAction: 'none',
          backgroundImage: 'url(/tree_center26.png)',
          backgroundSize: '75%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#fff7ed',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => setIsPanning(false)}
      >
        <svg width="100%" height="100%" aria-label="Cây gia phả compact">
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            <g transform={`translate(${layout.offsetX}, 0)`}>
              {layout.connections.map((c) => (
                <path
                  key={c.id}
                  d={`M ${c.x1} ${c.y1} L ${c.x1} ${(c.y1 + c.y2) / 2} L ${c.x2} ${(c.y1 + c.y2) / 2} L ${c.x2} ${c.y2}`}
                  fill="none"
                  stroke="#eab308"
                  strokeWidth={2.5}
                />
              ))}
              {layout.nodes.map((node) => {
                if (node.kind === 'couple') {
                  return <CompactCoupleNodeView key={`c-${node.id}`} node={node} onSelect={(p) => setSelectedPersonId(p.id)} />;
                }
                if (node.kind === 'son') {
                  return <CompactSonNodeView key={`s-${node.id}`} node={node} onSelect={(p) => setSelectedPersonId(p.id)} />;
                }
                return <CompactDaughterCellView key={`d-${node.id}`} node={node} />;
              })}
            </g>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-3 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-[#fef3c7] ring-1 ring-[#b45309]"></span>
          Ô couple (chồng + các vợ)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-[#eff6ff] ring-1 ring-[#60a5fa]"></span>
          Con trai
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-[#fff1f2] ring-1 ring-[#f472b6]"></span>
          Ô gộp con gái (chỉ liệt kê)
        </span>
      </div>

      {selectedPerson && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <h3 className="font-semibold">{selectedPerson.display_name}</h3>
              <p className="text-sm text-muted-foreground">
                Đời {selectedPerson.generation}
                {selectedPerson.chi ? ` · Chi ${selectedPerson.chi}` : ''}
                {!selectedPerson.is_living ? ' · Đã mất' : ''}
              </p>
            </div>
            <Button asChild size="sm">
              <Link href={`/thanh-vien/${selectedPerson.id}`}>Xem chi tiết</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
