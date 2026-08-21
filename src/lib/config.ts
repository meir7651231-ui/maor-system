/**
 * מנוע הקונפיגורציה — טעינת קונפיגורציית הארגון והחלת ערכת הנושא על ה-DOM.
 *
 * סדר הרזולוציה של loadOrgConfig():
 * 1. localStorage 'maor_org_config' — דריסת ריצה (ישמש את אשף ההקמה).
 * 2. fetch('./config.json') — קובץ סטטי יחסי ל-base (פר-פריסה של ארגון).
 * 3. DEFAULT_CONFIG — כשאין קובץ / הקובץ פגום (404, JSON שבור).
 */
import { DEFAULT_CONFIG, INTEGRATION_KEYS, INTEGRATION_SETTING_KEYS, MOTION_KEYS, SITE_LANGS, type FirebaseOrgConfig, type LocalizedText, type ModuleKey, type OrgConfig, type PublicSiteContent, type SiteLang, type TelNumber, type TelephonyConfig } from '../types/config';
import { TEMPLATE_KEYS } from './templates';

const LS_CONFIG_KEY = 'maor_org_config';

/** האם מודול פעיל בקונפיגורציה — מפתח חסר = פעיל; רק false מכבה. */
export function moduleOn(cfg: OrgConfig, m: ModuleKey): boolean {
  return cfg.modules[m] !== false;
}

/** תשעת מודולי הניווט הניתנים לכיבוי — קידומות של פיצ'רים שכפופות לטוגל מודול. */
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
 * מסלול-B — האם פיצול-התרומות פעיל לארגון זה. **off-by-default** (opt-in מפורש,
 * לא חוזה-הדגלים): נדלק רק ב-donationSplit:true. נקרא בגבול-הסנכרון בלבד.
 *
 * הכרעת-בעלים (15.8: "מה זה משנה מאור או יעקב"): גם לקוח-שורש (cloudRoot) רשאי
 * להדליק פיצול — אין סיבה שהמקורי יהיה שונה מארגון-חדש. תואם-לאחור: הדגל כבוי
 * כברירת-מחדל ⇒ ארגון-שורש שלא הדליק נשאר ביט-זהה; רק donationSplit:true מפורש
 * מפעיל. אצל שורש, אוסף-התרומות יושב בנתיב-השורש (donationsPath מטפל).
 */
export function donationSplitOn(cfg: OrgConfig): boolean {
  return cfg.donationSplit === true;
}

/**
 * אכיפת-תומכים בשכבת-הנתונים (15.8, ארגוני-פלטפורמה בלבד) — off-by-default, רק
 * `supporterEnforce:true` מפורש מפעיל. כשדלוק: מסמכי-תומכים נושאים skey ועובד/ת
 * מוגבל/ת קורא/ת מסונן (Rules פר-skey). ⚠️ אכיפת-השרת עובדת רק בארגון-פלטפורמה;
 * בלקוח-שורש (cloudRoot) אין „עובד מוגבל" בשרת — enableSupEnforce חוסם שורש.
 */
export function supEnforceOn(cfg: OrgConfig): boolean {
  return cfg.supporterEnforce === true;
}

/**
 * האם הרחבה (integration) פעילה — **הפוך מחוזה-הדגלים במכוון**: הרחבה היא
 * מוצר-נמכר (opt-in), לכן מפתח חסר = כבוי; רק enabled:true מפורש מדליק.
 * (דגל-פיצ'ר: חסר = דלוק; רק false מכבה. אל תבלבלו — ratchet אוכף.)
 */
export function integrationOn(cfg: OrgConfig, key: string): boolean {
  return cfg.integrations?.[key]?.enabled === true;
}

/**
 * האם מודול-הטלפוניה פעיל — opt-in (חסר/false=כבוי, רק enabled:true מדליק), כמו
 * הרחבה. מגדיר את הופעת כפתורי-החיוג (📞) במסכי-הקשר (משפחה/תומך/מתנדב/רכז).
 */
export function telephonyOn(cfg: OrgConfig): boolean {
  return cfg.telephony?.enabled === true;
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

/* ---------- טלפוניה (downstream) — חיטוי לפני התמדה/ייצוא ---------- */

const TEL_KINDS: readonly TelNumber['kind'][] = ['sim', 'virtual', 'whatsapp'];
const TEL_HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** מחרוזת נקייה מתווי-בקרה (קטגוריית Unicode Cc), מגוזמת לאורך-מרבי (0 ⇒ ''). */
function telStr(v: unknown, max: number): string {
  return typeof v === 'string' ? v.replace(/\p{Cc}/gu, '').trim().slice(0, max) : '';
}
/** שלוחה — ספרות בלבד עד 8; ריק ⇒ ברירת-המחדל שנמסרה. */
function telExt(v: unknown, def: string): string {
  const s = typeof v === 'string' ? v.replace(/\D/g, '').slice(0, 8) : '';
  return s || def;
}

/**
 * חיטוי תצורת-הטלפוניה — allowlist **מלא**: כל שדה זר (כולל שדה-הזרקה אפשרי
 * בתוך מספר) נזרק. הגנת-בידוד: הקונפיג מסתנכרן לענן/גיבוי, ולכן אסור שיזלוג
 * לתוכו דבר מלבד ציוד-הלקוח. XML-safety עצמו נאכף במנוע (validate/generate),
 * כאן רק צורה. חסר/לא-אובייקט ⇒ undefined (⇒ אין telephony ⇒ ביט-זהה להיום).
 * ברירות-המחדל תואמות ל-emptyTelephonyConfig (מראה מכוונת — שכבות מופרדות).
 */
export function normalizeTelephony(raw: unknown): TelephonyConfig | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const t = raw as Record<string, unknown>;
  const numsRaw = Array.isArray(t.numbers) ? t.numbers.slice(0, 64) : [];
  const numbers: TelNumber[] = [];
  numsRaw.forEach((n, i) => {
    if (!n || typeof n !== 'object' || Array.isArray(n)) return;
    const o = n as Record<string, unknown>;
    const kind = TEL_KINDS.includes(o.kind as TelNumber['kind']) ? (o.kind as TelNumber['kind']) : 'sim';
    const e164 = typeof o.e164 === 'string' ? o.e164.replace(/[^\d+()\-\s]/g, '').trim().slice(0, 24) : '';
    const id = telStr(o.id, 32) || `n${i + 1}`;
    const num: TelNumber = { id, e164, label: telStr(o.label, 60) || id, kind };
    if (o.kosher === true) num.kosher = true;
    numbers.push(num);
  });
  const daysRaw = Array.isArray(t.officeDays) ? t.officeDays : [0, 1, 2, 3, 4];
  const officeDays = [
    ...new Set(daysRaw.filter((d): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)),
  ].sort((a, b) => a - b);
  const bool = (v: unknown, def: boolean) => (typeof v === 'boolean' ? v : def);
  const hhmm = (v: unknown, def: string) => (typeof v === 'string' && TEL_HHMM_RE.test(v) ? v : def);
  // עיר — [a-z] בלבד, 2–20 תווים (תואם לקבלה של validate.mjs); אורך פסול ⇒ '' (מושמט,
  // לא נגזם — קלט חורג הוא זבל, עדיף נפילה לברירת-מחדל מאשר שם-עיר שגוי-שקט).
  const cityRaw = typeof t.city === 'string' ? t.city.toLowerCase().replace(/[^a-z]/g, '') : '';
  return {
    // מתג-המקטע — opt-in: הכותרת נשמרת רק כשהיא true (חסר/false ⇒ כבוי, מושמט).
    ...(t.enabled === true ? { enabled: true } : {}),
    numbers,
    officeDays,
    officeStart: hhmm(t.officeStart, '09:00'),
    officeEnd: hhmm(t.officeEnd, '17:00'),
    officeExt: telExt(t.officeExt, '101'),
    managerExt: telExt(t.managerExt, '201'),
    vmBox: telExt(t.vmBox, '100'),
    city: cityRaw.length >= 2 && cityRaw.length <= 20 ? cityRaw : '',
    kosherMode: bool(t.kosherMode, false),
    hebrewCalendar: bool(t.hebrewCalendar, true),
    zmanim: bool(t.zmanim, false),
    shabbat: bool(t.shabbat, true),
    fasts: bool(t.fasts, false),
    voicemail: bool(t.voicemail, true),
  };
}

/* ---------- אתר ציבורי — חיטוי לפני התמדה/סנכרון-ענן ---------- */

/** מחרוזת נקייה מתווי-בקרה, מגוזמת (לא-מחרוזת ⇒ ''). */
function siteStr(v: unknown, max: number): string {
  return typeof v === 'string' ? v.replace(/\p{Cc}/gu, '').trim().slice(0, max) : '';
}
/** טקסט רב-לשוני: מחרוזת ⇒ מגוזמת; מפה ⇒ רק שפות-allowlist עם ערך לא-ריק; אחרת undefined. */
function normLocalized(v: unknown, max: number): LocalizedText | undefined {
  if (typeof v === 'string') {
    const s = siteStr(v, max);
    return s || undefined;
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const out: Partial<Record<SiteLang, string>> = {};
    for (const l of SITE_LANGS) {
      const s = siteStr((v as Record<string, unknown>)[l], max);
      if (s) out[l] = s;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}
/** מספר חיובי-סופי או undefined. */
function sitePosNum(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined;
}
/** טלפון לתצוגה/חיוג — ספרות ‎+()- ‎ ורווח בלבד, עד 24. */
function sitePhone(v: unknown): string {
  return typeof v === 'string' ? v.replace(/[^\d+()\-\s]/g, '').trim().slice(0, 24) : '';
}

/**
 * חיטוי תוכן-האתר-הציבורי — allowlist מלא + תקרות. הקונפיג מסתנכרן לענן/גיבוי,
 * לכן כל שדה זר נזרק; קישורים https בלבד (safeHttpsUrl); טקסטים מגוזמים. חסר/
 * לא-אובייקט ⇒ undefined (⇒ אין אתר ציבורי, ביט-זהה להיום).
 */
export function normalizeSite(raw: unknown): PublicSiteContent | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const s = raw as Record<string, unknown>;
  const out: PublicSiteContent = {};
  if (s.enabled === false) out.enabled = false;
  else if (s.enabled === true) out.enabled = true;
  const icon = siteStr(s.icon, 12);
  if (icon) out.icon = icon;
  const langs = Array.isArray(s.langs)
    ? [...new Set(s.langs.filter((l): l is SiteLang => (SITE_LANGS as readonly string[]).includes(l as string)))]
    : [];
  if (langs.length) out.langs = langs;
  const tagline = normLocalized(s.tagline, 200);
  if (tagline) out.tagline = tagline;
  if (Array.isArray(s.heroWords)) {
    const words = s.heroWords.map((w) => normLocalized(w, 60)).filter((w): w is LocalizedText => !!w).slice(0, 8);
    if (words.length) out.heroWords = words;
  }
  if (Array.isArray(s.stats)) {
    const stats = s.stats
      .map((st) => {
        if (!st || typeof st !== 'object') return null;
        const o = st as Record<string, unknown>;
        const value = siteStr(o.value, 24);
        const label = normLocalized(o.label, 60);
        return value && label ? { value, label } : null;
      })
      .filter((x): x is { value: string; label: LocalizedText } => !!x)
      .slice(0, 8);
    if (stats.length) out.stats = stats;
  }
  if (s.liveFamilies === true) out.liveFamilies = true;
  const lfl = normLocalized(s.liveFamiliesLabel, 60);
  if (lfl) out.liveFamiliesLabel = lfl;
  if (s.campaign && typeof s.campaign === 'object' && !Array.isArray(s.campaign)) {
    const c = s.campaign as Record<string, unknown>;
    const camp: PublicSiteContent['campaign'] = {};
    const ct = normLocalized(c.title, 120);
    if (ct) camp.title = ct;
    const goal = sitePosNum(c.goal);
    if (goal !== undefined) camp.goal = goal;
    const raised = sitePosNum(c.raised);
    if (raised !== undefined) camp.raised = raised;
    const end = siteStr(c.end, 30);
    if (end) camp.end = end;
    const cur = siteStr(c.currency, 4);
    if (cur) camp.currency = cur;
    if (Object.keys(camp).length) out.campaign = camp;
  }
  if (Array.isArray(s.services)) {
    const svcs = s.services
      .map((sv) => {
        if (!sv || typeof sv !== 'object') return null;
        const o = sv as Record<string, unknown>;
        const title = normLocalized(o.title, 80);
        if (!title) return null;
        const svc: NonNullable<PublicSiteContent['services']>[number] = { title };
        const icon = siteStr(o.icon, 12);
        if (icon) svc.icon = icon;
        const text = normLocalized(o.text, 240);
        if (text) svc.text = text;
        return svc;
      })
      .filter((x): x is NonNullable<PublicSiteContent['services']>[number] => !!x)
      .slice(0, 12);
    if (svcs.length) out.services = svcs;
  }
  const news = normLocalized(s.news, 800);
  if (news) out.news = news;
  const story = normLocalized(s.story, 2000);
  if (story) out.story = story;
  if (Array.isArray(s.gallery)) {
    const imgs = s.gallery
      .map((g) => (typeof g === 'string' ? safeHttpsUrl(g) : null))
      .filter((g): g is string => !!g)
      .slice(0, 24);
    if (imgs.length) out.gallery = imgs;
  }
  if (s.contact && typeof s.contact === 'object' && !Array.isArray(s.contact)) {
    const c = s.contact as Record<string, unknown>;
    const contact: PublicSiteContent['contact'] = {};
    if (Array.isArray(c.phones)) {
      const phones = c.phones.map(sitePhone).filter((p) => p).slice(0, 8);
      if (phones.length) contact.phones = phones;
    }
    const wa = sitePhone(c.whatsapp);
    if (wa) contact.whatsapp = wa;
    const email = siteStr(c.email, 120);
    if (email && email.includes('@')) contact.email = email;
    const addr = normLocalized(c.address, 200);
    if (addr) contact.address = addr;
    const hours = normLocalized(c.hours, 120);
    if (hours) contact.hours = hours;
    const taxNote = normLocalized(c.taxNote, 200);
    if (taxNote) contact.taxNote = taxNote;
    if (typeof c.mapUrl === 'string') {
      const mu = safeHttpsUrl(c.mapUrl);
      if (mu) contact.mapUrl = mu;
    }
    if (Object.keys(contact).length) out.contact = contact;
  }
  if (typeof s.donateUrl === 'string') {
    const u = safeHttpsUrl(s.donateUrl);
    if (u) out.donateUrl = u;
  }
  /* ── עיצוב-דף-התרומות: שדות חדשים (allowlist + תקרות) ── */
  const imgUrl = (v: unknown): string | undefined => (typeof v === 'string' ? safeHttpsUrl(v) || undefined : undefined);
  const setLT = (k: keyof PublicSiteContent, v: unknown, max: number) => {
    const t = normLocalized(v, max);
    if (t) (out as Record<string, unknown>)[k] = t;
  };
  const hi = imgUrl(s.heroImage); if (hi) out.heroImage = hi;
  setLT('heroTitle', s.heroTitle, 80);
  setLT('brandLine', s.brandLine, 60);
  setLT('heroBadge', s.heroBadge, 80);
  setLT('titleAccent', s.titleAccent, 60);
  setLT('servicesHeading', s.servicesHeading, 80);
  setLT('microCopy', s.microCopy, 120);
  setLT('ticker', s.ticker, 160);
  setLT('storyTitle', s.storyTitle, 120);
  setLT('storyTitleAccent', s.storyTitleAccent, 80);
  setLT('storyBadge', s.storyBadge, 80);
  setLT('donateNote', s.donateNote, 240);
  if (Array.isArray(s.marquee)) {
    const mq = s.marquee.map((m) => normLocalized(m, 80)).filter((m): m is LocalizedText => !!m).slice(0, 16);
    if (mq.length) out.marquee = mq;
  }
  if (s.calc && typeof s.calc === 'object' && !Array.isArray(s.calc)) {
    const c = s.calc as Record<string, unknown>;
    const calc: PublicSiteContent['calc'] = {};
    const amt = sitePosNum(c.unitAmount); if (amt !== undefined) calc.unitAmount = amt;
    const unit = normLocalized(c.unit, 60); if (unit) calc.unit = unit;
    const note = normLocalized(c.note, 120); if (note) calc.note = note;
    if (Object.keys(calc).length) out.calc = calc;
  }
  if (Array.isArray(s.tiers)) {
    const tiers = s.tiers.map((tr) => {
      if (!tr || typeof tr !== 'object') return null;
      const o = tr as Record<string, unknown>;
      const name = normLocalized(o.name, 60); if (!name) return null;
      const t: NonNullable<PublicSiteContent['tiers']>[number] = { name };
      const amt = sitePosNum(o.amount); if (amt !== undefined) t.amount = amt;
      const period = normLocalized(o.period, 40); if (period) t.period = period;
      if (Array.isArray(o.perks)) {
        const perks = o.perks.map((p) => normLocalized(p, 100)).filter((p): p is LocalizedText => !!p).slice(0, 8);
        if (perks.length) t.perks = perks;
      }
      if (o.featured === true) t.featured = true;
      const url = imgUrl(o.url); if (url) t.url = url;
      return t;
    }).filter((x): x is NonNullable<PublicSiteContent['tiers']>[number] => !!x).slice(0, 6);
    if (tiers.length) out.tiers = tiers;
  }
  if (Array.isArray(s.testimonials)) {
    const items = s.testimonials.map((tt) => {
      if (!tt || typeof tt !== 'object') return null;
      const o = tt as Record<string, unknown>;
      const quote = normLocalized(o.quote, 400); if (!quote) return null;
      const t: NonNullable<PublicSiteContent['testimonials']>[number] = { quote };
      const author = siteStr(o.author, 80); if (author) t.author = author;
      const role = normLocalized(o.role, 80); if (role) t.role = role;
      return t;
    }).filter((x): x is NonNullable<PublicSiteContent['testimonials']>[number] => !!x).slice(0, 12);
    if (items.length) out.testimonials = items;
  }
  if (Array.isArray(s.faq)) {
    const items = s.faq.map((f) => {
      if (!f || typeof f !== 'object') return null;
      const o = f as Record<string, unknown>;
      const q = normLocalized(o.q, 200); const a = normLocalized(o.a, 800);
      return q && a ? { q, a } : null;
    }).filter((x): x is { q: LocalizedText; a: LocalizedText } => !!x).slice(0, 20);
    if (items.length) out.faq = items;
  }
  if (Array.isArray(s.events)) {
    const items = s.events.map((e) => {
      if (!e || typeof e !== 'object') return null;
      const o = e as Record<string, unknown>;
      const title = normLocalized(o.title, 120); if (!title) return null;
      const ev: NonNullable<PublicSiteContent['events']>[number] = { title };
      const date = siteStr(o.date, 30); if (date) ev.date = date;
      const meta = normLocalized(o.meta, 120); if (meta) ev.meta = meta;
      const url = imgUrl(o.url); if (url) ev.url = url;
      return ev;
    }).filter((x): x is NonNullable<PublicSiteContent['events']>[number] => !!x).slice(0, 12);
    if (items.length) out.events = items;
  }
  if (Array.isArray(s.partners)) {
    const items = s.partners.map((p) => {
      if (!p || typeof p !== 'object') return null;
      const o = p as Record<string, unknown>;
      const name = siteStr(o.name, 80); if (!name) return null;
      const pt: NonNullable<PublicSiteContent['partners']>[number] = { name };
      const logo = imgUrl(o.logo); if (logo) pt.logo = logo;
      const url = imgUrl(o.url); if (url) pt.url = url;
      return pt;
    }).filter((x): x is NonNullable<PublicSiteContent['partners']>[number] => !!x).slice(0, 24);
    if (items.length) out.partners = items;
  }
  if (s.transparency && typeof s.transparency === 'object' && !Array.isArray(s.transparency)) {
    const o = s.transparency as Record<string, unknown>;
    const tr: NonNullable<PublicSiteContent['transparency']> = {};
    const heading = normLocalized(o.heading, 120); if (heading) tr.heading = heading;
    const text = normLocalized(o.text, 600); if (text) tr.text = text;
    const url = imgUrl(o.reportsUrl); if (url) tr.reportsUrl = url;
    if (Array.isArray(o.badges)) {
      const badges = o.badges.map((b) => normLocalized(b, 60)).filter((b): b is LocalizedText => !!b).slice(0, 6);
      if (badges.length) tr.badges = badges;
    }
    if (Object.keys(tr).length) out.transparency = tr;
  }
  /* ── סיפור: מייסד/ת + ציר-זמן ── */
  if (s.founder && typeof s.founder === 'object' && !Array.isArray(s.founder)) {
    const o = s.founder as Record<string, unknown>;
    const f: NonNullable<PublicSiteContent['founder']> = {};
    const name = normLocalized(o.name, 80); if (name) f.name = name;
    const quote = normLocalized(o.quote, 200); if (quote) f.quote = quote;
    const photo = imgUrl(o.photo); if (photo) f.photo = photo;
    if (Object.keys(f).length) out.founder = f;
  }
  if (Array.isArray(s.timeline)) {
    const items = s.timeline.map((m) => {
      if (!m || typeof m !== 'object') return null;
      const o = m as Record<string, unknown>;
      const year = siteStr(o.year, 12); const title = normLocalized(o.title, 120);
      if (!year || !title) return null;
      const it: NonNullable<PublicSiteContent['timeline']>[number] = { year, title };
      const note = normLocalized(o.note, 160); if (note) it.note = note;
      return it;
    }).filter((x): x is NonNullable<PublicSiteContent['timeline']>[number] => !!x).slice(0, 10);
    if (items.length) out.timeline = items;
  }
  if (s.growth && typeof s.growth === 'object' && !Array.isArray(s.growth)) {
    const o = s.growth as Record<string, unknown>;
    const g: NonNullable<PublicSiteContent['growth']> = {};
    const label = normLocalized(o.label, 120); if (label) g.label = label;
    const delta = siteStr(o.delta, 40); if (delta) g.delta = delta;
    if (Array.isArray(o.points)) {
      const pts = o.points.map((p) => (typeof p === 'number' && Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : null)).filter((p): p is number => p !== null).slice(0, 40);
      if (pts.length >= 2) g.points = pts;
    }
    if (Object.keys(g).length) out.growth = g;
  }
  if (Array.isArray(s.paymentMethods)) {
    const items = s.paymentMethods.map((p) => {
      if (!p || typeof p !== 'object') return null;
      const o = p as Record<string, unknown>;
      const label = normLocalized(o.label, 60); const detail = normLocalized(o.detail, 200);
      if (!label || !detail) return null;
      const pm: NonNullable<PublicSiteContent['paymentMethods']>[number] = { label, detail };
      if (o.ltr === true) pm.ltr = true;
      return pm;
    }).filter((x): x is NonNullable<PublicSiteContent['paymentMethods']>[number] => !!x).slice(0, 6);
    if (items.length) out.paymentMethods = items;
  }
  if (s.contactForm && typeof s.contactForm === 'object' && !Array.isArray(s.contactForm)) {
    const o = s.contactForm as Record<string, unknown>;
    const cf: NonNullable<PublicSiteContent['contactForm']> = {};
    if (o.enabled === true) cf.enabled = true; else if (o.enabled === false) cf.enabled = false;
    const note = normLocalized(o.note, 200); if (note) cf.note = note;
    if (Object.keys(cf).length) out.contactForm = cf;
  }
  return Object.keys(out).length ? out : undefined;
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
  // מסלול-B — פיצול-תרומות: רק true מפורש נשמר (off-by-default; השורש פטור ב-donationSplitOn).
  if (c.donationSplit === true) cfg.donationSplit = true;
  else delete cfg.donationSplit;
  // אכיפת-תומכים — רק true מפורש נשמר (off-by-default; ארגוני-פלטפורמה בלבד).
  if (c.supporterEnforce === true) cfg.supporterEnforce = true;
  else delete cfg.supporterEnforce;
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
  // תבניות-הודעה (#12) — allowlist ‏TEMPLATE_KEYS, מחרוזות בלבד, תקרת-אורך 500
  const tplRaw = c.templates;
  if (tplRaw && typeof tplRaw === 'object' && !Array.isArray(tplRaw)) {
    const tpl: Record<string, string> = {};
    for (const [k, v] of Object.entries(tplRaw as Record<string, unknown>)) {
      if (!TEMPLATE_KEYS.includes(k)) continue;
      if (typeof v === 'string' && v.trim()) tpl[k] = v.trim().slice(0, 500);
    }
    if (Object.keys(tpl).length) cfg.templates = tpl;
    else delete cfg.templates;
  } else delete cfg.templates;
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
  // טלפוניה (downstream) — חיטוי allowlist מלא; חסר/לא-אובייקט ⇒ מוסר (ה-spread
  // של ...c היה מעביר telephony לא-מחוטא, לכן חובה set/delete מפורש).
  const tel = normalizeTelephony(c.telephony);
  if (tel) cfg.telephony = tel;
  else delete cfg.telephony;
  // זהות-ורטיקל חזותית (16.8) — אימוג'י-ארגון: מחרוזת קצרה בלבד (glyph),
  // תקרת-אורך 12 (אימוג'י מרובה-נקודות-קוד). ריק/לא-מחרוזת ⇒ מוסר (ביט-זהה להיום).
  if (typeof c.emoji === 'string' && c.emoji.trim()) cfg.emoji = c.emoji.trim().slice(0, 12);
  else delete cfg.emoji;
  // סגנון-תנועה — allowlist בלבד (calm/snappy/bold); כל ערך אחר ⇒ מוסר.
  if (typeof c.motion === 'string' && (MOTION_KEYS as readonly string[]).includes(c.motion)) cfg.motion = c.motion;
  else delete cfg.motion;
  // צבע-מותאם-ידני (provenance) — רק true מפורש נשמר.
  if (c.accentCustom === true) cfg.accentCustom = true;
  else delete cfg.accentCustom;
  // 🔴 נחיל-אבטחה 16.8 — חיטוי accent: הערך מוזרק ל-CSS `--accent` (applyTheme,
  // setProperty) ונצרך כ-background ⇒ ערך זדוני מהענן כמו `url('https://attacker/b.gif')`
  // היה מבצע GET-מאולץ מכל דפדפן-עובד (ביקון-מעקב). מתירים רק צבע-CSS אמיתי:
  // hex · rgb/rgba/hsl/hsla (ספרות/פסיקים/רווח/%/. בלבד) · מילת-צבע. אחרת מוסר.
  if (typeof cfg.accent === 'string' && isSafeAccent(cfg.accent.trim())) cfg.accent = cfg.accent.trim();
  else delete cfg.accent;
  // אתר-ציבורי — חיטוי allowlist מלא (ה-spread של ...c היה מעביר site לא-מחוטא,
  // לכן חובה set/delete מפורש). חסר/לא-אובייקט ⇒ מוסר (⇒ אין אתר, ביט-זהה להיום).
  const site = normalizeSite(c.site);
  if (site) cfg.site = site;
  else delete cfg.site;
  // הגנת-מקור (16.8) — allowlist מארחים: מערך-מחרוזות מנוקה (עד 12, כ"א ≤120).
  if (Array.isArray(c.allowedHosts)) {
    const hosts = c.allowedHosts.filter((h): h is string => typeof h === 'string' && !!h.trim()).map((h) => h.trim().slice(0, 120)).slice(0, 12);
    if (hosts.length) cfg.allowedHosts = hosts;
    else delete cfg.allowedHosts;
  } else delete cfg.allowedHosts;
  return cfg;
}

/**
 * האם האתר-הציבורי פעיל לארגון — הדגל shell.publicsite דלוק ויש תוכן-site
 * לא-מכובה. הגידור על בקשת-הכתובת (‎?site‎) נעשה ב-App (זהו רק המצב הלוגי).
 */
export function publicSiteOn(cfg: OrgConfig): boolean {
  return featureOn(cfg, 'shell.publicsite') && !!cfg.site && cfg.site.enabled !== false;
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

/** צבע-CSS בטוח בלבד (hex/rgb/hsl/keyword) — חוסם הזרקת `url()` וכו' ל-`--accent`.
 *  הגנת-עומק: גם הנתיב מ-db.ui.accent (שלא עובר normalizeConfig) מסונן כאן. */
export function isSafeAccent(a: string): boolean {
  return (
    /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(a) ||
    /^(?:rgb|rgba|hsl|hsla)\([0-9.,%\s/]+\)$/i.test(a) ||
    /^[a-zA-Z]{3,20}$/.test(a)
  );
}

/** החלת ערכת נושא + דריסת צבע הדגשה (+ סגנון-תנועה) על ה-DOM. */
export function applyTheme(theme: string, accent?: string, motion?: string): void {
  const el = document.documentElement;
  el.dataset.theme = theme || DEFAULT_CONFIG.theme;
  if (accent && isSafeAccent(accent.trim())) el.style.setProperty('--accent', accent.trim());
  else el.style.removeProperty('--accent');
  // סגנון-תנועה פר-ורטיקל — data-motion על ה-root; חסר ⇒ ברירת-המחדל (ביט-זהה להיום).
  if (motion && (MOTION_KEYS as readonly string[]).includes(motion)) el.dataset.motion = motion;
  else delete el.dataset.motion;
}

/** ה-favicon הדיפולטי (עיגול זהב) — זהה ל-index.html; משמש לשחזור כשאין אימוג'י. */
export const DEFAULT_FAVICON =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='38' fill='%23f3c76b'/><circle cx='50' cy='50' r='20' fill='%23b45309'/></svg>";

/** בניית data-URI ל-favicon מאימוג'י (טהור — נבדק ביחידה). encodeURIComponent מנטרל הזרקה. */
export function faviconDataUri(emoji: string): string {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text x='50' y='52' font-size='72' text-anchor='middle' dominant-baseline='central'>" +
    emoji +
    '</text></svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/** החלת אייקון-הארגון על ה-favicon של הדפדפן — אימוג'י ⇒ SVG; חסר ⇒ הדיפולט. */
export function applyFavicon(emoji?: string): void {
  if (typeof document === 'undefined') return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = emoji ? faviconDataUri(emoji) : DEFAULT_FAVICON;
}

/** החלת קונפיגורציה שלמה (ערכה + צבע + תנועה + אייקון) — נוחות לאשף/בדיקות. */
export function applyConfig(cfg: OrgConfig): void {
  applyTheme(cfg.theme, cfg.accent, cfg.motion);
  applyFavicon(cfg.emoji);
}
