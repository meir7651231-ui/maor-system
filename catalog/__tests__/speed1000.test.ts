/**
 * ⚡ SPEED1000 (14.10.2026) — ratchet: "פי אלף". כל קיצור-דרך עם נפילה בטוחה, והפלט ביט-זהה לדרך הרגילה:
 *
 *   1 · «טביעה בלי קריאה» (lib/gitfp.mjs) — טביעת קובץ = ה-sha של git: מהאינדקס לקובץ נקי (בלי לקרוא), מהתוכן למלוכלך/חדש.
 *       נבדק: לכל קובץ במעקב — מהאינדקס = מחושב; קובץ מלוכלך יוצא מהאינדקס; בלי git / GITFP=off ⇒ נפילה (אותן טביעות).
 *   2 · הבונה-מחדש — אותן חותמות בכל דרך: עם/בלי האינדקס של git, עם/בלי טביעות-ה-view השמורות (stamps.json › views),
 *       עם מטמון ריק. `--check` ירוק בכל הצירופים.
 *   3 · הלולאה עם זיכרון (self/loop.mjs) — הפנקס מהזיכרון (שכבה 1: הכול; שכבה 2: לפי נבדק) = הפנקס בלי זיכרון, ביט-אחר-ביט;
 *       ההיסטוריה: P..HEAD שנוגע בקובץ-נבדק / מיזוג / P שאינו אב ⇒ לא סומכים.
 *   4 · בדיקות רק למה שהשתנה (scripts/test-changed.mjs) — קובץ-בדיקה שאחד מהקבצים שהוא קרא השתנה ⇒ רץ; אחרת לא.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { gitIndex, blobSha, fileSha } from '../lib/gitfp.mjs';
import { historySame, wholeKey, makeCopy, loop } from '../self/loop.mjs';

const ROOT = join(__dirname, '..', '..');
const node = (args: string[], env: Record<string, string> = {}) => execFileSync(process.execPath, args.map((a, k) => (k === 0 ? join(ROOT, a) : a)), { cwd: ROOT, env: { ...process.env, ...env }, stdio: 'pipe', encoding: 'utf8' });
const git = (...a: string[]) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8' }).trim();

/** בלי מעקב-קריאות (כשהבדיקה רצה תחת test-changed, CATALOG_TRACE מכבה את הקיצור — במכוון; כאן בודקים את הקיצור עצמו). */
const noTrace = <T,>(fn: () => T): T => { const v = process.env.CATALOG_TRACE; delete process.env.CATALOG_TRACE; try { return fn(); } finally { if (v !== undefined) process.env.CATALOG_TRACE = v; } };

describe('SPEED1000 · 1 — «טביעה בלי קריאה» (האינדקס של git)', () => {
  it('לכל קובץ נקי במעקב: הטביעה מהאינדקס = sha של blob מהתוכן', () => {
    const idx = noTrace(() => gitIndex(ROOT));
    expect(idx.ok).toBe(true);
    expect(idx.shas.size).toBeGreaterThan(1000);
    let n = 0;
    for (const [rel, sha] of idx.shas) { expect(blobSha(readFileSync(join(ROOT, rel))), rel).toBe(sha); n++; }
    expect(n).toBe(idx.shas.size);
  });
  it('blobSha = `git hash-object` (אותה טביעה בדרך הרגילה ובדרך המהירה)', () => {
    const f = join(mkdtempSync(join(tmpdir(), 'gitfp-')), 'x.txt');
    writeFileSync(f, 'שלום\nworld\n');
    expect(blobSha(readFileSync(f))).toBe(execFileSync('git', ['hash-object', f], { encoding: 'utf8' }).trim());
  });
  it('קובץ מלוכלך יוצא מהאינדקס ומחושב מהתוכן; בלי git / GITFP=off ⇒ נפילה בטוחה', () => {
    const g = mkdtempSync(join(tmpdir(), 'gitfp-repo-'));
    try {
      execFileSync('git', ['init', '-q', g]);
      writeFileSync(join(g, 'a.txt'), 'a'); writeFileSync(join(g, 'b.txt'), 'b');
      execFileSync('git', ['-C', g, 'add', '.']); execFileSync('git', ['-C', g, '-c', 'user.email=a@b', '-c', 'user.name=t', 'commit', '-qm', 'x']);
      appendFileSync(join(g, 'b.txt'), 'b');
      const idx = noTrace(() => gitIndex(g));
      expect(idx.ok).toBe(true);
      expect(idx.shas.has('a.txt')).toBe(true);
      expect(idx.shas.has('b.txt')).toBe(false); // מלוכלך
      expect(fileSha(g, idx, 'b.txt')).toBe(blobSha('bb'));
      writeFileSync(join(g, 'c.txt'), 'c'); // לא במעקב
      expect(fileSha(g, idx, 'c.txt')).toBe(blobSha('c'));
      // .gitattributes ⇒ סינון-תוכן אפשרי ⇒ לא סומכים על האינדקס
      writeFileSync(join(g, '.gitattributes'), '* text\n'); execFileSync('git', ['-C', g, 'add', '.gitattributes']);
      expect(noTrace(() => gitIndex(g)).ok).toBe(false);
      rmSync(join(g, '.git'), { recursive: true, force: true });
      expect(gitIndex(g).ok).toBe(false);
      expect(fileSha(g, gitIndex(g), 'a.txt')).toBe(blobSha('a'));
    } finally { rmSync(g, { recursive: true, force: true }); }
  });
});

describe('SPEED1000 · 2 — הבונה-מחדש: אותן חותמות בכל דרך', () => {
  it('--check ירוק: מהאינדקס · בלי git (GITFP=off) · בלי טביעות-view שמורות ועם מטמון ריק (REBUILD_VIEWS=off)', () => {
    const empty = mkdtempSync(join(tmpdir(), 'speed-cache-'));
    try {
      for (const env of [{}, { GITFP: 'off' }, { GITFP: 'off', REBUILD_VIEWS: 'off', CATALOG_CACHE: empty }]) {
        expect(node(['catalog/scripts/rebuild.mjs', '--check'], env), JSON.stringify(env)).toMatch(/כל השלבים תואמים/);
      }
    } finally { rmSync(empty, { recursive: true, force: true }); }
  }, 120_000);
  it('טביעות-ה-view השמורות מכסות בדיוק את קובצי-הקוד שנקראים כ-view (אין עודף, אין חסר)', async () => {
    const st = JSON.parse(readFileSync(join(ROOT, 'catalog/self/stamps.json'), 'utf8'));
    expect(st.views?.algo).toMatch(/^[0-9a-f]{32}$/);
    const { STAGES, inputFiles, hasView, viewKey } = await import('../scripts/rebuild.mjs');
    const idx = gitIndex(ROOT);
    const want = new Set<string>();
    for (const s of STAGES) for (const [f, v] of inputFiles(s, { reads: st.stages[s.name]?.reads })) if (hasView(f, v)) want.add(viewKey(f, fileSha(ROOT, idx, f), v));
    expect([...want].some((k) => k.startsWith('c'))).toBe(true); // גם טביעות-המפקד (census-view)
    expect(new Set(Object.keys(st.views.map))).toEqual(want);
  });
  it('בלי שינוי ⇒ אף שלב לא רץ ואף קובץ לא נכתב (החותמות לא נוגעות)', () => {
    const before = git('status', '--porcelain', '--', 'catalog');
    // קודם --check (לא כותב) — כדי שבדיקה זו לעולם לא תריץ שלב/תכתוב חותמות כשמשהו לא מעודכן (בדיקות רצות במקביל)
    expect(node(['catalog/scripts/rebuild.mjs', '--check'])).toMatch(/כל השלבים תואמים/);
    const out = node(['catalog/scripts/rebuild.mjs', '--times']);
    expect(out).not.toMatch(/\brun\b|cache \(/);
    expect(git('status', '--porcelain', '--', 'catalog')).toBe(before);
  }, 60_000);
});

describe('SPEED1000 · 2ב — «מנרמל» למפקד + מה שהאורז באמת ארז', () => {
  it('המפקד שקורא רק את census-view מוציא בדיוק את catalog/sources/orbit.json; המוטנט (בלי שום הערה) — שונה', () => {
    expect(node(['catalog/scripts/orbit-census.mjs', '--check'], { CENSUS_VIEW: '1' })).toMatch(/מעודכן/);
    let failed = false;
    try { node(['catalog/scripts/orbit-census.mjs', '--check'], { CENSUS_VIEW: 'mutant-all' }); } catch { failed = true; }
    expect(failed).toBe(true);
  }, 120_000);
  it('census-view: הערה פנימית נמחקת, JSDoc / הערה מובילה של מיוצא / בתוך גוף מיוצא / בכינוי-טיפוס — נשארות; השורות נשמרות', async () => {
    const { censusView, isCensusViewable } = await import('../lib/census-view.mjs');
    const src = [
      '// ראש-הקובץ', "import { x } from './x';", 'const A = 1; // פנימי',
      '// מוביל-פנימי', 'const B = [1, /* בתוך */ 2];',
      '// מוביל-מיוצא', 'export function f(a: number) { // בגוף', '  return a + A + B[0]; // Date.now(', '}',
      '/** דוק */', 'const g = () => 1;', "type T = 'a' | /* ב-טיפוס */ 'b';", 'export const h = (s: string) => s; // סוף',
    ].join('\n');
    const v = censusView(src, 'src/lib/z.ts');
    expect(v.split('\n').length).toBe(src.split('\n').length);
    for (const gone of ['ראש-הקובץ', 'פנימי', 'מוביל-פנימי', 'בתוך', 'סוף' /* אחרי ההצהרה האחרונה — טריוויה של סוף-הקובץ, המפקד לא קורא */]) expect(v, gone).not.toContain(gone);
    for (const kept of ['מוביל-מיוצא', 'בגוף', 'Date.now(', 'דוק', 'ב-טיפוס']) expect(v, kept).toContain(kept);
    expect(isCensusViewable('src/lib/a.test.ts')).toBe(false);
    expect(isCensusViewable('src/lib/atoms/engines/generated/x.ts')).toBe(false);
    expect(isCensusViewable('telephony/lib/zmanim.mjs')).toBe(true);
  });
  it('האורז רושם מה שארז: החותמת של bundle מחזיקה רשימה, וכל קובץ בה קיים ובתוך הקוד', () => {
    const st = JSON.parse(readFileSync(join(ROOT, 'catalog/self/stamps.json'), 'utf8')).stages.bundle;
    expect(Array.isArray(st.reads)).toBe(true);
    expect(st.reads.length).toBeGreaterThan(3);
    for (const f of st.reads) { expect(existsSync(join(ROOT, f)), f).toBe(true); expect(f).toMatch(/^(src|telephony|functions)\//); }
    expect(st.reads).not.toContain('src/lib/hebrewNumber.ts'); // לא נארז ⇒ הערה בו לא מריצה את האורז
  });
});

describe('SPEED1000 · 2ג — מנוע תמיד-דלוק (rebuild --watch)', () => {
  it('watch על עותק: שינוי-הערה ⇒ אפס שלבים ואפס כתיבה; שינוי בקלט ⇒ רק השלב שלו רץ, והעץ = בנייה רגילה על אותו שינוי', async () => {
    const { spawn } = await import('node:child_process');
    const base = mkdtempSync(join(tmpdir(), 'speed-watch-'));
    // העותק מהריפו החי עלול לתפוס קובץ באמצע כתיבה של בדיקה מקבילה ⇒ קודם בנייה רגילה בעותק (בדרך-כלל 0 שלבים),
    // והעותק השני — מהעותק הראשון (לא מהריפו החי): שניהם יוצאים מאותה נקודה בדיוק
    const W = makeCopy(ROOT, join(base, 'w'));
    execFileSync(process.execPath, [join(W, 'catalog/scripts/rebuild.mjs')], { cwd: W, stdio: 'pipe' });
    const W2 = makeCopy(W, join(base, 'w2'));
    const child = spawn(process.execPath, [join(W, 'catalog/scripts/rebuild.mjs'), '--watch'], { cwd: W, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    const waitFor = (re: RegExp, ms = 300_000) => new Promise<string>((res, rej) => { const t0 = Date.now(); const tick = () => { const m = re.exec(out); if (m) return res(m[0]); if (Date.now() - t0 > ms) return rej(new Error('timeout: ' + re + '\n' + out)); setTimeout(tick, 50); }; tick(); });
    try {
      await waitFor(/⚡ מוכן/);
      const stamps0 = readFileSync(join(W, 'catalog/self/stamps.json'), 'utf8');
      // (1) שינוי-הערה פנימית (שורה 16 — כמו מדידת-המנהל)
      const f = join(W, 'src/lib/hebrewNumber.ts');
      const lines = readFileSync(f, 'utf8').split('\n'); lines[15] = lines[15].replace('במין', 'במין-ובמספר'); writeFileSync(f, lines.join('\n'));
      const c1 = await waitFor(/⚡ סבב 1: [^\n]*/);
      expect(c1).toMatch(/אפס שלבים/);
      expect(readFileSync(join(W, 'catalog/self/stamps.json'), 'utf8')).toBe(stamps0);
      // (2) שינוי בקלט של שלב (רווח ב-JSON) — המפקד רץ, הפלט זהה ⇒ עצירה מוקדמת
      const o = join(W, 'catalog/core/origins-c.json'); writeFileSync(o, readFileSync(o, 'utf8') + '\n');
      const c2 = await waitFor(/⚡ סבב 2: [^\n]*/);
      expect(c2).toMatch(/רצו: core-c-census/);
      await new Promise((r) => setTimeout(r, 500)); // הסבב שנגרם מכתיבת החותמות (אפס שלבים)
      // אותו שינוי בעותק השני ⇒ בנייה רגילה ⇒ אותם קבצים
      const o2 = join(W2, 'catalog/core/origins-c.json'); writeFileSync(o2, readFileSync(o2, 'utf8') + '\n');
      const f2 = join(W2, 'src/lib/hebrewNumber.ts'); writeFileSync(f2, readFileSync(f, 'utf8'));
      execFileSync(process.execPath, [join(W2, 'catalog/scripts/rebuild.mjs')], { cwd: W2, stdio: 'pipe' });
      const diff = execFileSync('sh', ['-c', `diff -rq --exclude=gen --exclude='inner-*.json' ${join(W, 'catalog')} ${join(W2, 'catalog')} || true`], { encoding: 'utf8' });
      expect(diff).toBe('');
    } finally {
      child.kill();
      rmSync(base, { recursive: true, force: true });
    }
  }, 600_000);
});

describe('SPEED1000 · 3 — הלולאה עם זיכרון', () => {
  it('היסטוריה: אותו HEAD ⇒ כן; P..HEAD נגע בקובץ-נבדק ⇒ לא; P..HEAD בלי נגיעה ⇒ כן; P שאינו אב ⇒ לא', () => {
    const head = git('rev-parse', 'HEAD');
    const state = 'מלאה';
    if (git('rev-parse', '--is-shallow-repository') === 'true') return; // שכפול רדוד — הבדיקה לא רלוונטית
    const parent = git('rev-parse', 'HEAD~1');
    const touched = git('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD').split('\n').filter(Boolean);
    expect(historySame(ROOT, { head, hstate: state, subjectFiles: touched }, true)).toBe(true);
    expect(historySame(ROOT, { head: parent, hstate: state, subjectFiles: touched.slice(0, 1) }, true)).toBe(false);
    expect(historySame(ROOT, { head: parent, hstate: state, subjectFiles: ['no/such/file.mjs'] }, true)).toBe(true);
    expect(historySame(ROOT, { head: '0'.repeat(40), hstate: state, subjectFiles: [] }, true)).toBe(false);
    expect(historySame(ROOT, { head, hstate: 'אחר', subjectFiles: [] }, true)).toBe(false);
  });
  it('wholeKey: כל שינוי בהיקף ⇒ טביעה אחרת; הפלטים של הלולאה עצמה (הפנקס/הזיכרון) לא בהיקף', () => {
    const W = mkdtempSync(join(tmpdir(), 'speed-scope-'));
    try {
      for (const d of ['catalog/self', 'src']) execFileSync('mkdir', ['-p', join(W, d)]);
      writeFileSync(join(W, 'src/a.ts'), '// x\nexport const a = 1;\n');
      const k0 = wholeKey(W, { only: null, history: true });
      writeFileSync(join(W, 'catalog/self/loop-ledger.json'), '{}'); writeFileSync(join(W, 'catalog/self/loop-memo.json'), '{}');
      expect(wholeKey(W, { only: null, history: true })).toBe(k0);
      writeFileSync(join(W, 'src/a.ts'), '// y\nexport const a = 1;\n');
      expect(wholeKey(W, { only: null, history: true })).not.toBe(k0);
      expect(wholeKey(W, { only: null, history: false })).not.toBe(wholeKey(W, { only: null, history: true }));
    } finally { rmSync(W, { recursive: true, force: true }); }
  });
  it('הפנקס מהזיכרון (שכבה 1 · שכבה 2) = הפנקס בלי זיכרון — ביט-אחר-ביט (עותק, --only, --quick)', async () => {
    const base = mkdtempSync(join(tmpdir(), 'speed-loop-'));
    const W = makeCopy(ROOT, join(base, 'w'));
    const env = { CATALOG_CACHE: process.env.CATALOG_CACHE, SELF_LOOP_MEMO: process.env.SELF_LOOP_MEMO };
    try {
      process.env.CATALOG_CACHE = join(base, 'cache');
      const only = ['machine:catalog/self/parts.mjs#rankCounts·sort', 'machine:catalog/lib/verbs.mjs#fnv·fingerprint'];
      const run = async () => { const L = await loop({ root: W, only, quick: true }); return { text: JSON.stringify(L), from: (L as { memo?: { from: string; reused?: number } }).memo }; };
      process.env.SELF_LOOP_MEMO = 'off';
      const plain = await run();
      delete process.env.SELF_LOOP_MEMO;
      const first = await run();
      expect(first.from?.from).toBe('חישוב');
      const second = await run();
      expect(second.from?.from).toBe('המטמון המקומי'); // שכבה 1
      appendFileSync(join(W, 'catalog/README.md'), '\n'); // משנה את ההיקף, לא אף נבדק
      const third = await run();
      expect(third.from?.from).toBe('חישוב');
      expect(third.from?.reused).toBe(2); // שכבה 2: שני הנבדקים מהזיכרון
      for (const x of [first, second, third]) expect(x.text).toBe(plain.text);
    } finally {
      for (const [k, v] of Object.entries(env)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
      rmSync(base, { recursive: true, force: true });
    }
  }, 600_000);
  it('הזיכרון שבריפו (אם קיים) מצביע על הפנקס שבריפו', () => {
    const f = join(ROOT, 'catalog/self/loop-memo.json');
    if (!existsSync(f)) return;
    const m = JSON.parse(readFileSync(f, 'utf8'));
    expect(m.ledger).toBe(blobSha(readFileSync(join(ROOT, 'catalog/self/loop-ledger.json'))));
  });
});

describe('SPEED1000 · 4 — בדיקות רק למה שהשתנה (scripts/test-changed.mjs)', () => {
  it('בזמן מעקב-קריאות הקיצור של git כבוי ⇒ בדיקה שמריצה rebuild --check נרשמת עם הקלטים האמיתיים שלו', () => {
    const dir = mkdtempSync(join(tmpdir(), 'speed-trace-'));
    try {
      const prev = process.env.CATALOG_TRACE; process.env.CATALOG_TRACE = dir;
      try { expect(gitIndex(ROOT).ok).toBe(false); } finally { if (prev === undefined) delete process.env.CATALOG_TRACE; else process.env.CATALOG_TRACE = prev; }
      const TR = join(ROOT, 'catalog/lib/trace-reads.mjs');
      execFileSync(process.execPath, ['--import=' + TR, join(ROOT, 'catalog/scripts/rebuild.mjs'), '--check'], { cwd: ROOT, env: { ...process.env, CATALOG_TRACE: dir }, stdio: 'pipe' });
      const read = execFileSync('sh', ['-c', `cat ${dir}/*.txt`], { encoding: 'utf8' });
      for (const f of ['src/lib/hebrewNumber.ts', 'catalog/schema.json', 'catalog/core/origins-c.json']) expect(read, f).toContain('r ' + join(ROOT, f));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }, 120_000);
  it('קובצי-הבדיקה של הקטלוג = מה ש-`vitest run catalog` מריץ', async () => {
    const { catalogTests } = await import('../scripts/test-changed.mjs');
    const list = catalogTests(ROOT);
    expect(list).toContain('catalog/__tests__/speed1000.test.ts');
    expect(list.every((f: string) => /\.test\.[mc]?[jt]sx?$/.test(f) && f.startsWith('catalog/'))).toBe(true);
  });
});

describe('SPEED1000 · 6 — זיכרון-התוצאות מההיסטוריה: מה שכבר חושב וקומט — לא מחושב שוב', () => {
  it('תוכן שכבר קומט (על גבי חותמות של קומיט אחר) ⇒ השלב נשלף מ-git = אותו פלט כמו מחושב; בלי ההיסטוריה ⇒ מחושב', () => {
    const base = mkdtempSync(join(tmpdir(), 'speed-hist-'));
    const T = makeCopy(ROOT, join(base, 't'));
    const g = (...a: string[]) => execFileSync('git', ['-C', T, '-c', 'user.email=t@local', '-c', 'user.name=t', ...a], { encoding: 'utf8', env: Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_(DIR|WORK_TREE|INDEX_FILE)$/.test(k))) }).trim();
    const rb = (env: Record<string, string>, ...a: string[]) => execFileSync(process.execPath, [join(T, 'catalog/scripts/rebuild.mjs'), ...a], { cwd: T, encoding: 'utf8', env: { ...process.env, ...env } });
    try {
      g('init', '-q', '-b', 'main');
      rb({ CATALOG_CACHE: join(base, 'c0') }); // נרמול (בדרך-כלל 0 שלבים)
      g('add', '-A'); g('commit', '-qm', 'A');
      // B: שינוי בקלט של שלב זול (רווח ב-JSON) ⇒ המפקד רץ, החותמת שלו חדשה ⇒ קומיט על ענף b
      const o = join(T, 'catalog/core/origins-c.json'); writeFileSync(o, readFileSync(o, 'utf8') + '\n');
      expect(rb({ CATALOG_CACHE: join(base, 'c1') }, '--times')).toMatch(/core-c-census\s+run/);
      g('checkout', '-q', '-b', 'b'); g('commit', '-qam', 'B');
      g('checkout', '-q', 'main');
      // התוכן של B על החותמות של A, מטמון ריק: עם ההיסטוריה ⇒ נשלף; בלי ⇒ מחושב
      g('checkout', '-q', 'b', '--', 'catalog/core/origins-c.json');
      expect(rb({ CATALOG_CACHE: join(base, 'c2'), REBUILD_HISTORY: 'off' }, '--times')).toMatch(/core-c-census\s+run/);
      const computed = g('diff', 'b', '--stat', '--', 'catalog');
      g('checkout', '-q', 'main', '--', 'catalog'); g('checkout', '-q', 'b', '--', 'catalog/core/origins-c.json');
      const out = rb({ CATALOG_CACHE: join(base, 'c3') }, '--times');
      expect(out).toMatch(new RegExp('core-c-census\\s+history ' + g('rev-parse', '--short=7', 'b')));
      expect(out).not.toMatch(/\brun\b/);
      // ביט-זהות: הקטלוג אחרי השליפה = הקטלוג של B (שחושב) = מה שחושב עכשיו בלי ההיסטוריה
      expect(g('diff', 'b', '--stat', '--', 'catalog')).toBe('');
      expect(computed).toBe('');
    } finally { rmSync(base, { recursive: true, force: true }); }
  }, 600_000);
});
