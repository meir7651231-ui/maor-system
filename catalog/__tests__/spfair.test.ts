/**
 * ⚖️ SP-FAIR (15.10.2026) — מבחן הוגן למנוע-השרטוטים-העצמי: "האם הוא באמת יודע לגלות לבד, או שכוונן למטרה אחת?"
 *
 * מה ננעל:
 * 1. המנוע קפוא: catalog/selfprint/*.mjs + budget.json — אותם בתים כמו ב-da2db65 (SELFPRINT), חוץ משורה אחת ב-selfprint.mjs
 *    (באג שמנע ריצה בזרע 1: best=null ⇒ קריסה; ההחזרה שלה נותנת בדיוק את הקובץ המקורי). הכלי לא נוגע בהם; הוא
 *    משנה רק את זרע-הדגימה של הצמיחה (sampleIdx ^ salt) ואת מספר הסבבים — דרך hook.mjs, בזמן-ריצה.
 * 2. שומר-המטרות: targets.mjs (המטרות שהמנוע לא כוון אליהן) חסום לקריאה כל עוד המנוע רץ; ואף קובץ של המנוע לא מזכיר אותו.
 * 3. הברז: נקודת-ההזרקה מופיעה בדיוק פעם אחת ב-selfprint.mjs; וההרצה s0 (בלי שינוי) נתנה פלטים זהים בבתים לענף.
 * 4. כלי-המדידה: פגיעה מדויקת / עטיפה / נפילה-בלחץ מזוהות נכון על מדף-צעצוע.
 * 5. התוצאות שבריפו (runs/*.json) עקביות עם summary.json, ושיפורים שגויים = 0 בכל ההרצות.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import * as L from '../grow/lib.mjs';
import { budgetText, blockedTargets, TAP_AT } from '../spfair/fairlib.mjs';
import { TARGETS, NUM_TARGETS, LIST_TARGETS } from '../spfair/targets.mjs';
import { scanTargets, ownStress } from '../spfair/measure.mjs';
import { summarize } from '../spfair/summarize.mjs';

const ROOT = join(__dirname, '../..');
const SP = join(ROOT, 'catalog/selfprint');
const FAIR = join(ROOT, 'catalog/spfair');

describe('SP-FAIR · המנוע קפוא', () => {
  // RINGS-PORT (15.10.2026): "המנוע קפוא" היה האינווריאנט של SP-FAIR בבסיס שלו (da2db65). אחרי המיזוג אל MINER2 ואל
  // RINGS-PORT המנוע משתנה במכוון — ההרצות runs/*.json נשארות כתיעוד של המנוע ההוא. במקומו ננעל המבחן הנסתר:
  it('המבחן הנסתר (RINGS-PORT) חתום: sha256 של הקובץ = SHA256 = הערך שננעל בקומיט הראשון', () => {
    const SEAL = 'e20b72e6f175309b4e5bc463693ddc49585ca85d40ec8cc7d2a7bd3f9ab6f7a0';
    const h = createHash('sha256').update(readFileSync(join(FAIR, 'hidden/targets-hidden.mjs'))).digest('hex');
    expect(h).toBe(SEAL);
    expect(readFileSync(join(FAIR, 'hidden/SHA256'), 'utf8').trim()).toBe(SEAL);
  });
  it('budgetText: רק rounds משתנה; salt מוסיף שדה-סימון בלבד; בלי שניהם ⇒ null (הקובץ כמו שהוא)', () => {
    const raw = readFileSync(join(SP, 'budget.json'), 'utf8');
    expect(budgetText(raw, 0, null)).toBeNull();
    const a = JSON.parse(budgetText(raw, 0, 6)!); const b = JSON.parse(raw);
    expect(a.rounds).toBe(6);
    expect({ ...a, rounds: b.rounds }).toEqual(b);
    const c = JSON.parse(budgetText(raw, 2, null)!);
    expect(c.spfair).toEqual({ salt: 2 });
    delete c.spfair; expect(c).toEqual(b);
  });
  it('נקודת-הברז מופיעה בדיוק פעם אחת ב-selfprint.mjs', () => {
    expect(readFileSync(join(SP, 'selfprint.mjs'), 'utf8').split(TAP_AT).length - 1).toBe(1);
  });
});

describe('SP-FAIR · שומר-המטרות', () => {
  it('בזמן שהמנוע רץ — targets.mjs חסום; אחרי — פתוח', () => {
    const g = globalThis as { __spfairEngine?: boolean };
    g.__spfairEngine = true;
    try { expect(blockedTargets(join(FAIR, 'targets.mjs'))).toBe(true); expect(blockedTargets(join(FAIR, 'measure.mjs'))).toBe(false); } finally { g.__spfairEngine = false; }
    g.__spfairEngine = true;
    try { expect(blockedTargets(join(FAIR, 'hidden/targets-hidden.mjs'))).toBe(true); } finally { g.__spfairEngine = false; }
    expect(blockedTargets(join(FAIR, 'targets.mjs'))).toBe(false);
  });
  it('אף קובץ של המנוע או של הצמיחה לא מזכיר את spfair / targets', () => {
    for (const dir of ['catalog/selfprint', 'catalog/grow']) for (const f of readdirSync(join(ROOT, dir)).filter((x) => x.endsWith('.mjs'))) {
      // guard.mjs מזכיר את spfair/hidden רק כדי לחסום אותו (RINGS-PORT) — שורת-החסימה לא נחשבת
      const src = readFileSync(join(ROOT, dir, f), 'utf8').split('\n').filter((l) => !(f === 'guard.mjs' && l.includes('/catalog\\/spfair\\/hidden\\//'))).join('\n');
      expect(src, dir + '/' + f).not.toMatch(/spfair|targets\.mjs|targets-hidden/);
    }
  });
});

describe('SP-FAIR · מימושי-הייחוס', () => {
  it('דוגמאות יד', () => {
    expect(NUM_TARGETS.median.f([3, 1, 2])).toBe(2);
    expect(NUM_TARGETS.median.f([4, 1, 3, 2])).toBe(2.5);
    expect(NUM_TARGETS.range.f([3, -1, 2])).toBe(4);
    expect(NUM_TARGETS.variance.f([1, 2, 3, 4])).toBe(1.25);
    expect(NUM_TARGETS.product.f([2, 3, 4])).toBe(24);
    expect(NUM_TARGETS.secondLargest.f([5, 9, 9, 1])).toBe(9);
    expect(NUM_TARGETS.argmax.f([1, 7, 3, 7])).toBe(1);
    expect(NUM_TARGETS.countAboveMean.f([1, 2, 3, 10])).toBe(1);
    expect(LIST_TARGETS.deviations.f([1, 2, 3])).toEqual([-1, 0, 1]);
    expect(LIST_TARGETS.cumsum.f([1, 2, 3])).toEqual([1, 3, 6]);
    expect(NUM_TARGETS.median.f([])).toBeNull();
    expect(TARGETS.length).toBe(Object.keys(NUM_TARGETS).length + Object.keys(LIST_TARGETS).length);
  });
  it('קלטי-הלחץ שלנו: 16 רשימות, 40–500, כוללים ±10^15 ושליליים וכפולים', () => {
    const s = ownStress().map(([xs]) => xs as number[]);
    expect(s.length).toBe(16);
    expect(Math.min(...s.map((x) => x.length))).toBe(40);
    expect(Math.max(...s.map((x) => x.length))).toBe(500);
    expect(s.some((x) => x.some((v) => Math.abs(v) > 1e14))).toBe(true);
    expect(s.some((x) => new Set(x).size < x.length / 4)).toBe(true);
  });
});

describe('SP-FAIR · כלי-המדידה על מדף-צעצוע', () => {
  const sig = ['nums'];
  const mk = (id: string, fn: (xs: number[]) => number | null, of: string[] = []) => {
    const Sx = L.samplesOf(sig) as number[][][];
    return { id, sig, out: 'num', of, floor: 1, form: 'chain', steps: 1, nParts: 1, fn, outs: Sx.map(([xs]) => { try { const v = fn(xs); return v === null || !Number.isFinite(v) ? null : v; } catch { return null; } }) };
  };
  type T = ReturnType<typeof mk>;
  const R = {
    samplesOf: L.samplesOf, stressOf: L.stressSamples,
    runOne: (t: T, a: number[][]) => { try { const v = t.fn(a[0]); return { v: v === null || !Number.isFinite(v) ? null : v, s: 1 }; } catch { return { v: null, s: 1 }; } },
  };
  const median = (xs: number[]) => NUM_TARGETS.median.f(xs) as number | null;
  const things = new Map<string, T>();
  const exact = mk('exact', median);
  const wrap = mk('wrap', (xs) => median(xs), ['exact']);
  const weak = mk('weak', (xs) => (xs.length > 20 ? 0 : median(xs))); // נכון בסט, שגוי ברשימות ארוכות
  for (const t of [exact, wrap, weak]) things.set(t.id, t);
  const shelf = new Map([['a', exact], ['b', wrap], ['c', weak]]);
  const res = scanTargets({ R, L, things, shelf, targets: TARGETS.filter((x) => x.id === 'median'), thingSteps: 1e9 });
  it('פגיעה מדויקת אחת; העטיפה והנופל-בלחץ — רק "כמעט"', () => {
    expect(res.hits.map((h: { id: string }) => h.id)).toEqual(['exact']);
    const near = Object.fromEntries(res.near.map((n: { id: string }) => [n.id, n]));
    expect(near.wrap.why).toBe('עטיפה');
    expect(near.weak.stressFail.why).toBe('פלט שונה');
    expect(res.best.median.pct).toBe(100);
  });
});

describe('SP-FAIR · התוצאות שבריפו', () => {
  // בסדר של plan.json (כמו fair.mjs) — הסדר קובע את סדר הרשימות בסיכום
  const planOrder = Object.keys(JSON.parse(readFileSync(join(FAIR, 'plan.json'), 'utf8')).runs);
  const onDisk = new Set(readdirSync(join(FAIR, 'runs')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')));
  const runs = Object.fromEntries([...planOrder.filter((n) => onDisk.has(n)), ...[...onDisk].filter((n) => !planOrder.includes(n)).sort()].map((n) => [n, JSON.parse(readFileSync(join(FAIR, 'runs', n + '.json'), 'utf8'))]));
  it('יש את כל ההרצות של plan.json', () => {
    const plan = JSON.parse(readFileSync(join(FAIR, 'plan.json'), 'utf8'));
    expect(Object.keys(runs).sort()).toEqual(Object.keys(plan.runs).sort());
  });
  it('s0 (בלי שינוי) — פלטי-המנוע זהים בבתים לקבצים שבענף ⇒ הכלי לא משנה כלום', () => {
    expect(Object.values(runs.s0.sameBytesAsBranch).every(Boolean)).toBe(true);
  });
  it('שיפורים שגויים = 0 בכל ההרצות', () => {
    for (const [n, r] of Object.entries(runs)) expect((r as { wrongImprovements: number }).wrongImprovements, n).toBe(0);
  });
  it('summary.json = summarize(runs/*)', () => {
    expect(existsSync(join(FAIR, 'summary.json'))).toBe(true);
    const s = JSON.parse(readFileSync(join(FAIR, 'summary.json'), 'utf8'));
    expect({ about: s.about, ...summarize(runs) }).toEqual(s);
  });
});
