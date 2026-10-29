/**
 * 🌐 תוכן האתר-הציבורי מהענן (29.10.2026, «מערכת לשליטה למנהל הארגון לעריכת האתר»).
 *
 * מנהל-הארגון עורך את האתר במשרד ⇒ נשמר ב-Firestore ‏`publicSites/{slug}.site` (Rules v5: קריאה ציבורית,
 * כתיבה רק ל-editors). האתר-הציבורי קורא אותו ב-**REST** (בקשה אחת, בלי ה-SDK הכבד — לא מקלקל את
 * המהירות), עם תקרת-זמן; אין מסמך / שגיאה / איטי ⇒ נשאר התוכן מקובץ-הקונפיג (האתר לא נופל לעולם).
 * התוכן מהענן עובר את אותו חיטוי (normalizeSite) כמו הקובץ — allowlist, https בלבד, תקרות.
 *
 * טהור, חוץ מ-fetchCloudSite (רשת). בלי firebase בקונפיג ⇒ null ⇒ ביט-זהה להיום.
 */
import { normalizeSite } from './config';
import { SITE_LANGS } from '../types/config';
import type { FirebaseOrgConfig, OrgConfig } from '../types/config';

/** כתובת ה-REST של מסמך-האתר (ציבורית; ה-apiKey ממילא בקונפיג-הלקוח). */
export function publicSiteDocUrl(fb: Pick<FirebaseOrgConfig, 'projectId' | 'apiKey'>, slug: string): string {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(fb.projectId)}/databases/(default)/documents/publicSites/${encodeURIComponent(slug)}?key=${encodeURIComponent(fb.apiKey)}`;
}

/** ערך-Firestore בפורמט-REST ⇒ ערך JS רגיל (map/array/מחרוזת/מספר/בוליאני/null). */
export function fromFirestoreValue(v: unknown): unknown {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  if ('stringValue' in o) return o.stringValue;
  if ('integerValue' in o) return Number(o.integerValue);
  if ('doubleValue' in o) return Number(o.doubleValue);
  if ('booleanValue' in o) return o.booleanValue === true;
  if ('nullValue' in o) return null;
  if ('timestampValue' in o) return o.timestampValue;
  if ('arrayValue' in o) {
    const vals = (o.arrayValue as { values?: unknown[] } | undefined)?.values ?? [];
    return vals.map(fromFirestoreValue);
  }
  if ('mapValue' in o) {
    const fields = (o.mapValue as { fields?: Record<string, unknown> } | undefined)?.fields ?? {};
    const out: Record<string, unknown> = {};
    for (const [k, fv] of Object.entries(fields)) out[k] = fromFirestoreValue(fv);
    return out;
  }
  return undefined;
}

/** מסמך-REST ⇒ ה-site הגולמי (לפני חיטוי), או null. */
export function siteFromRestDoc(docJson: unknown): unknown {
  const fields = (docJson as { fields?: Record<string, unknown> } | null)?.fields;
  if (!fields || !fields.site) return null;
  const site = fromFirestoreValue(fields.site);
  return site && typeof site === 'object' && !Array.isArray(site) ? site : null;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const LANG_KEYS = new Set<string>(SITE_LANGS);
/** האם הערך הוא טקסט-רב-לשוני (מפה שכל מפתחותיה שפות). */
const isLocalized = (v: unknown): v is Record<string, unknown> => isObj(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => LANG_KEYS.has(k));

/**
 * 🌍 השלמת-תרגומים מהקובץ (29.10.2026, ספרדית+צרפתית): התוכן בענן נזרע לפני שנוספו שפות ⇒ חסרות בו.
 * לכל טקסט באותו מקום: אם העברית בענן **זהה** לעברית בקובץ (לא נערכה) — שפות שחסרות בענן נלקחות מהקובץ.
 * עברית שונתה ⇒ לא נוגעים (תרגום ישן של טקסט אחר היה שגוי). ‏langs ⇒ איחוד (שפה חדשה בקובץ נוספת לבורר).
 * הענן תמיד מנצח על מה שיש בו. טהור.
 */
export function fillMissingLangs(cloud: unknown, base: unknown): unknown {
  if (Array.isArray(cloud)) return Array.isArray(base) ? cloud.map((v, i) => fillMissingLangs(v, base[i])) : cloud;
  if (isLocalized(base) && typeof base.he === 'string') {
    const cloudHe = typeof cloud === 'string' ? cloud : isLocalized(cloud) ? cloud.he : undefined;
    if (cloudHe !== base.he) return cloud;
    const cur: Record<string, unknown> = typeof cloud === 'string' ? { he: cloud } : { ...(cloud as Record<string, unknown>) };
    for (const [l, v] of Object.entries(base)) if (cur[l] == null || cur[l] === '') cur[l] = v;
    return cur;
  }
  if (!isObj(cloud) || !isObj(base)) return cloud;
  const out: Record<string, unknown> = { ...cloud };
  for (const k of Object.keys(cloud)) {
    if (k === 'langs' && Array.isArray(cloud.langs) && Array.isArray(base.langs)) {
      out.langs = [...new Set([...cloud.langs, ...base.langs])];
    } else if (k in base) {
      out[k] = fillMissingLangs(cloud[k], base[k]);
    }
  }
  return out;
}

/** החלת site מהענן על הקונפיג — רק אם עבר חיטוי ויש בו תוכן; אחרת הקונפיג כמות-שהוא.
 *  תרגומים שחסרים בענן משולמים מתוכן-הקובץ (fillMissingLangs). */
export function withCloudSite(config: OrgConfig, rawSite: unknown): OrgConfig {
  if (!rawSite) return config;
  const site = normalizeSite(fillMissingLangs(rawSite, config.site));
  if (!site || Object.keys(site).length === 0) return config;
  return { ...config, site };
}

/** קריאת site מהענן (REST, תקרת-זמן). כל כשל ⇒ null. */
export async function fetchCloudSite(config: OrgConfig, timeoutMs = 2500): Promise<unknown> {
  const fb = config.firebase;
  if (!fb?.projectId || !fb.apiKey || !config.slug || typeof fetch === 'undefined') return null;
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
  try {
    const res = await fetch(publicSiteDocUrl(fb, config.slug), ctl ? { signal: ctl.signal } : undefined);
    if (!res.ok) return null;
    return siteFromRestDoc(await res.json());
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
