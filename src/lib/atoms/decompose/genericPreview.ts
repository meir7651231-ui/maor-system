/**
 * 🔨 המפרק · התצוגה הכללית (ATOMS-DECOMPOSE, 14.10.2026): "מה החיבור הזה נותן אצלכם" — לכל מקום שהמפרק מצא.
 *
 * `genericPreviewOf(place, atom, params, ctx)` קורא את הנתונים לפי המפרט ההצהרתי של המקום (`extract.ts`) ומריץ עליהם את
 * **החלקים האמיתיים** (`parts/`). מחזיר `{ title, lines }` (עד 6 שורות) או null כשאין תוצאה כנה.
 * "עכשיו" מוזרק (`ctx.nowMs`); התאריך והשעה באזור-הזמן של ישראל. טהור, דטרמיניסטי, לא זורק.
 *
 * 🔒 פרטיות (נאכף בבדיקה): אף פעם לא שם של אדם (משפחה/תורם/אורח/מבקש/מורה), טלפון, מייל, ת״ז או טקסט חופשי.
 * רק ספירות, סכומים, תאריכים ושעות — ומילה מטקסט רק כשהמקום מסומן `echo` (תווית של דבר, ברשומה בלי טלפון: שם חוג, שם יחידה).
 * במצב-צנעה (`ctx.privacyMode`) מקומות של משפחות ומקבלי-סיוע מחזירים null.
 */
import type { AtomId } from '../contract';
import { atomCard } from '../cards';
import { cleanParams } from '../capabilities';
import { divideAmount, divideSpan, type Piece } from '../parts/divide';
import { mergeRuns } from '../parts/merge';
import { nextAfter } from '../parts/next';
import { roundTo, type RoundDir } from '../parts/round';
import { offsetAll } from '../parts/offset';
import { escalationState, type EscStep } from '../parts/escalate';
import { dayIndex, fairAssign, turnOf } from '../parts/rotate';
import { fuzzyFind, normHe } from '../parts/fuzzy';
import { extract } from './extract';
import { MONEY_NAME } from './kinds';
import type { GenPlace } from './types';

export interface GenericCtx {
  db: unknown;
  nowMs: number;
  /** מצב-צנעה פעיל (store.privacyMode) ⇒ מקומות `personal` מוסתרים. */
  privacyMode?: boolean;
}

export interface GenericPreview {
  title: string;
  lines: string[];
}

export const GENERIC_MAX_LINES = 6;
/** אנשי-הצוות בתצוגות של "בתורות" — תוויות כלליות, לא שמות. */
export const STAFF = ['איש צוות א׳', 'איש צוות ב׳', 'איש צוות ג׳'] as const;
/** מועד בלי שעה ⇒ התזכורת מחושבת מ-09:00 בבוקר. */
export const DAY_ANCHOR_MIN = 9 * 60;

const TZ = 'Asia/Jerusalem';
const DAY_MS = 86_400_000;

/* ───────── זמן ותאריך (ישראל) ───────── */

function israel(ms: number): { iso: string; minute: number } {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(Number.isFinite(ms) ? ms : 0))) p[x.type] = x.value;
  return { iso: `${p.year}-${p.month}-${p.day}`, minute: Number(p.hour) * 60 + Number(p.minute) };
}
/** רגע (ms) של תאריך + דקה-ביום בישראל. */
function israelMs(iso: string, minute: number): number {
  const guess = Date.parse(iso + 'T00:00:00Z') + minute * 60_000;
  let ms = guess;
  for (let i = 0; i < 2; i++) {
    const p = israel(ms);
    ms += guess - (Date.parse(p.iso + 'T00:00:00Z') + p.minute * 60_000);
  }
  return ms;
}
const pad = (n: number): string => String(n).padStart(2, '0');
const hm = (min: number): string => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
};
const dm = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? +m[3] + '/' + +m[2] : '';
};
const isoOfDay = (day: number): string => new Date(day * DAY_MS).toISOString().slice(0, 10);
const minOf = (t: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  return m ? +m[1] * 60 + +m[2] : null;
};
const fmtNum = (n: number): string => (Math.round(n * 100) / 100).toLocaleString('en-US');

/* ───────── עזרים ───────── */

const num = (p: Record<string, number | string>, k: string, d: number): number => (typeof p[k] === 'number' && Number.isFinite(p[k] as number) ? (p[k] as number) : d);
const str = (p: Record<string, number | string>, k: string, d: string): string => (typeof p[k] === 'string' ? (p[k] as string) : d);

function capped(lines: string[]): string[] {
  if (lines.length <= GENERIC_MAX_LINES) return lines;
  return [...lines.slice(0, GENERIC_MAX_LINES - 1), 'ועוד ' + (lines.length - GENERIC_MAX_LINES + 1)];
}
const uniq = <T>(xs: readonly T[]): T[] => [...new Set(xs)];
const leaf = (path: string): string => path.replace(/\[\]/g, '').split('.').pop() ?? '';
const daysWord = (n: number): string => (n === 1 ? 'יום אחד' : n + ' ימים');

function divideBy(span: { from: number; to: number }, p: Record<string, number | string>): Piece[] {
  return str(p, 'by', 'parts') === 'size'
    ? divideSpan(span, { size: num(p, 'size', 30), gap: num(p, 'gap', 0), remainder: str(p, 'remainder', 'drop') === 'shorten' ? 'shorten' : 'drop' })
    : divideSpan(span, { parts: num(p, 'parts', 12) });
}

/* ═══════════════ לפי סוג ═══════════════ */

function amountPreview(values: number[], atom: AtomId, p: Record<string, number | string>, cur: '₪' | '$' | ''): string[] | null {
  const pos = values.filter((v) => v > 0);
  if (!pos.length) return null;
  const fmt = (v: number): string => cur + fmtNum(v);
  const what = cur ? 'סכומים' : 'ערכים';
  const sorted = uniq(pos).sort((a, b) => b - a);
  if (atom === 'divide') {
    const picks = uniq([sorted[0], sorted[Math.floor(sorted.length / 2)], sorted[sorted.length - 1]]);
    const lines: string[] = [];
    for (const v of picks) {
      const pieces =
        str(p, 'by', 'parts') === 'size' ? divideBy({ from: 0, to: v }, { ...p, gap: 0, remainder: 'shorten' }).map((x) => x.length) : divideAmount(v, num(p, 'parts', 12), 1);
      // חלק של אפס הוא לא חלוקה (12 = 12 × 1 בכמות קטנה מדי) — מדלגים
      if (!pieces.length || pieces.some((x) => !(x > 0))) continue;
      const groups: { v: number; n: number }[] = [];
      for (const x of pieces) {
        const g = groups[groups.length - 1];
        if (g && g.v === x) g.n++;
        else groups.push({ v: x, n: 1 });
      }
      lines.push(fmt(v) + ' = ' + groups.map((g) => (g.n > 1 ? g.n + ' × ' + fmt(g.v) : fmt(g.v))).join(' + '));
    }
    return lines.length ? [`${pos.length} ${what} · הגדול ${fmt(sorted[0])}`, ...lines] : null;
  }
  if (atom === 'round') {
    const step = num(p, 'step', 1);
    const dir = str(p, 'dir', 'down') as RoundDir;
    const changed = sorted.filter((v) => roundTo(v, step, dir) !== v);
    // הכול כבר עגול ⇒ אין מה להראות (לא נחשב תוצאה)
    if (!changed.length) return null;
    return [`${changed.length} מתוך ${pos.length} ${what} משתנים`, ...changed.slice(0, 4).map((v) => `${fmt(v)} ← ${fmt(roundTo(v, step, dir))}`)];
  }
  return null;
}

function timesPreview(values: string[], unit: 'date' | 'clock', atom: AtomId, p: Record<string, number | string>, now: { iso: string; minute: number }): string[] | null {
  if (unit === 'clock') {
    const mins = uniq(values.map(minOf).filter((x): x is number => x !== null)).sort((a, b) => a - b);
    if (!mins.length) return null;
    if (atom === 'next') {
      const nx = nextAfter(mins, now.minute, num(p, 'count', 1));
      return nx.length ? nx.map((m) => `הבא היום: ${hm(m)}`) : [`היום כבר עבר הכול · מחר הראשון: ${hm(mins[0])}`];
    }
    if (atom === 'offset') {
      const d = num(p, 'minutes', -10);
      const base = nextAfter(mins, now.minute, 3);
      const use = base.length ? base : mins.slice(0, 3);
      return offsetAll(use, d).map((t, i) => `${hm(t)} (${Math.abs(d)} דקות ${d < 0 ? 'לפני' : 'אחרי'} ${hm(use[i])})`);
    }
    if (atom === 'round') {
      const step = num(p, 'step', 1);
      const dir = str(p, 'dir', 'down') as RoundDir;
      const changed = mins.filter((m) => roundTo(m, step, dir) !== m);
      if (!changed.length) return null;
      return changed.slice(0, 5).map((m) => `${hm(m)} ← ${hm(roundTo(m, step, dir))}`);
    }
    return null;
  }
  const days = uniq(values.map((v) => v.slice(0, 10)).filter((v) => /^\d{4}-\d{2}-\d{2}$/.test(v))).sort();
  if (!days.length) return null;
  const today = dayIndex(now.iso);
  if (atom === 'next') {
    const nx = nextAfter(days, now.iso, num(p, 'count', 1));
    if (!nx.length) return null;
    return nx.map((d) => `הבא: ${dm(d)} (בעוד ${daysWord(dayIndex(d) - today)})`);
  }
  if (atom === 'offset') {
    const d = num(p, 'minutes', -10);
    const base = nextAfter(days, now.iso, 3);
    if (!base.length) return null;
    const moments = offsetAll(
      base.map((x) => dayIndex(x) * 1440 + DAY_ANCHOR_MIN),
      d,
    );
    return moments.map((m, i) => `תזכורת ${dm(isoOfDay(Math.floor(m / 1440)))} ${hm(m)} · למועד ${dm(base[i])}`);
  }
  return null;
}

function spanPreview(spans: { from: string | number; to: string | number }[], unit: 'date' | 'clock' | 'number', p: Record<string, number | string>, now: { iso: string }): string[] | null {
  const num_ = (v: string | number): number | null => (unit === 'number' ? (typeof v === 'number' ? v : null) : unit === 'clock' ? minOf(String(v)) : dayIndex(String(v)));
  const rows = spans
    .map((s) => ({ from: num_(s.from), to: num_(s.to) }))
    .filter((s): s is { from: number; to: number } => s.from !== null && s.to !== null && s.to > s.from);
  if (!rows.length) return null;
  let pick = rows[0];
  if (unit === 'date') {
    const t = dayIndex(now.iso);
    const sorted = [...rows].sort((a, b) => a.from - b.from || a.to - b.to);
    pick = sorted.find((r) => r.from <= t && t <= r.to) ?? sorted.find((r) => r.from > t) ?? sorted.reduce((a, b) => (b.to - b.from > a.to - a.from ? b : a));
  }
  let pieces = divideBy(pick, p);
  // בתאריכים חלק קצר מיום הוא לא חלוקה — מנסים את התקופה הארוכה, ואם גם בה לא — אין תוצאה
  const tooShort = (xs: Piece[]): boolean => unit === 'date' && xs.some((x) => x.length < 1);
  if (tooShort(pieces)) {
    pick = rows.reduce((a, b) => (b.to - b.from > a.to - a.from ? b : a));
    pieces = divideBy(pick, p);
    if (tooShort(pieces)) return null;
  }
  if (!pieces.length) return null;
  const f = (v: number): string => (unit === 'date' ? dm(isoOfDay(Math.round(v))) : unit === 'clock' ? hm(v) : fmtNum(v));
  const len = (x: Piece): string => (unit === 'date' ? daysWord(Math.round(x.length)) : unit === 'clock' ? Math.round(x.length) + ' דקות' : fmtNum(x.length));
  const head = `${f(pick.from)}–${f(pick.to)} ⇐ ${pieces.length} חלקים`;
  return [head, ...pieces.slice(0, 4).map((x, i) => `${i + 1}. ${f(x.from)}–${f(x.to)} (${len(x)})`)];
}

type Grain = 'day' | 'week' | 'month';
function grainOf(groups: string[][]): Grain {
  const gaps: number[] = [];
  for (const g of groups) for (let i = 1; i < g.length; i++) gaps.push(dayIndex(g[i]) - dayIndex(g[i - 1]));
  const pos = gaps.filter((x) => x > 0).sort((a, b) => a - b);
  const med = pos.length ? pos[Math.floor(pos.length / 2)] : 1;
  return med >= 20 ? 'month' : med >= 6 ? 'week' : 'day';
}
const unitIndex = (iso: string, g: Grain): number => (g === 'month' ? +iso.slice(0, 4) * 12 + (+iso.slice(5, 7) - 1) : g === 'week' ? Math.floor((dayIndex(iso) + 4) / 7) : dayIndex(iso));
const unitLabel = (i: number, g: Grain): string => (g === 'month' ? `${(i % 12) + 1}/${Math.floor(i / 12)}` : g === 'week' ? 'שבוע ' + dm(isoOfDay(i * 7 - 4)) : dm(isoOfDay(i)));
const GRAIN_HE: Record<Grain, [string, string]> = { day: ['ימים', 'יום'], week: ['שבועות', 'שבוע'], month: ['חודשים', 'חודש'] };

function sequencePreview(groups: string[][], atom: AtomId, p: Record<string, number | string>, now: { iso: string }): string[] | null {
  if (!groups.length) return null;
  if (atom === 'merge') {
    const g = grainOf(groups);
    const maxGap = num(p, 'maxGap', 0);
    const minLength = Math.max(2, num(p, 'minLength', 1));
    const found: { len: number; from: number; to: number }[] = [];
    let withRun = 0;
    for (const grp of groups) {
      const idx = uniq(grp.map((d) => unitIndex(d, g))).sort((a, b) => a - b);
      if (idx.length < 2) continue;
      const lo = idx[0];
      const present = new Set(idx);
      const items = Array.from({ length: Math.min(idx[idx.length - 1] - lo + 1, 5000) }, (_, i) => present.has(lo + i));
      const runs = mergeRuns(items, undefined, { maxGap, minLength });
      if (runs.length) withRun++;
      for (const r of runs) found.push({ len: r.length, from: lo + r.from, to: lo + r.to });
    }
    if (!found.length) return null;
    found.sort((a, b) => b.len - a.len || a.from - b.from);
    const [many] = GRAIN_HE[g];
    return [
      ...(groups.length > 1 ? [`אצל ${withRun} מתוך ${groups.length} יש ${minLength} ${many} או יותר ברצף`] : []),
      ...found.slice(0, 4).map((r) => `${r.len} ${many} ברצף: ${unitLabel(r.from, g)} עד ${unitLabel(r.to, g)}`),
    ];
  }
  const all = uniq(groups.flat()).sort();
  if (atom === 'next') {
    const nx = nextAfter(all, now.iso, num(p, 'count', 1));
    if (!nx.length) return null;
    const t = dayIndex(now.iso);
    return nx.map((d) => `הבא: ${dm(d)} (בעוד ${daysWord(dayIndex(d) - t)})`);
  }
  if (atom === 'rotate') {
    const up = nextAfter(all, now.iso, 6);
    if (!up.length) return null;
    if (str(p, 'by', 'day') === 'day') return up.map((d) => `${dm(d)} ⇐ ${turnOf(STAFF, dayIndex(d))}`);
    return fairAssign(up, STAFF).map((x) => `${dm(x.item)} ⇐ ${x.person}`);
  }
  return null;
}

function waitingPreview(items: { since: string | null }[], atom: AtomId, p: Record<string, number | string>, nowMs: number, now: { iso: string }): string[] | null {
  if (!items.length) return null;
  const sinceMs = (s: string | null): number => {
    if (!s) return -Infinity;
    if (s.length > 10) {
      const t = Date.parse(s);
      return Number.isFinite(t) ? t : -Infinity;
    }
    return israelMs(s, DAY_ANCHOR_MIN);
  };
  if (atom === 'escalate') {
    const steps: EscStep[] = [
      { to: ['האחראי'], waitMin: num(p, 'waitMin', 180) },
      { to: ['המנהל'], waitMin: num(p, 'waitMin', 180) },
      { to: ['כל הצוות'], waitMin: num(p, 'waitMin', 180) },
    ];
    const at = [0, 0, 0];
    let soonest: number | null = null;
    for (const it of items) {
      const st = escalationState({ createdMs: sinceMs(it.since), steps, nowMs, urgentWaitMin: num(p, 'urgentWaitMin', 60) });
      if (st.stepIndex >= 0) at[st.stepIndex]++;
      if (st.nextMoveMs !== null && (soonest === null || st.nextMoveMs < soonest)) soonest = st.nextMoveMs;
    }
    const lines = [`${items.length} מחכים לתשובה`];
    steps.forEach((s, i) => at[i] && lines.push(`${at[i]} אצל ${s.to[0]}`));
    if (soonest !== null) {
      const w = israel(soonest);
      lines.push(`המעבר הבא: ${dm(w.iso)} ${hm(w.minute)}`);
    }
    return lines;
  }
  if (atom === 'rotate') {
    if (str(p, 'by', 'day') === 'day') return [`היום התור של ${turnOf(STAFF, dayIndex(now.iso))}`, `${items.length} מחכים`];
    const order = [...items].sort((a, b) => sinceMs(a.since) - sinceMs(b.since));
    const per = new Map<string, number>();
    for (const x of fairAssign(order, STAFF)) per.set(x.person, (per.get(x.person) ?? 0) + 1);
    return [`${items.length} מחכים, בתורות:`, ...STAFF.filter((s) => per.has(s)).map((s) => `${s}: ${per.get(s)}`)];
  }
  return null;
}

/** החלפת אות אחת (לא ראשונה) — שגיאת-כתיב דטרמיניסטית. */
function typoOf(word: string): string {
  const i = Math.min(2, word.length - 2);
  const c = word[i];
  return word.slice(0, i) + (c === 'ק' ? 'כ' : 'ק') + word.slice(i + 1);
}

function textPreview(values: string[], echo: boolean, p: Record<string, number | string>): string[] | null {
  const vals = uniq(values).slice(0, 5000);
  if (!vals.length) return null;
  const freq = new Map<string, number>();
  for (const v of vals) for (const w of uniq(normHe(v).split(' '))) if (w.length >= 4 && /^[א-ת]+$/.test(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  const best = [...freq].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))[0];
  if (!best) return null;
  const word = best[0];
  const typo = typoOf(word);
  const cands = vals.map((text, i) => ({ id: String(i), text }));
  const maxTypos = num(p, 'maxTypos', 1);
  const found = fuzzyFind(typo, cands, maxTypos).length;
  const exact = fuzzyFind(word, cands, 0).length;
  if (echo) return [`"${typo}" (עם טעות) ⇐ נמצאו ${found} מתוך ${vals.length}`, `"${word}" (בלי טעות) ⇐ ${exact}`];
  return [`מילה עם טעות כתיב אחת ⇐ נמצאו ${found} מתוך ${vals.length}`, `אותה מילה בלי טעות ⇐ ${exact}`, 'הטקסט עצמו לא מוצג כאן'];
}

/* ═══════════════ הכניסה ═══════════════ */

/** התצוגה של חיבור (מקום שנוצר × חלק). null ⇒ אין תוצאה כנה. לא זורק. */
export function genericPreviewOf(place: GenPlace, atom: AtomId, params: Readonly<Record<string, number | string>> | null | undefined, ctx: GenericCtx): GenericPreview | null {
  try {
    if (!place || !place.spec || !ctx || !Number.isFinite(ctx.nowMs)) return null;
    if (place.personal && ctx.privacyMode === true) return null;
    const card = atomCard(atom);
    const result = place.results?.[atom];
    if (!card || !result || !card.worksOn.includes(place.kind) || place.spec.kind !== place.kind) return null;
    const p = cleanParams(card, params ?? {});
    const ex = extract(ctx.db, place.spec);
    if (!ex) return null;
    const now = israel(ctx.nowMs);
    let lines: string[] | null = null;
    switch (ex.kind) {
      case 'amount':
        lines = amountPreview(ex.values, atom, p, !MONEY_NAME.test(leaf(place.spec.path)) ? '' : leaf(place.spec.path) === 'usd' ? '$' : '₪');
        break;
      case 'times':
        lines = timesPreview(ex.values, place.spec.unit === 'clock' ? 'clock' : 'date', atom, p, now);
        break;
      case 'span':
        lines = atom === 'divide' ? spanPreview(ex.spans, ex.unit, p, now) : null;
        break;
      case 'sequence':
        lines = sequencePreview(ex.groups, atom, p, now);
        break;
      case 'waiting':
        lines = waitingPreview(ex.items, atom, p, ctx.nowMs, now);
        break;
      case 'text':
        lines = atom === 'fuzzy' ? textPreview(ex.values, place.spec.echo === true, p) : null;
        break;
    }
    if (!lines || !lines.length) return null;
    return { title: `${place.name}: ${result}`, lines: capped(lines) };
  } catch {
    return null;
  }
}
