/**
 * 🧩 מכונת-השילוב (FINAL-MACHINE, 14.10.2026) — "לא חסר כלום": לפני ⛏️/🔎 המכונה מנסה שילוב של שני חלקים מוכחים.
 *
 * מה ננעל:
 * 1. combos.json + recipes/combo-* מעודכנים (combine.mjs רץ שוב ⇒ אותם קבצים).
 * 2. כל שילוב שנמצא עובר שוב את **חוקי הפועל** — בזרע אחר; ומוטנטים נכשלים (אחרת החוקים לא נושכים):
 *    משווה שמחבר (a+b) נופל ב-compare.anti; מודד-מרחק קבוע נופל בתלות-בקלט.
 * 3. סדר-העדיפות של הבעלים: חלק מוכח אחד > חלק פנימי > שילוב.
 * 4. שלוש המילים: חמנייה · דרקון · קרוסלה — כל צורך ✅, חוץ מהאזימוט (נשאר 🔎, והסיבה רשומה: אילו חוקים, על אילו מועמדים).
 */
import { describe, it, expect, vi } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CATALOG, loadGoals, loadIndex, loadParts } from '../combiner/load.mjs';
import { assemble, buildIndex, findGoal, normGoal } from '../combiner/core.mjs';
import { combineAll, loadRunners, compose, verify, SEED } from '../combiner/combine.mjs';
import { bundleBridge } from '../lib/load-bridge.mjs';
import { loadInSandbox } from '../lib/sandbox.mjs';

vi.setConfig({ testTimeout: 300_000 });

const HERE = join(CATALOG, 'combiner');
const combos = JSON.parse(readFileSync(join(HERE, 'combos.json'), 'utf8'));
const found = combos.results.filter((r: { found: unknown }) => r.found);
type Found = { verb: string; material: string; found: { form: string; at?: number; steps: string[]; holds: string } };

describe('מכונת-השילוב', () => {
  it('combos.json ו-recipes/combo-* מעודכנים (node catalog/combiner/combine.mjs)', async () => {
    const { summary, recipes } = await combineAll();
    expect(readFileSync(join(HERE, 'combos.json'), 'utf8')).toBe(summary);
    const dir = join(CATALOG, 'recipes');
    const cur = readdirSync(dir).filter((f) => f.startsWith('combo-')).sort();
    expect(cur).toEqual(Object.keys(recipes).sort());
    for (const f of cur) expect(readFileSync(join(dir, f), 'utf8'), f).toBe(recipes[f]);
  });

  it('יש שילובים מוכחים, וכל אחד נשמר כמתכון-חלק שמוכח לפועל שלו', () => {
    expect(found.length).toBeGreaterThanOrEqual(1);
    const ix = loadIndex();
    for (const r of found as Found[]) {
      expect(r.found.holds, r.verb).toMatch(/^(\d+)\/\1$/);
      const p = ix.byId.get('recipe:combo-' + r.verb + '-' + r.material.replace(/[^a-z0-9-]/gi, '-'));
      expect(p, r.verb + '·' + r.material).toBeTruthy();
      expect(p.proofs[r.verb].status).toBe('proven');
      // שני החלקים מוכחים-בהרצה בעצמם
      for (const id of r.found.steps) expect(Object.values(ix.byId.get(id).proofs).some((x: { status: string }) => x.status === 'proven'), id).toBe(true);
    }
  });

  it('כל שילוב עובר שוב את חוקי הפועל בזרע אחר — ומוטנטים נכשלים', async () => {
    const raw = new Map(loadParts().map((p: { id: string }) => [p.id, p]));
    const ix = loadIndex();
    const parts = [...new Set((found as Found[]).flatMap((r) => r.found.steps))].map((id) => ix.byId.get(id));
    const R = await loadRunners(parts, raw);
    const B = await import(pathToFileURL(await bundleBridge()).href);
    for (const r of found as Found[]) {
      const [a, b] = r.found.steps.map((id) => R.get(id));
      const seed = (SEED ^ 0x7777) >>> 0;
      const v = verify(r.verb, compose(r.found.form, a, b, seed, r.found.at ?? 0), seed, B);
      expect(v.ok, r.verb + '·' + r.material + ' — ' + (v.law || '') + ' ' + (v.why || '')).toBe(true);
    }
    // מוטנטים על השילוב של הדרקון (מודד-מרחק × משווה)
    const geo = (found as Found[]).find((r) => r.verb === 'compare' && r.material === 'geo');
    expect(geo, 'compare·geo נמצא').toBeTruthy();
    const [d, cmp] = geo!.found.steps.map((id) => R.get(id));
    const m = loadInSandbox('module.exports.add = (a, b) => a + b; module.exports.konst = (mx, my, p) => 7;');
    const add = { sig: cmp.sig, ctx: m.ctx, fn: m.exports.add };
    const konst = { sig: d.sig, ctx: m.ctx, fn: m.exports.konst };
    const bad1 = verify('compare', compose('pair', d, add, 11, geo!.found.at), 11, B);
    expect(bad1.ok).toBe(false);
    const bad2 = verify('compare', compose('pair', konst, cmp, 12, geo!.found.at), 12, B);
    expect(bad2.ok).toBe(false);
  });

  it('סדר-העדיפות: חלק מוכח אחד > חלק פנימי > שילוב', () => {
    const P = (id: string, extra: object) => ({ id, source: 'orbit', path: 'x.ts', symbol: id.split('#')[1], lang: 'ts', what: 'function', name: id, takes: [{ kind: 'number' }, { kind: 'number' }], gives: { kind: 'number' }, pure: true, ...extra });
    const single = P('orbit:x.ts#single', {});
    const inner = P('inner-orbit:x.ts#f.inner', { source: 'inner-orbit', what: 'inner', parent: 'orbit:x.ts#f' });
    const beh = new Map([single, inner].map((p) => [p.id, { id: p.id, labeledBy: 'run', primary: 'compare', verbs: [{ id: 'compare', holds: '12/12' }] }]));
    const combo = { id: 'combo-compare-number', word: 'משווה · מספר', title: 'שילוב', combo: { verb: 'compare', material: 'number', form: 'chain', steps: [single.id, inner.id], roles: ['compare', 'compare'], holds: '9/9', laws: [] }, needs: [{ need: 'combo', verb: 'compare', material: 'number', chain: [single.id, inner.id] }] };
    const g = normGoal({ word: 'בדיקה', needs: [{ behavior: 'משווה', verb: 'compare', material: 'number' }] });
    const st = (parts: object[], recipes: object[] = []) => assemble(g, buildIndex(parts, { behavior: beh, recipes })).needs[0];
    expect(st([single, inner], [combo]).status).toBe('proven');
    expect(st([inner], [combo]).status).toBe('inner');
    const n = st([inner].map((p) => ({ ...p, id: p.id + 'X' })), [combo]);
    // החלקים של השילוב חייבים להיות באינדקס כדי לפרוש אותו — בלעדיהם הוא לא מוצג
    expect(['combo', 'dig', 'mining']).toContain(n.status);
  });
});

describe('שלוש המילים — חמנייה · דרקון · קרוסלה', () => {
  const goals = loadGoals();
  const ix = loadIndex();
  const run = (w: string) => assemble(findGoal(w, goals), ix);

  it('דרקון: 8/8 ✅ — מתעורר כשמתקרבים = מודד מרחק (הגלקסיה) + משווה, שילוב שעבר את כל חוקי "משווה"', () => {
    const a = run('דרקון');
    expect(a.needs.every((n: { status: string }) => ['proven', 'inner', 'combo'].includes(n.status))).toBe(true);
    const near = a.needs.find((n: { need: { behavior: string } }) => n.need.behavior === 'מתעורר כשמישהו מתקרב');
    expect(near.status).toBe('combo');
    expect(near.chain.steps).toHaveLength(2);
    expect(near.chain.steps[0].where.parent?.file).toBe('src/components/supporters/SupportersGalaxy.tsx');
    expect(near.chain.combo.line).toMatch(/^עבר (\d+)\/\1 חוקים של משווה$/);
  });

  it('קרוסלה: 7/7 ✅ — מנגינה = מתנדנד על קול, תור = הבא בתור, סיבוב קבוע = סופר לאחור', () => {
    const a = run('קרוסלה');
    expect(a.needs.every((n: { status: string }) => ['proven', 'inner', 'combo'].includes(n.status))).toBe(true);
    const by = (b: string) => a.needs.find((n: { need: { behavior: string } }) => n.need.behavior === b);
    expect(by('מנגינה בזמן הסיבוב').need.verb).toBe('oscillate');
    expect(by('סיבוב זמן קבוע').chain.steps[0].role).toBe('countdown');
    expect(by('תור לסיבוב הבא').chain.steps[0].role).toBe('next');
  });

  it('חמנייה: 16/17 ✅ — האזימוט נשאר 🔎, והסיבה רשומה ב-combos.json (חוקי "מקום השמש" מדברים על זריחה/חצות/שקיעה)', () => {
    const a = run('חמנייה');
    const open = a.needs.filter((n: { status: string }) => !['proven', 'inner', 'combo'].includes(n.status));
    expect(open.map((n: { need: { id: string } }) => n.need.id)).toEqual(['azimuth']);
    const r = combos.results.find((x: { verb: string; material: string }) => x.verb === 'sun-position' && x.material === 'number');
    expect(r.found).toBeNull();
    expect(r.candidates).toBeGreaterThan(0);
    expect(r.tried.length).toBeGreaterThan(0);
    for (const t of r.tried) expect(t.why).toBeTruthy();
  });

  it('אין "חסר" בשום מתכון-שילוב או ב-combos.json', () => {
    expect(readFileSync(join(HERE, 'combos.json'), 'utf8')).not.toMatch(/חסר/);
    for (const f of readdirSync(join(CATALOG, 'recipes')).filter((x) => x.startsWith('combo-'))) expect(readFileSync(join(CATALOG, 'recipes', f), 'utf8')).not.toMatch(/חסר/);
    expect(existsSync(join(HERE, 'verb-recipes.json'))).toBe(true);
  });
});
