/**
 * 📒 פרנסה׳לע — המודל: קבועי-ה-enum וריפוי-הרשומות (BUILD-ORDER-PARNASA-2026-10-12, אשכול 2).
 *
 * קטן ותלוי-domain-בלבד במכוון: נטען מ-store/persist.ts (migrate) ומ-lib/cloud-merge.ts
 * (המיזוג-החי) — שניהם בבנדל-הראשי. המנוע הכבד (חיפוש/זמנים/חוברת) יושב ב-lib.ts /
 * zmanimBoard.ts / booklet.ts — בצ'אנק-העצל של המסך בלבד.
 *
 * עיקרון-הריפוי (כמו שאר ה-DB): רשומה תקינה חוזרת **באותה הפניה** (ביט-זהה — אין לולאת-הד
 * בסנכרון, אין כתיבה-חוזרת לענן); רק שדה שבור מתוקן:
 *   · מערך מקונן חסר/לא-מערך ⇒ [] · איבר לא-אובייקט בתוכו ⇒ נזרק.
 *   · enum זר ⇒ ברירת-מחדל **בטוחה** (fail-closed): סטטוס ⇒ 'pending', approved ⇒ false —
 *     לא מפרסמים מה שלא אושר.
 *   · שדה-טקסט חסר ⇒ '' (המנוע והממשק מניחים מחרוזת).
 *   · מפתח לא-מוכר **נשמר** (תאימות-קדימה: מכשיר בגרסה ישנה לא מוחק שדה שגרסה חדשה הוסיפה).
 * בידוד (הכרעה 4): אין כאן — ולא יהיה — שום נגיעה בקבלות/תרומות/מונים/לוח-ראשי.
 */
import type { Db, ParnasaPrefs, PrAd, PrListing, PrPost, PrPriceKey, PrRequest } from '../../types/domain';

/** 15 שערי-המקצוע — הסדר משמעותי (מספר-השער, סדר-העיון וסדר-החוברת). */
export const PR_CATEGORY_KEYS = [
  'build', 'elec', 'car', 'fin', 'tech', 'edu', 'stam', 'events',
  'health', 'fashion', 'home', 'food', 'realestate', 'trade', 'other',
] as const;
export type PrCategoryKey = (typeof PR_CATEGORY_KEYS)[number];

export const PR_STATUSES = ['pending', 'approved', 'rejected'] as const;
export const PR_SOURCES = ['owner', 'gabbai'] as const;
export const PR_REQUEST_STATUSES = ['open', 'answered', 'closed'] as const;
export const PR_POST_KINDS = ['notice', 'minyan', 'event', 'emergency'] as const;
/** סוגי-הודעה בלוח (מהמקור: מזל טוב · אבלות · שיעורים · לרפואה · גמ"חים · מוסדות · אבידות · קידושא · מכירה). */
export const PR_NOTICE_KINDS = ['simcha', 'avel', 'shiur', 'refuah', 'gemach', 'mosad', 'lost', 'kiddush', 'sale'] as const;
export const PR_AD_SLOTS = ['booklet', 'category', 'board'] as const;
export const PR_AD_KINDS = ['full', 'half', 'small', 'line'] as const;
/** גדלי-מודעה בחוברת (slot='booklet'); חסות-שער ושורת-לוח = 'line'. */
export const PR_BOOKLET_KINDS = ['full', 'half', 'small'] as const;
export const PR_LANGS = ['he', 'yi', 'en', 'fr', 'ru'] as const;
export const PR_AUDS = ['all', 'men', 'women'] as const;
export const PR_PRICE_KEYS = ['featured', 'sponsor', 'board', 'dedication', 'job', 'full', 'half', 'small'] as const;

/** מחירון ברירת-מחדל (₪) — מהמקור; הגבאי דורס ב-db.ui.parnasa.prices. רישום/קישור-סליקה בלבד, אפס קבלות. */
export const PR_PRICE_DEFAULTS: Readonly<Record<PrPriceKey, number>> = {
  featured: 45,
  sponsor: 300,
  board: 300,
  dedication: 500,
  job: 90,
  full: 1200,
  half: 550,
  small: 200,
};

/** תקרות-אורך לשדות-ההגדרות (מהמקור). */
export const PR_PREFS_CAPS = { communityName: 60, contactPhone: 20, dedication: 140, bookletDedication: 240, label: 60 } as const;

/** ארבעת אוספי-המודול (ב-ENTITY_COLLECTIONS / BACKUP_COLLECTIONS). */
export const PR_COLLECTIONS = ['prListings', 'prRequests', 'prPosts', 'prAds'] as const;
export type PrCol = (typeof PR_COLLECTIONS)[number];

/* ---------- עזרי-ריפוי ---------- */

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => !!v && typeof v === 'object' && !Array.isArray(v);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const inList = (list: readonly string[], v: unknown): boolean => typeof v === 'string' && list.includes(v);

function fixStrings(o: Rec, p: Rec, keys: readonly string[]): void {
  for (const k of keys) if (typeof o[k] !== 'string') p[k] = '';
}
function fixBools(o: Rec, p: Rec, keys: readonly string[], dflt: boolean): void {
  for (const k of keys) if (typeof o[k] !== 'boolean') p[k] = dflt;
}
function fixObjList(o: Rec, p: Rec, k: string): void {
  const v = o[k];
  if (!Array.isArray(v)) p[k] = [];
  else if (v.some((x) => !isObj(x))) p[k] = v.filter(isObj);
}
function fixStrList(o: Rec, p: Rec, k: string): void {
  const v = o[k];
  if (!Array.isArray(v)) p[k] = [];
  else if (v.some((x) => typeof x !== 'string')) p[k] = v.filter((x) => typeof x === 'string');
}
function fixIsoOrEmpty(o: Rec, p: Rec, keys: readonly string[]): void {
  for (const k of keys) {
    const v = o[k];
    if (!(v === '' || (typeof v === 'string' && ISO_DATE_RE.test(v)))) p[k] = '';
  }
}
/** מזהה: קיים ⇒ true; חסר ⇒ fallback (אם ניתן) ⇒ true; אחרת false (הרשומה נזרקת). */
function ensureId(o: Rec, p: Rec, fallbackId: string): boolean {
  if (typeof o.id === 'string' && o.id) return true;
  if (!fallbackId) return false;
  p.id = fallbackId;
  return true;
}
/**
 * תוספות-"עיצוב" (13.10, אופציונליות): סוג שגוי ⇒ המפתח מתאפס (= חסר). מפרט "שם:סוג" — s מחרוזת · n מספר≥0 ·
 * b בוליאני · S רשימת-מחרוזות · O רשימת-אובייקטים · o אובייקט. תוכן-עומק (data:image, תקרות) — בממשק/בעורך.
 */
const OPT_OK: Readonly<Record<string, (v: unknown) => boolean>> = {
  s: (v) => typeof v === 'string',
  n: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0,
  b: (v) => typeof v === 'boolean',
  S: (v) => Array.isArray(v) && v.every((x) => typeof x === 'string'),
  O: (v) => Array.isArray(v) && v.every(isObj),
  o: isObj,
};
function fixOpt(o: Rec, p: Rec, spec: string): void {
  for (const f of spec.split(' ')) {
    const k = f.slice(0, -2);
    if (o[k] !== undefined && !OPT_OK[f.slice(-1)](o[k])) p[k] = undefined;
  }
}
/**
 * תמונות דף-העסק (data:image מקומי, כמו הגלריה של התורמים): התקרות של המקור — לוגו ≤25KB, עד 4 תמונות ≤45KB,
 * דף ≤240KB (גם מגן על מסמך-הענן); ותקציב-תמונות לארגון כולו (מסמך-ה-DB המקומי — מספר = פשרת-מוצר, לבעלים).
 */
export const PR_IMG = { logo: 25 * 1024, photo: 45 * 1024, photos: 4, doc: 240 * 1024, org: 6_000_000 } as const;

/** גודל ה-JSON בבייטים (docBytes במקור). */
export function docBytes(o: unknown): number {
  const j = JSON.stringify(o) ?? '';
  try {
    return new TextEncoder().encode(j).length;
  } catch {
    return j.length * 2;
  }
}

/** משקל-התמונות של עסק (לוגו + תמונות, בתווים). */
export function listingImageLen(l: Pick<PrListing, 'logo' | 'photos'>): number {
  return (typeof l.logo === 'string' ? l.logo.length : 0) + (Array.isArray(l.photos) ? l.photos.reduce((a, p) => a + (typeof p === 'string' ? p.length : 0), 0) : 0);
}
/** משקל-התמונות של כל הארגון (בלי העסק הנערך — exceptId). */
export function orgImageLen(listings: readonly PrListing[], exceptId = ''): number {
  let n = 0;
  for (const l of listings) if (l.id !== exceptId) n += listingImageLen(l);
  return n;
}

/** שדות-התוכן הנוספים של עסק (דף-העסק של המקור) — גם במפתח-התוכן של מכונת-האישור. */
export const PR_LISTING_EXTRA = 'palette:s logo:s photos:S offer:o faq:O pay:S years:n cert:s seek:b';
/** שדות-הקידום — שדות-גבאי (כמו featuredUntil): לא-מאשר לא משנה אותם. */
export const PR_LISTING_PROMO = 'promoLine:s promoUrl:s promoPrice:n promoNote:s';
/** שמות-השדות ממפרט. */
export const optKeys = (spec: string): string[] => spec.split(' ').map((f) => f.slice(0, -2));

/** אותה הפניה כשאין תיקון; אחרת עותק עם התיקונים בלבד. */
function done<T>(o: Rec, p: Rec): T {
  return (Object.keys(p).length ? { ...o, ...p } : o) as unknown as T;
}

/* ---------- ריפוי פר-ישות ---------- */

/** עסק: source/category/status זרים ⇒ owner/other/pending; hours/services/recs/languages ⇒ מערכים; dialCode ⇒ 3 ספרות או ''. */
export function healPrListing(raw: unknown, fallbackId = ''): PrListing | null {
  if (!isObj(raw)) return null;
  const p: Rec = {};
  if (!ensureId(raw, p, fallbackId)) return null;
  if (!inList(PR_SOURCES, raw.source)) p.source = 'owner';
  if (!inList(PR_CATEGORY_KEYS, raw.category)) p.category = 'other';
  if (!inList(PR_STATUSES, raw.status)) p.status = 'pending';
  fixStrings(raw, p, ['name', 'title', 'area', 'city', 'phone', 'phone2', 'whatsapp', 'hoursNote', 'kashrut', 'desc', 'notes', 'createdAt', 'updatedAt']);
  fixBools(raw, p, ['always', 'emergency'], false);
  fixObjList(raw, p, 'hours');
  fixObjList(raw, p, 'services');
  fixObjList(raw, p, 'recs');
  fixStrList(raw, p, 'languages');
  const dc = raw.dialCode;
  if (!(dc === '' || (typeof dc === 'string' && /^\d{3}$/.test(dc)))) {
    p.dialCode = typeof dc === 'number' && Number.isInteger(dc) && dc >= 100 && dc <= 999 ? String(dc) : '';
  }
  fixIsoOrEmpty(raw, p, ['featuredUntil']);
  if (raw.aud !== undefined && !inList(PR_AUDS, raw.aud)) p.aud = 'all';
  if (raw.tagline !== undefined && typeof raw.tagline !== 'string') p.tagline = '';
  for (const k of ['disc', 'free']) if (raw[k] !== undefined && typeof raw[k] !== 'boolean') p[k] = false;
  fixOpt(raw, p, PR_LISTING_EXTRA + ' ' + PR_LISTING_PROMO);
  return done<PrListing>(raw, p);
}

/** בקשה: status זר ⇒ open; category זר ⇒ '' (לא משנה); responses ⇒ מערך; requester ⇒ {name,phone}; quiet+job ⇒ job=false. */
export function healPrRequest(raw: unknown, fallbackId = ''): PrRequest | null {
  if (!isObj(raw)) return null;
  const p: Rec = {};
  if (!ensureId(raw, p, fallbackId)) return null;
  if (!inList(PR_REQUEST_STATUSES, raw.status)) p.status = 'open';
  if (!(raw.category === '' || inList(PR_CATEGORY_KEYS, raw.category))) p.category = '';
  fixStrings(raw, p, ['text', 'area', 'createdAt', 'updatedAt']);
  fixBools(raw, p, ['urgent', 'quiet', 'job'], false);
  // בקשה שקטה לעולם אינה הצעת-עבודה (המקור: quiet never together with job)
  if ((p.quiet ?? raw.quiet) === true && (p.job ?? raw.job) === true) p.job = false;
  fixObjList(raw, p, 'responses');
  fixOpt(raw, p, 'promoAt:s promoPrice:n');
  const rq = raw.requester;
  if (!isObj(rq)) p.requester = { name: '', phone: '' };
  else if (typeof rq.name !== 'string' || typeof rq.phone !== 'string') {
    p.requester = { ...rq, name: typeof rq.name === 'string' ? rq.name : '', phone: typeof rq.phone === 'string' ? rq.phone : '' };
  }
  return done<PrRequest>(raw, p);
}

/** מודעת-לוח: kind זר ⇒ notice; approved לא-בוליאני ⇒ false (fail-closed); prayers/days ⇒ מערכים תקינים. */
export function healPrPost(raw: unknown, fallbackId = ''): PrPost | null {
  if (!isObj(raw)) return null;
  const p: Rec = {};
  if (!ensureId(raw, p, fallbackId)) return null;
  if (!inList(PR_POST_KINDS, raw.kind)) p.kind = 'notice';
  fixStrings(raw, p, ['title', 'text', 'place', 'phone', 'noticeKind', 'time', 'createdAt', 'updatedAt']);
  if (typeof raw.noticeKind === 'string' && raw.noticeKind !== '' && !inList(PR_NOTICE_KINDS, raw.noticeKind)) p.noticeKind = '';
  fixIsoOrEmpty(raw, p, ['date', 'until']);
  fixBools(raw, p, ['approved', 'pinned'], false);
  const pr = raw.prayers;
  const prayerOk = (x: unknown): boolean =>
    isObj(x) && typeof x.prayer === 'string' && Array.isArray(x.times) && x.times.every((t) => typeof t === 'string');
  if (!Array.isArray(pr)) p.prayers = [];
  else if (!pr.every(prayerOk)) {
    p.prayers = pr.filter(isObj).map((x) => ({
      ...x,
      prayer: typeof x.prayer === 'string' ? x.prayer : '',
      times: Array.isArray(x.times) ? x.times.filter((t) => typeof t === 'string') : [],
    }));
  }
  const days = raw.days;
  const dayOk = (d: unknown): boolean => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6;
  if (!Array.isArray(days)) p.days = [];
  else if (!days.every(dayOk)) p.days = days.filter(dayOk);
  return done<PrPost>(raw, p);
}

/** פרסומת: slot זר ⇒ booklet; kind עקבי ל-slot (חוברת ⇒ full/half/small, אחרת line); מחיר לא-תקין ⇒ 0; active חסר ⇒ true. */
export function healPrAd(raw: unknown, fallbackId = ''): PrAd | null {
  if (!isObj(raw)) return null;
  const p: Rec = {};
  if (!ensureId(raw, p, fallbackId)) return null;
  if (!inList(PR_AD_SLOTS, raw.slot)) p.slot = 'booklet';
  const slot = (p.slot ?? raw.slot) as string;
  if (slot === 'booklet' ? !inList(PR_BOOKLET_KINDS, raw.kind) : raw.kind !== 'line') p.kind = slot === 'booklet' ? 'half' : 'line';
  fixStrings(raw, p, ['target', 'advertiser', 'headline', 'body', 'phone', 'paidAt', 'createdAt', 'updatedAt']);
  fixIsoOrEmpty(raw, p, ['from', 'to']);
  if (!(typeof raw.price === 'number' && Number.isFinite(raw.price) && raw.price >= 0)) p.price = 0;
  fixBools(raw, p, ['paid'], false);
  fixBools(raw, p, ['active'], true);
  fixOpt(raw, p, 'url:s coin:b mono:s');
  return done<PrAd>(raw, p);
}

const HEALERS = {
  prListings: healPrListing,
  prRequests: healPrRequest,
  prPosts: healPrPost,
  prAds: healPrAd,
} as const;

const FALLBACK_PREFIX: Readonly<Record<PrCol, string>> = { prListings: 'prlx', prRequests: 'prqx', prPosts: 'prpx', prAds: 'prax' };

/**
 * ריפוי-אוסף (migrate): איבר לא-אובייקט נזרק; מזהה חסר ⇒ `<prefix>x<i>` (שונה מכל מזהה-nextId,
 * שמתחיל בספרה אחרי הקידומת); אוסף תקין ⇒ **אותו מערך** (ביט-זהה).
 */
export function healPrCollection<C extends PrCol>(col: C, list: readonly unknown[]): Db[C] {
  const heal = HEALERS[col] as (raw: unknown, fallbackId?: string) => unknown;
  let changed = false;
  const out: unknown[] = [];
  list.forEach((x, i) => {
    const h = heal(x, FALLBACK_PREFIX[col] + i);
    if (h !== x) changed = true;
    if (h) out.push(h);
  });
  return (changed ? out : list) as Db[C];
}

/** ריפוי-רשומה בודדת למיזוג-החי (cloud-merge.healRecord) — שם המזהה תמיד קיים (מזהה-המסמך). אוסף זר ⇒ אותה רשומה. */
export function healPrRecord(col: string, item: Record<string, unknown>): Record<string, unknown> {
  if (!(PR_COLLECTIONS as readonly string[]).includes(col)) return item;
  const heal = HEALERS[col as PrCol] as (raw: unknown, fallbackId?: string) => unknown;
  const h = heal(item, typeof item.id === 'string' ? item.id : '');
  return (h ?? item) as Record<string, unknown>;
}

/* ---------- ריפוי-הגדרות (db.ui.parnasa) ---------- */

function validTz(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** מספר סופי בטווח (כולל) — או undefined. */
function inRange(v: unknown, min: number, max: number): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : undefined;
}

/**
 * ריפוי db.ui.parnasa: מחרוזות נחתכות לתקרה, מפתח-ידוע לא-תקין **נמחק** (= ברירת-מחדל),
 * מחירים ידועים = מספר סופי ≥0, נ"צ בטווח, אזור-זמן IANA תקין, דקות-הדלקה/צאת 0–120.
 * מפתח לא-מוכר נשמר (תאימות-קדימה). תקין ⇒ אותה הפניה. לא-אובייקט ⇒ {}.
 */
export function healParnasaPrefs(raw: unknown): ParnasaPrefs {
  if (!isObj(raw)) return {};
  const out: Rec = { ...raw };
  let changed = false;
  /** מחיקת-מפתח (= ברירת-מחדל) — מחזיר האם נמחק. */
  const drop = (o: Rec, k: string): boolean => {
    if (!(k in o)) return false;
    delete o[k];
    return true;
  };
  const textCaps: ReadonlyArray<[string, number]> = [
    ['communityName', PR_PREFS_CAPS.communityName],
    ['contactPhone', PR_PREFS_CAPS.contactPhone],
    ['dedication', PR_PREFS_CAPS.dedication],
    ['bookletDedication', PR_PREFS_CAPS.bookletDedication],
  ];
  for (const [k, cap] of textCaps) {
    const v = out[k];
    if (v === undefined) continue;
    if (typeof v !== 'string') changed = drop(out, k) || changed;
    else if (v.length > cap) {
      out[k] = v.slice(0, cap);
      changed = true;
    }
  }
  if (out.requireApproval !== undefined && typeof out.requireApproval !== 'boolean') changed = drop(out, 'requireApproval') || changed;
  if (out.prices !== undefined) {
    if (!isObj(out.prices)) changed = drop(out, 'prices') || changed;
    else {
      const prices: Rec = { ...out.prices };
      let pricesChanged = false;
      for (const k of PR_PRICE_KEYS) {
        if (prices[k] !== undefined && inRange(prices[k], 0, 1e7) === undefined) pricesChanged = drop(prices, k) || pricesChanged;
      }
      if (pricesChanged) {
        out.prices = prices;
        changed = true;
      }
    }
  }
  if (out.zmanim !== undefined) {
    if (!isObj(out.zmanim)) changed = drop(out, 'zmanim') || changed;
    else {
      const z: Rec = { ...out.zmanim };
      let zc = false;
      if (z.city !== undefined && !(typeof z.city === 'string' && /^[a-z][a-z0-9-]{0,30}$/.test(z.city))) zc = drop(z, 'city') || zc;
      if (z.lat !== undefined && inRange(z.lat, -90, 90) === undefined) zc = drop(z, 'lat') || zc;
      if (z.lon !== undefined && inRange(z.lon, -180, 180) === undefined) zc = drop(z, 'lon') || zc;
      if (z.elevation !== undefined && inRange(z.elevation, -500, 9000) === undefined) zc = drop(z, 'elevation') || zc;
      if (z.tz !== undefined && !validTz(z.tz)) zc = drop(z, 'tz') || zc;
      if (z.label !== undefined) {
        if (typeof z.label !== 'string') zc = drop(z, 'label') || zc;
        else if (z.label.length > PR_PREFS_CAPS.label) {
          z.label = z.label.slice(0, PR_PREFS_CAPS.label);
          zc = true;
        }
      }
      for (const k of ['candleMin', 'tzeisMin']) {
        if (z[k] === undefined) continue;
        const n = inRange(z[k], 0, 120);
        if (n === undefined) zc = drop(z, k) || zc;
        else if (!Number.isInteger(n)) {
          z[k] = Math.round(n);
          zc = true;
        }
      }
      if (zc) {
        out.zmanim = z;
        changed = true;
      }
    }
  }
  return (changed ? out : raw) as ParnasaPrefs;
}
