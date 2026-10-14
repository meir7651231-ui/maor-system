/**
 * 🏭 המפעל · עקביות לחיבורים של המנועים שנמצאו אוטומטית (ATOMS-FACTORY, 14.10.2026).
 *
 * כמו `CONSISTENCY` של המאמת לחיבורי-היד — המספרים שבשורות מול החוקים של החלק — אבל לפי הסוג ולא לפי מקום, כי התצוגה הכללית
 * (`decompose/genericPreview.ts`) כותבת את אותה צורה לכל מקום מאותו סוג:
 *  · ✂️ סכום — כל "₪X = …" מסתכם ל-X (עד האגורה), כמה שביקשו, הפרש ≤ יחידה / כל תשלום בגודל והאחרון לא גדול ממנו;
 *  · ✂️ טווח — כמה חלקים שביקשו, וכל חלק מתחיל איפה שהקודם נגמר;
 *  · 🎯 — כפולה של היחידה ובכיוון שנבחר (סכומים ושעות);
 *  · ⏭️ — "הבא" לא היום ולא בעבר, והתאריך = היום + "בעוד N ימים"; שעה "הבא היום" אחרי עכשיו;
 *  · ⏱️ — התזכורת = המועד (09:00) + ההזזה; שעה = השעה ± הדקות;
 *  · 🔗 — כל קבוצה ארוכה לפחות כמו שביקשו, ו"אצל k מתוך M" עם k ≤ M;
 *  · 🔄 — לפי יום: יום אחרי יום ⇒ איש-הצוות הבא; לפי פריט: התורות לפי הסדר, הסכום = כמה שמחכים, הפרש ≤ 1;
 *  · 📣 — מי שמחכה אצל כל שלב ≤ כמה שמחכים, והמעבר הבא לא בעבר;
 *  · 🔍 — נמצאו ≤ מתוך.
 * מחזיר null (תקין) או מה נשבר. טהור.
 */
import type { AtomId } from '../contract';
import type { GenPlace } from '../decompose/types';
import { STAFF, DAY_ANCHOR_MIN } from '../decompose/genericPreview';

type P = Record<string, number | string>;
export interface GenEnv {
  today: string;
  nowMin: number;
}

const DAY = 86_400_000;
const pnum = (p: P, k: string, d: number): number => (typeof p[k] === 'number' ? (p[k] as number) : d);
const pstr = (p: P, k: string, d: string): string => (typeof p[k] === 'string' ? (p[k] as string) : d);
const val = (s: string): number => Number(s.replace(/[₪$,\s]/g, ''));
const hmOf = (s: string): number => +s.split(':')[0] * 60 + +s.split(':')[1];
const dayIdx = (iso: string): number => Math.floor(Date.parse(iso + 'T12:00:00Z') / DAY);
const dmOfDay = (d: number): string => {
  const x = new Date(d * DAY);
  return x.getUTCDate() + '/' + (x.getUTCMonth() + 1);
};
const close = (a: number, b: number, eps: number): boolean => Math.abs(a - b) <= eps;

/** "₪1,234.5 = ₪412.5 + 2 × ₪411" ⇒ { total, pieces }. */
function splitLine(line: string): { total: number; pieces: number[] } | null {
  const [lhs, rhs] = line.split(' = ');
  if (rhs === undefined) return null;
  const pieces: number[] = [];
  for (const term of rhs.split(' + ')) {
    const m = /^(\d+) × (.+)$/.exec(term.trim());
    const n = m ? +m[1] : 1;
    const v = val(m ? m[2] : term);
    if (!Number.isFinite(v)) return null;
    for (let i = 0; i < n; i++) pieces.push(v);
  }
  const total = val(lhs);
  return Number.isFinite(total) ? { total, pieces } : null;
}

function amountDivide(lines: string[], p: P): string | null {
  for (const l of lines.filter((x) => x.includes(' = '))) {
    const s = splitLine(l);
    if (!s) return 'שורת-תשלומים לא נקראת: ' + l;
    const sum = s.pieces.reduce((a, b) => a + b, 0);
    if (!close(sum, s.total, 0.006 * s.pieces.length)) return 'הסכום לא מסתכם: ' + l;
    if (pstr(p, 'by', 'parts') === 'size') {
      const size = pnum(p, 'size', 30);
      if (s.pieces.slice(0, -1).some((x) => !close(x, size, 0.006)) || s.pieces[s.pieces.length - 1] > size + 0.006) return 'תשלום לא בגודל שביקשו: ' + l;
    } else {
      if (s.pieces.length !== pnum(p, 'parts', 12)) return 'לא כמה שביקשו (' + pnum(p, 'parts', 12) + '): ' + l;
      // השבר שקטן מיחידה נשאר בתשלום הראשון (חוק amount.equal של המאמת) — מעבר לו, הפרש ≤ יחידה
      const frac = s.total - Math.floor(s.total);
      if (Math.max(...s.pieces) - Math.min(...s.pieces) > 1 + frac + 0.006) return 'תשלומים לא שווים: ' + l;
    }
  }
  return null;
}

function roundOk(src: number, res: number, step: number, dir: string, eps: number): boolean {
  const q = res / step;
  if (step >= 0.01 && Math.abs(q - Math.round(q)) > 1e-6 && !close(res, Math.round(q) * step, eps)) return false;
  if (dir === 'down') return res <= src + eps && src - res < step + eps;
  if (dir === 'up') return res >= src - eps && res - src < step + eps;
  return Math.abs(res - src) <= step / 2 + eps;
}

function amountRound(lines: string[], p: P): string | null {
  const step = pnum(p, 'step', 1);
  const dir = pstr(p, 'dir', 'down');
  for (const l of lines.filter((x) => x.includes(' ← '))) {
    const [a, b] = l.split(' ← ').map(val);
    // הערך המוצג מעוגל לאגורה — סובלנות של אגורה
    if (!Number.isFinite(a) || !Number.isFinite(b) || !roundOk(a, b, step, dir, 0.0051)) return 'עיגול שגוי (' + step + ', ' + dir + '): ' + l;
  }
  return null;
}

/** "הבא: 28/7 (בעוד 4 ימים)" — לא היום ולא בעבר, והתאריך = היום + N. */
function nextDates(lines: string[], env: GenEnv): string | null {
  const t = dayIdx(env.today);
  for (const l of lines) {
    const m = /^הבא: (\d{1,2}\/\d{1,2}) \(בעוד (?:(\d+) ימים|יום אחד)\)$/.exec(l);
    if (!m) continue;
    const n = m[2] ? +m[2] : 1;
    if (!(n >= 1)) return '"הבא" לא בעתיד: ' + l;
    if (dmOfDay(t + n) !== m[1]) return 'התאריך לא תואם "בעוד ' + n + '": ' + l;
  }
  return null;
}

function clockLines(atom: AtomId, lines: string[], p: P, env: GenEnv): string | null {
  for (const l of lines) {
    let m: RegExpExecArray | null;
    if (atom === 'next' && (m = /^הבא היום: (\d{2}:\d{2})$/.exec(l)) && hmOf(m[1]) <= env.nowMin) return '"הבא היום" כבר עבר: ' + l;
    if (atom === 'offset' && (m = /^(\d{2}:\d{2}) \((\d+) דקות (לפני|אחרי) (\d{2}:\d{2})\)$/.exec(l))) {
      const d = pnum(p, 'minutes', -10);
      if (+m[2] !== Math.abs(d) || (((hmOf(m[4]) + d) % 1440) + 1440) % 1440 !== hmOf(m[1])) return 'ההזזה לא נכונה: ' + l;
    }
    if (atom === 'round' && (m = /^(\d{2}:\d{2}) ← (\d{2}:\d{2})$/.exec(l))) {
      const step = pnum(p, 'step', 1);
      if (step >= 1 && Number.isInteger(step) && hmOf(m[2]) % step !== 0 && (hmOf(m[2]) + 1440) % step !== 0) return 'שעה לא עגולה ל-' + step + ': ' + l;
    }
  }
  return null;
}

function dateOffset(lines: string[], p: P, env: GenEnv): string | null {
  const d = pnum(p, 'minutes', -10);
  const t = dayIdx(env.today);
  for (const l of lines) {
    const m = /^תזכורת (\d{1,2}\/\d{1,2}) (\d{2}):(\d{2}) · למועד (\d{1,2}\/\d{1,2})$/.exec(l);
    if (!m) return 'שורת-תזכורת לא נקראת: ' + l;
    // המועד בשנה הקרובה קדימה (התזכורות הן למועדים הבאים)
    let target = -1;
    for (let k = 0; k <= 400 * 3; k++) if (dmOfDay(t + k) === m[4]) {
      target = t + k;
      break;
    }
    if (target < 0) continue;
    const abs = target * 1440 + DAY_ANCHOR_MIN + d;
    const day = Math.floor(abs / 1440);
    if (dmOfDay(day) !== m[1] || abs - day * 1440 !== +m[2] * 60 + +m[3]) return 'התזכורת לא = המועד + ' + d + ' דקות: ' + l;
  }
  return null;
}

function spanDivide(lines: string[], p: P): string | null {
  const head = /⇐ (\d+) חלקים$/.exec(lines[0] ?? '');
  if (!head) return 'כותרת-חלוקה לא נקראת: ' + lines[0];
  if (pstr(p, 'by', 'parts') !== 'size' && +head[1] !== pnum(p, 'parts', 12)) return 'לא כמה חלקים שביקשו: ' + lines[0];
  // לפי מספר חלקים / בלי הפסקה — כל חלק מתחיל איפה שהקודם נגמר; לפי גודל — כל חלק בגודל (חוץ מהאחרון ב"קצר יותר")
  const bySize = pstr(p, 'by', 'parts') === 'size';
  const rows = lines.slice(1).map((l) => /^\d+\. (.+)–(.+) \((.+)\)$/.exec(l)).filter((x): x is RegExpExecArray => !!x);
  for (let i = 0; i < rows.length; i++) {
    if ((!bySize || pnum(p, 'gap', 0) === 0) && i > 0 && rows[i][1] !== rows[i - 1][2]) return 'חלק לא מתחיל איפה שהקודם נגמר: ' + rows[i][0];
    const len = /^(\d+(?:\.\d+)?)/.exec(rows[i][3]);
    const size = pnum(p, 'size', 30);
    const shown = len ? +len[1] : /^יום אחד$/.test(rows[i][3]) ? 1 : NaN;
    if (bySize && Number.isFinite(shown) && Number.isInteger(size) && shown !== size && !(pstr(p, 'remainder', 'drop') === 'shorten' && shown < size)) return 'חלק לא בגודל ' + size + ': ' + rows[i][0];
  }
  return null;
}

function seqMerge(lines: string[], p: P): string | null {
  const min = Math.max(2, pnum(p, 'minLength', 1));
  for (const l of lines) {
    let m: RegExpExecArray | null;
    if ((m = /^(\d+) (ימים|שבועות|חודשים) ברצף: /.exec(l)) && +m[1] < min) return 'קבוצה קצרה מ-' + min + ': ' + l;
    if ((m = /^אצל (\d+) מתוך (\d+) /.exec(l)) && +m[1] > +m[2]) return 'יותר ממה שיש: ' + l;
  }
  return null;
}

function seqRotate(lines: string[], p: P, env: GenEnv): string | null {
  const rows = lines.map((l) => /^(\d{1,2}\/\d{1,2}) ⇐ (.+)$/.exec(l)).filter((x): x is RegExpExecArray => !!x);
  for (let i = 0; i < rows.length; i++) {
    const s = STAFF.indexOf(rows[i][2] as (typeof STAFF)[number]);
    if (s < 0) return 'לא איש-צוות: ' + rows[i][0];
    if (pstr(p, 'by', 'day') !== 'day' && s !== i % STAFF.length) return 'התורות לא לפי הסדר: ' + rows[i][0];
  }
  void env;
  return null;
}

function waitingLines(atom: AtomId, lines: string[], p: P, env: GenEnv): string | null {
  if (atom === 'escalate') {
    const total = /^(\d+) מחכים לתשובה$/.exec(lines[0] ?? '');
    if (!total) return 'כותרת-המתנה לא נקראת: ' + lines[0];
    let sum = 0;
    for (const l of lines.slice(1)) {
      let m: RegExpExecArray | null;
      if ((m = /^(\d+) אצל /.exec(l))) sum += +m[1];
      if ((m = /^המעבר הבא: (\d{1,2}\/\d{1,2}) (\d{2}:\d{2})$/.exec(l))) {
        const t = dayIdx(env.today);
        let ok = false;
        for (let k = 0; k <= 800 && !ok; k++) if (dmOfDay(t + k) === m[1] && (k > 0 || hmOf(m[2]) >= env.nowMin)) ok = true;
        if (!ok) return 'המעבר הבא בעבר: ' + l;
      }
    }
    if (sum > +total[1]) return 'יותר אצל השלבים ממה שמחכים: ' + lines.join(' / ');
    return null;
  }
  if (atom === 'rotate' && pstr(p, 'by', 'day') !== 'day') {
    const total = /^(\d+) מחכים, בתורות:$/.exec(lines[0] ?? '');
    if (!total) return 'כותרת-תורות לא נקראת: ' + lines[0];
    const counts = lines.slice(1).map((l) => /: (\d+)$/.exec(l)).map((m) => (m ? +m[1] : NaN));
    const sum = counts.reduce((a, b) => a + b, 0);
    const full = [...counts, ...Array(Math.max(0, STAFF.length - counts.length)).fill(0)];
    if (sum !== +total[1] || Math.max(...full) - Math.min(...full) > 1) return 'התורות לא הוגנות: ' + lines.join(' / ');
  }
  return null;
}

function textLines(lines: string[]): string | null {
  for (const l of lines) {
    const m = /נמצאו (\d+) מתוך (\d+)/.exec(l);
    if (m && +m[1] > +m[2]) return 'נמצאו יותר ממה שיש: ' + l;
  }
  return null;
}

/** העקביות של תצוגה כללית: null = תקין. */
export function genericConsistency(place: Pick<GenPlace, 'kind' | 'spec'>, atom: AtomId, lines: string[], p: P, env: GenEnv): string | null {
  switch (place.kind) {
    case 'amount':
      return atom === 'divide' ? amountDivide(lines, p) : atom === 'round' ? amountRound(lines, p) : null;
    case 'times':
      if (place.spec.unit === 'clock') return clockLines(atom, lines, p, env);
      return atom === 'next' ? nextDates(lines, env) : atom === 'offset' ? dateOffset(lines, p, env) : null;
    case 'span':
      return atom === 'divide' ? spanDivide(lines, p) : null;
    case 'sequence':
      return atom === 'merge' ? seqMerge(lines, p) : atom === 'next' ? nextDates(lines, env) : atom === 'rotate' ? seqRotate(lines, p, env) : null;
    case 'waiting':
      return waitingLines(atom, lines, p, env);
    case 'text':
      return textLines(lines);
  }
  return null;
}
