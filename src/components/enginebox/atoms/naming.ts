/**
 * 🧬 עזרים טהורים למסך "מנועים וחלקים": שם למנוע החדש, ניקוי הפרטים, בניית היכולת, ו"הסר" בשתי לחיצות.
 * בלי store ובלי DOM — נבדק ביחידה.
 */
import { capabilityId, type AtomCard, type Capability, type Detail, type EngineCard, type Option } from '../../../lib/atoms/contract';

/**
 * טבלת-השמות הקצרה: חלק + מילה בשם-המקום ⇒ שם המנוע החדש.
 * לפי הדוגמה של הבעלים (מנוע ההזמנות + חלוקה). אין התאמה ⇒ "<מנוע> + <חלק>".
 */
export const NAME_RULES: readonly { atom: string; words: readonly string[]; name: string }[] = [
  { atom: 'divide', words: ['שעות', 'פתיחה', 'יום'], name: 'מנוע תורים' },
  { atom: 'divide', words: ['שהייה', 'לילות'], name: 'מנוע ניקיון באמצע' },
  { atom: 'divide', words: ['לתשלום', 'תשלום', 'סכום'], name: 'מנוע תשלומים' },
  { atom: 'divide', words: ['עד ההגעה', 'הגעה'], name: 'מנוע מועדי תשלום' },
  { atom: 'divide', words: ['מחיר'], name: 'מנוע מחיר לאדם' },
  { atom: 'merge', words: ['פנוי', 'לילות', 'רצף'], name: 'מנוע חלונות פנויים' },
  { atom: 'next', words: ['פנוי', 'לילות'], name: 'מנוע הפנוי הבא' },
  { atom: 'rotate', words: [], name: 'מנוע תורנות' },
  { atom: 'escalate', words: [], name: 'מנוע הסלמה' },
];

export function capabilityName(engine: Pick<EngineCard, 'name'>, atom: Pick<AtomCard, 'id' | 'name'>, placeName: string): string {
  for (const r of NAME_RULES) {
    if (r.atom !== atom.id) continue;
    if (r.words.length === 0 || r.words.some((w) => placeName.includes(w))) return r.name;
  }
  return engine.name + ' + ' + atom.name;
}

export type DetailValues = Record<string, number | string>;

export function detailDefaults(details: readonly Detail[]): DetailValues {
  const out: DetailValues = {};
  for (const d of details) out[d.id] = d.default;
  return out;
}

/** ערך-טופס ⇒ ערך נקי: מספר בגבולות (לא-מספר ⇒ ברירת-המחדל), בחירה רק מהרשימה. */
export function cleanParams(details: readonly Detail[], values: DetailValues): Record<string, number | string> {
  const out: Record<string, number | string> = {};
  for (const d of details) {
    const v = values[d.id];
    if (d.type === 'choice') {
      const ok = d.choices?.some((c) => c.id === v);
      out[d.id] = ok ? (v as string) : d.default;
      continue;
    }
    let n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
    if (!Number.isFinite(n)) n = Number(d.default);
    if (d.min !== undefined && n < d.min) n = d.min;
    if (d.max !== undefined && n > d.max) n = d.max;
    out[d.id] = n;
  }
  return out;
}

export function buildCapability(engine: EngineCard, atom: AtomCard, option: Option, values: DetailValues): Capability {
  return {
    id: capabilityId(engine.id, option.place, atom.id),
    engine: engine.id,
    place: option.place,
    atom: atom.id,
    params: cleanParams(atom.details, values),
    name: capabilityName(engine, atom, option.placeName),
  };
}

/** "חבר": בונה את היכולת ומוסר אותה למקור (רק כשמותר לערוך). מחזיר את היכולת, או null כשאין הרשאה. */
export function connectCapability(
  source: { canEdit: boolean; create(c: Capability): void },
  engine: EngineCard,
  atom: AtomCard,
  option: Option,
  values: DetailValues,
): Capability | null {
  if (!source.canEdit) return null;
  const cap = buildCapability(engine, atom, option, values);
  source.create(cap);
  return cap;
}

/** "הסר" בשתי לחיצות (כמו הכפתורים החמושים בפרויקט): לחיצה ראשונה חומשת, שנייה על אותו פריט מסירה. */
export function removeTap(armed: string | null, id: string): { armed: string | null; remove: boolean } {
  return armed === id ? { armed: null, remove: true } : { armed: id, remove: false };
}

/** "מתוך מנוע הזמנים · 7". */
export function fromChip(atom: AtomCard, engines: readonly EngineCard[]): string {
  const e = engines.find((x) => x.id === atom.from.engine);
  return 'מתוך ' + (e ? e.name : atom.from.engine) + ' · ' + atom.from.num;
}
