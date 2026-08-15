/**
 * לוח הבקרה של הבעלים (CLOUD2 ענן 4) — הלוגיקה הטהורה: תעתיק סלאג
 * עברית→לטינית, קונפיג-לידה all-off (הכרעת ארכיטקט: ארגון חדש נולד כשהכול
 * כבוי — בית והגדרות תמיד, הם אינם ModuleKey), וקישור הלקוח.
 * בלי store/DOM/firebase — נבדק ביחידה.
 */
import { DEFAULT_CONFIG, type ModuleKey, type OrgConfig } from '../../types/config';

/** תעתיק אות עברית → לטינית (פשוט וצפוי — הבעלים עורך את התוצאה ממילא). */
const HEB2LAT: Record<string, string> = {
  'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
  'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm',
  'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'p',
  'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
};

/**
 * גזירת סלאג משם הארגון: תעתיק לטיני, אותיות-קטנות/ספרות/מקפים בלבד,
 * ייחודי מול הרשימה (סיומת ‎-2, ‎-3 …). ריק אחרי ניקוי ⇒ 'org'.
 */
export function slugify(orgName: string, taken: readonly string[]): string {
  const lat = [...orgName.trim().toLowerCase()].map((ch) => HEB2LAT[ch] ?? ch).join('');
  let base = lat.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/--+/g, '-');
  if (base.length < 2) base = 'org';
  if (base.length > 30) base = base.slice(0, 30).replace(/-+$/g, '');
  if (!taken.includes(base)) return base;
  for (let i = 2; ; i++) {
    const cand = base + '-' + i;
    if (!taken.includes(cand)) return cand;
  }
}

/** סלאג חוקי — כמו orgSlugFromUrl (‏a-z0-9-, ‏2-40 תווים). */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{2,40}$/.test(slug);
}

/** כל 8 מפתחות המודולים — מקור אחד לפאנל ולקונפיג-הלידה. */
export const ALL_MODULES: ModuleKey[] = ['families', 'courses', 'calendar', 'diary', 'supporters', 'reports', 'tzedaka', 'shop', 'shop7'];

/** תוויות המודולים לפאנל (בית והגדרות תמיד דלוקים — אינם ModuleKey). */
export const MODULE_LABELS: Record<ModuleKey, string> = {
  families: 'משפחות',
  courses: 'חוגים',
  calendar: 'לוח שנה',
  diary: 'יומן חדרים',
  supporters: 'תורמים',
  reports: 'דוחות',
  tzedaka: 'קופות צדקה',
  shop: 'חנות',
  shop7: 'חלוקה',
};

/**
 * קונפיג-הלידה של ארגון חדש (הכרעת ארכיטקט): ‏all-off — כל 8 המודולים
 * ‏false מפורש (לא "חסר=דלוק"!); הבעלים מדליק בלייב מה שסוכם בשיחה.
 */
export function allOffConfig(slug: string, orgName: string): OrgConfig {
  const modules: Partial<Record<ModuleKey, boolean>> = {};
  for (const m of ALL_MODULES) modules[m] = false;
  return { ...DEFAULT_CONFIG, slug, orgName, modules, features: {}, terms: {} };
}

/** קישור הלקוח — ‏{origin}{base}?org={slug} (לכפתור "📋 העתק קישור"). */
export function orgLink(origin: string, basePath: string, slug: string): string {
  return origin + basePath + '?org=' + slug;
}

/* ─────────────────────────── ORGADMIN — היררכיית 3 שכבות ───────────────────────────
 * מייל-על (אתה) → מנהל-ארגון (org.manager) → עובדות (members[] + memberRoles).
 * כל הפונקציות טהורות ונבדקות ביחידה. אילוץ-על: 'limited' = הגבלת-ממשק (מסמך-יחיד).
 * ראה knowledge/BUILD-ORDER-ORGADMIN-2026-08-03.md. */

import type { EmployeeOverride, OrgCloudDoc } from '../../lib/cloudConfig';

/** נירמול מייל — trim + אותיות-קטנות (זהה להשוואת ה-Rules). */
export function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** קוד-הזמנה קצר ודטרמיניסטי מ-seed (הקורא מספק אנטרופיה: slug+חותם-זמן).
 *  8 תווים base36 — לא סוד קריפטוגרפי (אישור-המנהל הוא השער), רק מגדר-רך לקישור. */
export function genJoinCode(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let out = '';
  let x = h >>> 0;
  for (let i = 0; i < 8; i++) {
    out += (x % 36).toString(36);
    x = Math.floor(x / 36) || (h >>> 0) + i + 1;
  }
  return out;
}

/** קישור-הזמנה לעובד/ת — ‏{origin}{base}?org={slug}&join={code}. */
export function orgJoinLink(origin: string, basePath: string, slug: string, code: string): string {
  return origin + basePath + '?org=' + slug + '&join=' + code;
}

/**
 * קוד-הזמנה מלא לעובד/ת (ORGADMIN — "קוד מהבוס"): ‏{slug}.{code}. מקודד את
 * הסלאג בתוך הקוד כדי שההרשמה במסך-האחיד תדע לאיזה ארגון לנתב את הבקשה — בלי
 * שאילתה ובלי קישור. הסלאג הוא [a-z0-9-] והקוד base36 ⇒ הנקודה מפרידה חד-משמעית.
 */
export function orgJoinFullCode(slug: string, code: string): string {
  return slug + '.' + code;
}

/** פירוק "קוד מהבוס" ל-{slug, code}. null אם הצורה אינה תקינה (סלאג חוקי + קוד לא-ריק). */
export function parseJoinFullCode(full: string): { slug: string; code: string } | null {
  const t = full.trim();
  const dot = t.indexOf('.');
  if (dot <= 0) return null;
  const slug = t.slice(0, dot).trim().toLowerCase();
  const code = t.slice(dot + 1).trim();
  if (!isValidSlug(slug) || !code) return null;
  return { slug, code };
}

/** האם המייל הוא מנהל-הארגון (מואצל)? השוואה מנורמלת. */
export function isOrgManager(email: string, org: Pick<OrgCloudDoc, 'manager'>): boolean {
  const m = (org.manager ?? '').trim().toLowerCase();
  return !!m && normEmail(email) === m;
}

/**
 * טווח-הכפתורים שהמנהל בכלל רואה באשף-הייחודי שלו = **רק המודולים שהבעלים
 * הדליק לארגון** (הכרעת-בעלים: "רק את הכפתורים שאני הדלקתי"; מה שלא-שודרג/לא-נקנה
 * לא מופיע). ארגון נולד all-off ⇒ 'לא-false' = מה שהבעלים הדליק בפועל. טהור.
 * את אלה המנהל מחלק בין העובדות (כרטיס-עובד); לעולם לא יכול לחרוג מהם.
 */
export function orgEnabledModules(orgConfig: { modules?: Record<string, boolean> }): ModuleKey[] {
  return ALL_MODULES.filter((m) => orgConfig.modules?.[m] !== false);
}

/**
 * טווח **תת-הדגלים** שהמנהל יכול לחלק לעובדות = דגלים ש**דלוקים בארגון**
 * (לא-false) ושהמודול-האב שלהם (אם הוא מודול-אמיתי) דלוק. דגל שהבעלים כיבה
 * לארגון, או שנמצא תחת מודול כבוי — לא מופיע למנהל (עקרון התקרה, גם ברזולוציית-דגל).
 * טהור; מקבל את מרשם ה-FEATURES מבחוץ (בלי תלות מעגלית).
 */
export function orgEnabledFeatures<F extends { key: string; module: string }>(
  orgConfig: { modules?: Record<string, boolean>; features?: Record<string, boolean> },
  features: readonly F[],
): F[] {
  const enabledMods = new Set<string>(orgEnabledModules(orgConfig));
  return features.filter((f) => {
    if (orgConfig.features?.[f.key] === false) return false; // דגל כבוי בארגון
    const isRealModule = (ALL_MODULES as string[]).includes(f.module);
    if (isRealModule && !enabledMods.has(f.module)) return false; // מודול-אב כבוי
    return true;
  });
}

/** האם המייל חבר בארגון (עובד/ת מאושרת או מנהל)? */
export function isMember(email: string, org: OrgCloudDoc): boolean {
  const e = normEmail(email);
  if (isOrgManager(e, org)) return true;
  return (org.members ?? []).map((m) => m.trim().toLowerCase()).includes(e);
}

/** כרטיס-העובד של מייל (דריסות אישיות). מנהל/חבר-בלי-כרטיס = ריק (רואה כמו הארגון). */
export function overrideOf(email: string, org: OrgCloudDoc): EmployeeOverride {
  return org.memberConfigs?.[normEmail(email)] ?? {};
}

/**
 * הקונפיג האפקטיבי של עובד/ת = קונפיג-הארגון **בניכוי** מה שהמנהל כיבה לה
 * בכרטיס-העובד (רק הגבלה — לא מדליקה מה שהארגון כיבה). מנהל = קונפיג-הארגון כמו-שהוא.
 * זהה בסמנטיקה ל-featureOn/moduleOn (false=כבוי; חסר=יורש). טהור — לב האכיפה בממשק.
 */
export function effectiveConfigFor<
  T extends { modules?: Record<string, boolean>; features?: Record<string, boolean> },
>(email: string, org: OrgCloudDoc, orgConfig: T): T {
  if (isOrgManager(email, org)) return orgConfig;
  const ov = overrideOf(email, org);
  if (!ov.modules && !ov.features) return orgConfig;
  const modules = { ...orgConfig.modules };
  for (const [m, v] of Object.entries(ov.modules ?? {})) if (v === false) modules[m] = false;
  const features = { ...orgConfig.features };
  for (const [k, v] of Object.entries(ov.features ?? {})) if (v === false) features[k] = false;
  return { ...orgConfig, modules, features };
}

/**
 * ייעודי-התרומה שהעובד/ת רשאי/ת לראות (בקשת-בעלים 13.8 ג') — טהור.
 * מנהל/בעלים ⇒ null (רואה הכל). אחרת: הרשימה בכרטיס-העובד אם אינה ריקה, אחרת
 * null (בלי הגבלה). null = "בלי מסנן"; מערך = הגבלה לרשימה בלבד.
 */
export function allowedDesignationsFor(email: string, org: OrgCloudDoc): string[] | null {
  if (isOrgManager(email, org)) return null;
  const d = overrideOf(email, org).designations;
  return d && d.length ? d : null;
}

/**
 * מי מנפיק קבלות-§46 (הכרעת-בעלים 14.8: "רק המנהל מפיק קבלות") — טהור.
 * מקצה-יחיד למספרי-הקבלה: מונע מרוץ דו-מכשירי על donationSeq (רצף קבלות-המס),
 * וגם כלל-עסקי — קבלת-מס רשמית = סמכות-מנהל. מותר: מייל-על · מנהל-ארגון ·
 * לקוח-שורש (הבעלים הקיים) · עבודה-מקומית-בלי-ענן. חסום: עובד/ת בארגון-פלטפורמה
 * שאינו/ה מנהל/ת. חוזה-הבטיחות: ברירת-מחדל מתירה (לקוח לא-מחובר/שורש) — לא שוברת אף לקוח קיים.
 */
export function canIssueReceipt(p: {
  superAdmin: boolean;
  isManager: boolean;
  cloudRoot: boolean;
  cloudConnected: boolean;
}): boolean {
  return p.superAdmin || p.isManager || p.cloudRoot || !p.cloudConnected;
}

/** אישור בקשת-הצטרפות (טהור) — מוסיף ל-members (בלי כפילויות, מנורמל). ללא דריסות = מלא. */
export function approveMember(org: OrgCloudDoc, email: string): { members: string[] } {
  const e = normEmail(email);
  const members = [...new Set([...(org.members ?? []).map((m) => m.trim().toLowerCase()), e])];
  return { members };
}

/** קביעת כרטיס-עובד (טהור) — כותב/מעדכן את דריסות המייל. */
export function setEmployeeOverride(
  org: OrgCloudDoc,
  email: string,
  override: EmployeeOverride,
): { memberConfigs: Record<string, EmployeeOverride> } {
  const e = normEmail(email);
  return { memberConfigs: { ...org.memberConfigs, [e]: override } };
}

/** הסרת עובד/ת (טהור) — מוציא מ-members ומ-memberConfigs. מנהל לא ניתן להסרה כאן. */
export function removeMember(
  org: OrgCloudDoc,
  email: string,
): { members: string[]; memberConfigs: Record<string, EmployeeOverride> } {
  const e = normEmail(email);
  const members = (org.members ?? []).map((m) => m.trim().toLowerCase()).filter((m) => m !== e);
  const memberConfigs: Record<string, EmployeeOverride> = { ...org.memberConfigs };
  delete memberConfigs[e];
  return { members, memberConfigs };
}
