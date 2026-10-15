/**
 * 🌱 מנוע-הצמיחה (GROW, 15.10.2026) — "חיבור א עם ב ⇒ יצא ג; יש ג טוב יותר? משאיר את הטוב וממשיך מעליו."
 *
 * מה ננעל:
 * 1. צורות-החיבור (chain/pair/map/mapc/fold/fix) הן **חיווט בלבד** — גרף רגיל של combiner/graph.mjs שעובר graphProblem,
 *    וההטמעה (inline) של גרף בתוך גרף — גם לולאה בתוך לולאה — נותנת בדיוק את ההרכבה המתמטית (חלקים מזויפים, טהור).
 * 2. הטביעה: זבל מזוהה (תמיד אותו פלט · מחזיר את הקלט · לא רץ · פלט מעורב), ושני מימושים של אותה התנהגות ⇒ אותה טביעה.
 * 3. בדיקת-האמת לא נותנת שם שגוי: ‎−סכום‎ / אמצע-הטווח / "לא תמיד אותו קצה" נדחים (הממצא של BLUEPRINTS §5).
 * 4. הפנקס והמדף שבריפו עקביים: כל "ממה הוא בנוי" קיים, כל שיפור = פחות צעדים (או אותם ופחות צמתים) מאותה טביעה,
 *    כל שם של פועל חלש מגובה בבדיקת-אמת, ובלי פרטים אישיים.
 *    הדטרמיניזם המלא (הרצה שנייה ⇒ אותם בתים) = `node catalog/grow/grow.mjs --check` (כמה דקות — שער, לא בדיקה כאן).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CATALOG } from '../combiner/load.mjs';
import { graphProblem, runGraph, graphNodes } from '../combiner/graph.mjs';
import { FORMS, partGraph, judge, samplesOf, better, semOfValue } from '../grow/lib.mjs';
import { truthOf, WEAK } from '../grow/truth.mjs';
import { piiLeak } from '../combiner/core.mjs';

/** חלקים מזויפים — כדי לבדוק את החיווט לבד. */
const FAKE: Record<string, (...a: any[]) => any> = {
  inc: (x: number) => x + 1,
  dbl: (x: number) => 2 * x,
  add: (a: number, b: number) => a + b,
  half: (x: number) => (x > 1 ? Math.floor(x / 2) : x),
  sum: (xs: number[]) => xs.reduce((a, b) => a + b, 0),
  neg: (xs: number[]) => -xs.reduce((a, b) => a + b, 0),
  mid: (xs: number[]) => (Math.max(...xs) + Math.min(...xs)) / 2,
};
const SIG: Record<string, [string[], string]> = { inc: [['num'], 'num'], dbl: [['num'], 'num'], add: [['num', 'num'], 'num'], half: [['num'], 'num'], sum: [['nums'], 'num'] };
const thing = (p: string) => ({ sig: SIG[p][0], out: SIG[p][1], graph: partGraph(p, SIG[p][0].length) });
const run = (g: any, ...args: any[]) => {
  const ps = graphNodes(g).map((n: any) => n.part);
  const r: any = runGraph(g, args, (k: number, a: any[]) => ({ v: FAKE[ps[k]](...a) }));
  if ('err' in r) throw new Error(r.err);
  return r.v;
};
const make = (form: string, A: any, B?: any) => {
  const f = (FORMS as any)[form];
  const ty = B ? f.type(A, B) : f.type(A);
  const g = B ? f.graph(A, B) : f.graph(A);
  expect(graphProblem(g)).toBeNull();
  return { ...ty, graph: g };
};

describe('🌱 צורות-החיבור = חיווט בלבד (graph.mjs)', () => {
  it('chain · pair · map · mapc · fold · fix נותנים את ההרכבה המתמטית', () => {
    const inc = thing('inc'); const dbl = thing('dbl'); const add = thing('add'); const half = thing('half');
    expect(run(make('chain', inc, dbl).graph, 5)).toBe(12);
    const ch2 = make('chain', inc, add); expect(ch2.sig).toEqual(['num', 'num']); expect(run(ch2.graph, 5, 10)).toBe(16);
    const pr = make('pair', dbl, add); expect(pr.sig).toEqual(['num', 'num']); expect(run(pr.graph, 3, 4)).toBe(14);
    const mp = make('map', inc); expect(mp.sig).toEqual(['nums']); expect(mp.out).toBe('nums'); expect(run(mp.graph, [1, 2, 3])).toEqual([2, 3, 4]);
    expect(run(make('mapc', add).graph, [1, 2], 10)).toEqual([11, 12]);
    const fo = make('fold', add); expect(fo.sig).toEqual(['nums', 'num']); expect(run(fo.graph, [1, 2, 3], 100)).toBe(106);
    expect(run(make('fix', half).graph, 40)).toBe(1);
    expect((FORMS as any).pair.type(dbl, inc)).toBeNull(); // סוג לא מתאים ⇒ לא נבנה
    expect((FORMS as any).fold.type(inc)).toBeNull();
  });
  it('הטמעה בתוך הטמעה (לולאה בתוך לולאה, צבירה מעל שרשרת) — אותה תשובה כמו הרכבה ישירה', () => {
    const inc = thing('inc'); const dbl = thing('dbl'); const add = thing('add'); const sum = thing('sum');
    const mapIncDbl = make('map', make('chain', inc, dbl)); // [2(x+1)]
    expect(run(mapIncDbl.graph, [0, 1, 5])).toEqual([2, 4, 12]);
    const sumOfMap = make('chain', mapIncDbl, sum); // Σ 2(x+1)
    expect(run(sumOfMap.graph, [0, 1, 5])).toBe(18);
    const fixOfMap = make('fix', make('map', thing('half'))); // חצי עד שאין שינוי, לכל פריט
    expect(run(fixOfMap.graph, [40, 9, 1])).toEqual([1, 1, 1]);
    const foldChain = make('fold', make('chain', add, inc)); // s ⇐ s + p + 1
    expect(run(foldChain.graph, [1, 2], 0)).toBe(5);
    const pairOfFold = make('pair', make('chain', mapIncDbl, sum), add); // Σ2(x+1) + Σ2(y+1)
    expect(run(pairOfFold.graph, [0], [1, 1])).toBe(10);
    const ids = graphNodes(pairOfFold.graph).map((n: any) => n.id);
    expect(new Set(ids).size).toBe(ids.length); // שמות ייחודיים אחרי ההטמעה
  });
});

describe('🌱 טביעה וזבל', () => {
  const S = samplesOf(['nums']);
  const outsOf = (f: (xs: number[]) => any) => S.map(([xs]) => { try { const v = f(xs); return semOfValue(v) === null ? null : v; } catch { return null; } });
  it('אותה התנהגות ⇒ אותה טביעה; התנהגות אחרת ⇒ אחרת', () => {
    const a = judge(['nums'], S, outsOf((xs) => xs.reduce((s, x) => s + x, 0)));
    const b = judge(['nums'], S, outsOf((xs) => { let s = 0; for (let k = xs.length - 1; k >= 0; k--) s += xs[k]; return s; }));
    const c = judge(['nums'], S, outsOf((xs) => -xs.reduce((s, x) => s + x, 0)));
    expect(a.fp).toBeTruthy(); expect(a.fp).toBe(b.fp); expect(c.fp).not.toBe(a.fp);
  });
  it('זבל: תמיד אותו פלט · מחזיר את הקלט · לא רץ · פלט מעורב', () => {
    expect(judge(['nums'], S, outsOf(() => 7)).junk).toBe('תמיד אותו פלט');
    expect(judge(['nums'], S, outsOf((xs) => xs)).junk).toBe('מחזיר את הקלט כמו שהוא');
    expect(judge(['nums'], S, outsOf(() => { throw new Error('x'); })).junk).toBe('לא רץ על רוב הקלטים');
    expect(judge(['nums'], S, outsOf((xs) => (xs.length % 2 ? xs.length : [xs.length]))).junk).toBe('פלט מעורב');
  });
  it('"טוב יותר" = פחות צעדים ⇒ פחות צמתים ⇒ מפתח', () => {
    expect(better({ steps: 5, nParts: 9, key: 'b' }, { steps: 6, nParts: 1, key: 'a' })).toBeLessThan(0);
    expect(better({ steps: 5, nParts: 1, key: 'b' }, { steps: 5, nParts: 2, key: 'a' })).toBeLessThan(0);
  });
});

describe('⚖️ בדיקת-האמת לא נותנת שם שגוי', () => {
  const k = 'nums>num';
  it('‎−סכום / אמצע-הטווח / לא-תמיד-אותו-קצה נדחים; המימוש הנכון עובר', () => {
    expect(truthOf('sum', k, ([xs]: any) => FAKE.sum(xs))).toBeNull();
    expect(truthOf('sum', k, ([xs]: any) => FAKE.neg(xs))).toBeTruthy();
    expect(truthOf('average', k, ([xs]: any) => FAKE.mid(xs))).toBeTruthy();
    expect(truthOf('extreme', k, ([xs]: any) => (xs.length % 2 ? Math.max(...xs) : Math.min(...xs)))).toBeTruthy();
    expect(truthOf('extreme', k, ([xs]: any) => Math.min(...xs))).toBeNull();
    expect([...WEAK].sort()).toEqual(['average', 'extreme', 'sum']);
  });
});

const G = join(CATALOG, 'grow');
const readG = (f: string) => JSON.parse(readFileSync(join(G, f), 'utf8'));
describe('🌱 הפנקס והמדף שבריפו', () => {
  const ledger = readG('ledger.json');
  const files = readdirSync(join(G, 'shelf')).filter((f) => /^floor-\d+\.json$/.test(f));
  /** קומה 0 = רשומות מלאות; קומות 1+ = {cols, rows}. */
  const shelf = files.flatMap((f) => { const x = readG('shelf/' + f); return Array.isArray(x) ? x : x.rows.map((r: any[]) => Object.fromEntries(x.cols.map((c: string, k: number) => [c, r[k]]))); });
  const gone = readG('shelf/replaced.json');
  const parts = readG('shelf/parts.json');
  const full = [...shelf.filter((t: any) => t.floor === 0), ...readG('shelf/named.json'), ...readG('shelf/improved.json')];
  const byId = new Map([...shelf, ...gone].map((t: any) => [t.id, t]));
  it('הגודל בפנקס = המדף; טביעה אחת לכל דבר; עד הקומה שהפנקס אומר', () => {
    expect(shelf.length).toBe(ledger.shelf);
    expect(new Set(shelf.map((t: any) => t.fp)).size).toBe(shelf.length);
    expect(files.length).toBe(ledger.reachedFloor + 1);
  });
  it('כל "ממה הוא בנוי" קיים (גם מה שהוחלף בדרך), וכל חלק-בסיס עם "נמצא ב:"', () => {
    for (const t of [...shelf, ...gone]) for (const id of t.of || []) expect(byId.has(id), t.id + ' ⇐ ' + id).toBe(true);
    for (const t of full) for (const p of t.parts) expect(parts[p]?.where, p).toBeTruthy();
  });
  it('כל שיפור למדף הקיים = אותה טביעה כמו החלק המקורי, בפחות צעדים', () => {
    for (const r of ledger.improvements) {
      expect(r.now.steps).toBeLessThan(r.old.steps);
      expect(r.now.floor).toBeGreaterThan(0);
      expect(shelf.find((t: any) => t.id === r.now.id)?.fp).toBe(r.fp);
      expect(byId.get(r.old.id)?.fp).toBe(r.fp);
    }
  });
  it('שם של פועל חלש (sum/average/extreme) רק עם בדיקת-אמת', () => {
    for (const t of full) for (const v of t.verbs || []) if (WEAK.has(v)) expect(t.does, t.id).toMatch(/✓אמת/);
  });
  it('בלי פרטים אישיים', () => {
    expect(piiLeak(ledger)).toBeFalsy();
    expect(piiLeak(full.map((t: any) => t.example))).toBeFalsy();
    expect(piiLeak(parts)).toBeFalsy();
  });
});
