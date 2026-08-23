/**
 * ratchet — מיפוי CallBack של ספק-סליקה (נדרים-פלוס) → רשומת "תשלום-נכנס".
 * הבאג-שמונע: ה-webhook ציפה ל-amount/name/phone/reference, אך נדרים שולח
 * PascalCase (Amount/ClientName/…) ⇒ בלי המתאם הסנכרון נכשל בשקט. בפרט —
 * נדרים שולח את השם ב-**ClientName** (לא Name/FirstName) ⇒ בלי המיפוי כל
 * תרומה נכנסה בלי שם. גם: Currency (1=₪|2=$) — בלי זה תרומת-דולר הוצגה כ-₪.
 * param1/param2 המהודהדים משמשים ל-org ולמזהה, ושם-מלא גובר על FirstName/LastName.
 */
import { describe, expect, it } from 'vitest';
import { mapPaymentCallback, pickCurrency, pickAmount, pickDate, sanitizeDedupKey } from './paymentMap.js';

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
      d: '', // אין תאריך בקלט ⇒ ריק (הצרכן נופל ל-isoToday)
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

  // 🐛 פרסור-סכום שביר: '1,000'/'₪50' ⇒ NaN ⇒ נדחה כ-'bad amount' והעסקה אבדה.
  // עכשיו: מסירים מפריד-אלפים/סמל-מטבע/רווחים לפני ההמרה. (תיקון 20.8)
  it('pickAmount מחטא מפריד-אלפים/סמל-מטבע ⇒ מספר תקין (לא NaN)', () => {
    expect(pickAmount({ Amount: '1,000' })).toBe(1000);
    expect(pickAmount({ Amount: '₪50' })).toBe(50);
    expect(pickAmount({ Amount: ' 18.50 ' })).toBe(18.5);
    expect(pickAmount({ Amount: '-25' })).toBe(-25); // סימן שלילי נשמר (זיכוי)
    expect(pickAmount({})).toBe(0);
    expect(pickAmount({ Amount: 'abc' })).toBe(0);
  });

  // 🐛 ה-webhook לא מיפה תאריך-עסקה ⇒ hist נרשם בזמן-הקליטה (לא תאריך-החיוב).
  // עכשיו: pickDate ("dd/MM/yyyy HH:mm:ss" → ISO) — מקור-אמת יחיד ל-webhook ולמשיכה.
  it('pickDate: dd/MM/yyyy → ISO; חסר ⇒ ריק; מ-mapPaymentCallback', () => {
    expect(pickDate({ TransactionTime: '05/03/2024 14:22:01' })).toBe('2024-03-05');
    expect(pickDate({ Date: '31/12/2019' })).toBe('2019-12-31');
    expect(pickDate({ PaymentDate: '1/2/2025' })).toBe('2025-02-01');
    expect(pickDate({})).toBe('');
    expect(mapPaymentCallback({ org: 'root', Amount: '5', TransactionTime: '09/08/2022 00:00:00' }).d).toBe('2022-08-09');
  });

  // 🐛 חילוץ-ToremId ידני במשיכה השמיט את הווריאנט ToremID (D-גדולה); המפַּה מכסה.
  it('toremId: הווריאנט ToremID (D-גדולה) נתפס במיפוי', () => {
    expect(mapPaymentCallback({ org: 'root', Amount: '5', ToremID: '777' }).toremId).toBe('777');
    expect(mapPaymentCallback({ org: 'root', Amount: '5', DonorId: '888' }).toremId).toBe('888');
  });

  // 🐛 (21.8) doc-id נבנה מ-reference גולמי של הספק: '/' בתוך col.doc() זורק ⇒
  // 500 ⇒ ה-CallBack (חד-פעמי אצל נדרים) אובד והתשלום נעלם. sanitizeDedupKey
  // מחטא ל-[A-Za-z0-9_-], תוחם ~100, שומר ייחודיות (זנב-hash) ודטרמיניסטי.
  it('sanitizeDedupKey: מפתח נקי עובר כמו-שהוא (הדדופ ההיסטורי נשמר ביט-זהה)', () => {
    expect(sanitizeDedupKey('ref-12345')).toBe('ref-12345');
    expect(sanitizeDedupKey('Tx_9-A')).toBe('Tx_9-A');
  });
  it('sanitizeDedupKey: תווים אסורים (כולל "/") מוחלפים — התוצאה חוקית כ-doc-id', () => {
    const k = sanitizeDedupKey('ref-אס/מכתא 7');
    expect(k).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(k).not.toContain('/');
  });
  it('sanitizeDedupKey: דטרמיניסטי, ושתי אסמכתאות שונות לא מתמזגות (זנב-hash)', () => {
    expect(sanitizeDedupKey('ref-א/ב')).toBe(sanitizeDedupKey('ref-א/ב'));
    expect(sanitizeDedupKey('ref-א/ב')).not.toBe(sanitizeDedupKey('ref-ג/ד'));
  });
  it('sanitizeDedupKey: תקרת-אורך ~100 גם על קלט ענק', () => {
    const k = sanitizeDedupKey('x/'.repeat(400));
    expect(k.length).toBeLessThanOrEqual(101);
    expect(k).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it('sanitizeDedupKey: מפתח ריק ⇒ hash של המטען הגולמי (לא id ריק)', () => {
    const k = sanitizeDedupKey('', { Amount: '5' });
    expect(k).toMatch(/^h[a-f0-9]{32}$/);
    expect(sanitizeDedupKey('', { Amount: '5' })).toBe(k); // דטרמיניסטי
  });
});
