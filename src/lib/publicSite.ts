/**
 * מנוע האתר-הציבורי (טהור, בלי store/DOM) — פותר טקסט רב-לשוני, מחשב
 * התקדמות-קמפיין וספירה-לאחור, וגוזר את שפת-ההתחלה. הרכיב PublicSite.tsx
 * צורך את הפונקציות האלה; הבדיקות מכסות אותן ביחידה.
 *
 * עיקרון: האתר **מוזן ישירות מהקונפיג** — אין כאן מקור-נתונים חלופי. כל שדה
 * שחסר נופל בחן (טקסט ריק / סעיף מוסתר), כך שאתר עם מעט-תוכן עדיין תקין.
 */
import type { LocalizedText, OrgConfig, PublicSiteContent, SiteLang } from '../types/config';
import { SITE_LANGS } from '../types/config';

/** תוויות-ממשק מובנות פר-שפה (כותרות-סעיף, כפתורים) — לא-מהקונפיג, קבועות. */
export const SITE_UI: Record<SiteLang, Record<string, string>> = {
  he: {
    donate: 'לתרומה', contact: 'צור קשר', enter: 'כניסה למערכת', services: 'מה אנחנו עושים',
    story: 'הסיפור שמאחורי', news: 'כל חודש — מה חדש', gallery: 'רגעים', campaign: 'הקמפיין שלנו',
    raised: 'גויסו', goal: 'יעד', daysLeft: 'ימים נותרו', call: 'חייגו', whatsapp: 'וואטסאפ',
    email: 'מייל', poweredBy: 'מופעל על-ידי מאור', dir: 'rtl',
  },
  en: {
    donate: 'Donate', contact: 'Contact', enter: 'Staff login', services: 'What we do',
    story: 'Our story', news: 'This month', gallery: 'Moments', campaign: 'Our campaign',
    raised: 'Raised', goal: 'Goal', daysLeft: 'days left', call: 'Call', whatsapp: 'WhatsApp',
    email: 'Email', poweredBy: 'Powered by Maor', dir: 'ltr',
  },
  yi: {
    donate: 'שפּענדן', contact: 'פֿאַרבינדונג', enter: 'אַרײַנגאַנג', services: 'וואָס מיר טוען',
    story: 'אונדזער געשיכטע', news: 'דעם חודש', gallery: 'מאָמענטן', campaign: 'אונדזער קאַמפּיין',
    raised: 'געזאַמלט', goal: 'ציל', daysLeft: 'טעג געבליבן', call: 'רופֿט', whatsapp: 'וואַטסאַפּ',
    email: 'בליץ-פּאָסט', poweredBy: 'געטריבן דורך מאור', dir: 'rtl',
  },
};

/** האם השפה כותבת מימין-לשמאל. */
export function isRtlLang(lang: SiteLang): boolean {
  return lang !== 'en';
}

/**
 * פותר טקסט רב-לשוני לשפה מבוקשת: מחרוזת ⇒ כמות-שהיא; מפה ⇒ השפה, ואם ריקה
 * ⇒ נפילה לעברית, ואז לערך הראשון הקיים. undefined/ריק ⇒ ''.
 */
export function resolveLocalized(t: LocalizedText | undefined, lang: SiteLang): string {
  if (t == null) return '';
  if (typeof t === 'string') return t;
  const pick = t[lang];
  if (typeof pick === 'string' && pick.trim()) return pick;
  if (typeof t.he === 'string' && t.he.trim()) return t.he;
  for (const l of SITE_LANGS) {
    const v = t[l];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

/** רשימת השפות שהאתר מציע — ‏site.langs מסונן, ברירת-מחדל ['he']. */
export function siteLangs(site: PublicSiteContent | undefined): SiteLang[] {
  const raw = site?.langs?.filter((l): l is SiteLang => (SITE_LANGS as readonly string[]).includes(l)) ?? [];
  const uniq = [...new Set(raw)];
  return uniq.length ? uniq : ['he'];
}

/** תווית-הממשק לשפה (עם נפילה לעברית אם השפה לא-מוכרת). */
export function siteUi(lang: SiteLang, key: string): string {
  return (SITE_UI[lang] ?? SITE_UI.he)[key] ?? SITE_UI.he[key] ?? '';
}

export interface CampaignProgress {
  goal: number;
  raised: number;
  /** אחוז 0–100 (חסום, מעוגל). */
  pct: number;
  currency: string;
  /** ימים עד היעד (≥0) או null אם אין תאריך/עבר. */
  daysLeft: number | null;
  /** יש קמפיין להצגה (יעד חיובי). */
  show: boolean;
}

/**
 * מחשב התקדמות-קמפיין וספירה-לאחור. ‏nowMs מוזרק (טהור/בדיק). יעד לא-חיובי
 * ⇒ show=false. אחוז חסום ל-0–100 גם כשנגבה מעל היעד.
 */
export function campaignProgress(
  c: { goal?: number; raised?: number; end?: string; currency?: string } | undefined,
  nowMs: number,
): CampaignProgress {
  const goal = typeof c?.goal === 'number' && c.goal > 0 ? c.goal : 0;
  const raised = typeof c?.raised === 'number' && c.raised > 0 ? c.raised : 0;
  const pct = goal > 0 ? Math.max(0, Math.min(100, Math.round((raised / goal) * 100))) : 0;
  let daysLeft: number | null = null;
  if (c?.end) {
    // חצות-מקומי של יום-היעד (חלק-התאריך בלבד) — ספירת ימים קלנדרית: מ-1.9 ל-11.9
    // = 10 (ולא 11 שנוצר מחישוב סוף-יום). עבר ⇒ 0.
    const t = Date.parse(c.end.slice(0, 10) + 'T00:00:00');
    if (Number.isFinite(t)) {
      const diff = Math.ceil((t - nowMs) / 86_400_000);
      daysLeft = diff > 0 ? diff : 0;
    }
  }
  return { goal, raised, pct, currency: c?.currency || '₪', daysLeft, show: goal > 0 };
}

/**
 * האם להציג את האתר-הציבורי: יש תוכן-site ולא-כובה במפורש (enabled!==false).
 * הגידור על הדגל (shell.publicsite) ועל בקשת-הכתובת (‎?site‎) נעשה ב-App.
 */
export function hasPublicSite(config: OrgConfig): boolean {
  return !!config.site && config.site.enabled !== false;
}

/** קישור-התרומה האפקטיבי — site.donateUrl, ואם אין, integrations.payments.payUrl. */
export function siteDonateUrl(config: OrgConfig): string | null {
  const direct = config.site?.donateUrl;
  if (typeof direct === 'string' && direct) return direct;
  const pay = config.integrations?.payments;
  const payUrl = pay && typeof pay.payUrl === 'string' ? pay.payUrl : '';
  return payUrl || null;
}
