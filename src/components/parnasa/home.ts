/**
 * 📒 פרנסה׳לע — מנוע-הבית הטהור (עיצוב 2): מה שהמקור חישב סביב "מה צריך?" — עונות-השנה העברית (6 מטבעות-
 * עונה + חיפושים נפוצים, parnasale.html L3266–3294), המהדורות (סוכות · חנוכה · פורים · פסח), הברכה בראש (בוקר טוב …
 * שבת שלום · שבוע טוב, שקיעה/הדלקת-נרות/צאת השבת, צ'יפ-התקופה), "החודש בקהילה", מומלצי-השבוע בסבב-יומי,
 * "חדש בפרנסה׳לע", "מבקשים עכשיו", שורת-הסיכום, חיוג-מהיר, אייקון-המקצוע וצבע-הפלטה. בלי store/DOM/Date.now —
 * הרגע מוזרק (PrClock), תמיד באזור-הזמן של הקהילה. הנוסחים מילה במילה מהמקור.
 */
import type { IsoDate, PrAd, PrListing, PrRequest } from '../../types/domain';
import { categoryOf, inMinsText, isFeatured, openNow, prNorm, routeRequest, type PrSearchCtx, type PrSearchHit } from './lib';
import { addDaysIso, clockAt, dayTimes, hmToMin, type PrClock, type PrClosure, type PrZmanimLoc } from './zmanimBoard';
import { periodOf } from './shell';

/* ═══════════════ עונות-השנה ═══════════════ */

/** משבצת-עונה: תווית · שאילתה · אייקון. */
export interface PnTile {
  l: string;
  q: string;
  i: string;
}
const T = (l: string, q: string | 0, i: string): PnTile => ({ l, q: q || l, i });

export type PnSeasonKey = 'sukkos' | 'winter' | 'chanuka' | 'purim' | 'pesach' | 'spring' | 'summer' | 'elul' | 'any';

export const PN_SEASONS: Readonly<Record<PnSeasonKey, { tiles: PnTile[]; pop: string[] }>> = {
  sukkos: { tiles: [T('בניית סוכה', 'סוכה', 'sukkah'), T('סכך וקישוטים', 'סכך', 'leaf'), T('ארבעת המינים', 0, 'lulav'), T('חשמל לסוכה', 'חשמלאי', 'bolt'), T('הובלה', 0, 'truck'), T('קייטרינג', 0, 'cloche')], pop: ['אתרוג', 'בניית סוכה', 'חשמלאי', 'נזילה', 'מלמד'] },
  winter: { tiles: [T('נזילה ודוד', 'נזילה', 'drop'), T('איטום', 'איטום', 'roof'), T('חימום', 'חימום', 'heat'), T('שיעורים', 0, 'book'), T('מלמד', 0, 'quill'), T('הובלה', 0, 'truck')], pop: ['דוד שמש', 'איטום גג', 'שיעורי עזר', 'מחשב', 'רואה חשבון'] },
  chanuka: { tiles: [T('חנוכיות', 'חנוכיה', 'menorah'), T('סופגניות', 'סופגניות', 'donut'), T('מסיבת חנוכה', 'מסיבה', 'spark'), T('נזילה ודוד', 'נזילה', 'drop'), T('חימום', 0, 'heat'), T('שיעורים', 0, 'book')], pop: ['חנוכיה', 'סופגניות', 'צלם', 'נזילה', 'מלמד'] },
  purim: { tiles: [T('משלוחי מנות', 0, 'gift'), T('תחפושות', 0, 'mask'), T('סעודת פורים', 0, 'cloche'), T('קריאת מגילה', 'מגילה', 'scroll'), T('צילום', 'צלם', 'camera'), T('ניקיון לפסח', 0, 'clean')], pop: ['משלוחי מנות', 'תחפושות', 'קייטרינג', 'צלם', 'עוגות'] },
  pesach: { tiles: [T('ניקיון לפסח', 0, 'clean'), T('צבע', 'צבע', 'roller'), T('הגעלת כלים', 0, 'pot'), T('הובלה', 0, 'truck'), T('תיקוני חשמל', 'חשמל', 'bolt'), T('קייטרינג', 0, 'cloche')], pop: ['ניקיון לפסח', 'צבעי', 'הגעלת כלים', 'חשמלאי', 'הובלה קטנה'] },
  spring: { tiles: [T('חתונה', 0, 'ring'), T('צלם', 0, 'camera'), T('תזמורת', 0, 'music'), T('קייטרינג', 0, 'cloche'), T('פאות', 0, 'scissors'), T('מזגן', 0, 'snow')], pop: ['אולם', 'הדרכת כלות', 'חליפה', 'מזגן', 'שיפוצים'] },
  summer: { tiles: [T('מזגן', 0, 'snow'), T('הסעות', 0, 'bus'), T('קייטנות', 'קייטנה', 'tent'), T('צבע', 'צבע', 'roller'), T('ניקיון', 0, 'clean'), T('הובלה', 0, 'truck')], pop: ['מילוי גז', 'מונית', 'קייטנה', 'שיפוצים', 'מעבר דירה'] },
  elul: { tiles: [T('בדיקת מזוזות', 0, 'mezuzah'), T('תפילין', 'תפילין', 'scroll'), T('מלמד לזמן חורף', 'מלמד', 'quill'), T('שיעורים', 0, 'book'), T('הסעות', 0, 'bus'), T('צבע', 'צבע', 'roller')], pop: ['בדיקת מזוזות', 'מלמד', 'שיעורי עזר', 'הסעות', 'צבעי'] },
  any: { tiles: [T('נזילה', 0, 'drop'), T('חשמל', 0, 'bolt'), T('מזגן', 0, 'snow'), T('שיעורים', 0, 'book'), T('הובלה', 0, 'truck'), T('שמחה', 0, 'spark')], pop: ['נזילה', 'חשמלאי', 'מלמד', 'הובלה קטנה', 'רואה חשבון'] },
};

export interface PnSeason {
  k: PnSeasonKey;
  /** כותרת-העונה ("לקראת סוכות" · "ימי החורף" …). */
  t: string;
  tiles: PnTile[];
  pop: string[];
}

/** העונה לפי החודש/היום העבריים (season במקור; m: תשרי 1 … אלול 12, אדר א׳ 5.5). */
export function seasonOf(m: number, x: number): PnSeason {
  let k: PnSeasonKey = 'any';
  let t = 'מה צריך עכשיו';
  if ((m === 12 && x >= 20) || (m === 1 && x <= 21)) {
    k = 'sukkos';
    t = m === 1 && x >= 15 ? 'חג הסוכות' : 'לקראת סוכות';
  } else if ((m === 3 && x >= 10) || (m === 4 && x <= 2)) {
    k = 'chanuka';
    t = (m === 3 && x >= 25) || m === 4 ? 'ימי חנוכה' : 'לקראת חנוכה';
  } else if (m >= 1 && m <= 5.5) {
    k = 'winter';
    t = m === 1 ? 'אחרי החגים' : 'ימי החורף';
  } else if (m === 6 && x <= 14) {
    k = 'purim';
    t = x === 14 ? 'פורים' : 'לקראת פורים';
  } else if (m === 6 || (m === 7 && x <= 14)) {
    k = 'pesach';
    t = 'לקראת פסח';
  } else if (m >= 7 && m <= 9) {
    k = 'spring';
    t = 'עונת השמחות';
  } else if (m === 10 || m === 11) {
    k = 'summer';
    t = m === 11 && x >= 9 ? 'בין הזמנים' : 'ימי הקיץ';
  } else if (m === 12) {
    k = 'elul';
    t = 'חודש אלול';
  }
  return { k, t, ...PN_SEASONS[k] };
}

/** מהדורות-המטבעות: העונה בוחרת את המטבעה (מתכת · שוליים · שם · קונפטי). */
export type PnEdition = 'regular' | 'sukkot' | 'chanukah' | 'purim' | 'pesach';
export const PN_EDITIONS: Readonly<Record<PnEdition, { metal: 'gold' | 'silver'; rim: 'beads' | 'weave' | 'masks' | 'matzah'; name: string; confetti?: boolean }>> = {
  regular: { metal: 'gold', rim: 'beads', name: '' },
  sukkot: { metal: 'gold', rim: 'weave', name: 'מהדורת סוכות' },
  chanukah: { metal: 'silver', rim: 'beads', name: 'מהדורת חנוכה' },
  purim: { metal: 'gold', rim: 'masks', confetti: true, name: 'מהדורת פורים' },
  pesach: { metal: 'gold', rim: 'matzah', name: 'מהדורת פסח' },
};
const SEASON_ED: Partial<Record<PnSeasonKey, PnEdition>> = { sukkos: 'sukkot', chanuka: 'chanukah', purim: 'purim', pesach: 'pesach' };
export function editionOf(k: PnSeasonKey): PnEdition {
  return SEASON_ED[k] ?? 'regular';
}

/** פני-המטבע של משבצת (לפי האייקון, עם כמה פנים מיוחדות לחגים) ושל מקצוע (מטבעות-מיני). */
const COIN_OF: Readonly<Record<string, string>> = {
  sukkah: 'sukkah', leaf: 'schach', lulav: 'species', bolt: 'plug', truck: 'move', cloche: 'catering', drop: 'leak', roof: 'seal', heat: 'heat', book: 'study',
  quill: 'melamed', menorah: 'menorah', donut: 'donut', spark: 'cup', gift: 'basket', mask: 'mask', scroll: 'megillah', camera: 'camera', clean: 'clean',
  roller: 'paint', pot: 'kasher', ring: 'ring', music: 'music', scissors: 'scissors', snow: 'ac', bus: 'bus', tent: 'tent', mezuzah: 'mezuzah',
};
const COIN_BY_LABEL: Readonly<Record<string, string>> = { 'חשמל לסוכה': 'light', 'מסיבת חנוכה': 'dreidel', תפילין: 'tefillin' };
export const coinOfTile = (t: PnTile): string => COIN_BY_LABEL[t.l] ?? COIN_OF[t.i] ?? 'other';
/** ('events' במירכאות — מפתח-השער "שמחות", לא הלוח-הראשי; סורק-הבידוד מחפש כתיבת events:) */
export const TRADE_COIN: Readonly<Record<string, string>> = {
  build: 'hammer', elec: 'plug', car: 'move', fin: 'calc', tech: 'laptop', edu: 'study', stam: 'quill', 'events': 'cup', health: 'health', fashion: 'scissors',
  home: 'clean', food: 'catering', realestate: 'house', trade: 'bag', other: 'other',
};

/* ═══════════════ אייקון-המקצוע · ראשי-תיבות · פלטה ═══════════════ */

const TRADE_IC: Readonly<Record<string, string>> = {
  build: 'hammer', elec: 'bolt', car: 'truck', fin: 'calc', tech: 'tech', edu: 'book', stam: 'quill', 'events': 'spark', health: 'health', fashion: 'shirt',
  home: 'clean', food: 'cloche', realestate: 'house', trade: 'bag', other: 'dots',
};
const TRADE_IC_RE: ReadonlyArray<readonly [RegExp, string]> = [
  [/צל(ם|ום)|וידאו/, 'camera'], [/קייטרינג|אוכל|מגשי/, 'cloche'], [/תזמורת|זמר|נגן|מוזיק/, 'music'], [/אינסטל|נזיל|סתימ|דוד/, 'drop'], [/מזגן|מיזוג/, 'snow'],
  [/הסע|אוטובוס|מיניבוס/, 'bus'], [/מלמד|גמרא|שיעור/, 'quill'], [/מזוז/, 'mezuzah'], [/חייט|תפיר/, 'scissors'], [/ניקיון|ניקוי/, 'clean'], [/גינון|גינה/, 'leaf'], [/חלות|עוג|מאפ/, 'donut'],
];
/** אייקון-הקו של העסק (tradeIc במקור): לפי המילים בשם/במקצוע, אחרת לפי השער. */
export function tradeIcon(l: Pick<PrListing, 'title' | 'name' | 'category'>): string {
  const t = (l.title || '') + ' ' + (l.name || '');
  for (const [re, n] of TRADE_IC_RE) if (re.test(t)) return n;
  return TRADE_IC[l.category] ?? 'spark';
}
/** שם קצר לחיוג-המהיר (shortName במקור). */
export function shortName(n: string): string {
  return String(n || '').replace(/^(ר׳|ר'|הרב|גב׳|גב'|מרת)\s+/, '').split(/\s+/)[0] || '';
}
/** שמונה הפלטות של המקור (PALS): מפתח · שם · צבע. */
export const PN_PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ['velvet', 'קטיפה', '#7a1830'], ['tekhelet', 'תכלת', '#1f5fa8'], ['emerald', 'אזמרגד', '#17744a'], ['midnight', 'חצות', '#2b3270'],
  ['olive', 'זית', '#66702a'], ['copper', 'נחושת', '#a4521f'], ['plum', 'שזיף', '#6f2a78'], ['slate', 'צפחה', '#4a5866'],
];
const PAL_C: Readonly<Record<string, string>> = Object.fromEntries(PN_PALETTES.map((p) => [p[0], p[2]]));
/** צבע-המדליון: הפלטה של העסק, אחרת צבע-השער. */
export function medalColor(l: Pick<PrListing, 'category'> & { palette?: string }): string {
  return (l.palette && PAL_C[l.palette]) || categoryOf(l.category).color;
}
/** הפלטה כמפתח תקין (חסר/זר ⇒ velvet, כמו המקור). */
export function paletteKey(p: unknown): string {
  return typeof p === 'string' && p in PAL_C ? p : 'velvet';
}

/* ═══════════════ הברכה בראש ═══════════════ */

/** "18:11" (בלי אפס מוביל — hhmm במקור). */
export const hm = (t: string): string => String(t || '').replace(/^0(\d)/, '$1');

export interface PnGreetNote {
  /** zm = זמן-היום (שקיעה/נרות/צאת) · per = תקופת-השנה. */
  kind: 'zm' | 'per';
  /** sun · candle (zm) או מפתח-התקופה (per). */
  cls: string;
  icon: 'sun' | 'candle' | '';
  text: string;
}
export interface PnGreeting {
  g: string;
  /** "ב׳ חשוון". */
  hd: string;
  notes: PnGreetNote[];
}

/** מוצאי-שבת: מצאת השבת ועד 6 בבוקר (motzOf במקור). */
export function isMotzei(clock: PrClock, loc: PrZmanimLoc): boolean {
  const now = hmToMin(clock.hhmm) ?? 0;
  if (clock.dow === 6) {
    const end = hmToMin(dayTimes(clock.iso, loc).tzeis);
    return end !== null && now >= end;
  }
  return clock.dow === 0 && now < 360;
}

/** הברכה (greetHTML במקור) — בוקר טוב … לילה טוב · שבת שלום · שבוע טוב; זמן-היום; צ'יפ-התקופה. */
export function greetingOf(clock: PrClock, loc: PrZmanimLoc, closure: PrClosure, heb: { m: number; d: number; dayMonth: string }): PnGreeting {
  const now = hmToMin(clock.hhmm) ?? 0;
  const h = Math.floor(now / 60);
  const calm = closure.closed;
  let g = h >= 5 && h < 11 ? 'בוקר טוב' : h >= 11 && h < 16 ? 'צהריים טובים' : h >= 16 && h < 22 ? 'ערב טוב' : 'לילה טוב';
  if (calm) g = closure.kind === 'yomtov' ? 'חג שמח' : 'שבת שלום';
  else if (isMotzei(clock, loc)) g = 'שבוע טוב';
  const notes: PnGreetNote[] = [];
  const t = dayTimes(clock.iso, loc);
  if (calm) {
    if (closure.endTime) notes.push({ kind: 'zm', cls: 'zm', icon: 'candle', text: (closure.kind === 'yomtov' ? 'צאת החג ' : 'צאת השבת ') + hm(closure.endTime) });
  } else {
    const candle = hmToMin(t.candle);
    const ss = hmToMin(t.sunset);
    if (clock.dow === 5 && candle !== null && now < candle) {
      const l = candle - now;
      notes.push({ kind: 'zm', cls: 'zm', icon: 'candle', text: 'הדלקת נרות ' + hm(t.candle) + (l <= 240 ? ' · בעוד ' + inMinsText(l * 60000) : '') });
    } else if (ss !== null && ss > now) {
      const left = ss - now;
      notes.push({ kind: 'zm', cls: 'zm sun', icon: 'sun', text: left <= 150 ? 'שקיעה בעוד ' + inMinsText(left * 60000) : 'שקיעה ' + hm(t.sunset) });
    }
    const pr = periodOf(heb.m, heb.d);
    if (pr.k) notes.push({ kind: 'per', cls: 'per ' + pr.k, icon: '', text: pr.t });
  }
  return { g, hd: heb.dayMonth, notes };
}

/* ═══════════════ מקטעי-הבית ═══════════════ */

const DAY = 864e5;
const ms = (iso: string | undefined): number => {
  const t = Date.parse(String(iso ?? ''));
  return Number.isFinite(t) ? t : 0;
};

/** "החודש בקהילה" (30 יום): בקשות שנמצאו (לא-שקטות) · פעמים שבעלי-מקצוע ענו · תודות. */
export function pulseOf(requests: readonly PrRequest[], listings: readonly PrListing[], nowMs: number): { found: number; answered: number; thanks: number } {
  const since = nowMs - 30 * DAY;
  let found = 0;
  let answered = 0;
  let thanks = 0;
  for (const r of requests) {
    if (r.status === 'closed' && !r.quiet && ms(r.closedAt || r.updatedAt) > since) found++;
    for (const x of Array.isArray(r.responses) ? r.responses : []) if (ms(x.at) > since) answered++;
  }
  for (const l of listings) for (const x of Array.isArray(l.recs) ? l.recs : []) if (ms(x.at) > since) thanks++;
  return { found, answered, thanks };
}

/** מומלצי-השבוע: מודגשים מאושרים לפי ההמלצות ואז השם (עד 8), בסבב-יומי — כל כרטיס משלם מגיע לראש. */
export function featuredRotation(listings: readonly PrListing[], todayIso: IsoDate, dayIndex: number): { shown: PrListing[]; total: number } {
  const feats = listings
    .filter((l) => l.status === 'approved' && isFeatured(l, todayIso))
    .sort((a, b) => (b.recs?.length ?? 0) - (a.recs?.length ?? 0) || a.name.localeCompare(b.name, 'he') || (a.id < b.id ? -1 : 1))
    .slice(0, 8);
  if (feats.length <= 3) return { shown: feats, total: feats.length };
  const d = ((dayIndex % feats.length) + feats.length) % feats.length;
  return { shown: [...feats.slice(d), ...feats.slice(0, d)].slice(0, 3), total: feats.length };
}

/** מספר-היום (לסבב-היומי) מתאריך ISO — יציב לכל הצופים באותו יום. */
export function dayIndexOf(iso: IsoDate): number {
  const t = Date.parse(iso + 'T12:00:00Z');
  return Number.isFinite(t) ? Math.floor(t / DAY) : 0;
}

/** "חדש בפרנסה׳לע": הצטרפו או עודכנו ב-60 הימים האחרונים (עד 6, החדש ראשון). */
export const PN_NEW_DAYS = 60;
export function newJoiners(listings: readonly PrListing[], nowMs: number): Array<{ l: PrListing; t: number }> {
  return listings
    .filter((l) => l.status === 'approved')
    .map((l) => ({ l, t: Math.max(ms(l.updatedAt), ms(l.reviewedAt)) }))
    .filter((x) => x.t && nowMs - x.t < PN_NEW_DAYS * DAY)
    .sort((a, b) => b.t - a.t)
    .slice(0, 6);
}

/** "מבקשים עכשיו": עד 3 בקשות שכבר פתוחות לכל הקהילה (לא שקטות), הדחופות ואז החדשות ראשונות. */
export function askingNow(requests: readonly PrRequest[], listings: readonly PrListing[], nowMs: number): PrRequest[] {
  return requests
    .filter((r) => r.status !== 'closed' && !r.quiet && r.text.trim() && routeRequest(r, listings, nowMs).stage === 'all')
    .sort((a, b) => Number(isUrgentNow(b, nowMs)) - Number(isUrgentNow(a, nowMs)) || ms(b.createdAt) - ms(a.createdAt))
    .slice(0, 3);
}
/** דחופה (urgOf במקור): מסומנת או מתחילה ב"דחוף", ופתוחה פחות מ-48 שעות. */
export function isUrgentNow(r: PrRequest, nowMs: number): boolean {
  return r.status !== 'closed' && (r.urgent || /^\s*דחוף/.test(r.text || '')) && nowMs - ms(r.createdAt) < 48 * 3600_000;
}

/** "שבוע טוב!" במוצאי-שבת: הבקשות שחיכו מהשבת (משעתיים לפני הדלקת-הנרות; לא שקטות, לא רק-לעסקים). null = לא מוצאי-שבת. */
export function weekWaiting(requests: readonly PrRequest[], listings: readonly PrListing[], clock: PrClock, loc: PrZmanimLoc, nowMs: number): PrRequest[] | null {
  if (!isMotzei(clock, loc)) return null;
  const fri = addDaysIso(clock.iso, clock.dow === 6 ? -1 : -2);
  const from = (hmToMin(dayTimes(fri, loc).candle) ?? 18 * 60) - 120;
  return requests.filter((r) => {
    const at = ms(r.createdAt);
    if (r.status === 'closed' || r.quiet || !at || at > nowMs) return false;
    const c = clockAt(at, loc.tz);
    const after = c.iso > fri || (c.iso === fri && (hmToMin(c.hhmm) ?? 0) >= from);
    return after && routeRequest(r, listings, nowMs).stage !== 'biz';
  });
}

/** שורת-הסיכום: בעלי-מקצוע מאושרים · תחומים · בקשות פתוחות (לא שקטות). */
export function homeStats(listings: readonly PrListing[], requests: readonly PrRequest[]): { n: number; cats: number; reqs: number } {
  const ok = listings.filter((l) => l.status === 'approved');
  return { n: ok.length, cats: new Set(ok.map((l) => categoryOf(l.category).key)).size, reqs: requests.filter((r) => r.status !== 'closed' && !r.quiet).length };
}

/** "כל התחומים": השערים לפי מספר-הכרטיסים (רבים ראשונים), ואז סדר-המקור. */
export function tradeRail(listings: readonly PrListing[], order: readonly string[]): Array<{ k: string; n: number }> {
  const cnt = new Map<string, number>();
  for (const l of listings) if (l.status === 'approved') cnt.set(categoryOf(l.category).key, (cnt.get(categoryOf(l.category).key) ?? 0) + 1);
  return [...order].sort((a, b) => (cnt.get(b) ?? 0) - (cnt.get(a) ?? 0) || order.indexOf(a) - order.indexOf(b)).map((k) => ({ k, n: cnt.get(k) ?? 0 }));
}

/** חיוג-מהיר: ★ ואז אחרונים (בלי כפילות), רק עסקים מאושרים שעדיין קיימים — עד 10. */
export function quickDialList(favs: readonly string[], recents: readonly string[], listings: readonly PrListing[]): PrListing[] {
  const by = new Map(listings.filter((l) => l.status === 'approved').map((l) => [l.id, l]));
  const keys = [...favs, ...recents.filter((k) => !favs.includes(k))].filter((k) => by.has(k)).slice(0, 10);
  return keys.map((k) => by.get(k) as PrListing);
}

/**
 * תוצאות מטבע-הפלטינה (pinRes במקור): כל עסקי השער, מודגשים ⇒ פתוחים ⇒ המלצות ⇒ שם; העסק של הנותן בחסות (לפי 9 ספרות
 * אחרונות של הטלפון או שם זהה) — מוצמד ראשון. matchId = null ⇒ אין לנותן עסק באלפון (מוצג כרטיס-חסות).
 */
export function pinnedHits(listings: readonly PrListing[], cat: string, sponsor: PrAd, ctx: PrSearchCtx): { hits: PrSearchHit[]; matchId: string | null } {
  const ok = listings.filter((l) => l.status === 'approved');
  const mk = (l: PrListing): PrSearchHit => ({
    listing: l,
    rel: 1,
    strong: true,
    loc: false,
    cov: 1,
    feat: isFeatured(l, ctx.todayIso) ? 1 : 0,
    open: ctx.clock && ctx.closureAt && openNow(l, ctx.clock, ctx.closureAt) ? 1 : 0,
    recs: Array.isArray(l.recs) ? l.recs.length : 0,
    via: '',
  });
  let out = ok.filter((l) => categoryOf(l.category).key === cat).map(mk);
  out.sort((x, y) => y.feat - x.feat || y.open - x.open || y.recs - x.recs || x.listing.name.localeCompare(y.listing.name, 'he'));
  const pk = (p: string): string => String(p || '').replace(/\D/g, '').slice(-9);
  const spk = pk(sponsor.phone);
  const nm = prNorm(sponsor.advertiser).trim();
  const m = ok.find((l) => (spk.length >= 9 && pk(l.phone) === spk) || (!!nm && prNorm(l.name).trim() === nm)) ?? null;
  if (m) {
    out = out.filter((h) => h.listing.id !== m.id);
    out.unshift(mk(m));
  }
  return { hits: out, matchId: m ? m.id : null };
}
