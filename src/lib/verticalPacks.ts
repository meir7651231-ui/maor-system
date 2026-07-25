/**
 * חבילות-ורטיקל — presets להרכבה מהירה פר-סוג-עסק. כל חבילה = סט מונחים
 * (תיוג-מחדש דרך termOf) + מודולים דלוקים/כבויים. המטמיע בוחר סוג-עסק באשף,
 * מקבל בסיס תפור, ומכוונן ידנית. טהור לחלוטין (בלי store/DOM) — נבדק ביחידה.
 *
 * החלה = החלפה מלאה של terms+modules בערכי החבילה (החבילה היא נקודת-פתיחה
 * דטרמיניסטית); שאר הקונפיג (firebase/adminEmails/theme/features) נשמר.
 */
import type { ModuleKey, OrgConfig } from '../types/config';

export interface VerticalPack {
  id: string;
  emoji: string;
  label: string;
  sub: string;
  /** תיוג-מחדש: מפתח-מונח → תווית. ריק = ברירות המחדל של מאור. */
  terms: Record<string, string>;
  /** מודולים לכבות/להדליק. חסר = דלוק. */
  modules: Partial<Record<ModuleKey, boolean>>;
}

export const VERTICAL_PACKS: VerticalPack[] = [
  {
    id: 'chesed',
    emoji: '🕊️',
    label: 'עמותת חסד',
    sub: 'גמ"ח · קופת צדקה',
    terms: {}, // ברירות המחדל של מאור
    modules: {}, // הכל דלוק
  },
  {
    id: 'clinic',
    emoji: '💇',
    label: 'קליניקה',
    sub: 'לייזר · קוסמטיקה · רפואה',
    terms: {
      'nav.families': 'מטופלים',
      'entity.family': 'מטופל',
      'nav.courses': 'חבילות טיפול',
      'entity.course': 'חבילת טיפול',
      'entity.enrollment': 'טיפול',
      'entity.room': 'חדר טיפול',
      'nav.diary': 'חדרי טיפול',
      'nav.supporters': 'מטופלים במעקב',
      'nav.ayin': 'פרוטוקול טיפול',
      'entity.ayinItem': 'אזור טיפול',
      'ayin.stage.new': 'ייעוץ',
      'ayin.stage.lead': 'תוכנית',
      'ayin.stage.eyes': 'טיפול',
      'ayin.stage.answer': 'מעקב',
      'ayin.stage.done': 'שוחרר',
    },
    modules: {},
  },
  {
    id: 'shop',
    emoji: '🛍️',
    label: 'חנות / קמעונאות',
    sub: 'מכירה · שירות',
    terms: {
      'nav.families': 'לקוחות',
      'entity.family': 'לקוח',
      'entity.member': 'איש קשר',
      'nav.supporters': 'מועדון לקוחות',
      'entity.supporter': 'לקוח',
      'entity.donation': 'רכישה',
      'entity.cred': 'נקודות נאמנות',
    },
    modules: { courses: false, diary: false },
  },
  {
    id: 'services',
    emoji: '💼',
    label: 'שירותים / פרילנסר',
    sub: 'ייעוץ · צלם · טיפול-בית',
    terms: {
      'nav.families': 'לקוחות',
      'entity.family': 'לקוח',
      'nav.calendar': 'פגישות',
      'nav.supporters': 'לידים',
      'nav.ayin': 'משפך מכירות',
      'entity.ayinItem': 'ליד',
      'ayin.stage.new': 'פנייה',
      'ayin.stage.lead': 'הצעה',
      'ayin.stage.eyes': 'מו״מ',
      'ayin.stage.answer': 'נסגר',
      'ayin.stage.done': 'סופק',
    },
    modules: { courses: false },
  },
  {
    id: 'rooms',
    emoji: '🏠',
    label: 'השכרת חללים',
    sub: 'חדרי ישיבות · סטודיו · אולמות',
    terms: {
      'nav.diary': 'לוח חללים',
      'entity.room': 'חלל',
      'nav.families': 'שוכרים',
      'entity.family': 'שוכר',
      'entity.member': 'איש קשר',
      'nav.supporters': 'לקוחות חוזרים',
      'entity.supporter': 'לקוח',
      'entity.donation': 'תשלום',
      'nav.ayin': 'בקשות השכרה',
      'entity.ayinItem': 'בקשה',
      'ayin.stage.new': 'פנייה',
      'ayin.stage.lead': 'הצעת מחיר',
      'ayin.stage.eyes': 'אישור',
      'ayin.stage.answer': 'חוזה',
      'ayin.stage.done': 'הושכר',
    },
    modules: { courses: false },
  },
  {
    id: 'fleet',
    emoji: '🚗',
    label: 'צי רכב / השכרה',
    sub: 'רכבים · ציוד · כלים',
    terms: {
      'nav.diary': 'לוח רכבים',
      'entity.room': 'רכב',
      'nav.families': 'לקוחות',
      'entity.family': 'לקוח',
      'entity.member': 'נהג',
      'nav.supporters': 'מועדון לקוחות',
      'entity.supporter': 'לקוח',
      'entity.donation': 'תשלום שכירות',
      'nav.ayin': 'הזמנות רכב',
      'entity.ayinItem': 'הזמנה',
      'ayin.stage.new': 'בקשה',
      'ayin.stage.lead': 'שריון',
      'ayin.stage.eyes': 'מסירה',
      'ayin.stage.answer': 'בשימוש',
      'ayin.stage.done': 'הוחזר',
    },
    modules: { courses: false },
  },
  {
    id: 'garage',
    emoji: '🔧',
    label: 'מוסך / מעבדה',
    sub: 'תיקונים · שירות · טיפולים',
    terms: {
      'nav.families': 'לקוחות',
      'entity.family': 'לקוח',
      'entity.member': 'רכב/פריט',
      'nav.diary': 'עמדות עבודה',
      'entity.room': 'עמדה',
      'nav.supporters': 'לקוחות קבועים',
      'entity.supporter': 'לקוח',
      'entity.donation': 'תשלום',
      'nav.ayin': 'תהליך תיקון',
      'entity.ayinItem': 'עבודה',
      'ayin.stage.new': 'קבלה',
      'ayin.stage.lead': 'אבחון',
      'ayin.stage.eyes': 'בתיקון',
      'ayin.stage.answer': 'מוכן לאיסוף',
      'ayin.stage.done': 'נמסר',
    },
    modules: { courses: false },
  },
  {
    id: 'hospitality',
    emoji: '🏨',
    label: 'אירוח / צימרים',
    sub: 'מלונית · צימר · אכסניה',
    terms: {
      'nav.diary': 'לוח יחידות',
      'entity.room': 'יחידת אירוח',
      'nav.families': 'אורחים',
      'entity.family': 'אורח',
      'entity.member': 'מלווה',
      'nav.supporters': 'מועדון אורחים',
      'entity.supporter': 'אורח',
      'entity.donation': 'תשלום שהייה',
      'entity.cred': 'נקודות נאמנות',
      'nav.ayin': 'הזמנות אירוח',
      'entity.ayinItem': 'הזמנה',
      'ayin.stage.new': 'בקשה',
      'ayin.stage.lead': 'שריון',
      'ayin.stage.eyes': "צ'ק-אין",
      'ayin.stage.answer': 'שוהה',
      'ayin.stage.done': "צ'ק-אאוט",
    },
    modules: { courses: false },
  },
];

/**
 * החלת חבילת-ורטיקל על קונפיג קיים. מחליף terms+modules בערכי החבילה; שומר את
 * כל שאר השדות (firebase/adminEmails/theme/accent/features/slug/orgName).
 * packId לא-מוכר → מחזיר את הקונפיג כמות שהוא (no-op בטוח).
 */
export function applyVerticalPack(config: OrgConfig, packId: string): OrgConfig {
  const pack = VERTICAL_PACKS.find((p) => p.id === packId);
  if (!pack) return config;
  return { ...config, terms: { ...pack.terms }, modules: { ...pack.modules } };
}
