/**
 * 🧬 מנועים וחלקים — התצוגות האמיתיות של 🙋 מבין בקשות (ATOMS-PREVIEWS, 14.10.2026).
 *
 * כל מקום של "מה צריך?" × כל חלק שמתחבר אליו ⇒ `{ title, lines }` על נתוני-הארגון (`prListings` · `prRequests` ·
 * `prAds`), דרך המנוע האמיתי של פרנסה׳לע (`parnasa/lib.ts`): requestRecipients/isUrgent, listingStatus/openNow עם
 * סגירת שבת וחג (`makeClosureFn` — אותו מחשבון כמו הזמנים), adRotation, categoryOf, PR_CONCEPTS.
 *
 * 🛡 פרטיות — כללים קשיחים (ננעלים ב-atoms-preview-whatneed.test):
 *   · אף פעם לא שם, טלפון או מייל של מבקש. `requester` לא נקרא כאן בכלל (רק requestRecipients מסנן את העסק של המבקש).
 *   · אף פעם לא הטקסט של בקשה. בקשה שקטה ⇒ רק "בקשה שקטה" והתחום שלה (categoryOf), גם לא המקצוע שזוהה מהטקסט.
 *   · 🔍 על הבקשות ⇒ מקצועות ומונים בלבד. 🔍 על השמות ⇒ שמות עסקים בלבד (ציבוריים — מודפסים בחוברת).
 * טהור ודטרמיניסטי: "עכשיו" רק מ-`ctx.nowMs` (שעון ישראל). לעולם לא זורק.
 */
import type { PrAd, PrAdSlot, PrListing, PrRequest } from '../../types/domain';
import type { Builder, Preview, PreviewCtx } from './preview';
import { adActiveOn, adRotation, categoryOf, isUrgent, openNow, PR_CONCEPTS, requestRecipients } from '../../components/parnasa/lib';
import { addDaysIso, hmToMin, makeClosureFn, minToHm, type PrClock, type PrClosureFn } from '../../components/parnasa/zmanimBoard';
import { escalationState, type EscStep } from './parts/escalate';
import { dayIndex, fairAssign, turnOf } from './parts/rotate';
import { normHe, wordScore, fuzzyFind } from './parts/fuzzy';
import { nextAfter } from './parts/next';
import { offsetAll } from './parts/offset';
import { roundTo, type RoundDir } from './parts/round';
import { capped, dayWord, divideBy, divideMoney, dm, durationText, israelClock, moneyLine, num, out, shekel, str, zmanimLoc, type Params } from './previewZmanim';

/* ═══════════════ קריאת הנתונים (מוגנת מפני DB פגום) ═══════════════ */

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';

const listingsOf = (ctx: PreviewCtx): PrListing[] =>
  arr<PrListing>(ctx.db?.prListings).filter((l) => isObj(l) && typeof l.id === 'string' && typeof l.name === 'string');
const approvedOf = (ctx: PreviewCtx): PrListing[] =>
  listingsOf(ctx)
    .filter((l) => l.status === 'approved')
    .sort((a, b) => a.name.localeCompare(b.name, 'he') || (a.id < b.id ? -1 : 1));
const openRequestsOf = (ctx: PreviewCtx): PrRequest[] =>
  arr<PrRequest>(ctx.db?.prRequests)
    .filter((r) => isObj(r) && typeof r.id === 'string' && typeof r.text === 'string' && r.status !== 'closed')
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || (a.id < b.id ? -1 : 1));
const adsOf = (ctx: PreviewCtx): PrAd[] =>
  arr<PrAd>(ctx.db?.prAds).filter((a) => isObj(a) && typeof a.id === 'string' && typeof a.advertiser === 'string');

/** שם העסק לתצוגה — ציבורי (מודפס בחוברת). */
const bizName = (l: PrListing): string => l.name.trim() || categoryOf(l.category).short;
const bizCount = (n: number): string => (n === 1 ? 'עסק אחד' : n + ' עסקים');

/* ═══════════════ המקצוע מתוך טקסט — דרך 🔍 (בלי להציג את הטקסט) ═══════════════ */

/** מילון-הנרדפות המנורמל של "מה צריך?" (PR_CONCEPTS — אותו מקור כמו analyzeQuery). */
const SYNS: ReadonlyArray<{ s: string; label: string; multi: boolean }> = PR_CONCEPTS.flatMap((c) =>
  c.w.map((w) => normHe(w)).filter(Boolean).map((s) => ({ s, label: c.l, multi: s.includes(' ') })),
);

/**
 * המקצוע שזוהה בטקסט, דרך חלק 🔍 (`wordScore`, עם maxTypos מהפרטים): הנרדף הכי מתאים. עם maxTypos=1 ⇒ אותה
 * טבלה בדיוק כמו analyzeQuery (נבדק ב-ratchet). `typo` = נמצא רק בזכות סליחה לאות שגויה (ציון 1.6).
 */
export function conceptOf(text: string, maxTypos = 1): { label: string; typo: boolean } | null {
  const q = normHe(text);
  const toks = q.split(' ').filter(Boolean);
  if (!toks.length) return null;
  const pq = ' ' + q + ' ';
  let best: { label: string; score: number } | null = null;
  for (const syn of SYNS) {
    let sc = 0;
    if (syn.multi) sc = pq.includes(' ' + syn.s + ' ') || (syn.s.length > 5 && q.includes(syn.s)) ? 3.5 : 0;
    else for (const t of toks) sc = Math.max(sc, wordScore(t, syn.s, maxTypos));
    if (sc > 0 && (!best || sc > best.score)) best = { label: syn.label, score: sc };
  }
  return best ? { label: best.label, typo: best.score === 1.6 } : null;
}

/** "בקשה באינסטלציה" — המקצוע מהטקסט (לא שקטה בלבד), אחרת התחום. בקשה שקטה ⇒ "בקשה שקטה · <תחום>". */
function requestLabel(r: PrRequest): string {
  const field = r.category ? categoryOf(r.category).short : 'בלי תחום';
  if (r.quiet === true) return 'בקשה שקטה · ' + field;
  if (r.job === true) return 'הצעת עבודה';
  const c = conceptOf(r.text);
  return 'בקשה ב' + (c ? c.label : field);
}

/** "15:00" היום, אחרת "15/10 15:00". */
function whenLine(ms: number, todayIso: string): string {
  const c = israelClockAt(ms);
  return c.iso === todayIso ? c.hhmm : dm(c.iso) + ' ' + c.hhmm;
}
const israelClockAt = (ms: number): PrClock => israelClock({ db: null, nowMs: ms });

/* ───────── whatNeed.requests · 📣 ───────── */

const COMMUNITY = '__community__';

function requestsEscalate(ctx: PreviewCtx, p: Params): Preview | null {
  const reqs = openRequestsOf(ctx);
  if (!reqs.length) return null;
  const listings = listingsOf(ctx);
  const today = israelClock(ctx).iso;
  const waitMin = num(p, 'waitMin', 180);
  const urgentWaitMin = num(p, 'urgentWaitMin', 60);
  const lines = reqs.map((r) => {
    const label = requestLabel(r);
    const rec = requestRecipients(r, listings);
    const answered = arr(r.responses).length;
    if (r.quiet === true) {
      return label + ' — ' + (rec.length ? 'רק אצל ' + bizCount(rec.length) + ' בתחום, ולא עוברת לקהילה' : 'אצל הגבאי (אין עדיין עסק בתחום), ולא עוברת לקהילה');
    }
    if (r.job === true || !rec.length) return label + ' — אצל כל הקהילה' + (r.job === true || !r.category ? '' : ' (אין עדיין עסק בתחום)');
    if (answered) return label + ' — ' + (answered === 1 ? 'עסק אחד כבר ענה' : answered + ' עסקים כבר ענו') + ', הבקשה נשארת אצל העסקים';
    const steps: EscStep[] = [
      { to: rec.map((l) => l.id), waitMin },
      { to: [COMMUNITY], waitMin },
    ];
    const created = Date.parse(r.createdAt);
    const st = escalationState({ createdMs: created, steps, urgent: isUrgent(r, ctx.nowMs), urgentWaitMin, nowMs: ctx.nowMs });
    const urgent = isUrgent(r, ctx.nowMs) ? ' (דחוף)' : '';
    if (st.stepIndex >= 1) return label + urgent + ' — כבר אצל כל הקהילה (העסקים בתחום לא ענו בזמן)';
    return label + urgent + ' — עכשיו אצל ' + bizCount(rec.length) + ' בתחום · אם אין תשובה עד ' + whenLine(st.nextMoveMs ?? ctx.nowMs, today) + ' ← לכל הקהילה';
  });
  return out('מעביר הלאה · ' + (reqs.length === 1 ? 'בקשה אחת פתוחה' : reqs.length + ' בקשות פתוחות'), lines);
}

/* ───────── whatNeed.requests · 🔄 ───────── */

function requestsRotate(ctx: PreviewCtx, p: Params): Preview | null {
  const reqs = openRequestsOf(ctx).filter((r) => r.job !== true && r.category);
  if (!reqs.length) return null;
  const listings = listingsOf(ctx);
  const byField = new Map<string, { reqs: PrRequest[]; names: string[] }>();
  for (const r of reqs) {
    const g = byField.get(r.category) ?? { reqs: [], names: [] };
    g.reqs.push(r);
    for (const l of requestRecipients(r, listings)) if (!g.names.includes(bizName(l))) g.names.push(bizName(l));
    byField.set(r.category, g);
  }
  const today = israelClock(ctx).iso;
  const lines: string[] = [];
  const byDay = str(p, 'by', 'day') === 'day';
  for (const [cat, g] of byField) {
    const field = categoryOf(cat).short;
    const names = g.names.slice().sort((a, b) => a.localeCompare(b, 'he'));
    if (!names.length) {
      lines.push(field + ' — אין עדיין עסק בתחום, אין בין מי להתחלף');
      continue;
    }
    if (names.length === 1) {
      lines.push(field + ' — רק ' + names[0] + ' בתחום, מקבל כל בקשה');
      continue;
    }
    if (byDay) {
      const d = dayIndex(today);
      lines.push(field + ' — היום ← ' + turnOf(names, d) + ' · מחר ← ' + turnOf(names, d + 1) + ' · ' + dm(addDaysIso(today, 2)) + ' ← ' + turnOf(names, d + 2));
    } else {
      for (const a of fairAssign(g.reqs, names, 0)) lines.push(requestLabel(a.item) + ' ← קודם אל ' + a.person);
      lines.push('הבקשה הבאה ב' + field + ' ← קודם אל ' + turnOf(names, g.reqs.length));
    }
  }
  return out(byDay ? 'מי מקבל ראשון, לפי יום' : 'מי מקבל ראשון, בקשה אחרי בקשה', lines);
}

/* ───────── whatNeed.text · 🔍 — מקצועות ומונים בלבד ───────── */

function textFuzzy(ctx: PreviewCtx, p: Params): Preview | null {
  const reqs = openRequestsOf(ctx);
  if (!reqs.length) return null;
  const maxTypos = num(p, 'maxTypos', 1);
  const found = new Map<string, { n: number; typo: number }>();
  const quiet = new Map<string, number>();
  let none = 0;
  for (const r of reqs) {
    if (r.quiet === true) {
      const f = r.category ? categoryOf(r.category).short : 'בלי תחום';
      quiet.set(f, (quiet.get(f) ?? 0) + 1);
      continue;
    }
    const c = conceptOf(r.text, maxTypos);
    if (!c) {
      none++;
      continue;
    }
    const g = found.get(c.label) ?? { n: 0, typo: 0 };
    g.n++;
    if (c.typo) g.typo++;
    found.set(c.label, g);
  }
  const reqWord = (n: number): string => (n === 1 ? 'בקשה אחת' : n + ' בקשות');
  const lines: string[] = [];
  for (const [label, g] of [...found].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0], 'he'))) {
    const typo = g.typo === g.n ? (g.n === 1 ? 'נמצאה' : 'כולן נמצאו') : g.typo === 1 ? 'אחת מהן נמצאה' : g.typo + ' מהן נמצאו';
    lines.push(label + ' ← ' + reqWord(g.n) + (g.typo ? ' (' + typo + ' למרות שגיאת כתיב)' : ''));
  }
  for (const [f, n] of quiet) lines.push((n === 1 ? 'בקשה שקטה' : n + ' בקשות שקטות') + ' · ' + f);
  if (none) lines.push('לא זוהה מקצוע ← ' + reqWord(none));
  return out('מה מבקשים, לפי מקצוע · ' + reqWord(reqs.length) + ' פתוחות', lines);
}

/* ───────── whatNeed.names · 🔍 — שמות עסקים (ציבוריים) ───────── */

/**
 * אותה מילה עם אות אחת חסרה באמצע — "איך שאנשים מקלידים". המילה = הארוכה ביותר שמיוחדת לעסק (לא מופיעה בשם של עסק
 * אחר), אחרת הארוכה ביותר. מילה קצרה מ-5 אותיות ⇒ null.
 */
function typoOf(name: string, others: readonly string[]): string | null {
  const words = name.split(/\s+/).filter(Boolean);
  const own = words.filter((w) => !others.some((o) => o.split(/\s+/).includes(w)));
  const pick = (list: string[]): string | undefined => list.slice().sort((a, b) => b.length - a.length || words.indexOf(a) - words.indexOf(b))[0];
  const w = pick(own.filter((x) => x.length >= 5)) ?? pick(words);
  if (!w || w.length < 5) return null;
  const i = Math.floor(w.length / 2);
  return w.slice(0, i) + w.slice(i + 1);
}

function namesFuzzy(ctx: PreviewCtx, p: Params): Preview | null {
  const biz = approvedOf(ctx);
  if (!biz.length) return null;
  const maxTypos = num(p, 'maxTypos', 1);
  const cands = biz.map((l) => ({ id: l.id, text: l.name }));
  const nameOf = new Map(biz.map((l) => [l.id, bizName(l)]));
  const lines: string[] = [];
  for (const l of biz) {
    const q = typoOf(l.name, biz.filter((x) => x.id !== l.id).map((x) => x.name));
    if (!q) continue;
    const hits = fuzzyFind(q, cands, maxTypos);
    lines.push("'" + q + "' ← " + (hits.length ? 'נמצא: ' + nameOf.get(hits[0]) + (hits.length > 1 ? ' ועוד ' + (hits.length - 1) : '') : 'לא נמצא'));
  }
  return out('מי שמקליד שם עם אות חסרה · ' + (biz.length === 1 ? 'עסק אחד' : biz.length + ' עסקים') + ' במדריך', lines);
}

/* ───────── שעות הפתיחה ───────── */

interface Win {
  dow: number;
  f: number;
  t: number;
}

/** חלונות-הפתיחה של עסק (כמו windowsOf במנוע — שעה פגומה מדולגת). */
function winsOf(l: PrListing): Win[] {
  const outW: Win[] = [];
  for (const h of arr<{ dow: number; from: string; to: string }>(l.hours)) {
    if (!isObj(h)) continue;
    const f = hmToMin(h.from);
    const t = hmToMin(h.to);
    if (!Number.isInteger(h.dow) || h.dow < 0 || h.dow > 6 || f === null || t === null || f === t || f >= 1440) continue;
    outW.push({ dow: h.dow, f, t });
  }
  return outW.sort((a, b) => a.dow - b.dow || a.f - b.f);
}

const closeLabel = (m: number): string => (m % 1440 === 0 ? 'חצות' : minToHm(m));

/* ───────── whatNeed.hours · ✂️ ───────── */

function hoursDivide(ctx: PreviewCtx, p: Params): Preview | null {
  const clock = israelClock(ctx);
  const lines: string[] = [];
  for (const l of approvedOf(ctx)) {
    const wins = winsOf(l);
    if (!wins.length) continue;
    for (let k = 0; k < 7; k++) {
      const iso = addDaysIso(clock.iso, k);
      const w = wins.find((x) => x.dow === (clock.dow + k) % 7);
      if (!w) continue;
      const span = { from: w.f, to: w.f < w.t ? w.t : w.t + 1440 };
      const pieces = divideBy(span, p);
      if (!pieces.length) break;
      const size = pieces[0].length;
      lines.push(bizName(l) + ' · ' + dayWord(iso, clock.iso) + ' ' + minToHm(w.f) + '–' + closeLabel(w.t) + ' ← ' + pieces.length + ' תורים של ' + durationText(size));
      break;
    }
  }
  const title = str(p, 'by', 'parts') === 'size' ? 'תורים של ' + durationText(num(p, 'size', 30)) + ' בשעות הפתיחה' : 'שעות הפתיחה ב-' + num(p, 'parts', 12) + ' תורים שווים';
  return out(title, lines);
}

/* ───────── whatNeed.openings · ⏭️ ⏱️ ───────── */

/** רגעי-הפתיחה של עסק ב-8 הימים הקרובים, אחרי סגירת שבת וחג (כמו listingStatus: חלון שנפתח בשבת ⇒ נפתח בצאת). */
function openings(l: PrListing, clock: PrClock, closure: PrClosureFn): { iso: string; min: number }[] {
  const res: { iso: string; min: number }[] = [];
  for (let k = 0; k < 8; k++) {
    const iso = addDaysIso(clock.iso, k);
    const dow = (clock.dow + k) % 7;
    for (const w of winsOf(l).filter((x) => x.dow === dow)) {
      let start = w.f;
      const c = closure(iso, minToHm(w.f));
      if (c.closed) {
        const e = c.endIso === iso ? hmToMin(c.endTime) : null;
        if (e === null || (w.f < w.t && e >= w.t)) continue;
        start = e;
      }
      res.push({ iso, min: start });
    }
  }
  return res;
}

function openingsNext(ctx: PreviewCtx, p: Params): Preview | null {
  const clock = israelClock(ctx);
  const closure = makeClosureFn(zmanimLoc(ctx));
  const biz = approvedOf(ctx);
  if (!biz.length) return null;
  const count = Math.max(1, Math.min(6, Math.floor(num(p, 'count', 1))));
  const keyed = new Map<string, { l: PrListing; iso: string; min: number }>();
  for (const l of biz) for (const o of openings(l, clock, closure)) keyed.set(o.iso + ' ' + minToHm(o.min) + ' ' + l.id, { l, ...o });
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const k of nextAfter([...keyed.keys()], clock.iso + ' ' + clock.hhmm + ' ~', keyed.size)) {
    const o = keyed.get(k)!;
    if (seen.has(o.l.id)) continue;
    seen.add(o.l.id);
    lines.push((lines.length ? '' : 'העסק הבא שנפתח: ') + bizName(o.l) + ' · ' + dayWord(o.iso, clock.iso) + ' ב-' + minToHm(o.min));
    if (lines.length >= count) break;
  }
  const openCount = biz.filter((l) => openNow(l, clock, closure)).length;
  if (!lines.length) return openCount ? { title: 'עכשיו פתוחים: ' + openCount, lines: ['אין עסק שנפתח ב-8 הימים הקרובים (מי שפתוח — פתוח תמיד)'] } : null;
  return { title: (count > 1 ? 'העסקים הבאים שנפתחים' : 'העסק הבא שנפתח') + ' · עכשיו פתוחים: ' + openCount, lines };
}

function openingsOffset(ctx: PreviewCtx, p: Params): Preview | null {
  const clock = israelClock(ctx);
  const closure = makeClosureFn(zmanimLoc(ctx));
  const minutes = num(p, 'minutes', -10);
  const nowKey = clock.iso + ' ' + clock.hhmm;
  for (let k = 0; k < 8; k++) {
    const iso = addDaysIso(clock.iso, k);
    const dow = (clock.dow + k) % 7;
    const rows: { name: string; close: number }[] = [];
    for (const l of approvedOf(ctx)) {
      for (const w of winsOf(l).filter((x) => x.dow === dow)) {
        const close = w.f < w.t ? w.t : w.t + 1440;
        if (iso + ' ' + minToHm(Math.min(close, 1439)) <= nowKey) continue;
        // נסגר בתוך שבת/חג ⇒ כבר סגור לפני כן — אין "לפני שנסגר"
        if (closure(iso, minToHm(Math.min(close, 1439) - 1)).closed) continue;
        rows.push({ name: bizName(l), close });
      }
    }
    if (!rows.length) continue;
    rows.sort((a, b) => a.close - b.close || a.name.localeCompare(b.name, 'he'));
    const moved = offsetAll(
      rows.map((r) => r.close),
      minutes,
    );
    const lines = rows.map((r, i) => r.name + ' נסגר ' + dayWord(iso, clock.iso) + ' ב-' + closeLabel(r.close) + ' ← תזכורת ב-' + minToHm(moved[i]));
    const rel = minutes === 0 ? 'ברגע שהעסק נסגר' : durationText(Math.abs(minutes)) + ' ' + (minutes < 0 ? 'לפני' : 'אחרי') + ' שהעסק נסגר';
    return out('תזכורת ' + rel, lines);
  }
  return null;
}

/* ───────── whatNeed.adSlot · 🔄 ───────── */

const SLOT_NAME: Readonly<Record<PrAdSlot, string>> = { booklet: 'החוברת', board: 'לוח הקהילה', category: 'חסות' };
const slotName = (slot: PrAdSlot, target: string): string => (slot === 'category' ? 'חסות ' + categoryOf(target).short : SLOT_NAME[slot] ?? slot);
const adName = (a: PrAd): string => a.advertiser.trim() || String(a.headline ?? '').trim() || 'מודעה';

function adSlotRotate(ctx: PreviewCtx, p: Params): Preview | null {
  const ads = adsOf(ctx);
  const today = israelClock(ctx).iso;
  const groups: { slot: PrAdSlot; target: string }[] = [];
  for (const a of ads) {
    if (a.coin === true || !adActiveOn(a, today)) continue;
    if (!groups.some((g) => g.slot === a.slot && g.target === a.target)) groups.push({ slot: a.slot, target: a.target });
  }
  if (!groups.length) return null;
  const byDay = str(p, 'by', 'day') === 'day';
  const lines = groups.map((g) => {
    const rot = adRotation(ads, g.slot, today, g.target);
    const head = slotName(g.slot, g.target) + ' — ';
    if (rot.active.length === 1) return head + 'רק ' + adName(rot.active[0]) + ', כל יום';
    if (byDay) {
      const at = (k: number): string => {
        const iso = addDaysIso(today, k);
        const r = adRotation(ads, g.slot, iso, g.target);
        return (k === 0 ? 'היום' : k === 1 ? 'מחר' : dm(iso)) + ' ← ' + (r.today ? adName(r.today) : 'אין');
      };
      return head + [0, 1, 2].map(at).join(' · ');
    }
    const order = rot.active.map((_, i) => adName(rot.active[(rot.index + i) % rot.active.length]));
    return head + 'הסדר מהיום: ' + order.join(' ← ');
  });
  return out(byDay ? 'כל יום מודעה אחרת בתורה' : 'המודעות בתור, אחת אחרי השנייה', lines);
}

/* ───────── whatNeed.adPrice · ✂️ 🎯 ───────── */

/** פרסומות שעוד לא נגמרו ושיש להן מחיר (כמו adsLedger: מושהית/שפגה לא נספרת). */
const pricedAds = (ctx: PreviewCtx): PrAd[] => {
  const today = israelClock(ctx).iso;
  return adsOf(ctx)
    .filter((a) => a.active !== false && !(a.to && a.to < today) && typeof a.price === 'number' && Number.isFinite(a.price) && a.price > 0)
    .sort((a, b) => String(a.from).localeCompare(String(b.from)) || a.advertiser.localeCompare(b.advertiser, 'he') || (a.id < b.id ? -1 : 1));
};

function adPriceDivide(ctx: PreviewCtx, p: Params): Preview | null {
  const lines = pricedAds(ctx).map((a) => adName(a) + (a.paid ? ' (שולם)' : '') + ' · ' + moneyLine(a.price, divideMoney(a.price, p)));
  return out('מחיר הפרסומת בתשלומים שווים', lines);
}

function adPriceRound(ctx: PreviewCtx, p: Params): Preview | null {
  const step = num(p, 'step', 1);
  const dir = str(p, 'dir', 'down') as RoundDir;
  const lines = pricedAds(ctx).map((a) => adName(a) + ' · ' + shekel(a.price) + ' ← ' + shekel(roundTo(a.price, step, dir)));
  return out('מחיר הפרסומת מעוגל', capped(lines));
}

export const WHAT_NEED_BUILDERS: Readonly<Record<string, Builder>> = {
  'whatNeed.requests:escalate': requestsEscalate,
  'whatNeed.requests:rotate': requestsRotate,
  'whatNeed.text:fuzzy': textFuzzy,
  'whatNeed.names:fuzzy': namesFuzzy,
  'whatNeed.hours:divide': hoursDivide,
  'whatNeed.openings:next': openingsNext,
  'whatNeed.openings:offset': openingsOffset,
  'whatNeed.adSlot:rotate': adSlotRotate,
  'whatNeed.adPrice:divide': adPriceDivide,
  'whatNeed.adPrice:round': adPriceRound,
};
