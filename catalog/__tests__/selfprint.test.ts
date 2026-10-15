/**
 * 🧭 SELFPRINT (15.10.2026) — "המנוע צריך לבנות לעצמו שרטוטים — ואני מדגיש: לבנות לעצמו."
 *
 * מה ננעל:
 * 1. עיוורון: אף קובץ ב-catalog/selfprint לא מייבא את blueprints/shapes.mjs (שרטוטי-AI) / search.mjs / mine.mjs הישן,
 *    והשומר חוסם את הנתיבים האלה (קריאה וייבוא).
 * 2. הכורה: אופרטור/‎.length‎/קריאה ⇒ חור (הסיבה ש-BLUEPRINTS נתן 0 — §כורה בדוח); ‎reduce‎ ⇒ צומת-לולאה; שלד שהצמיחה
 *    כבר בונה (שרשרת/זוג) מסומן ולא נכנס; ‎bookingBalance‎ (‎total(b) − paid(b)‎) ⇒ "שני חישובים על אותו קלט ואז צירוף".
 * 3. מילוי: חור ⇐ גרף מוטמע, כולל קבוע בקלט ובתוך לולאה; הסוגים: ‎/‎ ⇐ מספר,מספר; ‎.length‎ ⇐ רשימה.
 * 4. שרטוט מהצלחה: "ממיין ⇒ קח-ראשון" ⇒ "ממיין ⇒ □" ו-"□ ⇒ קח-ראשון"; שכבות + "קודם מה שמבינים".
 * 5. 🔴 התוצאה שבריפו: ממצע נבנה מחדש בדיוק משרטוט-מהקוד (סכום · אורך · חילוק — חלקים אמיתיים, 300 קלטים אקראיים),
 *    השאר-אחד-בחוץ מכובד (מה שהמקור שלו מממש את הפועל לא נספר), ושיפורים שגויים = 0.
 *    הדטרמיניזם המלא = `node catalog/selfprint/selfprint.mjs --check` (מריץ גם את הצמיחה — דקות; שער, לא בדיקה כאן).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { CATALOG } from '../combiner/load.mjs';
import { graphProblem, runGraph, graphNodes } from '../combiner/graph.mjs';
import { partGraph } from '../grow/lib.mjs';
import { fillGraph, typings, derive, layered, conceptsFirst, holeVars, OPS } from '../selfprint/lib.mjs';
import { skeletonOf, growCanBuild } from '../selfprint/mine.mjs';
import { hiddenPath } from '../selfprint/guard.mjs';

const SP = join(CATALOG, 'selfprint');
const runFake = (g: any, fns: Record<string, (...a: any[]) => any>, ...args: any[]) => {
  const ps = graphNodes(g).map((n: any) => n.part);
  const r: any = runGraph(g, args, (k: number, a: any[]) => ({ v: fns[ps[k]](...a) }));
  if ('err' in r) throw new Error(r.err);
  return r.v;
};
const skel = (src: string) => {
  const sf = ts.createSourceFile('x.ts', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let fn: any = null; const v = (n: any) => { if (!fn && (ts.isFunctionDeclaration(n) || ts.isArrowFunction(n))) fn = n; ts.forEachChild(n, v); }; v(sf);
  return skeletonOf(fn);
};

describe('🚫 SELFPRINT · עיוורון — בלי שרטוטים שנכתבו ביד', () => {
  it('אף קובץ לא מייבא את shapes.mjs / search.mjs / הכורה הישן; השומר חוסם אותם', () => {
    for (const f of readdirSync(SP).filter((x) => x.endsWith('.mjs'))) {
      const src = readFileSync(join(SP, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect(src, f).not.toMatch(/import[^;]*blueprints\/(shapes|search|mine)\.mjs/);
      expect(src, f).not.toMatch(/\bSUPER\b|templatesOf/);
    }
    for (const p of ['catalog/blueprints/shapes.mjs', 'catalog/blueprints/search.mjs', 'catalog/blueprints/library.json', 'catalog/combiner/verb-recipes.json', 'catalog/blueprints/found/x.json']) expect(hiddenPath('/r/' + p), p).toBe(true);
    expect(hiddenPath('/r/catalog/blueprints/engine.mjs')).toBe(false);
  });
  it('כל השרטוטים בריפו באים משני המקורות האוטומטיים בלבד', () => {
    const bps = JSON.parse(readFileSync(join(SP, 'blueprints.json'), 'utf8'));
    expect(bps.length).toBeGreaterThan(10);
    for (const b of bps) expect(['code', 'success', 'success-of-blueprint'], b.id).toContain(b.source);
  });
});

describe('⛏️ SELFPRINT · הכורה — כל חישוב הוא חור', () => {
  it('bookingBalance: total(b) − paid(b) ⇒ שני חישובים שונים על אותו קלט ואז צירוף (לא בצורות הצמיחה)', () => {
    const s: any = skel('function bookingBalance(b) { return bookingTotal(b) - bookingPaid(b); }');
    expect(s.graph.nodes.map((n: any) => [n.part, n.args])).toEqual([['□0', ['$i0']], ['□1', ['$i0']], ['□2', ['@h0', '@h1']]]);
    expect(s.labels).toEqual(['call:bookingTotal', 'call:bookingPaid', '-']);
    expect(growCanBuild(s)).toBe(null);
    expect(graphProblem({ ...s.graph, nodes: s.graph.nodes.map((n: any) => ({ ...n, part: 'p' })) })).toBe(null);
  });
  it('אופרטור + ‎.length‎ + ‎reduce‎ ⇒ חורים וצומת-לולאה; שרשרת/זוג ⇒ "הצמיחה כבר בונה"', () => {
    const s: any = skel('const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;');
    expect(s.graph.nodes[0].loop.nodes[0].part).toBe('□0');
    expect(s.labels).toEqual(['+', '.length', '/']);
    expect(growCanBuild(skel('function f(x) { return g(h(x)); }'))).toBe('chain');
    expect(growCanBuild(skel('function f(a, b) { return dist(a) - dist(b); }'))).toBe('pair');
    expect(skel('function f(x) { if (x) { foo(); } return 1; }')).toBe(null);
  });
});

describe('🧩 SELFPRINT · מילוי, סוגים, שרטוט מהצלחה', () => {
  const fork = { inputs: ['i0'], nodes: [{ id: 'h0', part: '□0', args: ['$i0'] }, { id: 'h1', part: '□1', args: ['$i0'] }, { id: 'h2', part: '□2', args: ['@h0', '@h1'] }], out: '@h2' };
  const FN = { sum: (xs: number[]) => xs.reduce((a, b) => a + b, 0), len: (xs: number[]) => xs.length, div: (a: number, b: number) => a / b, mul: (a: number, b: number) => a * b };
  it('fork(סכום, אורך, חילוק) = ממוצע — גרף רגיל שעובר graphProblem', () => {
    const g = fillGraph(fork, [partGraph('sum', 1), partGraph('len', 1), partGraph('div', 2)]);
    expect(graphProblem(g)).toBe(null);
    expect(runFake(g, FN, [3, 1, 2, 10])).toBe(4);
  });
  it('קבוע בקלט של חור ‎(x × 100)‎ ובתוך לולאה', () => {
    const g = fillGraph({ inputs: ['i0'], nodes: [{ id: 'h0', part: '□0', args: ['$i0', 100] }], out: '@h0' }, [partGraph('mul', 2)]);
    expect(runFake(g, FN, 7)).toBe(700);
    const s: any = skel('const total = (xs) => xs.reduce((a, b) => a + b * 2, 0);');
    expect(s.labels).toEqual(['*', '+']); // הארגומנטים נכרים לפני הצומת ⇒ ‎*‎ הוא □0
    const g2 = fillGraph(s.graph, [partGraph('mul', 2), { inputs: ['i0', 'i1'], nodes: [{ id: 'n', part: 'add', args: ['$i0', '$i1'] }], out: 'n' }]);
    expect(graphProblem(g2)).toBe(null);
    expect(runFake(g2, { ...FN, add: (a: number, b: number) => a + b }, [1, 2, 3])).toBe(12);
  });
  it('סוגים: ‎/‎ ⇐ מספר,מספר ⇒ מספר; ‎.length‎ ⇐ רשימה', () => {
    const t = typings({ graph: fork }, [['call:a', '.length', '/']], () => true);
    expect(t.map((x: any) => x.key)).toEqual(['nums|nums>num;nums>num;num,num>num', 'pts|pts>num;pts>num;num,num>num']);
    expect(OPS['/'](6, 3)).toBe(2);
  });
  it('שרטוט מהצלחה: "ממיין ⇒ קח-ראשון" ⇒ "ממיין ⇒ □" ו-"□ ⇒ קח-ראשון" (בלי "□ ⇒ □")', () => {
    const things = new Map<string, any>();
    const mk = (id: string, t: any) => { things.set(id, { id, ...t }); return things.get(id); };
    mk('s', { form: 'part', part: 'sort', sig: ['nums'], out: 'nums', graph: partGraph('sort', 1) });
    mk('f', { form: 'part', part: 'first', sig: ['nums'], out: 'num', graph: partGraph('first', 1) });
    const min = mk('m', { form: 'chain', of: ['s', 'f'], sig: ['nums'], out: 'num' });
    const ds = derive(min, things);
    expect(ds.map((d: any) => d.holed.join())).toEqual(['s', 'f']);
    expect(ds.every((d: any) => d.tree.kids.some((k: any) => k.k === 'hole'))).toBe(true);
  });
  it('שכבות + "קודם מה שמבינים": כל הצירופים של המובנים לפני השאר', () => {
    expect([...layered([[1, 2], [3, 4]])].map((c) => c.join(''))).toEqual(['13', '14', '23', '24']);
    const out = [...conceptsFirst([['a', 'B'], ['C', 'd']], (x: string) => x === x.toUpperCase())].map((c) => c.join(''));
    expect(out[0]).toBe('BC');
    expect(out.length).toBe(4); // 🔴 הבאג: מפתח-הכפילות קרס ⇒ רק 1
    expect(holeVars(fork)).toEqual([0, 1, 2]);
  });
});

describe('🔴 SELFPRINT · התוצאה שבריפו', () => {
  const cmp = JSON.parse(readFileSync(join(SP, 'compare.json'), 'utf8'));
  const found = JSON.parse(readFileSync(join(SP, 'found.json'), 'utf8'));
  const bps = JSON.parse(readFileSync(join(SP, 'blueprints.json'), 'utf8'));
  // MINER2 (15.10): הפלטים בריפו הם עכשיו של הספרייה המורחבת — שם, באותו תקציב, הממצע **לא** נבנה (התקציב התפזר על 103
  // שלדים במקום 24; CLOSED-MINER2 §3). התוצאה של SELFPRINT ננעלת על הביקורת שנכתבת באותה ריצה: אותו מנוע, אותו תקציב,
  // רק השלדים של הכורה הראשון ⇒ control-v1.json.
  const ctl = JSON.parse(readFileSync(join(SP, 'control-v1.json'), 'utf8'));
  it('ממצע נבנה מחדש בדיוק משרטוט שהמכונה בנתה לעצמה, ונספר רק אם המקור לא מממש ממצע', () => {
    expect(ctl.selfprint.exactRebuilt.average.byBlueprintFair).toBeGreaterThanOrEqual(1);
    expect(cmp.baseline.exactRebuilt.average).toBeUndefined();
    const avg = ctl.found.find((x: any) => x.verbs.includes('average'));
    expect(avg.blueprint.excl).not.toContain('average');
    expect(avg.blueprint.origin.names).not.toEqual(expect.arrayContaining([expect.stringMatching(/avg|mean|average/i)]));
  });
  it('השאר-אחד-בחוץ: מה שהמקור שלו מממש את הפועל מסומן ולא נספר', () => {
    for (const x of found) for (const v of x.excludedByLeaveOneOut) expect(x.blueprint.excl).toContain(v);
    for (const [v, e] of Object.entries<any>(cmp.selfprint.exactRebuilt)) expect(e.byBlueprintFair, v).toBeLessThanOrEqual(e.byBlueprint);
    expect(cmp.wrongImprovements).toBe(0);
    expect(ctl.wrongImprovements).toBe(0);
  });
  it('הממצע — חלקים אמיתיים בארגז-החול, 300 רשימות אקראיות', async () => {
    const avg = ctl.found.find((x: any) => x.verbs.includes('average'));
    const bp = bps.find((b: any) => b.id === avg.blueprint.id);
    const g = fillGraph(bp.graph, avg.fill.map((f: any, v: number) => partGraph(f.part, bp.graph.nodes.find((n: any) => n.part === '□' + v).args.length)));
    const { makeRuntime } = await import('../grow/runtime.mjs');
    const R: any = await makeRuntime({ callSteps: 500000, only: avg.fill.map((f: any) => f.part) });
    let s = 7;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let k = 0; k < 300; k++) {
      const xs = Array.from({ length: 1 + Math.floor(rnd() * 30) }, () => Math.floor(rnd() * 2000) - 1000);
      const want = xs.reduce((a, b) => a + b, 0) / xs.length;
      const got = R.runOne({ graph: g }, [xs]).v;
      expect(Math.abs(got - want), JSON.stringify(xs)).toBeLessThan(1e-9 * Math.max(1, Math.abs(want)));
    }
  }, 120000);
});
