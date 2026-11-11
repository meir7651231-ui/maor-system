/**
 * ratchet (11.11.2026) — כל סקריפט ב-e2e/ מסווג לסוויטת-CI.
 *
 * הבאג: אף סקריפט-דפדפן לא רץ ב-CI ⇒ 10 מתוך 36 נשברו בשקט (נתיב-chromium ישן, תווית "שם מלא *"
 * שהשתנתה ב-#510, רצועת-התזכורות של 13.10, ניווט-מובייל ב-full-audit). מעכשיו e2e/ci-suites.mjs
 * מחלק אותם ל-push/nightly/manual, וכאן נאכף שאף קובץ לא נשאר מחוץ לחלוקה ושאין כפילות.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
// @ts-expect-error — מודול JS בלי טיפוסים
import { PUSH, NIGHTLY, MANUAL } from '../../../e2e/ci-suites.mjs';

const E2E = join(__dirname, '..', '..', '..', 'e2e');
const files = readdirSync(E2E).filter((f) => f.endsWith('.mjs')).sort();
const all = [...PUSH, ...NIGHTLY, ...MANUAL] as string[];

describe('e2e/ci-suites — כל סקריפט מסווג', () => {
  it('כל e2e/*.mjs מופיע בדיוק בסוויטה אחת', () => {
    const missing = files.filter((f) => !all.includes(f));
    expect(missing, 'סקריפט חדש? הוסיפו אותו ל-PUSH / NIGHTLY / MANUAL ב-e2e/ci-suites.mjs').toEqual([]);
    const dups = all.filter((f, i) => all.indexOf(f) !== i);
    expect(dups).toEqual([]);
  });

  it('אין רשומה לקובץ שלא קיים', () => {
    expect(all.filter((f) => !files.includes(f))).toEqual([]);
  });

  it('סוויטת push לא ריקה וכוללת את toggle-matrix (השער ההיסטורי)', () => {
    expect(PUSH.length).toBeGreaterThan(10);
    expect(PUSH).toContain('toggle-matrix.mjs');
  });

  // הבאג (11.11, הריצה הראשונה ב-GitHub): 3 סקריפטים עברו מקומית ונכשלו ב-CI — שניים עם נתיב קשיח
  // '/opt/pw-browsers/chromium' (קיים רק בסביבת-הענן), ואחד עם require('playwright') — חבילה שמותקנת
  // גלובלית רק בסביבת-הענן ואינה תלות של הפרויקט (התלות היא playwright-core).
  it('אין נתיב-דפדפן קשיח ואין ייבוא של playwright (רק playwright-core + chrome-path.mjs)', () => {
    const offenders: string[] = [];
    for (const dir of ['e2e', 'scripts']) {
      const abs = join(E2E, '..', dir);
      for (const f of readdirSync(abs).filter((x) => x.endsWith('.mjs'))) {
        if (f === 'chrome-path.mjs') continue;
        const src = readFileSync(join(abs, f), 'utf8');
        if (/\/opt\/pw-browsers/.test(src)) offenders.push(`${dir}/${f}: נתיב /opt/pw-browsers קשיח`);
        if (/(from\s+|require\()\s*['"]playwright['"]/.test(src) || /\)\(\s*['"]playwright['"]\s*\)/.test(src)) offenders.push(`${dir}/${f}: ייבוא 'playwright'`);
        if (/chromium\.launch\(/.test(src) && !/executablePath:\s*CHROME/.test(src)) offenders.push(`${dir}/${f}: launch בלי executablePath מ-chrome-path.mjs`);
      }
    }
    expect(offenders, 'השתמשו ב-CHROME_EXE מ-e2e/chrome-path.mjs וב-playwright-core').toEqual([]);
  });

  it('ci.yml מריץ את סוויטת push אחרי build, ו-e2e-nightly.yml את הלילית', () => {
    const ci = readFileSync(join(E2E, '..', '.github', 'workflows', 'ci.yml'), 'utf8');
    expect(ci).toMatch(/node e2e\/run-ci\.mjs --suite=push/);
    const nightly = readFileSync(join(E2E, '..', '.github', 'workflows', 'e2e-nightly.yml'), 'utf8');
    expect(nightly).toMatch(/node e2e\/run-ci\.mjs --suite=nightly/);
    expect(nightly).toMatch(/schedule:/);
  });
});
