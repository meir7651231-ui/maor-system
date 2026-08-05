/**
 * שלד האפליקציה: ניווט, החלפת מסכים, טוסטים, פלטת פקודות (Ctrl+K)
 * וגיבוי סוף-יום אוטומטי.
 *
 * שלד פר-ערכה (סבב 3): ערכת צֹהַר מקבלת סרגל-צד אייקונים בצד ימין (RTL)
 * + שורת כותרת עם חיפוש רחב ופעולות; שאר הערכות נשארות עם הסרגל העליון.
 * במובייל (≤760px) גם צֹהַר חוזרת לשלד העליון — הפתרון הפשוט והעמיד
 * לגלילה אופקית. הקישורים/גייטינג/מונחים זהים בשני השלדים (מערך NAV אחד).
 */
import { useEffect, useState, type JSX, type ReactNode } from 'react';
import { useApp, type View } from './store/useApp';
import { nsLsKey, parseBackupFile } from './store/persist';
import { featureOn, isAdminUser, isSuperAdmin, moduleOn, roleOf, termOf } from './lib/config';
import { hebDateFull } from './lib/hebrew';
import { isoToday } from './lib/date-util';
import { freshenDemoDb } from './lib/demoFresh';
import { todaySessions } from './components/home/homeData';
import { Btn, Modal } from './components/ui';
import { BuilderWizard } from './components/builder/BuilderWizard';
import { RemoteWizard, restoreBuilderPrev } from './components/builder/RemoteWizard';
import { ImpactWall } from './components/wall/ImpactWall';
import { MoneyTimer } from './components/timer/MoneyTimer';
import { CashRegister } from './components/timer/CashRegister';
import { BodyMap } from './components/timer/BodyMap';
import { DedupModal } from './components/families/DedupModal';
import { GuideModal } from './components/GuideModal';
import { TourOverlay } from './components/TourOverlay';
import { A11yFab } from './components/A11yFab';
import { HomeView } from './components/home/HomeView';
import { FamiliesView } from './components/families/FamiliesView';
import { CoursesView } from './components/courses/CoursesView';
import { CalendarView } from './components/calendar/CalendarView';
import { DiaryView } from './components/diary/DiaryView';
import { SupportersView } from './components/supporters/SupportersView';
import { TzedakaView } from './components/tzedaka/TzedakaView';
import { ShopView } from './components/shop/ShopView';
import { Shop7View } from './components/shop7/Shop7View';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { CommandPalette } from './components/palette/CommandPalette';
import { DemoDrop } from './components/DemoDrop';
import { DemoRibbon } from './components/DemoRibbon';
import { DayGate } from './components/wheel/DayGate';
import { LoginScreen, PendingApprovalScreen } from './components/cloud/LoginScreen';
import { PlatformPanel } from './components/platform/PlatformPanel';
import { ManagerPanel } from './components/platform/ManagerPanel';
import { AdminHub, HubButton } from './components/AdminHub';
import { LockScreen } from './components/lock/LockScreen';
import { EncUnlockScreen } from './components/lock/EncUnlockScreen';
import { CloudUnlockScreen } from './components/lock/CloudUnlockScreen';
import { DEFAULT_LOCK_ZONES } from './lib/lock';

/** צבע נקודת הסטטוס של סנכרון הענן — ירוק = synced. */
const SYNC_DOT: Record<string, { color: string; title: string }> = {
  synced: { color: '#3fae5a', title: 'מסונכרן עם הענן' },
  connecting: { color: '#e2b93b', title: 'מתחבר לענן…' },
  error: { color: '#e05252', title: 'שגיאת סנכרון — הנתונים שמורים מקומית' },
  idle: { color: '#9aa0a6', title: 'סנכרון לא פעיל' },
};

const NAV: { view: View; icon: string; label: string }[] = [
  { view: 'home', icon: '🏠', label: 'בית' },
  { view: 'families', icon: '👨‍👩‍👧‍👦', label: 'משפחות' },
  { view: 'courses', icon: '🎨', label: 'חוגים' },
  { view: 'calendar', icon: '📅', label: 'לוח שנה' },
  { view: 'diary', icon: '📖', label: 'יומן חדרים' },
  { view: 'supporters', icon: '💛', label: 'תורמים' },
  { view: 'tzedaka', icon: '🪙', label: 'קופות צדקה' },
  { view: 'shop', icon: '🛍', label: 'חנות' },
  { view: 'shop7', icon: '🚚', label: 'חלוקה' },
  { view: 'reports', icon: '📊', label: 'דוחות' },
  { view: 'settings', icon: '⚙️', label: 'הגדרות' },
];

const VIEWS: Record<View, () => JSX.Element> = {
  home: HomeView,
  families: FamiliesView,
  courses: CoursesView,
  calendar: CalendarView,
  diary: DiaryView,
  supporters: SupportersView,
  tzedaka: TzedakaView,
  shop: ShopView,
  shop7: Shop7View,
  reports: ReportsView,
  settings: SettingsView,
};

export default function App() {
  const ready = useApp((s) => s.ready);
  const view = useApp((s) => s.view);
  const go = useApp((s) => s.go);
  const dbOrgName = useApp((s) => s.db.orgName);
  const famCount = useApp((s) => s.db.families.length);
  const config = useApp((s) => s.config);
  const toasts = useApp((s) => s.toasts);
  const paletteOpen = useApp((s) => s.paletteOpen);
  const setPalette = useApp((s) => s.setPalette);
  const init = useApp((s) => s.init);
  const restoreDb = useApp((s) => s.restoreDb);
  const exportBackup = useApp((s) => s.exportBackup);
  const cloud = useApp((s) => s.cloud);
  const cloudSignOut = useApp((s) => s.cloudSignOut);
  const lock = useApp((s) => s.lock);
  const needDecrypt = useApp((s) => s.needDecrypt);
  // הערכה המוחלת בפועל — העדפת המשתמש (db.ui.theme) גוברת על ערכת הארגון
  const uiTheme = useApp((s) => s.db.ui.theme);
  const openFamilyForm = useApp((s) => s.openFamilyForm);
  const selectCourse = useApp((s) => s.selectCourse);
  const navHistLen = useApp((s) => s.navHist.length);
  const goBack = useApp((s) => s.goBack);
  const privacyMode = useApp((s) => s.privacyMode);
  const togglePrivacy = useApp((s) => s.togglePrivacy);

  useEffect(() => {
    void init();
  }, [init]);

  // דמו ציבורי (?org=demo): זריעה אוטומטית של נתוני-ההדגמה פעם בכל סשן — פרוספקט
  // נוחת במערכת מלאה בלי הרשמה (הקונפיג בלי firebase ⇒ אין שער-ענן). sessionStorage:
  // אם ניקה וטען-מחדש באותו סשן, לא נזרע שוב (מכבד את הפעולה); סשן חדש = דמו רענן.
  useEffect(() => {
    if (!ready || config.slug !== 'demo' || famCount > 0) return;
    try {
      if (sessionStorage.getItem('maor_demo_seeded') === '1') return;
    } catch {
      /* sessionStorage חסום — הבאנר הידני עדיין זמין */
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}demo.json`, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        restoreDb(freshenDemoDb(parseBackupFile(await res.text()), isoToday()));
        try {
          sessionStorage.setItem('maor_demo_seeded', '1');
        } catch {
          /* חסום */
        }
      } catch {
        /* טעינת הדמו נכשלה — הבאנר הידני (DemoDrop) עדיין זמין */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, config.slug, famCount, restoreDb]);

  // מובייל: מתחת ל-760px ערכת צֹהַר חוזרת לשלד הסרגל העליון (ראו הערת הקובץ)
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // נעילת גישה — מצב הפתיחה מנוהל ב-store (משותף, נשמר לסשן)
  const unlockedPrimary = useApp((s) => s.unlockedPrimary);
  const unlockedAdmin = useApp((s) => s.unlockedAdmin);
  const markUnlocked = useApp((s) => s.markUnlocked);

  // אשף ההרכבה — למטמיע בלבד, נפתח עם #builder בכתובת
  // ‏#builder = אשף מקומי · ‏#builder=slug = אשף קשור-ענן ללקוח (RemoteWizard, 5.8)
  const [builderOpen, setBuilderOpen] = useState(() => window.location.hash.startsWith('#builder'));
  const remoteBuilderSlug = window.location.hash.startsWith('#builder=')
    ? decodeURIComponent(window.location.hash.slice('#builder='.length))
    : null;
  // קיר ההשפעה — מצב ראווה במסך מלא, נפתח עם #wall (feature: home.impactwall)
  const [wallOpen, setWallOpen] = useState(() => window.location.hash === '#wall');
  // טיימר כסף — נפתח עם #timer (feature: core.timer)
  const [timerOpen, setTimerOpen] = useState(() => window.location.hash === '#timer');
  // קופה רושמת — נפתחת עם #cashbox (feature: core.cashbox)
  const [cashboxOpen, setCashboxOpen] = useState(() => window.location.hash === '#cashbox');
  // מפת אזורי טיפול — נפתחת עם #bodymap (feature: core.bodymap)
  const [bodymapOpen, setBodymapOpen] = useState(() => window.location.hash === '#bodymap');
  // איחוד כפילויות — נפתח עם #dedup (feature: settings.dedup)
  const [dedupOpen, setDedupOpen] = useState(() => window.location.hash === '#dedup');
  // המדריך המהיר — נפתח עם #guide (P2 פער 29, feature: shell.guide)
  const [guideOpen, setGuideOpen] = useState(() => window.location.hash === '#guide');
  // מצב הדגמה — סיור מודרך, נפתח עם #tour (P2 פער 30, feature: shell.demo)
  const [tourOpen, setTourOpen] = useState(() => window.location.hash === '#tour');
  // לוח הבקרה של הפלטפורמה — #platform, למיילי-על בלבד (CLOUD2 ענן 4)
  const [platformOpen, setPlatformOpen] = useState(() => window.location.hash === '#platform');
  // פאנל-המנהל (ORGADMIN) — #manage, למנהל-הארגון בלבד (cloud.isManager)
  const [managerOpen, setManagerOpen] = useState(() => window.location.hash === '#manage');
  // כניסת-הניהול (ADMINHUB) — בורר קטן; נפתח מכפתור 🛠 (מנהל-על בלבד), לא מ-hash
  const [adminHubOpen, setAdminHubOpen] = useState(false);
  // UX סבב-א׳ (5.8): כפתור-עזרה מאוחד (📖+▶ ⇒ ❓) + תפריט-חשבון (אווטאר)
  const [helpOpen, setHelpOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutArmed, setLogoutArmed] = useState(false);
  // 🔄 ריפוי-לשונית-תקועה (5.8 — "זה הרגע ראיתי אצל לקוח"): לשונית שנשארה
  // פתוחה ימים לא נטענת מחדש לעולם ומציגה גרסה עתיקה (נצפה בשטח: מסך-Passkey
  // מאיטרציה שנמחקה). ברגע שחוזרים ללשונית (visibilitychange) — משווים מול
  // version.json הטרי (no-store); גרסה אחרת ⇒ רענון עצמי, פעם-אחת פר-גרסה
  // (שומר-ריצה ב-sessionStorage מונע לולאה אם ה-fetch מוגש מתווך ישן).
  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      void fetch(import.meta.env.BASE_URL + 'version.json', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((v: { id?: string } | null) => {
          if (!v?.id || v.id === __BUILD_ID__) return;
          const key = 'maor_ver_reload:' + v.id;
          if (sessionStorage.getItem(key)) return;
          sessionStorage.setItem(key, '1');
          window.location.reload();
        })
        .catch(() => { /* אופליין — נבדוק בחזרה הבאה */ });
    };
    check();
    document.addEventListener('visibilitychange', check);
    const iv = window.setInterval(check, 15 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.clearInterval(iv);
    };
  }, []);

  // שחזור-קריסה של האשף-קשור-הענן (5.8): אם נשאר תצלום-מיתוג מסשן שנקטע
  // (טאב נסגר / דפדפן קרס באמצע עריכת-לקוח) והאשף לא פתוח — מחזירים את
  // מיתוג-הבעלים + הערכה-האישית (restoreBuilderPrev — localStorage, שורד סגירה).
  useEffect(() => {
    if (window.location.hash.startsWith('#builder=')) return;
    restoreBuilderPrev();
  }, []);
  useEffect(() => {
    const onHash = () => {
      setBuilderOpen(window.location.hash.startsWith('#builder'));
      setWallOpen(window.location.hash === '#wall');
      setTimerOpen(window.location.hash === '#timer');
      setCashboxOpen(window.location.hash === '#cashbox');
      setBodymapOpen(window.location.hash === '#bodymap');
      setDedupOpen(window.location.hash === '#dedup');
      setGuideOpen(window.location.hash === '#guide');
      setTourOpen(window.location.hash === '#tour');
      setPlatformOpen(window.location.hash === '#platform');
      setManagerOpen(window.location.hash === '#manage');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // קיצורי מקלדת גלובליים
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (featureOn(config, 'shell.palette')) setPalette(!useApp.getState().paletteOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPalette]);

  // גיבוי סוף-יום: פעם ביום, אחרי שעת הסיום שנקבעה בפתיחת היום
  // (localStorage 'maor_dayend', ברירת מחדל 17:00), יורד קובץ גיבוי אוטומטית
  useEffect(() => {
    const tick = setInterval(() => {
      try {
        if (!featureOn(useApp.getState().config, 'core.dayendbackup')) return;
        const today = isoToday();
        if (localStorage.getItem(nsLsKey('maor_autoexp')) === today) return;
        const [eh, em] = (localStorage.getItem(nsLsKey('maor_dayend')) || '17:00').split(':').map(Number);
        const endMin = (Number.isFinite(eh) ? eh : 17) * 60 + (Number.isFinite(em) ? em : 0);
        const now = new Date();
        if (now.getHours() * 60 + now.getMinutes() < endMin) return;
        if (!useApp.getState().db.families.length) return;
        localStorage.setItem(nsLsKey('maor_autoexp'), today);
        exportBackup();
      } catch {
        /* localStorage חסום — נדלג */
      }
    }, 60_000);
    return () => clearInterval(tick);
  }, [exportBackup]);

  if (!ready) return <div className="empty">טוען…</div>;

  const toastsEl = (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  );

  // שער הצפנה — שמירה מוצפנת שנטענה מחייבת קוד פענוח לפני כל דבר אחר
  if (needDecrypt) {
    return (
      <>
        <EncUnlockScreen />
        {toastsEl}
      </>
    );
  }

  // שער הענן: ארגון עם config.firebase מחייב התחברות לפני הכניסה לאפליקציה
  if (cloud.enabled && !cloud.authReady) return <div className="empty">מתחבר…</div>;
  if (cloud.enabled && !cloud.user) {
    return (
      <>
        <LoginScreen />
        {toastsEl}
      </>
    );
  }
  // שער החברות (CLOUD2 ענן 3) — ארגון-פלטפורמה: נרשם-שטרם-אושר לא מגיע
  // לאפליקציה; מסך המתנה עד אישור הבעלים ("תתחבר שוב")
  if (cloud.enabled && cloud.membership === 'checking') return <div className="empty">מתחבר…</div>;
  // 🗑 מצבת-מחיקה (5.8): הארגון הוסר ע"י מנהל-הפלטפורמה — המגירה המקומית נוקתה
  if (cloud.enabled && cloud.membership === 'removed') {
    return (
      <>
        <div className="empty" style={{ marginTop: 120 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🗑</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>הארגון הזה הוסר מהמערכת</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-faint)' }}>
            הנתונים המקומיים במכשיר זה נוקו. לשאלות — פנו למנהל הפלטפורמה.
          </div>
        </div>
        {toastsEl}
      </>
    );
  }
  if (cloud.enabled && cloud.membership === 'pending') {
    return (
      <>
        <PendingApprovalScreen />
        {toastsEl}
      </>
    );
  }

  // שער הצפנת-ענן (opt-in) — לארגון יש envelope ואין DEK: פתיחה בסיסמת-הצפנה
  // לפני הכניסה. ‏needUnlock=undefined ללקוח לא-מוצפן ⇒ הגייט מדלג (ביט-זהה).
  if (cloud.enabled && cloud.needUnlock) {
    return (
      <>
        <CloudUnlockScreen />
        {toastsEl}
      </>
    );
  }

  // נעילה ראשית — קוד כניסה לכל המערכת (אחרי שער הענן, אם קיים)
  if (lock.primary && !unlockedPrimary) {
    return (
      <>
        <LockScreen kind="primary" onUnlock={() => markUnlocked('primary')} />
        {toastsEl}
      </>
    );
  }

  // נעילה משנית — קוד "מנהל" לאזורים הרגישים (זהה לכל הסשן לאחר פתיחה אחת)
  const lockZones = lock.zones ?? DEFAULT_LOCK_ZONES;
  const adminNeededFor = (zone: string) =>
    !!lock.secondary && lockZones.includes(zone) && !unlockedAdmin;
  const onAdminUnlock = () => markUnlocked('secondary');
  // מנהל-על לפי מייל (config.adminEmails) — רק הוא פותח את האשף ומשנה ערכת נושא.
  const isAdmin = isAdminUser(config, cloud.user?.email);
  // תפקיד מורה (P3 פריט 15, הכרעה 2): כניסות ההגדרות (ודרכן הייבוא) מוסתרות.
  // בלי ענן/בלי roles — false ⇒ התנהגות של היום בדיוק. דגל shell.roles.
  const isTeacherUser = featureOn(config, 'shell.roles') && roleOf(config, cloud.user?.email) === 'teacher';
  // כניסת-הניהול הגלויה (ADMINHUB) — מגודרת isSuperAdmin **בלבד** (לא
  // isAdminUser, שמחזיר true לכולם כשאין adminEmails). אצל לקוח/משתמש רגיל
  // הכפתור פשוט לא קיים ב-DOM.
  const canAdminHub = isSuperAdmin(cloud.user?.email);
  // אשף-ההקמה (תיקון 5.8 — "למה כל לקוח יכול לראות אשף הקמה"): בארגון-ענן
  // isAdminUser מחזיר true-לכולם (ארגון-פלטפורמה נולד בלי adminEmails) ⇒ כל
  // לקוח שהקליד #builder קיבל את האשף המלא כולל המחירון. בארגון-ענן האשף =
  // מייל-על בלבד; שורש/דמו/אופליין — התנהגות קיימת (adminEmails).
  const canBuilder =
    cloud.enabled && config.cloudRoot !== true && config.slug !== 'default'
      ? isSuperAdmin(cloud.user?.email)
      : isAdmin;

  const Current = VIEWS[view];
  const syncDot = SYNC_DOT[cloud.status] ?? SYNC_DOT.idle;

  // מיתוג: שם מהקונפיגורציה גובר על השם השמור בנתונים
  const orgName = config.orgName || dbOrgName;
  // מודולים: בית תמיד; השאר לפי config.modules (חסר = פעיל).
  // הגדרות עברו לאייקון/פריט ⚙️ נפרד — לא קישור ברצועה.
  const nav = NAV.filter(
    (n) => n.view !== 'settings' && (n.view === 'home' || config.modules[n.view] !== false),
  );
  // תווית קישור — מונח מותאם מהמילון לשבעת מסכי המודולים; בית נשאר קבוע
  const labelOf = (n: (typeof NAV)[number]) =>
    n.view === 'home' ? n.label : termOf(config, `nav.${n.view}`, n.label);

  // מתג השלד (מוקאפים): צֹהַר = רצועת אייקונים 64px; אור ראשון = פס "לילה" רחב
  // 212px (mock-desktop); היכל וקהילה — הסרגל העליון. במובייל כולם עליון.
  const theme = uiTheme ?? config.theme;
  const shell = narrow
    ? 'top'
    : theme === 'tsohar'
      ? 'side'
      : theme === 'or-rishon'
        ? 'side-wide'
        : 'top';

  // "ניקוב מהיר" — אותה פעולה כמו בווידג'ט הפעולות המהירות במסך הבית
  const quickPunch = () => {
    const sessions = todaySessions(useApp.getState().db, new Date());
    if (sessions.length) selectCourse(sessions[0].course.id);
    else go('courses');
  };

  // ↩ חזרה גלובלי (P1.5, feature shell.navhist) — מוצג רק כשיש היסטוריה,
  // בשלושת השלדים (legacy:3146 showBack)
  const backBtn: ReactNode = featureOn(config, 'shell.navhist') && navHistLen > 0 && (
    <button
      type="button"
      className="nav-back"
      onClick={goBack}
      title="חזרה למסך הקודם"
      aria-label="חזרה למסך הקודם"
      style={{ fontWeight: 800, fontSize: 13, padding: '4px 10px', borderRadius: 9, cursor: 'pointer' }}
    >
      ↩ חזרה
    </button>
  );

  // כפתור כניסת-הניהול 🛠 — מגודר canAdminHub (isSuperAdmin בלבד). שתי גרסאות:
  // nav-gear לשלד העליון, side-link לשני שלדי-הצד. פותח את הבורר AdminHub.
  const adminGearBtn: ReactNode = canAdminHub && (
    <button
      type="button"
      className="nav-gear"
      onClick={() => setAdminHubOpen(true)}
      title="ניהול פלטפורמה"
      aria-label="ניהול פלטפורמה"
    >
      <span aria-hidden>🛠</span>
    </button>
  );
  const adminSideBtn: ReactNode = canAdminHub && (
    <button
      type="button"
      className="side-link"
      onClick={() => setAdminHubOpen(true)}
      title="ניהול פלטפורמה"
      aria-label="ניהול פלטפורמה"
    >
      <span className="side-ico" aria-hidden>🛠</span>
      <span className="nav-label">ניהול</span>
    </button>
  );

  // כפתור פאנל-המנהל 👥 (ORGADMIN) — מגודר cloud.isManager (מנהל-הארגון בלבד).
  // פותח את #manage (ManagerPanel): הרשמת-עובדים, אישורים, כרטיס-עובד.
  const openManager = () => {
    window.location.hash = '#manage';
    setManagerOpen(true);
  };
  const managerGearBtn: ReactNode = cloud.isManager && !canAdminHub && (
    <button type="button" className="nav-gear" onClick={openManager} title="ניהול העובדות" aria-label="ניהול העובדות">
      <span aria-hidden>👥</span>
    </button>
  );
  const managerSideBtn: ReactNode = cloud.isManager && !canAdminHub && (
    <button type="button" className="side-link" onClick={openManager} title="ניהול העובדות" aria-label="ניהול העובדות">
      <span className="side-ico" aria-hidden>👥</span>
      <span className="nav-label">עובדות</span>
    </button>
  );

  // ❓ עזרה מאוחדת (UX סבב-א׳): כפתור אחד לשלושת השלדים — מדריך + סיור.
  const guideOn = featureOn(config, 'shell.guide');
  const demoOn = featureOn(config, 'shell.demo');
  const helpGearBtn: ReactNode = (guideOn || demoOn) && (
    <button type="button" className="nav-gear" onClick={() => setHelpOpen(true)} title="עזרה — מדריך וסיור" aria-label="עזרה">
      <span aria-hidden>❓</span>
    </button>
  );
  const helpSideBtn: ReactNode = (guideOn || demoOn) && (
    <button type="button" className="side-link" onClick={() => setHelpOpen(true)} title="עזרה — מדריך וסיור" aria-label="עזרה">
      <span className="side-ico" aria-hidden>❓</span>
      <span className="nav-label">עזרה</span>
    </button>
  );

  // כפתור מצב-צנעה 🕶️ (SHOP10, shell.privacy) — מסתיר מסכי-מקבלי-צדקה מעיון מזדמן.
  const privacyOn = featureOn(config, 'shell.privacy');
  const privacyGearBtn: ReactNode = privacyOn && (
    <button
      type="button"
      className="nav-gear"
      onClick={togglePrivacy}
      title={privacyMode ? 'בטל מצב צנעה' : 'מצב צנעה — הסתר מקבלי צדקה'}
      aria-label="מצב צנעה"
      aria-pressed={privacyMode}
      style={privacyMode ? { background: 'var(--accent)', color: '#fff' } : undefined}
    >
      <span aria-hidden>{privacyMode ? '🕶️' : '👁'}</span>
    </button>
  );
  const privacySideBtn: ReactNode = privacyOn && (
    <button
      type="button"
      className="side-link"
      onClick={togglePrivacy}
      title={privacyMode ? 'בטל מצב צנעה' : 'מצב צנעה'}
      aria-pressed={privacyMode}
    >
      <span className="side-ico" aria-hidden>{privacyMode ? '🕶️' : '👁'}</span>
      <span className="nav-label">{privacyMode ? 'צנעה פעילה' : 'צנעה'}</span>
    </button>
  );

  // תפריט-חשבון (UX סבב-א׳): אווטאר יחיד עם טבעת-סנכרון — מייל/סטטוס/יציאה
  // עברו למודאל; 'יציאה' דורשת לחיצה-שנייה (בלי יציאה-בטעות בטאבלט).
  const userChip: ReactNode = cloud.enabled && cloud.user && (
    <button
      type="button"
      className="nav-gear"
      onClick={() => { setLogoutArmed(false); setUserMenuOpen(true); }}
      title={cloud.user.email + ' · ' + syncDot.title}
      aria-label="החשבון שלי"
      style={{ border: '2px solid ' + syncDot.color, fontWeight: 800, fontSize: 14 }}
    >
      {(cloud.user.email[0] || '?').toUpperCase()}
    </button>
  );

  const mainEl = (
    <main className="app-main">
      {adminNeededFor(view) ? (
        <LockScreen kind="secondary" onUnlock={onAdminUnlock} />
      ) : (
        <>
          {config.slug === 'demo' && <DemoRibbon />}
          {famCount === 0 && <DemoDrop />}
          <DayGate />
          <Current />
        </>
      )}
    </main>
  );

  // שלד עליון — הכרום מתחלף פר-ערכה דרך משתני --nav2-* (themes.css)
  const topShell = (
    <>
      <header className="app-top">
        <div className="brand">
          {config.logoDataUri && <img src={config.logoDataUri} alt="" />}
          <span className="brand-name">{orgName}</span>
        </div>
        <nav className="app-nav" aria-label="ניווט ראשי">
          {nav.map((n) => (
            <button
              key={n.view}
              className={view === n.view ? 'active' : ''}
              onClick={() => go(n.view)}
            >
              {labelOf(n)}
            </button>
          ))}
        </nav>
        <div className="top-tools">
          {backBtn}
          {/* צ'יפ החיפוש — פותח את פלטת הפקודות, אותו מנגנון כמו Ctrl+K */}
          {featureOn(config, 'shell.palette') && (
            <button
              type="button"
              className="nav-search"
              onClick={() => setPalette(true)}
              title="חיפוש בכל המערכת (Ctrl+K)"
            >
              <span aria-hidden>🔍</span>
              <span className="nav-search-label">חיפוש בכל המערכת</span>
              <kbd aria-hidden>Ctrl K</kbd>
            </button>
          )}
          {/* ❓ עזרה מאוחדת (UX סבב-א׳) — מדריך+סיור בכפתור אחד */}
          {helpGearBtn}
          {privacyGearBtn}
          {adminGearBtn}
          {managerGearBtn}
          {!isTeacherUser && (
            <button
              type="button"
              className={'nav-gear' + (view === 'settings' ? ' active' : '')}
              onClick={() => go('settings')}
              title="הגדרות"
              aria-label="הגדרות"
            >
              <span aria-hidden>⚙️</span>
            </button>
          )}
          {userChip}
        </div>
      </header>
      {mainEl}
    </>
  );

  // שלד סרגל-צד רחב (אור ראשון, mock-desktop) — פס "לילה" 212px בצד ימין:
  // מיתוג בסריף זהב + קו-שיער זוהר, קישורי אייקון+תווית, הגדרות כקישור רגיל,
  // וצ'יפ חיפוש (Ctrl+K) בתחתית. אין שורת כותרת — ה-hero הוא ראש העמוד.
  const sideWideShell = (
    <>
      <aside className="app-side side-wide">
        <div className="side-brand">
          {config.logoDataUri && <img src={config.logoDataUri} alt="" />}
          {orgName}
          <small>מ ע ר כ ת &nbsp; נ י ה ו ל</small>
        </div>
        <div className="side-glow" aria-hidden />
        <nav className="side-nav" aria-label="ניווט ראשי">
          {nav.map((n) => {
            const label = labelOf(n);
            return (
              <button
                key={n.view}
                className={'side-link' + (view === n.view ? ' active' : '')}
                onClick={() => go(n.view)}
                title={label}
              >
                <span className="side-ico" aria-hidden>{n.icon}</span>
                <span className="nav-label">{label}</span>
              </button>
            );
          })}
          {!isTeacherUser && (
            <button
              type="button"
              className={'side-link' + (view === 'settings' ? ' active' : '')}
              onClick={() => go('settings')}
              title="הגדרות"
            >
              <span className="side-ico" aria-hidden>⚙️</span>
              <span className="nav-label">הגדרות</span>
            </button>
          )}
          {helpSideBtn}
          {privacySideBtn}
          {adminSideBtn}
          {managerSideBtn}
        </nav>
        <div className="side-sp" aria-hidden />
        {backBtn}
        <button
          type="button"
          className="side-k"
          onClick={() => setPalette(true)}
          title="חיפוש בכל המערכת (Ctrl+K)"
        >
          <span aria-hidden>🔍</span>
          <span>חיפוש מהיר</span>
          <kbd aria-hidden>Ctrl K</kbd>
        </button>
        {userChip}
      </aside>
      <div className="side-body">{mainEl}</div>
    </>
  );

  // שלד סרגל-צד (צֹהַר) — רצועת אייקונים בצד ימין (RTL) + שורת כותרת עם
  // חיפוש רחב ופעולות ראשיות. כל קישור מציג אייקון + תווית קטנה מתחתיו
  // (נגישות + התאמה לבודקי הטקסט של Playwright), בתוספת title ו-aria-label.
  const sideShell = (
    <>
      <aside className="app-side">
        {/* לוגו הארגון; באין לוגו — ריבוע accent עם האות הראשונה (כמו במוקאפ) */}
        <div className="side-logo">
          {config.logoDataUri ? (
            <img src={config.logoDataUri} alt="" />
          ) : (
            <span className="side-logo-fallback" aria-hidden>
              {(orgName || 'מ').trim().charAt(0)}
            </span>
          )}
        </div>
        {/* בכוונה בלי .app-nav — צבעי הרצועה העליונה (--nav2-*) לא חלים על הצד */}
        <nav className="side-nav" aria-label="ניווט ראשי">
          {nav.map((n) => {
            const label = labelOf(n);
            return (
              <button
                key={n.view}
                className={'side-link' + (view === n.view ? ' active' : '')}
                onClick={() => go(n.view)}
                title={label}
                aria-label={label}
              >
                <span className="side-ico" aria-hidden>{n.icon}</span>
                <span className="nav-label">{label}</span>
              </button>
            );
          })}
        </nav>
        {!isTeacherUser && (
          <button
            type="button"
            className={'side-link side-gear' + (view === 'settings' ? ' active' : '')}
            onClick={() => go('settings')}
            title="הגדרות"
            aria-label="הגדרות"
          >
            <span className="side-ico" aria-hidden>⚙️</span>
            <span className="nav-label">הגדרות</span>
          </button>
        )}
        {privacySideBtn}
          {adminSideBtn}
          {managerSideBtn}
      </aside>
      <div className="side-body">
        <header className="side-head">
          <div className="brand">
            {config.logoDataUri && <img src={config.logoDataUri} alt="" />}
            <span className="brand-name">
              {orgName}
              <span className="side-brand-sub">{hebDateFull(isoToday())}</span>
            </span>
          </div>
          {/* צ'יפ חיפוש-פקודה רחב — אותו מנגנון בדיוק כמו Ctrl+K */}
          <button
            type="button"
            className="side-search"
            onClick={() => setPalette(true)}
            title="חיפוש בכל המערכת (Ctrl+K)"
          >
            <span aria-hidden>🔍</span>
            {/* מטריצת-ורטיקלים 4.8.2026: רמז-החיפוש בנוי ממונחי-הארגון — היה קשיח ודלף לכל מסך */}
            <span className="side-search-label">
              {'חיפוש או פקודה — ' +
                termOf(config, 'entity.family', 'משפחה') + ', ' +
                termOf(config, 'entity.course', 'חוג') + ', ' +
                termOf(config, 'entity.supporter', 'תורם') + ', דוח…'}
            </span>
            <kbd aria-hidden>Ctrl K</kbd>
          </button>
          <div className="side-actions">
            {backBtn}
            {moduleOn(config, 'families') && (
              <Btn kind="primary" onClick={openFamilyForm} title={'פתיחת טופס הוספת ' + termOf(config, 'entity.family', 'משפחה')}>
                {'+ הוספת ' + termOf(config, 'entity.family', 'משפחה')}
              </Btn>
            )}
            {moduleOn(config, 'courses') && (
              <Btn onClick={quickPunch} title="ניקוב מהיר — לחוג הקרוב של היום">
                ניקוב מהיר
              </Btn>
            )}
            {userChip}
          </div>
        </header>
        {mainEl}
      </div>
    </>
  );

  return (
    <div className={'app-shell' + (shell === 'top' ? '' : ' shell-side')}>
      {shell === 'side' ? sideShell : shell === 'side-wide' ? sideWideShell : topShell}

      {paletteOpen && featureOn(config, 'shell.palette') && <CommandPalette />}

      {/* כניסת-הניהול (ADMINHUB) — נפתחת רק ממנהל-על (הכפתור מגודר canAdminHub);
          הבורר מנתב לכלים דרך ה-hash כך שהקישורים הישנים ממשיכים לעבוד */}
      {/* ❓ בורר-עזרה (UX סבב-א׳) — ה-hash-ים #guide/#tour ממשיכים לעבוד כרגיל */}
      {helpOpen && (
        <Modal title="❓ עזרה" onClose={() => setHelpOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {guideOn && (
              <HubButton emoji="📖" title="המדריך המהיר" sub="הסבר קצר על כל מסך ומה עושים בו" onClick={() => { setHelpOpen(false); window.location.hash = '#guide'; }} />
            )}
            {demoOn && (
              <HubButton emoji="▶" title="סיור מודרך" sub="מצב הדגמה — המערכת מדגימה את עצמה" onClick={() => { setHelpOpen(false); window.location.hash = '#tour'; }} />
            )}
          </div>
        </Modal>
      )}
      {/* תפריט-החשבון (UX סבב-א׳) — מייל, סטטוס-סנכרון כטקסט, יציאה בשני צעדים */}
      {userMenuOpen && cloud.user && (
        <Modal title="החשבון שלי" onClose={() => setUserMenuOpen(false)}>
          <div style={{ direction: 'ltr', textAlign: 'end', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{cloud.user.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12 }}>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: 99, background: syncDot.color, display: 'inline-block' }} />
            {syncDot.title}
          </div>
          <div className="modal-actions">
            <Btn kind={logoutArmed ? 'danger' : 'plain'} onClick={() => { if (!logoutArmed) return setLogoutArmed(true); setUserMenuOpen(false); void cloudSignOut(); }}>
              {logoutArmed ? 'לחצו שוב ליציאה' : 'יציאה מהחשבון'}
            </Btn>
            <Btn onClick={() => setUserMenuOpen(false)}>סגירה</Btn>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>היציאה לא מוחקת כלום — הנתונים נשארים במכשיר.</div>
        </Modal>
      )}
      {adminHubOpen && canAdminHub && (
        <AdminHub
          onClose={() => setAdminHubOpen(false)}
          onOpenPlatform={() => {
            setAdminHubOpen(false);
            window.location.hash = '#platform';
            setPlatformOpen(true);
          }}
          onOpenBuilder={() => {
            setAdminHubOpen(false);
            window.location.hash = '#builder';
            setBuilderOpen(true);
          }}
          onOpenManage={cloud.isManager ? () => { setAdminHubOpen(false); openManager(); } : undefined}
        />
      )}

      {builderOpen &&
        (!canBuilder ? (
          // אשף ההקמה — למנהל-על בלבד (לפי המייל). משתמש-לקוח שמנסה #builder
          // מקבל הודעת אין-הרשאה, לא את האשף.
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)' }}>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '';
                setBuilderOpen(false);
              }}
              title="חזרה"
              style={{
                position: 'absolute',
                insetInlineStart: 16,
                top: 16,
                zIndex: 1,
                background: 'none',
                border: 'none',
                color: 'var(--ink-faint)',
                fontSize: 13,
                cursor: 'pointer',
                padding: 8,
              }}
            >
              ✕ חזרה
            </button>
            <div className="empty" style={{ marginTop: 120 }}>
              🔒 אשף ההקמה זמין למנהל המערכת בלבד.
            </div>
          </div>
        ) : remoteBuilderSlug ? (
          // אשף-הרכבה קשור-ענן (5.8) — עריכת לקוח-פלטפורמה באשף המלא; מיילי-על בלבד
          isSuperAdmin(cloud.user?.email) ? (
            <RemoteWizard
              slug={remoteBuilderSlug}
              onClose={() => {
                window.location.hash = '#platform'; // חזרה ללוח-הבקרה
              }}
            />
          ) : (
            <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)' }}>
              <div className="empty" style={{ marginTop: 120 }}>🔒 עריכת לקוח-ענן זמינה למנהל הפלטפורמה בלבד.</div>
            </div>
          )
        ) : (
          <BuilderWizard
            onClose={() => {
              window.location.hash = '';
              setBuilderOpen(false);
            }}
          />
        ))}

      {platformOpen &&
        (isAdmin && isSuperAdmin(cloud.user?.email) ? (
          // לוח הבקרה של הפלטפורמה (CLOUD2 ענן 4) — מיילי-על בלבד; משתמש
          // אחר שמנסה #platform מקבל אין-הרשאה, לא את הלוח
          <PlatformPanel
            onClose={() => {
              window.location.hash = '';
              setPlatformOpen(false);
            }}
          />
        ) : (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)' }}>
            <div className="empty" style={{ marginTop: 120 }}>
              🔒 לוח הבקרה של הפלטפורמה זמין למנהל הפלטפורמה בלבד.
            </div>
          </div>
        ))}

      {/* פאנל-המנהל (ORGADMIN) — #manage, למנהל-הארגון בלבד (cloud.isManager) */}
      {managerOpen && cloud.isManager && (
        <ManagerPanel
          onClose={() => {
            window.location.hash = '';
            setManagerOpen(false);
          }}
        />
      )}

      {wallOpen && featureOn(config, 'home.impactwall') && (
        <ImpactWall
          onClose={() => {
            window.location.hash = '';
            setWallOpen(false);
          }}
        />
      )}

      {timerOpen && featureOn(config, 'core.timer') && (
        <MoneyTimer
          onClose={() => {
            window.location.hash = '';
            setTimerOpen(false);
          }}
        />
      )}

      {cashboxOpen && featureOn(config, 'core.cashbox') && (
        <CashRegister
          onClose={() => {
            window.location.hash = '';
            setCashboxOpen(false);
          }}
        />
      )}

      {bodymapOpen && featureOn(config, 'core.bodymap') && (
        <BodyMap
          onClose={() => {
            window.location.hash = '';
            setBodymapOpen(false);
          }}
        />
      )}

      {dedupOpen && featureOn(config, 'settings.dedup') && (
        <DedupModal
          onClose={() => {
            window.location.hash = '';
            setDedupOpen(false);
          }}
        />
      )}

      {guideOpen && featureOn(config, 'shell.guide') && (
        <GuideModal
          onClose={() => {
            window.location.hash = '';
            setGuideOpen(false);
          }}
        />
      )}

      {tourOpen && featureOn(config, 'shell.demo') && (
        <TourOverlay
          onClose={() => {
            window.location.hash = '';
            setTourOpen(false);
          }}
        />
      )}

      {featureOn(config, 'shell.a11yfab') && <A11yFab />}

      {toastsEl}
    </div>
  );
}
