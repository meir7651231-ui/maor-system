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

  it('ci.yml מריץ את סוויטת push אחרי build, ו-e2e-nightly.yml את הלילית', () => {
    const ci = readFileSync(join(E2E, '..', '.github', 'workflows', 'ci.yml'), 'utf8');
    expect(ci).toMatch(/node e2e\/run-ci\.mjs --suite=push/);
    const nightly = readFileSync(join(E2E, '..', '.github', 'workflows', 'e2e-nightly.yml'), 'utf8');
    expect(nightly).toMatch(/node e2e\/run-ci\.mjs --suite=nightly/);
    expect(nightly).toMatch(/schedule:/);
  });
});
