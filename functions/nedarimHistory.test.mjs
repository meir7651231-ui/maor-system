/**
 * ratchet — משיכת היסטוריית-נדרים (GetHistoryJson) → תוכנית-כתיבה.
 * שומר: דדופ דטרמיניסטי לפי TransactionId (id זהה ל-webhook ⇒ אפס כפילות),
 * cursor מתקדם על כל השורות, פאזה-מודעת-כסף — חיוב(charge)/זיכוי(refund,שלילי)/
 * ביטול(cancel,0) כולם נקלטים עם kind, ומיפוי ClientName כמו ב-CallBack.
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

  // 🐛 היה: מבוטל/זיכוי מדולגים ⇒ ניפוח-נטו (זיכוי שלא קוזז). עכשיו (פאזה-מודעת-כסף):
  // נקלטים עם kind — חיוב='charge' (בלי שדה) · זיכוי='refund' (שלילי) · ביטול='cancel' (0).
  it('מבוטל (0)=cancel · זיכוי (שלילי)=refund · חיוב=charge — כולם נקלטים עם kind', () => {
    const { writes, cursor } = planHistoryWrites(
      [
        { TransactionId: '200', ClientName: 'א', Amount: '0' }, // ביטול
        { TransactionId: '201', ClientName: 'ב', Amount: '-30' }, // זיכוי
        { TransactionId: '202', ClientName: 'ג', Amount: '90' }, // חיוב תקין
      ],
      'root',
    );
    expect(writes).toHaveLength(3);
    expect(writes[0].data.kind).toBe('cancel');
    expect(writes[0].data.amount).toBe(0);
    expect(writes[1].data.kind).toBe('refund');
    expect(writes[1].data.amount).toBe(-30);
    expect(writes[2].data.kind).toBeUndefined(); // חיוב רגיל — בלי שדה kind (ביט-זהה)
    expect(cursor).toBe(202);
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
