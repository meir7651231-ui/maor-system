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

describe('SPEED1000 · 1 — «טביעה בלי קריאה» (האינדקס של git)', () => {
  it('לכל קובץ נקי במעקב: הטביעה מהאינדקס = sha של blob מהתוכן', () => {
    const idx = gitIndex(ROOT);
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
      const idx = gitIndex(g);
      expect(idx.ok).toBe(true);
      expect(idx.shas.has('a.txt')).toBe(true);
      expect(idx.shas.has('b.txt')).toBe(false); // מלוכלך
      expect(fileSha(g, idx, 'b.txt')).toBe(blobSha('bb'));
      writeFileSync(join(g, 'c.txt'), 'c'); // לא במעקב
      expect(fileSha(g, idx, 'c.txt')).toBe(blobSha('c'));
      // .gitattributes ⇒ סינון-תוכן אפשרי ⇒ לא סומכים על האינדקס
      writeFileSync(join(g, '.gitattributes'), '* text\n'); execFileSync('git', ['-C', g, 'add', '.gitattributes']);
      expect(gitIndex(g).ok).toBe(false);
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
    const { STAGES, inputFiles } = await import('../scripts/rebuild.mjs');
    const idx = gitIndex(ROOT);
    const want = new Set<string>();
    for (const s of STAGES) for (const [f, v] of inputFiles(s)) if (v && /\.(ts|tsx|mts|cts)$/.test(f)) want.add((f.endsWith('x') ? 'x' : 't') + fileSha(ROOT, idx, f));
    expect(new Set(Object.keys(st.views.map))).toEqual(want);
  });
  it('בלי שינוי ⇒ אף שלב לא רץ ואף קובץ לא נכתב (החותמות לא נוגעות)', () => {
    const before = git('status', '--porcelain', '--', 'catalog');
    const out = node(['catalog/scripts/rebuild.mjs', '--times']);
    expect(out).not.toMatch(/\brun\b|cache \(/);
    expect(git('status', '--porcelain', '--', 'catalog')).toBe(before);
  }, 60_000);
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
