import { describe, it, expect } from 'vitest';
import { gem, gemYear } from '../hebrew';

describe('gem', () => {
  it('renders 15 as ט״ו (not י״ה)', () => {
    expect(gem(15)).toBe('ט״ו');
  });

  it('renders 16 as ט״ז (not י״ו)', () => {
    expect(gem(16)).toBe('ט״ז');
  });

  it('renders single-letter values with geresh', () => {
    expect(gem(5)).toBe('ה׳');
    expect(gem(10)).toBe('י׳');
  });

  it('renders multi-letter values with gershayim before last letter', () => {
    expect(gem(18)).toBe('י״ח');
    expect(gem(786)).toBe('תשפ״ו');
  });

  it('returns empty string for 0 / NaN', () => {
    expect(gem(0)).toBe('');
    expect(gem(NaN)).toBe('');
  });

  it('קלט שלילי → ריק (לא "undefined" מאינדקס שלילי)', () => {
    expect(gem(-5)).toBe('');
    expect(gem(-100)).toBe('');
    expect(gem(-5)).not.toContain('undefined');
  });

  it('קלט לא-שלם → מעוגל כלפי מטה, בלי "undefined"', () => {
    expect(gem(15.9)).toBe('ט״ו'); // floor(15.9)=15
    expect(gem(5.5)).toBe('ה׳');
    expect(gem(15.9)).not.toContain('undefined');
  });

  it('אינסוף → ריק', () => {
    expect(gem(Infinity)).toBe('');
    expect(gem(-Infinity)).toBe('');
  });
});

describe('gemYear', () => {
  it('renders Hebrew year 5786 as תשפ״ו (mod 1000)', () => {
    expect(gemYear(5786)).toBe('תשפ״ו');
  });

  it('accepts string input', () => {
    expect(gemYear('5786')).toBe('תשפ״ו');
  });
});
