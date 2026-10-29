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
    email: 'מייל', poweredBy: 'מופעל על-ידי אורביט', dir: 'rtl',
  },
  en: {
    donate: 'Donate', contact: 'Contact', enter: 'Staff login', services: 'What we do',
    story: 'Our story', news: 'This month', gallery: 'Moments', campaign: 'Our campaign',
    raised: 'Raised', goal: 'Goal', daysLeft: 'days left', call: 'Call', whatsapp: 'WhatsApp',
    email: 'Email', poweredBy: 'Powered by Orbit', dir: 'ltr',
  },
  yi: {
    donate: 'שפּענדן', contact: 'פֿאַרבינדונג', enter: 'אַרײַנגאַנג', services: 'וואָס מיר טוען',
    story: 'אונדזער געשיכטע', news: 'דעם חודש', gallery: 'מאָמענטן', campaign: 'אונדזער קאַמפּיין',
    raised: 'געזאַמלט', goal: 'ציל', daysLeft: 'טעג געבליבן', call: 'רופֿט', whatsapp: 'וואַטסאַפּ',
    email: 'בליץ-פּאָסט', poweredBy: 'געטריבן דורך אָרביט', dir: 'rtl',
  },
  es: {
    donate: 'Donar', contact: 'Contacto', enter: 'Acceso del equipo', services: 'Qué hacemos',
    story: 'Nuestra historia', news: 'Este mes', gallery: 'Momentos', campaign: 'Nuestra campaña',
    raised: 'Recaudado', goal: 'Meta', daysLeft: 'días restantes', call: 'Llamar', whatsapp: 'WhatsApp',
    email: 'Correo', poweredBy: 'Con la tecnología de Orbit', dir: 'ltr',
  },
  fr: {
    donate: 'Faire un don', contact: 'Contact', enter: 'Espace équipe', services: 'Ce que nous faisons',
    story: 'Notre histoire', news: 'Ce mois-ci', gallery: 'Moments', campaign: 'Notre campagne',
    raised: 'Collecté', goal: 'Objectif', daysLeft: 'jours restants', call: 'Appeler', whatsapp: 'WhatsApp',
    email: 'E-mail', poweredBy: 'Propulsé par Orbit', dir: 'ltr',
  },
};

/** האם השפה כותבת מימין-לשמאל. */
export function isRtlLang(lang: SiteLang): boolean {
  return lang === 'he' || lang === 'yi';
}

/**
 * 🌍 (29.10.2026, «ברגע שזה חו״ל אז הכפתור יהיה לסולה») — האם הגולש מחוץ לישראל.
 * מקור ראשון: המדינה ש-Cloudflare זיהה (ה-Worker של הדומיין מזריק ‎<meta name="visitor-country">‎);
 * אין מטא (github.io/תצוגה-מקדימה) ⇒ לפי אזור-הזמן של הדפדפן. לא-ידוע ⇒ false (ישראל — כמו היום). טהור.
 */
export function isVisitorAbroad(country: string | null | undefined, timeZone: string | null | undefined): boolean {
  const c = (country || '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(c) && c !== 'XX' && c !== 'T1') return c !== 'IL';
  const tz = (timeZone || '').trim();
  if (!tz) return false;
  return tz !== 'Asia/Jerusalem' && tz !== 'Asia/Tel_Aviv' && tz !== 'Israel';
}

/** עטיפת-דפדפן ל-isVisitorAbroad — בטוחה בלי window/Intl. */
export function currentVisitorAbroad(): boolean {
  try {
    const meta = typeof document !== 'undefined' ? document.querySelector('meta[name="visitor-country"]')?.getAttribute('content') : null;
    const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
    return isVisitorAbroad(meta, tz);
  } catch {
    return false;
  }
}

/* ═══════════ פלטת-האתר פר-ורטיקל (16.8) ═══════════
 * האתר-הציבורי משתמש במשפחת-קורל קבועה. כדי ש"יתאים לכל ורטיקל", הפלטה
 * נגזרת מ-`config.accent` (הצבע שכל חבילת-ורטיקל מלבישה) — משפחה קוהרנטית
 * (בהיר/בינוני/עמוק + מילת-הדגשה + דיו + קרקעות בהירות-גוון). ורטיקל עמותתי
 * (חסד/גמ"ח/התרמה) בלי accent ⇒ **בדיוק הקורל של היום** (chesed ביט-זהה). */
export interface SitePalette {
  /** בהיר (צ׳יפים/חלקיקים/תחילת-גרדיאנט). */
  c1: string;
  /** בינוני (המותג — סוף-גרדיאנט/כפתורים). */
  c2: string;
  /** עמוק (טקסט-הדגשה "קורל"). */
  c3: string;
  /** מילת-ההדגשה בכותרת-ה-hero. */
  word: string;
  /** דיו (טקסט כמעט-שחור). */
  ink: string;
  paper: string;
  cream: string;
  blush: string;
  /** רקע-המרקיזה (גוון-מותג בהיר). */
  marquee: string;
  /** c1 כ-"r,g,b" (ל-rgba של גבולות/זוהר). */
  rgb1: string;
  /** c2 כ-"r,g,b" (ל-rgba של צללים). */
  rgb2: string;
  /** ink כ-"r,g,b" (ל-rgba של טקסט-רך/דהוי). */
  inkRgb: string;
}

/** משפחת-הקורל המקורית (העיצוב) — ברירת-המחדל כשאין accent (chesed ביט-זהה). */
export const CORAL_PALETTE: SitePalette = {
  c1: '#EC9C9C', c2: '#D97F7F', c3: '#B95F5F', word: '#E29392', ink: '#33272A',
  paper: '#FFFCFA', cream: '#FBF1EF', blush: '#FFF3F0', marquee: '#F9E4E1',
  rgb1: '236,156,156', rgb2: '217,127,127', inkRgb: '51,39,42',
};

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function toHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
const rgbStr = ([r, g, b]: [number, number, number]): string => `${r},${g},${b}`;

/**
 * גוזר משפחת-פלטה מלאה מצבע-הדגשה. אין accent/לא-תקין ⇒ CORAL_PALETTE (ביט-זהה).
 * הגוון (hue) נשמר; מכווננים רוויה+בהירות ליצירת בהיר/בינוני/עמוק + קרקעות
 * בהירות-גוון + דיו-כהה-מגוון. כך כל ורטיקל מקבל זהות-צבע קוהרנטית באותו עיצוב.
 */
export function sitePalette(accent?: string): SitePalette {
  const base = accent && accent.trim() ? hexToRgb(accent) : null;
  if (!base) return CORAL_PALETTE;
  const [h, s0] = rgbToHsl(base[0], base[1], base[2]);
  const s = Math.max(0.42, Math.min(0.86, s0));
  const mk = (sat: number, l: number) => hslToRgb(h, sat, l);
  const c1 = mk(Math.min(0.8, s * 0.92), 0.75);
  const c2 = mk(s, 0.62);
  const c3 = mk(Math.min(0.9, s * 1.04), 0.47);
  const word = mk(s, 0.67);
  const ink = mk(0.18, 0.16);
  return {
    c1: toHex(c1), c2: toHex(c2), c3: toHex(c3), word: toHex(word), ink: toHex(ink),
    paper: toHex(mk(0.4, 0.986)), cream: toHex(mk(0.46, 0.955)), blush: toHex(mk(0.62, 0.965)),
    marquee: toHex(mk(0.5, 0.9)),
    rgb1: rgbStr(c1), rgb2: rgbStr(c2), inkRgb: rgbStr(ink),
  };
}

/** תוויות-פעולה תלויות-סוג-ארגון: מסחרי (בלי §46) ⇒ "צרו קשר"; עמותתי ⇒ "לתרומה". */
export interface SiteVocab {
  /** כפתור-ה-hero הראשי. */
  heroCta: string;
  /** צ׳יפ-הפעולה בניווט. */
  navCta: string;
  /** כפתור סעיף-הבחירה/קריאה-אחרונה. */
  give: string;
  /** תווית-ההשפעה בבוחר ("התרומה שלך =" / "הפנייה שלך ="). */
  giveLabel: string;
  /** true ⇒ ארגון מסחרי (משנה CTA מתרומה לפנייה). */
  commercial: boolean;
}
export function siteVocab(commercial: boolean, lang: SiteLang): SiteVocab {
  // he/yi ⇒ עברית (כמו היום); en/es/fr ⇒ בשפתם
  const w = (heTxt: string, en: string, es: string, fr: string) => (lang === 'en' ? en : lang === 'es' ? es : lang === 'fr' ? fr : heTxt);
  if (commercial) {
    return {
      heroCta: w('צרו קשר', 'Get in touch', 'Contáctenos', 'Contactez-nous'),
      navCta: w('צרו קשר', 'Contact', 'Contacto', 'Contact'),
      give: w('צרו קשר', 'Contact us', 'Contáctenos', 'Contactez-nous'),
      giveLabel: w('הפנייה שלך', 'Your request', 'Su consulta', 'Votre demande'),
      commercial: true,
    };
  }
  const donate = w('לתרומה', 'Donate', 'Donar', 'Faire un don');
  return {
    heroCta: w('לתרומה עכשיו', 'Donate now', 'Donar ahora', 'Donner maintenant'),
    navCta: donate + ' ♡',
    give: donate + ' ♡',
    giveLabel: w('התרומה שלך', 'Your gift', 'Su donación', 'Votre don'),
    commercial: false,
  };
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
  /** תאריך-היעד עבר (26.10.2026: קמפיין שנגמר לא מוצג כ"נסגר בעוד 0 ימים"). */
  ended: boolean;
  /** יש קמפיין להצגה (יעד חיובי ולא הסתיים). */
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
  let ended = false;
  if (c?.end) {
    // חצות-מקומי של יום-היעד (חלק-התאריך בלבד) — ספירת ימים קלנדרית: מ-1.9 ל-11.9
    // = 10 (ולא 11 שנוצר מחישוב סוף-יום). עבר ⇒ 0.
    const t = Date.parse(c.end.slice(0, 10) + 'T00:00:00');
    if (Number.isFinite(t)) {
      const diff = Math.ceil((t - nowMs) / 86_400_000);
      daysLeft = diff > 0 ? diff : 0;
      ended = nowMs >= t + 86_400_000; // היום-האחרון עצמו עדיין פתוח
    }
  }
  return { goal, raised, pct, currency: c?.currency || '₪', daysLeft, ended, show: goal > 0 && !ended };
}

/**
 * קישור-תרומה עם הסכום שנבחר באתר (26.10.2026, "למה הסכום לא עובר").
 * נדרים-פלוס (matara.pro/nedarimplus) קורא מהכתובת: `Amount` (ממלא את שדה-הסכום),
 * `KevaDefault=1` (הוראת-קבע) / `NormalDefault=1` (חד-פעמי) — אומת בקוד העמוד שלהם
 * (Files/JavaScript5.js: GetURLParameter('Amount'/'KevaDefault'/'NormalDefault')).
 * הקדשה (26.10.2026) ⇒ `avour` (אומת: `DecodeParam('avour')` ⇒ #AvourTxt).
 * ספק אחר ⇒ הקישור כמות-שהוא (לא ממציאים פרמטרים שלא אומתו). לא-https / ריק ⇒ null.
 */
export function donateLinkFor(url: string | null, amount: number, monthly: boolean, dedication = ''): string | null {
  if (!url) return null;
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  if (!(/(^|\.)matara\.pro$/i.test(u.hostname) && /nedarimplus/i.test(u.pathname))) return url;
  const amt = Math.round(amount * 100) / 100;
  if (amt > 0) u.searchParams.set('Amount', String(amt));
  u.searchParams.delete(monthly ? 'NormalDefault' : 'KevaDefault');
  u.searchParams.set(monthly ? 'KevaDefault' : 'NormalDefault', '1');
  // הקדשה ⇒ `avour` (שדה-ההקדשה, ניתן לעריכה, עד 100 תווים). נדרים מפענח ב-decodeURIComponent —
  // לא ממיר '+' לרווח, ולכן מקודדים ידנית (%20) ולא דרך searchParams.
  const ded = dedication.replace(/\p{Cc}/gu, '').trim().slice(0, 100);
  u.searchParams.delete('avour');
  const out = u.toString();
  return ded ? out + (u.search ? '&' : '?') + 'avour=' + encodeURIComponent(ded) : out;
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
