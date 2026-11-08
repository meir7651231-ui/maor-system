/**
 * 🪙 גבי – תזכורות תשלום — צד-אורביט של המכירה (הרחבת `gabi`, 7.11.2026).
 *
 * גבי הוא מוצר נפרד (‏collect-agent/) שיימכר **בתוך** אורביט כהרחבה. הוא טרם הושק ⇒
 * ‏INTEGRATION_STATUS.gabi = 'roadmap': לא נמכר באשף, לא מתומחר ב-liveAddons, לא מובטח
 * בדף-המסירה. כל המשטחים מגודרים `integrationOn(cfg,'gabi')` — חסר=כבוי ⇒ ביט-זהה לכל
 * ארגון קיים (ratchet: gabi-store.test).
 *
 * המודול **טהור** (בלי store/DOM/רשת): קטלוג-המוצר + חוזה-המסירה החתום ("handoff")
 * שפותח את גבי עם זהות-הארגון. החוזה המלא: knowledge/BUILD-ORDER-GABI-STORE-2026-11-07.md.
 *
 * ‏חוזה-המסירה v1 (תמציתית):
 *   token = b64url(JSON(claims)) + '.' + b64url(HMAC-SHA256(secret, 'gabi-handoff-v1.' + b64url(JSON(claims))))
 *   claims = { v:1, iss:'orbit', aud:'gabi', org, email, iat, exp, nonce }
 *   ‏exp−iat ≤ 300 שניות (קצר-מועד); nonce = חד-פעמי (גבי דוחה nonce שכבר נראה עד exp).
 *   הכתובת: `{baseUrl}/connect/orbit#h={token}` — ב-fragment (לא נשלח לשרת/Referer/לוגים).
 * הסוד: סוד-משותף פר-ארגון שגבי מנפיק. **לעולם לא בקוד ולא בקונפיג** (הקונפיג מסתנכרן
 * לענן/גיבוי) — נמסר לפונקציית-החתימה כפרמטר בלבד.
 */
import { integrationOn, integrationSetting, isAdminAuthority, safeHttpsUrl } from './config';
import type { OrgConfig } from '../types/config';

/** קטלוג-המוצר — הקופי הרשמי (הכרעת-בעלים). מחיר = של גבי עצמו, לא תוספת-אורביט. */
export const GABI_PRODUCT = {
  key: 'gabi',
  name: 'גבי – תזכורות תשלום',
  slogan: 'הכסף שלך חוזר. בלי שתצטרך לרדוף.',
  priceMonthly: 119,
  priceYearly: 1190,
  trialDays: 14,
  /** הלוגו הסופי — עותק של collect-agent/web/public/logo-mark.svg (לא ייבוא חוצה-פרויקטים). */
  logoSrc: '/gabi/logo-mark.svg',
} as const;

/** שורת-מחיר לתצוגה: ‏"₪119/חודש או ₪1,190/שנה · 14 ימי ניסיון". */
export function gabiPriceLine(): string {
  const fmt = (n: number) => '₪' + n.toLocaleString('en-US');
  return `${fmt(GABI_PRODUCT.priceMonthly)}/חודש או ${fmt(GABI_PRODUCT.priceYearly)}/שנה · ${GABI_PRODUCT.trialDays} ימי ניסיון`;
}

/* ── חוזה-המסירה ───────────────────────────────────────────────────────── */

export const GABI_HANDOFF_VERSION = 1 as const;
/** תוקף ברירת-מחדל ותקרה (שניות). גבי דוחה כל טוקן שחי יותר מהתקרה. */
export const GABI_HANDOFF_TTL = 120;
export const GABI_HANDOFF_MAX_TTL = 300;
/** תחילית-ההפרדה בחתימה — מונעת שימוש-חוזר של אותו סוד בהקשר אחר. */
const SIG_CONTEXT = 'gabi-handoff-v1.';
/** סוד קצר מזה נדחה (≥128 ביט כ-hex/base64). */
export const GABI_SECRET_MIN_LEN = 32;

export interface GabiHandoffClaims {
  v: typeof GABI_HANDOFF_VERSION;
  iss: 'orbit';
  aud: 'gabi';
  /** slug הארגון באורביט. */
  org: string;
  /** מייל מנהל-הארגון (lowercase) — מי שלחץ. */
  email: string;
  /** שניות-epoch. */
  iat: number;
  exp: number;
  /** חד-פעמי, ‏16–64 תווים [A-Za-z0-9_-]. */
  nonce: string;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NONCE_RE = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * בניית ה-claims — **השעה וה-nonce מוזרקים** (דטרמיניסטי, נבדק ביחידה). קלט פסול ⇒ null
 * (לא זורק): slug ריק/'default'/'demo' (אתר-השורש והדמו לא מתחברים), מייל לא-תקין, ttl מחוץ לטווח.
 */
export function buildGabiHandoffClaims(input: {
  slug: string;
  email: string;
  nowSec: number;
  nonce: string;
  ttlSec?: number;
}): GabiHandoffClaims | null {
  const org = (input.slug || '').trim().toLowerCase();
  const email = (input.email || '').trim().toLowerCase();
  const ttl = input.ttlSec ?? GABI_HANDOFF_TTL;
  if (!SLUG_RE.test(org) || org === 'default' || org === 'demo') return null;
  if (!EMAIL_RE.test(email) || email.length > 254) return null;
  if (!Number.isInteger(input.nowSec) || input.nowSec <= 0) return null;
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > GABI_HANDOFF_MAX_TTL) return null;
  if (!NONCE_RE.test(input.nonce)) return null;
  return { v: GABI_HANDOFF_VERSION, iss: 'orbit', aud: 'gabi', org, email, iat: input.nowSec, exp: input.nowSec + ttl, nonce: input.nonce };
}

/** סדר-שדות קנוני (JSON יציב) — חתימה זהה לאותם claims בכל מנוע. */
function canonicalJson(c: GabiHandoffClaims): string {
  return JSON.stringify({ v: c.v, iss: c.iss, aud: c.aud, org: c.org, email: c.email, iat: c.iat, exp: c.exp, nonce: c.nonce });
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null;
  try {
    const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

async function hmac(secret: string, msg: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}

/** חתימת-טוקן. סוד קצר מ-GABI_SECRET_MIN_LEN ⇒ null (לא חותמים בסוד חלש). */
export async function signGabiHandoff(claims: GabiHandoffClaims, secret: string): Promise<string | null> {
  const s = (secret || '').trim();
  if (s.length < GABI_SECRET_MIN_LEN) return null;
  const payload = bytesToB64url(new TextEncoder().encode(canonicalJson(claims)));
  const sig = bytesToB64url(await hmac(s, SIG_CONTEXT + payload));
  return payload + '.' + sig;
}

export type GabiVerifyResult =
  | { ok: true; claims: GabiHandoffClaims }
  | { ok: false; reason: 'format' | 'signature' | 'expired' | 'ttl' | 'claims' };

/**
 * מאמת-ייחוס (מה שגבי עושה בצד שלו) — כאן לבדיקות ולתיעוד-החוזה. השוואת-חתימה
 * בזמן-קבוע. **אינו** בודק nonce-חוזר (זה מצב-שרת של גבי).
 */
export async function verifyGabiHandoff(token: string, secret: string, nowSec: number): Promise<GabiVerifyResult> {
  const parts = (token || '').split('.');
  if (parts.length !== 2) return { ok: false, reason: 'format' };
  const [payload, sig] = parts;
  const raw = b64urlToBytes(payload);
  const sigBytes = b64urlToBytes(sig);
  if (!raw || !sigBytes) return { ok: false, reason: 'format' };
  const s = (secret || '').trim();
  if (s.length < GABI_SECRET_MIN_LEN) return { ok: false, reason: 'signature' };
  const expect = await hmac(s, SIG_CONTEXT + payload);
  let diff = expect.length ^ sigBytes.length;
  for (let i = 0; i < expect.length; i++) diff |= expect[i] ^ (sigBytes[i] ?? 0);
  if (diff !== 0) return { ok: false, reason: 'signature' };
  let c: GabiHandoffClaims;
  try {
    c = JSON.parse(new TextDecoder().decode(raw)) as GabiHandoffClaims;
  } catch {
    return { ok: false, reason: 'format' };
  }
  const re = buildGabiHandoffClaims({ slug: c.org, email: c.email, nowSec: c.iat, nonce: c.nonce, ttlSec: c.exp - c.iat });
  if (!re || c.v !== GABI_HANDOFF_VERSION || c.iss !== 'orbit' || c.aud !== 'gabi' || re.org !== c.org || re.email !== c.email) {
    return { ok: false, reason: c.exp - c.iat > GABI_HANDOFF_MAX_TTL ? 'ttl' : 'claims' };
  }
  if (nowSec >= c.exp || nowSec < c.iat - 60) return { ok: false, reason: 'expired' };
  return { ok: true, claims: c };
}

/**
 * כתובת-הכניסה לגבי: בסיס https בלבד (safeHttpsUrl — הקונפיג מגיע מהענן) + נתיב קבוע +
 * הטוקן ב-fragment. בסיס לא-תקין ⇒ null (הכפתור לא נפתח).
 */
export function gabiConnectUrl(baseUrl: string, token: string): string | null {
  const base = safeHttpsUrl(baseUrl);
  if (!base || !token || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  const u = new URL(base);
  u.pathname = u.pathname.replace(/\/+$/, '') + '/connect/orbit';
  u.search = '';
  u.hash = 'h=' + token;
  return u.toString();
}

/** nonce אקראי (16 בתים ⇒ 22 תווי b64url). ה-UI קורא לזה; הבדיקות מזריקות ערך קבוע. */
export function newGabiNonce(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return bytesToB64url(b);
}

/** מסירה מלאה: claims → חתימה → כתובת. כל כשל ⇒ null (הכפתור מציג סיבה, לא נפתח). */
export async function buildGabiHandoffUrl(input: {
  baseUrl: string;
  slug: string;
  email: string;
  secret: string;
  nowSec: number;
  nonce: string;
  ttlSec?: number;
}): Promise<string | null> {
  if (!safeHttpsUrl(input.baseUrl)) return null;
  const claims = buildGabiHandoffClaims(input);
  if (!claims) return null;
  const token = await signGabiHandoff(claims, input.secret);
  return token ? gabiConnectUrl(input.baseUrl, token) : null;
}

/* ── שערי-התצוגה (טהורים — GabiSection והבדיקות חולקים אותם) ───────────────── */

/** האם סעיף-גבי מוצג: ההרחבה הודלקה במפורש (חסר=כבוי) + סמכות-מנהל אפקטיבית. */
export function gabiSectionVisible(config: OrgConfig, email: string | null | undefined, isManager: boolean): boolean {
  return integrationOn(config, 'gabi') && isAdminAuthority(config, email, isManager);
}

/**
 * סיבת-חסימה של כפתור-החיבור ('' = מוכן). הסדר = מה שהמנהל צריך לתקן קודם.
 * ‏`vaultSecret` (v2): הסוד שמור בכספת-השרת (orgSecretsMeta.gabiHandoff) ⇒ החתימה בפונקציה,
 * ולכן אין צורך בסוד מקומי. בלי הפרמטר ⇒ ההתנהגות של v1 ביט-זהה.
 */
export function gabiConnectBlocker(config: OrgConfig, email: string | null | undefined, savedSecret: string, vaultSecret = false): string {
  if (!safeHttpsUrl(integrationSetting(config, 'gabi', 'baseUrl'))) return 'כתובת גבי טרם הוגדרה (אשף ← הרחבות).';
  const slug = config.slug || 'default';
  if (slug === 'default' || slug === 'demo') return 'החיבור זמין לארגון-פלטפורמה בלבד.';
  if (!(email || '').trim()) return 'נדרשת התחברות-ענן כמנהל/ת (המייל נמסר לגבי).';
  if (vaultSecret) return '';
  if ((savedSecret || '').trim().length < GABI_SECRET_MIN_LEN) return `נדרש סוד-חיבור מגבי (לפחות ${GABI_SECRET_MIN_LEN} תווים).`;
  return '';
}

/* ── v2: חתימה בשרת (functions/gabiHandoff.js) ─────────────────────────────── */

/**
 * האם להעדיף את פונקציית-השרת: ענן מוגדר ומחובר + ארגון-פלטפורמה. (הקריאה עצמה —
 * ‏`requestGabiHandoff` ב-lib/cloud, נטען דינמית; המודול הזה נשאר אפס-רשת.)
 */
export function gabiPreferServer(config: OrgConfig, cloudEnabled: boolean, email: string | null | undefined): boolean {
  const slug = config.slug || 'default';
  return !!cloudEnabled && !!config.firebase && !!(email || '').trim() && slug !== 'default' && slug !== 'demo';
}

/**
 * כתובת שהשרת החזיר — מתקבלת רק אם היא **בדיוק** מה ש-gabiConnectUrl היה בונה מהבסיס
 * שבקונפיג (אותו מקור, נתיב /connect/orbit, בלי query, טוקן בפורמט). כל סטייה ⇒ null
 * (לא פותחים לאן שתשובת-רשת אומרת). ‏8.11: מותרת סיומת `&e={זכאות}` (חיוב דרך אורביט —
 * טוקן-הזכאות החתום בשרת, lib/gabiBilling) — באותו פורמט-טוקן בדיוק, ושום דבר אחר.
 */
export function gabiServerUrlOk(baseUrl: string, url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const m = /#h=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)(&e=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)?$/.exec(url);
  if (!m) return null;
  const expect = gabiConnectUrl(baseUrl, m[1]);
  return expect && expect + (m[2] ?? '') === url ? url : null;
}
