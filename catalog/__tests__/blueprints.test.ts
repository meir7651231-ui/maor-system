/**
 * 🧭 מנוע-השרטוטים (BLUEPRINTS, 14.10.2026) — "מה המכונה מגלה לבד?"
 *
 * מה ננעל:
 * 1. **בלי לרמות:** שלושת המתכונים שנכתבו ביד (tour/allot/schedule ב-verb-recipes.json), מה שמכונת-השילוב מצאה (combos.json,
 *    recipes/combo-*) ומה שהמנוע מצא קודם (found/) — לא נקראים בזמן החיפוש: השומר זורק על קריאה; הרצה של החיפוש מצליחה
 *    עם השומר דלוק; בספריית-הצורות ובפעלי-היעד אין אף מזהה-חלק; קוד-המנוע לא מזכיר את הקבצים המוסתרים (מלבד רשימת-השומר).
 * 2. הפנקס, המדף (found/), ספריית-הכרייה ובדיקת-האמת מעודכנים ודטרמיניסטיים (`--check` = הרצה שנייה ⇒ אותם בתים).
 * 3. כל שילוב על המדף עובר שוב את חוקי הפועל — בזרע אחר; והחלפת צומת אחד בחלק אחר מאותו פועל-משבצת שאינו מתאים ⇒ נופל.
 * 4. תוצאות המבחן העיוור (הכנות — גם מה שלא נמצא, וגם מה שעבר את החוקים ושגוי): tour נמצא וכולל את צורת-היד, allot נמצא
 *    וחלופה אחת = חלקי-היד ואיכות-הייחוס, schedule לא נמצא ולמה; sum/average — הנבחר עובר את החוקים אבל שגוי (חוקים חלשים).
 */
import { describe, it, expect, vi } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { CATALOG } from '../combiner/load.mjs';
import { mineAll } from '../blueprints/mine.mjs';
import { SUPER, templatesOf } from '../blueprints/shapes.mjs';
import { bestFirst, layoutsFor, CONTRACTS } from '../blueprints/engine.mjs';
import { graphFunction } from '../blueprints/run.mjs';
import { buildIndex } from '../combiner/core.mjs';
import { loadParts, loadProofs, loadBehavior } from '../combiner/load.mjs';
import { loadRunners, composeGraph, verify, partByHome } from '../combiner/combine.mjs';
import { graphNodes, graphProblem } from '../combiner/graph.mjs';
import { bundleBridge } from '../lib/load-bridge.mjs';
import { VERB_BY_ID as LAW_VERBS } from '../lib/verbs.mjs';

vi.setConfig({ testTimeout: 600_000 });

const BP = join(CATALOG, 'blueprints');
const ROOT = join(CATALOG, '..');
const read = (f: string) => readFileSync(join(BP, f), 'utf8');
const ledger = JSON.parse(read('ledger.json'));
const truth = JSON.parse(read('truth.json'));
const row = (v: string) => ledger.results.find((r: { verb: string }) => r.verb === v);
const trow = (v: string) => truth.rows.find((r: { verb: string }) => r.verb === v);
const foundFiles = readdirSync(join(BP, 'found')).filter((f) => f.endsWith('.json')).sort();
const node = (...a: string[]) => spawnSync(process.execPath, a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
const PART_ID = /\b(core|core-b|core-c|orbit|rings|buildsmart|14kk|generator|mmmm|yeshiva|yoman-habina|qa-scanner|inner-[\w-]+):[^\s'"`]+#/;

describe('🚫 בלי לרמות', () => {
  it('ספריית-הצורות ופעלי-היעד בלי אף מזהה-חלק (הצורה לא יודעת מי ימלא אותה)', () => {
    expect(PART_ID.test(read('shapes.mjs'))).toBe(false);
    expect(PART_ID.test(read('targets.json'))).toBe(false);
    for (const s of SUPER) for (const t of templatesOf(s)) expect(JSON.stringify(t.nodes)).not.toMatch(/"part"/);
  });

  it('קוד-המנוע לא מזכיר את הקבצים המוסתרים (מלבד רשימת-השומר)', () => {
    for (const f of ['engine.mjs', 'shapes.mjs', 'mine.mjs', 'run.mjs']) expect(read(f)).not.toMatch(/verb-recipes|combos\.json|combo-|lab-data/);
    const lines = read('search.mjs').split('\n').filter((l) => /verb-recipes\.json|combos\.json|combo-\[|lab-data/.test(l));
    expect(lines.every((l) => l.startsWith('export const HIDDEN') || l.trim().startsWith('*') || l.trim().startsWith('//'))).toBe(true);
  });

  it('השומר: אחרי טעינת search.mjs קריאה של מתכוני-היד / combos / recipes/combo-* / found/ זורקת', () => {
    const probe = `
      const fs = await import('node:fs');
      await import(${JSON.stringify(pathToFileURL(join(BP, 'search.mjs')).href)});
      const out = {};
      for (const f of ['catalog/combiner/verb-recipes.json', 'catalog/combiner/combos.json', 'catalog/recipes/combo-tour-geo.json', 'catalog/blueprints/found/bp-tour-geo.json', 'catalog/verbs.json']) {
        try { fs.readFileSync(f, 'utf8'); out[f] = 'read'; } catch (e) { out[f] = String(e.message).includes('מנוע-השרטוטים') ? 'blocked' : 'other'; }
      }
      console.log(JSON.stringify(out));`;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', probe], { cwd: ROOT, encoding: 'utf8' });
    const out = JSON.parse(r.stdout.trim().split('\n').pop() || '{}');
    expect(out['catalog/combiner/verb-recipes.json']).toBe('blocked');
    expect(out['catalog/combiner/combos.json']).toBe('blocked');
    expect(out['catalog/recipes/combo-tour-geo.json']).toBe('blocked');
    expect(out['catalog/blueprints/found/bp-tour-geo.json']).toBe('blocked');
    expect(out['catalog/verbs.json']).toBe('read'); // השומר חוסם רק את המוסתרים
  });

  it('החיפוש רץ עם השומר דלוק (allot — אותה שורה כמו בפנקס)', () => {
    const r = node(join(BP, 'search.mjs'), '--only', 'allot');
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('allot: ✅');
    expect(r.stdout).not.toContain('🚫');
  });
});

describe('📒 הפנקס, המדף והכרייה — מעודכנים ודטרמיניסטיים', () => {
  it('library.json = הכרייה מחדש (ביט-זהה)', () => {
    const ix = buildIndex(loadParts(), { proofs: loadProofs(), behavior: loadBehavior(), recipes: [], leads: [] });
    expect(JSON.stringify(mineAll(ix), null, 1) + '\n').toBe(read('library.json'));
  });

  it('search.mjs --check: הרצה שנייה ⇒ אותו פנקס ואותו מדף (דטרמיניזם)', () => {
    const r = node(join(BP, 'search.mjs'), '--check');
    expect(r.status, r.stderr + r.stdout).toBe(0);
  });

  it('truth.mjs --check', () => {
    const r = node(join(BP, 'truth.mjs'), '--check');
    expect(r.status, r.stderr).toBe(0);
  });

  it('לכל פועל שנמצא — קובץ על המדף, ולהפך; כל אחד "נוצר ע״י מנוע-השרטוטים"', () => {
    const solved = ledger.results.filter((r: { found: unknown }) => r.found).map((r: { verb: string; material: string }) => 'bp-' + r.verb + '-' + r.material + '.json').sort();
    expect(foundFiles).toEqual(solved);
    for (const f of foundFiles) expect(JSON.parse(read('found/' + f)).by).toMatch(/מנוע-השרטוטים/);
  });

  it('הפנקס: לכל פועל שלא נמצא — סיבה; לכל תבנית שנוסתה — כמה ניסיונות ומה נכשל', () => {
    for (const r of ledger.results) {
      if (!r.found) expect(r.why).toBeTruthy();
      for (const t of r.templates) if (t.tried) expect(t.passed + Object.values(t.fails as Record<string, number>).reduce((a, b) => a + b, 0)).toBe(t.tried);
    }
  });
});

describe('🔁 כל שילוב על המדף עובר שוב את החוקים — בזרע אחר', () => {
  it('n/n בזרע 0x5eed; צומת מוחלף בחלק לא-מתאים ⇒ נופל', async () => {
    const parts = loadParts();
    const raw = new Map(parts.map((p: { id: string }) => [p.id, p]));
    const ix = buildIndex(parts, { proofs: loadProofs(), behavior: loadBehavior(), recipes: [], leads: [] });
    const B = await import(pathToFileURL(await bundleBridge()).href);
    for (const f of foundFiles) {
      const C = JSON.parse(read('found/' + f)).combo;
      expect(graphProblem(C.graph)).toBeNull();
      const ps = graphNodes(C.graph).map((n: { part: string }) => partByHome(ix, n.part));
      const runners = await loadRunners([...new Set(ps)], raw);
      const sig = C.sig || LAW_VERBS.get(C.verb).ref.sig;
      const composed = composeGraph(C.graph, ps.map((p: { id: string }) => runners.get(p.id)), 0x5eed, sig.map((t: object, k: number) => ({ ...t, name: C.graph.inputs[k] })));
      const v = verify(C.verb, composed, 0x5eed, B);
      expect(v.ok, f + ': ' + v.why).toBe(true);
    }
    // מוטציה: ב-tour, מהלך-הקטע (הפוך) ⇒ מסיר-כפולים — חלק מוכח אחר, אבל המהלך מאבד תחנות ⇒ החוקים נופלים
    const T = JSON.parse(read('found/bp-tour-geo.json')).combo;
    const g2 = JSON.parse(JSON.stringify(T.graph).replaceAll('inner-buildsmart:app/src/components/menu/submenu-settings.tsx#CartSubmenu.reversed:step', 'core-c:catalog/core/dedupe-points.mjs#dedupePoints'));
    expect(JSON.stringify(g2)).not.toBe(JSON.stringify(T.graph));
    const ps = graphNodes(g2).map((n: { part: string }) => partByHome(ix, n.part));
    const runners = await loadRunners([...new Set(ps)], raw);
    const composed = composeGraph(g2, ps.map((p: { id: string }) => runners.get(p.id)), 0x5eed, LAW_VERBS.get('tour').ref.sig.map((t: object, k: number) => ({ ...t, name: g2.inputs[k] })));
    expect(verify('tour', composed, 0x5eed, B).ok).toBe(false);
  });
});

describe('🧪 המבחן העיוור — התוצאות (גם מה שלא הצליח)', () => {
  it('tour: נמצא לבד; בחלופות — צורת-היד המלאה (מנקה ⇒ הקרוב-הבא ⇒ הטוב-מבין ⇒ 2-opt) עם חלקי-היד; הנבחר נכון בבדיקת-האמת', () => {
    const r = row('tour');
    expect(r.found).toBeTruthy();
    expect(r.found.holds).toBe('60/60');
    const rec = JSON.parse(read('found/bp-tour-geo.json'));
    const full = rec.alternatives.find((a: { variant: string }) => a.variant === 'clean+construct+best+improve');
    expect(full).toBeTruthy();
    const partsOf = (g: { nodes: unknown[] }) => new Set(graphNodes(g).map((n: { part: string }) => n.part.split('#')[1]));
    const hand = JSON.parse(readFileSync(join(CATALOG, 'combiner/verb-recipes.json'), 'utf8')).recipes.find((x: { verb: string }) => x.verb === 'tour');
    const mine = partsOf(full.graph); const theirs = partsOf(hand);
    expect(mine.size).toBe(theirs.size); // 6 חלקים, כמו ביד
    for (const p of ['dedupePoints', 'byDistance', 'SupportersGalaxy.useEffect.frame.d', 'nearestPoint']) { expect(mine.has(p)).toBe(true); expect(theirs.has(p)).toBe(true); }
    expect(trow('tour').chosenOk).toBe(true);
  });

  it('allot: נמצא; חלופה = בדיוק חלקי-היד ובאיכות-הייחוס; הנבחר (חלק אחד) עובר את החוקים אבל ארוך יותר', () => {
    const r = row('allot');
    expect(r.found).toBeTruthy();
    const t = trow('allot');
    const bykey = t.evals.find((e: { variant: string }) => e.variant === 'capacity+bykey');
    expect(bykey.ok).toBe(true);
    expect(bykey.quality.vsRef).toBeLessThanOrEqual(1.0005);
    expect(t.evals[0].quality.vsRef).toBeGreaterThan(1.05);
  });

  it('schedule: לא נמצא — ונאמר למה (אין שרטוט שנותן 4 שדות שונים לכל תחנה)', () => {
    const r = row('schedule');
    expect(r.found).toBeNull();
    expect(r.why).toMatch(/סוג-הפלט|אין שרטוט/);
  });

  it('חוקים חלשים — נאמר בגלוי: sum/average עוברים n/n והנבחר שגוי', () => {
    for (const v of ['sum', 'average']) { expect(row(v).found).toBeTruthy(); expect(trow(v).chosenOk).toBe(false); }
    expect(row('count').found).toBeTruthy();
    expect(trow('count').chosenOk).toBe(true);
  });

  it('dedupe / reverse / sort (החלקים שלהם מוסתרים) — לא נמצאו; sun-heading / shortest-path / spread — אין שרטוט לחתימה', () => {
    for (const v of ['dedupe', 'reverse', 'sort']) expect(row(v).found).toBeNull();
    for (const v of ['sun-heading', 'shortest-path', 'spread']) expect(row(v).why).toMatch(/אין שרטוט/);
  });
});

describe('🧱 יחידות-המנוע', () => {
  it('bestFirst: לפי סכום-הדרגות, דטרמיניסטי, עד התקרה', () => {
    const all = [...bestFirst([2, 3])];
    expect(all).toEqual([[0, 0], [0, 1], [1, 0], [0, 2], [1, 1], [1, 2]]);
    expect([...bestFirst([5, 5, 5], 4)].length).toBe(4);
    expect([...bestFirst([3, 0])]).toEqual([]);
  });
  it('layoutsFor: נקודה ⇒ x,y; הפוך לשני קלטים', () => {
    expect(layoutsFor(['pt', 'pt'], ['number', 'number', 'geo'])).toContainEqual([{ arg: 0, field: 'x' }, { arg: 0, field: 'y' }, { arg: 1 }]);
    expect(layoutsFor(['pts', 'pt'], ['geo', 'geo'])).toContainEqual([{ arg: 0 }, { arg: 1 }]);
  });
  it('חוזי-משבצת: permute/subset/pick/additive', () => {
    expect(CONTRACTS.permute([[1, 2, 3]], [3, 1, 2])).toBe(true);
    expect(CONTRACTS.permute([[1, 2, 2]], [1, 2])).toBe(false);
    expect(CONTRACTS.subset([[1, 2, 2]], [1, 2])).toBe(true);
    expect(CONTRACTS.pick([[{ x: 1 }, { x: 2 }]], { x: 2 })).toBe(true);
    expect(CONTRACTS.additive([[2, 3]], 5)).toBe(true);
  });
  it('הכרייה: כל צורה ברת-הרצה עם מקור-כרייה מוצהר; הצורות שאינן ברות-הרצה — עם סיבה', () => {
    const lib = JSON.parse(read('library.json'));
    for (const s of SUPER) { expect(lib.bySuper[s.id]).toBeTruthy(); if (!s.exec) expect(s.why).toBeTruthy(); }
    expect(lib.functions).toBeGreaterThan(10000);
    expect(existsSync(join(BP, 'README.md'))).toBe(true);
  });
  it('run.mjs: השילוב מהמדף = פונקציה רגילה (tour על דוגמה עם תחנה כפולה)', async () => {
    const C = JSON.parse(read('found/bp-tour-geo.json')).combo;
    const f = await graphFunction(C);
    const out = f({ x: 0, y: 0 }, [{ x: 5, y: 0 }, { x: 1, y: 0 }, { x: 5, y: 0 }, { x: 3, y: 0 }]);
    expect(out).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }, { x: 5, y: 0 }]);
  });
});
