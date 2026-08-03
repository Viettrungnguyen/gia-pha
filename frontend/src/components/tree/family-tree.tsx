/**
 * @project NguyenDinhHoaNgai
 * @file src/components/tree/family-tree.tsx
 * @description Interactive hierarchical family tree with zoom, pan, filters, collapse and minimap
 * @version 2.0.0
 * @updated 2026-07-24
 */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownFromLine,
  ArrowUpFromLine,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Maximize2,
  Move,
  RotateCcw,
  Search,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Child, Family, Person } from '@/types';

interface Props {
  people: Person[];
  families: Family[];
  children: Child[];
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 96;
const LEVEL_HEIGHT = 175;
const SIBLING_GAP = 20;
const BRANCH_GAP = 60;
const COUPLE_GAP = 16;
const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 100;

type ViewMode = 'all' | 'ancestors' | 'descendants';

interface TreeNodeData {
  person: Person;
  x: number;
  y: number;
  isCollapsed: boolean;
  hasChildren: boolean;
}

interface TreeConnectionData {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'parent-child' | 'couple';
}

interface TreeLayout {
  nodes: TreeNodeData[];
  connections: TreeConnectionData[];
  width: number;
  height: number;
  offsetX: number;
}

interface TreeNodeProps {
  node: TreeNodeData;
  isSelected: boolean;
  onSelect: (person: Person) => void;
  onToggleCollapse: (personId: string) => void;
}

function wrapName(name: string, charsPerLine = 18): [string, string | null] {
  const words = name.trim().split(/\s+/);
  let line1 = '';
  let index = 0;

  for (; index < words.length; index += 1) {
    const next = line1 ? `${line1} ${words[index]}` : words[index];
    if (next.length > charsPerLine && line1) break;
    line1 = next;
  }

  if (index >= words.length) return [line1, null];

  const remaining = words.slice(index).join(' ');
  const line2 =
    remaining.length > charsPerLine
      ? `${remaining.slice(0, charsPerLine - 1)}…`
      : remaining;

  return [line1, line2];
}

function TreeNode({ node, isSelected, onSelect, onToggleCollapse }: TreeNodeProps) {
  const { person, x, y, isCollapsed, hasChildren } = node;
  const isMale = person.gender === 1;
  const nodeBackground = isMale ? '#eff6ff' : '#fff1f2';
  const nodeBorder = isSelected ? '#9a3412' : isMale ? '#60a5fa' : '#f472b6';
  const avatarBackground = isMale ? '#bfdbfe' : '#fecdd3';
  const collapseBorder = isMale ? '#93c5fd' : '#fda4af';
  const words = person.display_name.trim().split(/\s+/);
  const initial = (words.at(-1)?.charAt(0) || '?').toUpperCase();
  const [line1, line2] = wrapName(person.display_name);
  const centerX = x + NODE_WIDTH / 2;
  const nameLine1Y = line2 ? y + 50 : y + 57;
  const meta = [
    `Đời ${person.generation}`,
    person.birth_year ? String(person.birth_year) : null,
    !person.is_living ? '†' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const handleKeyDown = (event: React.KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(person);
    }
  };

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Xem ${person.display_name}`}
      className="outline-none"
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(person)}
      onKeyDown={handleKeyDown}
    >
      <rect
        x={x}
        y={y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={8}
        fill={nodeBackground}
        stroke={nodeBorder}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />

      <circle cx={centerX} cy={y + 24} r={13} fill={avatarBackground} />
      <text
        x={centerX}
        y={y + 29}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill="#1f2937"
        style={{ userSelect: 'none' }}
      >
        {initial}
      </text>

      <text
        x={centerX}
        y={nameLine1Y}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="#1f2937"
        style={{ userSelect: 'none' }}
      >
        {line1}
      </text>

      {line2 && (
        <text
          x={centerX}
          y={y + 65}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill="#1f2937"
          style={{ userSelect: 'none' }}
        >
          {line2}
        </text>
      )}

      {person.tree_label && (
        <text
          x={centerX}
          y={line2 ? y + 80 : y + 73}
          textAnchor="middle"
          fontSize={10}
          fontWeight={700}
          fill="#9a3412"
          fontStyle="italic"
          style={{ userSelect: 'none' }}
        >
          {person.tree_label}
        </text>
      )}

      <text
        x={centerX}
        y={y + NODE_HEIGHT - 9}
        textAnchor="middle"
        fontSize={9}
        fill="#6b7280"
        style={{ userSelect: 'none' }}
      >
        {meta}
      </text>

      {isSelected && (
        <rect
          x={x - 3}
          y={y - 3}
          width={NODE_WIDTH + 6}
          height={NODE_HEIGHT + 6}
          rx={11}
          fill="none"
          stroke="#9a3412"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          opacity={0.65}
          pointerEvents="none"
        />
      )}

      {hasChildren && (
        <g
          role="button"
          tabIndex={0}
          aria-label={isCollapsed ? 'Mở rộng nhánh' : 'Thu gọn nhánh'}
          style={{ cursor: 'pointer' }}
          onClick={(event) => {
            event.stopPropagation();
            onToggleCollapse(person.id);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onToggleCollapse(person.id);
            }
          }}
        >
          <circle
            cx={centerX}
            cy={y + NODE_HEIGHT}
            r={9}
            fill="#ffffff"
            stroke={collapseBorder}
            strokeWidth={1.5}
          />
          <text
            x={centerX}
            y={y + NODE_HEIGHT + 5}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fill="#6b7280"
            style={{ userSelect: 'none' }}
          >
            {isCollapsed ? '+' : '−'}
          </text>
        </g>
      )}
    </g>
  );
}

function TreeConnection({ connection }: { connection: TreeConnectionData }) {
  const { x1, y1, x2, y2, type } = connection;

  if (type === 'couple') {
    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f472b6" strokeWidth={2} />;
  }

  const middleY = y1 + (y2 - y1) / 2;
  return (
    <path
      d={`M ${x1} ${y1} L ${x1} ${middleY} L ${x2} ${middleY} L ${x2} ${y2}`}
      fill="none"
      stroke="#9ca3af"
      strokeWidth={1.5}
    />
  );
}

interface MinimapProps {
  nodes: TreeNodeData[];
  viewport: { x: number; y: number; width: number; height: number };
  treeWidth: number;
  treeHeight: number;
  offsetX: number;
  onViewportClick: (x: number, y: number) => void;
}

function Minimap({
  nodes,
  viewport,
  treeWidth,
  treeHeight,
  offsetX,
  onViewportClick,
}: MinimapProps) {
  const padding = 6;
  const minimapScale = Math.min(
    (MINIMAP_WIDTH - padding * 2) / Math.max(treeWidth, 1),
    (MINIMAP_HEIGHT - padding * 2) / Math.max(treeHeight, 1)
  );
  const originX = (MINIMAP_WIDTH - treeWidth * minimapScale) / 2;
  const originY = (MINIMAP_HEIGHT - treeHeight * minimapScale) / 2;

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left - originX) / minimapScale;
    const y = (event.clientY - rect.top - originY) / minimapScale;
    onViewportClick(x, y);
  };

  return (
    <div
      className="absolute bottom-4 right-4 hidden rounded-lg border bg-background/95 p-2 shadow-lg md:block"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <svg
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        className="cursor-pointer"
        aria-label="Bản đồ thu nhỏ cây gia phả"
        onClick={handleClick}
      >
        <g transform={`translate(${originX}, ${originY}) scale(${minimapScale})`}>
          {nodes.map((node) => (
            <circle
              key={node.person.id}
              cx={node.x + offsetX + NODE_WIDTH / 2}
              cy={node.y + NODE_HEIGHT / 2}
              r={3.5 / minimapScale}
              fill={node.person.gender === 1 ? '#60a5fa' : '#f472b6'}
            />
          ))}
          <rect
            x={viewport.x}
            y={viewport.y}
            width={viewport.width}
            height={viewport.height}
            fill="none"
            stroke="#9a3412"
            strokeWidth={1.5 / minimapScale}
            opacity={0.65}
          />
        </g>
      </svg>
    </div>
  );
}

function buildTreeLayout(
  data: Props,
  collapsedNodes: Set<string>,
  viewMode: ViewMode,
  focusPersonId: string | null,
  filterRootId: string | null
): TreeLayout {
  const { people, families, children } = data;
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const familiesById = new Map(families.map((family) => [family.id, family]));
  const fatherToFamilies = new Map<string, Family[]>();
  const motherToFamilies = new Map<string, Family[]>();
  const childToFamily = new Map<string, Family>();
  const childrenByFamily = new Map<string, Child[]>();

  for (const family of families) {
    if (family.father_id) {
      const entries = fatherToFamilies.get(family.father_id) ?? [];
      entries.push(family);
      fatherToFamilies.set(family.father_id, entries);
    }
    if (family.mother_id) {
      const entries = motherToFamilies.get(family.mother_id) ?? [];
      entries.push(family);
      motherToFamilies.set(family.mother_id, entries);
    }
  }

  for (const child of children) {
    const familyChildren = childrenByFamily.get(child.family_id) ?? [];
    familyChildren.push(child);
    childrenByFamily.set(child.family_id, familyChildren);

    if (!childToFamily.has(child.person_id)) {
      const family = familiesById.get(child.family_id);
      if (family) childToFamily.set(child.person_id, family);
    }
  }

  for (const familyChildren of childrenByFamily.values()) {
    familyChildren.sort((a, b) => a.sort_order - b.sort_order);
  }

  const familyAnchors = new Map<string, string>();
  const familySpouses = new Map<string, string>();
  const anchorToFamilies = new Map<string, Family[]>();

  for (const family of families) {
    const father = family.father_id ? peopleById.get(family.father_id) : undefined;
    const mother = family.mother_id ? peopleById.get(family.mother_id) : undefined;
    let anchorId: string | null = family.father_id ?? family.mother_id;

    if (family.father_id && family.mother_id) {
      const fatherHasParents = childToFamily.has(family.father_id);
      const motherHasParents = childToFamily.has(family.mother_id);

      if (fatherHasParents !== motherHasParents) {
        anchorId = fatherHasParents ? family.father_id : family.mother_id;
      } else if (father?.is_patrilineal !== mother?.is_patrilineal) {
        anchorId = father?.is_patrilineal ? family.father_id : family.mother_id;
      }
    }

    if (!anchorId) continue;

    familyAnchors.set(family.id, anchorId);
    const spouseId =
      family.father_id === anchorId ? family.mother_id : family.father_id;
    if (spouseId && spouseId !== anchorId) familySpouses.set(family.id, spouseId);

    const anchoredFamilies = anchorToFamilies.get(anchorId) ?? [];
    anchoredFamilies.push(family);
    anchorToFamilies.set(anchorId, anchoredFamilies);
  }

  const getParentFamilies = (personId: string) => [
    ...(fatherToFamilies.get(personId) ?? []),
    ...(motherToFamilies.get(personId) ?? []),
  ];

  const getVisiblePeopleIds = () => {
    const visible = new Set<string>();

    if (filterRootId && peopleById.has(filterRootId)) {
      const addWithDescendants = (personId: string) => {
        if (visible.has(personId)) return;
        visible.add(personId);

        for (const family of getParentFamilies(personId)) {
          if (family.father_id) visible.add(family.father_id);
          if (family.mother_id) visible.add(family.mother_id);
          for (const child of childrenByFamily.get(family.id) ?? []) {
            addWithDescendants(child.person_id);
          }
        }
      };

      addWithDescendants(filterRootId);
      return visible;
    }

    if (viewMode === 'ancestors' && focusPersonId && peopleById.has(focusPersonId)) {
      const addAncestors = (personId: string) => {
        if (visible.has(personId)) return;
        visible.add(personId);
        const family = childToFamily.get(personId);
        if (family?.father_id) addAncestors(family.father_id);
        if (family?.mother_id) addAncestors(family.mother_id);
      };

      addAncestors(focusPersonId);
      return visible;
    }

    if (viewMode === 'descendants' && focusPersonId && peopleById.has(focusPersonId)) {
      const addDescendants = (personId: string) => {
        if (visible.has(personId)) return;
        visible.add(personId);

        for (const family of getParentFamilies(personId)) {
          if (family.father_id) visible.add(family.father_id);
          if (family.mother_id) visible.add(family.mother_id);
          for (const child of childrenByFamily.get(family.id) ?? []) {
            addDescendants(child.person_id);
          }
        }
      };

      addDescendants(focusPersonId);
      return visible;
    }

    people.forEach((person) => visible.add(person.id));
    const hidden = new Set<string>();

    const hideBranch = (personId: string) => {
      if (hidden.has(personId)) return;
      hidden.add(personId);

      for (const family of anchorToFamilies.get(personId) ?? []) {
        const spouseId = familySpouses.get(family.id);
        if (spouseId) {
          hidden.add(spouseId);
          visible.delete(spouseId);
        }
        for (const child of childrenByFamily.get(family.id) ?? []) {
          visible.delete(child.person_id);
          hideBranch(child.person_id);
        }
      }
    };

    collapsedNodes.forEach((personId) => hideBranch(personId));

    return visible;
  };

  const visibleIds = getVisiblePeopleIds();
  const visiblePeople = people.filter((person) => visibleIds.has(person.id));

  if (visiblePeople.length === 0) {
    return { nodes: [], connections: [], width: 0, height: 0, offsetX: 0 };
  }

  const positionedAsSpouse = new Set<string>();
  for (const family of families) {
    const anchorId = familyAnchors.get(family.id);
    const spouseId = familySpouses.get(family.id);
    if (
      anchorId &&
      spouseId &&
      visibleIds.has(anchorId) &&
      visibleIds.has(spouseId)
    ) {
      positionedAsSpouse.add(spouseId);
    }
  }

  const getVisibleChildren = (personId: string) => {
    const result: string[] = [];

    for (const family of anchorToFamilies.get(personId) ?? []) {
      for (const child of childrenByFamily.get(family.id) ?? []) {
        if (
          visibleIds.has(child.person_id) &&
          !positionedAsSpouse.has(child.person_id) &&
          !result.includes(child.person_id)
        ) {
          result.push(child.person_id);
        }
      }
    }

    return result;
  };

  const getAllChildren = (personId: string) => {
    const result = new Set<string>();
    for (const family of anchorToFamilies.get(personId) ?? []) {
      for (const child of childrenByFamily.get(family.id) ?? []) {
        if (peopleById.has(child.person_id)) result.add(child.person_id);
      }
    }
    return [...result];
  };

  const getVisibleSpouses = (personId: string) => {
    const spouses: string[] = [];
    for (const family of anchorToFamilies.get(personId) ?? []) {
      const spouseId = familySpouses.get(family.id);
      if (spouseId && visibleIds.has(spouseId) && !spouses.includes(spouseId)) {
        spouses.push(spouseId);
      }
    }
    return spouses;
  };

  const roots: string[] = [];
  for (const person of visiblePeople) {
    if (positionedAsSpouse.has(person.id)) continue;
    const parentFamily = childToFamily.get(person.id);
    const parentAnchorId = parentFamily
      ? familyAnchors.get(parentFamily.id)
      : undefined;
    if (!parentAnchorId || !visibleIds.has(parentAnchorId)) {
      roots.push(person.id);
    }
  }

  if (roots.length === 0) {
    const fallbackRoot = visiblePeople.find(
      (person) => !positionedAsSpouse.has(person.id)
    );
    if (fallbackRoot) roots.push(fallbackRoot.id);
  }

  const siblingGap = (firstId: string, secondId: string) => {
    const firstHasChildren =
      !collapsedNodes.has(firstId) && getVisibleChildren(firstId).length > 0;
    const secondHasChildren =
      !collapsedNodes.has(secondId) && getVisibleChildren(secondId).length > 0;
    return firstHasChildren || secondHasChildren ? BRANCH_GAP : SIBLING_GAP;
  };

  const subtreeWidths = new Map<string, number>();
  const calculatingWidths = new Set<string>();

  const computeSubtreeWidth = (personId: string): number => {
    const cached = subtreeWidths.get(personId);
    if (cached !== undefined) return cached;
    if (calculatingWidths.has(personId)) return NODE_WIDTH;

    calculatingWidths.add(personId);
    const spouses = getVisibleSpouses(personId);
    const visibleChildren = collapsedNodes.has(personId)
      ? []
      : getVisibleChildren(personId);
    const coupleWidth = NODE_WIDTH + spouses.length * (COUPLE_GAP + NODE_WIDTH);
    let childrenWidth = 0;

    visibleChildren.forEach((childId, index) => {
      childrenWidth += computeSubtreeWidth(childId);
      if (index < visibleChildren.length - 1) {
        childrenWidth += siblingGap(childId, visibleChildren[index + 1]);
      }
    });

    const width = Math.max(coupleWidth, childrenWidth);
    calculatingWidths.delete(personId);
    subtreeWidths.set(personId, width);
    return width;
  };

  roots.forEach(computeSubtreeWidth);

  const xPositions = new Map<string, number>();
  const assignedPeople = new Set<string>();

  const assignPositions = (personId: string, startX: number) => {
    if (assignedPeople.has(personId)) return;
    assignedPeople.add(personId);

    const subtreeWidth = subtreeWidths.get(personId) ?? NODE_WIDTH;
    const spouses = getVisibleSpouses(personId);
    const visibleChildren = collapsedNodes.has(personId)
      ? []
      : getVisibleChildren(personId);
    const coupleWidth = NODE_WIDTH + spouses.length * (COUPLE_GAP + NODE_WIDTH);
    const centerX = startX + subtreeWidth / 2;
    const anchorX = centerX - coupleWidth / 2;

    xPositions.set(personId, anchorX);
    spouses.forEach((spouseId, index) => {
      xPositions.set(spouseId, anchorX + (index + 1) * (NODE_WIDTH + COUPLE_GAP));
      assignedPeople.add(spouseId);
    });

    if (visibleChildren.length === 0) return;

    let childrenWidth = 0;
    visibleChildren.forEach((childId, index) => {
      childrenWidth += subtreeWidths.get(childId) ?? NODE_WIDTH;
      if (index < visibleChildren.length - 1) {
        childrenWidth += siblingGap(childId, visibleChildren[index + 1]);
      }
    });

    let childX = centerX - childrenWidth / 2;
    visibleChildren.forEach((childId, index) => {
      assignPositions(childId, childX);
      childX += subtreeWidths.get(childId) ?? NODE_WIDTH;
      if (index < visibleChildren.length - 1) {
        childX += siblingGap(childId, visibleChildren[index + 1]);
      }
    });
  };

  let rootStartX = 0;
  roots.forEach((rootId) => {
    assignPositions(rootId, rootStartX);
    rootStartX += (subtreeWidths.get(rootId) ?? NODE_WIDTH) + SIBLING_GAP * 2;
  });

  const positionedPeople = visiblePeople.filter((person) => xPositions.has(person.id));
  if (positionedPeople.length === 0) {
    return { nodes: [], connections: [], width: 0, height: 0, offsetX: 0 };
  }

  const minGeneration = Math.min(
    ...positionedPeople.map((person) => person.generation || 1)
  );
  const nodes: TreeNodeData[] = positionedPeople.map((person) => ({
    person,
    x: xPositions.get(person.id)!,
    y: (person.generation - minGeneration) * LEVEL_HEIGHT + 20,
    isCollapsed: collapsedNodes.has(person.id),
    hasChildren: getAllChildren(person.id).length > 0,
  }));
  const personPositions = new Map(
    nodes.map((node) => [node.person.id, { x: node.x, y: node.y }])
  );
  const connections: TreeConnectionData[] = [];

  for (const family of families) {
    const anchorId = familyAnchors.get(family.id);
    const spouseId = familySpouses.get(family.id);
    const anchorPosition = anchorId ? personPositions.get(anchorId) : undefined;
    const spousePosition = spouseId ? personPositions.get(spouseId) : undefined;

    if (!anchorPosition && !spousePosition) continue;

    if (anchorPosition && spousePosition) {
      const anchorIsLeft = anchorPosition.x <= spousePosition.x;
      connections.push({
        id: `couple-${family.id}`,
        x1: anchorIsLeft
          ? spousePosition.x - COUPLE_GAP
          : spousePosition.x + NODE_WIDTH + COUPLE_GAP,
        y1: anchorIsLeft
          ? anchorPosition.y + NODE_HEIGHT / 2
          : spousePosition.y + NODE_HEIGHT / 2,
        x2: anchorIsLeft ? spousePosition.x : anchorPosition.x,
        y2: anchorIsLeft
          ? spousePosition.y + NODE_HEIGHT / 2
          : anchorPosition.y + NODE_HEIGHT / 2,
        type: 'couple',
      });
    }

    if (anchorId && collapsedNodes.has(anchorId)) continue;

    const parentPosition = anchorPosition ?? spousePosition;
    if (!parentPosition) continue;

    const familyCenterX =
      anchorPosition && spousePosition
        ? (Math.min(anchorPosition.x, spousePosition.x) + NODE_WIDTH +
            Math.max(anchorPosition.x, spousePosition.x)) /
          2
        : parentPosition.x + NODE_WIDTH / 2;

    for (const child of childrenByFamily.get(family.id) ?? []) {
      const childPosition = personPositions.get(child.person_id);
      if (!childPosition) continue;

      connections.push({
        id: `child-${family.id}-${child.person_id}`,
        x1: familyCenterX,
        y1: parentPosition.y + NODE_HEIGHT,
        x2: childPosition.x + NODE_WIDTH / 2,
        y2: childPosition.y,
        type: 'parent-child',
      });
    }
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = 0;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x + NODE_WIDTH);
    maxY = Math.max(maxY, node.y + NODE_HEIGHT);
  }

  if (!Number.isFinite(minX)) {
    minX = 0;
    maxX = 0;
  }

  return {
    nodes,
    connections,
    width: maxX - minX + 100,
    height: maxY + 50,
    offsetX: -minX + 50,
  };
}

export function FamilyTree({ people, families, children }: Props) {
  const [scale, setScale] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 0.7 : 1
  );
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showMinimap, setShowMinimap] = useState(true);
  const [filterRootId, setFilterRootId] = useState<string | null>(() =>
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('root')
  );
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const autoCollapseApplied = useRef(false);

  const data = useMemo(() => ({ people, families, children }), [people, families, children]);
  const selectedPerson = selectedPersonId
    ? people.find((person) => person.id === selectedPersonId) ?? null
    : null;
  const filterRootPerson = filterRootId
    ? people.find((person) => person.id === filterRootId) ?? null
    : null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({ width: container.clientWidth, height: container.clientHeight });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (autoCollapseApplied.current || people.length <= 50) return;
    autoCollapseApplied.current = true;

    const minGeneration = Math.min(...people.map((person) => person.generation || 1));
    const collapseFromGeneration = minGeneration + 4;
    const fathersWithChildren = new Set<string>();

    for (const family of families) {
      if (family.father_id && (children.some((child) => child.family_id === family.id))) {
        fathersWithChildren.add(family.father_id);
      }
    }

    setCollapsedNodes(
      new Set(
        people
          .filter(
            (person) =>
              person.generation >= collapseFromGeneration &&
              fathersWithChildren.has(person.id)
          )
          .map((person) => person.id)
      )
    );
  }, [children, families, people]);

  const layout = useMemo(
    () =>
      buildTreeLayout(
        data,
        collapsedNodes,
        viewMode,
        selectedPerson?.id ?? null,
        filterRootPerson?.id ?? null
      ),
    [collapsedNodes, data, filterRootPerson?.id, selectedPerson?.id, viewMode]
  );

  const handleSetFilterRoot = useCallback((person: Person | null) => {
    setFilterRootId(person?.id ?? null);
    setSelectedPersonId(person?.id ?? null);
    setFilterSearch('');
    setFilterDropdownOpen(false);
    setPan({ x: 0, y: 0 });

    const params = new URLSearchParams(window.location.search);
    if (person) params.set('root', person.id);
    else params.delete('root');
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      query ? `${window.location.pathname}?${query}` : window.location.pathname
    );
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setPan({ x: 0, y: 0 });
    if (mode !== 'all' && !selectedPersonId && people.length > 0) {
      setSelectedPersonId(filterRootPerson?.id ?? people[0].id);
    }
  };

  const handleToggleCollapse = useCallback((personId: string) => {
    setCollapsedNodes((current) => {
      const next = new Set(current);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  }, []);

  const handleCollapseAll = useCallback(() => {
    const familyIdsWithChildren = new Set(children.map((child) => child.family_id));
    const minGeneration = Math.min(...people.map((person) => person.generation || 1));
    setCollapsedNodes(
      new Set(
        families
          .filter(
            (family) =>
              family.father_id &&
              familyIdsWithChildren.has(family.id) &&
              (people.find((person) => person.id === family.father_id)?.generation ?? 0) >
                minGeneration
          )
          .map((family) => family.father_id)
          .filter((personId): personId is string => Boolean(personId))
      )
    );
  }, [children, families, people]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setPan({ x: event.clientX - panStart.x, y: event.clientY - panStart.y });
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    setIsPanning(true);
    setPanStart({
      x: event.touches[0].clientX - pan.x,
      y: event.touches[0].clientY - pan.y,
    });
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isPanning || event.touches.length !== 1) return;
    setPan({
      x: event.touches[0].clientX - panStart.x,
      y: event.touches[0].clientY - panStart.y,
    });
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.05 : 0.05;
    setScale((current) => Math.max(0.3, Math.min(2, current + delta)));
  };

  const handleReset = () => {
    setScale(window.innerWidth < 768 ? 0.7 : 1);
    setPan({ x: 0, y: 0 });
  };

  const viewport = {
    x: -pan.x / scale,
    y: -pan.y / scale,
    width: containerSize.width / scale,
    height: containerSize.height / scale,
  };

  const searchResults = useMemo(() => {
    const query = filterSearch.trim().toLocaleLowerCase('vi');
    if (query.length < 2) return [];
    return people
      .filter((person) => person.display_name.toLocaleLowerCase('vi').includes(query))
      .slice(0, 10);
  }, [filterSearch, people]);

  if (layout.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Chưa có dữ liệu để hiển thị cây gia phả.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/40 p-3">
        <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="shrink-0 text-sm font-medium">Xem nhánh từ:</span>

        {filterRootPerson ? (
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1">
            <span className="text-sm font-medium">{filterRootPerson.display_name}</span>
            <span className="text-xs text-muted-foreground">
              Đời {filterRootPerson.generation}
            </span>
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              aria-label="Xem toàn bộ gia phả"
              onClick={() => handleSetFilterRoot(null)}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              value={filterSearch}
              placeholder="Tìm thành viên..."
              className="w-52 rounded-md border bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              onChange={(event) => {
                setFilterSearch(event.target.value);
                setFilterDropdownOpen(event.target.value.trim().length >= 2);
              }}
              onFocus={() => setFilterDropdownOpen(filterSearch.trim().length >= 2)}
              onBlur={() => window.setTimeout(() => setFilterDropdownOpen(false), 150)}
            />

            {filterDropdownOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-56 w-72 overflow-y-auto rounded-md border bg-background shadow-lg">
                {searchResults.length > 0 ? (
                  searchResults.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted"
                      onMouseDown={() => handleSetFilterRoot(person)}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          person.gender === 1
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}
                      >
                        {person.display_name.trim().split(/\s+/).at(-1)?.charAt(0)}
                      </span>
                      <span>
                        <span className="block text-xs font-medium">{person.display_name}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          Đời {person.generation}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-3 text-xs text-muted-foreground">
                    Không tìm thấy thành viên.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {filterRootPerson
            ? `Nhánh ${filterRootPerson.display_name} · Đời ${filterRootPerson.generation}`
            : 'Đang xem: Toàn bộ gia phả'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Thu nhỏ"
            onClick={() => setScale((current) => Math.max(0.3, current - 0.1))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm">{Math.round(scale * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Phóng to"
            onClick={() => setScale((current) => Math.min(2, current + 0.1))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Đặt lại khung nhìn"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Select value={viewMode} onValueChange={(value) => handleViewModeChange(value as ViewMode)}>
          <SelectTrigger className="h-10 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Tất cả
              </span>
            </SelectItem>
            <SelectItem value="ancestors">
              <span className="flex items-center gap-2">
                <ArrowUpFromLine className="h-4 w-4" /> Tổ tiên
              </span>
            </SelectItem>
            <SelectItem value="descendants">
              <span className="flex items-center gap-2">
                <ArrowDownFromLine className="h-4 w-4" /> Con cháu
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setCollapsedNodes(new Set())}
          >
            <ChevronDown className="h-3 w-3" /> Mở rộng
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={handleCollapseAll}
          >
            <ChevronRight className="h-3 w-3" /> Thu gọn
          </Button>
        </div>

        <Button
          variant={showMinimap ? 'secondary' : 'ghost'}
          size="sm"
          className="hidden md:flex"
          onClick={() => setShowMinimap((current) => !current)}
        >
          <Maximize2 className="h-4 w-4" /> Minimap
        </Button>

        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Move className="h-3 w-3" />
          <span className="hidden sm:inline">Kéo để di chuyển</span>
        </div>
      </div>

      {viewMode !== 'all' && selectedPerson && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {viewMode === 'ancestors' ? 'Tổ tiên của' : 'Con cháu của'}:{' '}
            {selectedPerson.display_name}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => handleViewModeChange('all')}>
            Xem tất cả
          </Button>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative h-[65vh] min-h-[440px] select-none overflow-hidden rounded-lg border bg-muted/30"
        style={{ cursor: isPanning ? 'grabbing' : 'grab', touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => setIsPanning(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsPanning(false)}
        onWheel={handleWheel}
      >
        <svg width="100%" height="100%" aria-label="Cây gia phả dòng họ Nguyễn Đình">
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            <g transform={`translate(${layout.offsetX}, 0)`}>
              {layout.connections.map((connection) => (
                <TreeConnection key={connection.id} connection={connection} />
              ))}
              {layout.nodes.map((node) => (
                <TreeNode
                  key={node.person.id}
                  node={node}
                  isSelected={selectedPerson?.id === node.person.id}
                  onSelect={(person) => setSelectedPersonId(person.id)}
                  onToggleCollapse={handleToggleCollapse}
                />
              ))}
            </g>
          </g>
        </svg>

        {showMinimap && layout.nodes.length > 3 && (
          <Minimap
            nodes={layout.nodes}
            viewport={viewport}
            treeWidth={layout.width}
            treeHeight={layout.height}
            offsetX={layout.offsetX}
            onViewportClick={(x, y) =>
              setPan({
                x: containerSize.width / 2 - x * scale,
                y: containerSize.height / 2 - y * scale,
              })
            }
          />
        )}
      </div>

      {selectedPerson && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                  selectedPerson.gender === 1
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-pink-100 text-pink-700'
                }`}
              >
                {selectedPerson.display_name.trim().split(/\s+/).at(-1)?.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold">{selectedPerson.display_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Đời {selectedPerson.generation}
                  {selectedPerson.chi ? ` · Chi ${selectedPerson.chi}` : ''}
                  {!selectedPerson.is_living ? ' · Đã mất' : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {viewMode === 'all' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewModeChange('ancestors')}
                  >
                    <ArrowUpFromLine className="h-4 w-4" />
                    <span className="hidden sm:inline">Tổ tiên</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewModeChange('descendants')}
                  >
                    <ArrowDownFromLine className="h-4 w-4" />
                    <span className="hidden sm:inline">Con cháu</span>
                  </Button>
                </>
              )}
              <Button asChild size="sm">
                <Link href={`/thanh-vien/${selectedPerson.id}`}>Xem chi tiết</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
