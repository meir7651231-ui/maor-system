/**
 * 🏷️ תווית סטטית (CATALOG-VERBS, 14.10.2026) — לחלקים שאי אפשר להריץ כאן (Dart, Python, מכונה בלי מריץ, לא-טהור, נכשל-בהרצה):
 * מנחשים את הפועל מהשם העברי (המילה הראשונה היא פועל — חוזה הקטלוג; by: first), ממילה אחרת בשם (by: name),
 * ממילות-הקוד של הסמל (by: symbol), ומהחתימה.
 * זו **השערה**, לא מדידה: מסומן `labeledBy: "static"` ונספר בנפרד מ-"run".
 */
import { VERBS } from './verbs.mjs';

const kindSet = (spec) => {
  const out = new Set();
  for (const k of String(spec).split('|')) {
    if (k === 'number' || k === 'amount') { out.add('number'); out.add('amount'); }
    else if (k === 'list' || k === 'sequence') { out.add('list'); out.add('sequence'); }
    else if (k === 'times' || k === 'date') { out.add('times'); out.add('date'); out.add('number'); }
    else if (k === 'choice') { out.add('choice'); out.add('text'); out.add('number'); }
    else out.add(k);
  }
  return out;
};
const kindOk = (set, kind) => set.has('any') || set.has(kind) || (set.has('record') && kind.startsWith('record:')) || kind === 'unknown';

/** מילים ממזהה-קוד: addDaysIso ⇒ add days iso. */
export function codeTokens(sym) {
  return String(sym)
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase().split(/\s+/).filter(Boolean);
}

const GENERIC_EN = new Set(['to', 'of', 'for', 'by', 'is', 'has', 'can', 'all', 'with', 'from', 'get', 'make', 'new', 'list', 'text', 'he', 'as', 'key', 'code', 'first', 'last', 'top', 'open', 'number', 'amount', 'day', 'num', 'size', 'length', 'how', 'many', 'and', 'or', 'add', 'plus', 'parse', 'render', 'display', 'line', 'lines', 'names', 'title', 'label', 'body', 'message', 'msg', 'status', 'type', 'class', 'color', 'index', 'shift', 'record', 'order', 'stamp', 'source', 'ref', 'wait', 'queue', 'safe', 'try', 'guard', 'via', 'deliver', 'bound', 'cap', 'limit', 'level', 'age', 'since', 'until', 'between', 'days', 'rows', 'each', 'with', 'who', 'fair', 'match', 'search', 'find', 'which', 'pick', 'resolve', 'today', 'serial', 'minutes', 'words', 'heb', 'str', 'describe', 'pretty', 'caption', 'empty', 'blank', 'create', 'options', 'presets', 'catalog', 'schema', 'initial', 'default', 'defaults', 'check', 'valid', 'ok', 'within', 'matches', 'allow', 'allowed', 'needs', 'should', 'gate', 'eligible', 'closed', 'lowest', 'highest', 'biggest', 'best', 'peak', 'oldest', 'newest', 'latest', 'earliest', 'recent', 'preview', 'head', 'page', 'slice', 'take', 'only', 'where', 'select', 'active', 'visible', 'pending', 'without', 'exclude', 'keep', 'after', 'before', 'nearest', 'following', 'upcoming', 'move', 'advance', 'delay', 'minus', 'record', 'history', 'trail', 'push', 'append']);

/** הפעלים העבריים: מילה ראשונה של השם ⇒ פועל. בונה מהרמזים של הפעלים + מילון קטן של צורות נפוצות. */
const HE_FIRST = new Map();
for (const v of VERBS) for (const w of v.cues?.he ?? []) if (!w.includes(' ') && !HE_FIRST.has(w)) HE_FIRST.set(w, v.id);
for (const [w, id] of Object.entries({
  ממיין: 'sort', מסדר: 'sort', מסנן: 'filter', סופר: 'count', מונה: 'count', מסכם: 'sum', מחבר: 'combine', מנרמל: 'normalize', מנקה: 'normalize',
  מעגל: 'round', מזיז: 'offset', מוסיף: 'offset', מחלק: 'divide', מפצל: 'split', מצרף: 'join', מעצב: 'format', כותב: 'format', מתאר: 'format',
  בודק: 'validate', מאמת: 'validate', יודע: 'validate', משווה: 'compare', ממיר: 'convert', הופך: 'convert', מתרגם: 'convert', מקבץ: 'group',
  מחפש: 'fuzzy', מוצא: 'lookup', מאתר: 'lookup', מחזיר: 'lookup', מדרג: 'tier', מסווג: 'tier', מגביל: 'clamp', רושם: 'transcript',
  מסיר: 'filter', מוריד: 'filter', מחשב: null, בונה: null, יוצר: null, מפיק: null, מציג: null,
  // צורות-ציווי (המחולל כותב בציווי: "חשב", "הפק", "בדוק")
  מיין: 'sort', סנן: 'filter', ספור: 'count', סכם: 'sum', נרמל: 'normalize', עגל: 'round', הזז: 'offset', הוסף: 'offset', חלק: 'divide', פצל: 'split',
  צרף: 'join', עצב: 'format', בדוק: 'validate', אמת: 'validate', השווה: 'compare', המר: 'convert', קבץ: 'group', חפש: 'fuzzy', מצא: 'lookup', דרג: 'tier',
  הגבל: 'clamp', רשום: 'transcript', הסר: 'filter', השאר: 'filter', מזג: 'combine', איחוד: 'combine', הפוך: 'reverse',
})) if (id && !HE_FIRST.has(w)) HE_FIRST.set(w, id);

/** תווית סטטית לחלק אחד. */
export function staticLabel(part) {
  const toks = codeTokens(part.symbol);
  const symLow = String(part.symbol).toLowerCase();
  const nameWords = String(part.name ?? '').split(/\s+/).filter(Boolean);
  const first = nameWords[0] ?? '';
  const hits = new Map();
  const add = (id, by) => { if (!hits.has(id)) hits.set(id, by); };
  if (HE_FIRST.has(first)) add(HE_FIRST.get(first), 'first');
  for (const v of VERBS) {
    for (const w of v.cues?.he ?? []) if (w.length >= 3 && nameWords.slice(1).some((x) => x === w || x.startsWith(w))) add(v.id, 'name');
    for (const c of v.cues?.en ?? []) {
      const lc = c.toLowerCase();
      if (GENERIC_EN.has(lc)) continue;
      if (toks.includes(lc) || (lc.length >= 6 && symLow.includes(lc))) add(v.id, 'symbol');
    }
  }
  // החתימה צריכה להתאים לצורת הפועל (לפעלים עם חוקים)
  const verbs = [];
  for (const [id, by] of hits) {
    const v = VERBS.find((x) => x.id === id);
    if (!v) continue;
    if (!v.staticOnly) {
      const g = kindSet(v.gives);
      if (!kindOk(g, part.gives?.kind ?? 'unknown') && part.what !== 'engine') continue;
      const tk = v.takes[0];
      if (tk && tk !== 'any' && part.takes?.length && !part.takes.some((t) => kindOk(kindSet(tk), t.kind))) continue;
    }
    verbs.push({ id, by });
  }
  const rank = { first: 0, name: 1, symbol: 2 };
  verbs.sort((a, b) => rank[a.by] - rank[b.by] || (a.id < b.id ? -1 : 1));
  return { verbs, primary: verbs[0]?.id ?? null, material: part.takes?.[0]?.kind ?? part.gives?.kind ?? 'unknown' };
}
