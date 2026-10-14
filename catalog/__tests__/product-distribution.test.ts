/**
 * 🧺 PRODUCT (14.10.2026) — «מוקד-חלוקה»: ממילה לדף שעובד, וכל החישוב מההרכבה של המכונה. ratchet.
 * 1. המילה במילון (products.json) וכל 16 הצרכים ✅ (חלק · פנימי · שילוב) — אין 🔎.
 * 2. החבילה הסטטית (catalog/products/distribution/parts.bundle.mjs + assembly.json) מעודכנת — `bundle.mjs --check`.
 * 3. זמן-הריצה = החלק המוכח: על כל קלט-דוגמה, הפונקציה מהחבילה מחזירה בדיוק מה שהחלק מחזיר בארגז-החול
 *    (שילוב — דרך המתכון השמור, run-combo).
 * 4. הליבה החדשה `nearestPoint` (הכוכב-הקרוב-לעכבר של הגלקסיה) — מוכחת ל«בוחר את הקיצוני», והקרובה באמת;
 *    6 צרכים קיימים במילון ("המונית הקרובה", "האמבולנס הקרוב"…) עברו אליה מחלק פנימי שהחזיר רק מרחק.
 * 5. פרטיות: בהרכבה ובדף — בלי טלפון/מייל/ת״ז/קישור; כל שבב "נמצא ב" בדף לקוח מההרכבה.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { assemble, normGoal, piiLeak } from '../combiner/core.mjs';
import { loadGoals, loadIndex } from '../combiner/load.mjs';
import { nearestPoint } from '../core/nearest-point.mjs';
import { productManifest } from '../runtime/manifest.mjs';
import { provenFunctions } from '../runtime/proven.mjs';
import { makeRuntime } from '../runtime/runtime.mjs';

const ROOT = join(__dirname, '..', '..');
const DIR = join(ROOT, 'catalog/products/distribution');
const assembly = JSON.parse(readFileSync(join(DIR, 'assembly.json'), 'utf8'));
const samples = JSON.parse(readFileSync(join(DIR, 'samples.json'), 'utf8'));
type Step = { id: string; key: string; project: string; name: string; origins: { project: string; file: string; line: number | null }[] };
type Need = { id: string; behavior: string; status: string; form: string; steps: Step[] };
const plain = (v: unknown) => JSON.parse(JSON.stringify(v ?? null));

describe('«מוקד-חלוקה» — מוצר מההרכבה', () => {
  it('במילון, וכל 16 הצרכים ✅ — 14 חלקים · 1 פנימי · 1 שילוב · 0 פתוחים', () => {
    const g = loadGoals().find((x: { word: string }) => x.word === 'מוקד-חלוקה');
    expect(g?.world).toBe('מוצרים');
    expect(assembly.counts).toEqual({ needs: 16, proven: 14, inner: 1, combo: 1, open: 0 });
    for (const n of assembly.needs as Need[]) {
      expect(['proven', 'inner', 'combo'], n.behavior).toContain(n.status);
      expect(n.steps.length, n.behavior).toBeGreaterThan(0);
      for (const s of n.steps) expect(s.origins.length, s.id).toBeGreaterThan(0);
    }
  });

  it('החבילה הסטטית מעודכנת (bundle.mjs --check), והמניפסט = ההרכבה של היום', () => {
    execFileSync(process.execPath, [join(ROOT, 'catalog/runtime/bundle.mjs'), '--check'], { stdio: 'pipe' });
    expect(JSON.parse(JSON.stringify(productManifest('מוקד-חלוקה')))).toEqual(assembly);
  }, 120_000);

  it('זמן-הריצה מהחבילה מחזיר בדיוק מה שהחלק המוכח מחזיר (ארגז-החול / המתכון השמור)', async () => {
    const bundle = await import(pathToFileURL(join(DIR, 'parts.bundle.mjs')).href);
    const fromBundle = bundle.runtime();
    const proven = await provenFunctions(assembly);
    let n = 0;
    for (const need of assembly.needs as Need[]) {
      const cases = samples[need.id] as unknown[][];
      expect(cases?.length, need.id + ' בלי קלטי-דוגמה').toBeGreaterThan(0);
      for (const args of cases) {
        const want = plain(proven[need.id](...structuredClone(args)));
        expect(plain(fromBundle[need.id](...structuredClone(args))), need.id + ' ' + need.behavior + ' ' + JSON.stringify(args).slice(0, 80)).toEqual(want);
        n++;
      }
    }
    expect(n).toBeGreaterThanOrEqual(25);
    // אותו זמן-ריצה, על המודולים עצמם (לא החבילה) — אותה תשובה
    const direct: Record<string, unknown> = {};
    for (const s of (assembly.needs as Need[]).flatMap((x) => x.steps) as (Step & { module: string; export: string })[]) direct[s.key] = (await import(pathToFileURL(join(ROOT, s.module)).href))[s.export];
    const rt = makeRuntime(assembly, direct as Record<string, (...a: unknown[]) => unknown>);
    expect(plain(rt.n5(...samples.n5[0]))).toEqual(plain(fromBundle.n5(...samples.n5[0])));
  }, 120_000);

  it('הדרך הקצרה = רשת-הסינפסות ⇒ דייקסטרה (שילוב שעבר את חוקי «מוצא דרך קצרה»)', () => {
    const n5 = (assembly.needs as (Need & { combo: { holds: string; recipe: string } })[]).find((x) => x.id === 'n5')!;
    expect(n5.form).toBe('chain');
    expect(n5.steps.map((s) => s.id)).toEqual(['core-c:catalog/core/near-net.mjs#nearNet', 'core:catalog/core/shortest-path.mjs#shortestPath']);
    expect(n5.combo.holds).toMatch(/^(\d+)\/\1$/);
    expect(n5.steps[1].origins[0]).toMatchObject({ project: 'בנייה חכמה', file: 'app_flutter/lib/logic/install_engine.dart', line: 759 });
  });

  it('nearestPoint: הקרובה באמת, לא תלויה בסדר; 6 צרכי "הקרוב" במילון עברו אליה', () => {
    const pts = [{ x: 5, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 3 }, { x: -1, y: 1 }];
    expect(nearestPoint(pts, { x: 0, y: 0 })).toEqual({ x: -1, y: 1 });
    expect(nearestPoint([...pts].reverse(), { x: 0, y: 0 })).toEqual({ x: -1, y: 1 });
    expect(nearestPoint([], { x: 0, y: 0 })).toBeNull();
    const ix = loadIndex();
    const moved = ['כבאות', 'תופסת', 'קיר-טיפוס', 'אמבולנס', 'מונית', 'מסוק'];
    for (const g of loadGoals().filter((x: { word: string }) => moved.includes(x.word))) {
      const ns = (assemble(g, ix).needs as { need: { verb: string; material: string }; chain: { steps: { id: string }[] } }[]).filter((x) => x.need.verb === 'extreme' && x.need.material === 'geo');
      expect(ns.length, g.word).toBeGreaterThan(0);
      for (const x of ns) expect(x.chain.steps[0].id, g.word).toBe('core-c:catalog/core/nearest-point.mjs#nearestPoint');
    }
    const one = assemble(normGoal({ id: 't', word: 'בדיקה', needs: [{ id: 'a', behavior: 'הקרוב', verb: 'extreme', material: 'list' }] }), ix).needs[0] as { chain: { steps: { id: string }[] } | null };
    expect(one.chain?.steps[0].id ?? '').not.toContain('nearest-point'); // ליבת-חומר עונה רק לנקודות
  }, 120_000);

  it('פרטיות ויושר בדף: בלי טלפון/מייל/ת״ז/קישור; כל שבב "נמצא ב" בא מההרכבה; הכותרת התחתונה אומרת מה חדש', () => {
    const html = readFileSync(join(DIR, 'index.html'), 'utf8');
    expect(piiLeak(assembly)).toBeNull();
    expect(piiLeak(html)).toBeNull();
    expect(piiLeak(samples)).toBeNull();
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).toContain("from './parts.bundle.mjs'");
    for (const n of assembly.needs as Need[]) expect(html, n.id).toMatch(new RegExp("chip\\('" + n.id + "'"));
    expect(html).toContain('המעטפת של המסך');
  });
});
