/**
 * 🪞 SELF-V2 (14.10.2026) — ratchet: "שישפר את עצמו עוד". המכונה האיצה ותיקנה את עצמה שוב, עם הפעלים שלה:
 *
 *   D1 · «מטביע חותם» על התוכן, לא על git — ה-ref של המפקדים היה `ענף@sha`: worktree מנותק (HEAD@…) או ענף אחר נתנו קבצים
 *        אחרים, וכל קומיט "שינה" את כל הצינור. עכשיו content@<fnvHex של החלקים>, והבונה-מחדש לא קורא ל-git בכלל.
 *   D2 · תקציב-צעדים במקום שעון — חלק שלא נגמר נעצר אחרי N צעדים (lib/steps.mjs), לא אחרי 20 שניות של שעון-קיר.
 *        buildTzGrid (אורביט) היה "timeout" כאן ואולי "ran" על מחשב מהיר; עכשיו 'budget' בכל מחשב.
 *   B  · «מנרמל» — קוד TS נטבע בלי הערות (lib/blank.mjs; הערה ארוכה/קצרה ⇒ אותו טקסט) ⇒ שינוי-הערה לא מריץ שום שלב שקורא קוד.
 *   A  · החותמות שבריפו (catalog/self/stamps*) — שכפול טרי בלי שינוי לא מריץ כלום; שינוי בחלק ⇒ רק החלקים שהמפתח שלהם השתנה.
 *   G  · הסריקה-העצמית השנייה מצאה באג בעוזר חדש: relDep (נתיב-תלות בחותמות) לא היה אידמפוטנטי — נתיב יחסי נפתר מול
 *        תיקיית-העבודה של התהליך ⇒ חותמת שתלויה במקום שממנו הרצת. מוטנט: path.relative בלי בדיקת isAbsolute.
 *   +  · הסריקה הראתה שהפותח תלוי בסדר-הבדיקה של המהדר (סדר איברי-איחוד של ליטרלים) — מתועד; לכן הפותח לא נפתח לקבצים בודדים.
 *
 * CATALOG_FULL=1 (ב-CI) — גם בנייה מלאה בלי שום מטמון/חותמת, והשוואה ביט-אחר-ביט לקבצים שבריפו.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import vm from 'node:vm';
import { instrument, STEPS_PRELUDE } from '../lib/steps.mjs';
import { loadInSandbox, callerFor, resetBudget, BudgetError } from '../lib/sandbox.mjs';
import { blankComments, isBlankable } from '../lib/blank.mjs';
import { relDep } from '../lib/probe-file.mjs';
import { STAGES, inputFiles, specMatches } from '../scripts/rebuild.mjs';
import { sourceFiles } from '../inner/lib/repos.mjs';

const ROOT = join(__dirname, '..', '..');
const FULL = !!process.env.CATALOG_FULL;
const node = (args: string[], env: Record<string, string> = {}) => execFileSync(process.execPath, args.map((a, k) => (k === 0 ? join(ROOT, a) : a)), { cwd: ROOT, env: { ...process.env, ...env }, stdio: 'pipe', encoding: 'utf8' });

describe('SELF-V2 · D1 — ref לפי תוכן, בלי ענף', () => {
  it('המפקדים כותבים content@<טביעה> — ואין קריאה ל-`--abbrev-ref` בצינור', () => {
    for (const s of ['orbit', 'core']) expect(JSON.parse(readFileSync(join(ROOT, `catalog/sources/${s}.json`), 'utf8')).ref, s).toMatch(/^content@[0-9a-f]{8}$/);
    for (const f of ['catalog/scripts/orbit-census.mjs', 'catalog/scripts/core-census.mjs', 'catalog/scripts/buildsmart-census.mjs', 'catalog/scripts/others-census.mjs', 'catalog/scripts/rebuild.mjs']) {
      expect(readFileSync(join(ROOT, f), 'utf8'), f).not.toMatch(/--abbrev-ref/);
    }
  });
  it('אותה בדיקה בשני מצבי-git שונים (ענף אחר ב-HEAD מנותק · בלי git בכלל) ⇒ אותה תוצאה: המפקד והחותמות תואמים', () => {
    const g = mkdtempSync(join(tmpdir(), 'git-state-'));
    try {
      execFileSync('git', ['init', '-q', '-b', 'some-other-branch', g]);
      writeFileSync(join(g, 'x'), 'x'); execFileSync('git', ['-C', g, 'add', 'x']); execFileSync('git', ['-C', g, '-c', 'user.email=a@b', '-c', 'user.name=t', 'commit', '-qm', 'x']);
      execFileSync('git', ['-C', g, 'checkout', '-q', '--detach']);
      for (const env of [{ GIT_DIR: join(g, '.git') }, { GIT_DIR: join(g, 'nope') }]) {
        node(['catalog/scripts/core-census.mjs', '--check'], env);
        expect(node(['catalog/scripts/rebuild.mjs', '--check'], env)).toMatch(/כל השלבים תואמים/);
      }
    } finally { rmSync(g, { recursive: true, force: true }); }
  }, 120_000);
});

describe('SELF-V2 · D2 — תקציב-צעדים במקום שעון', () => {
  it('המונה נכנס לכל גוף-פונקציה ולכל לולאה, ההנחיה "use strict" נשמרת, והקוד שקול', () => {
    const src = 'function f(a){ "use strict"; let s = 0; for (let i = 0; i < a; i++) s += i; return [1, 2].map((x) => x * s); }';
    const out = instrument(src)!;
    expect(out).toContain('"use strict";__catalogStep();');
    const ctx = vm.createContext({}); vm.runInContext(STEPS_PRELUDE, ctx); vm.runInContext(out + ';var r = f(5)', ctx);
    expect(vm.runInContext('r', ctx)).toEqual([10, 20]);
    expect(vm.runInContext('__catalogSteps()', ctx)).toBe(1 + 5 + 2); // f · 5 סיבובים · 2 קריאות לחץ
  });
  it('לולאה אינסופית ⇒ BudgetError דטרמיניסטי (אותו מספר צעדים בכל ריצה), וקוד-החלק לא יכול לבלוע אותו', () => {
    const steps: number[] = [];
    for (let k = 0; k < 2; k++) {
      const m = loadInSandbox('module.exports.spin = function (n) { try { while (true) n++; } catch (e) { return "בלעתי"; } };');
      resetBudget(m.ctx, 100_000);
      let err: unknown = null;
      try { callerFor(m.ctx, m.exports.spin)([1]); } catch (e) { err = e; }
      expect(err).toBeInstanceOf(BudgetError);
      steps.push((err as BudgetError).steps);
    }
    expect(steps[0]).toBe(steps[1]);
  });
  it('אין עוד שעון-קיר בקורא/במוכיח/במכונה-על-עצמה (רק שומר-קריסה ב-lib/pool.mjs), ו-buildTzGrid = budget', () => {
    for (const f of ['catalog/scripts/behavior-probe.mjs', 'catalog/inner/scripts/prove.mjs', 'catalog/scripts/self-check.mjs', 'catalog/lib/sandbox.mjs']) expect(readFileSync(join(ROOT, f), 'utf8'), f).not.toMatch(/setTimeout\(|timeout:\s*\w|--timeout/);
    const tz = JSON.parse(readFileSync(join(ROOT, 'catalog/behavior/orbit.json'), 'utf8')).parts.find((p: { id: string }) => p.id.endsWith('tzedaka/lib.ts#buildTzGrid'));
    expect(tz.reason).toBe('budget');
  });
});

describe('SELF-V2 · B — «מנרמל»: TS בלי הערות', () => {
  it('הערה ארוכה או קצרה ⇒ אותו טקסט; השורות נשמרות; `//` במחרוזת/regex/JSX נשאר; הנחיות-מהדר נשארות', () => {
    const a = 'const a = 1; // קצר\n/** jsdoc\n * שורה */\nconst s = "// לא"; const r = /\\/\\//; const j = <b>// טקסט</b>;\n/// <reference types="x" />\n';
    const b = a.replace('// קצר', '// הערה ארוכה הרבה יותר מהקודמת');
    expect(blankComments(a, 'x.tsx')).toBe(blankComments(b, 'x.tsx'));
    const out = blankComments(a, 'x.tsx');
    expect(out.split('\n').length).toBe(a.split('\n').length);
    for (const keep of ['"// לא"', '/\\/\\//', '<b>// טקסט</b>', '/// <reference types="x" />']) expect(out).toContain(keep);
    expect(out).not.toContain('jsdoc');
  });
  it('על קבצי אורביט (מדגם): המהדר רואה אותו קוד בדיוק — transpile של הגרסה המנורמלת = transpile של המקור בלי הערות', () => {
    const files = sourceFiles(ROOT, ['src', 'telephony', 'functions']).filter(isBlankable).filter((_, k) => k % 8 === 0);
    const tj = (t: string, f: string, rc: boolean) => ts.transpileModule(t, { fileName: f, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve, removeComments: rc } }).outputText.replace(/\s+/g, ' ');
    let n = 0;
    for (const f of files) {
      const t = readFileSync(join(ROOT, f), 'utf8');
      if (/\/\/\s*@ts-|\/\/\/|@jsx/.test(t)) continue; // הנחיות נשארות בכוונה
      expect(tj(blankComments(t, f), f, false), f).toBe(tj(t, f, true)); n++;
    }
    expect(n).toBeGreaterThan(40);
  }, 60_000);
});

describe('SELF-V2 · G — הסריקה-העצמית השנייה', () => {
  it('relDep אידמפוטנטי ולא תלוי בתיקיית-העבודה (היה: נתיב יחסי נפתר מול process.cwd)', () => {
    const r = (f: string) => relDep('/r', f.split('/').join(sep));
    for (const f of ['/r/src/a.ts', '/w/node_modules/x/i.js', 'src/a.ts', 'node_modules/z.js', '/r/catalog/core/a.mjs']) expect(r(r(f)), f).toBe(r(f));
    expect(r('/r/src/a.ts')).toBe('src/a.ts');
    expect(r('/elsewhere/node_modules/@s/y/i.js')).toBe('node_modules/@s/y/i.js');
    const report = JSON.parse(readFileSync(join(ROOT, 'catalog/self/report.json'), 'utf8'));
    expect(report.roles.held).toBe(report.roles.total);
    expect(report.roles.list.map((x: { part: string }) => x.part)).toContain('machine:catalog/lib/probe-file.mjs#relDep');
  });
  it('E · המכונה טהורה-בטעינה: רק 25 חלקים (combine/build/load — רישום-האלפבית בכוונה) עדיין לא נטענים', () => {
    const b = JSON.parse(readFileSync(join(ROOT, 'catalog/self/behavior-machine.json'), 'utf8'));
    expect(b.totals.why['load-failed'] ?? 0).toBeLessThanOrEqual(25);
    expect(b.totals.runWithVerb).toBeGreaterThanOrEqual(61);
  });
  it('F · 25/25 העוזרים הכפולים הם חלקי-מכונה: אין ממיין-לפי-id מועתק בארבעת מפקדי-החוץ', () => {
    for (const f of ['buildsmart-census', 'generator-census', 'others-census', 'rings-census']) {
      const t = readFileSync(join(ROOT, 'catalog/scripts', f + '.mjs'), 'utf8');
      expect(t, f).not.toMatch(/a\.id < b\.id \? -1 : a\.id > b\.id \? 1 : 0/);
      expect(t, f).toMatch(/import \{ byId \} from '\.\.\/self\/parts\.mjs'/);
    }
  });
});

describe('SELF-V2 · A/B — החותמות והבונה-מחדש', () => {
  it('מטמון-הריצה של מכונת-השילוב מכסה את החותמות (היה: התעלם מ-catalog/self/stamps ⇒ החזיר מפתחות-תוכנית ישנים; נתפס בהשוואה ל-CATALOG_CACHE=off)', () => {
    expect(readFileSync(join(ROOT, 'catalog/lib/cache.mjs'), 'utf8')).toMatch(/f\.startsWith\('catalog\/self\/stamps\/'\)/);
    expect(readFileSync(join(ROOT, 'catalog/combiner/combine.mjs'), 'utf8')).toMatch(/f === 'catalog\/self\/stamps\/combine\.json'/);
  });
  it('כל השלבים תואמים לחותמות שבריפו (rebuild --check: בלי להריץ שום שלב)', () => {
    expect(node(['catalog/scripts/rebuild.mjs', '--check'])).toMatch(/כל השלבים תואמים/);
  }, 60_000);
  it('שכפול טרי (מטמון ריק): הקורא לוקח כל חלק שלא השתנה מהחותמת שבריפו — 0 רצים, ואותו קובץ', () => {
    const dir = mkdtempSync(join(tmpdir(), 'empty-cache-'));
    const f = join(ROOT, 'catalog/behavior/core-c.json'); const before = readFileSync(f, 'utf8');
    try {
      expect(node(['catalog/scripts/behavior-probe.mjs', '--source', 'core-c'], { CATALOG_CACHE: dir })).toMatch(/· 0 רצו עכשיו, 9 מהחותמת/);
      expect(readFileSync(f, 'utf8')).toBe(before);
    } finally { if (readFileSync(f, 'utf8') !== before) writeFileSync(f, before); rmSync(dir, { recursive: true, force: true }); }
  }, 60_000);
  it('כל שלב מצהיר על כל מה שהוא קורא — נבדק מול מעקב-קריאות אמיתי (lib/trace-reads.mjs)', () => {
    for (const name of ['core-census', 'core-c-census', 'core-demo', 'lift']) {
      const st = STAGES.find((s) => s.name === name)!;
      const dir = mkdtempSync(join(tmpdir(), 'trace-'));
      try {
        const TR = join(ROOT, 'catalog/lib/trace-reads.mjs');
        execFileSync(process.execPath, ['--import=' + TR, ...st.run.map((a: string, k: number) => (k === 0 ? join(ROOT, a) : a))], { cwd: ROOT, env: { ...process.env, CATALOG_TRACE: dir, NODE_OPTIONS: '--import=' + TR }, stdio: 'pipe' });
        const declared = new Set(inputFiles(st).map(([f]) => f));
        const read = execFileSync('sh', ['-c', `cat ${dir}/*.txt`], { encoding: 'utf8' }).split('\n').filter((l) => l.startsWith('r ')).map((l) => l.slice(2).replace(ROOT + sep, '')).filter((f) => !f.startsWith('/') && !f.includes('node_modules'));
        const machine = (f: string) => /^catalog\/(lib|core|inner\/lib|inner\/scripts|scripts|combiner|self)\/[^/]*\.(mjs|ts)$/.test(f) || f.startsWith('src/lib/atoms/');
        const own = (f: string) => st.out.some((o: string) => f === o || f.startsWith(o)) || /\/inner-[^/]*\.json$/.test(f) || f.startsWith('catalog/inner/gen/') || f.startsWith('catalog/inner/store/');
        const missing = [...new Set(read)].filter((f) => !declared.has(f) && !machine(f) && !own(f) && !specMatches('catalog/inner/store/*.json', f));
        expect(missing, name).toEqual([]);
      } finally { rmSync(dir, { recursive: true, force: true }); }
    }
  }, 120_000);
  it.runIf(FULL)('CATALOG_FULL: בנייה מלאה בלי שום מטמון וחותמת (CATALOG_CACHE=off) = הקבצים שבריפו, ביט-אחר-ביט', () => {
    node(['catalog/scripts/rebuild.mjs'], { CATALOG_CACHE: 'off' });
    expect(execFileSync('git', ['-C', ROOT, 'status', '--porcelain', '--', 'catalog'], { encoding: 'utf8' })).toBe('');
  }, 1_800_000);
});


