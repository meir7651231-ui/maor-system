/**
 * 🌀 הליבה — פעלי-הזמן-והתנועה שנכרו מהקוד שלנו (MINED-VERBS, 14.10.2026) — ratchet.
 * 1. catalog/sources/core.json מעודכן מול catalog/core + origins.json (core-census --check), ועומד בחוזה בלי חריגה.
 * 2. כל חלק-ליבה מתקיים בפועל שלו n/n בקובץ-ההתנהגות — והקורא, כשמריצים אותו שוב, נותן בדיוק את אותן שורות.
 * 3. לכל פועל יש מקורות אמיתיים: לפחות 3 מקומות בקוד (חוץ מ"נבנה-חדש"), best אחד, וכל part = חלק שקיים בקטלוג.
 * 4. רק "קופץ" (bounce) מסומן נבנה-חדש — וכך גם בפועל, בחלק ובמקורות.
 * 5. הליבה טהורה: בלי Math.random, בלי Date, בלי I/O.
 * 6. דף-ההדגמה (catalog/core/demo.html) מעודכן — מריץ בדיוק את קוד-הליבה, בלי תלויות חיצוניות.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as B from '../lib/bridge';
import { validateSource } from '../lib/check.mjs';
import { readDir } from '../lib/build-all.mjs';
import { MOTION_VERBS, CORE_OF } from '../lib/verbs-motion.mjs';
import { coreParts } from '../scripts/core-census.mjs';
import { demoHtml } from '../scripts/core-demo.mjs';
import { prepareJobs, probeJob } from '../lib/probe-file.mjs';
import { entryFor } from '../lib/entry.mjs';

const ROOT = join(__dirname, '..', '..');
const SEED = 0x0ca7a10;
const core = JSON.parse(readFileSync(join(ROOT, 'catalog/sources/core.json'), 'utf8'));
const beh = JSON.parse(readFileSync(join(ROOT, 'catalog/behavior/core.json'), 'utf8'));
const origins = JSON.parse(readFileSync(join(ROOT, 'catalog/core/origins.json'), 'utf8')).verbs;
const allIds = new Set(Object.values(readDir(join(ROOT, 'catalog/sources'))).flatMap((d: { parts: { id: string }[] }) => d.parts.map((p) => p.id)));

describe('הליבה — פעלי-הזמן-והתנועה', () => {
  it('core.json מעודכן ועומד בחוזה (strict)', () => {
    expect(core.parts).toEqual(coreParts());
    expect(validateSource(core, { strict: true })).toEqual([]);
    expect(core.parts.length).toBe(MOTION_VERBS.length);
  });

  it('כל חלק-ליבה מתקיים בפועל שלו n/n, והוא הפועל הראשי', () => {
    for (const v of MOTION_VERBS) {
      const { file, symbol } = CORE_OF[v.id];
      const e = beh.parts.find((x: { id: string }) => x.id === `core:${file}#${symbol}`);
      expect(e, v.id).toBeTruthy();
      expect(e.labeledBy, v.id).toBe('run');
      const h = e.verbs.find((x: { id: string }) => x.id === v.id);
      expect(h, v.id + ' ' + JSON.stringify(e.verbs)).toBeTruthy();
      expect(h.holds).toMatch(/^(\d+)\/\1$/);
      expect(e.primary, v.id).toBe(v.id);
    }
  });

  it('הקורא דטרמיניסטי ומעודכן על הליבה', async () => {
    const { jobs, results, sigs } = prepareJobs(ROOT, core.parts);
    for (const job of jobs) for (const { id, result } of await probeJob(job, { B, seed: SEED })) results.set(id, result);
    const got = core.parts.map((p: { id: string }) => entryFor(p, results.get(p.id), sigs.get(p.id)));
    expect(got).toEqual(beh.parts);
  }, 60_000);

  it('לכל פועל מקורות אמיתיים: best אחד, ≥3 מקומות (חוץ מנבנה-חדש), part = חלק בקטלוג', () => {
    expect(Object.keys(origins).sort()).toEqual(MOTION_VERBS.map((v) => v.id).sort());
    for (const v of MOTION_VERBS) {
      const o = origins[v.id];
      if (!o.builtNew) {
        expect(o.origins.length, v.id).toBeGreaterThanOrEqual(3);
        expect(o.origins.filter((x: { best?: boolean }) => x.best).length, v.id).toBe(1);
      }
      for (const x of o.origins) {
        expect(x.file, v.id).toBeTruthy();
        expect(x.line, v.id).toBeGreaterThan(0);
        expect(x.what, v.id).toMatch(/[א-ת]/);
        if (x.part) expect(allIds.has(x.part), x.part).toBe(true);
      }
      // מקורות מאורביט — הקובץ קיים והשורה בתוכו
      for (const x of o.origins.filter((y: { source: string }) => y.source === 'orbit')) {
        const lines = readFileSync(join(ROOT, x.file), 'utf8').split('\n').length;
        expect(x.line, x.file).toBeLessThanOrEqual(lines);
      }
    }
  });

  it('רק "קופץ" נבנה חדש — באותה צורה בפועל, בחלק ובמקורות', () => {
    const built = MOTION_VERBS.filter((v) => (v as { builtNew?: boolean }).builtNew).map((v) => v.id);
    expect(built).toEqual(['bounce']);
    expect(Object.entries(origins).filter(([, o]) => (o as { builtNew?: boolean }).builtNew).map(([k]) => k)).toEqual(['bounce']);
    expect(core.parts.filter((p: { tags: string[] }) => p.tags.includes('built-new')).map((p: { symbol: string }) => p.symbol)).toEqual(['bounce']);
  });

  it('הליבה טהורה: בלי Math.random, בלי Date, בלי import', () => {
    for (const f of readdirSync(join(ROOT, 'catalog/core')).filter((x) => x.endsWith('.mjs'))) {
      const src = readFileSync(join(ROOT, 'catalog/core', f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      expect(src, f).not.toMatch(/Math\.random|Date\.now|new Date|performance\.|import\s|require\(|fetch\(/);
    }
  });

  it('דף-ההדגמה מעודכן, בלי תלויות חיצוניות, ומכבד הפחתת-תנועה', () => {
    const html = readFileSync(join(ROOT, 'catalog/core/demo.html'), 'utf8');
    expect(html).toBe(demoHtml());
    expect(html).not.toMatch(/<script[^>]+src=|<link[^>]+href=["']https?:|@import|url\(\s*["']?https?:/);
    expect(html).toContain('prefers-reduced-motion');
    expect(html).toContain('dir="rtl"');
    for (const v of MOTION_VERBS) expect(html, v.id).toContain(`data-engine="${v.id}"`);
  });
});
