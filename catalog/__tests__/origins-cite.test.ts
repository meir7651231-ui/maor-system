/**
 * 📍 דיוק-ציטוט (FINAL-MACHINE, 14.10.2026): כל מקור-מוצא של ליבה שגר בריפו הזה (אורביט) מצביע על שורה אמיתית,
 * וב-±3 שורות סביבה יש לפחות מזהה/מספר אחד מהמתמטיקה שהוא טוען.
 *
 * הבאג שזה תופס: origins.json ציטט `src/lib/lock.ts:167` כ-"remainMs = max(0, until - now)", אבל בשורה הזו
 * יושב cooldownForFails (זה מווסת-קצב, לא ספירה-לאחור). הספירה-לאחור האמיתית: `LockScreen.tsx:40`.
 * הבדיקה מצאה עוד 9 שורות שזזו (useApp, sound, three-scene, bannerFx, zmanim, route, shop7, RemoteWizard, functions).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const read = (f: string): unknown => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

interface Cite { file: string; line: number; claim: string; at: string }

/** האסימונים של הטענה: מזהים ומספרים; בלי כאלה (טענה בעברית בלבד) — מילים עבריות של 4+ אותיות. */
function tokensOf(claim: string): string[] {
  const ascii = (claim.match(/[A-Za-z_][A-Za-z0-9_]*|\d+\.\d+|\d{2,}/g) || []).filter((t) => t.length >= 2);
  if (ascii.length) return ascii;
  return (claim.match(/[א-ת][א-ת"'׳״-]{3,}/g) || []).map((t) => t.split('-')[0]).filter((t) => t.length >= 3);
}

function localCites(): Cite[] {
  const out: Cite[] = [];
  const a = read('catalog/core/origins.json') as { verbs: Record<string, { origins: { file: string; line: number; math?: string; what?: string; repo?: string }[] }> };
  for (const [verb, v] of Object.entries(a.verbs))
    for (const o of v.origins) if (String(o.repo || '').endsWith('/maor-system')) out.push({ file: o.file, line: o.line, claim: o.math || o.what || '', at: 'origins.json · ' + verb });
  const walk = (x: unknown, at: string): void => {
    if (Array.isArray(x)) x.forEach((y) => walk(y, at));
    else if (x && typeof x === 'object') {
      const o = x as { file?: string; line?: number; what?: string; math?: string; repo?: string };
      if (typeof o.file === 'string' && typeof o.line === 'number') {
        if (o.repo === 'maor-system' || String(o.repo || '').endsWith('/maor-system')) out.push({ file: o.file, line: o.line, claim: o.math || o.what || '', at: 'origins-b.json · ' + at });
        return;
      }
      for (const [k, y] of Object.entries(o)) walk(y, at || k);
    }
  };
  walk(read('catalog/core/origins-b.json'), '');
  // MACHINE-V4: ליבות-החומר (core-c) — אותו מבנה (פרויקט ⇒ [{repo, file, line, what}])
  const c = read('catalog/core/origins-c.json') as Record<string, unknown>;
  for (const [k, v] of Object.entries(c)) if (k !== '_note') for (const o of v as { repo: string; file: string; line: number; what: string }[]) if (o.repo === 'maor-system') out.push({ file: o.file, line: o.line, claim: o.what, at: 'origins-c.json · ' + k });
  return out;
}

describe('דיוק-ציטוט של מקורות-המוצא (אורביט)', () => {
  const cites = localCites();

  it('יש מה לבדוק', () => {
    expect(cites.length).toBeGreaterThan(30);
  });

  it('כל file:line קיים, ו-±3 שורות סביבו מכילות אסימון מהמתמטיקה הנטענת', () => {
    const bad: string[] = [];
    for (const c of cites) {
      const abs = join(ROOT, c.file);
      if (!existsSync(abs)) { bad.push(c.at + ' — אין קובץ ' + c.file); continue; }
      const lines = readFileSync(abs, 'utf8').split('\n');
      if (c.line < 1 || c.line > lines.length) { bad.push(c.at + ' — ' + c.file + ':' + c.line + ' מעבר לסוף הקובץ'); continue; }
      const win = lines.slice(Math.max(0, c.line - 4), c.line + 3).join('\n');
      const toks = tokensOf(c.claim);
      if (!toks.length || !toks.some((t) => win.includes(t))) bad.push(c.at + ' — ' + c.file + ':' + c.line + ' לא מכיל אף אסימון מ-«' + c.claim + '»');
    }
    expect(bad).toEqual([]);
  });

  it('הבאג המקורי: הספירה-לאחור של נעילת-PIN לא מצוטטת יותר על cooldownForFails', () => {
    expect(cites.some((c) => c.file === 'src/lib/lock.ts' && c.line === 167 && /until - now/.test(c.claim))).toBe(false);
    expect(cites.some((c) => c.file === 'src/components/lock/LockScreen.tsx' && /until - now/.test(c.claim))).toBe(true);
  });
});
