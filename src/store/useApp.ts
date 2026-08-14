/**
 * ה-store המרכזי (Zustand) — כל מצב האפליקציה ופעולות העסקים.
 *
 * עקרונות:
 * - אין מוטציה במקום: כל פעולה מחזירה עותקים חדשים (חוזה עם ההתמדה וה-render).
 * - כל שינוי נתונים עובר דרך setDb() שמפעיל שמירה אוטומטית (debounced).
 * - מזהים נוצרים אך ורק דרך nextId().
 */
import { create } from 'zustand';
import {
  emptyAyin,
  emptyDb,
  type Absence,
  type AyinCase,
  type AyinStage,
  type Course,
  type CredLogEntry,
  pushAudit,
  type Db,
  type Donation,
  type Enrollment,
  type Family,
  type Member,
  type OrgEvent,
  type Payment,
  type IsoDate,
  type Room,
  type ShopAssignment,
  type ShopCriterion,
  type ShopEvent,
  type ShopIntake,
  type ShopItem,
  type ShopProduct,
  type ShopRedemption,
  type ShopStore,
  type Supporter,
  type Teacher,
  type TzBox,
  type TzCampaign,
  type TzCoordinator,
  type TzEvent,
  type Volunteer,
  type DistributionDay,
  type Delivery,
} from '../types/domain';
import { collectionScoreDelta } from '../components/tzedaka/lib';
import { assignmentRedeemed, beneficiaryLabel, itemOf, itemRemaining } from '../components/shop/lib';
import { advanceStatus } from '../components/shop7/lib';
import { roomClashError } from '../components/calendar/calLib';
import { allowedDesignationsFor, effectiveConfigFor, isOrgManager, parseJoinFullCode } from '../components/platform/lib';
import type { OrgCloudDoc } from '../lib/cloudConfig';
import { DEFAULT_CONFIG, type FirebaseOrgConfig, type OrgConfig } from '../types/config';
import { applyTheme, employeeSignUpError, featureOn, isSuperAdmin, loadOrgConfig, orgSlugFromUrl, resolveOrgConfig, saveConfigOverride, signUpError, termOf, writeCloudConfigCache } from '../lib/config';
import { formatIsraeliPhone } from '../lib/validate';
import { deviceTag, makeId } from '../lib/ids';
import { supporterAggregates } from '../lib/supporterAgg';
import { mergeFamilies, mergeFamiliesByFields, mergeSupporterInto } from '../lib/dedup';
import { hashPin, DEFAULT_LOCK_ZONES, lockKey, readLock, writeLock, type LockCfg } from '../lib/lock';
import { isoToday as isoTodayLocal, isoLocal } from '../lib/date-util';
import { CRED_RED_THRESHOLD } from '../components/families/lib';
import { pushNav, pushRecent, sameLoc, type NavLoc } from '../lib/navhist';
import { applyAyinSheet, featLabel, planAddName, planAyinAdvance, revertPatch, stageIndex, type AyinSheetUpd } from '../lib/ayin';
import {
  dailySnapshot,
  exportBackupFile,
  loadDb,
  saveDb,
  flushSaveSync,
  isIdbBackupMissing,
  currentDbKey,
  readStoredPlainDb,
  setPersistNamespace,
  decryptAndLoad,
  beginEncryption,
  stopEncryption,
  changeEncryptionPassword as persistChangePw,
} from './persist';
import type { CloudStatus, CloudUser } from './cloudSync';
import { createCloudKey, openCloudKey } from '../lib/cloudCrypto';
import { genRecoveryKey } from '../lib/crypto';

export type View =
  | 'home'
  | 'families'
  | 'courses'
  | 'calendar'
  | 'diary'
  | 'supporters'
  | 'tzedaka'
  | 'shop'
  | 'shop7'
  | 'reports'
  | 'settings';

export interface Toast {
  id: number;
  text: string;
}

/** מצב הענן — קיים תמיד; enabled=false = מקומי בלבד (התנהגות זהה להיום). */
export interface CloudState {
  /** לארגון יש config.firebase — נדרשת התחברות וסנכרון פעיל. */
  enabled: boolean;
  /** Firebase כבר דיווח מצב התחברות ראשוני (מונע הבזק מסך כניסה). */
  authReady: boolean;
  user: CloudUser | null;
  status: CloudStatus;
  /**
   * שער החברות (CLOUD2 ענן 3) — ארגון-פלטפורמה בלבד: ‏na=לא רלוונטי (הלקוח
   * הקיים/מקומי) · checking=בודקים אחרי התחברות · member=חבר, האפליקציה
   * נפתחת · pending=נרשם וממתין לאישור הבעלים — מסך המתנה, לא האפליקציה.
   */
  membership: 'na' | 'checking' | 'member' | 'pending' | 'removed';
  /**
   * שער הצפנת-ענן (opt-in) — true כשלארגון יש envelope ואין DEK בזיכרון: מסך
   * CloudUnlock מוצג לפני הכניסה, הסנכרון מושהה עד הזנת סיסמת-ההצפנה. undefined/
   * false = אין הצפנה או שכבר נפתחה (ביט-זהה להיום ללקוח לא-מוצפן).
   */
  needUnlock?: boolean;
  /** הצפנת-הענן פעילה בארגון (קיים envelope) — לתצוגת-סטטוס בהגדרות. */
  cloudEncrypted?: boolean;
  /** ORGADMIN — המשתמש המחובר הוא מנהל-הארגון (org.manager) ⇒ פאנל-המנהל 👥. */
  isManager?: boolean;
  /**
   * ייעודי-התרומה שהעובד/ת המחובר/ת רשאי/ת לראות (בקשת-בעלים 13.8 ג'). null =
   * בלי הגבלה (מנהל/בעלים/לקוח-מקומי — רואה הכל). מערך = רק ייעודים אלו.
   */
  allowedDesignations?: string[] | null;
  /**
   * סטטוס רישום-הבקשה (5.8 — "מאור נרשם ולא רואים בקשה"): 'ok' = הבקשה נכתבה
   * לענן; אחרת קוד-השגיאה של הכתיבה האחרונה (למשל permission-denied — ‏Rules).
   * מוצג במסך-ההמתנה — כשל לא נבלע יותר בשקט. undefined = טרם נוסה.
   */
  reqStatus?: string;
}

interface AppState {
  db: Db;
  ready: boolean;
  corrupt: boolean;
  saveOk: boolean;
  view: View;
  /** משפחה/קורס נבחרים לתצוגת פירוט. */
  selFamilyId: string | null;
  selCourseId: string | null;
  toasts: Toast[];
  paletteOpen: boolean;
  /** מצב צנעה (SHOP10) — מסתיר מסכי-מקבלי-הצדקה מעיון מזדמן. Runtime, לא נשמר. */
  privacyMode: boolean;
  /** מצב פתיחת הנעילות — לכל הסשן (לא נשמר ב-db). */
  unlockedPrimary: boolean;
  unlockedAdmin: boolean;
  /** קודי הנעילה — נשמרים במכשיר בלבד (localStorage), לא ב-db/גיבוי/ענן. */
  lock: LockCfg;
  /** הצפנת נתונים במנוחה פעילה. */
  encrypted: boolean;
  /** נטענה שמירה מוצפנת — ממתינים לקוד פענוח לפני שימוש. */
  needDecrypt: boolean;
  /** קונפיגורציית הארגון — localStorage ← config.json ← ברירת מחדל. */
  config: OrgConfig;
  /** מצב חיבור הענן (Firebase) — ראו CloudState. */
  cloud: CloudState;

  // ענן — כניסה/יציאה (זמינים רק כש-cloud.enabled)
  cloudSignIn: (email: string, password: string) => Promise<void>;
  cloudSignOut: () => Promise<void>;
  cloudResetPassword: (email: string) => Promise<void>;
  /** שינוי סיסמה למשתמש מחובר — אימות-מחדש עם הנוכחית ואז החלפה (שגיאות בעברית). */
  cloudChangePassword: (currentPass: string, nextPass: string) => Promise<void>;
  /**
   * הרשמה עצמית (CLOUD2 ענן 3): יצירת משתמש Auth + כתיבת בקשה ממתינה —
   * כל מה שנרשם-חדש רשאי לכתוב. הוא נשאר במסך ההמתנה עד אישור הבעלים.
   */
  cloudSignUp: (orgName: string, contactName: string, phone: string, email: string, password: string, profile?: { industry?: string; size?: string; needs?: string[] }) => Promise<void>;
  /**
   * הרשמת-עובד/ת (ORGADMIN — מסך-אחיד, "קוד מהבוס"): יצירת משתמש Auth + כתיבת
   * בקשת-הצטרפות לארגון שהקוד מצביע עליו (platformOrgs/{slug}/joinRequests) —
   * **לא** בקשת-ארגון-חדש. מופיעה למנהל לאישור; אחרי אישור, כניסה רגילה מנתבת
   * את העובד/ת לארגון. הקוד מקודד את הסלאג (slug.code) ⇒ בלי קישור/שאילתה.
   */
  cloudEmployeeSignUp: (email: string, phone: string, password: string, fullCode: string) => Promise<void>;
  /**
   * ליד "נחזור אליכם" (SIGNUP מיתוג 3) — **בלי חשבון**: כותב platformLeads
   * (create-only ציבורי). מחזיר true בהצלחה. משמש את CallbackModal.
   */
  cloudRequestCallback: (lead: { contactName: string; phone: string; preferredTime: string; notes: string }) => Promise<boolean>;

  // מחזור חיים
  init: () => Promise<void>;
  setDb: (patch: Partial<Db> | ((db: Db) => Partial<Db>)) => void;
  nextId: (prefix: string) => string;

  // ניווט
  go: (view: View) => void;
  selectFamily: (id: string | null) => void;
  selectCourse: (id: string | null) => void;
  /** מחסנית ניווט (עד 20) + משפחות שנפתחו לאחרונה (עד 6) — P1.5, session בלבד. */
  navHist: NavLoc[];
  recentIds: string[];
  /** ↩ חזרה — שולף את המיקום האחרון ומנווט אליו בלי לרשום את החזרה כצעד. */
  goBack: () => void;
  setPalette: (open: boolean) => void;
  togglePrivacy: () => void;
  /**
   * דגל בקשת "משפחה חדשה" מהכרום (כותרת צֹהַר) — FamiliesView צורך אותו
   * ופותח את אותו טופס הוספה בדיוק כמו הכפתור שבמסך עצמו.
   */
  famFormReq: boolean;
  /** ניווט למסך המשפחות + פתיחת טופס ההוספה (זרימה אחת לכל נקודות הכניסה). */
  openFamilyForm: () => void;
  /** איפוס הדגל אחרי שהטופס נפתח. */
  ackFamilyForm: () => void;
  /** בקשות פתיחת-טופס מהפלטה (P1.6) — אותו דפוס כמו famFormReq. */
  evFormReq: '' | 'org' | 'call';
  openEventForm: (kind?: 'org' | 'call') => void;
  ackEventForm: () => void;
  courseFormReq: boolean;
  openCourseForm: () => void;
  ackCourseForm: () => void;
  supFormReq: boolean;
  openSupporterForm: () => void;
  ackSupporterForm: () => void;
  /** UX סבב-ז׳: חיפוש-גלובלי נוחת על כרטיס-התומך — בקשת-פתיחה (דפוס supFormReq). */
  supOpenReq: string | null;
  openSupporterCard: (id: string) => void;
  ackSupporterOpen: () => void;
  /** ניווט למשפחות מסוננות לפי דרגת אמינות (אריחי הדרגות במדדי הבית, P2 פער 20). */
  famTierReq: '' | 'titan' | 'lion' | 'pale' | 'red';
  openFamiliesByTier: (tier: 'titan' | 'lion' | 'pale' | 'red') => void;
  ackFamiliesTier: () => void;

  // ערכת נושא וקונפיגורציה
  /** קביעת קונפיגורציה חדשה + שמירתה כדריסת ריצה ב-localStorage. */
  setConfig: (cfg: OrgConfig) => void;
  /** בחירת ערכת נושא — נשמרת ב-db.ui ומוחלת על ה-DOM. */
  setTheme: (theme: string) => void;
  /** דריסת צבע הדגשה (hex) — undefined מחזיר לצבע הערכה. */
  setAccent: (accent: string | undefined) => void;

  // הודעות
  toast: (text: string) => void;
  dismissToast: (id: number) => void;

  // משפחות ובני משפחה
  upsertFamily: (fam: Family) => void;
  deleteFamily: (id: string) => void;
  /** מיזוג כפילויות — כל ה-loserIds נספגים לתוך keeperId (בלי אובדן בני-משפחה/שיבוצים). */
  mergeFamilyGroup: (keeperId: string, loserIds: string[]) => void;
  /** פער 21: מיזוג לפי בחירת-שדות (לגאסי dupFieldMerge) — ids[0] הוא הבסיס. */
  mergeFamilyGroupFields: (ids: string[], pick: Record<string, number>, edit: Record<string, string>) => void;
  upsertMember: (famId: string, member: Member) => void;
  deleteMember: (famId: string, memberId: string) => void;
  addCred: (famId: string, delta: number, reason: string) => void;
  /** Batch יומי: ‎-2 נק׳ לכל משפחה ללא פעילות ניקוד ב-14 הימים האחרונים. */
  runDecay: () => void;

  // מרכז טיפול — סימון פריטי "דורש טיפול" כטופלו
  markAttnDone: (key: string) => void;
  unmarkAttnDone: (key: string) => void;

  // חוגים ושיבוצים
  upsertCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  upsertEnrollment: (e: Enrollment) => void;
  deleteEnrollment: (id: string) => void;
  punch: (enrollmentId: string) => void;
  /** החלפת-נוכחות פר-מפגש (#6) — presents+used; false אם אין יתרת-כרטיסייה להוספה. */
  setPresent: (enrollmentId: string, dateIso: string, present: boolean) => boolean;
  /** ביטול הניקוב האחרון — מחזיר את הדלתא המדויקת מרשומת ה-Check-in (legacy mgUndo). */
  undoPunch: (enrollmentId: string) => void;
  addAbsence: (enrollmentId: string, absence: Absence) => void;
  /** רישום תשלום — {ok:false} כשה-store דחה (השיבוץ נעלם); rid רק כשהונפק בפועל. */
  addPayment: (enrollmentId: string, payment: Omit<Payment, 'rid'>) => { ok: boolean; rid?: string };

  // יומן ואירועים
  /**
   * ניקוי תאריך-יעד (תומכת) / תשלום-הבא (שיבוץ) + מחיקת אירוע-הלוח המקושר —
   * אטומי. תיקון באג ידוע #6: הניקוי השאיר אירוע יתום בלוח (המחיקות כן ניקו).
   */
  unlinkEvent: (kind: 'supporterNext' | 'enrollmentDue', id: string) => void;
  upsertEvent: (ev: OrgEvent) => void;
  deleteEvent: (id: string) => void;
  /**
   * שליחת ממצא ביקורת למרכז הטיפול (P2 פער 22) — תזכורת אדומה להיום בלוח,
   * כמו sendAuditToCare בלגאסי (הממצאים נשפכים ל"דורש טיפול" — לא מנגנון חדש).
   */
  auditToAttention: (issue: { title: string; famId?: string; spId?: string }) => void;

  // צוות, חדרים, תורמים
  upsertTeacher: (t: Teacher) => void;
  deleteTeacher: (id: string) => { ok: boolean; error?: string };
  upsertRoom: (r: Room) => void;
  upsertSupporter: (s: Supporter) => void;
  deleteSupporter: (id: string) => void;
  /** מחיקה-מרובה — כל ה-ids בעדכון-מצב יחיד (אותו ניקוי-מדורג כמו הבודד). */
  deleteSupporters: (ids: string[]) => void;
  /** 🔗 מיזוג-כפולים (#13): כל הכסף עובר ל-keep (rid נשמר), drop נמחק. */
  mergeSupporters: (keepId: string, dropId: string) => void;
  /** רישום תרומה — {ok:false} כשה-store דחה (התומכת נעלמה); rid רק כשהונפק בפועל. */
  addDonation: (supporterId: string, donation: Omit<Donation, 'rid'>) => { ok: boolean; rid?: string };

  // קופות צדקה (מודול tzedaka — מבודד; BUILD-ORDER-TZEDAKA-2026-07-30).
  // הכסף/האירועים/הניקוד נכתבים רק למערכי tz* — לא לקבלות/תרומות/לוח הראשי.
  upsertTzCoordinator: (c: TzCoordinator) => void;
  /** חסום כשיש לרכז קופות home/office; מוחק גם אירועי-לוח מקושרים (בלי יתומים). */
  deleteTzCoordinator: (id: string) => boolean;
  upsertTzBox: (b: TzBox) => void;
  /** מוחק + מנקה אירועים מקושרים; האישור בשכבת ה-UI (useArmed). */
  deleteTzBox: (id: string) => void;
  upsertTzCampaign: (c: TzCampaign) => void;
  /** ריקונים משויכים מקבלים campaignId:'' — אין אובדן כסף. */
  deleteTzCampaign: (id: string) => void;
  upsertTzEvent: (e: TzEvent) => void;
  deleteTzEvent: (id: string) => void;
  /** ריקון קופה — דוחה סכום לא-חוקי בלי לגעת ב-db; delta = ניקוד שנוסף לרכז. */
  addTzCollection: (
    boxId: string,
    coll: { date: IsoDate; amount: number; campaignId: string; note: string },
  ) => { ok: boolean; delta: number };
  /** כוונון ניקוד ידני — reason חובה. */
  addTzScore: (coordinatorId: string, delta: number, reason: string) => void;

  // חנות מוצרי-שירות (מודול shop — מבודד; BUILD-ORDER-SHOP-2026-07-30).
  // הכסף/המימושים/האירועים נכתבים רק למערכי shop* — לא לקבלות/תרומות/לוח הראשי.
  /** פריט קטלוג עצמאי (SHOP4, הכרעה 18) — בעל המלאי/התוקף/החנות המשותפים. */
  upsertShopItem: (i: ShopItem) => void;
  /** חסום כשרכיב בחבילה מצביע על הפריט — מסירים מהחבילות קודם. */
  deleteShopItem: (id: string) => boolean;
  /**
   * מיזוג פריטים כפולים (הכרעה 21): כל הרכיבים המצביעים על המקור מוסבים
   * ליעד, המלאי מתחבר (סכום — שניהם מלאי אמיתי; שניהם בלי מעקב = נשאר
   * בלי), המקור נמחק. המימושים לא נגעו (componentId נשאר). אותו kind בלבד.
   */
  mergeShopItems: (targetId: string, sourceId: string) => boolean;
  /** רכיב מוצר בלי id מקבל nextId('shpc') — ייחודיות בתוך המוצר. */
  upsertShopProduct: (p: ShopProduct) => void;
  /** חסום כשקיימים שיוכים active למוצר; מותר כשכולם done/stopped. */
  deleteShopProduct: (id: string) => boolean;
  upsertShopStore: (s: ShopStore) => void;
  /** קופונים שמצביעים על החנות מקבלים storeId:'' — אין אובדן רכיבים. */
  deleteShopStore: (id: string) => void;
  upsertShopCriterion: (c: ShopCriterion) => void;
  /** מוסר מכל criterionIds של השיוכים. */
  deleteShopCriterion: (id: string) => void;
  upsertShopAssignment: (a: ShopAssignment) => void;
  /** מוחק + מנקה אירועי-לוח מקושרים (בלי יתומים). */
  deleteShopAssignment: (id: string) => void;
  /**
   * שמירת אירוע הלוח הייעודי. פגישה-עם-חדר (חור מבוקר בבידוד — הכרעת
   * בעלים 16, 30.7.2026): נבדקת התנגשות חדר (roomClashError) — התנגשות ⇒
   * טוסט + false בלי שמירה; אחרת נוצר/מתעדכן OrgEvent מקושר בלוח הראשי
   * (mainEventId). הסרת החדר ⇒ מחיקת המקושר (בלי יתומים).
   */
  upsertShopEvent: (e: ShopEvent) => boolean;
  deleteShopEvent: (id: string) => void;
  /**
   * רישום מימוש — דוחה paid/value לא-סופיים או שליליים בלי לגעת ב-db; paid=0
   * חוקי (מתנה מלאה, בלי אישור). paid>0 ⇒ מונפק אישור S-{shopReceiptSeq}
   * (רציף ונפרד; אינו קבלת מס — לא נוגע ב-receiptSeq/donationSeq).
   * rid מוחזר רק כשהונפק בפועל — ה-UI לא מנחש (לקח באג-5).
   */
  addShopRedemption: (assignmentId: string, r: Omit<ShopRedemption, 'id' | 'rid'>) => { ok: boolean; rid?: string };
  /**
   * ביטול מימוש עם סימון (הכרעת בעלים 14) — הרשומה לעולם לא נמחקת:
   * voidedAt=היום + voidReason (רשות). ה-rid נשאר בסדרה וה-מונים לא זזים
   * (סדרה רציפה לא ממחזרת מספרים). ביטול-כפול נחסם.
   */
  voidShopRedemption: (assignmentId: string, redemptionId: string, reason: string) => boolean;
  /**
   * קליטת מלאי (SHOP6 חנות 25) — קנייה או תרומה-בעין. שער לפני מונה: qty
   * לא-חיובי / cost שלילי / פריט לא-קיים נדחים בלי לגעת ב-db. אטומית —
   * הרשומה נכתבת והמלאי על הפריט עולה באותו setDb. source = טקסט חופשי
   * (בלי קישור ל-supporters — בידוד).
   */
  addShopIntake: (intake: Omit<ShopIntake, 'id'>) => boolean;
  /** מחיקת קליטה מחזירה את המלאי (קטום ב-0) — יומן-קליטות, לא סדרת מס. */
  deleteShopIntake: (id: string) => void;
  /**
   * שיוך המוני (SHOP6 חנות 26) — יוצר שיוכים active לכל השורות בלולאה
   * אטומית אחת (setDb יחיד, nextId פר-שורה). דוחה רשימה ריקה / חבילה
   * לא-קיימת בלי לגעת ב-db.
   */
  bulkAssignShop: (productId: string, rows: { famId: string; memberId: string; criterionIds: string[] }[]) => { ok: boolean; created: number };
  /**
   * חלוקה המונית של מימושים (SHOP6) — מימוש לרכיב עבור כל שיוך פעיל שטרם
   * מומש (מדלג על מי שכבר קיבל). paid=0 קבוע — מתנת-חג/חלוקה, בלי אישור S-;
   * גבייה פרטנית נשארת במימוש הבודד. **הכול-או-כלום:** מלאי לא מספיק ⇒
   * עצירה עם "חסרות K יחידות" לפני כל כתיבה — db לא משתנה.
   */
  bulkRedeem: (productId: string, componentId: string, opts: { date: IsoDate; holiday: string }) => { ok: boolean; created: number };
  /** רשימת המתנה לפריט (SHOP6 חנות 27) — כפול-משפחה נדחה בטוסט. */
  addShopWait: (itemId: string, famId: string, note: string) => boolean;
  removeShopWait: (itemId: string, famId: string) => void;

  // מתנדבים · יום-חלוקה · מסירות (SHOP7 — מבודד; מעקב קדימה; BUILD-ORDER-SHOP7).
  // אפס נגיעה במוני-הקבלות/הכסף — הסטטוס-קדימה חי רק ב-Delivery.
  upsertVolunteer: (v: Volunteer) => void;
  deleteVolunteer: (id: string) => boolean;
  upsertDistributionDay: (d: DistributionDay) => void;
  closeDistributionDay: (id: string, closed: boolean) => void;
  deleteDistributionDay: (id: string) => boolean;
  /** יוצר מסירה (pickup) משיוך-חנות פעיל, משויכת למתנדב. */
  assignDelivery: (dayId: string, assignmentId: string, volunteerId: string) => { ok: boolean };
  /** קידום סטטוס קדימה (pickup→enroute→delivered); delivered = סופי. */
  advanceDelivery: (id: string) => void;
  setDeliveryNote: (id: string, note: string) => void;
  /** חתימת-מקבל/ת על מסירה (גל ג׳, esign). */
  setDeliverySignature: (id: string, signature: string) => void;
  unassignDelivery: (id: string) => void;

  // מעקב טיפול רב-שלבי (feature supporters.ayin) — כל הפעולות עוברות דרך setDb
  // ולכן סנכרון הענן והביטול עובדים כרגיל. פעולות שכותבות ללוח מייצרות OrgEvent.
  /** הכפתור-החכם — מקדם לשלב הבא ומסנכרן אירוע ללוח. */
  ayinAdvance: (id: string) => void;
  /** קפיצה חזרה לשלב שהושלם (או איפוס לשלב הראשון). */
  ayinRevert: (id: string, stage: AyinStage) => void;
  ayinAddName: (id: string, name: string, eyes: number | '') => void;
  ayinToggleName: (id: string, nameId: string) => void;
  ayinSetNameEyes: (id: string, nameId: string, eyes: number | '') => void;
  ayinRemoveName: (id: string, nameId: string) => void;
  ayinAddAnswer: (id: string, note: string) => void;
  ayinEditAnswer: (id: string, index: number, note: string) => void;
  ayinDeleteAnswer: (id: string, index: number) => void;
  /** קביעת מועד "לדבר שוב" — שדות בלבד (התזכורת נכתבת ב-ayinCallAgain). */
  ayinSetNextTalk: (id: string, date: string, time: string) => void;
  /** 🔁 שוב — כותב תזכורת ללוח לפי מועד "לדבר שוב". */
  ayinCallAgain: (id: string) => void;
  ayinLogEyes: (id: string, eyes: number, name?: string) => void;
  /** מחזור חדש — איפוס התיק תוך שמירת ההיסטוריה (log + answers). */
  ayinRestart: (id: string) => void;
  /** החלת גיליון עיניים שחזר (P0.4) — עוברת setDb כך שהסנכרון לענן חינם. */
  ayinApplySheet: (upds: AyinSheetUpd[]) => void;

  // גיבוי ושחזור
  exportBackup: () => void;
  restoreDb: (db: Db) => void;
  resetAll: () => void;

  /** תיקון טלפונים אוטומטי — השלמת 0 מוביל בכל המשפחות/בני המשפחה. */
  fixAllPhones: () => void;

  // נעילת גישה
  /** קביעת/שינוי/הסרת קוד נעילה (null = הסרה). מגבב ושומר במכשיר בלבד. */
  setLockCode: (kind: 'primary' | 'secondary', pin: string | null) => Promise<void>;
  /** עדכון האזורים שהנעילה המשנית מגנה עליהם. */
  setLockZones: (zones: string[]) => void;
  /** איפוס מלא של הנעילה (שכחתי קוד) — מוחק קודים מהמכשיר, הנתונים נשארים. */
  clearLock: () => void;

  // הצפנת נתונים במנוחה
  /** פענוח שמירה מוצפנת בקוד (סיסמה) או מפתח שחזור. false = קוד שגוי. */
  decryptUnlock: (secret: string, via: 'pass' | 'rec') => Promise<boolean>;
  /** הפעלת הצפנה — מחזיר מפתח שחזור להצגה חד-פעמית. */
  enableEncryption: (password: string) => Promise<string>;
  /** כיבוי הצפנה — הנתונים חוזרים להישמר גלויים. */
  disableEncryption: () => Promise<void>;
  /** החלפת סיסמת הצפנה. false = הסיסמה הישנה שגויה. */
  changeEncryptionPassword: (oldPw: string, newPw: string) => Promise<boolean>;
  /** פתיחת הצפנת-ענן — הזנת סיסמה/מפתח-שחזור. false = סוד שגוי. */
  cloudUnlock: (secret: string, via: 'pass' | 'rec') => Promise<boolean>;
  /** הפעלת הצפנת-ענן (בעלים) — מחזיר מפתח-שחזור להצגה חד-פעמית. זורק על כשל. */
  enableCloudEncryption: (password: string) => Promise<string>;
  /** סימון נעילה כפתוחה (לאחר קוד תקין) — נשמר לסשן. */
  markUnlocked: (kind: 'primary' | 'secondary') => void;
  /** נעילה מיידית — סוגר את שתי הרמות וחוזר לבית. */
  lockNow: () => void;
}

/** קריאה/כתיבה בטוחה ל-sessionStorage (מצב פרטי עלול לזרוק). */
const SESS = { p: 'maorUnlockP', a: 'maorUnlockA' } as const;
function readSess(k: string): boolean {
  try {
    return sessionStorage.getItem(k) === '1';
  } catch {
    return false;
  }
}
function writeSess(k: string, v: string | null): void {
  try {
    if (v === null) sessionStorage.removeItem(k);
    else sessionStorage.setItem(k, v);
  } catch {
    /* מצב פרטי — המצב יישאר בזיכרון ה-store בלבד */
  }
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let dirty = false; // עריכה מקומית שטרם נשמרה — שער ריבוי-הטאבים לא ידרוס אותה (#3)
let mtGuardOn = false; // מאזין ה-storage מותקן פעם אחת
let idbWarned = false; // אזהרת "שכבת גיבוי חסרה" ניתנת פעם אחת לסשן (השמירה כל 500ms)
let toastSeq = 1;

/**
 * מודול הענן — נטען דינמית ב-init רק כשלארגון יש config.firebase, כדי
 * ש-firebase לא ייכנס ל-bundle (ולריצה) של ארגון מקומי-בלבד. null = אין ענן.
 */
type CloudSyncModule = typeof import('./cloudSync');
let cloudMod: CloudSyncModule | null = null;
/** unsubscribe להאזנת הקונפיג-מהענן (CLOUD2 ענן 2) — null כשלא מאזינים. */
let cloudCfgUnsub: (() => void) | null = null;
/**
 * שער-פתיחה להצפנת-ענן (opt-in): כשלארגון יש envelope ואין DEK בזיכרון, החיבור
 * נעצר לפני הסנכרון. שומרים כאן את ה-envelope + פונקציית-ההמשך כדי שפעולת
 * cloudUnlock (אחרי שהמשתמש הזין סיסמה) תמשיך את הסנכרון. null = אין המתנה.
 */
let pendingCloudUnlock: { env: import('../lib/crypto').EncEnvelope; resume: () => void } | null = null;

// חותמת "היום" מקומית (לא UTC) — מקור-אמת אחד ב-date-util
function isoToday(): string {
  return isoTodayLocal();
}

/** תאריך ISO במרחק ימים מהיום (שלילי = אחורה) — מקומי. */
/** המיקום הנוכחי כרשומת היסטוריה (P1.5). */
function navLocOf(s: Pick<AppState, 'view' | 'selFamilyId' | 'selCourseId'>): NavLoc {
  return { view: s.view, selFamilyId: s.selFamilyId, selCourseId: s.selCourseId };
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoLocal(d);
}

/**
 * מפתח localStorage המבטיח ריצת דעיכה אחת ביום.
 * ממורחב-שמות פר-ארגון (כמו setPersistNamespace ב-persist.ts) כדי ששני ארגונים
 * על אותו host (?org=<slug>) לא יחלקו את דגל "רצה היום" — אחרת הראשון שנפתח
 * חוסם את דעיכת אי-הפעילות של כל האחרים באותו יום. slug 'default' שומר על המפתח הישן.
 */
const DECAY_LS_KEY = 'maor_decay';

/** ריפוי-עצמי של בקשת-הרשמה (5.8.2026): פרטי-האשף נשמרים כאן בהרשמה, כדי
 *  שכתיבת-בקשה שנכשלה (רשת/Rules) תירשם מחדש אוטומטית בהתחברות הבאה.
 *  גלובלי במכוון — ההרשמה קורית באתר-השורש, לפני שיש ארגון (אין namespace). */
const PENDING_SIGNUP_KEY = 'maor_pending_signup';
/** ה-uid שבקשתו נכתבה בהצלחה — מונע רישום-מחדש מיותר (create-על-קיים נדחה
 *  ב-Rules והיה מציג שגיאת-שווא במסך-ההמתנה). */
const REQ_OK_KEY = 'maor_req_ok';
/** הרשמת-עובד ("קוד מהבוס") — {slug, email, ...}: הריפוי-העצמי מרפא לתור
 *  ה-joinRequests של הארגון, לא לבקשות-הפלטפורמה (מניעת בקשת-ארגון-רפאים). */
const PENDING_JOIN_KEY = 'maor_pending_join';

/** קוד-שגיאה קריא מכשל-Firestore ('permission-denied' וכו') — לתצוגת-אבחון. */
function fsErrCode(e: unknown): string {
  const code = (e as { code?: string })?.code;
  return code || String(e).slice(0, 120);
}

/**
 * כתיבת-בקשה עמידה (האבחון של 5.8 — permission-denied רק לנרשמי-האשף): נוסח
 * מלא עם פרופיל-האשף (industry/size/needs); אם נדחה — Rules מפורסמים ישנים עם
 * hasOnly על 5 שדות-הבסיס מפילים את השדות החדשים — מנסים שוב עם הבסיס בלבד.
 * עדיף בקשה בלי-פרופיל מבקשה שאבדה; כשגם הבסיס נדחה — השגיאה נזרקת הלאה.
 */
async function writeOrgRequestResilient(
  writeFn: (uid: string, req: Record<string, unknown>) => Promise<void>,
  uid: string,
  req: Record<string, unknown>,
): Promise<void> {
  try {
    await writeFn(uid, req);
  } catch (e) {
    if (!('industry' in req) && !('size' in req) && !('needs' in req)) throw e;
    await writeFn(uid, {
      orgName: req.orgName ?? '',
      contactName: req.contactName ?? '',
      phone: req.phone ?? '',
      email: req.email ?? '',
      at: req.at ?? new Date().toISOString(),
    });
  }
}
function decayKey(slug: string): string {
  return !slug || slug === 'default' ? DECAY_LS_KEY : `${DECAY_LS_KEY}:${slug}`;
}

/**
 * מקדם מגמה (TrendFactor) — לפי 3 רשומות הלוג האחרונות:
 * כולן חיוביות → 1.2, כולן שליליות → 0.8, ביניים לפי היחס. לוג ריק → 1.
 */
function trendFactor(log: CredLogEntry[]): number {
  // רשומות דעיכה אוטומטיות אינן "פעילות" (כמו ב-runDecay), ולכן אינן מהוות
  // אות מגמה שלילי — אחרת משפחה שסתם לא הייתה פעילה נענשת פעמיים.
  const last3 = log.filter((e) => e.reason !== 'דעיכה — חוסר פעילות').slice(0, 3);
  if (!last3.length) return 1;
  return 0.8 + 0.4 * (last3.filter((e) => e.delta > 0).length / last3.length);
}

export const useApp = create<AppState>()((set, get) => {
  /** שמירה אוטומטית — חצי שנייה אחרי השינוי האחרון. */
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const ok = await saveDb(get().db);
      if (ok) dirty = false; // נשמר — שער ריבוי-הטאבים רשאי שוב לאמץ כתיבה חיצונית
      if (ok !== get().saveOk) set({ saveOk: ok });
      if (!ok) {
        get().toast('⚠ השמירה נכשלה — הורידו גיבוי מלא ובדקו מקום פנוי בדפדפן');
      } else if (isIdbBackupMissing() && !idbWarned) {
        // LS נשמר אך שכבת הגיבוי (IndexedDB) לא זמינה — אזהרה חד-פעמית, לא בכל שמירה.
        idbWarned = true;
        get().toast('⚠ שכבת הגיבוי (IndexedDB) אינה זמינה — מומלץ להוריד גיבוי מלא');
      } else if (!isIdbBackupMissing()) {
        idbWarned = false;
      }
    }, 500);
  }

  function setDb(patch: Partial<Db> | ((db: Db) => Partial<Db>)) {
    const prev = get().db;
    set((s) => ({ db: { ...s.db, ...(typeof patch === 'function' ? patch(s.db) : patch) } }));
    dirty = true; // עריכה מקומית ממתינה — שער ריבוי-הטאבים לא ידרוס אותה (#3)
    scheduleSave();
    // דחיפה לענן (debounced במודול הענן) — no-op כשאין ענן / בזמן החלת שינוי מרוחק
    cloudMod?.cloudOnDbChange(prev, get().db);
  }

  /** עדכון שדה cloud חלקי. */
  function setCloud(patch: Partial<CloudState>) {
    set((s) => ({ cloud: { ...s.cloud, ...patch } }));
  }

  /**
   * שער ריבוי-טאבים (#3): שני טאבים גלויים באותו origin חלקו last-writer-wins —
   * טאב מיושן דרס בשקט עריכה של טאב אחר. עכשיו טאב שמקבל אירוע storage על מפתח
   * ה-DB, שאין לו עריכה מקומית ממתינה (dirty), ושהערך החיצוני חדש יותר (savedAt),
   * מאמץ את המצב החיצוני במקום לדרוס אותו. עריכה מקומית ממתינה ⇒ לא נוגעים (כוונת
   * המשתמש בטאב הפעיל מנצחת, כמו קודם). מוצפן/פגום ⇒ null ⇒ אין אימוץ.
   */
  function startMultiTabGuard() {
    if (mtGuardOn || typeof window === 'undefined') return;
    mtGuardOn = true;
    window.addEventListener('storage', (e) => {
      if (e.key !== currentDbKey() || e.newValue == null) return;
      if (dirty || get().needDecrypt || get().encrypted) return;
      const ext = readStoredPlainDb(e.newValue);
      if (!ext || !ext.savedAt) return;
      const cur = get().db.savedAt;
      if (cur && ext.savedAt <= cur) return; // לא חדש יותר — אין מה לאמץ
      set({ db: ext }); // אימוץ הכתיבה החיצונית; בלי scheduleSave (כבר מאוחסן)
    });
  }

  /**
   * צעדים שאחרי טעינת ה-DB (גלוי או לאחר פענוח): ערכה, צילום יומי, ניקוי
   * "טופל" ישן, ודעיכת אי-פעילות פעם ביום. משותף ל-init ול-decryptUnlock.
   */
  function postLoad(db: Db, corrupt: boolean) {
    const config = get().config;
    applyTheme(db.ui.theme ?? config.theme, db.ui.accent ?? config.accent);
    // אין לצלם DB פגום/ריק — אחרת emptyDb ידרוס את הצילום היומי התקין של היום
    // (dailySnapshot כותב לפי מפתח-היום ללא תנאי) ויאבד את גיבוי-הבטיחות.
    if (!corrupt) void dailySnapshot(db);
    if (corrupt) {
      get().toast('⚠ הנתונים השמורים נמצאו פגומים — נשמר עותק בצד. שחזרו מגיבוי דרך הגדרות ← ייבוא');
    }
    const pruneCutoff = isoDaysAgo(30);
    const stale = Object.entries(db.attnDone ?? {}).filter(([, d]) => d < pruneCutoff);
    if (stale.length) {
      setDb((cur) => {
        const attnDone = { ...cur.attnDone };
        for (const [k] of stale) delete attnDone[k];
        return { attnDone };
      });
    }
    const today = isoToday();
    const lsKey = decayKey(config.slug);
    let ranToday = false;
    try {
      ranToday = localStorage.getItem(lsKey) === today;
    } catch {
      /* localStorage חסום */
    }
    if (!ranToday) {
      try {
        localStorage.setItem(lsKey, today);
      } catch {
        /* אין מקום / מצב פרטי */
      }
      get().runDecay();
    }
  }

  /**
   * חיבור הענן — נקרא מ-init רק כשיש config.firebase. אסינכרוני ולא חוסם:
   * כל כשל כאן מחזיר את המערכת למצב מקומי-בלבד עם טוסט, בלי לפגוע בעבודה.
   */
  async function connectCloud(fb: FirebaseOrgConfig, cfg: OrgConfig) {
    try {
      const mod = await import('./cloudSync');
      cloudMod = mod;
      mod.initCloud(fb);
      // תחום הנתיבים (CLOUD2 ענן 1): הלקוח הקיים (cloudRoot:true) = שורש —
      // ביט-זהה להיום; ארגון-פלטפורמה = orgs/{slug}/
      mod.setCloudScope(cfg.slug, cfg.cloudRoot === true);
      mod.watchAuth((user) => {
        const hadUser = get().cloud.user !== null;
        setCloud({ authReady: true, user, ...(user ? {} : { status: 'idle' as const }) });
        if (user && !hadUser) {
          const startSync = () =>
            void mod.startCloudSync({
              getDb: () => get().db,
              // נתיב החלת-מרוחק: שמירה מקומית כרגיל, בלי cloudOnDbChange (אין הד)
              setDbFromRemote: (db) => {
                set({ db });
                scheduleSave();
              },
              toast: (t) => get().toast(t),
              setStatus: (status) => setCloud({ status }),
            });
          // שער הצפנת-ענן (opt-in): אם לארגון יש envelope ואין DEK בזיכרון —
          // עוצרים לפני הסנכרון ומציגים מסך-פתיחה. readCloudEnvelope הוא
          // failure-safe (null בכל שגיאה) ⇒ ארגון לא-מוצפן / Rules-חוסמות =
          // ביט-זהה להיום (מסנכרן מיד). ה-DEK ב-cloudSync (מטמון-זיכרון).
          const gatedStart = () => {
            void mod.readCloudEnvelope().then((env) => {
              setCloud({ cloudEncrypted: !!env });
              if (env && !mod.getCloudDek()) {
                pendingCloudUnlock = { env, resume: startSync };
                setCloud({ needUnlock: true, status: 'idle' });
              } else {
                startSync();
              }
            });
          };
          // האזנה חיה לקונפיג (ענן 2) — הענן גובר; מטמון-ענן נפרד, לא דריסת-אשף
          const applyCloudDoc = (orgDoc: OrgCloudDoc | null) => {
            if (!orgDoc?.config) return;
            const merged = resolveOrgConfig(get().config, orgDoc.config);
            // ORGADMIN — עובד/ת: הקונפיג-האפקטיבי = קונפיג-הארגון בניכוי כרטיס-העובד
            // (רק הגבלה); מנהל/מייל-על = מלא. מנהל משנה כרטיס ⇒ העובד רואה חי (watch).
            const eff = effectiveConfigFor(user.email, orgDoc, merged);
            set({ config: eff });
            // ג' (13.8) — ייעודי-התרומה שהעובד/ת רשאי/ת לראות (מתעדכן חי עם הכרטיס)
            setCloud({ allowedDesignations: allowedDesignationsFor(user.email, orgDoc) });
            const { db } = get();
            applyTheme(db.ui.theme ?? eff.theme, db.ui.accent ?? eff.accent);
            writeCloudConfigCache(eff.slug, eff);
          };
          // ארגון-פלטפורמה = לא הלקוח הקיים (cloudRoot) ולא אתר-השורש (default)
          // — אצל שניהם ההתנהגות של היום בדיוק, בלי שער-חברות ובלי קונפיג-ענן
          const platformOrg = cfg.cloudRoot !== true && cfg.slug !== 'default';
          if (platformOrg) {
            // שער החברות (ענן 3): נרשם-שטרם-אושר רואה מסך המתנה — לא את
            // האפליקציה ולא סנכרון; מייל-על עוקף (לוח הבקרה)
            setCloud({ membership: 'checking' });
            void mod.fetchOrgCloudConfig(cfg.slug).then((orgDoc) => {
              // 🗑 מצבת-מחיקה (5.8): הבעלים מחק את הארגון — מנקים את המגירה
              // המקומית (רק של ה-slug הזה; persist מגן על השורש) ומציגים "הוסר".
              // חשוב: הניקוי רק על דגל-מצבת מפורש — לעולם לא על כשל-קריאה (null).
              if (orgDoc?.deleted) {
                void import('./persist').then((p) => p.wipeLocalOrgData(cfg.slug));
                setCloud({ membership: 'removed' });
                return;
              }
              const mail = user.email.trim().toLowerCase();
              const member =
                isSuperAdmin(user.email) ||
                !!orgDoc?.members?.some((m) => m.trim().toLowerCase() === mail);
              // ORGADMIN — האם המשתמש הוא מנהל-הארגון (org.manager)? ⇒ פאנל-המנהל 👥
              setCloud({ membership: member ? 'member' : 'pending', isManager: isOrgManager(user.email, orgDoc ?? {}), allowedDesignations: allowedDesignationsFor(user.email, orgDoc ?? {}) });
              if (!member) {
                // ORGADMIN — עובד/ת שהגיעה דרך קישור-הזמנה (?join=code): רישום בקשה
                // שהמנהל יראה ויאשר (create-only, uid תואם לפי Rules v3; idempotent).
                const joinCode = new URLSearchParams(window.location.search).get('join');
                if (joinCode && user.uid) {
                  void mod
                    .writeOrgJoinRequest(cfg.slug, user.uid, {
                      email: user.email,
                      name: user.email.split('@')[0],
                      code: joinCode,
                      at: isoToday(),
                    })
                    .catch(() => {
                      /* אין הרשאה/רשת — מסך ההמתנה נשאר; המנהל יזמין שוב */
                    });
                }
                return;
              }
              applyCloudDoc(orgDoc);
              cloudCfgUnsub?.();
              cloudCfgUnsub = mod.watchOrgCloudConfig(cfg.slug, applyCloudDoc);
              gatedStart();
            });
          } else {
            // שורש/ברירת-מחדל (הלקוח הקיים) — שער-כניסה: רק מייל-על ומורשי-השורש
            // (adminEmails) נכנסים לאפליקציה. נרשם-חדש בשורש (SignupWizard) לא
            // אמור להיכנס — הוא הופך לארגון-פלטפורמה ומקבל ?org=slug; עד אז מסך
            // המתנה. הבדיקה נגזרת מהמייל+הקונפיג ⇒ עמידה גם ברענון (לא בזיכרון).
            // מורשי-השורש = allowlist ב-Rules; הלקוח משקף אותה דרך adminEmails.
            const mail = user.email.trim().toLowerCase();
            const rootOk =
              isSuperAdmin(user.email) ||
              !!cfg.adminEmails?.some((m) => m.trim().toLowerCase() === mail);
            if (rootOk) {
              setCloud({ membership: 'member' });
              gatedStart();
            } else {
              // ניתוב-עצמי (ORGADMIN): "כפתור הכניסה עושה הכול" — מייל שאושר כחבר
              // בארגון-פלטפורמה נכנס אוטומטית לאתר שלו (?org=slug), בלי קישור נפרד.
              // עד שהתשובה חוזרת — 'checking' (מתחבר…). אין ארגון ⇒ מסך המתנה.
              // findMemberOrgSlugs נופל בטוח ל-[] (בלי כלל-list/הרשאה) ⇒ המתנה.
              setCloud({ membership: 'checking' });
              void mod.findMemberOrgSlugs(user.email).then((slugs) => {
                if (slugs.length && !orgSlugFromUrl()) {
                  try {
                    localStorage.removeItem(PENDING_SIGNUP_KEY); // אושר — הפרטים כבר לא נחוצים
                    localStorage.removeItem(PENDING_JOIN_KEY);
                  } catch { /* לא קריטי */ }
                  const url = new URL(window.location.href);
                  url.searchParams.set('org', slugs[0]);
                  window.location.replace(url.toString()); // טעינה מחדש לתחום-הארגון
                  return;
                }
                setCloud({ membership: 'pending' });
                // ריפוי-עצמי (דיווח-בעלים 5.8): נרשם שממתין בלי שבקשתו נקלטה —
                // כתיבת-ההרשמה המקורית נכשלה (רשת/Rules) והבקשה אבדה, והבעלים
                // לא רואה כלום בלוח. כל התחברות למסך-ההמתנה רושמת מחדש: הפרטים
                // מה-localStorage (נשמרו בהרשמה), ואם אין (מכשיר אחר) — בקשה
                // מינימלית מהמייל. platformRequests הוא create-only עם uid תואם
                // ⇒ אם הבקשה כבר קיימת הכתיבה נדחית בשקט — אפס כפילויות.
                try {
                  if (localStorage.getItem(REQ_OK_KEY) === user.uid) {
                    setCloud({ reqStatus: 'ok' }); // כבר נכתבה בהצלחה — אין מה לרשום שוב
                    return;
                  }
                } catch { /* localStorage חסום ⇒ מנסים לכתוב */ }
                // עובד-ממתין ("קוד מהבוס", ציד-באגים 5.8): הריפוי לתור-הארגון —
                // לא לבקשות-הפלטפורמה (אחרת נולדת בקשת-ארגון-רפאים אצל הבעלים)
                try {
                  const joinRaw = localStorage.getItem(PENDING_JOIN_KEY);
                  const join = joinRaw ? (JSON.parse(joinRaw) as { slug?: string; email?: string; name?: string; phone?: string; code?: string }) : null;
                  if (join?.slug && String(join.email ?? '').toLowerCase() === mail) {
                    void mod
                      .writeOrgJoinRequest(join.slug, user.uid, { email: mail, name: join.name ?? mail.split('@')[0], phone: join.phone ?? '', code: join.code ?? '', at: isoToday() })
                      .then(() => setCloud({ reqStatus: 'ok' }))
                      .catch((e) => setCloud({ reqStatus: fsErrCode(e) }));
                    return;
                  }
                } catch { /* JSON פגום ⇒ ממשיכים למסלול-הארגון-החדש */ }
                let stored: import('../lib/cloudConfig').OrgRequestDoc | null = null;
                try {
                  const raw = localStorage.getItem(PENDING_SIGNUP_KEY);
                  stored = raw ? (JSON.parse(raw) as import('../lib/cloudConfig').OrgRequestDoc) : null;
                } catch { /* JSON פגום ⇒ בקשה מינימלית */ }
                const mine = stored && String(stored.email ?? '').toLowerCase() === mail;
                void writeOrgRequestResilient(
                  (u, r) => mod.writeOrgRequest(u, r),
                  user.uid,
                  (mine && stored ? stored : {
                    orgName: '',
                    contactName: mail.split('@')[0],
                    phone: '',
                    email: mail,
                    at: new Date().toISOString(),
                  }) as Record<string, unknown>,
                )
                  .then(() => {
                    setCloud({ reqStatus: 'ok' });
                    try { localStorage.setItem(REQ_OK_KEY, user.uid); } catch { /* לא קריטי */ }
                  })
                  .catch((e) => {
                    // הכשל גלוי במסך-ההמתנה (5.8) — permission-denied כאן פירושו
                    // בדרך-כלל Rules חסומים (או בקשה שכבר קיימת ממכשיר אחר)
                    setCloud({ reqStatus: fsErrCode(e) });
                  });
              });
            }
          }
        } else if (!user && hadUser) {
          cloudCfgUnsub?.();
          cloudCfgUnsub = null;
          setCloud({ membership: 'na' });
          mod.stopCloudSync();
          mod.setCloudDek(null); // 🐛 נחיל-9×9 (13.8): ניקוי DEK גם ב-logout-אוטומטי
        }
      });
    } catch {
      // טעינת firebase נכשלה (רשת/חסימה) — ממשיכים מקומית, בלי מסך כניסה
      cloudMod = null;
      setCloud({ enabled: false, authReady: true, status: 'error' });
      get().toast('⚠ טעינת חיבור הענן נכשלה — עובדים מקומית בלבד');
    }
  }

  /**
   * לוג-פעולות (ROADMAP-100 ‏#10) — רישום מי/מה/מתי בפעולות-המפתח. טבעת
   * חצובת-תקרה (AUDIT_CAP); who = מייל-הענן או 'מקומי'. כשל לעולם לא מפיל פעולה.
   */
  function logAudit(act: string, what: string): void {
    try {
      const who = get().cloud.user?.email ?? 'מקומי';
      setDb((db) => ({ audit: pushAudit(db.audit, { at: new Date().toISOString(), who, act, what }) }));
    } catch {
      /* הלוג הוא עזר — לא חוסם עבודה */
    }
  }

  /** upsert גנרי לפי id — חדש נכנס לראש הרשימה (כמו במקור). */
  function upsertIn<T extends { id: string }>(list: T[], item: T): T[] {
    const i = list.findIndex((x) => x.id === item.id);
    if (i < 0) return [item, ...list];
    const out = list.slice();
    out[i] = item;
    return out;
  }

  /** תיק הטיפול הנוכחי של תומכ/ת (emptyAyin אם עדיין אין), או null. */
  function curAyin(id: string): { sp: Supporter; a: AyinCase } | null {
    const sp = get().db.supporters.find((s) => s.id === id);
    if (!sp) return null;
    return { sp, a: sp.ayin ?? emptyAyin() };
  }

  /** החלת patch על תיק הטיפול — יוצר את התיק בשימוש הראשון; touch מעדכן lastTouch. */
  function setAyin(id: string, patch: Partial<AyinCase>, touch = true): void {
    const today = isoToday();
    setDb((db) => ({
      supporters: db.supporters.map((sp) =>
        sp.id !== id
          ? sp
          : { ...sp, ayin: { ...(sp.ayin ?? emptyAyin()), ...patch, ...(touch ? { lastTouch: today } : {}) } },
      ),
    }));
  }

  /**
   * אירוע לוח למעקב הטיפול — type 'call', priority 'orange'. evId ניתן להזרקה
   * כדי ש-ayinAdvance ישמור אותו על התיק (ל-revert); ברירת מחדל — מזהה חדש.
   */
  function ayinEvent(sp: Supporter, a: AyinCase, title: string, done: boolean, evId = get().nextId('ev')): void {
    get().upsertEvent({
      id: evId,
      title,
      date: a.nextTalk || isoToday(),
      time: a.nextTalkTime || '',
      type: 'call',
      customType: '',
      notes: featLabel(get().config) + ' · ' + (sp.phone || ''),
      price: 0,
      roomId: '',
      famId: '',
      spId: sp.id,
      priority: 'orange',
      done,
    });
  }

  return {
    db: emptyDb(),
    ready: false,
    corrupt: false,
    saveOk: true,
    view: 'home',
    selFamilyId: null,
    selCourseId: null,
    toasts: [],
    paletteOpen: false,
    privacyMode: false,
    unlockedPrimary: readSess(SESS.p),
    unlockedAdmin: readSess(SESS.a),
    lock: readLock(),
    encrypted: false,
    needDecrypt: false,
    config: DEFAULT_CONFIG,
    cloud: { enabled: false, authReady: true, user: null, status: 'idle', membership: 'na' },

    async init() {
      const config = await loadOrgConfig();
      // בידוד נתונים בין לקוחות על אותו host — חייב לקרות לפני loadDb
      setPersistNamespace(config.slug);
      const res = await loadDb();
      const cloudOn = !!config.firebase;
      if (res.encrypted) {
        // שמירה מוצפנת — ממתינים לקוד פענוח; ה-db עדיין ריק (לא נחשף)
        set({
          config,
          ready: true,
          encrypted: true,
          needDecrypt: true,
          cloud: { enabled: cloudOn, authReady: !cloudOn, user: null, status: 'idle', membership: 'na' },
        });
        applyTheme(config.theme, config.accent); // ערכה בסיסית עד הפענוח
        return;
      }
      const { db, corrupt } = res;
      // אימוץ חד-פעמי: גרסה קודמת שמרה קודים ב-db.security (מסונכרן). מעבירים
      // אותם לאחסון המקומי (במכשיר בלבד) ומנקים מה-db, כדי שלא יסונכרנו/יגובו.
      let lock = get().lock;
      if (!lock.primary && !lock.secondary && (db.security?.primary || db.security?.secondary)) {
        lock = { ...db.security };
        writeLock(lock);
      }
      if (db.security?.primary || db.security?.secondary || db.security?.zones) {
        db.security = {};
      }
      set({
        db,
        corrupt,
        config,
        ready: true,
        lock,
        encrypted: false,
        needDecrypt: false,
        cloud: { enabled: cloudOn, authReady: !cloudOn, user: null, status: 'idle', membership: 'na' },
      });
      // חיבור ענן — opt-in פר-ארגון; בלי config.firebase שום דבר לא משתנה
      if (config.firebase) void connectCloud(config.firebase, config);
      postLoad(db, corrupt);
      startMultiTabGuard(); // שער ריבוי-טאבים (#3)
    },

    setDb,

    nextId(prefix) {
      const seq = get().db.seq;
      setDb({ seq: seq + 1 });
      // #5: תג-מכשיר מונע התנגשות-מזהים בין שני מכשירים לא-מקוונים באותו seq.
      return makeId(prefix, seq, deviceTag());
    },

    async cloudSignIn(email, password) {
      if (!cloudMod) throw new Error('חיבור הענן עדיין נטען — נסו שוב בעוד רגע');
      await cloudMod.signIn(email, password);
      // watchAuth יקלוט את המשתמש ויפעיל startCloudSync
    },
    async cloudSignOut() {
      if (!cloudMod) return;
      cloudMod.stopCloudSync();
      // 🐛 נחיל-9×9 (13.8): מנקים את מפתח-ההצפנה (DEK) מהזיכרון בהתנתקות — אחרת
      // הוא נשאר תושב אחרי logout ומשתמש הבא במכשיר יכול לפענח את העותק המוצפן.
      cloudMod.setCloudDek(null);
      await cloudMod.signOutCloud();
      get().toast('התנתקת מהענן — הנתונים נשארים שמורים במכשיר');
    },
    async cloudResetPassword(email) {
      if (!cloudMod) throw new Error('חיבור הענן עדיין נטען — נסו שוב בעוד רגע');
      await cloudMod.resetPassword(email);
    },
    async cloudChangePassword(currentPass, nextPass) {
      if (!cloudMod) throw new Error('חיבור הענן עדיין נטען — נסו שוב בעוד רגע');
      await cloudMod.changePassword(currentPass, nextPass);
    },
    async cloudSignUp(orgName, contactName, phone, email, password, profile) {
      if (!cloudMod) throw new Error('חיבור הענן עדיין נטען — נסו שוב בעוד רגע');
      // הולידציה טהורה (signUpError) רצה ב-UI; כאן שער אחרון לפני ה-SDK
      const err = signUpError(orgName, contactName, phone, email, password, password);
      if (err) throw new Error(err);
      const uid = await cloudMod.signUp(email.trim(), password);
      // מסמך הבקשה — כל מה שנרשם-חדש רשאי לכתוב (Rules v2); כשל בכתיבה לא
      // מפיל את ההרשמה (הבעלים יראה את המשתמש ב-Auth), אך מדווח.
      // פרופיל האשף (SIGNUP3) נשלח רק כשקיים — שדות ריקים לא נכתבים.
      const reqDoc = {
        orgName: orgName.trim(),
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        at: new Date().toISOString(),
        ...(profile?.industry ? { industry: profile.industry } : {}),
        ...(profile?.size ? { size: profile.size } : {}),
        ...(profile?.needs && profile.needs.length ? { needs: profile.needs } : {}),
      };
      // ריפוי-עצמי (דיווח-בעלים 5.8 — "מאור נרשם ואני לא רואה בקשה"): הפרטים
      // נשמרים מקומית **לפני** ניסיון-הכתיבה; אם הכתיבה נכשלת (רשת/Rules) —
      // ההתחברות הבאה תרשום את הבקשה מחדש ממסך-ההמתנה (create-only ⇒ אידמפוטנטי).
      try {
        localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(reqDoc));
      } catch {
        /* localStorage מלא/חסום — הכתיבה הישירה עדיין מנוסה */
      }
      try {
        const mod = cloudMod;
        await writeOrgRequestResilient((u, r) => mod.writeOrgRequest(u, r), uid, reqDoc);
        setCloud({ reqStatus: 'ok' });
        try { localStorage.setItem(REQ_OK_KEY, uid); } catch { /* לא קריטי */ }
      } catch (e) {
        // הכשל גלוי (5.8): הקוד מוצג גם במסך-ההמתנה — לא נבלע בשקט
        setCloud({ reqStatus: fsErrCode(e) });
        get().toast('⚠ רישום-הבקשה נכשל (' + fsErrCode(e) + ') — ננסה שוב אוטומטית');
      }
      // watchAuth יקלוט את המשתמש ⇒ שער-החברות יציג את מסך ההמתנה
    },
    async cloudEmployeeSignUp(email, phone, password, fullCode) {
      if (!cloudMod) throw new Error('חיבור הענן עדיין נטען — נסו שוב בעוד רגע');
      // ולידציה טהורה (שער אחרון לפני ה-SDK)
      const err = employeeSignUpError(email, phone, password, fullCode);
      if (err) throw new Error(err);
      // "קוד מהבוס" = slug.code — הסלאג מקודד בקוד ⇒ יודעים לאיזה ארגון לנתב
      const parsed = parseJoinFullCode(fullCode);
      if (!parsed) throw new Error('קוד-ההזמנה אינו תקין — בקשו מהמנהל קוד חדש');
      const uid = await cloudMod.signUp(email.trim(), password);
      // בקשת-הצטרפות לארגון של הקוד (לא בקשת-ארגון-חדש!) — create-only, uid תואם
      // (Rules v3). המנהל יראה ויאשר. כשל-כתיבה מדווח אך לא מפיל את יצירת-המשתמש.
      const joinDoc = {
        email: email.trim().toLowerCase(),
        name: email.trim().split('@')[0],
        phone: phone.trim(),
        code: parsed.code,
        at: new Date().toISOString(),
      };
      // ציד-באגים 5.8: הסימון נשמר **לפני** הכתיבה — בלעדיו הריפוי-העצמי במסך-
      // ההמתנה חשב שעובד-ממתין הוא נרשם-ארגון-חדש ורשם בקשת-ארגון-רפאים בלוח;
      // עכשיו הוא מרפא לתור-הנכון (joinRequests של הארגון מהקוד).
      try {
        localStorage.setItem(PENDING_JOIN_KEY, JSON.stringify({ slug: parsed.slug, ...joinDoc }));
      } catch { /* localStorage חסום — הכתיבה הישירה עדיין מנוסה */ }
      try {
        await cloudMod.writeOrgJoinRequest(parsed.slug, uid, joinDoc);
      } catch {
        get().toast('⚠ הבקשה נרשמה חלקית — ננסה שוב אוטומטית בהתחברות הבאה');
      }
      // watchAuth: בשורש עדיין-לא-חבר ⇒ מסך המתנה. אחרי אישור-המנהל, כניסה
      // רגילה מנתבת אוטומטית לארגון (findMemberOrgSlugs).
    },
    async cloudRequestCallback(lead) {
      if (!cloudMod) throw new Error('חיבור הענן עדיין נטען — נסו שוב בעוד רגע');
      // ליד ללא-חשבון — נכתב ל-platformLeads (create-only ציבורי)
      await cloudMod.writeOrgLead({
        contactName: lead.contactName.trim(),
        phone: lead.phone.trim(),
        preferredTime: lead.preferredTime,
        notes: lead.notes.trim(),
        at: new Date().toISOString(),
      });
      return true;
    },

    // ניווט עם רישום היסטוריה (P1.5, legacy:166) — רק מעבר-מיקום אמיתי נרשם
    go: (view) =>
      set((s) => {
        const prev = navLocOf(s);
        const next: NavLoc = { view, selFamilyId: s.selFamilyId, selCourseId: s.selCourseId };
        return { view, ...(sameLoc(prev, next) ? {} : { navHist: pushNav(s.navHist, prev) }) };
      }),
    selectFamily: (id) =>
      set((s) => {
        const prev = navLocOf(s);
        const next: NavLoc = { view: 'families', selFamilyId: id, selCourseId: s.selCourseId };
        return {
          selFamilyId: id,
          view: 'families',
          ...(sameLoc(prev, next) ? {} : { navHist: pushNav(s.navHist, prev) }),
          // "נפתחו לאחרונה" (legacy:344-346) — רק פתיחת כרטיס, לא ניקוי הבחירה
          ...(id ? { recentIds: pushRecent(s.recentIds, id) } : {}),
        };
      }),
    selectCourse: (id) =>
      set((s) => {
        const prev = navLocOf(s);
        const next: NavLoc = { view: 'courses', selFamilyId: s.selFamilyId, selCourseId: id };
        return {
          selCourseId: id,
          view: 'courses',
          ...(sameLoc(prev, next) ? {} : { navHist: pushNav(s.navHist, prev) }),
        };
      }),
    navHist: [],
    recentIds: [],
    goBack: () =>
      set((s) => {
        const h = s.navHist;
        const p = h[h.length - 1];
        if (!p) return {};
        // חזרה אינה נרשמת כצעד (legacy:3147 — _navBack)
        return {
          navHist: h.slice(0, -1),
          view: p.view as View,
          selFamilyId: p.selFamilyId,
          selCourseId: p.selCourseId,
          paletteOpen: false,
        };
      }),
    setPalette: (open) => set({ paletteOpen: open }),
    togglePrivacy: () => set((s) => ({ privacyMode: !s.privacyMode })),
    famFormReq: false,
    evFormReq: '' as const,
    openEventForm: (kind = 'org') => set({ view: 'calendar', evFormReq: kind }),
    ackEventForm: () => set({ evFormReq: '' }),
    courseFormReq: false,
    openCourseForm: () => set({ view: 'courses', selCourseId: null, courseFormReq: true }),
    ackCourseForm: () => set({ courseFormReq: false }),
    supFormReq: false,
    openSupporterForm: () => set({ view: 'supporters', supFormReq: true }),
    ackSupporterForm: () => set({ supFormReq: false }),
    supOpenReq: null,
    openSupporterCard: (id) => set({ view: 'supporters', supOpenReq: id }),
    ackSupporterOpen: () => set({ supOpenReq: null }),
    famTierReq: '' as const,
    openFamiliesByTier: (tier) => set({ view: 'families', selFamilyId: null, famTierReq: tier }),
    ackFamiliesTier: () => set({ famTierReq: '' }),
    // מנקה בחירה קודמת כדי שרשימת המשפחות (והטופס) יוצגו — לא כרטיס משפחה
    openFamilyForm: () => set({ view: 'families', selFamilyId: null, famFormReq: true }),
    ackFamilyForm: () => set({ famFormReq: false }),

    setConfig(cfg) {
      set({ config: cfg });
      saveConfigOverride(cfg);
      const { db } = get();
      applyTheme(db.ui.theme ?? cfg.theme, db.ui.accent ?? cfg.accent);
    },
    setTheme(theme) {
      setDb((db) => ({ ui: { ...db.ui, theme } }));
    },
    setAccent(accent) {
      setDb((db) => ({ ui: { ...db.ui, accent } }));
    },

    toast(text) {
      const id = toastSeq++;
      set((s) => ({ toasts: [...s.toasts, { id, text }] }));
      setTimeout(() => get().dismissToast(id), 4000);
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    upsertFamily(fam) {
      setDb((db) => ({ families: upsertIn(db.families, fam) }));
      logAudit('שמירת משפחה', fam.name);
    },
    deleteFamily(id) {
      logAudit('מחיקת משפחה', get().db.families.find((f) => f.id === id)?.name ?? id);
      setDb((db) => {
        const memberIds = new Set(
          db.families.find((f) => f.id === id)?.members.map((m) => m.id) ?? [],
        );
        return {
          families: db.families.filter((f) => f.id !== id),
          enrollments: db.enrollments.filter((e) => !memberIds.has(e.memberId)),
          events: db.events.filter((ev) => ev.famId !== id),
        };
      });
    },
    mergeFamilyGroup(keeperId, loserIds) {
      // מיזוג בטוח — בני-המשפחה של ה-losers עוברים לשומר עם אותם מזהים, כך
      // שהשיבוצים/התשלומים שלהם נשארים תקינים (בניגוד ל-deleteFamily שמוחק
      // אותם). אירועי ה-losers מופנים לשומר. פעולה אטומית אחת.
      const losers = new Set(loserIds.filter((id) => id !== keeperId));
      if (!losers.size) return;
      setDb((db) => {
        const keeper = db.families.find((f) => f.id === keeperId);
        if (!keeper) return {};
        const loserFams = db.families.filter((f) => losers.has(f.id));
        if (!loserFams.length) return {};
        const merged = mergeFamilies(keeper, loserFams);
        return {
          families: db.families
            .filter((f) => !losers.has(f.id))
            .map((f) => (f.id === keeperId ? merged : f)),
          // אירועים המשויכים ל-loser עוברים לשומר (בני-המשפחה כבר בו)
          events: db.events.map((ev) => (ev.famId && losers.has(ev.famId) ? { ...ev, famId: keeperId } : ev)),
        };
      });
      get().toast('מוזגו ' + losers.size + ' רשומות אל המשפחה שנבחרה ✓');
    },
    mergeFamilyGroupFields(ids, pick, edit) {
      // פער 21 (לגאסי dupFieldMerge:1654-1671): ערכי השדות לפי הבחירה; המבנה
      // (members/docs/אירועים) בסמנטיקה הבטוחה של mergeFamilies — אפס אובדן.
      const keeperId = ids[0];
      const losers = new Set(ids.slice(1));
      if (!keeperId || !losers.size) return;
      setDb((db) => {
        const fams = ids.map((id) => db.families.find((f) => f.id === id)).filter((f): f is Family => !!f);
        if (fams.length < 2) return {};
        const merged = mergeFamiliesByFields(fams, pick, edit);
        return {
          families: db.families
            .filter((f) => !losers.has(f.id))
            .map((f) => (f.id === keeperId ? merged : f)),
          events: db.events.map((ev) => (ev.famId && losers.has(ev.famId) ? { ...ev, famId: keeperId } : ev)),
        };
      });
      get().toast('הרשומות מוזגו לפי הבחירה ✓ — נשמרה רשומה אחת');
    },
    upsertMember(famId, member) {
      setDb((db) => ({
        families: db.families.map((f) =>
          f.id === famId
            ? {
                ...f,
                members: f.members.some((m) => m.id === member.id)
                  ? f.members.map((m) => (m.id === member.id ? member : m))
                  : [...f.members, member],
              }
            : f,
        ),
      }));
    },
    deleteMember(famId, memberId) {
      setDb((db) => {
        const orphanEv = new Set(
          db.enrollments.filter((e) => e.memberId === memberId).map((e) => e.dueEventId).filter(Boolean),
        );
        return {
          families: db.families.map((f) =>
            f.id === famId ? { ...f, members: f.members.filter((m) => m.id !== memberId) } : f,
          ),
          enrollments: db.enrollments.filter((e) => e.memberId !== memberId),
          events: db.events.filter((ev) => !orphanEv.has(ev.id)),
        };
      });
    },
    addCred(famId, delta, reason) {
      const fam = get().db.families.find((f) => f.id === famId);
      if (!fam) return;
      const prevScore = fam.cred?.score ?? 700;
      const log = fam.cred?.log ?? [];
      // מקדם מגמה (P2 פער 32, הכרעה 1 — דגל families.cred.trendCreditsOnly):
      // חסר/true = התנהגות ה-React (מוכפל על זיכויים בלבד, עונשים כמות שהם);
      // false = התנהגות הלגאסי (legacy:387 credEvent — Math.round(delta*tf) לכל דלתא).
      const creditsOnly = featureOn(get().config, 'families.cred.trendCreditsOnly');
      const tf = trendFactor(log);
      const scaled = delta > 0 || !creditsOnly;
      const applied = scaled ? Math.round(delta * tf) : delta;
      const newScore = Math.max(0, Math.min(1000, prevScore + applied));
      const entryReason =
        reason + (scaled && tf !== 1 ? ` (מקדם מגמה ${tf.toFixed(1)})` : '');
      setDb((db) => ({
        families: db.families.map((f) =>
          f.id === famId
            ? {
                ...f,
                cred: {
                  score: newScore,
                  log: [{ date: isoToday(), delta: applied, reason: entryReason }, ...log].slice(0, 200),
                },
              }
            : f,
        ),
      }));
      // חציית סף למדד אדום — התראה למנהל (סף משותף, יישור ללגאסי: red <500)
      if (prevScore >= CRED_RED_THRESHOLD && newScore < CRED_RED_THRESHOLD) {
        get().toast(`⚠ משפחת ${fam.name} ירדה למדד אדום — מומלץ ליצור קשר`);
      }
    },
    runDecay() {
      const cutoff = isoDaysAgo(14);
      const today = isoToday();
      let n = 0;
      setDb((db) => ({
        families: db.families.map((f) => {
          const score = f.cred?.score ?? 700;
          if (score <= 0) return f; // אין לאן לרדת
          // אידמפוטנטיות: אם כבר נרשמה דעיכה היום (טעינה חוזרת, מצב פרטי שאיפס את
          // דגל ה-localStorage, או סנכרון של רשומת דעיכה ממכשיר אחר) — לא לדעוך שוב.
          if (f.cred?.log?.some((l) => l.date === today && l.reason === 'דעיכה — חוסר פעילות')) return f;
          // בסיס הפעילות: רשומת הלוג האחרונה, ובהיעדרה — תאריך ההצטרפות. בלי fallback
          // ל-createdAt, משפחה חדשה (log ריק) נצבעה כ"לא פעילה" ונדעכה מיד ביום הצטרפותה.
          const lastActivity =
            f.cred?.log?.find((l) => l.reason !== 'דעיכה — חוסר פעילות')?.date || f.createdAt || '';
          if (lastActivity && lastActivity >= cutoff) return f; // פעילות/הצטרפות לאחרונה
          n++;
          return {
            ...f,
            cred: {
              score: Math.max(0, score - 2),
              log: [
                { date: today, delta: -2, reason: 'דעיכה — חוסר פעילות' },
                ...(f.cred?.log ?? []),
              ].slice(0, 200),
            },
          };
        }),
      }));
      if (n > 0) {
        get().toast(`Batch יומי: הפחתת אי-פעילות (‎-2) ל-${n} משפחות`);
      }
    },

    markAttnDone(key) {
      setDb((db) => ({ attnDone: { ...db.attnDone, [key]: isoToday() } }));
    },
    unmarkAttnDone(key) {
      setDb((db) => {
        const attnDone = { ...db.attnDone };
        delete attnDone[key];
        return { attnDone };
      });
    },

    upsertCourse(course) {
      setDb((db) => ({ courses: upsertIn(db.courses, course) }));
    },
    deleteCourse(id) {
      setDb((db) => {
        // ניקוי מדורג גם של תזכורות התשלום המקושרות (dueEventId) — אחרת נשארות
        // תזכורות יתומות בלוח לשיבוצים שנמחקו.
        const orphanEv = new Set(
          db.enrollments.filter((e) => e.courseId === id).map((e) => e.dueEventId).filter(Boolean),
        );
        return {
          courses: db.courses.filter((c) => c.id !== id),
          enrollments: db.enrollments.filter((e) => e.courseId !== id),
          events: db.events.filter((ev) => !orphanEv.has(ev.id)),
        };
      });
    },
    upsertEnrollment(e) {
      setDb((db) => ({ enrollments: upsertIn(db.enrollments, e) }));
    },
    deleteEnrollment(id) {
      setDb((db) => {
        const evId = db.enrollments.find((e) => e.id === id)?.dueEventId;
        return {
          enrollments: db.enrollments.filter((e) => e.id !== id),
          ...(evId ? { events: db.events.filter((ev) => ev.id !== evId) } : {}),
        };
      });
    },
    punch(enrollmentId) {
      setDb((db) => ({
        enrollments: db.enrollments.map((e) =>
          e.id === enrollmentId && e.plan === 'punch' && e.used < e.purchased
            ? { ...e, used: e.used + 1 }
            : e,
        ),
      }));
    },
    /**
     * החלפת-נוכחות פר-מפגש (#6, הכרעת בעלים "מוסיף/מסיר"): present=true מוסיף את
     * התאריך ל-presents ומעלה used (שער-יתרה בכרטיסייה); false מסיר ומוריד used.
     * אידמפוטנטי — אין כפל-ספירה על לחיצה חוזרת. מחזיר false אם אין יתרת-כרטיסייה
     * להוספה. ‏used נשאר מקור-האמת לצריכה (כסף); presents = יומן-התאריכים.
     */
    setPresent(enrollmentId, dateIso, present) {
      const en = get().db.enrollments.find((e) => e.id === enrollmentId);
      if (!en) return false;
      const has = (en.presents ?? []).includes(dateIso);
      if (present === has) return true; // כבר במצב הרצוי — no-op אידמפוטנטי
      if (present && en.plan === 'punch' && en.used >= en.purchased) return false; // אין יתרה
      setDb((db) => ({
        enrollments: db.enrollments.map((e) => {
          if (e.id !== enrollmentId) return e;
          const cur = e.presents ?? [];
          return present
            ? { ...e, presents: [...cur, dateIso], used: e.used + 1 }
            : { ...e, presents: cur.filter((d) => d !== dateIso), used: Math.max(0, e.used - 1) };
        }),
      }));
      return true;
    },
    undoPunch(enrollmentId) {
      // ratchet legacy-main-script.js:3372 (mgUndo): הביטול מחזיר את הדלתא
      // המדויקת מרשומת ה-Check-in האחרונה בלוג האמינות (שעשויה להיות מוגדלת
      // במקדם מגמה), לא הנחת ‎-5 — הרשומה מוסרת, הציון יורד ב-rev, ונרשם החזר
      // -rev. אין רשומת Check-in → נפילה ל-addCred(-5) כמו בלגאסי.
      const en = get().db.enrollments.find((e) => e.id === enrollmentId);
      if (!en || !en.used) {
        get().toast('אין ניקוב לביטול');
        return;
      }
      const fam = get().db.families.find((f) => f.members.some((m) => m.id === en.memberId));
      const log = fam?.cred?.log ?? [];
      const li = log.findIndex((l) => l.delta > 0 && l.reason.startsWith('נוכחות (Check-in)'));
      setDb((db) => {
        const enrollments = db.enrollments.map((e) =>
          e.id === enrollmentId ? { ...e, used: e.used - 1 } : e,
        );
        if (!fam || li < 0) return { enrollments };
        const rev = log[li].delta;
        return {
          enrollments,
          families: db.families.map((f) => {
            if (f.id !== fam.id) return f;
            const newLog = (f.cred?.log ?? []).filter((_, i) => i !== li);
            return {
              ...f,
              cred: {
                score: Math.max(0, Math.min(1000, (f.cred?.score ?? 700) - rev)),
                log: [
                  { date: isoToday(), delta: -rev, reason: 'ביטול ניקוב — החזר מדויק של ניקוד הנוכחות' },
                  ...newLog,
                ].slice(0, 200),
              },
            };
          }),
        };
      });
      if (fam && li < 0) get().addCred(fam.id, -5, 'ביטול ניקוב — תיקון טעות');
      get().toast('הניקוב האחרון בוטל — היתרה הוחזרה');
    },
    addAbsence(enrollmentId, absence) {
      setDb((db) => ({
        enrollments: db.enrollments.map((e) =>
          e.id === enrollmentId ? { ...e, absences: [absence, ...e.absences] } : e,
        ),
      }));
    },
    addPayment(enrollmentId, payment) {
      // שער לפני צריכת המונה: אם השיבוץ נעלם (למשל נמחק בסנכרון ממכשיר אחר בעוד
      // הטופס פתוח), אין לקדם את receiptSeq — אחרת מספר קבלה R-{n} מדולג לצמיתות
      // (פוגם ברציפות הקבלות) והתשלום אובד בשקט. עקבי עם addCred/deleteTeacher.
      if (!get().db.enrollments.some((e) => e.id === enrollmentId)) {
        get().toast('השיבוץ לא נמצא — התשלום לא נרשם');
        return { ok: false };
      }
      const rid = 'R-' + get().db.receiptSeq;
      setDb((db) => ({
        receiptSeq: db.receiptSeq + 1,
        enrollments: db.enrollments.map((e) =>
          e.id === enrollmentId ? { ...e, payments: [{ ...payment, rid }, ...e.payments] } : e,
        ),
      }));
      logAudit('תשלום', rid + ' · ₪' + payment.amount);
      return { ok: true, rid };
    },

    unlinkEvent(kind, id) {
      setDb((db) => {
        if (kind === 'supporterNext') {
          const sp = db.supporters.find((s) => s.id === id);
          if (!sp) return {};
          return {
            supporters: db.supporters.map((s) =>
              s.id === id ? { ...s, nextDate: '', nextEventId: undefined } : s,
            ),
            ...(sp.nextEventId ? { events: db.events.filter((e) => e.id !== sp.nextEventId) } : {}),
          };
        }
        const en = db.enrollments.find((e) => e.id === id);
        if (!en) return {};
        return {
          enrollments: db.enrollments.map((e) =>
            e.id === id ? { ...e, dueDate: '', dueEventId: undefined } : e,
          ),
          ...(en.dueEventId ? { events: db.events.filter((e) => e.id !== en.dueEventId) } : {}),
        };
      });
    },
    upsertEvent(ev) {
      setDb((db) => ({ events: upsertIn(db.events, ev) }));
    },
    auditToAttention(issue) {
      get().upsertEvent({
        id: get().nextId('ev'),
        title: issue.title,
        date: isoToday(),
        time: '',
        type: 'reminder',
        customType: '',
        notes: 'ממצא בדיקת נתונים',
        price: 0,
        roomId: '',
        famId: issue.famId || '',
        spId: issue.spId,
        priority: 'red',
        done: false,
      });
      get().toast('הממצא נשלח למרכז הטיפול');
    },
    deleteEvent(id) {
      setDb((db) => ({ events: db.events.filter((e) => e.id !== id) }));
    },

    upsertTeacher(t) {
      setDb((db) => ({ teachers: upsertIn(db.teachers, t) }));
    },
    deleteTeacher(id) {
      const used = get().db.courses.some((c) => c.teacherId === id);
      if (used) return { ok: false, error: 'למורה יש חוגים משויכים — העבירו אותם קודם למורה אחרת' };
      setDb((db) => ({ teachers: db.teachers.filter((t) => t.id !== id) }));
      return { ok: true };
    },
    upsertRoom(r) {
      setDb((db) => ({ rooms: upsertIn(db.rooms, r) }));
    },
    upsertSupporter(s) {
      setDb((db) => ({ supporters: upsertIn(db.supporters, s) }));
      logAudit('שמירת תומכ/ת', s.name);
    },
    mergeSupporters(keepId, dropId) {
      const { supporters } = get().db;
      const keep = supporters.find((s) => s.id === keepId);
      const drop = supporters.find((s) => s.id === dropId);
      if (!keep || !drop || keepId === dropId) return;
      const merged = mergeSupporterInto(keep, drop);
      logAudit('מיזוג תורמים', drop.name + ' ← ' + keep.name);
      setDb((db) => ({
        supporters: db.supporters.filter((s) => s.id !== dropId).map((s) => (s.id === keepId ? merged : s)),
        // תזכורת יעד-קשר של הנמחק שלא הועברה + אירועי-עי"ן שלו — לא נשארים יתומים
        events: db.events.filter((ev) => ev.id !== drop.nextEventId && ev.spId !== dropId),
      }));
      get().toast('🔗 ' + drop.name + ' מוזג/ה לתוך ' + keep.name + ' — כל התרומות והקבלות נשמרו');
    },

    deleteSupporter(id) {
      logAudit('מחיקת תומכ/ת', get().db.supporters.find((x) => x.id === id)?.name ?? id);
      setDb((db) => {
        // ניקוי מדורג של תזכורת "יעד קשר" המקושרת (nextEventId) — אחרת נשארת
        // תזכורת יתומה בלוח לתומכ/ת שנמחק/ה.
        // ניקוי גם של אירועי מעקב עי"ן (spId) — נכתבו עם famId ריק ולכן לא נוקו
        // ע"י מחיקת המשפחה; בלי זה נשארות תזכורות יתומות בלוח לתומכ/ת שנמחק/ה.
        const evId = db.supporters.find((s) => s.id === id)?.nextEventId;
        return {
          supporters: db.supporters.filter((s) => s.id !== id),
          events: db.events.filter((ev) => ev.id !== evId && ev.spId !== id),
        };
      });
    },
    deleteSupporters(ids) {
      const idSet = new Set(ids);
      if (!idSet.size) return;
      const names = get()
        .db.supporters.filter((x) => idSet.has(x.id))
        .map((x) => x.name);
      logAudit('מחיקת ' + idSet.size + ' תומכ/ות', names.slice(0, 6).join(', ') + (names.length > 6 ? '…' : ''));
      setDb((db) => {
        // אותו ניקוי-מדורג כמו הבודד, לכל הנמחקים: תזכורות-יעד (nextEventId) +
        // אירועי מעקב-עי"ן (spId) — כדי שלא יישארו יתומים בלוח.
        const evIds = new Set(
          db.supporters.filter((s) => idSet.has(s.id) && s.nextEventId).map((s) => s.nextEventId as string),
        );
        return {
          supporters: db.supporters.filter((s) => !idSet.has(s.id)),
          events: db.events.filter((ev) => !evIds.has(ev.id) && !(ev.spId && idSet.has(ev.spId))),
        };
      });
    },
    addDonation(supporterId, donation) {
      // שער לפני צריכת המונה: תומכ/ת שנעלם/ה (נמחק/ה בסנכרון בעוד הטופס פתוח) לא
      // יצרוך את donationSeq — אחרת D-{n} מדולג לצמיתות והתרומה אובדת בשקט.
      if (!get().db.supporters.some((s) => s.id === supporterId)) {
        get().toast('התומך/ת לא נמצא/ה — התרומה לא נשמרה');
        return { ok: false };
      }
      const rid = 'D-' + get().db.donationSeq;
      setDb((db) => ({
        donationSeq: db.donationSeq + 1,
        supporters: db.supporters.map((s) => {
          if (s.id !== supporterId) return s;
          const donations = [{ ...donation, rid }, ...s.donations];
          // מצבור = קבלות-בלבד (#14, hist מתווסף בתצוגה) — מקור-אמת יחיד עם migrate/audit.
          const agg = supporterAggregates({ donations, hist: s.hist });
          return { ...s, donations, count: agg.count, ils: agg.ils, usd: agg.usd, first: agg.first || s.first, last: agg.last || s.last };
        }),
      }));
      // מונח-דינמי גם בלוג — הרשומה מוצגת בטבלת-הלוג ובוורטיקל עסקי "תרומה" היא דליפה
      logAudit(termOf(get().config, 'entity.donation', 'תרומה'), rid + ' · ' + (donation.cur === '$' ? '$' : '₪') + donation.amount);
      return { ok: true, rid };
    },

    // ── קופות צדקה (מודול tzedaka — מבודד; הכרעת בעלים 30.7.2026) ──
    upsertTzCoordinator(c) {
      const id = c.id || get().nextId('tzc');
      setDb((db) => ({ tzCoordinators: upsertIn(db.tzCoordinators, { ...c, id }) }));
    },
    deleteTzCoordinator(id) {
      const holding = get().db.tzBoxes.some(
        (b) => b.coordinatorId === id && (b.status === 'home' || b.status === 'office'),
      );
      if (holding) {
        get().toast('יש להעביר קודם את הקופות');
        return false;
      }
      // דפוס unlinkEvent — מוחקים גם את אירועי-הלוח הייעודי המקושרים, בלי יתומים
      setDb((db) => ({
        tzCoordinators: db.tzCoordinators.filter((c) => c.id !== id),
        tzEvents: db.tzEvents.filter((e) => e.coordinatorId !== id),
      }));
      return true;
    },
    upsertTzBox(b) {
      const id = b.id || get().nextId('tzb');
      setDb((db) => ({ tzBoxes: upsertIn(db.tzBoxes, { ...b, id }) }));
    },
    deleteTzBox(id) {
      setDb((db) => ({
        tzBoxes: db.tzBoxes.filter((b) => b.id !== id),
        tzEvents: db.tzEvents.filter((e) => e.boxId !== id),
      }));
    },
    upsertTzCampaign(c) {
      const id = c.id || get().nextId('tzp');
      setDb((db) => ({ tzCampaigns: upsertIn(db.tzCampaigns, { ...c, id }) }));
    },
    deleteTzCampaign(id) {
      // הריקונים נשארים — רק השיוך מתנקה (אין אובדן כסף)
      setDb((db) => ({
        tzCampaigns: db.tzCampaigns.filter((c) => c.id !== id),
        tzBoxes: db.tzBoxes.map((b) =>
          b.collections.some((c) => c.campaignId === id)
            ? { ...b, collections: b.collections.map((c) => (c.campaignId === id ? { ...c, campaignId: '' } : c)) }
            : b,
        ),
      }));
    },
    upsertTzEvent(e) {
      const id = e.id || get().nextId('tze');
      setDb((db) => ({ tzEvents: upsertIn(db.tzEvents, { ...e, id }) }));
    },
    deleteTzEvent(id) {
      setDb((db) => ({ tzEvents: db.tzEvents.filter((e) => e.id !== id) }));
    },
    addTzCollection(boxId, coll) {
      // שער לפני נגיעה ב-db (לקח באג-5): סכום לא-חיובי/לא-סופי נדחה בשקט-רועש
      if (!Number.isFinite(coll.amount) || coll.amount <= 0) {
        get().toast('סכום הריקון חייב להיות מספר חיובי');
        return { ok: false, delta: 0 };
      }
      const box = get().db.tzBoxes.find((b) => b.id === boxId);
      if (!box) {
        get().toast('הקופה לא נמצאה — הריקון לא נשמר');
        return { ok: false, delta: 0 };
      }
      // הניקוד מחושב מול הקופה לפני הוספת הריקון (הרצף נמדד מהריקון הקודם)
      const scoreOn = featureOn(get().config, 'tzedaka.score');
      const delta = scoreOn ? collectionScoreDelta(box, coll.date, coll.amount) : 0;
      const collId = get().nextId('tzl');
      // בידוד (הכרעת בעלים 30.7): כותבים רק ל-tzBoxes/tzCoordinators —
      // לא ל-receiptSeq/donationSeq/supporters/enrollments/events
      setDb((db) => ({
        tzBoxes: db.tzBoxes.map((b) =>
          b.id === boxId ? { ...b, collections: [{ id: collId, ...coll }, ...b.collections] } : b,
        ),
        tzCoordinators: delta
          ? db.tzCoordinators.map((c) =>
              c.id === box.coordinatorId
                ? {
                    ...c,
                    score: c.score + delta,
                    scoreLog: [{ date: coll.date, delta, reason: 'ריקון קופה ' + box.num }, ...c.scoreLog],
                  }
                : c,
            )
          : db.tzCoordinators,
      }));
      return { ok: true, delta };
    },
    addTzScore(coordinatorId, delta, reason) {
      if (!reason.trim() || !Number.isFinite(delta) || !delta) return;
      setDb((db) => ({
        tzCoordinators: db.tzCoordinators.map((c) =>
          c.id === coordinatorId
            ? { ...c, score: c.score + delta, scoreLog: [{ date: isoToday(), delta, reason: reason.trim() }, ...c.scoreLog] }
            : c,
        ),
      }));
    },

    // ── חנות מוצרי-שירות (מודול shop — מבודד; הכרעת בעלים 30.7.2026) ──
    upsertShopItem(i) {
      const id = i.id || get().nextId('shi');
      setDb((db) => ({ shopItems: upsertIn(db.shopItems, { ...i, id }) }));
    },
    deleteShopItem(id) {
      const used = get().db.shopProducts.some((p) => p.components.some((c) => c.itemId === id));
      if (used) {
        get().toast('הפריט משובץ בחבילות — הסירו אותו מהן קודם');
        return false;
      }
      setDb((db) => ({ shopItems: db.shopItems.filter((x) => x.id !== id) }));
      return true;
    },
    mergeShopItems(targetId, sourceId) {
      const target = get().db.shopItems.find((x) => x.id === targetId);
      const source = get().db.shopItems.find((x) => x.id === sourceId);
      if (!target || !source || targetId === sourceId) {
        get().toast('בחרו שני פריטים שונים למיזוג');
        return false;
      }
      if (target.kind !== source.kind) {
        get().toast('מיזוג אפשרי רק בין פריטים מאותו סוג');
        return false;
      }
      // המלאי מתחבר (ברירת ארכיטקט — שניהם מלאי אמיתי); שניהם בלי מעקב = נשאר בלי
      const merged =
        target.stock !== undefined || source.stock !== undefined
          ? { ...target, stock: (target.stock ?? 0) + (source.stock ?? 0) }
          : target;
      setDb((db) => ({
        shopItems: db.shopItems.filter((x) => x.id !== sourceId).map((x) => (x.id === targetId ? merged : x)),
        // הסבת כל הרכיבים המצביעים על המקור — המימושים (componentId) לא נגעו
        shopProducts: db.shopProducts.map((p) =>
          p.components.some((c) => c.itemId === sourceId)
            ? { ...p, components: p.components.map((c) => (c.itemId === sourceId ? { ...c, itemId: targetId } : c)) }
            : p,
        ),
      }));
      return true;
    },
    upsertShopProduct(p) {
      const id = p.id || get().nextId('shp');
      // רכיב חדש בעורך מגיע בלי id — מקבל מזהה משלו (קידומת shpc, רק ייחודיות)
      const components = p.components.map((c) => (c.id ? c : { ...c, id: get().nextId('shpc') }));
      setDb((db) => ({ shopProducts: upsertIn(db.shopProducts, { ...p, id, components }) }));
    },
    deleteShopProduct(id) {
      const active = get().db.shopAssignments.some((a) => a.productId === id && a.status === 'active');
      if (active) {
        get().toast('יש לסיים קודם את השיוכים');
        return false;
      }
      setDb((db) => ({ shopProducts: db.shopProducts.filter((p) => p.id !== id) }));
      return true;
    },
    upsertShopStore(s) {
      const id = s.id || get().nextId('shs');
      setDb((db) => ({ shopStores: upsertIn(db.shopStores, { ...s, id }) }));
    },
    deleteShopStore(id) {
      // הקופונים נשארים — רק ההצבעה על החנות מתנקה (אין אובדן רכיבים)
      setDb((db) => ({
        shopStores: db.shopStores.filter((s) => s.id !== id),
        shopProducts: db.shopProducts.map((p) =>
          p.components.some((c) => c.storeId === id)
            ? { ...p, components: p.components.map((c) => (c.storeId === id ? { ...c, storeId: '' } : c)) }
            : p,
        ),
      }));
    },
    upsertShopCriterion(c) {
      const id = c.id || get().nextId('shc');
      setDb((db) => ({ shopCriteria: upsertIn(db.shopCriteria, { ...c, id }) }));
    },
    deleteShopCriterion(id) {
      setDb((db) => ({
        shopCriteria: db.shopCriteria.filter((c) => c.id !== id),
        shopAssignments: db.shopAssignments.map((a) =>
          a.criterionIds.includes(id) ? { ...a, criterionIds: a.criterionIds.filter((x) => x !== id) } : a,
        ),
      }));
    },
    upsertShopAssignment(a) {
      const id = a.id || get().nextId('sha');
      setDb((db) => ({ shopAssignments: upsertIn(db.shopAssignments, { ...a, id }) }));
    },
    deleteShopAssignment(id) {
      // דפוס unlinkEvent — מוחקים גם את אירועי-הלוח הייעודי המקושרים, בלי
      // יתומים; פגישות-עם-חדר מנקות גם את המקושרים בלוח הראשי
      const linked = get()
        .db.shopEvents.filter((e) => e.assignmentId === id && e.mainEventId)
        .map((e) => e.mainEventId);
      setDb((db) => ({
        shopAssignments: db.shopAssignments.filter((a) => a.id !== id),
        shopEvents: db.shopEvents.filter((e) => e.assignmentId !== id),
        ...(linked.length ? { events: db.events.filter((ev) => !linked.includes(ev.id)) } : {}),
      }));
    },
    upsertShopEvent(e) {
      const prev = e.id ? get().db.shopEvents.find((x) => x.id === e.id) : undefined;
      if (e.roomId && e.kind === 'meeting') {
        // השער לפני צריכת מונים (לקח באג-5): התנגשות ⇒ אפס נגיעה ב-db
        // חור מבוקר בבידוד (הכרעת בעלים 16): תפיסת חדר דו-כיוונית דרך
        // OrgEvent מקושר — אירוע קיים/חוג חוסמים את הפגישה (roomClashError),
        // והאירוע המקושר חוסם אירועים חדשים דרך אותה בדיקה בלוח הראשי
        const clash = roomClashError(
          get().db,
          get().config,
          { date: e.date, time: e.time, roomId: e.roomId },
          prev?.mainEventId,
        );
        if (clash) {
          get().toast(clash);
          return false;
        }
        const a = get().db.shopAssignments.find((x) => x.id === e.assignmentId);
        const id = e.id || get().nextId('she');
        const mainId = prev?.mainEventId || get().nextId('ev');
        setDb((db) => ({
          shopEvents: upsertIn(db.shopEvents, { ...e, id, mainEventId: mainId }),
          events: upsertIn(db.events, {
            id: mainId,
            title: '🤝 פגישת ליווי — ' + (a ? beneficiaryLabel(db, a) : e.title),
            date: e.date,
            time: e.time || '',
            type: 'custom',
            customType: 'פגישת ליווי',
            notes: e.notes,
            price: 0,
            roomId: e.roomId ?? '',
            famId: a?.famId ?? '',
            priority: 'green',
            done: e.done,
          }),
        }));
        return true;
      }
      // בלי חדר — מבודד כמו היום; חדר שהוסר ⇒ מחיקת המקושר (unlinkEvent, בלי יתומים)
      const id = e.id || get().nextId('she');
      const { roomId: _dropRoom, mainEventId: _dropMain, ...rest } = e;
      setDb((db) => ({
        shopEvents: upsertIn(db.shopEvents, { ...rest, id }),
        ...(prev?.mainEventId ? { events: db.events.filter((ev) => ev.id !== prev.mainEventId) } : {}),
      }));
      return true;
    },
    deleteShopEvent(id) {
      // מחיקת פגישה-עם-חדר מוחקת גם את האירוע המקושר בלוח הראשי (בלי יתומים)
      const prev = get().db.shopEvents.find((x) => x.id === id);
      setDb((db) => ({
        shopEvents: db.shopEvents.filter((e) => e.id !== id),
        ...(prev?.mainEventId ? { events: db.events.filter((ev) => ev.id !== prev.mainEventId) } : {}),
      }));
    },
    addShopRedemption(assignmentId, r) {
      // שער לפני נגיעה ב-db (לקח באג-5): paid/value לא-סופיים או שליליים נדחים;
      // paid=0 חוקי — מתנה מלאה בלי תשלום סמלי
      if (!Number.isFinite(r.paid) || r.paid < 0 || !Number.isFinite(r.value) || r.value < 0) {
        get().toast('סכום המימוש חייב להיות מספר אי-שלילי');
        return { ok: false };
      }
      const found = get().db.shopAssignments.some((a) => a.id === assignmentId);
      if (!found) {
        get().toast('השיוך לא נמצא — המימוש לא נשמר');
        return { ok: false };
      }
      const redId = get().nextId('shr');
      // אישור תשלום סמלי — רק כששולם בפועל; סדרה S- נפרדת (אינה קבלת מס)
      const rid = r.paid > 0 ? 'S-' + get().db.shopReceiptSeq : undefined;
      // בידוד (הכרעת בעלים 30.7): כותבים רק ל-shopAssignments + המונה הייעודי —
      // לא ל-receiptSeq/donationSeq/supporters/enrollments/events
      setDb((db) => ({
        ...(rid ? { shopReceiptSeq: db.shopReceiptSeq + 1 } : {}),
        shopAssignments: db.shopAssignments.map((a) =>
          a.id === assignmentId
            ? { ...a, redemptions: [{ id: redId, ...(rid ? { rid } : {}), ...r }, ...a.redemptions] }
            : a,
        ),
      }));
      return rid ? { ok: true, rid } : { ok: true };
    },
    voidShopRedemption(assignmentId, redemptionId, reason) {
      const a = get().db.shopAssignments.find((x) => x.id === assignmentId);
      const r = a?.redemptions.find((x) => x.id === redemptionId);
      if (!a || !r) {
        get().toast('המימוש לא נמצא — הביטול לא בוצע');
        return false;
      }
      if (r.voidedAt) {
        get().toast('המימוש כבר מבוטל');
        return false;
      }
      // סימון בלבד — בלי מחיקה ובלי נגיעה במונים; ה-S- נשאר בסדרה
      setDb((db) => ({
        shopAssignments: db.shopAssignments.map((x) =>
          x.id === assignmentId
            ? {
                ...x,
                redemptions: x.redemptions.map((y) =>
                  y.id === redemptionId ? { ...y, voidedAt: isoToday(), voidReason: reason.trim() } : y,
                ),
              }
            : x,
        ),
      }));
      return true;
    },
    addShopIntake(intake) {
      // שער לפני נגיעה ב-db ולפני nextId (לקח באג-5): כמות חייבת חיובית-סופית,
      // עלות אי-שלילית-סופית, והפריט קיים
      if (!Number.isFinite(intake.qty) || intake.qty <= 0) {
        get().toast('כמות הקליטה חייבת להיות מספר חיובי');
        return false;
      }
      if (!Number.isFinite(intake.cost) || intake.cost < 0) {
        get().toast('עלות הקליטה חייבת להיות מספר אי-שלילי');
        return false;
      }
      if (!get().db.shopItems.some((i) => i.id === intake.itemId)) {
        get().toast('הפריט לא נמצא — הקליטה לא נשמרה');
        return false;
      }
      const id = get().nextId('shn');
      // אטומית: הרשומה + העלאת המלאי באותו setDb (מלאי בלי-מעקב מתחיל מ-0)
      setDb((db) => ({
        shopIntakes: [{ id, ...intake }, ...db.shopIntakes],
        shopItems: db.shopItems.map((i) =>
          i.id === intake.itemId ? { ...i, stock: (i.stock ?? 0) + intake.qty } : i,
        ),
      }));
      return true;
    },
    deleteShopIntake(id) {
      const intake = get().db.shopIntakes.find((x) => x.id === id);
      if (!intake) return;
      // החזרת המלאי קטומה ב-0 — אם בינתיים חולק יותר משנקלט, לא יורדים לשלילי
      setDb((db) => ({
        shopIntakes: db.shopIntakes.filter((x) => x.id !== id),
        shopItems: db.shopItems.map((i) =>
          i.id === intake.itemId ? { ...i, stock: Math.max(0, (i.stock ?? 0) - intake.qty) } : i,
        ),
      }));
    },
    bulkAssignShop(productId, rows) {
      // שער לפני מונה (לקח באג-5): רשימה ריקה / חבילה לא-קיימת — db זהה
      if (rows.length === 0) {
        get().toast('לא נבחרו משפחות לשיוך');
        return { ok: false, created: 0 };
      }
      if (!get().db.shopProducts.some((p) => p.id === productId)) {
        get().toast('החבילה לא נמצאה — השיוך לא בוצע');
        return { ok: false, created: 0 };
      }
      const since = isoToday();
      const created: ShopAssignment[] = rows.map((row) => ({
        id: get().nextId('sha'),
        productId,
        famId: row.famId,
        memberId: row.memberId,
        criterionIds: row.criterionIds,
        since,
        status: 'active',
        notes: '',
        redemptions: [],
      }));
      // לולאה אטומית אחת — setDb יחיד לכל השיוכים
      setDb((db) => ({ shopAssignments: [...created, ...db.shopAssignments] }));
      return { ok: true, created: created.length };
    },
    bulkRedeem(productId, componentId, opts) {
      const db = get().db;
      const product = db.shopProducts.find((p) => p.id === productId);
      const comp = product?.components.find((c) => c.id === componentId);
      if (!product || !comp) {
        get().toast('הרכיב לא נמצא — החלוקה לא בוצעה');
        return { ok: false, created: 0 };
      }
      const ri = itemOf(db, comp);
      const holiday = ri.kind === 'holidayGift' ? opts.holiday : '';
      // מי שכבר קיבל — מדולג (מתנת-חג: פר-חג ושנה עברית, כמו needsCare)
      const targets = db.shopAssignments.filter(
        (a) =>
          a.productId === productId &&
          a.status === 'active' &&
          !assignmentRedeemed(a, componentId, holiday ? { iso: opts.date, name: holiday } : undefined),
      );
      if (targets.length === 0) {
        get().toast('אין שיוכים פעילים שטרם קיבלו — אין מה לחלק');
        return { ok: false, created: 0 };
      }
      // הכול-או-כלום (הכרעת בעלים, מהמנדט): מלאי לא מספיק ⇒ עצירה לפני כל
      // כתיבה — שום מימוש חלקי
      const rem = comp.itemId ? itemRemaining(db, comp.itemId) : null;
      if (rem !== null && targets.length > rem) {
        get().toast('חסרות ' + (targets.length - rem) + ' יחידות במלאי — החלוקה לא בוצעה');
        return { ok: false, created: 0 };
      }
      // paid=0 קבוע בזרימה ההמונית — בלי אישורי S- (גבייה פרטנית = מימוש בודד);
      // הבידוד נשמר: כתיבה ל-shopAssignments בלבד, אפס נגיעה במונים הכספיים
      const value = comp.value ?? ri.value;
      const ids = targets.map(() => get().nextId('shr'));
      const targetIds = new Set(targets.map((t) => t.id));
      setDb((cur) => ({
        shopAssignments: cur.shopAssignments.map((a) => {
          if (!targetIds.has(a.id)) return a;
          const idx = targets.findIndex((t) => t.id === a.id);
          return {
            ...a,
            redemptions: [
              { id: ids[idx], componentId, date: opts.date, holiday, paid: 0, value, note: 'חלוקה המונית' },
              ...a.redemptions,
            ],
          };
        }),
      }));
      return { ok: true, created: targets.length };
    },
    addShopWait(itemId, famId, note) {
      const it = get().db.shopItems.find((i) => i.id === itemId);
      if (!it) {
        get().toast('הפריט לא נמצא');
        return false;
      }
      if ((it.waits ?? []).some((w) => w.famId === famId)) {
        get().toast('המשפחה כבר ברשימת ההמתנה של הפריט');
        return false;
      }
      setDb((db) => ({
        shopItems: db.shopItems.map((i) =>
          i.id === itemId ? { ...i, waits: [...(i.waits ?? []), { famId, date: isoToday(), note }] } : i,
        ),
      }));
      return true;
    },
    removeShopWait(itemId, famId) {
      setDb((db) => ({
        shopItems: db.shopItems.map((i) =>
          i.id === itemId ? { ...i, waits: (i.waits ?? []).filter((w) => w.famId !== famId) } : i,
        ),
      }));
    },

    // ── מתנדבים · יום-חלוקה · מסירות (SHOP7) — מבודד, אפס נגיעה בכסף/קבלות ──
    upsertVolunteer(v) {
      const id = v.id || get().nextId('vol');
      setDb((db) => ({ volunteers: upsertIn(db.volunteers, { ...v, id }) }));
    },
    deleteVolunteer(id) {
      // חסום כשיש מסירות פתוחות למתנדב (לא מוחקים היסטוריית-מסירה בשוגג)
      if (get().db.deliveries.some((d) => d.volunteerId === id)) {
        get().toast('למתנדב יש מסירות משויכות — הסירו/העבירו אותן קודם');
        return false;
      }
      setDb((db) => ({ volunteers: db.volunteers.filter((x) => x.id !== id) }));
      return true;
    },
    upsertDistributionDay(d) {
      const id = d.id || get().nextId('dday');
      setDb((db) => ({ distributionDays: upsertIn(db.distributionDays, { ...d, id }) }));
    },
    closeDistributionDay(id, closed) {
      setDb((db) => ({
        distributionDays: db.distributionDays.map((x) => (x.id === id ? { ...x, closed } : x)),
      }));
    },
    deleteDistributionDay(id) {
      if (get().db.deliveries.some((d) => d.dayId === id)) {
        get().toast('ליום יש מסירות — הסירו אותן קודם');
        return false;
      }
      setDb((db) => ({ distributionDays: db.distributionDays.filter((x) => x.id !== id) }));
      return true;
    },
    assignDelivery(dayId, assignmentId, volunteerId) {
      const a = get().db.shopAssignments.find((x) => x.id === assignmentId);
      if (!a || a.status !== 'active') {
        get().toast('השיוך אינו פעיל');
        return { ok: false };
      }
      // מניעת כפילות — אותו שיוך כבר במסירה באותו יום
      if (get().db.deliveries.some((d) => d.dayId === dayId && d.assignmentId === assignmentId)) {
        get().toast('השיוך כבר משובץ למסירה ביום זה');
        return { ok: false };
      }
      const delivery: Delivery = {
        id: get().nextId('del'),
        dayId,
        assignmentId,
        volunteerId,
        familyId: a.famId,
        status: 'pickup',
        note: '',
      };
      setDb((db) => ({ deliveries: [delivery, ...db.deliveries] }));
      return { ok: true };
    },
    advanceDelivery(id) {
      setDb((db) => ({
        deliveries: db.deliveries.map((d) => {
          if (d.id !== id || d.status === 'delivered') return d;
          const status = advanceStatus(d.status);
          return { ...d, status, ...(status === 'delivered' ? { deliveredAt: isoToday() } : {}) };
        }),
      }));
    },
    setDeliveryNote(id, note) {
      setDb((db) => ({ deliveries: db.deliveries.map((d) => (d.id === id ? { ...d, note } : d)) }));
    },
    // גל ג׳ (esign): חתימת-מקבל/ת על-מסך — נשמרת על רשומת-המסירה (additive)
    setDeliverySignature(id, signature) {
      setDb((db) => ({ deliveries: db.deliveries.map((d) => (d.id === id ? { ...d, signature } : d)) }));
    },
    unassignDelivery(id) {
      setDb((db) => ({ deliveries: db.deliveries.filter((d) => d.id !== id) }));
    },

    // ── מעקב טיפול רב-שלבי ──
    ayinAdvance(id) {
      const c = curAyin(id);
      if (!c) return;
      const plan = planAyinAdvance(get().config, c.sp.name, c.a);
      if (!plan) return;
      let patch = plan.patch;
      if (plan.event) {
        // שומרים את מזהה אירוע-הלוח על התיק, לפי שלב-מקור המעבר (או 'answerPush'),
        // כדי ש-revert יוכל למחוק אותו ולמנוע יתומים/כפילות ב-re-advance.
        const evId = get().nextId('ev');
        const key = c.a.stage === 'answer' && !c.a.answerPushed ? 'answerPush' : c.a.stage;
        ayinEvent(c.sp, c.a, plan.event.title, plan.event.done, evId);
        patch = { ...patch, boardEventIds: { ...c.a.boardEventIds, [key]: evId } };
      }
      setAyin(id, patch);
      get().toast(plan.toast);
    },
    ayinRevert(id, stage) {
      const c = curAyin(id);
      if (!c) return;
      // מוחקים אירועי-לוח של מעברים שכעת מבוטלים (סף לפי שלב-היעד של כל מעבר),
      // כדי שלא יישארו תזכורות יתומות בלוח ו-re-advance לא ייצור כפילות.
      const KEEP_MIN: Record<string, number> = { new: 1, lead: 2, eyes: 3, answerPush: 3, answer: 4 };
      const si = stageIndex(stage);
      const kept: Partial<Record<string, string>> = {};
      const drop = new Set<string>();
      for (const [k, evId] of Object.entries(c.a.boardEventIds ?? {})) {
        if (!evId) continue;
        if (si < (KEEP_MIN[k] ?? 99)) drop.add(evId);
        else kept[k] = evId;
      }
      const today = isoToday();
      setDb((db) => ({
        events: db.events.filter((e) => !drop.has(e.id)),
        supporters: db.supporters.map((sp) =>
          sp.id !== id
            ? sp
            : { ...sp, ayin: { ...(sp.ayin ?? emptyAyin()), ...revertPatch(stage), boardEventIds: kept, lastTouch: today } },
        ),
      }));
    },
    ayinAddName(id, name, eyes) {
      const c = curAyin(id);
      if (!c) return;
      // בדיקה מקדימה (בלי מזהה) כדי לא לבזבז seq על כשל
      const probe = planAddName(c.a, name, eyes, '');
      if (!probe.ok) {
        get().toast(probe.error);
        return;
      }
      const plan = planAddName(c.a, name, eyes, get().nextId('an'));
      if (!plan.ok) return;
      setAyin(id, plan.log ? { names: plan.names, log: plan.log } : { names: plan.names });
      get().toast('"' + name.trim() + '" נוסף לרשימה');
    },
    ayinToggleName(id, nameId) {
      const c = curAyin(id);
      if (!c) return;
      let msg = '';
      const names = c.a.names.map((n) => {
        if (n.id !== nameId) return n;
        const done = !n.done;
        msg = n.name + (done ? ' — בוצע ✓' : ' — הוחזר לממתין');
        return { ...n, done };
      });
      setAyin(id, { names });
      if (msg) get().toast(msg);
    },
    ayinSetNameEyes(id, nameId, eyes) {
      const c = curAyin(id);
      if (!c) return;
      const names = c.a.names.map((n) => (n.id === nameId ? { ...n, eyes } : n));
      setAyin(id, { names });
    },
    ayinRemoveName(id, nameId) {
      const c = curAyin(id);
      if (!c) return;
      const target = c.a.names.find((n) => n.id === nameId);
      setAyin(id, { names: c.a.names.filter((n) => n.id !== nameId) });
      if (target) get().toast('"' + target.name + '" הוסר מהרשימה');
    },
    ayinAddAnswer(id, note) {
      const c = curAyin(id);
      if (!c) return;
      const nt = note.trim();
      if (!nt) {
        get().toast('כתבו תשובה/הערה לפני השמירה');
        return;
      }
      setAyin(id, { answers: [{ date: isoToday(), note: nt }, ...c.a.answers], answeredNote: nt });
      get().toast('ההערה נשמרה — מסונכרנת לדוח היומי ולכרטיס');
    },
    ayinEditAnswer(id, index, note) {
      const c = curAyin(id);
      if (!c) return;
      const nt = note.trim();
      if (!nt) {
        get().toast('כתבו תשובה/הערה לפני השמירה');
        return;
      }
      const answers = c.a.answers.map((x, i) => (i === index ? { date: isoToday(), note: nt } : x));
      setAyin(id, { answers, answeredNote: nt });
      get().toast('ההערה עודכנה');
    },
    ayinDeleteAnswer(id, index) {
      const c = curAyin(id);
      if (!c) return;
      setAyin(id, { answers: c.a.answers.filter((_, i) => i !== index) });
      get().toast('ההערה נמחקה');
    },
    ayinSetNextTalk(id, date, time) {
      setAyin(id, { nextTalk: date, nextTalkTime: time });
    },
    ayinCallAgain(id) {
      const c = curAyin(id);
      if (!c) return;
      ayinEvent(c.sp, c.a, featLabel(get().config) + ': לדבר שוב — ' + c.sp.name, false);
      setAyin(id, {});
      get().toast('נכנסת לתזכורת בלוח');
    },
    ayinLogEyes(id, eyes, name) {
      const c = curAyin(id);
      if (!c) return;
      const entry = name ? { date: isoToday(), eyes, name } : { date: isoToday(), eyes };
      setAyin(id, { log: [entry, ...c.a.log] });
      get().toast('נרשם בהיסטוריה');
    },
    ayinRestart(id) {
      // איפוס התיק העובד — שומר את log ו-answers כהיסטוריה
      setAyin(id, {
        stage: 'new',
        names: [],
        note: '',
        nextTalk: '',
        nextTalkTime: '',
        answerPushed: false,
      });
      get().toast('נפתח מחזור חדש מההתחלה — ההיסטוריה נשמרה');
    },
    ayinApplySheet(upds) {
      if (!upds.length) return;
      // ההחלה עצמה טהורה (lib/ayin.applyAyinSheet, ratchet legacy:983-993) —
      // כאן רק setDb + טוסט כמו בלגאסי, כדי שהשינוי ייכנס לשמירה ולסנכרון.
      let logged = 0;
      setDb((db) => {
        const res = applyAyinSheet(db.supporters, upds, isoToday());
        logged = res.logged;
        return { supporters: res.supporters };
      });
      get().toast('עודכנו ' + upds.length + ' שמות · ' + logged + ' רישומי עיניים נכנסו להיסטוריה, ללוח התרומות ולדוח');
    },

    exportBackup() {
      // 🔐 מאסטר-מתג הוצאת-מידע (13.8): עובד שהמנהל חסם לו ייצוא (core.export=false
      // בכרטיס-העובד) לא יכול להוריד גיבוי — חסימה גם ברמת-הפעולה, לא רק ה-UI.
      if (!featureOn(get().config, 'core.export')) {
        get().toast('⛔ הוצאת מידע חסומה עבורך על-ידי מנהל הארגון');
        return;
      }
      void exportBackupFile(get().db).then(() => {
        get().toast(
          get().encrypted ? 'גיבוי מוצפן ירד — שמרו את הסיסמה/מפתח השחזור ✓' : 'קובץ גיבוי מלא ירד למחשב ✓',
        );
      });
    },
    fixAllPhones() {
      let n = 0;
      setDb((db) => ({
        families: db.families.map((f) => {
          const fix = (v: string) => {
            const nv = formatIsraeliPhone(v);
            if (nv !== String(v || '').trim() && nv) n++;
            return nv || v;
          };
          return {
            ...f,
            phone: fix(f.phone),
            phone2: fix(f.phone2),
            members: f.members.map((m) => ({ ...m, phone: fix(m.phone), phone2: fix(m.phone2) })),
          };
        }),
      }));
      get().toast(n ? 'נוסף 0 מוביל ל-' + n + ' טלפונים' : 'לא נמצאו טלפונים חסרי 0');
    },

    async setLockCode(kind, pin) {
      const lock: LockCfg = { ...get().lock };
      if (pin === null) {
        delete lock[kind];
        // הסרת הקוד המשני — מנקים גם את רשימת האזורים (מיותרת בלי קוד)
        if (kind === 'secondary') delete lock.zones;
      } else {
        lock[kind] = await hashPin(pin);
        if (kind === 'secondary' && !lock.zones) lock.zones = [...DEFAULT_LOCK_ZONES];
      }
      writeLock(lock);
      set({ lock });
    },
    setLockZones(zones) {
      const lock: LockCfg = { ...get().lock, zones };
      writeLock(lock);
      set({ lock });
    },
    clearLock() {
      writeLock({});
      writeSess(SESS.p, null);
      writeSess(SESS.a, null);
      set({ lock: {}, unlockedPrimary: false, unlockedAdmin: false });
    },

    async decryptUnlock(secret, via) {
      const db = await decryptAndLoad(secret, via);
      if (!db) return false;
      if (db.security?.primary || db.security?.secondary || db.security?.zones) db.security = {};
      set({ db, encrypted: true, needDecrypt: false, corrupt: false });
      // חיבור ענן לארגון מוצפן: init חוזר מוקדם במסלול res.encrypted (לפני
      // connectCloud), ולכן החיבור לא נעשה שם. בלי זה, ארגון עם config.firebase
      // שהופעלה בו הצפנה נתקע לצמיתות על "מתחבר…" (cloud.enabled && !authReady)
      // אחרי הפענוח, כי watchAuth שמעדכן authReady לעולם לא רץ. cloud.enabled
      // כבר נקבע ב-init; כאן משלימים את החיבור בפועל (פעם אחת).
      const cfg = get().config;
      if (cfg.firebase && !cloudMod) void connectCloud(cfg.firebase, cfg);
      postLoad(db, false);
      return true;
    },
    async enableEncryption(password) {
      const recoveryKey = await beginEncryption(get().db, password);
      set({ encrypted: true, needDecrypt: false });
      // beginEncryption צילם את ה-db בכניסה וכתב את אותו צילום מוצפן; עריכות
      // שקרו במהלך ה-PBKDF2 הארוך (משתמש / setDbFromRemote) עלולות להידרס.
      // dek כבר נקבע — שמירה מיידית מצפינה את המצב הנוכחי ככתיבה אחרונה.
      void saveDb(get().db);
      return recoveryKey;
    },
    async disableEncryption() {
      await stopEncryption(get().db);
      set({ encrypted: false, needDecrypt: false });
      get().toast('ההצפנה בוטלה — הנתונים נשמרים גלויים');
    },
    async changeEncryptionPassword(oldPw, newPw) {
      return persistChangePw(oldPw, newPw);
    },

    // ===== הצפנת-ענן (opt-in, SHOP10 אשכול-הפעלה) =====
    /**
     * פתיחת הצפנת-הענן: המשתמש הזין סיסמת-הצפנה (או מפתח-שחזור). מחלץ את ה-DEK
     * מה-envelope שנשמר בהמתנה, מזין אותו ל-cloudSync וממשיך את הסנכרון שהושהה.
     * true=נפתח · false=סוד שגוי.
     */
    async cloudUnlock(secret, via) {
      const pend = pendingCloudUnlock;
      if (!pend) return false;
      const dek = await openCloudKey(pend.env, secret, via);
      if (!dek) return false;
      cloudMod?.setCloudDek(dek);
      pendingCloudUnlock = null;
      setCloud({ needUnlock: false });
      pend.resume();
      return true;
    },

    /**
     * הפעלת הצפנת-הענן (פעולת-בעלים, פעם אחת): יוצר envelope (סיסמה + מפתח-שחזור),
     * כותב אותו לענן, מזין את ה-DEK, מגבה מקומית (כפוי) ואז מריץ מיגרציה — כותב
     * מחדש את כל מסמכי-הענן מוצפנים. מחזיר את מפתח-השחזור (להצגה חד-פעמית).
     * זורק בעברית על כשל. הבעלים מפעיל מההגדרות — לא רץ אוטומטית.
     */
    async enableCloudEncryption(password) {
      const mod = cloudMod;
      if (!mod) throw new Error('הענן אינו מחובר — התחברו לענן ונסו שוב');
      if (await mod.readCloudEnvelope()) throw new Error('הצפנת-הענן כבר פעילה בארגון זה');
      const recoveryKey = genRecoveryKey();
      const { env, dek } = await createCloudKey(password, recoveryKey);
      await mod.writeCloudEnvelope(env);
      mod.setCloudDek(dek);
      setCloud({ cloudEncrypted: true });
      // גיבוי כפוי לפני שינוי הנתונים בענן (רשת-ביטחון אם המיגרציה נכשלת).
      await exportBackupFile(get().db);
      // מיגרציה: כותב מחדש את כל הנתונים מוצפנים דרך נתיב ה-push הבדוק.
      await mod.encryptExistingCloud(get().db, dek);
      return recoveryKey;
    },

    markUnlocked(kind) {
      if (kind === 'primary') {
        writeSess(SESS.p, '1');
        set({ unlockedPrimary: true });
      } else {
        writeSess(SESS.a, '1');
        set({ unlockedAdmin: true });
      }
    },
    lockNow() {
      writeSess(SESS.p, null);
      writeSess(SESS.a, null);
      set({ unlockedPrimary: false, unlockedAdmin: false, view: 'home' });
      get().toast('המערכת ננעלה 🔒');
    },

    restoreDb(db) {
      logAudit('שחזור מגיבוי', 'החלפת כל הנתונים');
      const prev = get().db;
      // ניקוי security כמו ב-init/decryptUnlock: גיבוי/צילום/עותק-ענן ישן עלול
      // עדיין לשאת קודי נעילה מגובבים ב-db.security. בלי הניקוי הם היו נשמרים,
      // מסונכרנים ומצולמים (הדליפה שהמיגרציה נועדה למנוע), וה-init הבא היה מאמץ
      // אותם כנעילת מכשיר — קובע PIN שהמשתמש אינו יודע ועלול לנעול אותו בחוץ.
      if (db.security?.primary || db.security?.secondary || db.security?.zones) db.security = {};
      // מוני קבלות: גיבוי ישן נושא ערכים נמוכים (migrate זורע רק מתוך ה-rids שלו).
      // בלי clamp, pushDiff היה דורס את מסמך ה-meta המשותף בענן לערך נמוך יותר
      // → הקבלה הבאה מקבלת מספר שכבר הונפק (כפילות). מרימים לערך החי לפני set וגם
      // לפני הדחיפה לענן (לכן משכתבים את db, לא רק את התוכן של set).
      db = {
        ...db,
        seq: Math.max(prev.seq, db.seq),
        receiptSeq: Math.max(prev.receiptSeq, db.receiptSeq),
        donationSeq: Math.max(prev.donationSeq, db.donationSeq),
        // ציד-באגים 3.8.2026 (🟠): shopReceiptSeq (אישורי S- של החנות) הוא מונה-ענן
        // כמו האחרים (metaOf/bumpCounter) אך נשמט מה-clamp ⇒ שחזור גיבוי ישן דרס
        // בענן לערך נמוך ⇒ אישור S- כפול חוצה-מכשירים. ?? 0 — גיבוי שקדם לשדה.
        shopReceiptSeq: Math.max(prev.shopReceiptSeq ?? 0, db.shopReceiptSeq ?? 0),
      };
      set({ db });
      scheduleSave();
      // 12.8: שחזור = החלפה מלאה ⇒ אותה החלפה סמכותית-מיידית כמו איפוס (אחרת
      // ישויות שנגרעו בגיבוי היו קמות-לתחייה מ-snapshot-ענן בחלון ה-debounce).
      void cloudMod?.cloudReplaceNow(prev, db);
      void dailySnapshot(db);
      get().toast('הנתונים שוחזרו מהגיבוי ✓');
    },
    resetAll() {
      const prev = get().db;
      const db = emptyDb();
      set({ db });
      scheduleSave();
      // 12.8: החלפה סמכותית מיידית — הזרימה המושהית הרגילה נתנה ל-snapshot-ענן
      // להחזיר את הישויות שנמחקו (תורמים/משפחות) בחלון ה-debounce. cloudReplaceNow
      // דוחף את המחיקות מיד מ-prev הקפוא וחוסם מיזוג-מרוחק תוך-כדי.
      void cloudMod?.cloudReplaceNow(prev, db);
      get().toast('המערכת אופסה — כל הנתונים נמחקו');
    },
  };
});

// החלת ערכת הנושא על ה-DOM בכל שינוי העדפה ב-db.ui —
// מכסה גם setTheme/setAccent וגם שחזור מגיבוי (restoreDb) ואיפוס (resetAll).
useApp.subscribe((s, prev) => {
  if (s.db.ui.theme !== prev.db.ui.theme || s.db.ui.accent !== prev.db.ui.accent) {
    applyTheme(s.db.ui.theme ?? s.config.theme, s.db.ui.accent ?? s.config.accent);
  }
});

// סנכרון קוד הנעילה בין טאבים פתוחים: הנעילה נטענת פעם אחת ב-init (readLock)
// ומוחזקת ב-state, אך setLockCode/setLockZones/clearLock בטאב אחר כותבים
// למפתח ה-localStorage המשותף ('maor_lock'). בלי מאזין, טאב שכבר פתוח היה
// ממשיך להחזיק את הנעילה הישנה — אזור שהוגן זה עתה בטאב אחר נשאר פתוח אצלו
// עד רענון. אירוע 'storage' מתפרסם רק לטאבים האחרים (לא לזה שכתב) — טוענים
// מחדש מהמקור המשותף. e.key === null = localStorage.clear() → גם אז נטען מחדש.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key === lockKey() || e.key === 'maor_lock') {
      useApp.setState({ lock: readLock() });
    }
  });
  // שמירה סינכרונית ביציאה: scheduleSave עובד דרך debounce של 500ms. סגירת
  // הטאב/מעבר-אפליקציה בחלון הזה היה מאבד את השינוי האחרון. pagehide/hidden
  // כותבים סינכרונית מיד (flushSaveSync); הטיימר התלוי, אם עוד יירה, פשוט
  // יכתוב את אותו מצב (אידמפוטנטי).
  const flush = () => flushSaveSync(useApp.getState().db);
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

/** בוחרי עזר נפוצים. */

export function useFamily(id: string | null): Family | undefined {
  return useApp((s) => s.db.families.find((f) => f.id === id));
}

export function useCourse(id: string | null): Course | undefined {
  return useApp((s) => s.db.courses.find((c) => c.id === id));
}

/** כל בני המשפחה בכל המשפחות, עם שם המשפחה. */
export interface MemberWithFamily extends Member {
  famId: string;
  famName: string;
}

export function allMembers(db: Db): MemberWithFamily[] {
  const out: MemberWithFamily[] = [];
  for (const f of db.families) {
    for (const m of f.members) out.push({ ...m, famId: f.id, famName: f.name });
  }
  return out;
}
