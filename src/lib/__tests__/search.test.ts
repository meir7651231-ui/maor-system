import { describe, it, expect } from 'vitest';
import { XLAT, levenshtein, scoreTerm, expandQuery, smartScore, smartFilter } from '../search';

describe('XLAT + expandQuery', () => {
  it('maps Hebrew keys to aliases', () => {
    expect(XLAT['כהן']).toContain('cohen');
    expect(XLAT['דוד']).toContain('david');
  });

  it("expands an English alias to its Hebrew key ('cohen' finds כהן)", () => {
    const ex = expandQuery('cohen');
    expect(ex).toContain('cohen'); // השאילתה עצמה תמיד נשמרת
    expect(ex).toContain('כהן');
  });

  it('expands a Hebrew key to its aliases', () => {
    const ex = expandQuery('כהן');
    expect(ex).toContain('cohen');
    expect(ex).toContain('kohen');
  });

  it('matches through normalization (final letters)', () => {
    // "כהנ" (ן→נ אחרי נרמול) עדיין פוגש את המפתח "כהן"
    expect(expandQuery('כהן')).toContain('коэн');
  });

  it('returns unique values and just the query when nothing matches', () => {
    expect(expandQuery('xyzzy')).toEqual(['xyzzy']);
  });
});

describe('levenshtein', () => {
  it('handles basic cases', () => {
    expect(levenshtein('', '')).toBe(0);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
    expect(levenshtein('abc', 'abc')).toBe(0);
    expect(levenshtein('abc', 'abd')).toBe(1);
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('כהאן', 'כהן')).toBe(1);
  });
});

describe('scoreTerm', () => {
  it('orders exact > prefix > substring', () => {
    const exact = scoreTerm('דוד', 'דוד');
    const prefix = scoreTerm('דו', 'דוד');
    const sub = scoreTerm('וד', 'דוד');
    expect(exact).toBe(100);
    expect(prefix).toBe(80);
    expect(sub).toBe(62);
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(sub);
  });

  it('strips plural suffix (ים/ות)', () => {
    expect(scoreTerm('חוגים', 'חוג')).toBe(70);
    expect(scoreTerm('קבלות', 'קבלה')).toBe(70);
  });

  it('matches after vowel stripping (י/ו)', () => {
    expect(scoreTerm('דויד', 'דוד')).toBe(58);
  });

  it('tolerates a single typo via levenshtein', () => {
    expect(scoreTerm('כהאן', 'כהן')).toBe(45);
  });

  it('returns 0 for no match or empty input', () => {
    expect(scoreTerm('כהן', 'לוי')).toBe(0);
    expect(scoreTerm('', 'לוי')).toBe(0);
    expect(scoreTerm('כהן', '')).toBe(0);
  });
});

describe('smartScore', () => {
  it('scores via XLAT expansion', () => {
    expect(smartScore('cohen', ['כהן'])).toBe(100);
  });

  it('multi-token queries are AND — all tokens must match', () => {
    expect(smartScore('דוד כהן', ['דוד', 'כהן'])).toBe(200); // סכום המיטב לכל מילה
    expect(smartScore('דוד גולן', ['דוד', 'כהן'])).toBe(0);
  });

  it('returns 0 for an empty query', () => {
    expect(smartScore('', ['כהן'])).toBe(0);
  });
});

describe('smartFilter', () => {
  const names = ['כהן', 'לוי', 'מזרחי'];

  it("typo tolerance: 'כהאן' matches 'כהן' (score 45)", () => {
    expect(smartFilter('כהאן', names, (n) => [n])).toEqual(['כהן']);
    expect(smartScore('כהאן', ['כהן'])).toBe(45);
  });

  it('sorts by score descending and respects limit', () => {
    const items = [
      { name: 'אוחיון', id: 1 },
      { name: 'כהן', id: 2 },
      { name: 'כהנא', id: 3 },
    ];
    const res = smartFilter('כהן', items, (t) => [t.name]);
    expect(res[0].id).toBe(2); // התאמה מדויקת ראשונה
    expect(res.map((r) => r.id)).not.toContain(1);
    expect(smartFilter('כהן', items, (t) => [t.name], 1)).toHaveLength(1);
  });

  it('empty query returns items as-is (up to limit)', () => {
    expect(smartFilter('', names, (n) => [n])).toEqual(names);
    expect(smartFilter('', names, (n) => [n], 2)).toEqual(['כהן', 'לוי']);
  });
});
