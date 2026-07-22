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
  emptyDb,
  type Absence,
  type Course,
  type CredLogEntry,
  type Db,
  type Donation,
  type Enrollment,
  type Family,
  type Member,
  type OrgEvent,
  type Payment,
  type Room,
  type Supporter,
  type Teacher,
} from '../types/domain';
import { DEFAULT_CONFIG, type FirebaseOrgConfig, type OrgConfig } from '../types/config';
import { applyTheme, loadOrgConfig, saveConfigOverride } from '../lib/config';
import { dailySnapshot, exportBackupFile, loadDb, saveDb, setPersistNamespace } from './persist';
import type { CloudStatus, CloudUser } from './cloudSync';

export type View =
  | 'home'
  | 'families'
  | 'courses'
  | 'calendar'
  | 'diary'
  | 'supporters'
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
  /** קונפיגורציית הארגון — localStorage ← config.json ← ברירת מחדל. */
  config: OrgConfig;
  /** מצב חיבור הענן (Firebase) — ראו CloudState. */
  cloud: CloudState;

  // ענן — כניסה/יציאה (זמינים רק כש-cloud.enabled)
  cloudSignIn: (email: string, password: string) => Promise<void>;
  cloudSignOut: () => Promise<void>;
  cloudResetPassword: (email: string) => Promise<void>;

  // מחזור חיים
  init: () => Promise<void>;
  setDb: (patch: Partial<Db> | ((db: Db) => Partial<Db>)) => void;
  nextId: (prefix: string) => string;

  // ניווט
  go: (view: View) => void;
  selectFamily: (id: string | null) => void;
  selectCourse: (id: string | null) => void;
  setPalette: (open: boolean) => void;
  /**
   * דגל בקשת "משפחה חדשה" מהכרום (כותרת צֹהַר) — FamiliesView צורך אותו
   * ופותח את אותו טופס הוספה בדיוק כמו הכפתור שבמסך עצמו.
   */
  famFormReq: boolean;
  /** ניווט למסך המשפחות + פתיחת טופס ההוספה (זרימה אחת לכל נקודות הכניסה). */
  openFamilyForm: () => void;
  /** איפוס הדגל אחרי שהטופס נפתח. */
  ackFamilyForm: () => void;

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
  addAbsence: (enrollmentId: string, absence: Absence) => void;
  addPayment: (enrollmentId: string, payment: Omit<Payment, 'rid'>) => void;

  // יומן ואירועים
  upsertEvent: (ev: OrgEvent) => void;
  deleteEvent: (id: string) => void;

  // צוות, חדרים, תורמים
  upsertTeacher: (t: Teacher) => void;
  deleteTeacher: (id: string) => { ok: boolean; error?: string };
  upsertRoom: (r: Room) => void;
  upsertSupporter: (s: Supporter) => void;
  deleteSupporter: (id: string) => void;
  addDonation: (supporterId: string, donation: Omit<Donation, 'rid'>) => void;

  // גיבוי ושחזור
  exportBackup: () => void;
  restoreDb: (db: Db) => void;
  resetAll: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let toastSeq = 1;

/**
 * מודול הענן — נטען דינמית ב-init רק כשלארגון יש config.firebase, כדי
 * ש-firebase לא ייכנס ל-bundle (ולריצה) של ארגון מקומי-בלבד. null = אין ענן.
 */
type CloudSyncModule = typeof import('./cloudSync');
let cloudMod: CloudSyncModule | null = null;

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** תאריך ISO במרחק ימים מהיום (שלילי = אחורה). */
function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

/** מפתח localStorage המבטיח ריצת דעיכה אחת ביום. */
const DECAY_LS_KEY = 'maor_decay';

/**
 * מקדם מגמה (TrendFactor) — לפי 3 רשומות הלוג האחרונות:
 * כולן חיוביות → 1.2, כולן שליליות → 0.8, ביניים לפי היחס. לוג ריק → 1.
 */
function trendFactor(log: CredLogEntry[]): number {
  const last3 = log.slice(0, 3);
  if (!last3.length) return 1;
  return 0.8 + 0.4 * (last3.filter((e) => e.delta > 0).length / last3.length);
}

export const useApp = create<AppState>()((set, get) => {
  /** שמירה אוטומטית — חצי שנייה אחרי השינוי האחרון. */
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const ok = await saveDb(get().db);
      if (ok !== get().saveOk) set({ saveOk: ok });
      if (!ok) {
        get().toast('⚠ השמירה נכשלה — הורידו גיבוי מלא ובדקו מקום פנוי בדפדפן');
      }
    }, 500);
  }

  function setDb(patch: Partial<Db> | ((db: Db) => Partial<Db>)) {
    const prev = get().db;
    set((s) => ({ db: { ...s.db, ...(typeof patch === 'function' ? patch(s.db) : patch) } }));
    scheduleSave();
    // דחיפה לענן (debounced במודול הענן) — no-op כשאין ענן / בזמן החלת שינוי מרוחק
    cloudMod?.cloudOnDbChange(prev, get().db);
  }

  /** עדכון שדה cloud חלקי. */
  function setCloud(patch: Partial<CloudState>) {
    set((s) => ({ cloud: { ...s.cloud, ...patch } }));
  }

  /**
   * חיבור הענן — נקרא מ-init רק כשיש config.firebase. אסינכרוני ולא חוסם:
   * כל כשל כאן מחזיר את המערכת למצב מקומי-בלבד עם טוסט, בלי לפגוע בעבודה.
   */
  async function connectCloud(fb: FirebaseOrgConfig) {
    try {
      const mod = await import('./cloudSync');
      cloudMod = mod;
      mod.initCloud(fb);
      mod.watchAuth((user) => {
        const hadUser = get().cloud.user !== null;
        setCloud({ authReady: true, user, ...(user ? {} : { status: 'idle' as const }) });
        if (user && !hadUser) {
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
        } else if (!user && hadUser) {
          mod.stopCloudSync();
        }
      });
    } catch {
      // טעינת firebase נכשלה (רשת/חסימה) — ממשיכים מקומית, בלי מסך כניסה
      cloudMod = null;
      setCloud({ enabled: false, authReady: true, status: 'error' });
      get().toast('⚠ טעינת חיבור הענן נכשלה — עובדים מקומית בלבד');
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
    config: DEFAULT_CONFIG,
    cloud: { enabled: false, authReady: true, user: null, status: 'idle' },

    async init() {
      const config = await loadOrgConfig();
      // בידוד נתונים בין לקוחות על אותו host — חייב לקרות לפני loadDb
      setPersistNamespace(config.slug);
      const { db, corrupt } = await loadDb();
      const cloudOn = !!config.firebase;
      set({
        db,
        corrupt,
        config,
        ready: true,
        cloud: { enabled: cloudOn, authReady: !cloudOn, user: null, status: 'idle' },
      });
      // חיבור ענן — opt-in פר-ארגון; בלי config.firebase שום דבר לא משתנה
      if (config.firebase) void connectCloud(config.firebase);
      // ערכת הנושא: העדפת משתמש (db.ui) גוברת על ברירת המחדל של הארגון
      applyTheme(db.ui.theme ?? config.theme, db.ui.accent ?? config.accent);
      void dailySnapshot(db);
      if (corrupt) {
        get().toast('⚠ הנתונים השמורים נמצאו פגומים — נשמר עותק בצד. שחזרו מגיבוי דרך הגדרות ← ייבוא');
      }
      // ניקוי סימוני "טופל" ישנים (30+ ימים) — שומר על המפה קטנה
      const pruneCutoff = isoDaysAgo(30);
      const stale = Object.entries(db.attnDone ?? {}).filter(([, d]) => d < pruneCutoff);
      if (stale.length) {
        setDb((cur) => {
          const attnDone = { ...cur.attnDone };
          for (const [k] of stale) delete attnDone[k];
          return { attnDone };
        });
      }
      // דעיכת אי-פעילות — ריצה אחת ביום (guard ב-localStorage)
      const today = isoToday();
      let ranToday = false;
      try {
        ranToday = localStorage.getItem(DECAY_LS_KEY) === today;
      } catch {
        /* localStorage חסום — נריץ בכל טעינה, לא קריטי */
      }
      if (!ranToday) {
        try {
          localStorage.setItem(DECAY_LS_KEY, today);
        } catch {
          /* אין מקום / מצב פרטי */
        }
        get().runDecay();
      }
    },

    setDb,

    nextId(prefix) {
      const seq = get().db.seq;
      setDb({ seq: seq + 1 });
      return prefix + seq;
    },

    async cloudSignIn(email, password) {
      if (!cloudMod) throw new Error('חיבור הענן עדיין נטען — נסו שוב בעוד רגע');
      await cloudMod.signIn(email, password);
      // watchAuth יקלוט את המשתמש ויפעיל startCloudSync
    },
    async cloudSignOut() {
      if (!cloudMod) return;
      cloudMod.stopCloudSync();
      await cloudMod.signOutCloud();
      get().toast('התנתקת מהענן — הנתונים נשארים שמורים במכשיר');
    },
    async cloudResetPassword(email) {
      if (!cloudMod) throw new Error('חיבור הענן עדיין נטען — נסו שוב בעוד רגע');
      await cloudMod.resetPassword(email);
    },

    go: (view) => set({ view }),
    selectFamily: (id) => set({ selFamilyId: id, view: 'families' }),
    selectCourse: (id) => set({ selCourseId: id, view: 'courses' }),
    setPalette: (open) => set({ paletteOpen: open }),
    famFormReq: false,
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
    },
    deleteFamily(id) {
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
      setDb((db) => ({
        families: db.families.map((f) =>
          f.id === famId ? { ...f, members: f.members.filter((m) => m.id !== memberId) } : f,
        ),
        enrollments: db.enrollments.filter((e) => e.memberId !== memberId),
      }));
    },
    addCred(famId, delta, reason) {
      const fam = get().db.families.find((f) => f.id === famId);
      if (!fam) return;
      const prevScore = fam.cred?.score ?? 700;
      const log = fam.cred?.log ?? [];
      // מקדם מגמה — מוחל על זיכויים בלבד (כמו באב-טיפוס); חיובים עוברים כמות שהם
      const tf = trendFactor(log);
      const applied = delta > 0 ? Math.round(delta * tf) : delta;
      const newScore = Math.max(0, Math.min(1000, prevScore + applied));
      const entryReason =
        reason + (delta > 0 && tf !== 1 ? ` (מקדם מגמה ${tf.toFixed(1)})` : '');
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
      // חציית סף למדד אדום — התראה למנהל
      if (prevScore >= 300 && newScore < 300) {
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
          const last = f.cred?.log?.[0];
          if (last && last.date >= cutoff) return f; // הייתה פעילות לאחרונה
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
      setDb((db) => ({
        courses: db.courses.filter((c) => c.id !== id),
        enrollments: db.enrollments.filter((e) => e.courseId !== id),
      }));
    },
    upsertEnrollment(e) {
      setDb((db) => ({ enrollments: upsertIn(db.enrollments, e) }));
    },
    deleteEnrollment(id) {
      setDb((db) => ({ enrollments: db.enrollments.filter((e) => e.id !== id) }));
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
    addAbsence(enrollmentId, absence) {
      setDb((db) => ({
        enrollments: db.enrollments.map((e) =>
          e.id === enrollmentId ? { ...e, absences: [absence, ...e.absences] } : e,
        ),
      }));
    },
    addPayment(enrollmentId, payment) {
      const rid = 'R-' + get().db.seq;
      setDb((db) => ({
        seq: db.seq + 1,
        enrollments: db.enrollments.map((e) =>
          e.id === enrollmentId ? { ...e, payments: [{ ...payment, rid }, ...e.payments] } : e,
        ),
      }));
    },

    upsertEvent(ev) {
      setDb((db) => ({ events: upsertIn(db.events, ev) }));
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
    },
    deleteSupporter(id) {
      setDb((db) => ({ supporters: db.supporters.filter((s) => s.id !== id) }));
    },
    addDonation(supporterId, donation) {
      const rid = 'D-' + get().db.seq;
      setDb((db) => ({
        seq: db.seq + 1,
        supporters: db.supporters.map((s) => {
          if (s.id !== supporterId) return s;
          const donations = [{ ...donation, rid }, ...s.donations];
          return {
            ...s,
            donations,
            count: donations.length,
            ils: s.ils + (donation.cur === '₪' ? donation.amount : 0),
            usd: s.usd + (donation.cur === '$' ? donation.amount : 0),
            first: s.first || donation.date,
            last: donation.date > (s.last || '') ? donation.date : s.last,
          };
        }),
      }));
    },

    exportBackup() {
      exportBackupFile(get().db);
      get().toast('קובץ גיבוי מלא ירד למחשב ✓');
    },
    restoreDb(db) {
      const prev = get().db;
      set({ db });
      scheduleSave();
      cloudMod?.cloudOnDbChange(prev, db);
      void dailySnapshot(db);
      get().toast('הנתונים שוחזרו מהגיבוי ✓');
    },
    resetAll() {
      const prev = get().db;
      const db = emptyDb();
      set({ db });
      scheduleSave();
      cloudMod?.cloudOnDbChange(prev, db);
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
