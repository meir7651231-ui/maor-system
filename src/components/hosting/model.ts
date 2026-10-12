/**
 * 🏡 אירוח משפחתי — המודל: קבועי-ה-enum וריפוי-הרשומות (BUILD-ORDER-HOSTING-2026-10-12, אשכול 2).
 *
 * קטן ותלוי-domain-בלבד במכוון: נטען מ-store/persist.ts (migrate) ומ-lib/cloud-merge.ts (המיזוג-החי) —
 * שניהם בבנדל-הראשי. המנוע (זמינות/תמחור/יומן/מטבח/הושבה/דוחות) — ב-lib.ts וחבריו, בצ'אנק-העצל.
 *
 * עיקרון-הריפוי (כמו שאר ה-DB ופרנסה׳לע): רשומה תקינה חוזרת **באותה הפניה** (ביט-זהה — אין לולאת-הד בסנכרון,
 * אין כתיבה-חוזרת לענן); רק שדה שבור מתוקן:
 *   · מערך מקונן חסר/לא-מערך ⇒ [] · איבר לא-אובייקט בתוכו ⇒ נזרק · איבר בלי מזהה ⇒ מזהה-מקומי יציב.
 *   · enum שמשמש מפתח-לוקאפ (סטטוס/סוג/צורה/עדיפות) זר ⇒ ברירת-מחדל בטוחה; שאר המחרוזות (סוג-יחידה,
 *     תפקיד, קטגוריה) נשמרות כמות-שהן — רשימות-הבחירה הן הצעה, לא אכיפה (כמו במקור).
 *   · מספר לא-סופי / שלילי ⇒ ברירת-מחדל · שדה-טקסט חסר ⇒ '' · מפתח לא-מוכר **נשמר** (תאימות-קדימה).
 *   · רשומה מסוג (kind) לא-מוכר-אך-מחרוזת נשמרת כמות-שהיא (גרסה חדשה הוסיפה סוג); kind חסר ⇒ נזרקת.
 * בידוד (הכרעה 2): אין כאן — ולא יהיה — שום נגיעה בקבלות/תרומות/מונים/לוח-ראשי/חדרי-החוגים.
 */
import type { Db, HostBooking, HostingPrefs, HostRecord, HostUnit } from '../../types/domain';

/** סוגי-יחידה (בורר-הטופס; ערך אחר נשמר). */
export const HOST_UNIT_TYPES = ['צימר', 'דירה', 'וילה', 'בית הארחה', 'מתחם'] as const;
export const HOST_UNIT_STATUSES = ['free', 'dirty', 'blocked'] as const;
export const HOST_BOOKING_STATUSES = ['pending', 'confirmed', 'in', 'done', 'cancelled'] as const;
export const HOST_CHARGE_KINDS = ['stay', 'cleaning', 'tax', 'meal', 'shabbat', 'extra'] as const;
export const HOST_RECORD_KINDS = ['guest', 'clean', 'meal', 'dish', 'staff', 'supply', 'tableItem', 'temp', 'fault', 'asset', 'plan'] as const;
/** שרשרת-המטבח (סדר משמעותי) + בוטל. */
export const HOST_MEAL_CHAIN = ['new', 'prep', 'qc', 'ready', 'served'] as const;
export const HOST_MEAL_STATUSES = ['new', 'prep', 'qc', 'ready', 'served', 'cancelled'] as const;
export const HOST_TABLE_SHAPES = ['round', 'rect', 'square'] as const;
export const HOST_FAULT_STATUSES = ['open', 'inprogress', 'done'] as const;
export const HOST_SHABBAT_MODES = ['off', 'prep', 'shabbat', 'motzash'] as const;

/** ברירות-המחדל של האפליקציה המקורית (emptyDB().org). */
export const HOST_DEFAULTS = { checkin: '15:00', checkout: '11:00', cleaningFee: 150, taxPct: 17, orderLeadDays: 2 } as const;

/** תקרות-אורך להגדרות. */
export const HOST_PREFS_CAPS = { businessName: 60, level: 60, mashgiach: 80, emoji: 12, shopKeys: 2000 } as const;

/** שלושת אוספי-המודול (ב-ENTITY_COLLECTIONS / BACKUP_COLLECTIONS). */
export const HOST_COLLECTIONS = ['hostUnits', 'hostBookings', 'hostRecords'] as const;
export type HostCol = (typeof HOST_COLLECTIONS)[number];

/* ---------- עזרי-ריפוי ---------- */

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => !!v && typeof v === 'object' && !Array.isArray(v);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const inList = (list: readonly string[], v: unknown): boolean => typeof v === 'string' && list.includes(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function fixStrings(o: Rec, p: Rec, keys: readonly string[]): void {
  for (const k of keys) if (typeof o[k] !== 'string') p[k] = '';
}
function fixBools(o: Rec, p: Rec, keys: readonly string[], dflt: boolean): void {
  for (const k of keys) if (typeof o[k] !== 'boolean') p[k] = dflt;
}
/** מספר סופי ≥ min (שלם אם int) — אחרת ברירת-המחדל. */
function fixNums(o: Rec, p: Rec, keys: readonly string[], dflt: number, min = 0, int = false): void {
  for (const k of keys) {
    const v = o[k];
    if (!finite(v) || v < min || (int && !Number.isInteger(v))) p[k] = finite(v) && v >= min ? Math.round(v) : dflt;
  }
}
function fixIsoOrEmpty(o: Rec, p: Rec, keys: readonly string[]): void {
  for (const k of keys) {
    const v = o[k];
    if (!(v === '' || (typeof v === 'string' && ISO_DATE_RE.test(v)))) p[k] = '';
  }
}
function fixStrList(o: Rec, p: Rec, k: string): void {
  const v = o[k];
  if (!Array.isArray(v)) p[k] = [];
  else if (v.some((x) => typeof x !== 'string')) p[k] = v.filter((x) => typeof x === 'string');
}
/** רשימת-אובייקטים: לא-מערך ⇒ []; איבר לא-אובייקט נזרק; כל איבר עובר healItem(איבר, אינדקס) (אותה הפניה = תקין). */
function fixObjList(o: Rec, p: Rec, k: string, healItem?: (x: Rec, i: number) => Rec): void {
  const v = o[k];
  if (!Array.isArray(v)) {
    p[k] = [];
    return;
  }
  let changed = false;
  const out: Rec[] = [];
  v.forEach((x, i) => {
    if (!isObj(x)) {
      changed = true;
      return;
    }
    const h = healItem ? healItem(x, i) : x;
    if (h !== x) changed = true;
    out.push(h);
  });
  if (changed) p[k] = out;
}
/** מזהה: קיים ⇒ true; חסר ⇒ fallback (אם ניתן) ⇒ true; אחרת false (הרשומה נזרקת). */
function ensureId(o: Rec, p: Rec, fallbackId: string): boolean {
  if (typeof o.id === 'string' && o.id) return true;
  if (!fallbackId) return false;
  p.id = fallbackId;
  return true;
}
/** אותה הפניה כשאין תיקון; אחרת עותק עם התיקונים בלבד. */
function done<T>(o: Rec, p: Rec): T {
  return (Object.keys(p).length ? { ...o, ...p } : o) as unknown as T;
}
/** ריפוי-איבר עם מזהה-מקומי (חדר/חיוב/תשלום/משתתף/שולחן): מזהה חסר ⇒ prefix+אינדקס. */
function subItem(prefix: string, heal: (x: Rec, p: Rec) => void): (x: Rec, i: number) => Rec {
  return (x, i) => {
    const p: Rec = {};
    if (!(typeof x.id === 'string' && x.id)) p.id = prefix + 'x' + i;
    heal(x, p);
    return done<Rec>(x, p);
  };
}

/* ---------- ריפוי פר-ישות ---------- */

const healRoom = subItem('r', (x, p) => {
  fixStrings(x, p, ['name']);
  fixNums(x, p, ['beds'], 0, 0, true);
  fixNums(x, p, ['rate'], 0);
});

/** יחידה: status זר ⇒ free; מספרים לא-תקינים ⇒ 0; subRooms ⇒ מערך חדרים תקין. */
export function healHostUnit(raw: unknown, fallbackId = ''): HostUnit | null {
  if (!isObj(raw)) return null;
  const p: Rec = {};
  if (!ensureId(raw, p, fallbackId)) return null;
  fixStrings(raw, p, ['name', 'type', 'createdAt', 'updatedAt']);
  fixNums(raw, p, ['beds', 'cap'], 0, 0, true);
  fixNums(raw, p, ['rate'], 0);
  if (!inList(HOST_UNIT_STATUSES, raw.status)) p.status = 'free';
  fixObjList(raw, p, 'subRooms', healRoom);
  return done<HostUnit>(raw, p);
}

const healCharge = subItem('c', (x, p) => {
  if (!inList(HOST_CHARGE_KINDS, x.kind)) p.kind = 'extra';
  fixStrings(x, p, ['label']);
  if (!finite(x.amount)) p.amount = 0;
});
const healPayment = subItem('p', (x, p) => {
  if (!finite(x.amount)) p.amount = 0;
  fixIsoOrEmpty(x, p, ['date']);
  fixStrings(x, p, ['note']);
});

/** הזמנה: status זר ⇒ pending (חוסם-זמינות — בטוח מול overbooking); תאריך לא-ISO ⇒ ''; חיובים/תשלומים ⇒ תקינים. */
export function healHostBooking(raw: unknown, fallbackId = ''): HostBooking | null {
  if (!isObj(raw)) return null;
  const p: Rec = {};
  if (!ensureId(raw, p, fallbackId)) return null;
  fixStrings(raw, p, ['guestId', 'unitId', 'notes', 'createdAt', 'updatedAt']);
  fixIsoOrEmpty(raw, p, ['checkIn', 'checkOut']);
  fixNums(raw, p, ['adults', 'kids'], 0, 0, true);
  if (!inList(HOST_BOOKING_STATUSES, raw.status)) p.status = 'pending';
  fixStrList(raw, p, 'roomIds');
  fixObjList(raw, p, 'charges', healCharge);
  fixObjList(raw, p, 'payments', healPayment);
  fixBools(raw, p, ['shabbat'], false);
  return done<HostBooking>(raw, p);
}

const healDiner = (x: Rec): Rec => {
  const p: Rec = {};
  fixStrings(x, p, ['guestId']);
  fixNums(x, p, ['adults', 'kids'], 0, 0, true);
  return done<Rec>(x, p);
};
const healItem = (x: Rec): Rec => {
  const p: Rec = {};
  fixStrings(x, p, ['name', 'alg', 'by']);
  fixNums(x, p, ['price'], 0);
  if (!finite(x.qty) || x.qty <= 0) p.qty = 1;
  return done<Rec>(x, p);
};
const healPerson = subItem('sp', (x, p) => {
  fixStrings(x, p, ['name']);
});
const healTable = subItem('st', (x, p) => {
  fixStrings(x, p, ['name', 'chair', 'note']);
  if (!finite(x.cap) || x.cap < 1) p.cap = 8;
  else if (!Number.isInteger(x.cap)) p.cap = Math.round(x.cap);
  if (!inList(HOST_TABLE_SHAPES, x.shape)) p.shape = 'round';
  fixStrList(x, p, 'seated');
  fixBools(x, p, ['head'], false);
});
function healSeatPlan(v: unknown): Rec | null {
  if (!isObj(v)) return { people: [], tables: [] };
  const p: Rec = {};
  fixObjList(v, p, 'people', healPerson);
  fixObjList(v, p, 'tables', healTable);
  return Object.keys(p).length ? { ...v, ...p } : null;
}

/** ריפוי-שדות פר-סוג (הרשומה כבר אובייקט עם מזהה ו-kind מוכר). */
const KIND_HEAL: Record<string, (o: Rec, p: Rec) => void> = {
  guest: (o, p) => {
    fixStrings(o, p, ['name', 'phone', 'email', 'notes']);
    fixNums(o, p, ['adults', 'kids'], 0, 0, true);
  },
  clean: (o, p) => {
    fixStrings(o, p, ['unitId', 'type']);
    if (o.status !== 'open' && o.status !== 'done') p.status = 'open';
    fixIsoOrEmpty(o, p, ['date']);
  },
  meal: (o, p) => {
    fixStrings(o, p, ['mealName', 'bookingId', 'unitId', 'guestId', 'time', 'cook', 'server', 'clearer', 'tableSetter', 'allergens', 'notes']);
    fixIsoOrEmpty(o, p, ['date']);
    fixNums(o, p, ['dinerCount'], 0, 0, true);
    if (!inList(HOST_MEAL_STATUSES, o.status)) p.status = 'new';
    fixObjList(o, p, 'diners', healDiner);
    fixObjList(o, p, 'items', healItem);
    const sp = healSeatPlan(o.seatPlan);
    if (sp) p.seatPlan = sp;
  },
  dish: (o, p) => {
    fixStrings(o, p, ['name', 'type', 'allergens', 'prepTime', 'cookTime', 'cookTemp', 'notes', 'defBy']);
    fixNums(o, p, ['price'], 0);
    if (!finite(o.baseServings) || o.baseServings < 1) p.baseServings = 4;
    fixStrList(o, p, 'ingredients');
    fixStrList(o, p, 'steps');
  },
  staff: (o, p) => fixStrings(o, p, ['name', 'role', 'phone']),
  supply: (o, p) => {
    fixStrings(o, p, ['name', 'cat', 'qty']);
    fixBools(o, p, ['bought'], false);
  },
  tableItem: (o, p) => {
    fixStrings(o, p, ['name']);
    fixNums(o, p, ['perGuest'], 0);
  },
  temp: (o, p) => {
    fixStrings(o, p, ['device', 'at']);
    if (!finite(o.temp)) p.temp = 0;
    fixBools(o, p, ['ok'], false);
  },
  fault: (o, p) => {
    fixStrings(o, p, ['unitId', 'assetId', 'category', 'desc']);
    if (!(finite(o.priority) && Number.isInteger(o.priority) && o.priority >= 0 && o.priority <= 4)) p.priority = 3;
    if (!inList(HOST_FAULT_STATUSES, o.status)) p.status = 'open';
    fixBools(o, p, ['safety', 'blocked'], false);
  },
  asset: (o, p) => {
    fixStrings(o, p, ['name', 'category', 'unitId', 'crit']);
    fixIsoOrEmpty(o, p, ['next']);
  },
  plan: (o, p) => {
    fixStrings(o, p, ['task', 'assetId', 'freq']);
    fixIsoOrEmpty(o, p, ['due']);
  },
};

/** רשומה נלווית: kind חסר ⇒ נזרקת; kind לא-מוכר ⇒ נשמרת כמות-שהיא (תאימות-קדימה); מוכר ⇒ ריפוי-שדות. */
export function healHostRecord(raw: unknown, fallbackId = ''): HostRecord | null {
  if (!isObj(raw)) return null;
  if (typeof raw.kind !== 'string' || !raw.kind) return null;
  const p: Rec = {};
  if (!ensureId(raw, p, fallbackId)) return null;
  const heal = KIND_HEAL[raw.kind];
  if (heal) {
    fixStrings(raw, p, ['createdAt', 'updatedAt']);
    heal(raw, p);
  }
  return done<HostRecord>(raw, p);
}

const HEALERS = { hostUnits: healHostUnit, hostBookings: healHostBooking, hostRecords: healHostRecord } as const;
const FALLBACK_PREFIX: Readonly<Record<HostCol, string>> = { hostUnits: 'hux', hostBookings: 'hbx', hostRecords: 'hrx' };

/** ריפוי-אוסף (migrate): איבר לא-תקין נזרק; מזהה חסר ⇒ `<prefix>x<i>`; אוסף תקין ⇒ **אותו מערך** (ביט-זהה). */
export function healHostCollection<C extends HostCol>(col: C, list: readonly unknown[]): Db[C] {
  const heal = HEALERS[col] as (raw: unknown, fallbackId?: string) => unknown;
  let changed = false;
  const out: unknown[] = [];
  list.forEach((x, i) => {
    const h = heal(x, FALLBACK_PREFIX[col] + i);
    if (h !== x) changed = true;
    if (h) out.push(h);
  });
  return (changed ? out : list) as Db[C];
}

/** ריפוי-רשומה בודדת למיזוג-החי (cloud-merge) — המזהה = מזהה-המסמך. אוסף זר / רשומה לא-ניתנת-לריפוי ⇒ כמות-שהיא. */
export function healHostDoc(col: string, item: Record<string, unknown>): Record<string, unknown> {
  if (!(HOST_COLLECTIONS as readonly string[]).includes(col)) return item;
  const heal = HEALERS[col as HostCol] as (raw: unknown, fallbackId?: string) => unknown;
  const h = heal(item, typeof item.id === 'string' ? item.id : '');
  return (h ?? item) as Record<string, unknown>;
}

/* ---------- ריפוי-הגדרות (db.ui.hosting) ---------- */

/**
 * מחרוזות נחתכות לתקרה; מפתח-ידוע לא-תקין **נמחק** (= ברירת-מחדל); שעות HH:MM; מספרים בטווח;
 * עגלת-הקניות: got = רק true, אמוג׳י = מחרוזת קצרה; מפתח לא-מוכר נשמר. תקין ⇒ אותה הפניה; לא-אובייקט ⇒ {}.
 */
export function healHostingPrefs(raw: unknown): HostingPrefs {
  if (!isObj(raw)) return {};
  const out: Rec = { ...raw };
  let changed = false;
  const drop = (o: Rec, k: string): boolean => {
    if (!(k in o)) return false;
    delete o[k];
    return true;
  };
  const capText = (o: Rec, k: string, cap: number): boolean => {
    const v = o[k];
    if (v === undefined) return false;
    if (typeof v !== 'string') return drop(o, k);
    if (v.length > cap) {
      o[k] = v.slice(0, cap);
      return true;
    }
    return false;
  };
  const range = (o: Rec, k: string, min: number, max: number, int = false): boolean => {
    const v = o[k];
    if (v === undefined) return false;
    if (!finite(v) || v < min || v > max) return drop(o, k);
    if (int && !Number.isInteger(v)) {
      o[k] = Math.round(v);
      return true;
    }
    return false;
  };
  changed = capText(out, 'businessName', HOST_PREFS_CAPS.businessName) || changed;
  for (const k of ['checkin', 'checkout']) if (out[k] !== undefined && !(typeof out[k] === 'string' && HM_RE.test(out[k] as string))) changed = drop(out, k) || changed;
  changed = range(out, 'cleaningFee', 0, 1e6) || changed;
  changed = range(out, 'taxPct', 0, 100) || changed;
  changed = range(out, 'orderLeadDays', 0, 60, true) || changed;
  if (out.familyTerm !== undefined && typeof out.familyTerm !== 'boolean') changed = drop(out, 'familyTerm') || changed;
  if (out.shabbat !== undefined) {
    if (!isObj(out.shabbat)) changed = drop(out, 'shabbat') || changed;
    else {
      const s: Rec = { ...out.shabbat };
      let sc = false;
      if (s.mode !== undefined && !inList(HOST_SHABBAT_MODES, s.mode)) sc = drop(s, 'mode') || sc;
      for (const k of ['candle', 'havdalah']) if (s[k] !== undefined && !(s[k] === '' || (typeof s[k] === 'string' && HM_RE.test(s[k] as string)))) sc = drop(s, k) || sc;
      sc = capText(s, 'level', HOST_PREFS_CAPS.level) || sc;
      sc = capText(s, 'mashgiach', HOST_PREFS_CAPS.mashgiach) || sc;
      if (sc) {
        out.shabbat = s;
        changed = true;
      }
    }
  }
  for (const [k, ok] of [
    ['shopGot', (v: unknown) => v === true],
    ['shopEmoji', (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= HOST_PREFS_CAPS.emoji],
  ] as const) {
    const m = out[k];
    if (m === undefined) continue;
    if (!isObj(m)) {
      changed = drop(out, k) || changed;
      continue;
    }
    const entries = Object.entries(m);
    if (entries.some(([, v]) => !ok(v)) || entries.length > HOST_PREFS_CAPS.shopKeys) {
      out[k] = Object.fromEntries(entries.filter(([, v]) => ok(v)).slice(0, HOST_PREFS_CAPS.shopKeys));
      changed = true;
    }
  }
  return (changed ? out : raw) as HostingPrefs;
}
