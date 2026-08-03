/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase/local-shim.ts
 * @description In-memory Supabase client shim for local dev (no Supabase required)
 * @version 1.0.0
 * @updated 2026-07-23
 */

import type {
  Person,
  Family,
  Child,
  Event,
  ClanDocument,
} from '@/types';
import { PEOPLE_SEED, FAMILIES_SEED, CHILDREN_SEED, EVENTS_SEED, DOCUMENTS_SEED } from './local-seed';

type Row = Record<string, unknown>;

interface TableState {
  rows: Row[];
}

interface LocalSession {
  user: { id: string; email: string };
  profile: { id: string; user_id: string; email: string; full_name: string | null; role: 'admin' };
}

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function generateNextHandle() {
  const people = getStore().rowsFor('people');
  let max = 0;
  for (const row of people) {
    const handle = typeof row.handle === 'string' ? row.handle : '';
    const match = handle.match(/^ND(\d+)$/i);
    if (match) {
      const value = Number.parseInt(match[1], 10);
      if (Number.isFinite(value) && value > max) max = value;
    }
  }
  return `ND${String(max + 1).padStart(3, '0')}`;
}

function clone<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value));
}

function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  return rows.filter((row) =>
    filters.every((f) => {
      const v = row[f.column];
      switch (f.op) {
        case 'eq':
          return v === f.value;
        case 'neq':
          return v !== f.value;
        case 'gte':
          return (v ?? '') >= (f.value ?? '');
        case 'lte':
          return (v ?? '') <= (f.value ?? '');
        case 'gt':
          return (v ?? '') > (f.value ?? '');
        case 'lt':
          return (v ?? '') < (f.value ?? '');
        case 'ilike': {
          const pattern = String(f.value ?? '').replace(/%/g, '').toLowerCase();
          return String(v ?? '').toLowerCase().includes(pattern);
        }
        default:
          return true;
      }
    })
  );
}

function applyOrFilters(row: Row, ors: OrFilter[]): boolean {
  return ors.some((grp) =>
    grp.filters.every((f) => {
      const v = row[f.column];
      if (f.op === 'ilike') {
        const pattern = String(f.value ?? '').replace(/%/g, '').toLowerCase();
        return String(v ?? '').toLowerCase().includes(pattern);
      }
      return v === f.value;
    })
  );
}

function applyOrder(rows: Row[], orders: Order[]): Row[] {
  const out = [...rows];
  out.sort((a, b) => {
    for (const o of orders) {
      const av = a[o.column];
      const bv = b[o.column];
      if (av === bv) continue;
      const aNull = av === null || av === undefined;
      const bNull = bv === null || bv === undefined;
      if (aNull && !bNull) return o.nullsFirst ? -1 : 1;
      if (!aNull && bNull) return o.nullsFirst ? 1 : -1;
      if ((av as number | string) < (bv as number | string)) return o.ascending ? -1 : 1;
      if ((av as number | string) > (bv as number | string)) return o.ascending ? 1 : -1;
    }
    return 0;
  });
  return out;
}

interface Filter {
  column: string;
  op: 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt' | 'ilike';
  value: unknown;
}

interface OrFilter {
  filters: Filter[];
}

interface Order {
  column: string;
  ascending: boolean;
  nullsFirst?: boolean;
}

interface QueryState {
  table: string;
  filters: Filter[];
  orFilters: OrFilter[];
  orders: Order[];
  limit?: number;
  countExact?: boolean;
  isSingle: boolean;
  mode: 'select' | 'insert' | 'update' | 'delete';
  payload?: Row | Row[];
  selectColumns?: string;
}

function seedData() {
  return {
    people: PEOPLE_SEED,
    families: FAMILIES_SEED,
    children: CHILDREN_SEED,
    events: EVENTS_SEED,
    documents: DOCUMENTS_SEED,
  };
}

class LocalStore {
  tables: Map<string, TableState>;

  constructor() {
    this.tables = new Map();
    const seed = seedData();
    this.tables.set('people', { rows: seed.people.map((r) => ({ ...r })) });
    this.tables.set('families', { rows: seed.families.map((r) => ({ ...r })) });
    this.tables.set('children', { rows: seed.children.map((r) => ({ ...r })) });
    this.tables.set('events', { rows: seed.events.map((r) => ({ ...r })) });
    this.tables.set('clan_documents', { rows: seed.documents.map((r) => ({ ...r })) });
    this.tables.set('profiles', {
      rows: [
        {
          id: 'pr_local_admin',
          user_id: 'local-admin',
          email: 'admin@local',
          full_name: 'Quản trị viên (local)',
          role: 'admin',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
  }

  rowsFor(table: string): Row[] {
    const t = this.tables.get(table);
    if (!t) throw new Error(`Bảng không tồn tại trong local store: ${table}`);
    return t.rows;
  }

  insert(table: string, payload: Row | Row[]) {
    const rows = Array.isArray(payload) ? payload : [payload];
    const inserted: Row[] = [];
    for (const r of rows) {
      const next: Row = { ...r };
      if (!('id' in next) || !next.id) next.id = uid(table.slice(0, 3));
      if (table === 'people' && (!('handle' in next) || !next.handle || next.handle === 'TỰ_SINH')) {
        next.handle = generateNextHandle();
      }
      if (!('created_at' in next)) next.created_at = nowIso();
      if (!('updated_at' in next)) next.updated_at = nowIso();
      this.tables.get(table)!.rows.push(next);
      inserted.push(next);
    }
    return inserted;
  }

  update(table: string, filters: Filter[], patch: Row) {
    const rows = this.rowsFor(table);
    let count = 0;
    for (const r of rows) {
      if (filters.every((f) => r[f.column] === f.value)) {
        Object.assign(r, patch, { updated_at: nowIso() });
        count++;
      }
    }
    return count;
  }

  delete(table: string, filters: Filter[]) {
    const rows = this.rowsFor(table);
    const keep: Row[] = [];
    let removed = 0;
    for (const r of rows) {
      if (filters.every((f) => r[f.column] === f.value)) {
        removed++;
      } else {
        keep.push(r);
      }
    }
    this.tables.get(table)!.rows = keep;
    return removed;
  }
}

const globalKey = '__ndhnLocalStore';
type GlobalWithStore = typeof globalThis & { [globalKey]?: LocalStore };
const globalRef = globalThis as GlobalWithStore;

function getStore(): LocalStore {
  if (!globalRef[globalKey]) globalRef[globalKey] = new LocalStore();
  return globalRef[globalKey]!;
}

function buildPromise(state: QueryState): Promise<{ data: Row | Row[] | null; error: { message: string } | null; count?: number }> {
  const store = getStore();
  try {
    if (state.mode === 'select') {
      let rows = store.rowsFor(state.table);
      rows = applyFilters(rows, state.filters);
      if (state.orFilters.length > 0) {
        rows = rows.filter((r) => applyOrFilters(r, state.orFilters));
      }

      const joins = parseJoins(state.selectColumns);
      if (joins.length > 0) {
        for (const join of joins) {
          const foreignRows = store.rowsFor(join.foreignTable);
          rows = rows.map((row) => {
            const next = { ...row };
            for (const j of join.joins) {
              const target = row[j.localColumn];
              if (target !== null && target !== undefined) {
                next[j.alias] = foreignRows.find((fr) => fr[join.foreignKey] === target) ?? null;
              } else {
                next[j.alias] = null;
              }
            }
            return next;
          });
        }
      }

      if (state.orders.length > 0) rows = applyOrder(rows, state.orders);
      if (typeof state.limit === 'number') rows = rows.slice(0, state.limit);

      if (state.countExact && rows.length === 0) {
        return Promise.resolve({ data: null, error: null, count: 0 });
      }
      if (state.isSingle && state.countExact) {
        const data = rows[0] ?? null;
        return Promise.resolve({ data, error: null, count: data ? 1 : 0 });
      }
      const data = state.isSingle ? rows[0] ?? null : rows;
      if (state.countExact) {
        return Promise.resolve({ data: null, error: null, count: rows.length });
      }
      return Promise.resolve({ data, error: null });
    }

    if (state.mode === 'insert') {
      const inserted = store.insert(state.table, state.payload!);
      const data = state.isSingle ? inserted[0] : inserted;
      return Promise.resolve({ data, error: null });
    }

    if (state.mode === 'update') {
      const count = store.update(state.table, state.filters, state.payload as Row);
      const remaining = store.rowsFor(state.table).filter((r) =>
        state.filters.every((f) => r[f.column] === f.value)
      );
      const data = state.isSingle ? remaining[0] ?? null : remaining;
      if (count === 0 && state.isSingle) {
        return Promise.resolve({ data: null, error: { message: 'Không tìm thấy bản ghi' } });
      }
      return Promise.resolve({ data, error: null });
    }

    if (state.mode === 'delete') {
      store.delete(state.table, state.filters);
      return Promise.resolve({ data: null, error: null });
    }

    return Promise.resolve({ data: null, error: null });
  } catch (err) {
    return Promise.resolve({
      data: null,
      error: { message: err instanceof Error ? err.message : 'Lỗi local store' },
    });
  }
}

interface ParsedJoin {
  foreignTable: string;
  foreignKey: string;
  joins: Array<{ localColumn: string; alias: string }>;
}

function parseJoins(columns: string | undefined): ParsedJoin[] {
  if (!columns) return [];
  const joins: ParsedJoin[] = [];
  const regex = /([a-zA-Z_]+)\s*:\s*([a-zA-Z_]+)\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(columns)) !== null) {
    const [, alias, table, fkSpec] = match;
    const parts = fkSpec.split(',').map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (part === '*' || part === '') {
        if (!joins.find((j) => j.foreignTable === table)) {
          joins.push({ foreignTable: table, foreignKey: 'id', joins: [{ localColumn: alias, alias }] });
        }
        continue;
      }
      const [localColumn] = part.split(':').map((p) => p.trim());
      const existing = joins.find((j) => j.foreignTable === table);
      if (existing) {
        existing.joins.push({ localColumn: localColumn || alias, alias });
      } else {
        joins.push({ foreignTable: table, foreignKey: 'id', joins: [{ localColumn: localColumn || alias, alias }] });
      }
    }
  }
  return joins;
}

class LocalQueryBuilder<T = Row> implements PromiseLike<{ data: T | T[] | null; error: { message: string } | null; count?: number }> {
  private state: QueryState;

  constructor(table: string) {
    this.state = {
      table,
      filters: [],
      orFilters: [],
      orders: [],
      isSingle: false,
      mode: 'select',
    };
  }

  select(columns?: string, options?: { count?: 'exact'; head?: boolean }) {
    if (options?.count === 'exact') this.state.countExact = true;
    this.state.selectColumns = columns;
    return this;
  }

  eq(column: string, value: unknown) {
    this.state.filters.push({ column, op: 'eq', value });
    return this;
  }
  neq(column: string, value: unknown) {
    this.state.filters.push({ column, op: 'neq', value });
    return this;
  }
  gt(column: string, value: unknown) {
    this.state.filters.push({ column, op: 'gt', value });
    return this;
  }
  gte(column: string, value: unknown) {
    this.state.filters.push({ column, op: 'gte', value });
    return this;
  }
  lt(column: string, value: unknown) {
    this.state.filters.push({ column, op: 'lt', value });
    return this;
  }
  lte(column: string, value: unknown) {
    this.state.filters.push({ column, op: 'lte', value });
    return this;
  }
  like(_column: string, _pattern: string) {
    return this;
  }
  ilike(column: string, pattern: string) {
    this.state.filters.push({ column, op: 'ilike', value: pattern });
    return this;
  }
  in(_column: string, _values: unknown[]) {
    return this;
  }
  match(_filters: Record<string, unknown>) {
    return this;
  }
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.state.orders.push({
      column,
      ascending: options?.ascending !== false,
      nullsFirst: options?.nullsFirst,
    });
    return this;
  }
  limit(n: number) {
    this.state.limit = n;
    return this;
  }
  single() {
    this.state.isSingle = true;
    return this;
  }
  maybeSingle() {
    this.state.isSingle = true;
    return this;
  }

  insert(payload: Row | Row[]) {
    this.state.mode = 'insert';
    this.state.payload = payload;
    return this;
  }
  update(patch: Row) {
    this.state.mode = 'update';
    this.state.payload = patch;
    return this;
  }
  upsert(payload: Row | Row[]) {
    this.state.mode = 'insert';
    this.state.payload = payload;
    return this;
  }
  delete() {
    this.state.mode = 'delete';
    this.state.payload = {};
    return this;
  }

  or(filtersOr: string) {
    const parts = filtersOr.split(',').map((p) => p.trim());
    const orGroup: Filter[] = [];
    for (const p of parts) {
      const match = /^(.+?)\.(ilike|eq)\.(.+)$/.exec(p);
      if (!match) continue;
      const [, column, op, rawValue] = match;
      let val: unknown = rawValue;
      if (typeof val === 'string') {
        const stripped = val.replace(/^%/, '').replace(/%$/, '');
        val = stripped;
      }
      orGroup.push({ column, op: op as Filter['op'], value: val });
    }
    if (orGroup.length > 0) this.state.orFilters.push({ filters: orGroup });
    return this;
  }

  then<TResult1 = { data: T | T[] | null; error: { message: string } | null; count?: number }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | T[] | null; error: { message: string } | null; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return buildPromise(this.state).then(onfulfilled as never, onrejected as never) as unknown as PromiseLike<TResult1 | TResult2>;
  }
}

class LocalFromTable {
  constructor(private table: string) {}
  select(_columns?: string, options?: { count?: 'exact'; head?: boolean }) {
    const q = new LocalQueryBuilder(this.table);
    return q.select(_columns, options);
  }
  insert(payload: Row | Row[]) {
    const q = new LocalQueryBuilder(this.table);
    return q.insert(payload);
  }
  update(patch: Row) {
    const q = new LocalQueryBuilder(this.table);
    return q.update(patch);
  }
  upsert(payload: Row | Row[]) {
    const q = new LocalQueryBuilder(this.table);
    return q.upsert(payload);
  }
  delete() {
    const q = new LocalQueryBuilder(this.table);
    return q.delete();
  }
}

class LocalStorageBucket {
  constructor(private bucket: string) {}
  async upload(path: string, file: File) {
    void file;
    return { data: { path }, error: null };
  }
  async remove(paths: string[]) {
    void paths;
    return { data: null, error: null };
  }
  getPublicUrl(path: string) {
    void this.bucket;
    const dataUrl = `data:application/octet-stream;base64,${typeof path === 'string' ? btoa(path) : ''}`;
    return { data: { publicUrl: dataUrl } };
  }
}

export function createLocalSupabase() {
  const LOCAL_USER = { id: 'local-admin', email: 'admin@local' };
  const LOCAL_PROFILE = {
    id: 'pr_local_admin',
    user_id: LOCAL_USER.id,
    email: LOCAL_USER.email,
    full_name: 'Quản trị viên (local)',
    role: 'admin' as const,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  const listeners: Array<(event: string, session: LocalSession | null) => void> = [];

  function fire(event: string, session: LocalSession | null = null) {
    for (const fn of listeners) fn(event, session);
  }

  const session: LocalSession = { user: LOCAL_USER, profile: LOCAL_PROFILE };

  const auth = {
    async getUser() {
      return { data: { user: LOCAL_USER }, error: null };
    },
    async getSession() {
      return { data: { session }, error: null };
    },
    async signInWithPassword({ email }: { email: string; password: string }) {
      void email;
      return { data: { user: LOCAL_USER, session }, error: null };
    },
    async signOut() {
      return { error: null };
    },
    onAuthStateChange(cb: (event: string, session: LocalSession | null) => void) {
      listeners.push(cb);
      setTimeout(() => cb('SIGNED_IN', session), 0);
      return {
        data: {
          subscription: {
            unsubscribe() {
              const idx = listeners.indexOf(cb);
              if (idx >= 0) listeners.splice(idx, 1);
            },
          },
        },
      };
    },
  };

  const storage = {
    from(bucket: string) {
      return new LocalStorageBucket(bucket);
    },
  };

  const from = (table: string) => new LocalFromTable(table);

  return {
    auth,
    storage,
    from,
    __local: true,
    fireAuthEvent: fire,
    __session: () => clone(session),
  };
}

export type LocalSupabaseClient = ReturnType<typeof createLocalSupabase>;
