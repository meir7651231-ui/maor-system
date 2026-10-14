/**
 * 🎯 מנועים וחלקים — "להתחיל מהסוף, כמו Waze" (ATOMS-GOAL, 14.10.2026).
 *
 * הלקוח כותב מה הוא רוצה לקבל ("תורים של 40 דקות בחלון הניקיון"), והארגז מרכיב את זה לבד מהחלקים הקטנים,
 * מראה את התוצאה האמיתית על הנתונים שלו, ו"חבר" יוצר את המנוע. השיטה — כמו "המחולל" (ריפו -ai-chat-server):
 *  1. `readGoal` — מבינים את המשפט **רק מהמילים שלנו** (שמות, מקומות, דוגמאות + רשימת-נרדפות קטנה, תחיליות ו/ה/ב/ל/מ/ש/כ,
 *     טעות-כתיב אחת). מספרים ויחידות ⇒ פרטים. לא ברור ⇒ `unclear` — ולא מנחשים.
 *  2. `composeGoal` — כל ההרכבות של 1–3 חלקים שמתאימות **לפי סוג** (`optionsFor` למנוע הגדול, `outputPlaces`/`outputKind`
 *     לשרשרת), שמשתמשות בכל החלקים שבמשפט ובמקום שבמשפט.
 *  3. כל הרכבה **רצה על הנתונים האמיתיים** (`previewOf` / תצוגת-השרשרת) — נשארות רק אלה עם תוצאה אמיתית (לא null) = "מוכח".
 *  4. דירוג: מוכח ⇒ פחות חלקים ⇒ יותר התאמה למילים ⇒ סדר יציב. עד 3.
 *  5. `sayComposition` — ההרכבה חוזרת למילים ("הלוך-חזור"), כדי שהאדם יראה שזה מה שהתכוון.
 * לא ברור או דו-משמעי ⇒ שאלות סגורות (`questions`) עם צ'יפים — השאלה של החלק עצמו ("מה לחלק?") ורק המקומות שנותנים תוצאה.
 *
 * טהור: בלי store/DOM/שעון ("עכשיו" = `ctx.nowMs`), דטרמיניסטי, לא זורק. **בלי שמות אורחים** — רק מה שהתצוגות כבר מראות.
 * נטען רק ב-chunk העצל של המסך (דרך atoms/source.ts) — לא בבנדל-ההפעלה.
 */
import { capabilityId, optionsFor, type AtomCard, type AtomId, type Capability, type EngineCard, type EngineId, type Kind, type Place } from './contract';
import { ATOM_CARDS, atomCard } from './cards';
import { ATOM_EXPLAIN, ENGINE_EXPLAIN } from './explain';
import { placeById } from './engines';
import { childCapability, generationOf, MAX_GENERATIONS, outputPlaces } from './chain';
import { cleanParams, placeShort, suggestedChildName, suggestedName } from './capabilities';
import { previewOf, type PreviewCtx } from './preview';
import { normHe } from './parts/fuzzy';
import { levenshtein } from '../search';

/* ═══════════════ 1 · קריאת המשפט ═══════════════ */

/** הפרטים שנקראו מהמשפט — לפני שיודעים לאיזה חלק הם הולכים. */
export interface GoalParams {
  /** "ל-3 תשלומים" · "6 תורים". */
  parts?: number;
  /** "תורים של 40 דקות" — אורך, בדקות. */
  sizeMin?: number;
  /** "תשלומים של ₪400". */
  sizeMoney?: number;
  /** "יום לפני" = −1440 · "20 דקות לפני" = −20. */
  offsetMin?: number;
  /** "תוך שעה" = 60. */
  waitMin?: number;
  /** "3 לילות" = 3. */
  nights?: number;
  /** "3 הבאים". */
  count?: number;
  /** "לחצי שעה" = 30 (עיגול זמנים). */
  stepMin?: number;
  /** "לעשרות" / "ל-₪10" = 10 (עיגול סכומים). */
  stepMoney?: number;
  dir?: 'up' | 'down' | 'nearest';
  rotateBy?: 'day' | 'item';
  /** "2 צמודים" — כמה ביחד. */
  group?: number;
  /** מספר בלי יחידה אחרי ל- ("ל-4"): חלקים לחלוקה, או יחידה לעיגול. */
  bare?: number;
}

export interface Goal {
  text: string;
  /** החלקים שבמשפט, בסדר שבו הופיעו. */
  atoms: AtomId[];
  /** המקומות שבמשפט (מזהים), מהחזק לחלש. */
  places: string[];
  params: GoalParams;
  /** אין מספיק מילים מוכרות כדי לדעת מה לחפש. */
  unclear: boolean;
  /** ציון-המקום לכל מקום שהוזכר (חזק ≥ 1 · רמז בלבד < 1). */
  placeScore: Readonly<Record<string, number>>;
  /** כמה מילים מוכרות נמצאו. */
  hits: number;
}

/** בחירה מתוך שאלה סגורה (צ'יפ) — מוסיפה חלק או מקום למשפט, בלי לנחש. */
export interface GoalPick {
  atom?: AtomId;
  place?: string;
}

/** מילים מוכרות לכל חלק (הנרדפות של הבעלים + השמות וההסברים). ביטוי = מילים צמודות. */
const ATOM_WORDS: Readonly<Record<AtomId, readonly string[]>> = {
  divide: ['לחלק', 'מחלק', 'חלוקה', 'חלקים', 'חלקים שווים', 'תורים', 'תור', 'משבצות', 'משבצת', 'תשלומים', 'תשלום', 'תורנויות', 'משמרות', 'משמרת', 'שעות זמניות', 'שעה זמנית', 'לחתוך', 'באמצע'],
  merge: ['ברצף', 'רצופים', 'רצופות', 'צמודים', 'צמודות', 'צמוד', 'לחבר', 'לאחד', 'מחבר', 'מאחד', 'ביחד'],
  next: ['הבא', 'הבאה', 'הבאים', 'הבאות', 'הקרוב', 'הקרובה', 'הקרובים', 'הקרובות', 'הבא בתור', 'מתי'],
  round: ['לעגל', 'מעגל', 'מעוגל', 'מעוגלת', 'עגול', 'עגולה', 'עגולים', 'עיגול'],
  offset: ['לפני', 'אחרי', 'תזכורת', 'תזכורות', 'להזכיר', 'להקדים', 'לאחר'],
  escalate: ['אין תשובה', 'אין מענה', 'אין אישור', 'לא עונה', 'לא עונים', 'לא עונה', 'לא ענה', 'לא נענית', 'להעביר', 'מעביר', 'להעביר הלאה', 'להעביר לבא', 'להעביר לבאה', 'לבא אחריו', 'לבאה בתור'],
  rotate: ['לחלק בתורות', 'מחלק בתורות', 'לתת בתורות', 'בתורות', 'תורנות', 'בתורה', 'כל פעם אחר', 'כל פעם אחרת', 'כל פעם מישהו אחר', 'כל יום אחר', 'כל יום אחרת', 'בסבב', 'סבב', 'הוגן'],
  fuzzy: ['טעות כתיב', 'טעויות כתיב', 'שגיאת כתיב', 'שגיאות כתיב', 'כתבו לא נכון', 'כתוב לא נכון', 'כתבו קצת אחרת', 'טעות', 'טעויות', 'לחפש', 'חיפוש', 'למצוא'],
};

/** מילים מוכרות לכל מקום (משמות-המקומות + השמות הקצרים). משקל 1 = מקום ברור · 0.5 = רמז בלבד. */
const PLACE_WORDS: Readonly<Record<string, readonly (string | [string, number])[]>> = {
  'bookings.turnover': ['חלון הניקיון', 'חלון ניקיון', 'בין עזיבה לכניסה', ['ניקיון', 0.6], ['תורים', 0.5], ['משבצות', 0.5]],
  'bookings.day': ['יום העבודה', 'יום עבודה', 'קבלת אורחים', ['תורים', 0.4]],
  'bookings.stay': ['שהייה', 'השהייה', 'שהייה ארוכה'],
  'bookings.balance': ['יתרה', 'היתרה', 'יתרה לתשלום', ['תשלומים', 0.5]],
  'bookings.total': ['המחיר הכולל', 'מחיר כולל', 'מחיר לאדם', 'מחיר ללילה', ['מחיר', 0.6], ['תשלומים', 0.4]],
  'bookings.untilArrival': ['עד ההגעה', 'עד הכניסה', 'מועדי תשלום'],
  'bookings.nights': ['הזמן הפנוי', 'זמן פנוי', 'לילות', 'לילה', 'לילות פנויים', 'לילה פנוי', ['פנוי', 0.6], ['פנויים', 0.6], ['פנויות', 0.6]],
  'bookings.guestStays': ['הזמנות האורח', 'הזמנות של אורח'],
  'bookings.unitStays': ['הזמנות היחידה', 'הזמנה הבאה'],
  'bookings.sacredDays': [['שבת', 0.5], ['חג', 0.5], ['חגים', 0.5]],
  'bookings.unitFaults': ['תקלות היחידה'],
  'bookings.arrivals': ['הגעה', 'הגעות', 'ההגעה', 'מועדי ההגעה', 'מגיעים', 'מגיע', 'שעת הגעה'],
  'bookings.cleaning': ['מנקה', 'מנקים', 'מנקות', 'משימת ניקיון', 'משימות ניקיון', ['ניקיון', 0.6]],
  'bookings.faults': ['תקלה', 'תקלות', 'תחזוקה', 'אחראי תחזוקה'],
  'bookings.unpaid': ['יתרות פתוחות', 'לא שולם', 'לא שילם', 'לא שילמו', 'גבייה', 'חוב', 'חובות'],
  'bookings.guests': ['אורח', 'אורחים', 'שם אורח', 'שמות האורחים'],
  'zmanim.day': ['שעות זמניות', 'שעה זמנית', 'מהנץ עד השקיעה', 'היום מהנץ'],
  'zmanim.shabbat': ['השבת', 'משמרות שבת', 'תורנות שמירה', 'שמירה', ['שבת', 0.8]],
  'zmanim.times': ['זמני היום', 'שקיעה', 'השקיעה', 'נץ', 'הנץ', 'צאת', 'צאת הכוכבים', 'מניין', 'מנין', 'הדלקת נרות', 'הזמן הבא', 'חצות', 'קריאת שמע', ['זמן', 0.5], ['זמנים', 0.5]],
  'zmanim.closedDays': ['השבת או החג', 'שבת או חג', 'ימים סגורים', 'הימים הסגורים', 'חג ושבת', 'שבת וחג', 'יום טוב', ['חג', 0.8], ['חגים', 0.8]],
  'whatNeed.requests': ['בקשה', 'בקשות', 'הבקשה', 'פנייה', 'פניות'],
  'whatNeed.text': ['הבקשה בטקסט', 'מקצוע', 'המקצוע'],
  'whatNeed.names': ['עסק', 'עסקים', 'שם העסק', 'שמות העסקים'],
  'whatNeed.hours': ['שעות הפתיחה', 'שעות פתיחה'],
  'whatNeed.openings': ['נפתח', 'נסגר', 'נפתחים', 'נסגרים', 'פתוח', 'סגור'],
  'whatNeed.adSlot': ['פרסומת', 'פרסומות', 'משבצת פרסום'],
  'whatNeed.adPrice': ['מחיר הפרסומת', 'מחיר פרסומת', 'מחיר הפרסום'],
};

const NUM_WORDS: Readonly<Record<string, number>> = normKeys({
  אחד: 1, אחת: 1, שניים: 2, שתיים: 2, שני: 2, שתי: 2, שלוש: 3, שלושה: 3, שלושת: 3, ארבע: 4, ארבעה: 4, ארבעת: 4,
  חמש: 5, חמישה: 5, חמשת: 5, שש: 6, שישה: 6, ששת: 6, שבע: 7, שבעה: 7, שמונה: 8, תשע: 9, תשעה: 9, עשר: 10, עשרה: 10,
  עשרים: 20, שלושים: 30, ארבעים: 40, חמישים: 50, שישים: 60, תשעים: 90, מאה: 100,
});

type Unit = 'min' | 'hour' | 'day' | 'night' | 'part' | 'money' | 'count' | 'group';
const UNIT_WORDS: Readonly<Record<string, Unit>> = normKeys({
  דקה: 'min', דקות: 'min', שעה: 'hour', שעות: 'hour', יום: 'day', ימים: 'day', לילה: 'night', לילות: 'night',
  תשלום: 'part', תשלומים: 'part', חלק: 'part', חלקים: 'part', תורים: 'part', משבצות: 'part', משמרות: 'part', תורנויות: 'part',
  שקל: 'money', שקלים: 'money', שח: 'money', '₪': 'money', הבאים: 'count', הבאות: 'count', הקרובים: 'count', הקרובות: 'count', צמודים: 'group', צמודות: 'group',
});
/** מילים זוגיות: שעתיים, יומיים, רבע/חצי שעה. */
const DUAL: Readonly<Record<string, { n: number; unit: Unit }>> = normKeys({
  שעתיים: { n: 2, unit: 'hour' }, יומיים: { n: 2, unit: 'day' }, דקותיים: { n: 2, unit: 'min' }, לילותיים: { n: 2, unit: 'night' },
});

/** המפתחות כמו שהמשפט נראה אחרי הנרמול (ם⇒מ, יי⇒י…). */
function normKeys<T>(o: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(o)) out[k === '₪' ? k : normHe(k)] = v;
  return out;
}
/** רשימת-מילים מנורמלת (להשוואה מול המשפט). */
const W = (...ws: string[]): string[] => ws.map((w) => normHe(w));

/** אותיות-השימוש בראש מילה (עד שתיים), רק כשנשארות ≥ 2 אותיות. */
const PREFIX = /^[והבלמשכ]/;
function variants(tok: string): string[] {
  const out = [tok];
  let t = tok;
  for (let i = 0; i < 2 && PREFIX.test(t) && t.length > 3; i++) {
    t = t.slice(1);
    out.push(t);
  }
  return out;
}

/** הגרעין: בלי אותיות-שימוש בראש המילה כל עוד נשארות ≥ 4. */
function core(w: string): string {
  let t = w;
  for (let i = 0; i < 2 && PREFIX.test(t) && t.length > 4; i++) t = t.slice(1);
  return t;
}

/** מילה מול מילה-מוכרת (שתיהן מנורמלות): 3 זהה · 2.8 אחרי תחילית · 1.6 טעות אחת (≥ 5 אותיות — מילים קצרות נבדלות באות אחת: שעות/טעות, אחרי/אחרת) · 0. */
function wordMatch(tok: string, w: string): number {
  if (tok === w) return 3;
  const vs = variants(tok);
  if (vs.includes(w)) return 2.8;
  // טעות אחת — רק בין הגרעינים (בלי אותיות-השימוש) ורק כשהם ארוכים: "השעות" ≠ "הגעות"
  const a = core(tok);
  const b = core(w);
  if (a.length >= 5 && b.length >= 5 && Math.abs(a.length - b.length) <= 1 && levenshtein(a, b) <= 1) return 1.6;
  return 0;
}

interface Tok {
  t: string;
  used: boolean;
}

/** מוצא ביטוי (מילים צמודות) שעוד לא נוצל. מחזיר את מקום ההתחלה, או −1. */
function findPhrase(toks: Tok[], phrase: readonly string[]): number {
  outer: for (let i = 0; i + phrase.length <= toks.length; i++) {
    for (let j = 0; j < phrase.length; j++) if (toks[i + j].used || !wordMatch(toks[i + j].t, phrase[j])) continue outer;
    return i;
  }
  return -1;
}

const normWords = (s: string): string[] => normHe(s).split(' ').filter(Boolean);

/** כל הביטויים (חלקים ומקומות), מהארוך לקצר — ביטוי ארוך "תופס" את המילים שלו קודם ("להעביר לבאה" לפני "הבאה"). */
type Entry = { kind: 'atom'; id: AtomId; words: string[]; w: number } | { kind: 'place'; id: string; words: string[]; w: number };
const ENTRIES: readonly Entry[] = (() => {
  const out: Entry[] = [];
  for (const [id, list] of Object.entries(ATOM_WORDS) as [AtomId, readonly string[]][]) for (const p of list) out.push({ kind: 'atom', id, words: normWords(p), w: 1 });
  for (const [id, list] of Object.entries(PLACE_WORDS)) for (const p of list) {
    const [txt, w] = typeof p === 'string' ? [p, 1] : p;
    out.push({ kind: 'place', id, words: normWords(txt), w });
  }
  // ארוך קודם (ביטוי ארוך תופס את המילים שלו לפני ביטוי קצר)
  return out.sort((a, b) => b.words.length - a.words.length || (a.kind === b.kind ? 0 : a.kind === 'atom' ? -1 : 1));
})();

const parseNum = (t: string): number | null => {
  const s = t.replace(/^₪/, '');
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  for (const v of variants(t)) if (Object.prototype.hasOwnProperty.call(NUM_WORDS, v)) return NUM_WORDS[v];
  return null;
};
const unitOf = (t: string): Unit | null => {
  for (const v of variants(t)) if (Object.prototype.hasOwnProperty.call(UNIT_WORDS, v)) return UNIT_WORDS[v];
  return null;
};
const has = (toks: readonly Tok[], i: number, words: readonly string[]): boolean => i >= 0 && i < toks.length && words.some((w) => variants(toks[i].t).includes(w));
const near = (toks: readonly Tok[], from: number, to: number, words: readonly string[]): boolean => {
  for (let i = Math.max(0, from); i <= Math.min(toks.length - 1, to); i++) if (has(toks, i, words)) return true;
  return false;
};

/** מספרים ויחידות ⇒ פרטים. "יום לפני" · "20 דקות לפני" · "תוך שעה" · "ל-3 תשלומים" · "3 לילות" · "לחצי שעה". */
function readParams(toks: Tok[]): GoalParams {
  const p: GoalParams = {};
  const tt = toks.map((x) => x.t);
  for (let i = 0; i < toks.length; i++) {
    let n: number | null = null;
    let unit: Unit | null = null;
    let at = i;
    const dual = variants(tt[i]).map((v) => DUAL[v]).find(Boolean);
    if (dual) {
      n = dual.n;
      unit = dual.unit;
    } else if ((tt[i] === 'חצי' || tt[i] === 'רבע' || variants(tt[i]).some((v) => v === 'חצי' || v === 'רבע')) && unitOf(tt[i + 1] ?? '') === 'hour') {
      n = variants(tt[i]).some((v) => v === 'חצי') ? 0.5 : 0.25;
      unit = 'hour';
      at = i + 1;
    } else {
      n = parseNum(tt[i]);
      if (n !== null) {
        // ₪ לפני או אחרי המספר
        if (/^₪/.test(tt[i]) || tt[i - 1] === '₪') unit = 'money';
        else if ((unit = unitOf(tt[i + 1] ?? ''))) at = i + 1;
        else if ((unit = unitOf(tt[i + 2] ?? '')) === 'count') at = i + 2; // "3 ההגעות הבאות"
        else {
          unit = null;
          if (/^ל/.test(tt[i]) || tt[i - 1] === 'ל') p.bare = n;
        }
      } else {
        // יחידה לבד = אחת ("יום לפני", "תוך שעה", "לילה אחד")
        const u = unitOf(tt[i]);
        if (u === 'min' || u === 'hour' || u === 'day') {
          if (parseNum(tt[i - 1] ?? '') !== null || /^(חצי|רבע)$/.test(tt[i - 1] ?? '')) continue;
          if (!variants(tt[i]).some((v) => v === 'שעה' || v === 'יומ' || v === 'דקה')) continue; // "שעות" לבד ≠ אחת
          // "יום לפני" · "תוך שעה" — אבל "של היום" = היום, לא "יום אחד"
          if (!near(toks, i - 1, i - 1, W('תוך', 'בתוך', 'אחרי', 'לאחר', 'כעבור')) && !near(toks, i + 1, i + 1, W('לפני', 'אחרי', 'קודם', 'לאחר'))) continue;
          n = 1;
          unit = u;
        }
      }
    }
    if (n === null || !unit || !(n > 0)) continue;
    const minutes = unit === 'min' ? n : unit === 'hour' ? n * 60 : unit === 'day' ? n * 1440 : 0;
    const before = near(toks, at + 1, at + 2, W('לפני', 'קודם'));
    const after = near(toks, at + 1, at + 2, W('אחרי', 'לאחר'));
    const within = near(toks, i - 2, i - 1, W('תוך', 'בתוך', 'אחרי')) && !before && !after && !near(toks, at + 1, at + 1, W('שווים'));
    const toRound = /^ל/.test(tt[i]) || tt[i - 1] === 'ל' || (/^(חצי|רבע)$/.test(variants(tt[i]).at(-1) ?? '') && /^ל/.test(tt[i]));
    if (minutes) {
      if (before || after) p.offsetMin = (before ? -1 : 1) * minutes;
      else if (within) p.waitMin = minutes;
      else if (toRound && minutes < 1440 && !near(toks, i - 3, i - 1, W('תורים', 'משבצות', 'חלקים', 'תור'))) p.stepMin = minutes;
      else p.sizeMin = minutes;
    } else if (unit === 'night') p.nights = Math.round(n);
    else if (unit === 'part') p.parts = Math.round(n);
    else if (unit === 'count') p.count = Math.round(n);
    else if (unit === 'group') p.group = Math.round(n);
    else if (unit === 'money') {
      if (toRound || near(toks, i - 3, i - 1, W('לעגל', 'עגול', 'מעוגל'))) p.stepMoney = n;
      else p.sizeMoney = n;
    }
    i = at;
  }
  if (toks.some((x) => variants(x.t).some((v) => ['לעשרות', 'עשרות'].includes(v)))) p.stepMoney = 10;
  if (toks.some((x) => variants(x.t).some((v) => ['למאות', 'מאות'].includes(v)))) p.stepMoney = 100;
  if (toks.some((x) => variants(x.t).some((v) => ['למעלה', 'מעלה'].includes(v)))) p.dir = 'up';
  else if (toks.some((x) => variants(x.t).some((v) => ['למטה', 'מטה'].includes(v)))) p.dir = 'down';
  else if (toks.some((x) => variants(x.t).some((v) => ['לקרוב'].includes(v))) && toks.some((x) => /עגל|עגול|עיגול/.test(x.t))) p.dir = 'nearest';
  const tx = tt.join(' ');
  if (/(כל|לפי) (פעמ|משימה|משימת|בקשה|תקלה|פריט)/.test(tx)) p.rotateBy = 'item';
  else if (/(כל|לפי) (יומ|שבת|שבוע)/.test(tx)) p.rotateBy = 'day';
  return p;
}

/** המשפט ⇒ מה רוצים: חלקים, מקומות ופרטים. משפט ריק / בלי מילים מוכרות ⇒ `unclear`. לא זורק. */
export function readGoal(text: unknown): Goal {
  const raw = typeof text === 'string' ? text.slice(0, 400) : '';
  // "1,200" ⇒ 1200 · "₪ 400" ⇒ "₪400" · "ל-3" ⇒ "ל 3" (normHe)
  const pre = raw.replace(/(\d),(\d{3})/g, '$1$2').replace(/₪\s*/g, ' ₪').replace(/(\d)\s*₪/g, ' ₪$1');
  const toks: Tok[] = normHe(pre).split(' ').filter(Boolean).map((t) => ({ t, used: false }));
  const params = readParams(toks);
  const atomAt = new Map<AtomId, number>();
  const placeScore: Record<string, number> = {};
  let hits = 0;
  // שני מעברים נפרדים: מילה יכולה להעיד גם על חלק וגם על מקום ("שעות זמניות", "תורים").
  // בתוך כל מעבר ביטוי ארוך "תופס" את המילים שלו ("להעביר לבאה" לפני "הבאה" · "חלון הניקיון" לפני "ניקיון");
  // מילה בודדת של מקום לא תופסת — "השבת" מעידה גם על השבת של מחשבון הזמנים וגם על השבתות של ההזמנות.
  const placeToks: Tok[] = toks.map((x) => ({ t: x.t, used: false }));
  for (const e of ENTRIES) {
    const list = e.kind === 'atom' ? toks : placeToks;
    const claims = e.kind === 'atom' || e.words.length > 1;
    for (let guard = 0; guard < 4; guard++) {
      const at = findPhrase(list, e.words);
      if (at < 0) break;
      if (claims) for (let j = 0; j < e.words.length; j++) list[at + j].used = true;
      hits++;
      if (e.kind === 'atom') {
        if (!atomAt.has(e.id)) atomAt.set(e.id, at);
      } else placeScore[e.id] = Math.max(placeScore[e.id] ?? 0, e.w) + (placeScore[e.id] ? 0.1 : 0);
      if (!claims) break;
    }
  }
  // "תורים"/"תשלומים" הם גם מספר-חלקים: "ל-3 תשלומים" כבר בפרטים, אבל החלק עדיין ✂️
  const atoms = [...atomAt.entries()].sort((a, b) => a[1] - b[1]).map(([a]) => a);
  const places = Object.keys(placeScore).sort((a, b) => placeScore[b] - placeScore[a] || PLACE_ORDER.indexOf(a) - PLACE_ORDER.indexOf(b));
  return { text: raw, atoms, places, params, unclear: atoms.length === 0 && !places.some((p) => placeScore[p] >= 1), placeScore, hits };
}

const PLACE_ORDER = Object.keys(PLACE_WORDS);

/** מוסיף לבחירה שנבחרה מצ'יפ — החלק נכנס לסוף, המקום הופך לחזק ביותר. */
export function withPick(goal: Goal, pick: GoalPick | null | undefined): Goal {
  if (!pick) return goal;
  const atoms = pick.atom && atomCard(pick.atom) && !goal.atoms.includes(pick.atom) ? [...goal.atoms, pick.atom] : goal.atoms;
  if (!pick.place || !placeById(pick.place)) return { ...goal, atoms, unclear: goal.unclear && atoms.length === 0 };
  const placeScore = { ...goal.placeScore, [pick.place]: 9 };
  const places = [pick.place, ...goal.places.filter((p) => p !== pick.place)];
  return { ...goal, atoms, places, placeScore, unclear: false };
}

/* ═══════════════ 2 · הרכבה ═══════════════ */

export interface GoalStep {
  atom: AtomId;
  /** המקום שהחלק מתחבר אליו (במנוע הגדול, או הפלט של החלק הקודם). */
  place: string;
  /** הסוג של המקום. */
  kind: Kind;
  params: Record<string, number | string>;
}

export interface Composition {
  /** המזהה של המנוע האחרון בשרשרת (= מה ש"חבר" יוצר). */
  id: string;
  engine: EngineId;
  steps: GoalStep[];
  /** מה "חבר" יוצר, לפי הסדר (ההורה לפני מה שבנוי עליו). מנועים שכבר שמורים בדרך — לא נוצרים מחדש. */
  create: Capability[];
  title: string;
  lines: string[];
  /** ההרכבה במילים — "הלוך-חזור". */
  sentence: string;
  /** כמה מילים מהמשפט ההרכבה מכסה (לדירוג ולמד). */
  match: number;
  /** כבר שמורה בדיוק כך. */
  saved: boolean;
}

export interface GoalChip {
  label: string;
  pick: GoalPick;
}
export interface GoalQuestion {
  /** השאלה של החלק עצמו ("מה לחלק?"), או "מה לעשות עם …?". */
  text: string;
  chips: GoalChip[];
}

export type GoalStatus = 'ok' | 'ask' | 'none' | 'empty';
export interface GoalAnswer {
  goal: Goal;
  status: GoalStatus;
  results: Composition[];
  questions: GoalQuestion[];
}

export const GOAL_MAX_RESULTS = 3;
/** שורת-הכנות כשאין הרכבה. */
export const GOAL_NONE_TEXT = 'לא מצאתי הרכבה שנותנת את זה מהמנועים שיש — נסה במילים אחרות או בחר חלק בעצמך';

/** מקומות שהזמן בהם בימים (לא בדקות). */
const DAY_SPANS = new Set(['bookings.stay', 'bookings.untilArrival']);
const AMOUNT_KINDS = new Set(['amount']);

/** הפרטים של חלק מתוך מה שנקרא מהמשפט — רק מה שהחלק שואל עליו; השאר ברירת-המחדל של הכרטיס. */
export function paramsFor(atom: AtomCard, place: Pick<Place, 'id' | 'kind'>, gp: GoalParams): Record<string, number | string> {
  return cleanParams(atom, rawParamsFor(atom, place, gp));
}

/** מה מהמשפט החלק לוקח (לפני הניקוי). ריק ⇒ החלק לא משתמש בשום פרט מהמשפט. */
function rawParamsFor(atom: AtomCard, place: Pick<Place, 'id' | 'kind'>, gp: GoalParams): Record<string, number | string> {
  const raw: Record<string, number | string> = {};
  const amount = AMOUNT_KINDS.has(place.kind);
  if (atom.id === 'divide') {
    if (gp.parts || gp.bare) Object.assign(raw, { by: 'parts', parts: gp.parts ?? gp.bare! });
    else if (amount && gp.sizeMoney) Object.assign(raw, { by: 'size', size: gp.sizeMoney });
    else if (!amount && gp.sizeMin) {
      const size = DAY_SPANS.has(place.id) ? gp.sizeMin / 1440 : gp.sizeMin;
      // בימים ("כל 2 ימים") — גם החלק האחרון נחשב, קצר יותר (אחרת שהייה של 3 לילות לא נחתכת בכלל)
      if (size >= 1 && Number.isInteger(size)) Object.assign(raw, DAY_SPANS.has(place.id) ? { by: 'size', size, remainder: 'shorten' } : { by: 'size', size });
    }
  } else if (atom.id === 'merge') {
    if (gp.nights || gp.group) raw.minLength = gp.nights ?? gp.group!;
  } else if (atom.id === 'next') {
    if (gp.nights) raw.minLength = gp.nights;
    if (gp.count) raw.count = gp.count;
  } else if (atom.id === 'round') {
    const step = (amount ? gp.stepMoney : gp.stepMin) ?? gp.bare;
    if (step) raw.step = step;
    if (gp.dir) raw.dir = gp.dir;
  } else if (atom.id === 'offset') {
    if (gp.offsetMin) raw.minutes = gp.offsetMin;
  } else if (atom.id === 'escalate') {
    if (gp.waitMin) Object.assign(raw, { waitMin: gp.waitMin, urgentWaitMin: Math.min(gp.waitMin, 60) });
  } else if (atom.id === 'rotate') {
    if (gp.rotateBy) raw.by = gp.rotateBy;
  }
  return raw;
}

/** מה שהמשפט ביקש נכנס בגבולות של החלק ("יומיים לפני" — ⏱️ מזיז עד יום ⇒ לא מציעים במקום לקצץ בשקט). */
function fitsRange(atom: AtomCard, place: Pick<Place, 'id' | 'kind'>, gp: GoalParams): boolean {
  const raw = rawParamsFor(atom, place, gp);
  const clean = cleanParams(atom, raw);
  return Object.keys(raw).every((k) => clean[k] === raw[k]);
}

/**
 * כל חלק בהרכבה "מוצדק": נאמר במשפט · או לוקח ממנו פרט ("3 לילות" ⇒ ⏭️ של 3 לילות) · או שהוא הדרך לחלק שנאמר
 * (🔗 לפני ✂️ ב"לחלק את הזמן הפנוי" — ✂️ לא מתחבר ללילות ישר). אחרת — רעש, לא מציעים.
 */
function earned(goal: Goal, d: Draft): boolean {
  let paths = 0;
  return d.steps.every((s, i) => {
    if (goal.atoms.includes(s.atom)) return true;
    const a = atomCard(s.atom);
    const place = { id: s.place, kind: s.kind };
    if (a && place && Object.keys(rawParamsFor(a, place, goal.params)).length > 0) return true;
    // הדרך לחלק שנאמר — רק כשהחלק הזה לא מתחבר למקום ישר
    // (ולכל היותר חלק-דרך אחד: "🔗 ואז ⏭️ ואז 🎯" ל"לעגל את הלילות" זה כבר לא מה שביקשו)
    const first = d.steps.findIndex((x) => goal.atoms.includes(x.atom));
    return first > i && !placeById(d.rootPlace)?.results[d.steps[first].atom] && ++paths <= 1;
  });
}

interface Draft {
  engine: EngineId;
  rootPlace: string;
  steps: GoalStep[];
  caps: Capability[];
}

/** כל ההרכבות של 1–3 חלקים שמתאימות לפי סוג. הפרטים — מהמשפט; מנוע-ביניים שכבר שמור ⇒ הפרטים השמורים שלו. */
function enumerate(goal: Goal, engines: readonly EngineCard[], saved: readonly Capability[]): Draft[] {
  const out: Draft[] = [];
  const savedById = new Map(saved.map((c) => [c.id, c]));
  const grow = (d: Draft) => {
    out.push(d);
    if (d.steps.length >= MAX_GENERATIONS) return;
    // מנוע-ביניים שכבר שמור — בונים על מה ששמור (התוצאה תהיה כנה אחרי "חבר")
    const last = d.caps[d.caps.length - 1];
    const parent = savedById.get(last.id) ?? last;
    if (generationOf(parent.id) >= MAX_GENERATIONS) return;
    for (const place of outputPlaces(parent)) {
      for (const a of ATOM_CARDS) {
        if (!place.results[a.id] || !a.worksOn.includes(place.kind) || a.id === d.steps[d.steps.length - 1].atom) continue;
        if (!fitsRange(a, place, goal.params)) continue;
        const params = paramsFor(a, place, goal.params);
        const child = childCapability(parent, place.id, a.id, params, suggestedChildName(parent, a.id));
        const caps = [...d.caps.slice(0, -1), parent, child];
        grow({ ...d, steps: [...d.steps, { atom: a.id, place: place.id, kind: place.kind, params }], caps });
      }
    }
  };
  for (const e of engines) {
    for (const a of ATOM_CARDS) {
      for (const o of optionsFor(a, e)) {
        const place = placeById(o.place);
        if (!place || !fitsRange(a, place, goal.params)) continue;
        const params = paramsFor(a, place, goal.params);
        const cap: Capability = { id: capabilityId(e.id, o.place, a.id), engine: e.id, place: o.place, atom: a.id, params, name: suggestedName(o.place, a.id) };
        grow({ engine: e.id, rootPlace: o.place, steps: [{ atom: a.id, place: o.place, kind: place.kind, params }], caps: [cap] });
      }
    }
  }
  return out;
}

/** כמה מהמשפט ההרכבה מכסה: כל חלק מהמשפט שבה (+ בונוס לסדר נכון), ומשקל-המקום. */
function matchOf(goal: Goal, d: Draft): number {
  const atoms = d.steps.map((s) => s.atom);
  let m = 0;
  for (const a of goal.atoms) if (atoms.includes(a)) m += 2;
  const order = goal.atoms.filter((a) => atoms.includes(a));
  if (order.length > 1 && order.every((a, i) => i === 0 || atoms.indexOf(a) > atoms.indexOf(order[i - 1]))) m += 1;
  m += goal.placeScore[d.rootPlace] ?? 0;
  return m;
}

const isStrong = (goal: Goal, place: string): boolean => (goal.placeScore[place] ?? 0) >= 1;

/** ההרכבה במילים, בשמות שאושרו. "✂️ מחלק לחלקים שווים את חלון הניקיון, כל חלק 40 דקות ← 6 תורים". */
export function sayComposition(c: Pick<Composition, 'steps'> & { title?: string }): string {
  const bits = c.steps.map((s, i) => {
    const a = ATOM_EXPLAIN[s.atom];
    if (!a) return '';
    const obj = i === 0 ? ' ' + objectOf(s.atom, s.place) : '';
    const detail = paramPhrase(s.atom, s.params, s.kind === 'amount', s.place);
    return (i > 0 ? 'ואז ' : '') + a.emoji + ' ' + a.name + obj + (detail ? ', ' + detail : '');
  });
  const out = c.title ? outcomeOf(c.title) : '';
  return bits.filter(Boolean).join(' · ') + (out ? ' ← ' + out : '');
}

/** שמות קצרים למקומות שאין להם שם קצר בכרטיסים (מחשבון הזמנים ומבין בקשות) — לצ'יפים ולמשפט. */
const GOAL_PLACE_SHORT: Readonly<Record<string, string>> = {
  'zmanim.day': 'היום מהנץ עד השקיעה',
  'zmanim.shabbat': 'השבת',
  'zmanim.times': 'זמני היום',
  'zmanim.closedDays': 'השבתות והחגים',
  'whatNeed.requests': 'הבקשות',
  'whatNeed.text': 'הבקשה בטקסט',
  'whatNeed.names': 'שמות העסקים',
  'whatNeed.hours': 'שעות הפתיחה',
  'whatNeed.openings': 'מתי עסקים נפתחים',
  'whatNeed.adSlot': 'משבצת הפרסומת',
  'whatNeed.adPrice': 'מחיר הפרסומת',
};
export const goalPlaceShort = (place: string): string => GOAL_PLACE_SHORT[place] ?? placeShort(place);

/** "את חלון הניקיון" · "את היתרה" · "בזמני היום". */
function objectOf(atom: AtomId, place: string): string {
  const short = place.startsWith('out:') ? '' : goalPlaceShort(place);
  if (!short) return '';
  return atom === 'fuzzy' || atom === 'next' ? 'ב' + short.replace(/^ה(?=..)/, '') : 'את ' + short;
}

const minutesWord = (m: number): string => {
  const a = Math.abs(m);
  if (a % 1440 === 0) return a === 1440 ? 'יום' : a === 2880 ? 'יומיים' : a / 1440 + ' ימים';
  if (a % 60 === 0) return a === 60 ? 'שעה' : a === 120 ? 'שעתיים' : a / 60 + ' שעות';
  if (a === 30) return 'חצי שעה';
  return a + ' דקות';
};
const DIR_WORD: Readonly<Record<string, string>> = { down: 'למטה', up: 'למעלה', nearest: 'לקרוב' };

/** הפרטים במילים — רק מה שאומר משהו (לא כל ברירת-מחדל). */
function paramPhrase(atom: AtomId, p: Record<string, number | string>, amount: boolean, place: string): string {
  const n = (k: string): number => (typeof p[k] === 'number' ? (p[k] as number) : NaN);
  const days = DAY_SPANS.has(place) || place.endsWith('#span');
  if (atom === 'divide') {
    if (p.by === 'size') return 'כל חלק ' + (amount ? '₪' + n('size').toLocaleString('en-US') : days ? (n('size') === 1 ? 'יום אחד' : n('size') + ' ימים') : minutesWord(n('size')));
    return amount ? 'ל-' + n('parts') + ' תשלומים' : 'ל-' + n('parts') + ' חלקים';
  }
  if (atom === 'merge') {
    const bits: string[] = [];
    if (n('minLength') > 1) bits.push('לפחות ' + n('minLength') + (place === 'bookings.nights' ? ' לילות' : ''));
    if (n('maxGap') > 0) bits.push('עם רווח של עד ' + n('maxGap'));
    return bits.join(', ');
  }
  if (atom === 'next') {
    const bits: string[] = [];
    if (n('minLength') > 1) bits.push('של ' + n('minLength') + (place.startsWith('out:') || place === 'bookings.nights' ? ' לילות' : '') + ' לפחות');
    if (n('count') > 1) bits.push(n('count') + ' הבאים');
    return bits.join(', ');
  }
  if (atom === 'round') return 'לכל ' + (amount ? '₪' + n('step') : minutesWord(n('step'))) + ', ' + (DIR_WORD[String(p.dir)] ?? '');
  if (atom === 'offset') return n('minutes') === 0 ? 'באותו רגע' : minutesWord(n('minutes')) + ' ' + (n('minutes') < 0 ? 'לפני' : 'אחרי');
  if (atom === 'escalate') return 'אחרי ' + minutesWord(n('waitMin')) + ' בלי תשובה';
  if (atom === 'rotate') return p.by === 'item' ? 'כל פעם מישהו אחר' : 'כל יום מישהו אחר';
  if (atom === 'fuzzy') return n('maxTypos') > 0 ? 'גם עם טעות אחת' : '';
  return '';
}

/** "חלון הניקיון 11:00–15:00 · 6 תורים" ⇒ "6 תורים" (החלק האחרון של הכותרת). */
function outcomeOf(title: string): string {
  // החלק האחרון שאומר משהו: לא רק שעות ("תורים באורך משתנה · 11:00–15:00" ⇒ השם) ולא המקום ("· לפי בני ברק")
  const bits = title.split(' · ').map((b) => b.trim()).filter((b) => b && !/^לפי /.test(b) && !/^[\d:–\-/ ]+$/.test(b));
  return bits.length ? bits[bits.length - 1] : '';
}

/** הצ'יפים של שאלה "מה לחלק?": רק המקומות שנותנים תוצאה אמיתית, בשם הקצר. */
function placeChips(cands: readonly { d: Draft }[]): GoalChip[] {
  const seen = new Set<string>();
  const out: GoalChip[] = [];
  for (const { d } of cands) {
    if (seen.has(d.rootPlace)) continue;
    seen.add(d.rootPlace);
    // שני מנועים יכולים להחזיק מקום דומה ("שבתות וחגים") ⇒ האימוג'י של המנוע לפני השם
    const e = ENGINE_EMOJI[d.engine];
    out.push({ label: (e ? e + ' ' : '') + goalPlaceShort(d.rootPlace), pick: { place: d.rootPlace } });
  }
  return out.slice(0, 8);
}

const ENGINE_EMOJI: Readonly<Record<string, string>> = { zmanim: ENGINE_EXPLAIN.zmanim.emoji, whatNeed: ENGINE_EXPLAIN.whatNeed.emoji, bookings: ENGINE_EXPLAIN.bookings.emoji };

const sameParams = (a: Capability['params'], b: Capability['params']): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * כל ההרכבות של המשפט שרצות על הנתונים האמיתיים ונותנות תוצאה — עד 3, מהטובה. לא ברור ⇒ שאלות סגורות.
 * `caps` = המנועים שהארגון כבר שמר (מנוע-ביניים שמור ⇒ בונים עליו כמו שהוא). לא זורק.
 */
export function composeGoal(goal: Goal, engines: readonly EngineCard[], ctx: PreviewCtx, caps: readonly Capability[] = []): GoalAnswer {
  const empty = (status: GoalStatus, questions: GoalQuestion[] = []): GoalAnswer => ({ goal, status, results: [], questions });
  try {
    if (!goal || !ctx || !Number.isFinite(ctx.nowMs)) return empty('empty');
    if (!goal.text.trim() && !goal.atoms.length && !goal.places.length) return empty('empty');
    if (goal.unclear) return empty('ask', [whatToDo(goal)]);
    const saved = Array.isArray(caps) ? caps : [];
    const all = enumerate(goal, engines, saved);
    // מסננים: כל החלקים שבמשפט נמצאים בהרכבה · אם הוזכר מקום חזק — המקום הראשון הוא אחד מהם
    const strong = goal.places.filter((p) => isStrong(goal, p));
    const fits = all.filter((d) => goal.atoms.every((a) => d.steps.some((s) => s.atom === a)) && earned(goal, d));
    // מקום בלי חלק ⇒ שואלים מה לעשות איתו (לא מנחשים חלק)
    if (!goal.atoms.length) return askAtoms(goal, all, ctx, saved);
    const tiers: Draft[][] = [];
    const scores = [...new Set(strong.map((p) => goal.placeScore[p]))].sort((a, b) => b - a);
    for (const s of scores) tiers.push(fits.filter((d) => goal.placeScore[d.rootPlace] === s));
    const anyPlace = !strong.length;
    if (anyPlace) tiers.push(fits);
    for (const tier of tiers) {
      const proven = prove(goal, tier, ctx, saved);
      if (!proven.length) continue;
      // בלי מקום ברור, והתוצאות ממקומות שונים ⇒ שאלה סגורה (השאלה של החלק הראשון) — לא מנחשים
      const roots = new Set(proven.map((x) => x.d.rootPlace));
      const hinted = proven.filter((x) => (goal.placeScore[x.d.rootPlace] ?? 0) > 0);
      const hintRoots = new Set(hinted.map((x) => x.d.rootPlace));
      if (anyPlace && roots.size > 1 && hintRoots.size !== 1) return empty('ask', [atomQuestion(goal.atoms[0], proven)]);
      const list = anyPlace && hintRoots.size === 1 ? hinted : proven;
      return { goal, status: 'ok', results: list.slice(0, GOAL_MAX_RESULTS).map((x) => x.c), questions: [] };
    }
    // אין הרכבה מוכחת עם המקום שנאמר ⇒ כן: "לא מצאתי", ושאלה סגורה של החלק עם מה שכן נותן תוצאה
    const elsewhere = prove(goal, fits, ctx, saved);
    return empty('none', elsewhere.length ? [atomQuestion(goal.atoms[0], elsewhere)] : []);
  } catch {
    return empty('none');
  }
}

/** מריץ כל הרכבה על הנתונים האמיתיים; נשארות רק עם תוצאה. מדורג: פחות חלקים ⇒ יותר התאמה ⇒ סדר יציב. */
function prove(goal: Goal, drafts: readonly Draft[], ctx: PreviewCtx, saved: readonly Capability[]): { d: Draft; c: Composition }[] {
  const out: { d: Draft; c: Composition; i: number }[] = [];
  drafts.forEach((d, i) => {
    const last = d.caps[d.caps.length - 1];
    // המנועים בדרך — כמו שיהיו אחרי "חבר" (קודם ההרכבה, אחר כך מה שכבר שמור)
    const pv = previewOf(last, { ...ctx, caps: [...d.caps, ...saved] });
    if (!pv || !pv.lines.length) return;
    const create = d.caps.filter((c) => {
      const s = saved.find((x) => x.id === c.id);
      return !s || (c.id === last.id && !sameParams(s.params, c.params));
    });
    const savedSame = saved.some((x) => x.id === last.id && sameParams(x.params, last.params));
    const comp: Composition = { id: last.id, engine: d.engine, steps: d.steps, create, title: pv.title, lines: pv.lines, sentence: '', match: matchOf(goal, d), saved: savedSame };
    comp.sentence = sayComposition(comp);
    out.push({ d, c: comp, i });
  });
  out.sort((a, b) => a.d.steps.length - b.d.steps.length || b.c.match - a.c.match || a.i - b.i);
  return out;
}

/** "מה לחלק?" — השאלה של החלק עצמו, וצ'יפ לכל מקום שנותן תוצאה. */
function atomQuestion(atom: AtomId, proven: readonly { d: Draft }[]): GoalQuestion {
  const card = atomCard(atom);
  const singles = proven.filter((x) => x.d.steps.length === 1);
  return { text: card ? card.emoji + ' ' + card.question : 'איפה?', chips: placeChips(singles.length ? singles : proven) };
}

/** מקום בלי חלק ⇒ "מה לעשות עם היתרה?" עם צ'יפ לכל חלק שנותן שם תוצאה. */
function askAtoms(goal: Goal, all: readonly Draft[], ctx: PreviewCtx, saved: readonly Capability[]): GoalAnswer {
  const strong = goal.places.filter((p) => isStrong(goal, p));
  const place = strong[0];
  const singles = all.filter((d) => d.steps.length === 1 && d.rootPlace === place);
  const proven = prove(goal, singles, ctx, saved);
  const chips: GoalChip[] = proven.map((x) => {
    const a = ATOM_EXPLAIN[x.d.steps[0].atom];
    return { label: a.emoji + ' ' + a.name, pick: { atom: x.d.steps[0].atom } };
  });
  if (!chips.length) return { goal, status: 'none', results: [], questions: [] };
  return { goal, status: 'ask', results: [], questions: [{ text: 'מה לעשות עם ' + goalPlaceShort(place) + '?', chips }] };
}

/** משפט בלי שום מילה מוכרת ⇒ "מה לעשות?" עם שמונת החלקים (בשמות שאושרו). */
function whatToDo(goal: Goal): GoalQuestion {
  void goal;
  return { text: 'מה לעשות?', chips: ATOM_CARDS.map((a) => ({ label: ATOM_EXPLAIN[a.id].emoji + ' ' + ATOM_EXPLAIN[a.id].name, pick: { atom: a.id } })) };
}

/** הכול בקריאה אחת: המשפט + הבחירות מהצ'יפים ⇒ תשובה. */
export function answerGoal(text: unknown, picks: readonly GoalPick[], engines: readonly EngineCard[], ctx: PreviewCtx, caps: readonly Capability[] = []): GoalAnswer {
  let g = readGoal(text);
  for (const p of Array.isArray(picks) ? picks : []) g = withPick(g, p);
  return composeGoal(g, engines, ctx, caps);
}
