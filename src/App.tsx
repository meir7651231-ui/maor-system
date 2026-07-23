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
import { featureOn, moduleOn, termOf } from './lib/config';
import { hebDateFull } from './lib/hebrew';
import { isoToday } from './lib/date-util';
import { todaySessions } from './components/home/homeData';
import { Btn } from './components/ui';
import { BuilderWizard } from './components/builder/BuilderWizard';
import { ImpactWall } from './components/wall/ImpactWall';
import { HomeView } from './components/home/HomeView';
import { FamiliesView } from './components/families/FamiliesView';
import { CoursesView } from './components/courses/CoursesView';
import { CalendarView } from './components/calendar/CalendarView';
import { DiaryView } from './components/diary/DiaryView';
import { SupportersView } from './components/supporters/SupportersView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { CommandPalette } from './components/palette/CommandPalette';
import { DemoDrop } from './components/DemoDrop';
import { DayGate } from './components/wheel/DayGate';
import { LoginScreen } from './components/cloud/LoginScreen';
import { LockScreen } from './components/lock/LockScreen';
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
  const exportBackup = useApp((s) => s.exportBackup);
  const cloud = useApp((s) => s.cloud);
  const cloudSignOut = useApp((s) => s.cloudSignOut);
  const security = useApp((s) => s.db.security);
  // הערכה המוחלת בפועל — העדפת המשתמש (db.ui.theme) גוברת על ערכת הארגון
  const uiTheme = useApp((s) => s.db.ui.theme);
  const openFamilyForm = useApp((s) => s.openFamilyForm);
  const selectCourse = useApp((s) => s.selectCourse);

  useEffect(() => {
    void init();
  }, [init]);

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

  // נעילת גישה — פתיחה נשמרת לכל הסשן (טאב) בלבד, לא נשמרת לצמיתות
  const readUnlock = (k: string) => {
    try {
      return sessionStorage.getItem(k) === '1';
    } catch {
      return false;
    }
  };
  const [unlockedPrimary, setUnlockedPrimary] = useState(() => readUnlock('maorUnlockP'));
  const [unlockedAdmin, setUnlockedAdmin] = useState(() => readUnlock('maorUnlockA'));
  const unlock = (k: string, set: (v: boolean) => void) => {
    set(true);
    try {
      sessionStorage.setItem(k, '1');
    } catch {
      /* מצב פרטי — הפתיחה תישאר בזיכרון הרכיב בלבד */
    }
  };

  // אשף ההרכבה — למטמיע בלבד, נפתח עם #builder בכתובת
  const [builderOpen, setBuilderOpen] = useState(() => window.location.hash === '#builder');
  // קיר ההשפעה — מצב ראווה במסך מלא, נפתח עם #wall (feature: home.impactwall)
  const [wallOpen, setWallOpen] = useState(() => window.location.hash === '#wall');
  useEffect(() => {
    const onHash = () => {
      setBuilderOpen(window.location.hash === '#builder');
      setWallOpen(window.location.hash === '#wall');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // קיצורי מקלדת גלובליים
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(!useApp.getState().paletteOpen);
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
        const today = isoToday();
        if (localStorage.getItem('maor_autoexp') === today) return;
        const [eh, em] = (localStorage.getItem('maor_dayend') || '17:00').split(':').map(Number);
        const endMin = (Number.isFinite(eh) ? eh : 17) * 60 + (Number.isFinite(em) ? em : 0);
        const now = new Date();
        if (now.getHours() * 60 + now.getMinutes() < endMin) return;
        if (!useApp.getState().db.families.length) return;
        localStorage.setItem('maor_autoexp', today);
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

  // נעילה ראשית — קוד כניסה לכל המערכת (אחרי שער הענן, אם קיים)
  if (security.primary && !unlockedPrimary) {
    return (
      <>
        <LockScreen kind="primary" onUnlock={() => unlock('maorUnlockP', setUnlockedPrimary)} />
        {toastsEl}
      </>
    );
  }

  // נעילה משנית — קוד "מנהל" לאזורים הרגישים (זהה לכל הסשן לאחר פתיחה אחת)
  const lockZones = security.zones ?? DEFAULT_LOCK_ZONES;
  const adminNeededFor = (zone: string) =>
    !!security.secondary && lockZones.includes(zone) && !unlockedAdmin;
  const onAdminUnlock = () => unlock('maorUnlockA', setUnlockedAdmin);

  const Current = VIEWS[view];
  const syncDot = SYNC_DOT[cloud.status] ?? SYNC_DOT.idle;

  // מיתוג: שם מהקונפיגורציה גובר על השם השמור בנתונים
  const orgName = config.orgName || dbOrgName;
  // מודולים: בית תמיד; השאר לפי config.modules (חסר = פעיל).
  // הגדרות עברו לאייקון/פריט ⚙️ נפרד — לא קישור ברצועה.
  const nav = NAV.filter(
    (n) => n.view !== 'settings' && (n.view === 'home' || config.modules[n.view] !== false),
  );
  // תווית קישור — מונח מותאם מהמילון לששת מסכי המודולים; בית נשאר קבוע
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

  // צ'יפ משתמש הענן — קיים בשני השלדים
  const userChip: ReactNode = cloud.enabled && cloud.user && (
    <div className="nav-user">
      <span
        aria-hidden
        title={syncDot.title}
        style={{
          width: 8,
          height: 8,
          borderRadius: 99,
          background: syncDot.color,
          flex: '0 0 auto',
        }}
      />
      <span className="nav-user-mail" title={cloud.user.email}>
        {cloud.user.email}
      </span>
      <button onClick={() => void cloudSignOut()} title="יציאה מהחשבון — הנתונים נשארים במכשיר">
        יציאה
      </button>
    </div>
  );

  const mainEl = (
    <main className="app-main">
      {adminNeededFor(view) ? (
        <LockScreen kind="secondary" onUnlock={onAdminUnlock} />
      ) : (
        <>
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
          {/* צ'יפ החיפוש — פותח את פלטת הפקודות, אותו מנגנון כמו Ctrl+K */}
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
          <button
            type="button"
            className={'nav-gear' + (view === 'settings' ? ' active' : '')}
            onClick={() => go('settings')}
            title="הגדרות"
            aria-label="הגדרות"
          >
            <span aria-hidden>⚙️</span>
          </button>
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
          <button
            type="button"
            className={'side-link' + (view === 'settings' ? ' active' : '')}
            onClick={() => go('settings')}
            title="הגדרות"
          >
            <span className="side-ico" aria-hidden>⚙️</span>
            <span className="nav-label">הגדרות</span>
          </button>
        </nav>
        <div className="side-sp" aria-hidden />
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
            <span className="side-search-label">חיפוש או פקודה — משפחה, חוג, תורם, דוח…</span>
            <kbd aria-hidden>Ctrl K</kbd>
          </button>
          <div className="side-actions">
            {moduleOn(config, 'families') && (
              <Btn kind="primary" onClick={openFamilyForm} title="פתיחת טופס הוספת משפחה">
                + משפחה חדשה
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

      {paletteOpen && <CommandPalette />}

      {builderOpen &&
        (adminNeededFor('wizard') ? (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)' }}>
            <LockScreen kind="secondary" onUnlock={onAdminUnlock} />
          </div>
        ) : (
          <BuilderWizard
            onClose={() => {
              window.location.hash = '';
              setBuilderOpen(false);
            }}
          />
        ))}

      {wallOpen && featureOn(config, 'home.impactwall') && (
        <ImpactWall
          onClose={() => {
            window.location.hash = '';
            setWallOpen(false);
          }}
        />
      )}

      {toastsEl}
    </div>
  );
}
