/**
 * מודל הנתונים של מערכת "מאור החסד".
 * כל הישויות נשמרות יחד במסמך DB אחד (ראו store/persist.ts) עם גרסת סכמה.
 */

/** מזהה ייחודי — מחרוזת עם קידומת לפי סוג הישות (f/m/c/e/ev/t/r/sp). */
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

export type PricingModel = 'monthly' | 'punch';

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
  /** מספר קבלה R-{seq}. */
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
  /** מספר אסמכתה D-{seq}. */
  rid: string;
  date: IsoDate;
  amount: number;
  cur: '₪' | '$';
  cat: string;
}

export interface Supporter {
  id: Id;
  name: string;
  phone: string;
  email: string;
  address: string;
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

/** מסמך ה-DB המלא — יחידת השמירה, הייצוא והגיבוי. */
export interface Db {
  /** גרסת סכמה — העלאה מחייבת מיגרציה ב-store/persist.ts. */
  v: number;
  savedAt: string;
  /** מונה מזהים משותף לכל הישויות. */
  seq: number;
  families: Family[];
  enrollments: Enrollment[];
  courses: Course[];
  events: OrgEvent[];
  rooms: Room[];
  teachers: Teacher[];
  supporters: Supporter[];
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
}

export const DB_VERSION = 2;

export function emptyDb(): Db {
  return {
    v: DB_VERSION,
    savedAt: new Date().toISOString(),
    seq: 100,
    families: [],
    enrollments: [],
    courses: [],
    events: [],
    rooms: [],
    teachers: [],
    supporters: [],
    orgName: 'מאור החסד',
    orgSite: '',
    orgDonate: '',
    orgGoal: 0,
    notif: { email: true, push: false, sms: true, strong: false },
    reports: { daily: true, weekly: true, monthly: false, quarterly: false },
    ui: { famView: 'list', crsView: 'grid' },
    attnDone: {},
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
