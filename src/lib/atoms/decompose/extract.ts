/**
 * 🔨 המפרק · הקורא ההצהרתי (ATOMS-DECOMPOSE, 14.10.2026).
 * קורא נתונים מ-Db לפי מפרט (`ExtractSpec`): נתיב שדות עם `[]` לפתיחת רשימות, סינון לפי שדה, וצורה לפי הסוג.
 * אין קוד במפרט ואין הרצה של מחרוזות. טהור, דטרמיניסטי, ולעולם לא זורק — Db חסר/פגום ⇒ תוצאה ריקה.
 */
import type { ExtractSpec, WhereValue } from './types';

/** תקרת-בטיחות: לא קוראים יותר מזה, גם ב-Db ענק. */
export const EXTRACT_MAX = 50_000;

export type Extracted =
  | { kind: 'times'; values: string[] }
  | { kind: 'amount'; values: number[] }
  | { kind: 'span'; unit: 'date' | 'clock' | 'number'; spans: { from: string | number; to: string | number }[] }
  | { kind: 'sequence'; groups: string[][] }
  | { kind: 'waiting'; items: { since: string | null }[]; total: number }
  | { kind: 'text'; values: string[] };

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const own = (o: Record<string, unknown>, k: string): unknown => (Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined);

const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;
const CLOCK = /^([01]?\d|2[0-3]):[0-5]\d$/;
/** תאריך (או רגע ISO) תקין ⇒ YYYY-MM-DD; שעה ⇒ HH:MM; אחר ⇒ null. */
export function momentOf(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (ISO_DAY.test(s) && Number.isFinite(Date.parse(s.slice(0, 10) + 'T12:00:00Z'))) return s.length > 10 ? s : s.slice(0, 10);
  if (CLOCK.test(s)) return s.padStart(5, '0');
  return null;
}

/** קריאת נתיב מתוך ערך: `a.b[].c` — כל `[]` פותח רשימה. ריק ⇒ הערך עצמו. */
export function readPath(root: unknown, path: string): unknown[] {
  let cur: unknown[] = [root];
  const segs = String(path ?? '')
    .split('.')
    .filter(Boolean);
  for (const seg of segs) {
    const many = seg.endsWith('[]');
    const key = many ? seg.slice(0, -2) : seg;
    const next: unknown[] = [];
    for (const v of cur) {
      if (!isObj(v)) continue;
      const x = own(v, key);
      if (many) {
        if (Array.isArray(x)) for (const y of x) if (next.length < EXTRACT_MAX) next.push(y);
      } else if (x !== undefined && x !== null) next.push(x);
    }
    cur = next;
  }
  return cur;
}

function matches(rec: Record<string, unknown>, where: Readonly<Record<string, WhereValue>> | undefined): boolean {
  if (!where) return true;
  for (const [k, want] of Object.entries(where)) {
    const v = own(rec, k);
    if (Array.isArray(want) ? !want.includes(v as string) : v !== want) return false;
  }
  return true;
}

/** הרשומות העליונות של האוסף, אחרי הסינון. */
export function recordsOf(db: unknown, spec: Pick<ExtractSpec, 'entity' | 'where'>): Record<string, unknown>[] {
  if (!isObj(db)) return [];
  const list = own(db, spec.entity);
  if (!Array.isArray(list)) return [];
  const out: Record<string, unknown>[] = [];
  for (const r of list) {
    if (out.length >= EXTRACT_MAX) break;
    if (isObj(r) && matches(r, spec.where)) out.push(r);
  }
  return out;
}

const parentOf = (path: string): string => (path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : '');
const leafOf = (path: string): string => (path.includes('.') ? path.slice(path.lastIndexOf('.') + 1) : path);
const byStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** טווח: שני הקצוות באותה יחידה ובסדר הנכון. */
function spanValue(v: unknown, unit: 'date' | 'clock' | 'number'): string | number | null {
  if (unit === 'number') return typeof v === 'number' && Number.isFinite(v) ? v : null;
  const m = momentOf(v);
  if (!m) return null;
  return unit === 'clock' ? (CLOCK.test(m) ? m : null) : ISO_DAY.test(m) ? m.slice(0, 10) : null;
}

/** קריאה לפי המפרט. לעולם לא זורק. */
export function extract(db: unknown, spec: ExtractSpec): Extracted | null {
  try {
    return extractUnsafe(db, spec);
  } catch {
    return null;
  }
}

function extractUnsafe(db: unknown, spec: ExtractSpec): Extracted | null {
  if (!spec || typeof spec !== 'object' || typeof spec.entity !== 'string') return null;
  const recs = recordsOf(db, spec);
  const path = typeof spec.path === 'string' ? spec.path : '';
  switch (spec.kind) {
    case 'times': {
      const values: string[] = [];
      for (const r of recs) for (const v of readPath(r, path)) {
        const m = momentOf(v);
        if (m) values.push(m);
      }
      return { kind: 'times', values: values.sort(byStr) };
    }
    case 'amount': {
      const values: number[] = [];
      for (const r of recs) for (const v of readPath(r, path)) if (typeof v === 'number' && Number.isFinite(v)) values.push(v);
      return { kind: 'amount', values };
    }
    case 'span': {
      const unit = spec.unit === 'clock' || spec.unit === 'number' ? spec.unit : 'date';
      const to = typeof spec.to === 'string' ? spec.to : '';
      if (!to || parentOf(to) !== parentOf(path)) return null;
      const spans: { from: string | number; to: string | number }[] = [];
      for (const r of recs)
        for (const item of readPath(r, parentOf(path))) {
          if (!isObj(item)) continue;
          const a = spanValue(own(item, leafOf(path)), unit);
          const b = spanValue(own(item, leafOf(to)), unit);
          if (a === null || b === null || b < a) continue;
          spans.push({ from: a, to: b });
        }
      return { kind: 'span', unit, spans };
    }
    case 'sequence': {
      const df = typeof spec.dateField === 'string' ? spec.dateField : '';
      const pick = (item: unknown): string | null => {
        const m = df ? (isObj(item) ? momentOf(own(item, df)) : null) : momentOf(item);
        return m && ISO_DAY.test(m) ? m.slice(0, 10) : null;
      };
      const groups: string[][] = [];
      if (!path && typeof spec.groupBy === 'string' && spec.groupBy) {
        // האוסף עצמו, קבוצה לכל ערך של שדה-הקבוצה (סדר הקבוצות = סדר ההופעה הראשונה)
        const by = new Map<string, string[]>();
        for (const r of recs) {
          const k = own(r, spec.groupBy);
          const d = pick(r);
          if ((typeof k !== 'string' && typeof k !== 'number') || k === '' || d === null) continue;
          const g = by.get(String(k));
          if (g) g.push(d);
          else by.set(String(k), [d]);
        }
        for (const g of by.values()) groups.push(g.sort(byStr));
      } else if (!path) {
        // האוסף עצמו הוא הרצף — קבוצה אחת
        const g = recs.map(pick).filter((x): x is string => x !== null);
        if (g.length) groups.push(g.sort(byStr));
      } else
        for (const r of recs) {
          const g = readPath(r, path)
            .map(pick)
            .filter((x): x is string => x !== null);
          if (g.length) groups.push(g.sort(byStr));
        }
      return { kind: 'sequence', groups };
    }
    case 'waiting': {
      const items: { since: string | null }[] = [];
      let total = 0;
      const sinceKey = typeof spec.since === 'string' ? spec.since : '';
      for (const r of recs)
        for (const item of readPath(r, path)) {
          if (!isObj(item)) continue;
          total++;
          let open = false;
          if (spec.status && typeof spec.status.field === 'string' && Array.isArray(spec.status.open)) open = spec.status.open.includes(own(item, spec.status.field) as string);
          else if (typeof spec.done === 'string') open = own(item, spec.done) === false;
          if (!open) continue;
          items.push({ since: sinceKey ? momentOf(own(item, sinceKey)) : null });
        }
      return { kind: 'waiting', items, total };
    }
    case 'text': {
      const values: string[] = [];
      for (const r of recs)
        for (const v of readPath(r, path)) {
          if (typeof v === 'string' && v.trim()) values.push(v.trim());
          else if (Array.isArray(v)) for (const x of v) if (typeof x === 'string' && x.trim()) values.push(x.trim());
        }
      return { kind: 'text', values };
    }
    default:
      return null;
  }
}
