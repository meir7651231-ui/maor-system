/**
 * 📇 הקטלוג המאוחד (CATALOG-INDEX, 14.10.2026) — ratchet.
 * 1. כל מקור עומד בסכמה — אורביט בלי חריגה אחת; לשאר יש רשימת-חריגות קפואה (לפי שדה) שיכולה רק לרדת.
 * 2. index.json · verbs.json · verbs.md · alphabet.md מעודכנים (`node catalog/scripts/catalog-build.mjs --check`).
 * 3. לכל חלק בכל מקור יש שורה בקובץ-ההתנהגות; התוויות משתמשות רק בפעלים מהאלפבית; static תמיד עם סיבה.
 * 4. הקורא דטרמיניסטי ומעודכן: הרצה מחדש של קבצי-אורביט לדוגמה נותנת בדיוק את השורות שבקובץ.
 * 5. פרטיות: אין מיילים, טלפונים, ת״ז או טוקנים בקבצים המשותפים.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as B from '../lib/bridge';
import { validateSource, validateSchema } from '../lib/check.mjs';
import { buildAll, readDir } from '../lib/build-all.mjs';
import { conformKind } from '../lib/build-index.mjs';
import { VERBS } from '../lib/verbs.mjs';
import { prepareJobs, probeJob, isRunnable } from '../lib/probe-file.mjs';
import { entryFor } from '../lib/entry.mjs';

const ROOT = join(__dirname, '..', '..');
const sources = readDir(join(ROOT, 'catalog/sources'));
const behaviors = readDir(join(ROOT, 'catalog/behavior'));
const SEED = 0x0ca7a10; // = SEED ב-behavior-probe.mjs

/** חריגות-סכמה שקיימות היום במפקדים של הסשנים האחרים (לפי שדה). מותר רק לרדת. פירוט ותיקון מוצע: knowledge/CLOSED-CATALOG-2026-10-14.md §7. */
const KNOWN: Record<string, Record<string, number>> = {
  '14kk': { '$.source': 1, '$.parts[].id': 215, '$.parts[].source': 215, '$.parts[].name': 14, '$.parts[].gives.kind': 60, '$.parts[].takes[].type': 97, '$.parts[].gives.type': 191 },
  buildsmart: { '$.parts[].name': 28, '$.parts[].gives.kind': 133, '$.parts[].takes[].kind': 293 },
  generator: { '$.parts[].name': 301 },
  mmmm: { '$.parts[].gives.type': 17, '$.parts[].name': 16, '$.parts[].takes[].type': 18, '$.parts[].gives.kind': 13, '$.parts[].takes[].kind': 10 },
  orbit: {},
  'core-b': {},
  'qa-scanner': { '$.parts[].takes[].type': 204, '$.parts[].gives.type': 170, '$.parts[].name': 70, '$.parts[].id': 32 },
  rings: { '$.parts[].id': 143, '$.parts[].name': 1 },
  yeshiva: { '$.parts[].gives.kind': 68, '$.parts[].name': 20, '$.parts[].takes[].kind': 27, '$.parts[].takes[].type': 30, '$.parts[].gives.type': 45, '$.parts[].id': 198 },
  'yoman-habina': { '$.parts[].takes[].type': 34, '$.parts[].gives.type': 33, '$.parts[].name': 5 },
};
function violationsByField(doc: unknown): Record<string, number> {
  const c: Record<string, number> = {};
  for (const x of validateSource(doc) as string[]) {
    const m = /(\$\.[a-z]+(?:\[\])?(?:\.[a-z]+)?(?:\[\])?(?:\.[a-z]+)?)/.exec(x.replace(/\[\d+\]/g, '[]'));
    const k = m ? m[1] : x.slice(0, 30);
    c[k] = (c[k] ?? 0) + 1;
  }
  return c;
}

describe('הקטלוג המאוחד', () => {
  it('כל 9 המקורות בפנים (+ core-b: 7 הליבות של הפעלים שהיו static-only)', () => {
    expect(Object.keys(sources).filter((s) => !s.startsWith('core')).sort()).toEqual(['14kk', 'buildsmart', 'generator', 'mmmm', 'orbit', 'qa-scanner', 'rings', 'yeshiva', 'yoman-habina']);
    expect(Object.keys(sources)).toContain('core-b');
    for (const [s, d] of Object.entries(sources)) { expect(d.source, s).toBe(s); expect(d.generatedAt, s).toBeNull(); expect(d.parts.length, s).toBeGreaterThan(0); }
  });

  for (const s of Object.keys(KNOWN)) {
    it(`הסכמה: ${s} — ${Object.keys(KNOWN[s]).length ? 'לא יותר חריגות מהרשימה הקפואה' : 'בלי חריגות'}`, () => {
      const got = violationsByField(sources[s]);
      for (const [k, n] of Object.entries(got)) expect(n, s + ' ' + k + ' (חריגה חדשה או שגדלה)').toBeLessThanOrEqual(KNOWN[s][k] ?? 0);
      if (s === 'orbit' || s === 'core-b') expect(validateSource(sources[s], { strict: true })).toEqual([]);
    });
  }

  it('בכל המקורות: מזהים ייחודיים, ממוינים, ו-id = source:path#symbol (+~N)', () => {
    for (const [s, d] of Object.entries(sources)) {
      let prev = '';
      for (const p of d.parts) {
        // מותר סיומת ~N להבחנה בין שני חלקים באותו שם (כך נכתב ב-14kk)
        expect(p.id.startsWith(`${p.source}:${p.path}#${p.symbol}`) && /^(~\d+)?$/.test(p.id.slice(`${p.source}:${p.path}#${p.symbol}`.length)), s + ' ' + p.id).toBe(true);
        expect(p.id > prev, s + ' ' + p.id).toBe(true);
        prev = p.id;
      }
    }
  });

  it('באינדקס כל הסוגים במילון המשותף (אחרי יישור), וכל שורה עומדת בסכמה של kind', () => {
    const ix = JSON.parse(readFileSync(join(ROOT, 'catalog/index.json'), 'utf8'));
    const kindSchema = { $ref: '#/$defs/kind' };
    for (const r of ix.parts) for (const k of [r.gives, ...r.takes]) expect(validateSchema(k, kindSchema), r.id + ' ' + k).toEqual([]);
    expect(conformKind('record:org-config')).toBe('record:orgConfig');
    expect(conformKind('record:knowledge_base')).toBe('record:knowledgeBase');
    expect(conformKind('מספר')).toBe('unknown');
  });

  it('מעודכן: index.json · verbs.json · verbs.md · alphabet.md (catalog-build --check)', () => {
    const files = buildAll(ROOT, B.ATOM_LAWS);
    for (const [rel, text] of Object.entries(files)) expect(readFileSync(join(ROOT, rel), 'utf8') === text, rel + ' לא מעודכן — node catalog/scripts/catalog-build.mjs').toBe(true);
  }, 60_000);

  it('קובצי-ההתנהגות: שורה לכל חלק, פעלים רק מהאלפבית, static עם סיבה, twin עם מקור', () => {
    const ids = new Set(VERBS.map((v) => v.id));
    expect(Object.keys(behaviors).sort()).toEqual(Object.keys(sources).sort());
    for (const [s, d] of Object.entries(behaviors)) {
      expect(d.parts.map((e: { id: string }) => e.id), s).toEqual(sources[s].parts.map((p: { id: string }) => p.id));
      expect(d.probe.generatedAt).toBeNull();
      for (const e of d.parts) {
        expect(['run', 'twin', 'static'], e.id).toContain(e.labeledBy);
        for (const v of e.verbs) expect(ids.has(v.id), e.id + ' ' + v.id).toBe(true);
        if (e.labeledBy === 'static') expect(e.reason, e.id).toBeTruthy();
        if (e.labeledBy === 'twin') expect(e.twinOf, e.id).toMatch(/^(orbit|buildsmart|mmmm):/);
        if (e.labeledBy === 'run') for (const v of e.verbs) expect(v.holds, e.id).toMatch(/^(\d+)\/\1$/);
      }
    }
    // הרצה אמיתית: רק חלקים טהורים
    const pure = new Map(Object.values(sources).flatMap((d) => d.parts.map((p: { id: string; pure: boolean }) => [p.id, p.pure])));
    for (const d of Object.values(behaviors)) for (const e of d.parts) if (e.labeledBy === 'run') expect(pure.get(e.id), e.id).toBe(true);
  });

  it('הקורא דטרמיניסטי ומעודכן: קבצי-אורביט לדוגמה ⇒ בדיוק השורות שבקובץ', async () => {
    const FILES = ['src/lib/atoms/parts/divide.ts', 'src/lib/atoms/parts/rotate.ts', 'src/lib/atoms/parts/offset.ts', 'src/lib/date-util.ts', 'src/lib/search.ts'];
    const orbit = sources.orbit.parts.filter((p: { path: string }) => FILES.includes(p.path));
    const runnable = orbit.filter(isRunnable);
    const committed = new Map(behaviors.orbit.parts.map((e: { id: string }) => [e.id, e]));
    const once = async () => {
      const { jobs, results, sigs } = prepareJobs(ROOT, runnable);
      for (const job of jobs) for (const { id, result } of await probeJob(job, { B, seed: SEED })) results.set(id, result);
      return orbit.map((p: { id: string }) => entryFor(p, results.get(p.id), sigs.get(p.id)));
    };
    const a = await once();
    const b = await once();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    for (const e of a) expect(e, e.id + ' — הרץ: node catalog/scripts/behavior-probe.mjs --source orbit').toEqual(committed.get(e.id));
    const div = a.find((e: { id: string }) => e.id.endsWith('#divideAmount'));
    expect(div.verbs.map((v: { id: string }) => v.id)).toContain('divide');
  }, 120_000);

  it('פרטיות: אין מיילים, טלפונים, ת״ז או טוקנים בקבצים המשותפים', () => {
    const files = ['catalog/index.json', 'catalog/verbs.json', 'catalog/verbs.md', 'catalog/alphabet.md', ...Object.keys(behaviors).map((s) => `catalog/behavior/${s}.json`)];
    for (const rel of files) {
      expect(existsSync(join(ROOT, rel)), rel).toBe(true);
      // שורות ה-ref (sha של git) לא נבדקות — הן מזהה-גרסה, לא סוד
      const text = readFileSync(join(ROOT, rel), 'utf8').split('\n').filter((l) => !/"ref":/.test(l)).join('\n');
      expect(text, rel).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/);
      expect(text, rel).not.toMatch(/\b0\d{1,2}-?\d{7}\b|\+972/);
      expect(text, rel).not.toMatch(/(?<![\d.])\d{9}(?![\d.])/);
      expect(text, rel).not.toMatch(/\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{32,}\b/);
    }
  });
});
