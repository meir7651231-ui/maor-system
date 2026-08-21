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

/**
 * צירוף קובץ לחוג (בקשת-בעלים 13.8 א'): מסמך / תמונה / קישור לסרטון.
 * additive — חסר = ביט-זהה לחוג ישן. אחסון local-first:
 *  - 'image' / 'file' ⇒ data URL מוטמע ב-DB (עם תקרת-גודל, כמו img).
 *  - 'link' ⇒ https URL חיצוני (Drive/YouTube וכו') — לסרטונים כבדים.
 */
export interface CourseFile {
  id: Id;
  name: string;
  kind: 'image' | 'file' | 'link';
  /** data URL (image/file) או https URL (link). */
  data: string;
  /** סוג MIME לקבצים מוטמעים (image/file); ריק לקישור. */
  mime?: string;
  /** גודל בבייטים לקובץ מוטמע (לתצוגה). */
  size?: number;
}

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
  /** רמת-הנחה שלישית (בקשת-בעלים 19.8 פריט ו') — אופציונלי, additive, אין מיגרציה. */
  price3?: number;
  price3Name?: string;
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
  /** צירופים לחוג — מסמכים/תמונות/קישורים (בקשת-בעלים 13.8 א'). */
  files?: CourseFile[];
  /**
   * תמחור פר-שיעור (בקשת-בעלים 13.8 ב'): כשדלוק, המחיר מחושב לפי מחיר-לשיעור
   * × תדירות × מספר-שיעורים-בתקופה (משוקלל). כבוי/חסר = מודל שטוח כמו היום
   * (price + model) — ביט-זהה לחוג ישן.
   */
  perLesson?: boolean;
  /** מחיר לשיעור בודד (מלא). */
  lessonPrice?: number;
  /** מחיר-לשיעור ברמת-הנחה 1 (price1Name); חסר/0 = בלי הנחה בתמחור פר-שיעור. */
  lessonPrice1?: number;
  /** מחיר-לשיעור ברמת-הנחה 2 (price2Name). */
  lessonPrice2?: number;
  /** מחיר-לשיעור ברמת-הנחה 3 (price3Name). */
  lessonPrice3?: number;
}

export interface Absence {
  date: IsoDate;
  reason: string;
  /** זכאי/ת להשלמה (נגזר מ-makeupEligibility). */
  makeup?: boolean;
  /** תאריך-השלמה שתוזמן בפועל (additive; ריק = טרם-תוזמן). יוצר תזכורת-לוח. */
  makeupDate?: IsoDate;
  /** לא הגיע/ה ללא הודעה. */
  noshow?: boolean;
  /**
   * חיסור מוצדק (מחלה/אירוע) לעומת רשלנות (#7, הכרעת בעלים "תלוי אם מוצדק או
   * רשלנות"): מוצדק ⇒ זכאי/ת להשלמה והניקוב לא יורד, גם מתחת ל-48 שעות.
   */
  justified?: boolean;
}

export interface Payment {
  /** מספר קבלה R-{receiptSeq} — רציף לכל הקבלות. */
  rid: string;
  date: IsoDate;
  amount: number;
  method: string;
}

export type EnrollmentStatus = 'active' | 'paused' | 'ended' | 'wait';

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
  /**
   * תאריכי-נוכחות שנרשמו (ISO) — יומן פר-מפגש להחלפה (#6: ✓ מוסיף, שנייה מסירה)
   * ולמונה-חודשי (#10). תוספתי: ‏used נשאר מקור-האמת לצריכת-כרטיסייה (כסף);
   * ניקובי-עבר בלי תאריך נשארים ב-used בלבד. חסר/undefined = ריק.
   */
  presents?: IsoDate[];
  payments: Payment[];
  totalDue: number;
  dueDate: IsoDate | '';
  /** אירוע תזכורת תשלום שנוצר אוטומטית ביומן. */
  dueEventId?: Id;
  status: EnrollmentStatus;
  note: string;
  enrolledAt: IsoDate;
  /**
   * תאריך סיום השיבוץ (ISO) — נקבע כשמסמנים 'ended', מתנקה בחידוש (#8). מאפשר
   * לדוח-הנוכחות-ההיסטורי להציג תלמידה שסיימה באמצע-שנה במפגשים שקדמו לסיומה,
   * במקום להעלים אותה רטרואקטיבית. חסר/undefined = שיבוץ ישן שהסתיים בלי תאריך.
   */
  endedAt?: IsoDate;
  /**
   * 💰 סטטוס-תשלום מהיר פר-שיבוץ (בקשת-בעלים 17.8 — "בכל חוג אופציה לתשלום
   * ואופציה כבר שולם"): סימון-סטטוס עצמאי לשימוש-משרד — true=שולם, חסר/false=
   * לתשלום. תוספתי, אין מיגרציה; **אינו נוגע** ב-payments[]/totalDue/קבלות.
   */
  paidFull?: boolean;
  /**
   * תמחור משוקלל פר-שיעור (בקשת-בעלים 13.8 ב', additive): התדירות והתקופה
   * שהלקוח בחר בהרשמה. חסר = שיבוץ ישן/מודל-שטוח (totalDue נשאר כפי שהוקלד).
   */
  freq?: number;
  freqUnit?: 'week' | 'month';
  term?: PricingTerm;
  /** מספר חודשים כאשר term==='months'. */
  termMonths?: number;
  /** רמת-ההנחה שנבחרה: '' = מלא · '1' · '2' (מיפוי ל-lessonPrice1/2). */
  tier?: '' | '1' | '2' | '3';
}

/** תקופת-חיוב לתמחור המשוקלל (בקשת-בעלים 13.8 ב'). */
export type PricingTerm = 'once' | 'weekly' | 'biweekly' | 'monthly' | 'months' | 'half_year' | 'year';

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
  /**
   * פרטי תשלום למורה (additive — חסר/'' = לא הוגדר, ביט-זהה לכרטיס ישן).
   * סגנון התשלום: מזומן / משכורת (תלוש) / צ'ק. השם/טלפון/ת"ז לתשלום = שדות הכרטיס
   * הקיימים (name/phone/idNum); פרטי הבנק נוספים כאן להעברה/משכורת.
   */
  payMethod?: 'cash' | 'salary' | 'check' | '';
  /**
   * התשלום מועבר לחשבון/מוטב אחר (לא המורה) — למשל העברה דרך חשבון של בן/בת-זוג
   * או גמ"ח. כשדלוק, payee* מחזיקים את זהות המוטב האחר; אחרת התשלום = פרטי המורה.
   */
  payToOther?: boolean;
  /** שם בעל החשבון/המוטב לתשלום (כשהתשלום מועבר לאחר). */
  payeeName?: string;
  /** טלפון המוטב האחר. */
  payeePhone?: string;
  /** ת"ז המוטב האחר. */
  payeeIdNum?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccount?: string;
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
  /**
   * ייעוד "אמץ חתן/משפחה" (SHOP9 — הכרעת בעלים: הכסף מחווט לתרומות/קבלות).
   * תרומה מיועדת = קבלת מס אמיתית (D-) עם ייעוד לנהנה. אופציונלי — תרומה
   * רגילה בלי ייעוד לא מושפעת (תאימות-לאחור, אין מיגרציה).
   */
  designation?: string;
  /**
   * ייעוד/"עבודה" (בקשת-בעלים 13.8 ג'): תווית-שיוך של התרומה למיזם/עבודה,
   * המשמשת כמסנן-הרשאה פר-עובד — עובד רואה רק תרומות של הייעודים שהוקצו לו
   * בכרטיס-העובד. נפרד מ-cat (קטגוריה) ומ-designation (אמץ חתן). ריק = לא-משויך
   * (גלוי לכולם). additive — תרומה ישנה בלי purpose לא מושפעת.
   */
  purpose?: string;
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
  /**
   * מחיר-יחידה לשורת כתב-כמויות (BOQ) — אופציונלי, additive, אין מיגרציה.
   * סכום-השורה = eyes × rate; משמש רק בורטיקל מסחרי (הצעת-מחיר מפורטת),
   * מגודר supporters.ayin.boq + הקשר-מסחרי. בעמותה (חסד) נשאר undefined ולא מוצג.
   */
  rate?: number;
  /** הערת-טקסט חופשית ליד המונה (בקשת-בעלים 19.8) — אופציונלי, additive, אין מיגרציה. */
  note?: string;
  /**
   * תזמון-משימה לגאנט-התלויות (ורטיקל מסחרי): משך בימים + מזהי-שורות-קודמות
   * (תלויות "אחרי"). additive, אופציונלי, אין מיגרציה; מגודר supporters.ayin.gantt.
   * חסר ⇒ המשימה לא-מתוזמנת (לא מוצגת בגאנט). בעמותה נשאר undefined.
   */
  days?: number;
  deps?: Id[];
}

/** פריט ערכת-התקנה/מסירה (install-kit) על פרויקט — צ'ק-ליסט מסירה. additive. */
export interface KitItem {
  label: string;
  done: boolean;
}

/**
 * פריט-מלאי במחסן חוצה-פרויקטים (ורטיקל-הסטודיו). המחסן עצמאי; הצריכה מחושבת
 * כנגזרת מרשומות-החומרים (MatEntry) של הפרויקטים לפי התאמת-שם. additive, ורטיקל
 * מסחרי בלבד (מגודר supporters.ayin.warehouse). לא נוגע בכסף/קבלות.
 */
export interface WarehouseItem {
  id: Id;
  name: string;
  /** יחידת-מידה חופשית (יח׳ / מ׳ / ק"ג …). */
  unit: string;
  /** מלאי-במחסן (כמות). */
  qty: number;
  /** מחיר-יחידה (לעלות-מלאי; אופציונלי). */
  cost: number;
}

/** תשובה/הערה מתוארכת בתהליך הטיפול. */
export interface AyinAnswer {
  date: IsoDate;
  note: string;
}

/**
 * רשומת-שעתון על תיק (פרויקט) — תיוג-שעות לחישוב עלות-עבודה ב-P&L. additive,
 * אופציונלי, אין מיגרציה; ורטיקל מסחרי בלבד (מגודר supporters.ayin.time).
 */
export interface TimeEntry {
  date: IsoDate;
  hours: number;
  note: string;
  /** תעריף-שעה (אופציונלי) — עלות-השורה = hours × rate. */
  rate?: number;
}

/**
 * רשומת-חומרים/רכש על תיק (פרויקט) — עלות-חומרים ל-P&L (job-costing). additive,
 * אופציונלי, אין מיגרציה; ורטיקל מסחרי בלבד (מגודר supporters.ayin.mat).
 * עלות-השורה = qty × cost (מחיר-יחידה).
 */
export interface MatEntry {
  name: string;
  qty: number;
  cost: number;
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
  /** שעתון-הפרויקט (תיוג-שעות) — additive, ורטיקל מסחרי; undefined בתיקים ישנים. */
  time?: TimeEntry[];
  /** חומרים/רכש של הפרויקט — additive, ורטיקל מסחרי; undefined בתיקים ישנים. */
  mat?: MatEntry[];
  /** ערכת-התקנה/מסירה (install-kit) — צ'ק-ליסט מסירה; additive, ורטיקל מסחרי. */
  kit?: KitItem[];
  /**
   * מזהי אירועי-הלוח שנוצרו במעברי-השלב, לפי שלב-המקור של המעבר
   * ('new'/'lead'/'eyes'/'answer') + 'answerPush' (מעבר הדחיפה). מאפשר ל-revert
   * למחוק את האירועים של המעברים המבוטלים, כך שלא יישארו יתומים ו-re-advance
   * לא ייצור כפילות. undefined בתיקים ישנים (מטופל כ-{}).
   */
  boardEventIds?: Partial<Record<string, Id>>;
}

/** הוראת-קבע של תומך/ת — הגדרה בלבד; אין חיוב-כרטיסים במערכת (רגולציה). */
export interface Hok {
  amount: number;
  cur: '₪' | '$';
  /** יום-החיוב בחודש (1–28 — כך קיים בכל חודש). */
  day: number;
  /** אמצעי: bank / card / cash / other — טקסט חופשי-מוגבל לתצוגה. */
  method: string;
  note: string;
  active: boolean;
  startedAt: IsoDate;
  /** מזהה-הו"ק של הסליקה (נדרים kevaId) — מסמן הו"ק **מנוהל-סליקה** (מולא
   *  אוטומטית מחיוב-נדרים חוזר). חסר = הו"ק ידני של המשרד (לא נדרס אוטומטית). */
  kevaId?: string;
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
  /** מזהה-חיצוני של ספק-סליקה (נדרים-פלוס ToremId וכד') — additive, אין מיגרציה.
   *  מפתח-שיוך חזק לזיהוי-כפילות ולסנכרון-חוזר (100% התאמה מול הספק). */
  extId?: string;
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
  /** על מה לדבר בפעם הבאה — תזכורת-אג'נדה חופשית (additive; מוצג בקוקפיט/חייגן). */
  nextNote?: string;
  /** אירוע 'שיחה' שנוצר אוטומטית ביומן. */
  nextEventId?: Id;
  donations: Donation[];
  /** תרומות מהקובץ ההיסטורי (לגאסי hist) — לא קבלות; מוצג בכרטיס התומכת.
   *  ‏13.8: מטא-דאטה של עסקת-הסליקה (כל השדות אופציונליים, additive) — נקלטים
   *  מיצוא "היסטוריית חיובים": אסמכתא/מס'-עסקה/מס'-קבלה/מותג/4-ספרות/סולק/
   *  תשלומים/סטטוס. משמשים לתצוגה + זיהוי-כפילות (מס'-עסקה ייחודי). */
  hist?: {
    d: IsoDate;
    a: number;
    c?: '₪' | '$';
    ref?: string; // אסמכתא
    txn?: string; // מספר עסקה (ייחודי)
    receipt?: string; // מספר קבלה (מהסליקה)
    brand?: string; // מותג הכרטיס (ויזה/מסטרכרד)
    last4?: string; // 4 ספרות אחרונות
    clearer?: string; // חברה סולקת
    pays?: number; // מספר תשלומים
    status?: string; // סטטוס (אושר/נדחה)
    kevaId?: string; // מזהה-הו"ק של הסליקה (נדרים) — חיוב חוזר (additive)
  }[];
  /**
   * הוראת-קבע (ROADMAP-100 ‏#2 צד-מערכת, 5.8.2026) — additive: המעקב והרישום
   * במערכת; החיוב עצמו אצל חברת-הסליקה/הבנק. הרישום-בפועל = תרומה רגילה
   * (addDonation, קבלה בסדרה הרציפה) עם קטגוריית HOK_CAT.
   */
  hok?: Hok;
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
    time: [],
    mat: [],
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

/**
 * תבנית-הצעה (למידה מ-BuildSmart: DraftQuote + projectTemplates) — סט שורות-הצעה
 * (שם·כמות·מחיר) נשמר לשימוש-חוזר, מוחל על פרויקט בקליק. additive, ורטיקל מסחרי.
 */
export interface QuoteTemplate {
  id: Id;
  name: string;
  lines: { name: string; qty: number; rate: number }[];
}

/**
 * חייגן-מונחה (assisted dialer) — קמפיין-שיחות downstream על הטלפונים הקיימים:
 * המערכת מנהלת רשימה/תור/סיווג, בן-אדם לוחץ 📞 (tel:), מסמן תוצאה, המערכת
 * מתקדמת ומחזירה-לתור מי-שלא-ענה. additive ב-db.ui (בלי DB_VERSION bump).
 * ריצה-אמיתית של חיוג-אוטומטי/הקלטה = נהג-קופסה עתידי (telephony/driver).
 */
export type DialOutcome = 'donated' | 'noanswer' | 'refused' | 'callback' | 'done' | 'skip';

export interface DialLogEntry {
  id: Id;
  outcome: DialOutcome;
  note?: string;
  at: string;
}

export interface DialerCampaign {
  name: string;
  startedAt: string;
  /** תור-הפנייה: מזהי-תומכים ממתינים, לפי סדר; החזית = הנוכחי. */
  queue: Id[];
  /** מספר-המזהים הייחודיים בקמפיין המקורי (למד-התקדמות). */
  total: number;
  /** יומן-תוצאות מלא (כולל חוזרים על מי-שלא-ענה). */
  log: DialLogEntry[];
}

export interface UiPrefs {
  famView: 'list' | 'grid';
  crsView: 'list' | 'grid';
  /** תבניות-הצעה שמורות (BuildSmart-learned) — additive, חסר = אין. */
  quoteTemplates?: QuoteTemplate[];
  /** תצוגת התורמים (5.8) — אופציונלי, חסר = 'list' (אין צורך במיגרציה). */
  supView?: 'list' | 'grid';
  /** פורמט הקבלה (5.5d, הכרעת-בעלים 9.8: הלקוח בוחר) — חסר = 'txt' (ביט-זהה). */
  receiptFmt?: 'txt' | 'pdf';
  /** פריסת לוח הבית: מזהי ווידג'טים בסדר תצוגה (ריק = ברירת המחדל). */
  homeLayout?: string[];
  /** ערכת נושא נבחרת (or-rishon/heichal/tsohar/kehila) — ריק = לפי קונפיגורציית הארגון. */
  theme?: string;
  /** דריסת צבע הדגשה (hex) — ריק = צבע הערכה. */
  accent?: string;
  /** קמפיין חייגן-מונחה פעיל — חסר = אין קמפיין (ביט-זהה להיום). */
  dialer?: DialerCampaign;
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
  /** תאריך תפוגה לאצווה (SHOP10 — מתכלה). אופציונלי; ריק = לא-מתכלה. */
  expiry?: IsoDate;
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

/**
 * מודול מתנדבים · יום-חלוקה · מסירות (SHOP7 — מבודד ככמו tzedaka/shop).
 * הכרעות-בעלים: משפחות→מתנדב ישירות · מעקב **קדימה** · מתנדב = ישות עצמאית ·
 * הקלט = shopAssignments הקיימים (המסירה מצביעה עליהם, לא משכפלת). אפס כסף/S-.
 */
export interface Volunteer {
  id: Id;
  name: string;
  phone: string;
  /** אזור-חלוקה חופשי (רמז, לא-חוסם). */
  area?: string;
  /** קיבולת רכה — רמז בשיוך, לא מסנן. */
  maxDeliveries?: number;
  active: boolean;
  note: string;
  createdAt: IsoDate;
}

/** סטטוס מסירה — מכונה לינארית קדימה בלבד; delivered = סופי. */
/**
 * 📋 משימת-עבודה (WORKPREP, 20.8, בקשת-בעלים "המנהל מכין לעובד את העבודה"):
 * המנהל משבץ ⇒ הסנכרון מזרים ⇒ העובדת רואה ב"המשימות שלי" ומסמנת ✓.
 * additive — מסמכים ישנים בלי המערך מרופאים ב-migrate.
 */
export interface WorkTask {
  id: string;
  /** מייל-העובדת המשובצת (lowercase); 'מקומי' בארגון בלי ענן. */
  assignee: string;
  /** מי ששיבץ (מייל-המנהל / 'מקומי'). */
  by: string;
  /** מה לעשות — נוסח חופשי. */
  title: string;
  /** עוגן-ישות אופציונלי — קפיצה-לכרטיס מהמשימה. */
  ref?: { kind: 'supporter' | 'family' | 'course'; id: string };
  /** עדיפות: 1=דחוף · 2=רגיל · 3=בהמשך. */
  pri: 1 | 2 | 3;
  /** תאריך-יעד ISO (יום) — ריק = בלי יעד. */
  due?: string;
  /** חותמת-יצירה ISO מלאה. */
  createdAt: string;
  /** חותמת-ביצוע ISO מלאה — ריק/חסר = פתוחה. */
  doneAt?: string;
  /** הערת-העובדת בביצוע. */
  note?: string;
}

export type DeliveryStatus = 'pickup' | 'enroute' | 'delivered';

export interface Delivery {
  id: Id;
  /** ליום-החלוקה. */
  dayId: Id;
  /** ל-ShopAssignment (SHOP6) — הקלט; המסירה לא משכפלת אותו. */
  assignmentId: Id;
  /** המתנדב המוסר. */
  volunteerId: Id;
  /** נגזר ל-נוחות-תצוגה (המשפחה של ה-assignment). */
  familyId: Id;
  status: DeliveryStatus;
  /** חותמת מסירה (נקבע במעבר ל-delivered). */
  deliveredAt?: IsoDate;
  note: string;
  /** חתימת-מקבל/ת על-מסך (גל ג׳, הרחבת esign) — dataURL JPEG קטן; אופציונלי. */
  signature?: string;
}

export interface DistributionDay {
  id: Id;
  date: IsoDate;
  title: string;
  note: string;
  closed: boolean;
  createdAt: IsoDate;
}

/** מסמך ה-DB המלא — יחידת השמירה, הייצוא והגיבוי (21 מערכי ישויות). */
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
  /** מתנדבים · ימי-חלוקה · מסירות (SHOP7 — מבודד; מעקב קדימה). */
  volunteers: Volunteer[];
  distributionDays: DistributionDay[];
  deliveries: Delivery[];
  /** 📋 משימות-עבודה (WORKPREP, 20.8) — המנהל מכין תור פר-עובד/ת; הישות ה-22. */
  tasks: WorkTask[];
  /** 🏭 מלאי-מחסן חוצה-פרויקטים (ורטיקל-הסטודיו) — הישות ה-23; מסחרי, additive. */
  warehouse: WarehouseItem[];
  orgName: string;
  orgSite: string;
  orgDonate: string;
  /** יעד גיוס שנתי בש"ח — 0 = לא הוגדר (קיר ההשפעה מציג סכום בלבד). */
  orgGoal: number;
  /**
   * יעד-תקציב סיוע בש"ח (SHOP9 back-office) — תקרת-הסבסוד שהעמותה מוכנה לספוג.
   * 0 = לא הוגדר (מבט-ההנהלה מציג את הסבסוד בלבד). ניתן לשינוי בכל זמן.
   */
  budget: number;
  /** שער דולר→שקל להמרת תרומות $ (ברירת-מחדל 3.7). עריך בהגדרות, מתעדכן בכל החישובים. */
  usdRate: number;
  notif: NotifPrefs;
  reports: ReportPrefs;
  ui: UiPrefs;
  /** פריטי "דורש טיפול" שסומנו כטופלו — מפתח פריט → תאריך הסימון (ISO). */
  attnDone: Record<string, string>;
  /** נעילת גישה — קודים מגובבים (לא טקסט גלוי). ריק = אין נעילה. */
  security: SecurityCfg;
  /**
   * לוג-פעולות (ROADMAP-100 ‏#10, additive) — מי-שינה-מה-ומתי; טבעת חצובת-תקרה
   * (AUDIT_CAP): הוותיק נדחק. אופציונלי — גיבוי ישן בלי השדה נטען עם [].
   */
  audit?: AuditEntry[];
}

/** רשומת-audit אחת — קצרה במכוון (הלוג רוכב על meta בסנכרון-הענן). */
export interface AuditEntry {
  /** חותמת ISO מלאה (תאריך+שעה). */
  at: string;
  /** מייל-המשתמש המחובר, או 'מקומי' בלי ענן. */
  who: string;
  /** הפעולה (עברית קצרה): 'תרומה', 'מחיקת משפחה'… */
  act: string;
  /** זיהוי-היעד: שם/מספר-קבלה/כותרת. */
  what: string;
}

/** תקרת-הלוג — טבעת: מעבר לתקרה דוחק את הוותיקות. */
export const AUDIT_CAP = 500;

/** דחיפה לטבעת-הלוג (טהור) — הוותיקות נדחקות מעבר ל-AUDIT_CAP. */
export function pushAudit(list: AuditEntry[] | undefined, entry: AuditEntry): AuditEntry[] {
  return [...(list ?? []), entry].slice(-AUDIT_CAP);
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

export const DB_VERSION = 6;

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
    volunteers: [],
    distributionDays: [],
    deliveries: [],
    tasks: [],
    warehouse: [],
    orgName: 'מאור החסד',
    orgSite: '',
    orgDonate: '',
    orgGoal: 0,
    budget: 0,
    usdRate: 3.7,
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
