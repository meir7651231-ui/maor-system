/**
 * רצ'ט — סנכרון מוני הקבלות בין מכשירים (פאס-3 של הנחיל). addPayment/addDonation
 * מקדמים receiptSeq/donationSeq בלבד, בלי לגעת בשדה META אחר. אם המונים אינם
 * ב-META_KEYS, diffDb מחזיר meta=null → הקידום לא נדחף לענן, מכשיר אחר לא מתקדם,
 * והקבלה הבאה מקבלת מספר כפול (מפר מונוטוניות בין-מכשירים לקבלות מס).
 * כאן: שינוי-מונה-בלבד חייב לייצר diff.meta לא-null, ולשאת את המונה המעודכן.
 */
import { describe, expect, it } from 'vitest';
import { diffDb } from '../cloud-diff';
import { emptyDb } from '../../types/domain';

describe('☁️ ratchet — שינוי מונה-קבלות בלבד נדחף ב-meta', () => {
  it('receiptSeq שהשתנה → diff.meta לא-null ונושא את הערך החדש', () => {
    const prev = emptyDb();
    const next = { ...emptyDb(), receiptSeq: prev.receiptSeq + 1 };
    const diff = diffDb(prev, next);
    expect(diff.meta).not.toBeNull();
    expect(diff.meta!.receiptSeq).toBe(prev.receiptSeq + 1);
  });

  it('donationSeq שהשתנה → diff.meta לא-null ונושא את הערך החדש', () => {
    const prev = emptyDb();
    const next = { ...emptyDb(), donationSeq: prev.donationSeq + 1 };
    const diff = diffDb(prev, next);
    expect(diff.meta).not.toBeNull();
    expect(diff.meta!.donationSeq).toBe(prev.donationSeq + 1);
  });

  it('ללא שינוי → meta נשאר null (לא דוחפים לחינם)', () => {
    expect(diffDb(emptyDb(), emptyDb()).meta).toBeNull();
  });
});
