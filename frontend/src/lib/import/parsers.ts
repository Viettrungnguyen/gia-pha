/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/import/parsers.ts
 * @description GEDCOM 7.0 / CSV / JSON parsers for family tree import
 * @version 1.0.0
 * @updated 2026-07-23
 */

import type { Person } from '@/types';

export interface ImportPerson {
  handle: string;
  display_name: string;
  first_name?: string | null;
  middle_name?: string | null;
  surname: string;
  gender?: 1 | 2 | null;
  generation?: number;
  chi?: number | null;
  tree_label?: string | null;
  birth_year?: number | null;
  birth_place?: string | null;
  death_year?: number | null;
  death_place?: string | null;
  death_lunar?: string | null;
  is_living?: boolean;
  occupation?: string | null;
  hometown?: string | null;
  biography?: string | null;
  notes?: string | null;
}

export interface ImportFamily {
  father_handle?: string | null;
  mother_handle?: string | null;
  child_handles: string[];
  marriage_date?: string | null;
  marriage_place?: string | null;
  notes?: string | null;
}

export interface ImportPayload {
  people: ImportPerson[];
  families: ImportFamily[];
  source: 'gedcom' | 'csv' | 'json';
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// GEDCOM 7.0 parser (subset: INDI + FAM records)
// ═══════════════════════════════════════════════════════════════════════════

interface GedcomLine {
  level: number;
  tag: string;
  value: string;
  xref?: string;
}

function parseGedcomLines(text: string): GedcomLine[] {
  const out: GedcomLine[] = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const m = /^(\d+)\s+(?:(@[^@]+@)\s+)?(\w+)\s*(.*)$/.exec(raw.trim());
    if (!m) continue;
    const [, lvl, xref, tag, value] = m;
    out.push({ level: parseInt(lvl, 10), tag, value: value ?? '', xref });
  }
  return out;
}

function extractName(indi: GedcomLine[]): { given: string; surname: string } {
  const nameLine = indi.find((l) => l.tag === 'NAME');
  if (!nameLine) return { given: '', surname: '' };
  // Format GEDCOM: "Given Names /Surname/ Suffix"
  // Cho tiếng Việt: thường viết "/Họ/" trước rồi tên sau, ví dụ "Đình /Nguyễn/"
  // nhưng cũng có "Nguyễn Đình /Tổ/" (họ đệm + /tên/)
  // Logic: phần ngoài /.../ là "given" (họ + tên đệm), phần trong /.../ là "surname" (họ)
  const m = /^(.*?)\/([^/]*)\/?\s*(.*)$/.exec(nameLine.value);
  if (m) {
    const beforeSlash = m[1].trim();
    const insideSlash = m[2].trim();
    return { given: beforeSlash, surname: insideSlash || beforeSlash.split(/\s+/).pop() || '' };
  }
  return { given: nameLine.value.trim(), surname: '' };
}

function extractYearFromDate(value: string): number | null {
  if (!value) return null;
  // Hỗ trợ: "1850", "ABT 1850", "BEF 1850", "AFT 1850", "BET 1840 AND 1850", "12 JAN 1850", "@#DJULIAN@ 1850"
  const m = /(\d{4})/.exec(value);
  return m ? parseInt(m[1], 10) : null;
}

export function parseGedcom(text: string): ImportPayload {
  const lines = parseGedcomLines(text);
  const warnings: string[] = [];
  const xrefToHandle = new Map<string, string>();
  const personByXref = new Map<string, GedcomLine[]>();
  const famByXref = new Map<string, GedcomLine[]>();
  let nextHandle = 1;
  const newHandle = () => `IMP${String(nextHandle++).padStart(4, '0')}`;

  // Nhóm lines theo xref
  let currentXref: string | null = null;
  let currentGroup: GedcomLine[] = [];
  for (const ln of lines) {
    if (ln.level === 0) {
      if (currentXref && currentGroup.length) {
        if (currentGroup[0].tag === 'INDI') personByXref.set(currentXref, currentGroup);
        else if (currentGroup[0].tag === 'FAM') famByXref.set(currentXref, currentGroup);
      }
      currentXref = ln.xref ?? null;
      currentGroup = currentXref ? [ln] : [];
    } else if (currentXref) {
      currentGroup.push(ln);
    }
  }
  if (currentXref && currentGroup.length) {
    if (currentGroup[0].tag === 'INDI') personByXref.set(currentXref, currentGroup);
    else if (currentGroup[0].tag === 'FAM') famByXref.set(currentXref, currentGroup);
  }

  // Parse INDI
  const people: ImportPerson[] = [];
  for (const [xref, rec] of personByXref) {
    const handle = newHandle();
    xrefToHandle.set(xref, handle);
    const { given, surname } = extractName(rec);
    const sexLine = rec.find((l) => l.tag === 'SEX');
    const birthIdx = rec.findIndex((l) => l.tag === 'BIRT');
    const deathIdx = rec.findIndex((l) => l.tag === 'DEAT');
    const occu = rec.find((l) => l.tag === 'OCCU');
    const note = rec.find((l) => l.tag === 'NOTE');

    const getSubValue = (idx: number, sub: string): string | null => {
      if (idx < 0) return null;
      // sub line nằm ngay sau BIRT/DEAT ở level +1
      const subLine = rec.slice(idx + 1).find((l) => l.level === rec[idx].level + 1 && l.tag === sub);
      return subLine?.value ?? null;
    };

    const birthDate = birthIdx >= 0 ? getSubValue(birthIdx, 'DATE') : null;
    const birthPlace = birthIdx >= 0 ? getSubValue(birthIdx, 'PLAC') : null;
    const deathDate = deathIdx >= 0 ? getSubValue(deathIdx, 'DATE') : null;
    const deathPlace = deathIdx >= 0 ? getSubValue(deathIdx, 'PLAC') : null;

    const gender: 1 | 2 | null = sexLine?.value === 'M' ? 1 : sexLine?.value === 'F' ? 2 : null;
    const isLiving = deathIdx < 0;

    people.push({
      handle,
      display_name: [surname, given].filter(Boolean).join(' ').trim() || `Person ${handle}`,
      first_name: given ? given.split(/\s+/).pop() ?? given : null,
      middle_name: given && given.split(/\s+/).length > 1 ? given.split(/\s+/).slice(0, -1).join(' ') : null,
      surname: surname || 'Unknown',
      gender,
      is_living: isLiving,
      birth_year: extractYearFromDate(birthDate ?? ''),
      birth_place: birthPlace,
      death_year: !isLiving ? extractYearFromDate(deathDate ?? '') : null,
      death_place: !isLiving ? deathPlace : null,
      occupation: occu?.value ?? null,
      notes: note?.value ?? null,
    });
  }

  // Parse FAM
  const families: ImportFamily[] = [];
  for (const rec of famByXref.values()) {
    const husb = rec.find((l) => l.tag === 'HUSB')?.value;
    const wife = rec.find((l) => l.tag === 'WIFE')?.value;
    const chil = rec.filter((l) => l.tag === 'CHIL').map((l) => l.value);
    const marr = rec.find((l) => l.tag === 'MARR');

    if (!husb && !wife && chil.length === 0) continue;
    families.push({
      father_handle: husb ? xrefToHandle.get(husb) ?? null : null,
      mother_handle: wife ? xrefToHandle.get(wife) ?? null : null,
      child_handles: chil.map((c) => xrefToHandle.get(c)).filter((h): h is string => Boolean(h)),
      marriage_date: marr?.value ?? null,
    });
  }

  if (people.length === 0) warnings.push('Không tìm thấy bản ghi INDI nào.');
  return { people, families, source: 'gedcom', warnings };
}

// ═══════════════════════════════════════════════════════════════════════════
// CSV parser (header row, comma-separated, hỗ trợ quoted values)
// ═══════════════════════════════════════════════════════════════════════════

function parseCsvRow(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else cur += ch;
    } else {
      if (ch === '"') inQuote = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const CSV_HEADER_ALIASES: Record<string, keyof ImportPerson> = {
  handle: 'handle', ma: 'handle', id: 'handle',
  ten: 'display_name', name: 'display_name', 'tên': 'display_name', 'họ tên': 'display_name', 'ho_ten': 'display_name',
  ho: 'surname', 'họ': 'surname', surname: 'surname', family_name: 'surname',
  ten_dem: 'middle_name', 'tên đệm': 'middle_name', middle_name: 'middle_name',
  ten_goi: 'first_name', 'tên gọi': 'first_name', first_name: 'first_name', given: 'first_name',
  gioi_tinh: 'gender', 'giới tính': 'gender', gender: 'gender', sex: 'gender',
  doi: 'generation', 'đời': 'generation', generation: 'generation',
  chi: 'chi',
  nam_sinh: 'birth_year', 'năm sinh': 'birth_year', birth_year: 'birth_year',
  noi_sinh: 'birth_place', 'nơi sinh': 'birth_place', birth_place: 'birth_place',
  nam_mat: 'death_year', 'năm mất': 'death_year', death_year: 'death_year',
  noi_mat: 'death_place', 'nơi mất': 'death_place', death_place: 'death_place',
  ngay_gio: 'death_lunar', 'ngày giỗ': 'death_lunar', death_lunar: 'death_lunar',
  con_song: 'is_living', 'còn sống': 'is_living', is_living: 'is_living', living: 'is_living',
  nghe: 'occupation', 'nghề': 'occupation', occupation: 'occupation',
  que: 'hometown', 'quê': 'hometown', hometown: 'hometown',
  tieu_su: 'biography', 'tiểu sử': 'biography', biography: 'biography',
  ghi_chu: 'notes', 'ghi chú': 'notes', notes: 'notes',
};

export function parseCsv(text: string): ImportPayload {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { people: [], families: [], source: 'csv', warnings: ['File CSV phải có header và ít nhất 1 dòng dữ liệu.'] };
  }
  const header = parseCsvRow(lines[0]).map((h) => h.trim().toLowerCase());
  const fieldMap: Array<keyof ImportPerson> = header.map((h) => CSV_HEADER_ALIASES[h]).filter((k): k is keyof ImportPerson => Boolean(k));

  if (!fieldMap.includes('display_name') && !fieldMap.includes('surname')) {
    warnings.push('CSV cần cột "ten" / "name" / "display_name" hoặc "ho" / "surname".');
  }

  const people: ImportPerson[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]);
    if (cols.length === 0 || cols.every((c) => !c.trim())) continue;
    const obj: Record<string, unknown> = {};
    for (let j = 0; j < fieldMap.length; j++) {
      const key = fieldMap[j];
      const val = cols[j]?.trim() ?? '';
      if (key === 'gender') {
        obj[key] = val === '1' || val.toLowerCase() === 'nam' || val.toLowerCase() === 'm' ? 1 : val === '2' || val.toLowerCase() === 'nữ' || val.toLowerCase() === 'nu' || val.toLowerCase() === 'f' ? 2 : null;
      } else if (key === 'is_living') {
        obj[key] = val === '1' || val.toLowerCase() === 'true' || val.toLowerCase() === 'yes' || val.toLowerCase() === 'còn sống';
      } else if (key === 'generation' || key === 'chi' || key === 'birth_year' || key === 'death_year') {
        obj[key] = val ? parseInt(val, 10) : null;
      } else if (val) {
        obj[key] = val;
      }
    }
    if (!obj.handle) obj.handle = `IMP${String(i).padStart(4, '0')}`;
    if (!obj.display_name) obj.display_name = [obj.surname, obj.first_name].filter(Boolean).join(' ') || `Person ${obj.handle}`;
    people.push(obj as unknown as ImportPerson);
  }

  return { people, families: [], source: 'csv', warnings };
}

// ═══════════════════════════════════════════════════════════════════════════
// JSON parser (NDHN shape: { people: [...], families: [...] })
// ═══════════════════════════════════════════════════════════════════════════

export function parseJson(text: string): ImportPayload {
  const warnings: string[] = [];
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data.people)) {
      return { people: [], families: [], source: 'json', warnings: ['JSON phải có field "people" là mảng.'] };
    }
    const people: ImportPerson[] = data.people.map((p: Record<string, unknown>, i: number) => ({
      handle: (p.handle as string) || `IMP${String(i + 1).padStart(4, '0')}`,
      display_name: (p.display_name as string) || '',
      first_name: (p.first_name as string) ?? null,
      middle_name: (p.middle_name as string) ?? null,
      surname: (p.surname as string) || '',
      gender: (p.gender as 1 | 2 | null) ?? null,
      generation: (p.generation as number) ?? 1,
      chi: (p.chi as number | null) ?? null,
      tree_label: (p.tree_label as string | null) ?? null,
      birth_year: (p.birth_year as number | null) ?? null,
      birth_place: (p.birth_place as string | null) ?? null,
      death_year: (p.death_year as number | null) ?? null,
      death_place: (p.death_place as string | null) ?? null,
      death_lunar: (p.death_lunar as string | null) ?? null,
      is_living: p.is_living !== false,
      occupation: (p.occupation as string | null) ?? null,
      hometown: (p.hometown as string | null) ?? null,
      biography: (p.biography as string | null) ?? null,
      notes: (p.notes as string | null) ?? null,
    }));
    const families: ImportFamily[] = Array.isArray(data.families)
      ? data.families.map((f: Record<string, unknown>) => ({
          father_handle: (f.father_handle as string) ?? null,
          mother_handle: (f.mother_handle as string) ?? null,
          child_handles: Array.isArray(f.child_handles) ? (f.child_handles as string[]) : [],
          marriage_date: (f.marriage_date as string) ?? null,
          marriage_place: (f.marriage_place as string) ?? null,
          notes: (f.notes as string) ?? null,
        }))
      : [];
    return { people, families, source: 'json', warnings };
  } catch (e) {
    return { people: [], families: [], source: 'json', warnings: [`JSON không hợp lệ: ${e instanceof Error ? e.message : String(e)}`] };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Router
// ═══════════════════════════════════════════════════════════════════════════

export function detectFormat(filename: string, content: string): 'gedcom' | 'csv' | 'json' {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.ged')) return 'gedcom';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.csv')) return 'csv';
  // Heuristic từ content
  if (content.trimStart().startsWith('{') || content.trimStart().startsWith('[')) return 'json';
  if (/^0\s+HEAD/m.test(content)) return 'gedcom';
  return 'csv';
}

export function parseImport(filename: string, content: string): ImportPayload {
  const fmt = detectFormat(filename, content);
  if (fmt === 'gedcom') return parseGedcom(content);
  if (fmt === 'json') return parseJson(content);
  return parseCsv(content);
}

// ═══════════════════════════════════════════════════════════════════════════
// Normalize -> Persist
// ═══════════════════════════════════════════════════════════════════════════

export function toPersonRow(p: ImportPerson): Omit<Person, 'id' | 'created_at' | 'updated_at'> {
  return {
    handle: p.handle,
    display_name: p.display_name,
    first_name: p.first_name ?? null,
    middle_name: p.middle_name ?? null,
    surname: p.surname,
    gender: p.gender ?? null,
    generation: p.generation ?? 1,
    chi: p.chi ?? null,
    tree_label: p.tree_label ?? null,
    birth_date: null,
    birth_year: p.birth_year ?? null,
    birth_place: p.birth_place ?? null,
    death_date: null,
    death_year: p.death_year ?? null,
    death_place: p.death_place ?? null,
    death_lunar: p.death_lunar ?? null,
    is_living: p.is_living ?? !p.death_year,
    is_patrilineal: true,
    phone: null,
    email: null,
    zalo: null,
    facebook: null,
    address: null,
    hometown: p.hometown ?? null,
    occupation: p.occupation ?? null,
    biography: p.biography ?? null,
    notes: p.notes ?? null,
    avatar_url: null,
    privacy_level: 0,
  };
}
