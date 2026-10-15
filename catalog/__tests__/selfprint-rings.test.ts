/**
 * 🔁 RINGS-PORT (15.10.2026) — מה שלקחנו ממעבדת-הטבעות אל מנוע-השרטוטים-העצמי (catalog/selfprint/rings.mjs).
 * ננעל: (1) עדיפות/תקציב-לפי-היסטוריה/תקרה-בעומק; (2) tie/bind הן טרנספורמציות של שלד-קיים בלבד — אותם חורים, אותם
 * חלקי-בסיס, חור-חדש אחד לכל היותר; (3) הבדיקות-מדוגמאות מזהות נכון צבירה / מפתח / סינון — ולא מזהות מה שאינו;
 * (4) השומר חוסם גם את המבחן הנסתר; history.json קפוא ולא נכתב ע״י המנוע.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as RG from '../selfprint/rings.mjs';
import { hiddenPath } from '../selfprint/guard.mjs';

const ROOT = join(__dirname, '../..');
const H = { code: { a: { built: 38, successes: 0 }, b: { built: 38, successes: 14 }, c: { built: 4, successes: 1 } } };

describe('RINGS-PORT · ladder-order + stagestats', () => {
  it('עדיפות = (הצלחות+1)/(נבנו+2); שלד שלא נוסה ⇒ ½', () => {
    expect(RG.priorOf(H, 'b')).toBeCloseTo(15 / 40);
    expect(RG.priorOf(H, 'zz')).toBe(0.5);
    expect(RG.scoreOf(1, 0)).toBe(1);
    expect(RG.scoreOf(1, 4)).toBe(0.5);
  });
  it('תקציב: לא הצליח ב-≥15 ⇒ רבע; הצליח ≥5 ⇒ פי 2; אחרת הבסיס', () => {
    expect(RG.learnedQuota(H, 'a', 12)).toBe(3);
    expect(RG.learnedQuota(H, 'b', 12)).toBe(24);
    expect(RG.learnedQuota(H, 'c', 12)).toBe(12);
    expect(RG.learnedQuota(H, 'zz', 12)).toBe(12);
  });
  it('תקרה לאתר-מילוי קטנה בעומק, לא פחות מ-6', () => {
    expect([1, 2, 3, 4].map((d) => RG.capAt(24, d))).toEqual([24, 12, 6, 6]);
  });
});

describe('RINGS-PORT · חשב פעם אחת, השתמש לכל פריט (על שלד קיים)', () => {
  // השלד של הכורה code-0041: סינון xs לפי □0(it, i1)
  const filt = { inputs: ['i0', 'i1'], nodes: [{ id: 'L0', loop: { over: '$i0', init: [], item: 'it', state: 'st', nodes: [{ id: 'h0', part: '□0', args: ['$it', '$i1'] }, { id: 'b0', part: '⟨choose⟩', args: ['@h0', { $cat: ['$st', ['$it']] }, '$st'] }], next: '@b0' } }], out: '@L0.state' };
  it('tie: הקלט השני ⇐ הראשון, שאר הגרף זהה', () => {
    const t = RG.tieInputs(filt)!;
    expect(t.inputs).toEqual(['i0']);
    expect(JSON.stringify(t)).not.toContain('$i1');
    expect(JSON.stringify(t).replace(/\$i0/g, '')).toBe(JSON.stringify({ ...filt, inputs: ['i0'] }).replace(/\$i[01]/g, '').replace('"i0","i1"', '"i0"'));
  });
  it('bind: קלט שמשמש בגוף-לכל-פריט ⇐ חור-חדש שמחושב פעם אחת מהרשימה (לפני הלולאה)', () => {
    const [b] = RG.bindInput(filt, 1);
    expect(b.graph.inputs).toEqual(['i0']);
    expect(b.graph.nodes[0]).toEqual({ id: 'hs', part: '□1', args: ['$i0'] });
    expect(JSON.stringify(b.graph.nodes[1])).toContain('"@hs"');
    // אותם חלקים בדיוק + החור החדש — לא שלד חדש
    const parts = (g: { nodes: unknown[] }) => (JSON.stringify(g).match(/"part":"[^"]+"/g) || []).sort();
    expect(parts(b.graph)).toEqual([...parts(filt), '"part":"□1"'].sort());
  });
  it('bind: בלי גוף-לכל-פריט (הקלט השני לא בתוך לולאה) ⇒ אין', () => {
    const g = { inputs: ['i0', 'i1'], nodes: [{ id: 'h0', part: '□0', args: ['$i1'] }, { id: 'h1', part: '□1', args: ['$i0', '@h0'] }], out: '@h1' };
    expect(RG.bindInput(g, 2)).toEqual([]);
    expect(RG.tieInputs(g)!.nodes[0].args).toEqual(['$i0']);
  });
});

describe('RINGS-PORT · בדיקות-מדוגמאות', () => {
  const EVL = RG.evidenceLists();
  const sum = (xs: number[]) => xs.reduce((a, x) => a + x, 0);
  it('נסיגה: סכום/מקסימום ⇒ כן; ממוצע/חציון ⇒ לא', () => {
    expect(RG.regressionTest(sum, EVL).ok).toBe(true);
    expect(RG.regressionTest((xs: number[]) => (xs.length ? Math.max(...xs) : null), EVL).ok).toBe(true);
    expect(RG.regressionTest((xs: number[]) => (xs.length ? sum(xs) / xs.length : null), EVL).ok).toBe(false);
  });
  it('מפתח מקדימויות: מיון ⇒ כן; היפוך ⇒ לא (מעגל); סינון ⇒ לא (לא סידור-מחדש)', () => {
    expect(RG.keyOrderTest((xs: number[]) => [...xs].sort((a, b) => a - b), EVL).ok).toBe(true);
    expect(RG.keyOrderTest((xs: number[]) => [...xs].reverse(), EVL).ok).toBe(false);
    expect(RG.keyOrderTest((xs: number[]) => xs.filter((x) => x > 0), EVL).ok).toBe(false);
  });
  it('טבלת-אמת ⇒ תנאי מחלקים: "מעל הממוצע" = >(x, ממוצע); "ייחודיים" — אין תנאי לפי ערך+סטטיסטיקה', () => {
    const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : null);
    const above = (xs: number[]) => { const m = mean(xs); return xs.filter((x) => x > (m as number)); };
    const tt = RG.truthTable(above, EVL);
    expect(tt.ok).toBe(true);
    const cmps = [{ id: '<', f: (a: number, b: number) => (a < b ? 1 : 0) }, { id: '>', f: (a: number, b: number) => (a > b ? 1 : 0) }];
    expect(RG.filterCondition(tt.rows, cmps, [{ id: 'sum', f: sum }, { id: 'mean', f: mean }])).toEqual({ cmp: '>', stat: 'mean' });
    const uniq = (xs: number[]) => xs.filter((x, i) => xs.indexOf(x) === i);
    const tu = RG.truthTable(uniq, EVL);
    expect(tu.ok).toBe(true);
    expect(RG.filterCondition(tu.rows, cmps, [{ id: 'mean', f: mean }])).toBeNull();
  });
});

describe('RINGS-PORT · שומרים', () => {
  it('המבחן הנסתר חסום למנוע', () => {
    expect(hiddenPath(join(ROOT, 'catalog/spfair/hidden/targets-hidden.mjs'))).toBe(true);
    expect(hiddenPath(join(ROOT, 'catalog/spfair/targets.mjs'))).toBe(false);
  });
  it('history.json קפוא: מגיע מ-380625d, והמנוע לא כותב אותו', () => {
    const h = JSON.parse(readFileSync(join(ROOT, 'catalog/selfprint/history.json'), 'utf8'));
    expect(h.from).toBe('380625d');
    const src = readFileSync(join(ROOT, 'catalog/selfprint/selfprint.mjs'), 'utf8');
    expect(src).not.toMatch(/writeFileSync\([^)]*history/);
  });
  it('rings.mjs טהור: בלי fs / שעון / אקראי', () => {
    const src = readFileSync(join(ROOT, 'catalog/selfprint/rings.mjs'), 'utf8');
    expect(src).not.toMatch(/from 'node:|Date\.now|Math\.random/);
  });
});
