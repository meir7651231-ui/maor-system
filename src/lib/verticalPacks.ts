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
  /**
   * פריסֶט-פיצ'רים לענף (feature-key → on/off). חסר/undefined = הכול דלוק
   * (ברירת-המחדל של מאור). כמו terms/modules — נקודת-פתיחה שמכוונים אחריה ידנית.
   */
  features?: Record<string, boolean>;
}

/**
 * פיצ'רים ייחודיים-לעמותה שאין להם מקום בעסק מסחרי — מכובים בכל ורטיקל מסחרי,
 * כדי שהאשף בלחיצה אחת ייתן מערכת תפורה ולא "עמותה עם שמות אחרים": קבלת §46
 * (מסחרי משתמש בקבלה רגילה), מדד-אמינות, ספר-הזהב, קיר-ההשפעה, הקהילה, מצב-צנעה
 * (הסתרת מקבלי-צדקה), והתרומות-ההיסטוריות הלגאסי. הליבה (core.receipts) נשארת.
 */
export const COMMERCIAL_OFF: Record<string, boolean> = {
  'core.taxreceipt': false,
  'families.cred': false,
  'home.goldbook': false,
  'home.impactwall': false,
  'home.community': false,
  'home.credmetrics': false,
  'shell.privacy': false,
  'supporters.hist': false,
};

export const VERTICAL_PACKS: VerticalPack[] = [
  {
    id: 'chesed',
    emoji: '🕊️',
    label: 'עמותת חסד',
    sub: 'גמ"ח · קופת צדקה',
    terms: {}, // ברירות המחדל של מאור
    // הכל דלוק — כולל tzedaka+shop **במכוון** (חסר=דלוק; אשף 1, מטריצה מפורשת):
    // עמותת חסד היא הלקוח החי — שתי העמודות החדשות שלה.
    modules: {},
  },
  {
    id: 'clinic',
    emoji: '💇',
    label: 'קליניקה',
    sub: 'לייזר · קוסמטיקה · רפואה',
    terms: {
      'nav.families': 'מטופלים',
      'entity.family': 'מטופל',
      'entity.familyOf': 'מטופל',
      'entity.member': 'איש קשר',
      'entity.members': 'אנשי קשר',
      'entity.enrollments': 'טיפולים',
      'entity.student': 'מטופל/ת',
      'entity.students': 'מטופלים',
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
    modules: { tzedaka: false, shop: false },
    features: COMMERCIAL_OFF,
  },
  {
    // ⚠️ התנגשות שמות מכוונת שנשארת: pack id 'shop' (ורטיקל קמעונאות, ותיק)
    // ≠ מודול 'shop' (עמודת מוצרי-השירות). לא משנים את ה-id — configs קיימים
    // בשטח מצביעים עליו. ההבחנה: ה-id חי רק ב-VERTICAL_PACKS/אשף; המודול חי
    // ב-modules/moduleOn.
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
      'entity.donations': 'רכישות',
      'entity.familyOf': 'לקוח',
      'entity.members': 'אנשי קשר',
      'entity.cred': 'נקודות נאמנות',
      // מודול החנות דלוק (חסר=דלוק, במכוון) — במונחים קמעונאיים (אשף 1)
      'nav.shop': 'מוצרים',
      'entity.shopProduct': 'מוצר',
      'entity.shopAssignment': 'הזמנה',
      'entity.shopCriterion': 'מועדון',
    },
    modules: { courses: false, diary: false, tzedaka: false },
    features: COMMERCIAL_OFF,
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
      'entity.familyOf': 'לקוח',
      'entity.member': 'איש קשר',
      'entity.members': 'אנשי קשר',
      'nav.supporters': 'לידים',
      'nav.ayin': 'משפך מכירות',
      'entity.ayinItem': 'ליד',
      'ayin.stage.new': 'פנייה',
      'ayin.stage.lead': 'הצעה',
      'ayin.stage.eyes': 'מו״מ',
      'ayin.stage.answer': 'נסגר',
      'ayin.stage.done': 'סופק',
    },
    modules: { courses: false, tzedaka: false, shop: false },
    features: COMMERCIAL_OFF,
  },
  {
    id: 'rooms',
    emoji: '🏠',
    label: 'השכרת חללים',
    sub: 'חדרי ישיבות · סטודיו · אולמות',
    terms: {
      'nav.diary': 'לוח חללים',
      'entity.room': 'חלל',
      'entity.rooms': 'חללים',
      'entity.familyOf': 'שוכר',
      'entity.donations': 'תשלומים',
      'nav.families': 'שוכרים',
      'entity.family': 'שוכר',
      'entity.member': 'איש קשר',
      'entity.members': 'אנשי קשר',
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
    modules: { courses: false, tzedaka: false, shop: false },
    features: COMMERCIAL_OFF,
  },
  {
    id: 'fleet',
    emoji: '🚗',
    label: 'צי רכב / השכרה',
    sub: 'רכבים · ציוד · כלים',
    terms: {
      'nav.diary': 'לוח רכבים',
      'entity.room': 'רכב',
      'entity.rooms': 'רכבים',
      'entity.familyOf': 'לקוח',
      'entity.donations': 'תשלומי שכירות',
      'nav.families': 'לקוחות',
      'entity.family': 'לקוח',
      'entity.member': 'נהג',
      'entity.members': 'נהגים',
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
    modules: { courses: false, tzedaka: false, shop: false },
    features: COMMERCIAL_OFF,
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
      'entity.members': 'רכבים/פריטים',
      'nav.diary': 'עמדות עבודה',
      'entity.room': 'עמדה',
      'entity.rooms': 'עמדות',
      'entity.familyOf': 'לקוח',
      'entity.donations': 'תשלומים',
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
    modules: { courses: false, tzedaka: false, shop: false },
    features: COMMERCIAL_OFF,
  },
  {
    id: 'hospitality',
    emoji: '🏨',
    label: 'אירוח / צימרים',
    sub: 'מלונית · צימר · אכסניה',
    terms: {
      'nav.diary': 'לוח יחידות',
      'entity.room': 'יחידת אירוח',
      'entity.rooms': 'יחידות אירוח',
      'entity.familyOf': 'אורח',
      'entity.donations': 'תשלומי שהייה',
      'nav.families': 'אורחים',
      'entity.family': 'אורח',
      'entity.member': 'מלווה',
      'entity.members': 'מלווים',
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
    modules: { courses: false, tzedaka: false, shop: false },
    features: COMMERCIAL_OFF,
  },
  {
    // ורטיקל חדש (אשף 2) — גמ"ח השאלת ציוד: מנוע החנות משמש כקטלוג-השאלות
    // (חבילת השאלה/פריט/השאלה). עמדה מפורשת לכל 8 המודולים — המטריצה המלאה.
    id: 'gemach',
    emoji: '🧰',
    label: 'גמ"ח (השאלת ציוד)',
    sub: 'קטלוג · השאלות · תורמים',
    terms: {
      'nav.shop': 'גמ"ח',
      'entity.shopProduct': 'חבילת השאלה',
      'entity.shopItem': 'פריט',
      'entity.shopAssignment': 'השאלה',
      'nav.families': 'משפחות',
      'nav.supporters': 'תורמים',
    },
    modules: {
      families: true,
      courses: false,
      calendar: true,
      diary: false,
      supporters: true,
      reports: true,
      tzedaka: false,
      shop: true,
    },
  },
  {
    // ורטיקל חדש (אשף 2) — ארגון מבצעי התרמה: מנוע הקופות הוא הליבה.
    // עמדה מפורשת לכל 8 המודולים — המטריצה המלאה.
    id: 'tzedakot',
    emoji: '🪙',
    label: 'ארגון מבצעי התרמה',
    sub: 'רכזים · קופות · מבצעים',
    terms: {
      'nav.tzedaka': 'מבצעים',
      'entity.tzCoordinator': 'רכז',
      'entity.tzBox': 'קופה',
      'entity.tzCampaign': 'מבצע',
    },
    modules: {
      families: true,
      courses: false,
      calendar: true,
      diary: false,
      supporters: true,
      reports: true,
      tzedaka: true,
      shop: false,
    },
  },
];

/**
 * החלת חבילת-ורטיקל על קונפיג קיים. מחליף terms+modules+features בערכי החבילה;
 * שומר את כל שאר השדות (firebase/adminEmails/theme/accent/slug/orgName).
 * packId לא-מוכר → מחזיר את הקונפיג כמות שהוא (no-op בטוח).
 */
export function applyVerticalPack(config: OrgConfig, packId: string): OrgConfig {
  const pack = VERTICAL_PACKS.find((p) => p.id === packId);
  if (!pack) return config;
  // terms/modules/features מוחלפים בערכי-החבילה (נקודת-פתיחה); שאר הקונפיג נשמר.
  // features חסר בחבילה = {} = הכול דלוק (ברירת-המחדל של מאור, לוורטיקלים העמותתיים).
  return { ...config, terms: { ...pack.terms }, modules: { ...pack.modules }, features: { ...pack.features } };
}
