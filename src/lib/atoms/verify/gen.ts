/**
 * ✅ המאמת · מחוללי-הקלט (ATOMS-VERIFY, 14.10.2026).
 *
 * אקראי **עם זרע** — אותו זרע ⇒ אותם קלטים בדיוק (דטרמיניסטי; בלי Math.random, בלי שעון-המערכת). לכל סוג:
 *  · זמנים סביב מעבר שעון קיץ/חורף בישראל ובסוף חודש/שנה · סכומים עם אגורות · רצפים עם חורים וכפילויות ·
 *    רשימות-המתנה (שלבים ריקים, המתנה 0, דחוף, תשובה) · עברית עם טעויות-הקלדה ותחיליות.
 *  · ארגון שלם (`randomOrgDb`): לוקח את DB-הבדיקה האמיתי ומטלטל אותו — יחידות, הזמנות (עם חיובים ותשלומים באגורות),
 *    ניקיון, תקלות (שבתיאור שלהן שם של אורח!), צוות בכל התפקידים, עסקים ושעות, בקשות (שקטות עם סוד וטלפון), פרסומות,
 *    מיקום-הזמנים (כולל חו״ל ואזור-קוטב) ו"עכשיו" אחר. כל שם פרטי שנוצר נרשם ב-`secrets` — כדי לבדוק שלא דלף.
 */
import type { Db, HostBooking, HostCleanTask, HostFault, HostGuest, HostStaff, HostUnit, PrAd, PrListing, PrRequest } from '../../../types/domain';
import type { AtomId } from '../contract';
import type { AtomInput, InputKind } from './laws';
import { ATOM_INPUTS } from './laws';
import { normHe } from '../parts/fuzzy';
import { levenshtein } from '../../search';

/* ═══════════════ PRNG ═══════════════ */

export interface Rng {
  /** [0,1) */
  next(): number;
  int(lo: number, hi: number): number;
  pick<T>(xs: readonly T[]): T;
  bool(p?: number): boolean;
}

/** mulberry32 — קטן, מהיר, דטרמיניסטי. */
export function rng(seed: number): Rng {
  let a = seed >>> 0 || 0x9e3779b9;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (xs) => xs[Math.floor(next() * xs.length)],
    bool: (p = 0.5) => next() < p,
  };
}

/** זרע-משנה יציב (לכל חלק/DB זרע משלו — הוספת חלק לא משנה את הקלטים של האחרים). */
export function subSeed(seed: number, label: string): number {
  let h = (seed ^ 0x811c9dc5) >>> 0;
  for (let i = 0; i < label.length; i++) h = Math.imul(h ^ label.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/* ═══════════════ זמנים ═══════════════ */

const DAY_MS = 86_400_000;
/** רגעים קשים: מעבר שעון (ישראל 2026: 27.3 קדימה, 25.10 אחורה; 2027: 26.3), סוף חודש, סוף שנה, 29 בפברואר. */
export const HARD_ISO = ['2026-03-27', '2026-10-25', '2027-03-26', '2026-10-31', '2026-12-31', '2027-01-01', '2028-02-29', '2026-02-28', '2026-04-30', '2026-09-30', '2026-10-14'];

export function isoAround(r: Rng): string {
  const base = Date.parse(r.pick(HARD_ISO) + 'T12:00:00Z');
  return new Date(base + r.int(-3, 3) * DAY_MS).toISOString().slice(0, 10);
}

/** רגע (ms) סביב מעבר-שעון / סוף-חודש, בכל דקה ביממה. */
export function momentAround(r: Rng): number {
  return Date.parse(isoAround(r) + 'T00:00:00Z') + r.int(-180, 1440 + 180) * 60_000;
}

/** "YYYY-MM-DD HH:MM" — מסתדר לפי סדר כמו הרגע עצמו. */
const pad = (n: number): string => String(n).padStart(2, '0');
export function wallText(ms: number): string {
  const d = new Date(ms);
  return d.toISOString().slice(0, 10) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
}

/* ═══════════════ סכומים ═══════════════ */

/** סכום באגורות: אפס, קטן, עגול, ענק, שלילי (החזר). */
export function amount(r: Rng): number {
  const kind = r.int(0, 9);
  if (kind === 0) return 0;
  if (kind === 1) return r.int(1, 99) / 100;
  if (kind === 2) return r.int(1, 50) * 100;
  if (kind === 3) return -r.int(1, 99_999) / 100;
  if (kind === 4) return r.int(1, 99_999_999) / 100;
  return r.int(1, 999_999) / 100;
}
export const STEPS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 1, 1, 2, 5, 10, 15, 30, 50, 100] as const;

/* ═══════════════ רצפים ═══════════════ */

/** רצף כן/לא עם גושים, חורים בודדים וקצוות ריקים. */
export function flags(r: Rng, max = 60): boolean[] {
  const n = r.int(0, max);
  const p = r.next();
  const out: boolean[] = [];
  let cur = r.bool();
  for (let i = 0; i < n; i++) {
    if (r.next() < 0.25 + p * 0.5) cur = !cur;
    out.push(cur);
  }
  return out;
}

/* ═══════════════ עברית ═══════════════ */

/** בלי אותיות סופיות (הנרמול הופך אותן) — כדי שמילה ומילה-עם-טעות יושוו על אותה צורה. */
const HE = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');
export const PREFIXES = ['ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ'] as const;
const WORDS = ['מנורה', 'שולחן', 'אינסטלטור', 'חשמלאי', 'נזילה', 'ספרים', 'לחמניה', 'מזגן', 'צבעי', 'שיפוץ', 'כביסה', 'מקרר', 'תריס', 'הובלה', 'מוסך', 'נגריה', 'שמשה', 'גינה', 'מטבח', 'תפילה', 'לחם', 'גשם', 'דלת', 'ברז', 'גגון'];

export function heWord(r: Rng, min = 3, max = 8): string {
  if (r.bool(0.5)) {
    const w = r.pick(WORDS);
    if (w.length >= min && w.length <= max) return w;
  }
  const n = r.int(min, max);
  let s = '';
  for (let i = 0; i < n; i++) s += r.pick(HE);
  return s;
}

/** טעות-הקלדה אחת: החלפה, השמטה או הוספה של אות. */
export function typo(r: Rng, w: string): string {
  const i = r.int(0, w.length - 1);
  const op = r.int(0, 2);
  if (op === 0) {
    let c = r.pick(HE);
    while (c === w[i]) c = r.pick(HE);
    return w.slice(0, i) + c + w.slice(i + 1);
  }
  if (op === 1) return w.slice(0, i) + w.slice(i + 1);
  return w.slice(0, i) + r.pick(HE) + w.slice(i);
}

/** מילה "רחוקה": רק מאותיות שאין במילה ואינן אותיות-שימוש — אין אות משותפת ואין תחילית. */
export function farWord(r: Rng, w: string): string | null {
  const banned = new Set([...w, ...PREFIXES, 'י', 'ו']);
  const pool = HE.filter((c) => !banned.has(c));
  if (pool.length < 3) return null;
  const n = r.int(3, 7);
  let s = '';
  for (let i = 0; i < n; i++) s += r.pick(pool);
  return s;
}

/* ═══════════════ קלטים לחלקים ═══════════════ */

function genInput(r: Rng, kind: InputKind): AtomInput {
  switch (kind) {
    case 'divide.parts': {
      const from = r.pick([0, r.int(0, 1440), r.int(-1000, 1000) / 7, momentAround(r) / 60_000]);
      const len = r.pick([0, r.int(1, 1440), r.int(1, 100_000) / 3, r.next() * 1e-3, 1e6]);
      return { k: kind, from, to: from + len, parts: r.pick([1, 2, 3, 7, 12, 12, 13, r.int(1, 1000), 0, -2, 10_001]) };
    }
    case 'divide.size': {
      const from = r.pick([0, r.int(0, 1440), r.int(-500, 500)]);
      const len = r.pick([0, r.int(1, 1440), r.int(1, 240)]);
      return { k: kind, from, to: from + len, size: r.pick([1, 5, 15, 20, 30, 40, 45, 60, r.int(1, 300)]), gap: r.pick([0, 0, 5, 10, r.int(0, 60)]), remainder: r.pick(['drop', 'shorten'] as const) };
    }
    case 'divide.amount':
      return { k: kind, total: amount(r), parts: r.pick([1, 2, 3, 7, 10, 12, 12, 36, r.int(1, 120), 0, 1001]), step: r.pick(STEPS) };
    case 'divide.points': {
      const from = r.int(0, 600);
      const parts = r.pick([12, 12, 4, 6, 24, r.int(1, 50)]);
      return { k: kind, from, to: from + r.int(0, 900), parts, at: Array.from({ length: r.int(0, 6) }, () => r.pick([0, 3, 4, 6, 9.5, 10.75, parts, r.int(0, parts * 4) / 4])) };
    }
    case 'merge':
      return { k: kind, items: flags(r), maxGap: r.pick([0, 0, 1, 2, r.int(0, 6)]), minLength: r.pick([1, 1, 2, 3, r.int(1, 8)]) };
    case 'next.times': {
      const asText = r.bool(0.4);
      const ms = Array.from({ length: r.int(0, 25) }, () => momentAround(r));
      // כפילויות: אותו רגע פעמיים
      if (ms.length && r.bool(0.5)) ms.push(ms[r.int(0, ms.length - 1)]);
      const now = r.bool(0.3) && ms.length ? ms[r.int(0, ms.length - 1)] : momentAround(r);
      return asText
        ? { k: kind, times: ms.map(wallText), now: wallText(now), count: r.pick([1, 1, 2, 3, 5, 0, 50]) }
        : { k: kind, times: ms.map((x) => Math.floor(x / 60_000)), now: Math.floor(now / 60_000), count: r.pick([1, 1, 2, 3, 5, 0, 50]) };
    }
    case 'next.runs': {
      const f = flags(r, 70);
      return { k: kind, flags: f, minLength: r.pick([1, 1, 2, 3, 5, 7]), fromIndex: r.int(0, Math.max(0, f.length)) };
    }
    case 'round': {
      const step = r.pick(STEPS);
      const onGrid = r.bool(0.3);
      const value = onGrid ? Number((r.int(-2000, 2000) * step).toFixed(6)) : r.pick([amount(r), r.int(0, 1440) + r.next(), r.int(0, 1440)]);
      return { k: kind, value, step, dir: r.pick(['down', 'up', 'nearest'] as const) };
    }
    case 'offset.times':
      return { k: kind, times: Array.from({ length: r.int(0, 12) }, () => r.pick([r.int(0, 1439), Math.floor(momentAround(r) / 60_000)])), minutes: r.pick([-10, -15, 0, 10, r.int(-1440, 1440)]) };
    case 'offset.days':
      return { k: kind, iso: isoAround(r), minute: r.int(0, 1439), days: r.int(-40, 40), minutes: r.int(-2880, 2880) };
    case 'offset.relative': {
      const names = ['sh', 'tz', 'nz', 'שקיעה', 'הנץ', 'ARRIVAL', 'x_y'];
      const anchors: Record<string, number | string | null> = {};
      for (const n of names) if (r.bool(0.7)) anchors[n] = r.pick([r.int(0, 1439), pad(r.int(0, 23)) + ':' + pad(r.int(0, 59)), null, '']);
      return { k: kind, anchors, name: r.pick([...names, 'toString', 'constructor', 'zz']), delta: r.pick([0, 0, -10, 15, r.int(-999, 999)]) };
    }
    case 'escalate': {
      const created = momentAround(r);
      const steps = Array.from({ length: r.int(1, 5) }, (_, k) => ({
        to: r.bool(0.8) ? Array.from({ length: r.int(1, 3) }, (_, m) => 's' + k + '.' + m) : [],
        waitMin: r.pick([0, 15, 60, 180, 180, r.int(1, 600)]),
      }));
      const urgent = r.bool(0.3);
      const urgentWaitMin = r.pick([0, 30, 60, r.int(0, 240)]);
      const span = steps.reduce((a, s) => a + s.waitMin, 0) * 60_000 + 60_000;
      const probes = Array.from({ length: 12 }, () => created + r.int(-60, Math.ceil(span / 60_000) + 60) * 60_000);
      const answeredMs = r.bool(0.3) ? created + r.int(0, Math.ceil(span / 60_000)) * 60_000 : null;
      return { k: kind, input: { createdMs: created, steps, urgent, urgentWaitMin, answeredMs, nowMs: created }, probes };
    }
    case 'rotate':
      return { k: kind, list: Array.from({ length: r.int(0, 9) }, (_, k) => 'p' + k), start: r.pick([0, r.int(-1000, 1000), 20_000 + r.int(0, 400)]), window: r.int(1, 60), items: r.int(0, 40) };
    case 'rotate.days':
      return { k: kind, iso: isoAround(r), days: r.int(1, 40) };
    case 'fuzzy': {
      const target = heWord(r, 3, 9);
      const expect = r.pick(['exact', 'typo', 'prefix', 'far'] as const);
      let query = target;
      let ex: 'exact' | 'typo' | 'prefix' | 'far' = expect;
      // האורכים נמדדים אחרי הנרמול ("זווב" ⇒ "זוב" — 3 אותיות)
      const len = (w: string): number => normHe(w).length;
      if (expect === 'typo') {
        query = typo(r, target);
        // הכלל המתועד: סליחה לטעות רק במילה של 4+ אותיות (גם אחרי הטעות); וטעות אחת = אות אחת **אחרי הנרמול**
        // (השמטת ג מ"נוגופל" ⇒ "נוופל" ⇒ "נופל" — שתי אותיות). אחרת — בדיקה של המילה המדויקת.
        if (len(target) < 4 || len(query) < 4 || levenshtein(normHe(query), normHe(target)) !== 1) {
          query = target;
          ex = 'exact';
        }
      } else if (expect === 'prefix') {
        // תחילית נבדקת על מילה של 3+ אותיות (פחות מזה — הכלל המתועד לא מסיר אותיות-שימוש)
        if (len(target) >= 3) query = r.pick(PREFIXES) + target;
        else ex = 'exact';
      }
      else if (expect === 'far') {
        const f = farWord(r, target);
        if (f) query = f;
        else ex = 'exact';
      }
      const others = Array.from({ length: r.int(0, 5) }, () => ({ id: 'o' + r.int(0, 1e6), text: Array.from({ length: r.int(1, 4) }, () => heWord(r)).join(' ') }));
      const own = { id: 'target', text: [heWord(r), target, heWord(r)].slice(r.int(0, 1), r.int(2, 3)).join(' ') };
      // מועמדים "אחרים" שבמקרה מכילים מילה קרובה — לא מפריעים לחוקים (finds מחפש רק את מי שמכיל, far בודק שאף אחד לא נמצא)
      const cands = ex === 'far' ? [own] : [...others, own];
      return { k: kind, expect: ex, query, target, candidates: cands };
    }
  }
}

/** הקלט ה-i של חלק (מסתובב בין סוגי-הקלט שלו). */
export function atomCase(atom: AtomId, r: Rng, i: number): AtomInput {
  const kinds = ATOM_INPUTS[atom];
  return genInput(r, kinds[i % kinds.length]);
}

/* ═══════════════ ארגון אקראי ═══════════════ */

const AT = '2026-10-01T08:00:00.000Z';
/** שמות-משפחה "פרטיים" — ייחודיים, כדי שחיפוש בפלט לא יתבלבל עם מילה רגילה. */
const SURNAMES = ['קורנבליט', 'שטיינמץ', 'רוזנצווייג', 'גרינבאום', 'פפנהיים', 'וקסלבאום', 'הירשהורן', 'זילברשלג', 'אפפלבאום', 'מנדלבליט', 'טננבאום', 'קירשנבאום'];
const FIRST = ['אהרן', 'בתיה', 'גיטל', 'דבורה', 'זלמן', 'חנה', 'יענקי', 'מירל', 'נחמה', 'פערל'];
const STAFF = ['דנה', 'רבקה', 'יוסי', 'מוישי', 'שרה', 'אליהו'];
const ROLES = ['ניקיון', 'מנקה', 'משק בית', 'תחזוקה', 'טכנאי', 'שיפוצים', 'מנהל', 'גבייה', 'קבלה', 'מטבח', 'אחזקה'];
const UNIT_NAMES = ['צימר האלון', 'סוויטת הים', 'בקתת העץ', 'דירת הגג', 'חדר הגן'];
const CATS = ['build', 'elec', 'car', 'fin', 'tech', 'edu', 'home', 'food', 'other'];
const FAULT_CATS = ['אינסטלציה', 'חשמל', 'מיזוג/קירור', 'גז', 'ריהוט', 'אחר'];
const REQ_WORDS = ['אינסטלטור', 'נזילה', 'חשמלאי', 'קצר', 'מזגן', 'שיפוץ', 'הובלה', 'רואה חשבון', 'מוסך', 'נגר', 'תריס'];
/** מיקומי-זמנים: ברירת-מחדל, ירושלים, לונדון (שעון אירופה), ניו יורק, וסבאלברד (אין שקיעה בחורף — fail-closed). */
const ZMANIM: readonly (Record<string, unknown> | undefined)[] = [
  undefined,
  { city: 'jerusalem' },
  { lat: 51.5, lon: -0.12, tz: 'Europe/London', label: 'לונדון' },
  { lat: 40.71, lon: -74.0, tz: 'America/New_York', label: 'ניו יורק' },
  { lat: 78.2, lon: 15.6, tz: 'Europe/Oslo', label: 'סבאלברד' },
];

/** הסודות של ארגון אקראי: מה אסור שיופיע בשום תצוגה. */
export interface OrgSecrets {
  /** שמות מלאים ושמות-משפחה של אורחים, מבקשים, תורמים ומשפחות. */
  names: string[];
  phones: string[];
  emails: string[];
  /** טקסטים גולמיים של בקשות ומילות-הסוד של בקשות שקטות. */
  texts: string[];
}

const isoAdd = (iso: string, d: number): string => new Date(Date.parse(iso + 'T12:00:00Z') + d * DAY_MS).toISOString().slice(0, 10);
const phone = (r: Rng): string => '05' + r.int(0, 8) + '-' + r.int(1_000_000, 9_999_999);
const money = (r: Rng): number => r.pick([r.int(1, 30) * 100, r.int(1, 999_999) / 100, r.int(100, 5000) + r.pick([0, 0.5, 0.99, 0.01])]);

/**
 * ארגון אקראי שנבנה על DB-הבדיקה האמיתי (`base`): נשמרים ממנו היחידות, העסקים והמבנה, ומעליהם מטלטלים הכול.
 * "עכשיו" נבחר סביב רגע קשה, וההזמנות/הבקשות נבנות סביבו (אחרת חודש אחרי — אין מה להראות).
 */
export function randomOrgDb(base: Db, seed: number): { db: Db; nowMs: number; secrets: OrgSecrets } {
  const r = rng(seed);
  const secrets: OrgSecrets = { names: [], phones: [], emails: [], texts: [] };
  const nowMs = r.bool(0.25) ? Date.parse('2026-10-14T09:00:00Z') + r.int(-48, 48) * 3_600_000 : momentAround(r);
  const today = new Date(nowMs + 3 * 3_600_000).toISOString().slice(0, 10); // בערך היום בישראל — רק לפיזור תאריכים

  // יחידות: של הבסיס, לפעמים בלי חלק, ועוד 0–2 חדשות (עם/בלי חדרים)
  const units: HostUnit[] = base.hostUnits.filter(() => r.bool(0.85)).map((u) => ({ ...u }));
  for (let k = 0, n = r.int(0, 2); k < n; k++) {
    const subRooms = r.bool(0.3) ? [{ id: 'rr' + k, name: 'חדר א', beds: 2, rate: 300 }, { id: 'rs' + k, name: 'חדר ב', beds: 2, rate: 300 }] : [];
    units.push({ ...base.hostUnits[0], id: 'gu' + k, name: r.pick(UNIT_NAMES), subRooms, status: r.pick(['free', 'dirty'] as const) });
  }
  if (r.bool(0.05)) units.length = 0;

  // אורחים עם שמות פרטיים וטלפונים
  const guests: HostGuest[] = Array.from({ length: r.int(1, 5) }, (_, k) => {
    const sur = SURNAMES[(seed + k * 7) % SURNAMES.length];
    const name = r.bool(0.5) ? 'משפחת ' + sur : r.pick(FIRST) + ' ' + sur;
    const ph = phone(r);
    const em = 'guest' + k + '_' + (seed % 997) + '@example.org';
    secrets.names.push(name, sur);
    secrets.phones.push(ph);
    secrets.emails.push(em);
    return { id: 'gg' + k, kind: 'guest', name, phone: ph, email: em, adults: r.int(1, 4), kids: r.int(0, 5), notes: 'אוהבים שקט · ' + sur, createdAt: AT, updatedAt: AT };
  });

  // הזמנות סביב היום: חלקן צמודות, חלקן חופפות-ניסיון, עם חיובים ותשלומים באגורות
  const bookings: HostBooking[] = [];
  const statuses = ['pending', 'confirmed', 'confirmed', 'in', 'done', 'cancelled'] as const;
  for (let k = 0, n = units.length ? r.int(0, 12) : 0; k < n; k++) {
    const u = r.pick(units);
    const prev = bookings.filter((b) => b.unitId === u.id).at(-1);
    const checkIn = prev && r.bool(0.4) ? prev.checkOut : isoAdd(today, r.int(-6, 45));
    const nights = r.int(1, 7);
    const charges = r.bool(0.7) ? [{ id: 'c' + k, kind: 'stay' as const, label: 'לינה', amount: money(r) }, ...(r.bool(0.3) ? [{ id: 'd' + k, kind: 'cleaning' as const, label: 'ניקיון', amount: r.int(50, 300) + 0.5 }] : [])] : [];
    const paidPart = charges.length && r.bool(0.5) ? Math.round(charges[0].amount * r.next() * 100) / 100 : 0;
    bookings.push({
      ...base.hostBookings[0],
      id: 'gb' + k,
      guestId: r.pick(guests).id,
      unitId: u.id,
      roomIds: u.subRooms.length && r.bool(0.5) ? [u.subRooms[0].id] : [],
      checkIn,
      checkOut: isoAdd(checkIn, nights),
      status: r.pick(statuses),
      charges,
      payments: paidPart ? [{ id: 'p' + k, amount: paidPart, date: today, note: 'מזומן' }] : [],
      notes: 'הערה פרטית ' + guests[0].name,
    });
  }

  // תקלות (התיאור מכיל שם אורח — בדיוק מה שאסור להציג), ניקיון, צוות
  const faults: HostFault[] = Array.from({ length: r.int(0, 5) }, (_, k) => ({
    id: 'gf' + k, kind: 'fault', unitId: units.length && r.bool(0.8) ? r.pick(units).id : '', assetId: '', category: r.pick(FAULT_CATS),
    priority: r.int(0, 4), desc: r.bool(0.6) ? r.pick(guests).name + ' דיווחו על תקלה, טלפון ' + r.pick(guests).phone : '', status: r.pick(['open', 'inprogress', 'done'] as const),
    safety: r.bool(0.2), blocked: r.bool(0.3), createdAt: new Date(nowMs - r.int(0, 72 * 60) * 60_000).toISOString(), updatedAt: AT,
  }));
  const cleans: HostCleanTask[] = Array.from({ length: units.length ? r.int(0, 4) : 0 }, (_, k) => ({
    id: 'gc' + k, kind: 'clean', unitId: r.pick(units).id, type: r.pick(['ניקיון אחרי עזיבה', 'ניקיון יומי', '']), status: r.pick(['open', 'open', 'done'] as const),
    date: isoAdd(today, r.int(-3, 2)), createdAt: AT, updatedAt: AT,
  }));
  const staff: HostStaff[] = Array.from({ length: r.int(0, 5) }, (_, k) => ({
    id: 'gs' + k, kind: 'staff', name: r.bool(0.9) ? STAFF[(k + seed) % STAFF.length] : '', role: r.pick(ROLES), phone: phone(r), createdAt: AT, updatedAt: AT,
  }));
  for (const s of staff) secrets.phones.push(s.phone);

  // עסקים: של הבסיס עם שעות מטולטלות, ועוד אחד לפעמים
  const listings: PrListing[] = base.prListings.map((l) => ({
    ...l,
    hours: r.bool(0.6) ? l.hours : Array.from({ length: r.int(0, 4) }, () => {
      const from = r.int(5, 20) * 60 + r.pick([0, 30]);
      const to = Math.min(23 * 60 + 59, from + r.int(1, 10) * 60);
      return { dow: r.int(0, 6), from: pad(Math.floor(from / 60)) + ':' + pad(from % 60), to: pad(Math.floor(to / 60)) + ':' + pad(to % 60) };
    }),
    always: r.bool(0.15),
    status: r.bool(0.9) ? l.status : 'pending',
  }));

  // בקשות: טקסט ממילון-המקצועות עם טעויות/תחיליות; שקטות עם סוד; פרטי-מבקש פרטיים
  const requests: PrRequest[] = Array.from({ length: r.int(0, 6) }, (_, k) => {
    const quiet = r.bool(0.3);
    const sur = SURNAMES[(seed + 3 + k * 5) % SURNAMES.length];
    const who = r.pick(FIRST) + ' ' + sur;
    const ph = phone(r);
    const em = 'req' + k + '@example.net';
    let w = r.pick(REQ_WORDS);
    if (r.bool(0.3)) w = typo(r, w);
    if (r.bool(0.3)) w = r.pick(PREFIXES) + w;
    const text = quiet ? 'סודי ' + sur + ' חוב גדול ' + w + ' טלפון ' + ph : 'צריך ' + w + ' ' + r.pick(['דחוף', 'השבוע', 'מחר', 'בבקשה']) + ' ' + sur;
    secrets.names.push(who, sur);
    secrets.phones.push(ph);
    secrets.emails.push(em);
    secrets.texts.push(text);
    return {
      id: 'gq' + k, text, category: r.pick(CATS), area: '', urgent: r.bool(0.3), quiet, job: r.bool(0.1),
      requester: { name: r.bool(0.5) ? who : em, phone: ph }, status: r.pick(['open', 'open', 'answered', 'closed'] as const),
      responses: r.bool(0.2) ? [{ listingId: '', text: 'אני יכול', at: AT }] : [],
      createdAt: new Date(nowMs - r.int(0, 20 * 60) * 60_000).toISOString(), updatedAt: AT,
    };
  });

  // פרסומות: מחירים עם אגורות, משבצות, תקופות
  const ads: PrAd[] = Array.from({ length: r.int(0, 5) }, (_, k) => ({
    ...(base.prAds[0] ?? ({} as PrAd)),
    id: 'ga' + k, slot: r.pick(['board', 'booklet', 'category'] as const), kind: 'line', target: r.pick(['', 'elec']), advertiser: r.pick(['מאפיית השקד', 'ספרי הלל', 'חנות הכל בשקל', 'גן שושנים']),
    headline: '', body: '', phone: '', from: r.bool(0.3) ? isoAdd(today, r.int(-10, 5)) : '', to: r.bool(0.3) ? isoAdd(today, r.int(-2, 20)) : '',
    price: r.pick([0, money(r), r.int(1, 99) / 100]), paid: r.bool(), paidAt: '', active: r.bool(0.85), createdAt: AT, updatedAt: AT,
  }));

  // תורמים ומשפחות עם שמות פרטיים — התצוגות לא קוראות אותם; הבדיקה מוודאת שזה נשאר כך
  const donors = Array.from({ length: 2 }, (_, k) => {
    const sur = SURNAMES[(seed + 9 + k) % SURNAMES.length];
    secrets.names.push('ר׳ ' + sur);
    return { id: 'gd' + k, name: 'ר׳ ' + sur, phone: phone(r), tz: String(r.int(100_000_000, 999_999_999)) };
  });

  const hm = (m: number): string => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const hosting = r.bool(0.7)
    ? base.ui.hosting
    : { ...base.ui.hosting, checkout: r.pick([hm(r.int(8, 12) * 60), '10:30', '12:00', '25:00', '']), checkin: r.pick([hm(r.int(13, 18) * 60), '14:00', '09:00', 'xx']) };
  const parnasa = { ...base.ui.parnasa, zmanim: r.pick(ZMANIM) };

  const db: Db = {
    ...base,
    savedAt: '2026-10-14T00:00:00.000Z',
    seq: 100,
    hostUnits: units,
    hostBookings: bookings,
    hostRecords: [...guests, ...faults, ...cleans, ...staff],
    prListings: listings,
    prRequests: requests,
    prAds: ads,
    supporters: [...(base.supporters ?? []), ...(donors as never[])],
    families: [...(base.families ?? []), ...(donors.map((d) => ({ ...d, id: 'fm' + d.id })) as never[])],
    ui: { ...base.ui, hosting: hosting as Db['ui']['hosting'], parnasa: parnasa as Db['ui']['parnasa'] },
  };
  return { db, nowMs, secrets };
}

/** פרטים אקראיים לחלק — בתוך הגבולות של הכרטיס (שם הוא נבדק ממילא ב-cleanParams). */
export function randomParams(atom: AtomId, r: Rng): Record<string, number | string> {
  switch (atom) {
    case 'divide':
      return r.bool(0.5)
        ? { by: 'parts', parts: r.pick([1, 2, 3, 4, 7, 12, r.int(1, 30)]) }
        : { by: 'size', size: r.pick([5, 15, 20, 30, 45, 60, r.int(1, 240)]), gap: r.pick([0, 0, 5, 10]), remainder: r.pick(['drop', 'shorten']) };
    case 'merge':
      return { maxGap: r.pick([0, 0, 1, 2]), minLength: r.pick([1, 1, 2, 3, 5]) };
    case 'next':
      return { count: r.pick([1, 1, 2, 3, 5]), minLength: r.pick([1, 1, 2, 3]) };
    case 'round':
      return { step: r.pick([0.01, 0.05, 0.5, 1, 5, 10, 15, 30]), dir: r.pick(['down', 'up', 'nearest']) };
    case 'offset':
      return { minutes: r.pick([-10, -20, -60, 0, 15, r.int(-1440, 1440)]) };
    case 'escalate':
      return { waitMin: r.pick([0, 30, 60, 180, r.int(0, 600)]), urgentWaitMin: r.pick([0, 30, 60, r.int(0, 240)]) };
    case 'rotate':
      return { by: r.pick(['day', 'item']) };
    case 'fuzzy':
      return { maxTypos: r.pick([0, 1]) };
  }
}
