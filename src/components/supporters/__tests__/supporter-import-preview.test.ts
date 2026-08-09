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

  it('הדו-שלבי מגודר בדגל supporters.import.preview (חסר=פעיל; false=החלה מיידית)', () => {
    expect(importSrc).toContain("featureOn(config, 'supporters.import.preview')");
    // כשהדגל כבוי — run מחיל מיד את התוכנית, בלי לחכות לאישור
    expect(importSrc).toMatch(/if \(p && !previewOn\) apply\(p\);/);
  });

  it('🛡 באג-שטח 6.8: כפתור-האישור קורא apply() בחץ — לא onClick={apply}', () => {
    // onClick={apply} העביר את אירוע-הקליק כ-p ודרס את ברירת-המחדל p=plan ⇒
    // p.updates.map קרס וכלום לא יובא (שבור מאז P2-33; נתפס ע"י הבעלים בשטח).
    expect(importSrc).toContain('onClick={() => apply()}');
    // השלילה על JSX בפועל (<Btn …) — ההערה בקוד מזכירה את הדפוס השבור בכוונה
    expect(importSrc).not.toMatch(/<Btn[^>]*onClick=\{apply\}/);
    // חגורת-בטיחות: apply דוחה כל p שאינו תוכנית אמיתית
    expect(importSrc).toContain('if (!p || !Array.isArray(p.updates)) return');
  });
});
