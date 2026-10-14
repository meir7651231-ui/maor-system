#!/usr/bin/env node
/**
 * 🔨 המפרק (ATOMS-DECOMPOSE, 14.10.2026) — מנוע שמפרק כל מודול של אורביט לכרטיס-מנוע, אוטומטית.
 *
 * קורא (בלי להריץ!) את הקבצים הטהורים של כל מודול (`src/components/<מודול>/*.ts`) ואת `src/types/domain.ts`,
 * דרך ה-API של המהדר `typescript` (devDependency קיים), ומוציא לכל מודול:
 *   • חלקים — כל פונקציה מיוצאת טהורה: שם ומשפט מההערה העברית, סוגי קלט/פלט;
 *   • מקומות — נתונים מכל סוג מתוך ישויות ה-Db (תאריך⇒זמנים, כסף/כמות⇒סכום, התחלה/סוף⇒טווח, רשימת-רשומות-מתוארכות⇒רצף,
 *     סטטוס פתוח⇒מחכה, טקסט⇒טקסט), כל אחד עם מפרט-קריאה הצהרתי; ופונקציות-גישה (Db/רשומה ⇒ ערך מסוג).
 * הפלט: `src/lib/atoms/engines/generated/<מודול>.ts` + `index.ts` (GENERATED_ENGINES). דטרמיניסטי — אותו קוד, אותו פלט.
 *
 *   node scripts/atoms-decompose.mjs           # כותב את הקבצים
 *   node scripts/atoms-decompose.mjs --check   # בודק שהקבצים מעודכנים (יציאה 1 אם לא)
 *   node scripts/atoms-decompose.mjs --summary # מדפיס סיכום בלי לכתוב
 *
 * כללי-הסוגים והמילים — ב-`src/lib/atoms/decompose/kinds.ts` / `words.ts` (Node טוען אותם ישירות; מקור-אמת אחד עם הבדיקות).
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, statSync, rmSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as K from '../src/lib/atoms/decompose/kinds.ts';
import * as W from '../src/lib/atoms/decompose/words.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'src/lib/atoms/engines/generated');
const HEADER = 'נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs';
/** 🏭 המפעל (14.10): סיכום-האימות נכתב לאותה תיקייה ע״י scripts/atoms-factory.mjs — לא של המפרק, לא נמחק כאן. */
const FACTORY_FILES = new Set(['verified.ts']);

/* ═══════════════ תצורה (גלויה, מתועדת בדוח) ═══════════════ */

/** תיקיות שאינן מנוע עסקי (הארגז עצמו, ממשק, תשתית). */
const SKIP_DIRS = new Set(['enginebox', 'switchboard', 'settings', 'builder', '__tests__', 'palette', 'lock', 'support', 'cloud', 'public', 'wheel']);
/** מודול-משנה: קובץ אחד שהוא מנוע בפני עצמו (כמו לוח-הזמנים בתוך פרנסה׳לע). */
const SUBMODULES = [{ id: 'zmanimBoard', dir: 'parnasa', files: ['zmanimBoard.ts'] }];
/** קבצים שאינם לוגיקה (טקסטים, אפקטים, ציור). */
const SKIP_FILES = /^(labels|svgDefs|sound|bannerFx|coinFx|sheetFx|imageShrink|a11yApply|hooks|useArmed|exportDoc|backup|importer)\.ts$/;
/** ייבוא שהופך קובץ ללא-טהור. */
const IMPURE_IMPORT = /^(react|react-dom|zustand|firebase|idb|three)(\/|$)|\/store\/|\/store$|\.tsx$|\/(cloud|persist|pwa)$/;
const IMPURE_CODE = /\b(document|window|localStorage|sessionStorage|navigator|indexedDB|useApp)\b\s*[.(]/;

/** שם, אימוג'י ומשפט לכל מודול (קוסמטי בלבד; מודול חסר ⇒ שם התיקייה והערת-הראש של lib.ts). */
const MODULE_META = {
  supporters: ['מנוע התורמים', '💝', 'יודע מי תרם, כמה ומתי, מי צריך שיחה ומי בסכנה לעזוב.'],
  courses: ['מנוע החוגים', '🎨', 'יודע מי רשום לאיזה חוג, מי הגיע, מי חסר ומי חייב.'],
  families: ['מנוע המשפחות', '👨‍👩‍👧', 'יודע מי במשפחה, מה היא צריכה ומה המצב שלה.'],
  calendar: ['מנוע הלוח', '📅', 'יודע מה קורה בכל יום, בעברי ובלועזי.'],
  diary: ['מנוע יומן החדרים', '🚪', 'יודע איזה חדר תפוס ומתי, ומתי אסור לקבוע.'],
  tzedaka: ['מנוע קופות הצדקה', '🪙', 'יודע איפה כל קופה, מתי רוקנה וכמה היה בה.'],
  shop: ['מנוע החנות', '🛍️', 'יודע מה במלאי, למי מגיע ומה מומש.'],
  shop7: ['מנוע החלוקה', '🚚', 'יודע מי מחלק למי, ומה כבר נמסר.'],
  shop8: ['מנוע ההצעות', '💡', 'מציע מראש מה משפחה תצטרך.'],
  reports: ['מנוע הדוחות', '📊', 'מסכם את כל הנתונים לטבלאות ולקבצים.'],
  telephony: ['מנוע הטלפון', '☎️', 'יודע מי התקשר, למה ומה ענו לו.'],
  home: ['מנוע מסך הבית', '🏠', 'אוסף מכל המערכת מה חשוב היום.'],
  hosting: ['מנהל ההזמנות', '🛏️', 'יודע מה פנוי, מי מגיע ומתי, כמה זה עולה וכמה שולם.'],
  parnasa: ['מנוע "מה צריך?"', '📒', 'מוצא בעל מקצוע לכל בקשה, ומחלק את הבקשות בין העסקים.'],
  zmanimBoard: ['מחשבון הזמנים', '🕯️', 'יודע איפה השמש נמצאת בכל מקום ובכל יום, ומזה מחשב את כל הזמנים.'],
  platform: ['מנוע הצוות', '👥', 'יודע מי בצוות, מה מותר לו ומה הוא עשה.'],
  timer: ['מנוע הקופה הרושמת', '💵', 'סופר כסף במשמרת ומוציא אישורים.'],
  wall: ['מנוע קיר ההשפעה', '🧱', 'מראה כמה גויס ולמה.'],
  dialer: ['מנוע החייגן', '📞', 'מסדר רשימת שיחות ורושם מה ענו.'],
};

/** האוסף ⇒ איך קוראים לרשומה אחת ולכולן (לשמות-המקומות). */
const ENTITY_NOUN = {
  families: ['כל משפחה', 'המשפחות'],
  enrollments: ['כל שיבוץ', 'השיבוצים'],
  courses: ['כל חוג', 'החוגים'],
  events: ['כל אירוע', 'האירועים בלוח'],
  rooms: ['כל חדר', 'החדרים'],
  teachers: ['כל מורה', 'המורים'],
  supporters: ['כל תורם', 'התורמים'],
  tzCoordinators: ['כל רכז', 'הרכזים'],
  tzBoxes: ['כל קופה', 'הקופות'],
  tzCampaigns: ['כל מבצע', 'המבצעים'],
  tzEvents: ['כל אירוע קופות', 'אירועי הקופות'],
  shopItems: ['כל פריט', 'הפריטים בחנות'],
  shopProducts: ['כל חבילה', 'החבילות'],
  shopStores: ['כל חנות שותפה', 'החנויות השותפות'],
  shopCriteria: ['כל תנאי זכאות', 'תנאי הזכאות'],
  shopAssignments: ['כל שיוך', 'השיוכים'],
  shopEvents: ['כל אירוע חנות', 'אירועי החנות'],
  shopIntakes: ['כל קליטה', 'קליטות המלאי'],
  volunteers: ['כל מתנדב', 'המתנדבים'],
  distributionDays: ['כל יום חלוקה', 'ימי החלוקה'],
  deliveries: ['כל מסירה', 'המסירות'],
  tasks: ['כל משימה', 'המשימות'],
  warehouse: ['כל פריט במחסן', 'פריטי המחסן'],
  prListings: ['כל עסק', 'העסקים'],
  prRequests: ['כל בקשה', 'הבקשות'],
  prPosts: ['כל מודעה בלוח', 'המודעות בלוח'],
  prAds: ['כל פרסומת', 'הפרסומות'],
  hostUnits: ['כל יחידה', 'היחידות'],
  hostBookings: ['כל הזמנה', 'ההזמנות'],
  hostRecords: ['כל רשומה', 'הרשומות'],
};
/** סוגי-רשומה באוסף מעורב (hostRecords) ⇒ שם. */
const KIND_NOUN = {
  guest: ['כל אורח', 'האורחים'], clean: ['כל משימת ניקיון', 'משימות הניקיון'], meal: ['כל ארוחה', 'הארוחות'], dish: ['כל מנה', 'המנות'],
  staff: ['כל איש צוות', 'אנשי הצוות'], supply: ['כל מצרך', 'המצרכים'], tableItem: ['כל פריט שולחן', 'פריטי השולחן'], temp: ['כל מדידת חום', 'מדידות החום'],
  fault: ['כל תקלה', 'התקלות'], asset: ['כל ציוד', 'הציוד'], plan: ['כל תוכנית', 'התוכניות'],
};
/** רשימה בתוך רשומה ⇒ שם. */
const ARRAY_NOUN = {
  donations: 'התרומות', payments: 'התשלומים', absences: 'החיסורים', presents: 'ימי הנוכחות', hist: 'התרומות מהקובץ הישן', calls: 'השיחות',
  plannedCharges: 'החיובים המתוכננים', members: 'בני המשפחה', sessions: 'המפגשים', names: 'השורות בטיפול', answers: 'התשובות',
  log: 'רישומי היומן', time: 'שעות העבודה', mat: 'החומרים', kit: 'פריטי המסירה', prayerNames: 'השמות לתפילה', docs: 'המסמכים', files: 'הקבצים',
  charges: 'החיובים', hours: 'שעות הפתיחה', services: 'השירותים', recs: 'ההמלצות', responses: 'התשובות', items: 'הפריטים', diners: 'הסועדים',
  collections: 'הריקונים', components: 'הרכיבים', redemptions: 'המימושים', waits: 'רשימת ההמתנה', subRooms: 'החדרים', prayers: 'התפילות',
  times: 'הזמנים', days: 'הימים', tables: 'השולחנות', people: 'האנשים', faq: 'השאלות', scores: 'הניקוד', ingredients: 'המרכיבים', steps: 'השלבים',
  languages: 'השפות', phones: 'הטלפונים', photos: 'התמונות', roomIds: 'החדרים', seated: 'היושבים', log2: 'היומן', families: 'המשפחות',
  stops: 'העצירות', boxes: 'הקופות', pay: 'אמצעי התשלום',
};
/** שדה ⇒ שם (כשההערה בקוד לא נותנת שם קצר). */
const FIELD_LABEL = {
  date: 'התאריך', d: 'התאריך', at: 'הרגע', from: 'ההתחלה', to: 'הסוף', createdAt: 'היצירה', updatedAt: 'העדכון האחרון', addedAt: 'ההוספה', enrolledAt: 'ההרשמה', endedAt: 'הסיום',
  nextDate: 'הקשר הבא', dueDate: 'מועד התשלום', birth: 'יום ההולדת', start: 'ההתחלה', end: 'הסיום', checkIn: 'הכניסה', checkOut: 'היציאה',
  until: 'הסיום', first: 'התרומה הראשונה', last: 'התרומה האחרונה', nextTalk: 'השיחה הבאה', lastTouch: 'הקשר האחרון', makeupDate: 'ההשלמה',
  closedAt: 'הסגירה', paidAt: 'התשלום', doneAt: 'הסיום', cancelledAt: 'הביטול', checkedInAt: 'הכניסה בפועל', checkedOutAt: 'היציאה בפועל',
  featuredUntil: 'סוף ההבלטה', reviewedAt: 'הבדיקה', promoAt: 'הקידום', startedAt: 'תחילת ההוראה', time: 'השעה', nextTalkTime: 'שעת השיחה הבאה',
  amount: 'הסכום', a: 'הסכום', price: 'המחיר', price1: 'המחיר המוזל הראשון', price2: 'המחיר המוזל השני', price3: 'המחיר המוזל השלישי',
  lessonPrice: 'המחיר לשיעור', lessonPrice1: 'המחיר לשיעור (הנחה ראשונה)', lessonPrice2: 'המחיר לשיעור (הנחה שנייה)', lessonPrice3: 'המחיר לשיעור (הנחה שלישית)',
  totalDue: 'הסכום לתשלום', carryBalance: 'היתרה מהשנה הקודמת', ils: 'סך התרומות בשקלים', usd: 'סך התרומות בדולרים', count: 'מספר התרומות',
  cost: 'העלות', rate: 'התעריף', qty: 'הכמות', budget: 'התקציב', goal: 'היעד', value: 'השווי', shopValue: 'השווי', promoPrice: 'מחיר הקידום',
  beds: 'מספר המיטות', cap: 'התפוסה המרבית', purchased: 'הניקובים שנקנו', used: 'הניקובים שנוצלו', size: 'גודל הכרטיסייה', maxStudents: 'מספר המקומות',
  stock: 'המלאי', minStock: 'המלאי המינימלי', kids: 'הילדים', adults: 'המבוגרים', perGuest: 'הכמות לאורח', dinerCount: 'מספר הסועדים', hours: 'השעות',
  eyes: 'המונה', days: 'מספר הימים', baseServings: 'מספר המנות', score: 'הניקוד', kidsHome: 'הילדים בבית', kidsMarried: 'הילדים הנשואים', pays: 'מספר התשלומים',
  termMonths: 'מספר החודשים', freq: 'התדירות', years: 'שנות הניסיון', temp: 'החום', name: 'השם', first_: 'השם הפרטי', title: 'הכותרת', text: 'הטקסט',
  desc: 'התיאור', description: 'התיאור', notes: 'ההערות', note: 'ההערה', headline: 'הכותרת', body: 'הטקסט', label: 'התווית', cat: 'הקטגוריה',
  category: 'הקטגוריה', mealName: 'שם הארוחה', tagline: 'שורת התיאור', reason: 'הסיבה', forWho: 'הייעוד', community: 'הקהילה', city: 'העיר', area: 'האזור',
  school: 'בית הספר', grade: 'הכיתה', semester: 'המחזור', sector: 'המגזר', audience: 'הקהל', role: 'התפקיד', type: 'הסוג', customType: 'הסוג',
  kashrut: 'הכשרות', hoursNote: 'הערת השעות', allergens: 'האלרגנים', alg: 'האלרגנים', place: 'המקום', prayer: 'התפילה', advertiser: 'המפרסם',
  designation: 'הייעוד', purpose: 'המטרה', method: 'אמצעי התשלום', nextNote: 'על מה לדבר', answeredNote: 'הערת התשובה', q: 'השאלה', unit: 'היחידה',
  device: 'המכשיר', chair: 'הכיסא', noticeKind: 'סוג המודעה', target: 'היעד', languages: 'השפות', ingredients: 'המרכיבים', steps: 'השלבים',
  father: 'שם האב', mother: 'שם האם', maritalStatus: 'המצב המשפחתי', language: 'השפה', discount: 'ההנחה', tzedaka: 'הקרן',
};
/** רשימות של קבצים/מסמכים — לא נתון לחלקים (גודל-קובץ, שם-קובץ). */
const SKIP_ARRAYS = new Set(['files', 'docs']);
/** רשומה מוטמעת (לא רשימה) ⇒ [שם, "בתוך" שלה]. */
const NESTED_NOUN = {
  hok: ['הוראת הקבע', 'בהוראת הקבע'], ayin: ['תיק הטיפול', 'בתיק הטיפול'], requester: ['המבקש', 'אצל המבקש'], offer: ['המבצע', 'במבצע'],
  seatPlan: ['סידור הישיבה', 'בסידור הישיבה'], cred: ['הניקוד המשפחתי', 'בניקוד המשפחתי'],
};
/** שדה-הפניה ⇒ "של כל X" (לרצף שמקובץ לפי הרשומה שהוא מצביע עליה). */
const ID_NOUN = {
  guestId: 'כל אורח', unitId: 'כל יחידה', courseId: 'כל חוג', memberId: 'כל ילד', famId: 'כל משפחה', familyId: 'כל משפחה', teacherId: 'כל מורה',
  roomId: 'כל חדר', spId: 'כל תורם', supporterId: 'כל תורם', volunteerId: 'כל מתנדב', boxId: 'כל קופה', coordinatorId: 'כל רכז', itemId: 'כל פריט',
  productId: 'כל חבילה', campaignId: 'כל מבצע', listingId: 'כל עסק', bookingId: 'כל הזמנה', dayId: 'כל יום חלוקה', storeId: 'כל חנות',
};
/** שדה-התאריך של רצף-האוסף: תאריך-העבודה; "יצירה" רק ברשומה שמחכה (בקשה/תקלה) — לא ביחידה או בעסק. */
function topSeqField(fields, waits) {
  const pref = ['date', 'd', 'at', 'checkIn', 'start', 'from', 'enrolledAt', 'addedAt', 'nextDate'];
  for (const p of pref) {
    const f = fields.find((x) => x.name === p);
    if (f && K.classifyField(f.type, f.name).kind === 'times' && !/TimeHM/.test(f.type)) return p;
  }
  return waits && fields.some((x) => x.name === 'createdAt') ? 'createdAt' : null;
}
/** "ב" + שם מהמילון (שם מיודע ⇒ ה' הידיעה נבלעת). */
const inOf = (noun) => (noun.startsWith('ה') ? 'ב' + noun.slice(1) : 'ב' + noun);
const SPAN_LABEL = {
  'start|end': 'מההתחלה עד הסיום', 'from|to': 'מההתחלה עד הסוף', 'checkIn|checkOut': 'מהכניסה עד היציאה', 'ageMin|ageMax': 'מגיל עד גיל',
  'gradeMin|gradeMax': 'מכיתה עד כיתה', 'first|last': 'מהתרומה הראשונה עד האחרונה',
};
const STATUS_HE = { open: 'פתוח', pending: 'ממתין', wait: 'ברשימת המתנה', new: 'חדש', inprogress: 'בטיפול', pickup: 'לאיסוף', enroute: 'בדרך', lead: 'בתהליך', eyes: 'בתהליך', answer: 'מחכה לתשובה' };
/** משפט-התוצאה לכל סוג × חלק. */
const RESULTS = {
  span: { divide: 'מחולק לחלקים שווים' },
  amount: { divide: 'מחולק לתשלומים שווים', round: 'מעוגל לסכום עגול' },
  'amount:qty': { divide: 'מחולק לחלקים שווים', round: 'מעוגל למספר עגול' },
  'times:date': { next: 'המועד הבא שעוד לא הגיע', offset: 'תזכורת לפני כל מועד' },
  'times:clock': { next: 'השעה הבאה שעוד לא הגיעה', offset: 'תזכורת לפני כל שעה', round: 'שעה מעוגלת' },
  sequence: { merge: 'כמה פעמים ברצף, בלי הפסקה', next: 'הבא בתור לפי תאריך', rotate: 'מתחלק בתורות בין אנשי הצוות' },
  waiting: { escalate: 'עובר לאחראי הבא אם אין תשובה', rotate: 'מתחלק בתורות בין אנשי הצוות' },
  text: { fuzzy: 'מוצא גם עם טעות כתיב' },
};
/** אוספים של מקבלי-סיוע ⇒ מוסתרים במצב-צנעה. */
const PERSONAL_ENTITIES = new Set(['families', 'tzCoordinators', 'tzBoxes', 'tzEvents', 'tzCampaigns', 'shopAssignments', 'shopEvents', 'deliveries', 'distributionDays', 'volunteers']);
/** אוסף שאף מודול טהור לא מזכיר — לאן הוא שייך (גלוי, בדוח). */
const FALLBACK_OWNER = { teachers: 'courses', shopStores: 'shop', shopEvents: 'shop', distributionDays: 'shop7', tasks: 'platform', warehouse: 'supporters' };
/** שם-פונקציה בלי הערה, מהצורה <של-מי><מה> (bookingBalance) ⇒ "היתרה של ההזמנה". מילון קטן וגלוי; מילה לא מוכרת ⇒ אין שם. */
const FN_HEAD = { total: 'הסכום הכולל', paid: 'התשלומים', balance: 'היתרה', count: 'הכמות', counts: 'הספירה', times: 'הזמנים', progress: 'ההתקדמות', revenue: 'ההכנסה', due: 'מה שנשאר לשלם' };
const FN_OWNER = { booking: 'ההזמנה', course: 'החוג', unit: 'היחידה', group: 'הקבוצה', day: 'היום', room: 'החדר', diner: 'הסועד', table: 'השולחן', box: 'הקופה', campaign: 'המבצע', coordinator: 'הרכז', enrollment: 'השיבוץ', supporter: 'התורם', month: 'החודש', task: 'המשימה', grand: 'הכול' };
function nameFromIdentifier(fn) {
  const w = fn.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().split(' ');
  if (w.length === 2 && FN_OWNER[w[0]] && FN_HEAD[w[1]]) return `${FN_HEAD[w[1]]} של ${FN_OWNER[w[0]]}`;
  return '';
}
/** פונקציות-חלקים קיימות ⇒ מזהה-חלק (כשמנוע קורא להן ישירות). */
const ATOM_CALLS = { divideSpan: 'divide', divideAmount: 'divide', pointsAt: 'divide', mergeRuns: 'merge', nextAfter: 'next', firstRun: 'next', roundTo: 'round', roundAll: 'round', offsetAll: 'offset', resolveRelative: 'offset', escalationState: 'escalate', escalationPlan: 'escalate', turnOf: 'rotate', fairAssign: 'rotate', fuzzyFind: 'fuzzy' };

/* ═══════════════ קריאת הקוד ═══════════════ */

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const rel = (p) => relative(ROOT, p).split('\\').join('/');

function sourceOf(path) {
  return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

/** ההערה של צומת: JSDoc, ואם אין — הערות-שורה צמודות מעליו. */
function docOf(node, sf) {
  const jsdoc = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc);
  const parts = jsdoc.map((d) => (typeof d.comment === 'string' ? d.comment : ts.getTextOfJSDocComment(d.comment) ?? '')).filter(Boolean);
  if (parts.length) return norm(parts[parts.length - 1]);
  const text = sf.getFullText();
  const ranges = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? [];
  const lines = ranges.filter((r) => r.kind === ts.SyntaxKind.SingleLineCommentTrivia).map((r) => text.slice(r.pos + 2, r.end));
  return norm(lines.join(' '));
}

/* ───────── domain.ts ───────── */

function readTypes(path, ifaces = new Map(), aliases = new Map()) {
  const sf = sourceOf(path);
  const visit = (n) => {
    if (ts.isInterfaceDeclaration(n)) {
      const fields = [];
      for (const m of n.members) {
        if (!ts.isPropertySignature(m) || !m.type) continue;
        fields.push({ name: m.name.getText(sf), raw: norm(m.type.getText(sf)), optional: !!m.questionToken, doc: docOf(m, sf) });
      }
      const ext = (n.heritageClauses ?? []).flatMap((h) => h.types.map((t) => t.expression.getText(sf)));
      ifaces.set(n.name.text, { fields, ext, doc: docOf(n, sf) });
    } else if (ts.isTypeAliasDeclaration(n)) aliases.set(n.name.text, norm(n.type.getText(sf)));
  };
  sf.forEachChild(visit);
  return { ifaces, aliases };
}

function readDomain() {
  return readTypes(join(ROOT, 'src/types/domain.ts'));
}

/** הטיפוסים של המודול: הקבצים שלו + הקבצים שהם מייבאים (רמה אחת, נתיב יחסי). שמות מ-domain גוברים. */
function localDom(mod, dom) {
  const ifaces = new Map();
  const aliases = new Map();
  const seen = new Set();
  const read = (p) => {
    if (seen.has(p) || !existsSync(p)) return;
    seen.add(p);
    readTypes(p, ifaces, aliases);
  };
  for (const f of mod.files) {
    read(f);
    const sf = sourceOf(f);
    for (const st of sf.statements) {
      if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
      const spec = st.moduleSpecifier.text;
      if (!spec.startsWith('.')) continue;
      const base = join(dirname(f), spec);
      read(base.endsWith('.ts') ? base : base + '.ts');
      read(join(base, 'index.ts'));
    }
  }
  return { ifaces: new Map([...ifaces, ...dom.ifaces]), aliases: new Map([...aliases, ...dom.aliases]) };
}

/** פתירת כינוי לאיחוד-מילולי/פרימיטיבי (IsoDate/TimeHM/Id נשארים — הם הסימן). */
function resolveAlias(type, dom, depth = 0) {
  const keep = new Set(['IsoDate', 'TimeHM', 'Id']);
  return K.unionParts(type)
    .map((p) => {
      if (keep.has(p) || depth > 4) return p;
      const a = dom.aliases.get(p);
      if (a && (K.stringLiterals(a).length || /^(string|number|boolean)$/.test(a) || K.unionParts(a).every((x) => x.startsWith("'") || keep.has(x))))
        return resolveAlias(a, dom, depth + 1);
      return p;
    })
    .join(' | ');
}

function fieldsOf(name, dom) {
  const i = dom.ifaces.get(name);
  if (!i) return null;
  const base = i.ext.flatMap((e) => fieldsOf(e, dom) ?? []);
  const own = i.fields.map((f) => ({ ...f, type: resolveAlias(f.raw, dom) }));
  const names = new Set(own.map((f) => f.name));
  return [...base.filter((f) => !names.has(f.name)), ...own];
}

/** שדות מטיפוס-אובייקט מוטמע `{ a: X; b: Y }`. */
function inlineFields(type, dom) {
  const sf = ts.createSourceFile('x.ts', 'type T = ' + type, ts.ScriptTarget.Latest, true);
  const t = sf.statements[0]?.type;
  if (!t || !ts.isTypeLiteralNode(t)) return null;
  return t.members.filter((m) => ts.isPropertySignature(m) && m.type).map((m) => ({ name: m.name.getText(sf), raw: norm(m.type.getText(sf)), type: resolveAlias(norm(m.type.getText(sf)), dom), optional: !!m.questionToken, doc: '' }));
}

/** טיפוס (שם ממשק או אובייקט מוטמע) ⇒ שדות; אחר ⇒ null. */
function structOf(type, dom) {
  const t = norm(type);
  if (/^\{.*\}$/.test(t)) return inlineFields(t, dom);
  const parts = K.unionParts(t);
  if (parts.length === 1 && dom.ifaces.has(parts[0])) return fieldsOf(parts[0], dom);
  return null;
}

/** האוספים ב-Db ⇒ טיפוס-הפריט, וטיפוסי-האיחוד (HostRecord ⇒ חבריו עם where). */
function collections(dom) {
  const db = dom.ifaces.get('Db');
  const out = [];
  for (const f of db.fields) {
    const el = K.arrayElement(f.raw);
    if (!el || !/^[A-Z]\w*$/.test(el)) continue;
    const alias = dom.aliases.get(el);
    if (alias && !dom.ifaces.has(el)) {
      const members = K.unionParts(alias).filter((m) => dom.ifaces.has(m));
      for (const m of members) {
        const kf = fieldsOf(m, dom).find((x) => x.name === 'kind');
        const lit = kf ? K.stringLiterals(kf.type)[0] : undefined;
        out.push({ entity: f.name, type: m, typeNames: [el, m], where: lit ? { kind: lit } : undefined, sub: lit });
      }
    } else if (dom.ifaces.has(el)) out.push({ entity: f.name, type: el, typeNames: [el] });
  }
  return out;
}

/* ───────── מקומות מתוך הישויות ───────── */

function nounsOf(col) {
  return (col.sub && KIND_NOUN[col.sub]) || ENTITY_NOUN[col.entity] || ['כל רשומה', 'הרשומות'];
}
function fieldLabel(f) {
  if (f.name === 'first' && !/IsoDate/.test(f.raw)) return 'השם הפרטי';
  if (FIELD_LABEL[f.name]) return FIELD_LABEL[f.name];
  const s = W.shortName(f.doc ?? '');
  if (s && s.split(/\s+/).length <= 5) return s;
  return null;
}

/**
 * הליכה על רשומה: מקומות מכל שדה, טווחים מזוגות, "מחכה" מסטטוס, רצף מרשימות מתוארכות.
 * `prefix` = הנתיב עד כאן ('' ברמה העליונה, למשל 'donations[]').
 */
function walk(fields, ctx, prefix, depth, out, skipped) {
  const P = (name) => (prefix ? prefix + '.' + name : name);
  const [each, all] = nounsOf(ctx.col);
  const arrNoun = ctx.arrNoun;
  const inNoun = ctx.inNoun;
  const where = ctx.col.where;
  // רשומה עם טלפון, או שמקושרת לאדם (משפחה/בן-משפחה/אורח/תורם) ⇒ הטקסט שלה עלול להכיל שם ⇒ לא מציגים ממנו מילה
  const hasPhone = ctx.hasPhone || fields.some((f) => /^(phone|whatsapp|famId|memberId|guestId|spId|supporterId|familyId|requester)$/.test(f.name));
  const base = { entity: ctx.col.entity, ...(where ? { where } : {}) };
  const add = (pathKey, name, kind, spec, resultKey) => {
    const res = RESULTS[resultKey ?? kind];
    out.push({ pathKey, name: W.plainWords(name), kind, spec: { ...base, ...spec, kind }, results: res });
  };

  // טווחים
  for (const s of K.spanPairs(fields)) {
    const lbl = SPAN_LABEL[s.from + '|' + s.to] ?? 'מההתחלה עד הסוף';
    const name = arrNoun ? `${arrNoun} של ${each} (${lbl})` : `${lbl} של ${each}`;
    add(P(s.from) + '~' + s.to, name, 'span', { path: P(s.from), to: P(s.to), unit: s.unit });
  }
  // מחכה
  const w = K.waitingOf(fields);
  if (w) {
    const since = K.WAIT_SINCE.find((k) => fields.some((f) => f.name === k && K.classifyField(f.type, f.name).kind === 'times')) ?? '';
    const subject = ctx.single ? `${all} שמחכים ${inNoun}` : arrNoun ? `${arrNoun} שמחכים` : `${all} שמחכים`;
    const tail = arrNoun && !ctx.single ? ' של ' + each : '';
    const name =
      'status' in w
        ? `${subject} (${[...new Set(w.open.map((o) => STATUS_HE[o] ?? o))].join(', ')})${tail}`
        : ctx.single
          ? `${all} שעוד לא סומנו כבוצעו ${inNoun}`
          : `${arrNoun ?? all} שעוד לא סומנו כבוצעו${tail}`;
    const spec = { path: prefix, ...('status' in w ? { status: { field: w.status, open: w.open } } : { done: w.done }), ...(since ? { since } : {}) };
    add((prefix || '@') + '?waiting', name, 'waiting', spec);
  }
  // רצף: האוסף עצמו, לפי תאריך (רק ברמה העליונה) — כולו, וגם קבוצה לכל רשומה שהוא מצביע עליה (guestId ⇒ של כל אורח)
  if (!prefix) {
    const df = topSeqField(fields, !!w);
    const dl = df ? fieldLabel(fields.find((f) => f.name === df)) : null;
    const by = dl && !/^(התאריך|הרגע)$/.test(dl) ? (dl.startsWith('מועד') ? dl : 'מועד ' + dl) : 'תאריך';
    if (df && !where) add('@seq', `${all}, לפי ${by}`, 'sequence', { path: '', dateField: df });
    if (df)
      for (const f of fields) {
        const owner = ID_NOUN[f.name];
        if (owner && !f.raw.endsWith('[]')) add(f.name + '@seq', `${all} של ${owner}, לפי ${by}`, 'sequence', { path: '', dateField: df, groupBy: f.name });
      }
  }

  for (const f of fields) {
    const path = P(f.name);
    const el = K.arrayElement(f.raw);
    if (el !== null) {
      if (K.SENSITIVE_FIELD.test(f.name) || K.ID_FIELD.test(f.name) || SKIP_ARRAYS.has(f.name)) {
        skipped.push('פרטי קשר, מזהה אישי או מידע רגיש — לא מקום');
        continue;
      }
      const noun = ARRAY_NOUN[f.name] ?? fieldLabel(f) ?? 'הפריטים';
      const sub = structOf(el, ctx.dom);
      if (sub && depth < 2) {
        const df = K.dateFieldOf(sub);
        if (df) add(path + '[]@seq', `${noun} של ${each}, לפי הסדר`, 'sequence', { path: path + '[]', dateField: df });
        walk(sub, { ...ctx, arrNoun: noun, inNoun: ARRAY_NOUN[f.name] ? inOf(noun) : 'בתוך ' + noun, single: false, hasPhone }, path + '[]', depth + 1, out, skipped);
        continue;
      }
      const v = K.classifyField(f.type, f.name);
      if (v.kind === 'times') {
        const clock = /TimeHM/.test(el);
        add(path + '[]', `${noun} של ${each}`, 'times', { path: path + '[]', unit: clock ? 'clock' : 'date' }, clock ? 'times:clock' : 'times:date');
        if (!clock) add(path + '[]@seq', `${noun} של ${each}, לפי הסדר`, 'sequence', { path: path + '[]', dateField: '' });
      } else if (v.kind === 'text') {
        add(path + '[]', `${noun} של ${each}`, 'text', { path: path + '[]', echo: false });
      } else skipped.push(v.reason);
      continue;
    }
    const sub = structOf(f.raw, ctx.dom);
    if (sub && !K.SENSITIVE_FIELD.test(f.name)) {
      const nn = NESTED_NOUN[f.name] ?? [fieldLabel(f) ?? 'הפרטים', 'בתוך ' + (fieldLabel(f) ?? 'הפרטים')];
      if (depth < 2) walk(sub, { ...ctx, arrNoun: nn[0], inNoun: nn[1], single: true, hasPhone: hasPhone || f.name === 'requester' }, path, depth + 1, out, skipped);
      continue;
    }
    const v = K.classifyField(f.type, f.name);
    if (!v.kind) {
      skipped.push(v.reason);
      continue;
    }
    const lbl = fieldLabel(f);
    if (!lbl) {
      skipped.push('אין שם עברי לשדה');
      continue;
    }
    const where_ = arrNoun ? ' ' + inNoun : '';
    const bare = (l) => l.replace(/^(מועד|שעת) /, '');
    if (v.kind === 'times') {
      const clock = /TimeHM/.test(f.type);
      const name =
        arrNoun && !ctx.single && /^(date|d|at)$/.test(f.name)
          ? `מועדי ${arrNoun} של ${each}`
          : /^(התאריך|השעה|הרגע)$/.test(lbl)
            ? `${lbl}${where_} של ${each}`
            : `${clock ? 'שעת' : 'מועד'} ${bare(lbl)}${where_} של ${each}`;
      add(path, name, 'times', { path, unit: clock ? 'clock' : 'date' }, clock ? 'times:clock' : 'times:date');
    } else if (v.kind === 'amount') {
      const name = arrNoun && !ctx.single && (f.name === 'amount' || f.name === 'a') ? `סכומי ${arrNoun} של ${each}` : `${lbl}${where_} של ${each}`;
      add(path, name, 'amount', { path }, K.MONEY_NAME.test(f.name) ? 'amount' : 'amount:qty');
    } else if (v.kind === 'text') {
      const name = `${lbl}${where_} של ${each}`;
      add(path, name, 'text', { path, echo: K.textEcho(f.name, hasPhone || ctx.col.entity === 'families') && !arrNoun });
    }
  }
}

function entityPlaces(col, dom) {
  const out = [];
  const skipped = [];
  walk(fieldsOf(col.type, dom), { col, dom, arrNoun: null, inNoun: '', single: false, hasPhone: false }, '', 0, out, skipped);
  return { places: out, skipped };
}

/* ───────── המודולים ───────── */

function isPure(sf) {
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) {
      const spec = st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier) ? st.moduleSpecifier.text : '';
      const typeOnly = ts.isImportDeclaration(st) ? !!st.importClause?.isTypeOnly : !!st.isTypeOnly;
      if (spec && !typeOnly && IMPURE_IMPORT.test(spec)) return false;
    }
  }
  return !IMPURE_CODE.test(sf.getFullText().replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, ''));
}

function listModules() {
  const base = join(ROOT, 'src/components');
  const dirs = readdirSync(base)
    .filter((d) => statSync(join(base, d)).isDirectory() && !SKIP_DIRS.has(d))
    .sort();
  const subFiles = new Set(SUBMODULES.map((s) => s.dir + '/' + s.files.join()));
  const mods = [];
  for (const d of dirs) {
    const files = readdirSync(join(base, d))
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && !f.endsWith('.test.ts') && !SKIP_FILES.test(f))
      .filter((f) => !subFiles.has(d + '/' + f))
      .sort();
    if (files.length) mods.push({ id: d, dir: d, files: files.map((f) => join(base, d, f)) });
  }
  for (const s of SUBMODULES) mods.push({ id: s.id, dir: s.dir, files: s.files.map((f) => join(base, s.dir, f)) });
  return mods.sort((a, b) => (a.id < b.id ? -1 : 1));
}

const DB_PARAM = /^(Db|Partial<Db>|Readonly<Db>|DbLike|Pick<Db,.*>|Partial<Pick<Db,.*>>)(\|null|\|undefined)*$/;

/** פרמטר שהוא נתון: רשומה מה-Db, או רשומה מוגדרת (ממשק) — לא רק מספר/מחרוזת/תאריך. */
function dataType(t, dom, entityTypes) {
  const base = norm(t)
    .replace(/^readonly /, '')
    .replace(/^(Pick|Partial|Readonly|Omit)<([A-Za-z_]\w*)(,.*)?>$/, '$2');
  const el = K.arrayElement(base) ?? base;
  return K.unionParts(el).some((p) => entityTypes.has(p) || (dom.ifaces.has(p) && p !== 'OrgConfig'));
}

/** סוג ערך-החזרה: לפי הטקסט, ואם זו רשומה (או רשימת רשומות) — לפי השדות שלה. */
function returnKind(ret, fnName, dom) {
  const r = resolveAlias(ret, dom);
  const v = K.classifyReturn(r, fnName);
  if (v.kind) return v.kind;
  const el = K.arrayElement(r.replace(/^readonly /, ''));
  const name = (el ?? r).trim();
  const fields = dom.ifaces.has(name) ? fieldsOf(name, dom) : null;
  return fields ? K.classifyStruct(fields, el !== null).kind : null;
}

function moduleParts(mod, domain, entityTypes) {
  const dom = localDom(mod, domain);
  const parts = [];
  const fnPlaces = [];
  const unclassified = {};
  const bump = (r) => (unclassified[r] = (unclassified[r] ?? 0) + 1);
  let refText = '';
  for (const file of mod.files) {
    const sf = sourceOf(file);
    if (!isPure(sf)) {
      bump('קובץ לא טהור (ממשק/אחסון/דפדפן) — לא נקרא');
      continue;
    }
    refText += sf.getFullText() + '\n';
    const fname = basename(file);
    const fns = [];
    for (const st of sf.statements) {
      const exported = (st.modifiers ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (!exported) continue;
      if (ts.isFunctionDeclaration(st) && st.name && st.body) fns.push({ node: st, name: st.name.text, params: st.parameters, ret: st.type, body: st.body });
      else if (ts.isVariableStatement(st))
        for (const d of st.declarationList.declarations) {
          const init = d.initializer;
          if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) && ts.isIdentifier(d.name))
            fns.push({ node: st, name: d.name.text, params: init.parameters, ret: init.type, body: init.body });
        }
    }
    for (const fn of fns) {
      const doc = docOf(fn.node, sf);
      const fromId = nameFromIdentifier(fn.name);
      const name = W.shortName(doc) || fromId;
      const computes = W.oneSentence(doc) || (fromId ? 'מחשב את ' + fromId + '.' : '');
      const params = fn.params.map((p) => ({ name: p.name.getText(sf), type: p.type ? norm(p.type.getText(sf)) : '' }));
      const takes = [...new Set(params.map((p) => K.classifyField(resolveAlias(p.type, dom), p.name).kind).filter(Boolean))].sort();
      const ret = fn.ret ? norm(fn.ret.getText(sf)) : '';
      const gives = returnKind(ret, fn.name, dom);
      const body = fn.body.getText(sf);
      const call = Object.keys(ATOM_CALLS).find((c) => new RegExp('\\b' + c + '\\(').test(body));
      const id = fname.replace(/\.ts$/, '') + '#' + fn.name;
      if (!name) bump('חלק בלי הערה בעברית — נשמר בשם הפונקציה');
      parts.push({
        num: parts.length + 1,
        name: name || 'חלק בלי הסבר (' + fn.name + ')',
        computes: computes || 'אין הסבר בעברית בקוד.',
        fn: id,
        takes,
        gives,
        ...(call ? { atom: ATOM_CALLS[call] } : {}),
      });
      // פונקציית-גישה: מקבלת Db או רשומה, ומחזירה ערך מסוג
      const retEl = (K.arrayElement(resolveAlias(ret, dom).replace(/^readonly /, '')) ?? ret).trim();
      const returnsEntity = entityTypes.has(retEl) || /^(Db|Partial<Db>)$/.test(retEl);
      const dataParam = returnsEntity ? undefined : params.map((p) => p.type).find((t) => DB_PARAM.test(t.replace(/\s+/g, '')) || dataType(t, dom, entityTypes));
      const placeName = name || W.shortName(dom.ifaces.get(retEl)?.doc ?? '');
      if (dataParam && gives && placeName) fnPlaces.push({ id: mod.id + '.fn.' + fn.name, engine: mod.id, name: placeName, kind: gives, fn: id, takes: dataParam });
    }
  }
  return { parts, fnPlaces, unclassified, refText };
}

/* ═══════════════ הרכבה ═══════════════ */

function build() {
  const dom = readDomain();
  const cols = collections(dom);
  const mods = listModules();
  const entityTypes = new Set(cols.map((c) => c.type));
  const scanned = mods.map((m) => ({ mod: m, ...moduleParts(m, dom, entityTypes) }));

  // בעלות על אוסף: המודול שמזכיר את טיפוס-הפריט הכי הרבה פעמים בקבצים הטהורים שלו (שוויון ⇒ לפי שם).
  const owner = new Map();
  for (const c of cols) {
    if (owner.has(c.entity)) continue;
    const re = new RegExp('\\b(' + [...new Set(cols.filter((x) => x.entity === c.entity).flatMap((x) => x.typeNames))].join('|') + ')\\b', 'g');
    let best = null;
    for (const s of scanned) {
      const n = (s.refText.match(re) ?? []).length;
      if (n > 0 && (!best || n > best.n || (n === best.n && s.mod.id < best.id))) best = { id: s.mod.id, n };
    }
    if (best) owner.set(c.entity, best.id);
    else if (FALLBACK_OWNER[c.entity] && mods.some((m) => m.id === FALLBACK_OWNER[c.entity])) owner.set(c.entity, FALLBACK_OWNER[c.entity]);
  }

  const engines = [];
  for (const s of scanned) {
    const m = s.mod;
    const meta = MODULE_META[m.id];
    const unclassified = { ...s.unclassified };
    const places = [];
    const seen = new Set();
    const mine = cols.filter((c) => owner.get(c.entity) === m.id);
    for (const c of mine) {
      const { places: ps, skipped } = entityPlaces(c, dom);
      for (const r of skipped) unclassified[r] = (unclassified[r] ?? 0) + 1;
      for (const p of ps) {
        const id = m.id + '.' + c.entity + (c.sub ? ':' + c.sub : '') + '.' + p.pathKey;
        if (seen.has(id)) continue;
        seen.add(id);
        places.push({
          id,
          engine: m.id,
          name: p.name,
          kind: p.kind,
          results: p.results,
          spec: p.spec,
          ...(PERSONAL_ENTITIES.has(c.entity) || /^(famId|familyId|memberId)$/.test(p.spec.groupBy ?? '') ? { personal: true } : {}),
        });
      }
    }
    if (!s.parts.length && !places.length) continue;
    const header = W.oneSentence(headerDoc(m));
    engines.push({
      id: m.id,
      name: meta?.[0] ?? 'מנוע ' + m.id,
      emoji: meta?.[1] ?? '⚙️',
      from: 'src/components/' + m.dir,
      computes: meta?.[2] ?? (header || 'מנוע בלי הסבר בעברית.'),
      entities: [...new Set(mine.map((c) => c.entity))],
      parts: s.parts,
      places,
      fnPlaces: s.fnPlaces,
      unclassified: Object.fromEntries(Object.entries(unclassified).sort(([a], [b]) => (a < b ? -1 : 1))),
    });
  }
  return { engines, owner: Object.fromEntries([...owner].sort(([a], [b]) => (a < b ? -1 : 1))) };
}

function headerDoc(m) {
  const lib = m.files.find((f) => basename(f) === 'lib.ts') ?? m.files[0];
  const text = readFileSync(lib, 'utf8');
  const c = /^\s*\/\*\*([\s\S]*?)\*\//.exec(text);
  return c ? c[1].replace(/^\s*\*\s?/gm, ' ') : '';
}

/* ═══════════════ פלט ═══════════════ */

const constName = (id) => 'GEN_' + id.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

function render({ engines, owner }) {
  const files = new Map();
  for (const e of engines) {
    const body = JSON.stringify(e, null, 2);
    files.set(
      e.id + '.ts',
      `/**\n * ${e.emoji} ${e.name} — ${HEADER}\n * מקור: ${e.from} · ${e.parts.length} חלקים · ${e.places.length} מקומות · ${e.fnPlaces.length} פונקציות-גישה.\n */\nimport type { GenEngine } from '../../decompose/types';\n\nexport const ${constName(e.id)}: GenEngine = ${body};\n`,
    );
  }
  const imports = engines.map((e) => `import { ${constName(e.id)} } from './${e.id}';`).join('\n');
  files.set(
    'index.ts',
    `/**\n * 🔨 כל המנועים שהמפרק פירק — ${HEADER}\n * בעלות על אוספי ה-Db (המודול שמזכיר את טיפוס-הפריט הכי הרבה): ${JSON.stringify(owner)}\n */\nimport type { GenEngine } from '../../decompose/types';\n${imports}\n\nexport const GENERATED_ENGINES: readonly GenEngine[] = [${engines.map((e) => constName(e.id)).join(', ')}];\n`,
  );
  files.set(
    'lazy.ts',
    `/**\n * 🔨 טעינה עצלה, מנוע-מנוע — ${HEADER}\n * כל מנוע ב-chunk משלו: הארגז טוען רק את המנוע שנבחר (במקום את כולם יחד דרך index.ts).\n */\nimport type { GenEngine } from '../../decompose/types';\n\nexport const GENERATED_IDS = ${JSON.stringify(engines.map((e) => e.id))} as const;\n\nexport const GENERATED_LOADERS: Readonly<Record<string, () => Promise<GenEngine>>> = {\n${engines
      .map((e) => `  ${e.id}: () => import('./${e.id}').then((m) => m.${constName(e.id)}),`)
      .join('\n')}\n};\n`,
  );
  return files;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const built = build();
  const files = render(built);
  if (args.has('--summary')) {
    for (const e of built.engines) {
      const byKind = {};
      for (const p of e.places) byKind[p.kind] = (byKind[p.kind] ?? 0) + 1;
      console.log(`${e.id.padEnd(12)} parts=${String(e.parts.length).padStart(3)} places=${String(e.places.length).padStart(3)} fn=${String(e.fnPlaces.length).padStart(2)} ${JSON.stringify(byKind)} entities=${e.entities.join(',')}`);
    }
    console.log('owner', JSON.stringify(built.owner));
    return;
  }
  if (args.has('--check')) {
    const stale = [];
    for (const [name, content] of files) {
      const p = join(OUT_DIR, name);
      if (!existsSync(p) || readFileSync(p, 'utf8') !== content) stale.push(name);
    }
    const extra = existsSync(OUT_DIR) ? readdirSync(OUT_DIR).filter((f) => f.endsWith('.ts') && !files.has(f) && !FACTORY_FILES.has(f)) : [];
    if (stale.length || extra.length) {
      console.error('המפרק: הקבצים שנוצרו לא מעודכנים —', [...stale, ...extra.map((x) => x + ' (מיותר)')].join(', '));
      console.error('להרצה: node scripts/atoms-decompose.mjs');
      process.exit(1);
    }
    console.log(`המפרק: ${files.size} קבצים מעודכנים.`);
    return;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  for (const f of readdirSync(OUT_DIR)) if (f.endsWith('.ts') && !files.has(f) && !FACTORY_FILES.has(f)) rmSync(join(OUT_DIR, f));
  for (const [name, content] of files) writeFileSync(join(OUT_DIR, name), content);
  console.log(`המפרק: נכתבו ${files.size} קבצים ל-${rel(OUT_DIR)}.`);
}

main();
