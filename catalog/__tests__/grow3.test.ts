/**
 * 🌱 GROW3 (15.10.2026) — הבחירה בלי בזבוז על כפולים, עם גיוון לפי פועל, וסולם בלי עטיפות.
 * הבאגים שהוביל אליהם GROW2 (בדוח knowledge/CLOSED-GROW2-2026-10-15.md §3):
 *   - הבחירה התרכזה סביב מעט עוגנים ⇒ 338/1,045/1,339 כפולים בקומות 1–3 (מול 127/66/48 באקראי);
 *   - "משווה" לא קיבל בנייה מעליו, כי 40 הטובים בעולם התמלאו בפעלים שכבר קרובים לייחוס;
 *   - הסולם הגבוה (3) היה "מסיר כפולים" עטוף שלוש פעמים.
 */
import { describe, it, expect } from 'vitest';
import { yieldOf, fpPairKey, anchorsByVerb, roundRobin, ladderNoWrap } from '../grow/lib.mjs';

describe('🌱 GROW3 · תשואה וזוגות שכבר נוסו', () => {
  it('עוגן שנותן רק כפולים יורד; עוגן שעוד לא נוסה = ½', () => {
    expect(yieldOf(undefined)).toBe(0.5);
    expect(yieldOf({ built: 20, fresh: 0 })).toBeLessThan(0.05);
    expect(yieldOf({ built: 20, fresh: 18 })).toBeGreaterThan(0.85);
  });
  it('אותה צורה + אותן טביעות = אותו מפתח גם כשהדבר הוחלף בתאום זול (מזהה אחר)', () => {
    const A = { id: 'a1', fp: 'F1' }; const A2 = { id: 'a2', fp: 'F1' }; const B = { id: 'b', fp: 'F2' };
    expect(fpPairKey('chain', A, B)).toBe(fpPairKey('chain', A2, B));
    expect(fpPairKey('chain', A, B)).not.toBe(fpPairKey('chain', B, A));
    expect(fpPairKey('pair', A, B)).not.toBe(fpPairKey('chain', A, B));
    expect(fpPairKey('map', A, null)).toBe('map(F1)');
  });
});

describe('🌱 GROW3 · עוגנים לפי פועל', () => {
  const T = (id: string, idx: number, vs: Record<string, number>, st?: any) => ({ id, idx, vs, st });
  it('כל פועל מקבל עוגנים — גם כשפועל אחר קרוב יותר לייחוס (משווה לא נבלע ע״י ממיין)', () => {
    const cands = [...Array(30)].map((_, k) => T('s' + k, k, { sort: 0.9 + k / 1000 })).concat([T('c1', 40, { compare: 0.45 }), T('c2', 41, { compare: 2 })]);
    const a = anchorsByVerb(cands, { perVerb: 3, min: 0.4 });
    expect(a.filter((x: any) => x.verb === 'compare').map((x: any) => x.t.id)).toEqual(['c2', 'c1']);
    expect(a.filter((x: any) => x.verb === 'sort').length).toBe(3);
  });
  it('תשואה נמוכה מורידה עוגן — הבא בתור נכנס; דבר אחד לא נבחר לשני פעלים', () => {
    const cands = [T('x', 0, { sort: 1, dedupe: 1 }, { built: 40, fresh: 0 }), T('y', 1, { sort: 0.8 }), T('z', 2, { dedupe: 0.7 })];
    const a = anchorsByVerb(cands, { perVerb: 1, min: 0.4 });
    expect(a.map((x: any) => x.verb + ':' + x.t.id)).toEqual(['dedupe:z', 'sort:y']);
    expect(JSON.stringify(anchorsByVerb(cands, { perVerb: 1, min: 0.4 }))).toBe(JSON.stringify(a));
  });
  it('סבב-סבבים: כל עוגן מקבל תור, מחולל שנגמר יוצא', () => {
    const gen = (name: string, n: number) => { let k = 0; return () => (k < n ? name + k++ : null); };
    const out = roundRobin([{ eff: 2, next: gen('a', 100) }, { eff: 0.5, next: gen('b', 100) }, { eff: 2, next: gen('c', 2) }], 20);
    expect(out.length).toBe(20);
    expect(out.slice(0, 4)).toEqual(['a0', 'a1', 'a2', 'a3']);
    expect(out.filter((x: string) => x[0] === 'c')).toEqual(['c0', 'c1']);
    expect(out.filter((x: string) => x[0] === 'b').length).toBeGreaterThan(1);
  });
});

describe('🔴 GROW3 · הסולם בלי עטיפות', () => {
  it('"מסיר כפולים" מעל "מסיר כפולים" מעל "מסיר כפולים" = קומה אחת; פועל חדש מעל = עוד קומה', () => {
    const by = new Map<string, any>();
    const mk = (id: string, verbs: string[], of: string[]) => { const t = { id, verbs, of }; by.set(id, t); return t; };
    mk('d0', ['dedupe'], []); mk('d1', ['dedupe'], ['d0']); const d2 = mk('d2', ['dedupe'], ['d1']);
    const s = mk('s', ['sort', 'dedupe'], ['d2']); const c = mk('c', ['count'], ['s', 'x']); mk('x', [], []);
    const v = (t: any) => (t ? t.verbs : []); const ch = (t: any) => t.of.map((id: string) => by.get(id));
    expect(ladderNoWrap(d2, v, ch)).toBe(1);
    expect(ladderNoWrap(s, v, ch)).toBe(2);
    expect(ladderNoWrap(c, v, ch)).toBe(3);
  });
});

describe('🌱 GROW3 · שותף שנותן רק כפולים', () => {
  it('אחרי 3 כפולים בלי חדש — מתחת לסף (0.2) ויוצא מהסדר', () => {
    expect(yieldOf({ built: 3, fresh: 0 })).toBe(0.2);
    expect(yieldOf({ built: 4, fresh: 0 })).toBeLessThan(0.2);
    expect(yieldOf({ built: 4, fresh: 1 })).toBeGreaterThan(0.2);
  });
});
