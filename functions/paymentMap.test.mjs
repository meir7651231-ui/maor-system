/**
 * ratchet — מיפוי CallBack של ספק-סליקה (נדרים-פלוס) → רשומת "תשלום-נכנס".
 * הבאג-שמונע: ה-webhook ציפה ל-amount/name/phone/reference, אך נדרים שולח
 * PascalCase (Amount/ClientName/…) ⇒ בלי המתאם הסנכרון נכשל בשקט. בפרט —
 * נדרים שולח את השם ב-**ClientName** (לא Name/FirstName) ⇒ בלי המיפוי כל
 * תרומה נכנסה בלי שם. גם: Currency (1=₪|2=$) — בלי זה תרומת-דולר הוצגה כ-₪.
 * param1/param2 המהודהדים משמשים ל-org ולמזהה, ושם-מלא גובר על FirstName/LastName.
 */
import { describe, expect, it } from 'vitest';
import { mapPaymentCallback, pickCurrency } from './paymentMap.js';

describe('💳 ratchet — מיפוי CallBack נדרים-פלוס', () => {
  it('מטען-נדרים אמיתי (Webhook/GetHistoryJson) ממופה במלואו', () => {
    // שמות-השדות המדויקים ממסמך ה-API של נדרים-פלוס
    const m = mapPaymentCallback({
      org: 'root',
      ClientName: 'ישראל ישראלי',
      Amount: '180',
      Currency: '1',
      Phone: '0501234567',
      Mail: 'israel@example.com',
      Zeout: '123456789',
      Groupe: 'בניין',
      TransactionId: 'TX-99',
      Confirmation: '0012345',
      Comments: 'לרפואת…',
      Adresse: 'הרצל 1, תל אביב',
      ToremId: '492787',
      KabalaId: 'K-778',
      LastNum: '401234',
    });
    expect(m).toEqual({
      org: 'root',
      amount: 180,
      currency: '₪',
      name: 'ישראל ישראלי',
      phone: '0501234567',
      email: 'israel@example.com',
      zeout: '123456789',
      category: 'בניין',
      kevaId: '',
      reference: 'TX-99',
      toremId: '492787', // מפתח-שיוך חזק — חיבור-אוטומטי-לכרטיס
      receipt: 'K-778', // מספר-קבלת-§46 של נדרים
      last4: '1234', // 4 ספרות אחרונות (מ-LastNum, slice(-4))
    });
  });

  it('הוראת-קבע: Currency=2 ⇒ $, KevaId נשמר (מבחין חיוב-הו"ק מחד-פעמי)', () => {
    const m = mapPaymentCallback({ org: 'demo', ClientName: 'משה', Amount: '25', Currency: '2', KevaId: 'HK-7' });
    expect(m.currency).toBe('$');
    expect(m.kevaId).toBe('HK-7');
    expect(m.name).toBe('משה');
  });

  it('param1/param2 המהודהדים משמשים ל-org ולמזהה כשאין שדה מפורש', () => {
    const m = mapPaymentCallback({ param1: 'demo', param2: 'sup-7', amount: '18', name: 'אלמוני' });
    expect(m.org).toBe('demo');
    expect(m.reference).toBe('sup-7');
    expect(m.amount).toBe(18);
  });

  it('שם-מלא מפורש גובר על FirstName/LastName; חסר-סכום ⇒ 0; מטבע ברירת-מחדל ₪', () => {
    const m = mapPaymentCallback({ Name: 'שם מלא', FirstName: 'לא', LastName: 'זה', amount: '' });
    expect(m.name).toBe('שם מלא');
    expect(m.amount).toBe(0);
    expect(m.currency).toBe('₪');
  });

  it('lowercase נתמך גם הוא (סבילות-ספקים); reference נופל ל-Confirmation', () => {
    const m = mapPaymentCallback({ org: 'root', sum: '5', phone: '03', Confirmation: 'c-1' });
    expect(m.amount).toBe(5);
    expect(m.phone).toBe('03');
    expect(m.reference).toBe('c-1');
  });

  it('pickCurrency: 2/USD/$/דולר ⇒ $; 1/ILS/ריק ⇒ ₪', () => {
    expect(pickCurrency({ Currency: '2' })).toBe('$');
    expect(pickCurrency({ Currency: 'USD' })).toBe('$');
    expect(pickCurrency({ Currency: '1' })).toBe('₪');
    expect(pickCurrency({ Currency: 'ILS' })).toBe('₪');
    expect(pickCurrency({})).toBe('₪');
  });
});
