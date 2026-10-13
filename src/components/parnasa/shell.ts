/**
 * 📒 פרנסה׳לע — מנוע-השלד הטהור (עיצוב 1): מה שהמקור חישב סביב הפס והמסגרת — החודש העברי (תשרי=1 … אלול=12,
 * אדר א׳ 5.5), תקופות-השנה (עומר · בין המצרים · תשעת הימים · אלול), גוון ערב-שבת, ספירת-העזרה של החודש לפושקע,
 * ההקדשה ות.נ.צ.ב.ה., מוני-הלשוניות. בלי store/DOM/Date.now — "עכשיו" מוזרק (PrClock), ושעון-הקהילה תמיד
 * באזור-הזמן של הקהילה; התאריך העברי מתחלף בשקיעה (שיפור מול המקור, שהחליף בחצות).
 */
import type { Db, IsoDate } from '../../types/domain';
import { addDaysIso, clockAt, dayTimes, hebDateAt, hmToMin, type PrClock, type PrZmanimLoc } from './zmanimBoard';
import { hebcalParts } from '../../lib/telephony/engine';

export const PN_BRAND = 'פרנסה׳לע';
export const PN_TAGLINE = 'א פרנסה׳לע פאר יעדן איד';

/** החודש העברי כמספר (HM במקור): תשרי 1 … אלול 12; אדר א׳ 5.5; אדר / אדר ב׳ 6. */
const HM: Readonly<Record<string, number>> = {
  Tishri: 1, Heshvan: 2, Kislev: 3, Tevet: 4, Shevat: 5, 'Adar I': 5.5, Adar: 6, 'Adar II': 6,
  Nisan: 7, Iyar: 8, Sivan: 9, Tammuz: 10, Tamuz: 10, Av: 11, Elul: 12,
};

export interface PnHebNow {
  /** חודש (HM) ויום בחודש. */
  m: number;
  d: number;
  /** "ב׳ חשוון" / "ב׳ חשוון תשפ״ז". */
  dayMonth: string;
  text: string;
  /** תאריך-העוגן הלועזי (אחרי השקיעה ⇒ מחר). */
  anchorIso: IsoDate;
}

/** התאריך העברי ברגע (מתחלף בשקיעה). */
export function hebNow(clock: PrClock, loc: PrZmanimLoc): PnHebNow {
  const h = hebDateAt(clock, loc);
  let m = 0;
  try {
    m = HM[hebcalParts(h.anchorIso, loc.tz).monthName] ?? 0;
  } catch {
    m = 0;
  }
  const dayText = h.text.split(' ').slice(0, -1).join(' ');
  return { m, d: h.day, dayMonth: dayText, text: h.text, anchorIso: h.anchorIso };
}

/** תקופת-השנה (periodOf במקור): ספירת-העומר · בין המצרים / תשעת הימים · אלול. */
export interface PnPeriod {
  k: '' | 'omer' | 'bh' | 'elul';
  n?: number;
  t: string;
}

export function periodOf(m: number, d: number): PnPeriod {
  if ((m === 7 && d >= 16) || m === 8 || (m === 9 && d <= 5)) {
    const n = m === 7 ? d - 15 : m === 8 ? 15 + d : 44 + d;
    return { k: 'omer', n, t: 'היום ' + (n === 1 ? 'יום אחד' : n + ' ימים') + ' לעומר' };
  }
  if ((m === 10 && d >= 17) || (m === 11 && d <= 9)) return { k: 'bh', t: m === 11 ? 'תשעת הימים' : 'בין המצרים' };
  if (m === 12) return { k: 'elul', t: 'חודש אלול · ימי רחמים ותשובה' };
  return { k: '', t: '' };
}

/** גוון ערב-שבת (eveOf במקור): ביום שישי — 0 בצהריים, 1 בהדלקת-הנרות; אחרת 0. */
export function eveOf(clock: PrClock, loc: PrZmanimLoc): number {
  if (clock.dow !== 5) return 0;
  const candle = hmToMin(dayTimes(clock.iso, loc).candle);
  const now = hmToMin(clock.hhmm);
  if (candle === null || now === null || candle <= 720) return 0;
  return Math.max(0, Math.min(1, (now - 720) / (candle - 720)));
}

/** ראש-החודש העברי הנוכחי (התאריך הלועזי של א׳ בחודש). */
export function hebMonthStartIso(clock: PrClock, loc: PrZmanimLoc): IsoDate {
  const h = hebDateAt(clock, loc);
  return h.day > 0 ? addDaysIso(h.anchorIso, -(h.day - 1)) : clock.iso;
}

/** תאריך-הקהילה (אזור-הזמן) של חותמת ISO מלאה; פגומה ⇒ ''. */
function localDay(at: string | undefined, tz: string): string {
  const t = Date.parse(String(at ?? ''));
  return Number.isFinite(t) ? clockAt(t, tz).iso : '';
}

/**
 * החודש בקהילה (helpCount במקור): בקשות שנמצאו + תשובות של בעלי-מקצוע + המלצות — מראש-החודש העברי.
 * בקשה שקטה שנמצאה נמחקת עם תשובותיה (פרטיות) — כמו במקור, לא נספרת אחרי המחיקה.
 */
export function helpCount(db: Pick<Db, 'prRequests' | 'prListings'>, startIso: IsoDate, tz: string): number {
  let n = 0;
  for (const r of db.prRequests) {
    if (r.status === 'closed' && localDay(r.closedAt || r.updatedAt, tz) >= startIso) n++;
    for (const x of Array.isArray(r.responses) ? r.responses : []) if (localDay(x.at, tz) >= startIso) n++;
  }
  for (const l of db.prListings) for (const x of Array.isArray(l.recs) ? l.recs : []) if (localDay(x.at, tz) >= startIso) n++;
  return n;
}

/** מילוי-הפושקע (renderPushke): מטרה = max(30, 2×עסקים); גובה-הזהב עד 32 יח׳. */
export function pushkeFill(n: number, approved: number): number {
  const goal = Math.max(30, approved * 2);
  const f = Math.min(1, Math.max(0, n) / goal);
  return f ? Math.max(2, 32 * f) : 0;
}

/** "החודש בקהילה: N פעמים עזרו אחד לשני" (הודעת-הפושקע). */
export function pushkeText(n: number): string {
  return n ? 'החודש בקהילה: ' + (n === 1 ? 'פעם אחת' : n + ' פעמים') + ' עזרו אחד לשני' : 'כל עזרה בקהילה מוסיפה מטבע לפושקע';
}

/** ההקדשה: הטקסט + האם להוסיף ת.נ.צ.ב.ה. (כש"נשמ" בנוסח — המקור). */
export function dedicationOf(text: string | undefined): { text: string; tnzvh: boolean } {
  const t = String(text ?? '').trim();
  return { text: t, tnzvh: /נשמ/.test(t) };
}

/** שם-הקהילה בפס — או השורה של המותג (commName || TAGLINE). */
export function commLine(name: string | undefined): string {
  return String(name ?? '').trim() || PN_TAGLINE;
}
