/**
 * 🪙 מנוי «גבי» דרך אורביט (הכרעת-בעלים 8.11.2026: **העסקים משלמים על גבי דרך אורביט** —
 * אורביט מחייב, גבי לא מנהל חיוב משלו). מודול **טהור** (בלי store/DOM/רשת).
 *
 * הרשומה: `platformOrgs/{slug}.billing.gabi` — היכן שאורביט שומר נתוני-פלטפורמה פר-ארגון.
 * כותב = מייל-על בלבד (Rules קיימים: עדכון-מנהל מוגבל ל-members/memberConfigs/joinOpen/joinCode
 * ⇒ אפס שינוי-Rules; red-team §י״ד מוכיח). קורא = מנהל/חברי-הארגון (תצוגה ב-GabiSection).
 *
 * החיוב עצמו: **קישור-תשלום** (`payLink` — אותו דפוס של הרחבת payments): המייל-על מזין את
 * עמוד-הסליקה של אורביט ברשומה (`payUrl`, https בלבד); המנהל לוחץ ⇒ נפתח עמוד-הספק עם הסכום.
 * אין טיפול-בכרטיס בקוד, אין webhook כאן; את `status/paidUntil` המייל-על מעדכן אחרי שהתשלום נכנס.
 *
 * הזכאות לגבי: `functions/gabiHandoff.js` חותם (מפתח-פלטפורמה GABI_ENTITLEMENT_KEY — **לא** סוד-
 * המסירה הפר-ארגוני, שהלקוח המשלם עצמו מחזיק) טוקן קצר-מועד שנמסר לגבי ב-fragment של המסירה
 * (`#h=…&e=…`). כאן: הקנוניקה + מאמת-ייחוס (וקטור-זהב TS/Node/Python) + אותם כללי-הערכה
 * כמו collect-agent/app/orbit_entitlement.py (ניסיון 14 · חסד 7 · cancelled ⇒ עצירה).
 *
 * דורמנטי: כל המשטחים מאחורי `integrationOn(cfg,'gabi')` ⇒ ביט-זהה לכל ארגון קיים.
 */
import { safeHttpsUrl } from './config';
import { payLink } from './payLink';
import { GABI_PRODUCT } from './gabi';

export const GABI_PLANS = ['monthly', 'yearly'] as const;
export type GabiPlan = (typeof GABI_PLANS)[number];
export const GABI_SUB_STATUSES = ['trial', 'active', 'past_due', 'cancelled'] as const;
export type GabiSubStatus = (typeof GABI_SUB_STATUSES)[number];
/** ימי-חסד אחרי paidUntil (past_due, או active שלא רוענן) — זהה ל-GRACE_DAYS בגבי. */
export const GABI_GRACE_DAYS = 7;
/** התראה לפני סוף-הניסיון — כמו TERMS §8 של גבי. */
export const GABI_WARN_DAYS = 3;

export interface GabiSubscription {
  plan: GabiPlan;
  status: GabiSubStatus;
  /** YYYY-MM-DD — תחילת הניסיון (14 יום) כפי שאורביט קובע. */
  trialStart: string;
  /** YYYY-MM-DD — עד מתי שולם (כולל). '' כשאין. */
  paidUntil: string;
  /** עמוד-הסליקה של אורביט לחיוב הזה (https בלבד). '' = טרם הוגדר. */
  payUrl: string;
  updatedAt?: string;
  updatedBy?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(s + 'T12:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/**
 * חיטוי רשומה (מהענן או מהטופס). סכמה סגורה: שדות לא-מוכרים נזרקים; ערכים פסולים ⇒ null
 * (לא "מתקנים" מצב-חיוב בשקט). trial ⇒ trialStart חובה; active/past_due ⇒ paidUntil חובה.
 */
export function normalizeGabiSubscription(raw: unknown): GabiSubscription | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const plan = str(r.plan) as GabiPlan;
  const status = str(r.status) as GabiSubStatus;
  if (!GABI_PLANS.includes(plan) || !GABI_SUB_STATUSES.includes(status)) return null;
  const trialStart = str(r.trialStart);
  const paidUntil = str(r.paidUntil);
  if (trialStart && !validDate(trialStart)) return null;
  if (paidUntil && !validDate(paidUntil)) return null;
  if (status === 'trial' && !trialStart) return null;
  if ((status === 'active' || status === 'past_due') && !paidUntil) return null;
  const payUrl = safeHttpsUrl(str(r.payUrl)) ?? '';
  const out: GabiSubscription = { plan, status, trialStart, paidUntil, payUrl };
  if (str(r.updatedAt)) out.updatedAt = str(r.updatedAt).slice(0, 40);
  if (str(r.updatedBy)) out.updatedBy = str(r.updatedBy).toLowerCase().slice(0, 254);
  return out;
}

/** המחיר היחיד (הכרעת מאיר 6.11): ₪119/חודש · ₪1,190/שנה. */
export function gabiPlanPrice(plan: GabiPlan): number {
  return plan === 'yearly' ? GABI_PRODUCT.priceYearly : GABI_PRODUCT.priceMonthly;
}

export function gabiPlanLabel(plan: GabiPlan): string {
  return plan === 'yearly' ? `שנתי · ₪${gabiPlanPrice('yearly').toLocaleString('en-US')}/שנה` : `חודשי · ₪${gabiPlanPrice('monthly')}/חודש`;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso + 'T12:00:00Z') - Date.parse(fromIso + 'T12:00:00Z')) / 86_400_000);
}

export type GabiBillingStateKey = 'trial' | 'trial_expired' | 'active' | 'grace' | 'expired' | 'cancelled';

export interface GabiBillingState {
  state: GabiBillingStateKey;
  /** האם גבי מתכנן/שולח תזכורות. */
  active: boolean;
  /** סוף-הניסיון / paidUntil (YYYY-MM-DD) או null. */
  ends: string | null;
  graceUntil: string | null;
  daysLeft: number | null;
  endingSoon: boolean;
}

/**
 * הערכה — **אותם כללים בדיוק** כמו `evaluate` ב-collect-agent/app/orbit_entitlement.py
 * (טבלת-מקרים משותפת בשתי הבדיקות). היום מוזרק (YYYY-MM-DD) ⇒ דטרמיניסטי.
 */
export function gabiBillingState(sub: GabiSubscription, todayIso: string, trialDays: number = GABI_PRODUCT.trialDays): GabiBillingState {
  const none = { graceUntil: null, daysLeft: null, endingSoon: false };
  if (sub.status === 'trial') {
    const ends = addDays(sub.trialStart, trialDays);
    const left = daysBetween(todayIso, ends);
    const active = left > 0;
    return { ...none, state: active ? 'trial' : 'trial_expired', active, ends, daysLeft: Math.max(left, 0), endingSoon: left > 0 && left <= GABI_WARN_DAYS };
  }
  if (sub.status === 'cancelled') return { ...none, state: 'cancelled', active: false, ends: sub.paidUntil || null };
  const paid = sub.paidUntil;
  const grace = addDays(paid, GABI_GRACE_DAYS);
  if (sub.status === 'active' && todayIso <= paid) {
    return { ...none, state: 'active', active: true, ends: paid, daysLeft: daysBetween(todayIso, paid) };
  }
  if (todayIso <= grace) return { ...none, state: 'grace', active: true, ends: paid, graceUntil: grace, daysLeft: daysBetween(todayIso, grace) };
  return { ...none, state: 'expired', active: false, ends: paid, graceUntil: grace };
}

/** שורת-מצב בעברית לכרטיס-המנוי. */
export function gabiBillingLine(st: GabiBillingState): string {
  switch (st.state) {
    case 'trial':
      return `ניסיון פעיל — נותרו ${st.daysLeft} ימים (עד ${st.ends}). לא יבוצע חיוב אוטומטי.`;
    case 'trial_expired':
      return `תקופת הניסיון הסתיימה (${st.ends}) — גבי לא שולח תזכורות חדשות עד התשלום.`;
    case 'active':
      return `מנוי פעיל — שולם עד ${st.ends}.`;
    case 'grace':
      return `התשלום טרם התקבל — גבי ממשיך לשלוח עד ${st.graceUntil}, ולאחר מכן ייעצר.`;
    case 'expired':
      return `המנוי הסתיים (שולם עד ${st.ends}) — גבי לא שולח תזכורות חדשות.`;
    case 'cancelled':
      return 'המנוי בוטל — גבי לא שולח תזכורות חדשות.';
  }
}

/**
 * קישור-התשלום (payLink — עמוד-הסליקה של אורביט; אין סליקה בקוד). בלי payUrl / מנוי פעיל
 * בתוקף ⇒ null (אין כפתור). הסכום = מחיר-המסלול בלבד.
 */
export function gabiBillingPayLink(sub: GabiSubscription, st: GabiBillingState, slug: string): string | null {
  if (!sub.payUrl || sub.status === 'cancelled') return null;
  if (st.state === 'active' && (st.daysLeft ?? 0) > GABI_WARN_DAYS) return null;
  return payLink(sub.payUrl, gabiPlanPrice(sub.plan), `גבי · ${slug} · ${sub.plan === 'yearly' ? 'שנתי' : 'חודשי'}`);
}

/* ── טוקן-הזכאות (Orbit → Gabi) — קנוניקה + מאמת-ייחוס בלבד; החתימה בשרת ─────────── */

export const GABI_ENTITLEMENT_CONTEXT = 'gabi-entitlement-v1.';
export const GABI_ENTITLEMENT_MAX_TTL = 300;

export interface GabiEntitlementClaims {
  v: 1;
  iss: 'orbit';
  aud: 'gabi';
  typ: 'entitlement';
  org: string;
  plan: GabiPlan;
  status: GabiSubStatus;
  trial_start: string;
  paid_until: string;
  billing_url: string;
  iat: number;
  exp: number;
}

/** JSON קנוני (סדר-שדות קבוע) — זהה ל-functions/gabiHandoff.js ול-canonical_payload בגבי. */
export function gabiEntitlementJson(c: GabiEntitlementClaims): string {
  return JSON.stringify({
    v: c.v, iss: c.iss, aud: c.aud, typ: c.typ, org: c.org, plan: c.plan, status: c.status,
    trial_start: c.trial_start, paid_until: c.paid_until, billing_url: c.billing_url, iat: c.iat, exp: c.exp,
  });
}

function b64urlDecode(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) return null;
  try {
    const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
    return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  } catch {
    return null;
  }
}

/**
 * מאמת-ייחוס (מה שגבי עושה) — לבדיקות ולתיעוד-החוזה. הדפדפן **לעולם לא** מחזיק את המפתח;
 * לכן אין כאן חותם. השוואת-חתימה בזמן-קבוע.
 */
export async function verifyGabiEntitlement(token: string, key: string, nowSec: number): Promise<GabiEntitlementClaims | null> {
  const parts = (token || '').split('.');
  if (parts.length !== 2 || (key || '').length < 32) return null;
  const raw = b64urlDecode(parts[0]);
  const sig = b64urlDecode(parts[1]);
  if (!raw || !sig) return null;
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expect = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(GABI_ENTITLEMENT_CONTEXT + parts[0])));
  let diff = expect.length ^ sig.length;
  for (let i = 0; i < expect.length; i++) diff |= expect[i] ^ (sig[i] ?? 0);
  if (diff !== 0) return null;
  let c: GabiEntitlementClaims;
  try {
    c = JSON.parse(new TextDecoder().decode(raw)) as GabiEntitlementClaims;
  } catch {
    return null;
  }
  if (c.v !== 1 || c.iss !== 'orbit' || c.aud !== 'gabi' || c.typ !== 'entitlement') return null;
  if (gabiEntitlementJson(c) !== new TextDecoder().decode(raw)) return null; // סכמה סגורה
  if (!(c.exp > c.iat) || c.exp - c.iat > GABI_ENTITLEMENT_MAX_TTL) return null;
  if (nowSec >= c.exp || nowSec < c.iat - 60) return null;
  return c;
}
