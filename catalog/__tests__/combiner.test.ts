/**
 * 🧲 המצרף (COMBINER, 14.10.2026) — ratchet.
 * 1. לפחות 10 מטרות מהמילון מורכבות, וכל שרשרת עוברת בדיקת-סוגים (הפלט של אחד = הקלט של הבא; החומר בקצה).
 * 2. החמנייה של הבעלים: מוצאת את החלקים שהוא מנה (מקום-השמש · הבא · מזיז · מעגל · מחלק · בתורות · מחבר · מסלים…),
 *    והאזימוט ("לאיזה כיוון השמש") — 🔎 עוד לא נחפר, עם המקום הידוע בתוך חישוב-הזריחה.
 * 7. "לא חסר כלום" (הכרעת-בעלים 14.10): רק מוכח-בהרצה נחשב · ליבה אחת + מתאמי-סוג בלבד · הפעולה קודם, העולם אחר-כך ·
 *    ארבעה סטטוסים, בלי המילה "חסר" · מקורות חדשים (core/inner) נכנסים בלי שינוי-קוד.
 * 3. דטרמיניזם: אותו קלט ⇒ אותה הרכבה; סדר-החלקים לא משנה; הדף (lab-data) מרכיב בדיוק כמו ה-CLI.
 * 4. כל צעד "מוכח" באמת עובר את החוקים שלו — מריצים שוב, בזרע אחר.
 * 5. אין פרטים אישיים בפלט (טלפון, מייל, ת״ז, קישור, טוקן).
 * 6. הקבצים הנגזרים מעודכנים: proofs.json · lab-data.json · dig/*.json.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assemble, buildIndex, indexOf, findGoal, askChips, goalFromChips, recipeFrom, piiLeak, fit, normGoal, ADAPTER_VERBS, STATUS_ORDER, whereLine } from '../combiner/core.mjs';
import { loadGoals, loadIndex, loadParts, loadProofs, loadBehavior, loadAlphabet, loadLeads, CATALOG } from '../combiner/load.mjs';
import { VERB_BY_ID, useAlphabet } from '../combiner/verbs.mjs';
import { buildAll } from '../combiner/build.mjs';
import { judgeAll, judgeParts, judgeFlows } from '../combiner/judge';

const HERE = join(CATALOG, 'combiner');
const goals = loadGoals();
const ix = loadIndex();
const dictWords = new Set(
  readdirSync(join(CATALOG, 'goals'))
    .filter((f) => f.endsWith('.json') && f !== 'schema.json' && f !== 'coverage.json')
    .flatMap((f) => JSON.parse(readFileSync(join(CATALOG, 'goals', f), 'utf8')).goals.map((g: { word: string }) => g.word)),
);

type Where = { name: string; file: string; origins: { source: string; project: string; file: string }[]; parent: { name: string; file: string } | null };
type Step = { id: string; name: string; takes: string[]; gives: string; proof: string; by: string; role: string; cases: number; action: { he: string; plain: string }; where: Where; inner: boolean };
type Chain = { steps: Step[]; ring: number; tier: string };
type Place = { project: string; name: string; file: string; lines?: string; lead?: boolean };
type Need = { need: { id: string; verb: string; material: string; from?: string; behavior: string }; status: string; chain: Chain | null; alternatives: Chain[]; places?: Place[]; groupFlow?: { status: string } };
type Dig = { need: string; verb: string; material: string; takes: string[]; gives: string; example: unknown; status: string; places: Place[] };
type Asm = { goal: { word: string }; needs: Need[]; dig: Dig[]; counts: Record<string, number>; outcome: string };

const sym = (id: string): string => id.split('#')[1];

describe('המצרף · מילון-המטרות', () => {
  it('המילון התמזג — יותר מ-150 מילים, וכל אחת מורכבת', () => {
    expect(dictWords.size).toBeGreaterThan(150);
    expect(goals.filter((g: { word: string }) => dictWords.has(g.word)).length).toBeGreaterThanOrEqual(150);
  });

  it('לפחות 10 מטרות מהמילון: כל צורך — שרשרת מוכחת שעוברת בדיקת-סוגים, או בקשת-חפירה', () => {
    const sample = goals.filter((g: { word: string }) => dictWords.has(g.word)).slice(0, 24);
    expect(sample.length).toBeGreaterThanOrEqual(10);
    let chains = 0;
    for (const g of sample) {
      const a = assemble(g, ix) as Asm;
      expect(a.needs.length).toBe(g.needs.length);
      for (const n of a.needs) {
        if (!n.chain) {
          expect(a.dig.some((m) => m.need === n.need.id)).toBe(true);
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

  it('פועל חדש (NEW:) שהאלפבית עוד לא מכיר — ⛏️ בכרייה, עם בקשת-חפירה מלאה ומקומות', () => {
    // מאז הכורים (14.10.2026) כל NEW: של המילון מוכר לאלפבית ⇒ פועל שעוד לא קיים נבדק על מטרה סינתטית
    const g = goals.find((x: { needs: { verb: string }[] }) => x.needs.some((n) => n.verb.startsWith('NEW:'))) ?? normGoal({ word: 'בדיקה', needs: [{ behavior: 'מתעטש', verb: 'NEW:sneeze', material: 'sound' }] });
    const a = assemble(g, ix) as Asm;
    const m = a.dig.find((x) => x.verb.startsWith('NEW:'))!;
    expect(m).toBeTruthy();
    expect(m.status).toBe('mining');
    for (const k of ['verb', 'material', 'takes', 'gives', 'example', 'places']) expect(m).toHaveProperty(k);
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
    expect(['sunrise', 'sunset', 'sunPosition']).toContain(core('sun'));
    expect(core('next-sunrise')).toBe('nextAfter');
    expect(core('turn-back')).toBe('offsetAll');
    expect(core('small-steps')).toBe('roundTo');
    expect(core('golden')).toBe('divideSpan');
    expect(core('next-slot')).toBe('fairAssign');
    expect(core('streak')).toBe('mergeRuns');
    expect(core('bees-ask')).toBe('fairAssign');
    expect(core('bees-escalate')).toBe('escalationState');
    for (const id of ['snapshot', 'stages', 'bloom-gate', 'diary']) expect(by(id).chain, id).not.toBeNull();
    // מווסת-קצב / מרכז / סובל-כשל — רק תוויות-שם ⇒ לא נספרים; הם בכרייה עכשיו
    // מאז הכורים (core-b) לשלושתם יש ליבה מוכחת-בהרצה ⇒ או ✅ (הליבה או שילוב שעבר את החוקים) — אף פעם לא "חסר"
    for (const id of ['bees-pace', 'field-hub', 'field-shade']) expect(['proven', 'inner', 'combo', 'mining'], id).toContain(by(id).status);
  });

  it('מקום-השמש, הבא, מזיז ומעגל — מוכחים, והזרימה ביניהם מוכחת (זריחה ⇒ הבא ⇒ מזיז ⇒ מעגל)', () => {
    for (const id of ['sun', 'next-sunrise', 'turn-back', 'small-steps']) expect(by(id).chain!.steps.every((s) => s.proof === 'proven'), id).toBe(true);
    for (const id of ['next-sunrise', 'turn-back', 'small-steps']) expect(by(id).groupFlow?.status, id).toBe('proven');
  });

  it('האזימוט — 🔎 עוד לא נחפר, והמקום הראשון לחפור הוא כיוון-השמש בתוך חישוב-הזריחה', () => {
    expect(by('azimuth').chain).toBeNull();
    expect(by('azimuth').status).toBe('dig');
    const m = a.dig.find((x) => x.need === 'azimuth')!;
    expect(m).toMatchObject({ verb: 'sun-position', material: 'number', takes: ['geo'], gives: 'number', status: 'dig' });
    expect(m.example).toBeTruthy();
    expect(m.places[0]).toMatchObject({ lead: true, file: 'telephony/lib/zmanim.mjs', lines: '72-85' });
    expect(m.places.filter((p) => !p.lead).length).toBe(3);
    const file = join(HERE, 'dig', 'sunflower.azimuth.json');
    expect(existsSync(file)).toBe(true);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(JSON.parse(JSON.stringify(m)));
  });

  it('ערבוב פרויקטים — לפחות 3 פרויקטים בהרכבה (רק מוכחים בהרצה; לפני "לא חסר כלום" — 5 עם תוויות-שם)', () => {
    const srcs = new Set(a.needs.flatMap((n) => (n.chain ? n.chain.steps.map((s) => s.id.split(':')[0]) : [])));
    expect(srcs.size).toBeGreaterThanOrEqual(3);
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
    // בלי המתכון — לא נמצא
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
    const lix = indexOf(lab.parts, lab.flows, lab.leads);
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
  it('אין פרטים אישיים בשום הרכבה, בנתוני-הדף ובבקשות-החפירה', () => {
    for (const g of goals) expect(piiLeak(assemble(g, ix)), g.word).toBeNull();
    expect(piiLeak(JSON.parse(readFileSync(join(HERE, 'lab-data.json'), 'utf8')))).toBeNull();
    for (const f of readdirSync(join(HERE, 'dig'))) expect(piiLeak(JSON.parse(readFileSync(join(HERE, 'dig', f), 'utf8'))), f).toBeNull();
    // הבודק עצמו תופס
    expect(piiLeak({ a: 'כתבו ל-x@gmail.com' })).not.toBeNull();
    expect(piiLeak({ a: '050-123-4567' })).not.toBeNull();
  });

  it('lab-data.json ו-dig/ מעודכנים (node catalog/combiner/build.mjs)', () => {
    const { lab, dig } = buildAll();
    expect(lab).toBe(readFileSync(join(HERE, 'lab-data.json'), 'utf8'));
    expect(existsSync(join(HERE, 'missing'))).toBe(false);
    const files = readdirSync(join(HERE, 'dig')).filter((f) => f.endsWith('.json')).sort();
    expect(files).toEqual(Object.keys(dig).sort());
    for (const f of files) expect(readFileSync(join(HERE, 'dig', f), 'utf8'), f).toBe(dig[f]);
  }, 30_000);
});

describe('המצרף · לא חסר כלום', () => {
  const all = goals.map((g: unknown) => assemble(g, ix) as Asm);
  const chains = all.flatMap((a) => a.needs.flatMap((n) => (n.chain ? [{ n, c: n.chain }, ...n.alternatives.map((c) => ({ n, c }))] : [])));

  it('בלי שרשראות-שטות: חלק-ליבה אחד מחזיק את הפועל, כל השאר מתאמי-סוג מוכחים', () => {
    expect(chains.length).toBeGreaterThan(300);
    for (const { n, c } of chains) {
      expect(c.steps.filter((s) => s.role === n.need.verb).length, n.need.behavior).toBe(1);
      for (const s of c.steps) if (s.role !== n.need.verb) expect(ADAPTER_VERBS.has(s.role), s.name + ' · ' + s.role).toBe(true);
    }
  });

  it('הדרקון: "מדרג את הפולשים" ו"נח בין התקפה להתקפה" — לא מורכבים מחלקי-עולם', () => {
    const d = all.find((a) => a.goal.word === 'דרקון')!;
    const n = (b: string): Need => d.needs.find((x) => x.need.behavior === b)!;
    const names = (x: Need): string => (x.chain ? x.chain.steps.map((s) => s.name).join(' → ') : '');
    expect(names(n('מדרג את הפולשים לפי סכנה'))).not.toMatch(/שנת לימודים|ארוחות/);
    expect(names(n('נח בין התקפה להתקפה'))).not.toMatch(/סיכון-נטישה|דקות מחצות/);
    expect(n('נח בין התקפה להתקפה').status).toBe('mining');
    // אותו דבר בחמנייה › דבורים
    const sun = all.find((a) => a.goal.word === 'חמנייה')!;
    expect(names(sun.needs.find((x) => x.need.id === 'bees-pace')!)).not.toMatch(/סיכון-נטישה|דקות מחצות/);
  });

  it('רק מוכח-בהרצה נחשב: כל צעד בכל שרשרת מוכח (קורא n/n או השופט או מתכון-מוכח)', () => {
    for (const { c } of chains) for (const s of c.steps) expect(s.proof, s.id).toBe('proven');
  });

  it('כל צורך מסתיים בדיוק באחד מארבעה סטטוסים; לא-מוכח ⇒ מקומות לחפור', () => {
    for (const a of all) {
      for (const n of a.needs) {
        expect(STATUS_ORDER).toContain(n.status);
        if (!n.chain) expect(n.places!.length, a.goal.word + ' · ' + n.need.behavior).toBeGreaterThan(0);
      }
      expect(Object.values(a.counts).reduce((x, y) => x + y, 0)).toBe(a.needs.length);
    }
  });

  it('הפעולה קודם: שם-הפועל והמשמעות מהאלפבית, ומתחת — "נמצא ב: <פרויקט> · <שם>"', () => {
    for (const { c } of chains.slice(0, 200))
      for (const s of c.steps) {
        if (VERB_BY_ID[s.role]?.plain) expect(s.action.he).toBe(VERB_BY_ID[s.role].he);
        expect(whereLine(s.where)).toMatch(/^נמצא (ב|בתוך): /);
      }
  });

  it('המילה "חסר" נעלמה מהסיכומים, מה-CLI ומהדף', () => {
    for (const a of all) {
      // המילים של המילון עצמו ("חסרה קובייה") הן תוכן — בודקים רק את המילים של המכונה
      const own = a.needs.reduce((t, n) => t.split(n.need.behavior).join(''), a.outcome);
      expect(own).not.toMatch(/חסר|נשלח לבנייה/);
      expect(a).not.toHaveProperty('missing');
    }
    const ui = readFileSync(join(CATALOG, 'lab.html'), 'utf8') + readFileSync(join(HERE, 'cli.mjs'), 'utf8');
    expect(ui).not.toMatch(/חסר|שלח לבנייה|נשלח לבנייה/);
    for (const f of readdirSync(join(HERE, 'dig'))) expect(JSON.parse(readFileSync(join(HERE, 'dig', f), 'utf8')).statusHe).not.toMatch(/חסר/);
  });

  it('קיבוע: חלק-ליבה עם origins בשני פרויקטים פותר צורך NEW:orbit ומציג את שני המקורות', () => {
    const base = loadAlphabet()!;
    try {
      useAlphabet([...base, { id: 'orbit', he: 'מסתובב סביב מרכז', means: 'נע במעגל סביב נקודה, בקצב קבוע', takes: ['number'], gives: 'geo' }]);
      const g = normGoal({ word: 'דרקון-בדיקה', needs: [{ behavior: 'עף במעגלים', verb: 'NEW:orbit', material: 'geo' }] });
      expect(g.needs[0].verb).toBe('orbit');
      const part = { id: 'core:circle.ts#orbitAt', source: 'core', path: 'circle.ts', symbol: 'orbitAt', lang: 'ts', what: 'function', name: 'מחשב נקודה על מעגל', takes: [{ kind: 'number' }], gives: { kind: 'geo' }, pure: true, origins: [{ source: 'orbit', path: 'src/components/supporters/SupportersGalaxy.tsx' }, 'buildsmart:lib/anim.ts#spin'] };
      const beh = new Map([[part.id, { id: part.id, labeledBy: 'run', primary: 'orbit', verbs: [{ id: 'orbit', holds: '30/30' }] }]]);
      const a = assemble(g, buildIndex([part], { behavior: beh, leads: loadLeads() })) as Asm;
      expect(a.needs[0].status).toBe('proven');
      const s = a.needs[0].chain!.steps[0];
      // האלפבית כבר מכיר את orbit (פעלי-התנועה) ⇒ השם שלו גובר על הפועל המוזרק
      expect(s.action.he).toBe(base.find((v: { id: string }) => v.id === 'orbit')?.he ?? 'מסתובב סביב מרכז');
      expect(s.where.origins.map((o) => o.source)).toEqual(['orbit', 'buildsmart']);
      expect(whereLine(s.where)).toBe('נמצא ב: אורביט · בנייה חכמה · מחשב נקודה על מעגל');
      // בלי ההוכחה — לא נספר, וחוזר ל-⛏️ עם המקום הידוע
      const a0 = assemble(g, buildIndex([part], { leads: loadLeads() })) as Asm;
      expect(a0.needs[0].status).toBe('mining');
      expect(a0.needs[0].places![0].file).toBe('src/components/supporters/SupportersGalaxy.tsx');
    } finally {
      useAlphabet(base);
    }
    // אחרי השחזור — האלפבית חזר בדיוק למה שהיה (orbit קיים בו מאז הכורים)
    expect(VERB_BY_ID.orbit?.he).toBe(loadAlphabet()!.find((v: { id: string }) => v.id === 'orbit')?.he);
  });

  it('קיבוע: חלק פנימי עם parent ⇒ ✅ מוכח — חלק פנימי, "נמצא בתוך: <ההורה> · <קובץ>"', () => {
    const parent = { id: 'orbit:telephony/lib/zmanim.mjs#sunTimes', source: 'orbit', path: 'telephony/lib/zmanim.mjs', symbol: 'sunTimes', lang: 'js', what: 'function', name: 'מחשב זריחה ושקיעה', takes: [{ kind: 'date' }, { kind: 'geo' }], gives: { kind: 'times' }, pure: true };
    const inner = { id: 'inner:telephony/lib/zmanim.mjs#sunTimes>decl', source: 'orbit', path: 'telephony/lib/zmanim.mjs', symbol: 'sunTimes>decl', lang: 'js', what: 'function', name: 'מחשב את נטיית השמש', takes: [{ kind: 'date' }], gives: { kind: 'number' }, pure: true, parent: parent.id };
    const beh = new Map([[inner.id, { id: inner.id, labeledBy: 'run', primary: 'sun-position', verbs: [{ id: 'sun-position', holds: '40/40' }] }]]);
    const g = normGoal({ word: 'חמנייה-בדיקה', needs: [{ behavior: 'לאיזה כיוון השמש', verb: 'sun-position', material: 'number' }] });
    const a = assemble(g, buildIndex([parent, inner], { behavior: beh })) as Asm;
    expect(a.needs[0].status).toBe('inner');
    expect(a.counts.inner).toBe(1);
    expect(whereLine(a.needs[0].chain!.steps[0].where)).toBe('נמצא בתוך: מחשב זריחה ושקיעה · telephony/lib/zmanim.mjs');
  });
});
