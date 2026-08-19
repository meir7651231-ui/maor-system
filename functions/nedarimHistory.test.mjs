/**
 * ratchet — משיכת היסטוריית-נדרים (GetHistoryJson) → תוכנית-כתיבה.
 * שומר: דדופ דטרמיניסטי לפי TransactionId (id זהה ל-webhook ⇒ אפס כפילות),
 * cursor מתקדם על כל השורות (גם מבוטלות ⇒ לא נמשכות שוב), חיוב-חיובי בלבד
 * (Amount=0 מבוטל / שלילי זיכוי מדולגים), ומיפוי ClientName כמו ב-CallBack.
 */
import { describe, expect, it } from 'vitest';
import { planHistoryWrites } from './nedarimHistory.js';

describe('🔄 ratchet — planHistoryWrites (רשת-ביטחון נדרים)', () => {
  it('ממפה שורות-היסטוריה, id דטרמיניסטי, cursor=מקסימום TransactionId', () => {
    const { writes, cursor } = planHistoryWrites(
      [
        { TransactionId: '101', ClientName: 'ראובן', Amount: '50', Currency: '1', Phone: '050' },
        { TransactionId: '105', ClientName: 'שמעון', Amount: '18', Currency: '2', KevaId: 'K9' },
      ],
      'mavr-hchsd',
    );
    expect(cursor).toBe(105);
    expect(writes).toHaveLength(2);
    expect(writes[0].id).toBe('nedarim-101');
    expect(writes[0].data.name).toBe('ראובן');
    expect(writes[0].data.currency).toBe('₪');
    expect(writes[1].data.currency).toBe('$');
    expect(writes[1].data.kevaId).toBe('K9');
    expect(writes[1].data.status).toBe('pending');
  });

  it('עסקה מבוטלת (Amount=0) וזיכוי (שלילי) מדולגים — אך ה-cursor מתקדם מעליהם', () => {
    const { writes, cursor } = planHistoryWrites(
      [
        { TransactionId: '200', ClientName: 'א', Amount: '0' }, // מבוטלת
        { TransactionId: '201', ClientName: 'ב', Amount: '-30' }, // זיכוי
        { TransactionId: '202', ClientName: 'ג', Amount: '90' }, // חיוב תקין
      ],
      'root',
    );
    expect(writes).toHaveLength(1);
    expect(writes[0].id).toBe('nedarim-202');
    expect(cursor).toBe(202); // התקדם מעל כל השלוש ⇒ לא נמשוך שוב את המבוטלות
  });

  it('שורה בלי TransactionId מדולגת (אין דדופ) — cursor לא מושפע', () => {
    const { writes, cursor } = planHistoryWrites([{ ClientName: 'ללא-מזהה', Amount: '10' }], 'root');
    expect(writes).toHaveLength(0);
    expect(cursor).toBe(0);
  });

  it('קלט ריק/לא-מערך ⇒ בטוח (אפס כתיבות)', () => {
    expect(planHistoryWrites([], 'root')).toEqual({ writes: [], cursor: 0 });
    expect(planHistoryWrites(null, 'root')).toEqual({ writes: [], cursor: 0 });
  });
});
