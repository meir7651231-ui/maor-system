/**
 * מנוע הקונפיגורציה — טעינת קונפיגורציית הארגון והחלת ערכת הנושא על ה-DOM.
 *
 * סדר הרזולוציה של loadOrgConfig():
 * 1. localStorage 'maor_org_config' — דריסת ריצה (ישמש את אשף ההקמה).
 * 2. fetch('./config.json') — קובץ סטטי יחסי ל-base (פר-פריסה של ארגון).
 * 3. DEFAULT_CONFIG — כשאין קובץ / הקובץ פגום (404, JSON שבור).
 */
import { DEFAULT_CONFIG, type FirebaseOrgConfig, type ModuleKey, type OrgConfig } from '../types/config';

const LS_CONFIG_KEY = 'maor_org_config';

/** האם מודול פעיל בקונפיגורציה — מפתח חסר = פעיל; רק false מכבה. */
export function moduleOn(cfg: OrgConfig, m: ModuleKey): boolean {
  return cfg.modules[m] !== false;
}

/** ששת מודולי הניווט הניתנים לכיבוי — קידומות של פיצ'רים שכפופות לטוגל מודול. */
const NAV_MODULE_KEYS: readonly ModuleKey[] = [
  'families',
  'courses',
  'calendar',
  'diary',
  'supporters',
  'reports',
];

/**
 * האם פיצ'ר עדין פעיל — מפתח חסר = פעיל; רק false מכבה.
 * בנוסף, אם קידומת המפתח (הקטע שלפני הנקודה) היא אחד מששת מודולי הניווט
 * והמודול כבוי — הפיצ'ר כבוי גם הוא (כיבוי מודול משורשר לילדיו).
 * קידומות 'core' / 'home' / 'settings' אינן כפופות לטוגל מודול.
 */
export function featureOn(cfg: OrgConfig, key: string): boolean {
  if (cfg.features?.[key] === false) return false;
  const prefix = key.split('.')[0] ?? '';
  if ((NAV_MODULE_KEYS as readonly string[]).includes(prefix) && !moduleOn(cfg, prefix as ModuleKey)) {
    return false;
  }
  return true;
}

/**
 * מונח מותאם מהמילון — cfg.terms[key] אחרי trim אם אינו ריק, אחרת fallback.
 * דריסה ריקה / רווחים בלבד נחשבת "אין דריסה".
 */
export function termOf(cfg: OrgConfig, key: string, fallback: string): string {
  const v = cfg.terms?.[key];
  if (typeof v === 'string') {
    const t = v.trim();
    if (t) return t;
  }
  return fallback;
}

/** נרמול שדה ה-firebase — נשמר רק אם ארבעת שדות החובה הם מחרוזות לא-ריקות. */
function normalizeFirebase(raw: unknown): FirebaseOrgConfig | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const f = raw as Partial<FirebaseOrgConfig>;
  const req = [f.apiKey, f.authDomain, f.projectId, f.appId];
  if (!req.every((v) => typeof v === 'string' && v.length > 0)) return undefined;
  const out: FirebaseOrgConfig = {
    apiKey: f.apiKey as string,
    authDomain: f.authDomain as string,
    projectId: f.projectId as string,
    appId: f.appId as string,
  };
  if (typeof f.storageBucket === 'string' && f.storageBucket) out.storageBucket = f.storageBucket;
  if (typeof f.messagingSenderId === 'string' && f.messagingSenderId) {
    out.messagingSenderId = f.messagingSenderId;
  }
  return out;
}

/** נרמול קלט לא-אמין (localStorage / רשת) לצורת OrgConfig מלאה, או null אם לא שמיש. */
function normalize(raw: unknown): OrgConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const c = raw as Partial<OrgConfig>;
  if (typeof c.slug !== 'string' && typeof c.orgName !== 'string' && typeof c.theme !== 'string') {
    return null;
  }
  const cfg: OrgConfig = {
    ...DEFAULT_CONFIG,
    ...c,
    slug: typeof c.slug === 'string' && c.slug ? c.slug : DEFAULT_CONFIG.slug,
    orgName: typeof c.orgName === 'string' ? c.orgName : DEFAULT_CONFIG.orgName,
    theme: typeof c.theme === 'string' && c.theme ? c.theme : DEFAULT_CONFIG.theme,
    modules:
      c.modules && typeof c.modules === 'object' && !Array.isArray(c.modules) ? { ...c.modules } : {},
    features:
      c.features && typeof c.features === 'object' && !Array.isArray(c.features)
        ? { ...c.features }
        : {},
    terms:
      c.terms && typeof c.terms === 'object' && !Array.isArray(c.terms) ? { ...c.terms } : {},
  };
  const fb = normalizeFirebase(c.firebase);
  if (fb) cfg.firebase = fb;
  else delete cfg.firebase;
  return cfg;
}

/** דריסת הריצה השמורה בדפדפן, אם קיימת ותקינה. */
export function readConfigOverride(): OrgConfig | null {
  try {
    const raw = localStorage.getItem(LS_CONFIG_KEY);
    return raw ? normalize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** שמירת דריסת ריצה (אשף ההקמה / setConfig ב-store). */
export function saveConfigOverride(cfg: OrgConfig): void {
  try {
    localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    /* localStorage חסום — הקונפיגורציה תחזיק עד רענון */
  }
}

/** מחיקת דריסת הריצה — חזרה לקונפיגורציית הקובץ/ברירת המחדל. */
export function clearConfigOverride(): void {
  try {
    localStorage.removeItem(LS_CONFIG_KEY);
  } catch {
    /* localStorage חסום */
  }
}

/** slug מה-URL: ?org=<slug> — פריסה אחת משרתת אינסוף לקוחות (public/c/<slug>/config.json). */
export function orgSlugFromUrl(): string | null {
  try {
    const slug = new URLSearchParams(window.location.search).get('org');
    return slug && /^[a-z0-9-]{2,40}$/.test(slug) ? slug : null;
  } catch {
    return null;
  }
}

/** טעינת קונפיגורציית הארגון לפי סדר הרזולוציה המתועד למעלה. */
export async function loadOrgConfig(): Promise<OrgConfig> {
  // ?org=<slug> גובר על הכול — כתובת של לקוח ספציפי
  const slug = orgSlugFromUrl();
  if (slug) {
    try {
      const res = await fetch(`./c/${slug}/config.json`, { cache: 'no-cache' });
      if (res.ok) {
        const cfg = normalize(await res.json());
        if (cfg) return { ...cfg, slug };
      }
    } catch {
      /* קובץ הלקוח חסר — ניפול להמשך השרשרת */
    }
  }
  const override = readConfigOverride();
  if (override) return override;
  try {
    const res = await fetch('./config.json', { cache: 'no-cache' });
    if (res.ok) {
      const cfg = normalize(await res.json());
      if (cfg) return cfg;
    }
  } catch {
    /* אין קובץ / רשת — נמשיך לברירת המחדל */
  }
  return DEFAULT_CONFIG;
}

/** החלת ערכת נושא + דריסת צבע הדגשה על ה-DOM. */
export function applyTheme(theme: string, accent?: string): void {
  const el = document.documentElement;
  el.dataset.theme = theme || DEFAULT_CONFIG.theme;
  if (accent) el.style.setProperty('--accent', accent);
  else el.style.removeProperty('--accent');
}

/** החלת קונפיגורציה שלמה (ערכה + צבע) — נוחות לאשף/בדיקות. */
export function applyConfig(cfg: OrgConfig): void {
  applyTheme(cfg.theme, cfg.accent);
}
