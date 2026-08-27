/**
 * ratchet · שליחה-מרובה על מנוע-הצובר (runBatch) — מגן על החיווט:
 * הלולאה הסדרתית `for … await writeMailOutbox` הוחלפה ב-runBatch כדי לקבל
 * מקביליות-מבוקרת + ניסיון-חוזר-בטוח + פס-התקדמות-חי. הבדיקה נועלת ש:
 *   • המסך מייבא runBatch מהמנוע הטהור;
 *   • השליחה עוברת דרך runBatch (ולא חוזרת ללולאה הסדרתית);
 *   • onProgress מחווט ל-setBulkMailProgress ⇒ המזכירה רואה "נשלח X / N";
 *   • מקביליות + ניסיונות-חוזרים מוגדרים במפורש.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';

describe('💛 ratchet — שליחה-מרובה על runBatch', () => {
  it('🛡 מייבא את המנוע הטהור', () => {
    expect(viewSrc).toContain("from '../../lib/batch'");
    expect(viewSrc).toMatch(/import\s+\{\s*runBatch\s*\}/);
  });

  it('🛡 השליחה עוברת דרך runBatch עם writeMailOutbox — לא לולאה סדרתית', () => {
    expect(viewSrc).toMatch(/runBatch\(\s*rows\s*,/);
    expect(viewSrc).toContain('mod.writeMailOutbox(r.email, subj, body)');
    // הלולאה הסדרתית הישנה על התור נעלמה
    expect(viewSrc).not.toMatch(/for \(const r of rows\)/);
  });

  it('🛡 מקביליות + ניסיון-חוזר מוגדרים במפורש', () => {
    expect(viewSrc).toMatch(/concurrency:\s*\d+/);
    expect(viewSrc).toMatch(/retries:\s*\d+/);
  });

  it('🛡 התקדמות-חיה מחווטת (onProgress ⇒ setBulkMailProgress)', () => {
    expect(viewSrc).toContain('onProgress:');
    expect(viewSrc).toContain('setBulkMailProgress');
    // הפס-החי מרונדר בזמן-שליחה
    expect(viewSrc).toContain('bulkMailProgress');
    expect(viewSrc).toMatch(/נשלח '?\s*\+\s*bulkMailProgress\.done/);
  });
});
