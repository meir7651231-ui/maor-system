/** רצ'ט — סכום בשקלים במילים (קבלת סעיף 46). ערכים נפוצים חייבים להיות תקינים. */
import { describe, expect, it } from 'vitest';
import { integerInWords, amountInWords } from '../hebrewNumber';

describe('integerInWords', () => {
  const cases: [number, string][] = [
    [0, 'אפס'],
    [1, 'אחד'],
    [5, 'חמישה'],
    [10, 'עשרה'],
    [11, 'אחד עשר'],
    [15, 'חמישה עשר'],
    [18, 'שמונה עשר'],
    [20, 'עשרים'],
    [21, 'עשרים ואחד'],
    [100, 'מאה'],
    [105, 'מאה וחמישה'],
    [120, 'מאה ועשרים'],
    [123, 'מאה עשרים ושלושה'],
    [200, 'מאתיים'],
    [250, 'מאתיים וחמישים'],
    [360, 'שלוש מאות ושישים'],
    [1000, 'אלף'],
    [1800, 'אלף ושמונה מאות'],
    [2000, 'אלפיים'],
    [3600, 'שלושת אלפים ושש מאות'],
    [5000, 'חמשת אלפים'],
    [10000, 'עשרת אלפים'],
  ];
  for (const [n, expected] of cases) {
    it(`${n} → ${expected}`, () => expect(integerInWords(n)).toBe(expected));
  }
  it('מחוץ לטווח → null', () => {
    expect(integerInWords(-5)).toBeNull();
    expect(integerInWords(1.5)).toBeNull();
    expect(integerInWords(1e12)).toBeNull();
  });
});

describe('amountInWords (₪)', () => {
  it('שקל בודד', () => expect(amountInWords(1)).toBe('שקל אחד'));
  it('רבים', () => expect(amountInWords(18)).toBe('שמונה עשר שקלים'));
  it('מאות', () => expect(amountInWords(250)).toBe('מאתיים וחמישים שקלים'));
  it('אלפים', () => expect(amountInWords(1800)).toBe('אלף ושמונה מאות שקלים'));
  it('אגורות', () => expect(amountInWords(18.5)).toBe('שמונה עשר שקלים ו-חמישים אגורות'));
  it('שקל אחד + אגורות', () => expect(amountInWords(1.25)).toBe('שקל אחד ו-עשרים וחמישה אגורות'));
  it('דולר', () => expect(amountInWords(5, '$')).toBe('חמישה דולרים'));
  it('אפס', () => expect(amountInWords(0)).toBe('אפס שקלים'));
});
