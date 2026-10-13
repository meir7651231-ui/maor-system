/**
 * ratchet — 🧰 ארגז-המנועים · "נסה לפני שמחברים" (impact/index.ts — תיקייה, כדי לא לשנות את רשימת-הקבצים הנעולה
 *   ב-enginebox.test (ז); `from './impact'` נפתר אליה בלי שינוי).
 *
 * ננעל:
 *  (א) כל 11 חיבורי ברירת-המחדל: ספירה נכונה מנתוני-אמת, משפט עברי עם המספר, דוגמאות.
 *  (ב) גבולות-חלון: הזמנה שהסתיימה לפני 31 יום לא נספרת; לילה שנפל לפני תחילת החלון לא נספר.
 *  (ג) זיהוי-שבת בשעון-ישראל — גם כשהתאריך ב-UTC עוד "אתמול", וגם בחלון שחוצה את סוף שעון-הקיץ.
 *  (ד) אין נתונים ⇒ null · כלי כבוי ⇒ null · מפתח זר/זבל ⇒ null ולא זורק.
 *  (ה) `ask` נוכח ונעדר: מדדים שתלויים בנותן שותקים בלעדיו; האחרים מוותרים רק על הדוגמאות מהנותן.
 *  (ו) דטרמיניזם וחסם-ביצועים (5,000 הזמנות בפחות מ-50ms).
 *  (ז) הגנת-מקור: טהור (בלי Date.now/store/React/DOM), בידוד (בלי כסף/קבלות), ושום קובץ באפליקציה עוד לא מייבא אותו.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { emptyDb, type Db, type HostBooking } from '../../../types/domain';
import { abilities as hostingAbilities } from '../../../components/hosting/abilities';
import { abilities as parnasaAbilities } from '../../../components/parnasa/abilities';
import { ask, installProvider } from '../../switchboard/registry';
import { B, C, cfgWith, F, PR_LISTINGS, PR_POSTS, U } from '../../switchboard/__tests__/fixture';
import { DEFAULT_LINKS, linkKey } from '../links';
import { IMPACT_MEASURES, impactKey, impactOf, impactsFor, type ImpactCtx } from '../impact'; // = ../impact/index.ts

/** "היום" = רביעי 14.10.2026, 12:00 בישראל. חלון 30 יום = 15.9–14.10; ימי-השישי בו: 18.9 · 25.9 · 2.10 · 9.10. */
const NOW_MS = Date.parse('2026-10-14T09:00:00Z');
const ON = cfgWith({ parnasa: true, hosting: true });

const K = {
  stayShabbat: linkKey('pr.zmanim', 'times.shabbat', 'host.stay'),
  tabShabbat: linkKey('pr.zmanim', 'times.shabbat', 'host.shabbat'),
  stayPrayers: linkKey('pr.board', 'times.prayers', 'host.stay'),
  tabPrayers: linkKey('pr.board', 'times.prayers', 'host.shabbat'),
  maintPro: linkKey('pr.directory', 'pro.match', 'host.maint'),
  cleanPro: linkKey('pr.directory', 'pro.match', 'host.clean'),
  emergency: linkKey('pr.board', 'emergency', 'host.maint'),
  phone: linkKey('host.units', 'availability', 'pr.phone'),
  dashZmanim: linkKey('pr.zmanim', 'day.summary', 'host.dash'),
  dashBoard: linkKey('pr.board', 'day.summary', 'host.dash'),
  care: linkKey('host.dash', 'day.summary', 'pr.care'),
} as const;

const BOOKINGS: HostBooking[] = [
  B({ id: 'b1', unitId: 'hu1', checkIn: '2026-09-18', checkOut: '2026-09-20' }), // ליל-שבת 18.9 ✔
  B({ id: 'b2', unitId: 'hu1', checkIn: '2026-10-09', checkOut: '2026-10-11', status: 'in' }), // 9.10 ✔
  B({ id: 'b3', unitId: 'hu3', checkIn: '2026-10-01', checkOut: '2026-10-04', status: 'done' }), // הושלמה — 2.10 ✔
  B({ id: 'b4', unitId: 'hu1', checkIn: '2026-09-21', checkOut: '2026-09-23' }), // אמצע-שבוע ✘
  B({ id: 'b5', unitId: 'hu3', checkIn: '2026-09-11', checkOut: '2026-09-13' }), // הסתיימה לפני 31 יום ✘
  B({ id: 'b6', unitId: 'hu3', checkIn: '2026-09-11', checkOut: '2026-09-16' }), // שישי 11.9 לפני החלון; הלילה בחלון — 15.9 ✘
  B({ id: 'b7', unitId: 'hu1', checkIn: '2026-09-25', checkOut: '2026-09-27', status: 'cancelled' }), // בוטלה ✘
  B({ id: 'b8', unitId: 'hu1', checkIn: '2026-10-16', checkOut: '2026-10-18' }), // עתידית ✘
];

const RECORDS = [
  F({ id: 'f1', unitId: 'hu1', category: 'אינסטלציה', priority: 2, desc: 'נזילה בכיור', createdAt: '2026-10-10T08:00:00.000Z' }),
  F({ id: 'f2', unitId: 'hu1', category: 'גז', priority: 0, desc: 'ריח גז במטבח', safety: true, status: 'done', createdAt: '2026-10-12T08:00:00.000Z', updatedAt: '2026-10-12T10:00:00.000Z' }),
  F({ id: 'f3', unitId: 'hu3', category: 'אחר', priority: 3, desc: 'מדף רופף', safety: true, createdAt: '2026-09-01T08:00:00.000Z' }), // לפני החלון
  C({ id: 'c1', unitId: 'hu3', type: 'ניקיון אחרי עזיבה', date: '2026-10-04' }),
  C({ id: 'c2', unitId: 'hu1', type: 'החלפת מצעים', date: '2026-09-02' }), // לפני החלון
];

function db(over: Partial<Db> = {}): Db {
  const e = emptyDb();
  return {
    ...e,
    hostUnits: [U({ id: 'hu1', name: 'צימר הגפן' }), U({ id: 'hu3', name: 'דירת הנחל', type: 'דירה' })],
    hostBookings: BOOKINGS,
    hostRecords: RECORDS as Db['hostRecords'],
    prListings: PR_LISTINGS,
    prPosts: PR_POSTS,
    ...over,
  };
}

const ctxOf = (over: Partial<ImpactCtx> = {}): ImpactCtx => ({ db: db(), config: ON, nowMs: NOW_MS, ...over });
const withAsk = (over: Partial<ImpactCtx> = {}): ImpactCtx => ctxOf({ ask, ...over });

beforeAll(() => {
  installProvider('hosting', hostingAbilities);
  installProvider('parnasa', parnasaAbilities);
});

/* ═══════════════ (א) כל 11 החיבורים ═══════════════ */

describe('(א) כל 11 חיבורי ברירת-המחדל', () => {
  it('לכל חיבור ברירת-מחדל יש מדד ברישום', () => {
    for (const k of DEFAULT_LINKS) {
      const [, plug, needer] = k.split('>');
      expect(IMPACT_MEASURES[impactKey(needer!, plug!)], k).toBeTypeOf('function');
    }
    expect(Object.keys(K).length).toBe(11);
    expect(new Set(Object.values(K))).toEqual(new Set(DEFAULT_LINKS));
  });

  it('עם ask ונתונים — כל 11 מחזירים משפט עם המספר', () => {
    const all = impactsFor(DEFAULT_LINKS, withAsk());
    expect(all.map((i) => i.key)).toEqual([...DEFAULT_LINKS]);
    for (const i of all) {
      expect(i.headline.startsWith('ב-30 הימים האחרונים '), i.key).toBe(true);
      expect(i.days).toBe(30);
      if (i.count > 1) expect(i.headline, i.key).toContain(String(i.count));
      expect(i.examples.length).toBeLessThanOrEqual(3);
    }
  });

  it('זמני-השבת ⇒ כרטיס-השהייה: 3 הזמנות עם שבת (כולל שהושלמה; בלי בוטלה/עתידית/מחוץ-לחלון)', () => {
    const im = impactOf(K.stayShabbat, ctxOf())!;
    expect(im.count).toBe(3);
    expect(im.headline).toBe('ב-30 הימים האחרונים היו 3 הזמנות עם שבת. כל אחת מהן הייתה מקבלת בכרטיס ההזמנה את זמני השבת של אותה שבת (הדלקת נרות, צאת השבת ור״ת).');
    expect(im.examples[0]).toBe('צימר הגפן · שבת 10/10'); // החדשה קודם; בלי ask — בלי שעות
    const withTimes = impactOf(K.stayShabbat, withAsk())!;
    expect(withTimes.count).toBe(3);
    expect(withTimes.examples[0]).toMatch(/^צימר הגפן · שבת 10\/10 · הדלקת נרות \d\d:\d\d, צאת השבת \d\d:\d\d$/);
  });

  it('הזמנה אחת — לשון יחיד', () => {
    const im = impactOf(K.stayShabbat, ctxOf({ db: db({ hostBookings: [BOOKINGS[0]!] }) }))!;
    expect(im.headline).toBe('ב-30 הימים האחרונים הייתה הזמנה אחת עם שבת. היא הייתה מקבלת בכרטיס ההזמנה את זמני השבת של אותה שבת (הדלקת נרות, צאת השבת ור״ת).');
  });

  it('זמני-השבת ⇒ לשונית-השבת: 3 שבתות עם אורחים', () => {
    const im = impactOf(K.tabShabbat, withAsk())!;
    expect(im.count).toBe(3);
    expect(im.headline).toContain('היו 3 שבתות עם אורחים');
    expect(im.examples[0]).toMatch(/^שבת 10\/10 · הזמנה אחת · הדלקת נרות \d\d:\d\d$/);
  });

  it('המניינים ⇒ כרטיס-השהייה ולשונית-השבת: לפי מה שהלוח מחזיר', () => {
    const stay = impactOf(K.stayPrayers, withAsk())!;
    expect(stay.count).toBe(3);
    expect(stay.headline).toContain('היו 3 הזמנות עם שבת שבלוח הקהילה היו לה מניינים');
    expect(stay.examples[0]).toMatch(/^צימר הגפן · שבת 10\/10 · \d+ מניינים ב-2 בתי כנסת$/);
    const tab = impactOf(K.tabPrayers, withAsk())!;
    expect(tab.count).toBe(3);
    expect(tab.headline).toContain('📤 שליחה למשפחה');
    // בלוח אין מניינים ⇒ 0 (יש נתוני-אירוח — אומרים בכנות שלא היה משנה)
    const empty = impactOf(K.stayPrayers, withAsk({ db: db({ prPosts: [] }) }))!;
    expect(empty.count).toBe(0);
    expect(empty.headline).toContain('לא הייתה אף הזמנה');
  });

  it('המדריך ⇒ תחזוקה: 2 קריאות שנפתחו בחלון; עם ask — מי מתאים', () => {
    const bare = impactOf(K.maintPro, ctxOf())!;
    expect(bare.count).toBe(2);
    expect(bare.headline).toBe('ב-30 הימים האחרונים נפתחו 2 קריאות תחזוקה. בכל אחת מהן היה כפתור "🔧 מצא בעל מקצוע" מהמדריך.');
    expect(bare.examples).toEqual(['12/10 · ריח גז במטבח', '10/10 · נזילה בכיור']);
    const im = impactOf(K.maintPro, withAsk())!;
    expect(im.count).toBe(2);
    expect(im.headline).toContain('לפי המדריך היום');
    expect(im.examples.some((e) => e.includes('נזילה בכיור ← אינסטלציה זילברמן'))).toBe(true);
  });

  it('המדריך ⇒ ניקיון: משימה אחת בחלון, ולפי המדריך — ניקיון ברק', () => {
    const im = impactOf(K.cleanPro, withAsk())!;
    expect(im.count).toBe(1);
    expect(im.headline).toContain('נפתחה משימת ניקיון אחת');
    expect(im.headline).toContain('יש לה בעל מקצוע מתאים');
    expect(im.examples[0]).toBe('4/10 · ניקיון אחרי עזיבה · דירת הנחל ← ניקיון ברק');
  });

  it('מספרי-החירום ⇒ תחזוקה: רק דחופות (P0/P1 או בטיחות) בחלון', () => {
    const im = impactOf(K.emergency, withAsk())!;
    expect(im.count).toBe(1); // f2; f3 בטיחותית אבל לפני החלון; f1 P2
    expect(im.headline).toContain('נפתחה קריאה דחופה אחת');
    expect(im.examples.at(-1)).toMatch(/^המספרים: /);
    // בלי המדריך — חלון בעל-המקצוע לא נפתח ⇒ אין מה לומר
    expect(impactOf(K.emergency, withAsk({ config: cfgWith({ parnasa: true, hosting: true }, { 'parnasa.directory': false }) }))).toBeNull();
  });

  it('מקום-פנוי ⇒ הקו: לילות עם יחידה פנויה (הושלמה תפסה את לילותיה)', () => {
    // יחידה אחת, תפוסה 20.9–25.9 (5 לילות) ⇒ 25 לילות פנויים
    const one = db({ hostUnits: [U({ id: 'hu1', name: 'צימר הגפן' })], hostBookings: [B({ id: 'x', unitId: 'hu1', checkIn: '2026-09-20', checkOut: '2026-09-25', status: 'done' })] });
    const im = impactOf(K.phone, ctxOf({ db: one }))!;
    expect(im.count).toBe(25);
    expect(im.headline).toContain('היו 25 לילות שבהם לפחות אחת מהיחידות הייתה פנויה');
    // יחידה עם חדרים: חדר אחד תפוס ⇒ עדיין פנויה; שני החדרים ⇒ תפוסה
    const rooms = [{ id: 'r1', name: 'א', beds: 2, rate: 1 }, { id: 'r2', name: 'ב', beds: 2, rate: 1 }];
    const roomed = db({
      hostUnits: [U({ id: 'h', subRooms: rooms })],
      hostBookings: [B({ id: 'p', unitId: 'h', roomIds: ['r1'], checkIn: '2026-09-15', checkOut: '2026-10-15' }), B({ id: 'q', unitId: 'h', roomIds: ['r2'], checkIn: '2026-10-01', checkOut: '2026-10-11' })],
    });
    expect(impactOf(K.phone, ctxOf({ db: roomed }))!.count).toBe(20);
    // עם ask — דוגמה: מה הקו היה אומר הלילה
    expect(impactOf(K.phone, withAsk({ db: one }))!.examples[0]).toMatch(/^הלילה הקו היה אומר: /);
  });

  it('שורת-השבת ⇒ תקציר-היום: כל יום שהלוח החזיר זמנים; בלי ask ⇒ null', () => {
    const im = impactOf(K.dashZmanim, withAsk())!;
    expect(im.count).toBe(30);
    expect(im.headline).toContain('שורת שבת');
    expect(impactOf(K.dashZmanim, ctxOf())).toBeNull();
  });

  it('שורת-המניין ⇒ תקציר-היום: ימים עם מניין בלוח; בלי ask ⇒ null; בלי מניינים ⇒ 0', () => {
    expect(impactOf(K.dashBoard, withAsk())!.count).toBe(30); // בית המדרש הגדול — כל יום
    expect(impactOf(K.dashBoard, ctxOf())).toBeNull();
    expect(impactOf(K.dashBoard, withAsk({ db: db({ prPosts: [] }) }))!.count).toBe(0);
  });

  it('שורות-האירוח ⇒ תקציר-היום בלשונית-האישורים: ימים עם תוכן אמיתי', () => {
    const im = impactOf(K.care, ctxOf())!;
    // b1 18–20.9 (3) · b4 21–23.9 (3) · b3 1–4.10 (4) · b2 9–11.10 (3; 11.10 עזיבה) · b6 בשהייה 15.9 + עזיבה 16.9 (2) · f2 טופלה 12.10 (1) = 16
    expect(im.count).toBe(16);
    expect(im.headline).toContain('היו 16 ימים עם הגעות, עזיבות או אורחים בשהייה (או קריאה שטופלה)');
    expect(im.examples[0]).toBe('12/10 · קריאה שטופלה');
    expect(im.examples[1]).toBe('11/10 · עזיבה אחת');
  });
});

/* ═══════════════ (ב)+(ג) חלון ושעון ═══════════════ */

describe('(ב) גבולות-חלון · (ג) שעון-ישראל', () => {
  it('הזמנה שהסתיימה לפני 31 יום לא נספרת; ב-60 יום — כן', () => {
    const only = ctxOf({ db: db({ hostBookings: [B({ id: 'old', unitId: 'hu1', checkIn: '2026-09-11', checkOut: '2026-09-13' })] }) });
    expect(impactOf(K.stayShabbat, only)!.count).toBe(0);
    const sixty = impactOf(K.stayShabbat, only, 60)!;
    expect(sixty.count).toBe(1);
    expect(sixty.headline.startsWith('ב-60 הימים האחרונים ')).toBe(true);
  });

  it('days מחוטא: זבל ⇒ 30, 0 ⇒ 1 ("היום"), ענק ⇒ 366', () => {
    expect(impactOf(K.stayShabbat, ctxOf(), Number.NaN)!.days).toBe(30);
    const d1 = impactOf(K.stayShabbat, ctxOf(), 0)!;
    expect(d1.days).toBe(1);
    expect(d1.headline.startsWith('היום ')).toBe(true);
    expect(impactOf(K.stayShabbat, ctxOf(), 10_000)!.days).toBe(366);
  });

  it('שישי בישראל כשב-UTC עוד חמישי: הלילה נספר', () => {
    // 15.10 21:30Z = שישי 16.10 00:30 בישראל
    const c = ctxOf({ nowMs: Date.parse('2026-10-15T21:30:00Z'), db: db({ hostBookings: [B({ id: 'x', unitId: 'hu1', checkIn: '2026-10-16', checkOut: '2026-10-18' })] }) });
    expect(impactOf(K.stayShabbat, c, 1)!.count).toBe(1);
    expect(impactOf(K.tabShabbat, c, 1)!.count).toBe(1);
  });

  it('חלון שחוצה את סוף שעון-הקיץ (25.10.2026): שתי השבתות נספרות, ושבת אחרי החלון לא', () => {
    const c = ctxOf({
      nowMs: Date.parse('2026-11-01T09:00:00Z'),
      db: db({
        hostBookings: [
          B({ id: 'a', unitId: 'hu1', checkIn: '2026-10-23', checkOut: '2026-10-25' }),
          B({ id: 'b', unitId: 'hu1', checkIn: '2026-10-30', checkOut: '2026-11-01' }),
          B({ id: 'c', unitId: 'hu3', checkIn: '2026-11-06', checkOut: '2026-11-08' }),
        ],
      }),
    });
    expect(impactOf(K.stayShabbat, c, 14)!.count).toBe(2);
    expect(impactOf(K.tabShabbat, c, 14)!.count).toBe(2);
    // מוצאי-שבת אחרי חצות בשעון-חורף: 31.10 22:30Z = ראשון 1.11 00:30 ⇒ חלון של יום אחד = ראשון ⇒ 0
    const late = { ...c, nowMs: Date.parse('2026-10-31T22:30:00Z') };
    expect(impactOf(K.stayShabbat, late, 1)!.count).toBe(0);
    expect(impactOf(K.stayShabbat, late, 3)!.count).toBe(1);
  });
});

/* ═══════════════ (ד) null ═══════════════ */

describe('(ד) אין מה לומר ⇒ null, ולעולם לא זורק', () => {
  it('DB ריק ⇒ null לכל 11', () => {
    expect(impactsFor(DEFAULT_LINKS, withAsk({ db: emptyDb() }))).toEqual([]);
  });

  it('כלי כבוי ⇒ null', () => {
    expect(impactsFor(DEFAULT_LINKS, withAsk({ config: cfgWith({ hosting: true }) }))).toEqual([]);
    expect(impactsFor(DEFAULT_LINKS, withAsk({ config: cfgWith({ parnasa: true }) }))).toEqual([]);
    // תת-דגל של המקבל כבוי (hosting.shabbat) ⇒ שני מקבלי-השבת שותקים, השאר עונים
    const r = impactsFor(DEFAULT_LINKS, withAsk({ config: cfgWith({ parnasa: true, hosting: true }, { 'hosting.shabbat': false }) })).map((i) => i.key);
    expect(r).not.toContain(K.stayShabbat);
    expect(r).not.toContain(K.tabPrayers);
    expect(r).toContain(K.maintPro);
  });

  it('מפתח זר / לא-תקין / זבל ⇒ null בלי חריגה', () => {
    expect(impactOf('x>y>z', ctxOf())).toBeNull();
    expect(impactOf(linkKey('pr.zmanim', 'times.shabbat', 'pr.care'), ctxOf())).toBeNull();
    expect(impactOf(42 as never, ctxOf())).toBeNull();
    expect(impactOf(K.stayShabbat, null as never)).toBeNull();
    expect(impactOf(K.stayShabbat, ctxOf({ nowMs: Number.NaN }))).toBeNull();
    expect(impactOf(K.stayShabbat, ctxOf({ db: { ...db(), hostBookings: 'זבל' as never } }))).toBeNull();
    expect(impactsFor('זבל' as never, ctxOf())).toEqual([]);
    expect(impactsFor([K.stayShabbat, K.stayShabbat, 7 as never], ctxOf()).length).toBe(1);
  });

  it('ask שזורק/שלא עונה ⇒ לא זורק; מדד-תלוי-נותן ⇒ null', () => {
    const throwing = (() => {
      throw new Error('boom');
    }) as never;
    expect(impactOf(K.stayShabbat, ctxOf({ ask: throwing }))).toBeNull();
    const loading = ((id: string) => ({ ok: false, unavailable: true, id, reason: 'loading', message: '' })) as never;
    expect(impactOf(K.stayPrayers, ctxOf({ ask: loading }))).toBeNull();
    expect(impactOf(K.dashZmanim, ctxOf({ ask: loading }))).toBeNull();
    // מדד שלא תלוי בנותן — עונה, רק בלי דוגמאות-מהנותן
    expect(impactOf(K.stayShabbat, ctxOf({ ask: loading }))!.examples[0]).toBe('צימר הגפן · שבת 10/10');
    expect(impactOf(K.maintPro, ctxOf({ ask: loading }))!.headline).not.toContain('לפי המדריך');
  });
});

/* ═══════════════ (ה) ask נוכח/נעדר ═══════════════ */

describe('(ה) ask נוכח ונעדר', () => {
  it('בלי ask: 7 מדדים עונים מהנתונים; 4 תלויי-נותן (מניינים ×2, שורות-הלוח ×2) שותקים', () => {
    const keys = impactsFor(DEFAULT_LINKS, ctxOf()).map((i) => i.key);
    expect(keys.length).toBe(7);
    for (const k of [K.stayPrayers, K.tabPrayers, K.dashZmanim, K.dashBoard]) expect(keys).not.toContain(k);
  });
  it('ask לא משנה את הספירה של מדדי-הנתונים', () => {
    for (const k of [K.stayShabbat, K.tabShabbat, K.maintPro, K.cleanPro, K.emergency, K.phone, K.care]) {
      expect(impactOf(k, withAsk())!.count, k).toBe(impactOf(k, ctxOf())!.count);
    }
  });
});

/* ═══════════════ (ו) דטרמיניזם וביצועים ═══════════════ */

function bigDb(nBookings: number): Db {
  const units = Array.from({ length: 40 }, (_, i) => U({ id: 'u' + i, name: 'יחידה ' + i }));
  const bookings: HostBooking[] = [];
  for (let i = 0; i < nBookings; i++) {
    const start = Date.UTC(2026, 6, 1) + (i % 120) * 86_400_000;
    const ci = new Date(start).toISOString().slice(0, 10);
    const co = new Date(start + (1 + (i % 4)) * 86_400_000).toISOString().slice(0, 10);
    bookings.push(B({ id: 'b' + i, unitId: 'u' + (i % 40), checkIn: ci, checkOut: co, status: i % 9 === 0 ? 'cancelled' : 'confirmed' }));
  }
  const faults = Array.from({ length: 2000 }, (_, i) => F({ id: 'f' + i, desc: i % 2 ? 'נזילה בכיור' : 'מזגן לא מקרר', priority: i % 5, createdAt: new Date(Date.UTC(2026, 8, 1) + (i % 45) * 86_400_000).toISOString() }));
  return db({ hostUnits: units, hostBookings: bookings, hostRecords: faults as Db['hostRecords'] });
}

describe('(ו) דטרמיניזם וביצועים', () => {
  it('אותו קלט ⇒ אותו פלט (גם עם ask)', () => {
    expect(impactsFor(DEFAULT_LINKS, withAsk())).toEqual(impactsFor(DEFAULT_LINKS, withAsk()));
    expect(impactsFor(DEFAULT_LINKS, ctxOf())).toEqual(impactsFor(DEFAULT_LINKS, ctxOf()));
  });

  it('5,000 הזמנות: כל מדד בפחות מ-50ms', () => {
    const big = bigDb(5000);
    for (const k of DEFAULT_LINKS) {
      for (const c of [ctxOf({ db: big }), withAsk({ db: big })]) {
        impactOf(k, c); // חימום
        const t0 = performance.now();
        const im = impactOf(k, c);
        const ms = performance.now() - t0;
        expect(ms, k + (c.ask ? ' +ask' : '')).toBeLessThan(50);
        if (!c.ask && [K.stayShabbat, K.tabShabbat, K.phone, K.care].includes(k as never)) expect(im!.count, k).toBeGreaterThan(0);
      }
    }
  });
});

/* ═══════════════ (ז) הגנות-מקור ═══════════════ */

describe('(ז) הגנות-מקור', () => {
  const SRC = readFileSync(resolve(__dirname, '../impact/index.ts'), 'utf8');
  const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('טהור: בלי Date.now / new Date() / store / React / DOM / רשת', () => {
    expect(code).not.toMatch(/Date\.now|new Date\(|Math\.random|useApp|from 'react'|document\.|window\.|fetch\(|localStorage/);
  });

  it('בידוד: בלי כסף/קבלות, ובלי כתיבה (רק ask לקריאה)', () => {
    expect(code).not.toMatch(/donation|receipt|payment|charges|bookingTotal|bookingPaid|setDb|setState/i);
  });

  // שינוי-נעילה מכוון (FINAL 13.10): המנוע חווט — רק הכניסה העצלה של הארגז (EngineBoxEntry, chunk משלה) מייבאת אותו;
  // שום קובץ אחר באפליקציה (ובפרט App/store/persist — הבנדל-הראשי) לא.
  it('רק הכניסה העצלה של הארגז מייבאת אותו (הלקוח-החי לא זז)', () => {
    const root = resolve(__dirname, '../../..');
    const hits: string[] = [];
    const walk = (dir: string): void => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) {
          if (f !== '__tests__' && f !== 'node_modules') walk(p);
        } else if (/\.(ts|tsx)$/.test(f) && /enginebox\/impact['"]|from '\.\/impact'/.test(readFileSync(p, 'utf8'))) hits.push(p);
      }
    };
    walk(root);
    expect(hits.map((h) => h.slice(root.length + 1).replace(/\\/g, '/'))).toEqual(['components/enginebox/EngineBoxEntry.tsx']);
  });
});
