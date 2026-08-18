/**
 * ratchet — מיפוי CallBack של ספק-סליקה (נדרים-פלוס) → רשומת "תשלום-נכנס".
 * הבאג-שמונע: ה-webhook ציפה ל-amount/name/phone/reference, אך נדרים שולח
 * PascalCase (Amount/FirstName/…) ⇒ בלי המתאם הסנכרון נכשל בשקט. גם: param1/
 * param2 המהודהדים משמשים ל-org ולמזהה, ושם-מלא גובר על FirstName/LastName.
 */
import { describe, expect, it } from 'vitest';
import { mapPaymentCallback } from './paymentMap.js';

describe('💳 ratchet — מיפוי CallBack נדרים-פלוס', () => {
  it('שדות PascalCase של נדרים ממופים לרשומה גנרית', () => {
    const m = mapPaymentCallback({
      org: 'root',
      Amount: '250.5',
      FirstName: 'משה',
      LastName: 'כהן',
      Phone: '0501234567',
      TransactionId: 'TX-99',
      extra: 'x',
    });
    expect(m).toEqual({ org: 'root', amount: 250.5, name: 'משה כהן', phone: '0501234567', reference: 'TX-99' });
  });

  it('param1/param2 המהודהדים משמשים ל-org ולמזהה כשאין שדה מפורש', () => {
    const m = mapPaymentCallback({ param1: 'demo', param2: 'sup-7', amount: '18', name: 'אלמוני' });
    expect(m.org).toBe('demo');
    expect(m.reference).toBe('sup-7');
    expect(m.amount).toBe(18);
  });

  it('שם-מלא מפורש גובר על FirstName/LastName; חסר-סכום ⇒ 0', () => {
    const m = mapPaymentCallback({ Name: 'שם מלא', FirstName: 'לא', LastName: 'זה', amount: '' });
    expect(m.name).toBe('שם מלא');
    expect(m.amount).toBe(0);
  });

  it('lowercase נתמך גם הוא (סבילות-ספקים)', () => {
    const m = mapPaymentCallback({ org: 'root', sum: '5', phone: '03', reference: 'r1' });
    expect(m.amount).toBe(5);
    expect(m.phone).toBe('03');
    expect(m.reference).toBe('r1');
  });
});
