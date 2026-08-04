/**
 * מנוע הקונפיגורציה — טעינת קונפיגורציית הארגון והחלת ערכת הנושא על ה-DOM.
 *
 * סדר הרזולוציה של loadOrgConfig():
 * 1. localStorage 'maor_org_config' — דריסת ריצה (ישמש את אשף ההקמה).
 * 2. fetch('./config.json') — קובץ סטטי יחסי ל-base (פר-פריסה של ארגון).
 * 3. DEFAULT_CONFIG — כשאין קובץ / הקובץ פגום (404, JSON שבור).
 */
import { DEFAULT_CONFIG, INTEGRATION_KEYS, INTEGRATION_SETTING_KEYS, type FirebaseOrgConfig, type ModuleKey, type OrgConfig } from '../types/config';

const LS_CONFIG_KEY = 'maor_org_config';

/** האם מודול פעיל בקונפיגורציה — מפתח חסר = פעיל; רק false מכבה. */
export function moduleOn(cfg: OrgConfig, m: ModuleKey): boolean {
  return cfg.modules[m] !== false;
}

/** שמונת מודולי הניווט הניתנים לכיבוי — קידומות של פיצ'רים שכפופות לטוגל מודול. */
const NAV_MODULE_KEYS: readonly ModuleKey[] = [
  'families',
  'courses',
  'calendar',
  'diary',
  'supporters',
  'reports',
  'tzedaka',
  'shop',
  'shop7',
];

/**
 * האם פיצ'ר עדין פעיל — מפתח חסר = פעיל; רק false מכבה.
 * **שרשור-אבות מלא (הכרעת בעלים — "הוא לא שילם הוא לא מקבל"):** דגל-אב כבוי מכבה
 * את כל צאצאיו אוטומטית. ‏featureOn('a.b.c') כבוי אם כבוי 'a.b.c' עצמו, או 'a.b',
 * או 'a', או שמודול-הניווט 'a' כבוי. כך כיבוי פיצ'ר-אב מסתיר את כל תת-הפיצ'רים
 * ללא צורך בבדיקה ידנית בכל קומפוננטה. קידומות 'core'/'home'/'settings' אינן
 * מודולי-ניווט (רק שרשור-הדגלים חל עליהן, לא טוגל-מודול).
 */
export function featureOn(cfg: OrgConfig, key: string): boolean {
  const parts = key.split('.');
  // כל דגל-אב (וכן הדגל עצמו) שכבוי במפורש — מכבה את הצאצא
  for (let i = 1; i <= parts.length; i++) {
    if (cfg.features?.[parts.slice(0, i).join('.')] === false) return false;
  }
  // מודול-הניווט (הקידומת הראשונה) כבוי — מכבה את כל הדגלים תחתיו
  const prefix = parts[0] ?? '';
  if ((NAV_MODULE_KEYS as readonly string[]).includes(prefix) && !moduleOn(cfg, prefix as ModuleKey)) {
    return false;
  }
  return true;
}

/**
 * האם הרחבה (integration) פעילה — **הפוך מחוזה-הדגלים במכוון**: הרחבה היא
 * מוצר-נמכר (opt-in), לכן מפתח חסר = כבוי; רק enabled:true מפורש מדליק.
 * (דגל-פיצ'ר: חסר = דלוק; רק false מכבה. אל תבלבלו — ratchet אוכף.)
 */
export function integrationOn(cfg: OrgConfig, key: string): boolean {
  return cfg.integrations?.[key]?.enabled === true;
}

/** הגדרת-הרחבה (גל ג׳): מחרוזת מה-allowlist אחרי trim, אחרת ''. */
export function integrationSetting(cfg: OrgConfig, key: string, field: string): string {
  const v = cfg.integrations?.[key]?.[field];
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * ‏URL בטוח מהקונפיג — https בלבד (הקונפיג מגיע מהענן; בלי חיטוי, מסמך-ענן
 * עוין היה מזריק javascript: לתוך href). לא-תקין/לא-https ⇒ null.
 */
export function safeHttpsUrl(raw: string): string | null {
  const t = (raw || '').trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
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

/** נרמול קלט לא-אמין (localStorage / רשת / קובץ מיובא) לצורת OrgConfig מלאה, או null אם לא שמיש. */
export function normalizeConfig(raw: unknown): OrgConfig | null {
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
  // נתיבי-שורש בענן (CLOUD2) — רק true מפורש נשמר; כל השאר = orgs/{slug}
  if (c.cloudRoot === true) cfg.cloudRoot = true;
  else delete cfg.cloudRoot;
  // הרחבות (INTEGRATIONS גל א׳) — חיטוי: רק מפתחות מה-allowlist (שגיאת-כתיב
  // לא נבלעת בשקט — ביקורת 4.8) ורק רשומות {enabled:boolean}. ריק ⇒ מוסר.
  const intsRaw = c.integrations;
  if (intsRaw && typeof intsRaw === 'object' && !Array.isArray(intsRaw)) {
    const ints: Record<string, { enabled: boolean; [s: string]: unknown }> = {};
    for (const [k, v] of Object.entries(intsRaw as Record<string, unknown>)) {
      if (!(INTEGRATION_KEYS as readonly string[]).includes(k)) continue;
      if (v && typeof v === 'object' && !Array.isArray(v) && typeof (v as { enabled?: unknown }).enabled === 'boolean') {
        const entry: { enabled: boolean; [s: string]: unknown } = { enabled: (v as { enabled: boolean }).enabled };
        // גל ג׳: הגדרות-מחרוזת מה-allowlist בלבד (payUrl וכו') — השאר נזרק
        for (const s of INTEGRATION_SETTING_KEYS[k] ?? []) {
          const sv = (v as Record<string, unknown>)[s];
          if (typeof sv === 'string' && sv.trim()) entry[s] = sv.trim();
        }
        ints[k] = entry;
      }
    }
    if (Object.keys(ints).length) cfg.integrations = ints;
    else delete cfg.integrations;
  } else delete cfg.integrations;
  // מיילי-אדמין — רק מחרוזות לא-ריקות; ריק/לא-מערך → מוסר (אין הגבלה)
  const admins = Array.isArray(c.adminEmails)
    ? c.adminEmails.filter((e): e is string => typeof e === 'string' && e.trim() !== '')
    : [];
  if (admins.length) cfg.adminEmails = admins;
  else delete cfg.adminEmails;
  // תפקידים (P3 פריט 15) — מפת מורות מייל→teacherId, רק זוגות מחרוזת לא-ריקים
  const rolesRaw = c.roles as { teachers?: unknown } | undefined;
  const teachersRaw =
    rolesRaw && typeof rolesRaw === 'object' && rolesRaw.teachers && typeof rolesRaw.teachers === 'object'
      ? (rolesRaw.teachers as Record<string, unknown>)
      : null;
  if (teachersRaw) {
    const teachers: Record<string, string> = {};
    for (const [k, v] of Object.entries(teachersRaw))
      if (k.trim() && typeof v === 'string' && v.trim()) teachers[k.trim()] = v.trim();
    if (Object.keys(teachers).length) cfg.roles = { teachers };
    else delete cfg.roles;
  } else delete cfg.roles;
  return cfg;
}

/* ---------- תפקידים (P3 פריט 15, הכרעה 2) ---------- */

export type UserRole = 'admin' | 'teacher' | 'staff';

/**
 * תפקיד המשתמש לפי המייל המחובר: ב-adminEmails ⇒ admin; במפת roles.teachers
 * ⇒ teacher; אחרת staff. בלי מייל (ענן כבוי) ⇒ staff — התנהגות של היום.
 * ההשוואות case-insensitive.
 */
export function roleOf(config: OrgConfig, email: string | null | undefined): UserRole {
  const e = (email || '').trim().toLowerCase();
  if (!e) return 'staff';
  if (config.adminEmails?.some((a) => a.trim().toLowerCase() === e)) return 'admin';
  const teachers = config.roles?.teachers;
  if (teachers && Object.keys(teachers).some((k) => k.trim().toLowerCase() === e)) return 'teacher';
  return 'staff';
}

/** ה-teacherId הממופה למייל המורה — null כשאין מיפוי. */
export function teacherIdOf(config: OrgConfig, email: string | null | undefined): string | null {
  const e = (email || '').trim().toLowerCase();
  const teachers = config.roles?.teachers;
  if (!e || !teachers) return null;
  for (const [k, v] of Object.entries(teachers)) if (k.trim().toLowerCase() === e) return v;
  return null;
}

/**
 * האם המשתמש הנוכחי מנהל-על. ריק/חסר adminEmails = אין הגבלה (true לכולם, כמו
 * היום). מוגדר = רק מי שמיילו ברשימה (case-insensitive). ללא מייל מול רשימה
 * מוגדרת = לא-אדמין (משתמש-לקוח שאינו ברשימה).
 */
export function isAdminUser(config: OrgConfig, email: string | null | undefined): boolean {
  const admins = config.adminEmails;
  if (!admins || admins.length === 0) return true;
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return admins.some((a) => a.trim().toLowerCase() === e);
}

/** דריסת הריצה השמורה בדפדפן, אם קיימת ותקינה. */
export function readConfigOverride(): OrgConfig | null {
  try {
    const raw = localStorage.getItem(LS_CONFIG_KEY);
    return raw ? normalizeConfig(JSON.parse(raw)) : null;
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

/* ---------- פלטפורמה (CLOUD2 — טהור, בלי firebase) ---------- */

/** מיילי-העל של הפלטפורמה — לוח הבקרה (#platform) ועקיפת שער-החברות. */
export const SUPER_ADMIN_EMAILS = ['meir7651231@gmail.com'];

/** האם מייל-על (case-insensitive). */
export function isSuperAdmin(email: string | null | undefined): boolean {
  const e = (email || '').trim().toLowerCase();
  return !!e && SUPER_ADMIN_EMAILS.includes(e);
}

/**
 * ולידציית טופס ההרשמה (ענן 3) — טהורה עד גבול ה-SDK: מחזירה הודעת שגיאה
 * בעברית או '' כשהקלט תקין.
 */
export function signUpError(
  orgName: string,
  contactName: string,
  phone: string,
  email: string,
  password: string,
  password2: string,
): string {
  if (!orgName.trim()) return 'שם הארגון הוא שדה חובה';
  // הזרימה מבוססת שיחה חוזרת (עדכון פקודה 30.7) — איש קשר וטלפון חובה
  if (!contactName.trim()) return 'שם איש הקשר הוא שדה חובה';
  if (!/^[\d+][\d\s-]{6,}$/.test(phone.trim())) return 'מספר טלפון תקין הוא שדה חובה — נחזור אליכם לאישור';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'כתובת האימייל אינה תקינה';
  if (password.length < 6) return 'הסיסמה חייבת להיות לפחות 6 תווים';
  if (password !== password2) return 'הסיסמאות אינן זהות';
  return '';
}

/**
 * ולידציית הרשמת-עובד/ת (ORGADMIN — מסך-אחיד, "קוד מהבוס") — טהורה עד גבול
 * ה-SDK: מייל תקין, טלפון, סיסמה ≥6, וקוד-הזמנה לא-ריק. מחזירה הודעת שגיאה
 * בעברית או '' כשהקלט תקין. פירוק הקוד עצמו (slug.code) נבדק ב-parseJoinFullCode.
 */
export function employeeSignUpError(email: string, phone: string, password: string, code: string): string {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'כתובת האימייל אינה תקינה';
  if (!/^[\d+][\d\s-]{6,}$/.test(phone.trim())) return 'מספר טלפון תקין הוא שדה חובה';
  if (password.length < 6) return 'הסיסמה חייבת להיות לפחות 6 תווים';
  if (!code.trim()) return 'קוד-ההזמנה מהמנהל הוא שדה חובה';
  return '';
}

/* ---------- קונפיג-ענן: מטמון ומיזוג עדיפויות (CLOUD2 ענן 2 — טהור, בלי firebase) ---------- */

/** מפתח מטמון הקונפיג-מהענן — נפרד מדריסת-הריצה של האשף (LS_CONFIG_KEY). */
export function cloudCfgCacheKey(slug: string): string {
  return 'maor_cloudcfg:' + slug;
}

/** קריאת מטמון הקונפיג-מהענן — לעליית-מהירה/offline; null כשאין/פגום. */
export function readCloudConfigCache(slug: string): OrgConfig | null {
  try {
    const raw = localStorage.getItem(cloudCfgCacheKey(slug));
    const cfg = raw ? normalizeConfig(JSON.parse(raw)) : null;
    return cfg && cfg.slug === slug ? cfg : null;
  } catch {
    return null;
  }
}

/** כתיבת מטמון הקונפיג-מהענן (הקונפיג הממוזג המלא — כולל firebase לעלייה הבאה). */
export function writeCloudConfigCache(slug: string, cfg: OrgConfig): void {
  try {
    localStorage.setItem(cloudCfgCacheKey(slug), JSON.stringify(cfg));
  } catch {
    /* localStorage חסום/מלא — המטמון הוא נוחות בלבד */
  }
}

/**
 * מיזוג עדיפויות (ענן > סטטי > ברירת מחדל): קונפיג-הענן גובר על הסטטי, אך
 * ה-slug נשאר של הכתובת ו-firebase נשמר מהסטטי כשמסמך-הענן לא מגדיר (מסמך
 * הפלטפורמה לרוב בלי credentials — הם באים מקונפיג-השורש). ‏cloudRaw לא-שמיש
 * ⇒ הסטטי כמות שהוא (אפס שינוי כשאין ענן — ratchet).
 */
export function resolveOrgConfig(staticCfg: OrgConfig, cloudRaw: unknown): OrgConfig {
  const cloud = normalizeConfig(cloudRaw);
  if (!cloud) return staticCfg;
  const merged: OrgConfig = { ...cloud, slug: staticCfg.slug };
  if (!merged.firebase && staticCfg.firebase) merged.firebase = staticCfg.firebase;
  return merged;
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
  // מטמון קונפיג-ענן לסלאג (CLOUD2 ענן 2) — ענן גובר על הסטטי גם בעלייה
  // מהירה/offline; מתרענן חי אחרי ההתחברות (watchOrgCloudConfig)
  if (slug) {
    const cached = readCloudConfigCache(slug);
    if (cached) return cached;
  }
  if (slug) {
    try {
      const res = await fetch(`./c/${slug}/config.json`, { cache: 'no-cache' });
      if (res.ok) {
        const cfg = normalizeConfig(await res.json());
        if (cfg) return { ...cfg, slug };
      }
    } catch {
      /* קובץ הלקוח חסר — ניפול להמשך השרשרת */
    }
  }
  const override = readConfigOverride();
  if (override && (!slug || override.slug === slug)) return override;
  try {
    const res = await fetch('./config.json', { cache: 'no-cache' });
    if (res.ok) {
      const cfg = normalizeConfig(await res.json());
      // ארגון-פלטפורמה בלי קובץ סטטי (CLOUD2): קונפיג-השורש נותן את
      // ה-firebase, וה-slug מהכתובת נשמר — כך הקונפיג-מהענן יימצא אחרי הכניסה
      if (cfg) return slug ? { ...cfg, slug } : cfg;
    }
  } catch {
    /* אין קובץ / רשת — נמשיך לברירת המחדל */
  }
  return slug ? { ...DEFAULT_CONFIG, slug } : DEFAULT_CONFIG;
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
