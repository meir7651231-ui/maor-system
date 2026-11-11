// ratchet · לילה 11.11.2026 — מנוע-הטלפוניה מחוץ לבנדל-הכניסה.
//
// הבאג: ווידג'ט-הבית ייבא את nextClosure מ-'../telephony/lib', שמייבא את engine.ts ⇒
// index/validate/generate/simulate/report של מנוע-הטלפוניה (~90KB גולמי, ~18.7KB gzip)
// ישבו בבנדל-הכניסה של כל לקוח — גם בלי טלפוניה. התיקון: closure.ts רזה על zmanim בלבד.
// הבדיקה נועלת את שרשרת-הייבוא (הגנת-מקור) + שהפונקציה היא אותה פונקציה.
import { describe, expect, it } from 'vitest';
import widgetsSrc from '../../home/widgets.tsx?raw';
import closureSrc from '../closure.ts?raw';
import zmanimSrc from '../../../lib/telephony/zmanim.ts?raw';
import { nextClosure as fromLib } from '../lib';
import { nextClosure as fromClosure } from '../closure';
import { CITIES as engCities, hebrewClosedWindows as engWins } from '../../../lib/telephony/engine';
import { CITIES as zCities, hebrewClosedWindows as zWins } from '../../../lib/telephony/zmanim';

const importsOf = (src: string) => [...src.matchAll(/^import[^;]*?from\s+'([^']+)'/gm)].map((m) => m[1]);

describe('closure-slim — מנוע-הטלפוניה לא נגרר לבנדל-הכניסה', () => {
  it("widgets.tsx מייבא את nextClosure מ-closure הרזה, לא מ-telephony/lib", () => {
    expect(widgetsSrc).toContain("from '../telephony/closure'");
    expect(widgetsSrc).not.toMatch(/from '\.\.\/telephony\/lib'/);
  });

  it('closure.ts תלוי רק במנוע-הזמנים (לא ב-engine/lib)', () => {
    const imps = importsOf(closureSrc);
    expect(imps).toContain('../../lib/telephony/zmanim');
    expect(imps.some((s) => /engine|\.\/lib$|telephony\/lib\//.test(s))).toBe(false);
  });

  it('zmanim.ts מייבא מה-.mjs רק את zmanim.mjs', () => {
    const imps = importsOf(zmanimSrc);
    expect(imps).toEqual(['../../../telephony/lib/zmanim.mjs']);
  });

  it('אותה פונקציה ואותם אובייקטים — engine/lib מייצאים-מחדש, אפס שינוי-התנהגות', () => {
    expect(fromLib).toBe(fromClosure);
    expect(engWins).toBe(zWins);
    expect(engCities).toBe(zCities);
  });
});
