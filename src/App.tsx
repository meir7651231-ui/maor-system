/**
 * שלד האפליקציה: ניווט, החלפת מסכים, טוסטים, פלטת פקודות (Ctrl+K)
 * וגיבוי סוף-יום אוטומטי.
 *
 * שלד פר-ערכה (סבב 3): ערכת צֹהַר מקבלת סרגל-צד אייקונים בצד ימין (RTL)
 * + שורת כותרת עם חיפוש רחב ופעולות; שאר הערכות נשארות עם הסרגל העליון.
 * במובייל (≤760px) גם צֹהַר חוזרת לשלד העליון — הפתרון הפשוט והעמיד
 * לגלילה אופקית. הקישורים/גייטינג/מונחים זהים בשני השלדים (מערך NAV אחד).
 */
import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { useApp, type View } from './store/useApp';
import { nsLsKey, parseBackupFile } from './store/persist';
import { applyFavicon, featureOn, integrationOn, isAdminUser, isSuperAdmin, moduleOn, publicSiteOn, roleOf, telephonyOn, termOf } from './lib/config';
import { applyOrgManifest, isIos, isStandalone, promptInstall, registerPwa } from './lib/pwa';
import { runOriginGuard } from './lib/originGuard';
import { setExportBlocked } from './lib/exportGate';
import { hebDateFull } from './lib/hebrew';
import { isoToday } from './lib/date-util';
import { freshenDemoDb } from './lib/demoFresh';
import { todaySessions } from './components/home/homeData';
import { Btn, Modal } from './components/ui';
import { ImpactWall } from './components/wall/ImpactWall';
import { MoneyTimer } from './components/timer/MoneyTimer';
import { CashRegister } from './components/timer/CashRegister';
import { BodyMap } from './components/timer/BodyMap';
import { DedupModal } from './components/families/DedupModal';
import { CallerLookup } from './components/CallerLookup';
import { GuideModal } from './components/GuideModal';
import { TourOverlay } from './components/TourOverlay';
import { A11yFab } from './components/A11yFab';
import { UpdateBanner } from './components/UpdateBanner';
import { HomeView } from './components/home/HomeView';
import { CommandPalette } from './components/palette/CommandPalette';
import { DemoDrop } from './components/DemoDrop';
import { DemoRibbon } from './components/DemoRibbon';
import { DayGate } from './components/wheel/DayGate';
import { ChangePasswordModal } from './components/cloud/ChangePasswordModal';
import { NetCheckModal } from './components/cloud/NetCheckModal';
import { SupportChatModal, SupportInbox, TeamChatModal } from './components/support/SupportChat';
import { latestTeamAt, teamUnreadCount, type TeamMsg } from './lib/supportChat';
import { AdminHub, HubButton } from './components/AdminHub';
import { LockScreen } from './components/lock/LockScreen';
import { EncUnlockScreen } from './components/lock/EncUnlockScreen';
import { CloudUnlockScreen } from './components/lock/CloudUnlockScreen';
import { DEFAULT_LOCK_ZONES } from './lib/lock';

/* ⚡ VISION-LIGHT ‏#13 — פיצול-chunks לפי מודולים: כל מסך-מודול נטען עצל
 * ‏(React.lazy) ב-chunk משלו; הבנדל הראשי נשאר בית+שלד. ה-loaders משותפים
 * ל-lazy ולחימום-ב-idle (רק מודולים דלוקים — "האתר שלך שוקל רק מה שהדלקת").
 * מדליף-רענון: ‏vite:preloadError ב-main.tsx מרענן על chunk שהוחלף ב-deploy. */
const VIEW_LOADERS = {
  families: () => import('./components/families/FamiliesView'),
  courses: () => import('./components/courses/CoursesView'),
  reenroll: () => import('./components/courses/ReenrollView'),
  calendar: () => import('./components/calendar/CalendarView'),
  diary: () => import('./components/diary/DiaryView'),
  supporters: () => import('./components/supporters/SupportersView'),
  tzedaka: () => import('./components/tzedaka/TzedakaView'),
  shop: () => import('./components/shop/ShopView'),
  shop7: () => import('./components/shop7/Shop7View'),
  reports: () => import('./components/reports/ReportsView'),
  settings: () => import('./components/settings/SettingsView'),
} as const;
const FamiliesView = lazy(async () => ({ default: (await VIEW_LOADERS.families()).FamiliesView }));
const CoursesView = lazy(async () => ({ default: (await VIEW_LOADERS.courses()).CoursesView }));
const ReenrollView = lazy(VIEW_LOADERS.reenroll);
const CalendarView = lazy(async () => ({ default: (await VIEW_LOADERS.calendar()).CalendarView }));
const DiaryView = lazy(async () => ({ default: (await VIEW_LOADERS.diary()).DiaryView }));
const SupportersView = lazy(async () => ({ default: (await VIEW_LOADERS.supporters()).SupportersView }));
const TzedakaView = lazy(async () => ({ default: (await VIEW_LOADERS.tzedaka()).TzedakaView }));
const ShopView = lazy(async () => ({ default: (await VIEW_LOADERS.shop()).ShopView }));
const Shop7View = lazy(async () => ({ default: (await VIEW_LOADERS.shop7()).Shop7View }));
const ReportsView = lazy(async () => ({ default: (await VIEW_LOADERS.reports()).ReportsView }));
const SettingsView = lazy(async () => ({ default: (await VIEW_LOADERS.settings()).SettingsView }));
// משטחי-ניהול/כניסה נדירים — עצלים גם הם (מנהל-על/מרקטינג לא מכבידים על כולם)
const BuilderWizard = lazy(async () => ({ default: (await import('./components/builder/BuilderWizard')).BuilderWizard }));
const RemoteWizard = lazy(async () => ({ default: (await import('./components/builder/RemoteWizard')).RemoteWizard }));
const PlatformPanel = lazy(async () => ({ default: (await import('./components/platform/PlatformPanel')).PlatformPanel }));
const ManagerPanel = lazy(async () => ({ default: (await import('./components/platform/ManagerPanel')).ManagerPanel }));
const PublicSite = lazy(async () => ({ default: (await import('./components/public/PublicSite')).PublicSite }));
const LoginScreen = lazy(async () => ({ default: (await import('./components/cloud/LoginScreen')).LoginScreen }));
const PendingApprovalScreen = lazy(async () => ({ default: (await import('./components/cloud/LoginScreen')).PendingApprovalScreen }));
// 🤖 "שאל את מאור" (VISION-LIGHT #30) — עצל: נטען רק בפתיחה ממרכז-העזרה
const AskMaorModal = lazy(async () => ({ default: (await import('./components/AskMaor')).AskMaorModal }));
/** מפתח תצלום-המיתוג של האשף-קשור-הענן — חייב להיות זהה ל-BUILDER_PREV_KEY
 *  ב-RemoteWizard (ננעל ב-ratchet bundle-light; ייבוא-ערך סטטי היה מחזיר את
 *  chunk-האשף לבנדל הראשי). */
const BUILDER_PREV_LS = 'maor_builder_prev';

/** צבע נקודת הסטטוס של סנכרון הענן — ירוק = synced. */
/** תקרת החיבור-החי מנדרים: מעל זה = גיבוי-בּאלק (לא טפטוף בזמן-אמת) ⇒ מדולג
 *  בחיבור-החי כדי לא להקפיא את הדפדפן; עובר למסך 🔄 הידני. (תקרית 19.8: משיכת
 *  reset מ-2019 העמידה ~12K ממתינים ⇒ החיבור-החי הקפיא/הפיל את האתר על כל טעינה.) */
const NED_LIVE_MAX = 400;

const SYNC_DOT: Record<string, { color: string; title: string }> = {
  synced: { color: '#3fae5a', title: 'מסונכרן עם הענן' },
  pending: { color: '#5b8def', title: 'שינויים ממתינים לסנכרון…' },
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

const VIEWS: Record<View, ComponentType> = {
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
  reenroll: ReenrollView,
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
  const applyNedarimAuto = useApp((s) => s.applyNedarimAuto);
  const autoMatchPlanned = useApp((s) => s.autoMatchPlanned);
  const seedOverduePlannedReminders = useApp((s) => s.seedOverduePlannedReminders);

  useEffect(() => {
    void init();
  }, [init]);

  // 🔴 חיבור-אוטומטי-לייב מנדרים: כשהענן מחובר וההרחבה 'payments' דלוקה, מאזינים
  // לתשלומים-הנכנסים הממתינים (onSnapshot) — כל חיוב חדש שה-webhook כותב נכנס
  // לכרטיס-התומך התואם מיד (לפי מפתחות), ואז מסומן handled. שקט, אידמפוטנטי
  // (דדופ-txn). הייבוא-ההמוני של רשימת-התורמים נשאר במסך 🔄 עם תצוגה-מקדימה.
  const nedAutoOn = cloud.enabled && !!cloud.user && !cloud.needUnlock && cloud.membership !== 'pending' && cloud.membership !== 'removed' && integrationOn(config, 'payments');
  useEffect(() => {
    if (!nedAutoOn) return;
    let alive = true;
    let unsub: (() => void) | null = null;
    void import('./store/cloudSync').then((m) => {
      if (!alive) return;
      unsub = m.watchIncomingPayments((rows) => {
        useApp.setState({ nedPending: rows.length }); // חיווי-מונה (תג + "מושהה") — תמיד
        // 🐛 נחיל-סולה C3: ערימת-סולה הממתינה (אישור-ידני במכוון) נספרה בתקרת
        // NED_LIVE_MAX והשתיקה את החיבור-החי של נדרים. סולה מסוננת מהחיבור-החי.
        const nedRows = rows.filter((r) => r.provider !== 'sola');
        if (!nedRows.length) return;
        // ⚠️ חיבור-חי מיועד ל**טפטוף בזמן-אמת** (חיוב-חדש בודד מה-webhook). גיבוי-
        // היסטורי גדול (מאות/אלפי ממתינים, למשל משיכת reset מ-2019) **לא** מעובד
        // כאן — זה היה מריץ אלפי חישובים + אלפי כתיבות-ענן סינכרונית על כל טעינה
        // ומקפיא/מפיל את הדפדפן (תקרית 19.8). מעל הסף ⇒ מדלגים; הבּאלק עובר למסך
        // 🔄 הידני עם תצוגה-מקדימה (מנה אחת, לא לולאה). ratchet: nedarim-backfill-guard.
        if (nedRows.length > NED_LIVE_MAX) return;
        // attachOnly ⇒ מחזיר רק את מזהי-העסקאות שחוברו לכרטיס-קיים; מה שלא-תואם
        // נשאר pending (ל-🔄 הידני) ⇒ לא מסמנים handled ולא יוצרים כרטיסים.
        const handled = applyNedarimAuto(nedRows);
        for (const id of handled) void m.markIncomingPayment(id).catch(() => {});
        // 🔍 שיוך-אוטומטי לחיובים-מתוכננים (בקשת-בעלים 25.8): מה שלא-חובר לכרטיס
        // נבדק גם מול הפלנים הפתוחים (D-/R-/S-). התאמה חד-משמעית ⇒ chargeXxx רץ,
        // המסמך הרשמי נופק, וה-incoming מסומן handled בענן.
        const stillPending = nedRows.filter((r) => !handled.includes(r.id));
        if (stillPending.length) {
          const { matched } = autoMatchPlanned(stillPending);
          for (const id of matched) void m.markIncomingPayment(id).catch(() => {});
        }
      });
    });
    return () => {
      alive = false;
      if (unsub) unsub();
    };
  }, [nedAutoOn, applyNedarimAuto, autoMatchPlanned]);

  // 📞 תזכורות-שלא-נכנס (בקשת-בעלים 25.8): פעם-ביום בסטארט-אפ, זורע אירוע-שיחה
  // בלוח לפלנים שעברו-תאריכם ולא-חויבו. spId=planId מונע כפילות (nsLsKey לא
  // נדרש — spId ב-events הוא מפתח-המניעה הטבעי).
  const plannedRemindersOn =
    (config.features?.['supporters.plannedcharges'] === true) ||
    (config.features?.['courses.plannedcharges'] === true) ||
    (config.features?.['shop.plannedcharges'] === true);
  useEffect(() => {
    if (!plannedRemindersOn) return;
    // דילוג בסביבת Playwright (navigator.webdriver) — E2E לא מריץ ריפויים אוטומטיים
    if (typeof navigator !== 'undefined' && (navigator as { webdriver?: boolean }).webdriver) return;
    try {
      seedOverduePlannedReminders(new Date().toISOString().slice(0, 10));
    } catch {
      /* אל תפיל את-האפליקציה על שגיאת-תזכורת */
    }
  }, [plannedRemindersOn, seedOverduePlannedReminders]);

  // אייקון-הארגון (זהות-ורטיקל) — favicon מאימוג'י כשמוגדר; חסר ⇒ הדיפולט (זהב).
  // ה-store כבר קורא applyTheme (ערכה+צבע+תנועה); ה-favicon אינו על ה-root, לכן כאן.
  useEffect(() => {
    applyFavicon(config.emoji);
  }, [config.emoji]);

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

  // 🌐 אתר ציבורי (shell.publicsite) — נפתח בכתובת ‎?site‎ או ‎#site‎, לפני שער-
  // הענן (המבקר לא צריך חשבון). "כניסה למערכת" מנקה את הבקשה וממשיך לאפליקציה.
  const [siteRequested, setSiteRequested] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).has('site') || window.location.hash === '#site';
    } catch {
      return false;
    }
  });

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
  // כרטיס שיחה-נכנסת (מודול טלפוניה): #caller = ידני · #call=<מספר> = מזוהה-מראש
  const [callerOpen, setCallerOpen] = useState(() => window.location.hash === '#caller');
  const [incomingNumber, setIncomingNumber] = useState<string | null>(null);
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
  // 🤖 שאל-את-מאור — opt-in מפורש; חסר-דגל = הכפתור לא קיים
  const askMaorOn = config.features?.['shell.askmaor'] === true;
  const [askOpen, setAskOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutArmed, setLogoutArmed] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [netCheckOpen, setNetCheckOpen] = useState(false);
  // 💬 צ׳אט-תמיכה חי (17.8) — לקוח↔תמיכת-אורביט דרך Firestore. supportOpen=מודאל-הלקוח;
  // supportInboxOpen=תיבת-השיחות של מייל-העל. שניהם מ-❓, מגודרי ענן+התחברות.
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportInboxOpen, setSupportInboxOpen] = useState(false);
  // 💬 צ׳אט-צוות תוך-ארגוני (17.8) — מגודר shell.teamchat + ענן+התחברות.
  // ‏#teamchat = כניסה מפורשת (מצ׳יפ-ההגדרות/פלטה) כמו #manage/#platform.
  const [teamChatOpen, setTeamChatOpen] = useState(() => window.location.hash === '#teamchat');
  // 🔴 חיווי "הודעת-צוות שלא-נקראה" על-המסך (בקשת-בעלים 30.8: "שיופיע על המסך
  // כהודעה שלא נקראה וגם איפה נכנסים אליו"). מנוי-חי ברמת-האפליקציה — רק כשהצ׳אט
  // זמין (shell.teamchat + ענן + התחברות). מונה טהור מול סימן-נקרא מקומי פר-ארגון
  // (nsLsKey); פתיחת-הצ׳אט מסמנת הכול-נקרא. ההודעות-שלי לא נספרות.
  const teamchatAvail = featureOn(config, 'shell.teamchat') && cloud.enabled && !!cloud.user;
  const teamSlug = config.slug || 'default';
  const [teamMsgs, setTeamMsgs] = useState<TeamMsg[]>([]);
  const [teamReadAt, setTeamReadAt] = useState<string>(() => {
    try { return localStorage.getItem(nsLsKey('maor_teamchat_read')) || ''; } catch { return ''; }
  });
  useEffect(() => {
    if (!teamchatAvail) { setTeamMsgs([]); return; }
    let unsub: (() => void) | undefined;
    void import('./store/cloudSync').then((m) => { unsub = m.watchTeamMessages(teamSlug, setTeamMsgs); });
    return () => unsub?.();
  }, [teamchatAvail, teamSlug]);
  const teamUnread = teamUnreadCount(teamMsgs, teamReadAt, (cloud.user?.email || '').toLowerCase());
  const markTeamRead = () => {
    const v = latestTeamAt(teamMsgs) || new Date().toISOString();
    setTeamReadAt(v);
    try { localStorage.setItem(nsLsKey('maor_teamchat_read'), v); } catch { /* אחסון חסום — לא קריטי */ }
  };
  // בזמן שהצ׳אט פתוח (וכשמגיעות הודעות תוך-כדי) — נשארים "נקרא".
  useEffect(() => {
    if (teamChatOpen) markTeamRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamChatOpen, teamMsgs]);
  // UX סבב-ב׳: 'עוד ▾' לרצועת-הניווט + ניווט-תחתון במובייל
  const [moreNavOpen, setMoreNavOpen] = useState(false);
  // 🔄 ריפוי-לשונית-תקועה (5.8) — לשונית שנשארה פתוחה ימים מציגה גרסה עתיקה.
  // הבדיקה מול version.json והצגת ה"יש-גרסה-חדשה" עברו ל-<UpdateBanner/>
  // (בקשת-בעלים 31.8): במקום רענון-שקט-פתע — באנר עדין עם "רענן עכשיו",
  // כדי שהלקוח יֵדע שיצאה גרסה וישלוט ברגע-הרענון (לא יאבד עבודה).

  // PWA (6.8): רישום ה-service-worker (מגודר shell.pwa, מדולג ב-Playwright/דב)
  // + מניפסט פר-ארגון — לקוח מתקין אפליקציה עם השם שלו שנפתחת בארגון שלו.
  useEffect(() => {
    registerPwa(config);
    applyOrgManifest(config);
    // הגנת-מקור (16.8) — שומר-מארח: אזהרת-זכויות אם האתר רץ ממארח לא-מוכר
    // (עותק-מגורר). דורמנטי בלי config.allowedHosts. הרתעה+זיהוי, לא חוסם.
    runOriginGuard(config.allowedHosts, config.orgName);
  }, [config]);

  // 🔐 שער יציאת-מידע (13.8, בקשת-בעלים): המנהל מכבה `core.export` בכרטיס-העובד ⇒
  // כל נתיב הורדה/הדפסה/העתקה מסרב בנקודת-חנק אחת (lib/exportGate). חסר-דגל=מותר,
  // רק false חוסם — לכן ברירת-המחדל ואף לקוח רגיל אינם מושפעים.
  useEffect(() => {
    setExportBlocked(!featureOn(config, 'core.export'), () =>
      useApp.getState().toast('⛔ הוצאת מידע חסומה עבורך על-ידי מנהל הארגון'),
    );
  }, [config]);

  // שחזור-קריסה של האשף-קשור-הענן (5.8): אם נשאר תצלום-מיתוג מסשן שנקטע
  // (טאב נסגר / דפדפן קרס באמצע עריכת-לקוח) והאשף לא פתוח — מחזירים את
  // מיתוג-הבעלים + הערכה-האישית (restoreBuilderPrev — localStorage, שורד סגירה).
  useEffect(() => {
    if (window.location.hash.startsWith('#builder=')) return;
    // ⚡ ‏#13: ‏chunk-האשף נטען רק אם באמת נשאר תצלום-מיתוג מסשן שנקטע —
    // בלי התצלום (המקרה הרגיל) אף בייט של האשף לא יורד.
    if (!localStorage.getItem(BUILDER_PREV_LS)) return;
    void import('./components/builder/RemoteWizard').then((m) => m.restoreBuilderPrev());
  }, []);

  // ⚡ חימום-ב-idle (VISION-LIGHT ‏#13): אחרי שהבית חי, מסכי המודולים הדלוקים
  // בלבד נטענים ברקע — ניווט מיידי בלי להכביד על הפתיחה; מודול כבוי לא יורד.
  useEffect(() => {
    if (!ready) return;
    const warm = () => {
      const mods = useApp.getState().config.modules as Partial<Record<string, boolean>>;
      for (const k of Object.keys(VIEW_LOADERS) as (keyof typeof VIEW_LOADERS)[]) {
        const modKey = k === 'reenroll' ? 'courses' : k;
        if (k === 'settings' || mods[modKey] !== false) void VIEW_LOADERS[k]().catch(() => { /* אופליין — ייטען בניווט */ });
      }
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const hasIdle = typeof w.requestIdleCallback === 'function';
    const id = hasIdle ? w.requestIdleCallback!(warm, { timeout: 8000 }) : window.setTimeout(warm, 3000);
    return () => {
      if (hasIdle && typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(id as number);
      else window.clearTimeout(id as number);
    };
  }, [ready]);
  useEffect(() => {
    const onHash = () => {
      setBuilderOpen(window.location.hash.startsWith('#builder'));
      setWallOpen(window.location.hash === '#wall');
      setTimerOpen(window.location.hash === '#timer');
      setCashboxOpen(window.location.hash === '#cashbox');
      setBodymapOpen(window.location.hash === '#bodymap');
      setDedupOpen(window.location.hash === '#dedup');
      // ‏#caller = פתיחה ידנית (בלי מספר). ‏#call= מטופל בנפרד — לא נוגעים כאן.
      if (!window.location.hash.startsWith('#call=')) {
        const manual = window.location.hash === '#caller';
        setCallerOpen(manual);
        if (manual) setIncomingNumber(null);
      }
      setGuideOpen(window.location.hash === '#guide');
      setTourOpen(window.location.hash === '#tour');
      setPlatformOpen(window.location.hash === '#platform');
      setManagerOpen(window.location.hash === '#manage');
      setTeamChatOpen(window.location.hash === '#teamchat');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // זיהוי-שיחה-נכנסת (screen-pop) — "מה קובע שלקוח מתקשר": הסופטפון/המרכזייה של
  // הארגון פותח את האפליקציה בכתובת `#call=<מספר>` (יכולת on-ring open-URL סטנדרטית),
  // או שמנווטים לשם ידנית. downstream: המספר מגיע בכתובת, לא מ-API של ספק. מגודר
  // telephonyOn — מודול כבוי ⇒ אין screen-pop (ביט-זהה להיום).
  useEffect(() => {
    const handleCall = () => {
      if (!window.location.hash.startsWith('#call=')) return;
      const number = decodeURIComponent(window.location.hash.slice('#call='.length));
      // ניקוי ה-hash מיד — שלא יישאר בכתובת ולא יופעל שוב ברענון
      history.replaceState(null, '', window.location.pathname + window.location.search);
      if (!telephonyOn(useApp.getState().config) || !number.trim()) return;
      // מקפיץ את כרטיס-השיחה-הנכנסת עם המספר המזוהה-מראש (אותו מנוע כמו הידני)
      setIncomingNumber(number);
      setCallerOpen(true);
    };
    if (ready) handleCall(); // בטעינה (אחרי ש-DB מוכן) — לתפוס #call= שהגיע בכתובת
    window.addEventListener('hashchange', handleCall);
    return () => window.removeEventListener('hashchange', handleCall);
  }, [ready]);

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
    // config בתלויות: דחיפת-קונפיג חיה מהענן (למשל כיבוי shell.palette) חייבת
    // להגיע גם לקיצור — בלי זה ה-listener נשאר עם config ישן (closure). עלות
    // ה-re-subscribe זניחה (מאזין יחיד, רק כשה-config מתחלף).
  }, [config, setPalette]);

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

  // 🌐 שער האתר-הציבורי — לפני שער-ההצפנה/הענן/הנעילה: המבקר רואה דף-נחיתה
  // ציבורי בלי שום התחברות. מגודר shell.publicsite + תוכן-site קיים (publicSiteOn).
  // "כניסה למערכת" מנקה את הבקשה (‎?site/#site‎) וממשיך לשרשרת-השערים הרגילה.
  if (siteRequested && publicSiteOn(config)) {
    return (
      <Suspense fallback={<div className="empty">טוען…</div>}>
      <PublicSite
        onEnter={() => {
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('site');
            if (url.hash === '#site') url.hash = '';
            history.replaceState(null, '', url.pathname + url.search + url.hash);
          } catch {
            /* כתובת חריגה — נתעלם, הדגל בזיכרון יספיק */
          }
          setSiteRequested(false);
        }}
      />
      </Suspense>
    );
  }

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
        <Suspense fallback={<div className="empty">טוען…</div>}>
          <LoginScreen />
        </Suspense>
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
        <Suspense fallback={<div className="empty">טוען…</div>}>
          <PendingApprovalScreen />
        </Suspense>
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
    (n) => n.view !== 'settings' && n.view !== 'reenroll' && (n.view === 'home' || config.modules[n.view] !== false),
  );
  // UX סבב-ב׳: ברצועה העליונה עד 6 ראשיים; השאר ב'עוד ▾' (הכול נשאר נגיש).
  // בשלדי-הצד יש מקום אנכי — הרשימה המלאה נשארת שם.
  const NAV_PRIMARY_MAX = 6;
  const navPrimary = nav.length > NAV_PRIMARY_MAX + 1 ? nav.slice(0, NAV_PRIMARY_MAX) : nav;
  const navMore = nav.length > NAV_PRIMARY_MAX + 1 ? nav.slice(NAV_PRIMARY_MAX) : [];
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
  // 🔴 באדג' הודעות-צוות שלא-נקראו — נקודה-אדומה עם מונה על כפתור-העזרה (נקודת-
  // הכניסה לצ׳אט). ריק ⇒ null. הוצא לפונקציה כדי לרנדר עותק-טרי בכל משטח.
  const teamBadgeEl = (): ReactNode =>
    teamUnread > 0 ? (
      <span
        aria-hidden
        style={{
          position: 'absolute', top: -3, insetInlineEnd: -3, minWidth: 16, height: 16,
          padding: '0 4px', borderRadius: 9, background: 'var(--red, #d33)', color: '#fff',
          fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center',
          justifyContent: 'center', lineHeight: 1, boxShadow: '0 0 0 2px var(--panel, #fff)',
        }}
      >
        {teamUnread > 99 ? '99+' : teamUnread}
      </span>
    ) : null;
  const helpTitle = teamUnread > 0 ? `עזרה · ${teamUnread} הודעות-צוות חדשות 💬` : 'עזרה — מדריך וסיור';
  const helpAria = teamUnread > 0 ? `עזרה, ${teamUnread} הודעות-צוות שלא נקראו` : 'עזרה';
  const helpGearBtn: ReactNode = (guideOn || demoOn || teamchatAvail) && (
    <button type="button" className="nav-gear" onClick={() => setHelpOpen(true)} title={helpTitle} aria-label={helpAria} style={{ position: 'relative' }}>
      <span aria-hidden>❓</span>
      {teamBadgeEl()}
    </button>
  );
  const helpSideBtn: ReactNode = (guideOn || demoOn || teamchatAvail) && (
    <button type="button" className="side-link" onClick={() => setHelpOpen(true)} title={helpTitle} aria-label={helpAria} style={{ position: 'relative' }}>
      <span className="side-ico" aria-hidden style={{ position: 'relative', display: 'inline-flex' }}>❓{teamBadgeEl()}</span>
      <span className="nav-label">{teamUnread > 0 ? `עזרה · ${teamUnread} 💬` : 'עזרה'}</span>
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
          {featureOn(config, 'shell.demodrop') && famCount === 0 && <DemoDrop />}
          <DayGate />
          {/* ⚡ ‏#13: המסך-הנוכחי עצל — נפילת-הטעינה מקומית, הכרום נשאר חי */}
          <Suspense fallback={<div className="empty">⏳ טוען את המסך…</div>}>
            <Current />
          </Suspense>
          {/* 📞 צ'יפ-קמפיין-צף (20.8) — קמפיין-חייגן פעיל נשאר נגיש מכל מסך */}
          {featureOn(config, 'shell.dialerchip') && telephonyOn(config) && <DialerChip />}
        </>
      )}
    </main>
  );

  // שלד עליון — הכרום מתחלף פר-ערכה דרך משתני --nav2-* (themes.css)
  const topShell = (
    <>
      <header className="app-top">
        <div className="brand">
          {config.logoDataUri ? <img src={config.logoDataUri} alt="" /> : config.emoji ? <span className="brand-emoji" aria-hidden>{config.emoji}</span> : null}
          <span className="brand-name">{orgName}</span>
        </div>
        <nav className="app-nav" aria-label="ניווט ראשי">
          {navPrimary.map((n) => (
            <button
              key={n.view}
              className={view === n.view ? 'active' : ''}
              onClick={() => go(n.view)}
            >
              {labelOf(n)}
            </button>
          ))}
          {navMore.length > 0 && (
            <button
              className={navMore.some((n) => n.view === view) ? 'active' : ''}
              onClick={() => setMoreNavOpen(true)}
              aria-haspopup="dialog"
            >
              עוד ▾
            </button>
          )}
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
      {/* UX סבב-ב׳: ניווט-תחתון קבוע במובייל — במקום גלילה-אופקית נסתרת שמעלימה מודולים */}
      <nav className="bottom-nav" aria-label="ניווט תחתון">
        {nav.slice(0, 4).map((n) => (
          <button key={n.view} className={view === n.view ? 'active' : ''} onClick={() => go(n.view)}>
            <span aria-hidden>{n.icon}</span>
            <span>{labelOf(n)}</span>
          </button>
        ))}
        <button className={nav.slice(4).some((n) => n.view === view) || view === 'settings' ? 'active' : ''} onClick={() => setMoreNavOpen(true)}>
          <span aria-hidden>⋯</span>
          <span>עוד</span>
        </button>
      </nav>
    </>
  );

  // שלד סרגל-צד רחב (אור ראשון, mock-desktop) — פס "לילה" 212px בצד ימין:
  // מיתוג בסריף זהב + קו-שיער זוהר, קישורי אייקון+תווית, הגדרות כקישור רגיל,
  // וצ'יפ חיפוש (Ctrl+K) בתחתית. אין שורת כותרת — ה-hero הוא ראש העמוד.
  const sideWideShell = (
    <>
      <aside className="app-side side-wide">
        <div className="side-brand">
          {config.logoDataUri ? <img src={config.logoDataUri} alt="" /> : config.emoji ? <span className="brand-emoji" aria-hidden>{config.emoji}</span> : null}
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
        {/* לוגו הארגון; באין לוגו — אימוג'י-הוורטיקל, ובאין גם הוא — ריבוע accent
            עם האות-הראשונה (כמו במוקאפ). ללקוח-החי אין emoji ⇒ אות-ראשונה, ביט-זהה. */}
        <div className="side-logo">
          {config.logoDataUri ? (
            <img src={config.logoDataUri} alt="" />
          ) : config.emoji ? (
            <span className="side-logo-fallback side-logo-emoji" aria-hidden>{config.emoji}</span>
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
        {helpSideBtn}
        {privacySideBtn}
        {adminSideBtn}
        {managerSideBtn}
      </aside>
      <div className="side-body">
        <header className="side-head">
          <div className="brand">
            {config.logoDataUri ? <img src={config.logoDataUri} alt="" /> : config.emoji ? <span className="brand-emoji" aria-hidden>{config.emoji}</span> : null}
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
      {/* 'עוד' (UX סבב-ב׳) — כל המודולים שלא ברצועה/בתחתון + הגדרות.
          ביקורת 6.8: ההגדרות מגודרות !isTeacherUser — אותו שער של ⚙️ בשלושת
          השלדים; בלעדיו תפקיד-מורה הגיע לייבוא/גיבוי/איפוס דרך המודאל הזה. */}
      {moreNavOpen && (
        <Modal title="כל המסכים" onClose={() => setMoreNavOpen(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            {[...nav, ...(isTeacherUser ? [] : [NAV[NAV.length - 1]])].map((n) => (
              <button
                key={n.view}
                type="button"
                onClick={() => { setMoreNavOpen(false); go(n.view); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '14px 8px', borderRadius: 12, cursor: 'pointer',
                  border: '1px solid ' + (view === n.view ? 'var(--accent)' : 'var(--line)'),
                  background: 'var(--panel)', fontSize: 13, fontWeight: 700,
                }}
              >
                <span aria-hidden style={{ fontSize: 22 }}>{n.icon}</span>
                {n.view === 'settings' ? 'הגדרות' : labelOf(n)}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {/* ❓ בורר-עזרה (UX סבב-א׳) — ה-hash-ים #guide/#tour ממשיכים לעבוד כרגיל */}
      {helpOpen && (
        <Modal title="❓ עזרה" onClose={() => setHelpOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {guideOn && (
              <HubButton emoji="📖" title="המדריך המהיר" sub="הסבר קצר על כל מסך ומה עושים בו" onClick={() => { setHelpOpen(false); window.location.hash = '#guide'; }} />
            )}
            {askMaorOn && (
              <HubButton emoji="🤖" title="שאל את מאור" sub={'שאלה חופשית על הנתונים — "מי לא תרם השנה?" — הכול במכשיר'} onClick={() => { setHelpOpen(false); setAskOpen(true); }} />
            )}
            {demoOn && (
              <HubButton emoji="▶" title="סיור מודרך" sub="מצב הדגמה — המערכת מדגימה את עצמה" onClick={() => { setHelpOpen(false); window.location.hash = '#tour'; }} />
            )}
            {/* PWA: כפתור-התקנה מפורש — לא סומכים על הבאנר הגחמתי של הדפדפן.
                Chrome מוכן ⇒ דיאלוג-התקנה; אחרת הוראות פר-פלטפורמה. מוסתר כשכבר מותקן. */}
            {featureOn(config, 'shell.pwa') && !isStandalone() && (
              <HubButton
                emoji="📲"
                title="התקנת האפליקציה"
                sub="אייקון במסך הבית, מסך מלא ועבודה גם בלי רשת"
                onClick={() => {
                  setHelpOpen(false);
                  void promptInstall().then((ok) => {
                    if (ok) return;
                    useApp.getState().toast(
                      isIos()
                        ? '📲 ב-iPhone: כפתור השיתוף ← "הוסף למסך הבית"'
                        : '📲 בתפריט ⋮ של הדפדפן: "הוספה למסך הבית" / "התקנת אפליקציה"',
                    );
                  });
                }}
              />
            )}
            {/* 🩺 מאבחן-חסימות (11.8) — קו מסונן חוסם סנכרון/כניסה; הכלי מציג
                מה חסום ומה להקריא למוקד חברת-הסינון */}
            {featureOn(config, 'shell.netcheck') && (
              <HubButton
                emoji="🩺"
                title="בדיקת תקשורת"
                sub="הקו מסונן וחוסם? בדיקה מה נחסם + בקשת-פתיחה מוכנה לחברת-הסינון"
                onClick={() => { setHelpOpen(false); setNetCheckOpen(true); }}
              />
            )}
            {/* 💬 צ׳אט-תמיכה חי (17.8) — רק בענן+מחובר. מייל-על ⇒ תיבת-השיחות;
                לקוח רגיל ⇒ מודאל-שיחה עם התמיכה. */}
            {cloud.enabled && cloud.user && (
              <>
                {/* מייל-על: תיבת-השיחות (הודעות-הלקוחות). התיבה מתמלאת כשלקוח כותב. */}
                {canAdminHub && (
                  <HubButton emoji="💬" title="שיחות תמיכה" sub="הודעות מהלקוחות — מענה בזמן-אמת" onClick={() => { setHelpOpen(false); setSupportInboxOpen(true); }} />
                )}
                {/* צ׳אט-הלקוח — לכולם (גם למייל-על, לבדיקה/כדי להיות נגיש כלקוח). */}
                {featureOn(config, 'shell.support') && (
                  <HubButton emoji="💬" title="צ׳אט עם התמיכה" sub="שאלה? כתבו לנו — נענה בזמן-אמת" onClick={() => { setHelpOpen(false); setSupportOpen(true); }} />
                )}
                {/* 💬 צ׳אט-צוות תוך-ארגוני — מגודר shell.teamchat (מתג באשף). */}
                {featureOn(config, 'shell.teamchat') && (
                  <HubButton emoji={teamUnread > 0 ? '🔴' : '👥'} title={teamUnread > 0 ? `צ׳אט הצוות · ${teamUnread} חדשות` : 'צ׳אט הצוות'} sub={teamUnread > 0 ? `יש ${teamUnread} הודעות-צוות שלא נקראו — לחצו לפתיחה` : 'שיחה פנימית חיה בין אנשי-הצוות של הארגון'} onClick={() => { setHelpOpen(false); setTeamChatOpen(true); }} />
                )}
              </>
            )}
          </div>
        </Modal>
      )}
      {featureOn(config, 'shell.netcheck') && netCheckOpen && <NetCheckModal onClose={() => setNetCheckOpen(false)} />}
      {featureOn(config, 'shell.support') && cloud.enabled && cloud.user && supportOpen && <SupportChatModal onClose={() => setSupportOpen(false)} />}
      {supportInboxOpen && <SupportInbox onClose={() => setSupportInboxOpen(false)} />}
      {teamChatOpen && <TeamChatModal onClose={() => { setTeamChatOpen(false); if (window.location.hash === '#teamchat') history.replaceState(null, '', window.location.pathname + window.location.search); }} />}
      {/* תפריט-החשבון (UX סבב-א׳) — מייל, סטטוס-סנכרון כטקסט, יציאה בשני צעדים */}
      {userMenuOpen && cloud.user && (
        <Modal title="החשבון שלי" onClose={() => setUserMenuOpen(false)}>
          <div style={{ direction: 'ltr', textAlign: 'end', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{cloud.user.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12, flexWrap: 'wrap' }}>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: 99, background: syncDot.color, display: 'inline-block' }} />
            {syncDot.title}
            {/* 📛 חשיפת-שגיאה מפורטת + כפתור "נסי שוב" (בקשת-שטח 25.8) */}
            {cloud.status === 'error' && (
              <>
                <span style={{ color: '#dc2626', fontWeight: 700 }}>· {cloud.lastSyncError || 'שגיאה'}</span>
                <Btn sm onClick={() => { void import('./store/cloudSync').then((m) => m.retrySyncNow()); }} title="ניסיון סנכרון מיידי — בלי להמתין ל-5 שניות של ה-backoff">
                  🔄 נסי שוב
                </Btn>
              </>
            )}
          </div>
          <div className="modal-actions">
            {/* איפוס-סיסמה 9.8: שינוי סיסמה מתוך האפליקציה — בלי לעבור דרך מייל */}
            <Btn onClick={() => { setUserMenuOpen(false); setChangePassOpen(true); }}>🔑 שינוי סיסמה</Btn>
            <Btn kind={logoutArmed ? 'danger' : 'plain'} onClick={() => { if (!logoutArmed) return setLogoutArmed(true); setUserMenuOpen(false); void cloudSignOut(); }}>
              {logoutArmed ? 'לחצו שוב ליציאה' : 'יציאה מהחשבון'}
            </Btn>
            <Btn onClick={() => setUserMenuOpen(false)}>סגירה</Btn>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>היציאה לא מוחקת כלום — הנתונים נשארים במכשיר.</div>
        </Modal>
      )}
      {changePassOpen && cloud.user && <ChangePasswordModal onClose={() => setChangePassOpen(false)} />}
      {/* 🤖 שאל-את-מאור (VISION-LIGHT #30) — עצל, opt-in */}
      {askOpen && askMaorOn && (
        <Suspense fallback={null}>
          <AskMaorModal onClose={() => setAskOpen(false)} />
        </Suspense>
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
            <Suspense fallback={<div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)' }}><div className="empty" style={{ marginTop: 120 }}>⏳ טוען…</div></div>}>
              <RemoteWizard
                slug={remoteBuilderSlug}
                onClose={() => {
                  window.location.hash = '#platform'; // חזרה ללוח-הבקרה
                }}
              />
            </Suspense>
          ) : (
            <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)' }}>
              <div className="empty" style={{ marginTop: 120 }}>🔒 עריכת לקוח-ענן זמינה למנהל הפלטפורמה בלבד.</div>
            </div>
          )
        ) : (
          <Suspense fallback={<div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)' }}><div className="empty" style={{ marginTop: 120 }}>⏳ טוען…</div></div>}>
            <BuilderWizard
              onClose={() => {
                window.location.hash = '';
                setBuilderOpen(false);
              }}
            />
          </Suspense>
        ))}

      {platformOpen &&
        (isAdmin && isSuperAdmin(cloud.user?.email) ? (
          // לוח הבקרה של הפלטפורמה (CLOUD2 ענן 4) — מיילי-על בלבד; משתמש
          // אחר שמנסה #platform מקבל אין-הרשאה, לא את הלוח
          <Suspense fallback={<div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)' }}><div className="empty" style={{ marginTop: 120 }}>⏳ טוען…</div></div>}>
            <PlatformPanel
              onClose={() => {
                window.location.hash = '';
                setPlatformOpen(false);
              }}
            />
          </Suspense>
        ) : (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)' }}>
            <div className="empty" style={{ marginTop: 120 }}>
              🔒 לוח הבקרה של הפלטפורמה זמין למנהל הפלטפורמה בלבד.
            </div>
          </div>
        ))}

      {/* פאנל-המנהל (ORGADMIN) — #manage, למנהל-הארגון בלבד (cloud.isManager) */}
      {managerOpen && cloud.isManager && (
        <Suspense fallback={<div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)' }}><div className="empty" style={{ marginTop: 120 }}>⏳ טוען…</div></div>}>
          <ManagerPanel
            onClose={() => {
              window.location.hash = '';
              setManagerOpen(false);
            }}
          />
        </Suspense>
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

      {callerOpen && telephonyOn(config) && (
        <CallerLookup
          initialNumber={incomingNumber ?? undefined}
          onClose={() => {
            if (window.location.hash) window.location.hash = '';
            setCallerOpen(false);
            setIncomingNumber(null);
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

      <UpdateBanner />

      {toastsEl}
    </div>
  );
}


/**
 * 📞 צ'יפ-קמפיין-צף (20.8) — כשקמפיין-חייגן פעיל והמשתמש במסך אחר, צ'יפ קבוע
 * בתחתית מזכיר וממשיך בקליק (openDialer ⇒ מסך-התורמים + פתיחת-המודאל).
 * במסך-התורמים עצמו יש כבר כפתור "המשך חייגן" — הצ'יפ מוסתר שם.
 */
function DialerChip() {
  const dialer = useApp((s) => s.db.ui.dialer);
  const view = useApp((s) => s.view);
  const openDialer = useApp((s) => s.openDialer);
  if (!dialer || !dialer.queue.length || view === 'supporters') return null;
  return (
    <button
      type="button"
      className="dialer-chip"
      onClick={openDialer}
      title="קמפיין-חייגן פעיל — לחיצה ממשיכה מאיפה שעצרתם"
    >
      📞 קמפיין פעיל ({dialer.queue.length})
    </button>
  );
}
