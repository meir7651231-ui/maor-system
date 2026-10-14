/**
 * 🔒 ratchet — 🧬 התצוגות האמיתיות (ATOMS, 14.10.2026, הסשן המשלב): `previewOf` ו-`chainsFor` על DB-בדיקה.
 *
 * הארגון: צימרי הגליל (fixture המרכזייה) + שתי מנקות (דנה, רבקה) + הזמנה עם יתרה ₪1,200. "עכשיו" = רביעי 14.10.2026 12:00 בישראל.
 * ננעל: כל תצוגה נדרשת עם השורות המדויקות · null כשאין נתונים/אין תצוגה כנה · בלי שמות אורחים · דטרמיניזם (לא תלוי בשעון
 * המערכת, אותו קלט ⇒ אותו פלט) · שלוש השרשראות עם שורה מחושבת · לא זורק על DB פגום.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Db, HostStaff } from '../../../types/domain';
import { B, fixtureDb, HOST_RECORDS, NOW_MS } from '../../switchboard/__tests__/fixture';
import { capabilityId, type AtomId, type Capability } from '../contract';
import { ENGINE_CARDS } from '../engines';
import { chainsFor, hasPreview, installmentsLine, israelMs, israelNow, PREVIEW_KEYS, previewOf, type PreviewCtx } from '../preview';

const STAFF = (id: string, name: string, role: string): HostStaff => ({ id, kind: 'staff', name, role, phone: '', createdAt: 'x', updatedAt: 'x' });
function orgDb(over: Partial<Db> = {}): Db {
  const base = fixtureDb();
  return {
    ...base,
    hostBookings: [
      ...base.hostBookings,
      B({ id: 'hb9', guestId: 'hg1', unitId: 'hu1', checkIn: '2026-10-25', checkOut: '2026-10-28', charges: [{ id: 'c1', kind: 'stay', label: 'לינה', amount: 1200 }], payments: [] }),
    ],
    hostRecords: [...base.hostRecords, STAFF('hs1', 'דנה', 'ניקיון'), STAFF('hs2', 'רבקה', 'ניקיון')],
    ...over,
  };
}
const ctx = (db: Partial<Db> | null = orgDb(), nowMs = NOW_MS): PreviewCtx => ({ db, nowMs });
const cap = (place: string, atom: AtomId, params: Record<string, number | string> = {}): Capability => ({
  id: capabilityId('bookings', place, atom),
  engine: 'bookings',
  place,
  atom,
  params,
  name: 'x',
});
const P = (place: string, atom: AtomId, params: Record<string, number | string> = {}, c: PreviewCtx = ctx()) => previewOf(cap(place, atom, params), c);
const GUESTS = HOST_RECORDS.filter((r) => r.kind === 'guest').map((g) => (g as { name: string }).name);

afterEach(() => vi.useRealTimers());

describe('🧬 שעון ישראל', () => {
  it('היום והדקה מהרגע המוזרק; ההפך מחזיר את אותו רגע (קיץ וחורף)', () => {
    expect(israelNow(NOW_MS)).toEqual({ iso: '2026-10-14', minute: 12 * 60 });
    expect(israelMs('2026-10-14', 12 * 60)).toBe(NOW_MS);
    expect(israelMs('2026-12-01', 11 * 60)).toBe(Date.parse('2026-12-01T09:00:00Z'));
  });
});

describe('🧬 previewOf — התצוגות הנדרשות', () => {
  it('✂️ חלון הניקיון: גודל 40, הפסקה 0 ⇒ 6 תורים, בתורות בין המנקות', () => {
    expect(P('bookings.turnover', 'divide', { by: 'size', size: 40, gap: 0 })).toEqual({
      title: 'חלון הניקיון 11:00–15:00 · 6 תורים',
      lines: ['11:00–11:40 · דנה', '11:40–12:20 · רבקה', '12:20–13:00 · דנה', '13:00–13:40 · רבקה', '13:40–14:20 · דנה', '14:20–15:00 · רבקה'],
    });
    // לפי מספר: 4 חלקים שווים; הגדרות-אירוח אחרות ⇒ חלון אחר
    expect(P('bookings.turnover', 'divide', { by: 'parts', parts: 4 })!.lines[0]).toBe('11:00–12:00 · דנה');
    // יותר מ-6 ⇒ "ועוד N"
    expect(P('bookings.turnover', 'divide', { by: 'size', size: 20 })!.lines.at(-1)).toBe('ועוד 7');
    const late = orgDb({ ui: { ...orgDb().ui, hosting: { checkout: '10:00', checkin: '16:00' } } });
    expect(P('bookings.turnover', 'divide', { by: 'size', size: 60 }, ctx(late))!.title).toBe('חלון הניקיון 10:00–16:00 · 6 תורים');
  });

  it('🔗 הלילות: רצפים פנויים לכל יחידה; רצף שנוגע בסוף-החלון ⇒ "והלאה"', () => {
    expect(P('bookings.nights', 'merge')).toEqual({
      title: 'לילות פנויים צמודים ב-60 הלילות הקרובים',
      lines: ['צימר הגפן · פנוי 2 לילות ברצף מ-14/10', 'צימר הגפן · פנוי 7 לילות ברצף מ-18/10', 'בית ההארחה · פנוי 5 לילות ברצף מ-15/10', 'בית ההארחה · פנוי מ-22/10 והלאה', 'דירת הנחל · פנוי מ-16/10 והלאה'],
    });
    // אורך-מינימום 3 ⇒ רצף-2 נעלם
    expect(P('bookings.nights', 'merge', { minLength: 3 })!.lines[0]).toBe('צימר הגפן · פנוי 7 לילות ברצף מ-18/10');
  });

  it('⏭️ הלילות: הלילה הפנוי הבא לכל יחידה; עם אורך ⇒ הרצף הראשון', () => {
    expect(P('bookings.nights', 'next')!.lines).toEqual(['צימר הגפן · הלילה הפנוי הבא: הלילה', 'בית ההארחה · הלילה הפנוי הבא: 15/10', 'דירת הנחל · הלילה הפנוי הבא: 16/10']);
    expect(P('bookings.nights', 'next', { minLength: 3 })!.lines[0]).toBe('צימר הגפן · 3 לילות פנויים ברצף מ-18/10');
    expect(P('bookings.nights', 'next', { count: 2 })!.lines[1]).toBe('בית ההארחה · הלילות הפנויים הבאים: 15/10, 16/10');
  });

  it('✂️ היתרה: תשלומים שווים ("₪1,200 = 3 × ₪400"), ושארית לא-מתחלקת', () => {
    expect(P('bookings.balance', 'divide', { parts: 3 })).toEqual({ title: 'היתרות בתשלומים שווים', lines: ['צימר הגפן · ₪1,200 = 3 × ₪400'] });
    expect(P('bookings.balance', 'divide', { parts: 7 })!.lines[0]).toBe('צימר הגפן · ₪1,200 = ₪174 + 6 × ₪171');
    expect(P('bookings.balance', 'divide', { by: 'size', size: 500 })!.lines[0]).toBe('צימר הגפן · ₪1,200 = 2 × ₪500 + ₪200');
    expect(installmentsLine(1000, [334, 333, 333])).toBe('₪1,000 = ₪334 + 2 × ₪333');
  });

  it('🎯 היתרה והמחיר: עיגול', () => {
    const odd = orgDb({ hostBookings: [B({ id: 'hb9', unitId: 'hu1', checkIn: '2026-10-25', checkOut: '2026-10-28', charges: [{ id: 'c', kind: 'stay', label: 'לינה', amount: 1234.5 }] })] });
    expect(P('bookings.balance', 'round', { step: 10, dir: 'down' }, ctx(odd))!.lines).toEqual(['צימר הגפן · ₪1,234.5 ⇒ ₪1,230']);
    expect(P('bookings.total', 'round', { step: 100, dir: 'up' }, ctx(odd))!.lines).toEqual(['צימר הגפן · ₪1,234.5 ⇒ ₪1,300']);
  });

  it('📣 משימות הניקיון: הסלמה — עכשיו אצל, ועד מתי, ולמי עוברת', () => {
    expect(P('bookings.cleaning', 'escalate')).toEqual({
      title: 'מעביר הלאה · ממתין אחד',
      lines: ['משימת ניקיון · דירת הנחל — עכשיו אצל דנה · אם אין אישור עד 14:00 ⇒ רבקה'],
    });
    // שעה וחצי ⇒ עד 12:30; ב-13:00 ⇒ כבר אצל רבקה (אחרונה בתור)
    expect(P('bookings.cleaning', 'escalate', { waitMin: 90 })!.lines[0]).toBe('משימת ניקיון · דירת הנחל — עכשיו אצל דנה · אם אין אישור עד 12:30 ⇒ רבקה');
    expect(P('bookings.cleaning', 'escalate', { waitMin: 90 }, ctx(orgDb(), NOW_MS + 3_600_000))!.lines[0]).toBe('משימת ניקיון · דירת הנחל — עכשיו אצל רבקה (אחרון בתור)');
    // משימה של מחר ⇒ "תישלח"
    const tmr = orgDb({ hostRecords: [...orgDb().hostRecords.filter((r) => r.id !== 'hc1'), { id: 'hc9', kind: 'clean', unitId: 'hu1', type: 'ניקיון', status: 'open', date: '2026-10-15', createdAt: 'x', updatedAt: 'x' }] as Db['hostRecords'] });
    expect(P('bookings.cleaning', 'escalate', {}, ctx(tmr))!.lines[0]).toBe('משימת ניקיון · צימר הגפן — תישלח לדנה ב-15/10 11:00');
  });

  it('📣 בלי צוות מתאים ⇒ שורה כנה (לא ממציאים מנקה); בלי משימות ⇒ null', () => {
    expect(P('bookings.cleaning', 'escalate', {}, ctx(fixtureDb()))).toEqual({
      title: 'מעביר הלאה · ממתין אחד',
      lines: ['אין עדיין אנשי צוות בתפקיד ניקיון — הוסיפו אותם בצוות, וההעברה הלאה תתחיל לעבוד'],
    });
    const none = orgDb({ hostRecords: orgDb().hostRecords.filter((r) => r.kind !== 'clean') });
    expect(P('bookings.cleaning', 'escalate', {}, ctx(none))).toBeNull();
  });

  it('🔄 משימות הניקיון: מי מקבל את המשימה הבאה (לפי יום · לפי פריט)', () => {
    expect(P('bookings.cleaning', 'rotate')).toEqual({ title: 'בתורות לפי יום · 2 בתור', lines: ['היום ⇒ דנה', 'מחר ⇒ רבקה', '16/10 ⇒ דנה'] });
    expect(P('bookings.cleaning', 'rotate', { by: 'item' })).toEqual({
      title: 'בתורות לפי פריט · 2 בתור',
      lines: ['משימת ניקיון · דירת הנחל ⇒ דנה', 'המשימה החדשה הבאה ⇒ רבקה'],
    });
  });

  it('⏱️ ההגעות: מועדי תזכורת; ⏭️ ההגעה הבאה; 🎯 עיגול שעת-ההגעה', () => {
    expect(P('bookings.arrivals', 'offset', { minutes: -1440 })).toEqual({
      title: 'תזכורת 1440 דקות לפני כל הגעה',
      lines: ['דירת הנחל · הגעה 14/10 15:00 ⇒ תזכורת 13/10 15:00', 'צימר הגפן · הגעה 16/10 15:00 ⇒ תזכורת 15/10 15:00', 'בית ההארחה · הגעה 20/10 15:00 ⇒ תזכורת 19/10 15:00', 'צימר הגפן · הגעה 25/10 15:00 ⇒ תזכורת 24/10 15:00'],
    });
    expect(P('bookings.arrivals', 'next')).toEqual({ title: 'ההגעה הבאה', lines: ['היום 15:00 · דירת הנחל'] });
    expect(P('bookings.arrivals', 'next', { count: 2 })!.lines).toEqual(['היום 15:00 · דירת הנחל', '16/10 15:00 · צימר הגפן']);
    // אחרי 15:00 ⇒ ההגעה של היום כבר "עברה"
    expect(P('bookings.arrivals', 'next', {}, ctx(orgDb(), NOW_MS + 4 * 3_600_000))!.lines).toEqual(['16/10 15:00 · צימר הגפן']);
    const odd = orgDb({ ui: { ...orgDb().ui, hosting: { checkin: '15:10' } } });
    expect(P('bookings.arrivals', 'round', { step: 30, dir: 'up' }, ctx(odd))!.lines[0]).toBe('דירת הנחל · 14/10 15:10 ⇒ 15:30');
  });

  it('✂️ השהייה והזמן עד ההגעה: מועדים בתוך הטווח', () => {
    expect(P('bookings.stay', 'divide', { parts: 2 })!.lines[0]).toBe('בית ההארחה · 12/10–15/10 ⇒ ניקיון ב-14/10');
    expect(P('bookings.untilArrival', 'divide', { parts: 3 })!.lines).toEqual(['צימר הגפן · הגעה 16/10 ⇒ 15/10', 'בית ההארחה · הגעה 20/10 ⇒ 16/10, 18/10', 'צימר הגפן · הגעה 25/10 ⇒ 18/10, 21/10']);
  });

  it('אין תצוגה כנה ⇒ null: מקומות בלי קורא, מנועים אחרים, טקסט עם שמות-אורחים', () => {
    for (const [place, atom] of [['bookings.day', 'divide'], ['bookings.guests', 'fuzzy'], ['bookings.unitStays', 'next'], ['bookings.sacredDays', 'merge']] as const) {
      expect(hasPreview(place, atom)).toBe(false);
      expect(P(place, atom)).toBeNull();
    }
    expect(previewOf({ place: 'zmanim.day', atom: 'divide', params: {} }, ctx())).toBeNull();
  });

  it('כל מפתח-תצוגה הוא מקום+חלק אמיתי מכרטיס ההזמנות', () => {
    const card = ENGINE_CARDS.find((e) => e.id === 'bookings')!;
    for (const k of PREVIEW_KEYS) {
      const [place, atom] = k.split(':') as [string, AtomId];
      expect(card.places.find((p) => p.id === place)?.results[atom], k).toBeTruthy();
    }
    for (const req of ['bookings.turnover:divide', 'bookings.nights:merge', 'bookings.nights:next', 'bookings.balance:divide', 'bookings.cleaning:escalate', 'bookings.cleaning:rotate', 'bookings.arrivals:offset', 'bookings.arrivals:next', 'bookings.balance:round', 'bookings.total:round']) {
      expect(PREVIEW_KEYS, req).toContain(req);
    }
  });

  it('בלי שמות אורחים — באף תצוגה ובאף שרשרת', () => {
    const all: string[] = [];
    for (const k of PREVIEW_KEYS) {
      const [place, atom] = k.split(':') as [string, AtomId];
      for (const params of [{}, { by: 'item' }, { parts: 3 }] as Record<string, number | string>[]) {
        const p = P(place, atom, params);
        if (p) all.push(p.title, ...p.lines);
      }
    }
    for (const ch of chainsFor('bookings', ctx())) all.push(ch.name, ...ch.lines);
    expect(all.length).toBeGreaterThan(30);
    for (const g of GUESTS) expect(all.join('\n'), g).not.toContain(g);
  });

  it('DB ריק / פגום / רגע לא-סופי ⇒ null, לא זורק', () => {
    for (const k of PREVIEW_KEYS) {
      const [place, atom] = k.split(':') as [string, AtomId];
      expect(P(place, atom, {}, ctx(null)), k).toBeNull();
      expect(P(place, atom, {}, ctx({ hostBookings: 'x', hostRecords: [null], hostUnits: [7] } as unknown as Db)), k).toBeNull();
      expect(P(place, atom, {}, ctx(orgDb(), NaN)), k).toBeNull();
    }
  });

  it('דטרמיניזם: אותו קלט ⇒ אותו פלט, לא תלוי בשעון-המערכת', () => {
    const run = () => PREVIEW_KEYS.map((k) => JSON.stringify(P(k.split(':')[0], k.split(':')[1] as AtomId, { by: 'size', size: 40 })));
    const a = run();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-03-01T03:00:00Z'));
    expect(run()).toEqual(a);
    expect(JSON.stringify(chainsFor('bookings', ctx()))).toBe(JSON.stringify(chainsFor('bookings', ctx())));
  });
});

describe('🧬 chainsFor — חלק אחרי חלק', () => {
  it('שלוש השרשראות עם שורות מחושבות מהנתונים', () => {
    const ch = chainsFor('bookings', ctx());
    expect(ch.map((c) => [c.steps.map((s) => s.atom).join('>'), c.name])).toEqual([
      ['divide>merge', 'תורים באורך משתנה'],
      ['merge>next', 'החלון הפנוי הבא של 3 לילות'],
      ['merge>divide', 'חלוקה הוגנת של הזמן הפנוי'],
    ]);
    expect(ch[0].lines).toEqual(['12 משבצות של 20 דקות בחלון 11:00–15:00', 'תור של 2 משבצות = 40 דקות · 11:00–11:40', 'תור של 3 משבצות = 60 דקות · 11:00–12:00']);
    expect(ch[1].lines).toEqual(['צימר הגפן · 3 לילות פנויים ברצף מ-18/10 עד 21/10', 'בית ההארחה · 3 לילות פנויים ברצף מ-15/10 עד 18/10', 'דירת הנחל · 3 לילות פנויים ברצף מ-16/10 עד 19/10']);
    expect(ch[2].lines).toEqual(['צימר הגפן · פנוי 2 לילות ⇒ דנה 14/10 · רבקה 15/10', 'בית ההארחה · פנוי 5 לילות ⇒ דנה 15/10–17/10 · רבקה 18/10–19/10']);
  });

  it('השרשראות לוקחות את מה שהארגון כבר בחר: מיזוג באורך 5 ⇒ "של 5 לילות"; חלוקה בגודל 40 ⇒ משבצות של 40', () => {
    const caps = [cap('bookings.nights', 'merge', { minLength: 5, maxGap: 0 }), cap('bookings.turnover', 'divide', { by: 'size', size: 40 })];
    const ch = chainsFor('bookings', ctx(), caps);
    expect(ch[1].name).toBe('החלון הפנוי הבא של 5 לילות');
    expect(ch[1].lines[0]).toBe('צימר הגפן · 5 לילות פנויים ברצף מ-18/10 עד 23/10');
    expect(ch[0].lines[0]).toBe('6 משבצות של 40 דקות בחלון 11:00–15:00');
  });

  it('בלי ctx ⇒ השרשראות בלי שורות; מנוע אחר ⇒ אין', () => {
    expect(chainsFor('bookings').every((c) => c.lines.length === 0)).toBe(true);
    expect(chainsFor('zmanim', ctx())).toEqual([]);
  });
});
