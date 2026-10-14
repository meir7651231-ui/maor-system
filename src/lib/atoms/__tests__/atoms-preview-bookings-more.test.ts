/**
 * 🔒 ratchet — 🛏️ שאר התצוגות של מנהל ההזמנות (ATOMS-PREVIEWS, 14.10.2026): הזמנות-אורח · הזמנות-יחידה · שבתות וחגים ·
 * תקלות-יחידה. "עכשיו" = רביעי 14.10.2026 12:00 בישראל.
 * ננעל: השורות המדויקות · השבתות והחגים = אותם חלונות כמו מחשבון הזמנים · בלי שמות אורחים (גם לא מתיאור תקלה)
 * · HONEST_NULLS נשארים null · DB ריק/פגום ⇒ null, לא זורק.
 */
import { describe, expect, it } from 'vitest';
import type { Db } from '../../../types/domain';
import { HOST_RECORDS } from '../../switchboard/__tests__/fixture';
import { HONEST_NULLS } from '../previewBookingsMore';
import { ctxOf, PV, richDb } from './previewsFixture';

const GUESTS = HOST_RECORDS.filter((r) => r.kind === 'guest').map((g) => (g as { name: string }).name);
const PAIRS = [
  ['bookings.guestStays', 'merge'],
  ['bookings.unitStays', 'merge'],
  ['bookings.unitStays', 'next'],
  ['bookings.sacredDays', 'merge'],
  ['bookings.sacredDays', 'next'],
  ['bookings.unitFaults', 'merge'],
] as const;
const noHb9 = (): Db => {
  const db = richDb();
  return { ...db, hostBookings: db.hostBookings.filter((b) => b.id !== 'hb9') };
};

describe('🛏️ הזמנות של אותו אורח · 🔗', () => {
  it('הזמנות צמודות של אותו אורח ⇒ שהייה אחת (יחידות ותאריכים, בלי שם)', () => {
    expect(PV('bookings.guestStays', 'merge')).toEqual({
      title: 'הזמנות של אותו אורח, מחוברות לשהייה אחת',
      lines: ['אותו אורח · צימר הגפן 16/10–18/10 + צימר הגפן 18/10–20/10 + בית ההארחה 20/10–22/10 ← שהייה אחת 16/10–22/10 (6 לילות)'],
    });
  });

  it('לא צמודות ⇒ אומרים כמה לילות ביניהן; רווח מותר ⇒ מתחברות', () => {
    expect(PV('bookings.guestStays', 'merge', {}, ctxOf(noHb9()))!.lines).toEqual(['אותו אורח · 16/10–18/10 ו-20/10–22/10 — לא צמודות (2 לילות ביניהן)']);
    expect(PV('bookings.guestStays', 'merge', { maxGap: 2 }, ctxOf(noHb9()))!.lines).toEqual([
      'אותו אורח · צימר הגפן 16/10–18/10 + בית ההארחה 20/10–22/10 ← שהייה אחת 16/10–22/10 (6 לילות, מהם 2 לילות בלי הזמנה)',
    ]);
  });
});

describe('🛏️ הזמנות של כל יחידה · 🔗 ⏭️', () => {
  it('🔗 הזמנות צמודות ביחידה ⇒ אורחים ברצף, עם חלון הניקיון בין עזיבה לכניסה', () => {
    expect(PV('bookings.unitStays', 'merge')).toEqual({
      title: 'ההזמנות בכל יחידה ב-60 הלילות הקרובים',
      lines: [
        'צימר הגפן · 2 הזמנות צמודות ← אורחים ברצף 16/10–20/10 · ניקיון בין עזיבה לכניסה ב-18/10 11:00–15:00',
        'בית ההארחה · הזמנה אחת 12/10–15/10',
        'בית ההארחה · הזמנה אחת 20/10–22/10',
        'דירת הנחל · הזמנה אחת 14/10–16/10',
      ],
    });
  });

  it('⏭️ ההזמנה הבאה בכל יחידה; מי שמגיע היום עוד לא "עכשיו יש אורחים"', () => {
    expect(PV('bookings.unitStays', 'next')!.lines).toEqual([
      'צימר הגפן · ההזמנה הבאה: 16/10–18/10 (2 לילות)',
      'בית ההארחה · ההזמנה הבאה: 20/10–22/10 (2 לילות) · עכשיו יש אורחים עד 15/10',
      'דירת הנחל · ההזמנה הבאה: 14/10–16/10 (2 לילות)',
    ]);
    expect(PV('bookings.unitStays', 'next', { count: 2 })!.lines[0]).toBe('צימר הגפן · ההזמנות הבאות: 16/10–18/10 (2 לילות), 18/10–20/10 (2 לילות)');
  });
});

describe('🛏️ שבתות וחגים · 🔗 ⏭️ — אותו מחשבון כמו הזמנים', () => {
  it('🔗 כל חלון סגור, ומי מתארח בו', () => {
    const p = PV('bookings.sacredDays', 'merge')!;
    expect(p.title).toBe('שבתות וחגים, ומי מתארח בהם · לפי בני ברק');
    expect(p.lines[0]).toBe('שבת · מ-16/10 17:46 עד 17/10 18:47 ← אורחים ביחידה אחת: צימר הגפן');
    expect(p.lines[1]).toBe('שבת · מ-23/10 17:38 עד 24/10 18:39 ← אין אורחים');
    // אותם חלונות בדיוק כמו "מחשבון הזמנים · הימים הסגורים"
    const z = PV('zmanim.closedDays', 'merge')!.lines;
    expect(p.lines.map((l) => l.split(' ← ')[0])).toEqual(z);
  });

  it('⏭️ השבת או החג הבא שבו יש אורחים; אין ⇒ אומרים זאת', () => {
    expect(PV('bookings.sacredDays', 'next')).toEqual({
      title: 'השבת או החג הבא עם אורחים · לפי בני ברק',
      lines: ['השבת הבאה עם אורחים: שבת · מ-16/10 17:46 עד 17/10 18:47 · יחידה אחת: צימר הגפן'],
    });
    const none = { ...richDb(), hostBookings: [] } as Db;
    expect(PV('bookings.sacredDays', 'next', {}, ctxOf(none))!.lines).toEqual(['אין אורחים באף שבת או חג ב-30 הימים הקרובים']);
    // ראש השנה ושבת עם אורחים
    const rh = { ...richDb(), hostBookings: [{ ...richDb().hostBookings[0], id: 'hbRH', checkIn: '2026-09-11', checkOut: '2026-09-14' }] } as Db;
    expect(PV('bookings.sacredDays', 'next', {}, ctxOf(rh, Date.parse('2026-09-09T09:00:00Z')))!.lines[0]).toBe(
      'החג הבא עם אורחים: ראש השנה ושבת · מ-11/9 18:31 עד 13/9 19:30 · יחידה אחת: צימר הגפן',
    );
  });
});

describe('🛏️ תקלות היחידה · 🔗', () => {
  it('כמה תקלות פתוחות ⇒ סגירה אחת עד שהאחרונה מתוקנת; התחום, לא התיאור', () => {
    expect(PV('bookings.unitFaults', 'merge')).toEqual({
      title: 'התקלות הפתוחות בכל יחידה',
      lines: [
        'צימר הגפן · 2 תקלות פתוחות (אינסטלציה, חשמל) ← סגורה מ-13/10 עד שהאחרונה מתוקנת',
        'כללי (לא ביחידה) · תקלה פתוחה אחת (גז) — דחופה, אבל לא שייכת ליחידה ולכן לא סוגרת יחידה',
      ],
    });
    const two = richDb();
    two.hostRecords = two.hostRecords.map((r) => (r.id === 'hf1' ? { ...r, priority: 0, blocked: true } : r));
    expect(PV('bookings.unitFaults', 'merge', {}, ctxOf(two))!.lines[0]).toBe('צימר הגפן · 2 תקלות פתוחות (אינסטלציה, חשמל) ← 2 דחופות = סגירה אחת מ-1/10 עד שהאחרונה מתוקנת');
  });
});

describe('🛏️ פרטיות · אין תצוגה כנה · בלי נתונים', () => {
  it('בלי שמות אורחים — באף תצוגה ובאף פרטים (גם לא מתיאור תקלה)', () => {
    const all: string[] = [];
    for (const [place, atom] of PAIRS) {
      for (const params of [{}, { maxGap: 3 }, { count: 3 }, { minLength: 2 }] as Record<string, number | string>[]) {
        const p = PV(place, atom, params);
        if (p) all.push(p.title, ...p.lines);
      }
    }
    expect(all.length).toBeGreaterThan(20);
    for (const g of [...GUESTS, 'משפחת לוי דיווחו', '050-1234567']) expect(all.join('\n'), g).not.toContain(g);
  });

  it('HONEST_NULLS נשארים null, עם סיבה', () => {
    expect(Object.keys(HONEST_NULLS).sort()).toEqual(['bookings.day:divide', 'bookings.guests:fuzzy']);
    for (const [k, why] of Object.entries(HONEST_NULLS)) {
      const [place, atom] = k.split(':');
      expect(PV(place, atom), k).toBeNull();
      expect(why.length, k).toBeGreaterThan(20);
    }
  });

  it('בלי הזמנות/יחידות/תקלות ⇒ null; DB פגום לא זורק', () => {
    for (const [place, atom] of PAIRS) {
      expect(PV(place, atom, {}, ctxOf(null)), place + atom).toBeNull();
      expect(PV(place, atom, {}, ctxOf({ hostBookings: 'x', hostRecords: [null], hostUnits: [7] } as unknown as Db)), place + atom).toBeNull();
    }
  });
});
