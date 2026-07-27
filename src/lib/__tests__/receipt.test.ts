/**
 * שורות הקבלה (receiptLines) — התאריך הלועזי והעברי על אותה קבלה חייבים להתייחס
 * לאותו יום, ולא להיות תלויים ברכיב השעה (אחרת באזור זמן מערבי הלועזי נפל ליום
 * הקודם וסתר את העברי). כולל מטבע ברירת-מחדל ושורות אופציונליות.
 */
import { describe, expect, it } from 'vitest';
import { receiptLines } from '../receipt';

const base = {
  rid: 'R-1', orgName: 'מאור', payer: 'משה', amount: 180, date: '2026-08-06', forWhat: 'חוג ציור',
};

describe('receiptLines', () => {
  it('כולל מספר אסמכתה, סכום ומטבע ברירת-מחדל ₪', () => {
    const L = receiptLines(base);
    expect(L.some((l) => l.includes('R-1'))).toBe(true);
    expect(L.some((l) => l.includes('₪180'))).toBe(true);
  });

  it('שורת התאריך זהה לכל שעה ביום (חסינות אזור-זמן)', () => {
    const dateLine = (iso: string) => receiptLines({ ...base, date: iso }).find((l) => l.startsWith('תאריך:'));
    const ref = dateLine('2026-08-06');
    expect(dateLine('2026-08-06T00:15:00')).toBe(ref);
    expect(dateLine('2026-08-06T23:45:00')).toBe(ref);
  });

  it('הלועזי בשורת התאריך הוא 6.8.2026 (לא 5.8 מהזחת UTC)', () => {
    const line = receiptLines(base).find((l) => l.startsWith('תאריך:'))!;
    expect(line).toContain('6.8.2026');
    expect(line).not.toContain('5.8.2026');
  });

  it('מטבע $ מוצג כפי שנמסר', () => {
    expect(receiptLines({ ...base, currency: '$' }).some((l) => l.includes('$180'))).toBe(true);
  });

  it('שורות אופציונליות (אמצעי תשלום/אתר) מופיעות רק כשנמסרו', () => {
    const without = receiptLines(base);
    expect(without.some((l) => l.startsWith('אמצעי תשלום'))).toBe(false);
    const withMethod = receiptLines({ ...base, method: 'מזומן', site: 'maor.org' });
    expect(withMethod.some((l) => l.startsWith('אמצעי תשלום'))).toBe(true);
    expect(withMethod.some((l) => l.startsWith('אתר'))).toBe(true);
  });
});

describe('🔒 ratchet — קבלת סעיף 46 פורמלית', () => {
  const tax = {
    rid: 'D-42', orgName: 'מאור החסד', payer: 'ישראל ישראלי', amount: 1800, currency: '₪',
    date: '2026-01-15', forWhat: 'תרומה — כללי', taxReceipt: true as const,
    orgTaxId: '580123456', signatory: 'הגזבר', payerId: '123456782',
  };
  it('כוללת נוסח §46, מספר עמותה, ת"ז, סכום-במילים וחתימה', () => {
    const txt = receiptLines(tax).join('\n');
    expect(txt).toContain('סעיף 46');
    expect(txt).toContain('580123456');
    expect(txt).toContain('123456782');
    expect(txt).toContain('אלף ושמונה מאות שקלים'); // סכום במילים
    expect(txt).toContain('הגזבר');
    expect(txt).toContain('D-42');
  });
  it('קבלה רגילה (taxReceipt=false) ללא נוסח §46', () => {
    const txt = receiptLines({ ...tax, taxReceipt: false }).join('\n');
    expect(txt).not.toContain('לפי סעיף 46');
    expect(txt).toContain('תודה על תמיכתכם');
  });
  it('שדות עמותה/ת"ז ריקים — לא שוברים, השורות מושמטות', () => {
    const txt = receiptLines({ ...tax, orgTaxId: undefined, payerId: undefined, signatory: undefined }).join('\n');
    expect(txt).toContain('סעיף 46');
    expect(txt).not.toContain('מס׳ עמותה');
    expect(txt).not.toContain('ת"ז / ח"פ');
  });
});
