/**
 * 🧰 ארגז-המנועים — החלקים (BUILD-ORDER-ENGINEBOX-2026-10-13): המנועים שבארגז, והמוצרים שבנויים מהם.
 *
 * חלק = מנוע אחד שהלקוח יכול לבחור: שם · מאיזה כלי בא · מה הוא עושה · המודול (ותת-הדגל) שחייבים להיות דלוקים ·
 *   `gives` — הצדדים הזכריים (מה הוא נותן לחלקים אחרים, בסוג-מחבר מהתקן),
 *   `needs` — הצדדים הנקביים (מה הוא מקבל, ו**מה קורה** כשמחברים — `result`).
 *
 * חוק-הכנות ("מה שהמסך מבטיח זה מה שקורה"):
 *   · Give חי (`live: true`) חייב `via` — יכולת-מרכזייה רשומה של אותו מודול שבאמת מספקת אותו.
 *   · Need חי חייב `at` — קובץ תחת src/ ומחרוזת שמופיעה בו בנקודת-הצריכה האמיתית (הגנת-מקור בבדיקות).
 *   · `result` יושב בצד המקבל ומתאר בדיוק את מה שהקוד עושה היום. מה שעוד לא בנוי — `live: false` ("בקרוב") בלבד.
 *
 * מוצר = צרור-חלקים בשם (אירוח משפחתי · פרנסה׳לע). התחלה ממנוע בודד = התחלה מחלק אחד.
 * טהור: נתונים בלבד (ייבוא-טיפוסים בלבד מהמרכזייה — שום קוד-ריצה שלה לא נגרר לכאן).
 * בידוד: אין כאן כסף, קבלות, לוח-ראשי או חדרי-חוגים.
 */
import type { ModuleKey } from '../../types/config';
import type { AbilityId } from '../switchboard/registry';
import type { PlugType } from './plugs';

/** צד זכרי: מה החלק נותן. */
export interface Give {
  readonly plug: PlugType;
  /** מה בדיוק יוצא (עברית). */
  readonly label: string;
  /** היכולת במרכזייה שמספקת את זה באמת — חובה כש-live. */
  readonly via?: AbilityId;
  readonly live: boolean;
}

/** נקודת-הצריכה בקוד: נתיב מ-src/ ומחרוזת מילולית שמופיעה בקובץ במקום שבו הנתון נצרך. */
export interface CodeSite {
  readonly file: string;
  readonly marker: string;
}

/** צד נקבי: מה החלק מקבל, ומה קורה כשמחברים. */
export interface Need {
  readonly plug: PlugType;
  /** מה החלק מקבל (עברית). */
  readonly label: string;
  /** התוצאה כשמחברים — בדיוק מה שהקוד עושה (עברית). */
  readonly result: string;
  /** איפה בקוד זה נצרך — חובה כש-live. */
  readonly at?: CodeSite;
  readonly live: boolean;
}

/** מנוע בארגז. */
export interface Part {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  /** הכלי שממנו בא (עברית). */
  readonly from: 'פרנסה׳לע' | 'אירוח משפחתי' | 'אורביט';
  /** שורה אחת: מה הוא עושה. */
  readonly what: string;
  /** המודול שחייב להיות דלוק. */
  readonly module: ModuleKey;
  /** תת-דגל (featureOn) — חסר ⇒ די במודול (ובדגל-הכלי עצמו). */
  readonly flag?: string;
  readonly gives: readonly Give[];
  readonly needs: readonly Need[];
}

/** מוצר: צרור-חלקים בשם. */
export interface Product {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly module: ModuleKey;
  readonly parts: readonly string[];
}

const SW = 'src/components/hosting/SwitchPanels.tsx';

/* ═══════════════ החלקים (הסדר = סדר-התצוגה והסדר הדטרמיניסטי) ═══════════════ */

export const PARTS: readonly Part[] = [
  /* ───────── 📒 פרנסה׳לע ───────── */
  {
    id: 'pr.zmanim',
    name: 'זמני היום והשבת',
    emoji: '🕯️',
    from: 'פרנסה׳לע',
    what: 'זריחה, שקיעה, הדלקת נרות וצאת השבת לפי מיקום הקהילה',
    module: 'parnasa',
    flag: 'parnasa.zmanim',
    gives: [
      { plug: 'times.shabbat', label: 'זמני השבת (הדלקת נרות · צאת השבת · ר״ת) ותאריך השבת העברי', via: 'parnasa.shabbat', live: true },
      { plug: 'day.summary', label: 'שורת השבת בתקציר היום (הדלקת נרות · צאת השבת)', via: 'parnasa.shabbat', live: true },
      { plug: 'times.blocked', label: 'האם עכשיו שבת או יום טוב', live: false },
      { plug: 'date.hebrew', label: 'תאריך עברי וחג של כל יום', live: false },
    ],
    needs: [],
  },
  {
    id: 'pr.board',
    name: 'לוח קהילה',
    emoji: '📌',
    from: 'פרנסה׳לע',
    what: 'מניינים, שיעורים, הודעות ומספרי חירום של השכונה',
    module: 'parnasa',
    flag: 'parnasa.board',
    gives: [
      { plug: 'times.prayers', label: 'המניינים לפי בית כנסת, כתובת, יום ושעה', via: 'parnasa.minyanim', live: true },
      { plug: 'emergency', label: 'מספרי החירום של הלוח', via: 'parnasa.emergency', live: true },
      { plug: 'day.summary', label: 'שורת "המניין הבא" בתקציר היום', via: 'parnasa.minyanim', live: true },
    ],
    needs: [],
  },
  {
    id: 'pr.directory',
    name: 'מדריך העסקים',
    emoji: '📇',
    from: 'פרנסה׳לע',
    what: 'בעלי מקצוע ועסקים בשכונה — חיפוש במילים של הפונה',
    module: 'parnasa',
    flag: 'parnasa.directory',
    gives: [{ plug: 'pro.match', label: 'עד 3 בעלי מקצוע מתאימים לצורך, פתוחים עכשיו קודם, עם טלפון', via: 'parnasa.findPro', live: true }],
    needs: [],
  },
  {
    id: 'pr.phone',
    name: 'הקו (טלפון כשר)',
    emoji: '📞',
    from: 'פרנסה׳לע',
    what: 'מה קו הטלפון אומר למתקשר: תפריט, קוד חיוג מהחוברת, סגור בשבת',
    module: 'parnasa',
    flag: 'parnasa.phone',
    gives: [{ plug: 'voice.menu', label: 'שלוחה בתפריט הקו לכלי אחר', live: false }],
    needs: [
      {
        plug: 'availability',
        label: 'יחידות אירוח פנויות',
        result: 'בתפריט הקו נוספת שלוחה 5 "בדיקת יחידת אירוח פנויה": המתקשר בוחר הלילה, מחר בלילה או ליל השבת הקרובה ושומע אילו יחידות פנויות — הקראה בלבד, בלי מחירים ובלי שמות אורחים',
        at: { file: 'src/components/parnasa/phoneLine.ts', marker: "sw.ask('hosting.availability', sw.ctx, { fromIso: today, nights: 1 })" },
        live: true,
      },
      { plug: 'booking', label: 'בקשת הזמנה מהקו', result: 'מתקשר יוכל לבקש בקו לילה ביחידה פנויה, והבקשה תחכה לאישור המארח', live: false },
    ],
  },
  {
    id: 'pr.care',
    name: 'ניהול ואישורים',
    emoji: '🏠',
    from: 'פרנסה׳לע',
    what: 'מה ממתין לאישור הגבאי ומה דורש טיפול',
    module: 'parnasa',
    flag: 'parnasa.care',
    gives: [],
    needs: [
      {
        plug: 'day.summary',
        label: 'שורות היום של הכלי השני',
        result: 'בלשונית האישורים מופיע כרטיס "☀ תקציר היום" עם שורות היום של הכלי השני (הגעות, עזיבות, ניקיון וקריאות תחזוקה באירוח) לצד הזמנים והמניין הבא — עם העתקה ושיתוף כשהייצוא דלוק',
        at: { file: 'src/components/parnasa/TodayCard.tsx', marker: 'const lines = todaySummary(ctx);' },
        live: true,
      },
    ],
  },
  {
    id: 'pr.booklet',
    name: 'חוברת להדפסה',
    emoji: '📖',
    from: 'פרנסה׳לע',
    what: 'חוברת A5 עם אינדקס לפי תחום, קודי חיוג ודף חירום',
    module: 'parnasa',
    flag: 'parnasa.booklet',
    gives: [{ plug: 'print.page', label: 'עמוד בחוברת לכלי אחר', live: false }],
    needs: [],
  },
  {
    id: 'pr.ads',
    name: 'פרסומות וחסות',
    emoji: '📣',
    from: 'פרנסה׳לע',
    what: 'משבצות פרסום וחסות בחוברת ובלוח',
    module: 'parnasa',
    flag: 'parnasa.ads',
    gives: [{ plug: 'payment.link', label: 'קישור לעמוד הסליקה של הארגון', live: false }],
    needs: [],
  },

  /* ───────── 🏡 אירוח משפחתי ───────── */
  {
    id: 'host.units',
    name: 'יחידות ותפוסה',
    emoji: '🛏️',
    from: 'אירוח משפחתי',
    what: 'היחידות, החדרים וההזמנות — מי פנוי ומתי',
    module: 'hosting',
    gives: [
      { plug: 'availability', label: 'היחידות הפנויות בלילה מסוים (שם · סוג · קיבולת · חדרים ומיטות פנויים)', via: 'hosting.availability', live: true },
      { plug: 'booking', label: 'בקשת הזמנה שנכנסת לאישור', live: false },
    ],
    needs: [{ plug: 'person', label: 'משפחה שכבר רשומה במערכת', result: 'בהזמנה חדשה יהיה אפשר לבחור משפחה רשומה כאורח בלי להקליד שוב', live: false }],
  },
  {
    id: 'host.stay',
    name: 'כרטיס השהייה',
    emoji: '🧳',
    from: 'אירוח משפחתי',
    what: 'כרטיס ההזמנה של אורח — מתי מגיע, איפה ישן, מה צריך',
    module: 'hosting',
    flag: 'hosting.shabbat',
    gives: [{ plug: 'message.text', label: 'ההודעה המוכנה למשפחה', live: false }],
    needs: [
      {
        plug: 'times.shabbat',
        label: 'זמני השבת של השהייה',
        result: 'הזמנה שלנה בליל שבת מציגה בכרטיס ההזמנה "🕯️ שבת בשהייה": התאריך העברי, הדלקת נרות, צאת השבת ור״ת של אותה שבת',
        at: { file: SW, marker: 'data-switch="stay-shabbat"' },
        live: true,
      },
      {
        plug: 'times.prayers',
        label: 'המניינים של אותה שבת',
        result: 'המניינים לשישי-שבת לפי בית כנסת וכתובת מופיעים בכרטיס, ונכנסים להודעת "📤 שליחה למשפחה" בוואטסאפ (כשהרחבת הוואטסאפ דלוקה ולאורח יש טלפון)',
        at: { file: SW, marker: 'minyanim: minyanimOf(ctx, sh.value.friIso)' },
        live: true,
      },
      { plug: 'payment.link', label: 'קישור תשלום', result: 'הודעה למשפחה תוכל לכלול קישור לעמוד הסליקה של הארגון', live: false },
    ],
  },
  {
    id: 'host.shabbat',
    name: 'לשונית שבת',
    emoji: '🕯️',
    from: 'אירוח משפחתי',
    what: 'מצב שבת, זמנים, כשרות וחבילות שבת להזמנות',
    module: 'hosting',
    flag: 'hosting.shabbat',
    gives: [],
    needs: [
      {
        plug: 'times.shabbat',
        label: 'זמני השבת הקרובה',
        result: 'בלשונית השבת מופיע פאנל "🕯️ זמני השבת מלוח הקהילה" עם השבת הקרובה (או הנוכחית): תאריך עברי, הדלקת נרות, צאת השבת ור״ת. השדות הידניים נשארים כמו שהם',
        at: { file: SW, marker: "ask('parnasa.shabbat', props.ctx, {})" },
        live: true,
      },
      {
        plug: 'times.prayers',
        label: 'המניינים לשישי-שבת',
        result: 'המניינים לשישי-שבת מופיעים בפאנל, ובטבלת ההזמנות שבלשונית, בשורת כל הזמנה שלנה בליל שבת, נוסף כפתור "📤 שליחה למשפחה" (כשהרחבת הוואטסאפ דלוקה ולאורח יש טלפון)',
        at: { file: SW, marker: '<MinyanRows list={minyanimOf(props.ctx, sh.value.friIso)} />' },
        live: true,
      },
    ],
  },
  {
    id: 'host.maint',
    name: 'תחזוקה',
    emoji: '🔧',
    from: 'אירוח משפחתי',
    what: 'קריאות תקלה לפי דחיפות, ציוד ותחזוקה מונעת',
    module: 'hosting',
    flag: 'hosting.maint',
    gives: [],
    needs: [
      {
        plug: 'pro.match',
        label: 'בעל מקצוע לתקלה',
        result: 'בקריאת תחזוקה פתוחה מופיע כפתור "🔧 מצא בעל מקצוע": עד 3 בעלי מקצוע מהמדריך לפי תיאור התקלה, פתוחים עכשיו קודם, עם טלפון (וחיוג או וואטסאפ כשההרחבות דלוקות). קריאה בלבד — לא נשמר דבר',
        at: { file: 'src/components/hosting/MaintTab.tsx', marker: 'text: faultNeed(r)' },
        live: true,
      },
      {
        plug: 'emergency',
        label: 'מספרי חירום לתקלה דחופה',
        result: 'בקריאה דחופה (P0/P1 או סיכון בטיחות) מופיעה בראש חלון בעל המקצוע שורת "🚨 סכנה? מספרי חירום" מלוח הקהילה',
        at: { file: SW, marker: "props.urgent ? ask('parnasa.emergency', ctx, {})" },
        live: true,
      },
    ],
  },
  {
    id: 'host.clean',
    name: 'ניקיון ומשק בית',
    emoji: '🧹',
    from: 'אירוח משפחתי',
    what: 'משימות ניקיון אחרי עזיבה — סיום מחזיר את היחידה לזמינות',
    module: 'hosting',
    flag: 'hosting.housekeeping',
    gives: [],
    needs: [
      {
        plug: 'pro.match',
        label: 'מנקה או בעל מקצוע לניקיון',
        result: 'במשימת ניקיון מופיע כפתור "🔧 מצא בעל מקצוע": עד 3 נותני שירותי ניקיון מהמדריך, פתוחים עכשיו קודם, עם טלפון. קריאה בלבד — לא נשמר דבר',
        at: { file: 'src/components/hosting/CleanTab.tsx', marker: 'text: cleanNeed(tk)' },
        live: true,
      },
    ],
  },
  {
    id: 'host.dash',
    name: 'לוח הבקרה',
    emoji: '📊',
    from: 'אירוח משפחתי',
    what: 'מבט אחד על היום: הגעות, עזיבות, ניקיון ותקלות',
    module: 'hosting',
    gives: [{ plug: 'day.summary', label: 'שורות האירוח בתקציר היום (הגעות · עזיבות · ניקיון · קריאות · מה טופל)', via: 'hosting.today', live: true }],
    needs: [
      {
        plug: 'day.summary',
        label: 'שורות היום של הכלי השני',
        result: 'בלוח הבקרה מופיע כרטיס "☀ תקציר היום" עם שורות היום של הכלי השני (הדלקת נרות וצאת השבת, המניין הבא) לצד שורות האירוח — עם העתקה ושיתוף כשהייצוא דלוק',
        at: { file: SW, marker: 'const lines = todaySummary(ctx);' },
        live: true,
      },
    ],
  },

  /* ───────── 🪐 אורביט (מנועים קיימים בלי נקודת-צריכה בכלים — "בקרוב" בלבד) ───────── */
  {
    id: 'orbit.families',
    name: 'משפחות',
    emoji: '👪',
    from: 'אורביט',
    what: 'כרטיסי המשפחות של הארגון',
    module: 'families',
    gives: [{ plug: 'person', label: 'שם וטלפון של משפחה רשומה', live: false }],
    needs: [],
  },
];

/* ═══════════════ המוצרים ═══════════════ */

export const PRODUCTS: readonly Product[] = [
  { id: 'hosting', name: 'אירוח משפחתי', emoji: '🏡', module: 'hosting', parts: ['host.units', 'host.stay', 'host.shabbat', 'host.maint', 'host.clean', 'host.dash'] },
  { id: 'parnasa', name: 'פרנסה׳לע', emoji: '📒', module: 'parnasa', parts: ['pr.zmanim', 'pr.board', 'pr.directory', 'pr.phone', 'pr.care', 'pr.booklet', 'pr.ads'] },
];

const PART_BY_ID = new Map<string, Part>(PARTS.map((p) => [p.id, p]));
const PRODUCT_BY_ID = new Map<string, Product>(PRODUCTS.map((p) => [p.id, p]));
const PART_INDEX = new Map<string, number>(PARTS.map((p, i) => [p.id, i]));

/** חלק לפי מזהה — undefined לזר. */
export function partById(id: unknown): Part | undefined {
  return typeof id === 'string' ? PART_BY_ID.get(id) : undefined;
}

/** מוצר לפי מזהה — undefined לזר. */
export function productById(id: unknown): Product | undefined {
  return typeof id === 'string' ? PRODUCT_BY_ID.get(id) : undefined;
}

/** מיקום החלק ברשימה (לסדר דטרמיניסטי); זר ⇒ סוף. */
export function partOrder(id: string): number {
  return PART_INDEX.get(id) ?? PARTS.length;
}
