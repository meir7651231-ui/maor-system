/**
 * 🏡 אירוח משפחתי — hooks משותפים למסכי-המודול (אשכול 5): הנתונים (מנויים צרים בלבד — 3 האוספים + ההגדרות,
 * לא מנוי-DB-מלא; ratchet db-watch), אינדקס-חיפוש (שם-אורח/יחידה/צוות), הרשאות ודגלים, ושעון מתקתק.
 * אין `?? {}` בתוך סלקטור (לקח React #185) — ברירות-המחדל מחוץ לסלקטור.
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, integrationSetting } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import type {
  HostAsset,
  HostBooking,
  HostCleanTask,
  HostDish,
  HostFault,
  HostGuest,
  HostingPrefs,
  HostMeal,
  HostPlan,
  HostRecord,
  HostStaff,
  HostSupply,
  HostTableItem,
  HostTempLog,
  HostUnit,
} from '../../types/domain';
import { hostCan, hostSettings, hostTerms, type HostSettings, type HostTerms } from './transitions';

const EMPTY_PREFS: HostingPrefs = {};

export interface HostData {
  units: HostUnit[];
  bookings: HostBooking[];
  records: HostRecord[];
  prefs: HostingPrefs;
  settings: HostSettings;
  guests: HostGuest[];
  tasks: HostCleanTask[];
  meals: HostMeal[];
  dishes: HostDish[];
  staff: HostStaff[];
  supplies: HostSupply[];
  tableItems: HostTableItem[];
  temps: HostTempLog[];
  faults: HostFault[];
  assets: HostAsset[];
  plans: HostPlan[];
  unitOf: (id: string) => HostUnit | undefined;
  guestOf: (id: string) => HostGuest | undefined;
  bookingOf: (id: string) => HostBooking | undefined;
  /** שם או "—" (guestOf/unitOf במקור). */
  guestName: (id: string) => string;
  unitName: (id: string) => string;
  staffName: (id: string) => string;
}

/** כל נתוני-המודול + אינדקס — ממוזכר על ארבעת המנויים הצרים. */
export function useHostData(): HostData {
  const units = useApp((s) => s.db.hostUnits);
  const bookings = useApp((s) => s.db.hostBookings);
  const records = useApp((s) => s.db.hostRecords);
  const prefsRaw = useApp((s) => s.db.ui.hosting);
  return useMemo(() => {
    const prefs = prefsRaw ?? EMPTY_PREFS;
    const of = <K extends HostRecord['kind']>(k: K) => records.filter((r): r is Extract<HostRecord, { kind: K }> => r.kind === k);
    const guests = of('guest');
    const staff = of('staff');
    const uMap = new Map(units.map((u) => [u.id, u] as const));
    const gMap = new Map(guests.map((g) => [g.id, g] as const));
    const bMap = new Map(bookings.map((b) => [b.id, b] as const));
    const sMap = new Map(staff.map((s) => [s.id, s] as const));
    return {
      units,
      bookings,
      records,
      prefs,
      settings: hostSettings(prefs),
      guests,
      tasks: of('clean'),
      meals: of('meal'),
      dishes: of('dish'),
      staff,
      supplies: of('supply'),
      tableItems: of('tableItem'),
      temps: of('temp'),
      faults: of('fault'),
      assets: of('asset'),
      plans: of('plan'),
      unitOf: (id) => uMap.get(id),
      guestOf: (id) => gMap.get(id),
      bookingOf: (id) => bMap.get(id),
      guestName: (id) => gMap.get(id)?.name ?? '—',
      unitName: (id) => uMap.get(id)?.name ?? '—',
      staffName: (id) => sMap.get(id)?.name ?? '',
    };
  }, [units, bookings, records, prefsRaw]);
}

export interface HostEnv {
  terms: HostTerms;
  canDelete: boolean;
  canManage: boolean;
  on: {
    calendar: boolean;
    housekeeping: boolean;
    kitchen: boolean;
    shabbat: boolean;
    maint: boolean;
    reports: boolean;
    export: boolean;
  };
  /** הרחבת-וואטסאפ (חסר = כבוי) + מצב-אפליקציה (סינון-כשר). */
  wa: boolean;
  waApp: boolean;
  /** עמוד-הסליקה של הארגון (הרחבת-התשלומים) — '' כשכבויה. */
  payUrl: string;
}

/** מונחים · הרשאות (אותו hostCan שה-store אוכף) · תת-דגלים · הרחבות. */
export function useHostEnv(): HostEnv {
  const config = useApp((s) => s.config);
  const email = useApp((s) => s.cloud.user?.email);
  const isMgr = useApp((s) => s.cloud.isManager) === true;
  const prefs = useApp((s) => s.db.ui.hosting);
  return useMemo(
    () => ({
      terms: hostTerms(config, prefs),
      canDelete: hostCan(config, email, isMgr, 'hosting.delete'),
      canManage: hostCan(config, email, isMgr, 'hosting.manage'),
      on: {
        calendar: featureOn(config, 'hosting.calendar'),
        housekeeping: featureOn(config, 'hosting.housekeeping'),
        kitchen: featureOn(config, 'hosting.kitchen'),
        shabbat: featureOn(config, 'hosting.shabbat'),
        maint: featureOn(config, 'hosting.maint'),
        reports: featureOn(config, 'hosting.reports'),
        export: featureOn(config, 'hosting.export'),
      },
      wa: integrationOn(config, 'whatsapp'),
      waApp: integrationSetting(config, 'whatsapp', 'mode') === 'app',
      payUrl: integrationOn(config, 'payments') ? integrationSetting(config, 'payments', 'payUrl') : '',
    }),
    [config, email, isMgr, prefs],
  );
}

/** "עכשיו" של המסך — מתעדכן כל stepMs (תאריך-היום, ברכה, מועדי-מטבח). */
export function useNowMs(stepMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), stepMs);
    return () => clearInterval(t);
  }, [stepMs]);
  return now;
}

/** היום (ISO מקומי) — מתעדכן עם השעון (מעבר-חצות בלי רענון). */
export function useToday(): string {
  const now = useNowMs(60_000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => isoToday(), [now]);
}
