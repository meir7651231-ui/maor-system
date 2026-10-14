/**
 * 🧱 7 הפעלים שהיו static-only (STATIC-VERBS, 14.10.2026) — ratchet.
 * 1. לכל אחד ליבה טהורה ב-catalog/core, רשומה ב-sources/core-b.json (מעודכן — core-b-census --check) עם origins אמיתיים.
 * 2. קורא-ההתנהגות מצא את הפועל בכל ליבה בהרצה (n/n) — והוא הפועל הראשי שלה.
 * 3. הליבות טהורות: בלי שעון, בלי אקראיות לא-מוזרקת, בלי I/O.
 * 4. הבדלי-המצב שהחוקים הכלליים לא מפרידים: בהשהיה האחרון בגל מנצח, בהגבלת-קצב הראשון; backoff כפול עד תקרה.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { VERBS } from '../lib/verbs.mjs';
import { pace, backoff } from '../core/pace.mjs';
import { assignRoles } from '../core/assign-role.mjs';
import { route, routeAll } from '../core/route.mjs';
import { applyFrozen } from '../core/freeze.mjs';
import { tolerateEach, attempt } from '../core/tolerate.mjs';

const ROOT = join(__dirname, '..', '..');
const SEVEN = ['require-source', 'freeze', 'assign-role', 'route', 'tolerate', 'pace', 'relay'];
const src = JSON.parse(readFileSync(join(ROOT, 'catalog/sources/core-b.json'), 'utf8'));
const beh = JSON.parse(readFileSync(join(ROOT, 'catalog/behavior/core-b.json'), 'utf8'));

describe('7 הפעלים שהיו static-only', () => {
  it('כבר לא static-only: לכל אחד חוקים, ולכל חוק מוטנט', () => {
    for (const id of SEVEN) {
      const v = VERBS.find((x) => x.id === id) as { staticOnly?: boolean; laws: { id: string }[]; mutants: Record<string, unknown> };
      expect(v.staticOnly, id).toBeFalsy();
      expect(v.laws.length, id).toBeGreaterThanOrEqual(3);
      for (const l of v.laws) expect(typeof v.mutants[l.id], l.id).toBe('function');
    }
  });

  it('sources/core-b.json מעודכן, וכל ליבה עם origins (לפחות מקור אחד מאורביט ואחד מריפו אחר)', () => {
    execFileSync(process.execPath, [join(ROOT, 'catalog/scripts/core-b-census.mjs'), '--check'], { stdio: 'pipe' });
    expect(src.parts.map((p: { tags: string[] }) => p.tags.find((t) => t.startsWith('verb:'))!.slice(5)).sort()).toEqual([...SEVEN].sort());
    for (const p of src.parts) {
      expect(p.what, p.id).toBe('brick');
      expect(p.pure, p.id).toBe(true);
      expect(p.origins.some((o: { repo: string }) => o.repo === 'maor-system'), p.id).toBe(true);
      expect(p.origins.some((o: { repo: string; line: number | null }) => o.repo !== 'maor-system' && o.line !== null), p.id).toBe(true);
    }
  }, 30_000);

  it('הקורא מצא כל פועל בליבה שלו בהרצה (n/n), והוא הראשי', () => {
    for (const p of src.parts) {
      const verb = p.tags.find((t: string) => t.startsWith('verb:')).slice(5);
      const e = beh.parts.find((x: { id: string }) => x.id === p.id);
      expect(e.labeledBy, p.id).toBe('run');
      const h = e.verbs.find((v: { id: string }) => v.id === verb);
      expect(h, p.id + ' ⇏ ' + verb).toBeTruthy();
      expect(h.holds).toMatch(/^(\d+)\/\1$/);
      expect(e.primary, p.id).toBe(verb);
    }
  });

  it('הליבות טהורות: בלי Date/Math.random/I/O', () => {
    for (const p of src.parts) {
      const code = readFileSync(join(ROOT, p.path), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      expect(code, p.path).not.toMatch(/\bDate\b|Math\.random|\bfetch\(|\bprocess\.|\brequire\(|localStorage|setTimeout|from 'node:/);
    }
  });

  it('pace: בהשהיה האחרון בגל מנצח, בהגבלת-קצב הראשון; backoff כפול עד תקרה', () => {
    const t = [0, 1, 2, 5, 9, 10, 11];
    expect(pace(t, 3)).toEqual([0, 5, 9]);
    expect(pace(t, 3, 'debounce')).toEqual([5, 8, 14]);
    expect(pace([400, 0, 100], 400)).toEqual([0, 400]); // שומר-הלחיצה-הכפולה: לחיצה בתוך 400 נבלעת
    expect(pace(t, 0)).toEqual([0, 1, 2, 5, 9, 10, 11]);
    expect([0, 1, 2, 3, 7, 30].map((n) => backoff(n))).toEqual([0, 5000, 10000, 20000, 300000, 300000]);
  });

  it('assign-role: תפקיד אחד לכל חבר, אותו זרע ⇒ אותה חלוקה, ושינוי סדר לא משנה מי מקבל מה', () => {
    const plan = [{ role: 'admin', count: 1 }, { role: 'teacher', count: 2 }];
    const a = assignRoles(['m1', 'm2', 'm3', 'm4', 'm5'], plan, 42);
    const b = assignRoles(['m5', 'm3', 'm1', 'm4', 'm2'], plan, 42);
    expect(a.map((x) => x.role).sort()).toEqual(['admin', 'staff', 'staff', 'teacher', 'teacher']);
    for (const x of a) expect(b.find((y) => y.who === x.who)!.role).toBe(x.role);
  });

  it('route + freeze + tolerate: דוגמאות-עולם', () => {
    expect(route('Email ')).toBe('email');
    expect(route('inforu', [{ key: 'inforu', to: 'inforu' }], '019')).toBe('inforu'); // sendSmsVia
    expect(route('twilio', [{ key: 'inforu', to: 'inforu' }], '019')).toBe('019');
    expect(routeAll(['wa', 'fax', 'tel'])).toEqual({ whatsapp: ['wa'], default: ['fax'], phone: ['tel'] });
    const st = applyFrozen([{ op: 'put', id: 'r1', content: 'D-1' }, { op: 'freeze', id: 'r1' }, { op: 'put', id: 'r1', content: 'זיוף' }, { op: 'replace', id: 'r1', content: 'D-1 מתוקן' }]);
    expect(st).toEqual({ records: { r1: { versions: ['D-1', 'D-1 מתוקן'], frozen: true } }, rejected: [2] });
    expect(tolerateEach(['a', '%E0', 'b%20c'], decodeURIComponent, (s: string) => s)).toEqual(['a', '%E0', 'b c']); // safeDecode
    expect(attempt(() => { throw new Error('x'); }, 1, () => { throw new Error('y'); })).toBeNull();
  });
});
