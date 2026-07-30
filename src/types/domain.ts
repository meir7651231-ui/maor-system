/**
 * מודל הנתונים של מערכת "מאור החסד".
 * כל הישויות נשמרות יחד במסמך DB אחד (ראו store/persist.ts) עם גרסת סכמה.
 */

/** מזהה ייחודי — מחרוזת עם קידומת לפי סוג הישות (f/m/c/e/ev/t/r/sp/tzc/tzb/tzp/tze/tzl/shp/shs/shc/sha/shr/she/shi). */
export type Id = string;

/** תאריך בפורמט ISO ‏(YYYY-MM-DD). */
export type IsoDate = string;

/** שעה בפורמט HH:MM. */
export type TimeHM = string;

/** ימי פעילות: 0=ראשון … 5=שישי (אין פעילות בשבת). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5;

export type Gender = 'm' | 'f';

/** בן/בת משפחה — ילד/ה או הורה (isParent). */
export interface Member {
  id: Id;
  first: string;
  gender: Gender;
  birth: IsoDate | '';
  /** ת"ז — נבדקת עם ספרת ביקורת. */
  idNum: string;
  phone: string;
  phone2: string;
  school: string;
  grade: string;
  /** מידע רפואי/רגישויות — מידע אישי רגיש. */
  health: string;
  /** הסכמות מדיה ותקשורת. */
  mSefach: boolean;
  mInvite: boolean;
  mRecommend: boolean;
  mPhotos: boolean;
  mVideos: boolean;
  notes: string;
  isParent?: boolean;
}

/** רישום שינוי בניקוד המשפחתי. */
export interface CredLogEntry {
  date: IsoDate;
  delta: number;
  reason: string;
}

/** ניקוד "אשראי משפחתי" — גיימיפיקציה של מעורבות. */
export interface FamilyCred {
  score: number;
  log: CredLogEntry[];
}

export interface FamilyDoc {
  id: Id;
  name: string;
  addedAt: IsoDate;
}

export type FamilyStatus = 'active' | 'pending' | 'inactive';

export interface Family {
  id: Id;
  name: string;
  father: string;
  fatherId: string;
  mother: string;
  motherId: string;
  phone: string;
  phone2: string;
  email: string;
  city: string;
  address: string;
  community: string;
  maritalStatus: string;
  language: string;
  /** קרן צדקה משויכת. */
  tzedaka: string;
  /** ספח ת"ז מלא הוגש. */
  fullSefach: boolean;
  /** הנחה — טקסט חופשי. */
  discount: string;
  status: FamilyStatus;
  notes: string;
  /** מספר ילדים בבית (אגרגט לרווחה) — אופציונלי, ברירת מחדל 0. */
  kidsHome?: number;
  /** מספר ילדים נשואים (אגרגט לרווחה) — אופציונלי, ברירת מחדל 0. */
  kidsMarried?: number;
  members: Member[];
  docs: FamilyDoc[];
  cred: FamilyCred;
  createdAt: IsoDate;
}

export interface CourseSession {
  day: Weekday;
  time: TimeHM;
  /** "קבוצה א׳" / "מפגש 2" — ריק כשיש מפגש יחיד. */
  label: string;
}

export type PricingModel = 'monthly' | 'half_year' | 'year' | 'punch';

export interface Course {
  id: Id;
  name: string;
  teacherId: Id;
  roomId: Id;
  description: string;
  price: number;
  /** שתי רמות הנחה בעלות שם (למשל "אחים" / "מלגה"). */
  price1: number;
  price2: number;
  price1Name: string;
  price2Name: string;
  model: PricingModel;
  /** מספר ניקובים בכרטיסייה (model==='punch'). */
  size: number;
  start: IsoDate;
  end: IsoDate;
  weekday: Weekday;
  time: TimeHM;
  maxStudents: number;
  gender: Gender | 'all';
  ageMin: number;
  ageMax: number;
  cat: string;
  semester: string;
  sector: string;
  audience?: string;
  img?: string;
  /** טווח כיתות יעד (P2 פער 28) — 'גן', 'א'…'יב'; ריק = בלי הגבלה. */
  gradeMin?: string;
  gradeMax?: string;
  sessions: CourseSession[];
  notes: string;
}

export interface Absence {
  date: IsoDate;
  reason: string;
  /** שיעור השלמה נקבע. */
  makeup?: boolean;
  /** לא הגיע/ה ללא הודעה. */
  noshow?: boolean;
}

export interface Payment {
  /** מספר קבלה R-{receiptSeq} — רציף לכל הקבלות. */
  rid: string;
  date: IsoDate;
  amount: number;
  method: string;
}

export type EnrollmentStatus = 'active' | 'paused' | 'ended';

export interface Enrollment {
  id: Id;
  memberId: Id;
  courseId: Id;
  plan: PricingModel;
  /** ניקובים שנרכשו (כרטיסייה). */
  purchased: number;
  /** ניקובים שנוצלו. */
  used: number;
  /** שיוך לקבוצה/מפגש (label של CourseSession). */
  group: string;
  absences: Absence[];
  payments: Payment[];
  totalDue: number;
  dueDate: IsoDate | '';
  /** אירוע תזכורת תשלום שנוצר אוטומטית ביומן. */
  dueEventId?: Id;
  status: EnrollmentStatus;
  note: string;
  enrolledAt: IsoDate;
}

export interface Teacher {
  id: Id;
  name: string;
  phone: string;
  phone2: string;
  email: string;
  idNum: string;
  address: string;
  specialty: string;
  /** תעריף שעתי בש"ח. */
  payRate: number;
  startDate: IsoDate | '';
  notes: string;
}

export interface Room {
  id: Id;
  name: string;
  active: boolean;
  /** אורך משבצת ביומן בדקות. */
  slot: number;
  /** קיבולת. */
  cap: number;
  location: string;
  /** תעריף לשעה. */
  rate: number;
  from: TimeHM;
  to: TimeHM;
  /** נגישות. */
  access: boolean;
  notes: string;
  /** ציוד: שם → קיים. */
  eq: Record<string, boolean>;
}

export type EventType =
  | 'org'
  | 'reminder'
  | 'call'
  | 'wedding'
  | 'memorial'
  | 'anniversary'
  | 'bday'
  | 'custom';

export type EventPriority = 'red' | 'orange' | 'green';

export interface OrgEvent {
  id: Id;
  title: string;
  date: IsoDate;
  time: TimeHM;
  type: EventType;
  /** שם סוג מותאם (type==='custom'). */
  customType: string;
  notes: string;
  price: number;
  roomId: Id | '';
  /** קישור למשפחה (אזכרה/שמחה/תזכורת). */
  famId: Id | '';
  /** קישור לתומכ/ת (תזכורת מעקב עי"ן) — לניקוי מדורג במחיקת תומך. */
  spId?: Id;
  priority: EventPriority;
  done: boolean;
}

/** אירועים החוזרים שנתית לפי התאריך העברי. */
export const HEBREW_RECURRING: ReadonlySet<EventType> = new Set([
  'memorial',
  'anniversary',
  'bday',
] as EventType[]);

export interface Donation {
  /** מספר אסמכתה D-{donationSeq} — רציף לכל קבלות התרומה. */
  rid: string;
  date: IsoDate;
  amount: number;
  cur: '₪' | '$';
  cat: string;
}

/**
 * מעקב טיפול רב-שלבי (feature key supporters.ayin) — תהליך גנרי הניתן
 * לשינוי-שם מלא דרך מילון המונחים (nav.ayin / entity.ayinItem / entity.ayinUnit
 * ותוויות השלבים ayin.stage.*). מפתחות השלבים הפנימיים קבועים; רק התצוגה משתנה.
 */
export type AyinStage = 'new' | 'lead' | 'eyes' | 'answer' | 'done';

/** פריט למעקב — שם + מונה (eyes) + סימון שהטיפול בפריט בוצע. */
export interface AyinName {
  id: Id;
  name: string;
  /** מונה ('' = לא נרשם עדיין). */
  eyes: number | '';
  done: boolean;
}

/** תשובה/הערה מתוארכת בתהליך הטיפול. */
export interface AyinAnswer {
  date: IsoDate;
  note: string;
}

/** רשומת היסטוריה של מונה (eyes) לפי תאריך. */
export interface AyinLog {
  date: IsoDate;
  eyes: number;
  name?: string;
}

/** תיק טיפול פר-תומכ/ת — נשאר undefined עד השימוש הראשון. */
export interface AyinCase {
  stage: AyinStage;
  note: string;
  answeredNote: string;
  /**
   * "שולם" ברמת התיק (לא פר-שם) — כך בלגאסי במפורש: ייבוא ay.paid=u.paid
   * (legacy:990) וייצוא a.paid פר-תיק (legacy:197). אופציונלי, אין מיגרציה.
   */
  paid?: boolean;
  answerPushed: boolean;
  nextTalk: IsoDate;
  nextTalkTime: TimeHM;
  lastTouch: IsoDate;
  names: AyinName[];
  answers: AyinAnswer[];
  log: AyinLog[];
  /**
   * מזהי אירועי-הלוח שנוצרו במעברי-השלב, לפי שלב-המקור של המעבר
   * ('new'/'lead'/'eyes'/'answer') + 'answerPush' (מעבר הדחיפה). מאפשר ל-revert
   * למחוק את האירועים של המעברים המבוטלים, כך שלא יישארו יתומים ו-re-advance
   * לא ייצור כפילות. undefined בתיקים ישנים (מטופל כ-{}).
   */
  boardEventIds?: Partial<Record<string, Id>>;
}

export interface Supporter {
  id: Id;
  name: string;
  phone: string;
  email: string;
  address: string;
  /** עיר (P2 פער 23 — עמודת הדוח המותאם המלא; אופציונלי, אין מיגרציה). */
  city?: string;
  idNum: string;
  cat: string;
  /** ייעוד התרומה. */
  forWho: string;
  notes: string;
  /** מספר תרומות מצטבר. */
  count: number;
  /** סכומים מצטברים. */
  ils: number;
  usd: number;
  first: IsoDate | '';
  last: IsoDate | '';
  /** יעד קשר הבא. */
  nextDate: IsoDate | '';
  /** אירוע 'שיחה' שנוצר אוטומטית ביומן. */
  nextEventId?: Id;
  donations: Donation[];
  /** תרומות מהקובץ ההיסטורי (לגאסי hist) — לא קבלות; מוצג בכרטיס התומכת. */
  hist?: { d: IsoDate; a: number; c?: '₪' | '$' }[];
  /** תיק מעקב טיפול רב-שלבי (feature supporters.ayin) — אופציונלי. */
  ayin?: AyinCase;
}

/** תיק טיפול ריק — נוצר בשימוש הראשון בכרטיס/לוח. */
export function emptyAyin(): AyinCase {
  return {
    stage: 'new',
    note: '',
    answeredNote: '',
    answerPushed: false,
    nextTalk: '',
    nextTalkTime: '',
    lastTouch: '',
    names: [],
    answers: [],
    log: [],
  };
}

export interface NotifPrefs {
  email: boolean;
  push: boolean;
  sms: boolean;
  strong: boolean;
}

export interface ReportPrefs {
  daily: boolean;
  weekly: boolean;
  monthly: boolean;
  quarterly: boolean;
}

export interface UiPrefs {
  famView: 'list' | 'grid';
  crsView: 'list' | 'grid';
  /** פריסת לוח הבית: מזהי ווידג'טים בסדר תצוגה (ריק = ברירת המחדל). */
  homeLayout?: string[];
  /** ערכת נושא נבחרת (or-rishon/heichal/tsohar/kehila) — ריק = לפי קונפיגורציית הארגון. */
  theme?: string;
  /** דריסת צבע הדגשה (hex) — ריק = צבע הערכה. */
  accent?: string;
}

/* ---------- קופות צדקה (מודול tzedaka — מבודד; BUILD-ORDER-TZEDAKA-2026-07-30) ---------- */

/** רישום שינוי ניקוד של רכז/ת (גיימיפיקציה) — דפוס CredLogEntry. */
export interface TzScoreEntry {
  date: IsoDate;
  delta: number;
  reason: string;
}

/** רכז/ת קופות — ילד/ה או הורה. קישור לבן-משפחה קיים = רשות. */
export interface TzCoordinator {
  id: Id;
  name: string;
  famId: Id | '';
  memberId: Id | '';
  phone: string;
  notes: string;
  active: boolean;
  startDate: IsoDate | '';
  /** ניקוד גיימיפיקציה — מתחיל 0, רק המודול כותב אליו. */
  score: number;
  scoreLog: TzScoreEntry[];
}

/** ריקון קופה — הכסף נרשם כאן בלבד (מבודד מקבלות/תרומות/דוחות — הכרעת בעלים 30.7). */
export interface TzCollection {
  id: Id;
  date: IsoDate;
  /** ₪ שלמים, כמו בכל המערכת. */
  amount: number;
  campaignId: Id | '';
  note: string;
}

/** home=אצל משפחה · office=במשרד · lost=אבדה · retired=הוצאה משימוש. */
export type TzBoxStatus = 'home' | 'office' | 'lost' | 'retired';

export interface TzBox {
  id: Id;
  /** המספר הפיזי המודבק על הקופה. */
  num: string;
  coordinatorId: Id;
  /** המשפחה המחזיקה (רשות — קופה יכולה לשבת במשרד). */
  famId: Id | '';
  holderKind: 'donor' | 'supported' | '';
  since: IsoDate | '';
  status: TzBoxStatus;
  notes: string;
  collections: TzCollection[];
}

export interface TzCampaign {
  id: Id;
  name: string;
  start: IsoDate;
  end: IsoDate | '';
  /** יעד בש"ח — 0 = אין יעד. */
  goal: number;
  active: boolean;
  notes: string;
}

/** אירוע הלוח הייעודי — לא נשמר ב-db.events ולא מופיע בלוח הראשי (בידוד). */
export interface TzEvent {
  id: Id;
  title: string;
  date: IsoDate;
  time: TimeHM | '';
  /** round=סבב ריקון · campaign=מבצע · reminder=תזכורת · custom=אחר. */
  kind: 'round' | 'campaign' | 'reminder' | 'custom';
  coordinatorId: Id | '';
  boxId: Id | '';
  notes: string;
  done: boolean;
}

/* ---------- חנות מוצרי-שירות (מודול shop — מבודד; BUILD-ORDER-SHOP-2026-07-30) ---------- */

/** סוג רכיב במוצר: פגישת ליווי · קופון לחנות שותפה · מתנה · מתנת-חג (מחזורית). */
export type ShopComponentKind = 'meeting' | 'coupon' | 'gift' | 'holidayGift';

/** פריט קטלוג עצמאי — בעל המלאי/התוקף/החנות. משותף בין חבילות (הכרעה 18). */
export interface ShopItem {
  id: Id;
  name: string;
  kind: ShopComponentKind;
  /** חנות שותפה (kind==='coupon'). */
  storeId: Id | '';
  value: number;
  basePrice: number;
  /** מלאי משותף — undefined = ללא מעקב. */
  stock?: number;
  /** מלאי מינימום — מתחתיו נדלקת התרעת "להצטייד" (restock ב-needsCare). */
  minStock?: number;
  /** ימי תוקף (kind==='coupon'). */
  validDays?: number;
  /** חגים נבחרים למתנת-חג (kind==='holidayGift') — ריק/חסר = כל החגים (תאימות אחורה). */
  holidays?: string[];
  /** רשימת המתנה (SHOP6) — משפחות שממתינות כשהמלאי אזל; חסר = אין ממתינים. */
  waits?: { famId: Id; date: IsoDate; note: string }[];
  active: boolean;
  notes: string;
}

/**
 * רכיב בתוך חבילה — מצביע לפריט (SHOP4, הכרעה 18): מקורות האמת
 * (שם/סוג/מלאי/תוקף/חנות) בפריט; value/basePrice כאן = דריסה רשות
 * פר-חבילה. label/storeId/stock/validDays נשארים לתאימות-מיגרציה בלבד.
 */
export interface ShopComponent {
  id: Id;
  /** הפריט שהרכיב מצביע עליו — ריק רק בנתונים טרום-מיגרציה. */
  itemId: Id;
  kind: ShopComponentKind;
  label: string;
  /** תאימות-מיגרציה — מקור האמת בפריט. */
  storeId: Id | '';
  /** דריסת שווי פר-חבילה (רשות; ברירת המחדל מהפריט). */
  value?: number;
  /** דריסת מחיר סמלי פר-חבילה (רשות; ברירת המחדל מהפריט). */
  basePrice?: number;
  stock?: number;
  validDays?: number;
  notes: string;
}

/** קליטת מלאי — קנייה או תרומה-בעין. המלאי על הפריט עולה אטומית עם הרישום. */
export interface ShopIntake {
  id: Id;
  itemId: Id;
  date: IsoDate;
  qty: number;
  kind: 'buy' | 'donation';
  /** מי תרם / היכן נקנה — טקסט חופשי (בלי קישור לתורמים — בידוד). */
  source: string;
  /** עלות כוללת בש"ח — 0 בתרומה. */
  cost: number;
  note: string;
}

/** מוצר בקטלוג — חבילת שירות שלמה ("מוצר חתן", "מוצר כלה"). */
export interface ShopProduct {
  id: Id;
  name: string;
  desc: string;
  img?: string;
  active: boolean;
  components: ShopComponent[];
  notes: string;
}

/** חנות שותפה — הקופונים ממומשים אצלה. */
export interface ShopStore {
  id: Id;
  name: string;
  contact: string;
  phone: string;
  active: boolean;
  notes: string;
}

/** קריטריון זכאות ("יתום מאם") — discountPct 0-100 על המחיר הסמלי. */
export interface ShopCriterion {
  id: Id;
  name: string;
  discountPct: number;
  notes: string;
}

/** מימוש רכיב: paid=מה שולם בפועל; value=שווי שנמסר; holiday=שם החג (למתנת-חג). */
export interface ShopRedemption {
  id: Id;
  /** אישור תשלום S-{shopReceiptSeq} — מונפק רק כש-paid>0; אינו קבלת מס. */
  rid?: string;
  /** ביטול מתועד — המספר S- נשאר בסדרה; מבוטל מוחרג מכל הסכומים והמלאי. */
  voidedAt?: IsoDate;
  voidReason?: string;
  componentId: Id;
  date: IsoDate;
  holiday: string;
  paid: number;
  value: number;
  note: string;
}

export type ShopAssignmentStatus = 'active' | 'done' | 'stopped';

/** שיוך מוצר למוטב — משפחה, ואופציונלית בן/בת משפחה ספציפי/ת (חתן/כלה). */
export interface ShopAssignment {
  id: Id;
  productId: Id;
  famId: Id;
  memberId: Id | '';
  /** קריטריוני הזכאות של המוטב (מזהי ShopCriterion). */
  criterionIds: Id[];
  since: IsoDate | '';
  status: ShopAssignmentStatus;
  notes: string;
  redemptions: ShopRedemption[];
}

/**
 * אירוע הלוח הייעודי — לא ב-db.events, לא בלוח הראשי (בידוד).
 * חריג מבוקר (SHOP4, הכרעת בעלים 16): פגישה-עם-חדר יוצרת OrgEvent מקושר
 * בלוח הראשי (mainEventId — דפוס dueEventId/nextEventId) לתפיסת חדר
 * דו-כיוונית; הכסף נשאר מבודד לחלוטין.
 */
export interface ShopEvent {
  id: Id;
  title: string;
  date: IsoDate;
  time: TimeHM | '';
  /** meeting=פגישה · delivery=מסירה · holiday=חג · custom=אחר. */
  kind: 'meeting' | 'delivery' | 'holiday' | 'custom';
  assignmentId: Id | '';
  /** חדר לפגישה (kind==='meeting') — מפעיל את החריג המבוקר. */
  roomId?: Id;
  /** האירוע המקושר בלוח הראשי — קיים רק לפגישה-עם-חדר. */
  mainEventId?: Id;
  notes: string;
  done: boolean;
}

/** מסמך ה-DB המלא — יחידת השמירה, הייצוא והגיבוי (18 מערכי ישויות). */
export interface Db {
  /** גרסת סכמה — העלאה מחייבת מיגרציה ב-store/persist.ts. */
  v: number;
  savedAt: string;
  /** מונה מזהים משותף לכל הישויות. */
  seq: number;
  /** מונה קבלות חוגים (R-) — רציף ונפרד מ-seq, כנדרש לקבלות מס. */
  receiptSeq: number;
  /** מונה קבלות תרומה (D-) — רציף ונפרד מ-seq, כנדרש לקבלות מס. */
  donationSeq: number;
  /** מונה אישורי תשלום סמלי בחנות (S-) — רציף ונפרד; אינו קבלת מס. */
  shopReceiptSeq: number;
  families: Family[];
  enrollments: Enrollment[];
  courses: Course[];
  events: OrgEvent[];
  rooms: Room[];
  teachers: Teacher[];
  supporters: Supporter[];
  /** קופות צדקה (מודול tzedaka — מבודד). */
  tzCoordinators: TzCoordinator[];
  tzBoxes: TzBox[];
  tzCampaigns: TzCampaign[];
  tzEvents: TzEvent[];
  /** חנות מוצרי-שירות (מודול shop — מבודד). */
  shopItems: ShopItem[];
  shopProducts: ShopProduct[];
  shopStores: ShopStore[];
  shopCriteria: ShopCriterion[];
  shopAssignments: ShopAssignment[];
  shopEvents: ShopEvent[];
  /** יומן קליטות מלאי (SHOP6) — קנייה/תרומה-בעין; לא סדרת מס. */
  shopIntakes: ShopIntake[];
  orgName: string;
  orgSite: string;
  orgDonate: string;
  /** יעד גיוס שנתי בש"ח — 0 = לא הוגדר (קיר ההשפעה מציג סכום בלבד). */
  orgGoal: number;
  notif: NotifPrefs;
  reports: ReportPrefs;
  ui: UiPrefs;
  /** פריטי "דורש טיפול" שסומנו כטופלו — מפתח פריט → תאריך הסימון (ISO). */
  attnDone: Record<string, string>;
  /** נעילת גישה — קודים מגובבים (לא טקסט גלוי). ריק = אין נעילה. */
  security: SecurityCfg;
}

/**
 * נעילה דו-שכבתית:
 * - primary: קוד כניסה לכל המערכת.
 * - secondary: קוד "מנהל" נוסף המגן על אזורים רגישים (zones).
 * הקודים נשמרים מגובבים (SHA-256). הגנת-גישה מפני עיון מזדמן — לא הצפנת נתונים.
 */
export interface SecurityCfg {
  primary?: string;
  secondary?: string;
  /** מפתחות האזורים שהנעילה המשנית מגנה עליהם (ראה lib/lock). */
  zones?: string[];
}

export const DB_VERSION = 5;

export function emptyDb(): Db {
  return {
    v: DB_VERSION,
    savedAt: new Date().toISOString(),
    seq: 100,
    receiptSeq: 1,
    donationSeq: 1,
    shopReceiptSeq: 1,
    families: [],
    enrollments: [],
    courses: [],
    events: [],
    rooms: [],
    teachers: [],
    supporters: [],
    tzCoordinators: [],
    tzBoxes: [],
    tzCampaigns: [],
    tzEvents: [],
    shopItems: [],
    shopProducts: [],
    shopStores: [],
    shopCriteria: [],
    shopAssignments: [],
    shopEvents: [],
    shopIntakes: [],
    orgName: 'מאור החסד',
    orgSite: '',
    orgDonate: '',
    orgGoal: 0,
    notif: { email: true, push: false, sms: true, strong: false },
    reports: { daily: true, weekly: true, monthly: false, quarterly: false },
    ui: { famView: 'list', crsView: 'grid' },
    attnDone: {},
    security: {},
  };
}

/** תבניות ריקות לטפסים. */

export function emptyMember(): Omit<Member, 'id'> {
  return {
    first: '',
    gender: 'm',
    birth: '',
    idNum: '',
    phone: '',
    phone2: '',
    school: '',
    grade: '',
    health: '',
    mSefach: false,
    mInvite: false,
    mRecommend: false,
    mPhotos: false,
    mVideos: false,
    notes: '',
  };
}

export function emptyFamily(): Omit<Family, 'id' | 'createdAt'> {
  return {
    name: '',
    father: '',
    fatherId: '',
    mother: '',
    motherId: '',
    phone: '',
    phone2: '',
    email: '',
    city: '',
    address: '',
    community: 'כללי',
    maritalStatus: '',
    language: '',
    tzedaka: '',
    fullSefach: false,
    discount: '',
    status: 'active',
    notes: '',
    members: [],
    docs: [],
    cred: { score: 700, log: [] },
  };
}
