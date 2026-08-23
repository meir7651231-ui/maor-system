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

  it('💎 שטח-אמת (גשש peek=2): xName ריק ⇒ שם מ-xBillLastName; טלפון/אימייל נקלטים', () => {
    // שורה אמיתית מהגשש (פרטים שונו קלות): xBillFirstName ריק והשם ב-xBillLastName
    const { writes } = planSolaWrites([{
      xRefNum: '11000000001', xCommand: 'CC:Sale', xName: '', xAmount: '250.00',
      xBillFirstName: '', xBillLastName: 'Halberstam Sinai', xBillPhone: '3472496884',
      xBillMobile: '', xEmail: 'M05@GMAIL.COM', xEnteredDate: '7/24/2026 1:02:23 AM',
      xResponseResult: 'Approved', xVoid: '0',
    }], 'demo');
    expect(writes).toHaveLength(1);
    expect(writes[0].data.name).toBe('Halberstam Sinai');
    expect(writes[0].data.phone).toBe('3472496884');
    expect(writes[0].data.email).toBe('M05@GMAIL.COM');
  });

  it('safeId מחטא תווים אסורים ל-doc-id (לקח F13 — "/" מפיל create)', () => {
    expect(safeId('ref/with/slashes..')).toBe('ref_with_slashes__');
    expect(safeId('')).toBe('');
  });
});

describe('🔒 ratchet — ממצאי-נחיל-סולה (23.8) בשרת', () => {
  const src = readFileSync(join(HERE, 'solaPull.js'), 'utf8');
  const engine = readFileSync(join(HERE, 'solaReport.js'), 'utf8');
  it('S1 · כשל-HTTP/מבנה-זר מהשער ⇒ throw (לא "דוח ריק" שקט שמקדם cursor)', () => {
    expect(src).toMatch(/if \(!resp\.ok\) throw new Error\('sola: HTTP '/);
    expect(src).toMatch(/okMarker[\s\S]{0,200}xResult === 'S'/);
    expect(src).toMatch(/if \(!okMarker && !Array\.isArray\(rows\)\)[\s\S]{0,80}throw/);
  });
  it('S2 · ביטול-אחרי-משיכה: שורת-xVoid שה-doc שלה pending ⇒ status voided (handled לא נגוע)', () => {
    expect(src).toMatch(/xVoid[\s\S]{0,700}status !== 'pending'\) continue;/);
    expect(src).toMatch(/status: 'voided', voidedAt/);
  });
  it('S3 · ה-cursor כבול לקצה-החלון — תאריך-עתידי משובש לא הורג את המשיכות', () => {
    expect(src).toMatch(/clamped = lastDateIso > we \? we : lastDateIso/);
  });
  it('S4 · authonly (אישור-בלי-לכידה) מדולג — לא נקלט כהכנסה', () => {
    expect(engine).toMatch(/void\|save\|adjust\|verify\|balance\|authonly/);
    const { writes } = planSolaWrites([row({ xCommand: 'CC:AuthOnly', xRefNum: 'a9' })], 'demo');
    expect(writes).toHaveLength(0);
  });
  it('S5+S6+S7 · השוואת-סכומים חסינת-סדר · איפוס מוחק pending-בלבד · עוגן SOLA_ROOT_VAULT', () => {
    expect(src).toMatch(/curKeys[\s\S]{0,120}every/);
    expect(src).toMatch(/clearPullRows[\s\S]{0,600}where\('status', '==', 'pending'\)/);
    expect(src).toContain('SOLA_ROOT_VAULT');
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
    expect(src).toMatch(/org === 'root'[\s\S]{0,900}collection\('orgSecrets'\)/);
    expect(src).toMatch(/withKey\.length === 1/);
    expect(src).toMatch(/withKey\.length > 1[\s\S]{0,80}ambiguous/);
    // ההצצה מדווחת שמות-מגירות + בוליאני-קיום בלבד — לעולם לא את ערך המפתח
    expect(src).toMatch(/vaultDrawers[\s\S]{0,200}solaXKey \? '✓' : '·'/);
  });
  it('💎 23.8 · פרטי-קשר מהשער: xFields מבקש את עמודות-הקשר; העשרת-קיימות נוגעת רק ב-phone/email/name', () => {
    // הגשש (peek=2) הוכיח: בלי xFields הדוח חוזר בלי טלפון/אימייל; איתו — חוזרים.
    // 🐛 solarun #35: השער דוחה עמודות-סטנדרטיות ב-xFields — מבקשים שדות-קשר בלבד
    expect(src).toMatch(/SOLA_FIELDS[\s\S]{0,120}xBillPhone/);
    expect(src).not.toMatch(/SOLA_FIELDS = \[[\s\S]{0,200}xVoid/);
    expect(src).toMatch(/xFields: SOLA_FIELDS/);
    // העשרת רשומות-קיימות: מיזוג-חלקי של שדות-קשר ריקים בלבד — לעולם לא סטטוס/סכום
    expect(src).toMatch(/\['phone', 'email', 'name'\]/);
    expect(src).toMatch(/batch\.set\(e\.ref, e\.fill, \{ merge: true \}\)/);
    // מיפוי-שם מהשטח: xName ריק ⇒ הרכבה מ-xBillFirst/LastName; טלפון כולל xBillMobile
    const engine = readFileSync(join(HERE, 'solaReport.js'), 'utf8');
    expect(engine).toMatch(/xBillFirstName'\), pick\(r, 'xBillLastName'\)/);
    expect(engine).toContain("'xBillPhone', 'xBillMobile'");
  });

  it('🧮 23.8 · בדיקת-ההתאמה (runSolaAudit) קריאה-בלבד — אפס batch/set/delete בגוף שלה', () => {
    const m = /async function runSolaAudit[\s\S]*?\nasync function runSolaPull/.exec(src);
    expect(m).toBeTruthy();
    const body = m[0];
    // אסורות כתיבות-Firestore בלבד (batch/commit/delete/update/create); ‏Map.set
    // בזיכרון מותר — לכן הדפוס תופס set רק על ref (doc(...).set / cursorRef.set).
    expect(body).not.toMatch(/batch\(|\.commit\(|\.delete\(|\.update\(|\.create\(|Ref\.set\(|\)\.set\(/);
    // משווה באותו מנוע-מיפוי בדיוק (planSolaWrites) — לא חישוב מקביל שיכול לסטות
    expect(body).toContain('planSolaWrites');
    expect(body).toMatch(/missing[\s\S]{0,200}extra/);
  });
});
