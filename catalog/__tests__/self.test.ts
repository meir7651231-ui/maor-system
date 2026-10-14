/**
 * 🪞 SELF (14.10.2026) — ratchet: "המכונה משפרת את עצמה עם החלקים שלה".
 * המכונה הריצה את המפקד, הפותח והקורא שלה על הקוד של עצמה (catalog/scripts/self-check.mjs ⇒ catalog/self/report.json),
 * ובדקה כל עוזר מול החוקים של הפועל שהתפקיד שלו אומר (catalog/self/roles.mjs). כל חוק שנכשל היה באג — ותוקן:
 *
 *   1. «מסיר כפולים» · dedupe.keeps — האינדקס (combiner/core.mjs › buildIndex) איחד חלקים לפי שם+חתימה בלבד, ולכן שני
 *      חלקים **שונים** עם אותו שם (enrollStatusMeta/planLabelOf/needsCare/fmtDm בשני קבצים של אורביט, getUpdates.offset
 *      ב-14kk…) נבלעו לאחד, והפעלים שהוכחו על אחד נרשמו לשני. מוטנט: האיחוד הישן (בלי splitByBehavior).
 *   2. «מטביע חותם» · fingerprint.fixed — behaviorHash = fnvHash(…).toString(16) בלי ריפוד ⇒ 7 או 8 תווים.
 *      מוטנט: toString(16) בלי padStart.
 *   3. «מגביל» · clamp.formula — מספר-השכנים של «מחבר לשכנים» (kOf / nearNet) עשה Math.abs לפני החיתוך ⇒ near=-23 נתן 8
 *      (התקרה) במקום 1 (הרצפה). מוטנט: Math.abs לפני החיתוך.
 *   4. דטרמיניזם ("אותו קוד ⇒ אותו קובץ") — prove.mjs / behavior-probe.mjs / baseline.mjs בלי השכפולים כתבו מחדש את
 *      המחסנים והקבצים של הריפואים החיצוניים (בלי מילון-הקוד ⇒ קלטים אחרים ⇒ תוצאות אחרות; או 'no-clone' על הכול).
 *      נתפס כשהמכונה הריצה את עצמה בלי ../catsrc. עכשיו: בלי שכפול — הקובץ נשמר כמו שהוא, ונאמר.
 * ובנוסף: חלקי-המכונה (catalog/self/parts.mjs) מוכחים לפועל שלהם, ואין יותר העתקים שלהם בקוד שהוחלף.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { buildIndex, splitByBehavior } from '../combiner/core.mjs';
import { nearNet } from '../core/near-net.mjs';
import { VERB_BY_ID } from '../lib/verbs.mjs';
import { evalVerb, bindingsOf, baseCases, fOf, directCall, PROBE } from '../lib/probe.mjs';
import { fnv1a, fnvHex, byId, rankCounts } from '../self/parts.mjs';
import { runRoles, ROLES } from '../self/roles.mjs';
import { bundleBridge } from '../lib/load-bridge.mjs';
import { stampOf, fingerprint } from '../lib/cache.mjs';
import { writeFileSync } from 'node:fs';

const ROOT = join(__dirname, '..', '..');
const report = JSON.parse(readFileSync(join(ROOT, 'catalog/self/report.json'), 'utf8'));
type B = Record<string, unknown>;
const loadB = async () => (await import(pathToFileURL(await bundleBridge()).href)) as B;
/** האם חוק מסוים של פועל נכשל על פונקציה (directCall — המוטנטים והמימושים-לדוגמה, כמו ב-verbs.test). */
async function lawFails(verbId: string, lawId: string, fn: (...a: unknown[]) => unknown, takes: { name: string; d: unknown }[]) {
  const B = await loadB();
  const verb = VERB_BY_ID.get(verbId);
  const sig = { takes };
  const call = directCall(fn);
  const cases = baseCases(sig, call, 7, B);
  for (const b of bindingsOf(verb, sig, cases)) {
    const rep = evalVerb(verb, b, sig, cases, fOf(call), 7, B, true);
    if (rep && rep.laws[lawId]?.fail) return true;
  }
  return false;
}

describe('SELF — המכונה בודקת את עצמה', () => {
  it('הדוח מעודכן: מפקד המכונה (machine-census --check), ומספרים סבירים', () => {
    execFileSync(process.execPath, [join(ROOT, 'catalog/scripts/machine-census.mjs'), '--check'], { stdio: 'pipe' });
    expect(report.census.parts).toBeGreaterThan(400);
    expect(report.parts.totals.run).toBeGreaterThan(200);
    expect(report.inner.totals.parts).toBeGreaterThan(1000);
  });

  it('כל התפקידים עומדים בחוקי הפועל שלהם, n/n — בהרצה, באותו ארגז-חול ואותו זרע', async () => {
    const rows = await runRoles({ B: await loadB(), seed: report.seed });
    expect(rows.length).toBe(ROLES.length);
    for (const r of rows) expect(r.held, `${r.part} · ${r.verb}: ${r.law} — ${r.why}`).toBe(true);
    for (const r of rows) expect(r.holds, r.part).toMatch(/^(\d+)\/\1$/);
    // הדוח שבריפו = ההרצה הזאת
    expect(report.roles.list).toEqual(rows);
  }, 60_000);
});

describe('SELF — 1 · «מסיר כפולים»: האינדקס לא בולע חלק שאינו כפול', () => {
  const part = (id: string, symbol: string) => ({ id, source: 't', path: 'f.mjs', symbol, lang: 'js', what: 'function', name: 'מחשב ערך', does: '', takes: [{ name: 'x', kind: 'text', type: 'unknown' }], gives: { kind: 'text', type: 'unknown' }, pure: true, example: null, tags: [] });
  const beh = (rows: [string, string][]) => new Map(rows.map(([id, hash]) => [id, { labeledBy: 'run', verbs: [], hash }]));

  it('אותה צורה, פלטים שונים ⇒ שני חלקים; אותם פלטים ⇒ חלק אחד (שני בתים)', () => {
    const ps = [part('t:a.mjs#norm', 'norm'), part('t:b.mjs#norm', 'norm'), part('t:c.mjs#norm', 'norm')];
    const ix = buildIndex(ps, { behavior: beh([['t:a.mjs#norm', 's-1'], ['t:b.mjs#norm', 's-2'], ['t:c.mjs#norm', 's-1']]) });
    expect(ix.parts.map((p: { id: string; homes: unknown[] }) => [p.id, p.homes.length])).toEqual([['t:a.mjs#norm', 2], ['t:b.mjs#norm', 1]]);
  });

  it('צורות שונות לא מושוות (קלטים אחרים ⇒ פלטים אחרים) — נשאר מאוחד כמו קודם', () => {
    const ps = [part('t:a.mjs#norm', 'norm'), part('t:b.mjs#norm', 'norm')];
    expect(splitByBehavior(ps, beh([['t:a.mjs#norm', 'x-1'], ['t:b.mjs#norm', 'y-2']]))).toHaveLength(1);
  });

  it('על הקטלוג האמיתי: אין קבוצה באינדקס שיש בה שני בתים באותה צורה עם פלטים שונים', async () => {
    const { loadParts, loadBehavior } = await import('../combiner/load.mjs');
    const behavior = loadBehavior();
    const ix = buildIndex(loadParts(), { behavior });
    let bad = 0; let split = 0;
    for (const p of ix.parts) {
      const outs = new Map<string, Set<string>>();
      for (const h of p.homes ?? []) { const x = behavior.get(h.id)?.hash; if (!x) continue; const [s, o] = x.split('-'); if (!outs.has(s)) outs.set(s, new Set()); outs.get(s)!.add(o); }
      if ([...outs.values()].some((o) => o.size > 1)) bad++;
    }
    for (const p of loadParts()) if (p.id === 'orbit:src/components/courses/lib.ts#enrollStatusMeta' || p.id.endsWith('#enrollStatusMeta')) split++;
    expect(bad).toBe(0);
    expect(split).toBeGreaterThanOrEqual(2);
  }, 60_000);
});

describe('SELF — 2 · «מטביע חותם»: טביעת-ההתנהגות באורך קבוע', () => {
  it('המוטנט הישן (toString(16) בלי ריפוד) נתפס ב-fingerprint.fixed; fnvHex עובר', async () => {
    const takes = [{ name: 's', d: { t: 'str' } }];
    expect(await lawFails('fingerprint', 'fingerprint.fixed', (s) => fnv1a(String(s)).toString(16), takes)).toBe(true);
    expect(await lawFails('fingerprint', 'fingerprint.fixed', (s) => fnvHex(String(s)), takes)).toBe(false);
  });

  it('כל טביעה שבריפו = 8+8 הקס (catalog/behavior/* · catalog/inner/store/behavior-*)', () => {
    const re = /^[0-9a-f]{8}-[0-9a-f]{8}$/;
    for (const f of readdirSync(join(ROOT, 'catalog/behavior')).filter((x) => x.endsWith('.json'))) {
      for (const e of JSON.parse(readFileSync(join(ROOT, 'catalog/behavior', f), 'utf8')).parts) if (e.hash) expect(e.hash, f + ' ' + e.id).toMatch(re);
    }
    for (const f of readdirSync(join(ROOT, 'catalog/inner/store')).filter((x) => x.startsWith('behavior-'))) {
      for (const r of JSON.parse(readFileSync(join(ROOT, 'catalog/inner/store', f), 'utf8')).rows) {
        const h = Array.isArray(r) ? r[7] : r.raw?.hash;
        if (typeof h === 'string') expect(h, f).toMatch(re);
      }
    }
  });
});

describe('SELF — 3 · «מגביל»: מספר-השכנים לא דולף', () => {
  const pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }, { x: 7, y: 0 }];
  it('near ≤ 0 ⇒ שכנה אחת (הרצפה), לא |near|', () => {
    expect(nearNet({ points: pts, near: -23 }).edges).toEqual(nearNet({ points: pts, near: 1 }).edges);
    expect(nearNet({ points: pts, near: 50 }).edges).toEqual(nearNet({ points: pts, near: 8 }).edges);
  });
  it('המוטנט הישן (Math.abs לפני החיתוך) נתפס ב-clamp.formula', async () => {
    const takes = [{ name: 'near', d: { t: 'int', lo: -20, hi: 30 } }];
    expect(await lawFails('clamp', 'clamp.formula', (n) => Math.max(1, Math.min(8, Math.floor(Math.abs(Number(n))) || 1)), takes)).toBe(true);
    expect(await lawFails('clamp', 'clamp.formula', (n) => Math.max(1, Math.min(8, Math.floor(Number(n)) || 1)), takes)).toBe(false);
  });
});

describe('SELF — 4 · דטרמיניזם: בלי שכפול — הקובץ נשמר', () => {
  it('prove.mjs --source 14kk ו-behavior-probe.mjs --source buildsmart בלי ../catsrc לא נוגעים בקבצים', () => {
    const empty = mkdtempSync(join(tmpdir(), 'no-catsrc-'));
    const files = ['catalog/inner/store/behavior-14kk.json', 'catalog/behavior/buildsmart.json'];
    const before = files.map((f) => readFileSync(join(ROOT, f), 'utf8'));
    try {
      const a = execFileSync(process.execPath, [join(ROOT, 'catalog/inner/scripts/prove.mjs'), '--source', '14kk', '--src', empty], { encoding: 'utf8' });
      const b = execFileSync(process.execPath, [join(ROOT, 'catalog/scripts/behavior-probe.mjs'), '--source', 'buildsmart', '--src', empty], { encoding: 'utf8' });
      expect(a).toMatch(/נשמר/);
      expect(b).toMatch(/נשמר/);
    } finally { rmSync(empty, { recursive: true, force: true }); }
    expect(files.map((f) => readFileSync(join(ROOT, f), 'utf8'))).toEqual(before);
  }, 60_000);
});

describe('SELF — חלקי-המכונה: פעם אחת, מוכחים, בלי העתקים', () => {
  it('byId · rankCounts — אותה התנהגות כמו ההעתקים שהוחלפו', () => {
    const xs = [{ id: 'b' }, { id: 'a' }, { id: 'c' }, { id: 'a' }];
    expect(xs.slice().sort(byId)).toEqual(xs.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
    expect(Object.entries(rankCounts({ x: 1, y: 3, a: 3 }))).toEqual([['a', 3], ['y', 3], ['x', 1]]);
  });
  it('אין יותר FNV-1a או ממיין-לפי-id מועתק בקבצים שהוחלפו', () => {
    const replaced = ['catalog/lib/probe.mjs', 'catalog/lib/verbs.mjs', 'catalog/lib/verbs-sun.mjs', 'catalog/combiner/core.mjs', 'catalog/scripts/core-b-census.mjs', 'catalog/scripts/core-c-census.mjs', 'catalog/scripts/core-census.mjs', 'catalog/scripts/orbit-census.mjs', 'catalog/scripts/behavior-probe.mjs', 'catalog/inner/lib/build.mjs', 'catalog/inner/scripts/prove.mjs', 'catalog/lib/build-index.mjs', 'catalog/lib/entry.mjs'];
    for (const f of replaced) {
      const t = readFileSync(join(ROOT, f), 'utf8');
      expect(t, f).not.toMatch(/0x811c9dc5/);
      expect(t, f).not.toMatch(/a\.id < b\.id \? -1 : a\.id > b\.id \? 1 : 0/);
      expect(t, f).not.toMatch(/Object\.fromEntries\(Object\.entries\([^)]*\)\.sort\(\(a, b\) => b\[1\] - a\[1\]/);
    }
    expect(PROBE.CASES).toBe(24);
  });
});

describe('SELF — ⚡ המטמון: שליפה = הרצה, ביט-זהה', () => {
  it('קורא-ההתנהגות (core-c) עם מטמון ריק ואז מלא ⇒ אותו קובץ בדיוק כמו שבריפו', () => {
    const dir = mkdtempSync(join(tmpdir(), 'catalog-cache-'));
    const f = join(ROOT, 'catalog/behavior/core-c.json');
    // SELF-V2: בלי החותמות שבריפו (CATALOG_STAMPS=off) — אחרת הקורא לוקח את השורות מהחותמת ולא רץ בכלל
    const sf = join(ROOT, 'catalog/self/stamps/behavior-core-c.json');
    const before = readFileSync(f, 'utf8'); const stampsBefore = readFileSync(sf, 'utf8');
    try {
      for (let k = 0; k < 2; k++) {
        execFileSync(process.execPath, [join(ROOT, 'catalog/scripts/behavior-probe.mjs'), '--source', 'core-c'], { env: { ...process.env, CATALOG_CACHE: dir, CATALOG_STAMPS: 'off' }, stdio: 'pipe' });
        expect(readFileSync(f, 'utf8'), 'הרצה ' + (k + 1)).toBe(before);
        expect(readFileSync(sf, 'utf8'), 'החותמת · הרצה ' + (k + 1)).toBe(stampsBefore);
      }
      expect(readdirSync(join(dir, 'catalog-probe-part')).length).toBeGreaterThan(0);
    } finally {
      // רק אם השתנה — כתיבה של אותו תוכן הייתה מראה חצי-קובץ לבדיקה שרצה במקביל (SELF-V2)
      if (readFileSync(f, 'utf8') !== before) writeFileSync(f, before);
      if (readFileSync(sf, 'utf8') !== stampsBefore) writeFileSync(sf, stampsBefore);
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it('בלי מטמון בכלל (CATALOG_CACHE=off) — lab-data.json ו-dig/ יוצאים זהים (build --check)', () => {
    execFileSync(process.execPath, [join(ROOT, 'catalog/combiner/build.mjs'), '--check'], { env: { ...process.env, CATALOG_CACHE: 'off' }, stdio: 'pipe' });
  }, 60_000);

  it('טביעת-התלויות משתנה כשתוכן של קובץ משתנה (ורק אז) — לכן תוצאה ישנה לא נשלפת אחרי שינוי', () => {
    const dir = mkdtempSync(join(tmpdir(), 'stamp-'));
    const a = join(dir, 'a.ts');
    try {
      writeFileSync(a, 'export const x = 1;\n');
      const s1 = stampOf([a]);
      expect(stampOf([a])).toBe(s1);
      writeFileSync(a, 'export const x = 2;\n');
      expect(stampOf([a])).not.toBe(s1);
      expect(fingerprint('ab', 'c')).not.toBe(fingerprint('a', 'bc'));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
