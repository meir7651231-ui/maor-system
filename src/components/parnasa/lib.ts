/**
 * 📒 פרנסה׳לע — המנוע הטהור (אשכול 3, BUILD-ORDER-PARNASA-2026-10-12): בלי store/DOM, בלי
 * Date.now — "עכשיו" מוזרק (todayIso / שעון / epoch), ולכן כל פלט דטרמיניסטי ונבדק-ביחידה.
 *
 *   · טקסונומיה — 15 שערי-המקצוע מהמקור (שם/שם-קצר/צבע/אייקון/מספר-שער).
 *   · "מה צריך?" — פורט נאמן של מנוע-ההתאמה הדטרמיניסטי של המקור: 25 מושגי-בעיה (מילון-נרדפות
 *     + גזעים), ניקוד-טוקנים עם תחיליות/גזע/שגיאת-כתיב (לוינשטיין ≤1 דרך lib/search), ודירוג
 *     כיסוי ⇒ שכבה ⇒ מודגש ⇒ פתוח-עכשיו ⇒ המלצות ⇒ רלוונטיות ⇒ שם. עיון-מסונן דרך smartFilter.
 *   · פתוח-עכשיו — שעון-הקהילה (Asia/Jerusalem) + סגירת שבת/יו״ט מלוח-המנוע (zmanimBoard).
 *   · מכונת-אישור — **עריכת-תוכן של עסק מאושר ע"י מי שאינו מאשר ⇒ חזרה ל"ממתין"** (תיקון מול
 *     המקור, שם האישור היה חד-פעמי); שדות-גבאי (הדגשה/קוד-חיוג/מקור) לא ניתנים לשינוי ע"י לא-מאשר.
 *   · ניתוב-בקשות — המקצוע קודם (3 שעות; שעה בדחוף) ואז הקהילה; **רשומות-גבאי אינן מקבלות-בקשות**
 *     (תיקון: במקור "תקעו" בקשה 3 שעות מול אף-אחד). בקשה שקטה לא עוברת לקהילה.
 *   · פרטיות בקשה-שקטה **נאכפת כאן**: תצוגת-העסקים (businessView) נבנית מרשימה-לבנה — בלי פרטי-
 *     המבקש, ועם השחרת טלפון/מייל שהוקלדו בגוף-הטקסט.
 *   · ממתינים-לאישור · דורש-טיפול · משבצות-פרסום פעילות (payLink בלבד) · קוד-חיוג הבא · CSV.
 *   (מכונת-האישור ומעברי-המצב שה-store מפעיל — ב-transitions.ts הקטן, מיוצאים-מחדש כאן; אשכול 4.)
 * בידוד (הכרעה 4): אפס נגיעה בקבלות/תרומות/מונים/לוח-ראשי.
 */
import type {
  Db,
  IsoDate,
  ParnasaPrefs,
  PrAd,
  PrAdSlot,
  PrListing,
  PrPost,
  PrPriceKey,
  PrRequest,
  PrRequester,
  PrRequestStatus,
} from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { PR_CATEGORY_KEYS, PR_PRICE_DEFAULTS, type PrCategoryKey } from './model';
import { levenshtein, smartFilter } from '../../lib/search';
import { termOf } from '../../lib/config';
import { payLink } from '../../lib/payLink';
import { gem } from '../../lib/hebrew';
import { addDaysIso, hmToMin, minToHm, PR_DAY_NAMES, type PrClock, type PrClosureFn } from './zmanimBoard';

/* ═══════════════ טקסונומיה — 15 שערי-המקצוע ═══════════════ */

export interface PrCategory {
  key: PrCategoryKey;
  /** השם המלא (CATS במקור). */
  name: string;
  /** השם הקצר (TRADE_S). */
  short: string;
  icon: string;
  color: string;
  /** מספר-השער בגימטריה (א׳ … ט״ו) — סדר-העיון והחוברת. */
  num: string;
}

const CATEGORY_SRC: ReadonlyArray<Omit<PrCategory, 'num'>> = [
  { key: 'build', name: 'בנייה ושיפוצים', short: 'שיפוצים ובנייה', icon: '🔨', color: '#9b6a35' },
  { key: 'elec', name: 'חשמל, אינסטלציה ומיזוג', short: 'חשמל ואינסטלציה', icon: '⚡', color: '#2c68ad' },
  { key: 'car', name: 'רכב, הובלות והסעות', short: 'רכב והובלות', icon: '🚚', color: '#b85a26' },
  { key: 'fin', name: 'הנהלת חשבונות, משפט וביטוח', short: 'חשבונות ומשפט', icon: '🧮', color: '#2f6b58' },
  { key: 'tech', name: 'מחשבים, טכנולוגיה ועיצוב', short: 'מחשבים ועיצוב', icon: '💻', color: '#4a57b0' },
  { key: 'edu', name: 'חינוך, מלמדים ושיעורים', short: 'מלמדים ושיעורים', icon: '📚', color: '#6a4ca6' },
  { key: 'stam', name: 'סת״ם, יודאיקה וספרים', short: 'סת״ם ויודאיקה', icon: '📜', color: '#3b6a50' },
  { key: 'events', name: 'שמחות, קייטרינג וצילום', short: 'שמחות וצילום', icon: '🎉', color: '#b0436f' },
  { key: 'health', name: 'רפואה, טיפולים וייעוץ', short: 'רפואה וטיפולים', icon: '🩺', color: '#23807a' },
  { key: 'fashion', name: 'אופנה, חייטות ופאות', short: 'אופנה ופאות', icon: '✂️', color: '#8a45a3' },
  { key: 'home', name: 'בית, ניקיון וגינון', short: 'בית וניקיון', icon: '🧹', color: '#4c8a3a' },
  { key: 'food', name: 'מזון, אפייה ומשלוחים', short: 'מזון ואפייה', icon: '🍽️', color: '#b3741f' },
  { key: 'realestate', name: 'נדל״ן ותיווך', short: 'נדל״ן ותיווך', icon: '🏠', color: '#5a6878' },
  { key: 'trade', name: 'מסחר וחנויות', short: 'מסחר וחנויות', icon: '🛍️', color: '#9a4e2c' },
  { key: 'other', name: 'כללי ואחר', short: 'כללי ואחר', icon: '🔹', color: '#6b5f70' },
];

/** 15 השערים בסדר-המקור (מספר-השער = המיקום). */
export const PR_CATEGORIES: readonly PrCategory[] = CATEGORY_SRC.map((c, i) => ({ ...c, num: gem(i + 1) }));

const CATEGORY_BY_KEY = new Map(PR_CATEGORIES.map((c) => [c.key as string, c]));

/** שער לפי מפתח — לא-מוכר/ריק ⇒ 'other' (כמו clean() במקור). */
export function categoryOf(key: string | undefined | null): PrCategory {
  return CATEGORY_BY_KEY.get(String(key ?? '')) ?? (CATEGORY_BY_KEY.get('other') as PrCategory);
}

/** מקום השער בסדר (לא-מוכר ⇒ אחרון). */
export function categoryIndex(key: string): number {
  const i = (PR_CATEGORY_KEYS as readonly string[]).indexOf(key);
  return i < 0 ? PR_CATEGORY_KEYS.length - 1 : i;
}

/** שפות-השירות (המקור). */
export const PR_LANG_NAMES: Readonly<Record<string, string>> = { he: 'עברית', yi: 'אידיש', en: 'אנגלית', fr: 'צרפתית', ru: 'רוסית' };
/** "מתאים ל". */
export const PR_AUD_NAMES: Readonly<Record<string, string>> = { all: 'לכולם', men: 'לגברים', women: 'לנשים' };
/**
 * תוויות-האמון של עסק — נוסח **אחד** לחוברת (booklet.ts) ולקו (phoneLine.ts), כדי שמה שמודפס ומה
 * שנאמר בקול לא יתפצלו. הסדר נשאר אצל כל קורא (החוברת: הנחה · גמ״ח · מתאים · חירום; הקו: מתאים ·
 * הנחה · גמ״ח · חירום).
 */
export const PR_MARK_LABELS = { disc: 'הנחה לקהילה', free: 'גמ״ח', emergency: 'זמינים לקריאות חירום' } as const;

/* ═══════════════ מעברי-המצב (transitions.ts — הקובץ הקטן שה-store מייבא) ═══════════════ */
// מכונת-האישור, שמירת בקשה/תשובה/סגירה/פרסומת וקודי-החיוג חיים ב-transitions.ts, כדי שה-store
// בבנדל-הראשי לא יגרור את המנוע הכבד (מילון/חיפוש/זמנים). כאן — ייצוא-מחדש, ה-API לא השתנה.
export {
  addResponse,
  adDraftError,
  approveListing,
  approvePost,
  closeRequest,
  dialCodeTaken,
  isPromotedJob,
  listingContentChanged,
  listingStatusOnSave,
  nextDialCode,
  normalizePostDraft,
  postApprovedOnSave,
  PR_DIAL_MAX,
  PR_DIAL_MIN,
  prCan,
  rejectListing,
  requireApprovalOf,
  saveAd,
  saveListing,
  savePost,
  saveRequest,
  setJobPromo,
  takeDownPost,
  validDialCode,
} from './transitions';
export type { PrActor, PrGrantKey } from './transitions';

/* ═══════════════ הגדרות-המודול ═══════════════ */

/** מחיר ממחירון-הגבאי (מספר סופי ≥0) או ברירת-המחדל. רישום/קישור-סליקה בלבד — אפס קבלות. */
export function priceOf(prefs: ParnasaPrefs | null | undefined, key: PrPriceKey): number {
  const v = prefs?.prices?.[key];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : PR_PRICE_DEFAULTS[key];
}

/* ═══════════════ "מה צריך?" — חיפוש והתאמה (פורט המקור, נספח A7) ═══════════════ */

/**
 * נרמול-חיפוש (fz של המקור): הסרת ניקוד/טעמים וגרשיים, סימני-פיסוק ⇒ רווח, אותיות-סופיות ⇒
 * רגילות, וו⇒ו, יי⇒י, רווחים מכווצים, אותיות קטנות. שיפור יחיד: מקף-עברי (־) = מפריד-מילים
 * (במקור נבלע בטווח-הניקוד וחיבר מילים).
 */
export function prNorm(s: unknown): string {
  return String(s ?? '')
    .replace(/\u05BE/g, ' ') // מקף עברי (־)
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[״׳"'`]/g, '')
    .replace(/[.,!?;:()\-/\\+*_=&]/g, ' ')
    .replace(/ך/g, 'כ')
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ץ/g, 'צ')
    .replace(/וו/g, 'ו')
    .replace(/יי/g, 'י')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** מושג-בעיה: תווית (צ'יפ), שער-יעד, נרדפות (מה שאנשים מקלידים) וגזעים (מה שמעיד שעסק עושה את זה). */
export interface PrConcept {
  k: string;
  l: string;
  c: PrCategoryKey;
  w: readonly string[];
  /** גזעים מנורמלים. */
  t: readonly string[];
}

/** מילון-המושגים — מועתק מהמקור כלשונו (נספח A7, CONCEPTS). */
const CONCEPT_SRC: ReadonlyArray<{ k: string; l: string; c: PrCategoryKey; w: string; t: string }> = [
  { k: 'plumb', l: 'אינסטלציה', c: 'elec', w: 'נזילה,נזילות,נוזל,דולף,דולפת,דליפה,מטפטף,טפטוף,רטיבות,סתימה,סתום,סתומה,סתימות,ביוב,כיור,אסלה,ברז,ברזים,דוד,דודים,דוד שמש,מים חמים,אין מים,לחץ מים,צנרת,צינור,צינורות,אינסטלציה,אינסטלטור,שרברב,מקלחת,ניאגרה', t: 'אינסטל,שרברב,נזיל,סתימ,ביוב,דוד,צנרת,ברז,דליפ' },
  { k: 'elec', l: 'חשמל', c: 'elec', w: 'חשמל,חשמלאי,קצר,קצר בחשמל,לוח חשמל,שקע,שקעים,פחת,נפל החשמל,אין חשמל,תאורה,מנורה,נורה,נורות,הארקה,מפסק,פקקים', t: 'חשמל,לוח,קצר,תאור,שקע' },
  { k: 'ac', l: 'מיזוג', c: 'elec', w: 'מזגן,מזגנים,מיזוג,מיזוג אוויר,קירור,מילוי גז,טכנאי מזגנים,חם בבית,חימום,תנור חימום,רדיאטור,מפזר חום,הסקה,קר בבית', t: 'מזגנ,מיזוג,קירור,חימומ,רדיאטור' },
  { k: 'appl', l: 'מכשירי חשמל', c: 'elec', w: 'מכונת כביסה,כביסה,מייבש,מדיח,תנור,מקרר,מקפיא,פלטה,מיחם,מכשירי חשמל,טכנאי', t: 'כביס,מקרר,מדיח,תנור,מכשיר,טכנאי,פלט' },
  { k: 'build', l: 'שיפוצים', c: 'build', w: 'שיפוץ,שיפוצים,קבלן,ריצוף,רצף,טיח,צבע,צבעי,צביעה,גבס,איטום,גג,הריסה,בנייה,מרפסת,סוכה', t: 'שיפוצ,קבלנ,ריצופ,רצפ,טיח,צבע,צביע,גבס,איטומ,בניי' },
  { k: 'carp', l: 'נגרות ואלומיניום', c: 'build', w: 'נגר,נגרות,ארון,ארונות,מטבח,דלת,דלתות,חלון,חלונות,תריס,תריסים,אלומיניום,מסגר,ריתוך,מנעול,מנעולן,פורץ', t: 'נגר,ארונ,מטבח,דלת,חלונ,תריס,אלומיניומ,מסגר,מנעול' },
  { k: 'move', l: 'הובלות', c: 'car', w: 'הובלה,הובלות,מוביל,מובילים,מעבר דירה,עוברים דירה,ארגזים,משאית,רהיטים,אחסון', t: 'הובל,מוביל,משאית,אחסונ' },
  { k: 'car', l: 'רכב', c: 'car', w: 'רכב,אוטו,מוסך,מכונאי,פנצר,צמיג,צמיגים,טסט,מצבר,חשמלאי רכב', t: 'רכב,מוסכ,מכונאי,צמיג,מצבר' },
  { k: 'ride', l: 'הסעות', c: 'car', w: 'הסעה,הסעות,מונית,נהג,נסיעה,שדה תעופה,נתבג,מיניבוס', t: 'הסע,מונית,נהג,מיניבוס' },
  { k: 'fin', l: 'חשבונות ומס', c: 'fin', w: 'רואה חשבון,רוח,הנהלת חשבונות,מנהלת חשבונות,מנהל חשבונות,מס הכנסה,החזר מס,החזרי מס,דוח שנתי,מעמ,ביטוח לאומי,משכורות,תלושי שכר', t: 'חשבונ,מס,מעמ,שכר,הנהלת' },
  { k: 'law', l: 'עריכת דין', c: 'fin', w: 'עורך דין,עורכת דין,עוד,צוואה,ירושה,חוזה,נוטריון,תביעה,משפט,משפטי', t: 'עורך,עורכת,נוטריונ,צווא,משפט,חוזי' },
  { k: 'ins', l: 'ביטוח ומשכנתאות', c: 'fin', w: 'ביטוח,ביטוחים,סוכן ביטוח,משכנתא,משכנתאות,פנסיה,חיסכון', t: 'ביטוח,משכנת,פנסי' },
  { k: 'tech', l: 'מחשבים', c: 'tech', w: 'מחשב,מחשבים,לפטופ,מחשב נייד,מדפסת,אינטרנט,ראוטר,רשת,וירוס,שחזור,טלפון כשר,סינון,נטפרי,פלאפון', t: 'מחשב,מדפס,רשת,סינונ,טלפונ,אינטרנט' },
  { k: 'design', l: 'עיצוב ודפוס', c: 'tech', w: 'עיצוב,גרפיקה,גרפיקאי,מעצב,מעצבת,לוגו,הזמנות,דפוס,הדפסה,הדפסות,אתר,בניית אתרים,שלט,שלטים', t: 'עיצוב,גרפ,מעצב,לוגו,דפוס,הדפס,אתר' },
  { k: 'edu', l: 'לימוד ושיעורים', c: 'edu', w: 'מלמד,מלמדים,שיעור,שיעורים,שיעור פרטי,שיעורי עזר,מורה,מורה פרטית,חברותא,גמרא,משניות,חומש,לימוד,ללמוד,קריאה,חשבון,אנגלית,מתמטיקה,בר מצווה,הכנה לבר מצווה,דרשה', t: 'מלמד,שיעור,מורה,חברות,גמרא,משני,לימוד,קריא,אנגלית,מתמטיק,חומש' },
  { k: 'kids', l: 'גנים ומטפלות', c: 'edu', w: 'גן,גנון,משפחתון,מטפלת,בייביסיטר,שמרטף,צהרון,קייטנה,קייטנות', t: 'משפחתונ,מטפלת,צהרונ,קייטנ,גנון' },
  { k: 'stam', l: 'סת״ם', c: 'stam', w: 'סופר,סופר סתם,סתם,מזוזה,מזוזות,תפילין,בדיקת מזוזות,ספר תורה,מגילה,קריאת מגילה,טלית,ציצית,יודאיקה,ספרים,כריכה,כורך,ארבעת המינים,ארבעה מינים,אתרוג,אתרוגים,לולב,לולבים,הדסים,ערבות,חנוכיה,חנוכייה,חנוכיות,פמוט,פמוטים', t: 'סופר,סתמ,מזוז,תפילינ,מגיל,ציצית,יודאיק,כריכ,ספרי,אתרוג,לולב,חנוכי' },
  { k: 'events', l: 'שמחות', c: 'events', w: 'שמחה,שמחות,חתונה,חתונות,בר מצווה,ברית,בריתות,אירוסין,וורט,תנאים,קידושא,שבע ברכות,קייטרינג,אולם,אולמות,בדחן,פרחים,מסיבה,מסיבות,מסיבת חנוכה,סעודה,סעודות,סעודת פורים', t: 'שמח,חתונ,ברית,קייטרינג,אולמ,בדחנ,אירוע,מסיב,סעוד' },
  { k: 'photo', l: 'צילום ומוזיקה', c: 'events', w: 'צלם,צלמת,צילום,וידאו,תזמורת,זמר,נגן,קלידן,כליזמר,להקה,מוזיקה', t: 'צלמ,צילומ,וידאו,תזמורת,זמר,נגנ,קלידנ,להק,מוזיק' },
  { k: 'health', l: 'בריאות וטיפולים', c: 'health', w: 'רופא,רופאה,רפואה,טיפול,מטפל,פיזיותרפיה,פיזיותרפיסט,רפלקסולוגיה,דיקור,עיסוי,קלינאית תקשורת,ריפוי בעיסוק,פסיכולוג,פסיכולוגית,כאבי גב,שיניים,רופא שיניים,אופטיקה,משקפיים,תזונה,דיאטנית,דולה,מיילדת,הדרכת כלות,הדרכת חתנים,ייעוץ,יועץ,ייעוץ זוגי', t: 'רופא,רפוא,טיפול,פיזיו,רפלקסו,דיקור,עיסוי,קלינאי,פסיכולוג,שיניימ,אופטי,משקפ,תזונ,דיאט,דולה,הדרכ,ייעוצ,יועצ' },
  { k: 'fashion', l: 'פאות ותפירה', c: 'fashion', w: 'פאה,פאות,שייטל,שייטלים,סירוק,פאנית,חייט,תופרת,תפירה,תיקוני תפירה,קיצור,שמלה,שמלות,חליפה,כובע,כובעים,בגדים,אופנה,תחפושת,תחפושות', t: 'תחפוש,פאה,פאות,פאנית,שייטל,סירוק,חייט,תופר,תפיר,שמל,חליפ,כובע,בגד,אופנ' },
  { k: 'home', l: 'ניקיון וגינון', c: 'home', w: 'ניקיון,נקיון,ניקיון לפסח,מנקה,עוזרת,עוזרת בית,גינון,גנן,גינה,הדברה,גוקים,מזיקים,שטיחים,ספות,ניקוי ספות,הגעלה,הגעלת כלים,ליבון,הכשרת מטבח', t: 'ניקי,נקי,מנק,עוזרת,גינ,גננ,הדבר,מזיק,שטיח,ספות,הגעל' },
  { k: 'food', l: 'מזון ואפייה', c: 'food', w: 'עוגה,עוגות,אפייה,חלות,חלה,מאפה,מאפייה,קונדיטוריה,עוגיות,משלוחים,אוכל,בישול,מגשי אירוח,מגשים,פירות,ירקות,בשר,סושי,משלוח מנות,משלוחי מנות,סופגניות,סופגניה,סופגנייה,לביבות', t: 'עוג,אפי,חלות,מאפ,קונדיט,משלוח,אוכל,בישול,מגש,פירות,ירק,בשר,סופגני' },
  { k: 'realestate', l: 'נדל״ן', c: 'realestate', w: 'דירה,דירות,דירה להשכרה,להשכרה,השכרה,למכירה,תיווך,מתווך,שמאי,נכס,נדלן', t: 'דיר,תיווכ,מתווכ,שמאי,נכס,נדלנ,השכר' },
  { k: 'trade', l: 'חנויות ומסחר', c: 'trade', w: 'חנות,חנויות,סיטונאות,צעצועים,מתנות,כלי בית,כלי כסף,ספרי קודש,סכך,קישוטי סוכה,קישוטים,נוי סוכה', t: 'חנות,סיטונ,צעצוע,מתנ,כלי,סככ,קישוט' },
];

/** 25 מושגי-הבעיה (גזעים מנורמלים מראש). */
export const PR_CONCEPTS: readonly PrConcept[] = CONCEPT_SRC.map((c) => ({
  k: c.k,
  l: c.l,
  c: c.c,
  w: c.w.split(','),
  t: c.t.split(',').map(prNorm).filter(Boolean),
}));
const CONCEPT_BY_KEY = new Map(PR_CONCEPTS.map((c) => [c.k, c]));

/** רשימת-הנרדפות המנורמלת (נבנית פעם אחת). */
const SYNONYMS: ReadonlyArray<{ s: string; k: string; multi: boolean }> = PR_CONCEPTS.flatMap((c) =>
  c.w.map((x) => prNorm(x)).filter(Boolean).map((s) => ({ s, k: c.k, multi: s.includes(' ') })),
);

/** תחיליות-עבריות (רק כשנשארות ≥3 אותיות) — מהמקור. */
const PREFIX_RE = /^(וכש|וש|וה|וב|ול|ומ|שה|שב|של|מה|בה|לה|כש|ו|ה|ב|ל|מ|ש|כ)(?=.{3,})/;
const stem = (w: string): string => (w.length > 3 ? w.replace(/(ות|ימ|ה|ת)$/, '') : w);
/** לוינשטיין (lib/search) עם קיצור-דרך של המקור — הפרש-אורך >2 ⇒ "רחוק". */
const lev = (a: string, b: string): number => (Math.abs(a.length - b.length) > 2 ? 9 : levenshtein(a, b));

/**
 * ציון טוקן מול נרדף (שניהם מנורמלים) — טבלת המקור: זהה 3 · אחרי-תחילית 2.8 · אותו-גזע 2.6 ·
 * תחילית+גזע 2.5 · הנרדף מתחיל בטוקן 2.2/1.2 · הטוקן מתחיל בנרדף 2.2 · שגיאת-כתיב אחת 1.6 · 0.
 */
export function tokMatch(tok: string, s: string): number {
  if (tok === s) return 3;
  const st = tok.replace(PREFIX_RE, '');
  if (st === s) return 2.8;
  if (tok.length >= 4 && stem(tok) === stem(s)) return 2.6;
  if (st.length >= 4 && stem(st) === stem(s)) return 2.5;
  if (tok.length >= 2 && s.startsWith(tok)) return tok.length >= 3 ? 2.2 : 1.2;
  if (s.length >= 3 && (tok.startsWith(s) || st.startsWith(s))) return 2.2;
  if (tok.length >= 4 && s.length >= 4 && Math.min(lev(tok, s), lev(st, s)) <= 1) return 1.6;
  return 0;
}

/** ניתוח-שאילתה: הטוקנים, המושגים שנשמרו (≥ max(1.1, המוביל−1)) והטוקנים שהם "פגיעת-מושג". */
export interface PrAnalysis {
  q: string;
  raw: string;
  toks: string[];
  cons: Array<{ k: string; s: number }>;
  conHit: ReadonlySet<number>;
}

export function analyzeQuery(raw: string): PrAnalysis {
  const q = prNorm(raw);
  const toks = q.split(' ').filter(Boolean);
  const sc = new Map<string, number>();
  const hit = new Set<number>();
  const pq = ' ' + q + ' ';
  for (const { s, k, multi } of SYNONYMS) {
    if (multi) {
      if (pq.includes(' ' + s + ' ') || (s.length > 5 && q.includes(s))) {
        sc.set(k, Math.max(sc.get(k) ?? 0, 3.5));
        const parts = s.split(' ');
        toks.forEach((x, i) => {
          if (parts.includes(x) || parts.includes(x.replace(PREFIX_RE, ''))) hit.add(i);
        });
      }
      continue;
    }
    toks.forEach((tok, i) => {
      const m = tokMatch(tok, s);
      if (m) {
        sc.set(k, Math.max(sc.get(k) ?? 0, m));
        hit.add(i);
      }
    });
  }
  const cons = [...sc.entries()].map(([k, s]) => ({ k, s })).sort((x, y) => y.s - x.s);
  const top = cons.length ? cons[0].s : 0;
  return { q, raw, toks, cons: cons.filter((c) => c.s >= Math.max(1.1, top - 1)), conHit: hit };
}

/** הקשר-הדירוג: היום (מודגש-עד), ובאופציה שעון+סגירה (פתוח-עכשיו). */
export interface PrSearchCtx {
  todayIso: IsoDate;
  clock?: PrClock;
  closureAt?: PrClosureFn;
}

export interface PrSearchHit {
  listing: PrListing;
  /** רלוונטיות-גולמית. */
  rel: number;
  /** פגיעה "חזקה" (גזע-מושג / שם / טקסט / טלפון). */
  strong: boolean;
  /** פגיעת-מיקום (עיר/אזור). */
  loc: boolean;
  /** כיסוי-השאילתה. */
  cov: number;
  feat: 0 | 1;
  open: 0 | 1;
  recs: number;
  /** תווית-המושג שהביאה את הפגיעה החזקה. */
  via: string;
}

export interface PrSearchResult {
  hits: PrSearchHit[];
  /** סה"כ לפני חיתוך ה-limit. */
  total: number;
  analysis: PrAnalysis;
  /** תוויות-המושגים שזוהו (עד 2 — צ'יפים בשורת-ההד). */
  concepts: string[];
  /** פגיעת-שם / פגיעת-מיקום (צ'יפים "שם"/"אזור"). */
  nameHit: boolean;
  locHit: boolean;
  /** מילים שנמצאו (להדגשה). */
  words: string[];
}

/** מודגש-עד (כולל). */
export function isFeatured(l: PrListing, todayIso: IsoDate): boolean {
  return !!l.featuredUntil && l.featuredUntil >= todayIso;
}

/** רק מאושרים — חיפוש, עיון, חוברת ו-CSV (כמו המקור). */
export function approvedListings(listings: readonly PrListing[]): PrListing[] {
  return listings.filter((l) => l.status === 'approved');
}

const digits = (p: unknown): string => String(p ?? '').replace(/\D/g, '');

/**
 * "מה צריך?" — דירוג דטרמיניסטי של עסקים מאושרים (rank במקור, נספח A7): לכל מושג — גזע בטקסט-
 * העסק ⇒ רלוונטיות ×10 וכיסוי 2, אחרת שער-תואם ⇒ ×3 וכיסוי 0.5; לכל טוקן-חופשי — טלפון (≥3
 * ספרות) +30 · שם +30 · עיר/אזור +9 · מילת-טקסט +12. מיון: כיסוי ⇒ שכבה (חזק=2, +1 מיקום) ⇒
 * מודגש ⇒ פתוח-עכשיו ⇒ המלצות ⇒ רלוונטיות ⇒ שם (עברית) ⇒ מזהה.
 */
export function searchListings(q: string, listings: readonly PrListing[], ctx: PrSearchCtx, limit = 12): PrSearchResult {
  const a = analyzeQuery(q);
  const words = new Set<string>();
  let nameHit = false;
  let locQ = false;
  const out: PrSearchHit[] = [];
  if (a.toks.length) {
    for (const l of approvedListings(listings)) {
      const tx = prNorm([l.title, l.desc, l.tagline ?? '', ...(Array.isArray(l.services) ? l.services : []).map((x) => x?.name ?? '')].join(' '));
      const tw = tx.split(' ').filter(Boolean);
      const nw = prNorm(l.name).split(' ').filter((w) => w.length > 1);
      const lw = prNorm(l.city + ' ' + l.area).split(' ').filter((w) => w.length > 1);
      const ph = [l.phone, l.phone2, l.whatsapp].map(digits).join('|');
      let rel = 0;
      let strong = false;
      let loc = false;
      let via = '';
      let cov = 0;
      let cs = 0;
      for (const c of a.cons) {
        const C = CONCEPT_BY_KEY.get(c.k);
        if (!C) continue;
        if (C.t.some((t) => tw.some((w) => w.startsWith(t)))) {
          if (c.s * 10 > rel) {
            rel = c.s * 10;
            via = C.l;
          }
          strong = true;
          cs = 2;
        } else if (l.category === C.c) {
          rel = Math.max(rel, c.s * 3);
          cs = Math.max(cs, 0.5);
        }
      }
      cov += cs;
      a.toks.forEach((tok, i) => {
        if (tok.length < 2) return;
        if (/^\d{3,}$/.test(tok)) {
          if (ph.includes(tok)) {
            rel += 30;
            strong = true;
            cov++;
            words.add(tok);
          }
          return;
        }
        const isCon = a.conHit.has(i);
        if (nw.some((w) => w.startsWith(tok) || (tok.length >= 4 && tokMatch(tok, w) >= 2.2))) {
          rel += isCon ? 4 : 30;
          strong = true;
          if (!isCon) {
            cov++;
            nameHit = true;
          }
          words.add(tok);
          return;
        }
        if (isCon) return;
        if (lw.some((w) => tokMatch(tok, w) >= 2.2)) {
          rel += 9;
          loc = true;
          cov++;
          locQ = true;
          words.add(tok);
          return;
        }
        if (tok.length >= 3 && tw.some((w) => tokMatch(tok, w) >= 2.2)) {
          rel += 12;
          strong = true;
          cov++;
          words.add(tok);
        }
      });
      if (!rel) continue;
      const open = ctx.clock && ctx.closureAt && openNow(l, ctx.clock, ctx.closureAt) ? 1 : 0;
      out.push({ listing: l, rel, strong, loc, cov, feat: isFeatured(l, ctx.todayIso) ? 1 : 0, open, recs: Array.isArray(l.recs) ? l.recs.length : 0, via });
    }
  }
  const tier = (r: PrSearchHit): number => (r.strong ? 2 : 0) + (locQ && r.loc ? 1 : 0);
  out.sort(
    (x, y) =>
      y.cov - x.cov ||
      tier(y) - tier(x) ||
      y.feat - x.feat ||
      y.open - x.open ||
      y.recs - x.recs ||
      y.rel - x.rel ||
      x.listing.name.localeCompare(y.listing.name, 'he') ||
      (x.listing.id < y.listing.id ? -1 : x.listing.id > y.listing.id ? 1 : 0),
  );
  const concepts = a.cons
    .map((c) => CONCEPT_BY_KEY.get(c.k)?.l ?? '')
    .filter(Boolean)
    .slice(0, 2);
  return { hits: out.slice(0, Math.max(0, limit)), total: out.length, analysis: a, concepts, nameHit, locHit: locQ, words: [...words] };
}

/** כמה עסקים השאילתה מוצאת (מטבעות-העונה במקור). */
export function searchCount(q: string, listings: readonly PrListing[], ctx: PrSearchCtx): number {
  return searchListings(q, listings, ctx, 0).total;
}

/** עיון "כל המדריך": מסננים + טקסט דרך smartFilter (AND, סובלני לשגיאות-כתיב — lib/search). */
export interface PrBrowseOpts {
  q?: string;
  category?: string;
  disc?: boolean;
  free?: boolean;
  emergency?: boolean;
  /** "פנויים לעבודה" (seek — פנוי ללקוחות נוספים). */
  seek?: boolean;
  /** 'men'/'women' — עסק "לכולם" תמיד מתאים. */
  aud?: 'all' | 'men' | 'women';
  /** גבאי: גם ממתינים/נדחים. */
  includeAll?: boolean;
  /** רק פתוחים-עכשיו. */
  openOnly?: { clock: PrClock; closureAt: PrClosureFn };
  todayIso: IsoDate;
}

/**
 * סינון "כל האלפון" (matches במקור): כל מילה בשאילתה מופיעה בשם / מקצוע / תיאור / עיר / אזור / שער / שעות /
 * משפט-מפתח / שירותים — ובפורט גם קוד-החיוג.
 */
export function matchesAll(l: PrListing, q: string): boolean {
  const qq = prNorm(q).split(' ').filter(Boolean);
  if (!qq.length) return true;
  const hay = prNorm(
    [l.name, l.title, l.desc, l.city, l.area, categoryOf(l.category).name, l.hoursNote, l.tagline ?? '', ...(Array.isArray(l.services) ? l.services : []).map((x) => x?.name ?? ''), l.dialCode].join(' '),
  );
  return qq.every((w) => hay.includes(w));
}

export function filterListings(listings: readonly PrListing[], o: PrBrowseOpts): PrListing[] {
  let base = o.includeAll ? listings.slice() : approvedListings(listings);
  if (o.category) base = base.filter((l) => l.category === o.category);
  if (o.disc) base = base.filter((l) => l.disc === true);
  if (o.free) base = base.filter((l) => l.free === true);
  if (o.emergency) base = base.filter((l) => l.emergency === true);
  if (o.seek) base = base.filter((l) => l.seek === true);
  if (o.aud && o.aud !== 'all') base = base.filter((l) => !l.aud || l.aud === 'all' || l.aud === o.aud);
  if (o.openOnly) {
    const { clock, closureAt } = o.openOnly;
    base = base.filter((l) => openNow(l, clock, closureAt));
  }
  const q = (o.q ?? '').trim();
  if (q) {
    return smartFilter(q, base, (l) => [
      l.name,
      ...l.name.split(/\s+/),
      l.title,
      ...l.title.split(/\s+/),
      l.city,
      l.area,
      categoryOf(l.category).name,
      categoryOf(l.category).short,
      l.tagline ?? '',
      ...(Array.isArray(l.services) ? l.services : []).map((x) => x?.name ?? ''),
      l.dialCode,
    ]);
  }
  return base.sort((a, b) => Number(isFeatured(b, o.todayIso)) - Number(isFeatured(a, o.todayIso)) || a.name.localeCompare(b.name, 'he') || a.id.localeCompare(b.id));
}

/** שער + העסקים המאושרים בו (מודגשים ראשונים, אח"כ לפי שם) — לעיון, לחוברת ול-CSV. */
export interface PrGate {
  cat: PrCategory;
  items: PrListing[];
}

export function groupByCategory(listings: readonly PrListing[], todayIso: IsoDate, includeEmpty = false): PrGate[] {
  const approved = approvedListings(listings);
  const gates: PrGate[] = [];
  for (const cat of PR_CATEGORIES) {
    const items = approved
      .filter((l) => categoryOf(l.category).key === cat.key)
      .sort((a, b) => Number(isFeatured(b, todayIso)) - Number(isFeatured(a, todayIso)) || a.name.localeCompare(b.name, 'he') || a.id.localeCompare(b.id));
    if (items.length || includeEmpty) gates.push({ cat, items });
  }
  return gates;
}

/* ═══════════════ קוד-חיוג בקו (כלל אחד לקו ולרשימת-הטיפול) ═══════════════ */

/** קוד-החיוג של עסק כפי שהקו קורא אותו: 3 ספרות (אחרי ניקוי-רווחים), אחרת ''. */
export function dialCodeOf(l: PrListing): string {
  const s = String(l.dialCode ?? '').trim();
  return /^\d{3}$/.test(s) ? s : '';
}

/** שערים בלי עסק כפול-מזהה (הראשון גובר) — רשומה פגומה לא יוצרת שני צמתים באותו מזהה ולא נספרת פעמיים. */
export function uniqueGates(gates: readonly PrGate[]): PrGate[] {
  const seen = new Set<string>();
  return gates
    .map((g) => ({
      cat: g.cat,
      items: g.items.filter((l) => {
        const k = String(l.id);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);
}

/**
 * מי נושא כל קוד-חיוג בשערים (מאושרים, בסדר-השערים). קוד שנושא יותר מעסק אחד = כפול, והקו **לא
 * עונה לו** (fail-closed — לא מחברים לעסק הלא-נכון); לכן needsCare מציג אותו לגבאי.
 */
export function dialCodeHolders(gates: readonly PrGate[]): Map<string, PrListing[]> {
  const out = new Map<string, PrListing[]>();
  for (const g of gates) {
    for (const l of g.items) {
      const c = dialCodeOf(l);
      if (c) out.set(c, [...(out.get(c) ?? []), l]);
    }
  }
  return out;
}

/** קוד כפול וכל נושאיו (לפי הקוד). */
export interface PrDupDialCode {
  code: string;
  listings: PrListing[];
}

/** הקודים הכפולים בין המאושרים — **בדיוק** מה שהקו מסרב לענות לו (אותם שערים, אותו כלל); לפי הקוד. */
export function duplicateDialCodes(listings: readonly PrListing[], todayIso: IsoDate): PrDupDialCode[] {
  return [...dialCodeHolders(uniqueGates(groupByCategory(listings, todayIso)))]
    .filter(([, ls]) => ls.length > 1)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([code, ls]) => ({ code, listings: ls }));
}

/* ═══════════════ פתוח-עכשיו (שעון-הקהילה + סגירת שבת/יו״ט) ═══════════════ */

interface Win {
  dow: number;
  f: number;
  t: number;
}

/** חלונות-שעות תקינים (dow 0–6, שעות תקינות, from≠to; 24:00 = חצות). */
function windowsOf(l: PrListing): Win[] {
  const out: Win[] = [];
  for (const h of Array.isArray(l.hours) ? l.hours : []) {
    if (!h || typeof h !== 'object') continue;
    const dow = h.dow;
    const f = hmToMin(h.from);
    const t = hmToMin(h.to);
    if (!Number.isInteger(dow) || dow < 0 || dow > 6 || f === null || t === null || f === t || f >= 1440) continue;
    out.push({ dow, f, t });
  }
  return out;
}

/** מצב-הפתיחה לתצוגה (status במקור, נספח A5) — k: open/soon/closed/shab. */
export interface PrOpenState {
  k: 'open' | 'soon' | 'closed' | 'shab';
  t: string;
  sub: string;
}

const closeLabel = (m: number): string => (m % 1440 === 0 ? 'חצות' : minToHm(m));

/**
 * מצב-פתיחה ברגע (שעון-הקהילה): שבת/יו״ט ⇒ "חוזר במוצ״ש" (סגירה מלוח-המנוע — גם לעסק "תמיד");
 * תמיד ⇒ פתוח; בתוך חלון (כולל חוצה-חצות מאתמול) ⇒ "פנוי עכשיו · עד"; נפתח תוך שעה ⇒ "נפתח
 * בקרוב"; אחרת "סגור · חוזר היום/מחר/ביום X". חלון שמתחיל בתוך סגירה נפתח בצאת (מוצ״ש), או
 * מדולג. בלי שעות ⇒ null (לא ידוע).
 */
export function listingStatus(l: PrListing, clock: PrClock, closureAt: PrClosureFn): PrOpenState | null {
  const wins = windowsOf(l);
  if (l.always !== true && !wins.length) return null;
  const cl = closureAt(clock.iso, clock.hhmm);
  if (cl.closed) return { k: 'shab', t: 'חוזר ב' + (cl.motzei || 'מוצ״ש'), sub: cl.endTime ? 'צאת ' + cl.endTime : '' };
  if (l.always === true) return { k: 'open', t: 'פנוי עכשיו', sub: '24/7' };
  const m = hmToMin(clock.hhmm) ?? 0;
  const d = clock.dow;
  for (const w of wins) {
    if (w.f < w.t) {
      if (w.dow === d && m >= w.f && m < w.t) return { k: 'open', t: 'פנוי עכשיו', sub: 'עד ' + closeLabel(w.t) };
    } else {
      if (w.dow === d && m >= w.f) return { k: 'open', t: 'פנוי עכשיו', sub: 'עד ' + closeLabel(w.t) };
      if (w.dow === (d + 6) % 7 && m < w.t) return { k: 'open', t: 'פנוי עכשיו', sub: 'עד ' + closeLabel(w.t) };
    }
  }
  for (let k = 0; k < 8; k++) {
    const dd = (d + k) % 7;
    const dateIso = addDaysIso(clock.iso, k);
    const dayWins = wins.filter((w) => w.dow === dd).sort((a, b) => a.f - b.f);
    for (const w of dayWins) {
      if (k === 0 && w.f <= m) continue;
      let start = w.f;
      const c = closureAt(dateIso, minToHm(w.f));
      if (c.closed) {
        const e = c.endIso === dateIso ? hmToMin(c.endTime) : null;
        if (e === null || (w.f < w.t && e >= w.t)) continue;
        start = e;
      }
      if (k === 0 && start - m <= 60) return { k: 'soon', t: 'נפתח בקרוב', sub: 'ב־' + minToHm(start) };
      const when = k === 0 ? 'היום' : k === 1 ? 'מחר' : dd === 6 ? 'במוצ״ש' : 'ביום ' + PR_DAY_NAMES[dd];
      return { k: 'closed', t: 'סגור עכשיו', sub: 'חוזר ' + when + ' ב־' + minToHm(start) };
    }
  }
  return { k: 'closed', t: 'סגור עכשיו', sub: '' };
}

/** פתוח עכשיו (שעון-הקהילה, כולל סגירת שבת/יו״ט). */
export function openNow(l: PrListing, clock: PrClock, closureAt: PrClosureFn): boolean {
  return listingStatus(l, clock, closureAt)?.k === 'open';
}

const DOW_LETTER = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'מוצ״ש'] as const;

/** שעות-פעילות במילים: hoursNote אם נכתב; אחרת סיכום-החלונות ("א׳–ה׳ 08:00–19:00 · ו׳ 08:00–12:00"). */
export function hoursText(l: PrListing): string {
  if (typeof l.hoursNote === 'string' && l.hoursNote.trim()) return l.hoursNote.trim();
  if (l.always === true) return 'זמין תמיד (חוץ משבת וחג)';
  const byDay: string[] = Array.from({ length: 7 }, () => '');
  for (let dow = 0; dow < 7; dow++) {
    byDay[dow] = windowsOf(l)
      .filter((w) => w.dow === dow)
      .sort((a, b) => a.f - b.f)
      .map((w) => minToHm(w.f) + '–' + closeLabel(w.t))
      .join(', ');
  }
  const parts: string[] = [];
  let i = 0;
  while (i < 7) {
    if (!byDay[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < 7 && byDay[j + 1] === byDay[i]) j++;
    parts.push((i === j ? DOW_LETTER[i] : DOW_LETTER[i] + '–' + DOW_LETTER[j]) + ' ' + byDay[i]);
    i = j + 1;
  }
  return parts.join(' · ');
}

/* ═══════════════ ממתינים-לאישור (מכונת-האישור עצמה — transitions.ts) ═══════════════ */

/** ממתינים-לאישור (הוותיקים ראשונים): עסקים pending + מודעות לא-מאושרות שטרם פגו. */
export interface PrPending {
  listings: PrListing[];
  posts: PrPost[];
  total: number;
}

export function pendingApprovals(db: Pick<Db, 'prListings' | 'prPosts'>, todayIso: IsoDate): PrPending {
  const when = (x: { updatedAt?: string; createdAt?: string; id: string }): string => (x.updatedAt || x.createdAt || '') + '|' + x.id;
  const listings = db.prListings.filter((l) => l.status === 'pending').sort((a, b) => when(a).localeCompare(when(b)));
  const posts = db.prPosts.filter((p) => !p.approved && (!p.until || p.until >= todayIso)).sort((a, b) => when(a).localeCompare(when(b)));
  return { listings, posts, total: listings.length + posts.length };
}

/* ═══════════════ בקשות — ניתוב, פרטיות, רגישות ═══════════════ */

/** חלון-המקצוע לפני מעבר לקהילה (המקור: 3 שעות; שעה בדחוף). */
export const PR_ESCALATE_MS = { normal: 3 * 3600_000, urgent: 3600_000 } as const;
/** "דחוף" פג אחרי 48 שעות (המקור). */
export const PR_URGENT_TTL_MS = 48 * 3600_000;
/** בקשה בלי מענה ≥ N שעות אחרי שעברה לקהילה ⇒ דורש-טיפול. */
export const PR_STALE_REQ_H = 24;

const createdMs = (r: PrRequest): number => Date.parse(r.createdAt);

/** דחוף: פתוחה, מסומנת (או מתחילה ב"דחוף"), ופחות מ-48 שעות (המקור, נספח A15). */
export function isUrgent(r: PrRequest, nowMs: number): boolean {
  if (r.status === 'closed') return false;
  if (!(r.urgent === true || /^\s*דחוף/.test(r.text))) return false;
  const t = createdMs(r);
  return !Number.isFinite(t) || nowMs - t < PR_URGENT_TTL_MS;
}

/** מפתח-טלפון (9 ספרות אחרונות) — לזיהוי העסק של המבקש עצמו. */
const phoneKey = (p: unknown): string => {
  const d = digits(p);
  return d.length >= 9 ? d.slice(-9) : '';
};

/**
 * מקבלי-הבקשה בשלב-המקצוע: עסקים **מאושרים** באותו שער, **שנרשמו בעצמם** (source='owner') —
 * 🛡 רשומות-גבאי לא נספרות (תיקון: במקור בקשה בתחום שיש בו רק רשומות-גבאי חיכתה 3 שעות מול
 * אף-אחד, ובקשה שקטה הגיעה רק לגבאי). בלי העסק של המבקש עצמו; הצעת-עבודה / "לא משנה" ⇒ אין.
 */
export function requestRecipients(r: PrRequest, listings: readonly PrListing[]): PrListing[] {
  if (!r.category || r.job) return [];
  const own = phoneKey(r.requester?.phone);
  return listings.filter(
    (l) =>
      l.status === 'approved' &&
      l.source === 'owner' &&
      l.category === r.category &&
      !(own && [l.phone, l.phone2, l.whatsapp].some((p) => phoneKey(p) === own)),
  );
}

/** שלב-הבקשה: biz = רק העסקים בשער · all = כל הקהילה · gabbai = שקטה בלי עסק (הגבאי מכוון) · closed. */
export type PrStage = 'biz' | 'all' | 'gabbai' | 'closed';

export interface PrRoute {
  stage: PrStage;
  recipients: PrListing[];
  /** מתי עוברת לקהילה (epoch) — null אם לא רלוונטי. */
  escalateAtMs: number | null;
  /** כמה זמן נשאר לעסקים לבד. */
  msLeft: number;
}

/**
 * ניתוב (reqStage במקור, נספח A14): נסגרה ⇒ closed · שקטה ⇒ biz/gabbai **ולעולם לא לקהילה** ·
 * אין מקבלים ⇒ all מיד · יש מענה ⇒ נשארת biz · אחרת biz עד יצירה+3ש׳ (שעה בדחוף), ואז all.
 * יצירה לא-קריאה ⇒ נחשבת ישנה (עוברת לקהילה — לא נתקעת לעולם).
 */
export function routeRequest(r: PrRequest, listings: readonly PrListing[], nowMs: number): PrRoute {
  const recipients = requestRecipients(r, listings);
  const done = (stage: PrStage): PrRoute => ({ stage, recipients, escalateAtMs: null, msLeft: 0 });
  if (r.status === 'closed') return done('closed');
  if (r.quiet === true) return done(recipients.length ? 'biz' : 'gabbai');
  if (!recipients.length) return done('all');
  if (Array.isArray(r.responses) && r.responses.length) return done('biz');
  const t = createdMs(r);
  if (!Number.isFinite(t)) return done('all');
  const esc = t + (isUrgent(r, nowMs) ? PR_ESCALATE_MS.urgent : PR_ESCALATE_MS.normal);
  return nowMs >= esc ? { stage: 'all', recipients, escalateAtMs: esc, msLeft: 0 } : { stage: 'biz', recipients, escalateAtMs: esc, msLeft: esc - nowMs };
}

/** משך במילים (inMins במקור): "40 דקות" · "שעה" · "שעתיים ו־10 דקות". */
export function inMinsText(ms: number): string {
  const m = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(m / 60);
  const r = m % 60;
  const H = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : h + ' שעות';
  return m < 60 ? m + ' דקות' : r < 5 ? H : H + ' ו־' + r + ' דקות';
}

/** שורת-המסלול למבקש/לגבאי (נוסח המקור, "מדריך" במקום "אלפון"). */
export function routeSummary(route: PrRoute, r: PrRequest): string {
  const n = route.recipients.length;
  switch (route.stage) {
    case 'closed':
      return 'הבקשה נסגרה';
    case 'gabbai':
      return 'בקשה בשקט · אין עדיין עסק בתחום במדריך, הגבאי יכוון אותך באופן אישי';
    case 'biz':
      if (r.quiet) return 'בקשה בשקט · נשלחה רק ל־' + n + ' עסקים בתחום, בלי השם שלך · לא תפורסם בלוח ולא תעבור לקהילה';
      if (Array.isArray(r.responses) && r.responses.length) return r.responses.length + ' עסקים זמינים לבקשה הזו';
      return 'נשלחה ל־' + n + ' עסקים בתחום · אם אף אחד לא יענה, תעבור לכל הקהילה בעוד ' + inMinsText(route.msLeft);
    default:
      if (r.job || !r.category) return 'פתוחה לכל הקהילה';
      return n ? 'פתוחה לכל הקהילה · העסקים בתחום לא ענו בזמן' : 'פתוחה לכל הקהילה · אין עדיין עסק בתחום הזה במדריך';
  }
}

/**
 * נושאים רגישים ⇒ "בשקט" אוטומטית (SENS במקור, נספח A14). תיקון: `\b` של המקור לא פועל על
 * אותיות עבריות (JS מחשיב אותן "לא-מילה") ⇒ "חובות"/"גט" לא זוהו לעולם; כאן גבולות עבריים
 * (?:^|[^א-ת]) / (?![א-ת]) — וגם "רחוב" כבר לא נתפס כ"חוב". (בלי lookbehind במכוון: Safari ישן
 * לפני 16.4 נכשל בפענוח ⇒ כל הצ'אנק היה קורס.)
 */
const SENSITIVE: ReadonlyArray<readonly [RegExp, string]> = [
  [/פוריות|הריון|להיכנס להריון|הפלה|IVF|הפריה|טיפולי? פוריות/i, 'פוריות'],
  [/פסיכו|פסיכיאטר|דיכאון|חרדה|חרדות|OCD|טיפול רגשי|מטפל(?:ת)? רגשי|נפשי|הפרעת אכילה|טראומה|התמכרות|אובדני/i, 'נפש'],
  [/(?:^|[^א-ת])[ובלמשהכ]?חוב(?:ות)?(?![א-ת])|הוצאה לפועל|עיקול|פשיטת רגל|חדלות פירעון|מינוס|לא מצליח(?:ים)? לשלם|אובדן פרנסה|פוטרתי|פיטורים/i, 'חובות ופרנסה'],
  [/ייעוץ זוגי|יועץ זוגי|שלום בית|גירושין|(?:^|[^א-ת])[ובלמשהכ]?גט(?![א-ת])|משבר במשפחה|אלימות|הדרכת הורים/i, 'שלום בית'],
  [/אבחון|אוטיזם|ADHD|הפרעת קשב|לקות|צרכים מיוחדים|חינוך מיוחד|עיכוב התפתחות|ריפוי בעיסוק|קלינאית תקשורת|פיגור|תסמונת/i, 'ילד מיוחד'],
  [/בירור(?:ים)? על|בירורים לשידוך|לברר על (?:בחור|בחורה|משפחה)/i, 'בירורי שידוכים'],
  [/מקו?וה|בלנית|טהרה|הלכות טהרה/i, 'טהרה'],
  [/סרטן|אונקולוג|כימו|מחלה קשה|ניתוח|אשפוז|חולה סופני|דיאליזה/i, 'מחלה'],
  [/צוואה|ייפוי כוח|ירושה|אפוטרופוס/i, 'צוואה וירושה'],
];

/** תווית-הנושא הרגיש הראשון שזוהה ('' = לא רגיש). */
export function sensitiveTopic(text: string): string {
  const s = String(text ?? '');
  for (const [re, label] of SENSITIVE) if (re.test(s)) return label;
  return '';
}

/** השחרת טלפונים (≥7 ספרות; לא תאריכים) ומיילים בטקסט — לתצוגת-עסקים של בקשה שקטה. */
export function redactContact(text: string): string {
  return String(text ?? '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '•••')
    .replace(/\+?\d[\d\s\-–.()]{5,}\d/g, (m) => {
      if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(m.trim())) return m;
      return digits(m).length >= 7 ? '•••' : m;
    });
}

/** תצוגת-בקשה כלפי עסקים/קהילה — נבנית מרשימה-לבנה (אין שדה requester בכלל). */
export interface PrRequestView {
  id: string;
  text: string;
  category: string;
  area: string;
  urgent: boolean;
  quiet: boolean;
  job: boolean;
  status: PrRequestStatus;
  createdAt: string;
  /** פרטי-קשר למבקש — **null לבקשה שקטה** (לעולם לא בתצוגת-העסקים). */
  contact: PrRequester | null;
  responseCount: number;
}

/**
 * 🛡 פרטיות-השקט במנוע: עסק לעולם לא מקבל את זהות מבקש-השקט — לא שם, לא טלפון, ולא טלפון/מייל
 * שהוקלדו בגוף-הבקשה (מושחרים). בקשה רגילה — פרטי-הקשר שהמבקש בחר להשאיר.
 */
export function businessView(r: PrRequest, nowMs: number): PrRequestView {
  const quiet = r.quiet === true;
  const name = typeof r.requester?.name === 'string' ? r.requester.name : '';
  const phone = typeof r.requester?.phone === 'string' ? r.requester.phone : '';
  return {
    id: r.id,
    text: quiet ? redactContact(r.text) : r.text,
    category: r.category,
    area: r.area,
    urgent: isUrgent(r, nowMs),
    quiet,
    job: r.job === true && !quiet,
    status: r.status,
    createdAt: r.createdAt,
    contact: quiet ? null : { name, phone },
    responseCount: Array.isArray(r.responses) ? r.responses.length : 0,
  };
}

const byUrgencyThenNewest = (nowMs: number) => (a: PrRequest, b: PrRequest): number =>
  Number(isUrgent(b, nowMs)) - Number(isUrgent(a, nowMs)) || String(b.createdAt).localeCompare(String(a.createdAt)) || a.id.localeCompare(b.id);

/** מה עסק רואה: בקשות פתוחות בשער שלו שהוא מקבל-שלהן (כולל אחרי מעבר לקהילה) — בתצוגה המוגנת. */
export function requestsForListing(listing: PrListing, requests: readonly PrRequest[], listings: readonly PrListing[], nowMs: number): PrRequestView[] {
  return requests
    .filter((r) => r.status !== 'closed' && routeRequest(r, listings, nowMs).recipients.some((x) => x.id === listing.id))
    .slice()
    .sort(byUrgencyThenNewest(nowMs))
    .map((r) => businessView(r, nowMs));
}

/** מה הקהילה רואה: בקשות פתוחות, לא-שקטות, בשלב all (דחופות ראשונות, אח"כ החדשות). */
export function communityRequests(requests: readonly PrRequest[], listings: readonly PrListing[], nowMs: number): PrRequestView[] {
  return requests
    .filter((r) => r.status !== 'closed' && r.quiet !== true && routeRequest(r, listings, nowMs).stage === 'all')
    .slice()
    .sort(byUrgencyThenNewest(nowMs))
    .map((r) => businessView(r, nowMs));
}

/* ═══════════════ דורש-טיפול ═══════════════ */

export interface PrCareItem {
  kind: 'quietNoBiz' | 'urgent' | 'unanswered' | 'adUnpaid' | 'adEnding' | 'featuredEnding' | 'dupDialCode' | 'noDialCode';
  /** dupDialCode — מזהה העסק הראשון בקוד (הקפיצה לכרטיס שלו). */
  id: string;
  label: string;
  hint: string;
}

const snippet = (s: string, n = 60): string => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
};

/**
 * רשימת-הטיפול של הגבאי (מעבר לממתינים-לאישור): בקשה שקטה בלי עסק בתחום · דחופה בלי מענה ·
 * פתוחה לקהילה בלי מענה ≥24ש׳ · פרסומת שהחלה ולא שולמה · פרסומת שמסתיימת ≤14 יום · הדגשה
 * שמסתיימת ≤7 ימים · ☎ קוד-חיוג כפול בין המאושרים (שורה לכל קוד — **הקו לא עונה לקוד כפול**, אותו
 * כלל בדיוק: dialCodeHolders) · עסקים מאושרים בלי קוד-חיוג (שורה מסכמת). לעולם לא שם/טלפון של מבקש.
 */
export function needsCare(db: Pick<Db, 'prListings' | 'prRequests' | 'prAds'>, todayIso: IsoDate, nowMs: number, config?: OrgConfig): PrCareItem[] {
  const T = (k: string, fb: string): string => (config ? termOf(config, k, fb) : fb);
  const reqWord = T('entity.prRequest', 'בקשה');
  const listingsWord = T('entity.prListings', 'עסקים');
  const adWord = T('entity.prAd', 'פרסומת');
  const out: PrCareItem[] = [];
  const quiet: PrCareItem[] = [];
  const urgent: PrCareItem[] = [];
  const stale: PrCareItem[] = [];
  for (const r of db.prRequests) {
    if (r.status === 'closed') continue;
    const route = routeRequest(r, db.prListings, nowMs);
    const answered = Array.isArray(r.responses) && r.responses.length > 0;
    if (route.stage === 'gabbai') {
      quiet.push({ kind: 'quietNoBiz', id: r.id, label: reqWord + ' בשקט בלי עסק בתחום', hint: 'אין בעל-מקצוע זמין בשער ' + categoryOf(r.category).short + ' — הגבאי מכוון אישית' });
      continue;
    }
    if (answered) continue;
    if (isUrgent(r, nowMs)) {
      urgent.push({ kind: 'urgent', id: r.id, label: reqWord + ' דחופה בלי מענה', hint: snippet(r.quiet ? redactContact(r.text) : r.text) });
      continue;
    }
    const t = createdMs(r);
    if (route.stage === 'all' && (!Number.isFinite(t) || nowMs - t >= PR_STALE_REQ_H * 3600_000)) {
      stale.push({ kind: 'unanswered', id: r.id, label: reqWord + ' פתוחה לקהילה בלי מענה', hint: snippet(r.text) });
    }
  }
  out.push(...quiet, ...urgent, ...stale);
  const soon14 = addDaysIso(todayIso, 14);
  for (const a of db.prAds) {
    if (a.active === false) continue;
    const started = !a.from || a.from <= todayIso;
    const live = started && (!a.to || a.to >= todayIso);
    if (started && !a.paid && a.price > 0) out.push({ kind: 'adUnpaid', id: a.id, label: adWord + ' של ' + a.advertiser + ' לא שולמה', hint: a.price + ' ₪ · קישור-סליקה בלבד (אין קבלה)' });
    if (live && a.to && a.to <= soon14) out.push({ kind: 'adEnding', id: a.id, label: adWord + ' של ' + a.advertiser + ' מסתיימת ב-' + a.to, hint: 'לחדש או לפנות את המשבצת' });
  }
  const soon7 = addDaysIso(todayIso, 7);
  let noCode = 0;
  for (const l of db.prListings) {
    if (l.status !== 'approved') continue;
    if (isFeatured(l, todayIso) && l.featuredUntil <= soon7) out.push({ kind: 'featuredEnding', id: l.id, label: 'ההדגשה של ' + l.name + ' מסתיימת ב-' + l.featuredUntil, hint: 'לחדש או להסיר' });
    if (!l.dialCode) noCode++;
  }
  // ☎ קוד כפול — בדיוק מה שהקו מסרב לענות לו (duplicateDialCodes: אותם שערים, אותו כלל)
  for (const d of duplicateDialCodes(db.prListings, todayIso)) {
    out.push({
      kind: 'dupDialCode',
      id: d.listings[0].id,
      label: 'קוד-חיוג ' + d.code + ' כפול — ' + d.listings.length + ' ' + listingsWord,
      hint: snippet(d.listings.map((l) => l.name).join(' · '), 80) + ' — הקו לא עונה לקוד כפול; תנו לאחד מהם קוד אחר',
    });
  }
  if (noCode) out.push({ kind: 'noDialCode', id: 'dialcodes', label: noCode + ' ' + listingsWord + ' בלי קוד-חיוג', hint: 'הקוד מודפס בחוברת ומשמש את קו-הטלפון העתידי' });
  return out;
}

/* ═══════════════ משבצות-פרסום ═══════════════ */

/** פעילה ביום (כוללני; קצה ריק = פתוח). */
export function adActiveOn(ad: PrAd, todayIso: IsoDate): boolean {
  return ad.active !== false && (!ad.from || ad.from <= todayIso) && (!ad.to || ad.to >= todayIso);
}

/**
 * הפרסומות הפעילות במשבצת (ובאופציה ליעד — שער/עסק), לפי המפרסם (עברית) ואז מזהה. מטבע-הפלטינה (coin) אינו חסות-שער —
 * לא נכלל כאן (coinSponsor).
 */
export function activeAds(ads: readonly PrAd[], slot: PrAdSlot, todayIso: IsoDate, target?: string): PrAd[] {
  return ads
    .filter((a) => a.slot === slot && !a.coin && adActiveOn(a, todayIso) && (target === undefined || a.target === target))
    .sort((a, b) => a.advertiser.localeCompare(b.advertiser, 'he') || a.id.localeCompare(b.id));
}

/** מטבע-הפלטינה בחסות של היום (sponsors/coin במקור): פעיל, בשער מוכר; כמה ⇒ סבב-יומי. */
export function coinSponsor(ads: readonly PrAd[], todayIso: IsoDate): PrAd | null {
  const list = ads
    .filter((a) => a.slot === 'category' && a.coin === true && adActiveOn(a, todayIso) && categoryOf(a.target).key === a.target && a.advertiser.trim())
    .sort((a, b) => a.advertiser.localeCompare(b.advertiser, 'he') || a.id.localeCompare(b.id));
  return list.length ? list[((dayNumber(todayIso) % list.length) + list.length) % list.length] : null;
}

/** קישור-סליקה לפרסומת (payLink של הארגון, סכום+שם ממולאים). אין קבלה — רישום ידני. */
export function adPayLink(ad: PrAd, payUrl: string): string | null {
  return payLink(payUrl, ad.price, ad.advertiser);
}

/** סבב-המשבצת ביום נתון (אשכול 8). */
export interface PrAdRotation {
  /** כל הפעילות במשבצת היום (activeAds — לפי מפרסם). */
  active: PrAd[];
  /** התורנית של היום — null כשאין. */
  today: PrAd | null;
  index: number;
}

/** מספר-יום מוחלט של תאריך ISO (ימים מ-1970, צהרי-UTC — בלי תלות באזור-הזמן). פגום ⇒ 0. */
function dayNumber(iso: IsoDate): number {
  const t = Date.parse(String(iso) + 'T12:00:00Z');
  return Number.isFinite(t) ? Math.floor(t / 86_400_000) : 0;
}

/**
 * סבב-יומי במשבצת (המקור §4.5: offset = floor(now/day) % n — כל משלם מקבל את תורו): כמה פעילות
 * באותה משבצת/יעד ⇒ אחת "בתורנות" היום, מתחלפת בכל יום. דטרמיניסטי (היום מוזרק).
 */
export function adRotation(ads: readonly PrAd[], slot: PrAdSlot, todayIso: IsoDate, target?: string): PrAdRotation {
  const active = activeAds(ads, slot, todayIso, target);
  if (!active.length) return { active, today: null, index: -1 };
  const index = ((dayNumber(todayIso) % active.length) + active.length) % active.length;
  return { active, today: active[index], index };
}

/** פנקס-הפרסום (הכנסות-חזויות/נגבו/ממתין — רישום בלבד, לא קבלות). */
export interface PrAdsLedger {
  /** פרסומות פעילות שטרם פגו (כולל עתידיות). */
  count: number;
  paidCount: number;
  /** סה"כ מחירים (₪). */
  total: number;
  /** סומנו "שולם". */
  paid: number;
  /** ממתין לגבייה — התחילו ולא שולמו. */
  due: number;
  /** עתידיות שטרם שולמו (עוד לא בגבייה). */
  upcoming: number;
}

/** סיכום-הפרסומות להיום: מושהות ופגות לא נספרות (המקור: "ממתין לגבייה" = לא שולם). */
export function adsLedger(ads: readonly PrAd[], todayIso: IsoDate): PrAdsLedger {
  const out: PrAdsLedger = { count: 0, paidCount: 0, total: 0, paid: 0, due: 0, upcoming: 0 };
  for (const a of ads) {
    if (a.active === false || (a.to && a.to < todayIso)) continue;
    const price = typeof a.price === 'number' && Number.isFinite(a.price) && a.price > 0 ? a.price : 0;
    out.count++;
    out.total += price;
    if (a.paid) {
      out.paidCount++;
      out.paid += price;
    } else if (!a.from || a.from <= todayIso) out.due += price;
    else out.upcoming += price;
  }
  return out;
}

/* ═══════════════ ייצוא CSV ═══════════════ */

/**
 * שורות CSV של המדריך — מאושרים בלבד, לפי סדר-השערים ואז שם. **בלי הערה-פנימית**; ההגנה מפני
 * הזרקת-נוסחאות והורדה דרך downloadCsv (csvEscape + שער core.export) אצל הקורא.
 */
export function listingsCsvRows(listings: readonly PrListing[], todayIso: IsoDate): (string | number)[][] {
  const rows: (string | number)[][] = [
    ['קוד חיוג', 'תחום', 'שם', 'מקצוע', 'טלפון', 'טלפון נוסף', 'וואטסאפ', 'עיר', 'אזור שירות', 'שעות', 'שפות', 'השגחה', 'חירום', 'הנחה לקהילה', 'גמ״ח', 'מתאים ל', 'פירוט'],
  ];
  for (const g of groupByCategory(listings, todayIso)) {
    for (const l of g.items) {
      rows.push([
        l.dialCode,
        g.cat.name,
        l.name,
        l.title,
        l.phone,
        l.phone2,
        l.whatsapp,
        l.city,
        l.area,
        hoursText(l),
        (Array.isArray(l.languages) ? l.languages : []).map((x) => PR_LANG_NAMES[x] ?? x).join(', '),
        l.kashrut,
        l.emergency ? 'כן' : '',
        l.disc ? 'כן' : '',
        l.free ? 'כן' : '',
        PR_AUD_NAMES[l.aud ?? 'all'] ?? '',
        l.desc,
      ]);
    }
  }
  return rows;
}
