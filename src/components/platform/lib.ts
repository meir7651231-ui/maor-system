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
