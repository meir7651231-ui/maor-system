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

/** החלת site מהענן על הקונפיג — רק אם עבר חיטוי ויש בו תוכן; אחרת הקונפיג כמות-שהוא. */
export function withCloudSite(config: OrgConfig, rawSite: unknown): OrgConfig {
  if (!rawSite) return config;
  const site = normalizeSite(rawSite);
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
