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
  /** אימוג'י-הכפתור באשף (תמיד קיים). */
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
  /**
   * זהות-חזותית פר-ורטיקל (16.8, הכרעת-בעלים "שיחליף סגנון האתר בשינוי וורטיקל").
   * החלת החבילה מלבישה גם עיצוב — כשהשדה מוגדר. חסר ⇒ נשמר מה שהיה (חבילות
   * עמותתיות בלי icon/accent/motion = מראה קלאסי, ביט-זהה ללקוח-החי).
   */
  theme?: string; // ערכת-נושא (or-rishon/heichal/tsohar/kehila) — משנה גם שלד-הניווט
  accent?: string; // צבע-הדגשה (hex) — נדרס רק כשאין accentCustom
  icon?: string; // אימוג'י-הארגון (config.emoji) — כותרת + favicon; חסר ⇒ אות-ראשונה
  motion?: string; // סגנון-תנועה (MOTION_KEYS) — data-motion
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
    theme: 'or-rishon', // מראה קלאסי (זהב); בלי icon/accent/motion — ביט-זהה ללקוח-החי
  },
  {
    id: 'clinic',
    emoji: '💇',
    label: 'קליניקה',
    sub: 'לייזר · קוסמטיקה · רפואה',
    theme: 'kehila',
    accent: '#e05a8f',
    icon: '💇',
    motion: 'calm',
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
    theme: 'heichal',
    accent: '#0e9f6e',
    icon: '🛍️',
    motion: 'snappy',
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
    theme: 'tsohar',
    accent: '#7c5cff',
    icon: '💼',
    motion: 'snappy',
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
    theme: 'kehila',
    accent: '#0d9488',
    icon: '🏠',
    motion: 'calm',
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
    theme: 'tsohar',
    accent: '#e23b3b',
    icon: '🚗',
    motion: 'snappy',
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
    theme: 'tsohar',
    accent: '#5b6b7c',
    icon: '🔧',
    motion: 'bold',
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
    theme: 'heichal',
    accent: '#c2761a',
    icon: '🏨',
    motion: 'calm',
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
    theme: 'or-rishon', // עמותתי — מראה קלאסי, בלי icon/accent/motion
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
    theme: 'or-rishon', // עמותתי — מראה קלאסי, בלי icon/accent/motion
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
  {
    // ורטיקל מסחרי — סטודיו דיגיטל (אפליקציות/אתרים). הלקוחות = מדריך-לקוחות,
    // "העין" = משפך-הפרויקטים (בריף→הצעה→פיתוח→בדיקה→השקה), התומכים = לידים.
    id: 'digital',
    emoji: '💻',
    label: 'סטודיו דיגיטל',
    sub: 'אפליקציות · אתרים · פיתוח',
    theme: 'heichal',
    accent: '#5b6cff',
    icon: '💻',
    motion: 'snappy',
    terms: {
      'nav.families': 'לקוחות',
      'entity.family': 'לקוח',
      'entity.familyOf': 'לקוח',
      'entity.member': 'איש קשר',
      'entity.members': 'אנשי קשר',
      'nav.calendar': 'פגישות',
      'nav.supporters': 'לידים',
      'entity.supporter': 'ליד',
      'entity.donation': 'תשלום',
      'entity.donations': 'תשלומים',
      'nav.ayin': 'פרויקטים',
      'entity.ayinItem': 'פרויקט',
      'ayin.stage.new': 'בריף',
      'ayin.stage.lead': 'הצעת מחיר',
      'ayin.stage.eyes': 'בפיתוח',
      'ayin.stage.answer': 'בבדיקה',
      'ayin.stage.done': 'הושק',
    },
    modules: { courses: false, diary: false, tzedaka: false, shop: false },
    features: COMMERCIAL_OFF,
  },
  {
    // ורטיקל מסחרי — בנייה/קבלנות. יומן-החדרים = אתרי-הבנייה, התומכים =
    // ספקים/קבלני-משנה, "העין" = משפך-הפרויקטים (פנייה→הצעה→ביצוע→מסירה→הושלם).
    id: 'build',
    emoji: '🏗️',
    label: 'בנייה / קבלנות',
    sub: 'אתרים · קבלני-משנה · שלבי-ביצוע',
    theme: 'tsohar',
    accent: '#e8912a',
    icon: '🏗️',
    motion: 'bold',
    terms: {
      'nav.families': 'לקוחות',
      'entity.family': 'לקוח',
      'entity.familyOf': 'לקוח',
      'entity.member': 'איש קשר',
      'entity.members': 'אנשי קשר',
      'nav.calendar': 'לוח עבודות',
      'nav.diary': 'אתרי בנייה',
      'entity.room': 'אתר',
      'entity.rooms': 'אתרים',
      'nav.supporters': 'ספקים וקבלנים',
      'entity.supporter': 'ספק/קבלן',
      'entity.donation': 'תשלום',
      'entity.donations': 'תשלומים',
      'nav.ayin': 'פרויקטים',
      'entity.ayinItem': 'פרויקט',
      'ayin.stage.new': 'פנייה',
      'ayin.stage.lead': 'הצעת מחיר',
      'ayin.stage.eyes': 'בביצוע',
      'ayin.stage.answer': 'מסירה',
      'ayin.stage.done': 'הושלם',
    },
    modules: { courses: false, tzedaka: false, shop: false },
    features: COMMERCIAL_OFF,
  },
  {
    // ורטיקל מסחרי משולב — סטודיו דיגיטל + בנייה (סוכנות שעושה את שניהם). לקוחות
    // אחד, פרויקטים חוצי-תחום ("העין"), יומן = אתרים+צוותים, תומכים = ספקים+לידים.
    id: 'studio',
    emoji: '🏢',
    label: 'סטודיו דיגיטל + בנייה',
    sub: 'פרויקטים · לקוחות · ספקים — משולב',
    theme: 'kehila',
    accent: '#0ea5e9',
    icon: '🏢',
    motion: 'calm',
    terms: {
      'nav.families': 'לקוחות',
      'entity.family': 'לקוח',
      'entity.familyOf': 'לקוח',
      'entity.member': 'איש קשר',
      'entity.members': 'אנשי קשר',
      'nav.calendar': 'פגישות',
      'nav.diary': 'אתרים וצוותים',
      'entity.room': 'אתר/צוות',
      'entity.rooms': 'אתרים וצוותים',
      'nav.supporters': 'ספקים ולידים',
      'entity.supporter': 'ספק/ליד',
      'entity.donation': 'תשלום',
      'entity.donations': 'תשלומים',
      'nav.ayin': 'פרויקטים',
      'entity.ayinItem': 'פרויקט',
      'ayin.stage.new': 'בריף',
      'ayin.stage.lead': 'הצעת מחיר',
      'ayin.stage.eyes': 'בביצוע',
      'ayin.stage.answer': 'מסירה',
      'ayin.stage.done': 'הושלם',
    },
    modules: { courses: false, tzedaka: false, shop: false },
    features: COMMERCIAL_OFF,
  },
];

/**
 * החלת חבילת-ורטיקל על קונפיג קיים. מחליף terms+modules+features בערכי החבילה,
 * ומלביש **זהות-חזותית** פר-ורטיקל (ערכת-נושא + צבע + אימוג'י-אייקון + תנועה) —
 * הכרעת-בעלים 16.8 "שיחליף סגנון האתר בשינוי וורטיקל". שומר את שאר השדות
 * (firebase/adminEmails/slug/orgName/logo/telephony/roles…).
 *
 * צבע-ההדגשה: נשמר כשהמשתמש בחר ידני (accentCustom) — "הכל מוחלף חוץ מצבע ידני";
 * אחרת נדרס בצבע-החבילה (או מוסר לצבע-הערכה אם החבילה לא מגדירה accent).
 * חבילות עמותתיות (חסד/גמ"ח/התרמה) בלי icon/accent/motion ⇒ מראה קלאסי (or-rishon,
 * אות-ראשונה) — ביט-זהה ללקוח-החי.  packId לא-מוכר → no-op בטוח (הקונפיג כמות-שהוא).
 */
export function applyVerticalPack(config: OrgConfig, packId: string): OrgConfig {
  const pack = VERTICAL_PACKS.find((p) => p.id === packId);
  if (!pack) return config;
  // terms/modules/features מוחלפים בערכי-החבילה (נקודת-פתיחה); שאר הקונפיג נשמר.
  // features חסר בחבילה = {} = הכול דלוק (ברירת-המחדל של מאור, לוורטיקלים העמותתיים).
  const next: OrgConfig = { ...config, terms: { ...pack.terms }, modules: { ...pack.modules }, features: { ...pack.features } };
  // ערכת-נושא: מוחלפת רק כשהחבילה מגדירה (עמותתיות בלי theme ⇒ שמירת הערכה).
  if (pack.theme) next.theme = pack.theme;
  // אימוג'י-אייקון: מוגדר בחבילה ⇒ נכתב; חסר ⇒ מוסר (נפילה לאות-ראשונה, כמו הלקוח-החי).
  if (pack.icon) next.emoji = pack.icon;
  else delete next.emoji;
  // תנועה: כנ"ל — מוגדר ⇒ נכתב; חסר ⇒ מוסר (ברירת-המחדל).
  if (pack.motion) next.motion = pack.motion;
  else delete next.motion;
  // צבע-הדגשה: צבע-ידני (accentCustom) שורד בכל מקרה; אחרת ⇐ צבע-החבילה, ואם אין —
  // מוסר (צבע-הערכה). את הדגל accentCustom משמרים רק כשהצבע-הידני שרד.
  if (config.accentCustom) {
    next.accent = config.accent;
    next.accentCustom = true;
  } else if (pack.accent) {
    next.accent = pack.accent;
    delete next.accentCustom;
  } else {
    delete next.accent;
    delete next.accentCustom;
  }
  return next;
}
