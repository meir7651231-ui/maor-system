/**
 * ✅ המאמת · ההרצה (ATOMS-VERIFY, 14.10.2026).
 *
 *  · `verifyAtoms({ n, seed })` — לכל אחד משמונת החלקים: n קלטים אקראיים (עם זרע), כל אחד מול כל החוקים של החלק
 *    (laws.ts). קלט שנכשל ⇒ **מכווצים** אותו לקלט הקטן ביותר שעדיין שובר את אותו חוק (כמו מנוע הטבעות: 20,000 בדיקות
 *    ואז הדוגמה הנגדית הכי קטנה).
 *  · `verifyConnections(ctx, { dbs, seed })` — לכל חיבור שיש לו תצוגה (PREVIEW_KEYS) ולכל מנוע בנוי-על-מנוע (שרשראות עד
 *    3 דורות): על ה-DB האמיתי ועל `dbs` ארגונים אקראיים (gen.ts), עם פרטים ברירת-מחדל ואקראיים. בודקים:
 *      1. לא זורק (דרך previewStrict — בלי ה-try של המסך), אין NaN / undefined / Invalid / Infinity, עד 6 שורות.
 *      2. בלי המילים הטכניות (מיזוג · ניתוב · הסלמה · סלחני · יחסי · אטום · רצף · טווח; "ברצף" מותר).
 *      3. פרטיות: אף שם של אורח / מבקש / תורם / משפחה, אף טלפון, מייל או ת״ז; אף טקסט גולמי של בקשה.
 *      4. עקביות: המספרים בשורות מקיימים את חוקי החלק (תשלומים מסתכמים ליתרה, מספר-התורים × הגודל = החלון,
 *         תזכורת = הזמן + ההזזה, עיגול לכיוון הנכון, "הבא" לא בעבר, ניקיון בתוך השהייה…).
 *      5. דטרמיניזם: אותו קלט ⇒ אותה תצוגה.
 *  · `verifySummary` — `{ atoms: {id: {cases, passed}}, connections: {key: {checks, passed}} }` לחותמת "✅ מאומת".
 *
 * טהור ודטרמיניסטי (בלי שעון-המערכת, בלי Math.random). לא נכנס לבנדל — רק בדיקות וסקריפט מייבאים אותו.
 */
import type { Db } from '../../../types/domain';
import { ATOM_IDS, capabilityId, type AtomId, type Capability } from '../contract';
import { childCapability, MAX_GENERATIONS, NEXT_VALUE, outPlaceId, outputPlaceFor, ROOT_VALUE, type ChainValue } from '../chain';
import { israelNow, paramsOf, PREVIEW_KEYS, PREVIEW_MAX_LINES, previewStrict, type Preview, type PreviewCtx } from '../preview';
import { lawsFor, violations, type AtomInput } from './laws';
import { atomCase, randomOrgDb, randomParams, rng, subSeed, type OrgSecrets } from './gen';

export const DEFAULT_SEED = 20261014;

/* ═══════════════ כיווץ ═══════════════ */

/** מועמדים קטנים יותר למספר: 0, שלם, חצי, צעד לכיוון 0, פחות ספרות. */
function smallerNumbers(x: number): number[] {
  if (!Number.isFinite(x) || x === 0) return [];
  const c = [0, Math.trunc(x), Math.trunc(x / 2), x - Math.sign(x), Math.round(x * 100) / 100, Math.round(x * 10) / 10, Math.round(x)];
  return [...new Set(c)].filter((v) => Number.isFinite(v) && v !== x && Math.abs(v) <= Math.abs(x));
}

/** מועמדים קטנים יותר לערך JSON: מערכים מתקצרים (חצאים, איבר-איבר) ואיבריהם מתכווצים; מספרים לכיוון 0. מחרוזות — לא נוגעים. */
function shrinkValue(v: unknown, depth = 0): unknown[] {
  if (typeof v === 'number') return smallerNumbers(v);
  if (Array.isArray(v)) {
    const out: unknown[] = [];
    if (v.length) out.push([]);
    if (v.length > 1) out.push(v.slice(0, Math.floor(v.length / 2)), v.slice(Math.floor(v.length / 2)));
    for (let i = 0; i < v.length && i < 40; i++) out.push([...v.slice(0, i), ...v.slice(i + 1)]);
    if (depth < 3) for (let i = 0; i < v.length && i < 40; i++) for (const s of shrinkValue(v[i], depth + 1)) out.push([...v.slice(0, i), s, ...v.slice(i + 1)]);
    return out;
  }
  if (v && typeof v === 'object' && depth < 3) {
    const out: unknown[] = [];
    for (const k of Object.keys(v)) for (const s of shrinkValue((v as Record<string, unknown>)[k], depth + 1)) out.push({ ...(v as object), [k]: s });
    return out;
  }
  return [];
}

/** הקלט עדיין עומד בתנאי המחולל (אחרת "דוגמה נגדית" הייתה שקר): גודל/צעד חיוביים, סוף ≥ התחלה, המועמד-המטרה קיים. */
function validInput(i: AtomInput): boolean {
  switch (i.k) {
    case 'divide.parts':
    case 'divide.points':
      return i.to >= i.from;
    case 'divide.size':
      return i.to >= i.from && i.size > 0 && i.gap >= 0;
    case 'divide.amount':
    case 'round':
      return i.step > 0;
    case 'escalate':
      return i.input.steps.length > 0 && Number.isFinite(i.input.createdMs);
    case 'rotate':
      return i.window >= 1 && i.items >= 0;
    case 'rotate.days':
      return i.days >= 1;
    case 'fuzzy':
      return i.expect === 'far' || i.candidates.some((c) => c.id === 'target');
    default:
      return true;
  }
}

/**
 * מכווץ: מתחיל מקלט ש-`fails` מחזיר עליו סיבה, ומחפש קלט קטן יותר (מערכים קצרים, מספרים קרובים ל-0) שעדיין נכשל —
 * חמדני, עד 400 צעדים. מחרוזות לא נוגעים (מילה עם טעות-הקלדה צריכה להישאר מילה עם טעות-הקלדה).
 */
export function shrinkWith(input: AtomInput, fails: (i: AtomInput) => string | null): { input: AtomInput; why: string; steps: number } {
  let cur = input;
  let why = fails(input) ?? '';
  let steps = 0;
  for (let round = 0; round < 400; round++) {
    let moved = false;
    for (const cand of shrinkValue(cur) as AtomInput[]) {
      if (!cand || cand.k !== input.k || !validInput(cand)) continue;
      const w = fails(cand);
      if (w) {
        cur = cand;
        why = w;
        steps++;
        moved = true;
        break;
      }
    }
    if (!moved) break;
  }
  return { input: cur, why, steps };
}

/** מכווץ קלט שנכשל בחוק `law` של חלק לקלט הקטן ביותר שעדיין שובר את אותו חוק. */
export function shrink(atom: AtomId, input: AtomInput, law: string): { input: AtomInput; why: string; steps: number } {
  return shrinkWith(input, (i) => violations(atom, i).find((v) => v.law === law)?.why ?? null);
}

/* ═══════════════ החלקים ═══════════════ */

export interface Counterexample {
  law: string;
  why: string;
  /** הקלט המכווץ. */
  input: AtomInput;
  /** הקלט המקורי שנמצא. */
  original: AtomInput;
  shrinkSteps: number;
}

export interface AtomReport {
  cases: number;
  passed: number;
  /** חוק × קלט. */
  checks: number;
  counterexample: Counterexample | null;
}

export function verifyAtoms(opts: { n?: number; seed?: number; atoms?: readonly AtomId[] } = {}): Record<AtomId, AtomReport> {
  const n = opts.n ?? 2000;
  const seed = opts.seed ?? DEFAULT_SEED;
  const out = {} as Record<AtomId, AtomReport>;
  for (const atom of opts.atoms ?? ATOM_IDS) {
    const r = rng(subSeed(seed, atom));
    const rep: AtomReport = { cases: 0, passed: 0, checks: 0, counterexample: null };
    for (let i = 0; i < n; i++) {
      const input = atomCase(atom, r, i);
      const v = violations(atom, input);
      rep.cases++;
      rep.checks += countLaws(atom, input);
      if (!v.length) {
        rep.passed++;
        continue;
      }
      if (!rep.counterexample) {
        const s = shrink(atom, input, v[0].law);
        rep.counterexample = { law: v[0].law, why: s.why, input: s.input, original: input, shrinkSteps: s.steps };
      }
    }
    out[atom] = rep;
  }
  return out;
}

/** כמה חוקים חלים על הקלט (לספירת הבדיקות). */
const countLaws = (atom: AtomId, input: AtomInput): number => lawsFor(atom, input.k).length;

/* ═══════════════ החיבורים ═══════════════ */

/** המילים הטכניות שאסור שיופיעו בתצוגה ("ברצף" מותר) — אותה רשימה כמו atoms-preview-coverage. */
export const BANNED_WORDS = ['מיזוג', 'ניתוב', 'הסלמה', 'סלחני', 'יחסי', 'אטום', 'רצף', 'טווח'] as const;
const BROKEN = /NaN|undefined|Invalid|Infinity|\bnull\b|\[object/;
const PHONE = /(?:\+972|(?<![\d,.₪])0\d{1,2}[-\s]?\d{7}(?!\d))/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const TZ_ID = /(?<![\d,.])\d{9}(?!\d)/;
const GENERIC = new Set(['משפחת', 'משפחה', 'בית', 'אורח', 'אורחת', 'ר׳', 'הרב', 'גברת']);

/** הסודות של DB כלשהו: אורחים, מבקשים, תורמים ומשפחות (שמות, טלפונים, מיילים, ת״ז) + הטקסט הגולמי של כל בקשה. */
export function secretsOf(db: Partial<Db> | null | undefined): OrgSecrets {
  const s: OrgSecrets = { names: [], phones: [], emails: [], texts: [] };
  const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
  // השם המלא בלבד: מילה בודדת מתוך שם ("אברהם" מ"משפחת אברהם") היא לפעמים מילה רגילה ("מגן אברהם").
  // שמות-המשפחה הייחודיים של המחולל (gen.ts) נבדקים כמילה בודדת — שם אין התנגשות.
  const addName = (n: string): void => {
    if (n && !GENERIC.has(n)) s.names.push(n);
  };
  for (const r of Array.isArray(db?.hostRecords) ? db!.hostRecords : []) {
    if (!r || (r as { kind?: string }).kind !== 'guest') continue;
    const g = r as unknown as Record<string, unknown>;
    addName(str(g.name));
    if (str(g.phone)) s.phones.push(str(g.phone));
    if (str(g.email)) s.emails.push(str(g.email));
  }
  for (const q of Array.isArray(db?.prRequests) ? db!.prRequests : []) {
    if (!q) continue;
    addName(str(q.requester?.name));
    if (str(q.requester?.phone)) s.phones.push(str(q.requester?.phone));
    if (str(q.text)) s.texts.push(str(q.text));
  }
  for (const list of [db?.supporters, db?.families]) {
    for (const x of Array.isArray(list) ? list : []) {
      const o = x as unknown as Record<string, unknown>;
      for (const k of ['name', 'father', 'mother']) addName(str(o?.[k]));
      for (const k of ['phone', 'phone2']) if (str(o?.[k])) s.phones.push(str(o[k]));
      if (str(o?.email)) s.emails.push(str(o.email));
    }
  }
  return s;
}

const esc = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = new Map<string, RegExp>();
/** מילה שלמה בעברית (גם עם אות-שימוש אחת לפניה). */
function hasWord(text: string, w: string): boolean {
  let re = wordRe.get(w);
  if (!re) wordRe.set(w, (re = new RegExp('(?:^|[^\\u0590-\\u05FF])[והבלמשכ]?' + esc(w) + '(?=$|[^\\u0590-\\u05FF])')));
  return re.test(text);
}

/** פרטיות: null = נקי; אחרת — מה דלף. */
export function privacyLeak(text: string, sec: OrgSecrets): string | null {
  for (const n of sec.names) if (n && (n.includes(' ') ? text.includes(n) : hasWord(text, n))) return 'שם פרטי: ' + n;
  for (const p of sec.phones) if (p && text.includes(p)) return 'טלפון: ' + p;
  for (const e of sec.emails) if (e && text.includes(e)) return 'מייל: ' + e;
  for (const t of sec.texts) if (t && t.length >= 6 && text.includes(t)) return 'טקסט גולמי של בקשה';
  if (PHONE.test(text)) return 'מספר טלפון: ' + PHONE.exec(text)![0];
  if (EMAIL.test(text)) return 'מייל: ' + EMAIL.exec(text)![0];
  if (TZ_ID.test(text)) return 'מספר בן 9 ספרות (ת״ז?): ' + TZ_ID.exec(text)![0];
  return null;
}

/* ───────── עקביות: המספרים בשורות מול חוקי החלק ───────── */

type Env = { nowMs: number; today: string; nowMin: number };
type P = Record<string, number | string>;
const pnum = (p: P, k: string, d: number): number => (typeof p[k] === 'number' ? (p[k] as number) : d);
const pstr = (p: P, k: string, d: string): string => (typeof p[k] === 'string' ? (p[k] as string) : d);
const hmOf = (s: string): number => +s.slice(0, 2) * 60 + +s.slice(3, 5);
const money = (s: string): number => Number(s.replace(/[₪,]/g, ''));
const DAY = 86_400_000;
/** "16/10" ⇒ מספר-יום, בשנה שהכי קרובה להיום. */
function dayOfDm(dmText: string, todayIso: string): number {
  const [d, m] = dmText.split('/').map(Number);
  const t0 = Date.parse(todayIso + 'T12:00:00Z');
  const y = Number(todayIso.slice(0, 4));
  let best = NaN;
  for (const yy of [y - 1, y, y + 1]) {
    const t = Date.UTC(yy, m - 1, d, 12);
    if (!Number.isFinite(best) || Math.abs(t - t0) < Math.abs(best - t0)) best = t;
  }
  return Math.floor(best / DAY);
}
const todayDay = (env: Env): number => Math.floor(Date.parse(env.today + 'T12:00:00Z') / DAY);
/** כמה שורות היו לפני הקיצוץ ("ועוד N"). */
const totalLines = (lines: string[]): number => {
  const m = /^ועוד (\d+)$/.exec(lines[lines.length - 1] ?? '');
  return m ? lines.length - 1 + Number(m[1]) : lines.length;
};
const realLines = (lines: string[]): string[] => lines.filter((l) => !/^ועוד \d+$/.test(l));

/** משך בעברית ⇒ דקות ("שעתיים, 5 דקות ו-5 שניות"). */
export function parseDuration(t: string): number | null {
  if (t === 'רבע שעה') return 15;
  if (t === 'חצי שעה') return 30;
  let total = 0;
  let any = false;
  for (const part of t.replace(/ ו-/g, ', ').split(', ')) {
    let m: RegExpExecArray | null;
    if (part === 'שעה') total += 60;
    else if (part === 'שעתיים') total += 120;
    else if ((m = /^(\d+) שעות$/.exec(part))) total += 60 * +m[1];
    else if ((m = /^(\d+) דקות$/.exec(part))) total += +m[1];
    else if ((m = /^(\d+) שניות$/.exec(part))) total += +m[1] / 60;
    else return null;
    any = true;
  }
  return any ? total : null;
}

/** "₪1,200 = 3 × ₪400" ⇒ { total, pieces }. */
function installments(line: string): { total: number; pieces: number[] } | null {
  const m = /(₪[\d,]+(?:\.\d+)?) = (.+)$/.exec(line);
  if (!m) return null;
  const pieces: number[] = [];
  for (const g of m[2].split(' + ')) {
    const x = /^(?:(\d+) × )?(₪[\d,]+(?:\.\d+)?)$/.exec(g.trim());
    if (!x) return null;
    for (let k = 0; k < (x[1] ? +x[1] : 1); k++) pieces.push(money(x[2]));
  }
  return { total: money(m[1]), pieces };
}

function checkInstallments(pv: Preview, p: P): string | null {
  for (const line of realLines(pv.lines)) {
    const it = installments(line);
    if (!it) return 'שורת-תשלומים לא נקראת: ' + line;
    const s = it.pieces.reduce((a, b) => a + b, 0);
    if (Math.round(s * 100) !== Math.round(it.total * 100)) return 'התשלומים מסתכמים ל-' + s.toFixed(2) + ' ולא ל-' + it.total + ': ' + line;
    if (pstr(p, 'by', 'parts') === 'size') {
      const size = pnum(p, 'size', 30);
      if (it.pieces.slice(0, -1).some((x) => Math.abs(x - size) > 0.005)) return 'תשלום שאינו בגודל ' + size + ': ' + line;
      if (it.pieces[it.pieces.length - 1] > size + 0.005) return 'התשלום האחרון גדול מ-' + size + ': ' + line;
    } else {
      const parts = Math.floor(pnum(p, 'parts', 12));
      if (it.pieces.length !== parts) return it.pieces.length + ' תשלומים ולא ' + parts + ': ' + line;
      const frac = it.total - Math.trunc(it.total);
      const core = [it.pieces[0] - frac, ...it.pieces.slice(1)];
      if (Math.max(...core) - Math.min(...core) > 1.005) return 'תשלומים לא שווים (הפרש > ₪1): ' + line;
    }
  }
  return null;
}

function checkSpanPieces(pieces: { from: number; to: number }[], gap: number, label: string): string | null {
  for (let k = 1; k < pieces.length; k++) if (pieces[k].from - pieces[k - 1].to !== gap) return label + ': בין חלק ' + k + ' לקודם ' + (pieces[k].from - pieces[k - 1].to) + ' דקות ולא ' + gap;
  return null;
}

/** "סוף …" ⇒ למטה; השאר ⇒ למעלה; "לקרוב" בכותרת ⇒ לקרוב. */
function roundOk(src: number, res: number, step: number, dir: string): boolean {
  const t = 1e-6 + 1 / 120; // שניות מוצגות בעיגול-למטה ⇒ חצי שנייה
  if (Number.isInteger(step) && step >= 1 && Math.abs(res / step - Math.round(res / step)) > 1e-9) return false;
  if (dir === 'down') return res <= src + t && src - res < step + t;
  if (dir === 'up') return res >= src - t && res - src < step + t;
  return Math.abs(res - src) <= step / 2 + t;
}

const CONSISTENCY: Readonly<Record<string, (pv: Preview, p: P, env: Env) => string | null>> = {
  'bookings.balance:divide': checkInstallments,
  'bookings.total:divide': checkInstallments,
  'whatNeed.adPrice:divide': checkInstallments,
  'bookings.turnover:divide': (pv, p) => {
    // חלון ריק (כניסה לא אחרי עזיבה) ⇒ שורה אחת שאומרת את זה, בלי תורים
    if (pv.title === 'חלון הניקיון') return pv.lines.length === 1 && pv.lines[0].startsWith('שעת הכניסה בהגדרות') ? null : 'חלון ריק עם תורים';
    const m = /^חלון הניקיון (\d\d:\d\d)–(\d\d:\d\d) · (\d+) תורים$/.exec(pv.title);
    if (!m) return 'כותרת לא נקראת';
    const pieces = realLines(pv.lines).map((l) => /^(\d\d:\d\d)–(\d\d:\d\d)/.exec(l)!).map((x) => ({ from: hmOf(x[1]), to: hmOf(x[2]) }));
    if (+m[3] !== totalLines(pv.lines)) return 'בכותרת ' + m[3] + ' תורים ובשורות ' + totalLines(pv.lines);
    if (pieces[0].from !== hmOf(m[1])) return 'התור הראשון לא מתחיל בתחילת החלון';
    const bySize = pstr(p, 'by', 'parts') === 'size';
    if (!bySize && +m[3] !== Math.floor(pnum(p, 'parts', 12))) return m[3] + ' תורים ולא ' + p.parts;
    if (bySize) for (const x of pieces) if (x.to - x.from !== pnum(p, 'size', 30) && !(pstr(p, 'remainder', 'drop') === 'shorten' && x.to === hmOf(m[2]))) return 'תור באורך ' + (x.to - x.from) + ' ולא ' + p.size;
    if (pieces.some((x) => x.to > hmOf(m[2]) || x.from < hmOf(m[1]))) return 'תור מחוץ לחלון';
    return checkSpanPieces(pieces, bySize ? pnum(p, 'gap', 0) : 0, 'חלון הניקיון');
  },
  'zmanim.day:divide': (pv, p) => {
    const m = /^(?:שעה זמנית היום = (.+?)|(\d+) חלקים של (.+?)) · מהנץ (\d\d:\d\d) עד השקיעה (\d\d:\d\d) · /.exec(pv.title);
    if (!m) return pv.title.startsWith('אי אפשר לחשב') ? null : 'כותרת לא נקראת';
    const n = m[1] ? 12 : +m[2];
    const unit = parseDuration(m[1] ?? m[3]);
    const span = hmOf(m[5]) - hmOf(m[4]);
    if (unit === null) return 'משך לא נקרא';
    if (n !== totalLines(pv.lines)) return n + ' חלקים בכותרת ו-' + totalLines(pv.lines) + ' בשורות';
    if (pstr(p, 'by', 'parts') !== 'size' && Math.abs(n * unit - span) > n / 60 + 1e-6) return n + ' × ' + unit + ' ≠ ' + span;
    const pieces = realLines(pv.lines).map((l) => /· (\d\d:\d\d)–(\d\d:\d\d)$/.exec(l)!).map((x) => ({ from: hmOf(x[1]), to: hmOf(x[2]) }));
    if (pieces[0].from !== hmOf(m[4])) return 'החלק הראשון לא מתחיל בנץ';
    return pstr(p, 'by', 'parts') === 'size' ? null : checkSpanPieces(pieces, 0, 'שעות זמניות');
  },
  'zmanim.shabbat:divide': (pv, p) => {
    const m = /מהדלקת הנרות (\d\d:\d\d) עד צאת השבת (\d\d:\d\d) · (\d+) משמרות של (.+)$/.exec(pv.title);
    if (!m) return pv.title.startsWith('אי אפשר לחשב') ? null : 'כותרת לא נקראת';
    const n = +m[3];
    const unit = parseDuration(m[4]);
    const span = 1440 + hmOf(m[2]) - hmOf(m[1]);
    if (unit === null) return 'משך לא נקרא';
    if (n !== totalLines(pv.lines)) return n + ' משמרות בכותרת ו-' + totalLines(pv.lines) + ' בשורות';
    if (pstr(p, 'by', 'parts') !== 'size' && Math.abs(n * unit - span) > n / 60 + 1e-6) return n + ' × ' + unit + ' ≠ ' + span;
    return null;
  },
  'whatNeed.hours:divide': (pv, p) => {
    for (const l of realLines(pv.lines)) {
      const m = /(\d\d:\d\d)–(\d\d:\d\d|.+?) ← (\d+) תורים של (.+)$/.exec(l);
      if (!m) return 'שורה לא נקראת: ' + l;
      const unit = parseDuration(m[4]);
      if (unit === null) return 'משך לא נקרא: ' + l;
      if (!/^\d\d:\d\d$/.test(m[2])) continue;
      let span = hmOf(m[2]) - hmOf(m[1]);
      if (span <= 0) span += 1440;
      const n = +m[3];
      if (pstr(p, 'by', 'parts') !== 'size') {
        if (n !== Math.floor(pnum(p, 'parts', 12))) return n + ' תורים ולא ' + p.parts + ': ' + l;
        if (Math.abs(n * unit - span) > n / 60 + 1e-6) return n + ' × ' + unit + ' ≠ ' + span + ': ' + l;
      } else {
        const size = pnum(p, 'size', 30);
        const gap = pnum(p, 'gap', 0);
        // התור הראשון בגודל שביקשו — אלא אם כל החלון קצר ממנו ובחרו "קצר יותר" (אז התור היחיד = כל החלון)
        const first = pstr(p, 'remainder', 'drop') === 'shorten' && span < size ? span : size;
        if (Math.abs(unit - first) > 1e-6) return 'גודל ' + unit + ' ולא ' + first + ': ' + l;
        const full = Math.floor((span + gap) / (size + gap));
        const want = pstr(p, 'remainder', 'drop') === 'shorten' && full * (size + gap) < span ? full + 1 : full;
        if (n !== want) return n + ' תורים ולא ' + want + ': ' + l;
      }
    }
    return null;
  },
  'zmanim.times:offset': (pv, p) => {
    if (pv.title.startsWith('אי אפשר לחשב')) return /\d\d:\d\d/.test(pv.lines.join(' ')) ? 'אין זמנים — ובכל זאת שעה בשורה' : null;
    const d = pnum(p, 'minutes', -10);
    for (const l of pv.lines) {
      const m = /(\d\d:\d\d) ← (\d\d:\d\d)( \(יום קודם\)| \(למחרת\))?$/.exec(l);
      if (!m) return 'שורה לא נקראת: ' + l;
      const raw = hmOf(m[1]) + d;
      if ((((raw % 1440) + 1440) % 1440) !== hmOf(m[2])) return m[1] + ' + ' + d + ' ≠ ' + m[2];
      const note = raw < 0 ? ' (יום קודם)' : raw >= 1440 ? ' (למחרת)' : undefined;
      if ((m[3] ?? undefined) !== note) return 'סימון-היום שגוי: ' + l;
    }
    return null;
  },
  'whatNeed.openings:offset': (pv, p) => {
    const d = pnum(p, 'minutes', -10);
    for (const l of realLines(pv.lines)) {
      const m = /ב-(\d\d:\d\d|.+?) ← תזכורת ב-(\d\d:\d\d)$/.exec(l);
      if (!m) return 'שורה לא נקראת: ' + l;
      if (!/^\d\d:\d\d$/.test(m[1])) continue;
      if ((((hmOf(m[1]) + d) % 1440) + 1440) % 1440 !== hmOf(m[2])) return m[1] + ' + ' + d + ' ≠ ' + m[2];
    }
    return null;
  },
  'bookings.arrivals:offset': (pv, p, env) => {
    const d = pnum(p, 'minutes', -10);
    for (const l of realLines(pv.lines)) {
      const m = /הגעה (\d+\/\d+) (\d\d:\d\d) ⇒ תזכורת (\d+\/\d+) (\d\d:\d\d)$/.exec(l);
      if (!m) return 'שורה לא נקראת: ' + l;
      const a = dayOfDm(m[1], env.today) * 1440 + hmOf(m[2]);
      const b = dayOfDm(m[3], env.today) * 1440 + hmOf(m[4]);
      if (b - a !== d) return 'התזכורת ' + (b - a) + ' דקות מההגעה ולא ' + d + ': ' + l;
    }
    return null;
  },
  'bookings.arrivals:round': (pv, p) => {
    const step = pnum(p, 'step', 1);
    const dir = pstr(p, 'dir', 'down');
    for (const l of realLines(pv.lines)) {
      const m = /(\d\d:\d\d) ⇒ (\d\d:\d\d)$/.exec(l);
      if (!m) return 'שורה לא נקראת: ' + l;
      // הצגה מודולו יממה: 23:50 למעלה לשעה ⇒ 00:00
      const src = hmOf(m[1]);
      const res = hmOf(m[2]) + (hmOf(m[2]) < src && dir !== 'down' ? 1440 : 0);
      if (step >= 1 && !roundOk(src, res, step, dir)) return m[1] + ' ⇒ ' + m[2] + ' (צעד ' + step + ', ' + dir + ')';
    }
    return null;
  },
  'zmanim.times:round': (pv, p) => {
    const step = pnum(p, 'step', 1);
    const nearest = pstr(p, 'dir', 'down') === 'nearest';
    for (const l of pv.lines) {
      const m = /^(.+) (\d\d):(\d\d):(\d\d) ← (\d\d:\d\d)$/.exec(l);
      if (!m) return pv.title.startsWith('אי אפשר לחשב') ? null : 'שורה לא נקראת: ' + l;
      const src = +m[2] * 60 + +m[3] + +m[4] / 60;
      const dir = nearest ? 'nearest' : m[1].startsWith('סוף') ? 'down' : 'up';
      if (step >= 1 && !roundOk(src, hmOf(m[5]), step, dir)) return l + ' (צעד ' + step + ', ' + dir + ')';
    }
    return null;
  },
  'bookings.balance:round': (pv, p) => moneyRound(pv, p, '⇒'),
  'bookings.total:round': (pv, p) => moneyRound(pv, p, '⇒'),
  'whatNeed.adPrice:round': (pv, p) => moneyRound(pv, p, '←'),
  'bookings.stay:divide': (pv, _p, env) => {
    for (const l of realLines(pv.lines)) {
      const m = /(\d+\/\d+)–(\d+\/\d+) ⇒ ניקיון ב-(.+)$/.exec(l);
      if (!m) return 'שורה לא נקראת: ' + l;
      const a = dayOfDm(m[1], env.today);
      const b = dayOfDm(m[2], env.today);
      let prev = a;
      for (const x of m[3].split(', ').map((t) => dayOfDm(t, env.today))) {
        if (!(x > a && x < b)) return 'ניקיון מחוץ לשהייה: ' + l;
        if (x <= prev && x !== a) return 'ימי-ניקיון לא לפי הסדר: ' + l;
        prev = x;
      }
    }
    return null;
  },
  'bookings.untilArrival:divide': (pv, _p, env) => {
    for (const l of realLines(pv.lines)) {
      const m = /הגעה (\d+\/\d+) ⇒ (.+)$/.exec(l);
      if (!m) return 'שורה לא נקראת: ' + l;
      const arr = dayOfDm(m[1], env.today);
      let prev = -Infinity;
      for (const x of m[2].split(', ').map((t) => dayOfDm(t, env.today))) {
        if (!(x < arr && x >= todayDay(env))) return 'מועד לא בין היום להגעה: ' + l;
        if (x <= prev) return 'מועדים לא לפי הסדר: ' + l;
        prev = x;
      }
    }
    return null;
  },
  'bookings.nights:merge': (pv, p) => {
    const min = pnum(p, 'minLength', 1);
    for (const l of realLines(pv.lines)) {
      const m = /פנוי (\d+) לילות ברצף/.exec(l);
      if (m && +m[1] < min) return 'קבוצה של ' + m[1] + ' קצרה מ-' + min + ': ' + l;
    }
    return null;
  },
  'bookings.arrivals:next': (pv, _p, env) => {
    for (const l of pv.lines) {
      const m = /^היום (\d\d:\d\d) · /.exec(l);
      if (m && hmOf(m[1]) < env.nowMin) return 'ההגעה "הבאה" כבר עברה: ' + l;
      const d = /^(\d+\/\d+) \d\d:\d\d · /.exec(l);
      if (d && dayOfDm(d[1], env.today) <= todayDay(env)) return 'ההגעה "הבאה" לא אחרי היום: ' + l;
    }
    return null;
  },
  'zmanim.times:next': (pv) => {
    const now = /עכשיו (\d\d:\d\d)/.exec(pv.title);
    if (!now) return pv.title.startsWith('אי אפשר לחשב') ? null : 'כותרת לא נקראת';
    for (const l of pv.lines) {
      if (/^(הזמן הבא: )?מחר · /.test(l)) continue;
      const m = /(\d\d:\d\d)$/.exec(l);
      if (!m) return 'שורה לא נקראת: ' + l;
      if (hmOf(m[1]) <= hmOf(now[1])) return 'הזמן "הבא" לא אחרי עכשיו (' + now[1] + '): ' + l;
    }
    return null;
  },
  'whatNeed.openings:next': (pv, _p, env) => {
    for (const l of pv.lines) {
      const m = / · היום ב-(\d\d:\d\d)$/.exec(l);
      if (m && hmOf(m[1]) <= env.nowMin) return 'העסק "הבא" כבר נפתח: ' + l;
    }
    return null;
  },
  'bookings.cleaning:escalate': (pv, _p, env) => deadlines(pv, env),
  'bookings.faults:escalate': (pv, _p, env) => deadlines(pv, env),
  'bookings.unpaid:escalate': (pv, _p, env) => deadlines(pv, env),
  'whatNeed.requests:escalate': (pv, _p, env) => deadlines(pv, env),
  'zmanim.closedDays:merge': (pv, _p, env) => windowsInOrder(pv, env),
  'zmanim.closedDays:next': (pv, _p, env) => windowsInOrder(pv, env),
  'bookings.sacredDays:merge': (pv, _p, env) => windowsInOrder(pv, env),
  'bookings.sacredDays:next': (pv, _p, env) => windowsInOrder(pv, env),
  'bookings.guestStays:merge': (pv, _p, env) => nightsMatch(pv, env, /שהייה אחת (\d+\/\d+)–(\d+\/\d+) \((\d+) לילות\)/),
  'bookings.unitStays:next': (pv, _p, env) => {
    const bad = nightsMatch(pv, env, /ההזמנה הבאה: (\d+\/\d+)–(\d+\/\d+) \((\d+) לילות\)/);
    if (bad) return bad;
    for (const l of realLines(pv.lines)) {
      const m = /ההזמנה הבאה: (\d+\/\d+)–/.exec(l);
      if (m && dayOfDm(m[1], env.today) < todayDay(env)) return 'ההזמנה "הבאה" התחילה לפני היום: ' + l;
    }
    return null;
  },
  'bookings.nights:next': (pv, p, env) => {
    for (const l of realLines(pv.lines)) {
      const m = /הבא(?:ים)?: (.+)$/.exec(l) ?? /פנויים ברצף מ-(\d+\/\d+)/.exec(l);
      if (!m) return 'שורה לא נקראת: ' + l;
      const days = m[1].split(', ').map((x) => (x === 'הלילה' ? todayDay(env) : dayOfDm(x, env.today)));
      if (days.some((d) => d < todayDay(env))) return 'לילה "הבא" לפני היום: ' + l;
      if (days.length > Math.max(1, pnum(p, 'count', 1))) return 'יותר לילות ממה שביקשו: ' + l;
      for (let k = 1; k < days.length; k++) if (days[k] <= days[k - 1]) return 'לא לפי הסדר: ' + l;
    }
    return null;
  },
  'bookings.cleaning:rotate': (pv, p) => rotateDays(pv, p),
  'bookings.faults:rotate': (pv, p) => rotateDays(pv, p),
  'bookings.unpaid:rotate': (pv, p) => rotateDays(pv, p),
};

/** חלונות "מ-X עד Y": כל חלון נגמר אחרי שהתחיל, והחלונות לפי הסדר בלי חפיפה (חוק 🔗). */
function windowsInOrder(pv: Preview, env: Env): string | null {
  let prevEnd = -Infinity;
  for (const l of realLines(pv.lines)) {
    const m = /מ-(\d+\/\d+) (\d\d:\d\d) עד (\d+\/\d+) (\d\d:\d\d)/.exec(l);
    if (!m) continue;
    const a = dayOfDm(m[1], env.today) * 1440 + hmOf(m[2]);
    const b = dayOfDm(m[3], env.today) * 1440 + hmOf(m[4]);
    if (b <= a) return 'חלון שנגמר לפני שהתחיל: ' + l;
    if (a < prevEnd) return 'חלונות חופפים / לא לפי הסדר: ' + l;
    prevEnd = b;
  }
  return null;
}

/** "A–B (N לילות)": N = מספר הלילות בין A ל-B. */
function nightsMatch(pv: Preview, env: Env, re: RegExp): string | null {
  for (const l of realLines(pv.lines)) {
    const m = re.exec(l);
    if (m && dayOfDm(m[2], env.today) - dayOfDm(m[1], env.today) !== +m[3]) return m[3] + ' לילות לא מתאים לתאריכים: ' + l;
  }
  return null;
}

function moneyRound(pv: Preview, p: P, arrow: string): string | null {
  const step = pnum(p, 'step', 1);
  const dir = pstr(p, 'dir', 'down');
  for (const l of realLines(pv.lines)) {
    const m = new RegExp('(₪[\\d,]+(?:\\.\\d+)?) ' + arrow + ' (₪[\\d,]+(?:\\.\\d+)?)$').exec(l);
    if (!m) return 'שורה לא נקראת: ' + l;
    const src = money(m[1]);
    const res = money(m[2]);
    const t = 0.005;
    if (Math.abs(res / step - Math.round(res / step)) > 1e-6) return m[2] + ' לא כפולה של ' + step + ': ' + l;
    if (dir === 'down' && !(res <= src + t && src - res < step + t)) return l + ' (למטה ב-' + step + ')';
    if (dir === 'up' && !(res >= src - t && res - src < step + t)) return l + ' (למעלה ב-' + step + ')';
    if (dir === 'nearest' && Math.abs(res - src) > step / 2 + t) return l + ' (לקרוב ב-' + step + ')';
  }
  return null;
}

/** "אם אין תשובה/אישור עד X" ו"תישלח … ב-X" — אף פעם לא בעבר. */
function deadlines(pv: Preview, env: Env): string | null {
  for (const l of pv.lines) {
    const m = /(?:עד|תישלח ל.+? ב-)((\d+\/\d+) )?(\d\d:\d\d)/.exec(l);
    if (!m) continue;
    const day = m[2] ? dayOfDm(m[2], env.today) : todayDay(env);
    if (day < todayDay(env) || (day === todayDay(env) && hmOf(m[3]) < env.nowMin)) return 'מועד-המעבר כבר עבר: ' + l;
  }
  return null;
}

/** תורות לפי יום: היום / מחר / מחרתיים — מתחלפים לפי הסדר (N בתור ⇒ N שונים ברצף, ואחריהם חוזר). */
function rotateDays(pv: Preview, p: P): string | null {
  const m = /^בתורות לפי יום · (\d+) בתור$/.exec(pv.title);
  if (!m || pstr(p, 'by', 'day') !== 'day') return null;
  const n = +m[1];
  const who = pv.lines.map((l) => l.split(' ⇒ ')[1]);
  for (let k = 1; k < who.length; k++) {
    if (n === 1 && who[k] !== who[0]) return 'אדם אחד בתור אבל התחלף';
    if (n > 1 && k < n && who.slice(0, k).includes(who[k])) return who[k] + ' שוב לפני שכולם קיבלו תור';
    if (k >= n && who[k] !== who[k - n]) return 'הסבב לא חוזר על עצמו כל ' + n;
  }
  return null;
}

/** בדיקות-בסיס על כל תצוגה. */
function basicIssue(pv: Preview): string | null {
  if (typeof pv.title !== 'string' || !pv.title.trim()) return 'בלי כותרת';
  if (!Array.isArray(pv.lines) || !pv.lines.length) return 'בלי שורות';
  if (pv.lines.length > PREVIEW_MAX_LINES) return pv.lines.length + ' שורות (מעל ' + PREVIEW_MAX_LINES + ')';
  const text = [pv.title, ...pv.lines].join('\n');
  if (pv.lines.some((l) => typeof l !== 'string' || !l.trim())) return 'שורה ריקה';
  if (BROKEN.test(text)) return 'ערך שבור: ' + BROKEN.exec(text)![0];
  // "ברצף" מותר; וגם שם של מקצוע/תחום מהקטלוג של הארגון — "מיזוג" = מיזוג אוויר, לא חיבור רצפים — רק במקומות שבהם
  // התצוגה מכניסה שם כזה: "בקשה במיזוג", "מיזוג ← N בקשות", תחום-תקלה "מיזוג/קירור".
  const plain = text.replace(/ברצף/g, '').replace(/בקשה במיזוג|^מיזוג ← |מיזוג\/קירור/gm, '');
  for (const w of BANNED_WORDS) if (plain.includes(w)) return 'מילה טכנית: ' + w;
  return null;
}

/* ───────── רשימת החיבורים ───────── */

export interface ConnTarget {
  key: string;
  /** היכולת שמוצגת (לשרשרת — האחרונה), והיכולות השמורות שבדרך. */
  cap: Capability;
  caps: Capability[];
  atoms: AtomId[];
}

/** כל החיבורים עם תצוגה + כל השרשראות (עד MAX_GENERATIONS) שיש להן חישוב. */
export function connectionTargets(): ConnTarget[] {
  const out: ConnTarget[] = [];
  for (const key of PREVIEW_KEYS) {
    const [place, atom] = key.split(':') as [string, AtomId];
    const engine = place.split('.')[0];
    out.push({ key, cap: { id: capabilityId(engine, place, atom), engine: engine as Capability['engine'], place, atom, params: {}, name: key }, caps: [], atoms: [atom] });
  }
  const walk = (chain: Capability[], v: ChainValue): void => {
    if (chain.length >= MAX_GENERATIONS) return;
    const last = chain[chain.length - 1];
    for (const atom of Object.keys(NEXT_VALUE[v]) as AtomId[]) {
      const place = outputPlaceFor(last, atom)?.id ?? outPlaceId(last.id);
      const child = childCapability(last, place, atom, {}, last.name + '>' + atom);
      out.push({ key: child.id, cap: child, caps: [...chain], atoms: [...chain.map((c) => c.atom), atom] });
      walk([...chain, child], NEXT_VALUE[v][atom]!);
    }
  };
  for (const [k, v] of Object.entries(ROOT_VALUE)) {
    const [place, atom] = k.split(':') as [string, AtomId];
    walk([{ id: capabilityId('bookings', place, atom), engine: 'bookings', place, atom, params: {}, name: k }], v);
  }
  return out;
}

/* ───────── ההרצה ───────── */

export interface ConnFailure {
  db: string;
  params: Record<string, Record<string, number | string>>;
  why: string;
  title?: string;
  lines?: string[];
}

export interface ConnReport {
  /** הערכות (DB × פרטים). */
  evals: number;
  /** כמה מהן נתנו תצוגה (לא null). */
  shown: number;
  /** בדיקות שבוצעו: לכל הערכה — זורק? · בסיס · פרטיות · עקביות (+ דטרמיניזם בפרטי ברירת-המחדל). */
  checks: number;
  passed: number;
  failures: ConnFailure[];
}

export interface VerifyConnOpts {
  dbs?: number;
  seed?: number;
  /** כמה סטים של פרטים אקראיים לכל DB (חוץ מברירת-המחדל). */
  paramSets?: number;
  /** אותו דבר לשרשראות (ברירה = paramSets). */
  chainParamSets?: number;
  /** סודות נוספים של ה-DB האמיתי (מעבר למה ש-secretsOf מוצא). */
  secrets?: Partial<OrgSecrets>;
  /** רק חיבורים אלה (מפתח). */
  only?: readonly string[];
}

const mergeSecrets = (a: OrgSecrets, b: Partial<OrgSecrets> = {}): OrgSecrets => ({
  names: [...a.names, ...(b.names ?? [])],
  phones: [...a.phones, ...(b.phones ?? [])],
  emails: [...a.emails, ...(b.emails ?? [])],
  texts: [...a.texts, ...(b.texts ?? [])],
});

export function verifyConnections(ctx: PreviewCtx, opts: VerifyConnOpts = {}): Record<string, ConnReport> {
  const seed = opts.seed ?? DEFAULT_SEED;
  const nDbs = opts.dbs ?? 50;
  const paramSets = opts.paramSets ?? 2;
  const targets = connectionTargets().filter((t) => !opts.only || opts.only.includes(t.key));
  const worlds: { name: string; ctx: PreviewCtx; secrets: OrgSecrets }[] = [{ name: 'האמיתי', ctx, secrets: mergeSecrets(secretsOf(ctx.db), opts.secrets) }];
  for (let k = 0; k < nDbs; k++) {
    const w = randomOrgDb(ctx.db as Db, subSeed(seed, 'db' + k));
    worlds.push({ name: 'אקראי #' + (k + 1), ctx: { db: w.db, config: ctx.config, nowMs: w.nowMs }, secrets: mergeSecrets(secretsOf(w.db), w.secrets) });
  }
  const out: Record<string, ConnReport> = {};
  for (const t of targets) {
    const rep: ConnReport = { evals: 0, shown: 0, checks: 0, passed: 0, failures: [] };
    const r = rng(subSeed(seed, 'params:' + t.key));
    const sets = t.caps.length ? (opts.chainParamSets ?? paramSets) : paramSets;
    for (const w of worlds) {
      for (let s = 0; s <= sets; s++) {
        const chain = [...t.caps, t.cap].map((c) => ({ ...c, params: s === 0 ? {} : randomParams(c.atom, r) }));
        const cap = chain[chain.length - 1];
        const cctx: PreviewCtx = { ...w.ctx, caps: chain.slice(0, -1) };
        const params = Object.fromEntries(chain.map((c) => [c.atom + (chain.indexOf(c) ? '#' + chain.indexOf(c) : ''), c.params]));
        const fail = (why: string, pv?: Preview | null): void => {
          if (rep.failures.length < 5) rep.failures.push({ db: w.name, params, why, title: pv?.title, lines: pv?.lines });
        };
        // דטרמיניזם נבדק על פרטי ברירת-המחדל (חישוב שני של אותה תצוגה); השאר — 4 בדיקות
        const checks = s === 0 ? 5 : 4;
        rep.evals++;
        rep.checks += checks;
        let pv: Preview | null;
        try {
          pv = previewStrict(cap, cctx);
        } catch (e) {
          fail('זרק: ' + (e instanceof Error ? e.message : String(e)));
          continue;
        }
        let ok = 1; // לא זרק
        if (!pv) {
          rep.passed += checks;
          continue;
        }
        rep.shown++;
        const now = israelNow(w.ctx.nowMs);
        const env: Env = { nowMs: w.ctx.nowMs, today: now.iso, nowMin: now.minute };
        const issues = [
          basicIssue(pv),
          privacyLeak([pv.title, ...pv.lines].join('\n'), w.secrets),
          t.caps.length ? null : safe(() => CONSISTENCY[t.key]?.(pv!, paramsOf(cap), env) ?? null),
          ...(s === 0 ? [JSON.stringify(previewStrict(cap, cctx)) === JSON.stringify(pv) ? null : 'לא דטרמיניסטי'] : []),
        ];
        for (const why of issues) {
          if (why) fail(why, pv);
          else ok++;
        }
        rep.passed += ok;
      }
    }
    out[t.key] = rep;
  }
  return out;
}

function safe(f: () => string | null): string | null {
  try {
    return f();
  } catch (e) {
    return 'בדיקת-העקביות זרקה: ' + (e instanceof Error ? e.message : String(e));
  }
}

/* ═══════════════ סיכום לחותמת ═══════════════ */

export interface VerifySummary {
  atoms: Record<string, { cases: number; passed: number }>;
  connections: Record<string, { checks: number; passed: number }>;
}

export function verifySummary(atoms: Record<string, AtomReport>, conns: Record<string, ConnReport>): VerifySummary {
  return {
    atoms: Object.fromEntries(Object.entries(atoms).map(([k, v]) => [k, { cases: v.cases, passed: v.passed }])),
    connections: Object.fromEntries(Object.entries(conns).map(([k, v]) => [k, { checks: v.checks, passed: v.passed }])),
  };
}

/** "✅ מאומת" — חיבור שכל הבדיקות שלו עברו, וכל החלקים שבו עברו את כל החוקים. */
export function isVerified(key: string, s: VerifySummary): boolean {
  const c = s.connections[key];
  if (!c || c.checks === 0 || c.passed !== c.checks) return false;
  const atoms = key.includes('>') ? key.split(':').slice(-1)[0].split('>') : [key.split(':')[1]];
  return atoms.every((a) => {
    const x = s.atoms[a];
    return !!x && x.cases > 0 && x.passed === x.cases;
  });
}

