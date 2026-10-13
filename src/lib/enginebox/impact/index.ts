/**
 * 🧰 ארגז-המנועים — "נסה לפני שמחברים" (BUILD-ORDER-ENGINEBOX-2026-10-13): מה היה קורה ב-30 הימים האחרונים, עם
 * הנתונים האמיתיים של הארגון, אילו החיבור היה דלוק.
 *
 *   "ב-30 הימים האחרונים היו 12 הזמנות עם שבת. כל אחת מהן הייתה מקבלת בכרטיס ההזמנה את זמני השבת של אותה שבת."
 *
 *   · impactOf(linkKey, ctx, days?) — משפט עברי אחד עם המספרים האמיתיים + ספירה + עד 3 דוגמאות; null = אין מה לומר בכנות
 *     (חיבור לא תקין · אחד הצדדים כבוי · אין נתונים · המדד צריך את `ask` ואין/לא ענה). **לעולם לא זורק.**
 *   · impactsFor(keys, ctx, days?) — אותו דבר לרשימה (רק מה שיש לו מה לומר, בסדר הרשימה).
 *   · IMPACT_MEASURES — הרישום, לפי "המקבל|המחבר" (`host.stay|times.shabbat`): חיבור חדש = שורה אחת כאן.
 *
 * חוק-הכנות: סופרים רק מה שבאמת בנתונים, והמשפט אומר בדיוק מה שהקוד היה עושה (אותם עזרים של נקודת-הצריכה —
 * stayFriday · faultNeed · cleanNeed · כלל-הדחיפות של MaintTab). מה שתלוי בכלי הנותן (זמנים, מניינים, בעלי-מקצוע) —
 * רק דרך `ask` של המרכזייה (מוזרק); בלעדיו המדד או שותק (null) או מוותר על החלק הזה ואומר רק את מה שבנתונים.
 *
 * טהור ודטרמיניסטי: בלי React/store/DOM/Date.now/רשת — `nowMs` מוזרק, "היום" = isoAt בשעון-הארגון (ישראל). חלון =
 * `days` הימים שמסתיימים היום (כולל היום). עלות חסומה: מעבר אחד על הרשומות הרלוונטיות, ושאלות-מרכזייה במטמון
 * (פעם לכל שבת / לכל ניסוח-צורך). בידוד: אין כאן כסף, קבלות, לוח-ראשי, חדרי-חוגים, ולא כתיבה.
 */
import { featureOn, moduleOn } from '../../config';
import type { Db, HostBooking, HostCleanTask, HostFault, HostUnit } from '../../../types/domain';
import type { OrgConfig } from '../../../types/config';
import { isoAt, type SwitchCtx } from '../../switchboard/contract';
import type { AskFn } from '../../switchboard/registry';
import { addDaysIso, hostTerms, isIso, unitHasRooms } from '../../../components/hosting/transitions';
import { cleanNeed, faultNeed, stayFriday } from '../../../components/hosting/switchLinks';
import { parseLink } from '../links';
import { partById, type Part } from '../parts';

/* ═══════════════ החוזה ═══════════════ */

/** ההקשר — הכול מוזרק. `ask` = ה-ask של המרכזייה (אופציונלי; בלעדיו מדדים שתלויים בכלי הנותן שותקים). */
export interface ImpactCtx {
  readonly db: Db;
  readonly config: OrgConfig;
  /** הרגע (epoch ms). */
  readonly nowMs: number;
  readonly ask?: AskFn;
}

/** "מה היה קורה" לחיבור אחד. */
export interface Impact {
  /** מפתח-החיבור (`נותן>מחבר>מקבל`). */
  readonly key: string;
  /** משפט עברי פשוט עם המספרים האמיתיים. */
  readonly headline: string;
  /** המספר שבמשפט (0 = היו נתונים, אבל בחלון לא היה מה לשנות). */
  readonly count: number;
  /** עד 3 דוגמאות קצרות מהנתונים (החדשות קודם). */
  readonly examples: readonly string[];
  /** אורך החלון בימים. */
  readonly days: number;
}

/** ברירת-המחדל ותקרת החלון. */
export const IMPACT_DEFAULT_DAYS = 30;
export const IMPACT_MAX_DAYS = 366;
const MAX_EXAMPLES = 3;

/** החלון: מ-start עד today (כולל), תאריכי ISO בשעון-הארגון. */
interface Win {
  readonly days: number;
  readonly today: string;
  readonly start: string;
  /** ימי-השישי בחלון (ליל-שבת = הלילה שמתחיל בשישי), מהישן לחדש. */
  readonly fridays: readonly string[];
}

/** תוצאת-מדד לפני הרכבה. */
interface Measured {
  readonly count: number;
  /** הסיפא של המשפט כשיש מה לספר (אחרי "ב-30 הימים האחרונים"). */
  readonly text: string;
  readonly examples?: readonly string[];
}

/** מדד = מה היה קורה במקבל, כשהנותן מחובר. null = אין מה לומר בכנות. */
export type ImpactMeasure = (w: Win, ctx: ImpactCtx, giver: string) => Measured | null;

/* ═══════════════ עזרים ═══════════════ */

/** יום-בשבוע (0=ראשון) של תאריך ISO — חשבון-UTC על התאריך הקלנדרי (1.1.1970 = חמישי). */
const dowOf = (iso: string): number => (((Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000) + 4) % 7) + 7) % 7;
const dm = (iso: string): string => (isIso(iso) ? +iso.slice(8, 10) + '/' + +iso.slice(5, 7) : '');
const inWin = (w: Win, iso: string): boolean => iso >= w.start && iso <= w.today;

/** "הזמנה אחת" / "12 הזמנות". */
const n = (k: number, one: string, many: string): string => (k === 1 ? one : k + ' ' + many);

/** הפועל בהתאם: "הייתה הזמנה אחת" / "היה לילה אחד" / "היו 12 הזמנות". */
const was = (k: number, fem: boolean): string => (k === 1 ? (fem ? 'הייתה' : 'היה') : 'היו');
/** "נפתחה קריאה אחת" / "נפתחו 7 קריאות". */
const opened = (k: number): string => (k === 1 ? 'נפתחה' : 'נפתחו');

function periodOf(days: number): string {
  return days === 1 ? 'היום' : 'ב-' + days + ' הימים האחרונים';
}

function windowOf(nowMs: number, days: number): Win | null {
  if (!Number.isFinite(nowMs)) return null;
  const today = isoAt(nowMs);
  const start = addDaysIso(today, -(days - 1));
  if (!isIso(today) || !isIso(start)) return null;
  const fridays: string[] = [];
  let d = addDaysIso(start, (5 - dowOf(start) + 7) % 7);
  for (let i = 0; d && d <= today && i < 60; d = addDaysIso(d, 7), i++) fridays.push(d);
  return { days, today, start, fridays };
}

/** תאריך ISO (שעון-הארגון) של חותמת — פגומה ⇒ ''. */
function isoOfStamp(s: unknown): string {
  if (typeof s !== 'string') return '';
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? isoAt(ms) : '';
}

/** מערך באורך `len` מלא ב-`v`. */
const filled = <T>(len: number, v: T): T[] => Array.from({ length: len }, () => v);

const listOf = <T>(x: unknown): readonly T[] => (Array.isArray(x) ? (x as T[]) : []);

/** הזמנה שהתקיימה (או עוד תתקיים) — לא בוטלה. "הושלמה" נספרת: בזמנה היא כן הייתה בשהייה. */
const liveBooking = (b: HostBooking): boolean => !!b && b.status !== 'cancelled' && isIso(b.checkIn) && isIso(b.checkOut) && b.checkIn < b.checkOut;

/** ימי-השישי בחלון שהשהייה לנה בהם (checkIn ≤ שישי < checkOut) — אותו כלל של stayFriday, לכל ליל-שבת בחלון. */
function stayFridaysIn(w: Win, b: HostBooking): string[] {
  if (b.checkOut <= w.start || b.checkIn > w.today) return [];
  const first = stayFriday({ checkIn: b.checkIn < w.start ? w.start : b.checkIn, checkOut: b.checkOut });
  if (!first || first > w.today) return [];
  const out: string[] = [];
  for (let f = first; f && f < b.checkOut && f <= w.today; f = addDaysIso(f, 7)) out.push(f);
  return out;
}

function swCtx(ctx: ImpactCtx, nowMs = ctx.nowMs): SwitchCtx {
  return { db: ctx.db, config: ctx.config, nowMs };
}

function unitNameOf(db: Db): (id: string) => string {
  const m = new Map<string, string>();
  for (const u of listOf<HostUnit>(db.hostUnits)) if (u && typeof u.id === 'string') m.set(u.id, String(u.name ?? '').trim());
  return (id) => m.get(id) || '';
}

/* ═══════════════ שאלות לכלי הנותן (דרך ask, במטמון) ═══════════════ */

interface ShabbatFacts {
  readonly candle: string;
  readonly end: string;
}

/** זמני השבת של יום-שישי נתון — אותה שאלה של כרטיס-השהייה (`{ atIso: friIso }`). לא ענה ⇒ null. */
function shabbatAsker(ctx: ImpactCtx): ((fri: string) => ShabbatFacts | null) | null {
  const ask = ctx.ask;
  if (!ask) return null;
  const memo = new Map<string, ShabbatFacts | null>();
  const sc = swCtx(ctx);
  return (fri) => {
    if (!memo.has(fri)) {
      const r = ask('parnasa.shabbat', sc, { atIso: fri });
      memo.set(fri, r.ok ? { candle: r.value.candle, end: r.value.end } : null);
    }
    return memo.get(fri) ?? null;
  };
}

/** המניינים לשישי-שבת (אותה שאלה של minyanimOf: שני ימים מיום-השישי) — מספר מניינים ובתי-כנסת; לא ענה ⇒ null. */
function minyanAsker(ctx: ImpactCtx): ((fri: string) => { count: number; shuls: number } | null) | null {
  const ask = ctx.ask;
  if (!ask) return null;
  const memo = new Map<string, { count: number; shuls: number } | null>();
  const sc = swCtx(ctx);
  return (fri) => {
    if (!memo.has(fri)) {
      const r = ask('parnasa.minyanim', sc, { fromIso: fri, days: 2 });
      memo.set(fri, r.ok ? { count: r.value.minyanim.length, shuls: new Set(r.value.minyanim.map((m) => m.shul + '|' + m.place)).size } : null);
    }
    return memo.get(fri) ?? null;
  };
}

/** "מי במדריך מתאים לזה עכשיו" — שם בעל-המקצוע הראשון ('' = אף אחד); לא ענה ⇒ null. במטמון לפי הניסוח. */
function proAsker(ctx: ImpactCtx): ((text: string) => string | null) | null {
  const ask = ctx.ask;
  if (!ask) return null;
  const memo = new Map<string, string | null>();
  const sc = swCtx(ctx);
  return (text) => {
    if (!memo.has(text)) {
      const r = ask('parnasa.findPro', sc, { text, limit: 1 });
      memo.set(text, r.ok ? (r.value.total > 0 ? (r.value.pros[0]?.name ?? '') : '') : null);
    }
    const v = memo.get(text);
    return v === undefined ? null : v;
  };
}

/* ═══════════════ המדדים ═══════════════ */

/** זמני-השבת ⇒ כרטיס-השהייה: הזמנות בחלון שהשהייה שלהן כוללת ליל-שבת. */
const stayShabbat: ImpactMeasure = (w, ctx) => {
  const bookings = listOf<HostBooking>(ctx.db.hostBookings).filter(liveBooking);
  if (!bookings.length) return null;
  const unitName = unitNameOf(ctx.db);
  const sh = shabbatAsker(ctx);
  const hits: Array<{ b: HostBooking; fri: string }> = [];
  for (const b of bookings) {
    const fr = stayFridaysIn(w, b);
    if (fr.length) hits.push({ b, fri: fr[fr.length - 1]! });
  }
  hits.sort((a, b) => (a.fri === b.fri ? (a.b.id < b.b.id ? -1 : 1) : a.fri < b.fri ? 1 : -1));
  const examples = hits.slice(0, MAX_EXAMPLES).map(({ b, fri }) => {
    const t = sh?.(fri);
    const times = t ? [t.candle ? 'הדלקת נרות ' + t.candle : '', t.end ? 'צאת השבת ' + t.end : ''].filter(Boolean).join(', ') : '';
    return [unitName(b.unitId), 'שבת ' + dm(addDaysIso(fri, 1)), times].filter(Boolean).join(' · ');
  });
  const k = hits.length;
  return {
    count: k,
    text: k
      ? was(k, true) + ' ' + n(k, 'הזמנה אחת', 'הזמנות') + ' עם שבת. ' + (k === 1 ? 'היא הייתה מקבלת' : 'כל אחת מהן הייתה מקבלת') + ' בכרטיס ההזמנה את זמני השבת של אותה שבת (הדלקת נרות, צאת השבת ור״ת).'
      : 'לא הייתה אף הזמנה עם שבת, ולכן החיבור עוד לא היה משנה דבר.',
    examples,
  };
};

/** המניינים ⇒ כרטיס-השהייה: הזמנות-עם-שבת שבלוח היו להן מניינים לשישי-שבת. בלי ask — אין דרך לדעת ⇒ null. */
const stayPrayers: ImpactMeasure = (w, ctx) => {
  const my = minyanAsker(ctx);
  if (!my) return null;
  const bookings = listOf<HostBooking>(ctx.db.hostBookings).filter(liveBooking);
  if (!bookings.length) return null;
  const unitName = unitNameOf(ctx.db);
  const hits: Array<{ b: HostBooking; fri: string; m: { count: number; shuls: number } }> = [];
  for (const b of bookings) {
    const fr = stayFridaysIn(w, b);
    for (let i = fr.length - 1; i >= 0; i--) {
      const m = my(fr[i]!);
      if (m === null) return null; // הלוח לא ענה — לא מנחשים
      if (m.count) {
        hits.push({ b, fri: fr[i]!, m });
        break;
      }
    }
  }
  hits.sort((a, b) => (a.fri === b.fri ? (a.b.id < b.b.id ? -1 : 1) : a.fri < b.fri ? 1 : -1));
  const k = hits.length;
  return {
    count: k,
    text: k
      ? was(k, true) + ' ' + n(k, 'הזמנה אחת', 'הזמנות') + ' עם שבת שבלוח הקהילה היו לה מניינים. ' + (k === 1 ? 'היא הייתה מקבלת' : 'כל אחת מהן הייתה מקבלת') + ' בכרטיס ההזמנה את המניינים לשישי-שבת, עם בית הכנסת והכתובת.'
      : 'לא הייתה אף הזמנה עם שבת שבלוח הקהילה היו לה מניינים, ולכן החיבור עוד לא היה משנה דבר.',
    examples: hits.slice(0, MAX_EXAMPLES).map(({ b, fri, m }) =>
      [unitName(b.unitId), 'שבת ' + dm(addDaysIso(fri, 1)), n(m.count, 'מניין אחד', 'מניינים') + (m.shuls === 1 ? ' בבית כנסת אחד' : ' ב-' + m.shuls + ' בתי כנסת')].filter(Boolean).join(' · '),
    ),
  };
};

/** כמה הזמנות לנו בכל ליל-שבת בחלון. */
function guestsPerShabbat(w: Win, db: Db): Map<string, number> | null {
  const bookings = listOf<HostBooking>(db.hostBookings).filter(liveBooking);
  if (!bookings.length) return null;
  const per = new Map<string, number>();
  for (const b of bookings) for (const f of stayFridaysIn(w, b)) per.set(f, (per.get(f) ?? 0) + 1);
  return per;
}

/** זמני-השבת ⇒ לשונית-השבת: שבתות בחלון עם אורח אחד לפחות. */
const tabShabbat: ImpactMeasure = (w, ctx) => {
  const per = guestsPerShabbat(w, ctx.db);
  if (!per) return null;
  const sh = shabbatAsker(ctx);
  const fris = w.fridays.filter((f) => per.has(f)).reverse();
  const k = fris.length;
  return {
    count: k,
    text: k
      ? was(k, true) + ' ' + n(k, 'שבת אחת', 'שבתות') + ' עם אורחים. ' + (k === 1 ? 'בה' : 'בכל אחת מהן') + ' לשונית השבת הייתה מציגה את זמני השבת מלוח הקהילה (הדלקת נרות, צאת השבת ור״ת), לצד השדות הידניים.'
      : 'לא הייתה אף שבת עם אורחים, ולכן החיבור עוד לא היה משנה דבר.',
    examples: fris.slice(0, MAX_EXAMPLES).map((f) => {
      const t = sh?.(f);
      return ['שבת ' + dm(addDaysIso(f, 1)), n(per.get(f) ?? 0, 'הזמנה אחת', 'הזמנות'), t?.candle ? 'הדלקת נרות ' + t.candle : ''].filter(Boolean).join(' · ');
    }),
  };
};

/** המניינים ⇒ לשונית-השבת: שבתות עם אורחים שבלוח היו להן מניינים. בלי ask ⇒ null. */
const tabPrayers: ImpactMeasure = (w, ctx) => {
  const my = minyanAsker(ctx);
  if (!my) return null;
  const per = guestsPerShabbat(w, ctx.db);
  if (!per) return null;
  const fris: Array<{ f: string; m: { count: number; shuls: number } }> = [];
  for (const f of [...w.fridays].reverse()) {
    if (!per.has(f)) continue;
    const m = my(f);
    if (m === null) return null;
    if (m.count) fris.push({ f, m });
  }
  const k = fris.length;
  return {
    count: k,
    text: k
      ? was(k, true) + ' ' + n(k, 'שבת אחת', 'שבתות') + ' עם אורחים ועם מניינים בלוח הקהילה. ' + (k === 1 ? 'בה' : 'בכל אחת מהן') + ' לשונית השבת הייתה מציגה את המניינים לשישי-שבת, ובשורה של כל הזמנה לאותה שבת היה כפתור "📤 שליחה למשפחה" (כשהוואטסאפ דלוק ולאורח יש טלפון).'
      : 'לא הייתה אף שבת עם אורחים ועם מניינים בלוח הקהילה, ולכן החיבור עוד לא היה משנה דבר.',
    examples: fris.slice(0, MAX_EXAMPLES).map(({ f, m }) => ['שבת ' + dm(addDaysIso(f, 1)), n(per.get(f) ?? 0, 'הזמנה אחת', 'הזמנות'), n(m.count, 'מניין אחד', 'מניינים')].join(' · ')),
  };
};

const faultsOf = (db: Db): HostFault[] => listOf<{ kind?: unknown }>(db.hostRecords).filter((r): r is HostFault => !!r && r.kind === 'fault');
const cleansOf = (db: Db): HostCleanTask[] => listOf<{ kind?: unknown }>(db.hostRecords).filter((r): r is HostCleanTask => !!r && r.kind === 'clean');
/** כלל-הדחיפות של MaintTab (`urgent: r.priority <= 1 || r.safety`). */
const isUrgent = (f: HostFault): boolean => (typeof f.priority === 'number' && f.priority <= 1) || f.safety === true;

/** רשומות שנפתחו בחלון, מהחדשה לישנה (יציב לפי מזהה). */
function openedIn<T extends { id: string }>(w: Win, list: readonly T[], dateOf: (r: T) => string): Array<{ r: T; iso: string }> {
  const out: Array<{ r: T; iso: string }> = [];
  for (const r of list) {
    const iso = dateOf(r);
    if (iso && inWin(w, iso)) out.push({ r, iso });
  }
  return out.sort((a, b) => (a.iso === b.iso ? (a.r.id < b.r.id ? -1 : 1) : a.iso < b.iso ? 1 : -1));
}

/** המדריך ⇒ תקלה/ניקיון: כמה נפתחו בחלון, ואם יש ask — לכמה מהן יש היום בעל-מקצוע מתאים במדריך. */
function proMeasure<T extends { id: string }>(
  ctx: ImpactCtx,
  items: Array<{ r: T; iso: string }>,
  needOf: (r: T) => string,
  titleOf: (r: T) => string,
  words: { one: string; many: string; none: string },
): Measured {
  const pro = proAsker(ctx);
  const k = items.length;
  if (!k) return { count: 0, text: words.none };
  const head = opened(k) + ' ' + n(k, words.one, words.many) + '. ' + (k === 1 ? 'בה' : 'בכל אחת מהן') + ' היה כפתור "🔧 מצא בעל מקצוע" מהמדריך.';
  if (!pro) return { count: k, text: head, examples: items.slice(0, MAX_EXAMPLES).map(({ r, iso }) => dm(iso) + ' · ' + titleOf(r)) };
  let matched = 0;
  let answered = true;
  const examples: string[] = [];
  for (const { r, iso } of items) {
    const name = pro(needOf(r));
    if (name === null) {
      answered = false;
      break;
    }
    if (name) {
      matched++;
      if (examples.length < MAX_EXAMPLES) examples.push(dm(iso) + ' · ' + titleOf(r) + ' ← ' + name);
    }
  }
  if (!answered) return { count: k, text: head, examples: items.slice(0, MAX_EXAMPLES).map(({ r, iso }) => dm(iso) + ' · ' + titleOf(r)) };
  const tail = matched === k ? (k === 1 ? ' לפי המדריך היום — יש לה בעל מקצוע מתאים.' : ' לפי המדריך היום — לכל אחת מהן יש בעל מקצוע מתאים.') : matched === 0 ? ' לפי המדריך היום — עוד אין בו בעל מקצוע מתאים לאף אחת מהן.' : ' לפי המדריך היום — ל-' + matched + ' מהן יש בעל מקצוע מתאים.';
  return { count: k, text: head + tail, examples };
}

const titleOfFault = (f: HostFault): string => String(f.desc ?? '').trim() || String(f.category ?? '').trim() || 'קריאת תחזוקה';

const maintPro: ImpactMeasure = (w, ctx) => {
  const faults = faultsOf(ctx.db);
  if (!faults.length) return null;
  const items = openedIn(w, faults, (f) => isoOfStamp(f.createdAt));
  return proMeasure(ctx, items, faultNeed, titleOfFault, {
    one: 'קריאת תחזוקה אחת',
    many: 'קריאות תחזוקה',
    none: 'לא נפתחה אף קריאת תחזוקה, ולכן החיבור עוד לא היה משנה דבר.',
  });
};

const cleanPro: ImpactMeasure = (w, ctx) => {
  const tasks = cleansOf(ctx.db);
  if (!tasks.length) return null;
  const unitName = unitNameOf(ctx.db);
  const items = openedIn(w, tasks, (t) => (isIso(t.date) ? t.date : isoOfStamp(t.createdAt)));
  return proMeasure(ctx, items, cleanNeed, (t) => [String(t.type ?? '').trim() || 'ניקיון', unitName(t.unitId)].filter(Boolean).join(' · '), {
    one: 'משימת ניקיון אחת',
    many: 'משימות ניקיון',
    none: 'לא נפתחה אף משימת ניקיון, ולכן החיבור עוד לא היה משנה דבר.',
  });
};

/** מספרי-החירום ⇒ תחזוקה: קריאות דחופות שנפתחו בחלון. השורה יושבת בחלון בעל-המקצוע ⇒ בלי המדריך היא לא נראית ⇒ null. */
const maintEmergency: ImpactMeasure = (w, ctx) => {
  const dir = partById('pr.directory');
  if (!dir || !partOn(dir, ctx.config)) return null;
  const faults = faultsOf(ctx.db);
  if (!faults.length) return null;
  const items = openedIn(
    w,
    faults.filter(isUrgent),
    (f) => isoOfStamp(f.createdAt),
  );
  const k = items.length;
  let nums = '';
  if (ctx.ask && k) {
    const r = ctx.ask('parnasa.emergency', swCtx(ctx), {});
    if (r.ok) nums = r.value.numbers.slice(0, 3).map((x) => x.label + ' ' + x.phone).join(' · ');
  }
  const ex = items.slice(0, MAX_EXAMPLES).map(({ r, iso }) => dm(iso) + ' · ' + titleOfFault(r));
  return {
    count: k,
    text: k
      ? opened(k) + ' ' + n(k, 'קריאה דחופה אחת', 'קריאות דחופות') + ' (P0/P1 או סיכון בטיחות). ' + (k === 1 ? 'בה' : 'בכל אחת מהן') + ' חלון בעל המקצוע היה מציג בראשו "🚨 סכנה? מספרי חירום" מלוח הקהילה.'
      : 'לא נפתחה אף קריאה דחופה, ולכן החיבור עוד לא היה משנה דבר.',
    examples: nums ? [...ex.slice(0, MAX_EXAMPLES - 1), 'המספרים: ' + nums] : ex,
  };
};

/**
 * מקום-פנוי ⇒ הקו: לילות בחלון שבהם הייתה יחידה פנויה אחת לפחות. **מחושב מהנתונים**, לא מ-hosting.availability: היכולת
 * עונה על "עכשיו" (הזמנה שהושלמה כבר לא תופסת, סטטוס-חסימה נוכחי) — נכון לקו היום, שגוי לעבר. כאן הזמנה שהושלמה כן
 * תפסה את לילותיה, וסטטוס-החסימה (שאין לו היסטוריה) לא נלקח בחשבון. עם ask — דוגמה אחת: מה הקו היה אומר הלילה.
 */
const phoneAvailability: ImpactMeasure = (w, ctx) => {
  const units = listOf<HostUnit>(ctx.db.hostUnits).filter((u) => u && typeof u.id === 'string');
  if (!units.length) return null;
  const idx = new Map<string, number>(units.map((u, i) => [u.id, i]));
  const D = w.days;
  // תפוסה: יחידה שלמה ⇒ ביט "כולה"; יחידה עם חדרים ⇒ סט-חדרים לכל לילה
  const whole: boolean[][] = units.map(() => filled<boolean>(D, false));
  const rooms: Array<Array<Set<string> | null>> = units.map(() => filled<Set<string> | null>(D, null));
  const dayIdx = (iso: string): number => Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(w.start + 'T12:00:00Z')) / 86_400_000);
  for (const b of listOf<HostBooking>(ctx.db.hostBookings)) {
    if (!liveBooking(b) || b.checkOut <= w.start || b.checkIn > w.today) continue;
    const ui = idx.get(b.unitId);
    if (ui === undefined) continue;
    const u = units[ui]!;
    const from = Math.max(0, dayIdx(b.checkIn));
    const to = Math.min(D, dayIdx(b.checkOut)); // לילות [checkIn, checkOut)
    for (let i = from; i < to; i++) {
      if (!unitHasRooms(u) || !b.roomIds.length) whole[ui]![i] = true;
      else {
        const s = rooms[ui]![i] ?? new Set<string>();
        for (const r of b.roomIds) s.add(r);
        rooms[ui]![i] = s;
      }
    }
  }
  const word = hostTerms(ctx.config, ctx.db.ui?.hosting).units;
  const freeNights: Array<{ iso: string; free: number }> = [];
  for (let i = 0; i < D; i++) {
    let free = 0;
    for (let ui = 0; ui < units.length; ui++) {
      if (whole[ui]![i]) continue;
      const u = units[ui]!;
      const taken = rooms[ui]![i];
      if (!unitHasRooms(u) || !taken || u.subRooms.some((r) => !taken.has(r.id))) free++;
    }
    if (free) freeNights.push({ iso: addDaysIso(w.start, i), free });
  }
  freeNights.reverse();
  const k = freeNights.length;
  const examples: string[] = [];
  if (ctx.ask) {
    const r = ctx.ask('hosting.availability', swCtx(ctx), { fromIso: w.today, nights: 1 });
    if (r.ok) examples.push('הלילה הקו היה אומר: ' + (r.value.free.length ? r.value.free.length + ' ' + word + ' פנויות — ' + r.value.free.slice(0, 3).map((f) => f.name).join(', ') : 'אין ' + word + ' פנויות'));
  }
  for (const f of freeNights) {
    if (examples.length >= MAX_EXAMPLES) break;
    examples.push(dm(f.iso) + ' · ' + f.free + ' ' + word + ' פנויות');
  }
  return {
    count: k,
    text: k
      ? was(k, false) + ' ' + n(k, 'לילה אחד', 'לילות') + (k === 1 ? ' שבו' : ' שבהם') + ' לפחות אחת מה' + word + ' הייתה פנויה. מתקשר לקו שהיה בוחר "בדיקת יחידת אירוח פנויה" היה שומע אילו ' + word + ' פנויות — בלי מחירים ובלי שמות אורחים.'
      : 'לא היה אף לילה שבו אחת מה' + word + ' הייתה פנויה — הקו היה עונה שאין מקום.',
    examples,
  };
};

/** לוח-הבקרה בשימוש: יש לארגון יחידה או הזמנה. בלי אירוח בפועל — אין "מה היה קורה" בלוח שאף אחד לא פותח ⇒ null. */
const hostsAnything = (db: Db): boolean => listOf(db.hostUnits).length > 0 || listOf(db.hostBookings).length > 0;

/** שורת-השבת ⇒ תקציר-היום בלוח-הבקרה: ימים שבהם parnasa.shabbat החזיר הדלקת-נרות או צאת-שבת (כמו shabbatLines). בלי ask ⇒ null. */
const dashFromZmanim: ImpactMeasure = (w, ctx) => {
  const ask = ctx.ask;
  if (!ask || !hostsAnything(ctx.db)) return null;
  const days: Array<{ iso: string; candle: string; end: string }> = [];
  for (let i = w.days - 1; i >= 0; i--) {
    const iso = addDaysIso(w.start, i);
    // אמצע-היום בישראל (09:00Z ≈ 11:00–12:00) — כמו מי שפותח את לוח-הבקרה בבוקר
    const r = ask('parnasa.shabbat', swCtx(ctx, Date.parse(iso + 'T09:00:00Z')), {});
    if (!r.ok) return null;
    if (r.value.candle || r.value.end) days.push({ iso, candle: r.value.candle, end: r.value.end });
  }
  const k = days.length;
  return {
    count: k,
    text: k
      ? was(k, false) + ' ' + n(k, 'יום אחד', 'ימים') + (k === 1 ? ' שבו' : ' שבהם') + ' כרטיס "☀ תקציר היום" בלוח הבקרה היה מציג שורת שבת (הדלקת נרות וצאת השבת) לצד שורות האירוח.'
      : 'לוח הקהילה לא החזיר זמני שבת לאף יום, ולכן החיבור עוד לא היה משנה דבר.',
    examples: days.slice(0, MAX_EXAMPLES).map((d) => dm(d.iso) + ' · ' + [d.candle ? 'הדלקת נרות ' + d.candle : '', d.end ? 'צאת השבת ' + d.end : ''].filter(Boolean).join(', ')),
  };
};

/** שורת-המניין ⇒ תקציר-היום בלוח-הבקרה: ימים בחלון עם מניין אחד לפחות בלוח (בבוקר התקציר היה מציג "המניין הבא"). בלי ask ⇒ null. */
const dashFromBoard: ImpactMeasure = (w, ctx) => {
  const ask = ctx.ask;
  if (!ask || !hostsAnything(ctx.db)) return null;
  const per = new Map<string, { count: number; first: string }>();
  const sc = swCtx(ctx);
  for (let i = 0; i < w.days; i += 14) {
    const r = ask('parnasa.minyanim', sc, { fromIso: addDaysIso(w.start, i), days: Math.min(14, w.days - i) });
    if (!r.ok) return null;
    for (const m of r.value.minyanim) {
      if (!inWin(w, m.iso)) continue;
      const cur = per.get(m.iso);
      if (!cur) per.set(m.iso, { count: 1, first: m.prayer + ' ' + m.time + ' · ' + m.shul });
      else per.set(m.iso, { count: cur.count + 1, first: cur.first });
    }
  }
  const isos = [...per.keys()].sort().reverse();
  const k = isos.length;
  return {
    count: k,
    text: k
      ? was(k, false) + ' ' + n(k, 'יום אחד', 'ימים') + ' עם מניין בלוח הקהילה. ' + (k === 1 ? 'בו' : 'בכל אחד מהם') + ' כרטיס "☀ תקציר היום" בלוח הבקרה היה מציג את "המניין הבא" (עד המניין האחרון של היום).'
      : 'לא היה אף יום עם מניין בלוח הקהילה, ולכן החיבור עוד לא היה משנה דבר.',
    examples: isos.slice(0, MAX_EXAMPLES).map((iso) => dm(iso) + ' · ' + per.get(iso)!.first),
  };
};

/**
 * שורות-האירוח ⇒ תקציר-היום בלשונית-האישורים: ימים בחלון עם הגעה, עזיבה או אורח בשהייה (ועם תחזוקה דלוקה — גם קריאה
 * שטופלה באותו יום). שורת-האירוח עצמה מופיעה גם ביום ריק ("הגעות היום: 0") — לכן סופרים רק ימים שבהם היה בה תוכן.
 * מחושב מהנתונים (hosting.today עונה רק על "היום", ו"בשהייה" שלו הוא הסטטוס הנוכחי).
 */
const careFromHosting: ImpactMeasure = (w, ctx) => {
  const bookings = listOf<HostBooking>(ctx.db.hostBookings).filter(liveBooking);
  const maint = featureOn(ctx.config, 'hosting.maint');
  const faults = maint ? faultsOf(ctx.db) : [];
  if (!bookings.length && !faults.length) return null;
  const D = w.days;
  const arr = filled<number>(D, 0);
  const dep = filled<number>(D, 0);
  const stay = filled<number>(D, 0);
  const fixed = filled<number>(D, 0);
  const dayIdx = (iso: string): number => Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(w.start + 'T12:00:00Z')) / 86_400_000);
  for (const b of bookings) {
    if (b.checkOut < w.start || b.checkIn > w.today) continue;
    const a = dayIdx(b.checkIn);
    const o = dayIdx(b.checkOut);
    if (a >= 0 && a < D) arr[a]!++;
    if (o >= 0 && o < D) dep[o]!++;
    for (let i = Math.max(0, a + 1); i < Math.min(D, o); i++) stay[i]!++;
  }
  for (const f of faults) {
    if (f.status !== 'done') continue;
    const iso = isoOfStamp(f.updatedAt);
    if (iso && inWin(w, iso)) fixed[dayIdx(iso)]!++;
  }
  const active: number[] = [];
  for (let i = D - 1; i >= 0; i--) if (arr[i]! || dep[i]! || stay[i]! || fixed[i]!) active.push(i);
  const k = active.length;
  return {
    count: k,
    text: k
      ? was(k, false) + ' ' + n(k, 'יום אחד', 'ימים') + ' עם הגעות, עזיבות או אורחים בשהייה' + (maint ? ' (או קריאה שטופלה)' : '') + '. ' + (k === 1 ? 'בו' : 'בכל אחד מהם') + ' כרטיס "☀ תקציר היום" בלשונית האישורים היה מציג את שורות האירוח.'
      : 'לא היה אף יום עם הגעות, עזיבות או אורחים בשהייה, ולכן החיבור עוד לא היה משנה דבר.',
    examples: active.slice(0, MAX_EXAMPLES).map((i) =>
      [
        dm(addDaysIso(w.start, i)),
        arr[i] ? n(arr[i]!, 'הגעה אחת', 'הגעות') : '',
        dep[i] ? n(dep[i]!, 'עזיבה אחת', 'עזיבות') : '',
        stay[i] ? n(stay[i]!, 'הזמנה אחת', 'הזמנות') + ' בשהייה' : '',
        fixed[i] ? n(fixed[i]!, 'קריאה שטופלה', 'קריאות שטופלו') : '',
      ]
        .filter(Boolean)
        .join(' · '),
    ),
  };
};

/** מפתח-הרישום: "המקבל|המחבר". */
export function impactKey(needer: string, plug: string): string {
  return needer + '|' + plug;
}

/**
 * הרישום — לפי המקבל והמחבר (חיבור חדש = שורה אחת). מדד שתלוי בנותן מקבל את מזהה-הנותן (`giver`); מקבל אחד עם שני
 * נותנים באותו מחבר (תקציר-היום בלוח-הבקרה) מנותב לפיו.
 */
export const IMPACT_MEASURES: Readonly<Record<string, ImpactMeasure>> = {
  [impactKey('host.stay', 'times.shabbat')]: stayShabbat,
  [impactKey('host.stay', 'times.prayers')]: stayPrayers,
  [impactKey('host.shabbat', 'times.shabbat')]: tabShabbat,
  [impactKey('host.shabbat', 'times.prayers')]: tabPrayers,
  [impactKey('host.maint', 'pro.match')]: maintPro,
  [impactKey('host.clean', 'pro.match')]: cleanPro,
  [impactKey('host.maint', 'emergency')]: maintEmergency,
  [impactKey('pr.phone', 'availability')]: phoneAvailability,
  [impactKey('host.dash', 'day.summary')]: (w, ctx, giver) => (giver === 'pr.zmanim' ? dashFromZmanim(w, ctx, giver) : giver === 'pr.board' ? dashFromBoard(w, ctx, giver) : null),
  [impactKey('pr.care', 'day.summary')]: (w, ctx, giver) => (giver === 'host.dash' ? careFromHosting(w, ctx, giver) : null),
};

/* ═══════════════ ה-API ═══════════════ */

/** החלק בארגז של הארגון — אותם שערים של catalogFor (מודול + תת-דגל/דגל-הכלי). */
function partOn(p: Part, config: OrgConfig): boolean {
  return moduleOn(config, p.module) && featureOn(config, p.flag ?? p.module);
}

const clampDays = (d: unknown): number => (typeof d === 'number' && Number.isFinite(d) ? Math.min(IMPACT_MAX_DAYS, Math.max(1, Math.floor(d))) : IMPACT_DEFAULT_DAYS);

/** "מה היה קורה" לחיבור אחד ב-`days` הימים האחרונים (ברירה 30). null = אין מה לומר בכנות. לעולם לא זורק. */
export function impactOf(linkKey: string, ctx: ImpactCtx, days?: number): Impact | null {
  try {
    if (!ctx || typeof ctx !== 'object' || !ctx.db || !ctx.config) return null;
    const link = typeof linkKey === 'string' ? parseLink(linkKey) : undefined;
    if (!link) return null;
    const measure = IMPACT_MEASURES[impactKey(link.needer, link.plug)];
    if (!measure) return null;
    const g = partById(link.giver);
    const nd = partById(link.needer);
    if (!g || !nd || !partOn(g, ctx.config) || !partOn(nd, ctx.config)) return null;
    const d = clampDays(days);
    const w = windowOf(ctx.nowMs, d);
    if (!w) return null;
    const m = measure(w, ctx, link.giver);
    if (!m) return null;
    return { key: linkKey, headline: periodOf(d) + ' ' + m.text, count: m.count, examples: (m.examples ?? []).slice(0, MAX_EXAMPLES), days: d };
  } catch {
    return null;
  }
}

/** אותו דבר לרשימה — רק חיבורים שיש להם מה לומר, בסדר הרשימה, בלי כפילויות. */
export function impactsFor(linkKeys: readonly string[], ctx: ImpactCtx, days?: number): Impact[] {
  const out: Impact[] = [];
  if (!Array.isArray(linkKeys)) return out;
  const seen = new Set<string>();
  for (const k of linkKeys) {
    if (typeof k !== 'string' || seen.has(k)) continue;
    seen.add(k);
    const im = impactOf(k, ctx, days);
    if (im) out.push(im);
  }
  return out;
}
