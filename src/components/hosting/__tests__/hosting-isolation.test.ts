/**
 * ratchet — 🏡 אירוח 4: פעולות-ה-store + בידוד (BUILD-ORDER-HOSTING-2026-10-12, הכרעות 2 ו-4; תיקונים F1–F13).
 *
 * הכללים שננעלים:
 *  (א) בידוד — סריקת-מקור: הפעולות (actions.ts) לא נוגעות באף מפתח-DB מלבד שלושת אוספי-המודול ו-ui (נגזר
 *      מ-emptyDb — גם אוסף שיתווסף בעתיד אסור אוטומטית), לא קוראות ל-setDb/setState (רק hostApi.write — שהטיפוס שלו,
 *      HostPatch, מתיר רק את אוספי-המודול והגדרותיו), ולא מזכירות קבלות/תרומות/לוח-ראשי/חדרי-חוגים. ב-store: צינור
 *      אחד (hostWrite) ושומרי-מקום בלבד. כל קבצי-המודול (מנוע + רכיבים, כולל עתידיים — glob) — אותו דבר.
 *      + התנהגותית: זרימה מלאה לא מזיזה מונה-קבלות ולא נוגעת בתורמים/בלוח-הראשי/בחדרים/בשיבוצים.
 *  (ב) "שוקל רק מה שהדלקת": הפעולות נטענות עם המסך (actions.ts — רק HostingView מייבא) — ה-store המרכזי לא מייבא
 *      ערך מהמודול; transitions לא גורר את המנוע הכבד.
 *  (ג) הרשאות ב-store (לא רק בממשק): מחיקה/איפוס = hosting.delete · הגדרות/שחזור = hosting.manage (hostCan =
 *      featureOn ∧ canGrantedAction); מודול כבוי (opt-in, חסר) ⇒ אין סמכויות בכלל.
 *  (ד) כללי-העסק של המקור נאכפים ב-store, וכל תיקון (F1, F3–F7, F9–F13) ננעל עם תיאור הבאג.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import {
  emptyDb,
  type Db,
  type HostBooking,
  type HostCleanTask,
  type HostDish,
  type HostFault,
  type HostGuest,
  type HostMeal,
  type HostRecord,
  type HostStaff,
  type HostUnit,
} from '../../../types/domain';
import { makeId, deviceTag } from '../../../lib/ids';
import { seatAddPerson, seatAddTable } from '../seating';
import { installHostingActions } from '../actions';
import storeSrc from '../../../store/useApp.ts?raw';
import actionsSrc from '../actions.ts?raw';
import transitionsSrc from '../transitions.ts?raw';
import appSrc from '../../../App.tsx?raw';

/* ═══════════════ (א)+(ב) סריקת-מקור ═══════════════ */

/** כל קבצי-המודול (מנוע + רכיבים) — גם רכיבים שיתווספו באשכולות הבאים נסרקים אוטומטית. */
const MODULE_SRC = import.meta.glob(['../*.ts', '../*.tsx'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
/** מפתח-glob (יחסי לתיקיית-הבדיקה) ⇒ נתיב מ-src/. */
function fromTestDir(rel: string): string {
  const parts = ['src', 'components', 'hosting', '__tests__'];
  for (const seg of rel.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}
/** כל קבצי-האפליקציה (מי מייבא את actions.ts — רק המודול עצמו). */
const ALL_SRC = import.meta.glob(['../../../**/*.ts', '../../../**/*.tsx', '!../../../**/__tests__/**'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const BLOCK_START = '// ── אירוח משפחתי (מודול hosting — opt-in ומבודד; BUILD-ORDER-HOSTING אשכול 4) ──';
const BLOCK_END = '// ── סוף אירוח משפחתי ──';
const HELPERS_START = '// ── אירוח משפחתי · עזרי-store (BUILD-ORDER-HOSTING אשכול 4) ──';
const HELPERS_END = '// ── סוף עזרי-אירוח ──';

function region(startMark: string, endMark: string): string {
  const start = storeSrc.indexOf(startMark);
  const end = storeSrc.indexOf(endMark);
  expect(start, 'סמן-פתיחה: ' + startMark).toBeGreaterThan(0);
  expect(end, 'סמן-סיום אחרי הפתיחה: ' + endMark).toBeGreaterThan(start);
  expect(storeSrc.indexOf(startMark, start + 1), 'סמן-פתיחה כפול').toBe(-1);
  return storeSrc.slice(start, end);
}

/** מילות-כסף/לוח-ראשי אסורות (substring — קפדני במכוון). */
const MONEY_WORDS = ['receiptSeq', 'donationSeq', 'shopReceiptSeq', 'donations', 'upsertEvent', 'deleteEvent', 'addDonation', 'addPayment(', 'OrgEvent', 'receipt'];
/** מפתחות-ה-DB שהמודול רשאי לגעת בהם (delLog — קריאה בלבד, בעזר המזהים). */
const ALLOWED_KEYS = new Set(['hostUnits', 'hostBookings', 'hostRecords', 'ui', 'delLog']);
const FORBIDDEN_KEYS = Object.keys(emptyDb()).filter((k) => !ALLOWED_KEYS.has(k));

const ACTIONS = [
  'upsertHostUnit(u)', 'deleteHostUnit(id)', 'setHostUnitStatus(id, status)', 'addHostRoom(unitId, room)', 'deleteHostRoom(unitId, roomId)',
  'upsertHostBooking(b)', 'setHostBookingStatus(id, status)', 'addHostPayment(bookingId, p)', 'deleteHostBooking(id)', 'addHostShabbatPackage(bookingId)',
  'upsertHostRecord(r)', 'deleteHostRecord(id)', 'setHostTableItems(items)', 'upsertHostMeal(m)', 'setHostMealStatus(id, status)', 'deleteHostMeal(id)',
  'syncHostKitchen()', 'updateHostSeatPlan(mealId, f)', 'addHostCleanTask(unitId, type)', 'finishHostCleanTask(id)', 'addHostFault(f)',
  'advanceHostFault(id)', 'releaseHostFaultUnit(id)', 'addHostTempReading(device, temp)', 'setHostingPrefs(patch)', 'setHostShabbat(patch)',
  'setHostShop(patch)', 'restoreHosting(data)', 'resetHosting()',
];

describe('🏡 (א) בידוד — סריקת-מקור', () => {
  it('actions.ts: כל 29 הפעולות; אפס מפתח-DB זר (נגזר מ-emptyDb), אפס כסף/לוח-ראשי/חדרי-חוגים', () => {
    for (const fn of ACTIONS) expect(actionsSrc, 'הפעולה ' + fn).toContain('    ' + fn + ' {');
    for (const kw of MONEY_WORDS) expect(actionsSrc, 'actions.ts מזכיר ' + kw).not.toContain(kw);
    expect(FORBIDDEN_KEYS.length, 'emptyDb חי (מגן מפני סורק-ריק)').toBeGreaterThan(25);
    for (const k of FORBIDDEN_KEYS) {
      expect(actionsSrc, 'actions.ts ניגש ל-db.' + k).not.toMatch(new RegExp('\\.' + k + '\\b'));
      expect(actionsSrc, 'actions.ts כותב ' + k + ':').not.toMatch(new RegExp('[{,]\\s*' + k + '\\s*:'));
    }
  });

  it('אין כתיבה עוקפת: actions.ts לא קורא ל-setDb; setState אחד בלבד (ההתקנה); כל הכתיבות — hostApi.write', () => {
    expect(actionsSrc).not.toMatch(/\bsetDb\b/);
    expect(actionsSrc).not.toMatch(/\bdelLog\b/);
    expect((actionsSrc.match(/\.setState\(/g) ?? []).length).toBe(1);
    expect(actionsSrc).toMatch(/export function installHostingActions\(\): void \{\s*useApp\.setState\(hostingActions\(\)\);\s*\}/);
    expect(actionsSrc).toMatch(/function hostWrite\(f: \(db: Db\) => HostPatch\): void \{\s*get\(\)\.hostApi\.write\(f\);\s*\}/);
    expect((actionsSrc.match(/\bhostWrite\(/g) ?? []).length, 'כל הכתיבות דרך hostWrite').toBeGreaterThan(25);
  });

  it('ה-store: צינור אחד (hostWrite — setDb יחיד, מפזר רק אוספי-מודול ו-ui.hosting) + שומרי-מקום; HostPatch = 3 אוספים + prefs', () => {
    const helpers = region(HELPERS_START, HELPERS_END);
    expect((helpers.match(/\bsetDb\(/g) ?? []).length).toBe(1);
    expect(helpers).toMatch(/function hostWrite\(f: \(db: Db\) => HostPatch\): void \{\s*setDb\(\(db\) => \{\s*const \{ prefs, \.\.\.cols \} = f\(db\);\s*return prefs \? \{ \.\.\.cols, ui: \{ \.\.\.db\.ui, hosting: prefs \} \} : cols;/);
    for (const kw of MONEY_WORDS) expect(helpers, 'עזרי-האירוח מזכירים ' + kw).not.toContain(kw);
    for (const k of FORBIDDEN_KEYS) expect(helpers, 'עזרי-האירוח ניגשים ל-' + k).not.toMatch(new RegExp('\\.' + k + '\\b'));
    const block = region(BLOCK_START, BLOCK_END);
    expect(block).toContain('hostApi: { write: hostWrite, newId: hostNewId, audit: logAudit },');
    for (const fn of ACTIONS) expect(block, 'שומר-מקום ל-' + fn).toContain(fn.slice(0, fn.indexOf('(')) + ': nl,');
    expect(block, 'אין לוגיקה בגוש-ה-store').not.toMatch(/\bif \(|toast\(/);
    expect(storeSrc).toMatch(/function hostingNotLoaded\(\): never \{\s*throw new Error\(/);
    const m = storeSrc.match(/type HostPatch = \{([^}]*)\};/);
    expect(m, 'HostPatch מוגדר').toBeTruthy();
    const keys = [...m![1].matchAll(/(\w+)\?:/g)].map((x) => x[1]).sort();
    expect(keys).toEqual(['hostBookings', 'hostRecords', 'hostUnits', 'prefs']);
  });

  it('כל קבצי-המודול: אפס מילות-כסף, אפס db.events/db.rooms, אפס ייבוא מעולם התרומות/הקבלות', () => {
    const files = Object.entries(MODULE_SRC);
    expect(files.length, 'ה-glob חי').toBeGreaterThanOrEqual(7);
    for (const [path, src] of files) {
      for (const kw of MONEY_WORDS) expect(src, path + ' מזכיר ' + kw).not.toContain(kw);
      expect(src, path + ' — גישה ל-.events').not.toMatch(/\.events\b/);
      expect(src, path + ' — כתיבת events:').not.toMatch(/[{,]\s*events\s*:/);
      expect(src, path + " — useDbWatch('events'/'rooms')").not.toMatch(/useDbWatch\([^)]*'(events|rooms)'/);
      // חדרי-החוגים: db.rooms. (importer.ts קורא `rooms` מקובץ-הגיבוי של האפליקציה המקורית — לא מה-DB)
      expect(src, path + ' — db.rooms').not.toMatch(/\bdb\.rooms\b/);
      expect(src, path + ' — ייבוא מ-supporters').not.toMatch(/from '[^']*supporters/);
      expect(src, path + ' — ייבוא מ-receipt').not.toMatch(/from '[^']*receipt/);
    }
  });

  it('transitions.ts טהור: בלי store/DOM/Date.now — "עכשיו" מוזרק', () => {
    expect(transitionsSrc).not.toContain('useApp');
    expect(transitionsSrc).not.toMatch(/Date\.now\(|new Date\(\)/);
    expect(transitionsSrc).not.toMatch(/\bdocument\.|\bwindow\./);
  });
});

describe('🏡 (ב) "שוקל רק מה שהדלקת" — הפעולות והמנוע עצלים', () => {
  it('ה-store לא מייבא ערך מהמודול (רק טיפוסים מ-domain); App טוען את המסך lazy', () => {
    const valueImports = storeSrc.split('\n').filter((l) => /from '\.\.\/components\/hosting\//.test(l) && !l.trim().startsWith('import type'));
    expect(valueImports).toEqual([]);
    expect(appSrc).toMatch(/hosting: \(\) => import\('\.\/components\/hosting\/HostingView'\)/);
  });

  it('actions.ts מיובא רק מתוך המודול (HostingView מתקין) — לא מה-store, לא מ-App, לא ממסך אחר', () => {
    const importers = Object.entries(ALL_SRC)
      .filter(([, src]) => /from '[^']*hosting\/actions'|from '\.\/actions'/.test(src))
      .map(([path]) => fromTestDir(path));
    expect(importers.length).toBeGreaterThan(0);
    for (const f of importers) expect(f, 'מייבא את actions מחוץ למודול: ' + f).toMatch(/^src\/components\/hosting\//);
    const view = MODULE_SRC['../HostingView.tsx'];
    expect(view).toMatch(/^installHostingActions\(\);$/m);
  });

  it('transitions.ts לא מייבא את המנוע (lib/kitchen/seating/reports/importer/actions) ולא את הלוח-העברי', () => {
    expect(transitionsSrc).not.toMatch(/from '\.\/(lib|kitchen|seating|reports|importer|actions)'/);
    expect(transitionsSrc).not.toMatch(/from '[^']*\/(hebrew|hebdate|monthGrid|calendar)[^']*'/);
  });
});

/* ═══════════════ store — עזרי-בדיקה ═══════════════ */

const ADMIN = 'owner@zimmer.co.il';
const STAFF = 'staff@zimmer.co.il';
const AT = '2026-10-12T08:00:00.000Z';

function cfg(opts: { features?: Record<string, boolean>; moduleOn?: boolean } = {}): OrgConfig {
  return { ...DEFAULT_CONFIG, adminEmails: [ADMIN], modules: opts.moduleOn === false ? {} : { hosting: true }, features: { ...opts.features } };
}

let toasts: string[] = [];

function as(email: string | null, opts: { features?: Record<string, boolean>; moduleOn?: boolean; isManager?: boolean } = {}): void {
  const st = useApp.getState();
  useApp.setState({
    config: cfg(opts),
    cloud: { ...st.cloud, user: email ? { uid: 'u-' + email, email } : null, isManager: opts.isManager === true },
    toast: (m: string) => {
      toasts.push(m);
    },
  } as never);
}

function U(over: Partial<HostUnit> = {}): HostUnit {
  return { id: 'hu1', name: 'צימר הגפן', type: 'צימר', beds: 2, cap: 4, rate: 600, status: 'free', subRooms: [], createdAt: AT, updatedAt: AT, ...over };
}
function UR(over: Partial<HostUnit> = {}): HostUnit {
  return U({
    id: 'hu2',
    name: 'בית ההארחה',
    type: 'בית הארחה',
    cap: 10,
    subRooms: [
      { id: 'r1', name: 'חדר הורים', beds: 2, rate: 300 },
      { id: 'r2', name: 'חדר ילדים', beds: 3, rate: 350 },
    ],
    ...over,
  });
}
function G(over: Partial<HostGuest> = {}): HostGuest {
  return { id: 'hg1', kind: 'guest', name: 'משפחת כהן', phone: '050-1234567', email: '', adults: 2, kids: 3, notes: '', createdAt: AT, updatedAt: AT, ...over };
}
function B(over: Partial<HostBooking> = {}): HostBooking {
  return {
    id: 'hb1', guestId: 'hg1', unitId: 'hu1', roomIds: [], checkIn: '2026-10-14', checkOut: '2026-10-16', adults: 2, kids: 1, status: 'confirmed',
    charges: [], payments: [], notes: '', shabbat: false, createdAt: AT, updatedAt: AT, ...over,
  };
}
function M(over: Partial<HostMeal> = {}): HostMeal {
  return {
    id: 'hm1', kind: 'meal', mealName: 'ארוחת ערב', bookingId: 'hb1', unitId: 'hu1', guestId: 'hg1', diners: [{ guestId: 'hg1', adults: 2, kids: 1 }],
    dinerCount: 3, date: '2026-10-14', time: '19:00', cook: '', server: '', clearer: '', tableSetter: '',
    items: [{ name: 'עוף', price: 50, qty: 3, alg: '', by: '' }], status: 'new', allergens: '', notes: '', seatPlan: { people: [], tables: [] },
    createdAt: AT, updatedAt: AT, ...over,
  };
}
function D(over: Partial<HostDish> = {}): HostDish {
  return {
    id: 'hd1', kind: 'dish', name: 'עוף', type: 'בשרי', price: 50, allergens: '', prepTime: '20', cookTime: '60', cookTemp: '180', baseServings: 4,
    ingredients: ['עוף · 1 ק״ג'], steps: ['לתבל'], notes: '', defBy: '', createdAt: AT, updatedAt: AT, ...over,
  };
}
function ST(over: Partial<HostStaff> = {}): HostStaff {
  return { id: 'hs1', kind: 'staff', name: 'רחל', role: 'טבח', phone: '', createdAt: AT, updatedAt: AT, ...over };
}

function seed(over: Partial<Db> = {}): void {
  useApp.getState().setDb(() => ({ ...emptyDb(), ...over }));
  useApp.setState((s) => ({ db: { ...s.db, audit: [], delLog: [] } }));
}

const db = (): Db => useApp.getState().db;
const rec = <K extends HostRecord['kind']>(id: string, kind: K): Extract<HostRecord, { kind: K }> =>
  db().hostRecords.find((r) => r.id === id && r.kind === kind) as Extract<HostRecord, { kind: K }>;
const booking = (id = 'hb1'): HostBooking => db().hostBookings.find((b) => b.id === id)!;
const unit = (id = 'hu1'): HostUnit => db().hostUnits.find((u) => u.id === id)!;
const s = () => useApp.getState();

beforeEach(() => {
  installHostingActions();
  toasts = [];
  seed();
  as(ADMIN);
});

/* ═══════════════ (ג) הרשאות ═══════════════ */

describe('🏡 (ג) הרשאות נאכפות ב-store', () => {
  it('מחיקה: עובד/ת בלי hosting.delete ⇒ נדחה בלי שינוי; מנהל ⇒ נמחק + מצבה; הדלקה-פר-עובד ⇒ מותר', () => {
    seed({ hostUnits: [U(), U({ id: 'hu9', name: 'וילה' })], hostRecords: [G()] });
    as(STAFF);
    expect(s().deleteHostUnit('hu9')).toBe(false);
    expect(db().hostUnits).toHaveLength(2);
    expect(toasts.join(' ')).toContain('אין הרשאת מחיקה');
    as(ADMIN);
    expect(s().deleteHostUnit('hu9')).toBe(true);
    expect((db().delLog ?? []).some((d) => d.col === 'hostUnits' && d.id === 'hu9')).toBe(true);
    as(STAFF, { features: { 'hosting.delete': true } });
    expect(s().deleteHostRecord('hg1')).toBe(true);
  });

  it('הגדרות/שחזור: עובד/ת ⇒ נדחה; מנהל-ארגון (isManager) ⇒ מותר; false מפורש מכבה גם לו', () => {
    as(STAFF);
    expect(s().setHostingPrefs({ cleaningFee: 200 })).toBe(false);
    expect(s().restoreHosting({ units: [U()], bookings: [], records: [], prefs: {} })).toBe(false);
    expect(db().hostUnits).toHaveLength(0);
    as('boss@zimmer.co.il', { isManager: true });
    expect(s().setHostingPrefs({ cleaningFee: 200 })).toBe(true);
    as('boss@zimmer.co.il', { isManager: true, features: { 'hosting.manage': false } });
    expect(s().setHostingPrefs({ cleaningFee: 300 })).toBe(false);
    expect(db().ui.hosting?.cleaningFee).toBe(200);
  });

  it('מודול כבוי (opt-in — המפתח חסר) ⇒ אין סמכויות מחיקה/הגדרות/שחזור/איפוס, גם למנהל', () => {
    seed({ hostUnits: [U()] });
    as(ADMIN, { moduleOn: false });
    expect(s().deleteHostUnit('hu1')).toBe(false);
    expect(s().setHostingPrefs({ taxPct: 0 })).toBe(false);
    expect(s().resetHosting()).toBe(false);
    expect(s().restoreHosting({ units: [], bookings: [], records: [], prefs: {} })).toBe(false);
    expect(db().hostUnits).toHaveLength(1);
  });

  it('רשימת-הקניות (נלווה/פריט-שולחן) — פתוחה לצוות כמו במקור; מחיקת נלווה מנקה גם "לקחתי"/אמוג׳י', () => {
    as(STAFF);
    const sup = s().upsertHostRecord({ id: '', kind: 'supply', name: 'מפיות', cat: 'חד-פעמי', qty: '2 חבילות', bought: false, createdAt: '', updatedAt: '' }).record!;
    s().setHostShop({ got: ['sup:' + sup.id, true], emoji: ['sup:' + sup.id, '🧻'] });
    expect(rec(sup.id, 'supply').bought).toBe(true);
    expect(db().ui.hosting?.shopGot?.['sup:' + sup.id]).toBe(true);
    expect(s().deleteHostRecord(sup.id)).toBe(true);
    expect(db().ui.hosting?.shopGot?.['sup:' + sup.id]).toBeUndefined();
    expect(db().ui.hosting?.shopEmoji?.['sup:' + sup.id]).toBeUndefined();
  });
});

/* ═══════════════ (ד) הזמנות ═══════════════ */

describe('🏡 (ד) הזמנות — זמינות, תמחור, תיק', () => {
  it('הזמנה חדשה: ממתינה; חיובים = לינה + ניקיון + מע״מ לפי ההגדרות (כמו המקור); מזהה hb', () => {
    seed({ hostUnits: [U()], hostRecords: [G()], ui: { ...emptyDb().ui, hosting: { cleaningFee: 100, taxPct: 10 } } });
    const res = s().upsertHostBooking(B({ id: '', status: 'confirmed', charges: [{ id: 'x', kind: 'extra', label: 'זדוני', amount: -999 }] }));
    expect(res.ok).toBe(true);
    const b = res.booking!;
    expect(b.id).toMatch(/^hb/);
    expect(b.status).toBe('pending'); // סטטוס נקבע במעברים בלבד
    expect(b.charges.map((c) => [c.kind, c.amount])).toEqual([
      ['stay', 1200],
      ['cleaning', 100],
      ['tax', 130],
    ]);
    expect((db().audit ?? []).some((e) => e.act.includes('הזמנה'))).toBe(true);
  });

  it('F1: יחידה חסומה (תקלה P0/P1 או "🚫 חסום") — הזמנה חדשה נדחית (במקור `isAvailableRooms` התעלם מ-status)', () => {
    seed({ hostUnits: [U({ status: 'blocked' })], hostRecords: [G()] });
    const seq = db().seq;
    expect(s().upsertHostBooking(B({ id: '' })).ok).toBe(false);
    expect(toasts.at(-1)).toContain('חסומה');
    expect(db().hostBookings).toHaveLength(0);
    expect(db().seq, 'שער לפני מזהה').toBe(seq);
  });

  it('התנגשות/תאריכים/חדרים: נדחים בהודעות המקור; יחידה משותפת — חדרים שונים באותם תאריכים מותרים', () => {
    seed({ hostUnits: [U(), UR()], hostRecords: [G(), G({ id: 'hg2', name: 'משפחת לוי' })], hostBookings: [B()] });
    expect(s().upsertHostBooking(B({ id: '', checkIn: '2026-10-15', checkOut: '2026-10-17' })).ok).toBe(false);
    expect(toasts.at(-1)).toContain('התנגשות');
    expect(s().upsertHostBooking(B({ id: '', checkIn: '2026-10-17', checkOut: '2026-10-17' })).ok).toBe(false);
    expect(toasts.at(-1)).toBe('תאריכים לא תקינים');
    expect(s().upsertHostBooking(B({ id: '', unitId: 'hu2', roomIds: [] })).ok).toBe(false);
    expect(toasts.at(-1)).toBe('בחרו לפחות חדר אחד');
    expect(s().upsertHostBooking(B({ id: '', unitId: 'hu2', roomIds: ['r1'] })).ok).toBe(true);
    expect(s().upsertHostBooking(B({ id: '', unitId: 'hu2', guestId: 'hg2', roomIds: ['r2'] })).ok).toBe(true);
    expect(s().upsertHostBooking(B({ id: '', unitId: 'hu2', guestId: 'hg2', roomIds: ['r1'] })).ok).toBe(false);
    // חדר שאינו ביחידה — מסונן (לא "תופס" חדר דמיוני)
    const r = s().upsertHostBooking(B({ id: '', unitId: 'hu2', roomIds: ['r1', 'ghost'], checkIn: '2026-11-01', checkOut: '2026-11-02' }));
    expect(r.booking?.roomIds).toEqual(['r1']);
    expect(r.booking?.charges[0].label).toContain('חדר הורים');
  });

  it('אורח/יחידה חסרים ⇒ נדחה (המקור דרש אורח ויחידה קיימים)', () => {
    seed({ hostUnits: [U()], hostRecords: [G()] });
    expect(s().upsertHostBooking(B({ id: '', guestId: 'nope' })).ok).toBe(false);
    expect(s().upsertHostBooking(B({ id: '', unitId: 'nope' })).ok).toBe(false);
    expect(db().hostBookings).toHaveLength(0);
  });

  it('F3: שמירת-עריכה מחליפה רק לינה/ניקיון/מע״מ — חיוב "חבילת שבת" וחיוב-ארוחה נשמרים (במקור נמחקו), והתשלומים לא נוגעים', () => {
    seed({
      hostUnits: [U()],
      hostRecords: [G(), M()],
      hostBookings: [
        B({
          shabbat: true,
          charges: [
            { id: 'stay', kind: 'stay', label: 'לינה', amount: 1 },
            { id: 'shabbat', kind: 'shabbat', label: 'חבילת שבת', amount: 250 },
            { id: 'meal:hm1', kind: 'meal', label: 'הזמנת מטבח (1 מנות)', amount: 150, mealId: 'hm1' },
          ],
          payments: [{ id: 'p1', amount: 500, date: '2026-10-12', note: 'מזומן' }],
        }),
      ],
    });
    const res = s().upsertHostBooking({ ...booking(), adults: 4, kids: 1, checkOut: '2026-10-17', status: 'cancelled', payments: [] });
    expect(res.ok).toBe(true);
    const b = booking();
    expect(b.status).toBe('confirmed');
    expect(b.payments).toHaveLength(1);
    expect(b.charges.map((c) => c.kind)).toEqual(['stay', 'cleaning', 'tax', 'shabbat', 'meal']);
    expect(b.charges[0].amount).toBe(1800);
    // סנכרון הארוחה לגודל-ההזמנה (5) + חיוב-המטבח מתחדש
    expect(res.mealsSynced).toBe(1);
    expect(rec('hm1', 'meal').dinerCount).toBe(5);
    expect(rec('hm1', 'meal').items[0].qty).toBe(5);
    expect(b.charges.find((c) => c.kind === 'meal')?.amount).toBe(250);
  });

  it('עריכה: היחידה והחדרים נעולים; יחידה שנחסמה — עריכת נפשות/הערות בלי שינוי-תאריכים מותרת, הארכה נדחית (F1)', () => {
    seed({ hostUnits: [U({ status: 'blocked' }), U({ id: 'hu9' })], hostRecords: [G()], hostBookings: [B()] });
    const r1 = s().upsertHostBooking({ ...booking(), unitId: 'hu9', notes: 'רגישות לבוטנים', adults: 3 });
    expect(r1.ok).toBe(true);
    expect(booking().unitId).toBe('hu1');
    expect(booking().notes).toBe('רגישות לבוטנים');
    expect(s().upsertHostBooking({ ...booking(), checkOut: '2026-10-18' }).ok).toBe(false);
    expect(booking().checkOut).toBe('2026-10-16');
  });

  it('הזמנה ישנה שהוזמנה כיחידה-שלמה לפני שהוגדרו חדרים — נשמרת (בדיקה מול כל החדרים, כמו המקור)', () => {
    seed({ hostUnits: [UR()], hostRecords: [G()], hostBookings: [B({ unitId: 'hu2', roomIds: [] })] });
    expect(s().upsertHostBooking({ ...booking(), notes: 'עודכן' }).ok).toBe(true);
    expect(booking().notes).toBe('עודכן');
  });
});

describe('🏡 (ד) מעברי-סטטוס, תשלומים, מחיקה', () => {
  it('מעברים מותרים בלבד; צ׳ק-אאוט ⇒ יחידה "לניקיון" + משימת "ניקיון אחרי עזיבה" + חותמות', () => {
    seed({ hostUnits: [U()], hostRecords: [G()], hostBookings: [B({ status: 'pending' })] });
    expect(s().setHostBookingStatus('hb1', 'done')).toBe(false); // ממתינה ⇒ הושלמה: אסור
    expect(s().setHostBookingStatus('hb1', 'confirmed')).toBe(true);
    expect(s().setHostBookingStatus('hb1', 'in')).toBe(true);
    expect(booking().checkedInAt).toBeTruthy();
    expect(s().setHostBookingStatus('hb1', 'done')).toBe(true);
    expect(booking().checkedOutAt).toBeTruthy();
    expect(unit().status).toBe('dirty');
    const task = db().hostRecords.find((r): r is HostCleanTask => r.kind === 'clean')!;
    expect(task.type).toBe('ניקיון אחרי עזיבה');
    expect(task.bookingId).toBe('hb1');
    expect(toasts).toContain('צ׳ק-אאוט ✓ · נוצרה משימת ניקיון');
    expect(s().setHostBookingStatus('hb1', 'cancelled')).toBe(false); // הושלמה — סופית
  });

  it('F12: צ׳ק-אאוט ביחידה חסומה — נשארת חסומה (במקור "שוחררה" ל"מלוכלכת" ⇒ ניקיון ⇒ פנויה ⇒ הוזמנה למרות התקלה); שחרור ⇒ "לניקיון"', () => {
    seed({ hostUnits: [U({ status: 'blocked' })], hostRecords: [G()], hostBookings: [B({ status: 'in' })] });
    expect(s().setHostBookingStatus('hb1', 'done')).toBe(true);
    expect(unit().status).toBe('blocked');
    expect(toasts.at(-1)).toContain('נשארת חסומה');
    expect(s().setHostUnitStatus('hu1', 'free')).toBe(true);
    expect(unit().status).toBe('dirty');
  });

  it('F6: תשלום מותר גם אחרי צ׳ק-אאוט (החוב בדוח-הגבייה), לא בהזמנה שבוטלה; סכום לא-תקין נדחה; רישום-פנקס בלבד', () => {
    seed({ hostUnits: [U()], hostRecords: [G()], hostBookings: [B({ status: 'done' }), B({ id: 'hb2', status: 'cancelled', checkIn: '2026-11-01', checkOut: '2026-11-03' })] });
    expect(s().addHostPayment('hb1', { amount: 300, note: 'אשראי' })).toBe(true);
    expect(s().addHostPayment('hb1', { amount: 200, note: '' })).toBe(true);
    expect(booking().payments.map((p) => [p.id, p.amount, p.note])).toEqual([
      ['p1', 300, 'אשראי'],
      ['p2', 200, ''],
    ]);
    expect(s().addHostPayment('hb2', { amount: 100, note: '' })).toBe(false);
    expect(s().addHostPayment('hb1', { amount: -5, note: '' })).toBe(false);
    expect(s().addHostPayment('hb1', { amount: Number.NaN, note: '' })).toBe(false);
    expect(booking().payments).toHaveLength(2);
    expect((db().audit ?? []).some((e) => e.act.includes('תשלום') && e.what.includes('₪300'))).toBe(true);
  });

  it('F5: מחיקת הזמנה — הארוחות המשויכות נשמרות ומתנתקות (במקור הצביעו להזמנה שאינה); ביטול שומר היסטוריה', () => {
    seed({ hostUnits: [U()], hostRecords: [G(), M(), { ...M({ id: 'hm2', bookingId: 'hb9' }) }], hostBookings: [B()] });
    as(STAFF);
    expect(s().deleteHostBooking('hb1')).toBe(false);
    as(ADMIN);
    expect(s().deleteHostBooking('hb1')).toBe(true);
    expect(db().hostBookings).toHaveLength(0);
    expect(rec('hm1', 'meal').bookingId).toBe('');
    expect(rec('hm2', 'meal').bookingId).toBe('hb9');
    expect((db().delLog ?? []).some((d) => d.col === 'hostBookings' && d.id === 'hb1')).toBe(true);
  });

  it('מחיקת יחידה/חדר/אורח נחסמת בזמן שמפנים אליהם (כמו המקור); הזמנה שבוטלה לא חוסמת יחידה', () => {
    seed({ hostUnits: [U(), UR()], hostRecords: [G(), G({ id: 'hg2' })], hostBookings: [B(), B({ id: 'hb2', unitId: 'hu2', roomIds: ['r1'] })] });
    expect(s().deleteHostUnit('hu1')).toBe(false);
    expect(s().deleteHostRoom('hu2', 'r1')).toBe(false);
    expect(s().deleteHostRoom('hu2', 'r2')).toBe(true);
    expect(unit('hu2').subRooms.map((r) => r.id)).toEqual(['r1']);
    expect(s().deleteHostRecord('hg1')).toBe(false);
    expect(s().deleteHostRecord('hg2')).toBe(true);
    s().setHostBookingStatus('hb1', 'cancelled');
    expect(s().deleteHostUnit('hu1')).toBe(true);
  });

  it('יחידה: חדשה פנויה ובלי חדרים, בסוף הרשימה; עריכה לא דורסת מצב/חדרים; חדר חדש — מזהה מקומי r#', () => {
    seed({ hostUnits: [UR({ status: 'dirty' })] });
    const a = s().upsertHostUnit({ ...U(), id: '', name: '  ', status: 'blocked', subRooms: [{ id: 'x', name: 'x', beds: 1, rate: 1 }] }).unit!;
    expect(a.status).toBe('free');
    expect(a.subRooms).toEqual([]);
    expect(a.name).toBe('יחידה');
    expect(db().hostUnits.map((u) => u.id)).toEqual(['hu2', a.id]);
    s().upsertHostUnit({ ...unit('hu2'), name: 'בית ההארחה הגדול', status: 'free', subRooms: [] });
    expect(unit('hu2').status).toBe('dirty');
    expect(unit('hu2').subRooms).toHaveLength(2);
    expect(s().addHostRoom('hu2', { name: '', beds: 2, rate: 100 })).toBe(false);
    expect(s().addHostRoom('hu2', { name: 'חדר סבתא', beds: 2, rate: 250 })).toBe(true);
    expect(unit('hu2').subRooms.at(-1)?.id).toBe('r3');
  });
});

/* ═══════════════ (ד) מטבח ═══════════════ */

describe('🏡 (ד) מטבח ⇄ תיק-השהייה', () => {
  it('ארוחה משויכת ⇒ חיוב "הזמנת מטבח (N מנות)"; עריכה מחדשת; F4 ביטול מסיר את החיוב (במקור נשאר); מחיקה מסירה', () => {
    seed({ hostUnits: [U()], hostRecords: [G()], hostBookings: [B()] });
    const meal = s().upsertHostMeal(M({ id: '', unitId: '', guestId: '' })).meal!;
    expect(meal.id).toMatch(/^hr/);
    expect(meal.unitId).toBe('hu1'); // מההזמנה
    let ch = booking().charges.find((c) => c.mealId === meal.id)!;
    expect([ch.label, ch.amount]).toEqual(['הזמנת מטבח (1 מנות)', 150]);
    s().upsertHostMeal({ ...rec(meal.id, 'meal'), items: [...meal.items, { name: 'יין', price: 30, qty: 2, alg: '', by: '' }] });
    ch = booking().charges.find((c) => c.mealId === meal.id)!;
    expect([ch.label, ch.amount]).toEqual(['הזמנת מטבח (2 מנות)', 210]);
    expect(booking().charges.filter((c) => c.mealId === meal.id)).toHaveLength(1);
    expect(s().setHostMealStatus(meal.id, 'prep')).toBe(true);
    expect(booking().charges.some((c) => c.mealId === meal.id)).toBe(true);
    expect(s().setHostMealStatus(meal.id, 'cancelled')).toBe(true);
    expect(booking().charges.some((c) => c.mealId === meal.id)).toBe(false);
    expect(s().setHostMealStatus(meal.id, 'new')).toBe(false); // בוטלה — סופית
    const m2 = s().upsertHostMeal(M({ id: '' })).meal!;
    expect(booking().charges.some((c) => c.mealId === m2.id)).toBe(true);
    as(STAFF);
    expect(s().deleteHostMeal(m2.id)).toBe(false);
    as(ADMIN);
    expect(s().deleteHostRecord(m2.id)).toBe(true); // ארוחה דרך מחיקה-גנרית ⇒ גם החיוב יורד
    expect(booking().charges.some((c) => c.mealId === m2.id)).toBe(false);
  });

  it('ארוחה בלי מנות / שיוך להזמנה שאינה / שבוטלה ⇒ נדחית בלי לצרוך מזהה', () => {
    seed({ hostUnits: [U()], hostRecords: [G()], hostBookings: [B(), B({ id: 'hb2', status: 'cancelled', checkIn: '2026-11-01', checkOut: '2026-11-02' })] });
    const seq = db().seq;
    expect(s().upsertHostMeal(M({ id: '', items: [] })).ok).toBe(false);
    expect(toasts.at(-1)).toBe('בחרו לפחות מנה אחת');
    expect(s().upsertHostMeal(M({ id: '', bookingId: 'ghost' })).ok).toBe(false);
    expect(s().upsertHostMeal(M({ id: '', bookingId: 'hb2' })).ok).toBe(false);
    expect(db().seq).toBe(seq);
  });

  it('🔄 סנכרן הכל — מחושב מול ה-db החי: סועדים ⇐ ההזמנה, טבח-ברירת-מחדל למנה; הודעת המקור', () => {
    seed({
      hostUnits: [U()],
      hostRecords: [G(), D({ defBy: 'hs1' }), ST(), M({ dinerCount: 2, items: [{ name: 'עוף', price: 50, qty: 2, alg: '', by: '' }] })],
      hostBookings: [B({ adults: 4, kids: 2 })],
    });
    const res = s().syncHostKitchen();
    expect(res).toEqual({ meals: 1, dishes: 1 });
    expect(rec('hm1', 'meal').dinerCount).toBe(6);
    expect(rec('hm1', 'meal').items[0]).toMatchObject({ qty: 6, by: 'hs1' });
    expect(booking().charges.find((c) => c.mealId === 'hm1')?.amount).toBe(300);
    expect(toasts.at(-1)).toBe('סונכרן: 1 ארוחות למשתתפים · 1 מנות לטבח');
  });

  it('מחיקת איש-צוות מנקה את כל שיבוציו (כמו המקור) — מכין/מגיש/טבח-מנה/טבח-ברירת-מחדל', () => {
    seed({ hostRecords: [ST(), ST({ id: 'hs2', name: 'דוד' }), D({ defBy: 'hs1' }), M({ cook: 'hs1', server: 'hs2', items: [{ name: 'עוף', price: 50, qty: 2, alg: '', by: 'hs1' }] })] });
    expect(s().deleteHostRecord('hs1')).toBe(true);
    const m = rec('hm1', 'meal');
    expect([m.cook, m.server, m.items[0].by]).toEqual(['', 'hs2', '']);
    expect(rec('hd1', 'dish').defBy).toBe('');
  });

  it('תוכנית-הושבה: f מוחל על התוכנית החיה (לא תצלום) — שתי קריאות רצופות מצטברות', () => {
    seed({ hostRecords: [M()] });
    expect(s().updateHostSeatPlan('hm1', (sp) => seatAddTable(sp, { cap: 8 }))).toBe(true);
    expect(s().updateHostSeatPlan('hm1', (sp) => seatAddPerson(sp, 'שרה'))).toBe(true);
    const sp = rec('hm1', 'meal').seatPlan;
    expect(sp.tables).toHaveLength(1);
    expect(sp.people.map((p) => p.name)).toEqual(['שרה']);
    expect(s().updateHostSeatPlan('ghost', (x) => x)).toBe(false);
  });

  it('מערך-שולחן: שם קיים ⇒ עדכון כמות, חדש ⇒ הוספה (tsAddItem); מערך מוכן בכתיבה אחת', () => {
    seed({ hostRecords: [{ id: 'ti1', kind: 'tableItem', name: 'צלחת', perGuest: 1, createdAt: AT, updatedAt: AT }] });
    expect(s().setHostTableItems([{ name: 'צלחת', perGuest: 2 }, { name: 'כוס', perGuest: 2 }, { name: 'כוס', perGuest: 3 }])).toBe(true);
    const items = db().hostRecords.filter((r) => r.kind === 'tableItem');
    expect(items.map((r) => (r.kind === 'tableItem' ? [r.id === 'ti1', r.name, r.perGuest] : null))).toEqual([
      [true, 'צלחת', 2],
      [false, 'כוס', 3],
    ]);
    expect(s().setHostTableItems([{ name: ' ', perGuest: 1 }])).toBe(false);
  });

  it('רשומות-טופס: הודעות-החובה של המקור; ארוחה/תקלה/ניקיון/טמפ׳ לא נשמרות בשמירה-הגנרית (רק בפעולות שאוכפות)', () => {
    expect(s().upsertHostRecord(D({ id: '', name: ' ' })).ok).toBe(false);
    expect(toasts.at(-1)).toBe('שם מנה חסר');
    expect(s().upsertHostRecord(ST({ id: '', name: '' })).ok).toBe(false);
    expect(toasts.at(-1)).toBe('שם חסר');
    const d = s().upsertHostRecord(D({ id: '', ingredients: ['עוף · 1', ' ', ''], steps: ['', 'לבשל'] })).record as HostDish;
    expect(d.ingredients).toEqual(['עוף · 1']);
    expect(d.steps).toEqual(['לבשל']);
    const g = s().upsertHostRecord(G({ id: '', name: '' })).record as HostGuest;
    expect(g.name).toBe('—');
    expect(s().upsertHostRecord(M({ id: '' })).ok).toBe(false);
    const fault: HostFault = { id: '', kind: 'fault', unitId: 'hu1', assetId: '', category: 'חשמל', priority: 0, desc: 'x', status: 'open', safety: true, blocked: false, createdAt: '', updatedAt: '' };
    expect(s().upsertHostRecord(fault).ok).toBe(false);
  });
});

/* ═══════════════ (ד) שבת · ניקיון · תחזוקה · טמפ׳ ═══════════════ */

describe('🏡 (ד) שבת, ניקיון, תחזוקה, טמפרטורה', () => {
  it('F9: חבילת שבת — חיוב 250 + הזמנת-מטבח עם הסועדים **מההזמנה**; לחיצה שנייה לא מכפילה (במקור הכפילה)', () => {
    seed({ hostUnits: [U()], hostRecords: [G({ adults: 9, kids: 9 })], hostBookings: [B({ adults: 2, kids: 1 })] });
    expect(s().addHostShabbatPackage('hb1')).toBe(true);
    const seq = db().seq;
    expect(s().addHostShabbatPackage('hb1')).toBe(false);
    expect(toasts.at(-1)).toContain('כבר הופעלה');
    expect(db().seq, 'השער לפני הקצאת-מזהה').toBe(seq);
    const b = booking();
    expect(b.shabbat).toBe(true);
    expect(b.charges.filter((c) => c.kind === 'shabbat').map((c) => [c.label, c.amount])).toEqual([['חבילת שבת', 250]]);
    const meals = db().hostRecords.filter((r): r is HostMeal => r.kind === 'meal');
    expect(meals).toHaveLength(1);
    expect(meals[0].mealName).toBe('חבילת שבת');
    expect(meals[0].dinerCount).toBe(3);
  });

  it('חבילת שבת כשהמטבח כבוי ⇒ חיוב בלבד (כמו המקור); הזמנה שבוטלה/הושלמה ⇒ נדחה', () => {
    seed({ hostUnits: [U()], hostRecords: [G()], hostBookings: [B(), B({ id: 'hb2', status: 'cancelled', checkIn: '2026-11-01', checkOut: '2026-11-02' })] });
    as(ADMIN, { features: { 'hosting.kitchen': false } });
    expect(s().addHostShabbatPackage('hb1')).toBe(true);
    expect(db().hostRecords.some((r) => r.kind === 'meal')).toBe(false);
    expect(s().addHostShabbatPackage('hb2')).toBe(false);
  });

  it('F10: סיום משימה משחרר יחידה רק כשאין לה משימה פתוחה נוספת (במקור כל סיום שחרר); F11: "🧹 נקייה" סוגר את משימת-העזיבה', () => {
    seed({
      hostUnits: [U({ status: 'dirty' }), U({ id: 'hu2', status: 'dirty' })],
      hostRecords: [
        { id: 'hk1', kind: 'clean', unitId: 'hu1', type: 'החלפת מצעים', status: 'open', date: '2026-10-12', createdAt: AT, updatedAt: AT },
        { id: 'hk2', kind: 'clean', unitId: 'hu1', type: 'ניקיון אחרי עזיבה', status: 'open', date: '2026-10-12', createdAt: AT, updatedAt: AT },
        { id: 'hk3', kind: 'clean', unitId: 'hu2', type: 'ניקיון אחרי עזיבה', status: 'open', date: '2026-10-12', createdAt: AT, updatedAt: AT },
      ],
    });
    expect(s().finishHostCleanTask('hk1')).toEqual({ ok: true, freed: false });
    expect(unit().status).toBe('dirty');
    expect(toasts.at(-1)).toContain('נותרו משימות');
    expect(s().finishHostCleanTask('hk2')).toEqual({ ok: true, freed: true });
    expect(unit().status).toBe('free');
    expect(s().finishHostCleanTask('hk2').ok).toBe(false); // כבר הושלמה
    expect(s().setHostUnitStatus('hu2', 'free')).toBe(true);
    expect(rec('hk3', 'clean').status).toBe('done');
    expect(rec('hk3', 'clean').doneAt).toBeTruthy();
  });

  it('תקלה P0/P1 חוסמת יחידה; P2 לא; קריאה כללית (בלי יחידה) לא חוסמת; ציוד/יחידה לא-קיימים ⇒ ריקים', () => {
    seed({ hostUnits: [U(), U({ id: 'hu2' })] });
    expect(s().addHostFault({ unitId: 'hu1', assetId: 'ghost', category: 'חשמל', priority: 1, desc: 'קצר בלוח', safety: true })).toEqual({ ok: true, blocked: true });
    expect(unit().status).toBe('blocked');
    expect(toasts.at(-1)).toBe('🚨 חירום! היחידה נחסמה');
    expect(s().addHostFault({ unitId: 'hu2', assetId: '', category: 'אחר', priority: 2, desc: '', safety: false }).blocked).toBe(false);
    expect(unit('hu2').status).toBe('free');
    const general = s().addHostFault({ unitId: 'nope', assetId: '', category: 'גז', priority: 0, desc: 'ריח גז במטבח', safety: true });
    expect(general.blocked).toBe(false);
    const faults = db().hostRecords.filter((r): r is HostFault => r.kind === 'fault');
    expect(faults.map((f) => [f.unitId, f.assetId, f.desc])).toEqual([
      ['hu1', '', 'קצר בלוח'],
      ['hu2', '', 'תקלה'],
      ['', '', 'ריח גז במטבח'],
    ]);
  });

  it('F13: סגירת קריאה לא משחררת יחידה שעוד עומדת עליה קריאת-חירום אחרת (במקור שחררה); האחרונה משחררת; שחרור-ידני גובר', () => {
    seed({ hostUnits: [U()] });
    s().addHostFault({ unitId: 'hu1', assetId: '', category: 'גז', priority: 0, desc: 'דליפת גז', safety: true });
    s().addHostFault({ unitId: 'hu1', assetId: '', category: 'חשמל', priority: 1, desc: 'קצר', safety: true });
    const [f1, f2] = db().hostRecords.filter((r): r is HostFault => r.kind === 'fault');
    expect(s().advanceHostFault(f1.id)).toBe(true); // ⇒ בטיפול
    expect(s().advanceHostFault(f1.id)).toBe(true); // ⇒ טופלה
    expect(unit().status).toBe('blocked');
    expect(toasts.at(-1)).toContain('נשארת חסומה');
    expect(rec(f1.id, 'fault').blocked).toBe(false);
    s().advanceHostFault(f2.id);
    s().advanceHostFault(f2.id);
    expect(unit().status).toBe('free');
    expect(s().advanceHostFault(f2.id)).toBe(false); // טופלה — סופית
    s().addHostFault({ unitId: 'hu1', assetId: '', category: 'מים', priority: 0, desc: 'הצפה', safety: true });
    s().addHostFault({ unitId: 'hu1', assetId: '', category: 'מים', priority: 1, desc: 'נזילה', safety: false });
    const f3 = db().hostRecords.filter((r): r is HostFault => r.kind === 'fault').at(-2)!;
    expect(s().releaseHostFaultUnit(f3.id)).toBe(true);
    expect(unit().status).toBe('free');
  });

  it('F7: חריגת-טמפרטורה ⇒ קריאה **כללית** P1 בטיחותית שלא חוסמת יחידה (במקור — על "היחידה הראשונה"); צוות-תחזוקה כבוי ⇒ רק רישום', () => {
    seed({ hostUnits: [U()] });
    expect(s().addHostTempReading('מקרר', 4)).toEqual({ ok: true, breach: false });
    expect(toasts.at(-1)).toBe('נרשם ✓');
    expect(s().addHostTempReading('מקפיא', -10)).toEqual({ ok: true, breach: true });
    const f = db().hostRecords.find((r): r is HostFault => r.kind === 'fault')!;
    expect([f.unitId, f.priority, f.safety, f.blocked, f.desc]).toEqual(['', 1, true, false, 'חריגת טמפרטורה במקפיא (-10°)']);
    expect(unit().status).toBe('free');
    const log = db().hostRecords.filter((r) => r.kind === 'temp');
    expect(log).toHaveLength(2);
    expect(log[0].kind === 'temp' && log[0].at).toMatch(/^\d{4}-\d{2}-\d{2}T/); // חותמת מלאה (במקור — תאריך בלבד)
    as(ADMIN, { features: { 'hosting.maint': false } });
    s().addHostTempReading('חימום', 40);
    expect(db().hostRecords.filter((r) => r.kind === 'fault')).toHaveLength(1);
    expect(toasts.at(-1)).toBe('⚠ חריגה!');
    expect(s().addHostTempReading('תנור', 40).ok).toBe(false);
    expect(s().addHostTempReading('מקרר', Number.NaN).ok).toBe(false);
  });

  it('מחיקת ציוד (יכולת חדשה) — קריאות ותוכניות שהצביעו אליו מתנתקות', () => {
    seed({
      hostRecords: [
        { id: 'ha1', kind: 'asset', name: 'דוד שמש', category: 'חימום/דוד', unitId: '', crit: 'גבוה', next: '', createdAt: AT, updatedAt: AT },
        { id: 'hp1', kind: 'plan', task: 'ניקוי אבנית', assetId: 'ha1', freq: 'שנתי', due: '', createdAt: AT, updatedAt: AT },
      ],
    });
    expect(s().deleteHostRecord('ha1')).toBe(true);
    expect(rec('hp1', 'plan').assetId).toBe('');
  });

  it('מצב-שבת וזמנים — פתוחים לצוות (כמו המקור) ומחוטאים; הגדרות — רק דרך setHostingPrefs ולשדות-ההגדרות בלבד', () => {
    as(STAFF);
    s().setHostShabbat({ mode: 'shabbat', candle: '17:42', havdalah: 'לא-שעה', level: 'מהדרין' });
    expect(db().ui.hosting?.shabbat).toEqual({ mode: 'shabbat', candle: '17:42', level: 'מהדרין' });
    s().setHostShabbat({ mode: undefined });
    expect(db().ui.hosting?.shabbat?.mode).toBeUndefined();
    as(ADMIN);
    expect(s().setHostingPrefs({ shopGot: { x: true } })).toBe(false); // לא שדה-הגדרות
    expect(s().setHostingPrefs({ businessName: 'א'.repeat(80), checkin: '25:99', familyTerm: true })).toBe(true);
    expect(db().ui.hosting?.businessName).toHaveLength(60);
    expect(db().ui.hosting?.checkin).toBeUndefined();
    expect(db().ui.hosting?.familyTerm).toBe(true);
    // המונח משתנה גם בהודעות-ה-store
    seed({ hostUnits: [U()], hostRecords: [G()], hostBookings: [B()], ui: { ...emptyDb().ui, hosting: { familyTerm: true } } });
    s().deleteHostRecord('hg1');
    expect(toasts.at(-1)).toContain('משפחה מתארחת');
  });
});

/* ═══════════════ (ד) שחזור · איפוס · מזהים ═══════════════ */

describe('🏡 (ד) שחזור, איפוס, מזהים', () => {
  it('שחזור — מחליף את נתוני-המודול בלבד (מרופא; מה שנגרע מקבל מצבה); איפוס — המודול בלבד, שאר אורביט לא זז', () => {
    seed({ hostUnits: [U(), U({ id: 'hu9' })], orgName: 'עמותת חסד' });
    const families = db().families;
    expect(s().restoreHosting({ units: [U({ status: 'weird' as never }), 'junk' as never], bookings: [], records: [G()], prefs: { taxPct: 999, businessName: 'צימרי הגליל' } })).toBe(true);
    expect(db().hostUnits.map((u) => [u.id, u.status])).toEqual([['hu1', 'free']]);
    expect(db().ui.hosting).toEqual({ businessName: 'צימרי הגליל' });
    expect((db().delLog ?? []).some((d) => d.id === 'hu9')).toBe(true);
    expect(s().resetHosting()).toBe(true);
    expect([db().hostUnits.length, db().hostBookings.length, db().hostRecords.length]).toEqual([0, 0, 0]);
    expect(db().ui.hosting).toEqual({});
    expect(db().orgName).toBe('עמותת חסד');
    expect(db().families).toBe(families);
  });

  it('מזהה חדש לא מתנגש ברשומה קיימת (שחזור-אחרי-איפוס) ולא במזהה בעל-מצבה', () => {
    const seq = db().seq;
    const clash = makeId('hr', seq, deviceTag());
    const tomb = makeId('hr', seq + 1, deviceTag());
    seed({ hostRecords: [G({ id: clash })] });
    useApp.setState((st) => ({ db: { ...st.db, seq, delLog: [{ at: AT, col: 'hostRecords', id: tomb }] } }));
    const g = s().upsertHostRecord(G({ id: '', name: 'משפחת לוי' })).record!;
    expect(g.id).not.toBe(clash);
    expect(g.id).not.toBe(tomb);
    expect(rec(clash, 'guest').name).toBe('משפחת כהן'); // לא נדרס
  });
});

/* ═══════════════ (א) בידוד — התנהגותי ═══════════════ */

describe('🏡 (א) בידוד — זרימה מלאה לא נוגעת במוני-הקבלות, בתורמים, בלוח-הראשי ובחדרי-החוגים', () => {
  it('כל הפעולות יחד: receiptSeq/donationSeq/shopReceiptSeq לא זזים; supporters/events/rooms/enrollments באותה הפניה', () => {
    seed({ receiptSeq: 41, donationSeq: 17, shopReceiptSeq: 9 });
    const before = db();
    const st = s();
    const u = st.upsertHostUnit({ ...U(), id: '' }).unit!;
    st.addHostRoom(u.id, { name: 'חדר הורים', beds: 2, rate: 300 });
    const g = st.upsertHostRecord(G({ id: '' })).record!;
    const b = st.upsertHostBooking(B({ id: '', unitId: u.id, guestId: g.id, roomIds: [unit(u.id).subRooms[0].id] })).booking!;
    st.setHostBookingStatus(b.id, 'confirmed');
    st.setHostBookingStatus(b.id, 'in');
    const meal = st.upsertHostMeal(M({ id: '', bookingId: b.id })).meal!;
    st.syncHostKitchen();
    st.addHostShabbatPackage(b.id);
    st.addHostPayment(b.id, { amount: 1000, note: 'אשראי' });
    st.setHostBookingStatus(b.id, 'done');
    st.addHostFault({ unitId: u.id, assetId: '', category: 'חשמל', priority: 0, desc: 'קצר', safety: true });
    st.addHostTempReading('מקרר', 9);
    st.setHostingPrefs({ taxPct: 18 });
    st.setHostShabbat({ mode: 'prep' });
    st.setHostMealStatus(meal.id, 'cancelled');
    st.deleteHostBooking(b.id);
    st.resetHosting();
    const after = db();
    expect(after.receiptSeq).toBe(41);
    expect(after.donationSeq).toBe(17);
    expect(after.shopReceiptSeq).toBe(9);
    expect(after.supporters).toBe(before.supporters);
    expect(after.events).toBe(before.events);
    expect(after.rooms).toBe(before.rooms);
    expect(after.enrollments).toBe(before.enrollments);
    expect(after.families).toBe(before.families);
  });
});
