/**
 * מפת מקטעי אשף ההרכבה — מקטע לכל מסך במערכת, בסדר הופעת המסכים בניווט.
 * כל מקטע מאגד: טוגל-אב למודול (אם קיים), הפיצ'רים שלו מ-FEATURES (לפי module),
 * והמונחים הרלוונטיים מ-TERM_DEFS המוצגים כשדות ✏️ שינוי-שם.
 */
import type { ModuleKey, OrgConfig } from '../../types/config';
import type { FeatureDef } from '../../types/features';

export interface WizardSectionDef {
  /** מזהה המקטע — תואם אחד-לאחד ל-FeatureDef.module. */
  id: FeatureDef['module'];
  /** שם עברי נקי (משמש גם בדף המסירה — בלי אימוג'י). */
  title: string;
  /** אימוג'י לכותרת המקטע באשף — תואם לאייקון הניווט באפליקציה. */
  emoji: string;
  /** מפתח המודול לטוגל-האב; home/settings/core תמיד פעילים — אין טוגל. */
  module?: ModuleKey;
  /** מפתחות TERM_DEFS המוצגים תחת המקטע (nav.* + entity.* טבעיים לו). */
  termKeys: string[];
}

export const WIZARD_SECTIONS: WizardSectionDef[] = [
  {
    id: 'families',
    title: 'משפחות',
    emoji: '👨‍👩‍👧‍👦',
    module: 'families',
    termKeys: ['nav.families', 'entity.family', 'entity.member', 'entity.cred'],
  },
  {
    id: 'courses',
    title: 'חוגים',
    emoji: '🎨',
    module: 'courses',
    termKeys: ['nav.courses', 'entity.course', 'entity.teacher', 'entity.enrollment'],
  },
  { id: 'calendar', title: 'לוח שנה', emoji: '📅', module: 'calendar', termKeys: ['nav.calendar'] },
  { id: 'diary', title: 'יומן חדרים', emoji: '📖', module: 'diary', termKeys: ['nav.diary', 'entity.room'] },
  {
    id: 'supporters',
    title: 'תורמים',
    emoji: '💛',
    module: 'supporters',
    termKeys: [
      'nav.supporters',
      'entity.supporter',
      'entity.donation',
      // מעקב טיפול רב-שלבי — כל התוויות ניתנות לשינוי-שם כאן
      'nav.ayin',
      'entity.ayinItem',
      'entity.ayinUnit',
      'ayin.stage.new',
      'ayin.stage.lead',
      'ayin.stage.eyes',
      'ayin.stage.answer',
      'ayin.stage.done',
    ],
  },
  { id: 'reports', title: 'דוחות', emoji: '📊', module: 'reports', termKeys: ['nav.reports'] },
  { id: 'home', title: 'מסך הבית', emoji: '🏠', termKeys: [] },
  { id: 'settings', title: 'הגדרות', emoji: '⚙️', termKeys: [] },
  { id: 'core', title: 'ליבה', emoji: '🧱', termKeys: [] },
];

/** המודול-אב של קבוצת פיצ'רים, או null לקבוצות שאינן ניתנות לכיבוי. */
export function featureModuleKey(m: FeatureDef['module']): ModuleKey | null {
  return m === 'home' || m === 'settings' || m === 'core' ? null : m;
}

/** האם פיצ'ר פעיל בפועל — גם הדגל שלו וגם המודול-האב חייבים להיות דלוקים. */
export function featureEffectiveOn(cfg: OrgConfig, f: FeatureDef): boolean {
  const mk = featureModuleKey(f.module);
  if (mk && cfg.modules[mk] === false) return false;
  return cfg.features?.[f.key] !== false;
}
