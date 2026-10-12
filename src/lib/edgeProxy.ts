/**
 * 🌉 מצב-מסונן (12.10.2026) — הליבה הטהורה של מתווך-הקצה בצד-הלקוח.
 *
 * לקוחות על אינטרנט מסונן (נטפרי/רימון) מגיעים לאתר אבל הסנן חוסם את googleapis ⇒
 * אין כניסה ואין סנכרון. המתווך (edge-proxy/worker.js, תת-דומיין של האתר) מעביר את
 * התעבורה לגוגל. כאן: חיטוי השדה `edgeProxy`, ההכרעה אם המכשיר הזה מנותב, והגדרות-ההפניה
 * ל-SDK. בלי firebase ובלי DOM — האחסון וה-URL מוזרקים (עטיפת-הריצה היחידה נופלת-רך).
 * תכנון והכרעות: knowledge/BUILD-ORDER-FILTERED-2026-10-12.md.
 *
 * אינווריאנט-העל: בלי `config.edgeProxy` — אף פונקציה כאן לא נוגעת ב-URL/באחסון, והלקוח
 * ביט-זהה להיום (ratchets: edge-init · edge-config-golden · edge-proxy).
 */
import { EDGE_HOST_SUFFIXES, type EdgeProxyConfig, type OrgConfig } from '../types/config';

/**
 * מתג-המכשיר ('on'/'off'; חסר = ברירת-הארגון). **גלובלי במכוון** (לא nsLsKey): "הקו
 * מסונן" היא תכונת-מכשיר, לא-ארגון — כמו מפתחות-הנגישות. נקרא רק כשלארגון יש edgeProxy.
 */
export const EDGE_DEVICE_KEY = 'maor_edge';

/** תווית-DNS ‏LDH (אותיות/ספרות/מקף, לא בקצוות, ≤63). */
const DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * hostname מחוטא של מתווך, או null. מקבל `host` או `https://host` או `https://host/`;
 * דוחה כל סכמה אחרת (http/javascript/…), port, נתיב, query, fragment, userinfo, נקודה-סופית,
 * תווים שאינם LDH, ומארח שאינו תת-דומיין של EDGE_HOST_SUFFIXES (כולל סיומת-מתחזה).
 */
export function edgeHostOf(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let s = raw.trim().toLowerCase();
  if (s.includes('://')) {
    if (!s.startsWith('https://')) return null;
    s = s.slice('https://'.length);
    if (s.endsWith('/')) s = s.slice(0, -1);
  }
  if (!s || s.length > 253) return null;
  if (!s.split('.').every((label) => DNS_LABEL.test(label))) return null;
  return EDGE_HOST_SUFFIXES.some((suffix) => s.endsWith(suffix) && s.length > suffix.length) ? s : null;
}

/** חיטוי השדה (נקרא מ-normalizeConfig): host חובה ותקין; הדגלים רק כ-true; כל השאר נזרק. */
export function normalizeEdgeProxy(raw: unknown): EdgeProxyConfig | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  const host = edgeHostOf(r.host);
  if (!host) return undefined;
  const out: EdgeProxyConfig = { host };
  if (r.allDevices === true) out.allDevices = true;
  if (r.forceLongPolling === true) out.forceLongPolling = true;
  return out;
}

export type EdgeDeviceFlag = 'on' | 'off' | null;

/** הפרמטר ‎?edge=‎ ⇒ פעולה: on/off (נשמר במכשיר) · auto (חזרה לברירת-הארגון) · null (לא נגיעה). */
export function edgeSwitchFromSearch(search: string): 'on' | 'off' | 'auto' | null {
  let v: string | null;
  try {
    v = new URLSearchParams(search).get('edge');
  } catch {
    return null;
  }
  if (v === null) return null;
  v = v.trim().toLowerCase();
  if (v === 'on' || v === '1' || v === 'true' || v === 'yes') return 'on';
  if (v === 'off' || v === '0' || v === 'false' || v === 'no') return 'off';
  if (v === 'auto' || v === 'default') return 'auto';
  return null;
}

/**
 * האם המכשיר הזה עובר דרך המתווך — טהור. חסר edgeProxy ⇒ לא (ביט-זהה) · מכשיר 'off' ⇒ לא ·
 * 'on' ⇒ כן · אחרת ⇒ רק allDevices:true. **הוספת השדה לבדה לא מזיזה אף מכשיר.**
 * (מחטא שוב — הגנת-עומק לקונפיג שלא עבר normalizeConfig.)
 */
export function activeEdge(cfg: OrgConfig, device: EdgeDeviceFlag): EdgeProxyConfig | null {
  const edge = normalizeEdgeProxy(cfg.edgeProxy);
  if (!edge || device === 'off') return null;
  if (device === 'on') return edge;
  return edge.allDevices === true ? edge : null;
}

type DeviceStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function defaultStore(): DeviceStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // גישה ל-localStorage עצמה זרקה (sandbox/מצב-פרטי)
  }
}

/**
 * עטיפת-הריצה: מחיל את ‎?edge=‎ על אחסון-המכשיר ומחזיר את המתווך הפעיל (או null).
 * **בלי config.edgeProxy — חוזר מיד, בלי לקרוא את ה-URL ובלי לגעת באחסון.** אחסון חסום ⇒
 * הקישור עדיין קובע לטעינה הנוכחית (רק לא נשמר).
 */
export function edgeForThisDevice(
  cfg: OrgConfig,
  env?: { search?: string; storage?: DeviceStore | null },
): EdgeProxyConfig | null {
  if (!cfg.edgeProxy) return null;
  const search = env?.search ?? (typeof location === 'undefined' ? '' : location.search);
  const store = env && 'storage' in env ? (env.storage ?? null) : defaultStore();
  const sw = edgeSwitchFromSearch(search);
  let stored: string | null = null;
  try {
    if (sw === 'on' || sw === 'off') store?.setItem(EDGE_DEVICE_KEY, sw);
    else if (sw === 'auto') store?.removeItem(EDGE_DEVICE_KEY);
    stored = store?.getItem(EDGE_DEVICE_KEY) ?? null;
  } catch {
    /* אחסון חסום/מלא — נשענים על הקישור בלבד */
  }
  const device: EdgeDeviceFlag =
    sw === 'on' || sw === 'off' ? sw : sw === 'auto' ? null : stored === 'on' || stored === 'off' ? stored : null;
  return activeEdge(cfg, device);
}

/**
 * כתובת-ה"אמולטור" של Auth: ה-SDK בונה `${url}${host}${path}` (auth `_emulatorUrl`) ⇒
 * ‎https://<edge>/identitytoolkit.googleapis.com/v1/…‎ — מארח-גוגל הוא המקטע הראשון, והמתווך
 * מנתב לפיו (התאמה מדויקת).
 */
export function edgeAuthUrl(edge: EdgeProxyConfig): string {
  return 'https://' + edge.host;
}

/** הגדרות-Firestore למתווך: host רשמי של ה-SDK + https; long-polling רק בכפייה מפורשת. */
export function edgeFirestoreSettings(edge: EdgeProxyConfig): { host: string; ssl: true; experimentalForceLongPolling?: true } {
  return edge.forceLongPolling === true
    ? { host: edge.host, ssl: true, experimentalForceLongPolling: true }
    : { host: edge.host, ssl: true };
}

/**
 * כתובת Cloud Functions ⇒ דרך המתווך, באותה תבנית "מקטע-ראשון = מארח-גוגל":
 * ‎https://us-central1-p.cloudfunctions.net/fn?q‎ ⇒ ‎https://<edge>/us-central1-p.cloudfunctions.net/fn?q‎.
 * בלי מתווך, או כתובת שאינה cloudfunctions.net — כמות-שהיא (פונקציית-זהות).
 */
export function viaEdge(url: string, edgeHost: string | null | undefined): string {
  if (!edgeHost) return url;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || u.port || u.username || u.password || !u.hostname.endsWith('.cloudfunctions.net')) return url;
    return 'https://' + edgeHost + '/' + u.hostname + u.pathname + u.search;
  } catch {
    return url;
  }
}
