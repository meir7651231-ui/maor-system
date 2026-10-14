/**
 * 🧬 נתוני-דוגמה ללשונית "מנועים וחלקים" — **לבדיקות בלבד** (ratchet: קוד-ייצור לא מייבא).
 * לפי הדוגמה של הבעלים: מנוע ההזמנות + "חלק לשווים" (#7 של מנוע הזמנים).
 */
import { capabilityId, type AtomCard, type Capability, type EngineCard } from '../../../lib/atoms/contract';
import type { AtomChain, AtomPreview, AtomsSource } from '../atoms/seam';

export const A_DIVIDE: AtomCard = {
  id: 'divide', name: 'חלק לשווים', emoji: '✂️', from: { engine: 'zmanim', num: 7 },
  computes: 'מחלק כל שני מספרים לחלקים שווים', worksOn: ['span', 'amount'], question: 'מה לחלק?',
  details: [
    { id: 'parts', label: 'לכמה חלקים?', type: 'number', min: 2, max: 50, default: 4 },
    { id: 'gap', label: 'הפסקה בין חלק לחלק', type: 'minutes', min: 0, default: 10 },
    { id: 'round', label: 'לעגל?', type: 'choice', choices: [{ id: 'none', label: 'בלי' }, { id: 'up', label: 'למעלה' }], default: 'none' },
  ],
};
export const A_MERGE: AtomCard = {
  id: 'merge', name: 'מיזוג רצפים', emoji: '🔗', from: { engine: 'zmanim', num: 13 },
  computes: 'מאחד פריטים צמודים לרצף אחד', worksOn: ['sequence'], question: 'מה למזג?',
  details: [{ id: 'min', label: 'רצף מינימלי', type: 'minutes', min: 0, default: 30 }],
};
export const A_NEXT: AtomCard = {
  id: 'next', name: 'הבא בתור', emoji: '⏭️', from: { engine: 'zmanim', num: 2 },
  computes: 'מוצא את הרגע הבא ברשימה', worksOn: ['times'], question: 'מה הבא?', details: [],
};

export const E_ZMANIM: EngineCard = {
  id: 'zmanim', name: 'מנוע הזמנים', emoji: '🕯️', from: 'פרנסה׳לע', computes: 'זמני היום והשבת',
  parts: [
    { num: 2, name: 'הרגע הבא', computes: 'הזמן הבא ברשימה', atom: 'next' },
    { num: 5, name: 'שקיעה', computes: 'מחשב שקיעה לפי מקום' },
    { num: 7, name: 'חלוקה לשווים', computes: 'שעות זמניות = היום חלקי 12', atom: 'divide' },
    { num: 13, name: 'מיזוג רצפים', computes: 'מאחד ימי חג צמודים', atom: 'merge' },
  ],
  places: [],
};
export const E_NEED: EngineCard = {
  id: 'whatNeed', name: 'מנוע "מה צריך?"', emoji: '🙋', from: 'פרנסה׳לע', computes: 'מתאים בקשה לבעל מקצוע',
  parts: [{ num: 1, name: 'הבנת הבקשה', computes: 'מילים ⇒ תחום' }], places: [],
};
export const E_BOOK: EngineCard = {
  id: 'bookings', name: 'מנוע ההזמנות', emoji: '🛏️', from: 'אירוח משפחתי', computes: 'מי ישן איפה ומתי',
  parts: [{ num: 1, name: 'בדיקת פנוי', computes: 'יחידה פנויה בתאריכים' }],
  places: [
    { id: 'bookings.hours', engine: 'bookings', name: 'שעות הפתיחה של היום', kind: 'span', results: { divide: 'תורים שווים לאורך היום' } },
    { id: 'bookings.nights', engine: 'bookings', name: 'הלילות של כל יחידה', kind: 'sequence', results: { divide: 'לא אמור להופיע', merge: 'רצפי לילות פנויים' } },
    { id: 'bookings.stay', engine: 'bookings', name: 'אורך השהייה', kind: 'span', results: { divide: 'ניקיון באמצע השהייה' } },
    { id: 'bookings.pay', engine: 'bookings', name: 'הסכום לתשלום', kind: 'amount', results: { divide: 'תשלומים שווים' } },
    { id: 'bookings.note', engine: 'bookings', name: 'הערת האורח', kind: 'text', results: {} },
    { id: 'bookings.price', engine: 'bookings', name: 'המחיר הכולל', kind: 'amount', results: { divide: 'מחיר לאדם' } },
  ],
};

export const CHAIN: AtomChain = { atoms: ['divide', 'merge'], name: 'תורים באורך משתנה', result: 'מחלקים את היום ומאחדים תורים צמודים' };

export interface AtomsLog { create: Capability[]; remove: string[] }

export function atomsFixture(opts: { canEdit?: boolean; empty?: boolean; preview?: AtomPreview | null; caps?: Capability[] } = {}): AtomsSource & { log: AtomsLog } {
  const log: AtomsLog = { create: [], remove: [] };
  const caps: Capability[] = [...(opts.caps ?? [])];
  return {
    log,
    canEdit: opts.canEdit ?? true,
    engines: () => (opts.empty ? [] : [E_ZMANIM, E_NEED, E_BOOK]),
    atoms: () => (opts.empty ? [] : [A_DIVIDE, A_MERGE, A_NEXT]),
    capabilities: () => caps,
    preview: () => (opts.preview === undefined ? { title: 'היום במנוע התורים', lines: ['08:00–10:00', '10:10–12:10'] } : opts.preview),
    chains: (id) => (id === 'bookings' ? [CHAIN] : []),
    create: (c) => { log.create.push(c); caps.push(c); },
    remove: (id) => { log.remove.push(id); const i = caps.findIndex((c) => c.id === id); if (i >= 0) caps.splice(i, 1); },
  };
}

export const CAP_QUEUE: Capability = {
  id: capabilityId('bookings', 'bookings.hours', 'divide'), engine: 'bookings', place: 'bookings.hours', atom: 'divide',
  params: { parts: 4, gap: 10, round: 'none' }, name: 'מנוע תורים',
};
