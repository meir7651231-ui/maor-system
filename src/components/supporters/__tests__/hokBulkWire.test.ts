/**
 * ratchet · הגנת-מקור — לחיצה-אחת-שמבצעת (רישום-הו״ק המוני) מגודרת ובטוחה.
 * מקבע: opt-in מפורש (=== true, לא featureOn), אישור דו-שלבי, ומנוע-הבחירה מ-hokDue.
 */
import { describe, expect, it } from 'vitest';
import modalSrc from '../HokBulkModal.tsx?raw';
import viewSrc from '../SupportersView.tsx?raw';

describe('🔁 ratchet — רישום-הו״ק המוני מגודר ובטוח', () => {
  it('🛡 מגודר opt-in מפורש (=== true) — לא featureOn (יוצר קבלות-מס)', () => {
    expect(viewSrc).toContain("config.features?.['supporters.hokbulk'] === true");
    // הכפתור מותנה בקיום מועדים-לרישום
    expect(viewSrc).toContain('hokBulkOn && hokDue(db.supporters, today).length > 0');
    expect(viewSrc).toContain('<HokBulkModal config={config}');
  });

  it('🛡 המודאל בונה את הרשימה מ-hokDue ורושם דרך bulkRecordHok', () => {
    expect(modalSrc).toContain('hokDue(supporters, today)');
    expect(modalSrc).toContain('bulkRecordHok(chosen.map((s) => s.id), today)');
  });

  it('🛡 אישור דו-שלבי לפני יצירת קבלות (armed) + סכום-כולל מוצג', () => {
    expect(modalSrc).toContain('armed');
    expect(modalSrc).toContain('setArmed(true)');
    expect(modalSrc).toMatch(/אשר יצירת/);
    expect(modalSrc).toContain('totalIls');
  });
});
