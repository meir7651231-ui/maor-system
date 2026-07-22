/**
 * חזרה שנתית עברית של אירועים (אזכרה/יום-נישואים) חוצה שנה מעוברת:
 * אירוע שנקבע ב"אדר" של שנה פשוטה חייב להופיע ב"אדר ב׳" של שנה מעוברת —
 * אחרת הוא נעלם מהלוח (איבוד נתונים). מאומת מול לוח Intl האמיתי דרך hebToIso.
 */
import { describe, expect, it } from 'vitest';
import { hebToIso, isHebLeapYear } from '../hebdate';
import { eventsOnDate } from '../../components/home/homeData';
import { emptyDb } from '../../types/domain';
import type { Db, OrgEvent } from '../../types/domain';

/** אירוע אזכרה מלא (כל השדות הנדרשים) בתאריך נתון. */
function memorial(id: string, date: string): OrgEvent {
  return {
    id, type: 'memorial', title: 'אזכרה', date, time: '', famId: '',
    done: false, priority: 'gray', customType: '', notes: '', price: 0, roomId: '',
  } as unknown as OrgEvent;
}
function dbWith(...events: OrgEvent[]): Db {
  return { ...emptyDb(), events };
}
/** צהריים מקומי — isoOf/hebParts בטוחים משעון קיץ. */
function noon(iso: string): Date {
  return new Date(iso + 'T12:00:00');
}

// שנה פשוטה ראשונה מ-5785, ואז שנה מעוברת ראשונה שאחריה — מהלוח האמיתי
let common = 0;
let leap = 0;
for (let y = 5785; y < 5815 && !leap; y++) {
  if (!common && !isHebLeapYear(y)) common = y;
  else if (common && y > common && isHebLeapYear(y)) leap = y;
}

describe('🗓️ אדר בשנה מעוברת — יסודות הלוח קיימים', () => {
  it('נמצאו שנה פשוטה ושנה מעוברת עוקבת', () => {
    expect(common).toBeGreaterThan(0);
    expect(leap).toBeGreaterThan(common);
  });
  it('לשנה מעוברת יש גם אדר א׳ וגם אדר ב׳', () => {
    expect(hebToIso(15, 'אדר א׳', leap)).not.toBeNull();
    expect(hebToIso(15, 'אדר ב׳', leap)).not.toBeNull();
  });
});

describe('🕯️ אזכרה שנקבעה ב"אדר" רגיל — חוזרת ב"אדר ב׳" של שנה מעוברת', () => {
  const origIso = hebToIso(15, 'אדר', common)!;
  const leapAdar2 = hebToIso(15, 'אדר ב׳', leap)!;
  const leapAdar1 = hebToIso(15, 'אדר א׳', leap)!;
  const db = dbWith(memorial('m1', origIso));

  it('1️⃣ מופיעה ביום המקורי', () =>
    expect(eventsOnDate(db, noon(origIso)).some((e) => e.id === 'm1')).toBe(true));
  it('2️⃣ FIX: מופיעה ב-15 אדר ב׳ של השנה המעוברת', () =>
    expect(eventsOnDate(db, noon(leapAdar2)).some((e) => e.id === 'm1')).toBe(true));
  it('🚫 לא מופיעה ב-15 אדר א׳ (החודש ה"עודף", לא מקביל מיקומית)', () =>
    expect(eventsOnDate(db, noon(leapAdar1)).some((e) => e.id === 'm1')).toBe(false));
  it('🚫 לא מופיעה ביום שגוי (16 אדר ב׳)', () => {
    const wrong = hebToIso(16, 'אדר ב׳', leap)!;
    expect(eventsOnDate(db, noon(wrong)).some((e) => e.id === 'm1')).toBe(false);
  });
});

describe('🔁 הכיוון ההפוך: אזכרה מ"אדר ב׳" מעוברת — חוזרת ב"אדר" של שנה פשוטה', () => {
  // צריך שנה מעוברת מוקדמת ואז שנה פשוטה אחריה
  let lp = 0;
  let cm = 0;
  for (let y = 5784; y < 5815 && !cm; y++) {
    if (!lp && isHebLeapYear(y)) lp = y;
    else if (lp && y > lp && !isHebLeapYear(y)) cm = y;
  }
  const origIso = hebToIso(10, 'אדר ב׳', lp)!;
  const commonAdar = hebToIso(10, 'אדר', cm)!;
  const db = dbWith(memorial('m2', origIso));

  it('מופיעה ב-10 אדר של השנה הפשוטה שאחריה', () =>
    expect(eventsOnDate(db, noon(commonAdar)).some((e) => e.id === 'm2')).toBe(true));
});

describe('✅ בקרה: חודש רגיל (ניסן) חוזר כרגיל, בלי תופעות לוואי מהתיקון', () => {
  const origIso = hebToIso(10, 'ניסן', common)!;
  const nextNisan = hebToIso(10, 'ניסן', common + 1)!;
  const db = dbWith(memorial('m3', origIso));
  it('10 ניסן חוזר ב-10 ניסן בשנה הבאה', () =>
    expect(eventsOnDate(db, noon(nextNisan)).some((e) => e.id === 'm3')).toBe(true));
});
