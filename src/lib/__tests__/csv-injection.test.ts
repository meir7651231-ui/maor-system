/**
 * רצ'ט — הזרקת נוסחאות ל-CSV (פאס-2 של הנחיל). תא שמתחיל בתו-נוסחה חייב לקבל
 * גרש מוביל כדי שלא יורץ ב-Excel/Sheets. השומר החמיץ TAB ו-CR (שניהם ברשימת
 * OWASP). כאן: בדיקה התנהגותית ל-csvEscape + הגנת-מקור לכפילות ב-reports/csv.ts.
 */
import { describe, expect, it } from 'vitest';
import { csvEscape } from '../csvx';
import reportsCsvSrc from '../../components/reports/csv.ts?raw';

describe('🛡️ csvEscape — כל תווי הנוסחה מקבלים גרש מוביל', () => {
  for (const c of ['=', '+', '-', '@', '\t', '\r']) {
    it(`תא שמתחיל ב-${JSON.stringify(c)} מוגן בגרש`, () => {
      // תא שמכיל \r (או פסיק/גרשיים/שורה) גם עטוף במרכאות לשמירה על round-trip;
      // הגרש-המוביל שמנטרל את הנוסחה חייב להיות בפנים. מקלפים עטיפה אם קיימת.
      const esc = csvEscape(c + 'HYPERLINK(1)');
      const inner = esc.startsWith('"') ? esc.slice(1, -1).replace(/""/g, '"') : esc;
      expect(inner.startsWith("'")).toBe(true);
    });
  }
  it('תא רגיל לא משתנה', () => {
    expect(csvEscape('שלום')).toBe('שלום');
    expect(csvEscape(42)).toBe('42');
  });
});

describe('🛡️ ratchet — גם השומר הכפול ב-reports/csv.ts כולל TAB ו-CR', () => {
  it('regex ההגנה מכסה \\t ו-\\r', () => {
    // מחפש את קבוצת התווים בשומר; חייבת לכלול \t ו-\r (הבאג של פאס-2)
    expect(reportsCsvSrc).toMatch(/\/\^\[=\+\\-@\\t\\r\]/);
  });
});
