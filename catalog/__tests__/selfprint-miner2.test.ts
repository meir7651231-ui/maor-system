/**
 * 📖 MINER2 (15.10.2026) — "ללמד את מנוע-השרטוטים-העצמי לקרוא בקוד גם 'אם', לולאות עם תנאי, 'חזור עד שאין שיפור'
 * ו'בחר את הטוב ביותר'".
 *
 * מה ננעל:
 * 1. הקורא (read.mjs): שמירה ‎if (!xs.length) return 0‎ ⇒ ‎⟨choose⟩‎ · "בחר את הטוב לפי ציון" ⇒ לולאה עם מצב-רשומה
 *    ‎{a: הציון, b: הנבחר}‎ ושני choose על אותו תנאי · ‎while (changed) { changed = false; … }‎ ⇒ ‎until: "stable"‎ (הדגל לא במצב) ·
 *    ‎filter‎ ⇒ ‎$cat‎ מותנה · ‎for (let i…)‎ ⇒ ‎⟨range⟩‎ + ‎xs[i]‎ ⇒ ‎⟨at⟩‎ · השוואה ⇒ חור-אופרטור.
 * 2. הריצה: הענף שלא נבחר לא מפיל ("רעל") — ממוצע-עם-שמירה על רשימה ריקה = 0, לא NaN. גרף בלי choose — בלי שינוי.
 * 3. הסוגים: על השלדים של הכורה הראשון (עם התוויות שלו) typings ≡ typingsV1 — אותן תוצאות בדיוק.
 * 4. השאר-אחד-בחוץ חמור: מספיק מקור אחד שמממש את הפועל; ייחוסי-הפעלים ומוצר-החלוקה מסמנים ‎taint‎ (בלי להיכנס לספרייה).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { CATALOG } from '../combiner/load.mjs';
import { graphProblem, runGraph, graphNodes } from '../combiner/graph.mjs';
import { typings, typingsV1, baseCaller, hasChoose, holeVar, POISON, BASE_FN, runOpsGraph } from '../selfprint/lib.mjs';
import { readFn } from '../selfprint/read.mjs';

const SP = join(CATALOG, 'selfprint');
const rd = (src: string) => {
  const sf = ts.createSourceFile('x.ts', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let fn: any = null; const v = (n: any) => { if (!fn && (ts.isFunctionDeclaration(n) || ts.isArrowFunction(n))) fn = n; ts.forEachChild(n, v); }; v(sf);
  return readFn(fn) as any;
};
/** מריץ שלד: כל חור ⇐ fns[התווית]; חלקי-הבסיס — של המנוע (עם רעל אם יש choose). */
const runWith = (s: any, fns: Record<string, (...a: any[]) => any>, ...args: any[]) => {
  const parts = graphNodes(s.graph).map((n: any) => n.part);
  const call = (k: number, a: any[]) => { const v = fns[s.labels[holeVar(parts[k])]](...a); return v === undefined || (typeof v === 'number' && !Number.isFinite(v)) ? { err: 'x' } : { v }; };
  const r: any = runGraph(s.graph, args, baseCaller(parts, call, hasChoose(s.graph)));
  if ('err' in r) throw new Error(r.err);
  return r.v === POISON ? null : r.v;
};
const allNodes = (g: any): any[] => g.nodes.flatMap((n: any) => (n.loop ? [n, ...allNodes(n.loop)] : [n]));

describe('📖 MINER2 · הקורא', () => {
  it('שמירה: if (!xs.length) return 0; return sum(xs) / xs.length ⇒ choose, ועל רשימה ריקה = 0 (הענף השני לא מפיל)', () => {
    const s = rd('function avg(xs) { if (!xs.length) return 0; return sum(xs) / xs.length; }');
    expect(s.feats).toContain('guard');
    expect(allNodes(s.graph).filter((n) => n.part === '⟨choose⟩').length).toBe(2); // ‎!x‎ ⇒ choose(x,0,1) · השמירה
    expect(graphProblem(s.graph)).toBe(null);
    const F = { '.length': (xs: number[]) => xs.length, 'call:sum': (xs: number[]) => xs.reduce((a, b) => a + b, 0), '/': (a: number, b: number) => a / b };
    expect(runWith(s, F, [3, 1, 2])).toBe(2);
    expect(runWith(s, F, [])).toBe(0);
  });
  it('"בחר את הטוב לפי ציון" ⇒ לולאה, מצב {ציון, נבחר}, שני choose על אותו תנאי-השוואה', () => {
    const s = rd('function best(xs, p) { let b = null; let bs = Infinity; for (const x of xs) { const d = dist(x, p); if (d < bs) { bs = d; b = x; } } return b; }');
    expect(s.feats).toEqual(expect.arrayContaining(['best', 'compare', 'loop-if']));
    expect(s.labels).toEqual(['call:dist', '<']);
    const L = s.graph.nodes[0].loop;
    expect(L.init).toEqual({ a: 1e308, b: null });
    expect(L.nodes.filter((n: any) => n.part === '⟨choose⟩').map((n: any) => n.args[0])).toEqual(['@h1', '@h1']);
    const F = { 'call:dist': (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y), '<': (a: number, b: number) => (a < b ? 1 : 0) };
    expect(runWith(s, F, [{ x: 9, y: 9 }, { x: 1, y: 2 }, { x: 5, y: 5 }], { x: 0, y: 0 })).toEqual({ x: 1, y: 2 });
    expect(typings(s, [s.labels], () => true)!.map((t: any) => t.key)).toContain('pts,pt|pt,pt>num;num,num>num');
  });
  it('"חזור עד שאין שינוי": while (changed) { changed = false; … changed = true … } ⇒ until:"stable", הדגל לא במצב; for (let i…) ⇒ ⟨range⟩, xs[i] ⇒ ⟨at⟩', () => {
    const s = rd('function f(xs) { let changed = true; let s = xs; while (changed) { changed = false; for (let i = 0; i < s.length - 1; i++) { if (s[i] > s[i + 1]) { s = swap(s, i); changed = true; } } } return s; }');
    expect(s.feats).toEqual(expect.arrayContaining(['until', 'index-loop', 'loop-if']));
    const L = s.graph.nodes[0].loop;
    expect([L.until, L.over, L.init]).toEqual(['stable', [0], '$i0']);
    expect(allNodes(s.graph).map((n: any) => n.part).filter((p: any) => p && p.startsWith('⟨'))).toEqual(['⟨range⟩', '⟨at⟩', '⟨at⟩', '⟨choose⟩']);
    const swap = (xs: number[], i: number) => { const c = [...xs]; [c[i], c[i + 1]] = [c[i + 1], c[i]]; return c; };
    const F = { '.length': (xs: number[]) => xs.length, '-': (a: number, b: number) => a - b, '+': (a: number, b: number) => a + b, '>': (a: number, b: number) => (a > b ? 1 : 0), 'call:swap': swap };
    expect(runWith(s, F, [5, 3, 9, 1])).toEqual([1, 3, 5, 9]); // מיון-בועות — רק כדי לראות שהצורה רצה
  });
  it('filter ⇒ $cat מותנה · ternary ⇒ choose · && / || ⇒ choose', () => {
    const s = rd('function pos(xs) { return xs.filter(x => x > 0); }');
    expect(s.graph.nodes[0].loop.init).toEqual([]);
    expect(runWith(s, { '>': (a: number, b: number) => (a > b ? 1 : 0) }, [3, -1, 2])).toEqual([3, 2]);
    const t = rd('const clamp = (x, a) => x < a ? a : Math.min(x, 10)');
    expect(t.feats).toEqual(expect.arrayContaining(['ternary', 'math']));
    expect(runWith(t, { '<': (a: number, b: number) => (a < b ? 1 : 0), 'Math.min': Math.min }, 30, 2)).toBe(10);
  });
  it('לא נקרא: break / return בתוך לולאה / שדה שאינו x,y', () => {
    expect(rd('function f(xs) { for (const x of xs) { if (x) return x; } return 0; }')).toBe(null);
    expect(rd('function f(o) { return o.name.length + 1; }')).toBe(null);
  });
});

describe('🧪 MINER2 · ריצה, סוגים, ספרייה', () => {
  it('חלקי-הבסיס: choose (≠0) · range (כולל/לא) · at (מחוץ ⇒ שגיאה) · משווים 1/0', () => {
    expect(BASE_FN['⟨choose⟩']([0, 1, 2])).toEqual({ v: 2 });
    expect(BASE_FN['⟨choose⟩']([POISON, 1, 2])).toEqual({ v: POISON });
    expect(BASE_FN['⟨range⟩']([1, 4, 0])).toEqual({ v: [1, 2, 3] });
    expect(BASE_FN['⟨range⟩']([1, 4, 1])).toEqual({ v: [1, 2, 3, 4] });
    expect('err' in BASE_FN['⟨at⟩']([[1], 3])).toBe(true);
    expect(BASE_FN['⟨cmp<=⟩']([2, 2])).toEqual({ v: 1 });
  });
  it('runOpsGraph: "המקור עצמו מממש את הפועל?" — מקסימום-בלולאה רץ על האופרטורים בלבד', () => {
    const m = rd('function mx(xs) { let m = -Infinity; for (const x of xs) if (x > m) m = x; return m; }');
    expect(runOpsGraph(m.graph, m.labels, [[3, 9, 2]], runGraph, graphNodes)).toBe(9);
  });
  const lib = JSON.parse(readFileSync(join(SP, 'library-code.json'), 'utf8'));
  it('הספרייה: לפני (v1) 235 פונקציות; עכשיו יותר, וכל שלד-v1 עדיין שם', () => {
    expect(lib.readers.v1.functions).toBe(235);
    expect(lib.readers.any.functions).toBeGreaterThan(700);
    expect(lib.readers.any.recurring).toBeGreaterThan(lib.readers.v1.recurring);
    expect(lib.shapes.filter((s: any) => s.by.includes('v1')).length).toBe(lib.readers.v1.distinct);
    for (const s of lib.shapes) expect(graphProblem(s.graph), s.id).toBe(null);
  });
  it('typings ≡ typingsV1 על כל שלדי-הכורה-הראשון (עם תוויות שהכורה הראשון מכיר)', () => {
    const CMP = /^(<|<=|>|>=|===|!==)$/;
    for (const s of lib.shapes.filter((x: any) => x.by.includes('v1'))) {
      const L = s.origins.map((o: any) => o.labels).filter((ls: string[]) => !ls.some((l) => CMP.test(l)));
      expect(JSON.stringify(typings({ graph: s.graph }, L, () => true)), s.id).toBe(JSON.stringify(typingsV1({ graph: s.graph }, L, () => true)));
    }
  });
  it('השאר-אחד-בחוץ חמור: ייחוסי-הפעלים/מוצר-החלוקה רק מסמנים taint; ו-selfprint חוסם פועל אם מקור אחד מממש', () => {
    expect(lib.taintFiles).toBeGreaterThan(0);
    for (const s of lib.shapes) for (const o of s.origins) expect(o.at, s.id).not.toMatch(/^catalog\/(lib\/verbs|products)\//);
    const src = readFileSync(join(SP, 'selfprint.mjs'), 'utf8');
    expect(src).toMatch(/const excl = \[\.\.\.new Set\(\[\.\.\.per\.flat\(\), \.\.\.taint\.flat\(\)\]\)\]\.sort\(\);/);
    expect(src).toMatch(/tour: \/tour\|route\|nearest\|neighbo\|2-\?opt/);
  });
});
