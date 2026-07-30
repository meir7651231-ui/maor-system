/**
 * ratchet — נגישות: סולם הגופן והמתגים (P2 פער 31).
 *
 * מקור האמת: legacy-main-script.js:3184-3194 — uiInc/uiDec: min .8, max 1.6,
 * צעד .1 עם עיגול Math.round(v*10)/10; accToggles: 4 מתגים בסדר ובנוסח
 * קבועים (script:3185). הטווח הקודם ב-React היה 0.8–1.5 — הועלה ל-1.6
 * כדי לא לאבד את 160% של הקובץ החי (אפס אובדן יכולת).
 */
import { describe, expect, it } from 'vitest';
import appSrc from '../../App.tsx?raw';
import fabSrc from '../../components/A11yFab.tsx?raw';
import { A11Y_FAB_TOGGLES, clampScale, parseAcc, SCALE_MAX, SCALE_MIN, SCALE_STEP, stepScale } from '../a11y';

describe('♿ ratchet — סולם הגופן כמו בלגאסי (script:3193-3194)', () => {
  it('גבולות 0.8–1.6 בצעד 0.1', () => {
    expect(SCALE_MIN).toBe(0.8);
    expect(SCALE_MAX).toBe(1.6);
    expect(SCALE_STEP).toBe(0.1);
  });

  it('stepScale: עיגול הלגאסי מונע שאריות float, והקצוות נצמדים', () => {
    expect(stepScale(1, 1)).toBe(1.1);
    expect(stepScale(1.1, 1)).toBe(1.2); // בלי העיגול: 1.2000000000000002
    expect(stepScale(1.6, 1)).toBe(1.6); // תקרה
    expect(stepScale(0.8, -1)).toBe(0.8); // רצפה
    expect(stepScale(2.4, 1)).toBe(1.6); // קלט חורג נצמד קודם
  });

  it('clampScale: לא-מספר = 1; חריגה נצמדת לגבול', () => {
    expect(clampScale(Number.NaN)).toBe(1);
    expect(clampScale(0.5)).toBe(0.8);
    expect(clampScale(3)).toBe(1.6);
    expect(clampScale(1.3)).toBe(1.3);
  });

  it('parseAcc: JSON פגום/ריק = הכל כבוי; ערכים חלקיים מנורמלים לבוליאני', () => {
    expect(parseAcc(null)).toEqual({ contrast: false, noanim: false, links: false, spacing: false });
    expect(parseAcc('not-json')).toEqual({ contrast: false, noanim: false, links: false, spacing: false });
    expect(parseAcc('{"contrast":1,"links":true}')).toEqual({
      contrast: true,
      noanim: false,
      links: true,
      spacing: false,
    });
  });
});

describe('♿ ratchet — 4 המתגים בסדר ובנוסח הלגאסי (script:3185)', () => {
  it('התוויות מילה-במילה', () => {
    expect(A11Y_FAB_TOGGLES).toEqual([
      ['contrast', 'ניגודיות גבוהה'],
      ['links', 'הדגשת כפתורים וקישורים'],
      ['noanim', 'עצירת אנימציות ותנועה'],
      ['spacing', 'ריווח טקסט מוגדל'],
    ]);
  });
});

describe('🛡 הגנות-מקור — ה-FAB הצף (markup:2919-2942)', () => {
  it('ה-FAB מגודר shell.a11yfab ב-App, עם הניסוחים מהקובץ החי', () => {
    expect(appSrc).toMatch(/featureOn\(config, 'shell\.a11yfab'\) && <A11yFab/);
    expect(fabSrc).toContain('נגישות — גודל טקסט, ניגודיות, אנימציות');
    expect(fabSrc).toContain('♿ הגדרות נגישות');
    expect(fabSrc).toContain('איפוס כל הגדרות הנגישות');
    expect(fabSrc).toContain('הבחירות נשמרות אישית בדפדפן זה');
    expect(fabSrc).toContain('הגדרות הנגישות אופסו');
  });
});
