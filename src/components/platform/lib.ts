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

import type { MemberRole, OrgCloudDoc } from '../../lib/cloudConfig';

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

/** האם המייל הוא מנהל-הארגון (מואצל)? השוואה מנורמלת. */
export function isOrgManager(email: string, org: Pick<OrgCloudDoc, 'manager'>): boolean {
  const m = (org.manager ?? '').trim().toLowerCase();
  return !!m && normEmail(email) === m;
}

/** רמת-הרשאה של מייל בארגון: מנהל=full; חבר עם רשומה=הרשומה; חבר בלי רשומה=full
 *  (תאימות-לאחור — חברי v2 ללא memberRoles). לא-חבר=null. */
export function roleOf(email: string, org: OrgCloudDoc): MemberRole | null {
  const e = normEmail(email);
  if (isOrgManager(e, org)) return 'full';
  const members = (org.members ?? []).map((m) => m.trim().toLowerCase());
  if (!members.includes(e)) return null;
  return org.memberRoles?.[e] ?? 'full';
}

/** אישור בקשת-הצטרפות (טהור) — מחזיר members/memberRoles מעודכנים (בלי כפילויות). */
export function approveMember(
  org: OrgCloudDoc,
  email: string,
  role: MemberRole,
): { members: string[]; memberRoles: Record<string, MemberRole> } {
  const e = normEmail(email);
  const members = [...new Set([...(org.members ?? []).map((m) => m.trim().toLowerCase()), e])];
  const memberRoles = { ...org.memberRoles, [e]: role };
  return { members, memberRoles };
}

/** הסרת עובד/ת (טהור) — מוציא מ-members ומ-memberRoles. מנהל לא ניתן להסרה כאן. */
export function removeMember(
  org: OrgCloudDoc,
  email: string,
): { members: string[]; memberRoles: Record<string, MemberRole> } {
  const e = normEmail(email);
  const members = (org.members ?? []).map((m) => m.trim().toLowerCase()).filter((m) => m !== e);
  const memberRoles: Record<string, MemberRole> = { ...org.memberRoles };
  delete memberRoles[e];
  return { members, memberRoles };
}
