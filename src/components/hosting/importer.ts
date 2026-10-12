/**
 * 🏡 אירוח משפחתי — גיבוי ושחזור של המודול (BUILD-ORDER-HOSTING-2026-10-12, אשכול 3).
 *
 * שני פורמטים נכנסים, אחד יוצא:
 *  · יוצא/נכנס — גיבוי-המודול של אורביט: `{ format: 'orbit-hosting', v: 1, hostUnits, hostBookings, hostRecords, prefs }`.
 *  · נכנס — **גיבוי האפליקציה המקורית** (`hosp_pms_v1`: org/units/guests/reservations/tasks/menu/korders/staff/
 *    supplies/tableset/templog/assets/mreq/pm/shabbat/flags/ui) ⇒ ממופה לשלושת האוספים — מסלול-המעבר של הבעלים
 *    (אפס אובדן נתונים). כולל ריפוי-הקידוד של המקור (`deMoji`): מחרוזות שנשמרו כשהקובץ נפתח ב-Windows-1255
 *    ומתהפכות ל-UTF-8 תקין — מתוקנות; עברית לגיטימית נכשלת בהיפוך ⇒ לא נוגעים בה.
 * כל רשומה עוברת את ריפוי-המודל (model.ts) לפני שהיא נכנסת. טהור — "עכשיו" מוזרק.
 */
import type { HostBooking, HostCharge, HostingPrefs, HostRecord, HostUnit } from '../../types/domain';
import { healHostCollection, healHostingPrefs } from './model';

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => !!v && typeof v === 'object' && !Array.isArray(v);
const arr = (v: unknown): Rec[] => (Array.isArray(v) ? v.filter(isObj) : []);
const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
const num = (v: unknown, d = 0): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : d;
};

/* ═══════════════ ריפוי-קידוד (deMoji של המקור) ═══════════════ */

let cp1255: Map<number, number> | null = null;
function cp1255Rev(): Map<number, number> {
  if (cp1255) return cp1255;
  const m = new Map<number, number>();
  try {
    const dec = new TextDecoder('windows-1255');
    for (let b = 128; b < 256; b++) {
      const ch = dec.decode(new Uint8Array([b]));
      if (ch && ch.length === 1) {
        const cc = ch.charCodeAt(0);
        if (cc >= 128 && !m.has(cc)) m.set(cc, b);
      }
    }
  } catch {
    /* אין מפענח windows-1255 — אין ריפוי (המחרוזת חוזרת כמות-שהיא) */
  }
  cp1255 = m;
  return m;
}

/** מחרוזת שנפגעה מקידוד Windows-1255 ⇒ ה-UTF-8 המקורי; כל מחרוזת אחרת — ללא שינוי (`deMoji`). */
export function deMoji(s: string): string {
  if (!s) return s;
  let hi = false;
  for (let i = 0; i < s.length && !hi; i++) hi = s.charCodeAt(i) > 127;
  if (!hi) return s;
  const map = cp1255Rev();
  const bytes: number[] = [];
  for (const ch of Array.from(s)) {
    const cc = ch.codePointAt(0)!;
    if (cc < 128) bytes.push(cc);
    else if (map.has(cc)) bytes.push(map.get(cc)!);
    else return s;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return s;
  }
}

/** ריפוי-קידוד עמוק (מחזיר מבנה חדש — המקור לא משתנה). */
export function deMojiDeep<T>(o: T): T {
  if (typeof o === 'string') return deMoji(o) as unknown as T;
  if (Array.isArray(o)) return o.map((x) => deMojiDeep(x)) as unknown as T;
  if (isObj(o)) {
    const out: Rec = {};
    for (const [k, v] of Object.entries(o)) out[k] = deMojiDeep(v);
    return out as T;
  }
  return o;
}

/* ═══════════════ גיבוי-המודול ═══════════════ */

export interface HostingBackup {
  format: 'orbit-hosting';
  v: 1;
  exportedAt: string;
  hostUnits: HostUnit[];
  hostBookings: HostBooking[];
  hostRecords: HostRecord[];
  prefs: HostingPrefs;
}

/** "⬇️ גיבוי כל הנתונים (JSON)" — נתוני-המודול בלבד (לא כל אורביט). */
export function moduleBackupOf(d: { hostUnits: HostUnit[]; hostBookings: HostBooking[]; hostRecords: HostRecord[]; prefs?: HostingPrefs }, nowIso: string): HostingBackup {
  return { format: 'orbit-hosting', v: 1, exportedAt: nowIso, hostUnits: d.hostUnits, hostBookings: d.hostBookings, hostRecords: d.hostRecords, prefs: d.prefs ?? {} };
}

export interface HostingImport {
  units: HostUnit[];
  bookings: HostBooking[];
  records: HostRecord[];
  prefs: HostingPrefs;
  /** מאיפה הגיע הקובץ. */
  source: 'orbit' | 'app';
  /** דגלי-צוות שהיו כבויים באפליקציה המקורית (להדלקה/כיבוי מקבילים באשף). */
  flagsOff: string[];
}

/* ═══════════════ מיפוי האפליקציה המקורית ═══════════════ */

const DEFAULT_APP_NAME = 'אירוח משפחתי';

function mapCharges(raw: unknown): HostCharge[] {
  const used = new Set<string>();
  return arr(raw).map((c, i) => {
    const label = str(c.label);
    const ko = str(c.ko);
    let kind: HostCharge['kind'] = 'extra';
    let id = 'c' + (i + 1);
    if (ko) {
      kind = 'meal';
      id = 'meal:' + ko;
    } else if (label.startsWith('לינה')) {
      kind = 'stay';
      id = 'stay';
    } else if (label === 'דמי ניקיון') {
      kind = 'cleaning';
      id = 'cleaning';
    } else if (label.startsWith('מע״מ') || label.startsWith('מע"מ')) {
      kind = 'tax';
      id = 'tax';
    } else if (label === 'חבילת שבת') {
      kind = 'shabbat';
      id = 'shabbat';
    }
    if (used.has(id)) id = 'c' + (i + 1) + 'x';
    used.add(id);
    const out: HostCharge = { id, kind, label, amount: num(c.amount) };
    if (ko) out.mealId = ko;
    return out;
  });
}

/**
 * גיבוי האפליקציה המקורית ⇒ שלושת האוספים + ההגדרות. כל מזהה-מקור נשמר (uid() של המקור ייחודי בין כל הישויות),
 * ולכן הקישורים (אורח↔הזמנה↔ארוחה↔מנה↔צוות) נשמרים בלי טבלת-המרה.
 */
export function importAppBackup(rawIn: Rec, nowIso: string): HostingImport {
  const raw = deMojiDeep(rawIn);
  const at = { createdAt: nowIso, updatedAt: nowIso };
  const guests = arr(raw.guests);
  const guestById = new Map(guests.map((g) => [str(g.id), g] as const));
  const menu = arr(raw.menu);
  const dishIdByName = new Map(menu.map((m) => [str(m.name), str(m.id)] as const));

  const units = arr(raw.units).map((u) => ({
    id: str(u.id),
    name: str(u.name),
    type: str(u.type) || 'צימר',
    beds: num(u.beds),
    cap: num(u.cap),
    rate: num(u.rate),
    status: u.status === 'dirty' || u.status === 'blocked' ? u.status : 'free',
    subRooms: arr(u.rooms).map((r) => ({ id: str(r.id), name: str(r.name), beds: num(r.beds), rate: num(r.rate) })),
    ...at,
  }));

  const bookings = arr(raw.reservations).map((r) => ({
    id: str(r.id),
    guestId: str(r.guest),
    unitId: str(r.unit),
    roomIds: Array.isArray(r.rooms) ? r.rooms.map(str) : [],
    checkIn: str(r.in),
    checkOut: str(r.out),
    adults: num(r.adults),
    kids: num(r.kids),
    status: str(r.status),
    charges: mapCharges(r.charges),
    payments: arr(r.payments).map((p, i) => ({ id: 'p' + (i + 1), amount: num(p.amount), date: str(p.date), note: str(p.note) })),
    notes: str(r.notes),
    shabbat: r.shabbat === true,
    ...at,
  }));

  const records: Rec[] = [];
  for (const g of guests) records.push({ id: str(g.id), kind: 'guest', name: str(g.name), phone: str(g.phone), email: str(g.email), adults: num(g.adults), kids: num(g.kids), notes: str(g.notes), ...at });
  for (const t of arr(raw.tasks)) records.push({ id: str(t.id), kind: 'clean', unitId: str(t.unit), type: str(t.type) || str(t.title) || 'ניקיון', status: t.status === 'done' ? 'done' : 'open', date: str(t.created), ...at });
  for (const m of menu) {
    records.push({
      id: str(m.id),
      kind: 'dish',
      name: str(m.name),
      type: str(m.type) || 'בשרי',
      price: num(m.price),
      allergens: str(m.allergens),
      prepTime: str(m.prepTime),
      cookTime: str(m.cookTime),
      cookTemp: str(m.cookTemp),
      baseServings: num(m.baseServings, 4) || 4,
      ingredients: Array.isArray(m.ingredients) ? m.ingredients.map(str) : [],
      steps: Array.isArray(m.steps) ? m.steps.map(str) : [],
      notes: str(m.notes),
      defBy: str(m.defBy),
      ...at,
    });
  }
  for (const o of arr(raw.korders)) {
    const diners = (Array.isArray(o.dinerGuests) ? o.dinerGuests : []).map((x) => {
      const e = typeof x === 'string' ? { gid: x } : isObj(x) ? x : {};
      const gid = str(e.gid);
      const g = guestById.get(gid) ?? {};
      return { guestId: gid, adults: e.adults != null ? num(e.adults) : num(g.adults), kids: e.kids != null ? num(e.kids) : num(g.kids) };
    });
    const sp = isObj(o.seatPlan) ? o.seatPlan : {};
    records.push({
      id: str(o.id),
      kind: 'meal',
      mealName: str(o.mealName),
      bookingId: str(o.res),
      unitId: str(o.unit),
      guestId: str(o.guest),
      diners,
      dinerCount: num(o.diners),
      date: str(o.date),
      time: str(o.time),
      cook: str(o.assignee),
      server: str(o.server),
      clearer: str(o.clearer),
      tableSetter: str(o.tableSetter),
      items: arr(o.items).map((it) => {
        const item: Rec = { name: str(it.name), price: num(it.price), qty: num(it.qty, 1) || 1, alg: str(it.alg), by: str(it.by) };
        const did = dishIdByName.get(str(it.name));
        if (did) item.dishId = did;
        return item;
      }),
      status: str(o.status),
      allergens: str(o.allergens),
      notes: str(o.notes),
      seatPlan: {
        people: arr(sp.people).map((p) => {
          const out: Rec = { id: str(p.id), name: str(p.name) };
          if (p.kind === 'adult' || p.kind === 'kid') out.kind = p.kind;
          if (p.gid) out.guestId = str(p.gid);
          return out;
        }),
        tables: arr(sp.tables).map((t) => ({
          id: str(t.id),
          name: str(t.name),
          cap: num(t.cap, 8),
          shape: str(t.shape) || 'round',
          chair: str(t.chair) || 'כיסא',
          seated: Array.isArray(t.seated) ? t.seated.map(str) : [],
          head: t.head === true,
          note: str(t.note),
        })),
      },
      ...at,
    });
  }
  for (const s of arr(raw.staff)) records.push({ id: str(s.id), kind: 'staff', name: str(s.name), role: str(s.role), phone: str(s.phone), ...at });
  for (const s of arr(raw.supplies)) records.push({ id: str(s.id), kind: 'supply', name: str(s.name), cat: str(s.cat) || 'אחר', qty: str(s.qty), bought: s.bought === true, ...at });
  for (const t of arr(raw.tableset)) records.push({ id: str(t.id), kind: 'tableItem', name: str(t.name), perGuest: num(t.perGuest), ...at });
  for (const t of arr(raw.templog)) records.push({ id: str(t.id), kind: 'temp', device: str(t.device), temp: num(t.temp), ok: t.ok === true, at: str(t.at), ...at });
  for (const a of arr(raw.assets)) records.push({ id: str(a.id), kind: 'asset', name: str(a.name), category: str(a.category), unitId: str(a.unit), crit: str(a.crit) || 'רגיל', next: str(a.next), ...at });
  for (const r of arr(raw.mreq)) {
    records.push({ id: str(r.id), kind: 'fault', unitId: str(r.unit), assetId: str(r.asset), category: str(r.category), priority: num(r.priority, 3), desc: str(r.desc), status: str(r.status), safety: r.safety === true, blocked: r.blocked === true, ...at });
  }
  for (const p of arr(raw.pm)) records.push({ id: str(p.id), kind: 'plan', task: str(p.task), assetId: str(p.asset), freq: str(p.freq), due: str(p.due), ...at });

  const org = isObj(raw.org) ? raw.org : {};
  const sb = isObj(raw.shabbat) ? raw.shabbat : {};
  const ui = isObj(raw.ui) ? raw.ui : {};
  const prefsRaw: Rec = {
    checkin: str(org.checkin) || undefined,
    checkout: str(org.checkout) || undefined,
    cleaningFee: org.cleaningFee != null ? num(org.cleaningFee) : undefined,
    taxPct: org.taxPct != null ? num(org.taxPct) : undefined,
    orderLeadDays: org.orderLeadDays != null ? num(org.orderLeadDays) : undefined,
    familyTerm: org.familyTerm === true ? true : undefined,
    shabbat: { mode: str(sb.mode) || undefined, candle: str(sb.candle), havdalah: str(sb.havdalah), level: str(sb.level), mashgiach: str(sb.mashgiach) },
    shopGot: isObj(ui.shopGot) ? ui.shopGot : undefined,
    shopEmoji: isObj(ui.shopEmoji) ? ui.shopEmoji : undefined,
  };
  const bizName = str(org.name).trim();
  if (bizName && bizName !== DEFAULT_APP_NAME) prefsRaw.businessName = bizName;
  for (const k of Object.keys(prefsRaw)) if (prefsRaw[k] === undefined) delete prefsRaw[k];
  const sh = prefsRaw.shabbat as Rec;
  for (const k of Object.keys(sh)) if (sh[k] === undefined) delete sh[k];

  const flags = isObj(raw.flags) ? raw.flags : {};
  const flagsOff = (['kitchen', 'shabbat', 'maint'] as const).filter((k) => flags[k] === false).map((k) => 'hosting.' + k);

  return {
    units: healHostCollection('hostUnits', units),
    bookings: healHostCollection('hostBookings', bookings),
    records: healHostCollection('hostRecords', records),
    prefs: healHostingPrefs(prefsRaw),
    source: 'app',
    flagsOff,
  };
}

/** זיהוי+פענוח קובץ-שחזור: גיבוי-המודול של אורביט, או גיבוי האפליקציה המקורית; אחרת שגיאה ברורה. */
export function parseHostingBackup(raw: unknown, nowIso: string): { ok: true; data: HostingImport } | { ok: false; error: string } {
  if (!isObj(raw)) return { ok: false, error: 'קובץ לא תקין' };
  if (raw.format === 'orbit-hosting') {
    if (!Array.isArray(raw.hostUnits) || !Array.isArray(raw.hostBookings) || !Array.isArray(raw.hostRecords)) return { ok: false, error: 'קובץ גיבוי פגום — חסרים אוספים' };
    return {
      ok: true,
      data: {
        units: healHostCollection('hostUnits', raw.hostUnits),
        bookings: healHostCollection('hostBookings', raw.hostBookings),
        records: healHostCollection('hostRecords', raw.hostRecords),
        prefs: healHostingPrefs(raw.prefs ?? {}),
        source: 'orbit',
        flagsOff: [],
      },
    };
  }
  if (isObj(raw.org) && Array.isArray(raw.units)) return { ok: true, data: importAppBackup(raw, nowIso) };
  return { ok: false, error: 'קובץ לא תקין — לא גיבוי של האירוח' };
}
