/**
 * 🌐 דומיין-ציבורי לארגון (26.10.2026, הכרעת-בעלים) — "המשרד אצלנו, האתר-לציבור על הדומיין שלהם".
 *
 * ארגון שקנה דומיין משלו (meorhachessed.com) מקבל עליו **רק את האתר-הציבורי** (config.site,
 * נערך באשף כמו היום). המשרד נשאר בכתובת שלנו — הנתונים המקומיים (localStorage/IndexedDB)
 * ואישור-ההתחברות לענן קשורים למארח, ולכן "כניסה למערכת" מהדומיין יוצאת אל officeUrl.
 *
 * טהור (בלי DOM). מארח שאינו ברשימה ⇒ null ⇒ ביט-זהה להיום. לקוח חדש = שורה אחת כאן.
 */
export interface SiteDomain {
  /** ה-slug של הארגון (public/c/<slug>/config.json). */
  slug: string;
  /** כתובת המשרד אצלנו — יעד "כניסה למערכת". */
  officeUrl: string;
}

export const SITE_DOMAINS: Readonly<Record<string, SiteDomain>> = {
  'meorhachessed.com': { slug: 'maor-hachesed', officeUrl: 'https://orbit-il.com/?org=maor-hachesed' },
};

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
