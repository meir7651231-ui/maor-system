/**
 * אשף ההרשמה של אורביט (SIGNUP3) — 5 שלבים: תחום → גודל → צרכים → פרטי קשר →
 * חשבון. טהור לחלוטין (בלי store/DOM) — הקבועים וּולידציית-השלב נבדקים ביחידה.
 * הנתונים נזרעים ל-platformRequests כדי שהבעלים יראה הקשר עשיר לפני האישור.
 */
import { signUpError } from './config';
import { VERTICAL_PACKS } from './verticalPacks';

/** תחומי-העסק לאשף — נגזרים מחבילות-הוורטיקל הקיימות (מקור-אמת יחיד). */
export const WIZARD_INDUSTRIES = VERTICAL_PACKS.map((p) => ({
  id: p.id,
  emoji: p.emoji,
  label: p.label,
  sub: p.sub,
}));

/** גודל הארגון. */
export const ORG_SIZES: { id: string; label: string; sub: string }[] = [
  { id: 'small', label: 'קטן', sub: 'עד 5 אנשי צוות' },
  { id: 'medium', label: 'בינוני', sub: '5–20 אנשי צוות' },
  { id: 'large', label: 'גדול', sub: '20+ אנשי צוות' },
];

/** צרכים/כאבים — רב-בחירה, אופציונלי (עוזר לבעלים לתפור). */
export const ORG_NEEDS: { id: string; emoji: string; label: string }[] = [
  { id: 'crm', emoji: '👥', label: 'ניהול לקוחות ואנשי קשר' },
  { id: 'billing', emoji: '🧾', label: 'גבייה, תשלומים וקבלות' },
  { id: 'schedule', emoji: '📅', label: 'יומן, שיבוצים ותורים' },
  { id: 'inventory', emoji: '📦', label: 'מלאי, מוצרים ושירותים' },
  { id: 'reports', emoji: '📊', label: 'דוחות ותובנות' },
  { id: 'multi', emoji: '🏢', label: 'ריבוי סניפים / צוות גדול' },
  { id: 'backup', emoji: '🔒', label: 'גיבוי ואבטחת מידע' },
];

export const WIZARD_STEPS = 5;

/** מצב האשף — כל השדות שהמשתמש ממלא לאורך 5 השלבים. */
export interface WizardState {
  industry: string;
  size: string;
  needs: string[];
  orgName: string;
  contactName: string;
  phone: string;
  email: string;
  password: string;
  password2: string;
}

export const EMPTY_WIZARD: WizardState = {
  industry: '',
  size: '',
  needs: [],
  orgName: '',
  contactName: '',
  phone: '',
  email: '',
  password: '',
  password2: '',
};

/**
 * שגיאת השלב הנוכחי (0-based) — null = תקין להמשך. שלב הצרכים (2) אופציונלי.
 * השלב האחרון (4) עובר דרך signUpError — אותה ולידציה כמו הטופס הרזה.
 */
export function wizardStepError(step: number, s: WizardState): string | null {
  switch (step) {
    case 0:
      return s.industry ? null : 'בחרו את תחום העסק כדי להמשיך';
    case 1:
      return s.size ? null : 'בחרו את גודל הארגון';
    case 2:
      return null; // צרכים — אופציונלי
    case 3:
      if (!s.orgName.trim()) return 'שם הארגון חובה';
      if (!s.contactName.trim()) return 'שם איש קשר חובה';
      if (!s.phone.trim()) return 'טלפון חובה — נחזור אליכם לאישור';
      return null;
    case 4:
      // signUpError מחזיר '' בהצלחה — מנרמלים ל-null לעקביות עם שאר השלבים.
      return signUpError(s.orgName, s.contactName, s.phone, s.email, s.password, s.password2) || null;
    default:
      return null;
  }
}

/** תווית התחום/הגודל לתצוגה (לוח הבקרה) — id → תווית קריאה. */
export function industryLabel(id: string | undefined): string {
  return WIZARD_INDUSTRIES.find((i) => i.id === id)?.label ?? id ?? '—';
}
export function sizeLabel(id: string | undefined): string {
  return ORG_SIZES.find((s) => s.id === id)?.label ?? id ?? '—';
}
export function needLabel(id: string): string {
  return ORG_NEEDS.find((n) => n.id === id)?.label ?? id;
}
