/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/stats-calculator.ts
 * @description Detailed family-tree statistics computation
 * @version 1.0.0
 * @updated 2026-07-24
 */

import type { TreeData } from '@/lib/supabase-data-families';

export interface DistributionStat {
  label: string;
  count: number;
}

export interface PieStat {
  name: string;
  value: number;
}

export interface DetailedStats {
  totalPeople: number;
  totalFamilies: number;
  totalGenerations: number;
  totalChi: number;
  livingCount: number;
  deceasedCount: number;
  avgChildrenPerFamily: number;
  childlessRate: number;
  generationStats: DistributionStat[];
  chiStats: DistributionStat[];
  genderStats: PieStat[];
  livingStats: PieStat[];
}

export function calculateDetailedStats(data: TreeData): DetailedStats {
  const { people, families, children } = data;
  const livingCount = people.filter((person) => person.is_living).length;

  const generationMap = new Map<number, number>();
  const chiMap = new Map<number, number>();
  for (const person of people) {
    generationMap.set(person.generation, (generationMap.get(person.generation) ?? 0) + 1);
    if (person.chi !== null) chiMap.set(person.chi, (chiMap.get(person.chi) ?? 0) + 1);
  }

  const generations = [...generationMap.keys()].sort((a, b) => a - b);
  const generationStats = generations.map((generation) => ({
    label: `Đời ${generation}`,
    count: generationMap.get(generation) ?? 0,
  }));
  const chiStats = [...chiMap.keys()].sort((a, b) => a - b).map((chi) => ({
    label: `Chi ${chi}`,
    count: chiMap.get(chi) ?? 0,
  }));

  const familyIdsWithChildren = new Set(children.map((child) => child.family_id));
  const avgChildrenPerFamily = familyIdsWithChildren.size
    ? Math.round((children.length / familyIdsWithChildren.size) * 10) / 10
    : 0;

  const familyMap = new Map(families.map((family) => [family.id, family]));
  const parentsWithChildren = new Set<string>();
  for (const child of children) {
    const family = familyMap.get(child.family_id);
    if (family?.father_id) parentsWithChildren.add(family.father_id);
    if (family?.mother_id) parentsWithChildren.add(family.mother_id);
  }

  const youngestGeneration = generations.at(-1) ?? 0;
  const potentialParents = people.filter((person) => person.generation < youngestGeneration);
  const childlessCount = potentialParents.filter((person) => !parentsWithChildren.has(person.id)).length;
  const childlessRate = potentialParents.length
    ? Math.round((childlessCount / potentialParents.length) * 100)
    : 0;

  return {
    totalPeople: people.length,
    totalFamilies: families.length,
    totalGenerations: generations.length,
    totalChi: chiStats.length,
    livingCount,
    deceasedCount: people.length - livingCount,
    avgChildrenPerFamily,
    childlessRate,
    generationStats,
    chiStats,
    genderStats: [
      { name: 'Nam', value: people.filter((person) => person.gender === 1).length },
      { name: 'Nữ', value: people.filter((person) => person.gender === 2).length },
    ],
    livingStats: [
      { name: 'Còn sống', value: livingCount },
      { name: 'Đã mất', value: people.length - livingCount },
    ],
  };
}
