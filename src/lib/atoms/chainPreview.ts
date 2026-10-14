/**
 * 🧬 מנועים וחלקים — התוצאה האמיתית של מנוע שבנוי על מנוע (ATOMS-CHAIN, 14.10.2026).
 *
 * `chainPreviewOf(cap, ctx)`: קודם מחשבים את הפלט של המנוע הראשון בשרשרת על נתוני-הארגון, ואז מפעילים עליו
 * חלק אחרי חלק (עד 3 דורות). הפלט של כל שלב הוא נתון אמיתי (תורים · חלונות פנויים · זמנים) — לא משפט.
 * הנתמך: ✂️⇒🔗 תורים באורך משתנה · 🔗⇒⏭️ החלון הפנוי הבא של N לילות · 🔗⇒✂️ חלוקה הוגנת של הזמן הפנוי ·
 * ✂️⇒🔄 תורים לאנשי הצוות בתורות · ✂️⇒⏭️ התור הבא · ועל זמנים: ⏱️ / 🎯 / ⏭️.
 * פלט ריק של ההורה ⇒ null (כן). **בלי שמות אורחים.** טהור ודטרמיניסטי ("עכשיו" מוזרק).
 * משתמש בעזרים של preview.ts (אותו קוד שהשרשראות המוצעות משתמשות בו) — לא עותק.
 */
import type { AtomId, Capability } from './contract';
import type { Run } from './parts/merge';
import { firstRun, nextAfter } from './parts/next';
import { roundTo, type RoundDir } from './parts/round';
import { offsetAll } from './parts/offset';
import { dayIndex, fairAssign, turnOf } from './parts/rotate';
import { divideSpan } from './parts/divide';
import { turnoverSpan, waiting } from './engines/bookingsData';
import { MAX_GENERATIONS, NEXT_VALUE, ROOT_VALUE, parseCapId, rootIdOf, type ChainValue } from './chain';
import { absLine, arrivalMoments, capped, divideBy, dm, freeRuns, hm, isoOfDay, israelNow, NOBODY, paramsOf, unitsOf, type Preview, type PreviewCtx } from './preview';

type P = Record<string, number | string>;
const num = (p: P, k: string, d: number): number => (typeof p[k] === 'number' && Number.isFinite(p[k] as number) ? (p[k] as number) : d);
const str = (p: P, k: string, d: string): string => (typeof p[k] === 'string' ? (p[k] as string) : d);

interface Slot { from: number; to: number }
interface Window { unit: string; nights: { iso: string; free: boolean }[]; run: Run }
interface Moment { abs: number; label: string }

/** הפלט של שלב: הנתון עצמו (לשלב הבא) + מה שמראים. */
type Val =
  | { t: 'slots'; slots: Slot[]; span: string }
  | { t: 'windows'; windows: Window[] }
  | { t: 'moments'; list: Moment[]; what: string }
  | { t: 'assigned' };
type Step = { val: Val; title: string; lines: string[] };

const slotHm = (s: Slot): string => hm(s.from) + '–' + hm(s.to);
const nightsWord = (n: number): string => (n === 1 ? 'לילה אחד' : n + ' לילות');
const addDay = (iso: string): string => isoOfDay(dayIndex(iso) + 1);
const winFrom = (w: Window): string => w.nights[w.run.from].iso;
const winOpen = (w: Window): boolean => w.run.to === w.nights.length - 1;
const winLine = (w: Window): string =>
  w.unit + ' · ' + (winOpen(w) ? 'פנוי מ-' + dm(winFrom(w)) + ' והלאה' : nightsWord(w.run.length) + ' פנויים ברצף מ-' + dm(winFrom(w)) + ' עד ' + dm(addDay(w.nights[w.run.to].iso)));

/** אנשי הצוות (ניקיון ואז תחזוקה), בלי כפילויות. */
function staffOf(ctx: PreviewCtx, kinds: readonly ('cleaning' | 'faults')[]): string[] {
  const all = kinds.flatMap((k) => waiting(ctx.db, k).recipients);
  return [...new Map(all.map((r) => [r.id, r.name || r.role])).values()];
}

/* ───────── המנוע הראשון ───────── */

function rootStep(ctx: PreviewCtx, place: string, atom: AtomId, p: P): Step | null {
  const today = israelNow(ctx.nowMs);
  if (place === 'bookings.turnover' && atom === 'divide') {
    if (!unitsOf(ctx.db).length) return null;
    const span = turnoverSpan(ctx.db);
    const slots = divideBy(span, p).map((x) => ({ from: x.from, to: x.to }));
    if (!slots.length) return null;
    const label = span.fromHm + '–' + span.toHm;
    return { val: { t: 'slots', slots, span: label }, title: 'חלון הניקיון ' + label + ' · ' + slots.length + ' תורים', lines: capped(slots.map(slotHm)) };
  }
  if (place === 'bookings.nights' && atom === 'merge') {
    const windows: Window[] = [];
    for (const u of unitsOf(ctx.db)) {
      const { nights, runs } = freeRuns(ctx.db, u.id, today.iso, { maxGap: num(p, 'maxGap', 0), minLength: num(p, 'minLength', 1) });
      for (const run of runs) windows.push({ unit: u.name, nights, run });
    }
    if (!windows.length) return null;
    windows.sort((a, b) => (winFrom(a) < winFrom(b) ? -1 : winFrom(a) > winFrom(b) ? 1 : 0));
    return { val: { t: 'windows', windows }, title: 'חלונות פנויים', lines: capped(windows.map(winLine)) };
  }
  if (place === 'bookings.arrivals') {
    const list: Moment[] = arrivalMoments(ctx).map((a) => ({ abs: a.abs, label: a.unit }));
    if (!list.length) return null;
    return momentsStep({ t: 'moments', list, what: 'הגעה' }, atom, p, ctx);
  }
  return null;
}

/* ───────── חלק על פלט ───────── */

function momentsStep(v: { t: 'moments'; list: Moment[]; what: string }, atom: AtomId, p: P, ctx: PreviewCtx): Step | null {
  const what = v.what;
  const now = israelNow(ctx.nowMs);
  const nowAbs = dayIndex(now.iso) * 1440 + now.minute;
  if (atom === 'next') {
    const keyed = v.list.map((m, i) => ({ ...m, key: String(m.abs).padStart(12, '0') + '|' + String(i).padStart(4, '0') }));
    const byKey = new Map(keyed.map((m) => [m.key, m]));
    const next = nextAfter(keyed.map((m) => m.key), String(nowAbs).padStart(12, '0') + '|9999', num(p, 'count', 1)).map((k) => byKey.get(k)!);
    if (!next.length) return null;
    const list = next.map((m) => ({ abs: m.abs, label: m.label }));
    return { val: { t: 'moments', list, what }, title: next.length > 1 ? 'הבאים בתור' : 'הבא בתור', lines: list.map((m) => absLine(m.abs) + ' · ' + m.label) };
  }
  if (atom === 'offset') {
    const minutes = num(p, 'minutes', -10);
    const moved = offsetAll(v.list.map((m) => m.abs), minutes);
    const list = v.list.map((m, i) => ({ abs: moved[i], label: m.label }));
    const abs = Math.abs(minutes);
    const amount = abs % 1440 === 0 ? (abs === 1440 ? 'יום' : abs / 1440 + ' ימים') : abs + ' דקות';
    const rel = minutes === 0 ? 'באותו רגע' : amount + ' ' + (minutes < 0 ? 'לפני' : 'אחרי');
    return { val: { t: 'moments', list, what }, title: 'תזכורת ' + rel, lines: capped(v.list.map((m, i) => m.label + ' · ' + what + ' ' + absLine(m.abs) + ' ⇒ תזכורת ' + absLine(moved[i]))) };
  }
  if (atom === 'round') {
    const step = num(p, 'step', 1);
    const dir = str(p, 'dir', 'down') as RoundDir;
    const list = v.list.map((m) => {
      const d = Math.floor(m.abs / 1440);
      return { abs: d * 1440 + roundTo(m.abs - d * 1440, step, dir), label: m.label };
    });
    return { val: { t: 'moments', list, what }, title: 'שעה מעוגלת', lines: capped(v.list.map((m, i) => m.label + ' · ' + absLine(m.abs) + ' ⇒ ' + hm(list[i].abs - Math.floor(list[i].abs / 1440) * 1440))) };
  }
  return null;
}

function slotsStep(v: { t: 'slots'; slots: Slot[]; span: string }, atom: AtomId, p: P, ctx: PreviewCtx): Step | null {
  const today = israelNow(ctx.nowMs);
  if (atom === 'merge') {
    // 🔗 על תורים צמודים: כל k תורים צמודים ⇒ תור אחד ארוך. k = האורך הקצר ביותר שנבחר (לפחות 2)
    const k = Math.max(2, num(p, 'minLength', 1));
    const size = Math.round(v.slots[0].to - v.slots[0].from);
    const turns: Slot[] = [];
    for (let i = 0; i < v.slots.length; i += k) {
      const g = v.slots.slice(i, i + k);
      turns.push({ from: g[0].from, to: g[g.length - 1].to });
    }
    const lines = [v.slots.length + ' תורים של ' + size + ' דקות בחלון ' + v.span];
    for (const n of k === 2 ? [2, 3] : [k]) {
      if (v.slots.length < n) break;
      lines.push('תור של ' + n + ' צמודים = ' + Math.round(v.slots[n - 1].to - v.slots[0].from) + ' דקות · ' + hm(v.slots[0].from) + '–' + hm(v.slots[n - 1].to));
    }
    lines.push('יחידה גדולה ⇒ ' + turns.length + ' תורים ארוכים: ' + turns.slice(0, 3).map(slotHm).join(', ') + (turns.length > 3 ? '…' : ''));
    return { val: { t: 'slots', slots: turns, span: v.span }, title: 'תורים באורך משתנה · ' + v.span, lines: capped(lines) };
  }
  if (atom === 'next') {
    const count = num(p, 'count', 1);
    const minLen = num(p, 'minLength', 1);
    const fit = v.slots.filter((s) => s.to - s.from >= minLen);
    const later = fit.filter((s) => s.from > today.minute).slice(0, count);
    const tomorrow = later.length < count ? fit.slice(0, count - later.length) : [];
    const d0 = dayIndex(today.iso);
    const list: Moment[] = [
      ...later.map((s) => ({ abs: d0 * 1440 + s.from, label: 'היום ' + slotHm(s) })),
      ...tomorrow.map((s) => ({ abs: (d0 + 1) * 1440 + s.from, label: 'מחר ' + slotHm(s) })),
    ];
    if (!list.length) return null;
    return { val: { t: 'moments', list, what: 'תור' }, title: list.length > 1 ? 'התורים הבאים' : 'התור הבא', lines: list.map((m) => m.label) };
  }
  if (atom === 'rotate') {
    const staff = staffOf(ctx, ['cleaning']);
    if (!staff.length) return { val: { t: 'assigned' }, title: 'בתורות', lines: [NOBODY.cleaning] };
    const start = str(p, 'by', 'day') === 'day' ? dayIndex(today.iso) : 0;
    const lines = fairAssign(v.slots, staff, start).map((a) => slotHm(a.item) + ' ⇒ ' + a.person);
    return { val: { t: 'assigned' }, title: 'התורים בתורות · ' + staff.length + ' בתור', lines: capped(lines) };
  }
  return null;
}

function windowsStep(v: { t: 'windows'; windows: Window[] }, atom: AtomId, p: P, ctx: PreviewCtx, check: number): Step | null {
  if (atom === 'next') {
    // ⏭️ על חלונות: החלון הראשון בכל יחידה שארוך מספיק (N לילות)
    const n = Math.max(1, num(p, 'minLength', 1));
    const count = num(p, 'count', 1);
    const out: Window[] = [];
    const perUnit = new Map<string, number>();
    for (const w of v.windows) {
      const r = firstRun([w.run], n, 0);
      if (!r || (perUnit.get(w.unit) ?? 0) >= count) continue;
      perUnit.set(w.unit, (perUnit.get(w.unit) ?? 0) + 1);
      out.push({ ...w, run: n > 1 ? { from: r.from, to: r.from + n - 1, length: n } : r });
    }
    if (!out.length) return null;
    const list: Moment[] = out.map((w) => ({ abs: dayIndex(winFrom(w)) * 1440 + check, label: w.unit }));
    return { val: { t: 'moments', list, what: 'חלון' }, title: n > 1 ? 'החלון הפנוי הבא של ' + n + ' לילות' : 'החלון הפנוי הבא', lines: capped(out.map((w) => (n > 1 ? w.unit + ' · ' + n + ' לילות פנויים ברצף מ-' + dm(winFrom(w)) + ' עד ' + dm(addDay(w.nights[w.run.to].iso)) : winLine(w)))) };
  }
  if (atom === 'divide') {
    // ✂️ על כל חלון (מתחילתו ועד סופו): חלוקה הוגנת בין אנשי הצוות — חלון שנוגע בסוף-הבדיקה לא נחשב (אין לו סוף)
    const people = staffOf(ctx, ['cleaning', 'faults']);
    const lines: string[] = [];
    for (const w of v.windows) {
      if (winOpen(w) || w.run.length < 2) continue;
      const want = str(p, 'by', 'parts') === 'size' ? Math.ceil(w.run.length / Math.max(1, num(p, 'size', 1))) : people.length >= 2 ? people.length : num(p, 'parts', 2);
      const parts = Math.max(2, Math.min(w.run.length, want));
      const pieces = divideSpan({ from: w.run.from, to: w.run.to + 1 }, { parts });
      const shares = pieces.map((x, i) => {
        const a = w.nights[Math.round(x.from)].iso;
        const z = w.nights[Math.max(Math.round(x.from), Math.round(x.to) - 1)]?.iso ?? a;
        return (people[i % Math.max(1, people.length)] ?? 'חלק ' + (i + 1)) + ' ' + (a === z ? dm(a) : dm(a) + '–' + dm(z));
      });
      lines.push(w.unit + ' · ' + nightsWord(w.run.length) + ' פנויים ⇒ ' + shares.join(' · '));
    }
    return lines.length ? { val: { t: 'assigned' }, title: 'חלוקה הוגנת של הזמן הפנוי', lines: capped(lines) } : null;
  }
  if (atom === 'rotate') {
    const people = staffOf(ctx, ['cleaning', 'faults']);
    if (!people.length) return { val: { t: 'assigned' }, title: 'בתורות', lines: [NOBODY.cleaning] };
    const start = str(p, 'by', 'day') === 'day' ? dayIndex(israelNow(ctx.nowMs).iso) : 0;
    const lines = v.windows.map((w, i) => winLine(w) + ' ⇒ ' + turnOf(people, start + i));
    return { val: { t: 'assigned' }, title: 'החלונות הפנויים בתורות · ' + people.length + ' בתור', lines: capped(lines) };
  }
  return null;
}

function applyStep(prev: Step, atom: AtomId, p: P, ctx: PreviewCtx): Step | null {
  const v = prev.val;
  if (v.t === 'slots') return slotsStep(v, atom, p, ctx);
  if (v.t === 'windows') return windowsStep(v, atom, p, ctx, turnoverSpan(ctx.db).to);
  if (v.t === 'moments') return momentsStep(v, atom, p, ctx);
  return null;
}

/**
 * התוצאה האמיתית של מנוע שבנוי על מנוע. השרשרת נקראת מהמזהה; הפרטים של כל מנוע בדרך — מהרשימה השמורה (`ctx.caps`),
 * והאחרון — מהיכולת עצמה (גם כשעוד לא נשמרה: בטופס). מנוע בדרך חסר / חלק שלא מתחבר / פלט ריק ⇒ null.
 */
export function chainPreviewOf(cap: Capability, ctx: PreviewCtx): Preview | null {
  try {
    const parsed = parseCapId(cap.id);
    if (!parsed || !cap.parent || !ctx || !Number.isFinite(ctx.nowMs) || parsed.atoms.length > MAX_GENERATIONS) return null;
    const caps = ctx.caps ?? [];
    const ids: string[] = [rootIdOf(parsed)];
    for (const a of parsed.atoms.slice(1)) ids.push(ids[ids.length - 1] + '>' + a);
    if (ids[ids.length - 1] !== cap.id || ids[ids.length - 2] !== cap.parent) return null;
    const paramsAt = (i: number): P => {
      const c = i === ids.length - 1 ? cap : caps.find((x) => x && x.id === ids[i]);
      return c ? paramsOf(c) : (null as unknown as P);
    };
    // כל מנוע בדרך חייב להיות שמור (חוץ מהאחרון)
    for (let i = 0; i < ids.length - 1; i++) if (!caps.some((x) => x && x.id === ids[i])) return null;
    let v: ChainValue | undefined = ROOT_VALUE[parsed.place + ':' + parsed.atoms[0]];
    let step = v ? rootStep(ctx, parsed.place, parsed.atoms[0], paramsAt(0)) : null;
    for (let i = 1; i < parsed.atoms.length && step; i++) {
      v = v ? NEXT_VALUE[v][parsed.atoms[i]] : undefined;
      step = v ? applyStep(step, parsed.atoms[i], paramsAt(i), ctx) : null;
    }
    return step && step.lines.length ? { title: step.title, lines: step.lines } : null;
  } catch {
    return null;
  }
}

/**
 * הפרטים של המנוע הבנוי כש"שומרים כמנוע" שרשרת מוצעת: 🔗⇒⏭️ = N הלילות שהשרשרת מראה (אותו חישוב כמו `chainsFor`:
 * האורך הקצר ביותר שהארגון בחר ב-🔗 על הלילות, ואם לא בחר — 3). השאר — ברירות-המחדל של החלק.
 */
export function chainChildParams(chainId: string, caps: readonly Capability[]): Capability['params'] {
  if (chainId !== 'bookings:merge>next') return {};
  const m = caps.find((c) => c && c.place === 'bookings.nights' && c.atom === 'merge' && !c.parent);
  const min = m ? num(paramsOf(m), 'minLength', 1) : 1;
  return { minLength: Math.max(2, min > 1 ? min : 3) };
}
