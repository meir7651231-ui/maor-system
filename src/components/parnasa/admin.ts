/**
 * 📒 פרנסה׳לע — "ניהול" של המקור (עיצוב 6), הליבה הטהורה: ההכנסות (revenue במקור — 4 אריחי-KPI, הפנקס החודשי, החוברת
 * והמשרות המקודמות), הכרטיסים המודגשים (פעילים ופגי-תוקף; "עד שיבוטל"), החסויות (דף הבית · מטבע הפלטינה · 15 השערים)
 * ורשימות-הניהול (ממתינים · הוזנו ע״י הגבאי · מוסתרים). בלי store/DOM; היום מוזרק.
 * **רישום בלבד** (הכרעה 4): סכומים מוצגים ונסכמים — אפס קבלות, אפס מונים, אפס תרומות.
 */
import type { IsoDate, ParnasaPrefs, PrAd, PrListing, PrRequest } from '../../types/domain';
import { adActiveOn, adsLedger, isFeatured, PR_CATEGORIES, priceOf } from './lib';

/** "בתוקף עד" ריק בטופס-ההדגשה = עד שיבוטל — נשמר כתאריך-רחוק (isFeatured עובד בלי שינוי, בלי שדה חדש). */
export const PR_FEATURED_OPEN: IsoDate = '9999-12-31';

/** הדגשה "עד שיבוטל". */
export const featuredOpen = (l: Pick<PrListing, 'featuredUntil'>): boolean => l.featuredUntil === PR_FEATURED_OPEN;

const amt = (n: unknown): number => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0);

/** מחיר-ההדגשה לחודש: מה שהוסכם (promoPrice), אחרת מחירון "כרטיס מודגש". */
export function featuredPrice(l: PrListing, prefs: ParnasaPrefs | null | undefined): number {
  return typeof l.promoPrice === 'number' && Number.isFinite(l.promoPrice) && l.promoPrice >= 0 ? l.promoPrice : priceOf(prefs, 'featured');
}

/** חסות פעילה היום (שער · מטבע-פלטינה · דף-הבית) — לא מודעת-חוברת. */
export const isSponsorship = (a: PrAd): boolean => a.slot === 'category' || a.slot === 'board';

/** מודעות-החוברת שבספר (פעילות, שלא פגו — כמו bookletPlan). */
export function bookletAdsOf(ads: readonly PrAd[], todayIso: IsoDate): PrAd[] {
  return ads.filter((a) => a.slot === 'booklet' && a.active !== false && (!a.to || a.to >= todayIso));
}

export interface PnRevenue {
  /** כל הכרטיסים שהודגשו אי-פעם (featuredUntil) — פעילים ראשונים. */
  feats: PrListing[];
  featAct: PrListing[];
  featSum: number;
  /** חסויות פעילות היום. */
  spons: PrAd[];
  spSum: number;
  /** כמה מ-15 השערים בחסות היום (בלי המטבע). */
  gatesOn: number;
  homeOn: boolean;
  coinOn: boolean;
  /** הקדשה בראש האלפון (נוסח לא ריק) ומחירה מהמחירון. */
  ded: boolean;
  dedSum: number;
  /** משרות שקודמו (promoAt) — הכנסה חד-פעמית. */
  jobs: PrRequest[];
  jobSum: number;
  /** מודעות-החוברת. */
  ads: PrAd[];
  adSum: number;
  adPaid: number;
  adDue: number;
  /** ממתין לגבייה בכל המשבצות (adsLedger — מודעות + חסויות שהגיע זמנן ולא סומנו "שולם"; הפורט עוקב גם אחרי החסויות). */
  due: number;
  /** הכנסה חודשית קבועה = מודגשים + חסויות + הקדשה. */
  monthly: number;
  /** צפי לשנה = חודשית × 12 + חוברת + משרות. */
  year: number;
}

/** revenue() של המקור, מעל מודל הפורט. */
export function revenueOf(
  snap: { listings: readonly PrListing[]; ads: readonly PrAd[]; requests: readonly PrRequest[]; prefs?: ParnasaPrefs | null },
  todayIso: IsoDate,
): PnRevenue {
  const prefs = snap.prefs ?? null;
  const feats = snap.listings
    .filter((l) => !!l.featuredUntil)
    .map((l, i) => ({ l, i, on: isFeatured(l, todayIso) }))
    .sort((a, b) => Number(b.on) - Number(a.on) || a.i - b.i)
    .map((x) => x.l);
  const featAct = feats.filter((l) => isFeatured(l, todayIso));
  const featSum = featAct.reduce((t, l) => t + featuredPrice(l, prefs), 0);
  const spons = snap.ads.filter((a) => isSponsorship(a) && adActiveOn(a, todayIso) && a.advertiser.trim());
  const spSum = spons.reduce((t, a) => t + amt(a.price), 0);
  const known = new Set<string>(PR_CATEGORIES.map((c) => c.key));
  const gatesOn = new Set(spons.filter((a) => a.slot === 'category' && !a.coin && known.has(a.target)).map((a) => a.target)).size;
  const homeOn = spons.some((a) => a.slot === 'board');
  const coinOn = spons.some((a) => a.slot === 'category' && a.coin === true);
  const ded = !!String(prefs?.dedication ?? '').trim();
  const dedSum = ded ? priceOf(prefs, 'dedication') : 0;
  const jobs = snap.requests.filter((r) => r.job && !!r.promoAt);
  const jobSum = jobs.reduce((t, r) => t + amt(r.promoPrice), 0);
  const ads = bookletAdsOf(snap.ads, todayIso);
  const adSum = ads.reduce((t, a) => t + amt(a.price), 0);
  const adPaid = ads.filter((a) => a.paid).reduce((t, a) => t + amt(a.price), 0);
  const due = adsLedger(snap.ads, todayIso).due;
  const monthly = featSum + spSum + dedSum;
  return { feats, featAct, featSum, spons, spSum, gatesOn, homeOn, coinOn, ded, dedSum, jobs, jobSum, ads, adSum, adPaid, adDue: adSum - adPaid, due, monthly, year: monthly * 12 + adSum + jobSum };
}

/** "N מתוך 15 · ודף הבית · ומטבע הפלטינה" (spN במקור). */
export function sponsorCountText(r: Pick<PnRevenue, 'gatesOn' | 'homeOn' | 'coinOn'>): string {
  return r.gatesOn + ' מתוך ' + PR_CATEGORIES.length + (r.homeOn ? ' · ודף הבית' : '') + (r.coinOn ? ' · ומטבע הפלטינה' : '');
}

/** pl() של המקור: 1 ⇒ הצורה-ליחיד, אחרת "N רבים". */
export const pl = (n: number, one: string, many: string): string => (n === 1 ? one : n + ' ' + many);

/** "1,234 ₪" (nis במקור). */
export const nis = (n: number): string => Math.round(Number.isFinite(n) ? n : 0).toLocaleString('en-US') + ' ₪';

/** רשימות-הניהול (renderAdmin): ממתינים · הוזנו ע״י הגבאי · מוסתרים — בסדר-השמירה. */
export function adminLists(listings: readonly PrListing[]): { pend: PrListing[]; man: PrListing[]; hid: PrListing[] } {
  return {
    pend: listings.filter((l) => l.status === 'pending'),
    man: listings.filter((l) => l.source === 'gabbai'),
    hid: listings.filter((l) => l.status === 'rejected'),
  };
}
