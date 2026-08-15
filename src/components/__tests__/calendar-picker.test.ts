/**
 * ratchet — בורר-תאריך בסגנון הלוח המרכזי (בקשת-בעלים): "יש באפליקציה לוח שנה,
 * אני רוצה לוח ריק בסגנון הזה לבחירת תאריך ושעה, לועזי או עברי".
 *
 * האינווריאנטים:
 * 1. CalendarPicker משתמש ב-buildMonthGrid המשותף (אותו מנוע של הלוח הראשי,
 *    מוזן ריק ⇒ "לוח ריק") ותומך בשני הלוחות (עברי/לועזי) ובשעה אופציונלית.
 * 2. HebDateInput — שדה-התאריך המשותף בכל האפליקציה — מחווט לכפתור "📅 לוח"
 *    שפותח את הבורר ומחזיר ISO ל-onChange (מגיע לכל שדות-התאריך).
 */
import { describe, expect, it } from 'vitest';
import pickerSrc from '../CalendarPicker.tsx?raw';
import hebInputSrc from '../HebDateInput.tsx?raw';

describe('📅 ratchet — בורר-תאריך בסגנון הלוח המרכזי (בקשת-בעלים)', () => {
  it('CalendarPicker: מנוע buildMonthGrid המשותף, לוח כפול, ושעה אופציונלית', () => {
    expect(pickerSrc).toContain("buildMonthGrid([], anchor, hebMode)");
    // החלפת לוח עברי/לועזי
    expect(pickerSrc).toContain('setHebMode(true)');
    expect(pickerSrc).toContain('setHebMode(false)');
    // שורת-שעה אופציונלית (props.time !== undefined)
    expect(pickerSrc).toContain('const withTime = props.time !== undefined');
    // בחירת יום מחזירה ISO
    expect(pickerSrc).toMatch(/onPick\(/);
  });

  it('HebDateInput מחווט את "📅 לוח" ל-CalendarPicker → onChange', () => {
    expect(hebInputSrc).toContain("import { CalendarPicker }");
    expect(hebInputSrc).toContain('📅 לוח');
    expect(hebInputSrc).toMatch(/<CalendarPicker[\s\S]{0,160}onPick=\{\(iso\) => props\.onChange\(iso\)\}/);
  });
});
