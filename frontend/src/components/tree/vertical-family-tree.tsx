/**
 * @project NguyenDinhHoaNgai
 * @file src/components/tree/vertical-family-tree.tsx
 * @description Vertical family tree view:
 *              - Đời 1 → 5: giao diện giống hệt compact (ô couple + ô con gái gộp).
 *              - Đời 6 trở đi: tông màu earthy ấm (nâu-wheat, amber nhạt, hồng phấn),
 *                mỗi người = 1 cột tên viết dọc, các cột cạnh nhau từ trái qua phải,
 *                "Đời N" ở cuối ô. Gap giữa các cột / giữa các đời / giữa các nhánh
 *                được điều chỉnh nhỏ hơn so với đời 1-5 cho phù hợp kích thước ô.
 * @version 1.1.0
 * @updated 2026-09-06
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ChevronsDownUp,
  Download,
  GitBranch,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Child, Family, Person } from '@/types';
import { useTreeExportPng } from '@/hooks/use-tree-export-png';
import { serializeVerticalLayoutToSvg } from '@/components/tree/vertical-svg-serializer';

interface Props {
  people: Person[];
  families: Family[];
  children: Child[];
}

// ===== Compact-style constants (gen 1-5) — giống compact-family-tree =====
// Đợt 9: giảm gap ngang thêm (sibling/branch), tăng level gap dọc.
const COUPLE_BOX_WIDTH = 195; // đợt 15: tăng +10 cho tên dài hơn
const COUPLE_BOX_HEIGHT_PER_SPOUSE = 26;
const COUPLE_BOX_HEADER_HEIGHT = 40;
const COUPLE_BOX_PADDING = 8;
const SON_NODE_WIDTH = 178; // đợt 15: tăng +10 cho tên dài hơn
const SON_NODE_HEIGHT = 52;
const DAUGHTER_CELL_WIDTH = 210; // đợt 15: tăng +10 cho tên dài hơn
const DAUGHTER_CELL_ROW_HEIGHT = 18; // đợt 13: sát lại (đồng bộ compact)
const DAUGHTER_CELL_PADDING = 10;
const LEVEL_GAP = 26;
const SIBLING_GAP = 14;
const BRANCH_GAP = 4;

// ===== Vertical-style constants (gen >= 6) =====
/** Ngưỡng chuyển sang view dọc (theo yêu cầu: từ đời 6 trở đi). */
const VERTICAL_FROM_GEN = 6;
/** Bề rộng mỗi cột (1 người = 1 cột). */
const VERTICAL_COLUMN_WIDTH = 36; // đợt 15: tăng +10 (26 → 36) cho tên dài hơn
/** Khoảng cách giữa các cột (gap giữa các người trong cùng 1 ô). */
const VERTICAL_COLUMN_GAP = 8;
/** Chiều cao cho dòng meta "Đời N" ở cuối ô. */
const VERTICAL_META_ROW_HEIGHT = 16;
/** Font size cho tên viết dọc. */
const VERTICAL_FONT_SIZE = 13;
/** Font size cho dòng "Đời N". */
const VERTICAL_META_FONT_SIZE = 11;
/** Padding trong ô couple/son/daughter (lề trái & phải, lề trên & dưới). */
const VERTICAL_PADDING_X = 8;
const VERTICAL_PADDING_Y = 8;
/** Bề rộng tối thiểu của ô couple (đợt 10: giảm 110 → 84 cho couple 1 người gọn hơn; đợt 15: tăng +10 → 74 để cân đối với VERTICAL_COLUMN_WIDTH = 36). */
const VERTICAL_COUPLE_BOX_MIN_WIDTH = 74;
/** Chiều cao cố định của ô couple / son / daughter (đồng đều, dễ nhìn). */
const VERTICAL_BOX_HEIGHT = 210;
/** Khoảng cách giữa các đời đứng cạnh nhau (sibling). */
const VERTICAL_SIBLING_GAP = 4;
/** Khoảng cách giữa các nhánh (giữa các khối family của cùng 1 cha). */
const VERTICAL_BRANCH_GAP = 8;
/** Khoảng cách giữa các đời (level gap) cho đời 6+. */
const VERTICAL_LEVEL_GAP = 18;

// ===== Gen threshold helper =====
function isVerticalStyle(generation: number | null | undefined): boolean {
  return (generation ?? 1) >= VERTICAL_FROM_GEN;
}

// ===== Adaptive gap helpers (đời 6+ dùng gap nhỏ hơn vì ô nhỏ hơn) =====
/** Gap ngang giữa các ô anh em (sibling) trong cùng 1 đời. */
function siblingGapForGen(generation: number): number {
  return isVerticalStyle(generation) ? VERTICAL_SIBLING_GAP : SIBLING_GAP;
}
/** Gap ngang giữa các nhánh (giữa các khối family của cùng 1 cha). */
function branchGapForGen(generation: number): number {
  return isVerticalStyle(generation) ? VERTICAL_BRANCH_GAP : BRANCH_GAP;
}
/** Gap dọc giữa các đời (level). */
function levelGapForGen(generation: number): number {
  return isVerticalStyle(generation) ? VERTICAL_LEVEL_GAP : LEVEL_GAP;
}

// ===== Color palette (gen >= 6) — phân biệt nam/nữ, dễ nhìn =====
// Đợt 11 revert: giữ couple background nâu/wheat như trước (user thấy đẹp).
// Chỉ son/daughter mới phân biệt nam (xanh) / nữ (hồng).
// Couple: nâu cánh gián nhạt (wheat) với viền nâu sienna.
const COLOR_COUPLE_BG = '#f5deb3'; // wheat
const COLOR_COUPLE_BORDER = '#a0522d'; // sienna
// Con trai (độc thân, gender=1): xanh nhạt + viền blue-400.
const COLOR_SON_BG = '#eff6ff'; // blue-50 (đợt 11)
const COLOR_SON_BORDER = '#60a5fa'; // blue-400
// Con gái (độc thân, gender=2): hồng nhạt + viền pink-400.
const COLOR_DAUGHTER_BG = '#fff1f2'; // rose-50 (đợt 11)
const COLOR_DAUGHTER_BORDER = '#f472b6'; // pink-400
// Chữ (tối, tương phản tốt trên nền nhạt).
const COLOR_HUSBAND_TEXT = '#1e3a8a'; // blue-900 (chồng)
const COLOR_WIFE_TEXT = '#9d174d'; // pink-800 (vợ, con gái)
const COLOR_META_TEXT = '#78350f'; // amber-900 (meta "Đời N")

// ===== Node types =====
// Đợt 14: import từ compact-family-tree để đồng bộ cấu trúc layout
// (compactCoupleNode có familyId, anchorId — vertical view không tự định nghĩa nữa).
type CompactNodeKind = 'couple' | 'son' | 'daughter-cell';
import type {
  CompactCoupleNode,
  CompactSonNode,
  CompactDaughterCell,
  CompactNode,
  CompactConnection as Connection,
} from '@/components/tree/compact-family-tree';

// ===== Helper: chiều cao ô couple theo style =====
function getCoupleBoxSize(
  spouseCount: number,
  person: Person,
  spouses: Array<{ person: Person; sortOrder: number }>
): { width: number; height: number } {
  if (!isVerticalStyle(person.generation)) {
    const w = COUPLE_BOX_WIDTH;
    const spouseRows = Math.max(1, spouseCount);
    const h =
      COUPLE_BOX_HEADER_HEIGHT +
      spouseRows * COUPLE_BOX_HEIGHT_PER_SPOUSE +
      COUPLE_BOX_PADDING * 2;
    return { width: w, height: h };
  }
  // Vertical style (gen >= 6): mỗi người (chồng + từng vợ) = 1 cột,
  // các cột cạnh nhau từ trái qua phải. Chiều rộng = số cột × COLUMN_WIDTH + gap.
  const personCount = Math.max(1, 1 + spouses.length); // anchor + spouses
  const w = Math.max(
    VERTICAL_COUPLE_BOX_MIN_WIDTH,
    personCount * VERTICAL_COLUMN_WIDTH +
      Math.max(0, personCount - 1) * VERTICAL_COLUMN_GAP +
      VERTICAL_PADDING_X * 2
  );
  return { width: w, height: VERTICAL_BOX_HEIGHT };
}

function getDaughterCellSize(
  daughterCount: number,
  daughters: Person[]
): { width: number; height: number } {
  if (daughters.length === 0) return { width: 0, height: 0 };
  // Nếu tất cả con gái ở gen < 6 → dùng compact style.
  const firstGen = daughters[0]?.generation ?? 1;
  if (!isVerticalStyle(firstGen)) {
    return {
      width: 195, // đợt 15: đồng bộ với COUPLE_BOX_WIDTH
      height: DAUGHTER_CELL_PADDING * 2 + DAUGHTER_CELL_ROW_HEIGHT * Math.max(1, daughterCount),
    };
  }
  // Vertical style: mỗi con gái = 1 cột, các cột cạnh nhau từ trái qua phải.
  const w =
    daughterCount * VERTICAL_COLUMN_WIDTH +
    Math.max(0, daughterCount - 1) * VERTICAL_COLUMN_GAP +
    VERTICAL_PADDING_X * 2;
  return { width: w, height: VERTICAL_BOX_HEIGHT };
}

function getSonNodeSize(person: Person): { width: number; height: number } {
  if (!isVerticalStyle(person.generation)) {
    return { width: SON_NODE_WIDTH, height: SON_NODE_HEIGHT };
  }
  // Con trai (gen >= 6): 1 người = 1 cột.
  return {
    width: VERTICAL_COLUMN_WIDTH + VERTICAL_PADDING_X * 2,
    height: VERTICAL_BOX_HEIGHT,
  };
}

/** Build layout cho cây vertical */
export function buildVerticalLayout(data: Props): {
  nodes: CompactNode[];
  connections: Connection[];
  width: number;
  height: number;
  offsetX: number;
} {
  const { people, families, children } = data;
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const familiesById = new Map(families.map((family) => [family.id, family]));

  const visibleIds = new Set(people.map((p) => p.id));

  const childToFamily = new Map<string, Family>();
  for (const child of children) {
    if (!childToFamily.has(child.person_id)) {
      const f = familiesById.get(child.family_id);
      if (f) childToFamily.set(child.person_id, f);
    }
  }

  const childrenByFamily = new Map<string, Child[]>();
  for (const child of children) {
    const list = childrenByFamily.get(child.family_id) ?? [];
    list.push(child);
    childrenByFamily.set(child.family_id, list);
  }
  for (const list of childrenByFamily.values()) {
    list.sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      const ca = a.created_at ?? '';
      const cb = b.created_at ?? '';
      if (ca !== cb) return ca.localeCompare(cb);
      return a.person_id.localeCompare(b.person_id);
    });
  }

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

  const roots = people.filter((p) => {
    if (positionedAsSpouse.has(p.id)) return false;
    const parentFamily = childToFamily.get(p.id);
    const parentAnchorId = parentFamily ? familyAnchors.get(parentFamily.id) : undefined;
    return !parentAnchorId || !visibleIds.has(parentAnchorId);
  });

  function getSpousesFor(anchorId: string): Array<{ person: Person; sortOrder: number }> {
    const list = familiesByAnchor.get(anchorId) ?? [];
    const spouses: Array<{ person: Person; sortOrder: number }> = [];
    for (const f of list) {
      const sid = familySpouses.get(f.id);
      if (!sid) continue;
      const p = peopleById.get(sid);
      if (p && !spouses.find((x) => x.person.id === p.id)) {
        spouses.push({ person: p, sortOrder: f.sort_order });
      }
    }
    return spouses;
  }

  const subtreeWidths = new Map<string, number>();
  const calculating = new Set<string>();

  function computeSubtreeWidth(anchorId: string): number {
    const cached = subtreeWidths.get(anchorId);
    if (cached !== undefined) return cached;
    if (calculating.has(anchorId)) {
      const anchor = peopleById.get(anchorId);
      if (!anchor) return COUPLE_BOX_WIDTH;
      return getCoupleBoxSize(getSpousesFor(anchorId).length, anchor, getSpousesFor(anchorId)).width;
    }
    calculating.add(anchorId);

    const anchor = peopleById.get(anchorId);
    if (!anchor) {
      calculating.delete(anchorId);
      return COUPLE_BOX_WIDTH;
    }

    const fams = familiesByAnchor.get(anchorId) ?? [];
    let childrenBlockWidth = 0;
    const anchorGen = anchor.generation ?? 1;

    function familyBlockWidth(fam: Family): number {
      const kids = childrenByFamily.get(fam.id) ?? [];
      const sons = kids.filter((c) => peopleById.get(c.person_id)?.gender === 1);
      const daughters = kids.filter((c) => peopleById.get(c.person_id)?.gender === 2);
      const sonWs = sons.map((s) => {
        const p = peopleById.get(s.person_id);
        if (!p) return SON_NODE_WIDTH;
        if (familiesByAnchor.has(s.person_id)) return computeSubtreeWidth(s.person_id);
        return getSonNodeSize(p).width;
      });
      const dSize = daughters.length > 0
        ? getDaughterCellSize(
            daughters.length,
            daughters.map((d) => peopleById.get(d.person_id)).filter((p): p is Person => !!p)
          )
        : { width: 0, height: 0 };
      // gap phụ thuộc vào đời của cha (anchor)
      const gap = siblingGapForGen(anchorGen);
      return (
        sonWs.reduce((a, b) => a + b, 0) +
        Math.max(0, sonWs.length - 1) * gap +
        (daughters.length > 0 ? branchGapForGen(anchorGen) + dSize.width : 0)
      );
    }

    if (fams.length > 1) {
      const widths = fams.map(familyBlockWidth);
      childrenBlockWidth =
        widths.reduce((a, b) => a + b, 0) +
        Math.max(0, widths.length - 1) * branchGapForGen(anchorGen);
    } else if (fams.length === 1) {
      childrenBlockWidth = familyBlockWidth(fams[0]);
    }

    const spouses = getSpousesFor(anchorId);
    // Nếu không có vợ → subtree chỉ là ô con độc thân.
    // Lưu tối thiểu `getSonNodeSize` để các slot anh em dùng đúng kích thước.
    const nodeSize = getSonNodeSize(anchor);
    const { width: coupleW } = spouses.length === 0
      ? nodeSize
      : getCoupleBoxSize(spouses.length, anchor, spouses);
    const total = spouses.length === 0
      ? Math.max(nodeSize.width, childrenBlockWidth)
      : Math.max(coupleW, childrenBlockWidth);

    calculating.delete(anchorId);
    subtreeWidths.set(anchorId, total);
    return total;
  }

  roots.forEach((r) => computeSubtreeWidth(r.id));

  // Tính subtreeW cho TẤT CẢ node (không chỉ roots) để `subtreeWidths` đầy đủ
  // khi assignFor chạy. Nếu thiếu pass này, các node con không có familiesByAnchor
  // (vd. con trai chưa lập gia đình) sẽ bị fallback SON_NODE_WIDTH sai.
  for (const p of people) {
    if (!familiesByAnchor.has(p.id) && !positionedAsSpouse.has(p.id)) {
      // Node lá (không có con, không có vợ) → subtreeW = nodeSize.width
      subtreeWidths.set(p.id, getSonNodeSize(p).width);
    } else if (subtreeWidths.get(p.id) === undefined) {
      computeSubtreeWidth(p.id);
    }
  }

  // Tính maxCoupleHeight cho mỗi generation
  const maxCoupleHeightByGen = new Map<number, number>();
  for (const person of people) {
    const gen = person.generation ?? 1;
    const spouses = getSpousesFor(person.id);
    const h = getCoupleBoxSize(spouses.length, person, spouses).height;
    if (h > (maxCoupleHeightByGen.get(gen) ?? 0)) {
      maxCoupleHeightByGen.set(gen, h);
    }
  }
  const sortedGens = [...maxCoupleHeightByGen.keys()].sort((a, b) => a - b);
  const levelY = new Map<number, number>();
  let cursorY = 20;
  for (const gen of sortedGens) {
    levelY.set(gen, cursorY);
    cursorY += (maxCoupleHeightByGen.get(gen) ?? 0) + levelGapForGen(gen);
  }

  const xPositions = new Map<string, number>();
  const nodes: CompactNode[] = [];
  const connections: Connection[] = [];

  function assignFor(anchorId: string, startX: number) {
    if (xPositions.has(anchorId)) return;
    const subtreeW = subtreeWidths.get(anchorId) ?? COUPLE_BOX_WIDTH;
    const coupleCenterX = startX + subtreeW / 2;
    const spouses = getSpousesFor(anchorId);
    const anchor = peopleById.get(anchorId);
    if (!anchor) return;

    const { width: cWidth, height: cHeight } = getCoupleBoxSize(spouses.length, anchor, spouses);
    const coupleX = coupleCenterX - cWidth / 2;
    const coupleY = levelY.get(anchor.generation ?? 1) ?? 20;

    xPositions.set(anchorId, startX);
    nodes.push({
      kind: 'couple',
      id: anchorId,
      person: anchor,
      spouses,
      familyId: '', // set sau khi tính fams
      anchorId,
      x: coupleX,
      y: coupleY,
      width: cWidth,
      height: cHeight,
    });

    const fams = familiesByAnchor.get(anchorId) ?? [];
    if (fams.length === 0) return;

    const familyBlocks = fams.map((fam) => {
      const kids = childrenByFamily.get(fam.id) ?? [];
      const sons = kids.filter((c) => peopleById.get(c.person_id)?.gender === 1);
      const daughters = kids.filter((c) => peopleById.get(c.person_id)?.gender === 2);
      const sonWs = sons.map((s) => {
        const p = peopleById.get(s.person_id);
        if (!p) return SON_NODE_WIDTH;
        return subtreeWidths.get(s.person_id) ?? getSonNodeSize(p).width;
      });
      const dSize = daughters.length > 0
        ? getDaughterCellSize(
            daughters.length,
            daughters.map((d) => peopleById.get(d.person_id)).filter((p): p is Person => !!p)
          )
        : { width: 0, height: 0 };
      // gap theo đời của các con (sons/daughters).
      const kidsGen = sons[0]?.person_id
        ? peopleById.get(sons[0].person_id)?.generation
        : daughters[0]?.person_id
        ? peopleById.get(daughters[0].person_id)?.generation
        : (anchor.generation ?? 1) + 1;
      const gap = siblingGapForGen(kidsGen ?? (anchor.generation ?? 1) + 1);
      const w =
        sonWs.reduce((a, b) => a + b, 0) +
        Math.max(0, sons.length - 1) * gap +
        (daughters.length > 0 ? branchGapForGen(kidsGen ?? (anchor.generation ?? 1) + 1) + dSize.width : 0);
      return { fam, sons, daughters, width: w };
    });

    const totalChildrenW =
      familyBlocks.reduce((a, b) => a + b.width, 0) +
      Math.max(0, familyBlocks.length - 1) * branchGapForGen(anchor.generation ?? 1);
    const blockStart = coupleCenterX - totalChildrenW / 2;

    let blockCursor = blockStart;
    familyBlocks.forEach((block, famIdx) => {
      let sonCursor = blockCursor;

      block.sons.forEach((son, sIdx) => {
        const sw = subtreeWidths.get(son.person_id) ?? SON_NODE_WIDTH;
        const sonCenterX = sonCursor + sw / 2;
        const sonPerson = peopleById.get(son.person_id);
        const childGen = sonPerson?.generation ?? (anchor.generation ?? 1) + 1;
      const childY = levelY.get(childGen) ?? (coupleY + cHeight + levelGapForGen(anchor.generation ?? 1));

        if (familiesByAnchor.has(son.person_id)) {
          assignFor(son.person_id, sonCursor);
        } else {
          if (!sonPerson) return;
          const size = getSonNodeSize(sonPerson);
          nodes.push({
            kind: 'son',
            id: son.person_id,
            person: sonPerson,
            familyId: block.fam.id,
            x: sonCenterX - size.width / 2,
            y: childY,
            width: size.width,
            height: size.height,
          });
        }

        connections.push({
          id: `p2s-${anchorId}-${son.person_id}-${famIdx}`,
          x1: coupleCenterX,
          y1: coupleY + cHeight,
          x2: sonCenterX,
          y2: childY,
          type: 'parent-child',
        });

        sonCursor += sw;
        if (sIdx < block.sons.length - 1) sonCursor += siblingGapForGen(sonPerson?.generation ?? anchor.generation ?? 1);
      });

      if (block.daughters.length > 0) {
        let cellStart = blockCursor;
        if (block.sons.length > 0) {
          const sonWsList = block.sons.map((s) => {
            const p = peopleById.get(s.person_id);
            return subtreeWidths.get(s.person_id) ?? (p ? getSonNodeSize(p).width : SON_NODE_WIDTH);
          });
          cellStart =
            blockCursor +
            sonWsList.reduce((a, b) => a + b, 0) +
            Math.max(0, block.sons.length - 1) * siblingGapForGen(anchor.generation ?? 1) +
            branchGapForGen(anchor.generation ?? 1);
        }
        const dDaughters = block.daughters
          .map((d) => peopleById.get(d.person_id))
          .filter((p): p is Person => !!p);
        const dSize = getDaughterCellSize(block.daughters.length, dDaughters);
        const cellCenterX = cellStart + dSize.width / 2;
        const firstSon = block.sons[0] ? peopleById.get(block.sons[0].person_id) : null;
        const cellGen = firstSon?.generation ?? (anchor.generation ?? 1) + 1;
        const cellY = levelY.get(cellGen) ?? (coupleY + cHeight + levelGapForGen(anchor.generation ?? 1));

        nodes.push({
          kind: 'daughter-cell',
          id: block.fam.id,
          familyId: block.fam.id,
          anchorId,
          daughters: dDaughters,
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
      if (famIdx < familyBlocks.length - 1) blockCursor += branchGapForGen(anchor.generation ?? 1);
    });
  }

  let cursor = 0;
  roots.forEach((r) => {
    const rPerson = peopleById.get(r.id);
    assignFor(r.id, cursor);
    // Khoảng cách giữa các roots: subtreeW + gap buffer. Vì gap ngang đã rất
    // nhỏ (đợt 9: VERTICAL_SIBLING_GAP = 4) mà 1 couple độc thân có thể rộng
    // 110px, advance buffer tối thiểu = SUBTREE_MIN_ADVANCE để box không bao
    // giờ overlap khi roots liên tiếp (vd. N1→N2 cách nhau cần ≥ subtreeW + 4).
    const subtreeW = subtreeWidths.get(r.id) ?? COUPLE_BOX_WIDTH;
    const gapBuffer = Math.max(siblingGapForGen(rPerson?.generation ?? 1) * 16, 120);
    cursor += subtreeW + gapBuffer;
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

// ===== Render helpers =====

/** Wrap tên compact-style thành tối đa 2 dòng */
function wrapCompactName(name: string): string[] {
  if (name.length <= 22) return [name];
  const mid = Math.ceil(name.length / 2);
  let cut = name.lastIndexOf(' ', mid);
  if (cut < 0) cut = mid;
  return [name.slice(0, cut).trim(), name.slice(cut).trim()];
}

// ===== Render: Compact Couple (gen 1-5) — giống compact-family-tree =====
function CompactStyleCoupleNodeView({
  node,
  onSelect,
}: {
  node: CompactCoupleNode;
  onSelect: (p: Person) => void;
}) {
  const { person, spouses, x, y, width, height } = node;
  const handleClick = () => onSelect(person);

  const lines = wrapCompactName(person.display_name);
  const headerH = COUPLE_BOX_HEADER_HEIGHT;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Xem ${person.display_name} và các vợ/chồng`}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        // Sáng viền khi hover để user biết click được.
        const rect = (e.currentTarget as SVGGElement).querySelector('rect');
        if (rect) rect.setAttribute('stroke-width', '2.5');
      }}
      onMouseLeave={(e) => {
        const rect = (e.currentTarget as SVGGElement).querySelector('rect');
        if (rect) rect.setAttribute('stroke-width', '1.5');
      }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        fill="#fef3c7"
        stroke="#b45309"
        strokeWidth={1.5}
      />
      <path
        d={`M ${x} ${y + 8} Q ${x} ${y} ${x + 8} ${y} L ${x + width - 8} ${y} Q ${x + width} ${y} ${x + width} ${y + 8} L ${x + width} ${y + headerH} L ${x} ${y + headerH} Z`}
        fill="#b45309"
      />

      {lines.length === 1 ? (
        <text
          x={x + width / 2}
          y={y + 24}
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
          <text x={x + width / 2} y={y + 18} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff7ed" style={{ userSelect: 'none' }}>
            {lines[0]}
          </text>
          <text x={x + width / 2} y={y + 32} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff7ed" style={{ userSelect: 'none' }}>
            {lines[1]}
          </text>
        </>
      )}

      <text
        x={x + width - COUPLE_BOX_PADDING}
        y={y + headerH - 5}
        textAnchor="end"
        fontSize={9}
        fill="#fde68a"
        style={{ userSelect: 'none' }}
      >
        {`Đời ${person.generation}`}
        {person.tree_label ? ` · ${person.tree_label}` : ''}
      </text>

      {spouses.map((entry, idx) => {
        const { person: spouse, sortOrder } = entry;
        const lineY = y + headerH + COUPLE_BOX_PADDING + idx * COUPLE_BOX_HEIGHT_PER_SPOUSE + 18;
        const baseLabel = person.gender === 2 ? 'Chồng' : 'Vợ';
        const label = spouses.length === 1 ? baseLabel : `${baseLabel} ${sortOrder}`;
        return (
          <g key={spouse.id}>
            <text x={x + COUPLE_BOX_PADDING} y={lineY} fontSize={12} fontWeight={600} fill="#78350f" style={{ userSelect: 'none' }}>
              <tspan fontSize={9} fill="#9a3412" fontWeight={600}>{label}: </tspan>
              {spouse.display_name.length > 22 ? `${spouse.display_name.slice(0, 21)}…` : spouse.display_name}
            </text>
            <text x={x + width - COUPLE_BOX_PADDING} y={lineY} fontSize={10} fill="#92400e" textAnchor="end" style={{ userSelect: 'none' }}>
              {spouse.birth_year ?? ''}{!spouse.is_living ? ' †' : ''}
            </text>
          </g>
        );
      })}

      {spouses.length === 0 && (
        <text
          x={x + width / 2}
          y={y + headerH + COUPLE_BOX_PADDING + 18}
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

// ===== Render: Vertical Couple (gen >= 6) — view dọc mới =====
/**
 * Tên viết dọc trong 1 cột, các cột cạnh nhau từ trái qua phải.
 * - Chồng ở cột 1 (trái cùng).
 * - Vợ 1, vợ 2, ... ở các cột tiếp theo.
 * - "Đời N" hiển thị ở dòng cuối của ô (ngang, màu xám).
 * - Background màu nâu.
 */
function VerticalStyleCoupleNodeView({
  node,
  onSelect,
}: {
  node: CompactCoupleNode;
  onSelect: (p: Person) => void;
}) {
  const { person, spouses, x, y, width, height } = node;
  const handleClick = () => onSelect(person);

  // Danh sách hiển thị theo thứ tự: chồng → vợ 1 → vợ 2 → ...
  // Đảm bảo luôn có 1 cột dù không có vợ (neo giữa cột).
  const persons: Array<{ person: Person; isHusband: boolean }> = [
    { person, isHusband: true },
    ...spouses.map((s) => ({ person: s.person, isHusband: false })),
  ];

  const innerW = width - VERTICAL_PADDING_X * 2;
  const innerH = height - VERTICAL_PADDING_Y * 2;
  const columnGapTotal = Math.max(0, persons.length - 1) * VERTICAL_COLUMN_GAP;
  const columnW = Math.max(8, (innerW - columnGapTotal) / Math.max(1, persons.length));
  // Chiều cao vùng viết tên (trừ dòng meta ở cuối).
  const metaH = VERTICAL_META_ROW_HEIGHT;
  const nameAreaH = innerH - metaH;
  const columnBaseY = y + VERTICAL_PADDING_Y + nameAreaH; // đáy của vùng tên

  // Đợt 11: chỉ son/daughter phân biệt xanh/hồng; couple giữ màu wheat.
  const coupleBg = COLOR_COUPLE_BG;
  const coupleBorder = COLOR_COUPLE_BORDER;

  // Clip path id duy nhất cho mỗi node để text dài không tràn ra ngoài box.
  const clipId = `vclip-couple-${node.id}`;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Xem ${person.display_name} và các vợ/chồng`}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      // Hover: sáng viền + đổi cursor sang pointer (đã có). Dùng inline style
      // vì SVG <g> không hỗ trợ pseudo-class :hover trong React.
      onMouseEnter={(e) => {
        const rect = (e.currentTarget as SVGGElement).querySelector('rect');
        if (rect) rect.setAttribute('stroke-width', '2.5');
      }}
      onMouseLeave={(e) => {
        const rect = (e.currentTarget as SVGGElement).querySelector('rect');
        if (rect) rect.setAttribute('stroke-width', '1.5');
      }}
    >
      {/* Clip path: giới hạn vùng vẽ text trong box (tránh tên dài tràn lên connection). */}
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} rx={6} />
        </clipPath>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={coupleBg}
        stroke={coupleBorder}
        strokeWidth={1.5}
      />

      <g clipPath={`url(#${clipId})`}>
        {persons.map((entry, idx) => {
          const cx = x + VERTICAL_PADDING_X + idx * (columnW + VERTICAL_COLUMN_GAP) + columnW / 2;
          const name = entry.person.display_name;
          const color = entry.isHusband ? COLOR_HUSBAND_TEXT : COLOR_WIFE_TEXT;
          // Xoay -90 để chữ chạy từ dưới lên trên; neo tâm ở giữa cột.
          return (
            <g key={entry.person.id}>
              <text
                x={cx}
                y={columnBaseY}
                textAnchor="start"
                fontSize={VERTICAL_FONT_SIZE}
                fontWeight={700}
                fill={color}
                transform={`rotate(-90, ${cx}, ${columnBaseY})`}
                style={{ userSelect: 'none' }}
              >
                {name}
              </text>
            </g>
          );
        })}
      </g>

      {/* Hint "(chưa rõ vợ/chồng)" nếu couple không có spouse — đồng bộ với compact. */}
      {spouses.length === 0 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 4}
          textAnchor="middle"
          fontSize={9}
          fill={COLOR_META_TEXT}
          fontStyle="italic"
          opacity={0.7}
          style={{ userSelect: 'none' }}
        >
          (chưa rõ vợ/chồng)
        </text>
      )}

      {/* Dòng "Đời N" + Chi/tree_label ở cuối ô (ngang, canh giữa). */}
      <text
        x={x + width / 2}
        y={y + height - 4}
        textAnchor="middle"
        fontSize={VERTICAL_META_FONT_SIZE}
        fontWeight={500}
        fontStyle="italic"
        fill={COLOR_META_TEXT}
        style={{ userSelect: 'none' }}
      >
        {`Đời ${person.generation ?? ''}${person.tree_label ? ` · ${person.tree_label}` : person.chi ? ` · Chi ${person.chi}` : ''}`}
      </text>
    </g>
  );
}

function CompactStyleCoupleNodeRouter({ node, onSelect }: { node: CompactCoupleNode; onSelect: (p: Person) => void }) {
  if (isVerticalStyle(node.person.generation)) {
    return <VerticalStyleCoupleNodeView node={node} onSelect={onSelect} />;
  }
  return <CompactStyleCoupleNodeView node={node} onSelect={onSelect} />;
}

// ===== Render: Compact Son (gen 1-5) — giống compact-family-tree =====
function CompactStyleSonNodeView({
  node,
  onSelect,
}: {
  node: CompactSonNode;
  onSelect: (p: Person) => void;
}) {
  const { person, x, y, width, height } = node;
  const isMale = person.gender === 1;
  const fill = isMale ? '#eff6ff' : '#fff1f2';
  const stroke = isMale ? '#60a5fa' : '#f472b6';
  const centerX = x + width / 2;
  const lines = wrapCompactName(person.display_name);

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Xem ${person.display_name}`}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(person)}
    >
      <rect x={x} y={y} width={width} height={height} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {lines.length === 1 ? (
        <text x={centerX} y={y + 22} textAnchor="middle" fontSize={13} fontWeight={600} fill="#1f2937" style={{ userSelect: 'none' }}>
          {lines[0]}
        </text>
      ) : (
        <>
          <text x={centerX} y={y + 18} textAnchor="middle" fontSize={12} fontWeight={600} fill="#1f2937" style={{ userSelect: 'none' }}>
            {lines[0]}
          </text>
          <text x={centerX} y={y + 32} textAnchor="middle" fontSize={12} fontWeight={600} fill="#1f2937" style={{ userSelect: 'none' }}>
            {lines[1]}
          </text>
        </>
      )}
      <text x={centerX} y={y + height - 8} textAnchor="middle" fontSize={10} fill={isMale ? '#60a5fa' : '#f472b6'} style={{ userSelect: 'none' }}>
        {`Đời ${person.generation}`}{person.birth_year ? ` · ${person.birth_year}` : ''}{!person.is_living ? ' †' : ''}
      </text>
    </g>
  );
}

// ===== Render: Vertical Son (gen >= 6) — view dọc =====
/**
 * Con trai (gen >= 6): 1 cột, tên viết dọc, "Đời N" ở cuối ô.
 */
function VerticalStyleSonNodeView({
  node,
  onSelect,
}: {
  node: CompactSonNode;
  onSelect: (p: Person) => void;
}) {
  const { person, x, y, width, height } = node;
  const isMale = person.gender === 1;
  const textColor = isMale ? COLOR_HUSBAND_TEXT : COLOR_WIFE_TEXT;
  const bgColor = isMale ? COLOR_SON_BG : COLOR_DAUGHTER_BG;
  const borderColor = isMale ? COLOR_SON_BORDER : COLOR_DAUGHTER_BORDER;

  const innerW = width - VERTICAL_PADDING_X * 2;
  const innerH = height - VERTICAL_PADDING_Y * 2;
  const metaH = VERTICAL_META_ROW_HEIGHT;
  const nameAreaH = innerH - metaH;
  const columnBaseY = y + VERTICAL_PADDING_Y + nameAreaH;

  // Clip path id duy nhất cho mỗi node để text dài không tràn ra ngoài box.
  const clipId = `vclip-son-${node.id}`;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Xem ${person.display_name}`}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(person)}
      onMouseEnter={(e) => {
        const rect = (e.currentTarget as SVGGElement).querySelector('rect');
        if (rect) rect.setAttribute('stroke-width', '2.2');
      }}
      onMouseLeave={(e) => {
        const rect = (e.currentTarget as SVGGElement).querySelector('rect');
        if (rect) rect.setAttribute('stroke-width', '1.2');
      }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} rx={6} />
        </clipPath>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={1.2}
      />
      <g clipPath={`url(#${clipId})`}>
        <text
          x={x + width / 2}
          y={columnBaseY}
          textAnchor="start"
          fontSize={VERTICAL_FONT_SIZE}
          fontWeight={700}
          fill={textColor}
          transform={`rotate(-90, ${x + width / 2}, ${columnBaseY})`}
          style={{ userSelect: 'none' }}
        >
          {person.display_name}
        </text>
      </g>
      <text
        x={x + width / 2}
        y={y + height - 4}
        textAnchor="middle"
        fontSize={VERTICAL_META_FONT_SIZE}
        fontWeight={500}
        fontStyle="italic"
        fill={COLOR_META_TEXT}
        style={{ userSelect: 'none' }}
      >
        {`Đời ${person.generation ?? ''}`}
      </text>
    </g>
  );
}

function CompactStyleSonNodeRouter({ node, onSelect }: { node: CompactSonNode; onSelect: (p: Person) => void }) {
  if (isVerticalStyle(node.person.generation)) {
    return <VerticalStyleSonNodeView node={node} onSelect={onSelect} />;
  }
  return <CompactStyleSonNodeView node={node} onSelect={onSelect} />;
}

// ===== Render: Compact Daughter Cell (gen 1-5) — giống compact-family-tree =====
function CompactStyleDaughterCellView({ node }: { node: CompactDaughterCell }) {
  const { daughters, x, y, width, height } = node;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={8} fill="#fff1f2" stroke="#f472b6" strokeWidth={1.2} />
      {daughters.map((d, idx) => {
        const ly = y + DAUGHTER_CELL_PADDING + idx * DAUGHTER_CELL_ROW_HEIGHT + DAUGHTER_CELL_ROW_HEIGHT / 2 + 4;
        if (ly + 4 > y + height) return null;
        const showBullet = daughters.length > 1;
        return (
          <g key={d.id}>
            {showBullet && <circle cx={x + 12} cy={ly - 4} r={2} fill="#ec4899" />}
            <text x={x + (showBullet ? 20 : DAUGHTER_CELL_PADDING)} y={ly} fontSize={12} fill="#9d174d" fontWeight={600} style={{ userSelect: 'none' }}>
              {d.display_name.length > 22 ? `${d.display_name.slice(0, 21)}…` : d.display_name}
            </text>
            <text x={x + width - DAUGHTER_CELL_PADDING} y={ly} fontSize={10} fill="#9d174d" opacity={0.7} textAnchor="end" style={{ userSelect: 'none' }}>
              {d.birth_year ?? '?'}{!d.is_living ? ' †' : ''}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ===== Render: Vertical Daughter Cell (gen >= 6) — view dọc =====
/**
 * Ô gộp con gái (gen >= 6): mỗi con gái = 1 cột, tên viết dọc trong cột,
 * các cột cạnh nhau từ trái qua phải. "Đời N" ở cuối ô.
 */
function VerticalStyleDaughterCellView({ node, onSelect }: { node: CompactDaughterCell; onSelect: (p: Person) => void }) {
  const { daughters, x, y, width, height } = node;

  const innerW = width - VERTICAL_PADDING_X * 2;
  const innerH = height - VERTICAL_PADDING_Y * 2;
  const metaH = VERTICAL_META_ROW_HEIGHT;
  const nameAreaH = innerH - metaH;
  const columnGapTotal = Math.max(0, daughters.length - 1) * VERTICAL_COLUMN_GAP;
  const columnW = Math.max(8, (innerW - columnGapTotal) / Math.max(1, daughters.length));
  const columnBaseY = y + VERTICAL_PADDING_Y + nameAreaH;

  // Clip path id duy nhất cho mỗi node để text dài không tràn ra ngoài box.
  const clipId = `vclip-daughter-${node.id}`;

  return (
    <g
      onClick={(e) => {
        // Click vào nền ô không mở chi tiết; click từng cột sẽ mở detail của con đó.
        e.stopPropagation();
      }}
      onMouseEnter={(e) => {
        const rect = (e.currentTarget as SVGGElement).querySelector('rect');
        if (rect) rect.setAttribute('stroke-width', '2.2');
      }}
      onMouseLeave={(e) => {
        const rect = (e.currentTarget as SVGGElement).querySelector('rect');
        if (rect) rect.setAttribute('stroke-width', '1.2');
      }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} rx={6} />
        </clipPath>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={COLOR_DAUGHTER_BG}
        stroke={COLOR_DAUGHTER_BORDER}
        strokeWidth={1.2}
      />
      <g clipPath={`url(#${clipId})`}>
        {daughters.map((d, idx) => {
          const cx = x + VERTICAL_PADDING_X + idx * (columnW + VERTICAL_COLUMN_GAP) + columnW / 2;
          return (
            <g
              key={d.id}
              role="button"
              tabIndex={0}
              aria-label={`Xem ${d.display_name}`}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(d);
              }}
            >
              <text
                x={cx}
                y={columnBaseY}
                textAnchor="start"
                fontSize={VERTICAL_FONT_SIZE}
                fontWeight={700}
                fill={COLOR_WIFE_TEXT}
                transform={`rotate(-90, ${cx}, ${columnBaseY})`}
                style={{ userSelect: 'none' }}
              >
                {d.display_name}
              </text>
            </g>
          );
        })}
      </g>
      {/* "Đời N" ở cuối ô (ngang, canh giữa) — lấy đời của anchor (cha). */}
      {daughters[0] && (
        <text
          x={x + width / 2}
          y={y + height - 4}
          textAnchor="middle"
          fontSize={VERTICAL_META_FONT_SIZE}
          fontWeight={500}
          fontStyle="italic"
          fill={COLOR_META_TEXT}
          style={{ userSelect: 'none' }}
        >
          {`Đời ${daughters[0].generation ?? ''}`}
        </text>
      )}
    </g>
  );
}

function DaughterCellRouter({ node, onSelect }: { node: CompactDaughterCell; onSelect: (p: Person) => void }) {
  const isVertical = node.daughters.some((d) => isVerticalStyle(d.generation));
  if (isVertical) {
    return <VerticalStyleDaughterCellView node={node} onSelect={onSelect} />;
  }
  return <CompactStyleDaughterCellView node={node} />;
}

// ===== Main component =====

export function VerticalFamilyTree({ people, families, children }: Props) {
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

  const layout = useMemo(() => buildVerticalLayout(data), [data]);

  const selectedPerson = selectedPersonId
    ? people.find((p) => p.id === selectedPersonId) ?? null
    : null;

  useEffect(() => {
    targetScaleRef.current = scale;
    targetPanRef.current = pan;
    const tick = () => {
      const ts = targetScaleRef.current;
      const tp = targetPanRef.current;
      const cs = currentScaleRef.current;
      const cp = currentPanRef.current;
      const newScale = cs + (ts - cs) * 0.18;
      const newPan = { x: cp.x + (tp.x - cp.x) * 0.18, y: cp.y + (tp.y - cp.y) * 0.18 };
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
      if (animFrameRef.current === null) animFrameRef.current = requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      start();
      const rect = containerRef.current!.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const normalizedDelta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 100 : e.deltaY;
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

    // Touch handlers for mobile pan & pinch-to-zoom
    const TOUCH_PINCH_THRESHOLD = 2;
    const TOUCH_MOVE_THRESHOLD = 6;
    let pinchStart: {
      distance: number;
      centerX: number;
      centerY: number;
      scale: number;
      pan: { x: number; y: number };
    } | null = null;
    let touchPanStart: { x: number; y: number; pan: { x: number; y: number } } | null = null;
    let touchMoved = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === TOUCH_PINCH_THRESHOLD) {
        pinchStart = {
          distance: Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          ),
          centerX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          centerY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
          scale: targetScaleRef.current,
          pan: { ...targetPanRef.current },
        };
        touchPanStart = null;
        touchMoved = false;
        return;
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchPanStart = {
          x: touch.clientX,
          y: touch.clientY,
          pan: { ...targetPanRef.current },
        };
        touchMoved = false;
        pinchStart = null;
        return;
      }

      touchPanStart = null;
      pinchStart = null;
      touchMoved = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (pinchStart && e.touches.length === TOUCH_PINCH_THRESHOLD) {
        e.preventDefault();
        const [t1, t2] = Array.from(e.touches);
        const cx = (t1.clientX + t2.clientX) / 2;
        const cy = (t1.clientY + t2.clientY) / 2;
        const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (distance < 1) return;
        const ratio = distance / pinchStart.distance;
        const nextScale = Math.min(2, Math.max(0.3, pinchStart.scale * ratio));
        const rect = container.getBoundingClientRect();
        const pointX = cx - rect.left;
        const pointY = cy - rect.top;
        const worldX = (pointX - pinchStart.pan.x) / pinchStart.scale;
        const worldY = (pointY - pinchStart.pan.y) / pinchStart.scale;
        const nextPan = {
          x: pointX - worldX * nextScale,
          y: pointY - worldY * nextScale,
        };
        targetScaleRef.current = nextScale;
        targetPanRef.current = nextPan;
        currentScaleRef.current = nextScale;
        currentPanRef.current = nextPan;
        setScale(nextScale);
        setPan(nextPan);
        touchPanStart = null;
        return;
      }

      if (!touchPanStart || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const dx = touch.clientX - touchPanStart.x;
      const dy = touch.clientY - touchPanStart.y;

      if (!touchMoved) {
        if (Math.hypot(dx, dy) < TOUCH_MOVE_THRESHOLD) return;
        touchMoved = true;
      }

      e.preventDefault();
      const nextPan = { x: touchPanStart.pan.x + dx, y: touchPanStart.pan.y + dy };
      targetPanRef.current = nextPan;
      currentPanRef.current = nextPan;
      setPan(nextPan);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        pinchStart = null;
        touchPanStart = null;
        touchMoved = false;
        return;
      }

      if (e.touches.length < TOUCH_PINCH_THRESHOLD) {
        pinchStart = null;
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchPanStart = {
          x: touch.clientX,
          y: touch.clientY,
          pan: { ...targetPanRef.current },
        };
        touchMoved = false;
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
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

  // Đợt 12: dùng chung hook xuất ảnh PNG với compact view.
  const serializeSvg = useCallback(
    () => serializeVerticalLayoutToSvg(layout),
    [layout],
  );
  const { isExporting, exportPng } = useTreeExportPng({
    serializeSvg,
    width: layout.width,
    height: layout.height,
    fileNamePrefix: 'cay-gia-pha-vertical',
  });

  if (layout.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Chưa có dữ liệu để hiển thị cây gia phả dọc.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/40 p-2">
        <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium">Cây dọc (đời 1-5: compact · đời 6+: rải chữ dọc)</span>
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
            onClick={exportPng}
            disabled={isExporting}
            aria-label="Xuất ảnh PNG"
            title="Tải cây dọc dưới dạng ảnh PNG (hoặc SVG nếu quá lớn)"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
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
        <svg width="100%" height="100%" aria-label="Cây gia phả dọc">
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
                  return <CompactStyleCoupleNodeRouter key={`c-${node.id}`} node={node} onSelect={(p) => setSelectedPersonId(p.id)} />;
                }
                if (node.kind === 'son') {
                  return <CompactStyleSonNodeRouter key={`s-${node.id}`} node={node} onSelect={(p) => setSelectedPersonId(p.id)} />;
                }
                return <DaughterCellRouter key={`d-${node.id}`} node={node} onSelect={(p) => setSelectedPersonId(p.id)} />;
              })}
            </g>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-3 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-[#fef3c7] ring-1 ring-[#b45309]"></span>
          Ô couple (đời 1-5)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-[#f5deb3] ring-1 ring-[#a0522d]"></span>
          Ô couple (đời 6+, nền nâu-wheat)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-[#eff6ff] ring-1 ring-[#60a5fa]"></span>
          Con trai (1-5)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-[#fef3c7] ring-1 ring-[#d97706]"></span>
          Con trai (6+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-[#fff1f2] ring-1 ring-[#f472b6]"></span>
          Ô gộp con gái (1-5)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-[#fce7f3] ring-1 ring-[#be185d]"></span>
          Ô gộp con gái (6+)
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
