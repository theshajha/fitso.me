import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isStub } from "./env";

/**
 * Server-only Supabase client (service role). Never import from a client component.
 *
 * Stub mode (no SUPABASE_URL or SERVICE_ROLE_KEY): an in-memory fake that supports
 * the subset the app uses:
 *   db.from(t).insert(row | rows)  [.select()] [.single()]
 *   db.from(t).upsert(row, { onConflict })  [.select()] [.single()]
 *   db.from(t).select(cols?)  .eq(c, v) .in(c, vs) .order(c, { ascending }) .limit(n)  [.single() | .maybeSingle()]
 *   db.from(t).update(patch)  .eq(c, v)  [.select()] [.single()]
 *   db.from(t).delete()  .eq(c, v)
 * Every builder is awaitable and resolves to { data, error } like supabase-js.
 * Column lists in select() are ignored (all columns returned). Data lives on globalThis,
 * so it survives hot reload but not a server restart.
 */

type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string; code?: string } | null };

const nowIso = () => new Date().toISOString();

const DEFAULTS: Record<string, () => Row> = {
  quick_wins: () => ({
    id: randomUUID(),
    created_at: nowIso(),
    updated_at: nowIso(),
    shared_at: null,
    opened_by_others: 0,
    verdict_credits: 1,
    user_id: null,
  }),
  verdicts: () => ({ id: randomUUID(), created_at: nowIso(), input_url: null, condition: null, saved_amount_inr: null }),
  orders: () => ({
    id: randomUUID(),
    created_at: nowIso(),
    updated_at: nowIso(),
    quick_win_id: null,
    status: "pending",
    provider: "dodo",
    provider_order_id: null,
    raw: null,
  }),
  counters: () => ({ value_minor: 0, updated_at: nowIso() }),
};

const UNIQUE: Record<string, string[]> = {
  quick_wins: ["share_token"],
  orders: ["provider_order_id"],
  counters: ["key"],
};

const PRIMARY: Record<string, string> = { counters: "key" };

type Store = Map<string, Row[]>;
const g = globalThis as { __fitsoFakeDb?: Store };

function store(): Store {
  if (!g.__fitsoFakeDb) {
    g.__fitsoFakeDb = new Map([["counters", [{ key: "founding_revenue_usd_cents", value_minor: 0, updated_at: nowIso() }]]]);
  }
  return g.__fitsoFakeDb;
}

function table(name: string): Row[] {
  const s = store();
  if (!s.has(name)) s.set(name, []);
  return s.get(name)!;
}

class FakeQuery implements PromiseLike<Result> {
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private onConflict: string | undefined;
  private filters: Array<(r: Row) => boolean> = [];
  private orderBy: { col: string; asc: boolean } | null = null;
  private max: number | null = null;
  private mode: "many" | "single" | "maybe" = "many";
  private returning = false;

  constructor(private name: string) {}

  /** Column lists are ignored: all columns come back. */
  select(columns?: string): this {
    void columns;
    this.returning = true;
    return this;
  }
  insert(rows: Row | Row[]): this {
    this.op = "insert";
    this.payload = rows;
    return this;
  }
  upsert(rows: Row | Row[], opts?: { onConflict?: string }): this {
    this.op = "upsert";
    this.payload = rows;
    this.onConflict = opts?.onConflict;
    return this;
  }
  update(patch: Row): this {
    this.op = "update";
    this.payload = patch;
    return this;
  }
  delete(): this {
    this.op = "delete";
    return this;
  }
  eq(col: string, val: unknown): this {
    this.filters.push((r) => r[col] === val);
    return this;
  }
  in(col: string, vals: unknown[]): this {
    this.filters.push((r) => vals.includes(r[col]));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderBy = { col, asc: opts?.ascending ?? true };
    return this;
  }
  limit(n: number): this {
    this.max = n;
    return this;
  }
  single(): this {
    this.mode = "single";
    return this;
  }
  maybeSingle(): this {
    this.mode = "maybe";
    return this;
  }

  private match(): Row[] {
    return table(this.name).filter((r) => this.filters.every((f) => f(r)));
  }

  private violatesUnique(row: Row, ignore?: Row): string | null {
    for (const col of UNIQUE[this.name] ?? []) {
      if (row[col] == null) continue;
      if (table(this.name).some((r) => r !== ignore && r[col] === row[col])) return col;
    }
    return null;
  }

  private run(): Result {
    let out: Row[] = [];
    switch (this.op) {
      case "insert":
      case "upsert": {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
        for (const input of rows) {
          const conflictCol = this.onConflict ?? PRIMARY[this.name];
          const existing =
            this.op === "upsert" && conflictCol
              ? table(this.name).find((r) => r[conflictCol] === input[conflictCol])
              : undefined;
          if (existing) {
            Object.assign(existing, input, { updated_at: nowIso() });
            out.push(existing);
            continue;
          }
          const row: Row = { ...(DEFAULTS[this.name]?.() ?? { id: randomUUID() }), ...input };
          const dup = this.violatesUnique(row);
          if (dup) {
            return { data: null, error: { code: "23505", message: `duplicate key value violates unique constraint on ${dup}` } };
          }
          table(this.name).push(row);
          out.push(row);
        }
        break;
      }
      case "update": {
        for (const row of this.match()) {
          const next = { ...row, ...(this.payload as Row) };
          if ("updated_at" in row) next.updated_at = nowIso();
          const dup = this.violatesUnique(next, row);
          if (dup) {
            return { data: null, error: { code: "23505", message: `duplicate key value violates unique constraint on ${dup}` } };
          }
          Object.assign(row, next);
          out.push(row);
        }
        break;
      }
      case "delete": {
        const doomed = new Set(this.match());
        store().set(this.name, table(this.name).filter((r) => !doomed.has(r)));
        out = [...doomed];
        break;
      }
      default:
        out = this.match();
    }

    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      out = [...out].sort((a, b) => {
        const x = a[col] as string | number;
        const y = b[col] as string | number;
        return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1);
      });
    }
    if (this.max !== null) out = out.slice(0, this.max);

    const wantsData = this.op === "select" || this.returning;
    const copy = out.map((r) => structuredClone(r));
    if (this.mode === "single") {
      if (copy.length !== 1) {
        return { data: null, error: { code: "PGRST116", message: `Expected 1 row, got ${copy.length}` } };
      }
      return { data: wantsData ? copy[0] : null, error: null };
    }
    if (this.mode === "maybe") {
      if (copy.length > 1) return { data: null, error: { code: "PGRST116", message: "Multiple rows" } };
      return { data: wantsData ? (copy[0] ?? null) : null, error: null };
    }
    return { data: wantsData ? copy : null, error: null };
  }

  then<R1 = Result, R2 = never>(
    onfulfilled?: ((value: Result) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return Promise.resolve().then(() => this.run()).then(onfulfilled, onrejected);
  }
}

const fake = { from: (name: string) => new FakeQuery(name) };

let real: SupabaseClient | null = null;

/** The server Supabase client, or the in-memory fake in stub mode. */
export function getDb(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("supabase.ts is server-only: the service-role client must never run in the browser.");
  }
  if (isStub.supabase) return fake as unknown as SupabaseClient;
  if (!real) {
    real = createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return real;
}

/** Test helper: wipe the in-memory fake. */
export function resetFakeDb(): void {
  g.__fitsoFakeDb = undefined;
}
