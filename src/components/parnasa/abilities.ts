/**
 * 📒 פרנסה׳לע — ספק המרכזייה (BUILD-ORDER-SWITCHBOARD-2026-10-13): מה המדריך ולוח-הקהילה עושים בשביל כלים אחרים.
 *
 *   · parnasa.findPro   — "מי יכול לעזור עם זה?": בעלי-מקצוע **מאושרים** בתחום שהובן, עם פתוח-עכשיו וקוד-חיוג.
 *     **אותו כלל של הקו** (phoneLine.resolveSpeech): אותו ניקוי-מספרים, אותו דירוג (searchListings), אותו "התחום שהובן
 *     בוודאות קובע" (ציון ≥ SURE_CONCEPT), אותו כלל קוד-חיוג (כפול ⇒ אין קוד) — כך האירוח והקו מגיעים לאותו בעל-מקצוע.
 *   · parnasa.shabbat   — זמני השבת של הקהילה (הנוכחית/הקרובה, או השבת של תאריך נתון — שהייה).
 *   · parnasa.minyanim  — מניינים מאושרים לפי יום (תפילה · שעה · בית-כנסת · כתובת) + המניין הבא.
 *   · parnasa.emergency — מספרי-החירום של הלוח (או ברירות-המחדל).
 * טהור (בלי store/DOM/Date.now — ctx.nowMs מוזרק; שעון-הקהילה מהגדרות-המיקום), קריאה-בלבד מ-prListings · prPosts ·
 * ui.parnasa. 🛡 בקשות-תושבים לא נקראות כלל (אין פרטי-מבקש); רק עסקים מאושרים ומודעות מאושרות-ופעילות; אין כסף.
 * נטען בעצלות דרך הרישום (lib/switchboard/registry) — לא בבנדל-הראשי.
 */
import { ability, type NoInput, type SwitchCtx } from '../../lib/switchboard/contract';
import { termOf } from '../../lib/config';
import { categoryOf, dialCodeHolders, dialCodeOf, groupByCategory, listingStatus, PR_CONCEPTS, searchListings, uniqueGates } from './lib';
import {
  addDaysIso,
  clockAt,
  dowOfIso,
  emergencyNumbers,
  isIsoDate,
  locNote,
  makeClosureFn,
  PR_DAY_NAMES,
  resolveMinyanim,
  resolveZmanimLoc,
  shabbatOf,
  type PrClock,
  type PrZmanimLoc,
} from './zmanimBoard';
import type { PrListing } from '../../types/domain';

/** ציון-מושג "ודאי" — **אותו סף** של SURE_CONCEPT ב-phoneLine.ts (נעול בבדיקה): מתחתיו המושג לא קובע את התחום. */
export const FIND_SURE_CONCEPT = 2.2;

const locOf = (ctx: SwitchCtx): PrZmanimLoc => resolveZmanimLoc(ctx.db.ui?.parnasa?.zmanim);

/** "פרנסה׳לע של {קהילה}" — שם-הקו/המותג (termOf). */
function brandOf(ctx: SwitchCtx): string {
  const name = termOf(ctx.config, 'nav.parnasa', 'פרנסה׳לע');
  const c = String(ctx.db.ui?.parnasa?.communityName ?? '').trim();
  return c ? name + ' של ' + c : name;
}

const ddmm = (iso: string): string => (isIsoDate(iso) ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '');
const clampInt = (v: unknown, min: number, max: number, dflt: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.floor(v))) : dflt;

/* ═══════════════ parnasa.findPro ═══════════════ */

export interface FindProInput {
  /** הצורך במילים (תיאור-תקלה, "נזילה בכיור", "אינסטלטור"). */
  readonly text: string;
  /** כמה להחזיר (1–12, ברירה 3). */
  readonly limit?: number;
  /** רק פתוחים עכשיו (שעון-הקהילה, כולל סגירת שבת/יו״ט). */
  readonly openNow?: boolean;
}

/** בעל-מקצוע בתשובה — מה שצריך כדי להתקשר (בלי הערה-פנימית, בלי המלצות, בלי מחירון). */
export interface ProCard {
  readonly id: string;
  readonly name: string;
  /** במה עובדים (title). */
  readonly trade: string;
  /** שם-השער הקצר + אייקון. */
  readonly category: string;
  readonly icon: string;
  readonly area: string;
  /** קוד-החיוג בקו — רק תקין וייחודי (כפול ⇒ '' — הקו לא עונה לו). */
  readonly dialCode: string;
  readonly phone: string;
  readonly whatsapp: string;
  readonly open: boolean;
  /** "פנוי עכשיו · עד 19:00" / "סגור עכשיו · חוזר מחר ב־08:00" / "חוזר במוצ״ש" / '' (שעות לא ידועות). */
  readonly status: string;
  readonly emergency: boolean;
}

export interface FindProOutput {
  /** הצורך כפי שנשאל. */
  readonly query: string;
  /** התחום שהובן ('' — לא זוהה בוודאות). */
  readonly concept: string;
  /** שם-הקו של הקהילה. */
  readonly brand: string;
  /** נוסח-הפתיחה לוואטסאפ ("שלום, הגעתי אליך דרך …. צריך עזרה: …") — כמו בכרטיס-העסק. */
  readonly waIntro: string;
  readonly pros: readonly ProCard[];
  /** כמה התאימו בתחום (לפני סינון פתוח-עכשיו וחיתוך). */
  readonly total: number;
  /** מתוכם — פתוחים עכשיו. */
  readonly openTotal: number;
}

/** הנוסח של כרטיס-העסק (ListingCard.waIntro) — נעול בבדיקה כזהה. */
export function proWaIntro(brand: string, need: string): string {
  const q = need.trim();
  return 'שלום, הגעתי אליך דרך ' + brand + '.' + (q ? ' צריך עזרה: ' + q : '');
}

function proCard(l: PrListing, clock: PrClock, closureAt: ReturnType<typeof makeClosureFn>, code: string): ProCard {
  const st = listingStatus(l, clock, closureAt);
  const cat = categoryOf(l.category);
  return {
    id: String(l.id),
    name: l.name,
    trade: l.title,
    category: cat.short,
    icon: cat.icon,
    area: l.area || l.city,
    dialCode: code,
    phone: l.phone || l.phone2,
    whatsapp: l.whatsapp,
    open: st?.k === 'open',
    status: st ? st.t + (st.sub ? ' · ' + st.sub : '') : '',
    emergency: l.emergency === true,
  };
}

function findPro(ctx: SwitchCtx, input: FindProInput): FindProOutput {
  const text = String(input?.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
  const loc = locOf(ctx);
  const clock = clockAt(ctx.nowMs, loc.tz);
  const closureAt = makeClosureFn(loc);
  const listings = Array.isArray(ctx.db.prListings) ? ctx.db.prListings : [];
  // אותו ניקוי של הקו: מספר בתוך משפט (כתובת, כמות) לא "מוצא" עסק — רק טלפון שלם (≥7 ספרות) נשאר לחיפוש
  const q = text.replace(/(\d)[\s\-–.]+(?=\d)/g, '$1').replace(/\d+/g, (d) => (d.length >= 7 ? d : ' '));
  const res = searchListings(q, listings, { todayIso: clock.iso, clock, closureAt }, 500);
  const top = res.analysis.cons[0];
  const lead = top && top.s >= FIND_SURE_CONCEPT ? PR_CONCEPTS.find((c) => c.k === top.k) : undefined;
  const inDomain = res.hits.filter((h) => !lead || h.via === lead.l || categoryOf(h.listing.category).key === lead.c);
  // קוד-חיוג: אותו כלל של הקו ושל "דורש טיפול" (dialCodeHolders על השערים המאושרים) — כפול ⇒ אין קוד
  const holders = dialCodeHolders(uniqueGates(groupByCategory(listings, clock.iso)));
  const codeOf = (l: PrListing): string => {
    const c = dialCodeOf(l);
    return c && holders.get(c)?.length === 1 ? c : '';
  };
  const cards = inDomain.map((h) => proCard(h.listing, clock, closureAt, codeOf(h.listing)));
  const openCards = cards.filter((c) => c.open);
  const limit = clampInt(input?.limit, 1, 12, 3);
  const brand = brandOf(ctx);
  return {
    query: text,
    concept: lead?.l ?? '',
    brand,
    waIntro: proWaIntro(brand, text),
    pros: (input?.openNow === true ? openCards : cards).slice(0, limit),
    total: cards.length,
    openTotal: openCards.length,
  };
}

/* ═══════════════ parnasa.shabbat ═══════════════ */

export interface ShabbatInput {
  /** תאריך בשבוע של השבת המבוקשת (שהייה: יום-השישי שלה) — חסר ⇒ השבת הנוכחית/הקרובה לפי הרגע. */
  readonly atIso?: string;
}

export interface ShabbatOutput {
  readonly friIso: string;
  readonly satIso: string;
  /** הדלקת נרות (ערב שבת). */
  readonly candle: string;
  /** צאת השבת. */
  readonly end: string;
  readonly rabbeinuTam: string;
  /** התאריך העברי של השבת. */
  readonly hebDate: string;
  /** השבת היא גם יו״ט — שם החג ('' אם לא). */
  readonly holiday: string;
  /** שבת מברכים — החודש הבא ('' אם לא). */
  readonly mevarchim: string;
  /** הרגע בתוך השבת הזו (מהדלקה עד צאת). */
  readonly current: boolean;
  /** "לפי אופק …". */
  readonly loc: string;
  readonly brand: string;
}

function shabbat(ctx: SwitchCtx, input: ShabbatInput): ShabbatOutput {
  const loc = locOf(ctx);
  const at = input?.atIso;
  // תאריך נתון ⇒ צהרי-אותו-יום (שבת ⇒ אותה שבת; שישי ⇒ מחר; אחרת — הקרובה); אחרת — הרגע בשעון-הקהילה
  const clock: PrClock = typeof at === 'string' && isIsoDate(at) ? { iso: at, hhmm: '12:00', dow: dowOfIso(at), ms: ctx.nowMs } : clockAt(ctx.nowMs, loc.tz);
  const sh = shabbatOf(clock, loc);
  return {
    friIso: sh.friIso,
    satIso: sh.satIso,
    candle: sh.candle,
    end: sh.end,
    rabbeinuTam: sh.rabbeinuTam,
    hebDate: sh.hebDate,
    holiday: sh.holiday,
    mevarchim: sh.mevarchim,
    current: sh.current,
    loc: locNote(loc),
    brand: brandOf(ctx),
  };
}

/** שורת-התקציר: "🕯 שבת: הדלקת נרות היום ב־17:43 · צאת השבת 18:41" (בשבת עצמה — "שבת שלום · צאת השבת …"). */
function shabbatLines(out: ShabbatOutput, ctx: SwitchCtx): string[] {
  if (!out.candle && !out.end) return [];
  const head = '🕯 שבת' + (out.holiday ? ' · ' + out.holiday : '');
  if (out.current) return [head + ' שלום' + (out.end ? ' · צאת השבת ' + out.end : '') + (out.rabbeinuTam ? ' (ר״ת ' + out.rabbeinuTam + ')' : '')];
  const today = clockAt(ctx.nowMs, locOf(ctx).tz).iso;
  const when = today === out.friIso ? 'היום' : addDaysIso(today, 1) === out.friIso ? 'מחר' : 'ביום שישי ' + ddmm(out.friIso);
  return [head + ': ' + (out.candle ? 'הדלקת נרות ' + when + ' ב־' + out.candle : '') + (out.candle && out.end ? ' · ' : '') + (out.end ? 'צאת השבת ' + out.end : '')];
}

/* ═══════════════ parnasa.minyanim ═══════════════ */

export interface MinyanimInput {
  /** היום הראשון — חסר ⇒ היום בשעון-הקהילה. */
  readonly fromIso?: string;
  /** כמה ימים (1–14, ברירה 1). */
  readonly days?: number;
}

export interface MinyanEntry {
  readonly iso: string;
  /** "שישי" / "שבת" … */
  readonly dayName: string;
  readonly prayer: string;
  readonly time: string;
  readonly shul: string;
  /** כתובת/מקום בית-הכנסת. */
  readonly place: string;
}

export interface MinyanimOutput {
  readonly fromIso: string;
  readonly days: number;
  /** לפי יום ואז לפי שעה. */
  readonly minyanim: readonly MinyanEntry[];
  /** המניין הבא היום (מהרגע) — null כשאין עוד היום / כשהטווח לא כולל את היום. */
  readonly next: MinyanEntry | null;
  readonly loc: string;
}

function minyanim(ctx: SwitchCtx, input: MinyanimInput): MinyanimOutput {
  const loc = locOf(ctx);
  const clock = clockAt(ctx.nowMs, loc.tz);
  const from = typeof input?.fromIso === 'string' && isIsoDate(input.fromIso) ? input.fromIso : clock.iso;
  const days = clampInt(input?.days, 1, 14, 1);
  const posts = Array.isArray(ctx.db.prPosts) ? ctx.db.prPosts : [];
  const list: MinyanEntry[] = [];
  for (let i = 0; i < days; i++) {
    const iso = addDaysIso(from, i);
    for (const m of resolveMinyanim(posts, iso, loc)) {
      list.push({ iso, dayName: PR_DAY_NAMES[dowOfIso(iso)] ?? '', prayer: m.prayer, time: m.time, shul: m.shul, place: m.place });
    }
  }
  const next = list.find((m) => m.iso === clock.iso && m.time >= clock.hhmm) ?? null;
  return { fromIso: from, days, minyanim: list, next, loc: locNote(loc) };
}

/* ═══════════════ parnasa.emergency ═══════════════ */

export interface EmergencyOutput {
  readonly numbers: ReadonlyArray<{ readonly label: string; readonly phone: string; readonly note: string }>;
}

function emergency(ctx: SwitchCtx): EmergencyOutput {
  const loc = locOf(ctx);
  const posts = Array.isArray(ctx.db.prPosts) ? ctx.db.prPosts : [];
  return { numbers: emergencyNumbers(posts, clockAt(ctx.nowMs, loc.tz).iso) };
}

/* ═══════════════ היכולות ═══════════════ */

export const abilities = {
  'parnasa.findPro': ability<FindProInput, FindProOutput>({ run: findPro }),
  'parnasa.shabbat': ability<ShabbatInput, ShabbatOutput>({ run: shabbat, today: { input: {}, lines: shabbatLines } }),
  'parnasa.minyanim': ability<MinyanimInput, MinyanimOutput>({
    run: minyanim,
    today: { input: {}, lines: (out) => (out.next ? ['🙏 המניין הבא: ' + out.next.prayer + ' ' + out.next.time + ' · ' + out.next.shul] : []) },
  }),
  'parnasa.emergency': ability<NoInput, EmergencyOutput>({ run: emergency }),
};
