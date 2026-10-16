/**
 * 📖 RECIPES2 (16.10.2026) — כרך ב׳ של ספר-המתכונים (catalog/selfprint/recipes/book2.mjs + load2.mjs). ננעל:
 * (1) הכרך נעול ב-sha256 (recipes/SHA256-2) — אחרי הנעילה רק הרצה; (2) כל שלד תקין מבנית ומקבל סוג;
 * (3) כללי: מספרים = 0/1 (ו-2 בתוך ‎$slice‎, 600 תקרה) בלבד, חלקים קבועים = חלקי-הבסיס, ‎$const‎ ⇐ הקוד שלנו בלבד;
 * (4) המשמעות: מילוי ביד נותן את מה שהתיעוד אומר — כולל תיקוני הבודק-הספקן (רשימה ריקה ⇒ אין תשובה);
 * (5) השומר חוסם את המבחן הנסתר ג׳.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { RECIPES } from '../selfprint/recipes/book2.mjs';
import { recipeShapes2, minedConsts } from '../selfprint/recipes/load2.mjs';
import * as S from '../selfprint/lib.mjs';
import { graphProblem, graphNodes, runGraph } from '../combiner/graph.mjs';
import { hiddenPath } from '../selfprint/guard.mjs';

const DIR = join(__dirname, '../selfprint/recipes');
const CODE = JSON.parse(readFileSync(join(__dirname, '../selfprint/library-code.json'), 'utf8'));
const consts = minedConsts(CODE.shapes, 5);
const shapes = recipeShapes2(RECIPES, consts);
const byId = Object.fromEntries(shapes.map((s) => [s.id, s]));
type F = (...a: never[]) => unknown;
function run(id: string, fills: F[], args: unknown[]) {
  const s = byId[id]; const parts = graphNodes(s.graph).map((n: { part: string }) => n.part);
  const call = (k: number, a: never[]) => { const v = fills[S.holeVar(parts[k])](...a); return v === undefined || (typeof v === 'number' && !Number.isFinite(v)) ? { err: 'x' } : { v }; };
  const r = runGraph(s.graph, args, S.baseCaller(parts, call, S.hasChoose(s.graph)));
  return 'err' in r || r.v === S.POISON ? null : r.v;
}
const add = (a: number, b: number) => a + b; const sub = (a: number, b: number) => a - b;
const lt = (a: number, b: number) => (a < b ? 1 : 0); const gt = (a: number, b: number) => (a > b ? 1 : 0);
const sum = (v: number[]) => v.reduce(add, 0); const mx = (v: number[]) => Math.max(...v);
const xs = [6, 1, 9, 1, 3, 7, 2];

describe('RECIPES2 · הכרך נעול וכללי', () => {
  it('sha256 של book2.mjs + load2.mjs = recipes/SHA256-2 (נעילה לפני ההרצה)', () => {
    const lines = readFileSync(join(DIR, 'SHA256-2'), 'utf8').trim().split('\n');
    for (const l of lines) { const [h, f] = l.split(/\s+/); expect(createHash('sha256').update(readFileSync(join(DIR, f))).digest('hex'), f).toBe(h); }
    expect(lines.length).toBe(2);
  });
  it('הקבועים של ‎$const‎ = מה שחוזר ≥5 פעמים בשלדי-הקוד (לפי שכיחות) — לא מהספר', () => {
    expect(consts).toEqual([0, 1, 2, 100, 5, -1, 3, 4, 12, 7, 60, 0.5, 10]);
  });
  it('20 מתכונים ⇒ 96 שלדים; כל אחד תקין מבנית, עם ≥1 חור, ומקבל סוג', () => {
    expect(RECIPES.length).toBe(20);
    expect(shapes.length).toBe(96);
    for (const s of shapes) {
      expect(graphProblem(s.graph), s.id).toBeNull();
      expect(S.holeVars(s.graph).length, s.id).toBeGreaterThan(0);
      expect((S.typings({ graph: s.graph }, [s.labels], () => true) || []).length, s.id).toBeGreaterThan(0);
    }
  });
  it('כללי: חלקים קבועים = חלקי-בסיס; מספרים בספר = 0, 1 (ו-2 בתוך ‎$slice‎; 600 = תקרה); תוויות = משפחה/סוג', () => {
    const nums: number[] = [];
    const walk = (v: unknown, k = '') => { if (typeof v === 'number' && k !== 'max') nums.push(v); else if (Array.isArray(v)) v.forEach((x) => walk(x)); else if (v && typeof v === 'object') Object.entries(v).forEach(([kk, x]) => walk(x, kk)); };
    for (const r of RECIPES) {
      walk(r.graph);
      for (const n of graphNodes(r.graph)) expect(S.isHole(n.part) || ['⟨choose⟩', '⟨at⟩', '⟨cmp===⟩'].includes(n.part), r.id + ' ' + n.part).toBe(true);
      for (const h of r.holes) expect([undefined, '<', '+', 'stat']).toContain(h.label);
    }
    expect([...new Set(nums)].sort()).toEqual([0, 1, 2]);
  });
});

describe('RECIPES2 · המשמעות (מילוי ביד)', () => {
  it('חזור-על-מספר-עד-תנאי', () => {
    expect(run('rcp-num-until-acc#10', [gt, (a: number, b: number) => a / b, Math.floor, (a: number, b: number) => a % b, add], [1234])).toBe(10);
    expect(run('rcp-num-until-count#10', [(a: number) => (a >= 1 ? 1 : 0), (n: number) => Math.floor(n / 10), add], [1234])).toBe(4);
    expect(run('rcp-pair-until', [(a: number, b: number) => (a !== b ? 1 : 0), (a: number, b: number) => a % b], [48, 18])).toBe(6);
  });
  it('מונה-שמתאפס · ספירה-מותנית · שלשות; רשימה ריקה ⇒ אין תשובה (תיקון-הבודק)', () => {
    expect(run('rcp-reset-run', [gt, add, Math.max], [[1, 2, 3, 1, 2, 3, 4, 0]])).toBe(4);
    expect(run('rcp-reset-run', [gt, add, Math.max], [[]])).toBeNull();
    expect(run('rcp-reset-run-each', [gt, add], [[1, 2, 3, 1, 2]])).toEqual([1, 2, 3, 1, 2]);
    expect(run('rcp-reset-run-each', [gt, add], [[]])).toBeNull();
    expect(run('rcp-count-pairs-if', [(a: number, b: number) => a * b, lt, add], [[1, -2, 3, 4, -1]])).toBe(3);
    expect(run('rcp-triples-if', [gt, add], [xs])).toBe(2);
    expect(run('rcp-triples-keep', [gt], [xs])).toEqual([9, 7]);
  });
  it('כל-פריט-מול-כולם', () => {
    expect(run('rcp-each-vs-all', [lt, sum], [xs])).toEqual([4, 0, 6, 0, 3, 5, 2]);
    expect(run('rcp-each-vs-later', [gt, sum], [xs])).toEqual([2, 4, 0, 3, 1, 0, 0]);
    expect(run('rcp-each-first-later', [gt, () => -1], [xs])).toEqual([9, 9, -1, 3, 7, -1, -1]);
  });
  it('הרכבה · ערך-רץ דו-שלבי · מההתחלה · חלון-קבוע', () => {
    const win = (v: number[], w: number) => { const o: number[] = []; for (let i = 0; i + w <= v.length; i++) o.push(sum(v.slice(i, i + w))); return o; };
    expect(run('rcp-then-stat', [win, mx], [xs, 3])).toBe(16);
    expect(run('rcp-then-best-index', [win, gt], [xs, 3])).toBe(0);
    const pm = (v: number[]) => { let m = Infinity; return v.map((x) => (m = Math.min(m, x))); };
    expect(run('rcp-zip-prepared', [pm, sub, mx], [xs])).toBe(8);
    expect(run('rcp-scan-two-step', [add, Math.max, mx], [[-2, 1, -3, 4, -1, 2, 1, -5, 4]])).toBe(6);
    expect(run('rcp-prefix-stat', [add, mx], [xs])).toEqual([6, 6, 9, 9, 9, 9, 9]);
    expect(run('rcp-window-const#3', [add, sum, mx], [xs])).toBe(16);
  });
});

describe('RECIPES2 · עיוורון', () => {
  it('השומר חוסם את המבחן הנסתר ג׳', () => {
    expect(hiddenPath(join(__dirname, '../spfair/hidden/c/targets-c.mjs'))).toBe(true);
  });
});
