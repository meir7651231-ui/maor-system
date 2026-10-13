/**
 * 📒 פרנסה׳לע — מעברי-המצב הטהורים שה-store מפעיל (אשכול 4, BUILD-ORDER-PARNASA-2026-10-12).
 *
 * קטן ותלוי-domain/config בלבד **במכוון**: ה-store המרכזי (בבנדל-הראשי) מייבא רק את הקובץ הזה —
 * לא את lib.ts (מילון-המושגים/חיפוש/זמנים/חוברת), שנשאר בצ'אנק-העצל של המסך. lib.ts מייצא-מחדש
 * את כל מה שכאן, כך שהממשק והבדיקות ממשיכים לייבא מ-'./lib' בלי שינוי.
 *
 * מה כאן: מכונת-האישור (עסקים + מודעות-לוח) · שמירת בקשה/תשובה/סגירה (שקטה ⇒ מחיקה) · שמירת
 * פרסומת (מחיר/תקופה/סימון-תשלום — רישום בלבד, אפס קבלות) · קודי-חיוג · הרשאת-גבאי אחידה.
 * בלי store/DOM/Date.now — "עכשיו" מוזרק (nowIso / תאריכים) ⇒ דטרמיניסטי ונבדק-ביחידה.
 * בידוד (הכרעה 4): אין כאן — ולא יהיה — שום נגיעה בקבלות/תרומות/מונים/לוח-ראשי.
 */
import type { IsoDate, ParnasaPrefs, PrAd, PrListing, PrPost, PrRequest, PrResponse, PrStatus } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { canGrantedAction, featureOn } from '../../lib/config';
import { healPrAd, healPrPost, optKeys, PR_AD_SLOTS, PR_CATEGORY_KEYS, PR_LISTING_EXTRA, PR_LISTING_PROMO } from './model';

/* ═══════════════ הרשאת-גבאי ═══════════════ */

/** שתי הפעולות המוגבלות של המודול (GRANTABLE_STAFF_FEATURES) — מנהל/בעלים תמיד, עובד/ת רק בהדלקה. */
export type PrGrantKey = 'parnasa.approve' | 'parnasa.delete';

/**
 * הרשאה אחידה לממשק ול-store (מקור-אמת אחד): הדגל דלוק (כולל שרשור-המודול — opt-in, כבוי כשחסר)
 * **וגם** סמכות-מנהל או הדלקה-פר-עובד (canGrantedAction). לעולם לא `=== true` גולמי (optin-registry).
 */
export function prCan(config: OrgConfig, email: string | null | undefined, isManager: boolean, key: PrGrantKey): boolean {
  return featureOn(config, key) && canGrantedAction(config, email, isManager, key);
}

/* ═══════════════ הגדרות-המודול ═══════════════ */

/** אישור-גבאי לכרטיס חדש — חסר/לא-בוליאני ⇒ true (ברירת-המקור). */
export function requireApprovalOf(prefs?: ParnasaPrefs | null): boolean {
  return prefs?.requireApproval !== false;
}

/* ═══════════════ מכונת-האישור ═══════════════ */

/** מי שומר: מאשר (גבאי — מנהל או בעל-הרשאה parnasa.approve) + מצב-האישור של הקהילה. */
export interface PrActor {
  canApprove: boolean;
  requireApproval: boolean;
  /** מזהה-המבצע (מייל / 'מקומי') — לחותמות-הביקורת. */
  who?: string;
}

const EXTRA_KEYS = optKeys(PR_LISTING_EXTRA);
const PROMO_KEYS = optKeys(PR_LISTING_PROMO);
/** ריק (''/false/0/[]/חסר) ≡ חסר — במפתח-התוכן. */
const blank = (v: unknown): unknown => (v === '' || v === false || v === 0 || v == null || (Array.isArray(v) && !v.length) ? null : v);

/** מפתח-התוכן הציבורי של עסק (נורמלי: חסר ≡ ברירת-מחדל) — שינוי בו = עריכת-תוכן (כולל דף-העסק: לוגו/תמונות/מבצע…). */
function listingContentKey(l: PrListing): string {
  return JSON.stringify([
    l.name, l.title, l.category, l.area, l.city, l.phone, l.phone2, l.whatsapp,
    Array.isArray(l.hours) ? l.hours : [], !!l.always, l.hoursNote,
    Array.isArray(l.services) ? l.services : [], Array.isArray(l.languages) ? l.languages : [],
    l.kashrut, !!l.emergency, l.desc, l.tagline ?? '', l.aud ?? 'all', !!l.disc, !!l.free,
    ...EXTRA_KEYS.map((k) => blank((l as unknown as Record<string, unknown>)[k])),
  ]);
}

/** האם השתנה תוכן ציבורי (לא: הדגשה/קוד-חיוג/הערה-פנימית/המלצות/חותמות). */
export function listingContentChanged(prev: PrListing, next: PrListing): boolean {
  return listingContentKey(prev) !== listingContentKey(next);
}

/**
 * הסטטוס אחרי שמירה:
 *   · חדש — מאשר / אישור-כבוי ⇒ approved; אחרת pending.
 *   · שינוי לא-תוכני (הדגשה/קוד/הערה) ⇒ הסטטוס נשמר.
 *   · עריכת המאשר עצמו ⇒ הסטטוס נשמר (אישור/דחייה = פעולות מפורשות).
 *   · 🛡 עריכת-תוכן ע"י מי שאינו מאשר ⇒ pending — גם לעסק מאושר (תיקון: במקור האישור היה
 *     חד-פעמי ועריכות אחריו עלו בלי בדיקה) וגם לנדחה (הגשה-מחדש). אישור-כבוי: מאושר נשאר מאושר.
 */
export function listingStatusOnSave(prev: PrListing | null, next: PrListing, actor: PrActor): PrStatus {
  if (!prev) return actor.canApprove || !actor.requireApproval ? 'approved' : 'pending';
  if (!listingContentChanged(prev, next)) return prev.status;
  if (actor.canApprove) return prev.status;
  if (prev.status === 'approved' && !actor.requireApproval) return 'approved';
  return 'pending';
}

/**
 * שמירת-עסק (טהור): מחשב סטטוס, חותמות, ומגן על שדות-הגבאי — מי שאינו מאשר לא משנה הדגשה
 * (featuredUntil — קידום בתשלום), קוד-חיוג ומקור-רישום (נלקחים מהקודם; חדש ⇒ ריק/owner).
 */
export function saveListing(prev: PrListing | null, draft: PrListing, actor: PrActor, nowIso: string): PrListing {
  const guarded: PrListing = actor.canApprove
    ? draft
    : {
        ...draft,
        featuredUntil: prev?.featuredUntil ?? '',
        dialCode: prev?.dialCode ?? '',
        source: prev?.source ?? 'owner',
        // קידום = שדות-גבאי (שורת-פרסום/אתר/מחיר/הערה) — נלקחים מהקודם
        ...Object.fromEntries(PROMO_KEYS.map((k) => [k, (prev as unknown as Record<string, unknown> | null)?.[k]])),
      };
  const status = listingStatusOnSave(prev, guarded, actor);
  return { ...guarded, status, createdAt: prev?.createdAt || guarded.createdAt || nowIso, updatedAt: nowIso };
}

/** אישור-גבאי (pending/rejected ⇒ approved) עם חותמת-ביקורת. */
export function approveListing(l: PrListing, who: string, nowIso: string): PrListing {
  return { ...l, status: 'approved', reviewedAt: nowIso, reviewedBy: who };
}

/** דחייה/הסתרה (⇒ rejected) עם חותמת-ביקורת. */
export function rejectListing(l: PrListing, who: string, nowIso: string): PrListing {
  return { ...l, status: 'rejected', reviewedAt: nowIso, reviewedBy: who };
}

const postContentKey = (p: PrPost): string =>
  JSON.stringify([p.kind, p.title, p.text, p.place, p.phone, p.noticeKind, p.prayers, p.days, p.date, p.time, p.until]);

/** אותו כלל למודעות-הלוח: חדשה ⇒ מאושרת רק אם המאשר כתב; עריכת-תוכן ע"י לא-מאשר ⇒ ממתינה. */
export function postApprovedOnSave(prev: PrPost | null, next: PrPost, actor: PrActor): boolean {
  if (!prev) return actor.canApprove;
  if (postContentKey(prev) === postContentKey(next)) return prev.approved;
  if (actor.canApprove) return prev.approved;
  return false;
}

/** שמירת-מודעה (טהור): approved לפי הכלל + חותמות. נעיצה = שדה-גבאי. */
export function savePost(prev: PrPost | null, draft: PrPost, actor: PrActor, nowIso: string): PrPost {
  const guarded: PrPost = actor.canApprove ? draft : { ...draft, pinned: prev?.pinned ?? false };
  return { ...guarded, approved: postApprovedOnSave(prev, guarded, actor), createdAt: prev?.createdAt || guarded.createdAt || nowIso, updatedAt: nowIso };
}

/** אישור-מודעה מפורש (גבאי) — נתלית בלוח. */
export function approvePost(p: PrPost, nowIso: string): PrPost {
  return { ...p, approved: true, updatedAt: nowIso };
}

/**
 * דחייה / "הורדה מהלוח" (גבאי): לא-מאושרת **ותוקף שפג אתמול** — המודל אינו מחזיק סטטוס-דחייה
 * למודעות (additive-free), ולכן "ירדה מהלוח" = פגה: יוצאת גם מהלוח וגם מתור-הממתינים
 * (pendingApprovals מסנן פגות). הרשומה נשמרת (היסטוריה); תוקף שכבר עבר — נשאר כמות-שהוא.
 */
export function takeDownPost(p: PrPost, yesterdayIso: IsoDate, nowIso: string): PrPost {
  const until = p.until && p.until <= yesterdayIso ? p.until : yesterdayIso;
  return { ...p, approved: false, until, updatedAt: nowIso };
}

/**
 * ריפוי-טיוטת-מודעה לפני שמירה (טהור): שדות-חובה/enum/מערכים דרך healPrPost של המודל; כותרת
 * נחתכת-רווחים. מזהה חסר ⇒ fallbackId. לא-אובייקט ⇒ null.
 */
export function normalizePostDraft(draft: PrPost, fallbackId: string): PrPost | null {
  const healed = healPrPost(draft, fallbackId);
  if (!healed) return null;
  return { ...healed, title: String(healed.title).trim() };
}

/* ═══════════════ בקשות — שמירה, תשובה, סגירה ═══════════════ */

/**
 * שמירת-בקשה (טהור): טקסט נחתך-רווחים · שער לא-מוכר ⇒ '' (לא משנה) · 🛡 שקטה ⇒ לעולם לא
 * הצעת-עבודה · פרטי-המבקש נשמרים בנפרד מגוף-הבקשה (לעסקים — רק דרך businessView, בלי זהות).
 * סטטוס/תשובות/חותמת-יצירה/סגירה **נלקחים מהקודם** — העריכה לא נוגעת במחזור-החיים (תשובה ⇒
 * addResponse; סגירה ⇒ closeRequest). חדשה ⇒ open, בלי תשובות.
 */
export function saveRequest(prev: PrRequest | null, draft: PrRequest, nowIso: string): PrRequest {
  const quiet = draft.quiet === true;
  const category = (PR_CATEGORY_KEYS as readonly string[]).includes(draft.category) ? draft.category : '';
  const rq = draft.requester && typeof draft.requester === 'object' ? draft.requester : { name: '', phone: '' };
  const out: PrRequest = {
    ...draft,
    text: String(draft.text ?? '').trim(),
    category,
    area: String(draft.area ?? '').trim(),
    urgent: draft.urgent === true,
    quiet,
    job: !quiet && draft.job === true,
    requester: { ...rq, name: String(rq.name ?? '').trim(), phone: String(rq.phone ?? '').trim() },
    status: prev ? prev.status : 'open',
    responses: prev ? (Array.isArray(prev.responses) ? prev.responses : []) : [],
    createdAt: prev?.createdAt || draft.createdAt || nowIso,
    updatedAt: nowIso,
  };
  if (prev?.closedAt) out.closedAt = prev.closedAt;
  else delete out.closedAt;
  return out;
}

/** תשובה לבקשה (טהור): עסק = תשובה אחת (מחליפה את הקודמת שלו); open ⇒ answered. */
export function addResponse(r: PrRequest, resp: PrResponse, nowIso: string): PrRequest {
  const others = (Array.isArray(r.responses) ? r.responses : []).filter((x) => !(resp.listingId && x.listingId === resp.listingId));
  return {
    ...r,
    responses: [...others, { listingId: resp.listingId, text: String(resp.text ?? ''), at: resp.at || nowIso }],
    status: r.status === 'open' ? 'answered' : r.status,
    updatedAt: nowIso,
  };
}

/**
 * סגירת-בקשה (טהור): רגילה ⇒ closed + חותמת. **שקטה ⇒ null = למחוק אותה ואת כל תשובותיה**
 * (המקור: "נמצא, למחוק הכול" — מידע רגיש לא נשמר אחרי שהבקשה נפתרה).
 */
export function closeRequest(r: PrRequest, nowIso: string): PrRequest | null {
  if (r.quiet === true) return null;
  return { ...r, status: 'closed', closedAt: nowIso, updatedAt: nowIso };
}

/* ═══════════════ פרסומות (רישום + קישור-סליקה בלבד — אפס קבלות) ═══════════════ */

/** שגיאת-טיוטה לפרסומת ('' = תקינה): מפרסם חובה · מחיר מספר סופי ≥0 · שער תקין לחסות-שער · תקופה עקבית. */
export function adDraftError(draft: Pick<PrAd, 'advertiser' | 'price' | 'slot' | 'target' | 'from' | 'to'>): string {
  if (!String(draft.advertiser ?? '').trim()) return 'שם המפרסם הוא שדה חובה';
  if (!(typeof draft.price === 'number' && Number.isFinite(draft.price) && draft.price >= 0)) return 'המחיר חייב להיות מספר (0 ומעלה)';
  if (!(PR_AD_SLOTS as readonly string[]).includes(draft.slot)) return 'משבצת לא מוכרת';
  if (draft.slot === 'category' && !(PR_CATEGORY_KEYS as readonly string[]).includes(draft.target)) return 'בחרו את השער שבחסות';
  if (draft.from && draft.to && draft.from > draft.to) return 'תאריך הסיום לפני תאריך ההתחלה';
  return '';
}

/**
 * שמירת-פרסומת (טהור): גודל עקבי למשבצת (חוברת ⇒ full/half/small, אחרת line — דרך healPrAd) ·
 * מפרסם/כותרת נחתכים · סימון-תשלום: false⇒true חותם paidAt=עכשיו (נשמר בעריכה חוזרת),
 * true⇒false מנקה. **רישום בלבד — לא קבלה, לא מונה, לא תרומה.**
 */
export function saveAd(prev: PrAd | null, draft: PrAd, nowIso: string): PrAd {
  const healed = healPrAd(draft, draft.id) ?? draft;
  const paid = healed.paid === true;
  return {
    ...healed,
    advertiser: String(healed.advertiser).trim(),
    headline: String(healed.headline).trim(),
    target: String(healed.target).trim(),
    paid,
    paidAt: paid ? (prev?.paid && prev.paidAt ? prev.paidAt : healed.paidAt || nowIso) : '',
    createdAt: prev?.createdAt || healed.createdAt || nowIso,
    updatedAt: nowIso,
  };
}

/* ═══════════════ קוד-חיוג ═══════════════ */

export const PR_DIAL_MIN = 101;
export const PR_DIAL_MAX = 999;

/**
 * הקוד הבא (בן 3 ספרות): מקסימום-קיים + 1 (מינימום 101) — **לא ממחזרים** קוד של עסק שנמחק כל
 * עוד יש מקום (חוברת מודפסת עלולה עוד להפנות אליו); רק כשמגיעים ל-999 — הפער הנמוך הפנוי. אין ⇒ ''.
 */
export function nextDialCode(listings: readonly PrListing[]): string {
  const used = new Set<number>();
  for (const l of listings) if (typeof l.dialCode === 'string' && /^\d{3}$/.test(l.dialCode)) used.add(Number(l.dialCode));
  let max = PR_DIAL_MIN - 1;
  for (const n of used) if (n > max) max = n;
  if (max < PR_DIAL_MAX) return String(max + 1);
  for (let n = PR_DIAL_MIN; n <= PR_DIAL_MAX; n++) if (!used.has(n)) return String(n);
  return '';
}

/** האם קוד תפוס (חוץ מהעסק עצמו). */
export function dialCodeTaken(listings: readonly PrListing[], code: string, exceptId?: string): boolean {
  return listings.some((l) => l.id !== exceptId && l.dialCode === code);
}

/** קוד-חיוג תקין לשמירה: '' (טרם הוקצה) או 3 ספרות בטווח 101–999. */
export function validDialCode(code: string): boolean {
  if (code === '') return true;
  if (!/^\d{3}$/.test(code)) return false;
  const n = Number(code);
  return n >= PR_DIAL_MIN && n <= PR_DIAL_MAX;
}
