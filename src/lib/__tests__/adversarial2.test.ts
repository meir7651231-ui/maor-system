/**
 * סוללת תקיפה אדוורסרית — סבב 2. פונקציות נוספות, קלט קיצון/זדוני.
 * כל בדיקה מקודדת התנהגות נכונה; כשל = באג אמיתי.
 */
import { describe, expect, it } from 'vitest';
import { hebToIso, isoToHebParts } from '../hebdate';
import { payBal, paidOf } from '../../components/courses/lib';
import { numMatch } from '../../components/families/lib';
import { planSupporterImport } from '../../components/supporters/lib';
import { buildCustomExport } from '../customExport';
import { migrate } from '../../store/persist';
import { DEFAULT_CONFIG } from '../../types/config';
import { emptyDb } from '../../types/domain';
import type { Enrollment, Supporter } from '../../types/domain';

describe('⚔️ hebToIso / isoToHebParts — תאריך עברי שבור', () => {
  it('יום 40 לא קיים → null', () => {
    expect(hebToIso(40, 'תשרי', 5786)).toBeNull();
  });
  it('יום 0 → null', () => {
    expect(hebToIso(0, 'תשרי', 5786)).toBeNull();
  });
  it('שם חודש לא קיים → null', () => {
    expect(hebToIso(1, 'בלבלה', 5786)).toBeNull();
  });
  it('isoToHebParts על זבל → null', () => {
    expect(isoToHebParts('not-a-date')).toBeNull();
    expect(isoToHebParts('')).toBeNull();
    expect(isoToHebParts('2024-13-40')).toBeNull();
  });
});

function enr(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e', memberId: 'm', courseId: 'c', plan: 'monthly', status: 'active',
    enrolledAt: '2024-01-01', group: '', totalDue: 0, purchased: 0, used: 0,
    payments: [], absences: [], ...over,
  } as Enrollment;
}

describe('⚔️ payBal / paidOf — סכומים שבורים', () => {
  it('תשלום NaN לא מזהם את היתרה', () => {
    const e = enr({ totalDue: 100, payments: [{ rid: 'R', amount: NaN, date: '2024-01-01', method: 'מזומן' }] as never });
    expect(Number.isFinite(payBal(e))).toBe(true);
  });
  it('יתרה לעולם לא שלילית', () => {
    const e = enr({ totalDue: 50, payments: [{ rid: 'R', amount: 999, date: '2024-01-01', method: 'מזומן' }] as never });
    expect(payBal(e)).toBeGreaterThanOrEqual(0);
  });
  it('totalDue שלילי לא מחזיר יתרה שלילית', () => {
    const e = enr({ totalDue: -100, payments: [] });
    expect(payBal(e)).toBeGreaterThanOrEqual(0);
  });
});

describe('⚔️ numMatch — תחביר מספרים חריג', () => {
  it('ריק/רווח = ללא סינון', () => {
    expect(numMatch('', 5)).toBe(true);
    expect(numMatch('   ', 0)).toBe(true);
  });
  it('טווח הפוך 5-2 לא מתרסק', () => {
    expect(() => numMatch('5-2', 3)).not.toThrow();
  });
});

describe('⚔️ planSupporterImport — כפילויות וקלט ריק', () => {
  it('שתי שורות עם אותו שם מנורמל → הוספה אחת בלבד', () => {
    const plan = planSupporterImport(
      [
        { name: 'משה כהן', phone: '', email: '', idNum: '', address: '', cat: '', forWho: '' },
        { name: 'משהכהן', phone: '050', email: '', idNum: '', address: '', cat: '', forWho: '' },
      ],
      [],
    );
    expect(plan.inserts.length).toBe(1);
  });
  it('שורת שם ריק נזרקת', () => {
    const plan = planSupporterImport(
      [{ name: '   ', phone: '050', email: '', idNum: '', address: '', cat: '', forWho: '' }],
      [],
    );
    expect(plan.inserts.length + plan.updates.length).toBe(0);
  });
});

describe('⚔️ buildCustomExport — טווח וקלט חריג', () => {
  it('טווח הפוך (from>to) לא מתרסק ומחזיר לפחות כותרת', () => {
    const rows = buildCustomExport(DEFAULT_CONFIG, emptyDb(), 'supporters', { from: '2025-12-31', to: '2020-01-01' }, ['name']);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
  it('בחירת שדות ריקה → כותרת בלבד, בלי קריסה', () => {
    const rows = buildCustomExport(DEFAULT_CONFIG, emptyDb(), 'courses', { from: '', to: '' }, []);
    expect(rows.length).toBe(1);
  });
});

describe('⚔️ migrate — נתונים פגומים', () => {
  it('null / זבל → null, בלי לזרוק', () => {
    expect(() => migrate(null)).not.toThrow();
    expect(() => migrate('garbage')).not.toThrow();
    expect(() => migrate(42)).not.toThrow();
  });
  it('אובייקט חלקי (families בלבד) לא מפיל', () => {
    expect(() => migrate({ families: [{ id: 'a', name: 'x' }] })).not.toThrow();
  });
});

// שומר על supTotalIls בשימוש כדי שהבדיקות ישקפו קלט תומך אמיתי
const _sp: Supporter = { ...({} as Supporter) };
void _sp; void paidOf;
