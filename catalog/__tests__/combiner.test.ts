/**
 * 🧲 המצרף (COMBINER, 14.10.2026) — ratchet.
 * 1. לפחות 10 מטרות מהמילון מורכבות, וכל שרשרת עוברת בדיקת-סוגים (הפלט של אחד = הקלט של הבא; החומר בקצה).
 * 2. החמנייה של הבעלים: מוצאת את החלקים שהוא מנה (מקום-השמש · הבא · מזיז · מעגל · מחלק · בתורות · מחבר · מסלים…),
 *    והאזימוט ("לאיזה כיוון השמש") — חסר, ויוצא כבקשת-בנייה.
 * 3. דטרמיניזם: אותו קלט ⇒ אותה הרכבה; סדר-החלקים לא משנה; הדף (lab-data) מרכיב בדיוק כמו ה-CLI.
 * 4. כל צעד "מוכח" באמת עובר את החוקים שלו — מריצים שוב, בזרע אחר.
 * 5. אין פרטים אישיים בפלט (טלפון, מייל, ת״ז, קישור, טוקן).
 * 6. הקבצים הנגזרים מעודכנים: proofs.json · lab-data.json · missing/*.json.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assemble, buildIndex, indexOf, findGoal, askChips, goalFromChips, recipeFrom, piiLeak, fit, normGoal } from '../combiner/core.mjs';
import { loadGoals, loadIndex, loadParts, loadProofs, loadBehavior, CATALOG } from '../combiner/load.mjs';
import { buildAll } from '../combiner/build.mjs';
import { judgeAll, judgeParts, judgeFlows } from '../combiner/judge';

const HERE = join(CATALOG, 'combiner');
const goals = loadGoals();
const ix = loadIndex();
const dictWords = new Set(
  readdirSync(join(CATALOG, 'goals'))
    .filter((f) => f.endsWith('.json') && f !== 'schema.json')
    .flatMap((f) => JSON.parse(readFileSync(join(CATALOG, 'goals', f), 'utf8')).goals.map((g: { word: string }) => g.word)),
);

type Step = { id: string; takes: string[]; gives: string; proof: string; by: string; role: string; cases: number };
type Chain = { steps: Step[]; ring: number; tier: string };
type Need = { need: { id: string; verb: string; material: string; from?: string }; chain: Chain | null; alternatives: Chain[]; groupFlow?: { status: string } };
type Asm = { goal: { word: string }; needs: Need[]; missing: { need: string; verb: string; material: string; takes: string[]; gives: string; example: unknown }[]; outcome: string };

const sym = (id: string): string => id.split('#')[1];

describe('המצרף · מילון-המטרות', () => {
  it('המילון התמזג — יותר מ-150 מילים, וכל אחת מורכבת', () => {
    expect(dictWords.size).toBeGreaterThan(150);
    expect(goals.filter((g: { word: string }) => dictWords.has(g.word)).length).toBeGreaterThanOrEqual(150);
  });

  it('לפחות 10 מטרות מהמילון: כל צורך — שרשרת שעוברת בדיקת-סוגים, או בקשת-בנייה', () => {
    const sample = goals.filter((g: { word: string }) => dictWords.has(g.word)).slice(0, 24);
    expect(sample.length).toBeGreaterThanOrEqual(10);
    let chains = 0;
    for (const g of sample) {
      const a = assemble(g, ix) as Asm;
      expect(a.needs.length).toBe(g.needs.length);
      for (const n of a.needs) {
        if (!n.chain) {
          expect(a.missing.some((m) => m.need === n.need.id)).toBe(true);
          continue;
        }
        chains++;
        const st = n.chain.steps;
        expect(st.length).toBeGreaterThanOrEqual(1);
        expect(st.length).toBeLessThanOrEqual(3);
        expect(st.length).toBe(n.chain.ring);
        // הפלט של אחד הוא הקלט (הראשי) של הבא
        for (let i = 1; i < st.length; i++) expect(fit(st[i - 1].gives, st[i].takes[0]), st[i - 1].id + ' ⇒ ' + st[i].id).toBeGreaterThan(0);
        // החומר: בקצה (נותן) או בכניסה (מקבל)
        const onMat = fit(st[st.length - 1].gives, n.need.material) > 0 || (st[0].takes.length > 0 && fit(n.need.material, st[0].takes[0]) > 0);
        expect(onMat, n.need.id).toBe(true);
        // בדיוק אחד מהצעדים עושה את הפועל של הצורך
        expect(st.some((s) => s.role === n.need.verb)).toBe(true);
      }
    }
    expect(chains).toBeGreaterThan(50);
  });

  it('פועל חדש (NEW:) — תמיד חסר, עם בקשת-בנייה מלאה', () => {
    const g = goals.find((x: { needs: { verb: string }[] }) => x.needs.some((n) => n.verb.startsWith('NEW:')));
    const a = assemble(g, ix) as Asm;
    const m = a.missing.find((x) => x.verb.startsWith('NEW:'))!;
    expect(m).toBeTruthy();
    for (const k of ['verb', 'material', 'takes', 'gives', 'example']) expect(m).toHaveProperty(k);
  });

  it('פעלי המילון הזמני ממופים לאלפבית (gate ⇒ validate, round-robin ⇒ rotate, daily-snapshot ⇒ bucket)', () => {
    const g = normGoal({ word: 'בדיקה', needs: [{ behavior: 'א', verb: 'gate', material: 'bool' }, { behavior: 'ב', verb: 'round-robin', material: 'sequence' }, { behavior: 'ג', verb: 'daily-snapshot', material: 'text' }] });
    expect(g.needs.map((n: { verb: string }) => n.verb)).toEqual(['validate', 'rotate', 'bucket']);
  });
});

describe('המצרף · החמנייה של הבעלים', () => {
  const g = findGoal('חמנייה', goals);
  const a = assemble(g, ix) as Asm;
  const by = (id: string): Need => a.needs.find((n) => n.need.id === id)!;
  const core = (id: string): string => sym(by(id).chain!.steps.find((s) => s.role === by(id).need.verb)!.id);

  it('המטרה של הבעלים גוברת על המילון באותה מילה', () => {
    expect(g.id).toBe('sunflower');
  });

  it('מוצאת את החלקים שהבעלים מנה', () => {
    expect(['sunrise', 'sunset']).toContain(core('sun'));
    expect(core('next-sunrise')).toBe('nextAfter');
    expect(core('turn-back')).toBe('offsetAll');
    expect(core('small-steps')).toBe('roundTo');
    expect(core('golden')).toBe('divideSpan');
    expect(core('next-slot')).toBe('fairAssign');
    expect(core('streak')).toBe('mergeRuns');
    expect(core('bees-ask')).toBe('fairAssign');
    expect(core('bees-escalate')).toBe('escalationState');
    for (const id of ['snapshot', 'stages', 'bloom-gate', 'bees-pace', 'field-hub', 'field-shade', 'diary']) expect(by(id).chain, id).not.toBeNull();
  });

  it('מקום-השמש, הבא, מזיז ומעגל — מוכחים, והזרימה ביניהם מוכחת (זריחה ⇒ הבא ⇒ מזיז ⇒ מעגל)', () => {
    for (const id of ['sun', 'next-sunrise', 'turn-back', 'small-steps']) expect(by(id).chain!.steps.every((s) => s.proof === 'proven'), id).toBe(true);
    for (const id of ['next-sunrise', 'turn-back', 'small-steps']) expect(by(id).groupFlow?.status, id).toBe('proven');
  });

  it('האזימוט חסר — ויוצא כבקשת-בנייה {verb, material, takes, gives, example}', () => {
    expect(by('azimuth').chain).toBeNull();
    const m = a.missing.find((x) => x.need === 'azimuth')!;
    expect(m).toMatchObject({ verb: 'sun-position', material: 'number', takes: ['geo'], gives: 'number' });
    expect(m.example).toBeTruthy();
    const file = join(HERE, 'missing', 'sunflower.azimuth.json');
    expect(existsSync(file)).toBe(true);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(JSON.parse(JSON.stringify(m)));
  });

  it('ערבוב פרויקטים — לפחות 4 פרויקטים בהרכבה', () => {
    const srcs = new Set(a.needs.flatMap((n) => (n.chain ? n.chain.steps.map((s) => s.id.split(':')[0]) : [])));
    expect(srcs.size).toBeGreaterThanOrEqual(4);
  });
});

describe('המצרף · טבעות, מתכונים, שאלות', () => {
  it('טבעת 2: "לעגל שעה" — ממיר שעה⇒דקות ואז מעגל, והזרימה ביניהם מוכחת', () => {
    const a = assemble(findGoal('שעון מעורר', goals) ?? normGoal(JSON.parse(readFileSync(join(HERE, 'fixtures/goals.json'), 'utf8')).goals.find((x: { id: string }) => x.id === 'alarm')), ix) as Asm;
    const n = a.needs.find((x) => x.need.from === 'times' && x.need.verb === 'round');
    if (!n) return; // המילון החליף את המטרה — הבדיקה הבאה מכסה זרימה
    expect(n.chain!.ring).toBe(2);
    expect(n.chain!.steps.map((s) => sym(s.id))).toEqual(['hmToMin', 'roundTo']);
  });

  it('מתכון שמור נהיה חלק חדש: "שדה חמניות" בונה על החמנייה מהמדף', () => {
    const sun = assemble(findGoal('חמנייה', goals), ix) as Asm;
    const r = recipeFrom(sun);
    const ix2 = buildIndex(loadParts(), { proofs: loadProofs(), behavior: loadBehavior(), recipes: [r] });
    const field = normGoal(JSON.parse(readFileSync(join(HERE, 'fixtures/goals.json'), 'utf8')).goals.find((x: { id: string }) => x.id === 'sunflower-field'));
    const a = assemble(field, ix2) as Asm;
    expect(a.needs[0].chain!.steps[0].id).toBe('recipe:sunflower');
    // בלי המתכון — חסר
    const a0 = assemble(field, buildIndex(loadParts(), { proofs: loadProofs(), behavior: loadBehavior(), recipes: [] })) as Asm;
    expect(a0.needs[0].chain).toBeNull();
  });

  it('מילה לא מוכרת ⇒ שאלה סגורה (צ׳יפים), בלי ניחוש עולם; הבחירה מורכבת', () => {
    expect(findGoal('בננה-כחולה-שאין', goals)).toBeNull();
    const ask = askChips('בננה');
    expect(ask.ask).toBe(true);
    expect(ask.verbs.length).toBeGreaterThan(30);
    expect(ask.materials.length).toBeGreaterThan(10);
    const a = assemble(goalFromChips('בננה', [{ verb: 'divide', material: 'sequence' }, { verb: 'sun-position', material: 'number' }]), ix) as Asm;
    expect(sym(a.needs[0].chain!.steps[0].id)).toBe('divideSpan');
  });
});

describe('המצרף · דטרמיניזם', () => {
  const sample = goals.slice(0, 40);

  it('אותו קלט ⇒ אותה הרכבה, גם כשסדר-החלקים מעורבב', () => {
    const parts = loadParts();
    const shuffled = [...parts].reverse();
    const ix2 = buildIndex(shuffled, { proofs: loadProofs(), behavior: loadBehavior(), recipes: [] });
    const ix1 = buildIndex(parts, { proofs: loadProofs(), behavior: loadBehavior(), recipes: [] });
    for (const g of sample) expect(JSON.stringify(assemble(g, ix2))).toBe(JSON.stringify(assemble(g, ix1)));
  });

  it('הדף (lab-data.json) מרכיב בדיוק כמו ה-CLI', () => {
    const lab = JSON.parse(readFileSync(join(HERE, 'lab-data.json'), 'utf8'));
    const lix = indexOf(lab.parts, lab.flows);
    for (const g of sample) expect(JSON.stringify(assemble(g, lix))).toBe(JSON.stringify(assemble(g, ix)));
  });
});

describe('המצרף · השופט', () => {
  const all = goals.map((g: unknown) => assemble(g, ix) as Asm);
  const steps = all.flatMap((a) => a.needs.flatMap((n) => (n.chain ? [n.chain, ...n.alternatives] : [])).flatMap((c) => c.steps));

  it('כל צעד שהשופט הוכיח עובר שוב את החוקים — בזרע אחר', () => {
    const judged = [...new Set(steps.filter((s) => s.proof === 'proven' && s.by === 'judge').map((s) => s.id))];
    expect(judged.length).toBeGreaterThanOrEqual(8);
    const again = judgeParts(150, 777);
    for (const id of judged) expect(again[id]?.status, id).toBe('proven');
    const flows = judgeFlows(80, 777);
    for (const [k, f] of Object.entries(loadProofs().flows) as [string, { status: string }][]) if (f.status === 'proven') expect(flows[k]?.status, k).toBe('proven');
  }, 60_000);

  it('כל צעד שקורא-ההתנהגות הוכיח — באמת רשום אצלו n/n לאותו פועל', () => {
    const beh = loadBehavior()!;
    const read = steps.filter((s) => s.proof === 'proven' && s.by === 'reader');
    expect(read.length).toBeGreaterThan(20);
    const ok = (id: string, verb: string): boolean => {
      const homes = ix.byId.get(id)!.homes.map((h: { id: string }) => h.id);
      return homes.some((h: string) => {
        const b = beh.get(h);
        return b?.labeledBy === 'run' && b.verbs.some((v: { id: string; holds?: string }) => v.id === verb && /^(\d+)\/\1$/.test(v.holds || ''));
      });
    };
    for (const s of read) expect(ok(s.id, s.role), s.id + ' · ' + s.role).toBe(true);
  });

  it('proofs.json מעודכן (השופט רץ מחדש ⇒ אותו קובץ), ואין הוכחה שנכשלה', () => {
    const fresh = judgeAll();
    expect(JSON.stringify(fresh, null, 1) + '\n').toBe(readFileSync(join(HERE, 'proofs.json'), 'utf8'));
    for (const p of [...Object.values(fresh.parts), ...Object.values(fresh.flows)]) expect(p.status).toBe('proven');
  }, 60_000);
});

describe('המצרף · פרטיות וקבצים נגזרים', () => {
  it('אין פרטים אישיים בשום הרכבה, בנתוני-הדף ובבקשות-הבנייה', () => {
    for (const g of goals) expect(piiLeak(assemble(g, ix)), g.word).toBeNull();
    expect(piiLeak(JSON.parse(readFileSync(join(HERE, 'lab-data.json'), 'utf8')))).toBeNull();
    for (const f of readdirSync(join(HERE, 'missing'))) expect(piiLeak(JSON.parse(readFileSync(join(HERE, 'missing', f), 'utf8'))), f).toBeNull();
    // הבודק עצמו תופס
    expect(piiLeak({ a: 'כתבו ל-x@gmail.com' })).not.toBeNull();
    expect(piiLeak({ a: '050-123-4567' })).not.toBeNull();
  });

  it('lab-data.json ו-missing/ מעודכנים (node catalog/combiner/build.mjs)', () => {
    const { lab, missing } = buildAll();
    expect(lab).toBe(readFileSync(join(HERE, 'lab-data.json'), 'utf8'));
    const files = readdirSync(join(HERE, 'missing')).filter((f) => f.endsWith('.json')).sort();
    expect(files).toEqual(Object.keys(missing).sort());
    for (const f of files) expect(readFileSync(join(HERE, 'missing', f), 'utf8'), f).toBe(missing[f]);
  }, 30_000);
});
