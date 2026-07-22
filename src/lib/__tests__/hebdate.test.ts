import { describe, it, expect } from 'vitest';
import { hebMonthsOf, hebToIso, hebYearNow, isHebLeapYear, isoToHebParts } from '../hebdate';

// 5786 שנה פשוטה (כסדרה, 354 ימים — חשוון בן 29) · 5787 שנה מעוברת.

describe('round-trip iso → parts → iso', () => {
  it('round-trips several dates across the year', () => {
    for (const iso of ['2025-09-23', '2025-12-15', '2026-04-02', '2026-08-06']) {
      const p = isoToHebParts(iso);
      expect(p).not.toBeNull();
      expect(hebToIso(p!.day, p!.monthHe, p!.year)).toBe(iso);
    }
  });

  it('Rosh Hashana: 1 Tishri 5786 = 2025-09-23', () => {
    expect(isoToHebParts('2025-09-23')).toEqual({ day: 1, monthHe: 'תשרי', year: 5786 });
    expect(hebToIso(1, 'תשרי', 5786)).toBe('2025-09-23');
  });

  it('echo example: 23 Av 5786 = 2026-08-06', () => {
    expect(isoToHebParts('2026-08-06')).toEqual({ day: 23, monthHe: 'אב', year: 5786 });
    expect(hebToIso(23, 'אב', 5786)).toBe('2026-08-06');
  });
});

describe('leap years (עיבור)', () => {
  it('5787 is leap: 13 months incl. אדר א׳ + אדר ב׳, no plain אדר', () => {
    expect(isHebLeapYear(5787)).toBe(true);
    const months = hebMonthsOf(5787);
    expect(months).toHaveLength(13);
    expect(months).toContain('אדר א׳');
    expect(months).toContain('אדר ב׳');
    expect(months).not.toContain('אדר');
  });

  it('5786 is non-leap: 12 months with plain אדר', () => {
    expect(isHebLeapYear(5786)).toBe(false);
    const months = hebMonthsOf(5786);
    expect(months).toHaveLength(12);
    expect(months).toContain('אדר');
    expect(months).not.toContain('אדר א׳');
    expect(months).not.toContain('אדר ב׳');
  });

  it('Adar dates: leap 5787 resolves via אדר ב׳ and round-trips; plain אדר only in 5786', () => {
    const purim = hebToIso(14, 'אדר ב׳', 5787);
    expect(purim).not.toBeNull();
    expect(isoToHebParts(purim!)).toEqual({ day: 14, monthHe: 'אדר ב׳', year: 5787 });
    const adarA = hebToIso(14, 'אדר א׳', 5787);
    expect(adarA).not.toBeNull();
    expect(adarA! < purim!).toBe(true);
    // בשנה מעוברת אין 'אדר' סתם, ובשנה פשוטה אין אדר א׳/ב׳
    expect(hebToIso(14, 'אדר', 5787)).toBeNull();
    expect(hebToIso(14, 'אדר א׳', 5786)).toBeNull();
    expect(hebToIso(14, 'אדר', 5786)).not.toBeNull();
  });
});

describe('invalid combos return null', () => {
  it('ל׳ חשוון does not exist in 5786 (Heshvan is short)', () => {
    expect(hebToIso(30, 'חשוון', 5786)).toBeNull();
    expect(hebToIso(29, 'חשוון', 5786)).not.toBeNull();
  });

  it('rejects out-of-range day and unknown month', () => {
    expect(hebToIso(31, 'תשרי', 5786)).toBeNull();
    expect(hebToIso(0, 'תשרי', 5786)).toBeNull();
    expect(hebToIso(1.5, 'תשרי', 5786)).toBeNull();
    expect(hebToIso(10, 'לא-חודש', 5786)).toBeNull();
  });

  it('isoToHebParts rejects malformed input', () => {
    expect(isoToHebParts('')).toBeNull();
    expect(isoToHebParts('06/08/2026')).toBeNull();
    expect(isoToHebParts('2026-13-45')).toBeNull();
  });
});

describe('hebYearNow', () => {
  it('agrees with isoToHebParts of today', () => {
    const t = new Date();
    const iso =
      t.getFullYear() +
      '-' +
      String(t.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(t.getDate()).padStart(2, '0');
    expect(hebYearNow()).toBe(isoToHebParts(iso)!.year);
  });
});
