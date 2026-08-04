/**
 * מנוע-תמחור (טהור) — מחשב הצעת-מחיר לפי המודולים שהודלקו וגודל הארגון.
 *
 * ⚠️ המחירים הם **נתון עריך של הבעלים** — ברירות-המחדל כאן הן placeholder
 * (טווחי-שוק לעמותות בישראל) שהבעלים דורס בפועל דרך האשף. המנוע לא קובע מחיר,
 * רק מחשב סכום מטבלת-מחירים נתונה. נשמר מקומית (מכשיר-המטמיע), לא בקונפיג-הלקוח.
 */
import type { ModuleKey } from '../types/config';
import { ALL_MODULES } from '../components/platform/lib';

export type OrgSize = 'small' | 'medium' | 'large';

/** טבלת-המחירים של הבעלים — בסיס חודשי + תוספת פר-מודול + הרחבות + מכפיל-גודל + הקמה. */
export interface PriceTable {
  /** מחיר-בסיס חודשי (כולל בית · משפחות · לוח · הגדרות · ליבה — תמיד פעילים). */
  base: number;
  /** תוספת חודשית פר-מודול (0 = כלול בבסיס). */
  modules: Partial<Record<ModuleKey, number>>;
  /** תוספת חודשית פר-הרחבה (integrations — קבלות/סליקה/וואטסאפ/AI…). */
  integrations: Record<string, number>;
  /** מכפיל לפי גודל הארגון (מס' משפחות/תורמים). */
  sizeMult: Record<OrgSize, number>;
  /** הקמה חד-פעמית (0 = חינם כמנוף-מכירה). */
  setup: number;
  /** עסקת Enterprise ("על הענן שלו") — חד-פעמי גדול + תחזוקה שנתית. */
  enterprise: { oneTime: number; annualMaintenance: number };
}

/** סוג-העסקה: מנוי חודשי (הענן שלך) או Enterprise חד-פעמי (הענן שלו). */
export type DealMode = 'subscription' | 'enterprise';

/** מחירי-ברירת-מחדל להרחבות (placeholder — הבעלים משנה). מפתחות = INTEGRATION_LABELS. */
const DEFAULT_INTEGRATION_PRICES: Record<string, number> = {
  receipts: 40, // קבלות §46 אוטומטיות — ערך-ציות גבוה
  payments: 60, // סליקה והוראות-קבע
  whatsapp: 40,
  sms: 30,
  phone: 50,
  gcal: 20,
  drive: 20,
  sheets: 30,
  maps: 30,
  esign: 40,
  ai: 80, // עוזר-חכם — פרימיום
  campaign: 40,
};

/** ברירות-מחדל = placeholder (הבעלים משנה). המספרים מבוססי-שוק, לא מחייבים. */
export const DEFAULT_PRICES: PriceTable = {
  base: 149,
  modules: {
    families: 0, // כלול בבסיס (CRM ליבה)
    calendar: 0, // כלול בבסיס
    courses: 60,
    diary: 40,
    supporters: 100, // תורמים + קבלות §46 — הערך הגבוה ביותר
    reports: 40,
    tzedaka: 50,
    shop: 60,
    shop7: 50, // חלוקה
  },
  integrations: DEFAULT_INTEGRATION_PRICES,
  sizeMult: { small: 1, medium: 1.6, large: 2.4 },
  setup: 0,
  enterprise: { oneTime: 40000, annualMaintenance: 6000 },
};

export const SIZE_LABELS: Record<OrgSize, string> = {
  small: 'קטן',
  medium: 'בינוני',
  large: 'גדול',
};

export interface QuoteLine {
  key: string;
  label: string;
  price: number;
  /** 'module' | 'integration' — לסיווג בתצוגה. */
  kind: 'module' | 'integration';
}

/** הרחבה-דלוקה שהמטמיע מעביר לתמחור (מפתח + תווית מוכנה). */
export interface AddonInput {
  key: string;
  label: string;
}

export interface Quote {
  /** שורות-חיוב (מודולים+הרחבות) שיש להן מחיר > 0. */
  lines: QuoteLine[];
  /** מודולים דלוקים שכלולים בבסיס (מחיר 0) — להצגת-ערך. */
  included: QuoteLine[];
  base: number;
  modulesSubtotal: number;
  size: OrgSize;
  sizeMult: number;
  /** ‏(base + modulesSubtotal) × sizeMult, מעוגל. */
  monthly: number;
  setup: number;
  /** תשלום ראשון = חודשי + הקמה. */
  firstPayment: number;
  /** שנתי מלא (12 חודשים). */
  yearly: number;
  /** שנתי עם הטבת חודשיים-חינם (10 חודשים). */
  yearlyDiscounted: number;
  /** סוג-העסקה שנבחר להצגה/מסירה. */
  mode: DealMode;
  /** עסקת Enterprise — חד-פעמי ("על הענן שלו") + תחזוקה שנתית. */
  enterpriseOneTime: number;
  enterpriseAnnual: number;
}

/** נירמול טבלת-מחירים לא-אמינה (localStorage) — כל מספר שלילי/לא-תקין → ברירת-מחדל. */
export function normalizePrices(raw: unknown): PriceTable {
  const base = raw && typeof raw === 'object' ? (raw as Partial<PriceTable>) : {};
  const num = (v: unknown, fb: number): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fb);
  const modules: Partial<Record<ModuleKey, number>> = {};
  for (const m of ALL_MODULES) modules[m] = num(base.modules?.[m], DEFAULT_PRICES.modules[m] ?? 0);
  const integrations: Record<string, number> = {};
  for (const k of Object.keys(DEFAULT_INTEGRATION_PRICES)) {
    integrations[k] = num(base.integrations?.[k], DEFAULT_INTEGRATION_PRICES[k]);
  }
  return {
    base: num(base.base, DEFAULT_PRICES.base),
    modules,
    integrations,
    sizeMult: {
      small: num(base.sizeMult?.small, DEFAULT_PRICES.sizeMult.small),
      medium: num(base.sizeMult?.medium, DEFAULT_PRICES.sizeMult.medium),
      large: num(base.sizeMult?.large, DEFAULT_PRICES.sizeMult.large),
    },
    setup: num(base.setup, DEFAULT_PRICES.setup),
    enterprise: {
      oneTime: num(base.enterprise?.oneTime, DEFAULT_PRICES.enterprise.oneTime),
      annualMaintenance: num(base.enterprise?.annualMaintenance, DEFAULT_PRICES.enterprise.annualMaintenance),
    },
  };
}

/**
 * חישוב הצעת-מחיר — טהור. מקבל קונפיג (אילו מודולים דלוקים), גודל, טבלת-מחירים,
 * ופונקציית-שם (nameOf — כדי לכבד דריסות-מונח termOf של הלקוח). מחזיר פירוט מלא.
 */
export function computeQuote(
  cfg: { modules?: Partial<Record<ModuleKey, boolean>> },
  size: OrgSize,
  prices: PriceTable,
  nameOf: (m: ModuleKey) => string,
  addons: AddonInput[] = [],
  mode: DealMode = 'subscription',
): Quote {
  const onModules = ALL_MODULES.filter((m) => cfg.modules?.[m] !== false);
  const all: QuoteLine[] = onModules.map((m) => ({ key: m, label: nameOf(m), price: prices.modules[m] ?? 0, kind: 'module' as const }));
  const addonLines: QuoteLine[] = addons.map((a) => ({ key: a.key, label: a.label, price: prices.integrations[a.key] ?? 0, kind: 'integration' as const }));
  const lines = [...all.filter((l) => l.price > 0), ...addonLines.filter((l) => l.price > 0)];
  const included = all.filter((l) => l.price === 0);
  const modulesSubtotal = lines.reduce((s, l) => s + l.price, 0);
  const sizeMult = prices.sizeMult[size] ?? 1;
  const monthly = Math.round((prices.base + modulesSubtotal) * sizeMult);
  const setup = prices.setup ?? 0;
  return {
    lines,
    included,
    base: prices.base,
    modulesSubtotal,
    size,
    sizeMult,
    monthly,
    setup,
    firstPayment: monthly + setup,
    yearly: monthly * 12,
    yearlyDiscounted: monthly * 10,
    mode,
    enterpriseOneTime: prices.enterprise.oneTime,
    enterpriseAnnual: prices.enterprise.annualMaintenance,
  };
}

/** עיצוב מחיר בשקלים — שלם, מפריד-אלפים עברי. */
export function shekel(n: number): string {
  return '₪' + Math.round(n).toLocaleString('he-IL');
}

const PRICES_LS_KEY = 'maor_prices';

/** קריאת טבלת-המחירים השמורה (מכשיר-המטמיע), או ברירת-המחדל. */
export function readPrices(): PriceTable {
  try {
    const raw = localStorage.getItem(PRICES_LS_KEY);
    return raw ? normalizePrices(JSON.parse(raw)) : { ...DEFAULT_PRICES };
  } catch {
    return { ...DEFAULT_PRICES };
  }
}

/** שמירת טבלת-המחירים (מקומית — לא בקונפיג-הלקוח, לא בענן). */
export function writePrices(p: PriceTable): void {
  try {
    localStorage.setItem(PRICES_LS_KEY, JSON.stringify(p));
  } catch {
    /* localStorage חסום — המחירים יחזיקו עד רענון */
  }
}
