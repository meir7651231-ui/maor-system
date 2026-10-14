/**
 * 🧬 מנועים וחלקים — היכולות שנוצרו (ATOMS, 14.10.2026): אימות מול הכרטיסים האמיתיים, הוספה/הסרה, תוויות.
 *
 * יכולת = חלק קטן + מקום במנוע מאותו סוג + הפרטים שנבחרו (contract.ts `Capability`). נשמרת ב-`db.ui.capabilities`.
 * כאן: האימות המלא בזמן-השימוש (ה-store טוען את הקובץ ב-import() — הבנדל-הראשי מכיר רק את `capShape.ts`).
 * טהור: בלי React/store/DOM/שעון.
 */
import type { Db } from '../../types/domain';
import { capabilityId, type AtomCard, type AtomId, type Capability, type EngineId } from './contract';
import { atomCard } from './cards';
import { engineCard, placeById } from './engines';
import { MAX_CAPABILITIES } from './capShape';
import { childId, childProblem, childrenOf, parseCapId } from './chain';

export const CAP_NAME_MAX = 60;

/** שם קצר לחלק — לשורת-הלוג ולכרטיס. */
export const ATOM_SHORT: Readonly<Record<AtomId, string>> = {
  divide: 'חלוקה',
  merge: 'חיבור צמודים',
  next: 'הבא בתור',
  round: 'עיגול',
  offset: 'הזזת זמן',
  escalate: 'העברה הלאה',
  rotate: 'תורות',
  fuzzy: 'חיפוש עם טעויות',
};

/** שם קצר למקום (שם-המקום בכרטיס ארוך ומסביר; כאן — שתיים-שלוש מילים). חסר ⇒ שם-המקום בלי הסוגריים. */
const PLACE_SHORT: Readonly<Record<string, string>> = {
  'bookings.turnover': 'חלון הניקיון',
  'bookings.day': 'יום העבודה',
  'bookings.stay': 'השהייה',
  'bookings.balance': 'היתרה',
  'bookings.total': 'המחיר הכולל',
  'bookings.untilArrival': 'הזמן עד ההגעה',
  'bookings.nights': 'הלילות',
  'bookings.guestStays': 'הזמנות האורח',
  'bookings.unitStays': 'הזמנות היחידה',
  'bookings.sacredDays': 'שבתות וחגים',
  'bookings.unitFaults': 'תקלות היחידה',
  'bookings.arrivals': 'ההגעות',
  'bookings.cleaning': 'משימות הניקיון',
  'bookings.faults': 'התקלות',
  'bookings.unpaid': 'היתרות הפתוחות',
  'bookings.guests': 'שמות האורחים',
};

/** השם שהארגז מציע ליכולת החדשה ("מנוע תורים"). חסר ⇒ "מנוע <חלק> · <מקום>". */
const SUGGESTED: Readonly<Record<string, string>> = {
  'bookings.turnover:divide': 'מנוע תורים',
  'bookings.day:divide': 'מנוע תורי קבלה',
  'bookings.stay:divide': 'מנוע ניקיון באמצע שהייה',
  'bookings.balance:divide': 'מנוע תשלומים',
  'bookings.balance:round': 'מנוע יתרה עגולה',
  'bookings.total:divide': 'מנוע מחיר לאדם',
  'bookings.total:round': 'מנוע מחיר עגול',
  'bookings.untilArrival:divide': 'מנוע תזכורות עד ההגעה',
  'bookings.nights:merge': 'מנוע לילות פנויים צמודים',
  'bookings.nights:next': 'מנוע הלילה הפנוי הבא',
  'bookings.arrivals:next': 'מנוע ההגעה הבאה',
  'bookings.arrivals:offset': 'מנוע תזכורות הגעה',
  'bookings.arrivals:round': 'מנוע שעת הגעה עגולה',
  'bookings.cleaning:escalate': 'מנוע העברת ניקיון',
  'bookings.cleaning:rotate': 'מנוע תורנות ניקיון',
  'bookings.faults:escalate': 'מנוע העברת תקלות',
  'bookings.faults:rotate': 'מנוע תורנות תחזוקה',
  'bookings.unpaid:escalate': 'מנוע מעקב גבייה',
  'bookings.unpaid:rotate': 'מנוע תורנות גבייה',
};

export function placeShort(placeId: string): string {
  const s = PLACE_SHORT[placeId];
  if (s) return s;
  const p = placeById(placeId);
  return p ? p.name.replace(/\s*\(.*\)\s*$/, '') : placeId;
}

export function suggestedName(place: string, atom: AtomId | string): string {
  return SUGGESTED[place + ':' + atom] ?? 'מנוע ' + (ATOM_SHORT[atom as AtomId] ?? atom) + ' · ' + placeShort(place);
}

/** CHAIN 14.10: שם למנוע שבנוי על מנוע (מקום-השורש:חלק>חלק…). חסר ⇒ "<שם ההורה> · <חלק>". */
const SUGGESTED_CHAIN: Readonly<Record<string, string>> = {
  'bookings.turnover:divide>merge': 'מנוע תורים באורך משתנה',
  'bookings.turnover:divide>next': 'מנוע התור הבא',
  'bookings.turnover:divide>rotate': 'מנוע תורים לפי תורות',
  'bookings.nights:merge>next': 'מנוע החלון הפנוי הבא',
  'bookings.nights:merge>divide': 'מנוע חלוקה הוגנת של הזמן הפנוי',
  'bookings.nights:merge>rotate': 'מנוע חלונות פנויים לפי תורות',
  'bookings.arrivals:next>offset': 'מנוע תזכורת להגעה הבאה',
};

export function suggestedChildName(parent: Pick<Capability, 'id' | 'name'>, atom: AtomId | string): string {
  const p = parseCapId(childId(parent.id, atom));
  const key = p ? p.place + ':' + p.atoms.join('>') : '';
  return SUGGESTED_CHAIN[key] ?? parent.name + ' · ' + (ATOM_SHORT[atom as AtomId] ?? atom);
}

/** "מנוע תורים (מנהל ההזמנות · חלון הניקיון · ✂️ חלוקה)" — לשורת-הלוג. */
export function capabilityLabel(c: Pick<Capability, 'engine' | 'place' | 'atom' | 'name'> & { id?: string; parent?: string }): string {
  const e = engineCard(c.engine);
  // CHAIN 14.10: מנוע שבנוי על מנוע ⇒ כל הדרך: "(מנהל ההזמנות · חלון הניקיון · ✂️ ← 🔗)"
  const chain = c.parent ? parseCapId(c.id) : null;
  if (chain) return c.name + ' (' + (e?.name ?? c.engine) + ' · ' + placeShort(chain.place) + ' · ' + chain.atoms.map((x) => atomCard(x)?.emoji ?? x).join(' ← ') + ')';
  const a = atomCard(c.atom);
  return c.name + ' (' + (e?.name ?? c.engine) + ' · ' + placeShort(c.place) + ' · ' + (a ? a.emoji + ' ' : '') + (ATOM_SHORT[c.atom] ?? c.atom) + ')';
}

const fin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** הפרטים של החלק, מנוקים: מספר ⇒ סופי ובטווח (אחרת ברירת-המחדל) · בחירה ⇒ מהרשימה · מפתח זר ⇒ יורד. */
export function cleanParams(atom: AtomCard, raw: unknown): Record<string, number | string> {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out: Record<string, number | string> = {};
  for (const d of atom.details) {
    const v = Object.prototype.hasOwnProperty.call(src, d.id) ? src[d.id] : undefined;
    if (d.type === 'choice') {
      out[d.id] = typeof v === 'string' && d.choices?.some((c) => c.id === v) ? v : d.default;
    } else {
      const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
      out[d.id] = fin(n) && (d.min === undefined || n >= d.min) && (d.max === undefined || n <= d.max) ? n : d.default;
    }
  }
  return out;
}

/** יכולת תקינה מול הכרטיסים (מנוע · מקום במנוע · חלק שיש לו משפט-תוצאה במקום ומאותו סוג), מנורמלת; אחרת null. */
export function validCapability(x: unknown): Capability | null {
  if (!x || typeof x !== 'object') return null;
  const c = x as Partial<Capability>;
  if (typeof c.engine !== 'string' || typeof c.place !== 'string' || typeof c.atom !== 'string') return null;
  // CHAIN 14.10: מנוע שבנוי על מנוע — כאן רק הצורה שלו (המזהה נגזר מההורה); ההורה עצמו נבדק בשימוש (chain.ts)
  if (c.parent !== undefined) return validChild(c);
  const e = engineCard(c.engine);
  const p = placeById(c.place);
  const a = atomCard(c.atom);
  if (!e || !p || !a || p.engine !== e.id || !p.results[a.id] || !a.worksOn.includes(p.kind)) return null;
  const name = (typeof c.name === 'string' ? c.name.trim() : '').slice(0, CAP_NAME_MAX) || suggestedName(p.id, a.id);
  return { id: capabilityId(e.id, p.id, a.id), engine: e.id as EngineId, place: p.id, atom: a.id, params: cleanParams(a, c.params), name };
}

function validChild(c: Partial<Capability>): Capability | null {
  const a = atomCard(String(c.atom));
  const parent = typeof c.parent === 'string' ? c.parent : '';
  const p = parseCapId(childId(parent, String(c.atom)));
  const e = engineCard(String(c.engine));
  if (!a || !p || !e || p.engine !== e.id || p.atoms.length < 2 || (c.place !== 'out:' + parent && c.place !== 'out:' + parent + '#span')) return null;
  const name = (typeof c.name === 'string' ? c.name.trim() : '').slice(0, CAP_NAME_MAX) || 'מנוע ' + ATOM_SHORT[a.id];
  return { id: childId(parent, a.id), engine: e.id as EngineId, place: c.place, atom: a.id, params: cleanParams(a, c.params), name, parent };
}

/** רשימה שמורה ⇒ רק יכולות תקינות, בלי כפילויות (הראשונה נשארת), עד התקרה. */
export function sanitizeCapabilities(list: unknown): Capability[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: Capability[] = [];
  for (const x of list) {
    const c = validCapability(x);
    if (!c || seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
    if (out.length >= MAX_CAPABILITIES) break;
  }
  return out;
}

const sameCap = (a: Capability, b: Capability): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * הוספה (או עדכון — אותו מנוע+מקום+חלק = אותה יכולת, הפרטים/השם מתעדכנים). לא-תקינה / זהה לקיימת / תקרה ⇒ null.
 * מחזיר גם את היכולת המנורמלת (לשורת-הלוג).
 */
export function withCapability(list: unknown, x: unknown): { list: Capability[]; cap: Capability; updated: boolean } | null {
  const cap = validCapability(x);
  if (!cap) return null;
  const cur = sanitizeCapabilities(list);
  // CHAIN 14.10: מנוע שבנוי על מנוע — ההורה קיים ותקין, עד 3 דורות, והחלק מתחבר לפלט שלו
  if (cap.parent && childProblem(cap, cur)) return null;
  const i = cur.findIndex((c) => c.id === cap.id);
  if (i >= 0) {
    if (sameCap(cur[i], cap)) return null;
    const next = cur.slice();
    next[i] = cap;
    return { list: next, cap, updated: true };
  }
  if (cur.length >= MAX_CAPABILITIES) return null;
  return { list: [...cur, cap], cap, updated: false };
}

/** הסרה לפי מזהה; לא קיימת ⇒ null. */
export function withoutCapability(list: unknown, id: string): { list: Capability[]; cap: Capability } | null {
  const cur = sanitizeCapabilities(list);
  const cap = cur.find((c) => c.id === id);
  // CHAIN 14.10: מנוע שיש מנוע שבנוי עליו לא מוסר (בלי הסרה-בשרשרת שקטה) — קודם מסירים את מה שבנוי עליו
  if (cap && childrenOf(id, cur).length) return null;
  return cap ? { list: cur.filter((c) => c.id !== id), cap } : null;
}

/**
 * התיקון ל-db.ui של יצירה (`on`, יכולת) או הסרה (`!on`, {id}) — נקרא מ-createCapability/removeCapability ב-store אחרי בדיקת-ההרשאה.
 * מחזיר את הרשימה החדשה ואת שורת-הלוג ("מנוע חדש" · "עדכון מנוע" · "הסרת מנוע"); לא-תקינה / זהה / לא-קיימת ⇒ null.
 */
export function capUiChange(
  ui: Pick<Db['ui'], 'capabilities'>,
  arg: Capability | { id: string },
  on: boolean,
): { patch: Pick<Db['ui'], 'capabilities'>; act: string; what: string } | null {
  const r = on ? withCapability(ui.capabilities, arg) : withoutCapability(ui.capabilities, String((arg as { id?: unknown })?.id ?? ''));
  if (!r) return null;
  return { patch: { capabilities: r.list }, act: !on ? 'הסרת מנוע' : 'updated' in r && r.updated ? 'עדכון מנוע' : 'מנוע חדש', what: capabilityLabel(r.cap) };
}
