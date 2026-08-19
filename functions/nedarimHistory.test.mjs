/**
 * ratchet — משיכת היסטוריית-נדרים (GetHistoryJson) → תוכנית-כתיבה.
 * שומר: דדופ דטרמיניסטי לפי TransactionId (id זהה ל-webhook ⇒ אפס כפילות),
 * cursor מתקדם על כל השורות (גם מבוטלות ⇒ לא נמשכות שוב), חיוב-חיובי בלבד
 * (Amount=0 מבוטל / שלילי זיכוי מדולגים), ומיפוי ClientName כמו ב-CallBack.
 */
import { describe, expect, it } from 'vitest';
import { planHistoryWrites, nedarimDateToIso } from './nedarimHistory.js';

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

  it('תאריך-נדרים dd/MM/yyyy → ISO yyyy-MM-dd (ריק על קלט לא-תקין)', () => {
    expect(nedarimDateToIso('12/06/2019 16:08:28')).toBe('2019-06-12');
    expect(nedarimDateToIso('7/8/2026')).toBe('2026-08-07');
    expect(nedarimDateToIso('')).toBe('');
    expect(nedarimDateToIso('בלי-תאריך')).toBe('');
  });

  it('שדות ל-hist[]: תאריך-אמת, מספר-קבלת-נדרים, 4-ספרות, מזהה-תורם', () => {
    const { writes } = planHistoryWrites(
      [
        {
          TransactionId: '900',
          ClientName: 'לוי',
          Amount: '120',
          Currency: '1',
          TransactionTime: '12/06/2019 16:08:28',
          KabalaId: 'K-778',
          LastNum: '1234',
          ToremId: '492787',
        },
      ],
      'mavr-hchsd',
    );
    expect(writes[0].data.d).toBe('2019-06-12');
    expect(writes[0].data.receipt).toBe('K-778');
    expect(writes[0].data.last4).toBe('1234');
    expect(writes[0].data.toremId).toBe('492787');
  });
});
