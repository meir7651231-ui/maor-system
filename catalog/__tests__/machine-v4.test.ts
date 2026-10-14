/**
 * 🧭 MACHINE-V4 (14.10.2026) — ratchet: 🔎 64 ⇒ 1.
 * 1. 9 ליבות-החומר (core-c) מעודכנות, עם origins אמיתיים, וכל אחת מוכחת בהרצה (n/n) לפועל שלה — והוא הראשי שלה.
 * 2. נקודות ⇒ רשת ⇒ דרך/גל: השילוב עובר את חוקי «מוצא דרך קצרה» / «מתפשט» על נקודות (הקלט הראשון = הנקודות).
 * 3. ליבת-חומר עונה רק לחומר שלה: מסיר-הכפולים של הנקודות לא עונה ל"ספר טלפונים: כפולים" (הבאג שנתפס בדרך).
 * 4. כל התנהגות שמופתה מחדש נושאת `note` עם מה שהיה ולמה; ה-🔎 היחיד שנשאר הוא «מעצב·ui» (רכיבי-מסך לא נכנסים לאינדקס).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { assemble, normGoal } from '../combiner/core.mjs';
import { loadGoals, loadIndex } from '../combiner/load.mjs';
import { nearNet } from '../core/near-net.mjs';
import { followPoint } from '../core/follow-point.mjs';
import { randomPoints } from '../core/random-points.mjs';

const ROOT = join(__dirname, '..', '..');
const src = JSON.parse(readFileSync(join(ROOT, 'catalog/sources/core-c.json'), 'utf8'));
const beh = JSON.parse(readFileSync(join(ROOT, 'catalog/behavior/core-c.json'), 'utf8'));
const combos = JSON.parse(readFileSync(join(ROOT, 'catalog/combiner/combos.json'), 'utf8'));
type Need = { status: string; need: { verb: string; material: string; behavior: string }; chain: { steps: { id: string }[] } | null };

describe('MACHINE-V4 — ליבות-החומר והמילון', () => {
  it('core-c מעודכן; כל ליבה עם origins (מקור best באורביט, ושורה אמיתית)', () => {
    execFileSync(process.execPath, [join(ROOT, 'catalog/scripts/core-c-census.mjs'), '--check'], { stdio: 'pipe' });
    expect(src.parts.length).toBe(9);
    for (const p of src.parts) {
      expect(p.pure, p.id).toBe(true);
      expect(p.origins[0].repo, p.id).toBe('maor-system');
      for (const o of p.origins) expect(Number.isInteger(o.line) && o.line > 0, p.id).toBe(true);
    }
  });

  it('כל ליבה מוכחת בהרצה לפועל שלה (n/n), והוא הראשי', () => {
    for (const p of src.parts) {
      const verb = p.tags.find((t: string) => t.startsWith('verb:')).slice(5);
      const e = beh.parts.find((x: { id: string }) => x.id === p.id);
      expect(e.labeledBy, p.id).toBe('run');
      expect(e.verbs.find((v: { id: string }) => v.id === verb)?.holds, p.id + ' ⇏ ' + verb).toMatch(/^(\d+)\/\1$/);
      expect(e.primary, p.id).toBe(verb);
    }
  });

  it('דוגמאות-עולם: רשת-הסינפסות, הכדור שנגרר אחרי העכבר, אבק-הזהב', () => {
    expect(nearNet({ points: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }], near: 1 }).edges).toEqual([{ a: 0, b: 1, w: 3 }, { a: 1, b: 2, w: 4 }]);
    expect(followPoint({ target: { x: 1, y: 1 }, pullPct: 5 }, { x: 0, y: 0 })).toEqual({ x: 0.05, y: 0.05 });
    const a = randomPoints({ seed: 3 }, 5);
    expect(randomPoints({ seed: 3 }, 9).slice(0, 5)).toEqual(a);
    for (const p of a) expect(p.x >= 0 && p.x < 1 && p.y >= 0 && p.y < 1).toBe(true);
  });

  it('נקודות ⇒ רשת ⇒ דרך/גל: השילובים עברו את החוקים של הפועל, על הנקודות', () => {
    for (const v of ['shortest-path', 'spread']) {
      const r = combos.results.find((x: { verb: string; material: string }) => x.verb === v && x.material === 'geo');
      expect(r.found?.steps, v).toEqual(['core-c:catalog/core/near-net.mjs#nearNet', v === 'spread' ? 'core:catalog/core/spread.mjs#spread' : 'core:catalog/core/shortest-path.mjs#shortestPath']);
      expect(r.found.holds).toMatch(/^(\d+)\/\1$/);
      expect(String(r.found.on).split('+')[0]).toBe('spec');
    }
  });

  it('ליבת-חומר עונה רק לחומר שלה, וה-🔎 היחיד: «מעצב·ui»', () => {
    const ix = loadIndex();
    const goals = loadGoals();
    const dig: string[] = [];
    for (const g of goals) for (const n of assemble(g, ix).needs as Need[]) {
      if (n.status === 'dig') dig.push(n.need.verb + '·' + n.need.material);
      if (n.chain && !['geo', 'sound', 'image'].includes(n.need.material)) for (const s of n.chain.steps) expect(s.id.startsWith('core-c:') && !s.id.includes('near-net'), g.word + ': ' + n.need.behavior).toBe(false);
    }
    expect(dig).toEqual(['format·ui']);
    const phone = assemble(normGoal({ id: 'p', word: 'בדיקה', needs: [{ id: 'd', behavior: 'כפולים', verb: 'dedupe', material: 'list' }] }), ix).needs[0] as Need;
    expect(phone.chain!.steps[0].id).not.toContain('dedupe-points');
  }, 120_000);

  it('כל מיפוי-מחדש של MACHINE-V4 נושא note עם מה שהיה', () => {
    let n = 0;
    for (const f of readdirSync(join(ROOT, 'catalog/goals')).filter((x) => x.endsWith('.json') && x !== 'schema.json' && x !== 'coverage.json')) {
      for (const g of JSON.parse(readFileSync(join(ROOT, 'catalog/goals', f), 'utf8')).goals) for (const x of g.needs) if (/^MACHINE-V4: היה [a-z-]+·[a-z:]+\. /.test(x.note || '')) n++;
    }
    expect(n).toBe(32);
  });
});
