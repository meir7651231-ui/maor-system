/**
 * ratchet — preview לייבוא תומכות (P2 פער 33, חוב מהפער החלקי של P0).
 *
 * מקור האמת: בלגאסי לכל סוגי הייבוא יש סיכום-לפני-החלה (processImport בונה
 * importSummary עם canApply, ורק applyImport משנה נתונים — legacy:986-991
 * לענף התומכות). הכלל הנעול: SupporterImport הוא דו-שלבי — analyze (שלב 1,
 * לא נוגע בנתונים) → apply (שלב 2) — באותו דפוס כמו ייבוא הילדים ומשפחות-13.
 * הגנת-מקור: אין setDb מחוץ ל-apply.
 */
import { describe, expect, it } from 'vitest';
import importSrc from '../SupporterImport.tsx?raw';

describe('🛡 הגנות-מקור — SupporterImport דו-שלבי (P2 פער 33)', () => {
  it('analyze (שלב 1) לא נוגע בנתונים; setDb רק בתוך apply (שלב 2)', () => {
    // הפונקציות קיימות בשמן
    expect(importSrc).toMatch(/function analyze\(/);
    expect(importSrc).toMatch(/function apply\(/);
    // setDb מופיע פעם אחת בלבד — בתוך apply (בין הגדרת apply להגדרה הבאה)
    const applyBody = importSrc.slice(importSrc.indexOf('function apply('), importSrc.indexOf('return ('));
    expect(applyBody).toContain('setDb(');
    const analyzeBody = importSrc.slice(importSrc.indexOf('function analyze('), importSrc.indexOf('function apply('));
    expect(analyzeBody).not.toContain('setDb(');
    // הסיכום מציג חדשות/עדכונים לפני ההחלה, עם כפתור אישור וביטול
    expect(importSrc).toContain('בדיקת הקובץ (שלב 1)');
    expect(importSrc).toMatch(/זוהו/);
    expect(importSrc).toContain('ביטול');
  });
});
