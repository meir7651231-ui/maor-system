/**
 * 🔒 ratchet — 🕯️ התצוגות האמיתיות של מחשבון הזמנים (ATOMS-PREVIEWS, 14.10.2026).
 *
 * "עכשיו" = רביעי 14.10.2026 12:00 בישראל. המיקום: כמו לוח-הזמנים (db.ui.parnasa.zmanim, ואם אין — בני ברק).
 * ננעל: השורות המדויקות · שקילות ללוח-הזמנים האמיתי (dayZmanim/markZmanim/upcomingClosures/resolveTimeToken) — אותו
 * חישוב NOAA, אותו עיגול לחומרא · שבת וחג צמודים ⇒ חלון אחד · fail-closed בקוטב (אין שעה מומצאת) · דטרמיניזם.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Db } from '../../../types/domain';
import { buildZmanimBoard, clockAt, dayTimes, dayZmanim, resolveTimeToken, resolveZmanimLoc, upcomingClosures } from '../../../components/parnasa/zmanimBoard';
import { ctxOf, NOW_MS, PV, richDb } from './previewsFixture';
import { durationText, hms } from '../previewZmanim';

const at = (iso: string): number => Date.parse(iso);
const withLoc = (zmanim: Record<string, unknown>): Db => {
  const db = richDb();
  return { ...db, ui: { ...db.ui, parnasa: { zmanim } } } as Db;
};
const BB = resolveZmanimLoc(null);
const TODAY = '2026-10-14';

afterEach(() => vi.useRealTimers());

describe('🕯️ זמני היום', () => {
  it('✂️ היום מהנץ עד השקיעה ⇒ 12 שעות זמניות, ואורך שעה אחת', () => {
    expect(PV('zmanim.day', 'divide')).toEqual({
      title: 'שעה זמנית היום = 57 דקות ו-15 שניות · מהנץ 06:43 עד השקיעה 18:10 · לפי בני ברק',
      lines: ['שעה 1 · 06:43–07:40', 'שעה 2 · 07:40–08:38', 'שעה 3 · 08:38–09:35', 'שעה 4 · 09:35–10:32', 'שעה 5 · 10:32–11:29', 'ועוד 7'],
    });
    // אותו נץ ושקיעה כמו הלוח
    const t = dayTimes(TODAY, BB);
    expect([t.sunrise, t.sunset]).toEqual(['06:43', '18:10']);
    // לפי גודל: תורים של חצי שעה
    expect(PV('zmanim.day', 'divide', { by: 'size', size: 30 })!.title).toMatch(/^22 חלקים של חצי שעה · /);
  });

  it('⏭️ הזמן הבא = מה שהלוח מסמן כ"הבא"', () => {
    expect(PV('zmanim.times', 'next')).toEqual({ title: 'הזמן הבא · עכשיו 12:00 · לפי בני ברק', lines: ['הזמן הבא: חצות היום 12:27'] });
    const board = buildZmanimBoard(clockAt(NOW_MS), BB, []);
    expect(board.nextZman?.time).toBe('12:27');
    // אחרי צאת הכוכבים ⇒ מחר; כמה הבאים
    const night = PV('zmanim.times', 'next', { count: 2 }, ctxOf(richDb(), at('2026-10-14T17:00:00Z')))!;
    expect(night.lines).toEqual(['הזמן הבא: מחר · עלות השחר 05:32', 'מחר · נץ החמה 06:44']);
  });

  it('⏱️ "מניין 20 דקות לפני השקיעה ← 17:50" — כמו הטוקן sh-20 של לוח-המניינים', () => {
    const p = PV('zmanim.times', 'offset', { minutes: -20 })!;
    expect(p.title).toBe('20 דקות לפני כל זמן · למשל: מניין 20 דקות לפני השקיעה ← 17:50 · לפי בני ברק');
    expect(p.lines).toContain('שקיעה 18:10 ← 17:50');
    expect(resolveTimeToken('sh-20', dayTimes(TODAY, BB))).toBe('17:50');
    expect(PV('zmanim.times', 'offset', { minutes: 15 })!.lines).toContain('נץ החמה 06:43 ← 06:58');
  });

  it('🎯 עיגול לחומרא: סוף זמן למטה, התחלה למעלה — בדיוק המספרים של הלוח', () => {
    const p = PV('zmanim.times', 'round')!;
    expect(p.title).toBe('מעוגל לדקה לחומרא: סוף זמן למטה, התחלה למעלה · לפי בני ברק');
    expect(p.lines).toEqual([
      'סוף זמן קריאת שמע (מגן אברהם) 08:58:45 ← 08:58',
      'סוף זמן קריאת שמע (גר״א) 09:34:45 ← 09:34',
      'סוף זמן תפילה (גר״א) 10:32:00 ← 10:32',
      'מנחה גדולה 12:55:07 ← 12:56',
      'מנחה קטנה 15:46:52 ← 15:47',
      'פלג המנחה 16:58:26 ← 16:59',
    ]);
    const board = new Map(dayZmanim(TODAY, BB).map((r) => [r.key, r.time]));
    const rounded = p.lines.map((l) => l.split(' ← ')[1]);
    expect(rounded).toEqual(['shmaMga', 'shmaGra', 'tefila', 'minchaG', 'minchaK', 'plag'].map((k) => board.get(k)));
    // לקרוב
    expect(PV('zmanim.times', 'round', { dir: 'nearest' })!.lines[0]).toBe('סוף זמן קריאת שמע (מגן אברהם) 08:58:45 ← 08:59');
  });

  it('מיקום אחר ⇒ זמנים אחרים, ושם המקום בכותרת', () => {
    expect(PV('zmanim.day', 'divide', {}, ctxOf(withLoc({ city: 'jerusalem' })))!.title).toMatch(/ · לפי ירושלים$/);
    expect(PV('zmanim.times', 'next', {}, ctxOf(withLoc({ city: 'jerusalem' })))!.lines[0]).not.toBe('הזמן הבא: חצות היום 12:27');
  });
});

describe('🕯️ השבת והימים הסגורים', () => {
  it('✂️ השבת מהדלקת הנרות עד צאת השבת ⇒ משמרות שוות', () => {
    expect(PV('zmanim.shabbat', 'divide', { parts: 4 })).toEqual({
      title: 'השבת 16/10–17/10 · מהדלקת הנרות 17:46 עד צאת השבת 18:47 · 4 משמרות של 6 שעות, 15 דקות ו-15 שניות',
      lines: ['משמרת 1 · שישי 17:46–שבת 00:01', 'משמרת 2 · שבת 00:01–06:17', 'משמרת 3 · שבת 06:17–12:32', 'משמרת 4 · שבת 12:32–18:47'],
    });
  });

  it('🔗 שבת וחג צמודים ⇒ חלון סגור אחד, מההדלקה עד הצאת', () => {
    const p = PV('zmanim.closedDays', 'merge', {}, ctxOf(richDb(), at('2026-09-09T09:00:00Z')))!;
    expect(p.lines[0]).toBe('ראש השנה ושבת · 2 ימים צמודים ← חלון סגור אחד · מ-11/9 18:31 עד 13/9 19:30');
    expect(p.lines).toContain('יום כיפור · מ-20/9 18:19 עד 21/9 19:20');
    // היום: ארבע שבתות
    expect(PV('zmanim.closedDays', 'merge')!.lines).toEqual([
      'שבת · מ-16/10 17:46 עד 17/10 18:47',
      'שבת · מ-23/10 17:38 עד 24/10 18:39',
      'שבת · מ-30/10 16:31 עד 31/10 17:32',
      'שבת · מ-6/11 16:25 עד 7/11 17:26',
    ]);
    // רווח מותר ⇒ סוכות עד שבת בראשית בחלון אחד, וכתוב כמה ימי חול באמצע
    expect(PV('zmanim.closedDays', 'merge', { maxGap: 6 }, ctxOf(richDb(), at('2026-09-24T09:00:00Z')))!.lines[0]).toMatch(/22 ימים צמודים \(כולל 18 ימי חול באמצע\) ← חלון סגור אחד · מ-25\/9 18:13 עד 17\/10 18:47$/);
  });

  it('⏭️ השבת או החג הבא — אותו חלון כמו "שבת/חג קרוב" בלוח; בתוך החג ⇒ "(עכשיו)"', () => {
    expect(PV('zmanim.closedDays', 'next')).toEqual({ title: 'השבת או החג הבא · לפי בני ברק', lines: ['השבת הבאה: שבת · מ-16/10 17:46 עד 17/10 18:47'] });
    const w = upcomingClosures(clockAt(NOW_MS), BB, 30)[0];
    expect([w.startIso, w.startTime, w.endIso, w.endTime]).toEqual(['2026-10-16', '17:46', '2026-10-17', '18:47']);
    expect(PV('zmanim.closedDays', 'next', {}, ctxOf(richDb(), at('2026-09-12T10:00:00Z')))!.lines[0]).toBe('החג הבא: ראש השנה · 2 ימים (עכשיו) · מ-11/9 18:31 עד 13/9 19:30');
    // רק חלונות של יומיים ומעלה: ראש השנה; אחריו אין כזה ב-30 יום (בארץ סוכות ושמיני עצרת = יום אחד) ⇒ null, לא ממציאים
    expect(PV('zmanim.closedDays', 'next', { minLength: 2 }, ctxOf(richDb(), at('2026-09-01T09:00:00Z')))!.lines[0]).toBe('החג הבא: ראש השנה · 2 ימים · מ-11/9 18:31 עד 13/9 19:30');
    expect(PV('zmanim.closedDays', 'next', { minLength: 2 }, ctxOf(richDb(), at('2026-09-14T10:00:00Z')))).toBeNull();
  });

  it('🔗 ⏭️ השבת שכבר יצאה לא מוצגת (מוצ״ש 20:00 ⇒ השבת הבאה)', () => {
    const p = PV('zmanim.closedDays', 'merge', {}, ctxOf(richDb(), at('2026-10-17T17:00:00Z')))!;
    expect(p.lines[0]).toBe('שבת · מ-23/10 17:38 עד 24/10 18:39');
  });
});

describe('🕯️ fail-closed — אף פעם לא ממציאים שעה', () => {
  it('קוטב בחורף: כל תצוגה אומרת שאי אפשר לחשב; ימים סגורים = "סגור כל היום"', () => {
    const polar = ctxOf(withLoc({ lat: 78.2, lon: 15.6, tz: 'Arctic/Longyearbyen', label: 'סבאלברד' }), at('2026-12-15T09:00:00Z'));
    for (const [place, atom] of [['zmanim.day', 'divide'], ['zmanim.times', 'next'], ['zmanim.times', 'offset'], ['zmanim.times', 'round']] as const) {
      const p = PV(place, atom, {}, polar)!;
      expect(p.title, place + atom).toBe('אי אפשר לחשב את הזמנים · לפי סבאלברד');
      expect(p.lines.join(' '), place + atom).not.toMatch(/\d{1,2}:\d{2}/);
    }
    expect(PV('zmanim.shabbat', 'divide', {}, polar)!.lines.join(' ')).not.toMatch(/\d{1,2}:\d{2}/);
    const closed = PV('zmanim.closedDays', 'merge', {}, polar)!;
    expect(closed.lines[0]).toBe('שבת · סגור כל היום 19/12 (אי אפשר לחשב שעה)');
    expect(closed.lines.join(' ')).not.toMatch(/\d{1,2}:\d{2}/);
    expect(PV('zmanim.closedDays', 'next', {}, polar)!.lines[0]).toBe('השבת הבאה: שבת · סגור כל היום 19/12 (אי אפשר לחשב שעה)');
  });
});

describe('🕯️ עזרים ודטרמיניזם', () => {
  it('משך בעברית פשוטה · שעה עם שניות', () => {
    expect([durationText(30), durationText(60), durationText(55), durationText(57.25), durationText(375.25)]).toEqual(['חצי שעה', 'שעה', '55 דקות', '57 דקות ו-15 שניות', '6 שעות, 15 דקות ו-15 שניות']);
    expect(hms(9 * 60 + 13 + 40 / 60)).toBe('09:13:40');
  });

  it('לא תלוי בשעון-המערכת ולא בנתוני-הארגון (רק במיקום)', () => {
    const keys = [['zmanim.day', 'divide'], ['zmanim.shabbat', 'divide'], ['zmanim.times', 'next'], ['zmanim.times', 'offset'], ['zmanim.times', 'round'], ['zmanim.closedDays', 'merge'], ['zmanim.closedDays', 'next']] as const;
    const run = (db: Db | null) => keys.map(([p, a]) => JSON.stringify(PV(p, a, {}, ctxOf(db))));
    const a = run(richDb());
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-03-01T03:00:00Z'));
    expect(run(richDb())).toEqual(a);
    expect(run(null)).toEqual(a); // בלי נתונים ⇒ בני ברק
    expect(PV('zmanim.day', 'divide', {}, ctxOf(richDb(), NaN))).toBeNull();
  });
});
