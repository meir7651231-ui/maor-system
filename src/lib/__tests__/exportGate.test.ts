/**
 * רצ'ט — שער יציאת-מידע (13.8, בקשת-בעלים "כפתור שמבטל לעובד כל הוצאת מידע").
 * 🐛 הזליגה: PR #125 גידר את `core.export` ב-4 מקומות בלבד; `core.export` אינו
 * חולק קידומת עם תת-דגלי-הייצוא ⇒ לא משתרשר, ו-~18 נתיבי-הורדה נשארו חשופים.
 * התיקון: נקודת-חנק אחת ב-lib/exportGate שכל פונקציות-ההורדה שואלות.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setExportBlocked, exportAllowed, guardExport } from '../exportGate';
import { downloadCsv } from '../csvx';

describe('exportGate', () => {
  afterEach(() => setExportBlocked(false));

  it('ברירת-מחדל: מותר (חסר-דגל=פעיל, ביט-זהה להיום)', () => {
    expect(exportAllowed()).toBe(true);
    expect(guardExport()).toBe(true);
  });

  it('חסום: מסרב ומריץ את ההתרעה פעם-אחת', () => {
    let fired = 0;
    setExportBlocked(true, () => {
      fired++;
    });
    expect(exportAllowed()).toBe(false);
    expect(guardExport()).toBe(false);
    expect(fired).toBe(1);
  });

  it('downloadCsv נעצר בשער לפני כל גישה ל-DOM כשחסום (no-op בטוח)', () => {
    // בסביבת node אין `document`; אם הגארד לא היה עוצר מוקדם — היה נזרק ReferenceError.
    setExportBlocked(true);
    expect(() => downloadCsv('leak.csv', [['ת"ז'], ['123']])).not.toThrow();
  });
});
