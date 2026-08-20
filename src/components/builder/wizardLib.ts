/**
 * מנוע-האשף 2.0 (20.8, בקשת-בעלים "פירוט למקסימום אבל יעיל") — פונקציות טהורות
 * בלבד: דוח-שינויים מול ברירת-המחדל, סינון-שורות (דלוקות/כבויות/opt-in/שונו),
 * קיבוץ-משנה אוטומטי לפי קידומת-המפתח, וחיפוש-כולל (יכולות+מונחים+הרחבות).
 * אין כאן React/store — הכול נבדק ביחידה.
 */
import type { OrgConfig } from '../../types/config';
import type { FeatureDef, TermDef } from '../../types/features';
import { featureEffectiveOn } from './sections';

/* ── דוח-שינויים: מה בקונפיג שונה מברירת-המחדל ── */

export interface WizardDiff {
  /** מפתחות-יכולת ששונו: false מפורש, או opt-in שהודלק (true מפורש). */
  features: string[];
  /** מפתחות-מונח עם דריסה בפועל (שונה מברירת-המחדל). */
  terms: string[];
  /** מודולים כבויים. */
  modulesOff: string[];
  /** הרחבות דלוקות (חסר=כבוי ⇒ enabled=true הוא תמיד שינוי). */
  integrationsOn: string[];
}

export function wizardDiff(cfg: OrgConfig, features: FeatureDef[], terms: TermDef[]): WizardDiff {
  const optIn = new Set(features.filter((f) => f.optIn).map((f) => f.key));
  const featChanged: string[] = [];
  for (const [k, v] of Object.entries(cfg.features ?? {})) {
    if (v === false) featChanged.push(k);
    else if (v === true && optIn.has(k)) featChanged.push(k);
  }
  const termChanged = terms
    .filter((t) => {
      const ov = (cfg.terms?.[t.key] ?? '').trim();
      return ov !== '' && ov !== t.fallback;
    })
    .map((t) => t.key);
  const modulesOff = Object.entries(cfg.modules ?? {})
    .filter(([, v]) => v === false)
    .map(([k]) => k);
  const integrationsOn = Object.entries(cfg.integrations ?? {})
    .filter(([, v]) => v?.enabled === true)
    .map(([k]) => k);
  return { features: featChanged, terms: termChanged, modulesOff, integrationsOn };
}

/** סך-השינויים — למונה שבכותרת. */
export function diffCount(d: WizardDiff): number {
  return d.features.length + d.terms.length + d.modulesOff.length + d.integrationsOn.length;
}

/* ── סינון-שורות: הכול / דלוקות / כבויות / opt-in / שונו ── */

export type RowFilter = 'all' | 'on' | 'off' | 'optin' | 'changed';

export const ROW_FILTER_LABELS: Record<RowFilter, string> = {
  all: 'הכול',
  on: '✅ דלוקות',
  off: '⬜ כבויות',
  optin: '⭐ opt-in',
  changed: '✏️ שונו',
};

export function filterFeatureRows(
  cfg: OrgConfig,
  feats: FeatureDef[],
  filter: RowFilter,
  diff: WizardDiff,
): FeatureDef[] {
  if (filter === 'all') return feats;
  if (filter === 'optin') return feats.filter((f) => f.optIn);
  if (filter === 'changed') {
    const set = new Set(diff.features);
    return feats.filter((f) => set.has(f.key));
  }
  return feats.filter((f) => (filter === 'on' ? featureEffectiveOn(cfg, f) : !featureEffectiveOn(cfg, f)));
}

/* ── קיבוץ-משנה: יכולות באותו מקטע מקובצות לפי הקטע השני של המפתח ── */

/** תוויות עבריות לתת-קבוצות נפוצות; קידומת בלי תווית ⇒ נשארת ברצף הכללי. */
export const SUBGROUP_LABELS: Record<string, string> = {
  punch: '🎟️ כרטיסיות',
  printout: '🖨 תדפיסים ודוחות',
  enroll: '📝 שיבוץ',
  absence: '🕐 חיסורים והשלמות',
  makeup: '🕐 חיסורים והשלמות',
  attendance: '🕐 חיסורים והשלמות',
  receipt: '🧾 קבלות',
  ayin: '🗂 מעקב-טיפול ופרויקטים',
  cred: '⭐ אמינות',
  hok: '🔁 הוראות-קבע',
};

export interface FeatureGroup {
  /** תווית תת-הקבוצה, או null לרצף הכללי (מוצג בלי כותרת). */
  label: string | null;
  items: FeatureDef[];
}

/**
 * קיבוץ יציב: שומר את סדר-ההגדרה המקורי; פותח קבוצה רק כשיש ≥2 יכולות
 * עם אותה תווית-קבוצה (קבוצה-של-אחת = רעש). הרצף הכללי תמיד ראשון.
 */
export function groupFeatures(feats: FeatureDef[]): FeatureGroup[] {
  const labelOf = (f: FeatureDef): string | null => {
    const parts = f.key.split('.');
    return parts.length >= 3 ? (SUBGROUP_LABELS[parts[1]] ?? null) : null;
  };
  const counts: Record<string, number> = {};
  for (const f of feats) {
    const l = labelOf(f);
    if (l) counts[l] = (counts[l] ?? 0) + 1;
  }
  const groups: FeatureGroup[] = [];
  const at: Record<string, FeatureGroup> = {};
  const general: FeatureGroup = { label: null, items: [] };
  for (const f of feats) {
    const l = labelOf(f);
    if (l && counts[l] >= 2) {
      if (!at[l]) {
        at[l] = { label: l, items: [] };
        groups.push(at[l]);
      }
      at[l].items.push(f);
    } else general.items.push(f);
  }
  return general.items.length ? [general, ...groups] : groups;
}

/* ── חיפוש-כולל: גם הרחבות (הפער שנמצא בביקורת 20.8 — "וואטסאפ" לא נמצא) ── */

export function integrationMatches(q: string, labels: Record<string, string>): string[] {
  const nq = q.trim();
  if (!nq) return [];
  return Object.entries(labels)
    .filter(([k, label]) => label.includes(nq) || k.includes(nq.toLowerCase()))
    .map(([k]) => k);
}
