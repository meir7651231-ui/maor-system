/**
 * ratchet — מנוע פרנסה׳לע (אשכול 3, lib.ts). כל "עכשיו" מוזרק (todayIso / epoch / שעון) —
 * דטרמיניסטי. העסקים לדוגמה = 12 עסקי-הדמו של המקור (קו-הטלפון, נספח A21).
 *
 * הכללים שננעלים (BUILD-ORDER-PARNASA "תיקונים מול המקור" + נספחי-המפרט):
 *   · "מה צריך?" — דירוג-המקור (מושגים/תחיליות/גזע/שגיאת-כתיב ⇒ כיסוי ⇒ שכבה ⇒ מודגש ⇒ פתוח-עכשיו
 *     ⇒ המלצות ⇒ שם); רק מאושרים.
 *   · 🛡 עריכת-תוכן של עסק מאושר ע"י מי שאינו מאשר ⇒ חזרה ל"ממתין" (במקור האישור היה חד-פעמי).
 *   · 🛡 רשומות-גבאי לא נספרות כמקבלות-בקשות (במקור "תקעו" בקשה 3 שעות מול אף-אחד).
 *   · 🛡 פרטיות בקשה-שקטה במנוע: תצוגת-העסקים בלי זהות-המבקש (גם טלפון/מייל שהוקלדו בטקסט).
 *   · ניתוב: חלון-מקצוע 3 שעות / שעה בדחוף, ואז הקהילה; שקטה לעולם לא לקהילה.
 *   · 🛡 זיהוי-רגישות: `\b` של המקור לא עבד על עברית ("חובות"/"גט" לא זוהו) — כאן כן, ו"רחוב" לא.
 */
import { describe, expect, it } from 'vitest';
import {
  activeAds,
  addResponse,
  adPayLink,
  analyzeQuery,
  approveListing,
  businessView,
  categoryOf,
  closeRequest,
  communityRequests,
  dialCodeTaken,
  filterListings,
  groupByCategory,
  hoursText,
  inMinsText,
  isUrgent,
  listingStatus,
  listingStatusOnSave,
  listingsCsvRows,
  needsCare,
  nextDialCode,
  openNow,
  pendingApprovals,
  postApprovedOnSave,
  PR_CATEGORIES,
  PR_CONCEPTS,
  priceOf,
  prNorm,
  redactContact,
  rejectListing,
  requestRecipients,
  requestsForListing,
  requireApprovalOf,
  routeRequest,
  routeSummary,
  saveListing,
  savePost,
  searchCount,
  searchListings,
  sensitiveTopic,
  tokMatch,
} from '../lib';
import { PR_CATEGORY_KEYS, PR_PRICE_DEFAULTS } from '../model';
import { clockAt, makeClosureFn, resolveZmanimLoc, type PrClock } from '../zmanimBoard';
import { toCsv } from '../../../lib/csvx';
import { DEFAULT_CONFIG } from '../../../types/config';
import type { PrAd, PrListing, PrPost, PrRequest } from '../../../types/domain';
import libSrc from '../lib.ts?raw';
import zmanimSrc from '../zmanimBoard.ts?raw';
import bookletSrc from '../booklet.ts?raw';
import modelSrc from '../model.ts?raw';

const TODAY = '2026-10-14';
const LOC = resolveZmanimLoc();
const closure = makeClosureFn(LOC);
/** epoch של שעה מקומית בישראל (IDT = UTC+3, אוקטובר 2026 לפני 25.10). */
const idt = (y: number, mo: number, d: number, h: number, mi = 0): number => Date.UTC(y, mo - 1, d, h - 3, mi);
const clk = (y: number, mo: number, d: number, h: number, mi = 0): PrClock => clockAt(idt(y, mo, d, h, mi));

function L(over: Partial<PrListing>): PrListing {
  return {
    id: 'x', source: 'owner', name: '', title: '', category: 'other', area: '', city: '', phone: '', phone2: '', whatsapp: '',
    hours: [], always: false, hoursNote: '', services: [], languages: ['he'], kashrut: '', emergency: false, desc: '', notes: '',
    status: 'approved', dialCode: '', featuredUntil: '', recs: [],
    createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}
function R(over: Partial<PrRequest>): PrRequest {
  return {
    id: 'q', text: '', category: '', area: '', urgent: false, quiet: false, job: false,
    requester: { name: 'ר׳ משה', phone: '052-1111111' }, status: 'open', responses: [],
    createdAt: '2026-10-14T07:00:00.000Z', updatedAt: '2026-10-14T07:00:00.000Z', ...over,
  };
}
function AD(over: Partial<PrAd>): PrAd {
  return {
    id: 'ad', slot: 'booklet', kind: 'half', target: '', advertiser: 'מפרסם', headline: '', body: '', phone: '',
    from: '', to: '', price: 0, paid: false, paidAt: '', active: true,
    createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}
function P(over: Partial<PrPost>): PrPost {
  return {
    id: 'pp', kind: 'notice', title: 'הודעה', text: '', place: '', phone: '', noticeKind: '', prayers: [], days: [],
    date: '', time: '', until: '', approved: false, pinned: false,
    createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}

// 12 עסקי-הדמו של המקור (נספח A21)
const plumber = L({ id: 'p1', name: 'אינסטלציה זילברמן', title: 'נזילות, סתימות ודודים', category: 'elec', city: 'בני ברק', area: 'גוש דן', phone: '050-0000101' });
const electrician = L({ id: 'e1', name: 'חשמל אור הגנוז', title: 'חשמלאי מוסמך, לוחות וקצרים', category: 'elec', city: 'ירושלים', area: 'ירושלים והסביבה', phone: '050-0000102' });
const ac = L({ id: 'a1', name: 'מיזוג קרליבך', title: 'התקנה וניקוי מזגנים', category: 'elec', city: 'ירושלים', phone: '050-0000103' });
const stam = L({ id: 's1', name: 'סת״ם רבינוביץ', title: 'ספרי תורה, תפילין ומזוזות', category: 'stam', city: 'ירושלים', phone: '050-0000104' });
const mover = L({ id: 'm1', name: 'הובלות ירושלים', title: 'הובלת דירות ומשרדים', category: 'car', city: 'ירושלים', phone: '050-0000105' });
const melamed = L({ id: 'k1', name: 'הרב קליין', title: 'מלמד ושיעורי גמרא', category: 'edu', city: 'ירושלים', phone: '050-0000106' });
const caterer = L({ id: 'c1', name: 'קייטרינג הדר', title: 'שמחות וקידושים', category: 'events', city: 'בני ברק', phone: '050-0000107' });
const photo = L({ id: 'ph1', name: 'צילום שמחה', title: 'צלם חתונות ושמחות', category: 'events', city: 'ירושלים', phone: '050-0000108' });
const builder = L({ id: 'b1', name: 'שיפוצי בן דוד', title: 'שיפוצים, טיח וריצוף', category: 'build', city: 'בית שמש', phone: '050-0000109' });
const bakery = L({ id: 'f1', name: 'מאפיית אבי', title: 'חלות ועוגות לשבת', category: 'food', city: 'בית שמש', phone: '050-0000110' });
const cleaner = L({ id: 'h1', name: 'ניקיון ברק', title: 'ניקיון דירות ומשרדים', category: 'home', city: 'אשדוד', phone: '050-0000111' });
const gardener = L({ id: 'g1', name: 'גינון עדן', title: 'גינון, השקיה וגיזום', category: 'home', city: 'גוש עציון', phone: '050-0000112' });
const ALL = [plumber, electrician, ac, stam, mover, melamed, caterer, photo, builder, bakery, cleaner, gardener];
const ids = (r: { hits: Array<{ listing: PrListing }> }) => r.hits.map((h) => h.listing.id);

describe('🗂 טקסונומיה — 15 שערי-המקצוע', () => {
  it('הסדר והשמות מהמקור (CATS), מספרי-שער בגימטריה, לא-מוכר ⇒ כללי', () => {
    expect(PR_CATEGORIES.map((c) => c.key)).toEqual([...PR_CATEGORY_KEYS]);
    expect(PR_CATEGORIES.map((c) => c.name)).toEqual([
      'בנייה ושיפוצים', 'חשמל, אינסטלציה ומיזוג', 'רכב, הובלות והסעות', 'הנהלת חשבונות, משפט וביטוח', 'מחשבים, טכנולוגיה ועיצוב',
      'חינוך, מלמדים ושיעורים', 'סת״ם, יודאיקה וספרים', 'שמחות, קייטרינג וצילום', 'רפואה, טיפולים וייעוץ', 'אופנה, חייטות ופאות',
      'בית, ניקיון וגינון', 'מזון, אפייה ומשלוחים', 'נדל״ן ותיווך', 'מסחר וחנויות', 'כללי ואחר',
    ]);
    expect(PR_CATEGORIES[0].num).toBe('א׳');
    expect(PR_CATEGORIES[14].num).toBe('ט״ו');
    expect(PR_CATEGORIES.every((c) => c.icon && /^#[0-9a-f]{6}$/.test(c.color) && c.short)).toBe(true);
    expect(categoryOf('xyz').key).toBe('other');
    expect(categoryOf('').key).toBe('other');
    expect(categoryOf('stam').short).toBe('סת״ם ויודאיקה');
    expect(PR_CONCEPTS).toHaveLength(25);
    expect(PR_CONCEPTS.every((c) => (PR_CATEGORY_KEYS as readonly string[]).includes(c.c))).toBe(true);
  });
  it('הגדרות: אישור חסר ⇒ דלוק; מחירון — דריסה תקינה או ברירת-המקור', () => {
    expect(requireApprovalOf(undefined)).toBe(true);
    expect(requireApprovalOf({ requireApproval: false })).toBe(false);
    expect(priceOf(undefined, 'featured')).toBe(45);
    expect(priceOf({ prices: { featured: 60, sponsor: -3 } }, 'featured')).toBe(60);
    expect(priceOf({ prices: { sponsor: -3 } }, 'sponsor')).toBe(PR_PRICE_DEFAULTS.sponsor);
  });
});

describe('🔎 "מה צריך?" — נרמול וניקוד-טוקנים (נספח A7)', () => {
  it('prNorm: ניקוד/סופיות/גרשיים/פיסוק/מקף-עברי', () => {
    expect(prNorm('נְזִילָה')).toBe('נזילה');
    expect(prNorm('קצר-בחשמל!')).toBe('קצר בחשמל');
    expect(prNorm('סת״ם')).toBe('סתמ');
    expect(prNorm('בית־שמש')).toBe('בית שמש');
    expect(prNorm('  שיעוריים  ')).toBe('שיעורימ'); // יי⇒י, ם⇒מ, רווחים נחתכים
  });
  it('tokMatch: זהה 3 · תחילית 2.8 · גזע 2.6 · התחלה 2.2/1.2 · שגיאת-כתיב 1.6 · אחר 0', () => {
    expect(tokMatch('נזילה', 'נזילה')).toBe(3);
    expect(tokMatch('בנזילה', 'נזילה')).toBe(2.8);
    expect(tokMatch('נזילות', 'נזילה')).toBe(2.6);
    expect(tokMatch('נזי', 'נזילה')).toBe(2.2);
    expect(tokMatch('נז', 'נזילה')).toBe(1.2);
    expect(tokMatch('נזלה', 'נזילה')).toBe(1.6);
    expect(tokMatch('גמרא', 'נזילה')).toBe(0);
  });
  it('analyzeQuery: מושג נשמר, טוקן-מושג מסומן; ביטוי רב-מילתי ⇒ 3.5', () => {
    const a = analyzeQuery('נזילה בכיור');
    expect(a.cons[0]).toEqual({ k: 'plumb', s: 3 });
    expect([...a.conHit].sort()).toEqual([0, 1]);
    expect(analyzeQuery('דוד שמש').cons[0]).toEqual({ k: 'plumb', s: 3.5 });
  });
});

describe('🔎 "מה צריך?" — דירוג', () => {
  const ctx = { todayIso: TODAY };
  it('בעיה במילים ⇒ בעל-המקצוע הנכון ראשון (גזע בטקסט), אח"כ השער', () => {
    const r = searchListings('נזילה', ALL, ctx);
    expect(ids(r)[0]).toBe('p1');
    expect(ids(r)).toEqual(['p1', 'e1', 'a1']); // שאר שער-החשמל (כיסוי 0.5, שוויון) — לפי שם: ח לפני מ
    expect(r.concepts).toEqual(['אינסטלציה']);
    expect(r.hits[0].via).toBe('אינסטלציה');
  });
  it('🛡 שגיאת-כתיב ("נזלה") עדיין מוצאת את האינסטלטור', () => {
    expect(ids(searchListings('נזלה', ALL, ctx))[0]).toBe('p1');
    expect(ids(searchListings('מזוזת', ALL, ctx))[0]).toBe('s1');
  });
  it('ביטוי ("קצר בחשמל") / מושג ("מעבר דירה") / נרדף ("מלמד לגמרא")', () => {
    expect(ids(searchListings('קצר בחשמל', ALL, ctx))[0]).toBe('e1');
    expect(ids(searchListings('מעבר דירה', ALL, ctx))[0]).toBe('m1');
    expect(ids(searchListings('מלמד לגמרא', ALL, ctx))[0]).toBe('k1');
    expect(ids(searchListings('צלם לחתונה', ALL, ctx))[0]).toBe('ph1');
  });
  it('שם (+"שם") וטלפון (≥3 ספרות)', () => {
    const r = searchListings('זילברמן', ALL, ctx);
    expect(ids(r)).toEqual(['p1']);
    expect(r.nameHit).toBe(true);
    expect(ids(searchListings('0000107', ALL, ctx))).toEqual(['c1']);
  });
  it('מיקום מוסיף שכבה: "חשמלאי בירושלים" ⇒ זה שבירושלים לפני זה שבבני ברק', () => {
    const bb = L({ id: 'e2', name: 'חשמל הצדיק', title: 'חשמלאי מוסמך, לוחות וקצרים', category: 'elec', city: 'בני ברק', phone: '050-0000199' });
    const r = searchListings('חשמלאי בירושלים', [bb, electrician], ctx);
    expect(ids(r)).toEqual(['e1', 'e2']);
    expect(r.locHit).toBe(true);
  });
  const twin = L({ ...plumber, id: 'p2', name: 'אינסטלציה כהן', phone: '050-0000201' }); // זהה לזילברמן חוץ מהשם (ז < כ)
  it('שובר-שוויון: מודגש ⇒ ראשון (גם נגד סדר-השם)', () => {
    expect(ids(searchListings('נזילה', [plumber, twin], ctx))).toEqual(['p1', 'p2']);
    const featured = { ...twin, featuredUntil: '2026-10-31' };
    expect(ids(searchListings('נזילה', [plumber, featured], ctx))).toEqual(['p2', 'p1']);
    const expired = { ...twin, featuredUntil: '2026-10-13' };
    expect(ids(searchListings('נזילה', [plumber, expired], ctx))).toEqual(['p1', 'p2']);
  });
  it('שובר-שוויון: פתוח-עכשיו ⇒ לפני סגור (שעון-הקהילה)', () => {
    const now = clk(2026, 10, 14, 10); // רביעי 10:00
    const openTwin = { ...twin, hours: [{ dow: 3, from: '08:00', to: '19:00' }] };
    const closedP1 = { ...plumber, hours: [{ dow: 3, from: '16:00', to: '20:00' }] };
    expect(ids(searchListings('נזילה', [closedP1, openTwin], { todayIso: TODAY, clock: now, closureAt: closure }))).toEqual(['p2', 'p1']);
  });
  it('שובר-שוויון: המלצות', () => {
    const recTwin = { ...twin, recs: [{ by: 'א', text: 'מעולה', at: '2026-10-01T00:00:00.000Z' }] };
    expect(ids(searchListings('נזילה', [plumber, recTwin], ctx))).toEqual(['p2', 'p1']);
  });
  it('רק מאושרים; שאילתה ריקה ⇒ כלום; limit + total; searchCount', () => {
    const pending = { ...plumber, id: 'p9', status: 'pending' as const };
    const rejected = { ...plumber, id: 'p8', status: 'rejected' as const };
    expect(ids(searchListings('נזילה', [pending, rejected], ctx))).toEqual([]);
    expect(searchListings('', ALL, ctx).hits).toEqual([]);
    const lim = searchListings('נזילה', ALL, ctx, 1);
    expect(lim.hits).toHaveLength(1);
    expect(lim.total).toBe(3);
    expect(searchCount('נזילה', ALL, ctx)).toBe(3);
  });
  it('עיון: smartFilter (סובלני לשגיאות) + מסננים; ממתינים רק לגבאי', () => {
    expect(filterListings(ALL, { todayIso: TODAY, q: 'הובלות' }).map((l) => l.id)).toEqual(['m1']);
    expect(filterListings(ALL, { todayIso: TODAY, category: 'home' }).map((l) => l.id)).toEqual(['g1', 'h1']);
    const pend = { ...cleaner, id: 'h9', status: 'pending' as const };
    expect(filterListings([pend], { todayIso: TODAY }).length).toBe(0);
    expect(filterListings([pend], { todayIso: TODAY, includeAll: true }).length).toBe(1);
    const openOnly = { clock: clk(2026, 10, 14, 10), closureAt: closure };
    const openOne = { ...mover, hours: [{ dow: 3, from: '08:00', to: '19:00' }] };
    expect(filterListings([mover, openOne], { todayIso: TODAY, openOnly }).length).toBe(1);
    const women = { ...cleaner, id: 'h2', aud: 'women' as const };
    expect(filterListings([cleaner, women], { todayIso: TODAY, aud: 'men' }).map((l) => l.id)).toEqual(['h1']);
  });
  it('קיבוץ לפי שער (סדר-השערים; מודגש ראשון)', () => {
    const g = groupByCategory([gardener, plumber, { ...cleaner, featuredUntil: '2026-12-01' }], TODAY);
    expect(g.map((x) => x.cat.key)).toEqual(['elec', 'home']);
    expect(g[1].items.map((l) => l.id)).toEqual(['h1', 'g1']);
  });
});

describe('🕐 פתוח-עכשיו (שעון ישראל + סגירת שבת/יו״ט)', () => {
  const shop = L({
    id: 'w1',
    hours: [0, 1, 2, 3, 4].map((dow) => ({ dow, from: '08:00', to: '19:00' })).concat([{ dow: 5, from: '08:00', to: '12:00' }, { dow: 6, from: '20:00', to: '23:30' }]),
  });
  it('בתוך חלון / נפתח בקרוב / סגור עם "חוזר"', () => {
    expect(listingStatus(shop, clk(2026, 10, 14, 10), closure)).toEqual({ k: 'open', t: 'פנוי עכשיו', sub: 'עד 19:00' });
    expect(listingStatus(shop, clk(2026, 10, 14, 7, 30), closure)).toEqual({ k: 'soon', t: 'נפתח בקרוב', sub: 'ב־08:00' });
    expect(listingStatus(shop, clk(2026, 10, 14, 6), closure)).toEqual({ k: 'closed', t: 'סגור עכשיו', sub: 'חוזר היום ב־08:00' });
    expect(listingStatus(shop, clk(2026, 10, 15, 20), closure)?.sub).toBe('חוזר מחר ב־08:00');
  });
  it('🛡 שבת: סגור "חוזר במוצ״ש" (גם לעסק "תמיד"); אחרי צאת — חלון מוצ"ש פתוח', () => {
    expect(listingStatus(shop, clk(2026, 10, 17, 10), closure)).toEqual({ k: 'shab', t: 'חוזר במוצ״ש', sub: 'צאת 18:47' });
    expect(openNow(L({ always: true }), clk(2026, 10, 17, 10), closure)).toBe(false);
    expect(openNow(L({ always: true }), clk(2026, 10, 14, 3), closure)).toBe(true);
    expect(listingStatus(shop, clk(2026, 10, 17, 21), closure)).toEqual({ k: 'open', t: 'פנוי עכשיו', sub: 'עד 23:30' });
    expect(listingStatus(shop, clk(2026, 10, 16, 13), closure)?.sub).toBe('חוזר מחר ב־20:00');
  });
  it('חלון במוצ"ש שמתחיל לפני צאת ⇒ נפתח בצאת; יו״כ ⇒ "חוזר במוצאי החג"', () => {
    const early = L({ id: 'w2', hours: [{ dow: 6, from: '18:00', to: '23:00' }] });
    expect(listingStatus(early, clk(2026, 10, 16, 13), closure)?.sub).toBe('חוזר מחר ב־18:47');
    const yk = clockAt(idt(2026, 9, 21, 12));
    expect(listingStatus(shop, yk, closure)?.t).toBe('חוזר במוצאי החג');
  });
  it('חוצה-חצות מאתמול; בלי שעות ⇒ לא ידוע (null)', () => {
    const night = L({ id: 'w3', hours: [{ dow: 3, from: '22:00', to: '02:00' }] });
    expect(listingStatus(night, clk(2026, 10, 15, 1), closure)).toEqual({ k: 'open', t: 'פנוי עכשיו', sub: 'עד 02:00' });
    expect(listingStatus(night, clk(2026, 10, 15, 3), closure)?.k).toBe('closed');
    expect(listingStatus(L({ id: 'w4' }), clk(2026, 10, 14, 10), closure)).toBeNull();
    expect(openNow(L({ id: 'w4' }), clk(2026, 10, 14, 10), closure)).toBe(false);
  });
  it('שעות במילים — קיבוץ ימים רצופים / הערה גוברת / תמיד', () => {
    expect(hoursText(shop)).toBe('א׳–ה׳ 08:00–19:00 · ו׳ 08:00–12:00 · מוצ״ש 20:00–23:30');
    expect(hoursText({ ...shop, hoursNote: 'בתיאום מראש' })).toBe('בתיאום מראש');
    expect(hoursText(L({ always: true }))).toBe('זמין תמיד (חוץ משבת וחג)');
  });
});

describe('✅ מכונת-האישור', () => {
  const gabbai = { canApprove: true, requireApproval: true, who: 'gabbai@x' };
  const staff = { canApprove: false, requireApproval: true, who: 'staff@x' };
  const staffNoGate = { canApprove: false, requireApproval: false };
  const NOW = '2026-10-14T09:00:00.000Z';
  it('חדש: מאשר / אישור-כבוי ⇒ approved; אחר ⇒ pending', () => {
    expect(listingStatusOnSave(null, plumber, gabbai)).toBe('approved');
    expect(listingStatusOnSave(null, plumber, staff)).toBe('pending');
    expect(listingStatusOnSave(null, plumber, staffNoGate)).toBe('approved');
  });
  it('🛡 עריכת-תוכן של עסק **מאושר** ע"י מי שאינו מאשר ⇒ חזרה ל-pending', () => {
    const edited = { ...plumber, title: 'נזילות, סתימות, דודים ומזגנים' };
    expect(listingStatusOnSave(plumber, edited, staff)).toBe('pending');
    expect(saveListing(plumber, edited, staff, NOW).status).toBe('pending');
  });
  it('עריכת המאשר עצמו / שינוי לא-תוכני ⇒ הסטטוס נשמר; נדחה שנערך ⇒ הגשה-מחדש', () => {
    expect(listingStatusOnSave(plumber, { ...plumber, title: 'חדש' }, gabbai)).toBe('approved');
    expect(listingStatusOnSave(plumber, { ...plumber, notes: 'הערה פנימית', featuredUntil: '2026-11-01', dialCode: '101' }, staff)).toBe('approved');
    expect(listingStatusOnSave(plumber, { ...plumber, disc: false }, staff)).toBe('approved'); // חסר ≡ false — לא שינוי
    const rej = rejectListing(plumber, 'g', NOW);
    expect(listingStatusOnSave(rej, { ...rej, phone: '050-9999999' }, staff)).toBe('pending');
    expect(listingStatusOnSave(plumber, { ...plumber, desc: 'עוד' }, staffNoGate)).toBe('approved'); // אישור כבוי
  });
  it('🛡 שדות-גבאי מוגנים: לא-מאשר לא משנה הדגשה/קוד-חיוג/מקור', () => {
    const sneaky = { ...plumber, featuredUntil: '2027-12-31', dialCode: '777', source: 'gabbai' as const };
    const saved = saveListing({ ...plumber, dialCode: '101' }, sneaky, staff, NOW);
    expect(saved.featuredUntil).toBe('');
    expect(saved.dialCode).toBe('101');
    expect(saved.source).toBe('owner');
    expect(saved.updatedAt).toBe(NOW);
    expect(saved.createdAt).toBe(plumber.createdAt);
    expect(saveListing(null, sneaky, gabbai, NOW).featuredUntil).toBe('2027-12-31');
  });
  it('אישור/דחייה עם חותמת-ביקורת', () => {
    expect(approveListing({ ...plumber, status: 'pending' }, 'g@x', NOW)).toMatchObject({ status: 'approved', reviewedBy: 'g@x', reviewedAt: NOW });
    expect(rejectListing(plumber, 'g@x', NOW).status).toBe('rejected');
  });
  it('מודעות-לוח — אותו כלל (חדשה של לא-מאשר ממתינה; עריכת-תוכן ⇒ ממתינה)', () => {
    const p = P({ approved: true, title: 'שיעור' });
    expect(postApprovedOnSave(null, p, staff)).toBe(false);
    expect(postApprovedOnSave(null, p, gabbai)).toBe(true);
    expect(postApprovedOnSave(p, { ...p, text: 'שונה' }, staff)).toBe(false);
    expect(postApprovedOnSave(p, { ...p, text: 'שונה' }, gabbai)).toBe(true);
    expect(postApprovedOnSave(p, { ...p, updatedAt: 'x' }, staff)).toBe(true);
  });
  it('savePost: נעיצה = שדה-גבאי (לא-מאשר לא נועץ); מודעה חדשה של לא-מאשר ממתינה', () => {
    expect(savePost(null, P({ pinned: true }), staff, NOW)).toMatchObject({ pinned: false, approved: false, updatedAt: NOW });
    expect(savePost(null, P({ pinned: true }), gabbai, NOW)).toMatchObject({ pinned: true, approved: true });
  });
  it('ממתינים-לאישור — הוותיקים ראשונים; מודעה שפגה לא נספרת', () => {
    const a = { ...plumber, id: 'n1', status: 'pending' as const, updatedAt: '2026-10-05T00:00:00.000Z' };
    const b = { ...plumber, id: 'n2', status: 'pending' as const, updatedAt: '2026-10-02T00:00:00.000Z' };
    const posts = [P({ id: 'o1' }), P({ id: 'o2', until: '2026-10-01' }), P({ id: 'o3', approved: true })];
    const pa = pendingApprovals({ prListings: [a, plumber, b], prPosts: posts }, TODAY);
    expect(pa.listings.map((l) => l.id)).toEqual(['n2', 'n1']);
    expect(pa.posts.map((p) => p.id)).toEqual(['o1']);
    expect(pa.total).toBe(3);
  });
});

describe('📨 ניתוב בקשות — המקצוע קודם, ואז הקהילה', () => {
  const T0 = Date.parse('2026-10-14T07:00:00.000Z');
  const H = 3600_000;
  const gabbaiElec = { ...electrician, source: 'gabbai' as const };
  const pendingAc = { ...ac, status: 'pending' as const };
  const listings = [plumber, gabbaiElec, pendingAc, { ...stam, source: 'gabbai' as const }];
  const req = R({ id: 'q1', text: 'נזילה מתחת לכיור', category: 'elec' });
  it('🛡 מקבלים = עסקים מאושרים שנרשמו בעצמם; רשומת-גבאי וממתין — לא', () => {
    expect(requestRecipients(req, listings).map((l) => l.id)).toEqual(['p1']);
  });
  it('חלון 3 שעות: biz עד T0+3ש׳, אח"כ all', () => {
    expect(routeRequest(req, listings, T0 + H)).toMatchObject({ stage: 'biz', msLeft: 2 * H, escalateAtMs: T0 + 3 * H });
    expect(routeRequest(req, listings, T0 + 3 * H - 1).stage).toBe('biz');
    expect(routeRequest(req, listings, T0 + 3 * H).stage).toBe('all');
  });
  it('דחוף — שעה; גם טקסט שמתחיל ב"דחוף"; פג אחרי 48 שעות', () => {
    const urgent = { ...req, urgent: true };
    expect(routeRequest(urgent, listings, T0 + H - 1).stage).toBe('biz');
    expect(routeRequest(urgent, listings, T0 + H).stage).toBe('all');
    expect(isUrgent({ ...req, text: 'דחוף! נזילה' }, T0)).toBe(true);
    expect(isUrgent(urgent, T0 + 49 * H)).toBe(false);
  });
  it('🛡 שער שיש בו רק רשומות-גבאי ⇒ ישר לקהילה (לא "נתקע" 3 שעות); שקטה שם ⇒ הגבאי', () => {
    const stamReq = R({ id: 'q2', text: 'בדיקת מזוזות', category: 'stam' });
    expect(routeRequest(stamReq, listings, T0).stage).toBe('all');
    expect(routeRequest({ ...stamReq, quiet: true }, listings, T0).stage).toBe('gabbai');
  });
  it('שקטה עם עסק בתחום ⇒ biz ולעולם לא עוברת לקהילה; מענה ⇒ נשארת biz', () => {
    expect(routeRequest({ ...req, quiet: true }, listings, T0 + 10 * H).stage).toBe('biz');
    const answered = addResponse(req, { listingId: 'p1', text: 'אני זמין', at: '' }, '2026-10-14T08:00:00.000Z');
    expect(routeRequest(answered, listings, T0 + 10 * H).stage).toBe('biz');
  });
  it('הצעת-עבודה / "לא משנה" / העסק של המבקש עצמו / נסגרה', () => {
    expect(routeRequest({ ...req, job: true }, listings, T0).stage).toBe('all');
    expect(routeRequest({ ...req, category: '' }, listings, T0).stage).toBe('all');
    const mine = { ...req, requester: { name: 'זילברמן', phone: '+972-50-0000101' } };
    expect(requestRecipients(mine, listings)).toEqual([]);
    expect(routeRequest({ ...req, status: 'closed' }, listings, T0).stage).toBe('closed');
    expect(routeRequest({ ...req, createdAt: 'לא תאריך' }, listings, T0).stage).toBe('all'); // לא נתקעת לעולם
  });
  it('שורת-המסלול (נוסח המקור)', () => {
    expect(routeSummary(routeRequest(req, listings, T0 + H), req)).toBe('נשלחה ל־1 עסקים בתחום · אם אף אחד לא יענה, תעבור לכל הקהילה בעוד שעתיים');
    expect(routeSummary(routeRequest({ ...req, quiet: true }, listings, T0), { ...req, quiet: true })).toContain('בלי השם שלך');
    const stamReq = R({ category: 'stam', quiet: true });
    expect(routeSummary(routeRequest(stamReq, listings, T0), stamReq)).toContain('הגבאי יכוון אותך באופן אישי');
    expect(inMinsText(40 * 60_000)).toBe('40 דקות');
    expect(inMinsText(130 * 60_000)).toBe('שעתיים ו־10 דקות');
  });
});

describe('🤫 פרטיות בקשה-שקטה — נאכפת במנוע', () => {
  const NOW = Date.parse('2026-10-14T08:00:00.000Z');
  const quiet = R({
    id: 'q9', quiet: true, category: 'health', text: 'צריכה ייעוץ זוגי דחוף, אפשר לחזור ל-052-7654321 או rachel@mail.com',
    requester: { name: 'רחל לוי', phone: '052-7654321' },
  });
  const therapist = L({ id: 't1', name: 'מטפלת זוגית', title: 'ייעוץ זוגי והדרכה', category: 'health', phone: '050-0000300' });
  it('🛡 תצוגת-העסקים: בלי שם/טלפון של המבקשת — גם לא מתוך הטקסט; בלי שדה requester בכלל', () => {
    const v = businessView(quiet, NOW);
    expect(v.contact).toBeNull();
    expect(v.quiet).toBe(true);
    const json = JSON.stringify(v);
    expect(json).not.toContain('רחל');
    expect(json).not.toContain('7654321');
    expect(json).not.toContain('rachel@');
    expect(json).not.toContain('requester');
    expect(v.text).toContain('ייעוץ זוגי');
  });
  it('בקשה רגילה — פרטי-הקשר שהמבקש בחר להשאיר', () => {
    const v = businessView(R({ id: 'q3', category: 'elec', text: 'נזילה' }), NOW);
    expect(v.contact).toEqual({ name: 'ר׳ משה', phone: '052-1111111' });
  });
  it('העסק בתחום רואה את השקטה בתצוגה המוגנת; הקהילה לא רואה אותה בכלל', () => {
    const forBiz = requestsForListing(therapist, [quiet], [therapist], NOW);
    expect(forBiz).toHaveLength(1);
    expect(forBiz[0].contact).toBeNull();
    expect(requestsForListing(plumber, [quiet], [therapist, plumber], NOW)).toEqual([]);
    expect(communityRequests([quiet], [], NOW)).toEqual([]);
    const open = R({ id: 'q4', category: 'stam', text: 'בדיקת מזוזות' });
    expect(communityRequests([open, quiet], [], NOW).map((v) => v.id)).toEqual(['q4']);
  });
  it('סגירת שקטה ⇒ null (מחיקה עם התשובות); רגילה ⇒ closed', () => {
    expect(closeRequest(quiet, '2026-10-14T09:00:00.000Z')).toBeNull();
    expect(closeRequest(R({ id: 'q5' }), '2026-10-14T09:00:00.000Z')).toMatchObject({ status: 'closed', closedAt: '2026-10-14T09:00:00.000Z' });
  });
  it('תשובה: עסק = תשובה אחת (מחליפה); open ⇒ answered', () => {
    const r1 = addResponse(R({ id: 'q6' }), { listingId: 'p1', text: 'אני זמין', at: '' }, '2026-10-14T08:00:00.000Z');
    const r2 = addResponse(r1, { listingId: 'p1', text: 'זמין אחה"צ', at: '' }, '2026-10-14T08:30:00.000Z');
    expect(r1.status).toBe('answered');
    expect(r2.responses).toEqual([{ listingId: 'p1', text: 'זמין אחה"צ', at: '2026-10-14T08:30:00.000Z' }]);
  });
  it('השחרה: טלפון/מייל ⇒ •••; תאריך ומספרים קצרים נשמרים', () => {
    expect(redactContact('חזרו ל 050 123 4567 או a.b@c.co.il')).toBe('חזרו ל ••• או •••');
    expect(redactContact('ב-12.10.2026 בכיתה 7, 3 ילדים')).toBe('ב-12.10.2026 בכיתה 7, 3 ילדים');
  });
  it('🛡 זיהוי נושא רגיש (גבולות עבריים — `\\b` של המקור לא עבד)', () => {
    expect(sensitiveTopic('מחפש יועץ זוגי')).toBe('שלום בית');
    expect(sensitiveTopic('יש לנו חובות')).toBe('חובות ופרנסה');
    expect(sensitiveTopic('נכנסנו בחובות')).toBe('חובות ופרנסה');
    expect(sensitiveTopic('צריך עזרה עם גט')).toBe('שלום בית');
    expect(sensitiveTopic('טיפולי פוריות')).toBe('פוריות');
    expect(sensitiveTopic('רחוב הרצל 5')).toBe(''); // "חוב" בתוך "רחוב" — לא
    expect(sensitiveTopic('חובה להגיע בזמן')).toBe('');
    expect(sensitiveTopic('נזילה בכיור')).toBe('');
  });
});

describe('🧰 דורש-טיפול · פרסומות · קוד-חיוג · CSV', () => {
  const NOW = Date.parse('2026-10-14T09:00:00.000Z');
  it('needsCare: שקטה-בלי-עסק · דחופה-בלי-מענה · פתוחה-לקהילה ≥24ש׳ · לא-שולם · מסתיים · הדגשה · בלי-קוד', () => {
    const db = {
      prListings: [{ ...stam, source: 'gabbai' as const }, plumber, { ...electrician, dialCode: '102', featuredUntil: '2026-10-18' }],
      prRequests: [
        R({ id: 'r1', quiet: true, category: 'stam', requester: { name: 'סודי ביותר', phone: '052-0000009' } }),
        R({ id: 'r2', urgent: true, category: 'elec', text: 'אין חשמל בכל הבית', createdAt: '2026-10-14T08:30:00.000Z' }),
        R({ id: 'r3', category: 'fin', text: 'מחפש רואה חשבון', createdAt: '2026-10-13T06:00:00.000Z' }),
        R({ id: 'r4', category: 'fin', text: 'חדשה', createdAt: '2026-10-14T08:00:00.000Z' }),
        R({ id: 'r5', status: 'closed', quiet: true, category: 'stam' }),
      ],
      prAds: [
        AD({ id: 'a1', advertiser: 'מאפיית אבי', price: 550, from: '2026-10-01' }),
        AD({ id: 'a2', advertiser: 'עתידי', price: 550, from: '2026-11-01' }),
        AD({ id: 'a3', advertiser: 'שולם', price: 200, paid: true, to: '2026-10-20' }),
      ],
    };
    const care = needsCare(db, TODAY, NOW, DEFAULT_CONFIG);
    expect(care.map((c) => c.kind + ':' + c.id)).toEqual([
      'quietNoBiz:r1', 'urgent:r2', 'unanswered:r3', 'adUnpaid:a1', 'adEnding:a3', 'featuredEnding:e1', 'noDialCode:dialcodes',
    ]);
    expect(care.find((c) => c.kind === 'noDialCode')!.label).toBe('2 עסקים בלי קוד-חיוג'); // סת״ם + אינסטלציה
    expect(JSON.stringify(care)).not.toContain('סודי ביותר'); // 🛡 לעולם לא זהות-מבקש
  });
  it('activeAds: משבצת/יעד/תקופה, לפי מפרסם; adPayLink = payLink בלבד (https)', () => {
    const ads = [
      AD({ id: 'b1', slot: 'category', kind: 'line', target: 'food', advertiser: 'בית', from: '2026-10-01', to: '2026-10-31' }),
      AD({ id: 'b2', slot: 'category', kind: 'line', target: 'food', advertiser: 'אלף' }),
      AD({ id: 'b3', slot: 'category', kind: 'line', target: 'elec', advertiser: 'גימל' }),
      AD({ id: 'b4', slot: 'category', kind: 'line', target: 'food', advertiser: 'פג', to: '2026-10-01' }),
      AD({ id: 'b5', slot: 'category', kind: 'line', target: 'food', advertiser: 'כבוי', active: false }),
      AD({ id: 'b6', slot: 'board', kind: 'line', advertiser: 'לוח' }),
    ];
    expect(activeAds(ads, 'category', TODAY, 'food').map((a) => a.id)).toEqual(['b2', 'b1']);
    expect(activeAds(ads, 'category', TODAY).map((a) => a.id)).toEqual(['b2', 'b1', 'b3']);
    expect(activeAds(ads, 'board', TODAY).map((a) => a.id)).toEqual(['b6']);
    const link = adPayLink(AD({ price: 550, advertiser: 'מאפיית אבי' }), 'https://pay.example.org/p');
    expect(link).toContain('amount=550');
    expect(adPayLink(AD({ price: 550 }), 'http://insecure.example.org')).toBeNull();
  });
  it('nextDialCode: מקסימום+1 (מ-101), לא ממחזר קוד-של-נמחק; מלא ⇒ הפער הנמוך', () => {
    expect(nextDialCode([])).toBe('101');
    expect(nextDialCode([L({ dialCode: '101' }), L({ dialCode: '105' }), L({ dialCode: '' })])).toBe('106');
    expect(nextDialCode([L({ dialCode: '101' }), L({ dialCode: '103' })])).toBe('104'); // 102 (נמחק) לא ממוחזר
    expect(nextDialCode([L({ dialCode: '101' }), L({ dialCode: '999' })])).toBe('102');
    expect(dialCodeTaken([L({ id: 'z1', dialCode: '101' })], '101')).toBe(true);
    expect(dialCodeTaken([L({ id: 'z1', dialCode: '101' })], '101', 'z1')).toBe(false);
  });
  it('listingsCsvRows: מאושרים בלבד, לפי שער ואז שם, בלי הערה-פנימית; הזרקת-נוסחה מנוטרלת ב-toCsv', () => {
    const rows = listingsCsvRows(
      [
        { ...gardener, notes: 'סוד פנימי' },
        { ...plumber, dialCode: '101' },
        { ...cleaner, status: 'pending' },
        L({ id: 'evil', name: '=HYPERLINK("http://x")', category: 'other', status: 'approved' }),
      ],
      TODAY,
    );
    expect(rows[0][0]).toBe('קוד חיוג');
    expect(rows.slice(1).map((r) => r[2])).toEqual(['אינסטלציה זילברמן', 'גינון עדן', '=HYPERLINK("http://x")']);
    expect(rows[1][0]).toBe('101');
    expect(JSON.stringify(rows)).not.toContain('סוד פנימי');
    expect(toCsv(rows)).toContain('"\'=HYPERLINK(""http://x"")"');
  });
});

describe('🛡 טוהר ובידוד (הכרעה 4)', () => {
  it('המנוע לא נוגע בקבלות/תרומות/מונים/לוח-ראשי, ולא ב-store/DOM/Date.now', () => {
    for (const [name, src] of [['lib', libSrc], ['zmanimBoard', zmanimSrc], ['booklet', bookletSrc], ['model', modelSrc]] as const) {
      for (const kw of ['receiptSeq', 'donationSeq', 'shopReceiptSeq', 'donations', 'upsertEvent', 'OrgEvent', 'useApp']) {
        expect(src, name + ' מזכיר ' + kw).not.toContain(kw);
      }
      expect(src, name + ' — db.events').not.toMatch(/\bdb\.events\b/);
      expect(src, name + ' — שעון לא-מוזרק').not.toMatch(/Date\.now\(|new Date\(\)/);
      expect(src, name + ' — DOM').not.toMatch(/\bdocument\.|\bwindow\./);
    }
  });
});
