/**
 * 🌐 דומיין-ציבורי לארגון (26.10.2026, הכרעת-בעלים) — "המשרד אצלנו, האתר-לציבור על הדומיין שלהם".
 *
 * ארגון שקנה דומיין משלו (meorhachessed.com) מקבל עליו **רק את האתר-הציבורי** (config.site,
 * נערך באשף כמו היום). המשרד נשאר בכתובת שלנו — הנתונים המקומיים (localStorage/IndexedDB)
 * ואישור-ההתחברות לענן קשורים למארח, ולכן "כניסה למערכת" מהדומיין יוצאת אל officeUrl.
 *
 * ‏siteDomainOf טהור; currentSiteDomain/applySiteIcons — עטיפות-דפדפן. מארח שאינו ברשימה ⇒ null ⇒ ביט-זהה להיום. לקוח חדש = שורה אחת כאן.
 */
export interface SiteDomain {
  /** ה-slug של הארגון (public/c/<slug>/config.json). */
  slug: string;
  /** כתובת המשרד אצלנו — יעד "כניסה למערכת". */
  officeUrl: string;
  /** תיקיית אייקוני-הארגון (יחסית לבסיס-האתר) — לשונית/מסך-הבית מציגים את לוגו-הארגון ולא את אורביט (26.10.2026). */
  iconDir?: string;
  /** ה-slug של המשרד שמנהל את האתר (ארגון-פלטפורמה — orgs/<officeSlug>); שם מופיע הכפתור «🌐 עריכת האתר» (29.10.2026). */
  officeSlug?: string;
}

export const SITE_DOMAINS: Readonly<Record<string, SiteDomain>> = {
  // 29.10.2026: המשרד האמיתי של מאור = ארגון-הפלטפורמה mavr-hchsd (שם המנהל עובד עם המייל שלו) ⇒ «כניסה למערכת» מגיעה אליו
  'meorhachessed.com': { slug: 'maor-hachesed', officeUrl: 'https://orbit-il.com/?org=mavr-hchsd', iconDir: 'c/maor-hachesed/icons/', officeSlug: 'mavr-hchsd' },
};

/** ה-slug של האתר-הציבורי שמשרד זה מנהל (לפי officeSlug או slug), או null. טהור. */
export function publicSiteSlugFor(officeSlug: string | undefined): string | null {
  if (!officeSlug) return null;
  const d = Object.values(SITE_DOMAINS).find((x) => x.officeSlug === officeSlug || x.slug === officeSlug);
  return d ? d.slug : null;
}

/** נורמליזציה: אותיות-קטנות, בלי www., בלי פורט, בלי נקודה-סופית. */
function normHost(h: string): string {
  return (h || '').toLowerCase().trim().replace(/:\d+$/, '').replace(/\.$/, '').replace(/^www\./, '');
}

/** הדומיין-הציבורי של המארח הנוכחי, או null (כל מארח אחר — כולל שלנו — לא משתנה). */
export function siteDomainOf(hostname: string): SiteDomain | null {
  const h = normHost(hostname);
  return Object.prototype.hasOwnProperty.call(SITE_DOMAINS, h) ? SITE_DOMAINS[h] : null;
}

/** עטיפה לדפדפן — בטוחה בלי window. */
export function currentSiteDomain(): SiteDomain | null {
  try {
    return typeof window === 'undefined' ? null : siteDomainOf(window.location.hostname);
  } catch {
    return null;
  }
}

/**
 * אייקוני-הארגון בדומיין-הציבורי (26.10.2026, «למה הלוגו לא מופיע בכרטיסיה»): ה-HTML הבסיסי נושא את
 * אייקוני-אורביט, והאתר החליף אותם באימוג'י-SVG (שאייפון לא מציג). כאן: PNG של לוגו-הארגון ל-icon
 * ול-apple-touch-icon. מחזיר true אם הוחל (הקורא מדלג אז על applyFavicon).
 */
export function applySiteIcons(dom: SiteDomain | null, base: string): boolean {
  if (!dom?.iconDir || typeof document === 'undefined') return false;
  const set = (rel: string, file: string) => {
    let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) { link = document.createElement('link'); link.rel = rel; document.head.appendChild(link); }
    link.removeAttribute('type');
    link.href = base + dom.iconDir + file;
  };
  set('icon', 'favicon-64.png');
  set('apple-touch-icon', 'apple-touch-icon.png');
  return true;
}
