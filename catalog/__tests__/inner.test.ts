/**
 * 🔓 פותח-הפונקציות (INNER, 14.10.2026) — ratchet.
 * 1. ארבעת המקומות שהארכיטקט אימת יוצאים מהמנגנון הכללי (בלי מקרה-מיוחד): זמנים · גלקסיה · שעון-כסף · צליל.
 * 2. דטרמיניסטי ומעודכן: בניה מחדש של אורביט = בדיוק הקבצים שבריפו (gen + sources + מונים).
 * 3. סיבות-הדילוג: await · שעון · אקראי · this · DOM · קריאה מיובאת · שינוי מבחוץ · לולאה שחוזרת — ותלות לא-טהורה נחתכת לקלט.
 * 4. החוזה: כל inner-<source>.json עומד בסכמה (what:"inner", parent, origins); לכל חלק שורה בקובץ-ההתנהגות; פעלים n/n.
 * 5. צופי-התנועה: החוקים נושכים (סינוס ⇒ מתנדנד; רעש ⇒ כלום; קו יורד עם רצפה ⇒ סופר לאחור).
 * 6. הקורא מעודכן: הוכחה מחדש של המודולים של ארבעת המקומות = בדיוק השורות שבקובץ.
 * 7. פרטיות: אין מייל/טלפון/ת״ז/טוקן ב-gen, במקורות ובהתנהגות הפנימיים.
 * 8. v2 · מעקב-ייבוא בתוך הריפו (טרנזיטיבי · כינוי · namespace · מעגל · תקרת-עומק · עוזר לא-טהור · חבילה · קבוע שמשתנה
 *    מקובץ אחר) + עוזר-סגור + מתודות שהמהדר מוכיח (setDate על תאריך טרי · Set.union) — על פרויקט-סינתטי, מורץ.
 * 9. v2 · המחסן הדחוס: פרישה = הקבצים הפרושים ביט-אחר-ביט · החבילות תואמות למניפסט · משקל-הריפו של הפנימיים < 10MB.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as B from '../lib/bridge';
import { validateSource } from '../lib/check.mjs';
import { makeProgram } from '../lib/tsdesc.mjs';
import { bundleFile, loadInSandbox } from '../lib/sandbox.mjs';
import { VERBS } from '../lib/verbs.mjs';
import { openFile, PII, makeRepoCtx, moduleText, toJs, exportName, MAX_HOPS } from '../inner/lib/opener.mjs';
import { makeRepoProgram } from '../inner/lib/resolve.mjs';
import { packParts, unpackParts, packBehavior, unpackBehavior, docText } from '../inner/lib/store.mjs';
import { readManifest, manifestEntry, readPack, hashOf, storePath, packPath, genDir } from '../inner/lib/ensure-gen.mjs';
import { buildSource } from '../inner/lib/build.mjs';
import { seriesTraits, motionOf } from '../inner/lib/motion.mjs';
import { readSigs } from '../inner/lib/sigs.mjs';
import { proveJob, entriesFor } from '../inner/lib/prove-job.mjs';
import { REPOS } from '../inner/lib/repos.mjs';
import { sunDirections } from '../inner/scripts/sun-demo.mjs';
import { computeLift } from '../inner/scripts/lift.mjs';
import { literalPool } from '../lib/tsdesc.mjs';

const ROOT = join(__dirname, '..', '..');
const SEED = 0x0ca7a10;
const INNER = Object.keys(REPOS).filter((s) => existsSync(join(ROOT, 'catalog/inner/store', `parts-${s}.json`)));
const src = (s: string) => JSON.parse(readFileSync(join(ROOT, 'catalog/sources', `inner-${s}.json`), 'utf8'));
const beh = (s: string) => JSON.parse(readFileSync(join(ROOT, 'catalog/behavior', `inner-${s}.json`), 'utf8'));
type Part = { id: string; symbol: string; path: string; name: string; takes: { name: string; kind: string }[]; gives: { kind: string }; tags: string[]; parent: string; origins: { line: number }[] };
const orbit = src('orbit');
const part = (path: string, symbol: string): Part => {
  const p = orbit.parts.find((x: Part) => x.path === path && x.symbol === symbol);
  expect(p, path + '#' + symbol).toBeTruthy();
  return p;
};
const genOf = async (rel: string) => loadInSandbox(await bundleFile(join(ROOT, 'catalog/inner/gen/orbit', rel + '.mjs'), { esm: true })).exports;
const exp = (p: Part) => p.tags.find((t) => t.startsWith('gen:'))!.split('#')[1];
const names = (p: Part) => p.takes.map((t) => t.name);

describe('פותח-הפונקציות — ארבעת המקומות', () => {
  it('זמנים: decl · eqTime · HA בתוך solarEventUTCmin (שורות 72–85), וכיוון-השמש זז מזרח ⇒ דרום ⇒ מערב', async () => {
    const Z = 'telephony/lib/zmanim.mjs';
    const decl = part(Z, 'solarEventUTCmin.decl'); const eq = part(Z, 'solarEventUTCmin.eqTime'); const ha = part(Z, 'solarEventUTCmin.HA');
    expect([decl.origins[0].line, eq.origins[0].line, ha.origins[0].line]).toEqual([72, 74, 85]);
    expect(names(decl)).toEqual(['y', 'm', 'd']);
    expect(names(eq)).toEqual(['y', 'm', 'd']);
    expect(names(ha)).toEqual(['y', 'm', 'd', 'lat']);
    expect(decl.parent).toBe('orbit:telephony/lib/zmanim.mjs#solarEventUTCmin');
    const z = await genOf(Z);
    expect(z[exp(decl)](2026, 6, 21)).toBeCloseTo(23.44, 1); // היפוך-הקיץ
    expect(z[exp(decl)](2026, 12, 21)).toBeCloseTo(-23.43, 1); // היפוך-החורף
    expect(Math.abs(z[exp(eq)](2026, 11, 3))).toBeGreaterThan(16); // משוואת-הזמן בשיאה בתחילת נובמבר
    const rows = await sunDirections('2026-10-14');
    expect(rows.map((r) => r.dir)).toEqual(['מזרח', 'דרום', 'מערב']);
    expect(rows[0].ha).toBeLessThan(0);
    expect(rows[2].ha).toBeGreaterThan(0);
  });

  it('גלקסיה: pulse עולה-ויורד · rot+x/y על מעגל · המרחק (hypot) והקרוב-ביותר בתוך רדיוס', async () => {
    const G = 'src/components/supporters/SupportersGalaxy.tsx';
    const pulse = part(G, 'SupportersGalaxy.useEffect.frame.pulse');
    expect(pulse.origins[0].line).toBe(95);
    expect(names(pulse)).toEqual(['t']);
    const rot = part(G, 'SupportersGalaxy.useEffect.frame.rot');
    expect(rot.origins[0].line).toBe(101);
    const x = part(G, 'SupportersGalaxy.useEffect.frame.x:step'); const y = part(G, 'SupportersGalaxy.useEffect.frame.y:step');
    expect([x.origins[0].line, y.origins[0].line]).toEqual([104, 105]);
    expect(x.name).toBe('מחשב נקודה על מעגל');
    const d = part(G, 'SupportersGalaxy.useEffect.frame.d');
    expect(d.name).toBe('מודד מרחק בין שתי נקודות');
    const best = part(G, 'SupportersGalaxy.useEffect.frame.best:after-loop');
    expect(best.origins[0].line).toBe(125);
    expect(names(best)).toEqual(['pos', 'mx', 'my']);
    const g = await genOf(G);
    const ps = [0, 20, 40, 60, 80, 100, 120].map((t) => g[exp(pulse)](t));
    expect(Math.max(...ps)).toBeLessThanOrEqual(1.06);
    expect(Math.min(...ps)).toBeGreaterThanOrEqual(0.94);
    expect(ps.some((v, k) => k > 0 && v < ps[k - 1]) && ps.some((v, k) => k > 0 && v > ps[k - 1])).toBe(true);
    // x,y של אותו כוכב לאורך הזמן ⇒ אליפסה סביב המרכז
    const full = (n: string) => part(G, 'SupportersGalaxy.useEffect.frame.' + n);
    const node = { angle: 0.25, radius: 0.5 };
    const pts = [0, 1000, 2000, 3000, 4000, 5000].map((t) => [g[exp(full('x'))](false, t, 100, 50, node), g[exp(full('y'))](false, t, 100, 50, node)]);
    for (const [px, py] of pts) expect(((px - 100) / 25) ** 2 + ((py - 100) / 15) ** 2).toBeCloseTo(1, 6);
    // הקרוב ביותר: נקודה ב-(10,0) רדיוס 3 קרובה מספיק ל-(12,1); נקודה רחוקה לא
    const pos = [{ id: 'a', x: 10, y: 0, r: 3 }, { id: 'b', x: 80, y: 80, r: 3 }];
    expect(g[exp(best)](pos, 12, 1)?.id).toBe('a');
    expect(g[exp(best)](pos, 40, 40)).toBeNull();
  });

  it('שעון-כסף: shownSec = max(0, target − elapsed) סופר לאחור · amount = rate·elapsed/3600 צובר', async () => {
    const M = 'src/components/timer/MoneyTimer.tsx';
    const shown = part(M, 'MoneyTimer.shownSec:step'); const amount = part(M, 'MoneyTimer.amount:step');
    expect([shown.origins[0].line, amount.origins[0].line]).toEqual([117, 119]);
    expect(names(shown)).toEqual(['mode', 'elapsedSec', 'timerTargetSec']);
    expect(names(amount)).toEqual(['elapsedSec', 'rateNum']);
    const m = await genOf(M);
    expect([0, 30, 60, 90].map((e) => m[exp(shown)]('timer', e, 60))).toEqual([60, 30, 0, 0]);
    expect([0, 1800, 3600].map((e) => m[exp(amount)](e, 120))).toEqual([0, 60, 120]);
    const b = beh('orbit').parts;
    const mo = (p: Part) => (b.find((e: { id: string }) => e.id === p.id).motion ?? []).map((x: { id: string }) => x.id);
    expect(mo(shown)).toContain('countdown');
    expect(mo(amount)).toContain('accumulate');
  });

  it('צליל: מעטפת-הזמן של tone() — עוצמה שדועכת לשקט (exponentialRamp), נמדד בהרצה', async () => {
    const S = 'src/components/parnasa/sound.ts';
    const gain = part(S, 'tone.gain:envelope'); const freq = part(S, 'tone.frequency:envelope');
    expect(names(gain)).toEqual(['t', 'd', 'g', 'since']);
    expect(names(freq)).toEqual(['f', 't', 'd', 'fEnd', 'since']);
    const s = await genOf(S);
    const at = (since: number) => s[exp(gain)](0, 0.34, 0.14, since);
    expect(at(0)).toBe(0);
    expect(at(0.004)).toBeCloseTo(0.14, 10);
    expect(at(0.34)).toBeCloseTo(0.0001, 10);
    const tail = [0.004, 0.05, 0.1, 0.2, 0.3, 0.34].map(at);
    expect(tail.every((v, k) => k === 0 || v < tail[k - 1])).toBe(true);
    expect(s[exp(freq)](175, 0, 0.16, 70, 0.16)).toBeCloseTo(70, 6); // 175 ⇒ 70 בסוף
    expect(s[exp(freq)](175, 0, 0.16, undefined, 0.1)).toBe(175); // בלי fEnd — אין רמפה (התנאי עבר לפונקציה)
    const e = beh('orbit').parts.find((x: { id: string }) => x.id === gain.id);
    expect(e.motion.map((x: { id: string }) => x.id)).toContain('decay');
  });
});

describe('פותח-הפונקציות — המנגנון', () => {
  it('דטרמיניסטי ומעודכן: בנייה מחדש של אורביט = המחסן, המונים והחתימות שבריפו (catalog/inner/scripts/open.mjs --check)', () => {
    const a = buildSource(ROOT, '', 'orbit');
    const b = buildSource(ROOT, '', 'orbit');
    expect(Object.keys(a.files)).toEqual(Object.keys(b.files));
    for (const [rel, text] of Object.entries(a.files)) expect(text === b.files[rel], rel + ' לא דטרמיניסטי').toBe(true);
    // בריפו: המחסן + המונים — זהים לבנייה
    for (const rel of [storePath('parts', 'orbit'), 'catalog/inner/open-orbit.json']) {
      expect(readFileSync(join(ROOT, rel), 'utf8') === a.files[rel], rel + ' לא מעודכן — node catalog/inner/scripts/open.mjs --source orbit').toBe(true);
    }
    // המודולים לא בריפו — החתימות שלהם כן
    const gen = Object.fromEntries(Object.entries(a.files).filter(([rel]) => rel.startsWith(genDir('orbit') + '/')));
    expect(manifestEntry('orbit', gen)).toEqual(readManifest(ROOT).sources.orbit.files);
    // הקובץ הפרוש = פרישת המחסן = הבנייה
    expect(docText(unpackParts(JSON.parse(a.files[storePath('parts', 'orbit')]))) === a.files['catalog/sources/inner-orbit.json']).toBe(true);
  }, 180_000);

  it('סיבות-דילוג נכונות, ותלות לא-טהורה נחתכת לקלט (הזרקה)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'inner-'));
    try {
      const f = join(dir, 'cases.ts');
      writeFileSync(f, `import { ext } from './nowhere';
const K = 3;
function sq(x: number) { return x * x; }
export function cases(a: number, b: number, el: { v: number }) {
  const viaHelper = sq(a) + K;
  const clockDep = Date.now();
  const later = clockDep + a * 2;
  const r = Math.random() * a;
  const imp = ext(a) + 1;
  const dom = document.title.length + a;
  const self = this.x + a;
  const trivial = a;
  el.v = a;
  let best = null, bd = 1e9;
  for (const p of [a, b]) { const d = Math.abs(p - b); if (d < bd) { bd = d; best = p; } }
  let bad = 0;
  for (const p of [a, b]) { if (p > 5) return p; bad += p; }
  const leak = [a].map((x) => { el.v = x; return x + 1; });
  return [viaHelper, later, r, imp, dom, self, trivial, best, bad, leak];
}
export async function waits(a: number) { const w = (await Promise.resolve(a)) * 2; return w; }
`);
      const program = makeProgram([f]);
      const r = openFile({ program, sf: program.getSourceFile(f)! });
      const by = (v: string) => r.lifts.filter((L: { value: string; form: string }) => L.value === v && L.form === 'slice');
      expect(by('viaHelper')).toHaveLength(1);
      expect(by('viaHelper')[0].helpers.length + by('viaHelper')[0].consts.length).toBe(2); // sq + K נכנסים
      expect(by('later')[0].params.map((p: { name: string }) => p.name)).toEqual(['a', 'clockDep']); // Date.now() ⇒ קלט מוזרק
      expect(by('best')).toHaveLength(1);
      expect(by('best')[0].kind).toBe('accumulator');
      for (const v of ['clockDep', 'r', 'imp', 'dom', 'self', 'trivial', 'bad', 'leak', 'w']) expect(by(v), v).toHaveLength(0);
      for (const k of ['clock', 'random', 'imported-call', 'dom', 'this', 'trivial', 'loop-return', 'mutation', 'await']) expect(r.skips[k], k).toBeGreaterThan(0);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('החוזה: inner-<source>.json עומד בסכמה (what:"inner", parent, origins), שמות בעברית-פועל, הורה ממקור-הקטלוג', () => {
    expect(INNER).toContain('orbit');
    for (const s of INNER) {
      const d = src(s);
      expect(validateSource(d, { strict: true }), s).toEqual([]);
      expect(d.generatedAt).toBeNull();
      const cat = JSON.parse(readFileSync(join(ROOT, 'catalog/sources', REPOS[s].catalog + '.json'), 'utf8'));
      const catIds = new Set(cat.parts.map((p: { id: string }) => p.id));
      expect(d.ref, s).toBe(cat.ref);
      for (const p of d.parts as Part[]) {
        expect(p.parent.startsWith(`${REPOS[s].catalog}:${p.path}#`), p.id).toBe(true);
        expect(p.tags.includes('parent:cataloged'), p.id).toBe(catIds.has(p.parent));
        expect(p.origins[0].line, p.id).toBeGreaterThan(0);
      }
    }
  });

  it('קובצי-ההתנהגות: שורה לכל חלק, פעלים רק מהאלפבית ב-n/n, תנועה ב-n/n, static עם סיבה', () => {
    const ids = new Set(VERBS.map((v) => v.id));
    const MOTION = new Set(['decay', 'countdown', 'accumulate', 'oscillate', 'orbit']);
    for (const s of INNER) {
      const d = beh(s);
      expect(d.parts.map((e: { id: string }) => e.id), s).toEqual(src(s).parts.map((p: Part) => p.id));
      for (const e of d.parts) {
        expect(['run', 'static'], e.id).toContain(e.labeledBy);
        for (const v of e.verbs) expect(ids.has(v.id), e.id + ' ' + v.id).toBe(true);
        if (e.labeledBy === 'run') for (const v of e.verbs) expect(v.holds, e.id).toMatch(/^(\d+)\/\1$/);
        if (e.labeledBy === 'static') { expect(e.reason, e.id).toBeTruthy(); expect(e.motion).toBeUndefined(); }
        for (const m of e.motion ?? []) { expect(MOTION.has(m.id), e.id).toBe(true); expect(m.holds, e.id).toMatch(/^(\d+)\/\1$/); }
      }
    }
  });

  it('הקורא מעודכן: הוכחה מחדש של ארבעת המודולים = בדיוק השורות שבקובץ (וגם דטרמיניסטי)', async () => {
    const FILES = ['telephony/lib/zmanim.mjs', 'src/components/supporters/SupportersGalaxy.tsx', 'src/components/timer/MoneyTimer.tsx', 'src/components/parnasa/sound.ts'];
    const committed = new Map(beh('orbit').parts.map((e: { id: string }) => [e.id, e]));
    for (const rel of FILES) {
      const parts = (orbit.parts as Part[]).filter((p) => p.path === rel);
      const abs = join(ROOT, 'catalog/inner/gen/orbit', rel + '.mjs');
      const sigs = readSigs(readFileSync(abs, 'utf8'));
      const job = {
        abs, pool: literalPool(join(ROOT, rel)),
        parts: parts.map((p) => ({ id: p.id, exp: exp(p), sig: { takes: sigs[exp(p)].map((t: object, k: number) => ({ ...t, kind: p.takes[k]?.kind ?? 'unknown' })) }, motionKey: p.symbol.replace(/\.[^.]*$/, '') + (p.symbol.endsWith(':step') ? ':step' : '') })),
      };
      const once = async () => { const { results, pairs } = await proveJob(job, { B, seed: SEED }); return entriesFor(parts, results, pairs, new Map(job.parts.map((p) => [p.id, p.sig]))); };
      const a = await once();
      expect(JSON.stringify(a)).toBe(JSON.stringify(await once()));
      for (const e of a) expect(e, e.id + ' — הרץ: node catalog/inner/scripts/prove.mjs --source orbit').toEqual(committed.get(e.id));
    }
  }, 240_000);

  it('ההרמה (lift.json) מעודכנת ונספרת מכל 959 ההתנהגויות', () => {
    const lift = computeLift(ROOT);
    expect(lift.behaviors.total).toBe(959); // + 16 של «מוקד-חלוקה» + 3 של PRODUCT-V2
    expect(JSON.stringify(lift, null, 1) + '\n').toBe(readFileSync(join(ROOT, 'catalog/inner/lift.json'), 'utf8'));
  }, 60_000);
});

describe('צופי-התנועה — החוקים נושכים', () => {
  const xs = Array.from({ length: 48 }, (_, i) => i);
  it('סינוס ⇒ מתנדנד · רעש ⇒ כלום · דעיכה מעריכית ⇒ דועך · קו ישר עולה ⇒ לא דועך', () => {
    expect(seriesTraits(xs.map((i) => Math.sin(i * 0.7))).traits.has('oscillate')).toBe(true);
    const r = B.rng(9);
    const noise = seriesTraits(xs.map(() => r.next()));
    expect(noise.traits.size).toBe(0);
    expect(seriesTraits(xs.map((i) => 5 * Math.exp(-i / 10))).traits.has('decay')).toBe(true);
    expect(seriesTraits(xs.map((i) => 2 * i + 1)).traits.has('decay')).toBe(false);
    expect(seriesTraits(xs.map((i) => 2 * i + 1)).traits.has('oscillate')).toBe(false);
  });
  it('סופר לאחור (קו יורד עד רצפה) · צובר רק כשהקצב תלוי בקלט אחר', () => {
    const sig = { takes: [{ name: 'rate', d: { t: 'num' } }, { name: 'elapsed', d: { t: 'num' } }] };
    const left = motionOf({ sig, call: (a: number[]) => ({ v: Math.max(0, 100 - a[1]) }), key: 'k', seed: 1, B });
    expect(left.motion.map((m: { id: string; on: string }) => m.id + ':' + m.on)).toContain('countdown:elapsed');
    const acc = motionOf({ sig, call: (a: number[]) => ({ v: a[0] * a[1] / 3600 }), key: 'k', seed: 1, B });
    expect(acc.motion.map((m: { id: string; on: string }) => m.id + ':' + m.on)).toContain('accumulate:elapsed');
    const shift = motionOf({ sig, call: (a: number[]) => ({ v: a[1] + 5 }), key: 'k', seed: 1, B });
    expect(shift.motion.map((m: { id: string }) => m.id)).not.toContain('accumulate'); // x+5 — אותו שיפוע תמיד
  });
});

describe('פרטיות', () => {
  it('אין מייל/טלפון/ת״ז/טוקן ב-gen, במקורות ובהתנהגות הפנימיים', () => {
    const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
    const files = [...walk(join(ROOT, 'catalog/inner/gen')), ...INNER.flatMap((s) => [join(ROOT, 'catalog/sources', `inner-${s}.json`), join(ROOT, 'catalog/behavior', `inner-${s}.json`)])];
    for (const f of files) {
      const text = readFileSync(f, 'utf8').split('\n').filter((l) => !/"ref":/.test(l)).join('\n');
      for (const re of PII) expect(re.test(text), f + ' ' + re).toBe(false);
    }
  });
});

describe('v2 · מעקב-ייבוא בתוך הריפו (פרויקט-סינתטי, מורץ)', () => {
  it('עוזר מקובץ אחר נכנס (טרנזיטיבי · כינוי · namespace · מעגל) — ועוזר לא-טהור / חבילה / עומק-יתר / קבוע-שמשתנה נשארים בחוץ עם סיבה', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'inner2-'));
    try {
      const W = (f: string, t: string) => writeFileSync(join(dir, f), t);
      W('util.ts', `export const RATE = 3;
function bump(x: number) { return x > 10 ? 1 : 0; }
export function scale(x: number) { return x * RATE + bump(x); }
export const fmt = (n: number) => n.toFixed(1);
export function readDisk(p: string) { return localStorage.getItem(p); }
export function addDay(ms: number) { const t = new Date(ms); t.setDate(t.getDate() + 1); return t.getTime(); }
export const REG = [1, 2];
export function total() { return REG.length; }
`);
      W('cyc-a.ts', `import { isOdd } from './cyc-b';\nexport function isEven(n: number): boolean { return n === 0 ? true : isOdd(n - 1); }\n`);
      W('cyc-b.ts', `import { isEven } from './cyc-a';\nexport function isOdd(n: number): boolean { return n === 0 ? false : isEven(n - 1); }\n`);
      for (let i = 0; i <= MAX_HOPS + 1; i++) W(`d${i}.ts`, i <= MAX_HOPS ? `import { f${i + 1} } from './d${i + 1}';\nexport function f${i}(x: number): number { return f${i + 1}(x) + 1; }\n` : `export function f${i}(x: number): number { return x; }\n`);
      W('main.ts', `import { scale, fmt as format, readDisk, addDay, total, REG } from './util';
import * as U from './util';
import { isEven } from './cyc-a';
import { f0 } from './d0';
import { useState } from 'react';
REG.push(3);
export function main(a: number, b: Set<number>, c: Set<number>) {
  const viaImport = scale(a) + 1;
  const viaAlias = format(a / 2);
  const viaNs = U.scale(a) * 2;
  const viaCycle = isEven(a) ? 1 : 0;
  const tooDeep = f0(a) + 1;
  const impure = readDisk('k') + a;
  const pkg = useState(a)[0] + 1;
  const mutated = total() + a;
  const off = 2;
  const add = (x: number) => x + off + a;
  const viaClosure = add(3) * 2;
  const nextDay = addDay(a) - a;
  const both = b.union(c).size + 0;
  return [viaImport, viaAlias, viaNs, viaCycle, tooDeep, impure, pkg, mutated, viaClosure, nextDay, both];
}
`);
      const files = ['util.ts', 'cyc-a.ts', 'cyc-b.ts', 'main.ts', ...Array.from({ length: MAX_HOPS + 2 }, (_, i) => `d${i}.ts`)].map((f) => join(dir, f));
      const program = makeRepoProgram(files, dir);
      const mine = new Set(files.map((f) => program.getSourceFile(f)));
      const sf = program.getSourceFile(join(dir, 'main.ts'))!;
      const r = openFile({ program, sf, repo: makeRepoCtx(program, (x: unknown) => mine.has(x as never)) });
      const by = (v: string) => r.lifts.filter((L: { value: string; form: string }) => L.value === v && L.form === 'slice');
      for (const v of ['viaImport', 'viaAlias', 'viaNs', 'viaCycle', 'viaClosure', 'nextDay', 'both']) expect(by(v), v).toHaveLength(1);
      for (const v of ['tooDeep', 'impure', 'pkg', 'mutated']) expect(by(v), v).toHaveLength(0);
      for (const k of ['import-depth', 'io', 'package-call', 'module-state']) expect(r.skips[k], k).toBeGreaterThan(0);
      expect(by('viaImport')[0].foreign).toBe(true);
      expect(by('viaClosure')[0].params.map((p: { name: string }) => p.name)).toEqual(['a']); // off = קבוע מילולי; a = קלט
      // המודול: נטען ורץ — אותה תשובה כמו הקוד המקורי
      const mod = moduleText(r.lifts, sf, '// t');
      expect(mod.text).toContain('const format = fmt;');
      expect(mod.text).toMatch(/const U = \{ scale \};/);
      const genFile = join(dir, 'gen.mjs');
      writeFileSync(genFile, toJs(mod.text, false));
      const m = loadInSandbox(await bundleFile(genFile, { esm: true })).exports;
      const call = (v: string, ...xs: unknown[]) => m[exportName(by(v)[0].symbol)](...xs);
      expect(call('viaImport', 12)).toBe(12 * 3 + 1 + 1);
      expect(call('viaAlias', 5)).toBe('2.5');
      expect(call('viaNs', 2)).toBe(12);
      expect([call('viaCycle', 4), call('viaCycle', 7)]).toEqual([1, 0]);
      expect(call('viaClosure', 10)).toBe(30);
      expect(call('nextDay', Date.UTC(2026, 9, 14))).toBe(86_400_000);
      expect(call('both', new Set([1, 2]), new Set([2, 3]))).toBe(3);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }, 60_000);
});

describe('v2 · המחסן הדחוס והמודולים לפי דרישה', () => {
  it('פרישת המחסן = הקבצים הפרושים ביט-אחר-ביט; קידוד-מחדש = אותו מחסן; 0 שדות-עקיפה', () => {
    for (const s of INNER) {
      const store = JSON.parse(readFileSync(join(ROOT, storePath('parts', s)), 'utf8'));
      const doc = unpackParts(store);
      expect(docText(doc) === readFileSync(join(ROOT, 'catalog/sources', `inner-${s}.json`), 'utf8'), s).toBe(true);
      const again = packParts(doc, { short: s, catalog: REPOS[s].catalog });
      expect(again.overrides, s).toBe(0);
      expect(JSON.stringify(again.store)).toBe(JSON.stringify(store));
      const bs = JSON.parse(readFileSync(join(ROOT, storePath('behavior', s)), 'utf8'));
      const ids = doc.parts.map((p: { id: string }) => p.id);
      expect(docText(unpackBehavior(bs, ids)) === readFileSync(join(ROOT, 'catalog/behavior', `inner-${s}.json`), 'utf8'), s).toBe(true);
      expect(packBehavior(unpackBehavior(bs, ids), ids).overrides, s).toBe(0);
    }
  });

  it('המניפסט: כל מודול על הדיסק תואם לחתימה; החבילות של הריפואים החיצוניים תואמות למניפסט; לאורביט אין חבילה', () => {
    const man = readManifest(ROOT);
    for (const s of INNER) {
      const e = man.sources[s];
      expect(e, s).toBeTruthy();
      for (const [k, h] of Object.entries(e.files)) expect(hashOf(readFileSync(join(ROOT, genDir(s), k + '.mjs'), 'utf8')), k).toBe(h);
      if (REPOS[s].dir) {
        expect(e.pack).toBe(packPath(s));
        const files = JSON.parse(readPack(ROOT, s)!);
        expect(Object.keys(files).sort()).toEqual(Object.keys(e.files).sort());
        for (const [k, t] of Object.entries(files)) expect(hashOf(t as string), k).toBe(e.files[k]);
      } else expect(existsSync(join(ROOT, packPath(s)))).toBe(false);
    }
  });

  it('משקל-הריפו של הפנימיים < 10MB (המודולים והקבצים הפרושים — gitignored)', () => {
    const size = (rel: string) => { try { return readFileSync(join(ROOT, rel)).length; } catch { return 0; } };
    const dirFiles = (rel: string) => (existsSync(join(ROOT, rel)) ? readdirSync(join(ROOT, rel)).map((f) => rel + '/' + f) : []);
    const committed = [...dirFiles('catalog/inner/store'), ...dirFiles('catalog/inner/pack'), ...readdirSync(join(ROOT, 'catalog/inner')).filter((f) => f.endsWith('.json')).map((f) => 'catalog/inner/' + f)];
    const total = committed.reduce((s, f) => s + size(f), 0);
    expect(total).toBeLessThan(10 * 1024 * 1024);
    const ig = readFileSync(join(ROOT, '.gitignore'), 'utf8');
    for (const p of ['catalog/inner/gen/', 'catalog/sources/inner-*.json', 'catalog/behavior/inner-*.json']) expect(ig).toContain(p);
  });
});
