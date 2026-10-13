/**
 * 🔌 המרכזייה — נתוני-מבחן משותפים (לא קובץ-בדיקה): ארגון אחד שיש בו גם אירוח וגם פרנסה׳לע — משפחת לוי לשבת,
 * נזילה ביחידה, אינסטלטור במדריך, מניינים בלוח. "היום" = רביעי 14.10.2026, 12:00 בישראל (09:00Z); השבת = 17.10.
 * רינדור-שרת (renderToStaticMarkup) קורא את ה-store דרך getServerSnapshot = getInitialState של zustand ⇒ setup מיישר
 * את שניהם (וכמו בבדיקות-השלד — משוחזר אחרי כל בדיקה).
 */
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import {
  emptyDb,
  type Db,
  type HostBooking,
  type HostCleanTask,
  type HostFault,
  type HostGuest,
  type HostUnit,
  type PrListing,
  type PrPost,
  type PrRequest,
} from '../../../types/domain';
import { clockAt, makeClosureFn, resolveZmanimLoc } from '../../../components/parnasa/zmanimBoard';
import type { PrNow } from '../../../components/parnasa/hooks';

/** הרגע של כל הבדיקות: רביעי 14.10.2026 09:00Z = 12:00 בישראל (IDT). */
export const NOW_ISO = '2026-10-14T09:00:00Z';
export const NOW_MS = Date.parse(NOW_ISO);
const AT = '2026-10-01T08:00:00.000Z';

/* ───────── אירוח ───────── */

export function U(over: Partial<HostUnit>): HostUnit {
  return { id: 'hu', name: 'יחידה', type: 'צימר', beds: 2, cap: 4, rate: 600, status: 'free', subRooms: [], createdAt: AT, updatedAt: AT, ...over };
}
export function G(over: Partial<HostGuest>): HostGuest {
  return { id: 'hg', kind: 'guest', name: 'אורח', phone: '', email: '', adults: 2, kids: 0, notes: '', createdAt: AT, updatedAt: AT, ...over };
}
export function B(over: Partial<HostBooking>): HostBooking {
  return {
    id: 'hb', guestId: 'hg1', unitId: 'hu1', roomIds: [], checkIn: '2026-10-16', checkOut: '2026-10-18', adults: 2, kids: 0, status: 'confirmed',
    charges: [], payments: [], notes: '', shabbat: false, createdAt: AT, updatedAt: AT, ...over,
  };
}
export function F(over: Partial<HostFault>): HostFault {
  return { id: 'hf', kind: 'fault', unitId: '', assetId: '', category: 'אחר', priority: 3, desc: '', status: 'open', safety: false, blocked: false, createdAt: AT, updatedAt: AT, ...over };
}
export function C(over: Partial<HostCleanTask>): HostCleanTask {
  return { id: 'hc', kind: 'clean', unitId: 'hu1', type: 'ניקיון יומי', status: 'open', date: '2026-10-14', createdAt: AT, updatedAt: AT, ...over };
}

export const HOST_UNITS: HostUnit[] = [
  U({ id: 'hu1', name: 'צימר הגפן', cap: 4, beds: 2 }),
  U({
    id: 'hu2',
    name: 'בית ההארחה',
    type: 'בית הארחה',
    cap: 10,
    beds: 5,
    subRooms: [
      { id: 'r1', name: 'חדר הורים', beds: 2, rate: 300 },
      { id: 'r2', name: 'חדר ילדים', beds: 3, rate: 350 },
    ],
  }),
  U({ id: 'hu3', name: 'דירת הנחל', type: 'דירה', cap: 6, beds: 3, status: 'dirty' }),
];
export const HOST_BOOKINGS: HostBooking[] = [
  // משפחת לוי — שהייה לשבת (שישי ⇒ ראשון)
  B({ id: 'hb1', guestId: 'hg1', unitId: 'hu1', checkIn: '2026-10-16', checkOut: '2026-10-18', adults: 2, kids: 3, status: 'confirmed' }),
  // משפחת כהן — בשהייה עכשיו בחדר-ההורים
  B({ id: 'hb2', guestId: 'hg2', unitId: 'hu2', roomIds: ['r1'], checkIn: '2026-10-12', checkOut: '2026-10-15', status: 'in' }),
  // משפחת אברהם — מגיעה היום
  B({ id: 'hb3', guestId: 'hg3', unitId: 'hu3', checkIn: '2026-10-14', checkOut: '2026-10-16', status: 'confirmed' }),
  // לוי שוב — אמצע-שבוע, בלי שבת
  B({ id: 'hb4', guestId: 'hg1', unitId: 'hu2', roomIds: ['r2'], checkIn: '2026-10-20', checkOut: '2026-10-22', status: 'pending' }),
];
export const HOST_RECORDS = [
  G({ id: 'hg1', name: 'משפחת לוי', phone: '050-1234567', adults: 2, kids: 3 }),
  G({ id: 'hg2', name: 'משפחת כהן', phone: '052-7654321' }),
  G({ id: 'hg3', name: 'משפחת אברהם', phone: '' }),
  F({ id: 'hf1', unitId: 'hu1', category: 'אינסטלציה', priority: 2, desc: 'נזילה בכיור', status: 'open' }),
  F({ id: 'hf2', unitId: 'hu2', category: 'מיזוג/קירור', priority: 3, desc: 'מזגן לא מקרר', status: 'done', updatedAt: '2026-10-14T07:00:00.000Z' }),
  F({ id: 'hf3', unitId: '', category: 'גז', priority: 0, desc: 'ריח גז במטבח', status: 'inprogress', safety: true }),
  C({ id: 'hc1', unitId: 'hu3', type: 'ניקיון אחרי עזיבה', status: 'open', date: '2026-10-14' }),
  C({ id: 'hc2', unitId: 'hu1', type: 'ניקיון יומי', status: 'done', date: '2026-10-13' }),
];

/* ───────── פרנסה׳לע ───────── */

export function L(over: Partial<PrListing>): PrListing {
  return {
    id: 'x', source: 'owner', name: '', title: '', category: 'other', area: '', city: '', phone: '', phone2: '', whatsapp: '',
    hours: [], always: false, hoursNote: '', services: [], languages: ['he'], kashrut: '', emergency: false, desc: '', notes: '',
    status: 'approved', dialCode: '', featuredUntil: '', recs: [], createdAt: AT, updatedAt: AT, ...over,
  };
}
export function P(over: Partial<PrPost>): PrPost {
  return {
    id: 'pp', kind: 'notice', title: 'הודעה', text: '', place: '', phone: '', noticeKind: '', prayers: [], days: [],
    date: '', time: '', until: '', approved: true, pinned: false, createdAt: AT, updatedAt: AT, ...over,
  };
}
/** א׳–ה׳ 08:00–19:00 · ו׳ 08:00–13:00. */
export const WEEK_HOURS = [...[0, 1, 2, 3, 4].map((dow) => ({ dow, from: '08:00', to: '19:00' })), { dow: 5, from: '08:00', to: '13:00' }];
export const PR_LISTINGS: PrListing[] = [
  L({ id: 'pl101', dialCode: '101', name: 'אינסטלציה זילברמן', title: 'נזילות, סתימות ודודים', category: 'elec', area: 'בני ברק', phone: '050-0000101', whatsapp: '050-0000101', hours: WEEK_HOURS }),
  L({ id: 'pl102', dialCode: '102', name: 'חשמל אור הגנוז', title: 'חשמלאי מוסמך, לוחות וקצרים', category: 'elec', area: 'בני ברק', phone: '050-0000102', always: true, emergency: true }),
  L({ id: 'pl111', dialCode: '111', name: 'ניקיון ברק', title: 'ניקיון דירות ומשרדים', category: 'home', area: 'אשדוד', phone: '050-0000111', hours: WEEK_HOURS }),
  L({ id: 'pl130', dialCode: '130', name: 'אינסטלטור ממתין', title: 'אינסטלטור', category: 'elec', phone: '050-0000130', status: 'pending' }),
];
export const PR_POSTS: PrPost[] = [
  P({ id: 'pm1', kind: 'minyan', title: 'בית המדרש הגדול', place: 'רח׳ רבי עקיבא 10', prayers: [{ prayer: 'שחרית', times: ['06:30'] }, { prayer: 'מנחה', times: ['sh-15'] }] }),
  P({ id: 'pm2', kind: 'minyan', title: 'שטיבלך', place: 'רח׳ חזון איש 3', days: [5, 6], prayers: [{ prayer: 'קבלת שבת', times: ['sh-10'] }, { prayer: 'שחרית', times: ['08:30'] }] }),
  P({ id: 'pn1', kind: 'notice', noticeKind: 'simcha', title: 'מזל טוב למשפחת כהן' }),
];
export const PR_REQUESTS: PrRequest[] = [
  {
    id: 'pq1', text: 'צריך אינסטלטור דחוף', category: 'elec', area: '', urgent: true, quiet: false, job: false,
    requester: { name: 'יעקב לוי', phone: '052-1111111' }, status: 'open', responses: [], createdAt: '2026-10-14T08:30:00.000Z', updatedAt: '2026-10-14T08:30:00.000Z',
  },
];

/** ה-DB המשותף — שני הכלים, גם כשאחד מהם כבוי בקונפיג (נתונים קיימים ≠ מודול דלוק). */
export function fixtureDb(over: Partial<Db> = {}): Db {
  const db = emptyDb();
  return {
    ...db,
    hostUnits: HOST_UNITS,
    hostBookings: HOST_BOOKINGS,
    hostRecords: HOST_RECORDS,
    prListings: PR_LISTINGS,
    prPosts: PR_POSTS,
    prRequests: PR_REQUESTS,
    ui: { ...db.ui, hosting: { businessName: 'צימרי הגליל', shabbat: { mode: 'prep', candle: '17:40', havdalah: '18:35' } }, parnasa: { communityName: 'קהילת בעלזא' } },
    ...over,
  };
}

/** קונפיג: אילו כלים דלוקים, + וואטסאפ וטלפוניה דלוקים (כדי שגם שערי-ההרחבות "פתוחים" — הוכחה חזקה יותר לביט-זהות). */
export function cfgWith(mods: { parnasa?: boolean; hosting?: boolean }, features: Record<string, boolean> = {}, extra: Partial<OrgConfig> = {}): OrgConfig {
  const modules: Record<string, boolean> = {};
  if (mods.parnasa) modules.parnasa = true;
  if (mods.hosting) modules.hosting = true;
  return {
    ...DEFAULT_CONFIG,
    orgName: 'צימרי הגליל',
    modules,
    features,
    integrations: { whatsapp: { enabled: true } },
    telephony: { ...DEFAULT_CONFIG.telephony, enabled: true } as OrgConfig['telephony'],
    ...extra,
  };
}

const INIT = useApp.getInitialState() as unknown as Record<string, unknown>;
const ORIG = { config: INIT.config, db: INIT.db, cloud: INIT.cloud };

export function setupStore(cfg: OrgConfig, db: Db = fixtureDb(), email: string | null = null): void {
  const st = useApp.getState();
  const patch = { config: cfg, db, cloud: { ...st.cloud, user: email ? { uid: 'u', email } : null, isManager: false } };
  useApp.setState(patch as never);
  Object.assign(INIT, patch);
}

export function restoreStore(): void {
  Object.assign(INIT, ORIG);
  useApp.setState({ config: DEFAULT_CONFIG, db: emptyDb(), view: 'home' } as never);
}

/** שעון-הקהילה של פרנסה׳לע לרגע-המבחן (prop של הלשוניות). */
export function prNowAt(nowMs: number = NOW_MS): PrNow {
  const loc = resolveZmanimLoc();
  const clock = clockAt(nowMs, loc.tz);
  return { nowMs, loc, clock, todayIso: clock.iso, closureAt: makeClosureFn(loc) };
}

/** מזהי useId של React ("_R_1f_") משתנים לפי מיקום-בעץ — לא חלק מהממשק הנראה; מנורמלים לפני השוואה. */
export function normHtml(html: string): string {
  return html.replace(/_R_[0-9a-zA-Z]*_/g, '_R_id_');
}
