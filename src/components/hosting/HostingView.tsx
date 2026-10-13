/**
 * עמודת "אירוח משפחתי" (מודול hosting — knowledge/BUILD-ORDER-HOSTING-2026-10-12.md), אשכול 5.
 *
 * המודול **opt-in** (הכרעה 1): כבוי כשחסר — נדלק רק ב-modules.hosting === true (moduleEnabledIn); כבוי ⇒ אין קישור
 * ואין מסך, וכל hosting.* כבויים (שרשור featureOn). הלקוח-החי, הדמו וכל ארגון קיים — ביט-זהים.
 *
 * **העיצוב המקורי נשמר** (הכרעה 6): המסך לובש את "Aurora Glass" של האפליקציה — כותרת עם 🏡 במשבצת-גרדיאנט ושם-העסק,
 * פס-לשוניות, ◑ ערכה, באנר-שבת, כרטיסי-זכוכית — בסקין מוגבל-שורש (‎.hst, hosting.css בצ'אנק העצל הזה).
 * 11 הלשוניות של המקור; מטבח/שבת/תחזוקה + יומן/ניקיון/דוחות — כל אחת בתת-הדגל שלה (חסר = פעיל בתוך מודול דלוק);
 * ⚙️ הגדרות — hosting.manage. מודאל אחד פעיל (כמו `#modalRoot`), ומעליו askConfirm/askText.
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { useRemembered } from '../../lib/filterMemory';
import { installHostingActions } from './actions';
import { useHostData, useHostEnv } from './hooks';
import { AskDialog, ConfirmDialog, HostUiCtx, h, type HostDialog, type HostUi } from './hui';
import { SB_BANNER, tint, type HostTab } from './labels';
import { DashTab } from './DashTab';
import { CalendarTab } from './CalendarTab';
import { BookingsTab } from './BookingsTab';
import { BookingDialog, PayDialog } from './BookingModal';
import { RoomsDialog, UnitDialog, UnitsTab } from './UnitsTab';
import { GuestDialog, GuestsTab } from './GuestsTab';
import { CleanTab, TaskDialog } from './CleanTab';
import { KitchenTab } from './KitchenTab';
import { MealDialog, RecipeDialog } from './MealModal';
import { DishDialog, MenuDialog } from './MenuModals';
import { StaffCardDialog, StaffDialog, StaffEditDialog } from './StaffModals';
import { ShopDialog, TablesetDialog } from './ShoppingModal';
import { SeatingDialog } from './SeatingModal';
import { ShabbatTab } from './ShabbatTab';
import { AssetDialog, FaultDialog, MaintTab, PlanDialog, TempDialog } from './MaintTab';
import { ReportsTab } from './ReportsTab';
import { SettingsTab } from './SettingsTab';
import './hosting.css';

// פעולות-המודול נטענות עם הצ'אנק הזה ("שוקל רק מה שהדלקת") — מותקנות ב-store לפני הרינדור הראשון
installHostingActions();

type Ask = { title: string; val: string; cb: (v: string) => void; ph?: string };
type Confirm = { msg: string; onYes: () => void; yesLabel?: string };

export function HostingView() {
  const config = useApp((s) => s.config);
  const dbOrgName = useApp((s) => s.db.orgName);
  const d = useHostData();
  const env = useHostEnv();
  const [tab, setTab] = useRemembered<HostTab>('hosting.tab', 'dash');
  const [theme, setTheme] = useRemembered<'light' | 'dark' | null>('hosting.theme', null);
  const [dialog, setDialog] = useState<HostDialog | null>(null);
  const [confirmS, setConfirmS] = useState<Confirm | null>(null);
  const [askS, setAskS] = useState<Ask | null>(null);

  const t = env.terms;
  const tabs: { key: HostTab; label: string; on: boolean }[] = [
    { key: 'dash', label: '📊 לוח בקרה', on: true },
    { key: 'cal', label: '📅 יומן', on: env.on.calendar },
    { key: 'res', label: '🗂️ ' + t.bookings, on: true },
    { key: 'units', label: '🏠 ' + t.units, on: true },
    { key: 'guests', label: '👪 ' + t.guests, on: true },
    { key: 'clean', label: '🧹 ניקיון', on: env.on.housekeeping },
    { key: 'kitchen', label: '🍳 מטבח', on: env.on.kitchen },
    { key: 'shabbat', label: '🕯️ שבת', on: env.on.shabbat },
    { key: 'maint', label: '🔧 תחזוקה', on: env.on.maint },
    { key: 'reports', label: '📈 דוחות', on: env.on.reports },
    { key: 'set', label: '⚙️ הגדרות', on: env.canManage },
  ];
  const active: HostTab = tabs.some((x) => x.key === tab && x.on) ? tab : 'dash';

  const go = useCallback(
    (k: HostTab) => {
      setDialog(null);
      setTab(k);
    },
    [setTab],
  );
  const ui: HostUi = useMemo(
    () => ({
      theme,
      open: (x) => setDialog(x),
      close: () => setDialog(null),
      confirm: (msg, onYes, yesLabel) => setConfirmS({ msg, onYes, yesLabel }),
      ask: (title, val, cb, ph) => setAskS({ title, val, cb, ph }),
      go,
    }),
    [theme, go],
  );

  // שם-העסק (הגדרות) ⇐ מיתוג אורביט — שם-הקונפיגורציה גובר על השם השמור בנתונים (כמו App) ⇐ שם-העמודה
  const biz = d.prefs.businessName?.trim() || config.orgName?.trim() || dbOrgName?.trim() || t.nav;
  const sbMode = d.prefs.shabbat?.mode ?? 'off';
  const banner = env.on.shabbat && sbMode !== 'off' ? SB_BANNER[sbMode] : null;

  function toggleTheme() {
    const orbitDark = config.theme === 'heichal';
    const devDark = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const darkNow = theme ? theme === 'dark' : orbitDark || devDark;
    setTheme(darkNow ? 'light' : 'dark');
  }

  let body: ReactNode = null;
  if (active === 'dash') body = <DashTab biz={biz} />;
  else if (active === 'cal') body = <CalendarTab />;
  else if (active === 'res') body = <BookingsTab />;
  else if (active === 'units') body = <UnitsTab />;
  else if (active === 'guests') body = <GuestsTab />;
  else if (active === 'clean') body = <CleanTab />;
  else if (active === 'kitchen') body = <KitchenTab />;
  else if (active === 'shabbat') body = <ShabbatTab />;
  else if (active === 'maint') body = <MaintTab />;
  else if (active === 'reports') body = <ReportsTab biz={biz} />;
  else if (active === 'set') body = <SettingsTab />;

  return (
    <HostUiCtx.Provider value={ui}>
      <div className="hst hst-root" data-hst-theme={theme ?? undefined}>
        <div className="h-header">
          <div className="h-in">
            <div className="h-brand">
              <span className="h-mk" aria-hidden="true">
                🏡
              </span>
              <span className="h-bn">{biz}</span>
            </div>
            <div className="h-tabs" role="tablist" aria-label={t.nav}>
              {tabs
                .filter((x) => x.on)
                .map((x) => (
                  <button
                    key={x.key}
                    type="button"
                    role="tab"
                    aria-selected={active === x.key}
                    className={h('tab') + (active === x.key ? ' h-on' : '')}
                    onClick={() => go(x.key)}
                  >
                    {x.label}
                  </button>
                ))}
            </div>
            <button type="button" className="h-iconbtn" onClick={toggleTheme} title="ערכה" aria-label="החלפת ערכה בהירה/כהה">
              ◑
            </button>
          </div>
        </div>
        <div className="h-main">
          {banner && (
            <div className="h-sbanner" style={{ background: tint(banner[1], 14), border: '1px solid ' + banner[1], color: banner[1] }}>
              {banner[0]}
            </div>
          )}
          {body}
        </div>
      </div>
      {dialog && <DialogSwitch d={dialog} />}
      {confirmS && (
        <ConfirmDialog
          msg={confirmS.msg}
          yesLabel={confirmS.yesLabel}
          onNo={() => setConfirmS(null)}
          onYes={() => {
            const f = confirmS.onYes;
            setConfirmS(null);
            f();
          }}
        />
      )}
      {askS && (
        <AskDialog
          title={askS.title}
          val={askS.val}
          ph={askS.ph}
          onDone={(v) => {
            const cb = askS.cb;
            setAskS(null);
            if (v !== null) cb(v);
          }}
        />
      )}
    </HostUiCtx.Provider>
  );
}

/** המודאל הפעיל — key לפי הסוג+המזהה ⇒ מעבר בין כרטיסים מאפס את הטופס. */
function DialogSwitch(props: { d: HostDialog }) {
  const x = props.d;
  const key = x.k + ':' + ('id' in x ? String(x.id) : '');
  switch (x.k) {
    case 'booking':
      return <BookingDialog key={key} id={x.id} pre={x.pre} />;
    case 'pay':
      return <PayDialog key={key} id={x.id} />;
    case 'unit':
      return <UnitDialog key={key} id={x.id} />;
    case 'rooms':
      return <RoomsDialog key={key} id={x.id} />;
    case 'guest':
      return <GuestDialog key={key} id={x.id} />;
    case 'task':
      return <TaskDialog key={key} />;
    case 'meal':
      return <MealDialog key={key + ':' + (x.bookingId ?? '')} id={x.id} bookingId={x.bookingId} />;
    case 'recipe':
      return <RecipeDialog key={key} id={x.id} />;
    case 'menu':
      return <MenuDialog key={key} />;
    case 'dish':
      return <DishDialog key={key} id={x.id} />;
    case 'staff':
      return <StaffDialog key={key} />;
    case 'staffEdit':
      return <StaffEditDialog key={key} id={x.id} />;
    case 'staffCard':
      return <StaffCardDialog key={key} id={x.id} />;
    case 'shop':
      return <ShopDialog key={key} />;
    case 'tableset':
      return <TablesetDialog key={key} />;
    case 'seating':
      return <SeatingDialog key={key} id={x.id} />;
    case 'temp':
      return <TempDialog key={key} />;
    case 'fault':
      return <FaultDialog key={key + ':' + (x.assetId ?? '')} assetId={x.assetId} />;
    case 'asset':
      return <AssetDialog key={key} />;
    case 'plan':
      return <PlanDialog key={key} />;
    default:
      return null;
  }
}
