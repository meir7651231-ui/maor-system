import { describe, it, expect } from 'vitest';
import { validIsraeliId, normSearch } from '../validate';

describe('validIsraeliId', () => {
  it('accepts a valid ID with correct check digit (000000018)', () => {
    expect(validIsraeliId('000000018')).toBe(true);
  });

  it('rejects an ID with a wrong check digit (000000019)', () => {
    expect(validIsraeliId('000000019')).toBe(false);
  });

  it('rejects non-digit input', () => {
    expect(validIsraeliId('abcdefghi')).toBe(false);
    expect(validIsraeliId('12345678a')).toBe(false);
    expect(validIsraeliId('')).toBe(false);
  });

  it('pads short IDs (5-8 digits) before validating', () => {
    // '18' is too short (min 5 digits) but '00018' pads to 000000018 → valid
    expect(validIsraeliId('18')).toBe(false);
    expect(validIsraeliId('00018')).toBe(true);
  });
});

describe('normSearch', () => {
  it('maps final letters to regular forms', () => {
    expect(normSearch('אברהם')).toBe('אברהמ');
    expect(normSearch('כהן')).toBe('כהנ');
    expect(normSearch('יוסף')).toBe('יוספ');
    expect(normSearch('ארץ')).toBe('ארצ');
    expect(normSearch('דרך')).toBe('דרכ');
  });

  it('strips niqqud and cantillation marks', () => {
    // שָׁלוֹם with qamats, shin-dot, holam → normalized + final-mem folded
    expect(normSearch('שָׁלוֹם')).toBe('שלומ');
    expect(normSearch('בְּרֵאשִׁית')).toBe('בראשית');
  });

  it('strips geresh/gershayim/quotes/dashes and lowercases', () => {
    expect(normSearch('ת"ז')).toBe('תז');
    expect(normSearch('צה״ל')).toBe('צהל');
    expect(normSearch('Bar-Ilan')).toBe('barilan');
  });

  it('handles empty / nullish input safely', () => {
    expect(normSearch('')).toBe('');
    expect(normSearch('   ')).toBe('');
  });
});
