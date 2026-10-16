/**
 * 📖 RECIPES (16.10.2026) — ספר-המתכונים של מנוע-השרטוטים-העצמי (catalog/selfprint/recipes/). ננעל:
 * (1) הספר נעול ב-sha256 (book.mjs + load.mjs) — אחרי הנעילה רק הרצה; (2) כל שלד תקין מבנית ומקבל סוג;
 * (3) כללי: אין קבועים מלבד 0 (ו"הפריט הראשון"), אין חלקים קבועים מלבד חלקי-הבסיס, אין מתכון בלי חורים;
 * (4) המשמעות: מילוי ביד (פונקציות JS) נותן את מה שהתיעוד אומר — כולל שלושת התיקונים של הבודק-הספקן;
 * (5) השומר חוסם את המבחן הנסתר ב׳.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { RECIPES } from '../selfprint/recipes/book.mjs';
import { recipeShapes } from '../selfprint/recipes/load.mjs';
import * as S from '../selfprint/lib.mjs';
import { graphProblem, graphNodes, runGraph } from '../combiner/graph.mjs';
import { hiddenPath } from '../selfprint/guard.mjs';

const DIR = join(__dirname, '../selfprint/recipes');
const shapes = recipeShapes(RECIPES);
const byId = Object.fromEntries(shapes.map((s) => [s.id, s]));
type F = (...a: never[]) => unknown;
function run(id: string, fills: F[], args: unknown[]) {
  const s = byId[id]; const parts = graphNodes(s.graph).map((n: { part: string }) => n.part);
  const call = (k: number, a: never[]) => { const v = fills[S.holeVar(parts[k])](...a); return v === undefined || (typeof v === 'number' && !Number.isFinite(v)) ? { err: 'x' } : { v }; };
  const r = runGraph(s.graph, args, S.baseCaller(parts, call, S.hasChoose(s.graph)));
  return 'err' in r ? r : r.v;
}
const add = (a: number, b: number) => a + b; const lt = (a: number, b: number) => (a < b ? 1 : 0); const gt = (a: number, b: number) => (a > b ? 1 : 0);
const mean = (v: number[]) => v.reduce(add, 0) / v.length;
const d = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const xs = [6, 1, 9, 1, 3, 7, 2];

describe('RECIPES · הספר נעול וכללי', () => {
  it('sha256 של book.mjs + load.mjs = recipes/SHA256 (נעילה לפני ההרצה)', () => {
    const lines = readFileSync(join(DIR, 'SHA256'), 'utf8').trim().split('\n');
    for (const l of lines) { const [h, f] = l.split(/\s+/); expect(createHash('sha256').update(readFileSync(join(DIR, f))).digest('hex'), f).toBe(h); }
    expect(lines.length).toBe(2);
  });
  it('28 מתכונים ⇒ 41 שלדים; כל אחד תקין מבנית, עם ≥1 חור, ומקבל סוג', () => {
    expect(RECIPES.length).toBe(28);
    expect(shapes.length).toBe(41);
    for (const s of shapes) {
      expect(graphProblem(s.graph), s.id).toBeNull();
      expect(S.holeVars(s.graph).length, s.id).toBeGreaterThan(0);
      expect((S.typings({ graph: s.graph }, [s.labels], () => true) || []).length, s.id).toBeGreaterThan(0);
    }
  });
  it('כללי: חלקים קבועים = חלקי-בסיס בלבד; מספרים בגרף = 0 ו-1 בלבד (1 = ‎$slice(xs, 1)‎ "מהשני והלאה"; 600 = תקרת-חזרה); תוויות = משפחה/סוג בלבד', () => {
    const nums: number[] = [];
    const walk = (v: unknown, k = '') => { if (typeof v === 'number' && k !== 'max') nums.push(v); else if (Array.isArray(v)) v.forEach((x) => walk(x)); else if (v && typeof v === 'object') Object.entries(v).forEach(([kk, x]) => walk(x, kk)); };
    for (const r of RECIPES) {
      walk(r.graph);
      for (const n of graphNodes(r.graph)) expect(S.isHole(n.part) || ['⟨choose⟩', '⟨at⟩', '⟨cmp!==⟩'].includes(n.part), r.id + ' ' + n.part).toBe(true);
      for (const h of r.holes) expect([undefined, '<', '+', 'stat']).toContain(h.label);
    }
    expect([...new Set(nums)].sort()).toEqual([0, 1]);
  });
});

describe('RECIPES · המשמעות (מילוי ביד)', () => {
  it('סינון · מול-מספר · מול-מה-שנשמר', () => {
    expect(run('rcp-filter', [(x: number) => (x % 2 === 0 ? 1 : 0)], [xs])).toEqual([6, 2]);
    expect(run('rcp-filter-vs-stat~2', [gt, mean], [xs])).toEqual([6, 9, 7]);
    expect(run('rcp-filter-vs-kept', [(x: number, st: number[]) => (st.includes(x) ? 0 : 1)], [xs])).toEqual([6, 1, 9, 3, 7, 2]);
  });
  it('צבירה · חשב-פעם-אחת · ערך-רץ מהראשון בלי ספירה-כפולה (תיקון-הבודק)', () => {
    expect(run('rcp-fold-mapped-stat', [add, (x: number, m: number) => (x - m) ** 2, mean, (a: number, n: number) => a / n, (v: number[]) => v.length], [xs])).toBeCloseTo(8.693877551, 6);
    expect(run('rcp-scan-first', [add], [xs])).toEqual([6, 7, 16, 17, 20, 27, 29]);
    expect(run('rcp-scan-first', [add], [[5]])).toEqual([5]);
  });
  it('בחר-את-הטוב (גם מול קלט) · חלון מלא בלבד (תיקון-הבודק) · זוגות', () => {
    const P = [{ x: 0, y: 0 }, { x: 10, y: 1 }, { x: 1, y: 1 }, { x: 9, y: 0 }];
    expect(run('rcp-best-param', [d, lt], [P, { x: 8, y: 1 }])).toEqual({ x: 9, y: 0 });
    expect(run('rcp-best-index~0', [gt], [xs])).toBe(2);
    expect(run('rcp-window', [(v: number[]) => v.reduce(add, 0), add], [xs, 3])).toEqual([16, 11, 13, 11, 12]);
    expect(run('rcp-neighbors~1', [(a: number, b: number) => b - a], [xs])).toEqual([-5, 8, -8, 2, 4, -5]);
    expect(run('rcp-greedy-chain', [d, lt], [P])).toEqual([P[0], P[2], P[3], P[1]]);
  });
  it('חזור-עד-שאין-שינוי: שני החורים מחליטים (לא מיון קבוע — תיקון-הבודק)', () => {
    expect(run('rcp-until-stable', [Math.min, Math.max], [xs])).toEqual([1, 1, 2, 3, 6, 7, 9]);
    expect(run('rcp-until-stable', [Math.max, Math.min], [xs])).toEqual([9, 7, 6, 3, 2, 1, 1]);
  });
});

describe('RECIPES · עיוורון', () => {
  it('השומר חוסם את המבחן הנסתר ב׳', () => {
    expect(hiddenPath(join(__dirname, '../spfair/hidden/b/targets-b.mjs'))).toBe(true);
  });
});
