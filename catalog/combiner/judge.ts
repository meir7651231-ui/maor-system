/**
 * ⚖️ המצרף · השופט (COMBINER, 14.10.2026).
 *
 * איפה שחלק ניתן-להרצה — מריצים אותו על קלטים מחוללים ובודקים את החוקים של הפועל שלו. בלי ניחוש:
 *  · שמונת החלקים של אורביט — **החוקים והמחוללים של המאמת** (`src/lib/atoms/verify/` — קריאה בלבד, ייבוא).
 *  · מקום-השמש (זריחה/שקיעה של הטלפון) — חוקים חדשים: שעה תקינה, זריחה לפני שקיעה, אורך-יום סביר, קיץ ארוך מחורף.
 *  · ממיר שעה⇄דקות — חוק הלוך-חזור.
 *  · זרימות: הפלט של חלק א׳ נכנס כקלט לחלק ב׳, והחוקים של ב׳ נבדקים על מה שבאמת זרם (למשל זריחה ⇒ הבא בתור ⇒ מזיז ⇒ מעגל).
 *
 * דטרמיניסטי: זרע קבוע, בלי שעון. הפלט = `proofs.json` (נכתב ע״י `prove.mjs`, נבדק ב-vitest).
 */
import { lawsFor, violations, type AtomInput, type InputKind } from '../../src/lib/atoms/verify/laws';
import { atomCase, isoAround, rng, subSeed, STEPS, type Rng } from '../../src/lib/atoms/verify/gen';
import type { AtomId } from '../../src/lib/atoms/contract';
import { ATOM_IDS } from '../../src/lib/atoms/contract';
import { nextAfter } from '../../src/lib/atoms/parts/next';
import { offsetAll, hhmmToMinutes } from '../../src/lib/atoms/parts/offset';
import { roundTo } from '../../src/lib/atoms/parts/round';
import { hmToMin, minToHm } from '../../src/components/parnasa/zmanimBoard';
// @ts-expect-error — מודול JS של הטלפון, בלי טיפוסים
import { sunrise, sunset } from '../../telephony/lib/zmanim.mjs';

export const JUDGE_SEED = 20261014;
export const JUDGE_N = 400;
export const FLOW_N = 200;

const P = (path: string, sym: string): string => 'orbit:' + path + '#' + sym;
const AP = (atom: string, sym: string): string => P('src/lib/atoms/parts/' + atom + '.ts', sym);

/** סוג-קלט של המאמת ⇒ החלקים (מזהי-קטלוג) שהחוקים שלו בודקים. */
export const KIND_PARTS: Record<InputKind, string[]> = {
  'divide.parts': [AP('divide', 'divideSpan')],
  'divide.size': [AP('divide', 'divideSpan')],
  'divide.amount': [AP('divide', 'divideAmount')],
  'divide.points': [AP('divide', 'pointsAt')],
  merge: [AP('merge', 'mergeRuns')],
  'next.times': [AP('next', 'nextAfter')],
  'next.runs': [AP('next', 'firstRun')],
  round: [AP('round', 'roundTo')],
  'offset.times': [AP('offset', 'offsetAll')],
  'offset.days': [AP('offset', 'offsetAll')],
  'offset.relative': [AP('offset', 'resolveRelative'), AP('offset', 'hhmmToMinutes')],
  escalate: [AP('escalate', 'escalationState'), AP('escalate', 'escalationPlan')],
  rotate: [AP('rotate', 'fairAssign'), AP('rotate', 'turnIndex'), AP('rotate', 'turnOf')],
  'rotate.days': [AP('rotate', 'dayIndex')],
  fuzzy: [AP('fuzzy', 'fuzzyFind'), AP('fuzzy', 'normHe'), AP('fuzzy', 'wordScore')],
};

export interface PartProof {
  status: 'proven' | 'failed';
  /** הפועל שהחוקים שלו נבדקו. */
  verb: string;
  cases: number;
  checks: number;
  laws: string[];
  counterexample?: string;
}
export interface FlowProof {
  status: 'proven' | 'failed';
  cases: number;
  laws: string[];
  counterexample?: string;
}

/* ═══════════════ חוקי השמש ═══════════════ */

const PLACES: readonly [number, number, string][] = [
  [31.778, 35.235, 'Asia/Jerusalem'],
  [32.083, 34.833, 'Asia/Jerusalem'],
  [40.71, -74.0, 'America/New_York'],
  [51.5, -0.12, 'Europe/London'],
  [-33.87, 151.2, 'Australia/Sydney'],
  [19.43, -99.13, 'America/Mexico_City'],
  [55.75, 37.62, 'Europe/Moscow'],
  [-34.6, -58.38, 'America/Argentina/Buenos_Aires'],
];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMin = (s: string): number => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
type SunFn = (iso: string, lat: number, lon: number, tz?: string) => string | null;
const RISE = sunrise as SunFn;
const SET = sunset as SunFn;

interface SunCase {
  iso: string;
  lat: number;
  lon: number;
  tz: string;
}
const sunCase = (r: Rng): SunCase => {
  const [lat, lon, tz] = r.pick(PLACES);
  return { iso: isoAround(r), lat: lat + (r.next() - 0.5) * 2, lon: lon + (r.next() - 0.5) * 2, tz };
};

export const SUN_LAWS: { id: string; says: string; check: (c: SunCase) => string | null }[] = [
  {
    id: 'sun.hhmm',
    says: 'זריחה ושקיעה הן שעה תקינה HH:MM',
    check: (c) => {
      const a = RISE(c.iso, c.lat, c.lon, c.tz);
      const b = SET(c.iso, c.lat, c.lon, c.tz);
      return typeof a === 'string' && HHMM.test(a) && typeof b === 'string' && HHMM.test(b) ? null : 'שעה פגומה ' + a + ' / ' + b;
    },
  },
  {
    id: 'sun.order',
    says: 'הזריחה לפני השקיעה, ואורך היום בין 6 ל-18.5 שעות (בקווי-רוחב עד 57°)',
    check: (c) => {
      const a = RISE(c.iso, c.lat, c.lon, c.tz);
      const b = SET(c.iso, c.lat, c.lon, c.tz);
      if (!a || !b) return 'אין זריחה/שקיעה';
      const len = toMin(b) - toMin(a);
      return len > 6 * 60 && len < 18.5 * 60 ? null : 'אורך יום ' + len + ' דקות';
    },
  },
  {
    id: 'sun.season',
    says: 'בצפון — יום ביוני ארוך מיום בדצמבר; בדרום — הפוך',
    check: (c) => {
      const len = (iso: string): number => toMin(SET(iso, c.lat, c.lon, c.tz) as string) - toMin(RISE(iso, c.lat, c.lon, c.tz) as string);
      const y = c.iso.slice(0, 4);
      const d = len(y + '-06-21') - len(y + '-12-21');
      return (c.lat > 0 ? d > 0 : d < 0) ? null : 'קו-רוחב ' + c.lat.toFixed(1) + ': הפרש ' + d;
    },
  },
  {
    id: 'sun.deterministic',
    says: 'אותו מקום ואותו יום ⇒ אותה שעה',
    check: (c) => (RISE(c.iso, c.lat, c.lon, c.tz) === RISE(c.iso, c.lat, c.lon, c.tz) && SET(c.iso, c.lat, c.lon, c.tz) === SET(c.iso, c.lat, c.lon, c.tz) ? null : 'לא דטרמיניסטי'),
  },
];

/* ═══════════════ ממיר שעה⇄דקות ═══════════════ */

const ROUNDTRIP = {
  id: 'convert.roundtrip',
  says: 'דקות ⇒ שעה ⇒ דקות חוזר לאותו מספר, לכל דקה ביממה',
  check: (m: number): string | null => {
    const hm = minToHm(m);
    const back = hmToMin(hm);
    return back === m ? null : m + ' ⇒ ' + hm + ' ⇒ ' + back;
  },
};

/* ═══════════════ הרצת החלקים ═══════════════ */

/** כל החלקים שנשפטים, עם הוכחה. */
export function judgeParts(n = JUDGE_N, seed = JUDGE_SEED): Record<string, PartProof> {
  const acc = new Map<string, { verb: string; cases: number; checks: number; laws: Set<string>; fail?: string }>();
  const touch = (id: string, verb: string) => {
    if (!acc.has(id)) acc.set(id, { verb, cases: 0, checks: 0, laws: new Set() });
    return acc.get(id)!;
  };
  for (const atom of ATOM_IDS as readonly AtomId[]) {
    const r = rng(subSeed(seed, 'combiner:' + atom));
    for (let i = 0; i < n; i++) {
      const input = atomCase(atom, r, i);
      const v = violations(atom, input);
      for (const id of KIND_PARTS[input.k]) {
        const a = touch(id, atom);
        a.cases++;
        a.checks += 1;
        LAW_NAMES(atom, input.k).forEach((l) => a.laws.add(l));
        if (v.length && !a.fail) a.fail = v[0].law + ': ' + v[0].why;
      }
    }
  }
  const sr = rng(subSeed(seed, 'combiner:sun'));
  for (let i = 0; i < n; i++) {
    const c = sunCase(sr);
    for (const sym of ['sunrise', 'sunset']) {
      const a = touch(P('telephony/lib/zmanim.mjs', sym), 'sun-position');
      a.cases++;
      for (const law of SUN_LAWS) {
        a.checks++;
        a.laws.add(law.id);
        const why = safe(() => law.check(c));
        if (why && !a.fail) a.fail = law.id + ': ' + why;
      }
    }
  }
  for (let m = 0; m < 1440; m++) {
    for (const sym of ['hmToMin', 'minToHm']) {
      const a = touch(P('src/components/parnasa/zmanimBoard.ts', sym), 'convert');
      a.cases++;
      a.checks++;
      a.laws.add(ROUNDTRIP.id);
      const why = safe(() => ROUNDTRIP.check(m));
      if (why && !a.fail) a.fail = ROUNDTRIP.id + ': ' + why;
    }
  }
  const out: Record<string, PartProof> = {};
  for (const id of [...acc.keys()].sort()) {
    const a = acc.get(id)!;
    out[id] = { status: a.fail ? 'failed' : 'proven', verb: a.verb, cases: a.cases, checks: a.checks, laws: [...a.laws].sort(), ...(a.fail ? { counterexample: a.fail } : {}) };
  }
  return out;
}

/** שמות כל החוקים שחלים על הקלט (violations מחזיר רק את הנכשלים). */
const LAW_NAMES = (atom: AtomId, k: InputKind): string[] => lawsFor(atom, k).map((l) => l.id);

const safe = (f: () => string | null): string | null => {
  try {
    return f();
  } catch (e) {
    return 'זרק: ' + (e instanceof Error ? e.message : String(e));
  }
};

/* ═══════════════ זרימות: פלט א׳ ⇒ קלט ב׳ ═══════════════ */

interface Runner {
  id: string;
  /** קלט מחולל ⇒ פלט. */
  produce?: (r: Rng) => unknown;
  /** פלט של חלק קודם ⇒ קלט-מאמת לחלק הזה (null = לא מתאים, מדלגים). */
  accept?: (v: unknown, r: Rng) => AtomInput | null;
  atom?: AtomId;
}

const asMinutes = (v: unknown): number[] | null => {
  const xs = Array.isArray(v) ? v : [v];
  const out: number[] = [];
  for (const x of xs) {
    const m = typeof x === 'number' && Number.isFinite(x) ? x : hhmmToMinutes(x);
    if (m === null || m === undefined || !Number.isFinite(m)) return null;
    out.push(m);
  }
  return out.length ? out : null;
};

const RUNNERS: Runner[] = [
  { id: P('src/components/parnasa/zmanimBoard.ts', 'hmToMin'), produce: (r) => hmToMin(minToHm(r.int(0, 1439))) },
  { id: P('src/components/parnasa/zmanimBoard.ts', 'minToHm'), produce: (r) => minToHm(r.int(0, 1439)) },
  { id: P('telephony/lib/zmanim.mjs', 'sunrise'), produce: (r) => { const c = sunCase(r); return RISE(c.iso, c.lat, c.lon, c.tz); } },
  { id: P('telephony/lib/zmanim.mjs', 'sunset'), produce: (r) => { const c = sunCase(r); return SET(c.iso, c.lat, c.lon, c.tz); } },
  {
    id: AP('next', 'nextAfter'),
    atom: 'next',
    produce: (r) => {
      const ts = Array.from({ length: r.int(1, 8) }, () => r.int(0, 1439));
      return nextAfter(ts, r.int(0, 1439), r.int(1, 3));
    },
    accept: (v, r) => {
      const ms = asMinutes(v);
      if (!ms) return null;
      const times = [...ms, ...Array.from({ length: r.int(0, 5) }, () => r.int(0, 1439))];
      return { k: 'next.times', times, now: r.int(-60, 1500), count: r.int(0, 4) };
    },
  },
  {
    id: AP('offset', 'offsetAll'),
    atom: 'offset',
    produce: (r) => offsetAll(Array.from({ length: r.int(1, 6) }, () => r.int(0, 1439)), r.int(-180, 180)),
    accept: (v, r) => {
      const ms = asMinutes(v);
      return ms ? { k: 'offset.times', times: ms, minutes: r.int(-240, 240) } : null;
    },
  },
  {
    id: AP('round', 'roundTo'),
    atom: 'round',
    produce: (r) => roundTo(r.int(-5000, 5000) / 7, r.pick(STEPS), r.pick(['down', 'up', 'nearest'] as const)),
    accept: (v, r) => {
      const ms = asMinutes(v);
      return ms ? { k: 'round', value: ms[0], step: r.pick(STEPS), dir: r.pick(['down', 'up', 'nearest'] as const) } : null;
    },
  },
];

/** כל זוג (א׳ שמייצר, ב׳ שמקבל): מריצים את א׳, מזרימים לב׳, בודקים את החוקים של ב׳. */
export function judgeFlows(n = FLOW_N, seed = JUDGE_SEED): Record<string, FlowProof> {
  const out: Record<string, FlowProof> = {};
  for (const a of RUNNERS) {
    if (!a.produce) continue;
    for (const b of RUNNERS) {
      if (a === b || !b.accept || !b.atom) continue;
      const r = rng(subSeed(seed, a.id + '>' + b.id));
      let cases = 0;
      let fail: string | undefined;
      const laws = new Set<string>();
      for (let i = 0; i < n; i++) {
        const v = safe(() => {
          const inp = b.accept!(a.produce!(r), r);
          if (!inp) return null;
          cases++;
          LAW_NAMES(b.atom!, inp.k).forEach((l) => laws.add(l));
          const bad = violations(b.atom!, inp);
          return bad.length ? bad[0].law + ': ' + bad[0].why : null;
        });
        if (v && !fail) fail = v;
      }
      if (cases) out[a.id + '>' + b.id] = { status: fail ? 'failed' : 'proven', cases, laws: [...laws].sort(), ...(fail ? { counterexample: fail } : {}) };
    }
  }
  return out;
}

/** proofs.json — כל ההוכחות, ממוינות (דטרמיניסטי). */
export function judgeAll(opts: { n?: number; flowN?: number; seed?: number } = {}): { seed: number; n: number; flowN: number; parts: Record<string, PartProof>; flows: Record<string, FlowProof> } {
  const n = opts.n ?? JUDGE_N;
  const flowN = opts.flowN ?? FLOW_N;
  const seed = opts.seed ?? JUDGE_SEED;
  const flows = judgeFlows(flowN, seed);
  const sorted: Record<string, FlowProof> = {};
  for (const k of Object.keys(flows).sort()) sorted[k] = flows[k];
  return { seed, n, flowN, parts: judgeParts(n, seed), flows: sorted };
}
