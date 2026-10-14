/**
 * 🧭 סוג לפי צורה (MACHINE-V3, 14.10.2026) — ratchet למיפוי המשותף (catalog/lib/kind-shape.mjs).
 * באגים שנתפסו בדרך ונעולים כאן:
 *   · "sensitiveTopic" זוהה כתמונה — "pic" בסוף שם שאינו תמונה (Topic). שם-תמונה = מילה שלמה או סיומת camelCase.
 *   · חלון-שעות {dow, f, t} זוהה כצליל — {f, t} (מ-עד) אינו צליל; צליל = תדר מפורש, או {f, d, g} כמו tone().
 *   · כל Enrollment בודד הפך ל"מחכה" ושבר התאמות של רשומות — רק **רשימה** עם סטטוס-המתנה היא תור.
 */
import { describe, it, expect } from 'vitest';
import { shapeKindOfDesc, shapeKindOfType, shapeKindOfValue, descOfTypeText, materialDesc } from '../lib/kind-shape.mjs';
import { kindOfDesc } from '../lib/entry.mjs';
import { fit, fitPart, lawMat } from '../combiner/core.mjs';
import '../combiner/load.mjs'; // האלפבית (catalog/verbs.json) — lawMat קורא את הפעלים

const num = { t: 'num' };
const obj = (p: [string, object][], n?: string) => ({ t: 'obj', ...(n ? { n } : {}), p: p.map(([k, d]) => [k, d, false]) });

describe('סוג לפי צורה — desc', () => {
  it('נקודה, נקודה תלת-ממדית, lat/lon, מסלול', () => {
    expect(shapeKindOfDesc(obj([['x', num], ['y', num]]))).toBe('geo');
    expect(shapeKindOfDesc(obj([['x', num], ['y', num], ['z', num]]))).toBe('geo');
    expect(shapeKindOfDesc(obj([['lat', num], ['lng', num]]))).toBe('geo');
    expect(shapeKindOfDesc({ t: 'arr', of: obj([['x', num], ['y', num]]) })).toBe('geo');
    expect(shapeKindOfDesc({ t: 'tup', of: [num, num] }, 'point')).toBe('geo');
    expect(shapeKindOfDesc({ t: 'tup', of: [num, num] }, 'range')).toBe(null);
  });
  it('רשומה גדולה עם x,y אינה נקודה', () => {
    expect(shapeKindOfDesc(obj([['x', num], ['y', num], ['a', num], ['b', num], ['c', num], ['d', num], ['e', num]]))).toBe(null);
  });
  it('צליל: תדר מפורש או {f,d,g}; {f,t} לבד — לא', () => {
    expect(shapeKindOfDesc(obj([['freq', num], ['dur', num]]))).toBe('sound');
    expect(shapeKindOfDesc(obj([['f', num], ['t', num], ['d', num], ['g', num]]))).toBe('sound');
    expect(shapeKindOfDesc(obj([['dow', num], ['f', num], ['t', num]]))).toBe(null);
  });
  it('תמונה: {width,height} · שם-תמונה; "sensitiveTopic" — לא', () => {
    expect(shapeKindOfDesc(obj([['width', num], ['height', num]]))).toBe('image');
    expect(shapeKindOfDesc({ t: 'str' }, 'photoDataUrl')).toBe('image');
    expect(shapeKindOfDesc({ t: 'str' }, 'sensitiveTopic')).toBe(null);
  });
  it('תור = רשימה עם סטטוס-המתנה; פריט בודד נשאר רשומה', () => {
    const enr = obj([['id', { t: 'str' }], ['status', { t: 'lit', v: ['active', 'paused', 'ended', 'wait'] }]], 'Enrollment');
    expect(shapeKindOfDesc({ t: 'arr', of: enr })).toBe('waiting');
    expect(shapeKindOfDesc(enr)).toBe(null);
    expect(kindOfDesc(enr, 'e')).toBe('record:enrollment');
    expect(kindOfDesc({ t: 'arr', of: enr }, 'es')).toBe('waiting');
  });
});

describe('סוג לפי צורה — טקסט-טיפוס וערך', () => {
  it('טקסט-טיפוס של TS', () => {
    expect(shapeKindOfType('{ x: number; y: number; z: number }', 'p')).toBe('geo');
    expect(shapeKindOfType('{ x: number; y: number }[]', 'pts')).toBe('geo');
    expect(shapeKindOfType("{ id: string; status: 'pending' | 'approved' }[]", 'xs')).toBe('waiting');
    expect(shapeKindOfType('string', 'text')).toBe(null);
    expect(descOfTypeText('Array<{ a: number }>')).toEqual({ t: 'arr', of: { t: 'obj', p: [['a', { t: 'num' }, false]] } });
  });
  it('ערך-ריצה', () => {
    expect(shapeKindOfValue({ x: 1, y: 2 })).toBe('geo');
    expect(shapeKindOfValue([[1, 2], [3, 4]])).toBe('geo');
    expect(shapeKindOfValue('data:image/gif;base64,AAAA')).toBe('image');
    expect(shapeKindOfValue([{ f: 440, t: 0, d: 200, g: 50 }])).toBe('sound');
    expect(shapeKindOfValue([{ id: 'a', status: 'wait' }, { id: 'b', status: 'active' }])).toBe('waiting');
    expect(shapeKindOfValue({ id: 'a', status: 'wait' })).toBe(null);
  });
  it('הקלט המחולל של כל חומר מזוהה בעצמו כאותו חומר (סגירות)', () => {
    expect(shapeKindOfDesc(materialDesc('geo', false))).toBe('geo');
    expect(shapeKindOfDesc(materialDesc('geo', true))).toBe('geo');
    expect(shapeKindOfDesc(materialDesc('sound', true))).toBe('sound');
    expect(shapeKindOfDesc(materialDesc('image', false))).toBe('image');
    expect(shapeKindOfDesc(materialDesc('waiting', false))).toBe('waiting');
  });
});

describe('התאמה במצרף', () => {
  it('תור⊂רשימה ומנגינה⊂רצף — רק בצד החלק', () => {
    expect(fitPart('waiting', 'list')).toBeGreaterThan(0);
    expect(fitPart('sound', 'sequence')).toBeGreaterThan(0);
    expect(fitPart('list', 'waiting')).toBe(0);
    expect(fitPart('list', 'sound')).toBe(0);
    expect(fit('geo', 'list')).toBe(0);
  });
  it('רשומה מסוג ידוע היא רשומה — רק לפועל שמקבל רשומה כקלט-ראשי (לא מפרט של פועל-תנועה)', () => {
    expect(lawMat('assign-role', 'record:ant')).toBe(true);
    expect(lawMat('decay', 'record:ant')).toBe(false);
  });
});
