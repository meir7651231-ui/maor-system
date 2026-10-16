/**
 * 🧺 PRODUCT-V2 (14.10.2026) — «מוקד-חלוקה» משתפר דרך המכונה. ratchet.
 * 1. שלושה פעלים חדשים (tour · allot · schedule) — כל אחד שילוב של חלקים מוכחים בגרף-עם-לולאה, ועבר את חוקי הפועל n/n
 *    במכונת-השילוב (ארגז-החול). כל חלק בשילוב מוכח בעצמו לתפקיד שהגרף נותן לו.
 * 2. הפונקציה שהדף קורא לה (מהחבילה הסטטית) עוברת את אותם חוקים בקורא-ההתנהגות — n/n — וזהה לשילוב בארגז-החול.
 * 3. כלי-המדידה (סכום · הפרש · אחוז · הגדול-מבין) — כל אחד חלק מוכח לתפקיד שלו, והחבילה = החלק בארגז-החול.
 * 4. הערך על נתוני-ההדגמה: המסלולים קצרים מסדר-הרשימה (כמו shop7 היום) ומ"מהקרובה לרחוקה" (גרסה 1).
 * 5. קנה-מידה: 400 משפחות · 30 מתנדבים — שיבוץ + 30 מסלולים + שעות מתחת ל-14M צעדים דטרמיניסטיים (≈300 מ״ש; RECIPES).
 * 6. הלולאה היא חיווט בלבד: graph.mjs לא קורא לשום חישוב מלבד החלקים (callNode), והגרף נבדק מבנית.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as B from '../lib/bridge';
import { probePart, directCall } from '../lib/probe.mjs';
import { VERB_BY_ID as LAW_VERBS } from '../lib/verbs.mjs';
import { pathLen, tourRef } from '../lib/verbs-route.mjs';
import { loadIndex } from '../combiner/load.mjs';
import { provenAs } from '../combiner/core.mjs';
import { partByHome } from '../combiner/combine.mjs';
import { graphNodes, graphProblem, graphLoops, runGraph } from '../combiner/graph.mjs';
import { comboFunction } from '../combiner/run-combo.mjs';
import { provenExtras } from '../runtime/proven.mjs';

const ROOT = join(__dirname, '..', '..');
const DIR = join(ROOT, 'catalog/products/distribution');
const assembly = JSON.parse(readFileSync(join(DIR, 'assembly.json'), 'utf8'));
const samples = JSON.parse(readFileSync(join(DIR, 'samples.json'), 'utf8'));
const combos = JSON.parse(readFileSync(join(ROOT, 'catalog/combiner/combos.json'), 'utf8'));
type Pt = { x: number; y: number };
type Graph = { inputs: string[]; nodes: { id: string; part?: string; role?: string; loop?: unknown }[]; out: string };
type Need = { id: string; verb: string; status: string; form: string; combo?: { holds: string; graph: Graph; recipe: string } };
const plain = (v: unknown) => JSON.parse(JSON.stringify(v ?? null));
const bundleP = import(pathToFileURL(join(DIR, 'parts.bundle.mjs')).href);
const NEW = { n17: 'tour', n18: 'allot', n19: 'schedule' } as const;

describe('PRODUCT-V2 · מסלול ממוטב, קיבולת, חלונות — מהמכונה', () => {
  it('שלושת הצרכים החדשים = שילוב-גרף שעבר את חוקי הפועל n/n; כל צומת מוכח לתפקיד שלו', () => {
    const ix = loadIndex();
    for (const [id, verb] of Object.entries(NEW)) {
      const n = (assembly.needs as Need[]).find((x) => x.id === id)!;
      expect(n.verb, id).toBe(verb);
      expect(n.status, id).toBe('combo');
      expect(n.form, id).toBe('graph');
      expect(n.combo!.holds, id).toMatch(/^(\d+)\/\1$/);
      const g = n.combo!.graph;
      expect(graphProblem(g), id).toBeNull();
      expect(graphLoops(g).length, id).toBeGreaterThan(0);
      for (const node of graphNodes(g)) expect(provenAs(partByHome(ix, node.part!), node.role!), id + ' ' + node.id + ' ' + node.part).toBe(true);
      const r = combos.results.find((x: { verb: string }) => x.verb === verb);
      expect(r.found.holds).toBe(n.combo!.holds);
      expect(r.found.laws).toEqual(LAW_VERBS.get(verb).laws.map((l: { id: string }) => l.id));
    }
    // tour: 5 חוקים (כל תחנה פעם אחת · מתחיל במתנדב · לא ארוך מסדר הרשימה · אופטימום-מקומי של 2-opt · דטרמיניסטי)
    expect(LAW_VERBS.get('tour').laws.map((l: { id: string }) => l.id)).toEqual(['tour.visits', 'tour.start', 'tour.shorter', 'tour.local', 'tour.det']);
  });

  it('הפונקציה מהחבילה (מה שהדף מריץ) עוברת את חוקי הפועל n/n בקורא-ההתנהגות — ושווה לשילוב בארגז-החול', async () => {
    const M = (await bundleP).runtime();
    for (const [id, verb] of Object.entries(NEW)) {
      const v = LAW_VERBS.get(verb);
      const res = probePart({ sig: { takes: v.ref.sig }, call: directCall(M[id]), seed: 4242, B, verbs: [v] });
      expect(res.status, id).toBe('ran');
      const h = (res.verbs || []).find((x: { id: string }) => x.id === verb);
      expect(h?.holds, id + ' ' + JSON.stringify(res.verbs)).toMatch(/^(\d+)\/\1$/);
      const sandboxed = await comboFunction(((assembly.needs as Need[]).find((x) => x.id === id)!.combo!.recipe).split('/').pop()!);
      for (const args of samples[id]) expect(plain(M[id](...structuredClone(args))), id).toEqual(plain(sandboxed(...structuredClone(args))));
    }
  }, 240_000);

  it('המסלול = מימוש-הייחוס (השכן-הקרוב ⇒ 2-opt) באורך, על 120 מקרים אקראיים — אף פעם לא ארוך יותר', async () => {
    const M = (await bundleP).runtime();
    let seed = 11;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const pts = (n: number): Pt[] => Array.from({ length: n }, () => ({ x: Math.round(rnd() * 400) / 10, y: Math.round(rnd() * 400) / 10 }));
    for (let t = 0; t < 120; t++) {
      const from = pts(1)[0]; const stops = pts(Math.floor(rnd() * 10));
      const got = M.n17(from, stops) as Pt[];
      expect(got[0]).toEqual(from);
      expect(pathLen(got)).toBeLessThanOrEqual(pathLen(tourRef(from, stops)) + 1e-9);
      expect(pathLen(got)).toBeLessThanOrEqual(pathLen([from, ...stops]) + 1e-9);
    }
  });

  it('כלי-המדידה: כל אחד חלק מוכח לתפקיד שלו, והחבילה מחזירה בדיוק מה שהחלק מחזיר בארגז-החול', async () => {
    const ix = loadIndex();
    expect((assembly.extras as { as: string }[]).map((x) => x.as)).toEqual(['sum', 'gap', 'pct', 'max']);
    for (const x of assembly.extras as { id: string; role: string; origins: { file: string; line: number }[] }[]) {
      expect(provenAs(partByHome(ix, x.id), x.role), x.id).toBe(true);
      expect(x.origins[0].line, x.id).toBeGreaterThan(0);
    }
    const X = (await bundleP).extras();
    const P = await provenExtras(assembly);
    for (const [k, cases] of Object.entries(samples._extras as Record<string, unknown[][]>))
      for (const args of cases) expect(plain(X[k](...structuredClone(args))), k).toEqual(plain(P[k](...structuredClone(args))));
  }, 120_000);

  it('הערך על נתוני-ההדגמה (40 משפחות · 6 מתנדבים · 8 סלים ברכב): קצר מסדר-הרשימה ומ"מהקרובה לרחוקה"', async () => {
    const b = await bundleP; const M = b.runtime(); const X = b.extras();
    const fit = (p: Pt) => ({ x: (0.06 + p.x * 0.88) * 6, y: (0.06 + p.y * 0.88) * 6 });
    const pts = (M.n1({ seed: 45 }, 86) as Pt[]).map(fit);
    const vols = pts.slice(0, 6); const fams = pts.slice(40, 80);
    const asg = M.n18(vols, fams, 8) as { item: Pt; b: number }[];
    expect(asg.filter((o) => o.b < 0)).toEqual([]);
    const stop = (p: Pt) => ({ ...p, open: 0, close: 1440 });
    const kmOf = (route: Pt[]) => { const rows = M.n19(route.map(stop), { start: 900, speed: 0.5, stay: 3 }) as { km: number }[]; return rows.length ? rows[rows.length - 1].km : 0; };
    const opt: number[] = []; const board: number[] = []; const radial: number[] = [];
    vols.forEach((v, k) => {
      const mine = fams.filter((f) => asg.find((o) => o.item === f)!.b === k);
      opt.push(kmOf(M.n17(v, mine) as Pt[])); board.push(kmOf([v, ...mine])); radial.push(kmOf([v, ...(M.n4(mine, v) as Pt[])]));
    });
    const O = X.sum(opt), Bd = X.sum(board), R = X.sum(radial);
    expect(O).toBeLessThan(R);
    expect(R).toBeLessThan(Bd);
    expect(X.pct(Bd, X.gap(O, Bd))).toBe(50); // "המסלולים קצרים ב-50% (35.4 ק״מ) לעומת סדר הרשימה" — הכותרת בדף
    expect(Math.round(X.gap(O, Bd) * 10) / 10).toBe(35.4);
    expect(X.pct(R, X.gap(O, R))).toBe(22);
  });

  it('קנה-מידה: 400 משפחות · 30 מתנדבים — שיבוץ + 30 מסלולים + שעות: פחות מ-14M צעדים (≈300 מ״ש), דטרמיניסטי', async () => {
    // RECIPES (16.10.2026) · היה: שעון-קיר, חציון של 3 < 300 מ״ש — נכשל לפעמים בהרצה המקבילית של vitest (304–310 מ״ש).
    // עכשיו: אותה עבודה בדיוק על עותק של החבילה עם מונה-הצעדים של המכונה (catalog/lib/steps.mjs › instrument — צעד בכל
    // גוף-פונקציה ובכל סיבוב-לולאה). אותו קוד + אותם קלטים ⇒ אותו מספר בכל מחשב ובכל עומס. הכיול (16.10, מחשב-הסשן, בלי עומס):
    // 5.58M צעדים ≈ 120 מ״ש ⇒ 300 מ״ש ≈ 14M צעדים. כלומר אותו סף, נמדד במה שלא תלוי בעומס; קפיצה ל-O(n³) (פי 400) נתפסת מיד.
    const { instrument, STEP_FN, PLUS_FN } = await import('../lib/steps.mjs');
    const { mkdtempSync, writeFileSync: wf } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const g = globalThis as Record<string, unknown>;
    let steps = 0;
    g[STEP_FN] = () => { steps++; };
    g[PLUS_FN] = (a: unknown, b: unknown) => (a as number) + (b as number);
    const f = join(mkdtempSync(join(tmpdir(), 'pv2-steps-')), 'parts.bundle.mjs');
    wf(f, instrument(readFileSync(join(DIR, 'parts.bundle.mjs'), 'utf8'))!);
    const M = (await import(pathToFileURL(f).href)).runtime();
    const pts = (M.n1({ seed: 45 }, 470) as Pt[]).map((p) => ({ x: p.x * 6, y: p.y * 6 }));
    const vols = pts.slice(0, 30); const fams = pts.slice(40, 440);
    const once = () => {
      steps = 0;
      const a = M.n18(vols, fams, 16) as { item: Pt; b: number }[];
      for (let v = 0; v < 30; v++) {
        const r = M.n17(vols[v], a.filter((o) => o.b === v).map((o) => o.item)) as Pt[];
        M.n19(r.map((p) => ({ ...p, open: 0, close: 1440 })), { start: 900, speed: 0.5, stay: 3 });
      }
      return steps;
    };
    once(); // ריצה ראשונה מאתחלת מטמונים פנימיים של החבילה (כמו החימום של פעם) — לא נמדדת
    const s1 = once(); const s2 = once();
    expect(s2).toBe(s1); // דטרמיניסטי
    expect(s1).toBeGreaterThan(1_000_000); // המונה באמת סופר (לא 0 כי משהו לא הוזרק)
    expect(s1).toBeLessThan(14_000_000);
  }, 60_000);

  it('הלולאה היא חיווט: בלי callNode אין ערך — כל מספר בגרף בא מחלק', () => {
    const tour = (assembly.needs as Need[]).find((x) => x.id === 'n17')!.combo!.graph;
    const r = runGraph(tour, [{ x: 0, y: 0 }, [{ x: 1, y: 0 }, { x: 2, y: 0 }]], () => ({ err: 'אין חלק' }));
    expect('err' in r).toBe(true);
    const src = readFileSync(join(ROOT, 'catalog/combiner/graph.mjs'), 'utf8');
    // בגרף אין חשבון: לא Math, לא השוואה בין ערכים מהחלקים (רק JSON-שוויון של המצב ל-until:stable)
    expect(src).not.toMatch(/Math\.(hypot|min|max|sqrt)/);
  });
});
