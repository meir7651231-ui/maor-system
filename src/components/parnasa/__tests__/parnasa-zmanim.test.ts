/**
 * ratchet — לוח-הזמנים של פרנסה׳לע (אשכול 3, zmanimBoard.ts). דטרמיניסטי: תאריכים/ערים קבועים,
 * "עכשיו" מוזרק כ-epoch — בלי Date.now ובלי תלות בשעון-המכשיר. הערכים נעוצים מול מנוע-הזמנים
 * של הטלפוניה (golden-tested) ואומתו בחישוב-יד (בני ברק 15.10.2026: נץ 06:44, שקיעה 18:09 IDT).
 *
 * הבאגים שננעלים (מול המקור — BUILD-ORDER-PARNASA "תיקונים"):
 *   1. זמנים לפי שעון-המכשיר ⇒ כאן אזור-הזמן של הקהילה (Asia/Jerusalem), גם כשה-TZ של התהליך אחר.
 *   2. התאריך העברי לא התחלף בשקיעה ⇒ כאן מתחלף בשקיעה.
 *   3. הלוח העצמאי קפץ בשבת לשבת **הבאה** ⇒ כאן בשבת עצמה (עד צאת) — השבת **הנוכחית**.
 *   4. מקום/מניינים לא היו ניתנים לעריכה ⇒ resolveZmanimLoc מההגדרות + טוקנים יחסיים לזמנים.
 *   5. אין רשימת מספרי-חירום ⇒ ברירות-מחדל (מד״א 101 · הצלה 1221 · משטרה 100 · כיבוי 102) שהגבאי דורס.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  addDaysIso,
  buildZmanimBoard,
  clockAt,
  closureAt,
  dayZmanim,
  emergencyDrafts,
  emergencyNumbers,
  hebDateAt,
  hmToMin,
  minToHm,
  nextMinyan,
  PR_EMERGENCY_DEFAULTS,
  resolveMinyanim,
  resolveTimeToken,
  resolveZmanimLoc,
  shabbatOf,
  upcomingClosures,
  weekZmanim,
  dayTimes,
} from '../zmanimBoard';
import type { PrPost } from '../../../types/domain';
import srcZmanim from '../zmanimBoard.ts?raw';

const BB = resolveZmanimLoc(); // ברירת-המחדל: בני ברק
const at = (rows: ReturnType<typeof dayZmanim>) => Object.fromEntries(rows.map((r) => [r.key, r.time]));
/** epoch של שעה מקומית בישראל בקיץ-שעון (IDT = UTC+3) — אוקטובר 2026 לפני 25.10. */
const idt = (y: number, mo: number, d: number, h: number, mi = 0): number => Date.UTC(y, mo - 1, d, h - 3, mi);

function post(over: Partial<PrPost>): PrPost {
  return {
    id: 'prp1', kind: 'minyan', title: 'בית המדרש הגדול', text: '', place: 'רחוב החסידים 2', phone: '', noticeKind: '',
    prayers: [], days: [], date: '', time: '', until: '', approved: true, pinned: false,
    createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}

describe('📍 מיקום — resolveZmanimLoc', () => {
  it('ברירת-מחדל: בני ברק · הדלקה לפי מנהג-העיר (22) · צאת 40 · Asia/Jerusalem · לא-גולה', () => {
    expect(BB).toMatchObject({ cityKey: 'bneibrak', label: 'בני ברק', candleMin: 22, tzeisMin: 40, tz: 'Asia/Jerusalem', diaspora: false, elevation: 0 });
  });
  it('עיר נבחרת / דריסת דקות / נ"צ מותאם גובר / ערכים פגומים נופלים לברירה', () => {
    expect(resolveZmanimLoc({ city: 'jerusalem' })).toMatchObject({ cityKey: 'jerusalem', candleMin: 40, label: 'ירושלים' });
    expect(resolveZmanimLoc({ city: 'jerusalem', candleMin: 30, tzeisMin: 35, label: 'קריית צאנז' })).toMatchObject({ candleMin: 30, tzeisMin: 35, label: 'קריית צאנז' });
    expect(resolveZmanimLoc({ lat: 31.9, lon: 35.0, elevation: 300 })).toMatchObject({ cityKey: '', lat: 31.9, lon: 35.0, candleMin: 18, elevation: 300, label: 'מיקום מותאם' });
    expect(resolveZmanimLoc({ city: 'atlantis', tz: 'Mars/Olympus', lat: 200, lon: 35, candleMin: -4 })).toMatchObject({ cityKey: 'bneibrak', tz: 'Asia/Jerusalem', candleMin: 22 });
    expect(resolveZmanimLoc({ tz: 'America/New_York' }).diaspora).toBe(true);
  });
});

describe('🕰 שעון-הקהילה — לא שעון-המכשיר', () => {
  const origTz = process.env.TZ;
  afterEach(() => {
    if (origTz === undefined) delete process.env.TZ;
    else process.env.TZ = origTz;
  });

  it('epoch ⇒ שעון ישראל (קיץ +3 / חורף +2), כולל חציית-תאריך אחרי חצות', () => {
    expect(clockAt(Date.UTC(2026, 9, 14, 21, 30))).toMatchObject({ iso: '2026-10-15', hhmm: '00:30', dow: 4 });
    expect(clockAt(Date.UTC(2026, 11, 20, 10, 0))).toMatchObject({ iso: '2026-12-20', hhmm: '12:00', dow: 0 });
  });

  it('🛡 אותו פלט בדיוק כשאזור-הזמן של התהליך שונה (ניו-יורק / UTC)', () => {
    const ms = idt(2026, 10, 15, 18, 30);
    const snap = () => JSON.stringify([clockAt(ms), hebDateAt(clockAt(ms), BB), dayZmanim('2026-10-15', BB), shabbatOf(clockAt(ms), BB)]);
    const base = snap();
    process.env.TZ = 'America/New_York';
    expect(snap()).toBe(base);
    process.env.TZ = 'UTC';
    expect(snap()).toBe(base);
  });

  it('עזרי-זמן: hmToMin/minToHm/addDaysIso', () => {
    expect(hmToMin('6:05')).toBe(365);
    expect(hmToMin('24:00')).toBe(1440);
    expect(hmToMin('25:00')).toBeNull();
    expect(hmToMin('ab')).toBeNull();
    expect(minToHm(1445)).toBe('00:05');
    expect(minToHm(-10)).toBe('23:50');
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysIso('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('☀️ זמני היום (בני ברק)', () => {
  it('יום חול 15.10.2026 — 11 זמנים, ערכים נעוצים, סדר כרונולוגי', () => {
    const rows = dayZmanim('2026-10-15', BB);
    expect(at(rows)).toEqual({
      alot: '05:32', netz: '06:44', shmaMga: '08:59', shmaGra: '09:35', tefila: '10:32', chatzot: '12:27',
      minchaG: '12:56', minchaK: '15:47', plag: '16:58', shkia: '18:09', tzeis: '18:49',
    });
    const mins = rows.map((r) => hmToMin(r.time)!);
    expect([...mins].sort((a, b) => a - b)).toEqual(mins);
    expect(rows.find((r) => r.key === 'shmaMga')!.sub).toBe('מגן אברהם');
    expect(rows.find((r) => r.key === 'shmaGra')!.sub).toBe('גר״א');
  });

  it('ערב שבת — שורת הדלקת-נרות (שקיעה−22); שבת — "צאת השבת" (+40) ורבנו תם (+72)', () => {
    const fri = at(dayZmanim('2026-10-16', BB));
    expect(fri.candle).toBe('17:46');
    expect(fri.shkia).toBe('18:08');
    const satRows = dayZmanim('2026-10-17', BB);
    const sat = at(satRows);
    expect(sat.end).toBe('18:47');
    expect(sat.rt).toBe('19:19');
    expect(sat.tzeis).toBeUndefined(); // אין כפילות צאת/צאת-השבת
    expect(satRows.find((r) => r.key === 'end')!.label).toBe('צאת השבת');
  });

  it('ערב ראש-השנה (שישי 11.9.2026) — הדלקה; ביו״ט-ראשון שלמחרתו יו״ט — אין "הדלקה" לפני-השקיעה', () => {
    expect(at(dayZmanim('2026-09-11', BB)).candle).toBe('18:31');
    expect(dayZmanim('2026-09-11', BB).find((r) => r.key === 'candle')!.sub).toBe('ערב ראש השנה');
    // שבת 12.9 = ר״ה א׳, ראשון 13.9 = ר״ה ב׳ ⇒ בשבת לא מוצגת הדלקה לפני-שקיעה
    expect(dayZmanim('2026-09-12', BB).some((r) => r.key === 'candle')).toBe(false);
    expect(dayZmanim('2026-09-13', BB).find((r) => r.key === 'end')!.label).toBe('צאת החג');
  });

  it('🛡 התאריך העברי מתחלף בשקיעה (לא בחצות)', () => {
    const before = hebDateAt(clockAt(idt(2026, 10, 15, 16, 0)), BB);
    const after = hebDateAt(clockAt(idt(2026, 10, 15, 18, 30)), BB);
    expect(before).toMatchObject({ text: 'ד׳ חשוון תשפ״ז', night: false, anchorIso: '2026-10-15' });
    expect(after).toMatchObject({ text: 'ה׳ חשוון תשפ״ז', night: true, anchorIso: '2026-10-16' });
  });
});

describe('🕯 השבת לתצוגה — הנוכחית בשבת עצמה', () => {
  it('חמישי ⇒ השבת הקרובה (לא נוכחית) עם הדלקה/צאת/ר״ת', () => {
    expect(shabbatOf(clockAt(idt(2026, 10, 15, 12)), BB)).toMatchObject({
      friIso: '2026-10-16', satIso: '2026-10-17', candle: '17:46', end: '18:47', rabbeinuTam: '19:19', current: false, hebDate: 'ו׳ חשוון תשפ״ז',
    });
  });
  it('שישי אחרי ההדלקה ⇒ current', () => {
    expect(shabbatOf(clockAt(idt(2026, 10, 16, 18)), BB)).toMatchObject({ satIso: '2026-10-17', current: true });
  });
  it('🛡 שבת בבוקר ⇒ **השבת הזו** (באג-המקור: קפץ לשבוע הבא)', () => {
    expect(shabbatOf(clockAt(idt(2026, 10, 17, 10)), BB)).toMatchObject({ satIso: '2026-10-17', friIso: '2026-10-16', current: true });
  });
  it('מוצ״ש אחרי צאת ⇒ השבת הבאה', () => {
    expect(shabbatOf(clockAt(idt(2026, 10, 17, 19)), BB)).toMatchObject({ satIso: '2026-10-24', current: false, candle: '17:38', end: '18:39' });
  });
  it('שבת מברכים (כ״ז חשוון) ⇒ שם החודש הבא; שבת רגילה ⇒ ריק', () => {
    expect(shabbatOf(clockAt(idt(2026, 11, 7, 11)), BB).mevarchim).toBe('כסלו');
    expect(shabbatOf(clockAt(idt(2026, 10, 17, 10)), BB).mevarchim).toBe('');
  });
});

describe('🚪 סגירת שבת/יו״ט ברגע נתון', () => {
  it('יום כיפור (שני 21.9.2026): ביום — סגור; ערב אחרי ההדלקה — סגור; לפני — פתוח', () => {
    expect(closureAt('2026-09-21', '12:00', BB)).toMatchObject({ closed: true, reason: 'יום כיפור', kind: 'yomtov', endIso: '2026-09-21', motzei: 'מוצאי החג' });
    expect(closureAt('2026-09-20', '18:30', BB).closed).toBe(true);
    expect(closureAt('2026-09-20', '18:00', BB).closed).toBe(false);
  });
  it('רצף ר״ה שבת+ראשון: מוצ״ש בתוך החג — סגור עד צאת ראשון', () => {
    expect(closureAt('2026-09-12', '20:00', BB)).toMatchObject({ closed: true, reason: 'ראש השנה', endIso: '2026-09-13', endTime: '19:30' });
    expect(closureAt('2026-09-13', '20:00', BB).closed).toBe(false);
  });
  it('שבת רגילה: שישי 23:30 סגור · שבת 01:00 סגור · שבת אחרי צאת פתוח', () => {
    expect(closureAt('2026-10-16', '23:30', BB)).toMatchObject({ closed: true, reason: 'שבת', motzei: 'מוצ״ש', endTime: '18:47' });
    expect(closureAt('2026-10-17', '01:00', BB).closed).toBe(true);
    expect(closureAt('2026-10-17', '18:50', BB).closed).toBe(false);
  });
  it('חלונות שטרם הסתיימו (מנוע-הטלפוניה) — כולל הנוכחי', () => {
    const wins = upcomingClosures(clockAt(idt(2026, 10, 17, 10)), BB);
    expect(wins[0]).toMatchObject({ startIso: '2026-10-16', endIso: '2026-10-17', reason: 'שבת' });
  });
});

describe('🗓 זמני השבוע (לחוברת)', () => {
  it('7 שורות מחמישי: שישי עם הדלקה, שבת עם צאת', () => {
    const rows = weekZmanim('2026-10-15', BB);
    expect(rows).toHaveLength(7);
    expect(rows.map((r) => r.dayName)).toEqual(['חמישי', 'שישי', 'שבת', 'ראשון', 'שני', 'שלישי', 'רביעי']);
    expect(rows[1]).toMatchObject({ iso: '2026-10-16', candle: '17:46', end: '' });
    expect(rows[2]).toMatchObject({ iso: '2026-10-17', candle: '', end: '18:47', tzeis: '18:47' });
    expect(rows[0]).toMatchObject({ sunrise: '06:44', shmaGra: '09:35', sunset: '18:09', hebDate: 'ד׳ חשוון תשפ״ז' });
  });
});

describe('🕍 מניינים יחסיים לזמנים', () => {
  const t = dayTimes('2026-10-15', BB);
  it('טוקנים: HH:MM · sh±N · tz±N · nz±N; פגום ⇒ ""', () => {
    expect(resolveTimeToken('6:45', t)).toBe('06:45');
    expect(resolveTimeToken('sh-15', t)).toBe('17:54');
    expect(resolveTimeToken('tz+0', t)).toBe('18:49');
    expect(resolveTimeToken('tz+10', t)).toBe('18:59');
    expect(resolveTimeToken('nz', t)).toBe('06:44');
    expect(resolveTimeToken('xx', t)).toBe('');
    expect(resolveTimeToken('24:00', t)).toBe('');
  });
  it('רק מודעות-מניין מאושרות ושטרם ירדו; ימי-תוקף; ממוין לפי שעה; המניין הבא', () => {
    const posts = [
      post({ id: 'a', prayers: [{ prayer: 'מנחה', times: ['sh-15', '13:30'] }, { prayer: 'מעריב', times: ['tz+0', '21:00', 'פגום'] }] }),
      post({ id: 'b', title: 'שטיבל', approved: false, prayers: [{ prayer: 'שחרית', times: ['06:00'] }] }),
      post({ id: 'c', title: 'קלויז', until: '2026-10-01', prayers: [{ prayer: 'שחרית', times: ['07:00'] }] }),
      post({ id: 'd', title: 'ותיקין', days: [4], prayers: [{ prayer: 'שחרית', times: ['nz'] }] }),
      post({ id: 'e', title: 'רק בשבת', days: [6], prayers: [{ prayer: 'שחרית', times: ['08:30'] }] }),
      post({ id: 'f', kind: 'notice', title: 'הודעה', prayers: [{ prayer: 'שחרית', times: ['05:00'] }] }),
    ];
    const list = resolveMinyanim(posts, '2026-10-15', BB); // חמישי
    expect(list.map((x) => x.time + ' ' + x.prayer)).toEqual(['06:44 שחרית', '13:30 מנחה', '17:54 מנחה', '18:49 מעריב', '21:00 מעריב']);
    expect(nextMinyan(list, clockAt(idt(2026, 10, 15, 17)))).toMatchObject({ time: '17:54', prayer: 'מנחה', shul: 'בית המדרש הגדול' });
    expect(nextMinyan(list, clockAt(idt(2026, 10, 15, 22)))).toBeNull();
  });
});

describe('🚑 מספרי חירום', () => {
  it('ברירות-מחדל: מד״א 101 · איחוד הצלה 1221 · משטרה 100 · כיבוי אש 102', () => {
    expect(emergencyNumbers([]).map((e) => e.label + ' ' + e.phone)).toEqual(['מד״א 101', 'איחוד הצלה 1221', 'משטרה 100', 'כיבוי אש 102']);
    expect(emergencyNumbers([])[0]).not.toBe(PR_EMERGENCY_DEFAULTS[0]); // עותק — הקבוע לא נחשף לשינוי
    expect(emergencyDrafts().map((d) => d.phone)).toEqual(['101', '1221', '100', '102']);
  });
  it('הגבאי עורך: מודעות-חירום מאושרות מחליפות את הרשימה (נעוצות ראשונות); לא-מאושרת/בלי טלפון — לא נספרת', () => {
    const posts = [
      post({ id: 'e1', kind: 'emergency', title: 'מוקד עירוני', phone: '106', createdAt: '2026-10-02T00:00:00.000Z' }),
      post({ id: 'e2', kind: 'emergency', title: 'הצלה שכונתי', phone: '052-0000000', pinned: true, createdAt: '2026-10-03T00:00:00.000Z' }),
      post({ id: 'e3', kind: 'emergency', title: 'לא מאושר', phone: '999', approved: false }),
      post({ id: 'e4', kind: 'emergency', title: 'בלי טלפון', phone: ' ' }),
    ];
    expect(emergencyNumbers(posts).map((e) => e.label)).toEqual(['הצלה שכונתי', 'מוקד עירוני']);
    expect(emergencyNumbers([posts[2]]).map((e) => e.phone)).toEqual(['101', '1221', '100', '102']);
  });
});

describe('🧯 קלט פגום — ריק במקום קריסה (מסך לא נופל על תאריך שנמחק בטופס)', () => {
  it('תאריך/רגע לא-תקינים לא זורקים', () => {
    const bad = { iso: '', hhmm: '10:00', dow: 3, ms: 0 };
    expect(dayZmanim('', BB).every((r) => r.time === '')).toBe(true);
    expect(clockAt(Number.NaN).iso).toBe('1970-01-01');
    expect(addDaysIso('לא-תאריך', 1)).toBe('');
    expect(addDaysIso('2026-02-30', 1)).toBe('2026-03-03'); // תאריך-לוח "גולש" — כמו Date.UTC (לא זורק)
    expect(shabbatOf(bad, BB)).toMatchObject({ satIso: '', current: false });
    expect(upcomingClosures(bad, BB)).toEqual([]);
    expect(weekZmanim('', BB, 2).map((r) => r.sunrise)).toEqual(['', '']);
    expect(hebDateAt(bad, BB).text).toBe('');
    expect(closureAt('', '10:00', BB).closed).toBe(false);
    expect(() => buildZmanimBoard(bad, BB, [])).not.toThrow();
  });
});

describe('🧱 הלוח כולו + טוהר', () => {
  it('buildZmanimBoard: הבא מסומן, עבר מעומעם, מקום+הערת-אמון, חירום', () => {
    const b = buildZmanimBoard(clockAt(idt(2026, 10, 15, 13)), BB, []);
    expect(b.nextZman).toMatchObject({ key: 'minchaK', time: '15:47' });
    expect(b.zmanim.find((z) => z.key === 'netz')!.past).toBe(true);
    expect(b.zmanim.filter((z) => z.next)).toHaveLength(1);
    expect(b.note).toContain('לפי אופק בני ברק');
    expect(b.note).toContain('לשאלות הלכה');
    expect(b.closure.closed).toBe(false);
    expect(b.emergency).toHaveLength(4);
    expect(b.hebDate.text).toBe('ד׳ חשוון תשפ״ז');
  });
  it('🛡 טוהר: בלי Date.now / new Date() / store / DOM; בלי נגיעה ב-zmanim.mjs (re-export בלבד)', () => {
    expect(srcZmanim).not.toMatch(/Date\.now\(|new Date\(\)/);
    expect(srcZmanim).not.toMatch(/useApp|document\.|window\./);
    expect(srcZmanim).toContain("from '../../lib/telephony/engine'");
    expect(srcZmanim).not.toContain('zmanim.mjs\'');
  });
});
