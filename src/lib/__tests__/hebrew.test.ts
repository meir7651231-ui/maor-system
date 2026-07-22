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
});

describe('gemYear', () => {
  it('renders Hebrew year 5786 as תשפ״ו (mod 1000)', () => {
    expect(gemYear(5786)).toBe('תשפ״ו');
  });

  it('accepts string input', () => {
    expect(gemYear('5786')).toBe('תשפ״ו');
  });
});
