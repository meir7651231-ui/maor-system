/**
 * ratchet — 🔌 המרכזייה 1: כל יכולת — טהורה, דטרמיניסטית, נכונה, פרטית (BUILD-ORDER-SWITCHBOARD-2026-10-13).
 *
 * הסיפור: רביעי 14.10.2026 12:00 בישראל; משפחת לוי לשבת 16–18.10 בצימר הגפן; נזילה בכיור; אינסטלציה זילברמן פתוח
 * א׳–ה׳ 08–19 + ו׳ 08–13; מניינים בבית המדרש הגדול ובשטיבלך.
 *  · findPro בוחר **את אותו בעל-מקצוע שהקו בוחר** (resolveSpeech) לכל משפט; תחום-ודאי קובע ("רואה חשבון" לא מוצא מלמד);
 *    קוד-חיוג כפול ⇒ אין קוד; רק מאושרים; פתוח-עכשיו לפי שעון-הקהילה ושבת.
 *  · availability: חסומה לא פנויה (F1), אורח-באיחור מחזיק (F8), חדרים ביחידה משותפת; בלי מחירים ובלי שמות-אורחים.
 *  · today: ספירות לפי תת-הדגלים; "טופל היום" לפי שעון-הארגון.
 *  · כל יכולת: אותו קלט ⇒ אותו פלט; db מוקפא לא נכתב; Date.now לא נקרא.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ask, installProvider, type AbilityId } from '../registry';
import type { Answer, AskResult, SwitchCtx } from '../contract';
import { abilities as hostingAbilities } from '../../../components/hosting/abilities';
import { abilities as parnasaAbilities } from '../../../components/parnasa/abilities';
import { buildPhoneMenu, resolveSpeech } from '../../../components/parnasa/phoneLine';
import { clockAt, makeClosureFn, resolveZmanimLoc, shabbatOf } from '../../../components/parnasa/zmanimBoard';
import type { Db, HostBooking } from '../../../types/domain';
import { B, cfgWith, fixtureDb, L, NOW_MS, P, U, WEEK_HOURS } from './fixture';

/** epoch של שעה מקומית בישראל (IDT = UTC+3) — אוקטובר 2026 לפני 25.10. */
const idt = (y: number, mo: number, d: number, h: number, mi = 0): number => Date.UTC(y, mo - 1, d, h - 3, mi);
const BOTH = cfgWith({ parnasa: true, hosting: true });
const ctxAt = (nowMs: number = NOW_MS, db: Db = fixtureDb(), config = BOTH): SwitchCtx => ({ db, config, nowMs });

function okValue<O>(r: AskResult<O>): O {
  expect(r.ok, r.ok ? '' : r.reason + ': ' + r.message).toBe(true);
  return (r as Answer<O>).value;
}

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o as Record<string, unknown>)) deepFreeze(v);
  }
  return o;
}

beforeAll(() => {
  installProvider('hosting', hostingAbilities);
  installProvider('parnasa', parnasaAbilities);
});
afterEach(() => {
  vi.restoreAllMocks();
});

/* ═══════════════ טוהר ודטרמיניזם — כל יכולת ═══════════════ */

const CALLS: ReadonlyArray<readonly [AbilityId, unknown]> = [
  ['parnasa.findPro', { text: 'נזילה בכיור' }],
  ['parnasa.findPro', { text: 'אינסטלטור', openNow: true, limit: 1 }],
  ['parnasa.shabbat', {}],
  ['parnasa.shabbat', { atIso: '2026-10-16' }],
  ['parnasa.minyanim', { fromIso: '2026-10-16', days: 2 }],
  ['parnasa.emergency', {}],
  ['hosting.availability', {}],
  ['hosting.availability', { fromIso: '2026-10-16', nights: 2 }],
  ['hosting.today', {}],
];

describe('🔌 טוהר ודטרמיניזם', () => {
  it('אותו קלט ⇒ אותו פלט (תו-בתו), על db מוקפא, בלי לקרוא את שעון-המערכת', () => {
    const nowSpy = vi.spyOn(Date, 'now');
    const frozen = deepFreeze(fixtureDb());
    for (const [id, input] of CALLS) {
      const a = ask(id, ctxAt(NOW_MS, frozen), input as never);
      const b = ask(id, ctxAt(NOW_MS, frozen), input as never);
      expect(a.ok, id).toBe(true);
      expect(JSON.stringify(a), id).toBe(JSON.stringify(b));
    }
    expect(nowSpy, 'Date.now נקרא מתוך יכולת').not.toHaveBeenCalled();
  });

  it('בלתי-תלוי באזור-הזמן של המכשיר', () => {
    const run = (): string => CALLS.map(([id, input]) => JSON.stringify(ask(id, ctxAt(), input as never))).join('\n');
    const orig = process.env.TZ;
    try {
      process.env.TZ = 'UTC';
      const a = run();
      process.env.TZ = 'America/New_York';
      const b = run();
      process.env.TZ = 'Asia/Tokyo';
      expect(run()).toBe(a);
      expect(b).toBe(a);
    } finally {
      if (orig === undefined) delete process.env.TZ;
      else process.env.TZ = orig;
    }
  });
});

/* ═══════════════ parnasa.findPro ═══════════════ */

describe('🔧 parnasa.findPro — מי יכול לעזור עכשיו', () => {
  it('"נזילה בכיור" ⇒ אינסטלציה: זילברמן ראשון, פתוח עכשיו, ☎ 101, טלפון+וואטסאפ; ממתין-לאישור לא נקרא', () => {
    const v = okValue(ask('parnasa.findPro', ctxAt(), { text: 'נזילה בכיור' }));
    expect(v.concept).toBe('אינסטלציה');
    expect(v.pros[0]).toMatchObject({ id: 'pl101', name: 'אינסטלציה זילברמן', trade: 'נזילות, סתימות ודודים', dialCode: '101', open: true, status: 'פנוי עכשיו · עד 19:00', phone: '050-0000101', whatsapp: '050-0000101' });
    expect(v.pros.map((p) => p.id)).not.toContain('pl130');
    expect(v.brand).toBe('פרנסה׳לע של קהילת בעלזא');
    expect(v.waIntro).toBe('שלום, הגעתי אליך דרך פרנסה׳לע של קהילת בעלזא. צריך עזרה: נזילה בכיור');
    expect(JSON.stringify(v), 'בלי הערה-פנימית/המלצות/מחירון').not.toMatch(/"notes"|"recs"|"services"/);
  });

  it('openNow: ביום שישי אחרי 13:00 — זילברמן סגור ⇒ רק הפתוחים (חשמל 24/7); בשבת — אף אחד, והסטטוס "חוזר במוצ״ש"', () => {
    const fri = okValue(ask('parnasa.findPro', ctxAt(idt(2026, 10, 16, 14)), { text: 'אינסטלציה', openNow: true }));
    expect(fri.pros.map((p) => p.id)).toEqual(['pl102']);
    expect(fri.openTotal).toBe(1);
    const all = okValue(ask('parnasa.findPro', ctxAt(idt(2026, 10, 16, 14)), { text: 'אינסטלציה' }));
    expect(all.pros.find((p) => p.id === 'pl101')).toMatchObject({ open: false, status: 'סגור עכשיו · חוזר ביום ראשון ב־08:00' });
    const sat = okValue(ask('parnasa.findPro', ctxAt(idt(2026, 10, 17, 10)), { text: 'אינסטלציה', openNow: true }));
    expect(sat.pros).toEqual([]);
    const satAll = okValue(ask('parnasa.findPro', ctxAt(idt(2026, 10, 17, 10)), { text: 'אינסטלציה' }));
    expect(satAll.pros[0].status.startsWith('חוזר במוצ״ש')).toBe(true);
  });

  it('תחום-ודאי קובע: "רואה חשבון" בלי רו״ח במדריך ⇒ אין תוצאה (לא "חשבון" של מלמד); limit; קוד כפול ⇒ אין קוד', () => {
    // כמו בקו (phoneLine.test): מלמד-גמרא נתפס במושג "לימוד" של "חשבון" — אבל התחום-הוודאי הוא "חשבונות ומס"
    const db = fixtureDb({ prListings: [...fixtureDb().prListings, L({ id: 'pe1', name: 'הרב קליין', title: 'מלמד ושיעורי גמרא', category: 'edu', phone: '050-0000201' })] });
    expect(okValue(ask('parnasa.findPro', ctxAt(NOW_MS, db), { text: 'רואה חשבון' })).pros).toEqual([]);
    expect(okValue(ask('parnasa.findPro', ctxAt(), { text: 'אינסטלציה', limit: 1 })).pros.length).toBe(1);
    const dup = fixtureDb({ prListings: [...fixtureDb().prListings, L({ id: 'pl199', dialCode: '101', name: 'אינסטלציה כפולה', title: 'נזילות', category: 'elec', phone: '050-0000199' })] });
    const v = okValue(ask('parnasa.findPro', ctxAt(NOW_MS, dup), { text: 'נזילה', limit: 12 }));
    for (const p of v.pros.filter((x) => x.id === 'pl101' || x.id === 'pl199')) expect(p.dialCode, p.id + ' — קוד כפול, הקו לא עונה לו').toBe('');
  });

  it('מספר בתוך משפט (מספר-דירה, כמות) לא "מוצא" עסק לפי שבר-טלפון — רק טלפון שלם', () => {
    expect(okValue(ask('parnasa.findPro', ctxAt(), { text: 'מישהו עם 101' })).pros).toEqual([]);
    expect(okValue(ask('parnasa.findPro', ctxAt(), { text: 'המספר 050-0000111' })).pros[0]?.id).toBe('pl111');
  });

  it('🔗 אותו בעל-מקצוע שהקו מוצא: לכל משפט — הראשון של findPro = היעד של resolveSpeech', () => {
    const listings = [
      L({ id: 'q1', dialCode: '301', name: 'אינסטלציה זילברמן', title: 'נזילות, סתימות ודודים', category: 'elec', phone: '050-0000301', hours: WEEK_HOURS }),
      L({ id: 'q2', dialCode: '302', name: 'שרברב משה', title: 'אינסטלטור, ביוב וסתימות', category: 'elec', phone: '050-0000302', featuredUntil: '2026-12-31', hours: [{ dow: 1, from: '08:00', to: '10:00' }] }),
      L({ id: 'q3', dialCode: '303', name: 'חשמל אור', title: 'חשמלאי, קצרים ולוחות', category: 'elec', phone: '050-0000303', always: true }),
      L({ id: 'q4', dialCode: '304', name: 'ניקיון ברק', title: 'ניקיון דירות', category: 'home', phone: '050-0000304' }),
      L({ id: 'q5', dialCode: '305', name: 'הרב קליין', title: 'מלמד ושיעורי גמרא', category: 'edu', phone: '050-0000305' }),
    ];
    for (const nowMs of [NOW_MS, idt(2026, 10, 16, 14), idt(2026, 10, 18, 9)]) {
      const db = fixtureDb({ prListings: listings, prPosts: [] });
      const menu = buildPhoneMenu({ listings, posts: [], prefs: db.ui.parnasa, nowMs });
      const loc = resolveZmanimLoc();
      const clock = clockAt(nowMs, loc.tz);
      const sctx = { todayIso: clock.iso, clock, closureAt: makeClosureFn(loc) };
      for (const u of ['אינסטלטור', 'יש לי נזילה בכיור', 'קצר בחשמל', 'צריך ניקיון לדירה', 'רואה חשבון', 'מלמד לגמרא', 'סתימה בביוב', 'מישהו עם 304', 'המספר 050-0000305']) {
        const line = resolveSpeech(menu, 'main', u, listings, sctx);
        const pro = okValue(ask('parnasa.findPro', ctxAt(nowMs, db), { text: u })).pros[0];
        if (line.found) expect('biz/' + encodeURIComponent(pro?.id ?? '∅'), u + ' @' + clock.iso + ' ' + clock.hhmm).toBe(line.target);
        else expect(pro, u + ' — הקו לא מצא, גם האירוח לא').toBeUndefined();
      }
    }
  });
});

/* ═══════════════ parnasa.shabbat / minyanim / emergency ═══════════════ */

describe('🕯 parnasa.shabbat · 🙏 parnasa.minyanim · 🚑 parnasa.emergency', () => {
  it('השבת הקרובה (רביעי) = אותה שבת של לוח-הקהילה (shabbatOf); atIso של שישי/שבת ⇒ אותה שבת; ראשון ⇒ הבאה', () => {
    const v = okValue(ask('parnasa.shabbat', ctxAt(), {}));
    const loc = resolveZmanimLoc();
    const board = shabbatOf(clockAt(NOW_MS, loc.tz), loc);
    expect(v).toMatchObject({ friIso: '2026-10-16', satIso: '2026-10-17', candle: board.candle, end: board.end, rabbeinuTam: board.rabbeinuTam, current: false, loc: 'לפי אופק בני ברק' });
    expect(v.candle).toMatch(/^\d{2}:\d{2}$/);
    expect(okValue(ask('parnasa.shabbat', ctxAt(), { atIso: '2026-10-16' })).satIso).toBe('2026-10-17');
    expect(okValue(ask('parnasa.shabbat', ctxAt(), { atIso: '2026-10-17' })).satIso).toBe('2026-10-17');
    expect(okValue(ask('parnasa.shabbat', ctxAt(), { atIso: '2026-10-18' })).satIso).toBe('2026-10-24');
    expect(okValue(ask('parnasa.shabbat', ctxAt(), { atIso: 'לא-תאריך' })).satIso, 'קלט פגום ⇒ לפי הרגע').toBe('2026-10-17');
    expect(okValue(ask('parnasa.shabbat', ctxAt(idt(2026, 10, 17, 10)), {})).current).toBe(true);
  });

  it('מניינים: שישי+שבת לפי בית-כנסת עם כתובת, ימי-תוקף נאכפים, לא-מאושר לא נקרא; "הבא" רק היום ומהרגע', () => {
    const db = fixtureDb({ prPosts: [...fixtureDb().prPosts, P({ id: 'pm9', kind: 'minyan', title: 'מניין לא מאושר', approved: false, prayers: [{ prayer: 'מנחה', times: ['13:00'] }] })] });
    const v = okValue(ask('parnasa.minyanim', ctxAt(NOW_MS, db), { fromIso: '2026-10-16', days: 2 }));
    expect(v.minyanim.map((m) => m.dayName + ' ' + m.prayer + ' ' + m.time + ' ' + m.shul)).toContain('שבת שחרית 08:30 שטיבלך');
    expect(v.minyanim.every((m) => m.shul !== 'מניין לא מאושר')).toBe(true);
    expect(v.minyanim.find((m) => m.shul === 'בית המדרש הגדול')!.place).toBe('רח׳ רבי עקיבא 10');
    expect(v.next, 'הטווח לא כולל את היום').toBeNull();
    const today = okValue(ask('parnasa.minyanim', ctxAt(), {}));
    expect(today.minyanim.map((m) => m.shul), 'השטיבלך רק בשישי-שבת').not.toContain('שטיבלך');
    expect(today.next).toMatchObject({ prayer: 'מנחה', shul: 'בית המדרש הגדול' });
  });

  it('מספרי-חירום: ברירות-המחדל; מודעת-חירום מאושרת מחליפה', () => {
    expect(okValue(ask('parnasa.emergency', ctxAt(), {})).numbers.map((n) => n.phone)).toEqual(['101', '1221', '100', '102']);
    const db = fixtureDb({ prPosts: [P({ id: 'pe', kind: 'emergency', title: 'הצלה שכונתית', phone: '03-5555555', text: '24/7' })] });
    expect(okValue(ask('parnasa.emergency', ctxAt(NOW_MS, db), {})).numbers).toEqual([{ label: 'הצלה שכונתית', phone: '03-5555555', note: '24/7' }]);
  });
});

/* ═══════════════ hosting.availability ═══════════════ */

describe('🏠 hosting.availability — יש יחידה פנויה?', () => {
  it('הלילה: צימר הגפן פנוי; בית ההארחה — חדר אחד (3 מיטות); דירת הנחל תפוסה (מגיעים היום)', () => {
    const v = okValue(ask('hosting.availability', ctxAt(), {}));
    expect(v).toMatchObject({ fromIso: '2026-10-14', toIso: '2026-10-15', nights: 1, units: 3, bizName: 'צימרי הגליל' });
    expect(v.free).toEqual([
      { id: 'hu1', name: 'צימר הגפן', type: 'צימר', cap: 4, rooms: 0, freeRooms: 0, freeBeds: 0 },
      { id: 'hu2', name: 'בית ההארחה', type: 'בית הארחה', cap: 10, rooms: 2, freeRooms: 1, freeBeds: 3 },
    ]);
  });

  it('ליל-שבת: הגפן תפוס (לוי), בית ההארחה פנוי כולו, הנחל פנוי (מלוכלכת ≠ חסומה)', () => {
    expect(okValue(ask('hosting.availability', ctxAt(), { fromIso: '2026-10-16' })).free.map((u) => u.id + ':' + u.freeRooms)).toEqual(['hu2:2', 'hu3:0']);
  });

  it('F1 חסומה לא פנויה; F8 אורח שעבר את מועד-העזיבה ועוד לא יצא מחזיק את היחידה הלילה (לא בעתיד)', () => {
    const blocked = fixtureDb({ hostUnits: fixtureDb().hostUnits.map((u) => (u.id === 'hu1' ? { ...u, status: 'blocked' as const } : u)) });
    expect(okValue(ask('hosting.availability', ctxAt(NOW_MS, blocked), {})).free.map((u) => u.id)).toEqual(['hu2']);
    const overdue: HostBooking = B({ id: 'hbx', guestId: 'hg2', unitId: 'hu1', checkIn: '2026-10-10', checkOut: '2026-10-13', status: 'in' });
    const late = fixtureDb({ hostBookings: [...fixtureDb().hostBookings, overdue] });
    expect(okValue(ask('hosting.availability', ctxAt(NOW_MS, late), {})).free.map((u) => u.id)).toEqual(['hu2']);
    expect(okValue(ask('hosting.availability', ctxAt(NOW_MS, late), { fromIso: '2026-10-20' })).free.map((u) => u.id)).toContain('hu1');
  });

  it('🛡 בלי מחירים ובלי אורחים בפלט; בלי יחידות ⇒ ריק', () => {
    const json = JSON.stringify(okValue(ask('hosting.availability', ctxAt(), { fromIso: '2026-10-16', nights: 2 })));
    expect(json).not.toMatch(/"rate"|₪|משפחת|050-/);
    expect(okValue(ask('hosting.availability', ctxAt(NOW_MS, fixtureDb({ hostUnits: [U({ id: 'only', status: 'blocked' })] })), {})).free).toEqual([]);
  });
});

/* ═══════════════ hosting.today ═══════════════ */

describe('🏡 hosting.today — ספירות-היום', () => {
  it('הגעה אחת · אפס עזיבות · אחד בשהייה · יחידה לניקיון · 2 פתוחות (1 חירום) · "מזגן לא מקרר" טופל היום', () => {
    expect(okValue(ask('hosting.today', ctxAt(), {}))).toEqual({
      todayIso: '2026-10-14',
      arrivals: 1,
      lateArrivals: 0,
      departures: 0,
      overdueDepartures: 0,
      inHouse: 1,
      dirty: 1,
      openFaults: 2,
      urgentFaults: 1,
      handled: [{ desc: 'מזגן לא מקרר', unit: 'בית ההארחה' }],
      unitsWord: 'יחידות',
    });
  });

  it('תת-דגלים כבויים ⇒ השדות שלהם null (לא "0" מטעה); "טופל היום" לפי שעון-הארגון', () => {
    const v = okValue(ask('hosting.today', ctxAt(NOW_MS, fixtureDb(), cfgWith({ hosting: true }, { 'hosting.maint': false, 'hosting.housekeeping': false })), {}));
    expect(v).toMatchObject({ dirty: null, openFaults: null, urgentFaults: null, handled: null });
    // 23:30Z ב-13.10 = 02:30 ב-14.10 בישראל ⇒ "היום"
    const db = fixtureDb({ hostRecords: fixtureDb().hostRecords.map((r) => (r.id === 'hf2' ? { ...r, updatedAt: '2026-10-13T23:30:00.000Z' } : r)) });
    expect(okValue(ask('hosting.today', ctxAt(NOW_MS, db), {})).handled).toEqual([{ desc: 'מזגן לא מקרר', unit: 'בית ההארחה' }]);
  });
});
