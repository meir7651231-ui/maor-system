/**
 * בדיקות-יחידה · מיפוי דוח-סולה → תשלומים-נכנסים (planSolaWrites) + ratchet
 * גבול-הכסף: solaPull כותב רק incomingPayments — לעולם לא קבלות/מונים.
 * (21.8.2026 — "תתחיל לחווט כמו נדרים".)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { planSolaWrites, solaDateToIso, safeId } = require('./solaReport.js');
const HERE = dirname(fileURLToPath(import.meta.url));

const row = (over = {}) => ({
  xResult: 'A',
  xCommand: 'cc:sale',
  xRefNum: '900000001234',
  xAuthAmount: '180.00',
  xName: 'ישראל ישראלי',
  xMaskedCardNumber: '4xxxxxxxxxxx1111',
  xInvoice: 'INV-7',
  xEnteredDate: '8/21/2026 10:15:00 AM',
  xCurrency: 'ILS',
  ...over,
});

describe('planSolaWrites — מיפוי דוח-סולה', () => {
  it('עסקה מאושרת ⇒ רשומת-pending מלאה עם doc-id דטרמיניסטי sola-<refnum>', () => {
    const { writes } = planSolaWrites([row()], 'demo');
    expect(writes).toHaveLength(1);
    const w = writes[0];
    expect(w.id).toBe('sola-900000001234');
    expect(w.data.amount).toBe(180);
    expect(w.data.currency).toBe('₪'); // xCurrency:'ILS' מפורש בשורת-הדוגמה
    expect(w.data.name).toBe('ישראל ישראלי');
    expect(w.data.last4).toBe('1111');
    expect(w.data.d).toBe('2026-08-21');
    expect(w.data.status).toBe('pending');
    expect(w.data.provider).toBe('sola');
    // ⚠️ סולה לא מנפיקה §46 — receipt חייב להישאר ריק (הקבלה תירשם במאור באישור)
    expect(w.data.receipt).toBe('');
    expect(w.data.reference).toBe('900000001234');
  });

  it('נדחית (D) / שגיאה (E) / void / save / סכום-0 / xVoid=1 — לא נקלטות; refund ⇒ kind+סכום-שלילי', () => {
    const { writes } = planSolaWrites(
      [
        row({ xResult: 'D' }),
        row({ xResult: 'E', xRefNum: 'r2' }),
        row({ xCommand: 'cc:void', xRefNum: 'r3' }),
        row({ xCommand: 'cc:save', xRefNum: 'r4' }),
        row({ xAuthAmount: '0', xRefNum: 'r5' }),
        row({ xCommand: 'cc:refund', xAuthAmount: '50', xRefNum: 'r6' }),
        // 💎 שטח-אמת (הצצה #26): מכירה שבוטלה = CC:Sale + Approved + xVoid='1'
        row({ xRefNum: 'r7', xVoid: '1' }),
      ],
      'demo',
    );
    expect(writes).toHaveLength(1);
    expect(writes[0].id).toBe('sola-r6');
    expect(writes[0].data.kind).toBe('refund');
    expect(writes[0].data.amount).toBe(-50);
  });

  it('💎 שטח-אמת (הצצה #26, שורת-דוח אמיתית): xResponseResult=Approved · בלי xAuthAmount/xCurrency · CC:Sale', () => {
    // שורה גולמית מהשער (שמות/מספרים שונו) — המבנה בדיוק כפי שחזר ב-peek
    const real = {
      xRefNum: '10894679744', xCommand: 'CC:Sale', xName: 'Lisa R',
      xMaskedCardNumber: '3xxxxxxxxxxx1009', xToken: 'tok', xAmount: '1800.00',
      xRequestAmount: '1800.00', xCustom01: 'c1', xEnteredDate: '5/25/2026 1:06:53 AM',
      xResponseAuthCode: '149605', xResponseResult: 'Approved', xVoid: '0', xVoidable: '1',
    };
    const err = { ...real, xRefNum: '10894897255', xName: '', xResponseResult: 'Error' };
    const { writes } = planSolaWrites([real, err], 'demo');
    expect(writes).toHaveLength(1); // Error לא נקלטת
    const w = writes[0];
    expect(w.id).toBe('sola-10894679744');
    expect(w.data.amount).toBe(1800); // xAmount כשאין xAuthAmount
    expect(w.data.currency).toBe('$'); // אין xCurrency ⇒ דולר (הכרעת-בעלים 23.8)
    expect(w.data.d).toBe('2026-05-25'); // 25 במאי — חודש/יום אמריקאי
    expect(w.data.last4).toBe('1009');
    expect(w.data.name).toBe('Lisa R');
  });

  it('תאריך אמריקאי (חודש/יום!) + ISO + cursor-תאריך; USD ⇒ $; בלי xRefNum ⇒ דילוג', () => {
    expect(solaDateToIso('1/2/2026 3:00:00 PM')).toBe('2026-01-02'); // 2 בינואר, לא 1 בפברואר
    expect(solaDateToIso('2026-03-04T00:00:00')).toBe('2026-03-04');
    const { writes, lastDateIso } = planSolaWrites(
      [row({ xRefNum: '' }), row({ xRefNum: 'a1', xEnteredDate: '12/31/2026 1:00:00 PM', xCurrency: 'USD' })],
      'demo',
    );
    expect(writes).toHaveLength(1);
    expect(writes[0].data.currency).toBe('$');
    expect(lastDateIso).toBe('2026-12-31');
    // הכרעת-בעלים 23.8: בלי xCurrency בכלל ⇒ '$' (שער אמריקאי) — לא '₪'
    const noCur = planSolaWrites([{ ...row({ xRefNum: 'a2' }), xCurrency: undefined }], 'demo');
    expect(noCur.writes[0].data.currency).toBe('$');
  });

  it('safeId מחטא תווים אסורים ל-doc-id (לקח F13 — "/" מפיל create)', () => {
    expect(safeId('ref/with/slashes..')).toBe('ref_with_slashes__');
    expect(safeId('')).toBe('');
  });
});

describe('🔒 ratchet — גבול-הכסף של solaPull', () => {
  const src = readFileSync(join(HERE, 'solaPull.js'), 'utf8');
  it('כותב רק ל-incomingPayments/solaSync — אפס נגיעה בקבלות/מונים/תרומות', () => {
    expect(src).toContain("collection('incomingPayments')");
    for (const forbidden of ['receiptSeq', 'donationSeq', 'shopReceiptSeq', "collection('donations')", 'supporters']) {
      expect(src).not.toContain(forbidden);
    }
    // חוזה-הרשומה עצמו (status pending · receipt ריק) ננעל במנוע הטהור
    const engine = readFileSync(join(HERE, 'solaReport.js'), 'utf8');
    expect(engine).toContain("status: 'pending'");
    expect(engine).toMatch(/receipt: ''/);
  });
  it('הכספת גוברת (orgSecrets.solaXKey) + דורמנטי בלי SOLA_ORG + אי-דריסת handled', () => {
    expect(src).toContain("doc('orgSecrets/' + t)");
    expect(src).toContain('solaXKey');
    // הכתובת-החשופה (root בלי vault): נפילה לכספת הלקוח-החי — תקדים מילוט-השורש ב-Rules
    expect(src).toContain("['root', 'maor-hachesed']");
    expect(src).toMatch(/SOLA_ORG[\s\S]{0,120}if \(!org\) return/);
    expect(src).toMatch(/getAll[\s\S]{0,200}existing/); // קריאה-לפני-כתיבה
  });
  it('🐛 23.8 · נפילת-הכספת הדינמית: root סורק את orgSecrets ומקבל מגירה יחידה בלבד; ריבוי ⇒ שגיאה מפורשת (לא מנחשים של מי הכסף)', () => {
    // האבחון (הצצה #23-24) הוכיח שהניחוש הסטטי מחטיא — הבעלים שומר את המפתח
    // תחת ה-slug שממנו הוא עובד. הסריקה מוגבלת ל-org==='root' (עבר שער-הרשאה).
    expect(src).toMatch(/org === 'root'[\s\S]{0,300}collection\('orgSecrets'\)/);
    expect(src).toMatch(/withKey\.length === 1/);
    expect(src).toMatch(/withKey\.length > 1[\s\S]{0,80}ambiguous/);
    // ההצצה מדווחת שמות-מגירות + בוליאני-קיום בלבד — לעולם לא את ערך המפתח
    expect(src).toMatch(/vaultDrawers[\s\S]{0,200}solaXKey \? '✓' : '·'/);
  });
});
